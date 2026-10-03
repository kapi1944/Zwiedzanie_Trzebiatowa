import { createRequire as utworzRequire } from "node:module";
import {
  expect as oczekuj,
  type Page as Strona,
  test as testuj,
} from "@playwright/test";
import type silnikDostepnosci from "axe-core";

declare global {
  interface Window {
    axe: typeof silnikDostepnosci;
  }
}

const wymagaj = utworzRequire(import.meta.url);
async function kliknij(strona: Strona, tekst: string) {
  await strona.getByRole("button", { name: tekst, exact: true }).click();
}
async function sprawdzDostepnosc(strona: Strona) {
  await strona.addScriptTag({ path: wymagaj.resolve("axe-core/axe.min.js") });
  const bledy = await strona.evaluate(async () => {
    const wynik = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
    });
    return wynik.violations.map((blad) => ({
      id: blad.id,
      wezly: blad.nodes.map((wezel) => wezel.target),
    }));
  });
  oczekuj(bledy).toEqual([]);
}
async function sprawdzUklad(strona: Strona) {
  oczekuj(
    await strona.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const element of await strona
    .locator(
      "button:visible, input:visible, select:visible, [role=dialog]:visible",
    )
    .all()) {
    await element.scrollIntoViewIfNeeded();
    const pole = await element.boundingBox();
    oczekuj(pole).not.toBeNull();
    if (!pole) continue;
    oczekuj(pole.x).toBeGreaterThanOrEqual(0);
    oczekuj(pole.x + pole.width).toBeLessThanOrEqual(
      (strona.viewportSize()?.width ?? 0) + 1,
    );
    // Srodek kontrolki pozostaje dostepny ponad stala nawigacja.
    oczekuj(
      await element.evaluate((kontrolka) => {
        const pole = kontrolka.getBoundingClientRect();
        const trafiony = document.elementFromPoint(
          pole.x + pole.width / 2,
          pole.y + pole.height / 2,
        );
        return trafiony === kontrolka || kontrolka.contains(trafiony);
      }),
      `Zaslonieta kontrolka: ${await element.evaluate((kontrolka) => kontrolka.outerHTML)}`,
    ).toBe(true);
  }
}

// Osiem wierszy pokrywa kazda pare wartosci pieciu osi, bez 32 drog UI.
const macierz = Array.from({ length: 8 }, (_, indeks) => {
  const a = indeks & 1;
  const b = (indeks >> 1) & 1;
  const c = (indeks >> 2) & 1;
  return {
    gps: !!a,
    offline: !!b,
    restore: !!c,
    eko: !!(a ^ b),
    audio: !!(a ^ c),
  };
});
for (const [indeks, wariant] of macierz.entries()) {
  testuj(
    `droga C: macierz ${indeks + 1} ${JSON.stringify(wariant)}`,
    async ({ page: strona, context: kontekst }) => {
      const bledy: string[] = [];
      strona.on("pageerror", (blad) => bledy.push(blad.message));
      await strona.setViewportSize({ width: 390, height: 844 });
      await strona.addInitScript((gps) => {
        Object.defineProperty(navigator, "geolocation", {
          configurable: true,
          value: gps
            ? {
                getCurrentPosition(sukces: PositionCallback) {
                  sukces({
                    coords: {
                      latitude: 54.062392199421,
                      longitude: 15.265858022611,
                      accuracy: 5,
                    },
                  } as GeolocationPosition);
                },
              }
            : undefined,
        });
      }, wariant.gps);
      await strona.goto("/");
      await strona.evaluate(async () => {
        await navigator.serviceWorker.ready;
      });
      // PWA nie przejmuje biezacej strony (clientsClaim=false).
      await strona.reload();
      await kliknij(strona, "Ustawienia");
      await strona
        .getByLabel("Tryb wydajności")
        .selectOption(wariant.eko ? "EKO" : "PELNY");
      await strona
        .getByRole("checkbox", { name: /Dźwięk \(efekty\)/ })
        .setChecked(wariant.audio);
      await strona
        .getByRole("checkbox", { name: /^Muzyka:/ })
        .setChecked(wariant.audio);
      await kliknij(strona, "Opowieść");
      await kliknij(strona, "Rozpocznij opowieść");
      await kliknij(strona, "Sprawdź moją lokalizację");
      await oczekuj(
        strona.getByRole("region", { name: "Potwierdzenie obecności" }),
      ).toContainText(
        wariant.gps
          ? "mieści się w promieniu celu"
          : "Urządzenie nie obsługuje lokalizacji",
      );
      await kliknij(strona, "Potwierdź ręcznie");
      await kliknij(strona, "Mapa");
      await oczekuj(strona.locator(".mapa")).toBeVisible();
      await kliknij(strona, "Opowieść");
      if (wariant.offline) {
        await kontekst.setOffline(true);
        await oczekuj(
          strona.getByRole("complementary", { name: "Stan aplikacji" }),
        ).toContainText("Offline");
      }
      await kliknij(strona, "Najpierw chcę wysłuchać obu stron.");
      await oczekuj(strona.locator("h1")).toContainText("Hansken");
      await oczekuj(strona.locator("h1")).toBeFocused();
      if (wariant.restore) {
        await oczekuj(strona.locator(".status-zapisu")).toContainText(
          "Postęp zapisany",
        );
        await strona.reload();
        await kliknij(strona, "Wznów opowieść");
        await oczekuj(strona.locator("h1")).toContainText("Hansken");
      }
      await kliknij(strona, "Mapa");
      await oczekuj(
        strona.getByLabel(
          "Włącz podkład online OpenStreetMap (wymaga internetu)",
        ),
      ).not.toBeChecked();
      await oczekuj(strona.locator(".mapa")).toBeVisible();
      await kliknij(strona, "Opowieść");
      await kliknij(strona, "Pomiń zagadkę i idź dalej");
      await kliknij(
        strona,
        "Najpierw słucham, jak obraz staje się opowieścią.",
      );
      await kliknij(strona, "Zapisuję informację i jej źródło.");
      await kliknij(strona, "Pomiń zagadkę i idź dalej");
      await kliknij(
        strona,
        "Zachowuję obie wersje i zaznaczam ich różny charakter.",
      );
      await oczekuj(
        strona.getByRole("heading", { name: "Podróż zapisana" }),
      ).toBeVisible();
      await sprawdzUklad(strona);
      oczekuj(bledy).toEqual([]);
    },
  );
}

for (const szerokosc of [320, 360, 390, 412, 768, 1024]) {
  testuj(`uklad i axe: ${szerokosc}px`, async ({ page: strona }) => {
    await strona.setViewportSize({ width: szerokosc, height: 844 });
    await strona.goto("/");
    await sprawdzDostepnosc(strona);
    await strona.keyboard.press("Tab");
    await oczekuj(
      strona.getByRole("link", { name: "Przejdź do treści" }),
    ).toBeFocused();
    await strona.keyboard.press("Enter");
    await kliknij(strona, "Rozpocznij opowieść");
    await oczekuj(strona.locator("main")).toHaveAttribute("aria-busy", "false");
    await strona
      .getByRole("button", {
        name: "Najpierw chcę wysłuchać obu stron.",
        exact: true,
      })
      .focus();
    await strona.keyboard.press("Enter");
    await oczekuj(strona.locator("h1")).toContainText("Hansken");
    for (const widok of [
      "Opowieść",
      "Kronika",
      "Wątki",
      "Mapa",
      "Ustawienia",
      "O grze",
    ]) {
      await kliknij(strona, widok);
      await sprawdzUklad(strona);
      await sprawdzDostepnosc(strona);
    }
  });
}
