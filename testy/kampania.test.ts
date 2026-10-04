import {
  schematDefinicjiGry,
  schematKandydataMiejsca,
} from "@zwiedzanie/schemat-tresci";
import { wykonajKrok, wyznaczProfilZakonczenia } from "@zwiedzanie/silnik-gry";
import { expect as oczekuj, describe as opisz, test as testuj } from "vitest";
import {
  przejdzKampanie,
  sprawdzGrafKampanii,
} from "../narzedzia/graf-kampanii.ts";
import {
  odczytajBankMiejsc,
  odczytajKampanie,
} from "../narzedzia/pakiet-kampanii.ts";
import { analizujFlagi } from "../narzedzia/walidacja-contentu.ts";
import geometria from "../tresc/mapa/geometria.json";

const pakiet = odczytajKampanie();
opisz("Model kampanii", () => {
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
      oczekuj(() => sprawdzGrafKampanii(dane)).toThrow("Zakonczenie bez drogi");
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
