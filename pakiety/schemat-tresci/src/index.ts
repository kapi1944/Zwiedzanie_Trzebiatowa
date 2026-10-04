import { z } from "zod";

// Walidacja interpretowana, bez generowania kodu JavaScript.
z.config({ jitless: true });

export const schematId = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*$/)
  .refine((id) => !["constructor", "prototype", "__proto__"].includes(id));
export const schematWynikuZagadki = z.enum([
  "ROZWIAZANA_SAMODZIELNIE",
  "ROZWIAZANA_Z_PODPOWIEDZIA",
  "ROZWIAZANA_Z_POMOCA",
  "POMINIETA",
  "NIEUDANA",
]);
export type WynikZagadki = z.infer<typeof schematWynikuZagadki>;
export const schematStanuWatku = z.enum([
  "ZABLOKOWANY",
  "DOSTEPNY",
  "AKTYWNY",
  "UKONCZONY",
  "POMINIETY",
]);
export type StanWatku = z.infer<typeof schematStanuWatku>;
export const schematOsiPowinowactwa = z.enum([
  "dowod",
  "legenda",
  "pamiec",
  "zmiana",
]);
export type OsPowinowactwa = z.infer<typeof schematOsiPowinowactwa>;

export type Warunek =
  | { rodzaj: "wszystkie" | "dowolny"; warunki: Warunek[] }
  | { rodzaj: "nie"; warunek: Warunek }
  | { rodzaj: "flagaJest"; id: string; wartosc: boolean }
  | { rodzaj: "wynikZagadkiJest"; id: string; wynik: WynikZagadki }
  | { rodzaj: "stanWatkuJest"; id: string; stan: StanWatku }
  | { rodzaj: "powinowactwoCoNajmniej"; os: OsPowinowactwa; wartosc: number }
  | { rodzaj: "zadanieUkonczone"; id: string }
  | { rodzaj: "podpowiedziCoNajwyzej"; id: string; liczba: number }
  | {
      rodzaj: "posiadaPrzedmiot" | "odwiedzono" | "wybrano" | "odkrytoScenke";
      id: string;
    };

export const schematWarunku: z.ZodType<Warunek> = z.lazy(() =>
  z.discriminatedUnion("rodzaj", [
    z.strictObject({
      rodzaj: z.literal("wszystkie"),
      warunki: z.array(schematWarunku),
    }),
    z.strictObject({
      rodzaj: z.literal("dowolny"),
      warunki: z.array(schematWarunku),
    }),
    z.strictObject({ rodzaj: z.literal("nie"), warunek: schematWarunku }),
    z.strictObject({
      rodzaj: z.literal("flagaJest"),
      id: schematId,
      wartosc: z.boolean(),
    }),
    z.strictObject({
      rodzaj: z.literal("wynikZagadkiJest"),
      id: schematId,
      wynik: schematWynikuZagadki,
    }),
    z.strictObject({
      rodzaj: z.literal("stanWatkuJest"),
      id: schematId,
      stan: schematStanuWatku,
    }),
    z.strictObject({
      rodzaj: z.literal("powinowactwoCoNajmniej"),
      os: schematOsiPowinowactwa,
      wartosc: z.number().int().min(-5).max(5),
    }),
    z.strictObject({ rodzaj: z.literal("zadanieUkonczone"), id: schematId }),
    z.strictObject({
      rodzaj: z.literal("podpowiedziCoNajwyzej"),
      id: schematId,
      liczba: z.number().int().nonnegative(),
    }),
    ...(
      ["posiadaPrzedmiot", "odwiedzono", "wybrano", "odkrytoScenke"] as const
    ).map((rodzaj) =>
      z.strictObject({ rodzaj: z.literal(rodzaj), id: schematId }),
    ),
  ]),
);

