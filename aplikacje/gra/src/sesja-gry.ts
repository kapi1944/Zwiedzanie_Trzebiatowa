import {
  type DefinicjeGry,
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
  kontynuujNarracje,
  MostNarracji,
  type RamkaNarracji,
  type SesjaNarracji,
  utworzSesjeNarracji,
  wybierzOpcjeNarracji,
} from "@zwiedzanie/silnik-narracji";
import daneNarracji from "../../../tresc/trzebiatow-v1/dist/glowna.json";
import danePakietu from "../../../tresc/trzebiatow-v1/dist/pakiet.json";

type DaneZdarzenia = ZdarzenieGry extends infer Zdarzenie
  ? Zdarzenie extends ZdarzenieGry
    ? Omit<Zdarzenie, "idZdarzenia" | "czas">
    : never
  : never;

export interface WidokSesji {
  stan: StanGry;
  ramka: RamkaNarracji;
  komunikaty: string[];
  zagadka: DefinicjeGry["zagadki"][number] | undefined;
  opcje: RamkaNarracji["opcje"];
  profil: ProfilZakonczenia | undefined;
}

export class SesjaGry {
  readonly definicje: DefinicjeGry;
  #stan: StanGry;
  #most: MostNarracji;
  #narracja: SesjaNarracji;
  #ramka: RamkaNarracji;
  #komunikaty: string[] = [];
  #profil: ProfilZakonczenia | undefined;

  constructor(
    definicje: unknown = danePakietu,
    narracja = JSON.stringify(daneNarracji),
  ) {
    this.definicje = schematDefinicjiGry.parse(definicje);
    this.#stan = wykonajKrok(this.definicje, null, {
      rodzaj: "ROZPOCZNIJ_GRE",
      idSesji: "przegladarka",
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
    ]);
    this.#narracja = utworzSesjeNarracji(narracja, this.#most);
    this.#ramka = this.#czytaj();
  }

  #kontekst() {
    const kontekst = przygotujKontekstNarracji(this.#stan);
    return {
      ...kontekst,
      flagi: {
        ...kontekst.flagi,
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
        ...kontekst.wynikiZagadek,
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
    this.#komunikaty.push(
      ...krok.efekty.flatMap((efekt) =>
        efekt.rodzaj === "POKAZ_KOMUNIKAT" ? [efekt.tekst] : [],
      ),
    );
  }

  #czytaj(): RamkaNarracji {
    this.#most.aktualizujKontekst(this.#kontekst());
    const akapity: string[] = [];
    for (let licznik = 0; licznik < 200; licznik++) {
      const ramka = kontynuujNarracje(this.#narracja);
      akapity.push(...ramka.akapity);
      if (!ramka.moznaKontynuowac) return { ...ramka, akapity };
    }
    throw new Error("Narracja przekroczyla limit akapitow.");
  }

  odczytaj(): WidokSesji {
    const zagadka = this.definicje.zagadki.find(
      (element) =>
        this.definicje.lokalizacje.some(
          (miejsce) =>
            miejsce.id === element.idLokalizacji &&
            miejsce.idSceny === this.#stan.aktualnaScena,
        ) &&
        (!this.#stan.wynikiZagadek[element.id] ||
          this.#stan.wynikiZagadek[element.id]?.wynik === "NIEUDANA"),
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
      stan: this.#stan,
      ramka: this.#ramka,
      komunikaty: [...this.#komunikaty],
      zagadka,
      opcje,
      profil: this.#profil,
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
    const miejsce = this.definicje.lokalizacje.find(
      (element) => element.idSceny === this.#stan.aktualnaScena,
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

  podpowiedz() {
    const zagadka = this.odczytaj().zagadka;
    if (!zagadka) throw new Error("Brak zagadki.");
    this.#komunikaty = [];
    this.#wykonaj({ rodzaj: "POPROS_O_PODPOWIEDZ", idZagadki: zagadka.id });
    return this.odczytaj();
  }

  odpowiedz(odpowiedz: string) {
    const zagadka = this.odczytaj().zagadka;
    if (!zagadka?.odpowiedz) throw new Error("Zagadka wymaga rekonesansu.");
    const wynik =
      odpowiedz === zagadka.odpowiedz
        ? (this.#stan.uzytePodpowiedzi[zagadka.id] ?? 0) > 0
          ? "ROZWIAZANA_Z_PODPOWIEDZIA"
          : "ROZWIAZANA_SAMODZIELNIE"
        : "NIEUDANA";
    return this.#zakoncz(wynik);
  }

  pomin() {
    return this.#zakoncz("POMINIETA");
  }

  symulujHansken() {
    if (
      !import.meta.env.DEV ||
      this.odczytaj().zagadka?.id !== "zagadka_hansken"
    )
      throw new Error("Symulacja dostepna tylko w DEV dla Hansken.");
    return this.#zakoncz(
      (this.#stan.uzytePodpowiedzi.zagadka_hansken ?? 0) > 0
        ? "ROZWIAZANA_Z_PODPOWIEDZIA"
        : "ROZWIAZANA_SAMODZIELNIE",
    );
  }

  #zakoncz(wynik: WynikZagadki) {
    const zagadka = this.odczytaj().zagadka;
    if (!zagadka) throw new Error("Brak aktywnej zagadki.");
    this.#komunikaty = [];
    this.#wykonaj(
      wynik === "POMINIETA"
        ? { rodzaj: "POMIN_ZAGADKE", idZagadki: zagadka.id }
        : { rodzaj: "ZAKONCZ_ZAGADKE", idZagadki: zagadka.id, wynik },
    );
    this.#komunikaty.push(
      wynik === "NIEUDANA"
        ? "To nie ta warstwa opowieści. Spróbuj ponownie albo pomiń zagadkę."
        : wynik === "POMINIETA"
          ? "Zagadka pominięta. Możesz kontynuować opowieść."
          : "Wynik zapisany w twojej Kronice. Możesz kontynuować.",
    );
    if (wynik === "NIEUDANA") this.#rozpocznijZagadke();
    return this.odczytaj();
  }
}
