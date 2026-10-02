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
export const schematDefinicjiLokalizacji = z.strictObject({
  ...polaElementu,
  idSceny: schematId,
  warunek: schematWarunku.optional(),
});
export type DefinicjaLokalizacji = z.infer<typeof schematDefinicjiLokalizacji>;
export const schematDefinicjiWatku = z.strictObject({
  ...polaElementu,
  opcjonalny: z.boolean(),
  wymaganyDoFinalu: z.boolean(),
  warunek: schematWarunku.optional(),
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
export const schematDefinicjiZagadki = z.strictObject({
  ...polaElementu,
  idLokalizacji: schematId,
  podpowiedzi: z.array(z.string().min(1)),
  konsekwencje: z.record(schematWynikuZagadki, schematKonsekwencji),
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

const schematPakietu = z.strictObject({
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
          sprawdzId(warunek.id, dane.zagadki);
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
    for (const zagadka of dane.zagadki) {
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
    wynik: schematWynikuZagadki,
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
