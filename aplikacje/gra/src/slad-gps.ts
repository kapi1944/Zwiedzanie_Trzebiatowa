import { obliczOdlegloscMetry, type Pozycja } from "./lokalizacja";

export interface PomiarGps extends Pozycja {
  czas: number;
  dokladnosc: number;
}
export interface PunktSladu extends PomiarGps {
  poczatekOdcinka: boolean;
}
export interface StanSladu {
  punkty: PunktSladu[];
  pozycja: PomiarGps | null;
  rejestracja: boolean;
  widoczny: boolean;
  nowyOdcinek: boolean;
  generacja: number;
}
export function pustySlad(): StanSladu {
  return {
    punkty: [],
    pozycja: null,
    rejestracja: false,
    widoczny: true,
    nowyOdcinek: true,
    generacja: 0,
  };
}
export function poprawnyPomiar(dane: unknown): dane is PomiarGps {
  if (!dane || typeof dane !== "object") return false;
  const pomiar = dane as PomiarGps;
  return (
    [pomiar.szerokosc, pomiar.dlugosc, pomiar.czas, pomiar.dokladnosc].every(
      Number.isFinite,
    ) &&
    Math.abs(pomiar.szerokosc) <= 90 &&
    Math.abs(pomiar.dlugosc) <= 180 &&
    pomiar.czas >= 0 &&
    pomiar.dokladnosc >= 0 &&
    pomiar.dokladnosc <= 40
  );
}
export function przyjmijPomiar(
  stan: StanSladu,
  pomiar: PomiarGps,
  teraz: number,
): StanSladu {
  if (
    !poprawnyPomiar(pomiar) ||
    pomiar.czas > teraz + 5000 ||
    teraz - pomiar.czas > 120000 ||
    (stan.pozycja && pomiar.czas <= stan.pozycja.czas)
  )
    return stan;
  const poprzednia = stan.pozycja;
  const przerwa = poprzednia ? pomiar.czas - poprzednia.czas : Infinity;
  if (
    poprzednia &&
    obliczOdlegloscMetry(poprzednia, pomiar) >
      Math.max(20, (przerwa / 1000) * 5)
  )
    return stan;
  const ostatni = stan.punkty.at(-1);
  const nowyOdcinek =
    stan.nowyOdcinek || !ostatni || pomiar.czas - ostatni.czas > 60000;
  const dodac =
    stan.rejestracja &&
    (nowyOdcinek ||
      (ostatni &&
        pomiar.czas - ostatni.czas >= 3000 &&
        obliczOdlegloscMetry(ostatni, pomiar) >=
          Math.max(
            4,
            Math.min(12, (pomiar.dokladnosc + ostatni.dokladnosc) / 2),
          )));
  return {
    ...stan,
    pozycja: pomiar,
    nowyOdcinek: dodac ? false : nowyOdcinek,
    punkty: dodac
      ? [...stan.punkty, { ...pomiar, poczatekOdcinka: nowyOdcinek }]
      : stan.punkty,
  };
}

// Douglas-Peucker z granica bledu 0,25 m osobno dla kazdego ciaglego odcinka.
// Pelny zaakceptowany slad jest nadal zapisany; GPS nie jest dopasowywany do ulic.
export function uproscSlad(punkty: readonly PunktSladu[]): PunktSladu[] {
  const zachowane = new Set<number>();
  const skala = (Math.PI * 6378137) / 180;
  const lokalne = punkty.map((punkt) => ({
    x:
      punkt.dlugosc *
      skala *
      Math.cos(((punkty[0]?.szerokosc ?? 0) * Math.PI) / 180),
    y: punkt.szerokosc * skala,
  }));
  const granice = punkty.flatMap((punkt, indeks) =>
    !indeks || punkt.poczatekOdcinka ? [indeks] : [],
  );
  granice.push(punkty.length);
  for (let odcinek = 1; odcinek < granice.length; odcinek++) {
    const poczatek = granice[odcinek - 1] ?? 0;
    const koniec = (granice[odcinek] ?? 0) - 1;
    if (koniec < poczatek) continue;
    zachowane.add(poczatek);
    zachowane.add(koniec);
    const stos: [number, number][] = [[poczatek, koniec]];
    while (stos.length) {
      const para = stos.pop();
      if (!para) break;
      const [pierwszy, ostatni] = para;
      const a = lokalne[pierwszy];
      const b = lokalne[ostatni];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dlugosc = dx * dx + dy * dy;
      let maksimum = 0.25;
      let najdalszy = -1;
      for (let indeks = pierwszy + 1; indeks < ostatni; indeks++) {
        const c = lokalne[indeks];
        if (!c) continue;
        const t = dlugosc
          ? Math.max(
              0,
              Math.min(1, ((c.x - a.x) * dx + (c.y - a.y) * dy) / dlugosc),
            )
          : 0;
        const blad = Math.hypot(c.x - a.x - t * dx, c.y - a.y - t * dy);
        if (blad > maksimum) {
          maksimum = blad;
          najdalszy = indeks;
        }
      }
      if (najdalszy >= 0) {
        zachowane.add(najdalszy);
        stos.push([pierwszy, najdalszy], [najdalszy, ostatni]);
      }
    }
  }
  return punkty.filter((_, indeks) => zachowane.has(indeks));
}
export function odczytajSlad(dane: unknown): StanSladu {
  if (!dane || typeof dane !== "object")
    throw new Error("Niepoprawny slad GPS.");
  const slad = dane as StanSladu;
  if (
    !Array.isArray(slad.punkty) ||
    typeof slad.rejestracja !== "boolean" ||
    typeof slad.widoczny !== "boolean" ||
    typeof slad.nowyOdcinek !== "boolean" ||
    !Number.isSafeInteger(slad.generacja) ||
    slad.generacja < 0 ||
    (slad.pozycja !== null && !poprawnyPomiar(slad.pozycja)) ||
    slad.punkty.some(
      (punkt, indeks) =>
        !poprawnyPomiar(punkt) ||
        typeof punkt.poczatekOdcinka !== "boolean" ||
        (indeks === 0 && !punkt.poczatekOdcinka) ||
        (indeks > 0 && punkt.czas <= (slad.punkty[indeks - 1]?.czas ?? 0)),
    )
  )
    throw new Error("Uszkodzony slad GPS pozostaje zachowany.");
  return structuredClone(slad);
}
