import {
  type DefinicjeGry,
  type EfektGry,
  type StanGry,
  schematDefinicjiGry,
  schematStanuGry,
  schematZdarzeniaGry,
  type ZdarzenieGry,
  type ZmianaGry,
} from "@zwiedzanie/schemat-tresci";
import { sprawdzZgodnoscStanu } from "./stan.js";
import { sprawdzWarunek } from "./warunki.js";
import { obsluzZagadke } from "./zagadki.js";

export interface WynikKroku {
  stan: StanGry;
  efekty: EfektGry[];
}

function znajdz<T extends { id: string }>(lista: readonly T[], id: string): T {
  const element = lista.find((element) => element.id === id);
  if (!element) throw new Error(`Nieznany identyfikator: ${id}.`);
  return element;
}

function dodaj(lista: string[], id: string): void {
  if (!lista.includes(id)) lista.push(id);
}

function zastosujZmiany(stan: StanGry, zmiany: readonly ZmianaGry[]): void {
  for (const zmiana of zmiany) {
    switch (zmiana.rodzaj) {
      case "USTAW_FLAGE":
        stan.flagi[zmiana.id] = zmiana.wartosc;
        break;
      case "ZMIEN_POWINOWACTWO":
        stan.powinowactwa[zmiana.os] = Math.max(
          -5,
          Math.min(5, stan.powinowactwa[zmiana.os] + zmiana.wartosc),
        );
        break;
      case "DODAJ_PRZEDMIOT":
        dodaj(stan.sladyIPrzedmioty, zmiana.id);
        break;
      case "USUN_PRZEDMIOT":
        stan.sladyIPrzedmioty = stan.sladyIPrzedmioty.filter(
          (id) => id !== zmiana.id,
        );
        break;
    }
  }
}

function zastosujEfekty(stan: StanGry, efekty: readonly EfektGry[]): void {
  for (const efekt of efekty) {
    if (efekt.rodzaj === "POKAZ_SCENE") stan.aktualnaScena = efekt.id;
    if (efekt.rodzaj === "ODBLOKUJ_LOKALIZACJE")
      dodaj(stan.odblokowaneLokalizacje, efekt.id);
    if (
      efekt.rodzaj === "ODBLOKUJ_WATEK" &&
      stan.watki[efekt.id] === "ZABLOKOWANY"
    )
      stan.watki[efekt.id] = "DOSTEPNY";
  }
}

function odblokujDostepne(
  definicje: DefinicjeGry,
  stan: StanGry,
  efekty: EfektGry[],
): void {
  // Zadania sa pochodna wynikow, a watki pochodna warunkow contentu.
  for (const zadanie of definicje.kampania ? definicje.zadania : []) {
    if (
      zadanie.idZagadek.length &&
      zadanie.idZagadek.every((id) => {
        const wynik = stan.wynikiZagadek[id]?.wynik;
        return wynik && wynik !== "POMINIETA" && wynik !== "NIEUDANA";
      })
    )
      stan.flagi[`zadanie_${zadanie.id}`] = true;
  }
  for (const lokalizacja of definicje.lokalizacje) {
    if (
      !stan.odblokowaneLokalizacje.includes(lokalizacja.id) &&
      (!lokalizacja.warunek || sprawdzWarunek(lokalizacja.warunek, stan))
    ) {
      dodaj(stan.odblokowaneLokalizacje, lokalizacja.id);
      efekty.push({ rodzaj: "ODBLOKUJ_LOKALIZACJE", id: lokalizacja.id });
    }
  }
  for (const watek of definicje.watki) {
    if (
      stan.watki[watek.id] === "ZABLOKOWANY" &&
      (!watek.warunek || sprawdzWarunek(watek.warunek, stan))
    ) {
      stan.watki[watek.id] = "DOSTEPNY";
      efekty.push({ rodzaj: "ODBLOKUJ_WATEK", id: watek.id });
    }
    if (
      stan.watki[watek.id] === "DOSTEPNY" &&
      watek.warunekAktywacji &&
      sprawdzWarunek(watek.warunekAktywacji, stan)
    )
      stan.watki[watek.id] = "AKTYWNY";
    if (
      stan.watki[watek.id] === "AKTYWNY" &&
      watek.warunekUkonczenia &&
      sprawdzWarunek(watek.warunekUkonczenia, stan)
    )
      stan.watki[watek.id] = "UKONCZONY";
  }
}

