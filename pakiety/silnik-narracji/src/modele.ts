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

export interface KontekstNarracji {
  readonly flagi: Readonly<Record<string, boolean>>;
  readonly wynikiZagadek: Readonly<Record<string, string>>;
  readonly stanyWatkow: Readonly<Record<string, string>>;
  readonly sladyIPrzedmioty: readonly string[];
  readonly powinowactwa: Readonly<Record<string, number>>;
  readonly odwiedzoneLokalizacje: readonly string[];
  readonly dokonaneWybory: readonly string[];
}

export interface PowiazanieNarracji {
  readonly zmiennaInk: string;
  readonly obszar: keyof KontekstNarracji;
  readonly klucz: string;
}

export interface SesjaNarracji {
  readonly rodzaj: "sesja-narracji";
}
