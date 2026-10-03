import {
  schematDefinicjiGry,
  schematWynikuZagadki,
} from "@zwiedzanie/schemat-tresci";
import { wykonajKrok } from "@zwiedzanie/silnik-gry";
import { describe, expect, test } from "vitest";
import { sprawdzNarracje } from "../narzedzia/narracja-slice.ts";
import {
  odczytajPakiet,
  parsujYaml,
  sprawdzSceny,
} from "../narzedzia/pakiet-gry.ts";
import {
  type DrogaSlice,
  przejdzDroge,
  sprawdzDrogi,
} from "../narzedzia/sciezki-slice.ts";
import {
  analizujFlagi,
  utworzKontroleGrafu,
} from "../narzedzia/walidacja-contentu.ts";

const pakiet = odczytajPakiet();
const drogi: { nazwa: string; profil: string; droga: DrogaSlice }[] = [
  {
    nazwa: "A — dowod i samodzielna obserwacja",
    profil: "kronikarz",
    droga: {
      prolog: "prolog_dowod",
      hansken: "ROZWIAZANA_SAMODZIELNIE",
      notatka: true,
      scenka: true,
      kosciol: "zapis",
      baszta: "ROZWIAZANA_SAMODZIELNIE",
      final: "baszta_fakt",
    },
  },
  {
    nazwa: "B — pamiec i podpowiedz",
    profil: "straznik_opowiesci",
    droga: {
      prolog: "prolog_pamiec",
      hansken: "ROZWIAZANA_Z_PODPOWIEDZIA",
      notatka: false,
      scenka: false,
      kosciol: "opowiesc",
      baszta: "ROZWIAZANA_Z_PODPOWIEDZIA",
      final: "baszta_legenda",
    },
  },
  {
    nazwa: "C — obie perspektywy i pominiecie",
    profil: "lacznik",
    droga: {
      prolog: "prolog_obie",
      hansken: "POMINIETA",
      notatka: false,
      scenka: false,
      kosciol: "zapis",
      baszta: "POMINIETA",
      final: "baszta_obie",
    },
  },
];