const polaHistoryczne = {
  klasyfikacja: z.enum([
    "FAKT",
    "TRADYCJA",
    "LEGENDA",
    "SPORNE",
    "FABULARYZOWANE",
  ]),
  idZrodla: z.array(schematId),
  wymagaWeryfikacjiTerenowej: z.boolean(),
  zweryfikowanoTerenowoDnia: z.iso.date().optional(),
};
const polaElementu = {
  id: schematId,
  nazwa: z.string().min(1),
  ...polaHistoryczne,
};
export const schematManifestuGry = z.strictObject({
  idGry: schematId,
  wersjaGry: z.string().min(1),
  wersjaTresci: z.string().min(1),
  wersjaSchematZapisu: z.literal(1),
  scenaStartowa: schematId,
});
export type ManifestGry = z.infer<typeof schematManifestuGry>;
export const schematDefinicjiSceny = z.strictObject({ ...polaElementu });
export type DefinicjaSceny = z.infer<typeof schematDefinicjiSceny>;
export const schematDefinicjiLokalizacji = z
  .strictObject({
    trybPotwierdzenia: z
      .enum(["GPS_LUB_RECZNIE", "TYLKO_RECZNIE"])
      .default("TYLKO_RECZNIE"),
    geo: z
      .strictObject({
        szerokosc: z.number().min(-90).max(90),
        dlugosc: z.number().min(-180).max(180),
        promienPotwierdzeniaMetry: z.number().positive(),
        dokladnoscWymaganaMetry: z.number().positive().optional(),
        zrodloWspolrzednych: z.url(),
        charakterDanych: z.string().min(1),
      })
      .optional(),
    ...polaElementu,
    idSceny: schematId,
    warunek: schematWarunku.optional(),
    statusRekonesansu: z
      .enum(["POTWIERDZONE", "WYMAGA_REKONESANSU", "DO_WERYFIKACJI"])
      .optional(),
    wymaganiaDostepu: z.string().min(1).optional(),
    punktMapy: z
      .strictObject({
        szerokosc: z.number().min(-90).max(90),
        dlugosc: z.number().min(-180).max(180),
        zrodlo: z.httpUrl(),
        status: z.enum(["POTWIERDZONE_ZRODLOWO", "DO_WERYFIKACJI"]),
      })
      .optional(),
  })
  .refine(
    (miejsce) =>
      miejsce.trybPotwierdzenia !== "GPS_LUB_RECZNIE" ||
      miejsce.geo !== undefined,
    {
      message: "Potwierdzenie GPS wymaga danych geo.",
    },
  );
export type DefinicjaLokalizacji = z.infer<typeof schematDefinicjiLokalizacji>;
export const schematDefinicjiWatku = z.strictObject({
  ...polaElementu,
  opcjonalny: z.boolean(),
  wymaganyDoFinalu: z.boolean(),
  warunek: schematWarunku.optional(),
  warunekAktywacji: schematWarunku.optional(),
  warunekUkonczenia: schematWarunku.optional(),
});
export type DefinicjaWatku = z.infer<typeof schematDefinicjiWatku>;
export const schematDefinicjiZadania = z.strictObject({
  ...polaElementu,
  idLokalizacji: schematId,
  idZagadek: z.array(schematId),
});
export type DefinicjaZadania = z.infer<typeof schematDefinicjiZadania>;
export const schematSladuLubPrzedmiotu = z.strictObject({
  ...polaElementu,
  rodzaj: z.enum(["TROP", "PAMIATKA", "FRAGMENT_KRONIKI", "SYMBOLICZNY_KLUCZ"]),
});
export type SladLubPrzedmiot = z.infer<typeof schematSladuLubPrzedmiotu>;

