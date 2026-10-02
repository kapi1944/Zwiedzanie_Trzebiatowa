import {
  type DefinicjaZagadki,
  normalizujOdpowiedz,
  type StanGry,
  schematDefinicjiGry,
  schematDefinicjiZagadki,
  schematZdarzeniaGry,
  type ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
import { expect, test } from "vitest";
import { wykonajKrok } from "../src/index.js";
import { utworzDefinicjeTestowe } from "./definicje.js";

test("usunPolskieZnaki zmienia tylko jawny zestaw polskich liter", () => {
  expect(
    normalizujOdpowiedz(" É ĄĆĘŁŃÓŚŹŻ ", {
      trim: true,
      ignorujWielkoscLiter: true,
      usunPolskieZnaki: true,
    }),
  ).toBe("é acelnoszz");
});

function definicja(
  typ: "WYBOR" | "TEKST" | "OBSERWACJA",
  zmiany: Record<string, unknown> = {},
) {
  const dane: Record<string, unknown> = {
    ...utworzDefinicjeTestowe().zagadki[0],
  };
  delete dane.potwierdzenie;
  delete dane.typ;
  const pola =
    typ === "WYBOR"
      ? {
          odpowiedzi: [
            { id: "mur", tekst: "Mur" },
            { id: "legenda", tekst: "Legenda" },
            { id: "przekaz", tekst: "Przekaz" },
          ],
          poprawneOdpowiedzi: ["legenda", "przekaz"],
        }
      : typ === "TEKST"
        ? {
            poprawneOdpowiedzi: ["żółć", "zolc"],
            normalizacja: {
              trim: true,
              ignorujWielkoscLiter: true,
              usunPolskieZnaki: false,
            },
          }
        : { potwierdzenie: "Wykonano obserwację." };
  return schematDefinicjiZagadki.parse({ ...dane, typ, ...pola, ...zmiany });
}

type DaneZdarzenia = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "idZdarzenia" | "czas">
    : never
  : never;
function przebieg(zagadka: DefinicjaZagadki) {
  const definicje = schematDefinicjiGry.parse({
    ...utworzDefinicjeTestowe(),
    zagadki: [zagadka],
  });
  let stan: StanGry = wykonajKrok(definicje, null, {
    rodzaj: "ROZPOCZNIJ_GRE",
    idSesji: "test",
    idZdarzenia: "start",
    czas: 0,
  }).stan;
  function wykonaj(dane: DaneZdarzenia) {
    const numer = stan.dziennikZdarzen.length;
    const wynik = wykonajKrok(definicje, stan, {
      ...dane,
      idZdarzenia: `krok_${numer}`,
      czas: numer,
    } as ZdarzenieGry);
    stan = wynik.stan;
    return wynik;
  }
  wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "plac" });
  wykonaj({ rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki: "zagadka" });
  return { wykonaj, stan: () => stan };
}

test.each(["legenda", "przekaz"])(
  "WYBOR przyjmuje jawnie poprawna odpowiedz %s",
  (odpowiedz) => {
    const gra = przebieg(definicja("WYBOR"));
    const krok = gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz,
    });
    expect(krok.stan.wynikiZagadek.zagadka?.wynik).toBe(
      "ROZWIAZANA_SAMODZIELNIE",
    );
    expect(krok.stan.dziennikZdarzen.at(-1)?.rodzaj).toBe("UDZIEL_ODPOWIEDZI");
  },
);

