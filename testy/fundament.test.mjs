import { strict as sprawdz } from "node:assert";
import {
  readFileSync as czytajPlik,
  existsSync as istniejePlik,
  readdirSync as odczytajKatalog,
} from "node:fs";
import { readFile as odczytajPlik } from "node:fs/promises";
import { dirname as katalogPliku, resolve as rozwiaz } from "node:path";
import { test as testuj } from "node:test";

import { zmierzWydajnosc } from "../narzedzia/zmierz-wydajnosc.mjs";

testuj("granice silnikow i brak cykli importow kodu produkcyjnego", () => {
  const korzen = rozwiaz(".");
  const moduly = new Map();
  const pliki = [];
  function zbierz(katalog) {
    for (const wpis of odczytajKatalog(katalog, { withFileTypes: true })) {
      const sciezka = rozwiaz(katalog, wpis.name);
      if (wpis.isDirectory()) zbierz(sciezka);
      else if (/\.(ts|tsx)$/.test(wpis.name) && !wpis.name.endsWith(".d.ts"))
        pliki.push(sciezka);
    }
  }
  for (const rodzaj of ["pakiety", "aplikacje"]) {
    for (const wpis of odczytajKatalog(rozwiaz(korzen, rodzaj), {
      withFileTypes: true,
    })) {
      if (!wpis.isDirectory()) continue;
      const katalog = rozwiaz(korzen, rodzaj, wpis.name);
      const pakiet = JSON.parse(
        czytajPlik(rozwiaz(katalog, "package.json"), "utf8"),
      );
      moduly.set(pakiet.name, rozwiaz(katalog, "src/index.ts"));
      for (const zrodla of ["src", "app"])
        if (istniejePlik(rozwiaz(katalog, zrodla)))
          zbierz(rozwiaz(katalog, zrodla));
    }
  }
  const graf = new Map();
  for (const sciezka of pliki) {
    const kod = czytajPlik(sciezka, "utf8").replace(
      /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
      "",
    );
    const krawedzie = [];
    const gry = sciezka.startsWith(rozwiaz("pakiety/silnik-gry/src"));
    const narracji = sciezka.startsWith(rozwiaz("pakiety/silnik-narracji/src"));
    if (gry || narracji) {
      sprawdz.doesNotMatch(
        kod,
        /\b(window|document|navigator|localStorage|sessionStorage|indexedDB|Audio|AudioContext|fetch|eval|Function|Date)\b/,
        sciezka,
      );
      sprawdz.doesNotMatch(kod, /Math\s*\.\s*random\b/, sciezka);
    }
    // Importy statyczne, reexporty i lazy importy o literalnej sciezce.
    for (const trafienie of kod.matchAll(
      /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g,
    )) {
      const nazwa = trafienie[1];
      if (gry || narracji)
        sprawdz.ok(
          nazwa.startsWith(".") ||
            (gry
              ? ["@zwiedzanie/schemat-tresci", "@zwiedzanie/typy-wspolne"]
              : ["inkjs", "@zwiedzanie/typy-wspolne"]
            ).includes(nazwa),
          `${sciezka}: ${nazwa}`,
        );
      const cel = nazwa.startsWith(".")
        ? rozwiaz(katalogPliku(sciezka), nazwa).replace(/\.js$/, ".ts")
        : moduly.get(nazwa);
      if (cel) {
        const rozwiazany = [
          cel,
          `${cel}.ts`,
          `${cel}.tsx`,
          rozwiaz(cel, "index.ts"),
        ].find((element) => pliki.includes(element));
        if (rozwiazany) krawedzie.push(rozwiazany);
      }
    }
    graf.set(sciezka, krawedzie);
  }
  const aktywne = new Set();
  const zakonczone = new Set();
  function sprawdzCykl(plik) {
    sprawdz.ok(!aktywne.has(plik), `Cykl importow: ${plik}`);
    if (zakonczone.has(plik)) return;
    aktywne.add(plik);
    for (const cel of graf.get(plik) ?? []) sprawdzCykl(cel);
    aktywne.delete(plik);
    zakonczone.add(plik);
  }
  pliki.forEach(sprawdzCykl);
});

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
  sprawdz.ok(!pomiary.poczatkowe.includes("src/audio.ts"));
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