export const schematEfektuGry = z.discriminatedUnion("rodzaj", [
  z.strictObject({ rodzaj: z.literal("POKAZ_SCENE"), id: schematId }),
  z.strictObject({ rodzaj: z.literal("ODTWORZ_DZWIEK"), id: schematId }),
  z.strictObject({ rodzaj: z.literal("USTAW_NASTROJ_MUZYKI"), id: schematId }),
  z.strictObject({ rodzaj: z.literal("ODBLOKUJ_LOKALIZACJE"), id: schematId }),
  z.strictObject({ rodzaj: z.literal("ODBLOKUJ_WATEK"), id: schematId }),
  z.strictObject({ rodzaj: z.literal("DODAJ_WPIS_DO_KRONIKI"), id: schematId }),
  z.strictObject({
    rodzaj: z.literal("POKAZ_KOMUNIKAT"),
    tekst: z.string().min(1),
  }),
  z.strictObject({ rodzaj: z.literal("ZAPISZ_STAN") }),
  z.strictObject({ rodzaj: z.literal("USTAW_KONTEKST_NARRACJI") }),
]);
export type EfektGry = z.infer<typeof schematEfektuGry>;
export const schematZmianyGry = z.discriminatedUnion("rodzaj", [
  z.strictObject({
    rodzaj: z.literal("USTAW_FLAGE"),
    id: schematId,
    wartosc: z.boolean(),
  }),
  z.strictObject({
    rodzaj: z.literal("ZMIEN_POWINOWACTWO"),
    os: schematOsiPowinowactwa,
    wartosc: z.number().int().min(-10).max(10),
  }),
  ...(["DODAJ_PRZEDMIOT", "USUN_PRZEDMIOT"] as const).map((rodzaj) =>
    z.strictObject({ rodzaj: z.literal(rodzaj), id: schematId }),
  ),
]);
export type ZmianaGry = z.infer<typeof schematZmianyGry>;
const schematKonsekwencji = z.strictObject({
  zmiany: z.array(schematZmianyGry),
  efekty: z.array(schematEfektuGry),
});
export const schematNormalizacjiOdpowiedzi = z.strictObject({
  trim: z.boolean(),
  ignorujWielkoscLiter: z.boolean(),
  usunPolskieZnaki: z.boolean(),
});
export function normalizujOdpowiedz(
  tekst: string,
  zasady: z.infer<typeof schematNormalizacjiOdpowiedzi>,
): string {
  let wynik = tekst.normalize("NFC");
  if (zasady.trim) wynik = wynik.trim();
  if (zasady.ignorujWielkoscLiter) wynik = wynik.toLocaleLowerCase("pl-PL");
  if (zasady.usunPolskieZnaki) {
    const zamiany: Record<string, string> = {
      ą: "a",
      ć: "c",
      ę: "e",
      ł: "l",
      ń: "n",
      ó: "o",
      ś: "s",
      ź: "z",
      ż: "z",
      Ą: "A",
      Ć: "C",
      Ę: "E",
      Ł: "L",
      Ń: "N",
      Ó: "O",
      Ś: "S",
      Ź: "Z",
      Ż: "Z",
    };
    wynik = wynik.replace(
      /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
      (znak) => zamiany[znak] ?? znak,
    );
  }
  return wynik;
}
const polaZagadki = {
  ...polaElementu,
  idLokalizacji: schematId,
  idSceny: schematId.optional(),
  pytanie: z.string().min(1),
  podpowiedzi: z.array(z.string().min(1)),
  pomoc: z
    .strictObject({ tekst: z.string().min(1), pozwalaZaliczyc: z.boolean() })
    .optional(),
  moznaPominac: z.boolean().default(true),
  moznaZakonczycBezRozwiazania: z.boolean().default(false),
  limitProb: z.number().int().min(1).max(100).optional(),
  alternatywneZaliczenia: z
    .array(
      z.strictObject({
        id: schematId,
        nazwa: z.string().min(1),
        warunek: schematWarunku,
        wynik: z.enum(["ROZWIAZANA_SAMODZIELNIE", "ROZWIAZANA_Z_POMOCA"]),
      }),
    )
    .default([]),
  konsekwencje: z.record(schematWynikuZagadki, schematKonsekwencji),
};
export const schematDefinicjiZagadki = z
  .discriminatedUnion("typ", [
    z.strictObject({
      ...polaZagadki,
      typ: z.literal("WYBOR"),
      odpowiedzi: z
        .array(z.strictObject({ id: schematId, tekst: z.string().min(1) }))
        .min(2),
      poprawneOdpowiedzi: z.array(schematId).min(1),
    }),
    z.strictObject({
      ...polaZagadki,
      typ: z.literal("TEKST"),
      poprawneOdpowiedzi: z.array(z.string().min(1)).min(1),
      normalizacja: schematNormalizacjiOdpowiedzi,
    }),
    z.strictObject({
      ...polaZagadki,
      typ: z.literal("OBSERWACJA"),
      potwierdzenie: z.string().min(1),
      odpowiedz: z.null().optional(),
    }),
  ])
  .superRefine((zagadka, kontekst) => {
    const zglos = (komunikat: string) =>
      kontekst.addIssue({ code: "custom", message: komunikat });
    if (
      zagadka.limitProb &&
      !zagadka.moznaPominac &&
      !zagadka.moznaZakonczycBezRozwiazania &&
      !zagadka.pomoc?.pozwalaZaliczyc
    )
      zglos("Limit prob wymaga bezwarunkowej drogi kontynuacji.");
    if (
      new Set(zagadka.alternatywneZaliczenia.map((element) => element.id))
        .size !== zagadka.alternatywneZaliczenia.length
    )
      zglos("Duplikat alternatywnego zaliczenia.");
    if (
      zagadka.typ === "WYBOR" &&
      (new Set(zagadka.odpowiedzi.map((element) => element.id)).size !==
        zagadka.odpowiedzi.length ||
        zagadka.poprawneOdpowiedzi.some(
          (id) => !zagadka.odpowiedzi.some((element) => element.id === id),
        ) ||
        new Set(zagadka.poprawneOdpowiedzi).size !==
          zagadka.poprawneOdpowiedzi.length)
    )
      zglos("Niepoprawna lista odpowiedzi.");
    if (zagadka.typ === "TEKST") {
      const odpowiedzi = zagadka.poprawneOdpowiedzi.map((tekst) =>
        normalizujOdpowiedz(tekst, zagadka.normalizacja),
      );
      if (
        odpowiedzi.some((tekst) => !tekst.length) ||
        new Set(odpowiedzi).size !== odpowiedzi.length
      )
        zglos("Pusta lub powtorzona odpowiedz po normalizacji.");
    }
  });
