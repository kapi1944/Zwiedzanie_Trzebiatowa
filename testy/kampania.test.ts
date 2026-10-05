import { createHash as utworzHash } from "node:crypto";
import {
  schematDefinicjiGry,
  schematInformacjiHistorycznej,
  schematKandydataMiejsca,
  schematKandydataZadaniaTerenowego,
  schematRejestruMiejsc,
} from "@zwiedzanie/schemat-tresci";
import {
  przygotujKontekstNarracji,
  wykonajKrok,
  wyznaczProfilZakonczenia,
} from "@zwiedzanie/silnik-gry";
import { expect as oczekuj, describe as opisz, test as testuj } from "vitest";
import {
  przejdzKampanie,
  sprawdzGrafKampanii,
} from "../narzedzia/graf-kampanii.ts";
import { sprawdzNarracje } from "../narzedzia/narracja-slice.ts";
import {
  odczytajBankMiejsc,
  odczytajKampanie,
  sprawdzPowiazaniaMiejsc,
} from "../narzedzia/pakiet-kampanii.ts";
import {
  sprawdzRegulyZakonczen,
  sprawdzSwiadectwaZakonczen,
} from "../narzedzia/reguly-zakonczen.ts";
import {
  dostepneWezly,
  odczytajSiecNarracyjna,
  sprawdzSiecNarracyjna,
} from "../narzedzia/siec-narracyjna.ts";
import { analizujFlagi } from "../narzedzia/walidacja-contentu.ts";
import geometria from "../tresc/mapa/geometria.json";

