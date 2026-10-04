import adresGeometrii from "../../../../tresc/mapa/geometria.json?url";
import type { Pozycja } from "../lokalizacja";

export interface ObiektMapy {
  id: string;
  wersja: number;
  rodzaj: string;
  tagi: Record<string, string>;
  punkty: number[][];
  otwory?: number[][][];
}
export interface GeometriaMapy {
  obiekty: ObiektMapy[];
  atrybucja: string;
  odczyt: string;
  zrodlo: string;
}
export async function zaladujGeometrie(): Promise<GeometriaMapy> {
  const odpowiedz = await fetch(adresGeometrii);
  if (!odpowiedz.ok) throw new Error("Brak lokalnego podkladu mapy.");
  return odpowiedz.json();
}
export const srodek = { szerokosc: 54.0627, dlugosc: 15.2675 };
const radiany = Math.PI / 180;
const promien = 6378137;
const pochylenie = 68 * radiany;
export interface PunktEkranu {
  x: number;
  y: number;
}
export interface WidokMapy {
  zoom: number;
  x: number;
  y: number;
}

// Lokalna projekcja geograficzna i perspektywa wspolna dla podkladu, GPS i sladu.
export function projektuj(pozycja: Pozycja, wysokosc = 0): PunktEkranu {
  const wschod =
    promien *
    radiany *
    (pozycja.dlugosc - srodek.dlugosc) *
    Math.cos(srodek.szerokosc * radiany);
  const polnoc = promien * radiany * (pozycja.szerokosc - srodek.szerokosc);
  const glebie =
    1 +
    (polnoc * Math.cos(pochylenie) - wysokosc * Math.sin(pochylenie)) / 2200;
  return {
    x: 600 + wschod / glebie,
    y:
      450 +
      (-polnoc * Math.sin(pochylenie) - wysokosc * Math.cos(pochylenie)) /
        glebie,
  };
}
export function naEkran(
  punkt: PunktEkranu,
  widok: WidokMapy,
  szerokosc: number,
  wysokosc: number,
): PunktEkranu {
  const skala = Math.min(szerokosc / 1200, wysokosc / 900);
  return {
    x: szerokosc / 2 + (punkt.x - 600) * skala * widok.zoom + widok.x,
    y: wysokosc / 2 + (punkt.y - 450) * skala * widok.zoom + widok.y,
  };
}
export function odprojektuj(punkt: PunktEkranu): Pozycja {
  const rzutPolnoc = -(punkt.y - 450);
  const polnoc =
    rzutPolnoc /
    (Math.sin(pochylenie) - (rzutPolnoc * Math.cos(pochylenie)) / 2200);
  const wschod = (punkt.x - 600) * (1 + (polnoc * Math.cos(pochylenie)) / 2200);
  return {
    szerokosc: srodek.szerokosc + polnoc / (promien * radiany),
    dlugosc:
      srodek.dlugosc +
      wschod / (promien * radiany * Math.cos(srodek.szerokosc * radiany)),
  };
}
export function poziomSzczegolow(zoom: number) {
  return zoom < 1.5 ? 1 : zoom < 3 ? 2 : 3;
}
