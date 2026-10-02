import {
  readdirSync as odczytajKatalog,
  readFileSync as odczytajPlik,
} from "node:fs";
import { Compiler as KompilatorInk } from "inkjs/full";
import { expect as oczekuj, describe as opisz, it as testuj } from "vitest";
import type {
  KontekstNarracji,
  RamkaNarracji,
  SesjaNarracji,
} from "../src/index.js";
import {
  eksportujStanNarracji,
  kontynuujNarracje,
  MostNarracji,
  parsujTagiNarracji,
  przywrocStanNarracji,
  utworzSesjeNarracji,
  wybierzOpcjeNarracji,
} from "../src/index.js";

function kompiluj(zrodlo: string): string {
  const kompilator = new KompilatorInk(zrodlo);
  const wynik = kompilator.Compile().ToJson();
  oczekuj(kompilator.errors).toEqual([]);
  if (typeof wynik !== "string")
    throw new Error("Brak skompilowanej historii.");
  return wynik;
}

const tresc = kompiluj(
  odczytajPlik(new URL("./fixtures/testowa.ink", import.meta.url), "utf8"),
);

function czytajDoWyboru(sesja: SesjaNarracji): RamkaNarracji {
  const akapity: string[] = [];
  const tagi: RamkaNarracji["tagi"] = [];
  for (let krok = 0; krok < 100; krok++) {
    const ramka = kontynuujNarracje(sesja);
    akapity.push(...ramka.akapity);
    tagi.push(...ramka.tagi);
    if (!ramka.moznaKontynuowac) return { ...ramka, akapity, tagi };
  }
  throw new Error("Historia nie zatrzymala sie w limicie testu.");
}

function rozpocznijDroge(indeks: number): SesjaNarracji {
  const sesja = utworzSesjeNarracji(tresc);
  czytajDoWyboru(sesja);
  wybierzOpcjeNarracji(sesja, indeks);
  return sesja;
}

const kontekst: KontekstNarracji = {
  flagi: { trop: true },
  wynikiZagadek: { proba: "POMINIETA" },
  stanyWatkow: { zapis: "aktywny" },
  sladyIPrzedmioty: ["kartka"],
  powinowactwa: { pamiec: 2 },
  odwiedzoneLokalizacje: ["plac"],
  dokonaneWybory: ["wybor_a"],
};