const pakiet = odczytajKampanie();
opisz("Model kampanii", () => {
  testuj(
    "bank dopuszcza od jednego do trzech kandydatow bez wyboru finalnego",
    () => {
      const bank = odczytajBankMiejsc();
      for (const liczba of [1, 2, 3]) {
        const dane = structuredClone(bank);
        const miejsce = dane[0];
        if (!miejsce) throw new Error("Brak miejsca.");
        miejsce.kandydaciZadan = miejsce.kandydaciZadan.slice(0, liczba);
        oczekuj(schematRejestruMiejsc.safeParse(dane).success).toBe(true);
      }
    },
  );
  testuj(
    "odrzuca quizy binarne, brak obecnosci, zaleznosci i aktywacje kandydata",
    () => {
      const zadanie = odczytajBankMiejsc()[0]?.kandydaciZadan[0];
      if (!zadanie) throw new Error("Brak kandydata.");
      for (const zmiana of [
        { typ: "PRAWDA_FALSZ" },
        { polecenie: "Czy rynek jest stary? Odpowiedz tak lub nie." },
        { polecenie: "Wybierz prawda albo fałsz." },
        { wymagaObecnosci: false },
        { celObserwacji: " " },
        { zrodla: [] },
        { zrodla: ["s1", "s1"] },
        { rekonesans: [] },
        { statusWykorzystania: "AKTYWNE" },
        { zaleznosci: ["bank_01_zadanie_b"] },
      ])
        oczekuj(
          schematKandydataZadaniaTerenowego.safeParse({ ...zadanie, ...zmiana })
            .success,
        ).toBe(false);
    },
  );
  testuj(
    "odpowiedz wymaga oględzin i protokolu, zrodlo pisane nie zatwierdza klucza",
    () => {
      const zadanie = odczytajBankMiejsc()[0]?.kandydaciZadan[0];
      if (!zadanie) throw new Error("Brak kandydata.");
      for (const zmiana of [
        { odpowiedz: "5" },
        { statusOdpowiedzi: "POTWIERDZONE_ZRODLOWO", odpowiedz: "5" },
        { statusOdpowiedzi: "POTWIERDZONE_TERENOWO" },
        { statusOdpowiedzi: "POTWIERDZONE_TERENOWO", odpowiedz: "5" },
        {
          weryfikacjaTerenowa: {
            data: "2026-10-04",
            protokol: "protokol-testowy",
          },
        },
        {
          statusOdpowiedzi: "POTWIERDZONE_TERENOWO",
          odpowiedz: "5",
          weryfikacjaTerenowa: { data: "2026-10-04", protokol: " " },
        },
      ])
        oczekuj(
          schematKandydataZadaniaTerenowego.safeParse({ ...zadanie, ...zmiana })
            .success,
        ).toBe(false);
      oczekuj(
        schematKandydataZadaniaTerenowego.safeParse({
          ...zadanie,
          statusOdpowiedzi: "POTWIERDZONE_TERENOWO",
          odpowiedz: "5",
          weryfikacjaTerenowa: {
            data: "2026-10-04",
            protokol: "fikcyjny-protokol-wylacznie-w-tescie",
          },
        }).success,
      ).toBe(true);
    },
  );
  testuj("odrzuca powielone lub przypisane do innego miejsca zadania", () => {
    const bank = odczytajBankMiejsc();
    const pierwsze = bank[0]?.kandydaciZadan[0];
    if (!pierwsze) throw new Error("Brak zadania.");
    for (const zmiana of [
      { id: pierwsze.id },
      { id: "bank_02_zadanie_b" },
      { celObserwacji: pierwsze.celObserwacji },
      { polecenie: pierwsze.polecenie },
      { zrodla: ["nieistniejace"] },
    ]) {
      const dane = structuredClone(bank);
      Object.assign(dane[0]?.kandydaciZadan[1] ?? {}, zmiana);
      oczekuj(schematRejestruMiejsc.safeParse(dane).success).toBe(false);
    }
  });
  testuj("odrzuca bledne i wieloznaczne powiazania rejestru z runtime", () => {
    const bank = odczytajBankMiejsc();
    const rynek = bank[0];
    if (!rynek) throw new Error("Brak rynku.");
    oczekuj(() =>
      sprawdzPowiazaniaMiejsc(
        [
          {
            ...rynek,
            wykorzystanieWKampanii: {
              ...rynek.wykorzystanieWKampanii,
              idLokalizacji: ["brak"],
            },
          },
          ...bank.slice(1),
        ],
        pakiet.definicje.lokalizacje,
      ),
    ).toThrow("nieistniejaca lokalizacja");
    oczekuj(() =>
      sprawdzPowiazaniaMiejsc(bank.slice(1), pakiet.definicje.lokalizacje),
    ).toThrow("jednego odpowiednika");
    oczekuj(() =>
      sprawdzPowiazaniaMiejsc([...bank, rynek], pakiet.definicje.lokalizacje),
    ).toThrow("jednego odpowiednika");
  });
  testuj("mapa zachowuje pelne brzegi OSM i dziedziniec Ratusza", () => {
    for (const id of ["3246784", "17840805"]) {
      const brzeg = geometria.obiekty.find((obiekt) =>
        obiekt.id.startsWith(`relacja_${id}_outer_`),
      );
      oczekuj(brzeg?.punkty.length).toBeGreaterThan(100);
      oczekuj(brzeg?.punkty[0]).toEqual(brzeg?.punkty.at(-1));
    }
    oczekuj(
      geometria.obiekty.find((obiekt) => obiekt.id === "298917315")?.otwory,
    ).toHaveLength(1);
    oczekuj(geometria.zrodlaUzupelniajace).toHaveLength(2);
  });
  testuj("zachowuje caly bank i limit trzech kandydatow", () => {
    const bank = odczytajBankMiejsc();
    oczekuj(bank).toHaveLength(83);
    oczekuj(bank.every((miejsce) => miejsce.kandydaciZadan.length === 3)).toBe(
      true,
    );
    oczekuj(
      schematKandydataMiejsca.safeParse({
        ...bank[0],
        kandydaciZadan: Array(4).fill(bank[0]?.kandydaciZadan[0]),
      }).success,
    ).toBe(false);
  });
  testuj("zachowuje tozsamosc 83 miejsc i nie aktywuje 249 kandydatow", () => {
    const bank = odczytajBankMiejsc();
    const tozsamosc = bank.map(({ id, nazwa }) => ({
      id,
      nazwa,
    }));
    oczekuj(
      utworzHash("sha256").update(JSON.stringify(tozsamosc)).digest("hex"),
    ).toBe("33d34357ded97d19080d818611949454781a15c7745203f88d717894c58d2b68");
    const kandydaci = bank.flatMap((miejsce) => miejsce.kandydaciZadan);
    oczekuj(kandydaci).toHaveLength(249);
    oczekuj(new Set(kandydaci.map((zadanie) => zadanie.id)).size).toBe(249);
    oczekuj(
      kandydaci.every(
        (zadanie) =>
          zadanie.statusWykorzystania === "BANK_KANDYDATOW" &&
          zadanie.odpowiedz === null &&
          zadanie.statusOdpowiedzi === "WYMAGA_REKONESANSU" &&
          zadanie.weryfikacjaTerenowa === null,
      ),
    ).toBe(true);
    oczekuj(JSON.stringify(pakiet)).not.toContain("bank_01_zadanie_a");
    oczekuj(
      bank.every(
        (miejsce) =>
          miejsce.wspolrzedne === null &&
          miejsce.statusRekonesansu === "WYMAGA_REKONESANSU",
      ),
    ).toBe(true);
    oczekuj(
      bank
        .flatMap((miejsce) =>
          miejsce.wykorzystanieWKampanii.status === "WYKORZYSTANE"
            ? miejsce.wykorzystanieWKampanii.idLokalizacji
            : [],
        )
        .sort(),
    ).toEqual(pakiet.definicje.lokalizacje.map((miejsce) => miejsce.id).sort());
  });
  testuj(
    "odrzuca brak miejsca, zamiane identyfikatora, duplikat i scalanie nazw",
    () => {
      const bank = odczytajBankMiejsc();
      oczekuj(schematRejestruMiejsc.safeParse(bank.slice(0, 82)).success).toBe(
        false,
      );
      for (const zmiana of [
        { id: "bank_84" },
        { id: bank[0]?.id },
        { nazwa: bank[0]?.nazwa },
      ]) {
        const dane = structuredClone(bank);
        Object.assign(dane[82] ?? {}, zmiana);
        oczekuj(schematRejestruMiejsc.safeParse(dane).success).toBe(false);
      }
    },
  );
  testuj(
    "odrzuca niepelne rekordy, brak bibliografii i pozorne potwierdzenie GPS",
    () => {
      const bank = odczytajBankMiejsc();
      for (const zmiana of [
        { opis: "" },
        { typ: " " },
        { zrodla: [] },
        { klasyfikacjaInformacji: undefined },
        { powiazaniaFabularne: [] },
        { kandydaciZadan: [] },
        { zrodla: bank[0]?.zrodla.filter((zrodlo) => zrodlo.id !== "s1") },
        { statusWspolrzednych: "POTWIERDZONE_ZRODLOWO" },
        {
          wspolrzedne: {
            szerokosc: 54,
            dlugosc: 15,
            idZrodla: "brak",
            uzasadnienie: "Niepotwierdzone.",
          },
        },
        {
          wykorzystanieWKampanii: {
            status: "WYKORZYSTANE",
            idLokalizacji: [],
            uwagi: "Brak powiazania.",
          },
        },
      ]) {
        const dane = structuredClone(bank);
        Object.assign(dane[0] ?? {}, zmiana);
        oczekuj(schematRejestruMiejsc.safeParse(dane).success).toBe(false);
      }
      for (const wspolrzedne of [
        { szerokosc: 91, dlugosc: 15, idZrodla: "s1", uzasadnienie: "Zrodlo." },
        {
          szerokosc: 54,
          dlugosc: 181,
          idZrodla: "s1",
          uzasadnienie: "Zrodlo.",
        },
        { szerokosc: 54, dlugosc: 15, idZrodla: "s1", uzasadnienie: " " },
      ]) {
        oczekuj(
          schematKandydataMiejsca.safeParse({
            ...bank[0],
            wspolrzedne,
            statusWspolrzednych: "POTWIERDZONE_ZRODLOWO",
          }).success,
        ).toBe(false);
      }
    },
  );
  testuj("odrzuca nieistniejace zadania i zrodla wiedzy", () => {
    const dane = structuredClone(pakiet.definicje);
    if (!dane.kampania) throw new Error("Brak kampanii.");
    dane.kampania.warunekFinalu = {
      rodzaj: "zadanieUkonczone",
      id: "nieistniejace",
    };
    oczekuj(schematDefinicjiGry.safeParse(dane).success).toBe(false);
    const brakZrodla = structuredClone(pakiet.definicje);
    if (!brakZrodla.kampania?.wiedza[0]) throw new Error("Brak wiedzy.");
    brakZrodla.kampania.wiedza[0].idZrodla = ["nieistniejace"];
    oczekuj(schematDefinicjiGry.safeParse(brakZrodla).success).toBe(false);
  });
  testuj(
    "osiagalnosc, wyjscia, kazda nowa galaz i ending maja swiadectwo mechaniki i Ink",
    () => {
      const raport = sprawdzGrafKampanii(pakiet.definicje, pakiet.narracja);
      oczekuj(raport.liczbaSwiadectw).toBeGreaterThan(100);
      oczekuj(raport.zakonczenia).toEqual(
        oczekuj.arrayContaining([
          "kronika_polaczona",
          "kartograf_granic",
          "opiekun_glosow",
          "otwarta_kronika",
        ]),
      );
      oczekuj(analizujFlagi(pakiet.definicje).nigdyNieustawiane).toEqual([]);
    },
    60000,
  );
  testuj("wykrywa miejsce bez mozliwosci opuszczenia", () => {
    const dane = structuredClone(pakiet.definicje);
    dane.wybory = dane.wybory.filter(
      (wybor) => wybor.idSceny !== "palac_obserwacja",
    );
    oczekuj(() => sprawdzGrafKampanii(dane)).toThrow("bez wyjscia");
  });
  testuj(
    "wykrywa zakonczenie bez drogi spelniajacej warunek",
    () => {
      const dane = structuredClone(pakiet.definicje);
      const koniec = dane.zakonczenia.find(
        (element) => element.id === "kronika_polaczona",
      );
      if (!koniec) throw new Error("Brak zakonczenia.");
      koniec.warunek = {
        rodzaj: "wszystkie",
        warunki: [
          {
            rodzaj: "wynikZagadkiJest",
            id: "teren_hansken",
            wynik: "POMINIETA",
          },
          {
            rodzaj: "wynikZagadkiJest",
            id: "teren_hansken",
            wynik: "ROZWIAZANA_SAMODZIELNIE",
          },
        ],
      };
      oczekuj(() => sprawdzGrafKampanii(dane)).toThrow(
        /Zakonczenie bez drogi|Sprzeczna regula/,
      );
    },
    60000,
  );
  testuj.each([
    { miejsca: ["ratusz", "mury"], wyniki: [], koniec: "kartograf_granic" },
    {
      miejsca: ["ratusz", "hansken", "palac"],
      wyniki: [],
      glosy: true,
      koniec: "opiekun_glosow",
    },
    {
      miejsca: ["hansken"],
      wyniki: ["POMINIETA" as const],
      koniec: "otwarta_kronika",
    },
    {
      miejsca: ["hansken", "ratusz", "mury", "palac"],
      wyniki: [],
      splot: true,
      koniec: "kronika_polaczona",
    },
  ])("przebieg wyprawy daje $koniec", ({ koniec, ...droga }) =>
    oczekuj(
      przejdzKampanie(pakiet.definicje, droga).profil.zakonczenieGlowne,
    ).toBe(koniec),
  );
  testuj(
    "podpowiedz zmienia final przy identycznych miejscach i decyzjach",
    () => {
      const droga = {
        miejsca: ["hansken", "ratusz", "mury", "palac"],
        wyniki: [],
        splot: true,
      };
      const bez = przejdzKampanie(pakiet.definicje, droga);
      const pomoc = przejdzKampanie(pakiet.definicje, {
        ...droga,
        wyniki: ["ROZWIAZANA_Z_PODPOWIEDZIA"],
      });
      oczekuj(bez.stan.dokonaneWybory).toEqual(pomoc.stan.dokonaneWybory);
      oczekuj(bez.profil.zakonczenieGlowne).not.toBe(
        pomoc.profil.zakonczenieGlowne,
      );
      oczekuj(pomoc.profil.epilogiWatkow).toContain("epilog_pomocy");
    },
  );
  testuj("deterministyczny replay zachowuje wszystkie slady i watki", () => {
    const wynik = przejdzKampanie(pakiet.definicje, {
      miejsca: ["mury", "palac"],
      wyniki: ["ROZWIAZANA_Z_POMOCA", "POMINIETA"],
    });
    const stan = wynik.stan.dziennikZdarzen.reduce(
      (stan, zdarzenie) => wykonajKrok(pakiet.definicje, stan, zdarzenie).stan,
      null as typeof wynik.stan | null,
    );
    oczekuj(stan).toEqual(wynik.stan);
    if (stan)
      oczekuj(wyznaczProfilZakonczenia(pakiet.definicje, stan)).toEqual(
        wynik.profil,
      );
  });
});

