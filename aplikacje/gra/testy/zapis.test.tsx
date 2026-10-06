// @vitest-environment node
import "fake-indexeddb/auto";
import {
  existsSync as istniejePlik,
  readFileSync as odczytajPlik,
} from "node:fs";
import { openDB as otworzBaze } from "idb";
import { expect, test } from "vitest";
import { MagazynZapisu } from "../src/MagazynZapisu";
import { SesjaGry } from "../src/sesja-gry";
import { ocenZgodnoscZapisu, sprawdzPakietOffline } from "../src/zapis-gry";

function wybierz(gra: SesjaGry, tekst: string) {
  const opcja = gra.odczytaj().opcje.find((element) => element.tekst === tekst);
  if (!opcja) throw new Error(`Brak opcji: ${tekst}`);
  gra.wybierz(opcja.indeks);
}
function dojdzDoScenki() {
  const gra = new SesjaGry();
  gra.wybierz(0);
  gra.podpowiedz();
  gra.potwierdzObserwacje();
  wybierz(gra, "Otwieram miejsce na własną notatkę.");
  wybierz(gra, "Zestawiam obie notatki.");
  return gra;
}
function przywroc(gra: SesjaGry) {
  return SesjaGry.przywroc(gra.eksportujZapis(), gra.eksportujPakiet());
}

