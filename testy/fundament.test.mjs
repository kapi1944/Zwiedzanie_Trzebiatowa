import { strict as sprawdz } from "node:assert";
import { readFile as odczytajPlik } from "node:fs/promises";
import { test as testuj } from "node:test";
import { zmierzWydajnosc } from "../narzedzia/zmierz-wydajnosc.mjs";

testuj("budzety gzip i lazy oparte na pomiarze Etapu 8", () => {
  const pomiary = zmierzWydajnosc();
  const baza = {
    initialJsGzip: 106725,
    sesjaGzip: 45122,
    mapaGzip: 44091,
    cssInitialGzip: 1491,
    cssMapaGzip: 6371,
  };
  for (const [nazwa, rozmiar] of Object.entries(baza)) {
    const prog = Math.ceil(rozmiar * 1.15) + 512;
    sprawdz.ok(
      pomiary[nazwa] <= prog,
      `${nazwa}: ${pomiary[nazwa]} > ${prog} B gzip`,
    );
  }
  sprawdz.ok(!pomiary.poczatkowe.includes("src/Mapa.tsx"));
  sprawdz.ok(!pomiary.poczatkowe.includes("src/sesja-gry.ts"));
});

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
