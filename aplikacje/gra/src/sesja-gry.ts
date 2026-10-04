import {
  type DefinicjeGry,
  type EfektGry,
  type StanGry,
  schematDefinicjiGry,
  type WynikZagadki,
  type ZdarzenieGry,
} from "@zwiedzanie/schemat-tresci";
import {
  ocenWarunek,
  type ProfilZakonczenia,
  przygotujKontekstNarracji,
  wykonajKrok,
  wyznaczProfilZakonczenia,
} from "@zwiedzanie/silnik-gry";
import {
  eksportujStanNarracji,
  kontynuujNarracje,
  MostNarracji,
  przywrocStanNarracji,
  type RamkaNarracji,
  type SesjaNarracji,
  type TagNarracji,
  utworzSesjeNarracji,
  wybierzOpcjeNarracji,
} from "@zwiedzanie/silnik-narracji";
import daneNarracji from "../../../tresc/kampania/dist/glowna.json";
import danePakietu from "../../../tresc/kampania/dist/pakiet.json";

import tozsamosc from "../../../tresc/kampania/dist/tozsamosc.json";
import {
  ocenZgodnoscZapisu,
  type PakietOffline,
  schematZapisuGry,
  type ZapisGry,
} from "./zapis-gry";

type DaneZdarzenia = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "idZdarzenia" | "czas">
    : never
  : never;
type EfektAudio = Extract<
  EfektGry,
  { rodzaj: "ODTWORZ_DZWIEK" | "USTAW_NASTROJ_MUZYKI" }
>;

export interface WidokSesji {
  stan: StanGry;
  ramka: RamkaNarracji;
  komunikaty: string[];
  zagadka: DefinicjeGry["zagadki"][number] | undefined;
  opcje: RamkaNarracji["opcje"];
  profil: ProfilZakonczenia | undefined;
  wynikZagadki: WynikZagadki | undefined;
  dostepneZaliczenia: DefinicjeGry["zagadki"][number]["alternatywneZaliczenia"];
  wiedza: NonNullable<DefinicjeGry["kampania"]>["wiedza"];
}

export class SesjaGry {
  readonly definicje: DefinicjeGry;
  #stan: StanGry;
  #most: MostNarracji;
  #narracja: SesjaNarracji;
  #ramka: RamkaNarracji;
  #komunikaty: string[] = [];
  #profil: ProfilZakonczenia | undefined;
  #pakiet: PakietOffline;
  #wymagaZapisu = false;
  #efektyAudio: EfektAudio[] = [];

  odbierzEfektyAudio() {
    const efekty = this.#efektyAudio;
    this.#efektyAudio = [];
    return efekty;
  }

