export interface UstawieniaAudio {
  dzwiek: boolean;
  muzyka: boolean;
  glosnoscEfektow: number;
  glosnoscMuzyki: number;
}
export const domyslneAudio: UstawieniaAudio = {
  dzwiek: false,
  muzyka: false,
  glosnoscEfektow: 0.4,
  glosnoscMuzyki: 0.2,
};
const kluczAudio = "trzebiatow.audio.v1";
export function odczytajUstawieniaAudio(): UstawieniaAudio {
  try {
    const dane = JSON.parse(localStorage.getItem(kluczAudio) ?? "null");
    if (
      dane &&
      typeof dane.dzwiek === "boolean" &&
      typeof dane.muzyka === "boolean" &&
      [dane.glosnoscEfektow, dane.glosnoscMuzyki].every(
        (wartosc) =>
          typeof wartosc === "number" &&
          Number.isFinite(wartosc) &&
          wartosc >= 0 &&
          wartosc <= 1,
      )
    ) {
      return {
        dzwiek: dane.dzwiek,
        muzyka: dane.muzyka,
        glosnoscEfektow: dane.glosnoscEfektow,
        glosnoscMuzyki: dane.glosnoscMuzyki,
      };
    }
  } catch {
    // Ustawienia audio nie sa wymagane do gry.
  }
  return { ...domyslneAudio };
}
export function zapiszUstawieniaAudio(ustawienia: UstawieniaAudio): boolean {
  try {
    localStorage.setItem(kluczAudio, JSON.stringify(ustawienia));
    return true;
  } catch {
    return false;
  }
}