opisz("Zrodla informacji historycznych", () => {
  testuj("kazdy z 83 opisow roboczych ma cytowanie i jawna niepewnosc", () => {
    const bank = odczytajBankMiejsc();
    for (const miejsce of bank) {
      oczekuj(miejsce.informacjeHistoryczne.length).toBeGreaterThan(0);
      for (const informacja of miejsce.informacjeHistoryczne) {
        oczekuj(informacja.poziomPewnosci).toBe("NIEPEWNE");
        oczekuj(informacja.wymagaDodatkowejWeryfikacji).toBe(true);
        oczekuj(
          informacja.zrodla.every(
            (zrodlo) => zrodlo.rodzajZrodla === "ENCYKLOPEDIA_ROBOCZA",
          ),
        ).toBe(true);
      }
      oczekuj(miejsce.opis).toMatch(/^Opis roboczy do weryfikacji:/);
    }
  });
  testuj(
    "odrzuca brak cytowania, rodzaju zrodla i niepewnosc podana jako fakt",
    () => {
      const informacja = odczytajBankMiejsc()[0]?.informacjeHistoryczne[0];
      if (!informacja) throw new Error("Brak informacji.");
      for (const zmiana of [
        { zrodla: [] },
        { zrodla: [{ opisBibliograficzny: "PDF, strona 18" }] },
        { klasyfikacja: "FAKT" },
        { wymagaDodatkowejWeryfikacji: false },
        { poziomPewnosci: "SPRZECZNE_ŹRÓDŁA", zrodla: [informacja.zrodla[0]] },
      ])
        oczekuj(
          schematInformacjiHistorycznej.safeParse({ ...informacja, ...zmiana })
            .success,
        ).toBe(false);
      oczekuj(
        schematInformacjiHistorycznej.safeParse({
          ...informacja,
          poziomPewnosci: "PRAWDOPODOBNE",
        }).success,
      ).toBe(true);
      oczekuj(
        schematInformacjiHistorycznej.safeParse({
          ...informacja,
          poziomPewnosci: "SPRZECZNE_ŹRÓDŁA",
        }).success,
      ).toBe(true);
      oczekuj(
        schematInformacjiHistorycznej.safeParse({
          ...informacja,
          klasyfikacja: "FAKT",
          poziomPewnosci: "POTWIERDZONE",
          wymagaDodatkowejWeryfikacji: false,
        }).success,
      ).toBe(true);
      oczekuj(
        schematInformacjiHistorycznej.safeParse({
          ...informacja,
          klasyfikacja: "FABULARYZOWANE",
          zrodla: [],
        }).success,
      ).toBe(true);
    },
  );
});

