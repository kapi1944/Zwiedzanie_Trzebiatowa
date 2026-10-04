import type { DefinicjaLokalizacji, StanGry } from "@zwiedzanie/schemat-tresci";
import type { StanSladu } from "../slad-gps";
import { uproscSlad } from "../slad-gps";
import { naEkran, projektuj, type WidokMapy } from "./geometria";
import {
  type ElementHistoryczny,
  elementyDoRysowania,
} from "./nakladka-historyczna";

// Gestosc przyciskow zmienia sie z zoomem, geograficzne kotwice pozostaja te same.
export function rozmiescZnaczniki(
  miejsca: readonly DefinicjaLokalizacji[],
  widok: WidokMapy,
  szerokosc: number,
  wysokosc: number,
  aktualne?: string,
) {
  const zajete: { x: number; y: number }[] = [];
  return [...miejsca]
    .sort(
      (lewe, prawe) =>
        Number(prawe.id === aktualne) - Number(lewe.id === aktualne),
    )
    .flatMap((miejsce) => {
      const geo = miejsce.punktMapy ?? miejsce.geo;
      if (!geo) return [];
      const punkt = naEkran(projektuj(geo), widok, szerokosc, wysokosc);
      if (
        punkt.x < 22 ||
        punkt.x > szerokosc - 22 ||
        punkt.y < 22 ||
        punkt.y > wysokosc - 22
      )
        return [];
      const pelny = !zajete.some(
        (inny) =>
          Math.abs(inny.x - punkt.x) < 48 && Math.abs(inny.y - punkt.y) < 48,
      );
      if (pelny) zajete.push(punkt);
      return [{ miejsce, punkt, pelny }];
    });
}

export function miejscaGameplay(
  lokalizacje: readonly DefinicjaLokalizacji[],
  stan: StanGry,
  dostepne: readonly string[],
  aktualne?: string,
) {
  return lokalizacje.filter(
    (miejsce) =>
      stan.odwiedzoneLokalizacje.includes(miejsce.id) ||
      dostepne.includes(miejsce.id) ||
      miejsce.id === aktualne,
  );
}
export function rysujHistorie(
  pioro: CanvasRenderingContext2D,
  elementy: ElementHistoryczny[],
  widok: WidokMapy,
  szerokosc: number,
  wysokosc: number,
) {
  for (const element of elementyDoRysowania(elementy)) {
    if (element.zachowany && element.geometria) {
      const dol = element.geometria.punkty.map((para) =>
        naEkran(
          projektuj({ dlugosc: para[0] ?? 0, szerokosc: para[1] ?? 0 }),
          widok,
          szerokosc,
          wysokosc,
        ),
      );
      const gora = element.geometria.punkty.map((para) =>
        naEkran(
          projektuj({ dlugosc: para[0] ?? 0, szerokosc: para[1] ?? 0 }, 3),
          widok,
          szerokosc,
          wysokosc,
        ),
      );
      // Wysokosc ilustracyjna; nie jest pomiarem muru ani rekonstrukcja brakujacego odcinka.
      pioro.beginPath();
      [...dol, ...gora.reverse()].forEach((punkt, indeks) => {
        if (!indeks) pioro.moveTo(punkt.x, punkt.y);
        else pioro.lineTo(punkt.x, punkt.y);
      });
      pioro.closePath();
      pioro.fillStyle = "#a1805d";
      pioro.fill();
    }
    pioro.beginPath();
    element.geometria?.punkty.forEach((para, indeks) => {
      const punkt = naEkran(
        projektuj({ dlugosc: para[0] ?? 0, szerokosc: para[1] ?? 0 }),
        widok,
        szerokosc,
        wysokosc,
      );
      if (!indeks) pioro.moveTo(punkt.x, punkt.y);
      else pioro.lineTo(punkt.x, punkt.y);
    });
    pioro.strokeStyle = element.zachowany ? "#6f4938" : "#9c4b42";
    pioro.lineWidth = element.zachowany ? 3 : 2;
    pioro.setLineDash(element.zachowany ? [] : [5, 4]);
    pioro.stroke();
    pioro.setLineDash([]);
  }
}
export function rysujSlad(
  pioro: CanvasRenderingContext2D,
  slad: StanSladu,
  widok: WidokMapy,
  szerokosc: number,
  wysokosc: number,
) {
  if (!slad.widoczny) return;
  pioro.beginPath();
  for (const pomiar of uproscSlad(slad.punkty)) {
    const punkt = naEkran(projektuj(pomiar), widok, szerokosc, wysokosc);
    if (pomiar.poczatekOdcinka) pioro.moveTo(punkt.x, punkt.y);
    else pioro.lineTo(punkt.x, punkt.y);
  }
  // Krawedz atramentu bez przesuwania srodka rzeczywistej trasy.
  pioro.strokeStyle = "#772333";
  pioro.lineWidth = 5;
  pioro.lineJoin = "round";
  pioro.lineCap = "round";
  pioro.globalAlpha = 0.3;
  pioro.stroke();
  pioro.globalAlpha = 1;
  pioro.strokeStyle = "#790d25";
  pioro.lineWidth = 2.5;
  pioro.stroke();
}