export function wykonajKrok(
  definicje: DefinicjeGry,
  stan: StanGry | null,
  zdarzenie: ZdarzenieGry,
): WynikKroku {
  const dane = schematDefinicjiGry.parse(definicje);
  const polecenie = schematZdarzeniaGry.parse(zdarzenie);
  const efekty: EfektGry[] = [];
  let nowy: StanGry;
  if (polecenie.rodzaj === "ROZPOCZNIJ_GRE") {
    if (stan !== null) throw new Error("Gra jest juz rozpoczeta.");
    nowy = {
      idGry: dane.manifest.idGry,
      wersjaGry: dane.manifest.wersjaGry,
      wersjaTresci: dane.manifest.wersjaTresci,
      wersjaSchematZapisu: dane.manifest.wersjaSchematZapisu,
      idSesji: polecenie.idSesji,
      aktualnaScena: dane.manifest.scenaStartowa,
      odwiedzoneLokalizacje: [],
      potwierdzoneLokalizacje: [],
      wynikiZagadek: {},
      postepyZagadek: {},
      aktywnaZagadka: null,
      dokonaneWybory: [],
      flagi: {},
      sladyIPrzedmioty: [],
      watki: Object.fromEntries(
        dane.watki.map((watek) => [watek.id, "ZABLOKOWANY"]),
      ),
      powinowactwa: { dowod: 0, legenda: 0, pamiec: 0, zmiana: 0 },
      odkryteScenki: [],
      uzytePodpowiedzi: {},
      pominieteZagadki: [],
      odblokowaneLokalizacje: [],
      dziennikZdarzen: [],
    };
    efekty.push({ rodzaj: "POKAZ_SCENE", id: nowy.aktualnaScena });
  } else {
    if (stan === null) throw new Error("Gra nie zostala rozpoczeta.");
    nowy = schematStanuGry.parse(stan);
    sprawdzZgodnoscStanu(dane, nowy);
    if (
      nowy.dziennikZdarzen.some(
        (wpis) => wpis.idZdarzenia === polecenie.idZdarzenia,
      )
    )
      throw new Error("Zdarzenie zostalo juz wykonane.");
    if (polecenie.czas < (nowy.dziennikZdarzen.at(-1)?.czas ?? 0))
      throw new Error("Czas zdarzenia jest wczesniejszy od ostatniego wpisu.");
    switch (polecenie.rodzaj) {
      case "WEJDZ_DO_LOKALIZACJI": {
        const lokalizacja = znajdz(dane.lokalizacje, polecenie.idLokalizacji);
        if (!nowy.odblokowaneLokalizacje.includes(lokalizacja.id))
          throw new Error("Lokalizacja jest zablokowana.");
        dodaj(nowy.odwiedzoneLokalizacje, lokalizacja.id);
        nowy.aktualnaScena = dane.kampania?.scenyMiejsc.some(
          (miejsce) =>
            miejsce.idLokalizacji === lokalizacja.id &&
            miejsce.idSceny === nowy.aktualnaScena,
        )
          ? nowy.aktualnaScena
          : lokalizacja.idSceny;
        efekty.push({ rodzaj: "POKAZ_SCENE", id: nowy.aktualnaScena });
        break;
      }
      case "POTWIERDZ_OBECNOSC": {
        znajdz(dane.lokalizacje, polecenie.idLokalizacji);
        if (!nowy.odwiedzoneLokalizacje.includes(polecenie.idLokalizacji))
          throw new Error("Najpierw wejdz do lokalizacji.");
        dodaj(nowy.potwierdzoneLokalizacje, polecenie.idLokalizacji);
        break;
      }
      case "ROZPOCZNIJ_ZAGADKE":
      case "POPROS_O_PODPOWIEDZ":
      case "POMIN_ZAGADKE":
      case "ZAKONCZ_ZAGADKE":
      case "POTRZEBUJE_POMOCY":
      case "POTWIERDZ_OBSERWACJE":
      case "UDZIEL_ODPOWIEDZI":
      case "ZALICZ_ALTERNATYWNIE": {
        const wynik = obsluzZagadke(dane, nowy, polecenie);
        zastosujZmiany(nowy, wynik.zmiany);
        efekty.push(...wynik.efekty);
        break;
      }
      case "DOKONAJ_WYBORU": {
        const wybor = znajdz(dane.wybory, polecenie.idWyboru);
        if (
          nowy.aktualnaScena !== wybor.idSceny ||
          nowy.dokonaneWybory.includes(wybor.id) ||
          (wybor.warunek && !sprawdzWarunek(wybor.warunek, nowy))
        )
          throw new Error("Wybor nie jest teraz dostepny.");
        dodaj(nowy.dokonaneWybory, wybor.id);
        zastosujZmiany(nowy, wybor.zmiany);
        nowy.aktualnaScena = wybor.nastepnaScena;
        efekty.push(
          { rodzaj: "POKAZ_SCENE", id: wybor.nastepnaScena },
          ...wybor.efekty,
        );
        break;
      }
      case "AKTYWUJ_WATEK":
      case "ZAKONCZ_WATEK": {
        const watek = znajdz(dane.watki, polecenie.idWatku);
        const wymagany =
          polecenie.rodzaj === "AKTYWUJ_WATEK" ? "DOSTEPNY" : "AKTYWNY";
        if (nowy.watki[watek.id] !== wymagany)
          throw new Error("Niepoprawne przejscie watku.");
        nowy.watki[watek.id] =
          polecenie.rodzaj === "AKTYWUJ_WATEK" ? "AKTYWNY" : "UKONCZONY";
        break;
      }
      case "POMIN_WATEK": {
        const watek = znajdz(dane.watki, polecenie.idWatku);
        if (
          !watek.opcjonalny ||
          watek.wymaganyDoFinalu ||
          ["UKONCZONY", "POMINIETY"].includes(nowy.watki[watek.id] ?? "")
        )
          throw new Error("Watku nie mozna pominac.");
        nowy.watki[watek.id] = "POMINIETY";
        break;
      }
      case "DODAJ_PRZEDMIOT":
      case "USUN_PRZEDMIOT": {
        znajdz(dane.przedmioty, polecenie.idPrzedmiotu);
        zastosujZmiany(nowy, [
          { rodzaj: polecenie.rodzaj, id: polecenie.idPrzedmiotu },
        ]);
        break;
      }
      case "OTWORZ_SCENKE": {
        const scenka = znajdz(dane.scenki, polecenie.idScenki);
        if (!sprawdzWarunek(scenka.warunek, nowy))
          throw new Error("Scenka jest niedostepna.");
        dodaj(nowy.odkryteScenki, scenka.id);
        nowy.aktualnaScena = scenka.idSceny;
        efekty.push({ rodzaj: "POKAZ_SCENE", id: scenka.idSceny });
        break;
      }
      case "WZNOW_GRE":
        efekty.push({ rodzaj: "POKAZ_SCENE", id: nowy.aktualnaScena });
        break;
    }
  }
  zastosujEfekty(nowy, efekty);
  odblokujDostepne(dane, nowy, efekty);
  nowy.dziennikZdarzen.push(polecenie);
  efekty.push({ rodzaj: "USTAW_KONTEKST_NARRACJI" }, { rodzaj: "ZAPISZ_STAN" });
  return { stan: nowy, efekty };
}