export type DefinicjaZagadki = z.infer<typeof schematDefinicjiZagadki>;
export const schematDefinicjiScenkiOpcjonalnej = z.strictObject({
  ...polaElementu,
  idSceny: schematId,
  warunek: schematWarunku,
});
export type DefinicjaScenkiOpcjonalnej = z.infer<
  typeof schematDefinicjiScenkiOpcjonalnej
>;
export const schematDefinicjiWyboru = z.strictObject({
  ...polaElementu,
  idSceny: schematId,
  nastepnaScena: schematId,
  warunek: schematWarunku.optional(),
  ...schematKonsekwencji.shape,
});
export type DefinicjaWyboru = z.infer<typeof schematDefinicjiWyboru>;
export const schematDefinicjiZakonczenia = z.strictObject({
  ...polaElementu,
  rodzaj: z.enum([
    "GLOWNE",
    "EPILOG_WATKU",
    "SPECJALNE_ODKRYCIE",
    "KONSEKWENCJA_ZAGADKI",
  ]),
  priorytet: z.number().int(),
  domyslne: z.boolean(),
  warunek: schematWarunku.optional(),
  tekst: z.string().min(1).optional(),
});
export type DefinicjaZakonczenia = z.infer<typeof schematDefinicjiZakonczenia>;
export const schematZrodlaHistorycznego = z.strictObject({
  id: schematId,
  tytul: z.string().min(1),
  opisBibliograficzny: z.string().min(1),
  url: z.httpUrl().optional(),
});
export type ZrodloHistoryczne = z.infer<typeof schematZrodlaHistorycznego>;
export const schematDefinicjiZasobu = z.strictObject({
  id: schematId,
  rodzaj: z.enum(["OBRAZ", "DZWIEK", "MUZYKA", "NARRACJA"]),
  sciezka: z
    .string()
    .regex(/^[a-z0-9_/-]+\.[a-z0-9]+$/)
    .refine((sciezka) => !sciezka.startsWith("/")),
});
export type DefinicjaZasobu = z.infer<typeof schematDefinicjiZasobu>;

