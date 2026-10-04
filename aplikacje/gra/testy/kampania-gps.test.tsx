// @vitest-environment node
import "fake-indexeddb/auto";
import { openDB as otworzBaze } from "idb";
import { expect as oczekuj, describe as opisz, test as testuj } from "vitest";
import inkSlice from "../../../tresc/trzebiatow-v1/dist/glowna.json";
import pakietSlice from "../../../tresc/trzebiatow-v1/dist/pakiet.json";
import tozsamoscSlice from "../../../tresc/trzebiatow-v1/dist/tozsamosc.json";
import { aktualneMiejsce } from "../src/lokalizacja";
import { MagazynZapisu } from "../src/MagazynZapisu";
import { naEkran, odprojektuj, projektuj } from "../src/mapa/geometria";
import {
  elementyDoRysowania,
  przygotujNakladke,
} from "../src/mapa/nakladka-historyczna";
import { miejscaGameplay, rozmiescZnaczniki } from "../src/mapa/warstwy-gracza";
import { SesjaGry } from "../src/sesja-gry";
import {
  odczytajSlad,
  type PunktSladu,
  przyjmijPomiar,
  pustySlad,
  uproscSlad,
} from "../src/slad-gps";

const pomiar = (metry = 0, czas = 10000, dokladnosc = 5) => ({
  szerokosc: 54.062,
  dlugosc: 15.266 + metry / 65400,
  czas,
  dokladnosc,
});
function wybierz(gra: SesjaGry, id: string) {
  const opcja = gra
    .odczytaj()
    .opcje.find((element) =>
      element.tagi.some((tag) => tag.rodzaj === "sygnal" && tag.wartosc === id),
    );
  if (!opcja) throw new Error(`Brak wyboru ${id}`);
  gra.wybierz(opcja.indeks);
}
function doRozdroza() {
  const gra = new SesjaGry();
  wybierz(gra, "prolog_obie");
  gra.pomin();
  wybierz(gra, "hansken_slucham");
  wybierz(gra, "kosciol_zapis");
  gra.pomin();
  wybierz(gra, "baszta_obie");
  wybierz(gra, "rozpocznij_kampanie");
  return gra;
}
opisz("Slad rzeczywistych pomiarow", () => {
  testuj(
    "jitter, stary odczyt, zla dokladnosc i kilkusetmetrowy kolec nie zmieniaja sladu",
    () => {
      const start = przyjmijPomiar(
        { ...pustySlad(), rejestracja: true },
        pomiar(),
        10000,
      );
      const jitter = przyjmijPomiar(start, pomiar(1, 15000), 15000);
      oczekuj(jitter.punkty).toHaveLength(1);
      oczekuj(przyjmijPomiar(jitter, pomiar(500, 18000), 18000)).toBe(jitter);
      oczekuj(przyjmijPomiar(jitter, pomiar(10, 18000, 100), 18000)).toBe(
        jitter,
      );
      oczekuj(przyjmijPomiar(jitter, pomiar(10, 9000), 18000)).toBe(jitter);
      oczekuj(przyjmijPomiar(jitter, pomiar(10, 20000), 160000)).toBe(jitter);
      oczekuj(przyjmijPomiar(jitter, pomiar(10, 40000), 18000)).toBe(jitter);
    },
  );
  testuj(
    "pozycja, rejestracja i widocznosc sa niezalezne; przerwa nie jest linia",
    () => {
      const start = przyjmijPomiar(
        { ...pustySlad(), rejestracja: true, widoczny: false },
        pomiar(),
        10000,
      );
      const dalej = przyjmijPomiar(start, pomiar(10, 15000), 15000);
      oczekuj(dalej.punkty).toHaveLength(2);
      const pauza = przyjmijPomiar(
        { ...dalej, rejestracja: false, nowyOdcinek: true },
        pomiar(20, 20000),
        20000,
      );
      oczekuj(pauza.pozycja?.dlugosc).toBe(pomiar(20).dlugosc);
      oczekuj(pauza.punkty).toHaveLength(2);
      const wznowiony = przyjmijPomiar(
        { ...pauza, rejestracja: true },
        pomiar(30, 25000),
        25000,
      );
      oczekuj(wznowiony.punkty.at(-1)?.poczatekOdcinka).toBe(true);
      const luka = przyjmijPomiar(wznowiony, pomiar(300, 100000), 100000);
      oczekuj(luka.punkty.at(-1)?.poczatekOdcinka).toBe(true);
    },
  );
  testuj("uproszczenie zachowuje zakret, nawrot i granice odcinkow", () => {
    const punkty: PunktSladu[] = [0, 10, 20, 30, 20, 10].map(
      (metry, indeks) => ({
        ...pomiar(metry, indeks * 5000),
        poczatekOdcinka: indeks === 0 || indeks === 4,
      }),
    );
    oczekuj(uproscSlad(punkty).map((punkt) => punkt.czas)).toEqual([
      0, 15000, 20000, 25000,
    ]);
    const zakret = {
      ...pomiar(20, 10000),
      poczatekOdcinka: false,
      szerokosc: 54.0621,
    };
    oczekuj(
      uproscSlad([punkty[0] ?? zakret, zakret, punkty[3] ?? zakret]),
    ).toContain(zakret);
    oczekuj(punkty).toHaveLength(6);
  });
  testuj("uszkodzony zapis nie jest cicho zastapiony pustym", () => {
    oczekuj(() => odczytajSlad({})).toThrow();
    oczekuj(() => odczytajSlad({ ...pustySlad(), punkty: [null] })).toThrow();
    oczekuj(odczytajSlad(pustySlad())).toEqual(pustySlad());
  });
  testuj(
    "IDB v1 migruje bez usuwania slice; slad jest lokalny i osobny dla sesji",
    async () => {
      const nazwa = `kampania_${crypto.randomUUID()}`;
      const stara = new SesjaGry(
        pakietSlice,
        JSON.stringify(inkSlice),
        tozsamoscSlice,
      );
      stara.wybierz(0);
      const zapisSlice = stara.eksportujZapis();
      const baza = await otworzBaze(nazwa, 1, {
        upgrade(baza) {
          baza.createObjectStore("zapisy");
          baza.createObjectStore("pakiety");
        },
      });
      await baza.put("zapisy", zapisSlice, "aktywna");
      await baza.put(
        "pakiety",
        stara.eksportujPakiet(),
        stara.eksportujPakiet().idPakietu,
      );
      baza.close();
      const magazyn = new MagazynZapisu(nazwa);
      const slad = przyjmijPomiar(
        { ...pustySlad(), rejestracja: true },
        pomiar(),
        10000,
      );
      await magazyn.zapiszSlad(stara.odczytaj().stan.idSesji, slad);
      await magazyn.zamknij();
      oczekuj((await magazyn.odczytaj())?.zapis.stanGry).toEqual(
        stara.odczytaj().stan,
      );
      oczekuj(
        await magazyn.odczytajSlad(stara.odczytaj().stan.idSesji),
      ).toEqual(slad);
      oczekuj(await magazyn.odczytajSlad("nowa_wyprawa")).toBeUndefined();
      await oczekuj(
        magazyn.zapiszSlad(stara.odczytaj().stan.idSesji, pustySlad()),
      ).rejects.toThrow("innej karcie");
      await magazyn.wyczyscSlad(stara.odczytaj().stan.idSesji);
      oczekuj(
        (await magazyn.odczytajSlad(stara.odczytaj().stan.idSesji))?.punkty,
      ).toEqual([]);
      await oczekuj(
        magazyn.zapiszSlad(stara.odczytaj().stan.idSesji, slad),
      ).rejects.toThrow("innej karcie");
      const nowa = new SesjaGry();
      await magazyn.rozpocznijNowa(
        stara.odczytaj().stan.idSesji,
        nowa.eksportujZapis(),
        nowa.eksportujPakiet(),
      );
      oczekuj((await magazyn.odczytaj())?.zapis.idSesji).toBe(
        nowa.odczytaj().stan.idSesji,
      );
      oczekuj(
        await magazyn.odczytajSlad(nowa.odczytaj().stan.idSesji),
      ).toBeUndefined();
      const kopie = await otworzBaze(nazwa, 2);
      oczekuj(
        await kopie.get("zapisy", `archiwum_${stara.odczytaj().stan.idSesji}`),
      ).toEqual(zapisSlice);
      kopie.close();
      await magazyn.zamknij();
    },
  );
});
opisz("Panorama i kampania", () => {
  testuj(
    "male ekrany zachowuja kotwice i pierwszenstwo celu bez nakladania przyciskow",
    () => {
      const gra = doRozdroza();
      const znaczniki = rozmiescZnaczniki(
        gra.definicje.lokalizacje,
        { zoom: 1.8, x: 0, y: 0 },
        320,
        600,
        "hansken",
      );
      oczekuj(
        znaczniki.find((znacznik) => znacznik.miejsce.id === "hansken")?.pelny,
      ).toBe(true);
      const pelne = znaczniki.filter((znacznik) => znacznik.pelny);
      for (const znacznik of znaczniki) {
        const geo = znacznik.miejsce.punktMapy ?? znacznik.miejsce.geo;
        if (!geo) throw new Error("Brak kotwicy znacznika.");
        oczekuj(znacznik.punkt).toEqual(
          naEkran(projektuj(geo), { zoom: 1.8, x: 0, y: 0 }, 320, 600),
        );
        for (const inny of pelne)
          if (znacznik.pelny && inny !== znacznik)
            oczekuj(
              Math.abs(znacznik.punkt.x - inny.punkt.x) >= 48 ||
                Math.abs(znacznik.punkt.y - inny.punkt.y) >= 48,
            ).toBe(true);
      }
    },
  );
  testuj(
    "GPS uzywa odwracalnej perspektywy 68 stopni i tego samego zoom/pan co podklad",
    () => {
      const geo = pomiar();
      const mapa = projektuj(geo);
      oczekuj(odprojektuj(mapa).szerokosc).toBeCloseTo(geo.szerokosc, 10);
      oczekuj(odprojektuj(mapa).dlugosc).toBeCloseTo(geo.dlugosc, 10);
      for (const [szerokosc, wysokosc] of [
        [320, 600],
        [844, 390],
        [1200, 900],
      ]) {
        const a = naEkran(
          mapa,
          { zoom: 2, x: 10, y: -20 },
          szerokosc ?? 320,
          wysokosc ?? 600,
        );
        const b = naEkran(
          mapa,
          { zoom: 2, x: 50, y: 30 },
          szerokosc ?? 320,
          wysokosc ?? 600,
        );
        oczekuj(b.x - a.x).toBeCloseTo(40);
        oczekuj(b.y - a.y).toBeCloseTo(50);
      }
      oczekuj(projektuj(geo, 30).y).toBeLessThan(mapa.y);
    },
  );
  testuj(
    "dawne niepewne bramy nie sa rysowane, mapa gameplay nie zdradza palacu",
    () => {
      oczekuj(elementyDoRysowania(przygotujNakladke([]))).toEqual([]);
      const gra = doRozdroza();
      oczekuj(
        aktualneMiejsce(
          gra.definicje.lokalizacje,
          gra.odczytaj().stan,
          gra.definicje.kampania?.scenyMiejsc,
        ),
      ).toBeUndefined();
      oczekuj(
        miejscaGameplay(gra.definicje.lokalizacje, gra.odczytaj().stan, [
          "ratusz",
          "hansken",
          "mury",
        ]).some((miejsce) => miejsce.id === "palac"),
      ).toBe(false);
      wybierz(gra, "cel_ratusz");
      oczekuj(
        aktualneMiejsce(
          gra.definicje.lokalizacje,
          gra.odczytaj().stan,
          gra.definicje.kampania?.scenyMiejsc,
        )?.id,
      ).toBe("ratusz");
    },
  );
  testuj(
    "zapis w trakcie zagadki i po finale zachowuje wiedze, pomoc, decyzje i reakcje Ink",
    () => {
      let gra = doRozdroza();
      wybierz(gra, "cel_ratusz");
      oczekuj(gra.odczytaj().wiedza).toHaveLength(0);
      gra.potwierdzObecnosc("ratusz");
      gra.odpowiedz("5");
      gra.podpowiedz();
      gra = SesjaGry.przywroc(gra.eksportujZapis(), gra.eksportujPakiet());
      gra.odpowiedz("4");
      oczekuj(gra.odczytaj().wynikZagadki).toBe("ROZWIAZANA_Z_PODPOWIEDZIA");
      oczekuj(gra.odczytaj().wiedza).toHaveLength(1);
      wybierz(gra, "ratusz_glos");
      wybierz(gra, "cel_mury");
      oczekuj(gra.odczytaj().ramka.akapity.join(" ")).toContain("głos");
      gra.pomin();
      wybierz(gra, "mury_glos");
      wybierz(gra, "kampania_final");
      oczekuj(gra.odczytaj().profil?.zakonczenieGlowne).toBe("otwarta_kronika");
      const odtworzona = SesjaGry.przywroc(
        gra.eksportujZapis(),
        gra.eksportujPakiet(),
      );
      oczekuj(odtworzona.odczytaj()).toEqual(gra.odczytaj());
    },
  );
});
