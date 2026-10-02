import type { DefinicjeGry, StanGry } from "@zwiedzanie/schemat-tresci";
import type { KontekstNarracji } from "@zwiedzanie/typy-wspolne";

export function przygotujKontekstNarracji(stan: StanGry): KontekstNarracji {
  return {
    flagi: { ...stan.flagi },
    wynikiZagadek: Object.fromEntries(
      Object.entries(stan.wynikiZagadek).map(([id, wynik]) => [
        id,
        wynik.wynik,
      ]),
    ),
    stanyWatkow: { ...stan.watki },
    sladyIPrzedmioty: [...stan.sladyIPrzedmioty],
    powinowactwa: { ...stan.powinowactwa },
    odwiedzoneLokalizacje: [...stan.odwiedzoneLokalizacje],
    dokonaneWybory: [...stan.dokonaneWybory],
  };
}

export function sprawdzZgodnoscStanu(
  definicje: DefinicjeGry,
  stan: StanGry,
): void {
  const manifest = definicje.manifest;
  if (
    stan.idGry !== manifest.idGry ||
    stan.wersjaGry !== manifest.wersjaGry ||
    stan.wersjaTresci !== manifest.wersjaTresci ||
    stan.wersjaSchematZapisu !== manifest.wersjaSchematZapisu
  )
    throw new Error("Stan pochodzi z innej gry lub wersji.");
  const sprawdz = (identyfikatory: string[], lista: { id: string }[]) => {
    if (
      identyfikatory.some((id) => !lista.some((element) => element.id === id))
    )
      throw new Error("Stan zawiera nieznany identyfikator.");
  };
  sprawdz(
    [
      ...stan.odwiedzoneLokalizacje,
      ...stan.potwierdzoneLokalizacje,
      ...stan.odblokowaneLokalizacje,
    ],
    definicje.lokalizacje,
  );
  sprawdz(
    [
      ...Object.keys(stan.wynikiZagadek),
      ...Object.keys(stan.postepyZagadek),
      ...Object.keys(stan.uzytePodpowiedzi),
      ...stan.pominieteZagadki,
      ...(stan.aktywnaZagadka ? [stan.aktywnaZagadka] : []),
    ],
    definicje.zagadki,
  );
  sprawdz(stan.dokonaneWybory, definicje.wybory);
  sprawdz(stan.sladyIPrzedmioty, definicje.przedmioty);
  sprawdz(stan.odkryteScenki, definicje.scenki);
  sprawdz(Object.keys(stan.watki), definicje.watki);
  if (Object.keys(stan.watki).length !== definicje.watki.length)
    throw new Error("Stan nie zawiera wszystkich watkow.");
  if (
    new Set(stan.dziennikZdarzen.map((zdarzenie) => zdarzenie.idZdarzenia))
      .size !== stan.dziennikZdarzen.length
  )
    throw new Error("Powtorzone zdarzenie w dzienniku.");
  const poczatek = stan.dziennikZdarzen[0];
  if (
    poczatek?.rodzaj !== "ROZPOCZNIJ_GRE" ||
    poczatek.idSesji !== stan.idSesji ||
    stan.dziennikZdarzen
      .slice(1)
      .some((zdarzenie) => zdarzenie.rodzaj === "ROZPOCZNIJ_GRE")
  )
    throw new Error("Niepoprawny poczatek dziennika.");
  if (
    stan.dziennikZdarzen.some(
      (zdarzenie, indeks) =>
        zdarzenie.czas < (stan.dziennikZdarzen[indeks - 1]?.czas ?? 0),
    )
  )
    throw new Error("Niepoprawna kolejnosc czasu.");
  if (
    stan.potwierdzoneLokalizacje.some(
      (id) => !stan.odwiedzoneLokalizacje.includes(id),
    )
  )
    throw new Error("Potwierdzono nieodwiedzona lokalizacje.");
  if (stan.aktywnaZagadka && !stan.postepyZagadek[stan.aktywnaZagadka])
    throw new Error("Brak postepu aktywnej zagadki.");
  for (const [id, postep] of Object.entries(stan.postepyZagadek)) {
    const zagadka = definicje.zagadki.find((element) => element.id === id);
    if (
      (stan.uzytePodpowiedzi[id] ?? 0) !== postep.liczbaPodpowiedzi ||
      postep.liczbaPodpowiedzi > (zagadka?.podpowiedzi.length ?? 0)
    )
      throw new Error("Niespojny licznik podpowiedzi.");
  }
  for (const [id, wynik] of Object.entries(stan.wynikiZagadek)) {
    if ((wynik.wynik === "POMINIETA") !== stan.pominieteZagadki.includes(id))
      throw new Error("Niespojny wynik pominiecia.");
  }
}
