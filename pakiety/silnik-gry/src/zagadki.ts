import {
  type DefinicjeGry,
  type EfektGry,
  normalizujOdpowiedz,
  type StanGry,
  type WynikZagadki,
  type ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
import { sprawdzWarunek } from "./warunki.js";

export function obsluzZagadke(
  definicje: DefinicjeGry,
  stan: StanGry,
  zdarzenie: ZdarzenieGry,
) {
  if (!("idZagadki" in zdarzenie))
    throw new Error("Zdarzenie nie dotyczy zagadki.");
  const zagadka = definicje.zagadki.find(
    (element) => element.id === zdarzenie.idZagadki,
  );
  if (!zagadka || !stan.odwiedzoneLokalizacje.includes(zagadka.idLokalizacji))
    throw new Error("Zagadka nie jest dostepna w tej lokalizacji.");
  if (stan.wynikiZagadek[zagadka.id])
    throw new Error("Zagadka ma juz wynik koncowy.");
  const postep = stan.postepyZagadek[zagadka.id] ?? {
    liczbaProb: 0,
    liczbaPodpowiedzi: 0,
    potrzebujePomocy: false,
  };
  const efekty: EfektGry[] = [];
  const nic = { zmiany: [], efekty };
  const wymagaAktywnej = () => {
    if (stan.aktywnaZagadka !== zagadka.id)
      throw new Error("Zagadka nie jest aktywna.");
  };
  const policzProbe = () => {
    if (
      zagadka.limitProb !== undefined &&
      postep.liczbaProb >= zagadka.limitProb
    )
      throw new Error(
        "Limit prob osiagniety; wybierz pomoc lub droge kontynuacji.",
      );
    postep.liczbaProb++;
  };
  const samodzielnyWynik = (): WynikZagadki =>
    postep.potrzebujePomocy
      ? "ROZWIAZANA_Z_POMOCA"
      : postep.liczbaPodpowiedzi > 0
        ? "ROZWIAZANA_Z_PODPOWIEDZIA"
        : "ROZWIAZANA_SAMODZIELNIE";
  const zakoncz = (wynik: WynikZagadki) => {
    stan.postepyZagadek[zagadka.id] = postep;
    stan.wynikiZagadek[zagadka.id] = { wynik, ...postep };
    if (stan.aktywnaZagadka === zagadka.id) stan.aktywnaZagadka = null;
    if (wynik === "POMINIETA") stan.pominieteZagadki.push(zagadka.id);
    return zagadka.konsekwencje[wynik];
  };

  switch (zdarzenie.rodzaj) {
    case "ROZPOCZNIJ_ZAGADKE":
      if (stan.aktywnaZagadka) throw new Error("Inna zagadka jest aktywna.");
      stan.postepyZagadek[zagadka.id] = postep;
      stan.aktywnaZagadka = zagadka.id;
      return nic;
    case "POMIN_ZAGADKE":
      if (!zagadka.moznaPominac)
        throw new Error("Tej zagadki nie mozna pominac.");
      return zakoncz("POMINIETA");
    case "POPROS_O_PODPOWIEDZ": {
      wymagaAktywnej();
      const tekst = zagadka.podpowiedzi[postep.liczbaPodpowiedzi];
      if (!tekst) throw new Error("Brak kolejnej podpowiedzi.");
      postep.liczbaPodpowiedzi++;
      stan.uzytePodpowiedzi[zagadka.id] = postep.liczbaPodpowiedzi;
      efekty.push({ rodzaj: "POKAZ_KOMUNIKAT", tekst });
      return nic;
    }
    case "POTRZEBUJE_POMOCY":
      wymagaAktywnej();
      if (!zagadka.pomoc || postep.potrzebujePomocy)
        throw new Error("Pomoc nie jest dostepna ponownie.");
      postep.potrzebujePomocy = true;
      efekty.push({ rodzaj: "POKAZ_KOMUNIKAT", tekst: zagadka.pomoc.tekst });
      return nic;
    case "UDZIEL_ODPOWIEDZI": {
      wymagaAktywnej();
      if (zagadka.typ === "OBSERWACJA")
        throw new Error("Obserwacja wymaga potwierdzenia.");
      if (
        zagadka.typ === "WYBOR" &&
        !zagadka.odpowiedzi.some(
          (element) => element.id === zdarzenie.odpowiedz,
        )
      )
        throw new Error("Nieznana odpowiedz wyboru.");
      policzProbe();
      postep.ostatniaOdpowiedzPoprawna =
        zagadka.typ === "WYBOR"
          ? zagadka.poprawneOdpowiedzi.includes(zdarzenie.odpowiedz)
          : zagadka.poprawneOdpowiedzi.some(
              (odpowiedz) =>
                normalizujOdpowiedz(odpowiedz, zagadka.normalizacja) ===
                normalizujOdpowiedz(zdarzenie.odpowiedz, zagadka.normalizacja),
            );
      if (postep.ostatniaOdpowiedzPoprawna) return zakoncz(samodzielnyWynik());
      efekty.push({
        rodzaj: "POKAZ_KOMUNIKAT",
        tekst:
          "Ten trop jeszcze nie pasuje. Możesz spróbować ponownie, poprosić o pomoc lub wybrać dalszą drogę.",
      });
      return nic;
    }
    case "POTWIERDZ_OBSERWACJE":
      wymagaAktywnej();
      if (zagadka.typ !== "OBSERWACJA")
        throw new Error("To nie jest zadanie obserwacyjne.");
      policzProbe();
      return zakoncz(samodzielnyWynik());
    case "ZAKONCZ_ZAGADKE":
      wymagaAktywnej();
      if (zdarzenie.wynik === "NIEUDANA") {
        if (!zagadka.moznaZakonczycBezRozwiazania)
          throw new Error("Nie przewidziano zakonczenia bez rozwiazania.");
      } else if (!postep.potrzebujePomocy || !zagadka.pomoc?.pozwalaZaliczyc)
        throw new Error("Zaliczenie z pomoca nie jest dostepne.");
      return zakoncz(zdarzenie.wynik);
    case "ZALICZ_ALTERNATYWNIE": {
      wymagaAktywnej();
      const sposob = zagadka.alternatywneZaliczenia.find(
        (element) => element.id === zdarzenie.idSposobu,
      );
      if (!sposob || !sprawdzWarunek(sposob.warunek, stan))
        throw new Error("Alternatywne zaliczenie jest niedostepne.");
      if (sposob.wynik === "ROZWIAZANA_Z_POMOCA")
        postep.potrzebujePomocy = true;
      return zakoncz(samodzielnyWynik());
    }
    default:
      throw new Error("Nieobslugiwane zdarzenie zagadki.");
  }
}
