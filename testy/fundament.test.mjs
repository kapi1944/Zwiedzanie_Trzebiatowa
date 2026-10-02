import { strict as sprawdz } from "node:assert";
import { readFile as odczytajPlik } from "node:fs/promises";
import { test as testuj } from "node:test";

for (const nazwa of [
  "silnik-gry",
  "silnik-narracji",
  "schemat-tresci",
  "typy-wspolne",
]) {
  testuj(`Pakiet ${nazwa} udostepnia poprawny modul ESM`, async () => {
    const modul = await import(`@zwiedzanie/${nazwa}`);
    sprawdz.equal(typeof modul, "object");
    await odczytajPlik(
      new URL(`../pakiety/${nazwa}/dist/index.d.ts`, import.meta.url),
      "utf8",
    );
  });
}

testuj("Gra ma zbudowany punkt wejscia", async () => {
  const dokument = await odczytajPlik(
    new URL("../aplikacje/gra/dist/index.html", import.meta.url),
    "utf8",
  );
  sprawdz.match(dokument, /lang="pl"/);
  sprawdz.match(dokument, /Kronika nad Regą/);
  sprawdz.match(dokument, /type="module"/);
});

testuj("Strona eksportuje statyczny ekran startowy", async () => {
  const dokument = await odczytajPlik(
    new URL("../aplikacje/strona/out/index.html", import.meta.url),
    "utf8",
  );
  for (const tekst of [
    "Zwiedzanie Trzebiatowa",
    "Interaktywna gra terenowa",
    "Projekt w przygotowaniu",
  ])
    sprawdz.ok(dokument.includes(tekst));
});