export const schematKandydataMiejsca = z.strictObject({
  id: schematId,
  nazwa: z.string().min(1),
  statusRekonesansu: z.enum([
    "POTWIERDZONE",
    "WYMAGA_REKONESANSU",
    "DO_WERYFIKACJI",
  ]),
  pochodzenie: z.string().min(1),
  obszar: z.string().min(1),
  kandydaciZadan: z
    .array(
      z.strictObject({
        polecenie: z.string().min(1),
        odpowiedz: z.string().nullable(),
        status: z.enum([
          "WYMAGA_REKONESANSU",
          "DO_WERYFIKACJI",
          "POTWIERDZONE_ZRODLOWO",
        ]),
        zrodla: z.array(z.string().min(1)),
      }),
    )
    .max(3),
});
export const schematKampanii = z.strictObject({
  scenaRozgalezienia: schematId,
  scenaFinalu: schematId,
  warunekFinalu: schematWarunku,
  scenyMiejsc: z.array(
    z.strictObject({ idSceny: schematId, idLokalizacji: schematId }),
  ),
  powiazaniaNarracji: z.array(
    z.strictObject({
      zmiennaInk: schematId,
      obszar: z.enum([
        "flagi",
        "wynikiZagadek",
        "stanyWatkow",
        "sladyIPrzedmioty",
        "odwiedzoneLokalizacje",
        "dokonaneWybory",
      ]),
      klucz: schematId,
    }),
  ),
  wiedza: z.array(
    z.strictObject({
      ...polaElementu,
      tekst: z.string().min(1),
      warunek: schematWarunku,
    }),
  ),
});
const schematPakietu = z.strictObject({
  kampania: schematKampanii.optional(),
  manifest: schematManifestuGry,
  lokalizacje: z.array(schematDefinicjiLokalizacji),
  watki: z.array(schematDefinicjiWatku),
  zadania: z.array(schematDefinicjiZadania),
  zagadki: z.array(schematDefinicjiZagadki),
  scenki: z.array(schematDefinicjiScenkiOpcjonalnej),
  wybory: z.array(schematDefinicjiWyboru),
  zakonczenia: z.array(schematDefinicjiZakonczenia),
  zrodla: z.array(schematZrodlaHistorycznego),
  zasoby: z.array(schematDefinicjiZasobu),
  przedmioty: z.array(schematSladuLubPrzedmiotu),
});
export const schematDefinicjiGry = schematPakietu.superRefine(
  (dane, kontekst) => {
    const zglos = (opis: string) =>
      kontekst.addIssue({ code: "custom", message: opis });
    for (const lista of [
      dane.lokalizacje,
      dane.watki,
      dane.zadania,
      dane.zagadki,
      dane.scenki,
      dane.wybory,
      dane.zakonczenia,
      dane.zrodla,
      dane.zasoby,
      dane.przedmioty,
    ]) {
      if (new Set(lista.map((element) => element.id)).size !== lista.length)
        zglos("Powtorzony identyfikator w kolekcji.");
    }
    const sprawdzId = (id: string, lista: readonly { id: string }[]) => {
      if (!lista.some((element) => element.id === id))
        zglos(`Nieznane odwolanie: ${id}.`);
    };
    const sprawdzWarunek = (warunek: Warunek): void => {
      switch (warunek.rodzaj) {
        case "wszystkie":
        case "dowolny":
          warunek.warunki.forEach(sprawdzWarunek);
          break;
        case "nie":
          sprawdzWarunek(warunek.warunek);
          break;
        case "wynikZagadkiJest":
        case "podpowiedziCoNajwyzej":
          sprawdzId(warunek.id, dane.zagadki);
          break;
        case "zadanieUkonczone":
          sprawdzId(warunek.id, dane.zadania);
          break;
        case "stanWatkuJest":
          sprawdzId(warunek.id, dane.watki);
          break;
        case "posiadaPrzedmiot":
          sprawdzId(warunek.id, dane.przedmioty);
          break;
        case "odwiedzono":
          sprawdzId(warunek.id, dane.lokalizacje);
          break;
        case "wybrano":
          sprawdzId(warunek.id, dane.wybory);
          break;
        case "odkrytoScenke":
          sprawdzId(warunek.id, dane.scenki);
          break;
      }
    };
    for (const element of [
      ...dane.lokalizacje,
      ...dane.watki,
      ...dane.zadania,
      ...dane.zagadki,
      ...dane.scenki,
      ...dane.wybory,
      ...dane.zakonczenia,
      ...dane.przedmioty,
    ]) {
      for (const id of element.idZrodla) sprawdzId(id, dane.zrodla);
      if (element.klasyfikacja !== "FABULARYZOWANE" && !element.idZrodla.length)
        zglos("Element historyczny wymaga zrodla.");
      if ("warunek" in element && element.warunek)
        sprawdzWarunek(element.warunek);
    }
    for (const element of [...dane.zadania, ...dane.zagadki])
      sprawdzId(element.idLokalizacji, dane.lokalizacje);
    for (const zadanie of dane.zadania)
      for (const id of zadanie.idZagadek) sprawdzId(id, dane.zagadki);
    const sprawdzKonsekwencje = (
      konsekwencje: z.infer<typeof schematKonsekwencji>,
    ) => {
      for (const zmiana of konsekwencje.zmiany)
        if (
          zmiana.rodzaj === "DODAJ_PRZEDMIOT" ||
          zmiana.rodzaj === "USUN_PRZEDMIOT"
        )
          sprawdzId(zmiana.id, dane.przedmioty);
      for (const efekt of konsekwencje.efekty) {
        if (efekt.rodzaj === "ODBLOKUJ_LOKALIZACJE")
          sprawdzId(efekt.id, dane.lokalizacje);
        if (efekt.rodzaj === "ODBLOKUJ_WATEK") sprawdzId(efekt.id, dane.watki);
        if (
          efekt.rodzaj === "ODTWORZ_DZWIEK" ||
          efekt.rodzaj === "USTAW_NASTROJ_MUZYKI"
        )
          sprawdzId(efekt.id, dane.zasoby);
      }
    };
    dane.wybory.forEach(sprawdzKonsekwencje);
    for (const watek of dane.watki) {
      if (watek.warunekAktywacji) sprawdzWarunek(watek.warunekAktywacji);
      if (watek.warunekUkonczenia) sprawdzWarunek(watek.warunekUkonczenia);
    }
    if (dane.kampania) {
      for (const miejsce of dane.kampania.scenyMiejsc)
        sprawdzId(miejsce.idLokalizacji, dane.lokalizacje);
      sprawdzWarunek(dane.kampania.warunekFinalu);
      for (const wpis of dane.kampania.wiedza) {
        sprawdzWarunek(wpis.warunek);
        wpis.idZrodla.forEach((id) => {
          sprawdzId(id, dane.zrodla);
        });
        if (wpis.klasyfikacja !== "FABULARYZOWANE" && !wpis.idZrodla.length)
          zglos("Wiedza historyczna wymaga zrodla.");
      }
    }
    for (const zagadka of dane.zagadki) {
      for (const sposob of zagadka.alternatywneZaliczenia)
        sprawdzWarunek(sposob.warunek);
      for (const konsekwencja of Object.values(zagadka.konsekwencje))
        sprawdzKonsekwencje(konsekwencja);
    }
    const domyslne = dane.zakonczenia.filter(
      (element) => element.rodzaj === "GLOWNE" && element.domyslne,
    );
    if (domyslne.length !== 1 || domyslne[0]?.warunek)
      zglos("Wymagane jedno bezwarunkowe domyslne zakonczenie glowne.");
    if (
      dane.zakonczenia.some(
        (element) => element.rodzaj !== "GLOWNE" && element.domyslne,
      )
    )
      zglos("Tylko zakonczenie glowne moze byc domyslne.");
  },
);
export type DefinicjeGry = z.infer<typeof schematDefinicjiGry>;

