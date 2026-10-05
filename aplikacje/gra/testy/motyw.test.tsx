import { readFileSync as odczytajPlik } from "node:fs";
import { runInNewContext as wykonajSkrypt } from "node:vm";
import { act as wykonajReact } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import { expect, afterEach as poTescie, test, vi } from "vitest";
import Aplikacja from "../src/Aplikacja";
import { kluczMotywu, odczytajMotyw, zapiszMotyw } from "../src/motyw";

poTescie(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.querySelector("#meta-test-motywu")?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("domyslny motyw wynika z systemu, bledny zapis jest ignorowany", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
  expect(odczytajMotyw()).toBe("dark");
  localStorage.setItem(kluczMotywu, "bledny");
  expect(odczytajMotyw()).toBe("dark");
  zapiszMotyw("light");
  expect(odczytajMotyw()).toBe("light");
});

test("niedostepna pamiec nie blokuje motywu", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false })),
  );
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("brak pamieci");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("brak pamieci");
  });
  expect(odczytajMotyw()).toBe("light");
  expect(zapiszMotyw("dark")).toBe(false);
});

test("ustawienia i naglowek zmieniaja root; ponowne uruchomienie odtwarza wybor bez naruszania audio i EKO", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.setItem(
    "trzebiatow.wydajnosc.v1",
    JSON.stringify({ profil: "EKO", ruch: "OGRANICZONY" }),
  );
  localStorage.setItem(
    "trzebiatow.audio.v1",
    JSON.stringify({
      dzwiek: true,
      muzyka: false,
      glosnoscEfektow: 0.5,
      glosnoscMuzyki: 0.3,
    }),
  );
  const zachowaneAudio = localStorage.getItem("trzebiatow.audio.v1");
  const kontener = document.createElement("div");
  document.body.append(kontener);
  let korzen = utworzKorzen(kontener);
  const kliknij = async (tekst: string) => {
    const przycisk = [...kontener.querySelectorAll("button")].find(
      (element) => element.textContent === tekst,
    );
    if (!przycisk) throw new Error(`Brak ${tekst}`);
    await wykonajReact(() => przycisk.click());
  };
  try {
    await wykonajReact(() => korzen.render(<Aplikacja />));
    await kliknij("Ustawienia");
    await kliknij("☾ Ciemny");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(kluczMotywu)).toBe("dark");
    expect(
      kontener.querySelector('button[aria-pressed="true"]')?.textContent,
    ).toBe("☾ Ciemny");
    expect(
      kontener.querySelector<HTMLSelectElement>("#profil-wydajnosci")?.value,
    ).toBe("EKO");
    expect(
      kontener.querySelector<HTMLSelectElement>("#tryb-ruchu")?.value,
    ).toBe("OGRANICZONY");
    expect(localStorage.getItem("trzebiatow.audio.v1")).toBe(zachowaneAudio);
    await wykonajReact(() => korzen.unmount());
    korzen = utworzKorzen(kontener);
    await wykonajReact(() => korzen.render(<Aplikacja />));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await wykonajReact(() =>
      kontener
        .querySelector<HTMLButtonElement>('[aria-label="Włącz jasny motyw"]')
        ?.click(),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(kluczMotywu)).toBe("light");
  } finally {
    await wykonajReact(() => korzen.unmount());
    kontener.remove();
  }
});

test("motyw jest ustawiany w head przed startem React", () => {
  const html = odczytajPlik(`${process.cwd()}/index.html`, "utf8");
  const skrypt = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  expect(skrypt).toBeDefined();
  const meta = document.createElement("meta");
  meta.id = "meta-test-motywu";
  meta.name = "theme-color";
  document.head.append(meta);
  for (const zapisany of [null, "dark", "light", "bledny"]) {
    for (const ciemnySystem of [false, true]) {
      localStorage.clear();
      if (zapisany) localStorage.setItem(kluczMotywu, zapisany);
      const media = () => ({ matches: ciemnySystem });
      vi.stubGlobal("matchMedia", media);
      wykonajSkrypt(skrypt ?? "", {
        document,
        localStorage,
        matchMedia: media,
      });
      expect(document.documentElement.dataset.theme).toBe(odczytajMotyw());
    }
  }
});
