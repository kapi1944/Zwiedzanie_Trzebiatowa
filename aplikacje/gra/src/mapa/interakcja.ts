import {
  useRef as uzyjReferencji,
  useState as uzyjStanu,
  type PointerEvent as ZdarzenieWskaznika,
} from "react";
import type { WidokMapy } from "./geometria";

export function uzyjInterakcjiMapy() {
  const [widok, ustawWidok] = uzyjStanu<WidokMapy>({ zoom: 1.8, x: 0, y: 0 });
  const wskazniki = uzyjReferencji(new Map<number, { x: number; y: number }>());
  function przesun(x: number, y: number) {
    ustawWidok((stary) => ({
      ...stary,
      x: Math.max(-3000, Math.min(3000, stary.x + x)),
      y: Math.max(-3000, Math.min(3000, stary.y + y)),
    }));
  }
  function powieksz(mnoznik: number) {
    ustawWidok((stary) => ({
      ...stary,
      zoom: Math.max(1, Math.min(6, stary.zoom * mnoznik)),
    }));
  }
  function poczatek(zdarzenie: ZdarzenieWskaznika<HTMLElement>) {
    if ((zdarzenie.target as HTMLElement).closest("button")) return;
    zdarzenie.currentTarget.setPointerCapture(zdarzenie.pointerId);
    wskazniki.current.set(zdarzenie.pointerId, {
      x: zdarzenie.clientX,
      y: zdarzenie.clientY,
    });
  }
  function ruch(zdarzenie: ZdarzenieWskaznika<HTMLElement>) {
    const poprzedni = wskazniki.current.get(zdarzenie.pointerId);
    if (!poprzedni) return;
    const drugi = [...wskazniki.current.entries()].find(
      ([id]) => id !== zdarzenie.pointerId,
    )?.[1];
    const punkt = { x: zdarzenie.clientX, y: zdarzenie.clientY };
    if (drugi) {
      const przed = Math.hypot(poprzedni.x - drugi.x, poprzedni.y - drugi.y);
      const teraz = Math.hypot(punkt.x - drugi.x, punkt.y - drugi.y);
      const pole = zdarzenie.currentTarget.getBoundingClientRect();
      if (przed > 0)
        ustawWidok((stary) => {
          const zoom = Math.max(1, Math.min(6, (stary.zoom * teraz) / przed));
          const skala = zoom / stary.zoom;
          const x = (punkt.x + drugi.x) / 2 - pole.left - pole.width / 2;
          const y = (punkt.y + drugi.y) / 2 - pole.top - pole.height / 2;
          const poprzedniX =
            (poprzedni.x + drugi.x) / 2 - pole.left - pole.width / 2;
          const poprzedniY =
            (poprzedni.y + drugi.y) / 2 - pole.top - pole.height / 2;
          return {
            zoom,
            x: x - (poprzedniX - stary.x) * skala,
            y: y - (poprzedniY - stary.y) * skala,
          };
        });
    } else przesun(punkt.x - poprzedni.x, punkt.y - poprzedni.y);
    wskazniki.current.set(zdarzenie.pointerId, punkt);
  }
  function koniec(zdarzenie: ZdarzenieWskaznika<HTMLElement>) {
    wskazniki.current.delete(zdarzenie.pointerId);
  }
  return {
    widok,
    ustawWidok,
    powieksz,
    przesun,
    wskaznik: {
      onPointerDown: poczatek,
      onPointerMove: ruch,
      onPointerUp: koniec,
      onPointerCancel: koniec,
      onLostPointerCapture: koniec,
    },
  };
}
