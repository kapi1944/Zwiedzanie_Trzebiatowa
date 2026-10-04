import type { ObiektMapy } from "./geometria";

export const zrodloFortyfikacji =
  "https://www.skz.szczecin.pl/index.php/ochrona-zabytkow/pomniki-historii/trzebiatow";
export interface ElementHistoryczny {
  id: string;
  zachowany: boolean;
  pewnosc: "POTWIERDZONE" | "PRAWDOPODOBNE" | "NIEPEWNE";
  statusPolozenia: "DO_WERYFIKACJI" | "HISTORYCZNE_POLOZENIE_NIEPEWNE";
  geometria?: ObiektMapy;
  zrodlo: string;
}
export function przygotujNakladke(obiekty: ObiektMapy[]): ElementHistoryczny[] {
  return [
    ...obiekty
      .filter((obiekt) => obiekt.rodzaj === "mur")
      .map(
        (obiekt): ElementHistoryczny => ({
          id: `mur_osm_${obiekt.id}`,
          zachowany: true,
          pewnosc: "POTWIERDZONE",
          statusPolozenia: "DO_WERYFIKACJI",
          geometria: obiekt,
          zrodlo: zrodloFortyfikacji,
        }),
      ),
    ...["gryficka", "kolobrzeska", "zeglarska", "laziebna"].map(
      (id): ElementHistoryczny => ({
        id: `brama_${id}`,
        zachowany: false,
        pewnosc: "NIEPEWNE",
        statusPolozenia: "HISTORYCZNE_POLOZENIE_NIEPEWNE",
        zrodlo: zrodloFortyfikacji,
      }),
    ),
  ];
}
export function elementyDoRysowania(elementy: ElementHistoryczny[]) {
  return elementy.filter(
    (element) =>
      element.geometria &&
      element.pewnosc === "POTWIERDZONE" &&
      element.statusPolozenia !== "HISTORYCZNE_POLOZENIE_NIEPEWNE",
  );
}
