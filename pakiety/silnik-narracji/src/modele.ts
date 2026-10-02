import type { KontekstNarracji } from "@zwiedzanie/typy-wspolne";

export interface OpcjaNarracji {
  indeks: number;
  tekst: string;
  tagi: TagNarracji[];
}

export type RodzajTagu = "dzwiek" | "nastroj" | "kronika" | "sygnal";
export interface TagNarracji {
  rodzaj: RodzajTagu;
  wartosc: string;
}

export interface RamkaNarracji {
  akapity: string[];
  opcje: OpcjaNarracji[];
  tagi: TagNarracji[];
  moznaKontynuowac: boolean;
}

export type { KontekstNarracji } from "@zwiedzanie/typy-wspolne";

export interface PowiazanieNarracji {
  readonly zmiennaInk: string;
  readonly obszar: keyof KontekstNarracji;
  readonly klucz: string;
}

export interface SesjaNarracji {
  readonly rodzaj: "sesja-narracji";
}