describe("Vertical slice Trzebiatowa", () => {
  test.each(schematWynikuZagadki.options)(
    "Hansken %s: stan, dziennik, efekty, coda i mini-final",
    (wynikZagadki) => {
      const droga = drogi[2]?.droga;
      if (!droga) throw new Error("Brak drogi C.");
      const wynik = przejdzDroge(pakiet.definicje, {
        ...droga,
        hansken: wynikZagadki,
      });
      const indeks = wynik.kroki.findIndex(
        (krok) => krok.stan.wynikiZagadek.zagadka_hansken !== undefined,
      );
      const poprzedni = wynik.kroki[indeks - 1];
      const zakonczony = wynik.kroki[indeks];
      const zagadka = pakiet.definicje.zagadki.find(
        (element) => element.id === "zagadka_hansken",
      );
      if (!poprzedni || !zakonczony || !zagadka)
        throw new Error("Brak kroku zaliczenia Hansken.");
      const powtorzonyKrok = wykonajKrok(
        pakiet.definicje,
        poprzedni.stan,
        zakonczony.zdarzenie,
      );
      expect(powtorzonyKrok.stan).toEqual(zakonczony.stan);
      expect(powtorzonyKrok.stan.aktywnaZagadka).toBeNull();
      expect(powtorzonyKrok.stan.dziennikZdarzen.at(-1)).toEqual(
        zakonczony.zdarzenie,
      );
      expect(powtorzonyKrok.stan.wynikiZagadek.zagadka_hansken).toMatchObject({
        wynik: wynikZagadki,
        liczbaProb: [
          "ROZWIAZANA_SAMODZIELNIE",
          "ROZWIAZANA_Z_PODPOWIEDZIA",
        ].includes(wynikZagadki)
          ? 1
          : 0,
        liczbaPodpowiedzi: wynikZagadki === "ROZWIAZANA_Z_PODPOWIEDZIA" ? 1 : 0,
        potrzebujePomocy: wynikZagadki === "ROZWIAZANA_Z_POMOCA",
      });
      expect(powtorzonyKrok.efekty).toEqual(
        expect.arrayContaining(zagadka.konsekwencje[wynikZagadki].efekty),
      );
      expect(
        powtorzonyKrok.stan.sladyIPrzedmioty.includes(
          "fragment_kroniki_hansken",
        ),
      ).toBe(
        ["ROZWIAZANA_SAMODZIELNIE", "ROZWIAZANA_Z_PODPOWIEDZIA"].includes(
          wynikZagadki,
        ),
      );
      expect(wynik.stan.wynikiZagadek.zagadka_hansken?.wynik).toBe(
        wynikZagadki,
      );
      expect(wynik.stan.aktualnaScena).toBe("mini_final");
      const tekst = sprawdzNarracje(pakiet.narracja, wynik);
      const cody = {
        ROZWIAZANA_SAMODZIELNIE: "Własna obserwacja zostaje zapisana",
        ROZWIAZANA_Z_PODPOWIEDZIA: "Podpowiedź towarzyszy twojej notatce",
        ROZWIAZANA_Z_POMOCA: "Pomoc źródłowa prowadzi dalej",
        POMINIETA: "Nie masz fragmentu Kroniki Hansken",
        NIEUDANA: "Świadome zakończenie zadania nie zatrzymuje opowieści",
      };
      expect(tekst).toContain(cody[wynikZagadki]);
    },
  );

  test.each(drogi)("$nazwa", ({ droga, profil }) => {
    const wynik = przejdzDroge(pakiet.definicje, droga);
    expect(wynik.profil.zakonczenieGlowne).toBe(profil);
    expect(wynik.stan.aktualnaScena).toBe("mini_final");
    expect(wynik.profil.epilogiWatkow).toEqual([
      "epilog_kroniki",
      "epilog_pamieci",
    ]);
    expect(wynik.profil.konsekwencjeZagadek).toHaveLength(2);
    const tekst = sprawdzNarracje(pakiet.narracja, wynik);
    expect(tekst).toContain("opóźniona konsekwencja");
    expect(tekst).toContain("epilog Kroniki");
    expect(tekst).toContain("epilog Pamięci");
    expect(tekst.includes("bonusowy fragment Kroniki")).toBe(
      wynik.profil.specjalneOdkrycia.includes("odkrycie_dwie_warstwy"),
    );
  });

  test("1080 kombinacji mechaniki i Ink dochodzi do zgodnego finalu", () => {
    const kontrola = utworzKontroleGrafu(
      pakiet.definicje,
      pakiet.sceny.map((scena) => scena.id),
    );
    expect(
      sprawdzDrogi(pakiet.definicje, pakiet.narracja, kontrola.odwiedz),
    ).toEqual({
      liczbaDrog: 1080,
      profile: ["kronikarz", "lacznik", "straznik_opowiesci"],
    });
    expect(() => kontrola.zakoncz()).not.toThrow();
  });

  test("analiza flag rozroznia literowki, flagi testowe i nieczytane", () => {
    const definicje = structuredClone(pakiet.definicje);
    const wybor = definicje.wybory[0];
    if (!wybor) throw new Error("Brak wyboru.");
    wybor.warunek = {
      rodzaj: "nie",
      warunek: {
        rodzaj: "dowolny",
        warunki: [
          { rodzaj: "flagaJest", id: "literowka", wartosc: true },
          { rodzaj: "flagaJest", id: "testowa", wartosc: false },
        ],
      },
    };
    wybor.zmiany.push({ rodzaj: "USTAW_FLAGE", id: "testowa", wartosc: true });
    expect(analizujFlagi(definicje).nigdyNieustawiane).toEqual(["literowka"]);
    expect(analizujFlagi(definicje).nigdyNieczytane).toContain("final_lacznik");
    expect(analizujFlagi(pakiet.definicje).nigdyNieustawiane).toEqual([]);
    expect(() => schematDefinicjiGry.parse(definicje)).not.toThrow();
  });

  test("graf odrzuca martwe elementy zamiast sprawdzac same referencje", () => {
    const definicje = structuredClone(pakiet.definicje);
    for (const lista of [
      definicje.lokalizacje,
      definicje.wybory,
      definicje.scenki,
      definicje.zakonczenia,
      definicje.watki,
      definicje.zagadki,
    ]) {
      const element = lista[0];
      if (!element) throw new Error("Brak elementu.");
      // Dodane elementy maja poprawna strukture, ale nie maja drogi w slice.
      lista.push({ ...element, id: "martwy" } as never);
    }
    const kontrola = utworzKontroleGrafu(definicje, ["martwa_scena"]);
    const droga = drogi[2]?.droga;
    if (!droga) throw new Error("Brak drogi C.");
    kontrola.odwiedz(przejdzDroge(pakiet.definicje, droga));
    expect(() => kontrola.zakoncz()).toThrow(
      /Nieosiagalna scena.*Nieosiagalna lokalizacja.*Nieosiagalny wybor.*Martwa scenka.*Zakonczenie bez drogi.*Wymagany watek bez ukonczenia.*Zagadka bez wyjscia/,
    );
  });

  test("scenka i bonus nie sa wymagane nawet po zdobyciu sladu", () => {
    const droga = drogi[0]?.droga;
    if (!droga) throw new Error("Brak drogi A.");
    const wynik = przejdzDroge(pakiet.definicje, { ...droga, scenka: false });
    expect(wynik.dostepnaScenka).toBe(true);
    expect(wynik.profil.zakonczenieGlowne).toBe("kronikarz");
    expect(wynik.profil.specjalneOdkrycia).toEqual([]);
    expect(sprawdzNarracje(pakiet.narracja, wynik)).not.toContain(
      "scenka opcjonalna",
    );
  });

  test("Hansken nie zawiera zgadywanej odpowiedzi ani daty rekonesansu", () => {
    const zagadka = pakiet.definicje.zagadki.find(
      (element) => element.id === "zagadka_hansken",
    );
    expect(zagadka?.typ).toBe("OBSERWACJA");
    if (zagadka?.typ !== "OBSERWACJA")
      throw new Error("Niepoprawny typ Hansken.");
    expect(zagadka.odpowiedz).toBeNull();
    expect(zagadka?.wymagaWeryfikacjiTerenowej).toBe(true);
    expect(zagadka?.zweryfikowanoTerenowoDnia).toBeUndefined();
  });

  test("YAML odrzuca duplikaty kluczy i aliasy", () => {
    expect(() => parsujYaml("id: jeden\nid: dwa")).toThrow();
    expect(() => parsujYaml("a: &wspolne [jeden]\nb: *wspolne")).toThrow();
  });

  test.each([
    "duplikat",
    "brak_id",
    "zrodlo",
    "przedmiot",
    "watek",
    "wynik",
    "klasyfikacja",
  ])("odrzuca uszkodzony pakiet: %s", (rodzaj) => {
    const definicje = pakiet.definicje;
    let dane: unknown = definicje;
    if (rodzaj === "duplikat")
      dane = {
        ...definicje,
        lokalizacje: [...definicje.lokalizacje, definicje.lokalizacje[0]],
      };
    if (rodzaj === "brak_id")
      dane = {
        ...definicje,
        lokalizacje: definicje.lokalizacje.map((element) => ({
          ...element,
          id: undefined,
        })),
      };
    if (rodzaj === "zrodlo")
      dane = {
        ...definicje,
        lokalizacje: definicje.lokalizacje.map((element) => ({
          ...element,
          idZrodla: ["brak_zrodla"],
        })),
      };
    if (rodzaj === "przedmiot")
      dane = {
        ...definicje,
        scenki: definicje.scenki.map((element) => ({
          ...element,
          warunek: { rodzaj: "posiadaPrzedmiot", id: "brak_przedmiotu" },
        })),
      };
    if (rodzaj === "watek")
      dane = {
        ...definicje,
        scenki: definicje.scenki.map((element) => ({
          ...element,
          warunek: {
            rodzaj: "stanWatkuJest",
            id: "brak_watku",
            stan: "UKONCZONY",
          },
        })),
      };
    if (rodzaj === "wynik")
      dane = {
        ...definicje,
        zagadki: definicje.zagadki.map((element) => ({
          ...element,
          konsekwencje: {
            ...element.konsekwencje,
            NIEZNANY: element.konsekwencje.POMINIETA,
          },
        })),
      };
    if (rodzaj === "klasyfikacja")
      dane = {
        ...definicje,
        lokalizacje: definicje.lokalizacje.map((element) => ({
          ...element,
          klasyfikacja: "PEWNA_LEGENDA",
        })),
      };
    expect(schematDefinicjiGry.safeParse(dane).success).toBe(false);
  });

  test("odrzuca scene nieobecna w rejestrze lub Ink", () => {
    const dane = structuredClone(pakiet.definicje);
    dane.manifest.scenaStartowa = "brak_sceny";
    expect(() =>
      sprawdzSceny(
        dane,
        pakiet.sceny.map((scena) => scena.id),
        pakiet.narracja,
      ),
    ).toThrow("Nieistniejaca scena");
    expect(() =>
      sprawdzSceny(
        dane,
        [...pakiet.sceny.map((scena) => scena.id), "brak_sceny"],
        pakiet.narracja,
      ),
    ).toThrow("Nieistniejaca scena");
  });

  test("odrzuca glowny final o nieosiagalnym warunku", () => {
    const dane = structuredClone(pakiet.definicje);
    const final = dane.zakonczenia.find(
      (element) => element.id === "kronikarz",
    );
    if (!final) throw new Error("Brak finalu.");
    final.warunek = {
      rodzaj: "flagaJest",
      id: "nigdy_nie_ustawiona",
      wartosc: true,
    };
    expect(() => sprawdzDrogi(dane)).toThrow("Nieosiagalny glowny profil");
  });
});
