import type {
  KontekstNarracji,
  PowiazanieNarracji,
  TagNarracji,
} from "./modele.js";
import { parsujTagiNarracji } from "./tagi.js";

export class MostNarracji {
  readonly #powiazania: readonly PowiazanieNarracji[];
  #kontekst: KontekstNarracji;

  constructor(
    kontekst: KontekstNarracji,
    powiazania: readonly PowiazanieNarracji[] = [],
  ) {
    const nazwy = new Set<string>();
    for (const powiazanie of powiazania) {
      if (
        !/^[a-z][a-z0-9_]*$/.test(powiazanie.zmiennaInk) ||
        nazwy.has(powiazanie.zmiennaInk)
      ) {
        throw new Error("Niepoprawne lub powtorzone powiazanie zmiennej Ink.");
      }
      nazwy.add(powiazanie.zmiennaInk);
    }
    this.#powiazania = powiazania.map((powiazanie) => ({ ...powiazanie }));
    this.#kontekst = this.#skopiujKontekst(kontekst);
  }

  aktualizujKontekst(kontekst: KontekstNarracji): void {
    this.#kontekst = this.#skopiujKontekst(kontekst);
  }

  odczytajZmienne(): ReadonlyMap<string, boolean | string | number> {
    const zmienne = new Map<string, boolean | string | number>();
    for (const { zmiennaInk, obszar, klucz } of this.#powiazania) {
      const dane = this.#kontekst[obszar];
      let wartosc: unknown;
      if (Array.isArray(dane)) wartosc = dane.includes(klucz);
      else if (Object.hasOwn(dane, klucz))
        wartosc = (dane as Readonly<Record<string, unknown>>)[klucz];
      if (
        !["boolean", "string", "number"].includes(typeof wartosc) ||
        (typeof wartosc === "number" && !Number.isFinite(wartosc))
      )
        throw new Error("Brak poprawnej wartosci kontekstu narracji.");
      zmienne.set(zmiennaInk, wartosc as boolean | string | number);
    }
    return zmienne;
  }

  odczytajSygnaly(tagi: readonly TagNarracji[]): string[] {
    return tagi
      .filter(
        (tag) => tag.rodzaj === "sygnal" && typeof tag.wartosc === "string",
      )
      .flatMap((tag) => parsujTagiNarracji([`sygnal:${tag.wartosc}`]))
      .map((tag) => tag.wartosc);
  }

  #skopiujKontekst(kontekst: KontekstNarracji): KontekstNarracji {
    return {
      flagi: { ...kontekst.flagi },
      wynikiZagadek: { ...kontekst.wynikiZagadek },
      stanyWatkow: { ...kontekst.stanyWatkow },
      sladyIPrzedmioty: [...kontekst.sladyIPrzedmioty],
      powinowactwa: { ...kontekst.powinowactwa },
      odwiedzoneLokalizacje: [...kontekst.odwiedzoneLokalizacje],
      dokonaneWybory: [...kontekst.dokonaneWybory],
    };
  }
}
