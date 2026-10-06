import { createRequire as utworzRequire } from "node:module";
import {
  expect as oczekuj,
  type Page as Strona,
  test as testuj,
} from "@playwright/test";

async function kliknij(strona: Strona, tekst: string) {
  await strona.getByRole("button", { name: tekst, exact: true }).click();
  await oczekuj(strona.locator("main")).toHaveAttribute("aria-busy", "false");
}
async function rozpocznijKampanie(strona: Strona) {
  await strona.goto("/");
  await strona.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await strona.reload();
  await kliknij(strona, "Rozpocznij opowieść");
  await kliknij(strona, "Najpierw chcę wysłuchać obu stron.");
  await kliknij(strona, "Pomiń zagadkę i idź dalej");
  await kliknij(strona, "Najpierw słucham, jak obraz staje się opowieścią.");
  await kliknij(strona, "Zapisuję informację i jej źródło.");
  await kliknij(strona, "Pomiń zagadkę i idź dalej");
  await kliknij(
    strona,
    "Zachowuję obie wersje i zaznaczam ich różny charakter.",
  );
  await kliknij(strona, "Rozwijam Kronikę — wybieram dalszą wyprawę.");
}
testuj(
  "Kronika na telefonie filtruje tylko zdobyta wiedze i wraca offline",
  async ({ page: strona, context: kontekst }) => {
    await strona.setViewportSize({ width: 320, height: 740 });
    await rozpocznijKampanie(strona);
    await kliknij(strona, "Ustawienia");
    await strona.getByLabel("Tryb wydajności").selectOption("EKO");
    await kliknij(strona, "Kronika");
    await oczekuj(
      strona.getByRole("heading", { name: "Legenda kaszana" }),
    ).toBeVisible();
    await oczekuj(
      strona.getByRole("heading", { name: "Czas oglądany z czterech stron" }),
    ).toHaveCount(0);
    await strona.getByLabel("Warstwa wpisu").selectOption("LEGENDA / PRZEKAZ");
    await oczekuj(strona.locator(".kronika-wpisy > li")).toHaveCount(1);
    await strona
      .getByLabel("Szukaj w zdobytych wpisach")
      .fill("nieodkryta treść");
    await oczekuj(strona.locator(".kronika-wpisy > li")).toHaveCount(0);
    await strona.getByLabel("Szukaj w zdobytych wpisach").fill("kaszy");
    await oczekuj(strona.locator(".kronika-wpisy > li")).toHaveCount(1);
    await oczekuj(strona.locator("body")).toHaveJSProperty("scrollWidth", 320);
    await strona.addScriptTag({
      path: utworzRequire(import.meta.url).resolve("axe-core/axe.min.js"),
    });
    const naruszenia = await strona.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
          },
        })
      ).violations.map((blad) => blad.id),
    );
    oczekuj(naruszenia).toEqual([]);
    await kontekst.setOffline(true);
    await strona.reload();
    await kliknij(strona, "Wznów opowieść");
    await kliknij(strona, "Kronika");
    await oczekuj(
      strona.getByRole("heading", { name: "Legenda kaszana" }),
    ).toBeVisible();
    await oczekuj(
      strona.getByRole("heading", { name: "Czas oglądany z czterech stron" }),
    ).toHaveCount(0);
  },
);
testuj(
  "rozgalezienie, obserwacje, podpowiedz, konsekwencja Ink i final po wznowieniu offline",
  async ({ page: strona, context: kontekst }) => {
    const bledy: string[] = [];
    strona.on("pageerror", (blad) => bledy.push(blad.message));
    await strona.setViewportSize({ width: 390, height: 844 });
    await rozpocznijKampanie(strona);
    await oczekuj(
      strona.getByRole("button", {
        name: "Idę do Pałacu Książęcego.",
        exact: true,
      }),
    ).toHaveCount(0);
    await kliknij(strona, "Mapa");
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-gotowa",
      "true",
    );
    await oczekuj(
      strona.getByRole("button", { name: /Wybierz cel: Pałac/ }),
    ).toHaveCount(0);
    await kliknij(strona, "Wybierz cel: Ratusz — wieżyczka zegarowa");
    await kliknij(strona, "Potwierdź ręcznie");
    await kliknij(strona, "Mapa");
    await oczekuj(
      strona.getByRole("button", {
        name: "Ratusz — wieżyczka zegarowa · aktualny cel",
        exact: true,
      }),
    ).toBeVisible();
    await kliknij(strona, "Kronika");
    await oczekuj(
      strona.getByRole("heading", { name: "Czas oglądany z czterech stron" }),
    ).toHaveCount(0);
    await kliknij(strona, "Opowieść");
    await strona.getByLabel("Twoja odpowiedź").fill("5");
    await kliknij(strona, "Sprawdź odpowiedź");
    await kliknij(strona, "Poproś o podpowiedź");
    await kontekst.setOffline(true);
    await oczekuj(strona.locator(".status-zapisu")).toContainText(
      "Postęp zapisany",
    );
    await strona.reload();
    await kliknij(strona, "Wznów opowieść");
    await strona.getByLabel("Twoja odpowiedź").fill("4");
    await kliknij(strona, "Sprawdź odpowiedź");
    await kliknij(strona, "Zostawiam miejsce na opowieści ludzi.");
    await kliknij(strona, "Idę do murów obronnych.");
    await oczekuj(
      strona.getByRole("article", { name: "Treść opowieści" }),
    ).toContainText("ludzką opowieść");
    await kliknij(strona, "Potwierdź ręcznie");
    await strona.getByLabel("Twoja odpowiedź").fill("kamień cegła");
    await kliknij(strona, "Sprawdź odpowiedź");
    await kliknij(strona, "Zachowuję ślad i jego źródło.");
    await kliknij(strona, "Zamykam dzisiejszą wyprawę.");
    await oczekuj(
      strona.getByRole("heading", { name: "Podróż zapisana" }),
    ).toBeVisible();
    await oczekuj(strona.locator("main")).toContainText("Kartograf granic");
    await kliknij(strona, "Kronika");
    await oczekuj(strona.locator("main")).toContainText("kamien");
    oczekuj(bledy).toEqual([]);
  },
);
testuj(
  "karmazynowy slad GPS: ukrywanie, skok, offline, wznowienie, czyszczenie i nowa wyprawa",
  async ({ page: strona, context: kontekst }, daneTestu) => {
    await strona.setViewportSize({ width: 390, height: 844 });
    await strona.addInitScript(() => {
      let odczyt: PositionCallback | undefined;
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          watchPosition(sukces: PositionCallback) {
            odczyt = sukces;
            return 1;
          },
          clearWatch() {
            odczyt = undefined;
          },
        },
      });
      Object.assign(window, {
        podajPomiar: (dlugosc: number) =>
          odczyt?.({
            coords: {
              latitude: 54.062392199421,
              longitude: dlugosc,
              accuracy: 5,
            },
            timestamp: Date.now(),
          } as GeolocationPosition),
      });
    });
    const pomiar = async (dlugosc: number) => {
      await strona.evaluate(
        (wartosc) =>
          (
            window as unknown as Window & {
              podajPomiar: (dlugosc: number) => void;
            }
          ).podajPomiar(wartosc),
        dlugosc,
      );
    };
    await strona.goto("/");
    await strona.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await strona.reload();
    await kliknij(strona, "Rozpocznij opowieść");
    await kliknij(strona, "Mapa");
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-gotowa",
      "true",
    );
    await strona.getByLabel("Rejestruj przebytą drogę").check();
    await kliknij(strona, "Włącz GPS mapy");
    await pomiar(15.26585);
    await strona.waitForTimeout(3100);
    await pomiar(15.266);
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-punktow",
      "2",
    );
    await strona.getByLabel("Pokaż przebytą drogę").uncheck();
    await pomiar(15.28);
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-widoczny",
      "false",
    );
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-punktow",
      "2",
    );
    await oczekuj(
      strona.getByRole("button", { name: "Wyłącz GPS mapy" }),
    ).toBeVisible();
    await oczekuj(
      strona.getByRole("img", {
        name: "Ostatnia zaakceptowana pozycja gracza",
      }),
    ).toBeVisible();
    await kontekst.setOffline(true);
    await strona.reload();
    await kliknij(strona, "Wznów opowieść");
    await kliknij(strona, "Mapa");
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-gotowa",
      "true",
    );
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-punktow",
      "2",
    );
    await oczekuj(strona.getByLabel("Pokaż przebytą drogę")).not.toBeChecked();
    await strona.getByLabel("Pokaż przebytą drogę").check();
    await kliknij(strona, "Powiększ mapę");
    await kliknij(strona, "Znajdź moją pozycję");
    await strona
      .locator(".mapa")
      .screenshot({ path: daneTestu.outputPath("pergamin-390.png") });
    await kliknij(strona, "Wyczyść ślad tej rozgrywki");
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-punktow",
      "0",
    );
    await oczekuj(
      strona.getByRole("img", {
        name: "Ostatnia zaakceptowana pozycja gracza",
      }),
    ).toBeVisible();
    await kliknij(strona, "Tajemnice Trzebiatowa");
    await kliknij(strona, "Nowa wyprawa bez starego śladu");
    await kliknij(strona, "Mapa");
    await oczekuj(strona.locator(".mapa")).toHaveAttribute(
      "data-slad-punktow",
      "0",
    );
    await oczekuj(
      strona.getByRole("img", {
        name: "Ostatnia zaakceptowana pozycja gracza",
      }),
    ).toHaveCount(0);
  },
);
