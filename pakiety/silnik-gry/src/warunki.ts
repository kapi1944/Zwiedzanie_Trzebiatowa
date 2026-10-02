import {
  type StanGry,
  schematWarunku,
  type Warunek,
} from "@zwiedzanie/schemat-tresci";

export function ocenWarunek(warunek: unknown, stan: StanGry): boolean {
  return sprawdzWarunek(schematWarunku.parse(warunek), stan);
}

export function sprawdzWarunek(warunek: Warunek, stan: StanGry): boolean {
  switch (warunek.rodzaj) {
    case "wszystkie":
      return warunek.warunki.every((element) => sprawdzWarunek(element, stan));
    case "dowolny":
      return warunek.warunki.some((element) => sprawdzWarunek(element, stan));
    case "nie":
      return !sprawdzWarunek(warunek.warunek, stan);
    case "flagaJest":
      return (stan.flagi[warunek.id] ?? false) === warunek.wartosc;
    case "wynikZagadkiJest":
      return stan.wynikiZagadek[warunek.id]?.wynik === warunek.wynik;
    case "stanWatkuJest":
      return stan.watki[warunek.id] === warunek.stan;
    case "posiadaPrzedmiot":
      return stan.sladyIPrzedmioty.includes(warunek.id);
    case "odwiedzono":
      return stan.odwiedzoneLokalizacje.includes(warunek.id);
    case "wybrano":
      return stan.dokonaneWybory.includes(warunek.id);
    case "odkrytoScenke":
      return stan.odkryteScenki.includes(warunek.id);
    case "powinowactwoCoNajmniej":
      return stan.powinowactwa[warunek.os] >= warunek.wartosc;
  }
}