const polaZdarzenia = {
  idZdarzenia: schematId,
  czas: z.number().int().nonnegative(),
};
export const schematZdarzeniaGry = z.discriminatedUnion("rodzaj", [
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("ROZPOCZNIJ_GRE"),
    idSesji: schematId,
  }),
  z.strictObject({ ...polaZdarzenia, rodzaj: z.literal("WZNOW_GRE") }),
  ...(["WEJDZ_DO_LOKALIZACJI", "POTWIERDZ_OBECNOSC"] as const).map((rodzaj) =>
    z.strictObject({
      ...polaZdarzenia,
      rodzaj: z.literal(rodzaj),
      idLokalizacji: schematId,
    }),
  ),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("ROZPOCZNIJ_ZAGADKE"),
    idZagadki: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("POPROS_O_PODPOWIEDZ"),
    idZagadki: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("POMIN_ZAGADKE"),
    idZagadki: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("ZAKONCZ_ZAGADKE"),
    idZagadki: schematId,
    wynik: z.enum(["ROZWIAZANA_Z_POMOCA", "NIEUDANA"]),
  }),
  ...(["POTRZEBUJE_POMOCY", "POTWIERDZ_OBSERWACJE"] as const).map((rodzaj) =>
    z.strictObject({
      ...polaZdarzenia,
      rodzaj: z.literal(rodzaj),
      idZagadki: schematId,
    }),
  ),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("UDZIEL_ODPOWIEDZI"),
    idZagadki: schematId,
    odpowiedz: z.string().min(1).max(1000),
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("ZALICZ_ALTERNATYWNIE"),
    idZagadki: schematId,
    idSposobu: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("DOKONAJ_WYBORU"),
    idWyboru: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("AKTYWUJ_WATEK"),
    idWatku: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("ZAKONCZ_WATEK"),
    idWatku: schematId,
  }),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("POMIN_WATEK"),
    idWatku: schematId,
  }),
  ...(["DODAJ_PRZEDMIOT", "USUN_PRZEDMIOT"] as const).map((rodzaj) =>
    z.strictObject({
      ...polaZdarzenia,
      rodzaj: z.literal(rodzaj),
      idPrzedmiotu: schematId,
    }),
  ),
  z.strictObject({
    ...polaZdarzenia,
    rodzaj: z.literal("OTWORZ_SCENKE"),
    idScenki: schematId,
  }),
]);
export type ZdarzenieGry = z.infer<typeof schematZdarzeniaGry>;
const schematPostepuZagadki = z.strictObject({
  liczbaProb: z.number().int().nonnegative(),
  liczbaPodpowiedzi: z.number().int().nonnegative(),
  potrzebujePomocy: z.boolean().default(false),
  ostatniaOdpowiedzPoprawna: z.boolean().optional(),
});
const listaId = z
  .array(schematId)
  .refine((lista) => new Set(lista).size === lista.length);