test("zapis Gry i Ink nie zawiera skompilowanej historii, ma tozsamosc i date", () => {
  const gra = new SesjaGry();
  gra.wybierz(0);
  const zapis = gra.eksportujZapis();
  expect(zapis.stanGry).toEqual(gra.odczytaj().stan);
  expect(zapis.stanNarracji.ramka).toEqual(gra.odczytaj().ramka);
  expect(JSON.parse(zapis.stanNarracji.zapisInk)).toMatchObject({
    wersja: 2,
    hashNarracji: zapis.hashNarracji,
    stanInk: expect.any(String),
  });
  expect(JSON.parse(zapis.stanNarracji.zapisInk)).not.toHaveProperty("tresc");
  expect(zapis.wersjaFormatuZapisu).toBe(1);
  expect(zapis.zapisanoDnia).toMatch(/^\d{4}-/);
  expect(zapis.stanGry.dokonaneWybory).toEqual(["prolog_dowod"]);
});
test("nowa instancja zachowuje scene, Ink i wynik zagadki; kontynuacja identyczna", () => {
  const gra = new SesjaGry();
  gra.wybierz(0);
  gra.potwierdzObserwacje();
  const odtworzona = przywroc(gra);
  expect(odtworzona.odczytaj()).toEqual(gra.odczytaj());
  expect(odtworzona.eksportujZapis().stanNarracji.zapisInk).toBe(
    gra.eksportujZapis().stanNarracji.zapisInk,
  );
  gra.wybierz(0);
  odtworzona.wybierz(0);
  expect(odtworzona.odczytaj()).toEqual(gra.odczytaj());
});
test("scenka opcjonalna zachowana i wznawia wspolna droge", () => {
  const gra = dojdzDoScenki();
  const odtworzona = przywroc(gra);
  expect(odtworzona.odczytaj().stan.aktualnaScena).toBe("dwie_notatki");
  expect(odtworzona.odczytaj().stan.odkryteScenki).toContain(
    "scenka_dwie_notatki",
  );
  expect(odtworzona.odczytaj()).toEqual(gra.odczytaj());
  wybierz(odtworzona, "Wracam do wspólnej drogi.");
  expect(odtworzona.odczytaj().stan.aktualnaScena).toBe("kosciol_decyzja");
});
test("profil i epilogi zachowane po wznowieniu finalu", () => {
  const gra = dojdzDoScenki();
  wybierz(gra, "Wracam do wspólnej drogi.");
  wybierz(gra, "Zapisuję informację i jej źródło.");
  gra.pomin();
  wybierz(gra, "Zachowuję obie wersje i zaznaczam ich różny charakter.");
  const odtworzona = przywroc(gra);
  expect(odtworzona.odczytaj().profil).toEqual(gra.odczytaj().profil);
  expect(odtworzona.odczytaj().profil?.epilogiWatkow).toHaveLength(2);
  expect(odtworzona.odczytaj().ramka).toEqual(gra.odczytaj().ramka);
});
test("zgodnosc v1 -> v1, jawna potrzeba migracji i odrzucenie obcej gry", () => {
  const gra = new SesjaGry();
  const zapis = gra.eksportujZapis();
  const pakiet = gra.eksportujPakiet();
  expect(ocenZgodnoscZapisu(zapis, pakiet)).toBe("ZGODNY");
  for (const zmiana of [
    { wersjaFormatuZapisu: 2 },
    { wersjaTresci: "2" },
    { wersjaSchematZapisu: 2 },
  ]) {
    expect(ocenZgodnoscZapisu({ ...zapis, ...zmiana }, pakiet)).toBe(
      "WYMAGA_MIGRACJI",
    );
    expect(() => SesjaGry.przywroc({ ...zapis, ...zmiana }, pakiet)).toThrow();
  }
  expect(ocenZgodnoscZapisu({ ...zapis, idGry: "inna" }, pakiet)).toBe(
    "NIEZGODNY",
  );
  expect(() =>
    SesjaGry.przywroc({ ...zapis, hashNarracji: "0".repeat(64) }, pakiet),
  ).toThrow();
});
test("hashy pakietu nie mozna podmienic; stan Gry musi odpowiadac dziennikowi", async () => {
  const gra = new SesjaGry();
  const zapis = gra.eksportujZapis();
  await expect(
    sprawdzPakietOffline(gra.eksportujPakiet()),
  ).resolves.toBeDefined();
  await expect(
    sprawdzPakietOffline({ ...gra.eksportujPakiet(), narracja: "{}" }),
  ).rejects.toThrow();
  expect(() =>
    SesjaGry.przywroc(
      { ...zapis, stanGry: { ...zapis.stanGry, flagi: { sfalszowana: true } } },
      gra.eksportujPakiet(),
    ),
  ).toThrow();
});
test("IndexedDB zapis i restore po zamknieciu magazynu", async () => {
  const nazwa = crypto.randomUUID();
  const magazyn = new MagazynZapisu(nazwa);
  const gra = dojdzDoScenki();
  await magazyn.zapisz(gra.eksportujZapis(), gra.eksportujPakiet());
  await magazyn.zamknij();
  const nowy = new MagazynZapisu(nazwa);
  const odczyt = await nowy.odczytaj();
  expect(odczyt?.zapis.stanGry).toEqual(gra.odczytaj().stan);
  if (!odczyt) throw new Error("Brak zapisu.");
  expect(SesjaGry.przywroc(odczyt.zapis, odczyt.pakiet).odczytaj()).toEqual(
    gra.odczytaj(),
  );
  await nowy.zamknij();
});
test("uszkodzony zapis nie nadpisuje poprawnego, kolejka dziala po bledzie", async () => {
  const magazyn = new MagazynZapisu(crypto.randomUUID());
  const gra = new SesjaGry();
  const zapis = gra.eksportujZapis();
  await magazyn.zapisz(zapis, gra.eksportujPakiet());
  await expect(
    magazyn.zapisz(
      { ...zapis, stanNarracji: { ...zapis.stanNarracji, zapisInk: "{}" } },
      gra.eksportujPakiet(),
    ),
  ).rejects.toThrow();
  expect((await magazyn.odczytaj())?.zapis).toEqual(zapis);
  gra.wybierz(0);
  await magazyn.zapisz(gra.eksportujZapis(), gra.eksportujPakiet());
  expect((await magazyn.odczytaj())?.zapis.stanGry.aktualnaScena).toBe(
    "hansken",
  );
  await magazyn.zamknij();
});
test("wiele szybkich zapisow zachowuje kolejnosc i jeden pakiet tresci", async () => {
  const nazwa = crypto.randomUUID();
  const magazyn = new MagazynZapisu(nazwa);
  const gra = new SesjaGry();
  const pakiet = gra.eksportujPakiet();
  const pierwszy = magazyn.zapisz(gra.eksportujZapis(), pakiet);
  gra.wybierz(0);
  const drugi = magazyn.zapisz(gra.eksportujZapis(), pakiet);
  gra.podpowiedz();
  const trzeci = magazyn.zapisz(gra.eksportujZapis(), pakiet);
  await Promise.all([pierwszy, drugi, trzeci]);
  expect((await magazyn.odczytaj())?.zapis.stanGry).toEqual(
    gra.odczytaj().stan,
  );
  const baza = await otworzBaze(nazwa);
  expect(await baza.count("pakiety")).toBe(1);
  baza.close();
  await magazyn.zamknij();
});
test("stary zapis i rozgalezienie z innej karty nie cofaja postepu", async () => {
  const nazwa = crypto.randomUUID();
  const magazyn = new MagazynZapisu(nazwa);
  const innaKarta = new MagazynZapisu(nazwa);
  const gra = new SesjaGry();
  const pakiet = gra.eksportujPakiet();
  const stary = gra.eksportujZapis();
  gra.wybierz(0);
  await magazyn.zapisz(gra.eksportujZapis(), pakiet);
  await expect(innaKarta.zapisz(stary, pakiet)).rejects.toThrow();
  const innaGra = new SesjaGry();
  innaGra.wybierz(1);
  await expect(
    innaKarta.zapisz(innaGra.eksportujZapis(), pakiet),
  ).rejects.toThrow();
  expect((await magazyn.odczytaj())?.zapis.stanGry).toEqual(
    gra.odczytaj().stan,
  );
  await magazyn.zamknij();
  await innaKarta.zamknij();
});
test("pakiet aktywnej sesji jest przywrocony niezaleznie od nowej tresci aplikacji", async () => {
  const gra = new SesjaGry();
  gra.wybierz(0);
  const pakiet = gra.eksportujPakiet();
  const nowszy = {
    ...pakiet,
    definicje: {
      ...pakiet.definicje,
      manifest: { ...pakiet.definicje.manifest, wersjaTresci: "2" },
    },
  };
  expect(ocenZgodnoscZapisu(gra.eksportujZapis(), nowszy)).toBe(
    "WYMAGA_MIGRACJI",
  );
  const magazyn = new MagazynZapisu(crypto.randomUUID());
  await magazyn.zapisz(gra.eksportujZapis(), pakiet);
  const odczyt = await magazyn.odczytaj();
  if (!odczyt) throw new Error("Brak zapisu.");
  expect(SesjaGry.przywroc(odczyt.zapis, odczyt.pakiet).odczytaj()).toEqual(
    gra.odczytaj(),
  );
  await magazyn.zamknij();
});
test("efekt ZAPISZ_STAN wymaga utrwalenia calej zakonczonej akcji", () => {
  const gra = new SesjaGry();
  expect(gra.wymagaZapisu).toBe(true);
  const zapis = gra.eksportujZapis();
  gra.potwierdzZapisanie(zapis.stanGry.dziennikZdarzen.length);
  expect(gra.wymagaZapisu).toBe(false);
  gra.wybierz(0);
  gra.potwierdzZapisanie(zapis.stanGry.dziennikZdarzen.length);
  expect(gra.wymagaZapisu).toBe(true);
  expect(przywroc(gra).odczytaj().stan.aktywnaZagadka).toBe("zagadka_hansken");
});
test("artefakt SW zawiera shell i tresc offline, mapa dopiero na zadanie", () => {
  const sw = odczytajPlik(new URL("../dist/sw.js", import.meta.url), "utf8");
  const manifest = JSON.parse(
    odczytajPlik(
      new URL("../dist/.vite/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const pliki = [...sw.matchAll(/url:"([^"]+)"/g)].map((wynik) => wynik[1]);
  expect(pliki).toContain("index.html");
  for (const element of Object.values(manifest) as {
    file: string;
    css?: string[];
  }[]) {
    if (
      element.file.startsWith("assets/Mapa-") ||
      element.file.startsWith("assets/audio-") ||
      element.file.startsWith("assets/geometria-") ||
      element.file.endsWith(".wav")
    ) {
      expect(pliki).not.toContain(element.file);
      for (const css of element.css ?? []) expect(pliki).not.toContain(css);
      continue;
    }
    expect(pliki).toContain(element.file);
    for (const css of element.css ?? []) expect(pliki).toContain(css);
  }
  for (const plik of pliki)
    expect(istniejePlik(new URL(`../dist/${plik}`, import.meta.url))).toBe(
      true,
    );
  expect(pliki.every((plik) => !plik?.includes("://"))).toBe(true);
  expect(sw).not.toMatch(/tile\.openstreetmap|https:\/\//);
  expect(sw).toContain("SKIP_WAITING");
  expect(sw).toContain("mapa-na-zadanie");
  expect(sw).not.toMatch(/clientsClaim\(/);
});
test("manifest PWA ma polski jezyk, standalone i lokalne ikony PNG", () => {
  const manifest = JSON.parse(
    odczytajPlik(
      new URL("../dist/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  );
  expect(manifest).toMatchObject({
    lang: "pl",
    display: "standalone",
    start_url: "/",
    name: "Tajemnice Trzebiatowa",
    short_name: "Tajemnice",
  });
  for (const ikona of manifest.icons) {
    const bajty = odczytajPlik(new URL(`../dist${ikona.src}`, import.meta.url));
    expect(bajty.toString("hex", 0, 8)).toBe("89504e470d0a1a0a");
    const rozmiar = Number(ikona.sizes.split("x")[0]);
    expect(bajty.readUInt32BE(16)).toBe(rozmiar);
    expect(bajty.readUInt32BE(20)).toBe(rozmiar);
  }
});
