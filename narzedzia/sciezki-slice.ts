import type {
  DefinicjeGry,
  StanGry,
  WynikZagadki,
  ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
import { schematWynikuZagadki } from "@zwiedzanie/schemat-tresci";
import {
  ocenWarunek,
  wykonajKrok,
  wyznaczProfilZakonczenia,
} from "@zwiedzanie/silnik-gry";
import { sprawdzNarracje } from "./narracja-slice.ts";

export interface DrogaSlice {
  prolog: "prolog_dowod" | "prolog_pamiec" | "prolog_obie";
  hansken: WynikZagadki;
  notatka: boolean;
  scenka: boolean;
  kosciol: "zapis" | "opowiesc";
  baszta: WynikZagadki;
  final: "baszta_fakt" | "baszta_legenda" | "baszta_obie";
}
type DaneZdarzenia = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "idZdarzenia" | "czas">
    : never
  : never;

export function przejdzDroge(definicje: DefinicjeGry, droga: DrogaSlice) {
  let stan: StanGry = wykonajKrok(definicje, null, {
    rodzaj: "ROZPOCZNIJ_GRE",
    idSesji: "slice",
    idZdarzenia: "start",
    czas: 0,
  }).stan;
  const kroki = [{ stan, zdarzenie: stan.dziennikZdarzen[0] as ZdarzenieGry }];
  const wykonaj = (dane: DaneZdarzenia) => {
    const zdarzenie = {
      ...dane,
      idZdarzenia: `krok_${kroki.length}`,
      czas: kroki.length,
    } as ZdarzenieGry;
    stan = wykonajKrok(definicje, stan, zdarzenie).stan;
    kroki.push({ stan, zdarzenie });
  };
  const wybierz = (idWyboru: string) =>
    wykonaj({ rodzaj: "DOKONAJ_WYBORU", idWyboru });
  const zagadka = (idZagadki: string, wynik: WynikZagadki) => {
    if (wynik === "POMINIETA") {
      wykonaj({ rodzaj: "POMIN_ZAGADKE", idZagadki });
      return;
    }
    wykonaj({ rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki });
    if (wynik === "ROZWIAZANA_Z_PODPOWIEDZIA")
      wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki });
    if (wynik === "ROZWIAZANA_Z_POMOCA")
      wykonaj({ rodzaj: "POTRZEBUJE_POMOCY", idZagadki });
    if (wynik === "NIEUDANA" || wynik === "ROZWIAZANA_Z_POMOCA")
      wykonaj({ rodzaj: "ZAKONCZ_ZAGADKE", idZagadki, wynik });
    else {
      const definicja = definicje.zagadki.find(
        (element) => element.id === idZagadki,
      );
      if (!definicja) throw new Error("Brak zagadki.");
      if (definicja.typ === "OBSERWACJA")
        wykonaj({ rodzaj: "POTWIERDZ_OBSERWACJE", idZagadki });
      else
        wykonaj({
          rodzaj: "UDZIEL_ODPOWIEDZI",
          idZagadki,
          odpowiedz: definicja.poprawneOdpowiedzi[0] ?? "",
        });
    }
  };
  wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "rynek" });
  for (const idWatku of ["watek_kroniki", "watek_pamieci"])
    wykonaj({ rodzaj: "AKTYWUJ_WATEK", idWatku });
  wybierz(droga.prolog);
  wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "hansken" });
  zagadka("zagadka_hansken", droga.hansken);
  wybierz(droga.notatka ? "hansken_zapis" : "hansken_slucham");
  wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "kosciol" });
  const scenka = definicje.scenki.find(
    (element) => element.id === "scenka_dwie_notatki",
  );
  if (!scenka) throw new Error("Brak scenki slice.");
  const dostepnaScenka = ocenWarunek(scenka.warunek, stan);
  if (droga.scenka) {
    if (!dostepnaScenka)
      throw new Error("Scenka nie jest dostepna na tej drodze.");
    wybierz("kosciol_do_scenki");
    wykonaj({ rodzaj: "OTWORZ_SCENKE", idScenki: scenka.id });
    wybierz("scenka_powrot");
  }
  wybierz(`kosciol_${droga.kosciol}${droga.scenka ? "_po_scence" : ""}`);
  wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "baszta" });
  zagadka("zagadka_baszta", droga.baszta);
  wybierz(droga.final);
  for (const idWatku of ["watek_kroniki", "watek_pamieci"])
    wykonaj({ rodzaj: "ZAKONCZ_WATEK", idWatku });
  if (stan.aktualnaScena !== "mini_final")
    throw new Error("Droga nie dotarla do mini-finalu.");
  const profil = wyznaczProfilZakonczenia(definicje, stan);
  return { stan, profil, kroki, dostepnaScenka };
}

export function sprawdzDrogi(definicje: DefinicjeGry, narracja?: string) {
  const profile = new Set<string>();
  let liczbaDrog = 0;
  for (const prolog of [
    "prolog_dowod",
    "prolog_pamiec",
    "prolog_obie",
  ] as const)
    for (const hansken of schematWynikuZagadki.options)
      for (const notatka of [false, true])
        for (const kosciol of ["zapis", "opowiesc"] as const)
          for (const baszta of schematWynikuZagadki.options)
            for (const final of [
              "baszta_fakt",
              "baszta_legenda",
              "baszta_obie",
            ] as const) {
              const droga = {
                prolog,
                hansken,
                notatka,
                kosciol,
                baszta,
                final,
                scenka: false,
              };
              const wynik = przejdzDroge(definicje, droga);
              if (narracja) sprawdzNarracje(narracja, wynik);
              profile.add(wynik.profil.zakonczenieGlowne);
              liczbaDrog++;
              if (wynik.dostepnaScenka) {
                const dodatkowy = przejdzDroge(definicje, {
                  ...droga,
                  scenka: true,
                });
                if (narracja) sprawdzNarracje(narracja, dodatkowy);
                profile.add(dodatkowy.profil.zakonczenieGlowne);
                liczbaDrog++;
              }
            }
  const glowne = definicje.zakonczenia.filter(
    (element) => element.rodzaj === "GLOWNE",
  );
  if (glowne.some((element) => !profile.has(element.id)))
    throw new Error("Nieosiagalny glowny profil zakonczenia.");
  return { liczbaDrog, profile: [...profile].sort() };
}
