import { resolve as rozwiazSciezke } from "node:path";
import { expect, test } from "@playwright/test";
import axe from "axe-core";
import { createServer as utworzSerwer } from "vite";

test("ustawienia motywu przezywaja restart serwera deweloperskiego", async ({
  page: strona,
}) => {
  const uruchomSerwer = async () => {
    const serwer = await utworzSerwer({
      root: rozwiazSciezke(import.meta.dirname, "../../aplikacje/gra"),
      server: { host: "127.0.0.1", port: 4175, strictPort: true, open: false },
    });
    await serwer.listen();
    return serwer;
  };
  let serwer = await uruchomSerwer();
  try {
    await strona.emulateMedia({ colorScheme: "dark" });
    await strona.goto("http://127.0.0.1:4175");
    for (const [nazwa, wybor, aktywny] of [
      ["Jasny", "light", "light"],
      ["Ciemny", "dark", "dark"],
      ["Zgodnie z ustawieniami systemu", "auto", "dark"],
    ] as const) {
      await strona
        .getByRole("navigation")
        .getByRole("button", { name: "Ustawienia", exact: true })
        .click();
      await strona.getByRole("button", { name: nazwa, exact: true }).click();
      await serwer.close();
      serwer = await uruchomSerwer();
      await strona.reload();
      await expect(strona.locator("html")).toHaveAttribute(
        "data-theme",
        aktywny,
      );
      expect(
        await strona.evaluate(() =>
          localStorage.getItem("trzebiatow.motyw.v1"),
        ),
      ).toBe(wybor);
      await strona
        .getByRole("navigation")
        .getByRole("button", { name: "Ustawienia", exact: true })
        .click();
      await expect(
        strona.getByRole("button", { name: nazwa, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  } finally {
    await serwer.close();
  }
});

test("animacje: system, reczne ograniczenie i pelne efekty nie zmieniaja profilu ani audio", async ({
  page: strona,
}) => {
  await strona.emulateMedia({ reducedMotion: "no-preference" });
  await strona.goto("/");
  const otworzUstawienia = async () => {
    await strona
      .getByRole("navigation")
      .getByRole("button", { name: "Ustawienia", exact: true })
      .click();
  };
  await otworzUstawienia();
  await expect(strona.locator(".ustawienia h2")).toHaveText([
    "Wygląd",
    "Animacje interfejsu",
    "Tryb wydajności",
    "Audio",
  ]);
  await expect(
    strona.getByRole("group", { name: "Motyw interfejsu" }),
  ).toBeVisible();
  await expect(strona.locator("#opis-animacji")).toHaveText(
    "Określa intensywność animacji i efektów ruchu. Nie wpływa na rozgrywkę, mapę ani lokalizację.",
  );
  await strona
    .getByLabel("Tryb wydajności", { exact: true })
    .selectOption("PELNY");
  const audioPrzed = await strona.evaluate(() =>
    localStorage.getItem("trzebiatow.audio.v1"),
  );
  const animacje = strona.getByLabel("Animacje interfejsu", { exact: true });
  const sprawdzAnimacje = async (ograniczone: boolean) => {
    await expect(strona.locator(".aplikacja")).toHaveAttribute(
      "data-ograniczony-ruch",
      String(ograniczone),
    );
    await expect
      .poll(() =>
        strona.locator(".przelacznik-motywu").evaluate((element) =>
          getComputedStyle(element)
            .transitionDuration.split(",")
            .every((czas) => czas.trim() === "0s"),
        ),
      )
      .toBe(ograniczone);
    await expect(strona.locator(".aplikacja")).toHaveAttribute(
      "data-profil",
      "PELNY",
    );
    expect(
      await strona.evaluate(() => localStorage.getItem("trzebiatow.audio.v1")),
    ).toBe(audioPrzed);
    await expect(
      strona.getByRole("navigation").getByRole("button"),
    ).toHaveCount(7);
  };
  await sprawdzAnimacje(false);
  await strona.emulateMedia({ reducedMotion: "reduce" });
  await sprawdzAnimacje(true);
  await animacje.selectOption("PELNY");
  await sprawdzAnimacje(false);
  await strona.reload();
  await otworzUstawienia();
  await expect(animacje).toHaveValue("PELNY");
  await sprawdzAnimacje(false);
  await strona.emulateMedia({ reducedMotion: "no-preference" });
  await animacje.selectOption("OGRANICZONY");
  await sprawdzAnimacje(true);
  await strona.reload();
  await otworzUstawienia();
  await expect(animacje).toHaveValue("OGRANICZONY");
  await sprawdzAnimacje(true);
  await animacje.selectOption("SYSTEMOWY");
  await sprawdzAnimacje(false);
});

test("ustawienia: AUTO reaguje na system, reczny wybor i AUTO przezywaja restart", async ({
  page: strona,
}) => {
  await strona.emulateMedia({ colorScheme: "light" });
  await strona.goto("/");
  const otworzUstawienia = async () => {
    await strona
      .getByRole("navigation")
      .getByRole("button", { name: "Ustawienia", exact: true })
      .click();
    await expect(
      strona.getByRole("heading", { name: "Wygląd", exact: true }),
    ).toBeVisible();
  };
  await otworzUstawienia();
  const automatyczny = strona.getByRole("button", {
    name: "Zgodnie z ustawieniami systemu",
    exact: true,
  });
  await expect(automatyczny).toHaveAttribute("aria-pressed", "true");
  for (const motyw of ["dark", "light"] as const) {
    await strona.emulateMedia({ colorScheme: motyw });
    await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
  }
  for (const motyw of ["dark", "light"] as const) {
    await strona
      .getByRole("button", {
        name: motyw === "dark" ? "Ciemny" : "Jasny",
        exact: true,
      })
      .click();
    await strona.emulateMedia({
      colorScheme: motyw === "dark" ? "light" : "dark",
    });
    await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
    await strona.reload();
    await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
    await otworzUstawienia();
  }
  await automatyczny.click();
  expect(
    await strona.evaluate(() => localStorage.getItem("trzebiatow.motyw.v1")),
  ).toBe("auto");
  await strona.reload();
  await otworzUstawienia();
  await expect(automatyczny).toHaveAttribute("aria-pressed", "true");
  for (const motyw of ["light", "dark"] as const) {
    await strona.emulateMedia({ colorScheme: motyw });
    await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
  }
});

test("motywy wszystkich ekranow, zapis offline i szerokosci terenowe", async ({
  page: strona,
  context: kontekst,
}) => {
  await strona.goto("/");
  await strona
    .getByRole("button", { name: "Rozpocznij opowieść", exact: true })
    .click();
  for (const szerokosc of [360, 390, 768, 1280]) {
    await strona.setViewportSize({ width: szerokosc, height: 900 });
    for (const motyw of ["light", "dark"]) {
      await strona
        .getByRole("navigation")
        .getByRole("button", { name: "Ustawienia", exact: true })
        .click();
      await strona
        .getByRole("button", {
          name: motyw === "light" ? "Jasny" : "Ciemny",
          exact: true,
        })
        .click();
      await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
      for (const widok of [
        "Start",
        "Opowieść",
        "Mapa",
        "Kronika",
        "Wątki",
        "O grze",
        "Ustawienia",
      ]) {
        await strona
          .getByRole("navigation")
          .getByRole("button", { name: widok, exact: true })
          .click();
        if (widok === "Mapa")
          await expect(strona.locator(".pergamin canvas")).toBeVisible();
        await expect
          .poll(() =>
            strona.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          )
          .toBe(true);
      }
      await strona.reload();
      await expect(strona.locator("html")).toHaveAttribute("data-theme", motyw);
    }
  }
  await strona.emulateMedia({ reducedMotion: "reduce" });
  await strona
    .getByRole("navigation")
    .getByRole("button", { name: "Ustawienia", exact: true })
    .click();
  await strona.getByRole("button", { name: "Ciemny", exact: true }).click();
  await expect
    .poll(() =>
      strona
        .locator(".przelacznik-motywu")
        .evaluate((element) => getComputedStyle(element).transitionDuration),
    )
    .toBe("0s");
  for (const motyw of ["light", "dark"]) {
    await strona
      .getByRole("navigation")
      .getByRole("button", { name: "Ustawienia", exact: true })
      .click();
    await strona
      .getByRole("button", {
        name: motyw === "light" ? "Jasny" : "Ciemny",
        exact: true,
      })
      .click();
    for (const widok of [
      "Start",
      "Opowieść",
      "Mapa",
      "Kronika",
      "Wątki",
      "O grze",
      "Ustawienia",
    ]) {
      await strona
        .getByRole("navigation")
        .getByRole("button", { name: widok, exact: true })
        .click();
      await strona.addScriptTag({ content: axe.source });
      const naruszenia = await strona.evaluate(
        async () =>
          (
            await axe.run(document, {
              runOnly: {
                type: "rule",
                values: ["color-contrast", "label", "button-name"],
              },
            })
          ).violations,
      );
      expect(naruszenia, `${motyw}: ${widok}`).toEqual([]);
    }
  }
  await strona.waitForFunction(() => !!navigator.serviceWorker.controller);
  await kontekst.setOffline(true);
  await strona.reload();
  await expect(strona.locator("html")).toHaveAttribute("data-theme", "dark");
  await strona
    .getByRole("navigation")
    .getByRole("button", { name: "Ustawienia", exact: true })
    .click();
  await strona.getByRole("button", { name: "Jasny", exact: true }).click();
  await strona.reload();
  await expect(strona.locator("html")).toHaveAttribute("data-theme", "light");
});
