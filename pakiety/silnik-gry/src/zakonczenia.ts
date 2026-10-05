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
  wariantyZakonczenia: string[];
  epilogiWatkow: string[];
  specjalneOdkrycia: string[];
  konsekwencjeZagadek: string[];
}

export function pasujeRegulaZakonczenia(
  definicje: DefinicjeGry,
  stan: StanGry,
  regula: DefinicjeGry["zakonczenia"][number],
): boolean {
  return (
    (!regula.idScenyWejscia || regula.idScenyWejscia === stan.aktualnaScena) &&
    (!regula.warunek || sprawdzWarunek(regula.warunek, stan)) &&
    (regula.wymaganaWiedza ?? []).every((id) => {
      const wiedza = definicje.kampania?.wiedza.find((wpis) => wpis.id === id);
      return !!wiedza && sprawdzWarunek(wiedza.warunek, stan);
    })
  );
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
    .filter((element) => pasujeRegulaZakonczenia(dane, kopia, element))
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
  const zbierz = (rodzaj: DefinicjeGry["zakonczenia"][number]["rodzaj"]) => {
    const grupy = new Set<string>();
    return pasujace
      .filter((element) => {
        if (
          element.rodzaj !== rodzaj ||
          (element.idZakonczeniaGlownego &&
            element.idZakonczeniaGlownego !== glowne.id)
        )
          return false;
        const grupa = element.grupa ?? element.idWatku;
        if (!grupa) return true;
        if (grupy.has(grupa)) return false;
        grupy.add(grupa);
        return true;
      })
      .map((element) => element.id);
  };
  return {
    zakonczenieGlowne: glowne.id,
    wariantyZakonczenia: zbierz("WARIANT_ZAKONCZENIA"),
    epilogiWatkow: zbierz("EPILOG_WATKU"),
    specjalneOdkrycia: zbierz("SPECJALNE_ODKRYCIE"),
    konsekwencjeZagadek: zbierz("KONSEKWENCJA_ZAGADKI"),
  };
}
