import {
  type DefinicjeGry,
  type StanGry,
  schematDefinicjiGry,
  schematStanuGry,
} from "@zwiedzanie/schemat-tresci";
import { sprawdzZgodnoscStanu } from "./stan.js";
import { sprawdzWarunek } from "./warunki.js";

export interface ProfilZakonczenia {
  zakonczenieGlowne: string;
  epilogiWatkow: string[];
  specjalneOdkrycia: string[];
  konsekwencjeZagadek: string[];
}

export function wyznaczProfilZakonczenia(
  definicje: DefinicjeGry,
  stan: StanGry,
): ProfilZakonczenia {
  const dane = schematDefinicjiGry.parse(definicje);
  const kopia = schematStanuGry.parse(stan);
  sprawdzZgodnoscStanu(dane, kopia);
  if (
    dane.kampania &&
    kopia.flagi.kampania_rozpoczeta &&
    (kopia.aktualnaScena !== dane.kampania.scenaFinalu ||
      !sprawdzWarunek(dane.kampania.warunekFinalu, kopia))
  )
    throw new Error("Wyprawa nie doszla jeszcze do finalu rozdzialu.");
  if (
    dane.watki.some(
      (watek) =>
        (watek.wymaganyDoFinalu || !watek.opcjonalny) &&
        kopia.watki[watek.id] !== "UKONCZONY",
    )
  ) {
    throw new Error("Wymagany watek nie zostal ukonczony.");
  }
  const pasujace = dane.zakonczenia
    .filter(
      (element) => !element.warunek || sprawdzWarunek(element.warunek, kopia),
    )
    .sort(
      (lewy, prawy) =>
        prawy.priorytet - lewy.priorytet ||
        (lewy.id < prawy.id ? -1 : lewy.id > prawy.id ? 1 : 0),
    );
  const glowne =
    pasujace.find(
      (element) => element.rodzaj === "GLOWNE" && !element.domyslne,
    ) ??
    pasujace.find((element) => element.rodzaj === "GLOWNE" && element.domyslne);
  if (!glowne) throw new Error("Brak zakonczenia glownego.");
  return {
    zakonczenieGlowne: glowne.id,
    epilogiWatkow: pasujace
      .filter((element) => element.rodzaj === "EPILOG_WATKU")
      .map((element) => element.id),
    specjalneOdkrycia: pasujace
      .filter((element) => element.rodzaj === "SPECJALNE_ODKRYCIE")
      .map((element) => element.id),
    konsekwencjeZagadek: pasujace
      .filter((element) => element.rodzaj === "KONSEKWENCJA_ZAGADKI")
      .map((element) => element.id),
  };
}
