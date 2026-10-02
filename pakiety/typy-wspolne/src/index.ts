export type IdGry = string;
export type IdSceny = string;
export type IdLokalizacji = string;
export type IdZagadki = string;
export type IdWatku = string;

export interface KontekstNarracji {
  readonly flagi: Readonly<Record<string, boolean>>;
  readonly wynikiZagadek: Readonly<Record<string, string>>;
  readonly stanyWatkow: Readonly<Record<string, string>>;
  readonly sladyIPrzedmioty: readonly string[];
  readonly powinowactwa: Readonly<Record<string, number>>;
  readonly odwiedzoneLokalizacje: readonly string[];
  readonly dokonaneWybory: readonly string[];
}
