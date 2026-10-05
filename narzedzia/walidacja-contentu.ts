import type { DefinicjeGry } from "@zwiedzanie/schemat-tresci";
import type { przejdzDroge } from "./sciezki-slice.ts";

export function analizujFlagi(definicje: DefinicjeGry) {
  const ustawiane = new Set<string>();
  const odczytywane = new Set<string>();
  function odwiedz(dane: unknown): void {
    if (!dane || typeof dane !== "object") return;
    if ("rodzaj" in dane && "id" in dane && typeof dane.id === "string") {
      if (dane.rodzaj === "USTAW_FLAGE") ustawiane.add(dane.id);
      if (dane.rodzaj === "flagaJest") odczytywane.add(dane.id);
    }
    Object.values(dane).forEach(odwiedz);
  }
  odwiedz(definicje);
  for (const powiazanie of definicje.kampania?.powiazaniaNarracji ?? [])
    if (powiazanie.obszar === "flagi" && !powiazanie.warunek)
      odczytywane.add(powiazanie.klucz);
  return {
    ustawiane: [...ustawiane].sort(),
    odczytywane: [...odczytywane].sort(),
    nigdyNieustawiane: [...odczytywane]
      .filter((id) => !ustawiane.has(id))
      .sort(),
    nigdyNieczytane: [...ustawiane].filter((id) => !odczytywane.has(id)).sort(),
  };
}

// Walidator skonczonego vertical slice; nie jest solverem dowolnej kampanii.
export function utworzKontroleGrafu(definicje: DefinicjeGry, sceny: string[]) {
  const osiagnieteSceny = new Set<string>();
  const lokalizacje = new Set<string>();
  const wybory = new Set<string>();
  const scenki = new Set<string>();
  const zakonczenia = new Set<string>();
  const watki = new Set<string>();
  const zagadki = new Set<string>();
  return {
    odwiedz(wynik: ReturnType<typeof przejdzDroge>) {
      for (const { stan } of wynik.kroki) {
        osiagnieteSceny.add(stan.aktualnaScena);
        stan.odwiedzoneLokalizacje.forEach((id) => {
          lokalizacje.add(id);
        });
        stan.dokonaneWybory.forEach((id) => {
          wybory.add(id);
        });
        stan.odkryteScenki.forEach((id) => {
          scenki.add(id);
        });
      }
      for (const id of [
        wynik.profil.zakonczenieGlowne,
        ...wynik.profil.wariantyZakonczenia,
        ...wynik.profil.epilogiWatkow,
        ...wynik.profil.specjalneOdkrycia,
        ...wynik.profil.konsekwencjeZagadek,
      ])
        zakonczenia.add(id);
      // Epilogi i odkrycia sa wyswietlane przez Ink, poza aktualnaScena.
      [
        ...wynik.profil.epilogiWatkow,
        ...wynik.profil.specjalneOdkrycia,
      ].forEach((id) => {
        osiagnieteSceny.add(id);
      });
      for (const [id, stan] of Object.entries(wynik.stan.watki))
        if (stan === "UKONCZONY") watki.add(id);
      Object.keys(wynik.stan.wynikiZagadek).forEach((id) => {
        zagadki.add(id);
      });
    },
    zakoncz() {
      const bledy: string[] = [];
      function sprawdz(
        nazwa: string,
        wymagane: string[],
        osiagniete: Set<string>,
      ) {
        for (const id of wymagane)
          if (!osiagniete.has(id)) bledy.push(`${nazwa}: ${id}`);
      }
      sprawdz("Nieosiagalna scena", sceny, osiagnieteSceny);
      sprawdz(
        "Nieosiagalna lokalizacja",
        definicje.lokalizacje.map((dane) => dane.id),
        lokalizacje,
      );
      sprawdz(
        "Nieosiagalny wybor",
        definicje.wybory.map((dane) => dane.id),
        wybory,
      );
      sprawdz(
        "Martwa scenka",
        definicje.scenki.map((dane) => dane.id),
        scenki,
      );
      sprawdz(
        "Zakonczenie bez drogi",
        definicje.zakonczenia.map((dane) => dane.id),
        zakonczenia,
      );
      sprawdz(
        "Wymagany watek bez ukonczenia",
        definicje.watki
          .filter((dane) => dane.wymaganyDoFinalu || !dane.opcjonalny)
          .map((dane) => dane.id),
        watki,
      );
      sprawdz(
        "Zagadka bez wyjscia do finalu",
        definicje.zagadki.map((dane) => dane.id),
        zagadki,
      );
      if (bledy.length) throw new Error(bledy.join("; "));
    },
  };
}