opisz("Robocza siec rownoleglych osi", () => {
  const miejsca = new Set(odczytajBankMiejsc().map((miejsce) => miejsce.id));
  const siec = odczytajSiecNarracyjna(miejsca);
  testuj(
    "osiem osi ma po dwa niezalezne wejscia bez rozszerzenia runtime",
    () => {
      oczekuj(siec.osie).toHaveLength(8);
      oczekuj(siec.wezly).toHaveLength(38);
      const wejscia = dostepneWezly(siec, new Set());
      oczekuj(wejscia).toHaveLength(16);
      for (const os of siec.osie)
        oczekuj(wejscia.filter((wezel) => wezel.idOsi === os.id)).toHaveLength(
          2,
        );
      oczekuj(pakiet.definicje.lokalizacje).toHaveLength(7);
      oczekuj(JSON.stringify(pakiet.definicje)).not.toContain(
        "SCENA_POZNIEJSZA",
      );
    },
  );
  testuj(
    "kazde alternatywne wejscie samodzielnie prowadzi do pozniejszej sceny",
    () => {
      for (const os of siec.osie)
        for (const wejscie of ["a", "b"]) {
          const ukonczone = new Set([`${os.id}_${wejscie}`]);
          oczekuj(
            dostepneWezly(siec, ukonczone).some(
              (wezel) => wezel.id === `${os.id}_rozwiniecie`,
            ),
          ).toBe(true);
          ukonczone.add(`${os.id}_rozwiniecie`);
          oczekuj(
            dostepneWezly(siec, ukonczone).find(
              (wezel) => wezel.id === `${os.id}_pozniej`,
            )?.warianty,
          ).toEqual([]);
          oczekuj(
            dostepneWezly(siec, ukonczone).filter(
              (wezel) => wezel.rodzaj === "WEJSCIE" && wezel.idOsi !== os.id,
            ),
          ).toHaveLength(14);
        }
    },
  );
  testuj(
    "ukryte sploty wymagaja obu osi i zmieniaja warianty pozniejszych scen",
    () => {
      for (const splot of siec.wezly.filter(
        (wezel) => wezel.rodzaj === "SPLOT",
      )) {
        oczekuj(splot.widocznosc).toBe("UKRYTA");
        const ukonczone = new Set<string>();
        for (const id of splot.warunek.idWezlow) {
          const os = siec.wezly.find((wezel) => wezel.id === id)?.idOsi;
          if (!os) throw new Error("Brak osi.");
          ukonczone.add(`${os}_a`);
          ukonczone.add(id);
          const odkryty = dostepneWezly(siec, ukonczone).some(
            (wezel) => wezel.id === splot.id,
          );
          oczekuj(odkryty).toBe(
            ukonczone.has(splot.warunek.idWezlow[0] ?? "") &&
              ukonczone.has(splot.warunek.idWezlow[1] ?? ""),
          );
        }
        ukonczone.add(splot.id);
        oczekuj(
          dostepneWezly(siec, ukonczone).some((wezel) =>
            wezel.warianty.some((wariant) =>
              wariant.warunek.idWezlow.includes(splot.id),
            ),
          ),
        ).toBe(true);
      }
    },
  );
  testuj(
    "przeplot osi daje taki sam kontekst niezaleznie od kolejnosci",
    () => {
      const symuluj = (kolejnosc: string[]) => {
        const ukonczone = new Set<string>();
        for (const id of kolejnosc) {
          oczekuj(
            dostepneWezly(siec, ukonczone).some((wezel) => wezel.id === id),
          ).toBe(true);
          ukonczone.add(id);
        }
        return dostepneWezly(siec, ukonczone);
      };
      const wszystkie = siec.osie.map((os) => os.id);
      const blokami = wszystkie.flatMap((id) => [
        `${id}_a`,
        `${id}_rozwiniecie`,
      ]);
      const przeplot = [...wszystkie]
        .reverse()
        .map((id) => `${id}_b`)
        .concat(wszystkie.map((id) => `${id}_rozwiniecie`));
      const sploty = siec.wezly
        .filter((wezel) => wezel.rodzaj === "SPLOT")
        .map((wezel) => wezel.id);
      const sceny = (wynik: ReturnType<typeof dostepneWezly>) =>
        wynik.filter((wezel) => wezel.rodzaj === "SCENA_POZNIEJSZA");
      oczekuj(sceny(symuluj([...blokami, ...sploty]))).toEqual(
        sceny(symuluj([...przeplot, ...[...sploty].reverse()])),
      );
    },
  );
  testuj(
    "odrzuca bledne referencje, duplikaty, zalezne wejscia i zakleszczenia",
    () => {
      const znajdz = (dane: typeof siec, id: string) => {
        const wezel = dane.wezly.find((element) => element.id === id);
        if (!wezel) throw new Error("Brak wezla testowego.");
        return wezel;
      };
      const zmiany = [
        (dane: typeof siec) => {
          znajdz(dane, "historia_a").idMiejsc = ["bank_99"];
        },
        (dane: typeof siec) => {
          znajdz(dane, "historia_a").idOsi = "brak_osi";
        },
        (dane: typeof siec) => {
          dane.wezly.push(znajdz(dane, "historia_a"));
        },
        (dane: typeof siec) => {
          znajdz(dane, "historia_rozwiniecie").warunek.idWezlow = [
            "brak_wezla",
          ];
        },
        (dane: typeof siec) => {
          znajdz(dane, "historia_a").warunek.idWezlow = ["rega_a"];
        },
        (dane: typeof siec) => {
          znajdz(dane, "historia_rozwiniecie").warunek.idWezlow = [
            "historia_pozniej",
          ];
        },
        (dane: typeof siec) => {
          znajdz(dane, "rzeka_granice").warunek.idWezlow = ["rega_a", "rega_b"];
        },
        (dane: typeof siec) => {
          const wariant = znajdz(dane, "historia_pozniej").warianty[0];
          if (!wariant) throw new Error("Brak wariantu.");
          wariant.warunek.idWezlow = ["brak_wezla"];
        },
      ];
      for (const zmiana of zmiany) {
        const dane = structuredClone(siec);
        zmiana(dane);
        oczekuj(() => sprawdzSiecNarracyjna(dane, miejsca)).toThrow();
      }
      oczekuj(() => dostepneWezly(siec, new Set(["nieznany"]))).toThrow();
    },
  );
});