opisz("Silnik Narracji w Node", () => {
  testuj("nie wymaga DOM", () => {
    oczekuj("document" in globalThis).toBe(false);
    oczekuj("window" in globalThis).toBe(false);
    oczekuj(utworzSesjeNarracji(tresc)).toEqual({ rodzaj: "sesja-narracji" });
  });

  testuj("uruchamia historie i zwraca dwie opcje", () => {
    const ramka = czytajDoWyboru(utworzSesjeNarracji(tresc));
    oczekuj(ramka.akapity.join(" ")).toContain("START");
    oczekuj(ramka.opcje.map((opcja) => opcja.tekst)).toEqual([
      "Podążam za tym, co zapisano.",
      "Podążam za tym, co zapamiętano.",
    ]);
    oczekuj(ramka.moznaKontynuowac).toBe(false);
    oczekuj(ramka.tagi).toContainEqual({
      rodzaj: "nastroj",
      wartosc: "tajemnica",
    });
  });

  for (const [indeks, fragment, konsekwencja, obcyFragment] of [
    [0, "czytasz notatkę", "przeczytanej notatki", "usłyszanego wspomnienia"],
    [
      1,
      "słuchasz krótkiego wspomnienia",
      "usłyszanego wspomnienia",
      "przeczytanej notatki",
    ],
  ] as const) {
    testuj(`droga ${indeks} rozgalezia, zbiega i pamieta wybor`, () => {
      const ramka = czytajDoWyboru(rozpocznijDroge(indeks));
      const tekst = ramka.akapity.join(" ");
      oczekuj(tekst).toContain(fragment);
      oczekuj(tekst).toContain("Obie drogi");
      oczekuj(tekst).toContain(konsekwencja);
      oczekuj(tekst).not.toContain(obcyFragment);
      oczekuj(tekst.indexOf("Obie drogi")).toBeLessThan(
        tekst.indexOf("Później"),
      );
      oczekuj(ramka.opcje).toHaveLength(2);
      oczekuj(ramka.tagi).toContainEqual({
        rodzaj: "sygnal",
        wartosc: "odkryto_trop",
      });
    });

    testuj(`eksport i nowa instancja pamietaja droge ${indeks}`, () => {
      const sesja = rozpocznijDroge(indeks);
      const zapis = eksportujStanNarracji(sesja);
      oczekuj(JSON.parse(zapis).stanInk).toEqual(oczekuj.any(String));
      const nowaSesja = utworzSesjeNarracji(tresc);
      przywrocStanNarracji(nowaSesja, zapis);
      const przywrocona = czytajDoWyboru(nowaSesja);
      oczekuj(przywrocona).toEqual(czytajDoWyboru(sesja));
      oczekuj(przywrocona.akapity.join(" ")).toContain(konsekwencja);
    });
  }

  testuj("przywraca stan oczekujacy na wybor", () => {
    const sesja = utworzSesjeNarracji(tresc);
    const poczatek = czytajDoWyboru(sesja);
    const nowa = utworzSesjeNarracji(tresc);
    przywrocStanNarracji(nowa, eksportujStanNarracji(sesja));
    oczekuj(kontynuujNarracje(nowa).opcje).toEqual(poczatek.opcje);
    wybierzOpcjeNarracji(nowa, 1);
    oczekuj(czytajDoWyboru(nowa).akapity.join(" ")).toContain(
      "usłyszanego wspomnienia",
    );
  });

  testuj("kolejne rozgalezienie prowadzi do konca", () => {
    for (const indeks of [0, 1]) {
      const sesja = rozpocznijDroge(0);
      czytajDoWyboru(sesja);
      wybierzOpcjeNarracji(sesja, indeks);
      const ramka = czytajDoWyboru(sesja);
      oczekuj(ramka.akapity.join(" ")).toContain(
        indeks === 0 ? "nowy wątek" : "wspólnej drogi",
      );
      oczekuj(ramka.opcje).toEqual([]);
      oczekuj(ramka.moznaKontynuowac).toBe(false);
      oczekuj(kontynuujNarracje(sesja).akapity).toEqual([]);
    }
  });

  testuj("odrzuca niewlasciwy wybor i nieznana sesje", () => {
    const sesja = utworzSesjeNarracji(tresc);
    oczekuj(() => wybierzOpcjeNarracji(sesja, 0)).toThrow();
    czytajDoWyboru(sesja);
    for (const indeks of [-1, 2, 0.5, Number.NaN])
      oczekuj(() => wybierzOpcjeNarracji(sesja, indeks)).toThrow();
    oczekuj(() => kontynuujNarracje({ rodzaj: "sesja-narracji" })).toThrow();
  });

  testuj("odrzuca inna historie i uszkodzony zapis bez zmiany sesji", () => {
    const sesja = rozpocznijDroge(0);
    const zapis = eksportujStanNarracji(sesja);
    const inna = utworzSesjeNarracji(kompiluj("Inna historia.\n-> END"));
    oczekuj(() => przywrocStanNarracji(inna, zapis)).toThrow();
    for (const uszkodzony of [
      "{",
      "null",
      "{}",
      JSON.stringify({ ...JSON.parse(zapis), stanInk: "{}" }),
    ]) {
      oczekuj(() => przywrocStanNarracji(sesja, uszkodzony)).toThrow();
      oczekuj(eksportujStanNarracji(sesja)).toBe(zapis);
    }
  });

  testuj("nie udostepnia funkcji zewnetrznych Ink", () => {
    const zewnetrzna = kompiluj("EXTERNAL obcy_kod()\n~ obcy_kod()\n-> END");
    oczekuj(() => utworzSesjeNarracji(zewnetrzna)).toThrow();
  });

  testuj("zrodla runtime nie importuja Reacta, DOM ani kompilatora", () => {
    const katalog = new URL("../src/", import.meta.url);
    for (const nazwa of odczytajKatalog(katalog)) {
      const kod = odczytajPlik(new URL(nazwa, katalog), "utf8");
      oczekuj(kod).not.toMatch(/from\s+["'](?:react|react-dom|inkjs\/full)/);
      oczekuj(kod).not.toMatch(/\b(?:document|window|HTMLElement)\b/);
      oczekuj(kod).not.toMatch(/\beval\s*\(|new\s+Function\s*\(/);
    }
  });

  testuj("pakiet runtime nie zalezy od tresci konkretnej gry", () => {
    const katalog = new URL("../", import.meta.url);
    const pliki = [
      "package.json",
      "tsconfig.json",
      ...odczytajKatalog(new URL("src/", katalog)).map(
        (nazwa) => `src/${nazwa}`,
      ),
    ];
    for (const plik of pliki) {
      oczekuj(odczytajPlik(new URL(plik, katalog), "utf8")).not.toMatch(
        /tresc[\\/]trzebiatow-v1/,
      );
    }
    const manifest = JSON.parse(
      odczytajPlik(new URL("package.json", katalog), "utf8"),
    );
    oczekuj(manifest.scripts.build).toBe("tsc");
    oczekuj(czytajDoWyboru(utworzSesjeNarracji(tresc)).opcje).toHaveLength(2);
  });
});

opisz("Kontrolowane tagi i Most Narracji", () => {
  testuj(
    "transportuje nowy sygnal z Ink bez zmiany danych kanonicznych",
    () => {
      const kopia = structuredClone(kontekst);
      const most = new MostNarracji(kontekst);
      const sesja = utworzSesjeNarracji(
        kompiluj("Tekst. #sygnal:zakonczono_scene\n-> END"),
        most,
      );
      const ramka = czytajDoWyboru(sesja);
      oczekuj(most.odczytajSygnaly(ramka.tagi)).toEqual(["zakonczono_scene"]);
      oczekuj(kontekst).toEqual(kopia);
    },
  );
  testuj("rozpoznaje cztery dozwolone rodzaje i wartosci", () => {
    oczekuj(
      parsujTagiNarracji([
        "#dzwiek:przewrocenie_kartki",
        "nastroj:tajemnica",
        "kronika:hansken",
        "sygnal:odkryto_trop",
      ]),
    ).toEqual([
      { rodzaj: "dzwiek", wartosc: "przewrocenie_kartki" },
      { rodzaj: "nastroj", wartosc: "tajemnica" },
      { rodzaj: "kronika", wartosc: "hansken" },
      { rodzaj: "sygnal", wartosc: "odkryto_trop" },
    ]);
  });

  testuj("nieznane i zlosliwe tagi sa ignorowane bez wykonania kodu", () => {
    const tagi = [
      "kod:globalThis.__wykonano = true",
      "sygnal:obcy_kod()",
      "sygnal:https://obcy",
      "sygnal:../plik",
      "dzwiek:../plik",
      "constructor:odkryto_trop",
      "nastroj:tajemnica:obcy",
    ];
    oczekuj(parsujTagiNarracji(tagi)).toEqual([]);
    oczekuj("__wykonano" in globalThis).toBe(false);
    const sesja = utworzSesjeNarracji(
      kompiluj("Tekst. #kod:obcy_kod()\n-> END"),
    );
    oczekuj(czytajDoWyboru(sesja).tagi).toEqual([]);
  });

  testuj("most przekazuje tylko jawne powiazania wszystkich obszarow", () => {
    const most = new MostNarracji(kontekst, [
      { zmiennaInk: "trop", obszar: "flagi", klucz: "trop" },
      { zmiennaInk: "wynik", obszar: "wynikiZagadek", klucz: "proba" },
      { zmiennaInk: "watek", obszar: "stanyWatkow", klucz: "zapis" },
      { zmiennaInk: "kartka", obszar: "sladyIPrzedmioty", klucz: "kartka" },
      { zmiennaInk: "pamiec", obszar: "powinowactwa", klucz: "pamiec" },
      { zmiennaInk: "plac", obszar: "odwiedzoneLokalizacje", klucz: "plac" },
      { zmiennaInk: "wybor", obszar: "dokonaneWybory", klucz: "wybor_a" },
    ]);
    oczekuj(Object.fromEntries(most.odczytajZmienne())).toEqual({
      trop: true,
      wynik: "POMINIETA",
      watek: "aktywny",
      kartka: true,
      pamiec: 2,
      plac: true,
      wybor: true,
    });
    oczekuj(new MostNarracji(kontekst).odczytajZmienne().size).toBe(0);
  });

  testuj(
    "Ink czyta kopie kontekstu, a zmiany Ink nie zmieniaja danych kanonicznych",
    () => {
      const most = new MostNarracji(kontekst, [
        { zmiennaInk: "trop", obszar: "flagi", klucz: "trop" },
      ]);
      const historia = kompiluj(
        "VAR trop = false\n{trop: Znasz trop.| Nie znasz tropu.}\n~ trop = false\nTrop: {trop}.\n-> END",
      );
      const sesja = utworzSesjeNarracji(historia, most);
      oczekuj(kontynuujNarracje(sesja).akapity.join(" ")).toContain(
        "Znasz trop.",
      );
      oczekuj(kontekst.flagi.trop).toBe(true);
      most.aktualizujKontekst({ ...kontekst, flagi: { trop: false } });
      oczekuj(kontekst.flagi.trop).toBe(true);
      oczekuj(most.odczytajZmienne().get("trop")).toBe(false);
    },
  );

  testuj("przywrocenie stanu ponownie stosuje aktualny kontekst mostu", () => {
    const most = new MostNarracji(kontekst, [
      { zmiennaInk: "trop", obszar: "flagi", klucz: "trop" },
    ]);
    const historia = kompiluj(
      "VAR trop = false\nPoczatek.\n* [Dalej]\n    {trop: Znasz trop.| Nie znasz tropu.}\n    -> END",
    );
    const sesja = utworzSesjeNarracji(historia, most);
    czytajDoWyboru(sesja);
    wybierzOpcjeNarracji(sesja, 0);
    const zapis = eksportujStanNarracji(sesja);
    most.aktualizujKontekst({ ...kontekst, flagi: { trop: false } });
    const nowa = utworzSesjeNarracji(historia, most);
    przywrocStanNarracji(nowa, zapis);
    oczekuj(czytajDoWyboru(nowa).akapity.join(" ")).toContain(
      "Nie znasz tropu.",
    );
  });

  testuj("odrzuca brakujace zmienne i niezgodne typy", () => {
    const most = new MostNarracji(kontekst, [
      { zmiennaInk: "trop", obszar: "flagi", klucz: "trop" },
    ]);
    oczekuj(() => utworzSesjeNarracji(tresc, most)).toThrow();
    oczekuj(() =>
      utworzSesjeNarracji(kompiluj('VAR trop = "tekst"\nTekst.\n-> END'), most),
    ).toThrow();
    oczekuj(
      () =>
        new MostNarracji(kontekst, [
          { zmiennaInk: "obcy()", obszar: "flagi", klucz: "trop" },
        ]),
    ).toThrow();
    oczekuj(() =>
      new MostNarracji(kontekst, [
        { zmiennaInk: "trop", obszar: "flagi", klucz: "brak" },
      ]).odczytajZmienne(),
    ).toThrow();
  });

  testuj(
    "most zwraca tylko dozwolone sygnaly, bez automatycznej mechaniki",
    () => {
      const most = new MostNarracji(kontekst);
      oczekuj(
        most.odczytajSygnaly([
          { rodzaj: "sygnal", wartosc: "odkryto_trop" },
          { rodzaj: "sygnal", wartosc: "obcy" },
          { rodzaj: "sygnal", wartosc: "obcy_kod()" },
          { rodzaj: "sygnal", wartosc: "../plik" },
          { rodzaj: "nastroj", wartosc: "tajemnica" },
        ]),
      ).toEqual(["odkryto_trop", "obcy"]);
      oczekuj(kontekst.flagi.trop).toBe(true);
    },
  );
});
