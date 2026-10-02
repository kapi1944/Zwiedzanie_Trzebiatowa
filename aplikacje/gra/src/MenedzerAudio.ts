import type { EfektGry } from "@zwiedzanie/schemat-tresci";
import type { TagNarracji } from "@zwiedzanie/silnik-narracji";
import type { UstawieniaAudio } from "./ustawienia-audio";

export type EfektAudio = Extract<
  EfektGry,
  { rodzaj: "ODTWORZ_DZWIEK" | "USTAW_NASTROJ_MUZYKI" }
>;
export interface OdtwarzaczAudio {
  graj: () => void;
  pauza: () => void;
  zwolnij: () => void;
  glosnosc: (wartosc: number) => void;
  przejscie: (od: number, doWartosci: number, czas: number) => void;
}
export type FabrykaAudio = (
  sciezka: string,
  petla: boolean,
  glosnosc: number,
  zakoncz: () => void,
  blad: () => void,
) => OdtwarzaczAudio;
export interface ZasobyAudio {
  dzwieki: Readonly<Record<string, string>>;
  nastroje: Readonly<Record<string, string>>;
}

export function efektyZTagow(tagi: readonly TagNarracji[]): EfektAudio[] {
  return tagi.flatMap((tag): EfektAudio[] =>
    tag.rodzaj === "dzwiek"
      ? [{ rodzaj: "ODTWORZ_DZWIEK", id: tag.wartosc }]
      : tag.rodzaj === "nastroj"
        ? [{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: tag.wartosc }]
        : [],
  );
}

