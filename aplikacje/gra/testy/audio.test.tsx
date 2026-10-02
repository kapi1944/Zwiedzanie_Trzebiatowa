import { parsujTagiNarracji } from "@zwiedzanie/silnik-narracji";
import { expect, afterEach as poTescie, test, vi } from "vitest";
import {
  efektyZTagow,
  type FabrykaAudio,
  MenedzerAudio,
} from "../src/MenedzerAudio";
import { SesjaGry } from "../src/sesja-gry";
import {
  domyslneAudio,
  odczytajUstawieniaAudio,
  zapiszUstawieniaAudio,
} from "../src/ustawienia-audio";

poTescie(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
function przygotuj(profil: "PELNY" | "EKO" = "PELNY") {
  const odtwarzacze: {
    graj: ReturnType<typeof vi.fn>;
    pauza: ReturnType<typeof vi.fn>;
    zwolnij: ReturnType<typeof vi.fn>;
    glosnosc: ReturnType<typeof vi.fn>;
    przejscie: ReturnType<typeof vi.fn>;
    zakoncz: () => void;
    blad: () => void;
  }[] = [];
  const fabryka = vi.fn<FabrykaAudio>(
    (_sciezka, _petla, _glosnosc, zakoncz, blad) => {
      const odtwarzacz = {
        graj: vi.fn(),
        pauza: vi.fn(),
        zwolnij: vi.fn(),
        glosnosc: vi.fn(),
        przejscie: vi.fn(),
        zakoncz,
        blad,
      };
      odtwarzacze.push(odtwarzacz);
      return odtwarzacz;
    },
  );
  const ustawienia = { ...domyslneAudio, dzwiek: true, muzyka: true };
  const odblokuj = vi.fn(async () => {});
  const blad = vi.fn();
  const menedzer = new MenedzerAudio(
    fabryka,
    {
      dzwieki: { kartka: "/kartka.wav" },
      nastroje: {
        rynek: "/rynek.wav",
        sacrum: "/sacrum.wav",
        final: "/final.wav",
      },
    },
    ustawienia,
    profil,
    odblokuj,
    blad,
  );
  return { menedzer, fabryka, odtwarzacze, ustawienia, odblokuj, blad };
}
const kartka = { rodzaj: "ODTWORZ_DZWIEK", id: "kartka" } as const;
const rynek = { rodzaj: "USTAW_NASTROJ_MUZYKI", id: "rynek" } as const;
const sacrum = { rodzaj: "USTAW_NASTROJ_MUZYKI", id: "sacrum" } as const;

test("bez gestu nie tworzy audio, nie pobiera i nie odblokowuje", () => {
  const { menedzer, fabryka, odblokuj } = przygotuj();
  menedzer.wykonaj([rynek, kartka]);
  expect(fabryka).not.toHaveBeenCalled();
  expect(odblokuj).not.toHaveBeenCalled();
  menedzer.aktywuj();
  expect(fabryka).toHaveBeenCalledTimes(1);
  menedzer.zamknij();
});
test("mute zwalnia muzyke i efekty, music off nie blokuje efektow", () => {
  const { menedzer, ustawienia, odtwarzacze, fabryka } = przygotuj();
  menedzer.aktywuj();
  menedzer.wykonaj([rynek, kartka]);
  menedzer.ustaw({ ...ustawienia, dzwiek: false, muzyka: false }, "PELNY");
  expect(
    odtwarzacze.every(
      (odtwarzacz) => odtwarzacz.zwolnij.mock.calls.length === 1,
    ),
  ).toBe(true);
  menedzer.wykonaj([kartka]);
  expect(fabryka).toHaveBeenCalledTimes(2);
  menedzer.ustaw({ ...ustawienia, muzyka: false }, "PELNY");
  menedzer.wykonaj([kartka]);
  expect(fabryka).toHaveBeenCalledTimes(3);
  menedzer.zamknij();
});
test("effect off i zerowa glosnosc nie pobieraja efektu; muzyka pozostaje niezalezna", () => {
  const { menedzer, ustawienia, fabryka } = przygotuj();
  menedzer.aktywuj();
  menedzer.ustaw({ ...ustawienia, dzwiek: false }, "PELNY");
  menedzer.wykonaj([kartka, rynek]);
  expect(fabryka).toHaveBeenCalledTimes(1);
  menedzer.ustaw(
    { ...ustawienia, glosnoscEfektow: 0, glosnoscMuzyki: 0 },
    "PELNY",
  );
  menedzer.wykonaj([kartka]);
  expect(fabryka).toHaveBeenCalledTimes(1);
  menedzer.zamknij();
});
test("EKO: jeden efekt i jeden track, bez fade, koniec zwalnia miejsce", () => {
  const { menedzer, fabryka, odtwarzacze } = przygotuj("EKO");
  menedzer.aktywuj();
  menedzer.wykonaj([kartka, kartka, rynek, sacrum]);
  expect(fabryka).toHaveBeenCalledTimes(3);
  expect(odtwarzacze[1]?.zwolnij).toHaveBeenCalledOnce();
  expect(
    odtwarzacze.every((dzwiek) => dzwiek.przejscie.mock.calls.length === 0),
  ).toBe(true);
  odtwarzacze[0]?.zakoncz();
  menedzer.wykonaj([kartka]);
  expect(fabryka).toHaveBeenCalledTimes(4);
  menedzer.zamknij();
});
test("zmiana nastroju: ograniczony crossfade i brak ponownego tworzenia tracku", () => {
  vi.useFakeTimers();
  const { menedzer, fabryka, odtwarzacze } = przygotuj();
  menedzer.aktywuj();
  menedzer.wykonaj([rynek, rynek]);
  expect(fabryka).toHaveBeenCalledTimes(1);
  menedzer.wykonaj([sacrum]);
  expect(odtwarzacze[0]?.przejscie).toHaveBeenCalledWith(0.2, 0, 400);
  expect(odtwarzacze[1]?.przejscie).toHaveBeenCalledWith(0, 0.2, 400);
  menedzer.wykonaj([{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: "final" }]);
  expect(odtwarzacze[0]?.zwolnij).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(400);
  expect(odtwarzacze[1]?.zwolnij).toHaveBeenCalledOnce();
  menedzer.wykonaj([{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: "cisza" }]);
  expect(odtwarzacze[2]?.zwolnij).toHaveBeenCalledOnce();
  menedzer.zamknij();
});
test("visibility pause i powrot bez nowego tracku, brak dzwiekow w tle", () => {
  const { menedzer, fabryka, odtwarzacze } = przygotuj();
  menedzer.aktywuj();
  menedzer.wykonaj([rynek, kartka]);
  menedzer.ustawWidocznosc(false);
  expect(odtwarzacze[0]?.pauza).toHaveBeenCalledOnce();
  expect(odtwarzacze[1]?.zwolnij).toHaveBeenCalledOnce();
  menedzer.wykonaj([kartka]);
  menedzer.ustawWidocznosc(true);
  menedzer.ustawWidocznosc(true);
  expect(fabryka).toHaveBeenCalledTimes(2);
  expect(odtwarzacze[0]?.graj).toHaveBeenCalledTimes(2);
  menedzer.zamknij();
});
test("nieznane assety, prototypy, URL i kod tagu nie sa wykonywane", () => {
  const { menedzer, fabryka } = przygotuj();
  menedzer.aktywuj();
  for (const id of [
    "__proto__",
    "constructor",
    "../plik",
    "https://example.org/x",
    "alert(1)",
  ]) {
    expect(() =>
      menedzer.wykonaj([
        { rodzaj: "ODTWORZ_DZWIEK", id },
        { rodzaj: "USTAW_NASTROJ_MUZYKI", id },
      ]),
    ).not.toThrow();
    expect(parsujTagiNarracji([`dzwiek:${id}`, `nastroj:${id}`])).toEqual([]);
  }
  expect(fabryka).not.toHaveBeenCalled();
  expect(
    efektyZTagow(
      parsujTagiNarracji(["nastroj:sacrum", "dzwiek:subtelny_metal"]),
    ),
  ).toEqual([
    { rodzaj: "USTAW_NASTROJ_MUZYKI", id: "sacrum" },
    { rodzaj: "ODTWORZ_DZWIEK", id: "subtelny_metal" },
  ]);
});
test("bledy fabryki i blokada autoplay nie rzucaja do mechaniki", async () => {
  const { menedzer, fabryka, odblokuj, blad } = przygotuj();
  odblokuj.mockRejectedValue(new Error("autoplay"));
  fabryka.mockImplementation(() => {
    throw new Error("brak audio");
  });
  expect(() => {
    menedzer.aktywuj();
    menedzer.wykonaj([rynek, kartka]);
  }).not.toThrow();
  await Promise.resolve();
  expect(blad).toHaveBeenCalled();
  menedzer.zamknij();
});
test("ustawienia audio: zapis, walidacja, brak pamieci", () => {
  const ustawienia = { ...domyslneAudio, dzwiek: true, muzyka: true };
  expect(zapiszUstawieniaAudio(ustawienia)).toBe(true);
  expect(odczytajUstawieniaAudio()).toEqual(ustawienia);
  localStorage.setItem(
    "trzebiatow.audio.v1",
    JSON.stringify({ ...ustawienia, glosnoscMuzyki: 2 }),
  );
  expect(odczytajUstawieniaAudio()).toEqual(domyslneAudio);
  vi.stubGlobal("localStorage", undefined);
  expect(zapiszUstawieniaAudio(ustawienia)).toBe(false);
  expect(odczytajUstawieniaAudio()).toEqual(domyslneAudio);
  vi.unstubAllGlobals();
});
test("sesja zbiera tagi wszystkich akapitow i oddaje efekty tylko raz", () => {
  const gra = new SesjaGry();
  expect(gra.odczytaj().ramka.tagi).toContainEqual({
    rodzaj: "nastroj",
    wartosc: "rynek",
  });
  expect(gra.odbierzEfektyAudio()).toContainEqual({
    rodzaj: "USTAW_NASTROJ_MUZYKI",
    id: "rynek",
  });
  expect(gra.odbierzEfektyAudio()).toEqual([]);
  gra.wybierz(0);
  expect(gra.odbierzEfektyAudio()).toContainEqual({
    rodzaj: "USTAW_NASTROJ_MUZYKI",
    id: "tajemnica",
  });
});
