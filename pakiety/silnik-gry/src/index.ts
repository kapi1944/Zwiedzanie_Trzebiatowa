export type {
  EfektGry,
  SladLubPrzedmiot,
  StanGry,
  StanWatku,
  WynikZagadki,
  ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
export type { WynikKroku } from "./krok.js";
export { wykonajKrok } from "./krok.js";
export { przygotujKontekstNarracji } from "./stan.js";
export { czyWyborDostepny, ocenWarunek } from "./warunki.js";
export type { ProfilZakonczenia } from "./zakonczenia.js";
export {
  pasujeRegulaZakonczenia,
  wyznaczProfilZakonczenia,
} from "./zakonczenia.js";
