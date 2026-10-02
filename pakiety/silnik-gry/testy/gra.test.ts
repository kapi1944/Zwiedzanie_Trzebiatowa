import { execFileSync as uruchomProces } from "node:child_process";
import {
  readdirSync as odczytajKatalog,
  readFileSync as odczytajPlik,
} from "node:fs";
import {
  type StanGry,
  schematDefinicjiGry,
  schematDefinicjiLokalizacji,
  schematDefinicjiScenkiOpcjonalnej,
  schematDefinicjiWatku,
  schematDefinicjiWyboru,
  schematDefinicjiZadania,
  schematDefinicjiZagadki,
  schematDefinicjiZakonczenia,
  schematDefinicjiZasobu,
  schematManifestuGry,
  schematStanuGry,
  schematWynikuZagadki,
  schematZrodlaHistorycznego,
  type Warunek,
  type ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
import {
  kontynuujNarracje,
  MostNarracji,
  utworzSesjeNarracji,
} from "@zwiedzanie/silnik-narracji";
import { Compiler as KompilatorInk } from "inkjs/full";
import { expect as oczekuj, describe as opisz, it as testuj } from "vitest";
import {
  ocenWarunek,
  przygotujKontekstNarracji,
  wykonajKrok,
  wyznaczProfilZakonczenia,
} from "../src/index.js";
import { utworzDefinicjeTestowe } from "./definicje.js";

const definicje = utworzDefinicjeTestowe();
const start: ZdarzenieGry = {
  rodzaj: "ROZPOCZNIJ_GRE",
  idZdarzenia: "start",
  czas: 100,
  idSesji: "sesja",
};
function rozpocznij(): StanGry {
  return wykonajKrok(definicje, null, start).stan;
}
type DaneZdarzenia = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "czas" | "idZdarzenia">
    : never
  : never;
function krok(stan: StanGry, dane: DaneZdarzenia): StanGry {
  return wykonajKrok(definicje, stan, {
    ...dane,
    czas: 101 + stan.dziennikZdarzen.length,
    idZdarzenia: `zdarzenie_${stan.dziennikZdarzen.length}`,
  } as ZdarzenieGry).stan;
}
function wejdz(): StanGry {
  return krok(rozpocznij(), {
    rodzaj: "WEJDZ_DO_LOKALIZACJI",
    idLokalizacji: "plac",
  });
}
function zakonczGlowny(stan: StanGry): StanGry {
  return krok(krok(stan, { rodzaj: "AKTYWUJ_WATEK", idWatku: "glowny" }), {
    rodzaj: "ZAKONCZ_WATEK",
    idWatku: "glowny",
  });
}
function zamroz<T>(dane: T): T {
  if (dane && typeof dane === "object") {
    Object.freeze(dane);
    for (const wartosc of Object.values(dane)) zamroz(wartosc);
  }
  return dane;
}

opisz("Deterministyczny Silnik Gry", () => {
  testuj("startuje gre i zwraca deklaracje efektow", () => {
    const wynik = wykonajKrok(definicje, null, start);
    oczekuj(wynik.stan.idSesji).toBe("sesja");
    oczekuj(wynik.stan.watki).toEqual({
      glowny: "DOSTEPNY",
      poboczny: "ZABLOKOWANY",
    });
    oczekuj(wynik.efekty).toContainEqual({
      rodzaj: "POKAZ_SCENE",
      id: "start",
    });
    oczekuj(wynik.efekty).toContainEqual({ rodzaj: "ZAPISZ_STAN" });
    oczekuj(wynik.efekty).toContainEqual({ rodzaj: "USTAW_KONTEKST_NARRACJI" });
  });
  testuj("jest deterministyczny i nie mutuje zadnego wejscia", () => {
    const stan = zamroz(wejdz());
    const dane = zamroz(utworzDefinicjeTestowe());
    const zdarzenie = zamroz({
      rodzaj: "DOKONAJ_WYBORU",
      idWyboru: "wybor_a",
      czas: 200,
      idZdarzenia: "wybor",
    } as const);
    const przed = JSON.stringify({ stan, dane, zdarzenie });
    oczekuj(wykonajKrok(dane, stan, zdarzenie)).toEqual(
      wykonajKrok(dane, stan, zdarzenie),
    );
    oczekuj(JSON.stringify({ stan, dane, zdarzenie })).toBe(przed);
  });
  testuj("zapisuje wybor, flage, scene i odblokowuje lokalizacje", () => {
    const stan = krok(wejdz(), {
      rodzaj: "DOKONAJ_WYBORU",
      idWyboru: "wybor_a",
    });
    oczekuj(stan.dokonaneWybory).toEqual(["wybor_a"]);
    oczekuj(stan.flagi.otwarto).toBe(true);
    oczekuj(stan.aktualnaScena).toBe("dalej");
    oczekuj(stan.odblokowaneLokalizacje).toContain("ogrod");
    oczekuj(() =>
      krok(stan, { rodzaj: "DOKONAJ_WYBORU", idWyboru: "wybor_a" }),
    ).toThrow();
  });
  for (const [idWyboru, wartosc] of [
    ["wybor_a", 5],
    ["wybor_b", -5],
  ] as const) {
    testuj(`clampuje powinowactwo po ${idWyboru}`, () => {
      oczekuj(
        krok(wejdz(), { rodzaj: "DOKONAJ_WYBORU", idWyboru }).powinowactwa
          .dowod,
      ).toBe(wartosc);
    });
  }
  for (const [indeks, wynik] of schematWynikuZagadki.options.entries()) {
    testuj(`obsluguje wynik ${wynik} i jego konsekwencje`, () => {
      let stan = krok(wejdz(), {
        rodzaj: "ROZPOCZNIJ_ZAGADKE",
        idZagadki: "zagadka",
      });
      if (wynik === "ROZWIAZANA_Z_PODPOWIEDZIA")
        stan = krok(stan, {
          rodzaj: "POPROS_O_PODPOWIEDZ",
          idZagadki: "zagadka",
        });
      const nowy = krok(stan, {
        rodzaj: "ZAKONCZ_ZAGADKE",
        idZagadki: "zagadka",
        wynik,
      });
      oczekuj(nowy.wynikiZagadek.zagadka).toEqual({
        wynik,
        liczbaProb: 1,
        liczbaPodpowiedzi: wynik === "ROZWIAZANA_Z_PODPOWIEDZIA" ? 1 : 0,
      });
      oczekuj(nowy.powinowactwa.dowod).toBe(indeks + 1);
      oczekuj(nowy.aktywnaZagadka).toBeNull();
    });
  }
  testuj("nieudana proba pozwala ponowic lub pominac zagadke", () => {
    const stan = krok(
      krok(wejdz(), { rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki: "zagadka" }),
      { rodzaj: "ZAKONCZ_ZAGADKE", idZagadki: "zagadka", wynik: "NIEUDANA" },
    );
    oczekuj(
      krok(stan, { rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki: "zagadka" })
        .postepyZagadek.zagadka?.liczbaProb,
    ).toBe(2);
    oczekuj(
      krok(stan, { rodzaj: "POMIN_ZAGADKE", idZagadki: "zagadka" })
        .pominieteZagadki,
    ).toEqual(["zagadka"]);
  });
  testuj("pomija zagadke bez proby i nie przyznaje wyniku ponownie", () => {
    const stan = krok(wejdz(), {
      rodzaj: "POMIN_ZAGADKE",
      idZagadki: "zagadka",
    });
    oczekuj(stan.wynikiZagadek.zagadka?.liczbaProb).toBe(0);
    oczekuj(() =>
      krok(stan, { rodzaj: "POMIN_ZAGADKE", idZagadki: "zagadka" }),
    ).toThrow();
  });
  testuj("kontroluje podpowiedzi i zgodnosc wyniku", () => {
    const stan = krok(wejdz(), {
      rodzaj: "ROZPOCZNIJ_ZAGADKE",
      idZagadki: "zagadka",
    });
    oczekuj(() =>
      krok(stan, {
        rodzaj: "ZAKONCZ_ZAGADKE",
        idZagadki: "zagadka",
        wynik: "ROZWIAZANA_Z_PODPOWIEDZIA",
      }),
    ).toThrow();
    const zPodpowiedzia = krok(stan, {
      rodzaj: "POPROS_O_PODPOWIEDZ",
      idZagadki: "zagadka",
    });
    oczekuj(zPodpowiedzia.uzytePodpowiedzi.zagadka).toBe(1);
    oczekuj(() =>
      krok(zPodpowiedzia, {
        rodzaj: "POPROS_O_PODPOWIEDZ",
        idZagadki: "zagadka",
      }),
    ).toThrow();
    oczekuj(() =>
      krok(zPodpowiedzia, {
        rodzaj: "ZAKONCZ_ZAGADKE",
        idZagadki: "zagadka",
        wynik: "ROZWIAZANA_SAMODZIELNIE",
      }),
    ).toThrow();
  });
  testuj("aktywuje i konczy watek tylko w legalnej kolejnosci", () => {
    const stan = rozpocznij();
    oczekuj(() =>
      krok(stan, { rodzaj: "ZAKONCZ_WATEK", idWatku: "glowny" }),
    ).toThrow();
    oczekuj(() =>
      krok(stan, { rodzaj: "AKTYWUJ_WATEK", idWatku: "poboczny" }),
    ).toThrow();
    oczekuj(zakonczGlowny(stan).watki.glowny).toBe("UKONCZONY");
  });
  testuj("pozwala pominac watek opcjonalny", () => {
    const stan = krok(rozpocznij(), {
      rodzaj: "POMIN_WATEK",
      idWatku: "poboczny",
    });
    oczekuj(stan.watki.poboczny).toBe("POMINIETY");
    oczekuj(() =>
      krok(stan, { rodzaj: "POMIN_WATEK", idWatku: "glowny" }),
    ).toThrow();
  });
  testuj(
    "przedmiot odblokowuje watek i scenke, usuniecie nie blokuje finalu",
    () => {
      let stan = rozpocznij();
      oczekuj(() =>
        krok(stan, { rodzaj: "OTWORZ_SCENKE", idScenki: "scenka" }),
      ).toThrow();
      stan = krok(stan, { rodzaj: "DODAJ_PRZEDMIOT", idPrzedmiotu: "klucz" });
      oczekuj(stan.watki.poboczny).toBe("DOSTEPNY");
      stan = krok(stan, { rodzaj: "OTWORZ_SCENKE", idScenki: "scenka" });
      oczekuj(stan.odkryteScenki).toEqual(["scenka"]);
      oczekuj(stan.aktualnaScena).toBe("scena_dodatkowa");
      stan = krok(stan, { rodzaj: "USUN_PRZEDMIOT", idPrzedmiotu: "klucz" });
      oczekuj(
        wyznaczProfilZakonczenia(definicje, zakonczGlowny(stan))
          .zakonczenieGlowne,
      ).toBe("bazowe");
    },
  );
  testuj("obecnosc jest potwierdzana zdarzeniem bez GPS", () => {
    oczekuj(() =>
      krok(rozpocznij(), {
        rodzaj: "POTWIERDZ_OBECNOSC",
        idLokalizacji: "plac",
      }),
    ).toThrow();
    oczekuj(
      krok(wejdz(), { rodzaj: "POTWIERDZ_OBECNOSC", idLokalizacji: "plac" })
        .potwierdzoneLokalizacje,
    ).toEqual(["plac"]);
  });
  testuj("odrzuca nieznane id, zablokowana lokacje i niewlasciwa scene", () => {
    for (const dane of [
      { rodzaj: "DODAJ_PRZEDMIOT", idPrzedmiotu: "obcy" },
      { rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "ogrod" },
      { rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki: "zagadka" },
    ] as const)
      oczekuj(() => krok(rozpocznij(), dane)).toThrow();
  });
  testuj("odrzuca duplikat zdarzenia i czas z przeszlosci", () => {
    const stan = rozpocznij();
    oczekuj(() =>
      wykonajKrok(definicje, stan, {
        rodzaj: "WZNOW_GRE",
        czas: 200,
        idZdarzenia: "start",
      }),
    ).toThrow();
    oczekuj(() =>
      wykonajKrok(definicje, stan, {
        rodzaj: "WZNOW_GRE",
        czas: 1,
        idZdarzenia: "obce",
      }),
    ).toThrow();
    oczekuj(() => wykonajKrok(definicje, stan, start)).toThrow();
  });
  testuj("stan jest serializowalny, wznowienie zachowuje mechanike", () => {
    const stan = wejdz();
    const odtworzony = schematStanuGry.parse(JSON.parse(JSON.stringify(stan)));
    oczekuj(odtworzony).toEqual(stan);
    const nowy = krok(odtworzony, { rodzaj: "WZNOW_GRE" });
    oczekuj(nowy.aktualnaScena).toBe(stan.aktualnaScena);
    oczekuj(nowy.odwiedzoneLokalizacje).toEqual(stan.odwiedzoneLokalizacje);
  });
  testuj("odtwarza stan i efekty przez replay dziennika", () => {
    const docelowy = zakonczGlowny(
      krok(wejdz(), { rodzaj: "DOKONAJ_WYBORU", idWyboru: "wybor_b" }),
    );
    let odtworzony: StanGry | null = null;
    for (const zdarzenie of docelowy.dziennikZdarzen)
      odtworzony = wykonajKrok(definicje, odtworzony, zdarzenie).stan;
    oczekuj(odtworzony).toEqual(docelowy);
  });
  testuj(
    "kontekst narracji jest kopia, a sygnal nie jest poleceniem gry",
    () => {
      const stan = wejdz();
      const kopia = JSON.stringify(stan);
      const kontekst = przygotujKontekstNarracji(stan);
      (kontekst.flagi as Record<string, boolean>).obca = true;
      const sygnal = { rodzaj: "sygnal", wartosc: "odkryto_trop" };
      oczekuj(() =>
        wykonajKrok(definicje, stan, sygnal as unknown as ZdarzenieGry),
      ).toThrow();
      oczekuj(JSON.stringify(stan)).toBe(kopia);
    },
  );
  testuj("Ink i Most transportuja sygnal bez mutowania StanGry", () => {
    const stan = rozpocznij();
    const przed = JSON.stringify(stan);
    const most = new MostNarracji(przygotujKontekstNarracji(stan));
    const tresc = new KompilatorInk(
      "Tekst techniczny. #sygnal:odkryto_trop\n-> END",
    )
      .Compile()
      .ToJson();
    if (typeof tresc !== "string") throw new Error("Brak historii testowej.");
    const sesja = utworzSesjeNarracji(tresc, most);
    const sygnaly = most.odczytajSygnaly(kontynuujNarracje(sesja).tagi);
    oczekuj(sygnaly).toEqual(["odkryto_trop"]);
    oczekuj(JSON.stringify(stan)).toBe(przed);
    const poDecyzji = krok(stan, {
      rodzaj: "DODAJ_PRZEDMIOT",
      idPrzedmiotu: "klucz",
    });
    oczekuj(poDecyzji.sladyIPrzedmioty).toEqual(["klucz"]);
    oczekuj(stan.sladyIPrzedmioty).toEqual([]);
  });
  testuj("dziala w Node bez DOM i bez niedeterministycznych zrodel", () => {
    oczekuj("window" in globalThis).toBe(false);
    oczekuj("document" in globalThis).toBe(false);
    for (const nazwa of odczytajKatalog(new URL("../src/", import.meta.url))) {
      const kod = odczytajPlik(
        new URL(`../src/${nazwa}`, import.meta.url),
        "utf8",
      );
      oczekuj(kod).not.toMatch(
        /Date\.now|Math\.random|\b(?:window|document|navigator|localStorage|IndexedDB)\b|\beval\s*\(|\bFunction\s*\(/,
      );
      oczekuj(kod).not.toMatch(/from\s+["'](?:react|react-dom|inkjs)/);
    }
  });
  testuj("walidacja dziala przy zakazie generowania kodu z tekstu", () => {
    const wynik = uruchomProces(
      process.execPath,
      [
        "--disallow-code-generation-from-strings",
        "--input-type=module",
        "-e",
        'import { schematWarunku } from "@zwiedzanie/schemat-tresci"; schematWarunku.parse({rodzaj:"flagaJest",id:"test",wartosc:true});',
      ],
      { encoding: "utf8" },
    );
    oczekuj(wynik).toBe("");
  });
});

opisz("Warunki i profile zakonczen", () => {
  testuj("wszystkie, dowolny i nie oraz puste listy", () => {
    const stan = wejdz();
    const prawda: Warunek = { rodzaj: "odwiedzono", id: "plac" };
    const falsz: Warunek = { rodzaj: "posiadaPrzedmiot", id: "klucz" };
    oczekuj(
      ocenWarunek(
        {
          rodzaj: "wszystkie",
          warunki: [prawda, { rodzaj: "nie", warunek: falsz }],
        },
        stan,
      ),
    ).toBe(true);
    oczekuj(
      ocenWarunek({ rodzaj: "dowolny", warunki: [falsz, prawda] }, stan),
    ).toBe(true);
    oczekuj(ocenWarunek({ rodzaj: "wszystkie", warunki: [] }, stan)).toBe(true);
    oczekuj(ocenWarunek({ rodzaj: "dowolny", warunki: [] }, stan)).toBe(false);
  });
  for (const warunek of [
    { rodzaj: "eval", kod: "true" },
    { rodzaj: "nie" },
    { rodzaj: "flagaJest", id: "x", wartosc: "true" },
    { rodzaj: "wszystkie", warunki: [{ rodzaj: "obcy" }] },
  ]) {
    testuj(`odrzuca bledny warunek ${JSON.stringify(warunek)}`, () =>
      oczekuj(() => ocenWarunek(warunek, rozpocznij())).toThrow(),
    );
  }
  testuj("obsluguje wszystkie liscie DSL", () => {
    let stan = krok(wejdz(), { rodzaj: "DOKONAJ_WYBORU", idWyboru: "wybor_a" });
    stan = krok(stan, { rodzaj: "DODAJ_PRZEDMIOT", idPrzedmiotu: "klucz" });
    stan = krok(stan, { rodzaj: "OTWORZ_SCENKE", idScenki: "scenka" });
    stan = krok(stan, { rodzaj: "POMIN_ZAGADKE", idZagadki: "zagadka" });
    const warunki: Warunek[] = [
      { rodzaj: "flagaJest", id: "otwarto", wartosc: true },
      { rodzaj: "wynikZagadkiJest", id: "zagadka", wynik: "POMINIETA" },
      { rodzaj: "posiadaPrzedmiot", id: "klucz" },
      { rodzaj: "odwiedzono", id: "plac" },
      { rodzaj: "stanWatkuJest", id: "poboczny", stan: "DOSTEPNY" },
      { rodzaj: "powinowactwoCoNajmniej", os: "dowod", wartosc: 5 },
      { rodzaj: "wybrano", id: "wybor_a" },
      { rodzaj: "odkrytoScenke", id: "scenka" },
    ];
    oczekuj(ocenWarunek({ rodzaj: "wszystkie", warunki }, stan)).toBe(true);
  });
  testuj(
    "rozne wybory daja rozne profile, optional content nie blokuje",
    () => {
      const bazowy = zakonczGlowny(rozpocznij());
      const dowod = zakonczGlowny(
        krok(wejdz(), { rodzaj: "DOKONAJ_WYBORU", idWyboru: "wybor_a" }),
      );
      oczekuj(wyznaczProfilZakonczenia(definicje, bazowy)).toEqual({
        zakonczenieGlowne: "bazowe",
        epilogiWatkow: [],
        specjalneOdkrycia: [],
        konsekwencjeZagadek: [],
      });
      oczekuj(
        wyznaczProfilZakonczenia(definicje, dowod).zakonczenieGlowne,
      ).toBe("dowod");
      oczekuj(() =>
        wyznaczProfilZakonczenia(definicje, rozpocznij()),
      ).toThrow();
    },
  );
  testuj("komponuje epilogi, odkrycia i konsekwencje zagadek", () => {
    let stan = krok(wejdz(), {
      rodzaj: "DODAJ_PRZEDMIOT",
      idPrzedmiotu: "klucz",
    });
    stan = krok(krok(stan, { rodzaj: "AKTYWUJ_WATEK", idWatku: "poboczny" }), {
      rodzaj: "ZAKONCZ_WATEK",
      idWatku: "poboczny",
    });
    stan = zakonczGlowny(
      krok(stan, { rodzaj: "POMIN_ZAGADKE", idZagadki: "zagadka" }),
    );
    const profil = wyznaczProfilZakonczenia(definicje, stan);
    oczekuj(profil.epilogiWatkow).toEqual(["epilog"]);
    oczekuj(profil.specjalneOdkrycia).toEqual(["odkrycie"]);
    oczekuj(profil.konsekwencjeZagadek).toEqual(["konsekwencja"]);
  });
  testuj("jawnie wymagany optional watek moze blokowac final", () => {
    const dane = utworzDefinicjeTestowe();
    const watek = dane.watki.find((element) => element.id === "poboczny");
    if (!watek) throw new Error("Brak watku testowego.");
    watek.wymaganyDoFinalu = true;
    oczekuj(() =>
      wyznaczProfilZakonczenia(dane, zakonczGlowny(rozpocznij())),
    ).toThrow();
  });
});

opisz("Schemat Tresci i danych runtime", () => {
  for (const [nazwa, schemat, dane] of [
    ["manifest", schematManifestuGry, definicje.manifest],
    ["lokalizacja", schematDefinicjiLokalizacji, definicje.lokalizacje[0]],
    ["watek", schematDefinicjiWatku, definicje.watki[0]],
    ["zadanie", schematDefinicjiZadania, definicje.zadania[0]],
    ["zagadka", schematDefinicjiZagadki, definicje.zagadki[0]],
    ["scenka", schematDefinicjiScenkiOpcjonalnej, definicje.scenki[0]],
    ["wybor", schematDefinicjiWyboru, definicje.wybory[0]],
    ["zakonczenie", schematDefinicjiZakonczenia, definicje.zakonczenia[0]],
    [
      "zrodlo",
      schematZrodlaHistorycznego,
      {
        id: "zrodlo",
        tytul: "Źródło testowe",
        opisBibliograficzny: "Opis testowy",
      },
    ],
    ["zasob", schematDefinicjiZasobu, definicje.zasoby[0]],
  ] as const) {
    testuj(`waliduje ${nazwa} i odrzuca brak danych oraz obce pola`, () => {
      oczekuj(schemat.safeParse(dane).success).toBe(true);
      oczekuj(schemat.safeParse({}).success).toBe(false);
      oczekuj(schemat.safeParse({ ...dane, obcePole: true }).success).toBe(
        false,
      );
    });
  }
  for (const klasyfikacja of [
    "FAKT",
    "TRADYCJA",
    "LEGENDA",
    "SPORNE",
    "FABULARYZOWANE",
  ] as const) {
    testuj(`obsluguje klasyfikacje ${klasyfikacja} bez wymyslonej daty`, () => {
      const dane = utworzDefinicjeTestowe();
      const lokalizacja = dane.lokalizacje[0];
      if (!lokalizacja) throw new Error("Brak lokalizacji.");
      lokalizacja.klasyfikacja = klasyfikacja;
      lokalizacja.idZrodla = ["zrodlo"];
      dane.zrodla.push({
        id: "zrodlo",
        tytul: "Test",
        opisBibliograficzny: "Test techniczny",
      });
      oczekuj(
        schematDefinicjiGry.parse(dane).lokalizacje[0]
          ?.zweryfikowanoTerenowoDnia,
      ).toBeUndefined();
    });
  }
  testuj(
    "odrzuca duplikaty, nieznane odwolania i brak zakonczenia domyslnego",
    () => {
      const dane = utworzDefinicjeTestowe();
      oczekuj(() =>
        schematDefinicjiGry.parse({
          ...dane,
          lokalizacje: [...dane.lokalizacje, dane.lokalizacje[0]],
        }),
      ).toThrow();
      oczekuj(() =>
        schematDefinicjiGry.parse({ ...dane, zakonczenia: [] }),
      ).toThrow();
      oczekuj(() =>
        schematDefinicjiGry.parse({ ...dane, przedmioty: [] }),
      ).toThrow();
      oczekuj(() =>
        schematDefinicjiGry.parse({ ...dane, lokalizacje: [] }),
      ).toThrow();
    },
  );
  testuj(
    "odrzuca niepoprawna date, historyczny element bez zrodla i zlosliwe id",
    () => {
      const dane = utworzDefinicjeTestowe();
      oczekuj(
        schematDefinicjiLokalizacji.safeParse({
          ...dane.lokalizacje[0],
          zweryfikowanoTerenowoDnia: "2026-02-30",
        }).success,
      ).toBe(false);
      oczekuj(
        schematDefinicjiLokalizacji.safeParse({
          ...dane.lokalizacje[0],
          id: "constructor",
        }).success,
      ).toBe(false);
      oczekuj(() =>
        schematDefinicjiGry.parse({
          ...dane,
          lokalizacje: dane.lokalizacje.map((element) => ({
            ...element,
            klasyfikacja: "FAKT",
          })),
        }),
      ).toThrow();
    },
  );
  testuj("odrzuca niezgodna wersje i uszkodzony stan bez mutacji", () => {
    const stan = rozpocznij();
    oczekuj(() =>
      krok({ ...stan, wersjaTresci: "inna" }, { rodzaj: "WZNOW_GRE" }),
    ).toThrow();
    oczekuj(() =>
      krok({ ...stan, sladyIPrzedmioty: ["obcy"] }, { rodzaj: "WZNOW_GRE" }),
    ).toThrow();
    oczekuj(() =>
      krok(
        { ...stan, powinowactwa: { ...stan.powinowactwa, dowod: 99 } },
        { rodzaj: "WZNOW_GRE" },
      ),
    ).toThrow();
    oczekuj(() =>
      krok({ ...stan, dziennikZdarzen: [] }, { rodzaj: "WZNOW_GRE" }),
    ).toThrow();
  });
});
