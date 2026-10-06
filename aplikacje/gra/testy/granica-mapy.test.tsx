import { act as wykonajReact } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import { expect as oczekuj, test as testuj, vi } from "vitest";
import geometria from "../../../tresc/mapa/geometria.json";
import { GranicaMapy } from "../src/Aplikacja";
import { zaladujGeometrie } from "../src/mapa/geometria";

for (const produkcja of [false, true]) {
  testuj(
    `wyjatek potomka izolowany od aplikacji; produkcja=${produkcja}`,
    async () => {
      Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
      vi.stubEnv("DEV", !produkcja);
      vi.stubEnv("MODE", produkcja ? "production" : "test");
      const konsola = vi.spyOn(console, "error").mockImplementation(() => {});
      const kontener = document.createElement("div");
      const korzen = utworzKorzen(kontener);
      const blad = new TypeError("Kontrolowany wyjątek potomka mapy");
      localStorage.setItem("dane-gracza", "TAJNY_ZAPIS_GRACZA");
      vi.stubGlobal("navigator", {
        onLine: false,
        geolocation: { latitude: 54.123456, longitude: 15.654321 },
      });
      function UszkodzonaMapa(): never {
        throw blad;
      }
      try {
        await wykonajReact(() =>
          korzen.render(
            <>
              <p>Opowieść nadal działa</p>
              <GranicaMapy
                motyw="dark"
                trybAnimacji="SYSTEMOWY"
                ograniczoneAnimacje={true}
                profilWydajnosci="EKO"
              >
                <UszkodzonaMapa />
              </GranicaMapy>
            </>,
          ),
        );
        oczekuj(kontener.textContent).toContain("Opowieść nadal działa");
        oczekuj(
          kontener.querySelector('[role="status"]')?.textContent,
        ).toContain("Mapa jest niedostępna");
        oczekuj(kontener.textContent).toContain("MAP-RENDER-0001");
        oczekuj(kontener.textContent).not.toContain(blad.message);
        const raporty = konsola.mock.calls.filter(
          ([kod]) => kod === "MAP-RENDER-0001",
        );
        oczekuj(raporty).toHaveLength(produkcja ? 0 : 1);
        if (!produkcja) {
          oczekuj(raporty[0]?.[1]).toEqual({
            nazwa: "TypeError",
            message: blad.message,
            stack: blad.stack,
            componentStack: oczekuj.stringContaining("UszkodzonaMapa"),
            motyw: "dark",
            trybAnimacji: "SYSTEMOWY",
            ograniczoneAnimacje: true,
            profilWydajnosci: "EKO",
            online: false,
            geolokalizacjaDostepna: true,
          });
          const tekst = JSON.stringify(raporty);
          for (const tajne of [
            "54.123456",
            "15.654321",
            "TAJNY_ZAPIS_GRACZA",
            "latitude",
            "longitude",
            "dane-gracza",
          ])
            oczekuj(tekst).not.toContain(tajne);
        }
      } finally {
        await wykonajReact(() => korzen.unmount());
        localStorage.clear();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
      }
    },
  );
}

testuj(
  "niepelny lub uszkodzony podklad jest odrzucony przed rysowaniem",
  async () => {
    try {
      for (const dane of [
        {},
        { obiekty: [null] },
        {
          ...geometria,
          obiekty: [{ ...geometria.obiekty[0], punkty: [[null, 54]] }],
        },
      ]) {
        vi.stubGlobal(
          "fetch",
          vi.fn(async () => ({ ok: true, json: async () => dane })),
        );
        await oczekuj(zaladujGeometrie()).rejects.toThrow();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  },
);

testuj(
  "aktualny podklad przechodzi walidacje bez zmiany geometrii",
  async () => {
    try {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({ ok: true, json: async () => geometria })),
      );
      const wynik = await zaladujGeometrie();
      oczekuj(wynik.obiekty).toEqual(geometria.obiekty);
    } finally {
      vi.unstubAllGlobals();
    }
  },
);
