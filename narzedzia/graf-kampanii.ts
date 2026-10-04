import type {
  DefinicjeGry,
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
import { przejdzDroge } from "./sciezki-slice.ts";

type Polecenie = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "czas" | "idZdarzenia">
    : never
  : never;
export interface DrogaKampanii {
  miejsca: string[];
  wyniki: WynikZagadki[];
  glosy?: boolean;
  splot?: boolean;
}
export function przejdzKampanie(definicje: DefinicjeGry, droga: DrogaKampanii) {
  const poczatek = przejdzDroge(definicje, {
    prolog: "prolog_obie",
    hansken: "POMINIETA",
    notatka: false,
    scenka: false,
    kosciol: "zapis",
    baszta: "POMINIETA",
    final: "baszta_obie",
  });
  let stan = poczatek.stan;
  const kroki = [...poczatek.kroki];
  const wykonaj = (polecenie: Polecenie) => {
    const zdarzenie = {
      ...polecenie,
      czas: kroki.length,
      idZdarzenia: `kampania_${kroki.length}`,
    } as ZdarzenieGry;
    stan = wykonajKrok(definicje, stan, zdarzenie).stan;
    kroki.push({ stan, zdarzenie });
  };
  const wybierz = (idWyboru: string) =>
    wykonaj({ rodzaj: "DOKONAJ_WYBORU", idWyboru });
  wybierz("rozpocznij_kampanie");
  droga.miejsca.forEach((id, indeks) => {
    wybierz(`cel_${id}`);
    wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: id });
    wykonaj({ rodzaj: "POTWIERDZ_OBECNOSC", idLokalizacji: id });
    const idZagadki = `teren_${id}`;
    wykonaj({ rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki });
    const wynik = droga.wyniki[indeks] ?? "ROZWIAZANA_SAMODZIELNIE";
    if (wynik === "POMINIETA") wykonaj({ rodzaj: "POMIN_ZAGADKE", idZagadki });
    else if (wynik === "NIEUDANA")
      wykonaj({ rodzaj: "ZAKONCZ_ZAGADKE", idZagadki, wynik });
    else {
      if (wynik === "ROZWIAZANA_Z_PODPOWIEDZIA")
        wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki });
      if (wynik === "ROZWIAZANA_Z_POMOCA")
        wykonaj({ rodzaj: "POTRZEBUJE_POMOCY", idZagadki });
      const zagadka = definicje.zagadki.find(
        (element) => element.id === idZagadki,
      );
      if (zagadka?.typ !== "TEKST")
        throw new Error("Brak terenowej zagadki tekstowej.");
      wykonaj({
        rodzaj: "UDZIEL_ODPOWIEDZI",
        idZagadki,
        odpowiedz: zagadka.poprawneOdpowiedzi[0] ?? "",
      });
    }
    wybierz(
      `${id === "hansken" && !droga.glosy ? "hansken_teren" : id}_${droga.glosy ? "glos" : "zapis"}`,
    );
  });
  const wyborSplotu = definicje.wybory.find(
    (wybor) => wybor.id === "cel_splot",
  );
  if (
    droga.splot &&
    wyborSplotu?.warunek &&
    ocenWarunek(wyborSplotu.warunek, stan)
  ) {
    wybierz("cel_splot");
    wybierz("splot_powrot");
  }
  wybierz("kampania_final");
  return { stan, kroki, profil: wyznaczProfilZakonczenia(definicje, stan) };
}

export function drogiKontrolne(): DrogaKampanii[] {
  const kolejnosci = [
    ["hansken", "ratusz", "mury", "palac"],
    ["mury", "palac", "ratusz", "hansken"],
    ["ratusz", "palac", "hansken", "mury"],
  ];
  const drogi: DrogaKampanii[] = [];
  for (const miejsca of kolejnosci)
    for (const glosy of [false, true]) {
      for (const wynik of schematWynikuZagadki.options)
        drogi.push({
          miejsca,
          wyniki: miejsca.map(() => wynik),
          glosy,
          splot: true,
        });
      for (let indeks = 0; indeks < miejsca.length; indeks++)
        for (const wynik of schematWynikuZagadki.options)
          drogi.push({
            miejsca,
            wyniki: miejsca.map((_, numer) =>
              numer === indeks ? wynik : "ROZWIAZANA_SAMODZIELNIE",
            ),
            glosy,
            splot: true,
          });
    }
  drogi.push(
    { miejsca: ["ratusz", "mury"], wyniki: [], splot: false },
    { miejsca: ["ratusz", "hansken", "palac"], wyniki: [], glosy: true },
    { miejsca: ["hansken"], wyniki: ["POMINIETA"] },
  );
  return drogi;
}

