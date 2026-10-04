import type { DefinicjeGry, StanGry } from "@zwiedzanie/schemat-tresci";
import { przygotujKontekstNarracji } from "@zwiedzanie/silnik-gry";
import {
  kontynuujNarracje,
  MostNarracji,
  type SesjaNarracji,
  utworzSesjeNarracji,
  wybierzOpcjeNarracji,
} from "@zwiedzanie/silnik-narracji";
import type { przejdzDroge } from "./sciezki-slice.ts";

function kontekstMostu(stan: StanGry, definicje?: DefinicjeGry) {
  const kontekst = przygotujKontekstNarracji(stan);
  return {
    ...kontekst,
    flagi: {
      ...kontekst.flagi,
      ...Object.fromEntries(
        (definicje?.kampania?.powiazaniaNarracji ?? [])
          .filter((powiazanie) => powiazanie.obszar === "flagi")
          .map((powiazanie) => [
            powiazanie.klucz,
            stan.flagi[powiazanie.klucz] ?? false,
          ]),
      ),
      wybrano_dowod: stan.dokonaneWybory.includes("prolog_dowod"),
      wybrano_pamiec: stan.dokonaneWybory.includes("prolog_pamiec"),
      otwarto_notatke: stan.flagi.otwarto_notatke ?? false,
      final_kronikarz: stan.flagi.final_kronikarz ?? false,
      final_straznik: stan.flagi.final_straznik ?? false,
      odkryto_dwie_warstwy:
        stan.wynikiZagadek.zagadka_hansken?.wynik ===
          "ROZWIAZANA_SAMODZIELNIE" &&
        stan.odkryteScenki.includes("scenka_dwie_notatki") &&
        stan.sladyIPrzedmioty.includes("fragment_kroniki_hansken"),
    },
    wynikiZagadek: {
      ...kontekst.wynikiZagadek,
      ...Object.fromEntries(
        (definicje?.kampania?.powiazaniaNarracji ?? [])
          .filter((powiazanie) => powiazanie.obszar === "wynikiZagadek")
          .map((powiazanie) => [
            powiazanie.klucz,
            stan.wynikiZagadek[powiazanie.klucz]?.wynik ?? "",
          ]),
      ),
      zagadka_hansken: stan.wynikiZagadek.zagadka_hansken?.wynik ?? "",
    },
  };
}

function czytaj(sesja: SesjaNarracji) {
  const akapity: string[] = [];
  for (let krok = 0; krok < 200; krok++) {
    const ramka = kontynuujNarracje(sesja);
    akapity.push(...ramka.akapity);
    if (!ramka.moznaKontynuowac) return { ...ramka, akapity };
  }
  throw new Error("Narracja nie zatrzymala sie w limicie.");
}

export function sprawdzNarracje(
  narracja: string,
  droga: ReturnType<typeof przejdzDroge>,
  definicje?: DefinicjeGry,
) {
  const poczatek = droga.kroki[0];
  if (!poczatek) throw new Error("Brak startu drogi.");
  const most = new MostNarracji(kontekstMostu(poczatek.stan, definicje), [
    ...(definicje?.kampania?.powiazaniaNarracji ?? []),
    ...[
      "wybrano_dowod",
      "wybrano_pamiec",
      "otwarto_notatke",
      "final_kronikarz",
      "final_straznik",
      "odkryto_dwie_warstwy",
    ].map((id) => ({ zmiennaInk: id, obszar: "flagi" as const, klucz: id })),
    {
      zmiennaInk: "hansken_wynik",
      obszar: "wynikiZagadek",
      klucz: "zagadka_hansken",
    },
    {
      zmiennaInk: "ma_fragment",
      obszar: "sladyIPrzedmioty",
      klucz: "fragment_kroniki_hansken",
    },
  ]);
  const sesja = utworzSesjeNarracji(narracja, most);
  const teksty: string[] = [];
  for (let indeks = 1; indeks < droga.kroki.length; indeks++) {
    const krok = droga.kroki[indeks];
    const poprzedni = droga.kroki[indeks - 1];
    if (!krok || !poprzedni) throw new Error("Niepelna droga.");
    most.aktualizujKontekst(kontekstMostu(poprzedni.stan, definicje));
    if (krok.zdarzenie.rodzaj !== "DOKONAJ_WYBORU") continue;
    const ramka = czytaj(sesja);
    teksty.push(...ramka.akapity);
    const id = krok.zdarzenie.idWyboru;
    const opcja = ramka.opcje.find((opcja) =>
      most.odczytajSygnaly(opcja.tagi).includes(id),
    );
    if (!opcja)
      throw new Error(
        `Brak opcji Ink odpowiadajacej legalnemu wyborowi: ${id}.`,
      );
    wybierzOpcjeNarracji(sesja, opcja.indeks);
  }
  most.aktualizujKontekst(kontekstMostu(droga.stan, definicje));
  const koniec = czytaj(sesja);
  teksty.push(...koniec.akapity);
  if (koniec.opcje.length) throw new Error("Narracja nie dotarla do konca.");
  if (
    definicje?.kampania &&
    droga.stan.aktualnaScena === definicje.kampania.scenaFinalu
  )
    return teksty.join("\n");
  const nazwa = {
    kronikarz: "KRONIKARZ.",
    straznik_opowiesci: "STRAŻNIK OPOWIEŚCI.",
    lacznik: "ŁĄCZNIK.",
  }[droga.profil.zakonczenieGlowne];
  if (!nazwa || !koniec.akapity.some((tekst) => tekst.includes(nazwa)))
    throw new Error("Profil mechaniki nie zgadza sie z mini-finalem Ink.");
  return teksty.join("\n");
}