test("bledna proba nie finalizuje wyniku ani nie przyznaje konsekwencji", () => {
  const gra = przebieg(definicja("WYBOR"));
  const proba = gra.wykonaj({
    rodzaj: "UDZIEL_ODPOWIEDZI",
    idZagadki: "zagadka",
    odpowiedz: "mur",
  });
  expect(proba.stan.wynikiZagadek.zagadka).toBeUndefined();
  expect(proba.stan.postepyZagadek.zagadka?.liczbaProb).toBe(1);
  expect(proba.stan.aktywnaZagadka).toBe("zagadka");
  expect(proba.stan.powinowactwa.dowod).toBe(0);
  expect(proba.efekty).toContainEqual(
    expect.objectContaining({ rodzaj: "POKAZ_KOMUNIKAT" }),
  );
  const wynik = gra.wykonaj({
    rodzaj: "UDZIEL_ODPOWIEDZI",
    idZagadki: "zagadka",
    odpowiedz: "legenda",
  });
  expect(wynik.stan.wynikiZagadek.zagadka?.liczbaProb).toBe(2);
});

test.each([" ŻÓŁĆ ", "zolc"])(
  "TEKST normalizuje i akceptuje jawny wariant %s",
  (odpowiedz) => {
    const gra = przebieg(definicja("TEKST"));
    expect(
      gra.wykonaj({
        rodzaj: "UDZIEL_ODPOWIEDZI",
        idZagadki: "zagadka",
        odpowiedz,
      }).stan.wynikiZagadek.zagadka?.wynik,
    ).toBe("ROZWIAZANA_SAMODZIELNIE");
  },
);

test("polskie znaki i trim sa kontrolowane, bez przyblizonego dopasowania", () => {
  const gra = przebieg(
    definicja("TEKST", {
      poprawneOdpowiedzi: ["żółć"],
      normalizacja: {
        trim: false,
        ignorujWielkoscLiter: false,
        usunPolskieZnaki: false,
      },
    }),
  );
  for (const odpowiedz of ["ŻÓŁĆ", " żółć ", "zolc", "żółc"])
    gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz,
    });
  expect(gra.stan().wynikiZagadek.zagadka).toBeUndefined();
  expect(gra.stan().postepyZagadek.zagadka?.liczbaProb).toBe(4);
  const bezZnakow = przebieg(
    definicja("TEKST", {
      poprawneOdpowiedzi: ["żółć"],
      normalizacja: {
        trim: true,
        ignorujWielkoscLiter: true,
        usunPolskieZnaki: true,
      },
    }),
  );
  expect(
    bezZnakow.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz: "ZOLC",
    }).stan.wynikiZagadek.zagadka,
  ).toBeDefined();
});

test("kolejne podpowiedzi zostaja policzone i zmieniaja wynik", () => {
  const gra = przebieg(
    definicja("WYBOR", { podpowiedzi: ["Pierwsza.", "Druga.", "Trzecia."] }),
  );
  for (let indeks = 0; indeks < 3; indeks++)
    gra.wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki: "zagadka" });
  expect(() =>
    gra.wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki: "zagadka" }),
  ).toThrow();
  expect(
    gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz: "legenda",
    }).stan.wynikiZagadek.zagadka,
  ).toMatchObject({ wynik: "ROZWIAZANA_Z_PODPOWIEDZIA", liczbaPodpowiedzi: 3 });
});

test("limit blokuje dalsze odpowiedzi, ale pomoc nadal prowadzi dalej", () => {
  const gra = przebieg(definicja("WYBOR", { limitProb: 2 }));
  for (let indeks = 0; indeks < 2; indeks++)
    gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz: "mur",
    });
  expect(() =>
    gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz: "legenda",
    }),
  ).toThrow("Limit prob");
  expect(gra.stan().wynikiZagadek.zagadka).toBeUndefined();
  gra.wykonaj({ rodzaj: "POTRZEBUJE_POMOCY", idZagadki: "zagadka" });
  expect(
    gra.wykonaj({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki: "zagadka",
      wynik: "ROZWIAZANA_Z_POMOCA",
    }).stan.wynikiZagadek.zagadka,
  ).toMatchObject({
    wynik: "ROZWIAZANA_Z_POMOCA",
    liczbaProb: 2,
    potrzebujePomocy: true,
  });
});