opisz("Widoczne konsekwencje w Ink", () => {
  const odczytaj = (droga: Parameters<typeof przejdzKampanie>[1]) => {
    const wynik = przejdzKampanie(pakiet.definicje, droga);
    return {
      ...wynik,
      tekst: sprawdzNarracje(
        pakiet.narracja,
        { ...wynik, dostepnaScenka: false },
        pakiet.definicje,
      ),
    };
  };
  testuj(
    "wynik i licznik podpowiedzi zmieniaja pozniejszy Ratusz i final",
    () => {
      const sam = odczytaj({ miejsca: ["hansken", "ratusz"], wyniki: [] });
      const pomoc = odczytaj({
        miejsca: ["hansken", "ratusz"],
        wyniki: ["ROZWIAZANA_Z_PODPOWIEDZIA"],
      });
      const pomin = odczytaj({
        miejsca: ["hansken", "ratusz"],
        wyniki: ["POMINIETA"],
      });
      oczekuj(sam.tekst).toContain(
        "Rozpoznanie postaci pod sgraffito przypomina",
      );
      oczekuj(sam.tekst).not.toContain("Podpowiedź pomogła ci przy sgraffito");
      oczekuj(pomoc.tekst).toContain("Podpowiedź pomogła ci przy sgraffito");
      oczekuj(pomoc.tekst).toContain(
        "W finale zapisujesz także wykorzystaną podpowiedź",
      );
      oczekuj(pomoc.stan.uzytePodpowiedzi.teren_hansken).toBe(1);
      oczekuj(pomin.tekst).toContain("Notatka postaci pozostała otwarta");
      oczekuj(pomin.tekst).not.toContain(
        "Rozpoznanie postaci pod sgraffito przypomina",
      );
      oczekuj(pomin.tekst).not.toContain(
        "Podpowiedź pomogła ci przy sgraffito",
      );
      oczekuj(pomoc.profil.epilogiWatkow).toContain("epilog_pomocy");
      oczekuj(sam.profil.epilogiWatkow).not.toContain("epilog_pomocy");
    },
  );
  testuj(
    "przedmiot i ukonczony watek daja wariant celu, tekst Palacu i final",
    () => {
      const pelna = odczytaj({
        miejsca: ["mury", "palac"],
        wyniki: [],
        glosy: true,
      });
      const brak = odczytaj({
        miejsca: ["mury", "palac"],
        wyniki: ["POMINIETA"],
        glosy: true,
      });
      oczekuj(pelna.stan.dokonaneWybory).toContain("cel_palac_z_notatka");
      oczekuj(brak.stan.dokonaneWybory).not.toContain("cel_palac_z_notatka");
      oczekuj(pelna.tekst).toContain("Przynosisz notatkę muru");
      oczekuj(pelna.tekst).toContain("Zamknięty wątek Granic zostawia");
      oczekuj(brak.tekst).not.toContain("Przynosisz notatkę muru");
      oczekuj(brak.tekst).not.toContain("Zamknięty wątek Granic zostawia");
      oczekuj(pelna.stan.flagi).not.toHaveProperty("granice_gotowe");
      const kontekst = przygotujKontekstNarracji(
        pelna.stan,
        pakiet.definicje.kampania?.powiazaniaNarracji,
      );
      oczekuj(kontekst.flagi.granice_gotowe).toBe(true);
    },
  );
  testuj("odkrycie w pierwszym rozdziale wraca przy Palacu i w finale", () => {
    const odkryta = odczytaj({
      miejsca: ["ratusz", "palac"],
      wyniki: [],
      poczatek: {
        hansken: "ROZWIAZANA_SAMODZIELNIE",
        notatka: true,
        scenka: true,
      },
    });
    const zwykla = odczytaj({ miejsca: ["ratusz", "palac"], wyniki: [] });
    oczekuj(odkryta.stan.odkryteScenki).toContain("scenka_dwie_notatki");
    oczekuj(odkryta.tekst).toContain(
      "Odkrycie dwóch notatek wraca przy Pałacu",
    );
    oczekuj(odkryta.tekst).toContain(
      "Dwie notatki pozostają osobnymi głosami również w finale",
    );
    oczekuj(zwykla.tekst).not.toContain(
      "Odkrycie dwóch notatek wraca przy Pałacu",
    );
    oczekuj(zwykla.tekst).not.toContain(
      "Dwie notatki pozostają osobnymi głosami również w finale",
    );
  });
  testuj("decyzja Ratusza zmienia interpretacje murów bez nowego stanu", () => {
    const glos = odczytaj({
      miejsca: ["ratusz", "mury"],
      wyniki: [],
      glosy: true,
    });
    const zapis = odczytaj({
      miejsca: ["ratusz", "mury"],
      wyniki: [],
      glosy: false,
    });
    oczekuj(glos.tekst).toContain("Pozostawiłeś miejsce na ludzką opowieść");
    oczekuj(zapis.tekst).not.toContain(
      "Pozostawiłeś miejsce na ludzką opowieść",
    );
    oczekuj(zapis.tekst).toContain("Zacznij od śladu");
  });
  testuj("odrzuca warunek z blednym odwolaniem lub obszarem", () => {
    for (const zmiana of [
      { obszar: "wynikiZagadek" },
      { warunek: { rodzaj: "odkrytoScenke", id: "brak_scenki" } },
    ]) {
      const dane = structuredClone(pakiet.definicje);
      const powiazanie = dane.kampania?.powiazaniaNarracji.find(
        (element) => element.zmiennaInk === "odkryte_notatki",
      );
      if (!powiazanie) throw new Error("Brak powiazania.");
      Object.assign(powiazanie, zmiana);
      oczekuj(schematDefinicjiGry.safeParse(dane).success).toBe(false);
    }
  });
});