  constructor(
    definicje: unknown = danePakietu,
    narracja = JSON.stringify(daneNarracji),
    identyfikatory = tozsamosc,
  ) {
    this.definicje = schematDefinicjiGry.parse(definicje);
    this.#pakiet = {
      definicje: this.definicje,
      narracja,
      idPakietu: identyfikatory.hashPakietu,
      hashNarracji: identyfikatory.hashNarracji,
    };
    this.#stan = wykonajKrok(this.definicje, null, {
      rodzaj: "ROZPOCZNIJ_GRE",
      idSesji: `sesja_${crypto.randomUUID()}`,
      idZdarzenia: "start",
      czas: 0,
    }).stan;
    this.#wykonaj({ rodzaj: "WEJDZ_DO_LOKALIZACJI", idLokalizacji: "rynek" });
    for (const idWatku of ["watek_kroniki", "watek_pamieci"])
      this.#wykonaj({ rodzaj: "AKTYWUJ_WATEK", idWatku });
    this.#most = new MostNarracji(this.#kontekst(), [
      ...[
        "wybrano_dowod",
        "wybrano_pamiec",
        "otwarto_notatke",
        "final_kronikarz",
        "final_straznik",
        "odkryto_dwie_warstwy",
      ].map((id) => ({ zmiennaInk: id, obszar: "flagi" as const, klucz: id })),
      {
        zmiennaInk: "hansken_wynik",
        obszar: "wynikiZagadek",
        klucz: "zagadka_hansken",
      },
      {
        zmiennaInk: "ma_fragment",
        obszar: "sladyIPrzedmioty",
        klucz: "fragment_kroniki_hansken",
      },
      ...(this.definicje.kampania?.powiazaniaNarracji ?? []),
    ]);
    this.#narracja = utworzSesjeNarracji(narracja, this.#most);
    this.#ramka = this.#czytaj();
  }

  get wymagaZapisu() {
    return this.#wymagaZapisu;
  }
  eksportujPakiet(): PakietOffline {
    return structuredClone(this.#pakiet);
  }
  eksportujZapis(zapisanoDnia = new Date().toISOString()): ZapisGry {
    const { idGry, wersjaGry, wersjaTresci, wersjaSchematZapisu, idSesji } =
      this.#stan;
    return schematZapisuGry.parse({
      wersjaFormatuZapisu: 1,
      idGry,
      wersjaGry,
      wersjaTresci,
      wersjaSchematZapisu,
      idSesji,
      idPakietu: this.#pakiet.idPakietu,
      hashNarracji: this.#pakiet.hashNarracji,
      stanGry: this.#stan,
      stanNarracji: {
        zapisInk: eksportujStanNarracji(
          this.#narracja,
          this.#pakiet.hashNarracji,
        ),
        ramka: this.#ramka,
        komunikaty: this.#komunikaty,
      },
      zapisanoDnia,
    });
  }
  potwierdzZapisanie(liczbaZdarzen: number) {
    if (liczbaZdarzen === this.#stan.dziennikZdarzen.length)
      this.#wymagaZapisu = false;
  }
  static przywroc(dane: unknown, pakiet: PakietOffline): SesjaGry {
    const zgodnosc = ocenZgodnoscZapisu(dane, pakiet);
    if (zgodnosc !== "ZGODNY")
      throw new Error(
        zgodnosc === "WYMAGA_MIGRACJI"
          ? "Zapis wymaga migracji, ktora nie jest obslugiwana w tej wersji."
          : "Zapis jest niezgodny lub uszkodzony.",
      );
    const zapis = schematZapisuGry.parse(dane);
    let odtworzony: StanGry | null = null;
    for (const zdarzenie of zapis.stanGry.dziennikZdarzen)
      odtworzony = wykonajKrok(pakiet.definicje, odtworzony, zdarzenie).stan;
    if (JSON.stringify(odtworzony) !== JSON.stringify(zapis.stanGry))
      throw new Error("Niespojny stan i dziennik gry.");
    const sesja = new SesjaGry(pakiet.definicje, pakiet.narracja, {
      hashPakietu: pakiet.idPakietu,
      hashNarracji: pakiet.hashNarracji,
    });
    sesja.#stan = zapis.stanGry;
    sesja.#profil = [
      "mini_final",
      sesja.definicje.kampania?.scenaFinalu,
    ].includes(zapis.stanGry.aktualnaScena)
      ? wyznaczProfilZakonczenia(sesja.definicje, sesja.#stan)
      : undefined;
    sesja.#most.aktualizujKontekst(sesja.#kontekst());
    przywrocStanNarracji(
      sesja.#narracja,
      zapis.stanNarracji.zapisInk,
      pakiet.hashNarracji,
    );
    const ramka = kontynuujNarracje(sesja.#narracja);
    if (
      ramka.moznaKontynuowac ||
      ramka.akapity.length ||
      JSON.stringify(ramka.opcje) !==
        JSON.stringify(zapis.stanNarracji.ramka.opcje)
    )
      throw new Error("Niespojna ramka i stan Ink.");
    sesja.#ramka = zapis.stanNarracji.ramka;
    sesja.#efektyAudio = [];
    sesja.#komunikaty = zapis.stanNarracji.komunikaty;
    sesja.#wymagaZapisu = false;
    sesja.odczytaj();
    return sesja;
  }

  #kontekst() {
    const kontekst = przygotujKontekstNarracji(this.#stan);
    const flagi = { ...kontekst.flagi };
    const wyniki = { ...kontekst.wynikiZagadek };
    for (const { obszar, klucz } of this.definicje.kampania
      ?.powiazaniaNarracji ?? []) {
      if (obszar === "flagi") flagi[klucz] = this.#stan.flagi[klucz] ?? false;
      if (obszar === "wynikiZagadek")
        wyniki[klucz] = this.#stan.wynikiZagadek[klucz]?.wynik ?? "";
    }
    return {
      ...kontekst,
      flagi: {
        ...flagi,
        wybrano_dowod: this.#stan.dokonaneWybory.includes("prolog_dowod"),
        wybrano_pamiec: this.#stan.dokonaneWybory.includes("prolog_pamiec"),
        otwarto_notatke: this.#stan.flagi.otwarto_notatke ?? false,
        final_kronikarz: this.#stan.flagi.final_kronikarz ?? false,
        final_straznik: this.#stan.flagi.final_straznik ?? false,
        odkryto_dwie_warstwy:
          this.#profil?.specjalneOdkrycia.includes("odkrycie_dwie_warstwy") ??
          false,
      },
      wynikiZagadek: {
        ...wyniki,
        zagadka_hansken: this.#stan.wynikiZagadek.zagadka_hansken?.wynik ?? "",
      },
    };
  }

  #wykonaj(dane: DaneZdarzenia) {
    const numer = this.#stan.dziennikZdarzen.length;
    const krok = wykonajKrok(this.definicje, this.#stan, {
      ...dane,
      idZdarzenia: `zdarzenie_${numer}`,
      czas: numer,
    } as ZdarzenieGry);
    this.#stan = krok.stan;
    this.#efektyAudio.push(
      ...krok.efekty.flatMap((efekt) =>
        efekt.rodzaj === "ODTWORZ_DZWIEK" ||
        efekt.rodzaj === "USTAW_NASTROJ_MUZYKI"
          ? [efekt]
          : [],
      ),
    );
    if (krok.efekty.some((efekt) => efekt.rodzaj === "ZAPISZ_STAN"))
      this.#wymagaZapisu = true;
    this.#komunikaty.push(
      ...krok.efekty.flatMap((efekt) =>
        efekt.rodzaj === "POKAZ_KOMUNIKAT" ? [efekt.tekst] : [],
      ),
    );
  }

  #czytaj(): RamkaNarracji {
    this.#most.aktualizujKontekst(this.#kontekst());
    const akapity: string[] = [];
    const tagi: TagNarracji[] = [];
    for (let licznik = 0; licznik < 200; licznik++) {
      const ramka = kontynuujNarracje(this.#narracja);
      akapity.push(...ramka.akapity);
      tagi.push(...ramka.tagi);
      if (!ramka.moznaKontynuowac) {
        this.#efektyAudio.push(
          ...tagi.flatMap((tag): EfektAudio[] =>
            tag.rodzaj === "dzwiek"
              ? [{ rodzaj: "ODTWORZ_DZWIEK", id: tag.wartosc }]
              : tag.rodzaj === "nastroj"
                ? [{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: tag.wartosc }]
                : [],
          ),
        );
        return { ...ramka, akapity, tagi };
      }
    }
    throw new Error("Narracja przekroczyla limit akapitow.");
  }

  odczytaj(): WidokSesji {
    const zagadka = this.definicje.zagadki.find(
      (element) =>
        (element.idSceny
          ? element.idSceny === this.#stan.aktualnaScena
          : this.definicje.lokalizacje.some(
              (miejsce) =>
                miejsce.id === element.idLokalizacji &&
                miejsce.idSceny === this.#stan.aktualnaScena,
            )) && !this.#stan.wynikiZagadek[element.id],
    );
    const opcje = this.#ramka.opcje.filter((opcja) => {
      const sygnaly = this.#most.odczytajSygnaly(opcja.tagi);
      const wybor = this.definicje.wybory.find((element) =>
        sygnaly.includes(element.id),
      );
      if (!wybor || sygnaly.length !== 1)
        throw new Error("Wybor Ink nie ma jednoznacznej definicji.");
      return (
        wybor.idSceny === this.#stan.aktualnaScena &&
        !this.#stan.dokonaneWybory.includes(wybor.id) &&
        (!wybor.warunek || ocenWarunek(wybor.warunek, this.#stan))
      );
    });
    return {
      wiedza:
        this.definicje.kampania?.wiedza.filter((wpis) =>
          ocenWarunek(wpis.warunek, this.#stan),
        ) ?? [],
      dostepneZaliczenia:
        zagadka?.alternatywneZaliczenia.filter((sposob) =>
          ocenWarunek(sposob.warunek, this.#stan),
        ) ?? [],
      stan: this.#stan,
      ramka: this.#ramka,
      komunikaty: [...this.#komunikaty],
      zagadka,
      opcje,
      profil: this.#profil,
      wynikZagadki: this.definicje.zagadki
        .filter((element) =>
          element.idSceny
            ? element.idSceny === this.#stan.aktualnaScena
            : this.definicje.lokalizacje.some(
                (miejsce) =>
                  miejsce.id === element.idLokalizacji &&
                  miejsce.idSceny === this.#stan.aktualnaScena,
              ),
        )
        .map((element) => this.#stan.wynikiZagadek[element.id]?.wynik)[0],
    };
  }

  wybierz(indeks: number) {
    const opcja = this.odczytaj().opcje.find(
      (element) => element.indeks === indeks,
    );
    if (!opcja) throw new Error("Wybor nie jest dostepny.");
    const idWyboru = this.#most.odczytajSygnaly(opcja.tagi)[0];
    if (!idWyboru) throw new Error("Brak identyfikatora wyboru.");
    this.#komunikaty = [];
    this.#wykonaj({ rodzaj: "DOKONAJ_WYBORU", idWyboru });
    this.#profil = undefined;
    const miejsce =
      this.definicje.lokalizacje.find(
        (element) => element.idSceny === this.#stan.aktualnaScena,
      ) ??
      this.definicje.lokalizacje.find((element) =>
        this.definicje.kampania?.scenyMiejsc.some(
          (powiazanie) =>
            powiazanie.idSceny === this.#stan.aktualnaScena &&
            powiazanie.idLokalizacji === element.id,
        ),
      );
    if (miejsce && !this.#stan.odwiedzoneLokalizacje.includes(miejsce.id))
      this.#wykonaj({
        rodzaj: "WEJDZ_DO_LOKALIZACJI",
        idLokalizacji: miejsce.id,
      });
    const scenka = this.definicje.scenki.find(
      (element) => element.idSceny === this.#stan.aktualnaScena,
    );
    if (scenka) this.#wykonaj({ rodzaj: "OTWORZ_SCENKE", idScenki: scenka.id });
    if (this.#stan.aktualnaScena === "mini_final") {
      for (const idWatku of ["watek_kroniki", "watek_pamieci"])
        this.#wykonaj({ rodzaj: "ZAKONCZ_WATEK", idWatku });
      this.#profil = wyznaczProfilZakonczenia(this.definicje, this.#stan);
    }
    if (this.#stan.aktualnaScena === this.definicje.kampania?.scenaFinalu)
      this.#profil = wyznaczProfilZakonczenia(this.definicje, this.#stan);
    this.#most.aktualizujKontekst(this.#kontekst());
    wybierzOpcjeNarracji(this.#narracja, indeks);
    this.#ramka = this.#czytaj();
    this.#rozpocznijZagadke();
    return this.odczytaj();
  }

  #rozpocznijZagadke() {
    const zagadka = this.odczytaj().zagadka;
    if (zagadka && !this.#stan.aktywnaZagadka)
      this.#wykonaj({ rodzaj: "ROZPOCZNIJ_ZAGADKE", idZagadki: zagadka.id });
  }

  potwierdzObecnosc(idLokalizacji: string) {
    if (!this.#stan.potwierdzoneLokalizacje.includes(idLokalizacji))
      this.#wykonaj({ rodzaj: "POTWIERDZ_OBECNOSC", idLokalizacji });
    return this.odczytaj();
  }

  podpowiedz() {
    const zagadka = this.odczytaj().zagadka;
    if (!zagadka) throw new Error("Brak zagadki.");
    this.#komunikaty = [];
    this.#wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki: zagadka.id });
    return this.odczytaj();
  }

  odpowiedz(odpowiedz: string) {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "UDZIEL_ODPOWIEDZI",
      idZagadki,
      odpowiedz,
    }));
  }
  potwierdzObserwacje() {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "POTWIERDZ_OBSERWACJE",
      idZagadki,
    }));
  }
  pomoc() {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "POTRZEBUJE_POMOCY",
      idZagadki,
    }));
  }
  zaliczZPomoca() {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki,
      wynik: "ROZWIAZANA_Z_POMOCA",
    }));
  }
  zakonczBezRozwiazania() {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "ZAKONCZ_ZAGADKE",
      idZagadki,
      wynik: "NIEUDANA",
    }));
  }
  alternatywnie(idSposobu: string) {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "ZALICZ_ALTERNATYWNIE",
      idZagadki,
      idSposobu,
    }));
  }
  pomin() {
    return this.#zdarzenieZagadki((idZagadki) => ({
      rodzaj: "POMIN_ZAGADKE",
      idZagadki,
    }));
  }

  #zdarzenieZagadki(utworz: (id: string) => DaneZdarzenia) {
    const zagadka = this.odczytaj().zagadka;
    if (!zagadka) return this.odczytaj();
    this.#komunikaty = [];
    this.#wykonaj(utworz(zagadka.id));
    this.#most.aktualizujKontekst(this.#kontekst());
    return this.odczytaj();
  }
}
