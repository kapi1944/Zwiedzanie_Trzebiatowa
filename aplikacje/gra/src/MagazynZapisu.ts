import {
  type IDBPDatabase as BazaDanych,
  openDB as otworzBaze,
  type DBSchema as SchematBazy,
} from "idb";
import { odczytajSlad, pustySlad, type StanSladu } from "./slad-gps";
import {
  type PakietOffline,
  schematZapisuGry,
  sprawdzPakietOffline,
  type ZapisGry,
} from "./zapis-gry";

interface BazaZapisu extends SchematBazy {
  zapisy: { key: string; value: ZapisGry };
  pakiety: { key: string; value: PakietOffline };
  sladyGps: { key: string; value: StanSladu };
}
export class MagazynZapisu {
  #baza: Promise<BazaDanych<BazaZapisu>> | undefined;
  #nazwa: string;
  #kolejka: Promise<void> = Promise.resolve();
  constructor(nazwa = "zwiedzanie-trzebiatowa") {
    this.#nazwa = nazwa;
  }
  #otworz() {
    if (!this.#baza)
      this.#baza = otworzBaze<BazaZapisu>(this.#nazwa, 2, {
        upgrade(baza, poprzedniaWersja) {
          if (poprzedniaWersja < 1) {
            baza.createObjectStore("zapisy");
            baza.createObjectStore("pakiety");
          }
          if (poprzedniaWersja < 2) baza.createObjectStore("sladyGps");
        },
        blocking: () => {
          void this.zamknij();
        },
      }).catch((blad) => {
        this.#baza = undefined;
        throw blad;
      });
    return this.#baza;
  }
  async odczytaj() {
    await this.#kolejka;
    const baza = await this.#otworz();
    const transakcja = baza.transaction(["zapisy", "pakiety"], "readonly");
    const zapis = await transakcja.objectStore("zapisy").get("aktywna");
    if (!zapis) {
      await transakcja.done;
      return undefined;
    }
    const pakiet = await transakcja.objectStore("pakiety").get(zapis.idPakietu);
    await transakcja.done;
    if (!pakiet)
      throw new Error(
        "Brak przypietego pakietu tresci. Zapis pozostaje zachowany.",
      );
    const sprawdzony = await sprawdzPakietOffline(pakiet);
    const { SesjaGry } = await import("./sesja-gry");
    SesjaGry.przywroc(zapis, sprawdzony);
    return { zapis, pakiet: sprawdzony };
  }
  zapisz(dane: unknown, danePakietu: unknown): Promise<void> {
    // Kopia powstaje przed kolejka, a walidacja przed transakcja IDB.
    const kopia = structuredClone(dane);
    const kopiaPakietu = structuredClone(danePakietu);
    const operacja = this.#kolejka.then(async () => {
      const zapis = schematZapisuGry.parse(kopia);
      const pakiet = await sprawdzPakietOffline(kopiaPakietu);
      const { SesjaGry } = await import("./sesja-gry");
      SesjaGry.przywroc(zapis, pakiet);
      const baza = await this.#otworz();
      const transakcja = baza.transaction(["zapisy", "pakiety"], "readwrite", {
        durability: "strict",
      });
      try {
        const poprzedni = await transakcja.objectStore("zapisy").get("aktywna");
        if (poprzedni) {
          const historia =
            schematZapisuGry.parse(poprzedni).stanGry.dziennikZdarzen;
          if (
            poprzedni.idPakietu !== zapis.idPakietu ||
            poprzedni.idSesji !== zapis.idSesji ||
            JSON.stringify(
              zapis.stanGry.dziennikZdarzen.slice(0, historia.length),
            ) !== JSON.stringify(historia)
          )
            throw new Error(
              "Zapis zmieniono w innej karcie albo probowano cofnac postep. Odswiez, aby wznowic zachowana sesje.",
            );
        }
        if (!(await transakcja.objectStore("pakiety").get(pakiet.idPakietu)))
          await transakcja.objectStore("pakiety").put(pakiet, pakiet.idPakietu);
        await transakcja.objectStore("zapisy").put(zapis, "aktywna");
        await transakcja.done;
      } catch (blad) {
        try {
          transakcja.abort();
        } catch {
          /* Transakcja mogla juz zostac przerwana. */
        }
        await transakcja.done.catch(() => undefined);
        throw blad;
      }
    });
    this.#kolejka = operacja.catch(() => undefined);
    return operacja;
  }
  async zamknij() {
    await this.#kolejka;
    const baza = await this.#baza;
    baza?.close();
    this.#baza = undefined;
  }
  rozpocznijNowa(
    idPoprzedniejSesji: string,
    dane: ZapisGry,
    danePakietu: PakietOffline,
  ): Promise<void> {
    const kopia = structuredClone(dane);
    const kopiaPakietu = structuredClone(danePakietu);
    const operacja = this.#kolejka.then(async () => {
      const zapis = schematZapisuGry.parse(kopia);
      const pakiet = await sprawdzPakietOffline(kopiaPakietu);
      const { SesjaGry } = await import("./sesja-gry");
      SesjaGry.przywroc(zapis, pakiet);
      const baza = await this.#otworz();
      const transakcja = baza.transaction(["zapisy", "pakiety"], "readwrite", {
        durability: "strict",
      });
      try {
        const poprzedni = await transakcja.objectStore("zapisy").get("aktywna");
        if (
          poprzedni?.idSesji !== idPoprzedniejSesji ||
          zapis.idSesji === idPoprzedniejSesji
        )
          throw new Error(
            "Aktywna sesja zmienila sie w innej karcie. Wznow zachowany zapis.",
          );
        await transakcja
          .objectStore("zapisy")
          .put(poprzedni, `archiwum_${idPoprzedniejSesji}`);
        await transakcja.objectStore("pakiety").put(pakiet, pakiet.idPakietu);
        await transakcja.objectStore("zapisy").put(zapis, "aktywna");
        await transakcja.done;
      } catch (blad) {
        try {
          transakcja.abort();
        } catch {
          /* Przerwana transakcja pozostawia poprzedni zapis. */
        }
        await transakcja.done.catch(() => undefined);
        throw blad;
      }
    });
    this.#kolejka = operacja.catch(() => undefined);
    return operacja;
  }
  async odczytajSlad(idSesji: string) {
    await this.#kolejka;
    const dane = await (await this.#otworz()).get("sladyGps", idSesji);
    return dane ? odczytajSlad(dane) : undefined;
  }
  zapiszSlad(idSesji: string, dane: StanSladu): Promise<void> {
    const slad = odczytajSlad(dane);
    const operacja = this.#kolejka.then(async () => {
      const baza = await this.#otworz();
      const transakcja = baza.transaction("sladyGps", "readwrite");
      const poprzedni = await transakcja.store.get(idSesji);
      if (
        poprzedni &&
        (poprzedni.generacja !== slad.generacja ||
          poprzedni.punkty.length > slad.punkty.length ||
          poprzedni.punkty.some(
            (punkt, indeks) =>
              JSON.stringify(punkt) !== JSON.stringify(slad.punkty[indeks]),
          ))
      ) {
        transakcja.abort();
        await transakcja.done.catch(() => undefined);
        throw new Error(
          "Slad zmieniono w innej karcie. Wznow zapis przed dalsza rejestracja.",
        );
      }
      await transakcja.store.put(slad, idSesji);
      await transakcja.done;
    });
    this.#kolejka = operacja.catch(() => undefined);
    return operacja;
  }
  wyczyscSlad(idSesji: string): Promise<StanSladu> {
    const operacja = this.#kolejka.then(async () => {
      const baza = await this.#otworz();
      const transakcja = baza.transaction("sladyGps", "readwrite", {
        durability: "strict",
      });
      const poprzedni = await transakcja.store.get(idSesji);
      const pusty = {
        ...pustySlad(),
        generacja: (poprzedni?.generacja ?? 0) + 1,
      };
      await transakcja.store.put(pusty, idSesji);
      await transakcja.done;
      return pusty;
    });
    this.#kolejka = operacja.then(
      () => undefined,
      () => undefined,
    );
    return operacja;
  }
}