opisz("Skalowalny resolver zakonczen", () => {
  const droga = (
    wynik:
      | "ROZWIAZANA_SAMODZIELNIE"
      | "ROZWIAZANA_Z_PODPOWIEDZIA"
      | "POMINIETA" = "ROZWIAZANA_SAMODZIELNIE",
  ) =>
    przejdzKampanie(pakiet.definicje, {
      miejsca: ["hansken"],
      wyniki: [wynik],
    });
  const wariant = () => {
    const regula = pakiet.definicje.zakonczenia.find(
      (element) => element.id === "wariant_otwarte_slady",
    );
    if (!regula) throw new Error("Brak wariantu.");
    return structuredClone(regula);
  };
  testuj(
    "ten sam wybor finalny daje rozne warianty zalezne od calej wyprawy",
    () => {
      const sam = droga();
      const pomoc = droga("ROZWIAZANA_Z_PODPOWIEDZIA");
      const pomin = droga("POMINIETA");
      for (const wynik of [sam, pomoc, pomin])
        oczekuj(wynik.stan.dokonaneWybory.at(-1)).toBe("kampania_final");
      oczekuj(sam.profil.wariantyZakonczenia).toEqual([
        "wariant_otwarte_slady",
      ]);
      oczekuj(pomoc.profil.wariantyZakonczenia).toEqual([]);
      oczekuj(pomin.profil.wariantyZakonczenia).toEqual([]);
      const dane = structuredClone(pakiet.definicje);
      const wiedza = dane.kampania?.wiedza.find(
        (wpis) => wpis.id === "wiedza_teren_hansken",
      );
      if (!wiedza) throw new Error("Brak wiedzy.");
      wiedza.warunek = { rodzaj: "odkrytoScenke", id: "scenka_dwie_notatki" };
      oczekuj(
        wyznaczProfilZakonczenia(dane, sam.stan).wariantyZakonczenia,
      ).toEqual([]);
    },
  );
  testuj(
    "priorytet wybiera po jednym wariancie z grupy i pozwala laczyc grupy",
    () => {
      const dane = structuredClone(pakiet.definicje);
      const nowy = wariant();
      nowy.id = "wariant_wyzszy";
      nowy.priorytet = 20;
      dane.zakonczenia.push(nowy);
      const inny = wariant();
      inny.id = "wariant_inna_grupa";
      inny.grupa = "interpretacja";
      dane.zakonczenia.push(inny);
      const stan = droga().stan;
      oczekuj(wyznaczProfilZakonczenia(dane, stan).wariantyZakonczenia).toEqual(
        ["wariant_wyzszy", "wariant_inna_grupa"],
      );
      dane.zakonczenia.reverse();
      oczekuj(wyznaczProfilZakonczenia(dane, stan).wariantyZakonczenia).toEqual(
        ["wariant_wyzszy", "wariant_inna_grupa"],
      );
      oczekuj(() =>
        sprawdzSwiadectwaZakonczen(dane, [stan], ["wariant_otwarte_slady"]),
      ).toThrow("nigdy nieosiagniete");
    },
  );
  testuj("wariant nie moze przeciec do innego zakonczenia glownego", () => {
    const wynik = przejdzKampanie(pakiet.definicje, {
      miejsca: ["ratusz", "mury"],
      wyniki: [],
    });
    const dane = structuredClone(pakiet.definicje);
    const nowy = wariant();
    nowy.warunek = { rodzaj: "wszystkie", warunki: [] };
    delete nowy.wymaganaWiedza;
    dane.zakonczenia = dane.zakonczenia.filter(
      (regula) => regula.id !== nowy.id,
    );
    dane.zakonczenia.push(nowy);
    oczekuj(wyznaczProfilZakonczenia(dane, wynik.stan).zakonczenieGlowne).toBe(
      "kartograf_granic",
    );
    oczekuj(
      wyznaczProfilZakonczenia(dane, wynik.stan).wariantyZakonczenia,
    ).toEqual([]);
  });
  testuj("grupuje epilogi watku, zachowujac niezalezne odkrycia", () => {
    const dane = structuredClone(pakiet.definicje);
    const stan = droga().stan;
    for (const [id, priorytet] of [
      ["epilog_znaki_a", 1],
      ["epilog_znaki_b", 2],
    ] as const) {
      const regula = wariant();
      regula.id = id;
      regula.rodzaj = "EPILOG_WATKU";
      regula.idWatku = "watek_znakow";
      regula.priorytet = priorytet;
      delete regula.idZakonczeniaGlownego;
      delete regula.grupa;
      dane.zakonczenia.push(regula);
    }
    const odkrycie = wariant();
    odkrycie.id = "odkrycie_otwartych_znakow";
    odkrycie.rodzaj = "SPECJALNE_ODKRYCIE";
    delete odkrycie.grupa;
    delete odkrycie.idZakonczeniaGlownego;
    dane.zakonczenia.push(odkrycie);
    const profil = wyznaczProfilZakonczenia(dane, stan);
    oczekuj(profil.epilogiWatkow).toContain("epilog_znaki_b");
    oczekuj(profil.epilogiWatkow).not.toContain("epilog_znaki_a");
    oczekuj(profil.specjalneOdkrycia).toContain("odkrycie_otwartych_znakow");
    oczekuj(profil.wariantyZakonczenia).toContain("wariant_otwarte_slady");
  });
  testuj("wykrywa brak wejscia, martwa flage i sprzeczne atomy", () => {
    for (const zmiana of [
      { idScenyWejscia: "nieistniejacy_final" },
      {
        warunek: {
          rodzaj: "flagaJest",
          id: "nigdy_nieustawiana",
          wartosc: true,
        },
      },
      {
        warunek: {
          rodzaj: "wszystkie",
          warunki: [
            {
              rodzaj: "wynikZagadkiJest",
              id: "teren_hansken",
              wynik: "POMINIETA",
            },
            {
              rodzaj: "wynikZagadkiJest",
              id: "teren_hansken",
              wynik: "ROZWIAZANA_SAMODZIELNIE",
            },
          ],
        },
      },
      {
        warunek: {
          rodzaj: "nie",
          warunek: {
            rodzaj: "powinowactwoCoNajmniej",
            os: "dowod",
            wartosc: -5,
          },
        },
      },
    ]) {
      const dane = structuredClone(pakiet.definicje);
      const nowy = wariant();
      Object.assign(nowy, zmiana);
      dane.zakonczenia = dane.zakonczenia.filter(
        (regula) => regula.id !== nowy.id,
      );
      dane.zakonczenia.push(nowy);
      oczekuj(() => sprawdzRegulyZakonczen(dane)).toThrow();
    }
  });
  testuj("wykrywa sprzeczne reguly w tej samej grupie", () => {
    const dane = structuredClone(pakiet.definicje);
    const nowy = wariant();
    nowy.id = "wariant_remis";
    dane.zakonczenia.push(nowy);
    oczekuj(() => sprawdzRegulyZakonczen(dane)).toThrow("rownym priorytecie");
  });
  testuj("nie myli martwej galezi OR z martwym zakonczeniem", () => {
    const dane = structuredClone(pakiet.definicje);
    const nowy = wariant();
    nowy.warunek = {
      rodzaj: "dowolny",
      warunki: [
        {
          rodzaj: "wszystkie",
          warunki: [
            { rodzaj: "flagaJest", id: "zapisano_hansken", wartosc: true },
            { rodzaj: "flagaJest", id: "zapisano_hansken", wartosc: false },
          ],
        },
        { rodzaj: "posiadaPrzedmiot", id: "notatka_postaci" },
      ],
    };
    dane.zakonczenia = dane.zakonczenia.filter(
      (regula) => regula.id !== nowy.id,
    );
    dane.zakonczenia.push(nowy);
    oczekuj(() => sprawdzRegulyZakonczen(dane)).not.toThrow();
    oczekuj(sprawdzRegulyZakonczen(dane).martweGalezie).toContain(
      "wariant_otwarte_slady",
    );
  });
  testuj("odrzuca brak rodzica, wiedzy, grupy i bledny watek epilogu", () => {
    for (const zmiana of [
      { idZakonczeniaGlownego: "brak" },
      { grupa: undefined },
      { wymaganaWiedza: ["brak"] },
      { idWatku: "brak" },
    ]) {
      const dane = structuredClone(pakiet.definicje);
      const nowy = wariant();
      Object.assign(nowy, zmiana);
      dane.zakonczenia = dane.zakonczenia.filter(
        (regula) => regula.id !== nowy.id,
      );
      dane.zakonczenia.push(nowy);
      oczekuj(schematDefinicjiGry.safeParse(dane).success).toBe(false);
    }
  });
});