export const schematStanuGry = z.strictObject({
  idGry: schematId,
  wersjaGry: z.string().min(1),
  wersjaTresci: z.string().min(1),
  wersjaSchematZapisu: z.literal(1),
  idSesji: schematId,
  aktualnaScena: schematId,
  odwiedzoneLokalizacje: listaId,
  potwierdzoneLokalizacje: listaId,
  wynikiZagadek: z.record(
    schematId,
    z.strictObject({
      wynik: schematWynikuZagadki,
      ...schematPostepuZagadki.shape,
    }),
  ),
  postepyZagadek: z.record(schematId, schematPostepuZagadki),
  aktywnaZagadka: schematId.nullable(),
  dokonaneWybory: listaId,
  flagi: z.record(schematId, z.boolean()),
  sladyIPrzedmioty: listaId,
  watki: z.record(schematId, schematStanuWatku),
  powinowactwa: z.record(
    schematOsiPowinowactwa,
    z.number().int().min(-5).max(5),
  ),
  odkryteScenki: listaId,
  uzytePodpowiedzi: z.record(schematId, z.number().int().nonnegative()),
  pominieteZagadki: listaId,
  odblokowaneLokalizacje: listaId,
  dziennikZdarzen: z.array(schematZdarzeniaGry),
});
export type StanGry = z.infer<typeof schematStanuGry>;
