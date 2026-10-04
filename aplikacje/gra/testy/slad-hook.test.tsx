import "fake-indexeddb/auto";
import { act as wykonaj } from "react";
import {
  type Root as Korzen,
  createRoot as utworzKorzen,
} from "react-dom/client";
import {
  expect as oczekuj,
  afterEach as poTescie,
  test as testuj,
  vi,
} from "vitest";
import { MagazynZapisu } from "../src/MagazynZapisu";
import { uzyjSladuGps } from "../src/uzyjSladuGps";

let korzen: Korzen | undefined;
let kontener: HTMLDivElement | undefined;
poTescie(async () => {
  await wykonaj(() => korzen?.unmount());
  kontener?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
testuj(
  "ukrycie linii nie zatrzymuje watchPosition; wyczyszczenie i wznowienie zachowuja osobny marker",
  async () => {
    const magazyn = new MagazynZapisu(`gps_hook_${crypto.randomUUID()}`);
    let sukces: PositionCallback | undefined;
    const zatrzymaj = vi.fn();
    const obserwuj = vi.fn((odczyt: PositionCallback) => {
      sukces = odczyt;
      return 7;
    });
    vi.stubGlobal("navigator", {
      geolocation: { watchPosition: obserwuj, clearWatch: zatrzymaj },
    });
    const zegar = vi.spyOn(Date, "now").mockReturnValue(10000);
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    let aktualny: ReturnType<typeof uzyjSladuGps>;
    function Sonda({ eko = false }: { eko?: boolean }) {
      aktualny = uzyjSladuGps("moja_sesja", magazyn, eko);
      return null;
    }
    kontener = document.createElement("div");
    document.body.append(kontener);
    korzen = utworzKorzen(kontener);
    await wykonaj(async () => {
      korzen?.render(<Sonda />);
    });
    await wykonaj(async () => {
      await magazyn.odczytajSlad("moja_sesja");
    });
    const sonda = {
      wynik: {
        get aktualna() {
          return aktualny;
        },
      },
      odmontuj: async () => {
        await wykonaj(() => korzen?.unmount());
        if (kontener) korzen = utworzKorzen(kontener);
      },
    };
    oczekuj(sonda.wynik.aktualna.gotowy).toBe(true);
    await wykonaj(() => {
      sonda.wynik.aktualna.ustawRejestracje(true);
      sonda.wynik.aktualna.ustawGps(true);
    });
    const pomiar = async (metry: number, czas: number) => {
      zegar.mockReturnValue(czas);
      await wykonaj(() =>
        sukces?.({
          coords: {
            latitude: 54.062,
            longitude: 15.266 + metry / 65400,
            accuracy: 5,
          },
          timestamp: czas,
        } as GeolocationPosition),
      );
    };
    await pomiar(0, 10000);
    await pomiar(10, 15000);
    oczekuj(sonda.wynik.aktualna.slad.punkty).toHaveLength(2);
    await wykonaj(() => sonda.wynik.aktualna.ustawWidocznosc(false));
    await pomiar(20, 20000);
    oczekuj(sonda.wynik.aktualna.gps).toBe(true);
    oczekuj(obserwuj).toHaveBeenCalledTimes(1);
    oczekuj(sonda.wynik.aktualna.slad.punkty).toHaveLength(3);
    oczekuj(sonda.wynik.aktualna.slad.pozycja).not.toBeNull();
    await wykonaj(async () => {
      await sonda.wynik.aktualna.wyczysc();
    });
    oczekuj(sonda.wynik.aktualna.slad.punkty).toEqual([]);
    oczekuj(sonda.wynik.aktualna.slad.pozycja).not.toBeNull();
    await sonda.odmontuj();
    await wykonaj(async () => {
      korzen?.render(<Sonda eko />);
    });
    await wykonaj(async () => {
      await magazyn.odczytajSlad("moja_sesja");
    });
    const wznowiony = sonda;
    oczekuj(wznowiony.wynik.aktualna.gotowy).toBe(true);
    oczekuj(wznowiony.wynik.aktualna.gps).toBe(false);
    oczekuj(wznowiony.wynik.aktualna.slad.pozycja).not.toBeNull();
    oczekuj(wznowiony.wynik.aktualna.slad.widoczny).toBe(false);
    oczekuj(wznowiony.wynik.aktualna.slad.punkty).toHaveLength(0);
    await wznowiony.odmontuj();
    await magazyn.zamknij();
    vi.unstubAllGlobals();
  },
);