opisz("Granice walidacji resolvera", () => {
  testuj("ten sam wybor finalny nie determinuje zakonczenia glownego", () => {
    const sam = przejdzKampanie(pakiet.definicje, {
      miejsca: ["ratusz", "mury"],
      wyniki: [],
    });
    const pomoc = przejdzKampanie(pakiet.definicje, {
      miejsca: ["ratusz", "mury"],
      wyniki: ["ROZWIAZANA_SAMODZIELNIE", "ROZWIAZANA_Z_PODPOWIEDZIA"],
    });
    oczekuj(sam.stan.dokonaneWybory).toEqual(pomoc.stan.dokonaneWybory);
    oczekuj(sam.profil.zakonczenieGlowne).toBe("kartograf_granic");
    oczekuj(pomoc.profil.zakonczenieGlowne).toBe("otwarta_kronika");
  });
  testuj("wykrywa remis roznych regul glownych w rzeczywistym stanie", () => {
    const wynik = przejdzKampanie(pakiet.definicje, {
      miejsca: ["hansken"],
      wyniki: [],
    });
    const dane = structuredClone(pakiet.definicje);
    const regula = dane.zakonczenia.find(
      (element) => element.id === "otwarta_kronika",
    );
    if (!regula) throw new Error("Brak zakonczenia.");
    dane.zakonczenia.push({
      ...regula,
      id: "konkurencyjna_kronika",
      warunek: { rodzaj: "posiadaPrzedmiot", id: "notatka_postaci" },
    });
    oczekuj(() => sprawdzSwiadectwaZakonczen(dane, [wynik.stan], [])).toThrow(
      "remis priorytetow",
    );
  });
  testuj("blokuje przekroczenie limitu analizy przed iloczynem galezi", () => {
    const dane = structuredClone(pakiet.definicje);
    const regula = dane.zakonczenia.find(
      (element) => element.id === "wariant_otwarte_slady",
    );
    if (!regula) throw new Error("Brak wariantu.");
    regula.warunek = {
      rodzaj: "wszystkie",
      warunki: Array.from({ length: 12 }, () => ({
        rodzaj: "dowolny" as const,
        warunki: [
          {
            rodzaj: "flagaJest" as const,
            id: "zapisano_hansken",
            wartosc: true,
          },
          {
            rodzaj: "flagaJest" as const,
            id: "zapisano_hansken",
            wartosc: false,
          },
        ],
      })),
    };
    oczekuj(() => sprawdzRegulyZakonczen(dane)).toThrow(
      "limit analizy logicznej",
    );
  });
});
