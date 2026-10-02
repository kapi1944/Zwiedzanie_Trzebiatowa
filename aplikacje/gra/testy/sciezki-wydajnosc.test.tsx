// @vitest-environment node
import { schematWynikuZagadki } from "@zwiedzanie/schemat-tresci";
import { expect, test } from "vitest";
import { odczytajPakiet } from "../../../narzedzia/pakiet-gry";
import {
  type DrogaSlice,
  przejdzDroge,
} from "../../../narzedzia/sciezki-slice";
import { MenedzerWydajnosci } from "../src/MenedzerWydajnosci";

test("1080 drog ma identyczny stan i ProfilZakonczenia w PELNY oraz EKO", () => {
  const pakiet = odczytajPakiet();
  let liczba = 0;
  function porownaj(droga: DrogaSlice) {
    const pelny = MenedzerWydajnosci({ profil: "PELNY", ruch: "SYSTEMOWY" });
    const wynikPelny = przejdzDroge(pakiet.definicje, droga);
    const eko = MenedzerWydajnosci({ profil: "EKO", ruch: "SYSTEMOWY" });
    const wynikEko = przejdzDroge(pakiet.definicje, droga);
    expect(pelny.profil).toBe("PELNY");
    expect(eko.profil).toBe("EKO");
    expect(wynikPelny.profil).toEqual(wynikEko.profil);
    expect(wynikPelny.stan).toEqual(wynikEko.stan);
    expect(wynikPelny.kroki).toEqual(wynikEko.kroki);
    liczba++;
    return wynikPelny;
  }
  for (const prolog of [
    "prolog_dowod",
    "prolog_pamiec",
    "prolog_obie",
  ] as const)
    for (const hansken of schematWynikuZagadki.options)
      for (const notatka of [false, true])
        for (const kosciol of ["zapis", "opowiesc"] as const)
          for (const baszta of schematWynikuZagadki.options)
            for (const final of [
              "baszta_fakt",
              "baszta_legenda",
              "baszta_obie",
            ] as const) {
              const droga = {
                prolog,
                hansken,
                notatka,
                kosciol,
                baszta,
                final,
                scenka: false,
              };
              if (porownaj(droga).dostepnaScenka)
                porownaj({ ...droga, scenka: true });
            }
  expect(liczba).toBe(1080);
}, 60000);
