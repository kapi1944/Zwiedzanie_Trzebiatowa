import {
  type DefinicjeGry,
  schematDefinicjiGry,
  schematWynikuZagadki,
} from "@zwiedzanie/schemat-tresci";

export function utworzDefinicjeTestowe(): DefinicjeGry {
  const opis = {
    nazwa: "Demonstracja techniczna",
    klasyfikacja: "FABULARYZOWANE",
    idZrodla: [],
    wymagaWeryfikacjiTerenowej: false,
  };
  return schematDefinicjiGry.parse({
    manifest: {
      idGry: "testowa",
      wersjaGry: "1",
      wersjaTresci: "1",
      wersjaSchematZapisu: 1,
      scenaStartowa: "start",
    },
    lokalizacje: [
      { ...opis, id: "plac", idSceny: "start" },
      {
        ...opis,
        id: "ogrod",
        idSceny: "ogrod",
        warunek: { rodzaj: "flagaJest", id: "otwarto", wartosc: true },
      },
    ],
    watki: [
      { ...opis, id: "glowny", opcjonalny: false, wymaganyDoFinalu: true },
      {
        ...opis,
        id: "poboczny",
        opcjonalny: true,
        wymaganyDoFinalu: false,
        warunek: { rodzaj: "posiadaPrzedmiot", id: "klucz" },
      },
    ],
    zadania: [
      { ...opis, id: "proba", idLokalizacji: "plac", idZagadek: ["zagadka"] },
    ],
    zagadki: [
      {
        ...opis,
        id: "zagadka",
        idLokalizacji: "plac",
        typ: "OBSERWACJA",
        pytanie: "Potwierdz probe techniczna.",
        potwierdzenie: "Wykonano probe.",
        moznaZakonczycBezRozwiazania: true,
        pomoc: { tekst: "Pomoc techniczna.", pozwalaZaliczyc: true },
        podpowiedzi: ["Podpowiedź techniczna."],
        konsekwencje: Object.fromEntries(
          schematWynikuZagadki.options.map((wynik, indeks) => [
            wynik,
            {
              zmiany: [
                {
                  rodzaj: "ZMIEN_POWINOWACTWO",
                  os: "dowod",
                  wartosc: indeks + 1,
                },
              ],
              efekty: [{ rodzaj: "POKAZ_KOMUNIKAT", tekst: wynik }],
            },
          ]),
        ),
      },
    ],
    scenki: [
      {
        ...opis,
        id: "scenka",
        idSceny: "scena_dodatkowa",
        warunek: { rodzaj: "posiadaPrzedmiot", id: "klucz" },
      },
    ],
    wybory: [
      {
        ...opis,
        id: "wybor_a",
        idSceny: "start",
        nastepnaScena: "dalej",
        zmiany: [
          { rodzaj: "USTAW_FLAGE", id: "otwarto", wartosc: true },
          { rodzaj: "ZMIEN_POWINOWACTWO", os: "dowod", wartosc: 10 },
        ],
        efekty: [
          { rodzaj: "ODTWORZ_DZWIEK", id: "dzwiek" },
          { rodzaj: "USTAW_NASTROJ_MUZYKI", id: "muzyka" },
          { rodzaj: "DODAJ_WPIS_DO_KRONIKI", id: "wpis" },
        ],
      },
      {
        ...opis,
        id: "wybor_b",
        idSceny: "start",
        nastepnaScena: "dalej",
        zmiany: [{ rodzaj: "ZMIEN_POWINOWACTWO", os: "dowod", wartosc: -10 }],
        efekty: [],
      },
    ],
    przedmioty: [{ ...opis, id: "klucz", rodzaj: "SYMBOLICZNY_KLUCZ" }],
    zakonczenia: [
      { ...opis, id: "bazowe", rodzaj: "GLOWNE", priorytet: 0, domyslne: true },
      {
        ...opis,
        id: "dowod",
        rodzaj: "GLOWNE",
        priorytet: 10,
        domyslne: false,
        warunek: { rodzaj: "powinowactwoCoNajmniej", os: "dowod", wartosc: 3 },
      },
      {
        ...opis,
        id: "epilog",
        rodzaj: "EPILOG_WATKU",
        priorytet: 1,
        domyslne: false,
        warunek: { rodzaj: "stanWatkuJest", id: "poboczny", stan: "UKONCZONY" },
      },
      {
        ...opis,
        id: "odkrycie",
        rodzaj: "SPECJALNE_ODKRYCIE",
        priorytet: 1,
        domyslne: false,
        warunek: { rodzaj: "posiadaPrzedmiot", id: "klucz" },
      },
      {
        ...opis,
        id: "konsekwencja",
        rodzaj: "KONSEKWENCJA_ZAGADKI",
        priorytet: 1,
        domyslne: false,
        warunek: {
          rodzaj: "wynikZagadkiJest",
          id: "zagadka",
          wynik: "POMINIETA",
        },
      },
    ],
    zrodla: [],
    zasoby: [
      { id: "dzwiek", rodzaj: "DZWIEK", sciezka: "dzwiek.ogg" },
      { id: "muzyka", rodzaj: "MUZYKA", sciezka: "muzyka.ogg" },
    ],
  });
}
