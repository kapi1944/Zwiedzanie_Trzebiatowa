import type { DefinicjaLokalizacji, StanGry } from "@zwiedzanie/schemat-tresci";

export interface Pozycja {
  szerokosc: number;
  dlugosc: number;
}
export function obliczOdlegloscMetry(
  poczatek: Pozycja,
  koniec: Pozycja,
): number {
  const radiany = Math.PI / 180;
  const skladnik =
    Math.sin(((koniec.szerokosc - poczatek.szerokosc) * radiany) / 2) ** 2 +
    Math.cos(poczatek.szerokosc * radiany) *
      Math.cos(koniec.szerokosc * radiany) *
      Math.sin(((koniec.dlugosc - poczatek.dlugosc) * radiany) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, skladnik)));
}
export type WynikLokalizacji =
  | "BRAK_WSPARCIA"
  | "BRAK_ZGODY"
  | "ODMOWA"
  | "TIMEOUT"
  | "NIEDOSTEPNA"
  | "SLABA_DOKLADNOSC"
  | "POZA_PROMIENIEM"
  | "W_PROMIENIU";
export function ocenPozycje(
  miejsce: DefinicjaLokalizacji,
  pozycja: Pozycja,
  dokladnosc: number,
): WynikLokalizacji {
  if (!miejsce.geo || miejsce.trybPotwierdzenia === "TYLKO_RECZNIE")
    return "NIEDOSTEPNA";
  if (
    !Number.isFinite(dokladnosc) ||
    dokladnosc < 0 ||
    dokladnosc >
      (miejsce.geo.dokladnoscWymaganaMetry ??
        miejsce.geo.promienPotwierdzeniaMetry)
  )
    return "SLABA_DOKLADNOSC";
  if (
    !Number.isFinite(pozycja.szerokosc) ||
    !Number.isFinite(pozycja.dlugosc) ||
    Math.abs(pozycja.szerokosc) > 90 ||
    Math.abs(pozycja.dlugosc) > 180
  )
    return "NIEDOSTEPNA";
  return obliczOdlegloscMetry(pozycja, miejsce.geo) <=
    miejsce.geo.promienPotwierdzeniaMetry
    ? "W_PROMIENIU"
    : "POZA_PROMIENIEM";
}
export class AdapterLokalizacji {
  #geolokalizacja: Pick<Geolocation, "getCurrentPosition"> | undefined;
  constructor(
    geolokalizacja:
      | Pick<Geolocation, "getCurrentPosition">
      | undefined = typeof navigator === "undefined"
      ? undefined
      : navigator.geolocation,
  ) {
    this.#geolokalizacja = geolokalizacja;
  }
  sprawdz(
    miejsce: DefinicjaLokalizacji,
    zgoda: boolean,
  ): Promise<WynikLokalizacji> {
    if (!zgoda) return Promise.resolve("BRAK_ZGODY");
    if (!this.#geolokalizacja) return Promise.resolve("BRAK_WSPARCIA");
    if (!miejsce.geo || miejsce.trybPotwierdzenia === "TYLKO_RECZNIE")
      return Promise.resolve("NIEDOSTEPNA");
    return new Promise((zakoncz) => {
      try {
        this.#geolokalizacja?.getCurrentPosition(
          ({ coords: dane }) =>
            zakoncz(
              ocenPozycje(
                miejsce,
                { szerokosc: dane.latitude, dlugosc: dane.longitude },
                dane.accuracy,
              ),
            ),
          (blad) =>
            zakoncz(
              blad.code === 1
                ? "ODMOWA"
                : blad.code === 3
                  ? "TIMEOUT"
                  : "NIEDOSTEPNA",
            ),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
        );
      } catch {
        zakoncz("NIEDOSTEPNA");
      }
    });
  }
}
export function miejscaNaMapie(
  lokalizacje: readonly DefinicjaLokalizacji[],
  stan: StanGry,
) {
  return lokalizacje.filter((miejsce) =>
    stan.odblokowaneLokalizacje.includes(miejsce.id),
  );
}
export function aktualneMiejsce(
  lokalizacje: readonly DefinicjaLokalizacji[],
  stan: StanGry,
) {
  return (
    lokalizacje.find((miejsce) => miejsce.idSceny === stan.aktualnaScena) ??
    lokalizacje.find(
      (miejsce) => miejsce.id === stan.odwiedzoneLokalizacje.at(-1),
    )
  );
}
