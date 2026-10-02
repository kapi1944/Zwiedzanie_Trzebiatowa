import { schematDefinicjiGry } from "@zwiedzanie/schemat-tresci";
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

  test("1170 kombinacji mechaniki i Ink dochodzi do zgodnego finalu", () => {
    expect(sprawdzDrogi(pakiet.definicje, pakiet.narracja)).toEqual({
      liczbaDrog: 1170,
      profile: ["kronikarz", "lacznik", "straznik_opowiesci"],
    });
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
    expect(zagadka?.odpowiedz).toBeNull();
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