test("po otrzymaniu pomocy poprawna odpowiedz tez daje wynik z pomoca", () => {
  const gra = przebieg(definicja("WYBOR"));
  gra.wykonaj({ rodzaj: "POTRZEBUJE_POMOCY", idZagadki: "zagadka" });
  expect(
    gra.wykonaj({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki: "zagadka",
      odpowiedz: "legenda",
    }).stan.wynikiZagadek.zagadka?.wynik,
  ).toBe("ROZWIAZANA_Z_POMOCA");
});

test("deklaratywne zaliczenie ze sladem sprawdza warunek", () => {
  const gra = przebieg(
    definicja("WYBOR", {
      alternatywneZaliczenia: [
        {
          id: "ze_sladem",
          nazwa: "Ślad",
          warunek: { rodzaj: "posiadaPrzedmiot", id: "klucz" },
          wynik: "ROZWIAZANA_Z_POMOCA",
        },
      ],
    }),
  );
  expect(() =>
    gra.wykonaj({
      rodzaj: "ZALICZ_ALTERNATYWNIE",
      idZagadki: "zagadka",
      idSposobu: "ze_sladem",
    }),
  ).toThrow();
  gra.wykonaj({ rodzaj: "DODAJ_PRZEDMIOT", idPrzedmiotu: "klucz" });
  expect(
    gra.wykonaj({
      rodzaj: "ZALICZ_ALTERNATYWNIE",
      idZagadki: "zagadka",
      idSposobu: "ze_sladem",
    }).stan.wynikiZagadek.zagadka?.wynik,
  ).toBe("ROZWIAZANA_Z_POMOCA");
});

test("zamknieta zagadka nie powtarza nagrody i odrzuca double-submit", () => {
  const gra = przebieg(definicja("OBSERWACJA"));
  gra.wykonaj({ rodzaj: "POTWIERDZ_OBSERWACJE", idZagadki: "zagadka" });
  const zapis = structuredClone(gra.stan());
  for (const rodzaj of [
    "POTWIERDZ_OBSERWACJE",
    "ROZPOCZNIJ_ZAGADKE",
    "POMIN_ZAGADKE",
  ] as const)
    expect(() => gra.wykonaj({ rodzaj, idZagadki: "zagadka" })).toThrow();
  expect(gra.stan()).toEqual(zapis);
});

test("content odrzuca limit bez wyjscia oraz nieistniejaca odpowiedz", () => {
  expect(() =>
    definicja("WYBOR", {
      limitProb: 1,
      moznaPominac: false,
      moznaZakonczycBezRozwiazania: false,
      pomoc: undefined,
    }),
  ).toThrow();
  expect(() =>
    definicja("WYBOR", { poprawneOdpowiedzi: ["nieistniejaca"] }),
  ).toThrow();
  expect(() => definicja("TEKST", { poprawneOdpowiedzi: ["   "] })).toThrow();
  expect(() =>
    definicja("TEKST", { poprawneOdpowiedzi: [" ŻÓŁĆ ", "żółć"] }),
  ).toThrow();
});

test("polityka pomijania i nierozstrzygniecia jest egzekwowana", () => {
  const gra = przebieg(
    definicja("WYBOR", {
      moznaPominac: false,
      moznaZakonczycBezRozwiazania: false,
    }),
  );
  expect(() =>
    gra.wykonaj({ rodzaj: "POMIN_ZAGADKE", idZagadki: "zagadka" }),
  ).toThrow();
  expect(() =>
    gra.wykonaj({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki: "zagadka",
      wynik: "NIEUDANA",
    }),
  ).toThrow();
  expect(() =>
    gra.wykonaj({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki: "zagadka",
      wynik: "ROZWIAZANA_Z_POMOCA",
    }),
  ).toThrow();
});

test("nie mozna przeslac zadeklarowanego sukcesu zamiast odpowiedzi", () => {
  expect(
    schematZdarzeniaGry.safeParse({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki: "zagadka",
      wynik: "ROZWIAZANA_SAMODZIELNIE",
      idZdarzenia: "falszywe",
      czas: 1,
    }).success,
  ).toBe(false);
});
