import { expect, test } from "@playwright/test";
import axe from "axe-core";

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
          name: motyw === "light" ? "☀ Jasny" : "☾ Ciemny",
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
  await strona.getByRole("button", { name: "☾ Ciemny", exact: true }).click();
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
        name: motyw === "light" ? "☀ Jasny" : "☾ Ciemny",
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
  await strona.getByRole("button", { name: "☀ Jasny", exact: true }).click();
  await strona.reload();
  await expect(strona.locator("html")).toHaveAttribute("data-theme", "light");
});