export class MenedzerAudio {
  #aktywny = false;
  #widoczny = true;
  #zamkniety = false;
  #nastroj = "cisza";
  #muzyka: OdtwarzaczAudio | undefined;
  #poprzednia: OdtwarzaczAudio | undefined;
  #efekty = new Set<OdtwarzaczAudio>();
  #timer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private fabryka: FabrykaAudio,
    private zasoby: ZasobyAudio,
    private ustawienia: UstawieniaAudio,
    private profil: "PELNY" | "EKO",
    private odblokuj: () => Promise<void>,
    private zglosBlad: () => void,
  ) {}
  aktywuj() {
    if (this.#zamkniety) return;
    this.#aktywny = true;
    // Wywolywane przez warstwe aplikacji w reakcji na gest; polityka browsera pozostaje nadrzedna.
    try {
      void this.odblokuj().catch(() => this.zglosBlad());
    } catch {
      this.zglosBlad();
    }
    this.#ustawMuzyke();
  }
  przywrocNastroj(tagi: readonly TagNarracji[]) {
    this.wykonaj(
      efektyZTagow(tagi).filter(
        (efekt) => efekt.rodzaj === "USTAW_NASTROJ_MUZYKI",
      ),
    );
  }
  ustaw(ustawienia: UstawieniaAudio, profil: "PELNY" | "EKO") {
    this.ustawienia = ustawienia;
    this.profil = profil;
    if (!ustawienia.dzwiek || ustawienia.glosnoscEfektow === 0)
      this.#zatrzymajEfekty();
    else
      for (const efekt of this.#efekty)
        this.#bezpiecznie(() => efekt.glosnosc(ustawienia.glosnoscEfektow));
    if (profil === "EKO") {
      this.#zwolnijPoprzednia();
      while (this.#efekty.size > 1) {
        const efekt = this.#efekty.values().next().value;
        if (!efekt) break;
        this.#usunEfekt(efekt);
      }
    }
    this.#ustawMuzyke();
  }
  wykonaj(efekty: readonly EfektAudio[]) {
    if (this.#zamkniety) return;
    for (const efekt of efekty) {
      if (efekt.rodzaj === "USTAW_NASTROJ_MUZYKI") {
        if (
          efekt.id !== "cisza" &&
          !Object.hasOwn(this.zasoby.nastroje, efekt.id)
        )
          continue;
        if (this.#nastroj === efekt.id) continue;
        this.#nastroj = efekt.id;
        this.#zmienMuzyke();
      } else if (
        this.#aktywny &&
        this.#widoczny &&
        this.ustawienia.dzwiek &&
        this.ustawienia.glosnoscEfektow > 0 &&
        Object.hasOwn(this.zasoby.dzwieki, efekt.id)
      ) {
        if (this.#efekty.size >= (this.profil === "EKO" ? 1 : 3)) continue;
        this.#bezpiecznie(() => {
          const dzwiek = this.fabryka(
            this.zasoby.dzwieki[efekt.id] as string,
            false,
            this.ustawienia.glosnoscEfektow,
            () => this.#usunEfekt(dzwiek),
            () => {
              this.#usunEfekt(dzwiek);
              this.zglosBlad();
            },
          );
          this.#efekty.add(dzwiek);
          try {
            dzwiek.graj();
          } catch (blad) {
            this.#usunEfekt(dzwiek);
            throw blad;
          }
        });
      }
    }
  }
  ustawWidocznosc(widoczny: boolean) {
    if (this.#widoczny === widoczny || this.#zamkniety) return;
    this.#widoczny = widoczny;
    if (!widoczny) {
      this.#zwolnijPoprzednia();
      this.#zatrzymajEfekty();
      this.#bezpiecznie(() => this.#muzyka?.pauza());
    } else this.#ustawMuzyke();
  }
  zamknij() {
    this.#zamkniety = true;
    this.#aktywny = false;
    this.#zwolnijPoprzednia();
    this.#zatrzymajEfekty();
    this.#bezpiecznie(() => this.#muzyka?.zwolnij());
    this.#muzyka = undefined;
  }
  #bezpiecznie(akcja: () => void) {
    try {
      akcja();
    } catch {
      this.zglosBlad();
    }
  }
  #usunEfekt(efekt: OdtwarzaczAudio) {
    this.#efekty.delete(efekt);
    this.#bezpiecznie(() => efekt.zwolnij());
  }
  #zatrzymajEfekty() {
    for (const efekt of this.#efekty) this.#usunEfekt(efekt);
  }
  #zwolnijPoprzednia() {
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#bezpiecznie(() => this.#poprzednia?.zwolnij());
    this.#poprzednia = undefined;
  }
  #zmienMuzyke() {
    this.#zwolnijPoprzednia();
    const poprzednia = this.#muzyka;
    this.#muzyka = undefined;
    if (
      poprzednia &&
      this.profil === "PELNY" &&
      this.#widoczny &&
      this.ustawienia.muzyka &&
      this.ustawienia.glosnoscMuzyki > 0 &&
      this.#nastroj !== "cisza"
    ) {
      this.#poprzednia = poprzednia;
      this.#bezpiecznie(() =>
        poprzednia.przejscie(this.ustawienia.glosnoscMuzyki, 0, 400),
      );
      this.#timer = setTimeout(() => this.#zwolnijPoprzednia(), 400);
    } else this.#bezpiecznie(() => poprzednia?.zwolnij());
    this.#ustawMuzyke(true);
  }
  #ustawMuzyke(przejscie = false) {
    if (this.#zamkniety) return;
    if (
      !this.ustawienia.muzyka ||
      this.ustawienia.glosnoscMuzyki === 0 ||
      this.#nastroj === "cisza"
    ) {
      this.#zwolnijPoprzednia();
      this.#bezpiecznie(() => this.#muzyka?.zwolnij());
      this.#muzyka = undefined;
      return;
    }
    if (!this.#aktywny || !this.#widoczny) return;
    this.#bezpiecznie(() => {
      if (!this.#muzyka) {
        const sciezka = this.zasoby.nastroje[this.#nastroj];
        if (!sciezka) return;
        const muzyka = this.fabryka(
          sciezka,
          true,
          this.ustawienia.glosnoscMuzyki,
          () => {},
          () => {
            if (this.#muzyka === muzyka) this.#muzyka = undefined;
            muzyka.zwolnij();
            this.zglosBlad();
          },
        );
        this.#muzyka = muzyka;
        if (przejscie && this.profil === "PELNY") muzyka.glosnosc(0);
        try {
          muzyka.graj();
        } catch (blad) {
          this.#muzyka = undefined;
          muzyka.zwolnij();
          throw blad;
        }
        if (przejscie && this.profil === "PELNY")
          muzyka.przejscie(0, this.ustawienia.glosnoscMuzyki, 400);
      } else {
        this.#muzyka.glosnosc(this.ustawienia.glosnoscMuzyki);
        this.#muzyka.graj();
      }
    });
  }
}
