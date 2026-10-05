import {
  mkdir as utworzKatalog,
  writeFile as zapiszPlik,
} from "node:fs/promises";
import { resolve as rozwiazSciezke } from "node:path";
import { chromium, expect as oczekuj } from "@playwright/test";
import przygotujPodglad from "../testy/e2e/serwer-podgladu.ts";

const katalog = rozwiazSciezke("dokumentacja/ui-snapshot");
const obrazy = [];
const problemy = [];
const widoki = [
  ["01-start", "Start"],
  ["02-opowiesc", "Opowieść"],
  ["03-mapa", "Mapa"],
  ["04-kronika", "Kronika"],
  ["05-watki", "Wątki"],
  ["06-o-grze", "O grze"],
  ["07-ustawienia", "Ustawienia"],
];
const zamknijPodglad = await przygotujPodglad();
let przegladarka;
try {
  przegladarka = await chromium.launch();
  for (const [urzadzenie, viewport] of [
    ["mobile", { width: 390, height: 844 }],
    ["desktop", { width: 1280, height: 900 }],
  ]) {
    for (const motyw of ["light", "dark"]) {
      const kontekst = await przegladarka.newContext({ viewport });
      try {
        const strona = await kontekst.newPage();
        strona.on("pageerror", (blad) => problemy.push(blad.message));
        const docelowy = rozwiazSciezke(katalog, urzadzenie, motyw);
        await utworzKatalog(docelowy, { recursive: true });
        async function kliknij(tekst) {
          await strona
            .getByRole("button", { name: tekst, exact: true })
            .click();
          await oczekuj(strona.locator("main")).toHaveAttribute(
            "aria-busy",
            "false",
          );
        }
        async function pokaz(tekst) {
          await strona
            .getByRole("navigation", { name: "Główna nawigacja" })
            .getByRole("button", { name: tekst, exact: true })
            .click();
          await oczekuj(strona.locator("main")).toHaveAttribute(
            "aria-busy",
            "false",
          );
          if (tekst === "Mapa")
            await oczekuj(strona.locator(".pergamin")).toHaveAttribute(
              "data-gotowa",
              "true",
            );
          await strona.evaluate(() => document.fonts.ready);
          await strona.waitForTimeout(250);
          await strona.evaluate(() => window.scrollTo(0, 0));
        }
        async function zdjecie(nazwa, widok) {
          const wysokosc = await strona.evaluate(
            () => document.documentElement.scrollHeight,
          );
          const sciezka = `${urzadzenie}/${motyw}/${nazwa}.png`;
          await strona.screenshot({
            path: rozwiazSciezke(katalog, sciezka),
            fullPage: wysokosc <= 4000,
          });
          obrazy.push({
            plik: sciezka,
            widok,
            viewport,
            wysokosc,
            typ: wysokosc <= 4000 ? "fullPage" : "gora",
          });
          if (wysokosc > 4000) {
            for (
              let pozycja = viewport.height - 100, numer = 2;
              pozycja < wysokosc;
              pozycja += viewport.height - 100, numer++
            ) {
              await strona.evaluate((y) => window.scrollTo(0, y), pozycja);
              const czesc = `${urzadzenie}/${motyw}/${nazwa}-czesc-${numer}.png`;
              await strona.screenshot({ path: rozwiazSciezke(katalog, czesc) });
              obrazy.push({
                plik: czesc,
                widok,
                viewport,
                typ: "fragment",
                pozycja,
              });
            }
          }
          if (widok === "Mapa" || widok === "Ustawienia") {
            const cel = widok === "Mapa" ? ".pergamin" : ".material-tymczasowy";
            const pozycja = await strona
              .locator(widok === "Mapa" ? ".narzedzia-mapy" : cel)
              .evaluate(
                (element) => element.getBoundingClientRect().top + scrollY - 12,
              );
            await strona.evaluate((y) => window.scrollTo(0, y), pozycja);
            const fragment = `${urzadzenie}/${motyw}/${nazwa}-${widok === "Mapa" ? "mapa-i-kontrolki" : "audio"}.png`;
            await strona.screenshot({
              path: rozwiazSciezke(katalog, fragment),
            });
            obrazy.push({ plik: fragment, widok, viewport, typ: "fragment" });
          }
          const dodatkowe = [];
          if (
            widok === "Mapa" ||
            (widok === "Opowieść" && urzadzenie === "mobile")
          )
            dodatkowe.push(["panel-celu", ".cel-lokacji", "gora"]);
          if (widok === "Kronika")
            dodatkowe.push([
              "pierwsze-wpisy",
              ".kronika-wpisy > li:first-child",
              "gora",
            ]);
          if (widok === "Ustawienia")
            dodatkowe.push([
              "audio-dol",
              ".ustawienia > button:last-of-type",
              "dol",
            ]);
          for (const [sufiks, selektor, kierunek] of dodatkowe) {
            const pozycja = await strona.locator(selektor).evaluate(
              (element, parametry) => {
                const ramka = element.getBoundingClientRect();
                const nawigacja = document
                  .querySelector(".nawigacja")
                  .getBoundingClientRect().height;
                return (
                  scrollY +
                  (parametry.kierunek === "gora"
                    ? ramka.top - 16
                    : ramka.bottom - innerHeight + nawigacja + 16)
                );
              },
              { kierunek },
            );
            await strona.evaluate((y) => window.scrollTo(0, y), pozycja);
            const fragment = `${urzadzenie}/${motyw}/${nazwa}-${sufiks}.png`;
            await strona.screenshot({
              path: rozwiazSciezke(katalog, fragment),
            });
            obrazy.push({ plik: fragment, widok, viewport, typ: "fragment" });
          }
          if (
            await strona.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            )
          )
            problemy.push(
              `${urzadzenie}/${motyw}/${widok}: poziome przewijanie`,
            );
        }
        await strona.goto("http://127.0.0.1:4173");
        await strona.evaluate(async () => {
          await navigator.serviceWorker.ready;
        });
        await strona.reload();
        await pokaz("Ustawienia");
        await kliknij(motyw === "light" ? "☀ Jasny" : "☾ Ciemny");
        await oczekuj(strona.locator("html")).toHaveAttribute(
          "data-theme",
          motyw,
        );
        await pokaz("Start");
        await zdjecie(urzadzenie === "mobile" ? "01-start" : "start", "Start");
        await kliknij("Rozpocznij opowieść");
        await kliknij("Najpierw chcę wysłuchać obu stron.");
        await kliknij("Pomiń zagadkę i idź dalej");
        await kliknij("Najpierw słucham, jak obraz staje się opowieścią.");
        for (const [nazwa, widok] of widoki.slice(1)) {
          if (
            urzadzenie === "desktop" &&
            !["Mapa", "Ustawienia"].includes(widok)
          )
            continue;
          await pokaz(widok);
          if (widok === "Kronika")
            await oczekuj(
              strona.locator(".kronika-wpisy > li").first(),
            ).toBeVisible();
          await zdjecie(
            urzadzenie === "mobile"
              ? nazwa
              : widok === "Mapa"
                ? "mapa"
                : "ustawienia",
            widok,
          );
        }
      } finally {
        await kontekst.close();
      }
    }
  }
  await zapiszPlik(
    rozwiazSciezke(katalog, "manifest.json"),
    `${JSON.stringify({ data: "2026-10-05", stan: "Start przed wyprawa; pozostale widoki po normalnym przejsciu rynku i Hansken, przed zagadka przy kosciele. Bez sztucznych danych.", obrazy, problemy }, null, 2)}\n`,
  );
  console.log(
    `Zapisano ${obrazy.length} screenshotow. Bledy przegladarki / overflow: ${problemy.length}.`,
  );
} finally {
  await przegladarka?.close();
  await zamknijPodglad();
}
