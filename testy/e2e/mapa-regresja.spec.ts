import {
  expect as oczekuj,
  type Page as Strona,
  test as testuj,
} from "@playwright/test";

async function otworz(strona: Strona, widok: string) {
  await strona
    .getByRole("navigation")
    .getByRole("button", { name: widok, exact: true })
    .click();
}

async function sprawdzMape(strona: Strona) {
  await oczekuj(strona.locator(".mapa")).toBeVisible();
  await oczekuj(strona.locator(".mapa")).toHaveAttribute("data-gotowa", "true");
  await oczekuj(
    strona.getByText("Mapa jest niedostępna. Kontynuuj w widoku Opowieść."),
  ).toHaveCount(0);
  await oczekuj(
    strona.getByRole("button", { name: "Powiększ mapę", exact: true }),
  ).toBeEnabled();
  await oczekuj(
    strona.getByRole("button", { name: /Wybierz cel: Pałac/ }),
  ).toHaveCount(0);
}

for (const motyw of ["light", "dark"] as const) {
  for (const gps of ["zgoda", "odmowa", "brak", "blad", "timeout"] as const) {
    testuj(
      `mapa: ${motyw}, GPS ${gps}, system i reczne animacje`,
      async ({ page: strona, context: kontekst }) => {
        const bledy: string[] = [];
        strona.on("pageerror", (blad) => bledy.push(blad.message));
        await strona.emulateMedia({
          colorScheme: motyw,
          reducedMotion: "reduce",
        });
        await kontekst.setGeolocation({
          latitude: 54.062392199421,
          longitude: 15.265858022611,
          accuracy: 5,
        });
        if (gps === "zgoda") await kontekst.grantPermissions(["geolocation"]);
        else
          await strona.addInitScript((wariant) => {
            Object.defineProperty(navigator, "geolocation", {
              configurable: true,
              value:
                wariant === "brak"
                  ? undefined
                  : {
                      getCurrentPosition: (
                        _sukces: PositionCallback,
                        blad: PositionErrorCallback,
                      ) =>
                        blad({
                          code:
                            wariant === "odmowa"
                              ? 1
                              : wariant === "timeout"
                                ? 3
                                : 2,
                        } as GeolocationPositionError),
                      watchPosition: (
                        _sukces: PositionCallback,
                        blad: PositionErrorCallback,
                      ) => {
                        setTimeout(
                          () => blad({ code: 1 } as GeolocationPositionError),
                          0,
                        );
                        return 1;
                      },
                      clearWatch: () => {},
                    },
            });
          }, gps);
        await strona.goto("/");
        await strona
          .getByRole("button", { name: "Rozpocznij opowieść", exact: true })
          .click();
        await oczekuj(
          strona.getByRole("heading", { name: "Rynek i Ratusz", exact: true }),
        ).toBeVisible();
        await otworz(strona, "Ustawienia");
        await strona.getByLabel("Tryb wydajności").selectOption("PELNY");
        await oczekuj(
          strona.getByLabel("Animacje interfejsu"),
        ).toHaveAccessibleDescription(
          "Określa intensywność animacji i efektów ruchu. Nie wpływa na rozgrywkę, mapę ani lokalizację.",
        );
        for (const ruch of ["SYSTEMOWY", "OGRANICZONY", "PELNY"]) {
          await strona.getByLabel("Animacje interfejsu").selectOption(ruch);
          await otworz(strona, "Opowieść");
          await otworz(strona, "Mapa");
          await sprawdzMape(strona);
          await strona
            .getByRole("button", {
              name: "Sprawdź moją lokalizację",
              exact: true,
            })
            .click();
          await oczekuj(
            strona.getByRole("region", { name: "Potwierdzenie obecności" }),
          ).toContainText(
            gps === "zgoda"
              ? "Pomiar jest"
              : gps === "brak"
                ? "nie obsługuje"
                : gps === "odmowa"
                  ? "Odmówiono"
                  : gps === "timeout"
                    ? "Upłynął czas"
                    : "Pozycja jest niedostępna",
          );
          await strona
            .getByRole("button", { name: "Włącz GPS mapy", exact: true })
            .click();
          if (gps === "zgoda") {
            await oczekuj(
              strona.getByRole("img", {
                name: "Ostatnia zaakceptowana pozycja gracza",
              }),
            ).toBeVisible();
            await strona
              .getByRole("button", { name: "Wyłącz GPS mapy", exact: true })
              .click();
          } else
            await oczekuj(
              strona.getByRole("button", {
                name: "Włącz GPS mapy",
                exact: true,
              }),
            ).toBeVisible();
          await sprawdzMape(strona);
          await oczekuj(
            strona.getByRole("button", {
              name: "Potwierdź ręcznie",
              exact: true,
            }),
          ).toBeEnabled();
          await otworz(strona, "Ustawienia");
        }
        await otworz(strona, "Mapa");
        await strona.evaluate(async () => {
          await navigator.serviceWorker.ready;
        });
        await strona.reload();
        await strona
          .getByRole("button", { name: "Wznów opowieść", exact: true })
          .click();
        await oczekuj(
          strona.getByRole("heading", { name: "Rynek i Ratusz", exact: true }),
        ).toBeVisible();
        await otworz(strona, "Mapa");
        await sprawdzMape(strona);
        await kontekst.setOffline(true);
        await otworz(strona, "Opowieść");
        await otworz(strona, "Mapa");
        await sprawdzMape(strona);
        oczekuj(bledy).toEqual([]);
      },
    );
  }
}
