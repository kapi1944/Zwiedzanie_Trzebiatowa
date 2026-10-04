import {
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import type { MagazynZapisu } from "./MagazynZapisu";
import { przyjmijPomiar, pustySlad, type StanSladu } from "./slad-gps";

export function uzyjSladuGps(
  idSesji: string | undefined,
  magazyn: MagazynZapisu | undefined,
  eko: boolean,
) {
  const [slad, ustawSlad] = uzyjStanu(pustySlad);
  const [gps, ustawGps] = uzyjStanu(false);
  const [gotowy, ustawGotowy] = uzyjStanu(false);
  const [komunikat, ustawKomunikat] = uzyjStanu("");
  const dane = uzyjReferencji(slad);
  const aktywnaSesja = uzyjReferencji(idSesji);
  aktywnaSesja.current = idSesji;
  const ostatniEkran = uzyjReferencji(0);
  function utrwal(nowy: StanSladu) {
    dane.current = nowy;
    ustawSlad(nowy);
    if (idSesji && magazyn)
      void magazyn
        .zapiszSlad(idSesji, nowy)
        .catch(() =>
          ustawKomunikat(
            "Nie udało się zapisać śladu. Bieżąca pozycja nadal działa; dotychczasowy zapis pozostaje zachowany.",
          ),
        );
  }
  uzyjEfektu(() => {
    ustawGps(false);
    ustawGotowy(false);
    dane.current = pustySlad();
    ustawSlad(dane.current);
    let aktywne = true;
    if (!idSesji) return;
    void (magazyn?.odczytajSlad(idSesji) ?? Promise.resolve(undefined))
      .then((zapis) => {
        if (!aktywne) return;
        dane.current = zapis ?? pustySlad();
        ustawSlad(dane.current);
        ustawGotowy(true);
      })
      .catch(() => {
        if (aktywne)
          ustawKomunikat(
            "Nie można odczytać śladu. Zapis pozostał zachowany; GPS można włączyć po ponownym odczycie.",
          );
      });
    return () => {
      aktywne = false;
    };
  }, [idSesji, magazyn]);
  uzyjEfektu(() => {
    if (!gps || !gotowy || !idSesji) return;
    if (!navigator.geolocation) {
      ustawKomunikat("GPS niedostępny. Możesz potwierdzać miejsca ręcznie.");
      ustawGps(false);
      return;
    }
    let aktywne = true;
    let obserwacja: number;
    try {
      obserwacja = navigator.geolocation.watchPosition(
        (pomiar) => {
          if (!aktywne || aktywnaSesja.current !== idSesji) return;
          const nowy = przyjmijPomiar(
            dane.current,
            {
              szerokosc: pomiar.coords.latitude,
              dlugosc: pomiar.coords.longitude,
              dokladnosc: pomiar.coords.accuracy,
              czas: pomiar.timestamp,
            },
            Date.now(),
          );
          if (nowy === dane.current) {
            ustawKomunikat(
              "Pomiar pominięto: zbyt stary, niedokładny lub niewiarygodny. Znacznik wskazuje ostatnią zaakceptowaną pozycję.",
            );
            return;
          }
          const zapisac = nowy.punkty !== dane.current.punkty;
          dane.current = nowy;
          if (zapisac && magazyn)
            void magazyn
              .zapiszSlad(idSesji, nowy)
              .catch(() =>
                ustawKomunikat(
                  "Nie udało się zapisać ostatniego odcinka śladu. Gra pozostaje dostępna.",
                ),
              );
          if (
            Date.now() - ostatniEkran.current >= (eko ? 5000 : 1000) ||
            zapisac
          ) {
            ustawSlad(nowy);
            ostatniEkran.current = Date.now();
          }
          ustawKomunikat(
            `Ostatni zaakceptowany pomiar: dokładność ±${Math.round(pomiar.coords.accuracy)} m.`,
          );
        },
        () => {
          if (aktywne) {
            ustawKomunikat(
              "Nie można odczytać GPS. Dotychczasowa trasa jest zachowana; potwierdzaj miejsca ręcznie.",
            );
            ustawGps(false);
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
      );
    } catch {
      ustawKomunikat("GPS niedostępny. Możesz potwierdzać miejsca ręcznie.");
      ustawGps(false);
      return;
    }
    return () => {
      aktywne = false;
      dane.current = { ...dane.current, nowyOdcinek: true };
      navigator.geolocation.clearWatch(obserwacja);
    };
  }, [gps, gotowy, idSesji, magazyn, eko]);
  async function wyczysc() {
    if (!idSesji || !gotowy) return;
    const poprzedni = dane.current;
    dane.current = { ...dane.current, rejestracja: false, nowyOdcinek: true };
    ustawSlad(dane.current);
    ustawGotowy(false);
    try {
      const wyczyszczony = magazyn
        ? await magazyn.wyczyscSlad(idSesji)
        : { generacja: dane.current.generacja + 1 };
      // Znacznik pozycji pozostaje; nowa rejestracja zacznie nowy odcinek.
      const nowy = {
        ...poprzedni,
        punkty: [],
        rejestracja: false,
        nowyOdcinek: true,
        generacja: wyczyszczony.generacja,
      };
      if (magazyn) await magazyn.zapiszSlad(idSesji, nowy);
      if (aktywnaSesja.current !== idSesji) return;
      dane.current = nowy;
      ustawSlad(nowy);
      ustawKomunikat("Lokalny ślad tej rozgrywki wyczyszczono.");
    } catch {
      if (aktywnaSesja.current === idSesji)
        ustawKomunikat("Nie udało się wyczyścić śladu. Spróbuj ponownie.");
    } finally {
      if (aktywnaSesja.current === idSesji) ustawGotowy(true);
    }
  }
  return {
    slad,
    gps,
    gotowy,
    komunikat,
    ustawGps,
    ustawRejestracje: (rejestracja: boolean) =>
      utrwal({ ...dane.current, rejestracja, nowyOdcinek: true }),
    ustawWidocznosc: (widoczny: boolean) =>
      utrwal({ ...dane.current, widoczny }),
    wyczysc,
  };
}
