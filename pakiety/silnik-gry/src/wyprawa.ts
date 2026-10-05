import type { DefinicjeGry, StanGry } from "@zwiedzanie/schemat-tresci";
export interface WyborSceny {
  idWyboru: string;
  indeks: number;
  tekst: string;
}

// Opcje zatwierdza silnik i most Ink; projekcja nie odblokowuje nowych wyborów.
export function przygotujWidokWyprawy(
  definicje: DefinicjeGry,
  stan: StanGry,
  wyborySceny: WyborSceny[],
) {
  return {
    watki: definicje.watki.flatMap((watek) => {
      const status = stan.watki[watek.id];
      return status === "AKTYWNY" ||
        status === "UKONCZONY" ||
        status === "POMINIETY"
        ? [{ id: watek.id, nazwa: watek.nazwa, status }]
        : [];
    }),
    wskazowki: [
      ...definicje.przedmioty
        .filter((przedmiot) => stan.sladyIPrzedmioty.includes(przedmiot.id))
        .map((przedmiot) => ({ id: przedmiot.id, nazwa: przedmiot.nazwa })),
      ...definicje.scenki
        .filter((scenka) => stan.odkryteScenki.includes(scenka.id))
        .map((scenka) => ({ id: scenka.id, nazwa: scenka.nazwa })),
    ],
    cele: wyborySceny.flatMap((opcja) => {
      const wybor = definicje.wybory.find(
        (element) =>
          element.id === opcja.idWyboru &&
          element.idSceny === stan.aktualnaScena,
      );
      if (!wybor) return [];
      const id = definicje.kampania?.scenyMiejsc.find(
        (scena) => scena.idSceny === wybor.nastepnaScena,
      )?.idLokalizacji;
      const miejsce = definicje.lokalizacje.find((element) =>
        id ? element.id === id : element.idSceny === wybor.nastepnaScena,
      );
      return miejsce && stan.odblokowaneLokalizacje.includes(miejsce.id)
        ? [{ id: miejsce.id, nazwa: miejsce.nazwa, ...opcja }]
        : [];
    }),
  };
}