// Struktura O(V+E) oraz rzeczywiste swiadectwa warunkow; bez iloczynu wszystkich historii.
export function sprawdzGrafKampanii(
  definicje: DefinicjeGry,
  narracja?: string,
) {
  if (!definicje.kampania) throw new Error("Brak kampanii.");
  const krawedzie = new Map<string, Set<string>>();
  const odwrotne = new Map<string, Set<string>>();
  for (const wybor of definicje.wybory) {
    const cele = krawedzie.get(wybor.idSceny) ?? new Set<string>();
    cele.add(wybor.nastepnaScena);
    krawedzie.set(wybor.idSceny, cele);
    const poprzednie = odwrotne.get(wybor.nastepnaScena) ?? new Set<string>();
    poprzednie.add(wybor.idSceny);
    odwrotne.set(wybor.nastepnaScena, poprzednie);
  }
  const osiagalne = new Set([definicje.manifest.scenaStartowa]);
  const kolejka = [...osiagalne];
  for (const scena of kolejka)
    for (const cel of krawedzie.get(scena) ?? [])
      if (!osiagalne.has(cel)) {
        osiagalne.add(cel);
        kolejka.push(cel);
      }
  const wychodzace = new Set([definicje.kampania.scenaFinalu]);
  const powroty = [...wychodzace];
  for (const scena of powroty)
    for (const poprzednia of odwrotne.get(scena) ?? [])
      if (!wychodzace.has(poprzednia)) {
        wychodzace.add(poprzednia);
        powroty.push(poprzednia);
      }
  for (const miejsce of definicje.lokalizacje)
    if (!osiagalne.has(miejsce.idSceny) || !wychodzace.has(miejsce.idSceny))
      throw new Error(`Miejsce nieosiagalne lub bez wyjscia: ${miejsce.id}`);
  for (const miejsce of definicje.kampania.scenyMiejsc)
    if (!osiagalne.has(miejsce.idSceny) || !wychodzace.has(miejsce.idSceny))
      throw new Error(
        `Scena miejsca nieosiagalna lub bez wyjscia: ${miejsce.idSceny}`,
      );
  const wybory = new Set<string>();
  const zakonczenia = new Set<string>();
  const sceny = new Set<string>();
  const drogi = drogiKontrolne();
  for (const droga of drogi) {
    const wynik = przejdzKampanie(definicje, droga);
    if (narracja)
      sprawdzNarracje(narracja, { ...wynik, dostepnaScenka: false }, definicje);
    wynik.stan.dokonaneWybory.forEach((id) => {
      wybory.add(id);
    });
    wynik.kroki.forEach((krok) => {
      sceny.add(krok.stan.aktualnaScena);
    });
    zakonczenia.add(wynik.profil.zakonczenieGlowne);
    wynik.profil.epilogiWatkow.forEach((id) => {
      zakonczenia.add(id);
    });
  }
  for (const wybor of definicje.wybory.filter(
    (wybor) =>
      ![
        "prolog",
        "hansken",
        "kosciol",
        "kosciol_decyzja",
        "dwie_notatki",
        "baszta",
      ].includes(wybor.idSceny),
  ))
    if (!wybory.has(wybor.id))
      throw new Error(`Martwa galaz lub brak swiadectwa: ${wybor.id}`);
  for (const zakonczenie of definicje.zakonczenia.filter(
    (zakonczenie) =>
      zakonczenie.id === "epilog_pomocy" || zakonczenie.priorytet >= 100,
  ))
    if (!zakonczenia.has(zakonczenie.id))
      throw new Error(`Zakonczenie bez drogi: ${zakonczenie.id}`);
  return {
    liczbaSwiadectw: drogi.length,
    liczbaScen: sceny.size,
    zakonczenia: [...zakonczenia].sort(),
  };
}
