// @vitest-environment node
import { readFileSync as odczytajPlik } from "node:fs";
import {
  schematDefinicjiLokalizacji,
  schematDefinicjiSceny,
  schematZdarzeniaGry,
} from "@zwiedzanie/schemat-tresci";
import { expect, test, vi } from "vitest";
import {
  AdapterLokalizacji,
  aktualneMiejsce,
  miejscaNaMapie,
  obliczOdlegloscMetry,
  ocenPozycje,
} from "../src/lokalizacja";
import { SesjaGry } from "../src/sesja-gry";

const miejsce = schematDefinicjiLokalizacji.parse(
  new SesjaGry().definicje.lokalizacje[0],
);
const punkt = { szerokosc: 0, dlugosc: 0 };
const cel = {
  ...miejsce,
  geo: {
    ...miejsce.geo,
    ...punkt,
    promienPotwierdzeniaMetry: 100,
    dokladnoscWymaganaMetry: 40,
    zrodloWspolrzednych: "https://example.org",
    charakterDanych: "Dane testowe",
  },
};

test("Haversine: zero, symetria i znana odleglosc stopnia na rowniku", () => {
  expect(obliczOdlegloscMetry(punkt, punkt)).toBe(0);
  const drugi = { szerokosc: 0, dlugosc: 1 };
  expect(obliczOdlegloscMetry(punkt, drugi)).toBeCloseTo(111194.9266, 3);
  expect(obliczOdlegloscMetry(punkt, drugi)).toBe(
    obliczOdlegloscMetry(drugi, punkt),
  );
});
test("punkt wewnatrz promienia", () => {
  expect(ocenPozycje(cel, punkt, 5)).toBe("W_PROMIENIU");
});
test("punkt poza promieniem", () => {
  expect(ocenPozycje(cel, { szerokosc: 0, dlugosc: 1 }, 5)).toBe(
    "POZA_PROMIENIEM",
  );
});
test("granica promienia jest wlaczona, tuz poza nia odrzucone", () => {
  const pozycja = { szerokosc: 0.001, dlugosc: 0 };
  const promien = obliczOdlegloscMetry(punkt, pozycja);
  expect(
    ocenPozycje(
      { ...cel, geo: { ...cel.geo, promienPotwierdzeniaMetry: promien } },
      pozycja,
      5,
    ),
  ).toBe("W_PROMIENIU");
  expect(
    ocenPozycje(
      {
        ...cel,
        geo: { ...cel.geo, promienPotwierdzeniaMetry: promien - 0.001 },
      },
      pozycja,
      5,
    ),
  ).toBe("POZA_PROMIENIEM");
});
test("slaba dokladnosc i bledne dane nie potwierdzaja obecnosci", () => {
  expect(ocenPozycje(cel, punkt, 41)).toBe("SLABA_DOKLADNOSC");
  expect(ocenPozycje(cel, punkt, 40)).toBe("W_PROMIENIU");
  expect(ocenPozycje(cel, { szerokosc: Number.NaN, dlugosc: 0 }, 5)).toBe(
    "NIEDOSTEPNA",
  );
});
test("bez swiadomej zgody adapter nie uruchamia pomiaru", async () => {
  const pomiar = vi.fn();
  expect(
    await new AdapterLokalizacji({ getCurrentPosition: pomiar }).sprawdz(
      cel,
      false,
    ),
  ).toBe("BRAK_ZGODY");
  expect(pomiar).not.toHaveBeenCalled();
});
test("brak wsparcia", async () => {
  expect(await new AdapterLokalizacji().sprawdz(cel, true)).toBe(
    "BRAK_WSPARCIA",
  );
});
test.each([
  [1, "ODMOWA"],
  [2, "NIEDOSTEPNA"],
  [3, "TIMEOUT"],
] as const)("blad browsera %s daje %s", async (kod, wynik) => {
  const adapter = new AdapterLokalizacji({
    getCurrentPosition: (_sukces, blad) =>
      blad?.({ code: kod } as GeolocationPositionError),
  });
  expect(await adapter.sprawdz(cel, true)).toBe(wynik);
});
test("pomiar punktowy z timeoutem, bez cache; wynik nie zawiera GPS", async () => {
  const pomiar = vi.fn((sukces: PositionCallback) =>
    sukces({
      coords: { latitude: 0, longitude: 0, accuracy: 5 },
    } as GeolocationPosition),
  );
  expect(
    await new AdapterLokalizacji({ getCurrentPosition: pomiar }).sprawdz(
      cel,
      true,
    ),
  ).toBe("W_PROMIENIU");
  expect(pomiar).toHaveBeenCalledOnce();
  expect(pomiar.mock.calls[0]?.length).toBe(3);
  expect((pomiar.mock.calls[0] as unknown[])[2]).toEqual({
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 0,
  });
});
test("tryb tylko reczny nie uruchamia GPS", async () => {
  const pomiar = vi.fn();
  expect(
    await new AdapterLokalizacji({ getCurrentPosition: pomiar }).sprawdz(
      { ...cel, trybPotwierdzenia: "TYLKO_RECZNIE" },
      true,
    ),
  ).toBe("NIEDOSTEPNA");
  expect(pomiar).not.toHaveBeenCalled();
});
test("mapa zawiera tylko odblokowane miejsca, bez scen narracji", () => {
  const sesja = new SesjaGry();
  expect(
    miejscaNaMapie(sesja.definicje.lokalizacje, sesja.odczytaj().stan).map(
      (punkt) => punkt.id,
    ),
  ).toEqual(["rynek"]);
  sesja.wybierz(0);
  expect(
    miejscaNaMapie(sesja.definicje.lokalizacje, sesja.odczytaj().stan).map(
      (punkt) => punkt.id,
    ),
  ).toEqual(["rynek", "hansken"]);
  expect(
    aktualneMiejsce(sesja.definicje.lokalizacje, sesja.odczytaj().stan)?.id,
  ).toBe("hansken");
});
test("reczne potwierdzenie wysyla kanoniczne zdarzenie bez GPS i jest idempotentne", () => {
  const sesja = new SesjaGry();
  const stan = sesja.potwierdzObecnosc("rynek").stan;
  expect(stan.potwierdzoneLokalizacje).toEqual(["rynek"]);
  expect(stan.dziennikZdarzen.at(-1)).toEqual({
    rodzaj: "POTWIERDZ_OBECNOSC",
    idLokalizacji: "rynek",
    idZdarzenia: expect.any(String),
    czas: expect.any(Number),
  });
  expect(sesja.potwierdzObecnosc("rynek").stan.dziennikZdarzen.length).toBe(
    stan.dziennikZdarzen.length,
  );
  expect(() => sesja.potwierdzObecnosc("baszta")).toThrow();
  expect(() =>
    schematZdarzeniaGry.parse({ ...stan.dziennikZdarzen.at(-1), geo: punkt }),
  ).toThrow();
});
test("scena ma osobny kontrakt i nie przyjmuje danych terenowych", () => {
  const scena = {
    id: "mini_final",
    nazwa: "Finał",
    klasyfikacja: "FABULARYZOWANE",
    idZrodla: [],
    wymagaWeryfikacjiTerenowej: false,
  };
  expect(schematDefinicjiSceny.safeParse(scena).success).toBe(true);
  expect(
    schematDefinicjiSceny.safeParse({ ...scena, geo: cel.geo }).success,
  ).toBe(false);
  expect(
    schematDefinicjiLokalizacji.safeParse({
      ...cel,
      geo: { ...cel.geo, szerokosc: 91 },
    }).success,
  ).toBe(false);
});
test("build laduje pergamin i geometrie OSM tylko na zadanie", () => {
  const manifest = JSON.parse(
    odczytajPlik(
      new URL("../dist/.vite/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const wejscie = manifest["index.html"];
  const mapa = manifest["src/Mapa.tsx"];
  expect(mapa.isDynamicEntry).toBe(true);
  expect(wejscie.dynamicImports).toContain("src/Mapa.tsx");
  const odwiedzone = new Set<string>();
  const sprawdz = (klucz: string) => {
    if (odwiedzone.has(klucz)) return;
    odwiedzone.add(klucz);
    for (const zaleznosc of manifest[klucz].imports ?? []) sprawdz(zaleznosc);
  };
  sprawdz("index.html");
  expect(odwiedzone.has("src/Mapa.tsx")).toBe(false);
  const kodMapy = odczytajPlik(
    new URL(`../dist/${mapa.file}`, import.meta.url),
    "utf8",
  );
  expect(kodMapy).toContain("geometria-");
  expect(kodMapy).not.toContain("Leaflet");
  for (const klucz of odwiedzone)
    expect(
      odczytajPlik(
        new URL(`../dist/${manifest[klucz].file}`, import.meta.url),
        "utf8",
      ),
    ).not.toContain("https://leafletjs.com");
});
