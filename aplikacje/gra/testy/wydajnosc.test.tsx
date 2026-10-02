import { act as wykonajReact } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import { expect, afterEach as poTescie, test, vi } from "vitest";
import Aplikacja from "../src/Aplikacja";
import { AdapterLokalizacji } from "../src/lokalizacja";
import {
  domyslneUstawienia,
  MenedzerWydajnosci,
  odczytajUstawienia,
  odczytajWskazowki,
  wybierzAsset,
  zapiszUstawienia,
} from "../src/MenedzerWydajnosci";
import { SesjaGry } from "../src/sesja-gry";

poTescie(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test.each(["PELNY", "EKO"] as const)(
  "reczny %s ma pierwszenstwo przed wskazowkami",
  (profil) => {
    expect(
      MenedzerWydajnosci(
        { profil, ruch: "SYSTEMOWY" },
        { rdzenie: 2, pamiec: 1, oszczedzanieDanych: true },
      ).profil,
    ).toBe(profil);
  },
);
test.each([
  {},
  { rdzenie: 2, pamiec: 2 },
  { rdzenie: 8 },
  { rdzenie: NaN, pamiec: 8 },
  { rdzenie: 8, pamiec: 8, oszczedzanieDanych: true },
  { rdzenie: 8, pamiec: 8, polaczenie: "3g" },
])("auto konserwatywnie wybiera EKO: %j", (wskazowki) => {
  expect(MenedzerWydajnosci(domyslneUstawienia, wskazowki).profil).toBe("EKO");
});
test("auto wybiera Pelny przy wystarczajacych danych", () => {
  expect(
    MenedzerWydajnosci(domyslneUstawienia, {
      rdzenie: 8,
      pamiec: 8,
      polaczenie: "4g",
    }).profil,
  ).toBe("PELNY");
});
test("ruch niezalezny od profilu i reczne nadpisanie systemu", () => {
  expect(
    MenedzerWydajnosci(
      { profil: "PELNY", ruch: "SYSTEMOWY" },
      { ograniczonyRuch: true },
    ).ograniczonyRuch,
  ).toBe(true);
  expect(
    MenedzerWydajnosci({ profil: "EKO", ruch: "SYSTEMOWY" }).ograniczonyRuch,
  ).toBe(false);
  expect(
    MenedzerWydajnosci({ profil: "PELNY", ruch: "OGRANICZONY" })
      .ograniczonyRuch,
  ).toBe(true);
  expect(
    MenedzerWydajnosci(
      { profil: "PELNY", ruch: "PELNY" },
      { ograniczonyRuch: true },
    ).ograniczonyRuch,
  ).toBe(false);
});
test("brak browser hints i navigator nie powoduje bledu", () => {
  vi.stubGlobal("navigator", {});
  vi.stubGlobal("matchMedia", undefined);
  expect(
    MenedzerWydajnosci(domyslneUstawienia, odczytajWskazowki()).profil,
  ).toBe("EKO");
  vi.stubGlobal("navigator", undefined);
  expect(odczytajWskazowki()).toEqual({});
});
test("ustawienia zachowane poza zapisem gry, uszkodzony zapis i brak pamieci", () => {
  const ustawienia = { profil: "EKO", ruch: "OGRANICZONY" } as const;
  expect(zapiszUstawienia(ustawienia)).toBe(true);
  expect(odczytajUstawienia()).toEqual(ustawienia);
  localStorage.setItem("trzebiatow.wydajnosc.v1", "{blad");
  expect(odczytajUstawienia()).toEqual(domyslneUstawienia);
  vi.stubGlobal("localStorage", undefined);
  expect(zapiszUstawienia(ustawienia)).toBe(false);
  expect(odczytajUstawienia()).toEqual(domyslneUstawienia);
  vi.unstubAllGlobals();
});
test("asset MALY w EKO, STANDARDOWY w Pelny, bez automatycznego HD", () => {
  const warianty = {
    MALY: "maly.webp",
    STANDARDOWY: "standard.webp",
    HD: "hd.webp",
  };
  expect(wybierzAsset(warianty, "EKO")).toBe("maly.webp");
  expect(wybierzAsset(warianty, "PELNY")).toBe("standard.webp");
  expect(wybierzAsset({ STANDARDOWY: "standard.webp" }, "EKO")).toBe(
    "standard.webp",
  );
});
test("EKO pozwala wykorzystac pozycje z ostatniej minuty", async () => {
  const miejsce = new SesjaGry().definicje.lokalizacje[0];
  if (!miejsce) throw new Error("Brak miejsca");
  const pomiar = vi.fn((_sukces, blad, _opcje?: PositionOptions) =>
    blad({ code: 1 }),
  );
  const adapter = new AdapterLokalizacji({ getCurrentPosition: pomiar });
  for (const profil of ["PELNY", "EKO"] as const) {
    await adapter.sprawdz(
      miejsce,
      true,
      MenedzerWydajnosci({ profil, ruch: "SYSTEMOWY" }).wiekPozycji,
    );
    expect(pomiar.mock.lastCall?.[2]).toMatchObject({
      maximumAge: profil === "EKO" ? 60000 : 0,
    });
  }
});
test("ekran Ustawienia zmienia profil bez uruchamiania sesji i pamieta wybor", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const kontener = document.createElement("div");
  document.body.append(kontener);
  const korzen = utworzKorzen(kontener);
  const uruchom = vi.fn(async () => new SesjaGry());
  try {
    await wykonajReact(() => korzen.render(<Aplikacja uruchom={uruchom} />));
    const przycisk = [...kontener.querySelectorAll("button")].find(
      (element) => element.textContent === "Ustawienia",
    );
    await wykonajReact(() => przycisk?.click());
    const wybor =
      kontener.querySelector<HTMLSelectElement>("#profil-wydajnosci");
    if (!wybor) throw new Error("Brak ustawien");
    await wykonajReact(() => {
      wybor.value = "PELNY";
      wybor.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(
      kontener.querySelector(".aplikacja")?.getAttribute("data-profil"),
    ).toBe("PELNY");
    expect(odczytajUstawienia().profil).toBe("PELNY");
    expect(uruchom).not.toHaveBeenCalled();
    expect(kontener.querySelector(".mapa")).toBeNull();
    await wykonajReact(() =>
      korzen.render(<Aplikacja key="ponowne" uruchom={uruchom} />),
    );
    expect(
      kontener.querySelector(".aplikacja")?.getAttribute("data-profil"),
    ).toBe("PELNY");
  } finally {
    await wykonajReact(() => korzen.unmount());
    kontener.remove();
  }
});
