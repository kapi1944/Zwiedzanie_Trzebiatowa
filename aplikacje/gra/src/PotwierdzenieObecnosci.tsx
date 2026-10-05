import type { DefinicjaLokalizacji } from "@zwiedzanie/schemat-tresci";
import {
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import { AdapterLokalizacji, type WynikLokalizacji } from "./lokalizacja";
import type { MenedzerWydajnosci } from "./MenedzerWydajnosci";

const komunikaty: Record<WynikLokalizacji, string> = {
  BRAK_WSPARCIA: "Urządzenie nie obsługuje lokalizacji. Potwierdź ręcznie.",
  BRAK_ZGODY: "Sprawdzenie wymaga świadomej zgody.",
  ODMOWA: "Odmówiono dostępu do lokalizacji. Potwierdź ręcznie.",
  TIMEOUT: "Upłynął czas pomiaru. Spróbuj ponownie lub potwierdź ręcznie.",
  NIEDOSTEPNA: "Pozycja jest niedostępna. Potwierdź ręcznie.",
  SLABA_DOKLADNOSC:
    "Pomiar jest zbyt niedokładny. Spróbuj ponownie lub potwierdź ręcznie.",
  POZA_PROMIENIEM:
    "Pomiar wskazuje miejsce poza promieniem celu. Możesz potwierdzić ręcznie.",
  W_PROMIENIU:
    "Pomiar jest wystarczająco dokładny i mieści się w promieniu celu.",
};
export function PotwierdzenieObecnosci({
  wydajnosc,
  miejsce,
  potwierdzone,
  potwierdz,
}: {
  wydajnosc?: ReturnType<typeof MenedzerWydajnosci>;
  miejsce: DefinicjaLokalizacji;
  potwierdzone: boolean;
  potwierdz: () => void;
}) {
  const [wynik, ustawWynik] = uzyjStanu<WynikLokalizacji>();
  const [pomiar, ustawPomiar] = uzyjStanu(false);
  const aktywne = uzyjReferencji(true);
  const zajete = uzyjReferencji(false);
  uzyjEfektu(() => {
    aktywne.current = true;
    return () => {
      aktywne.current = false;
    };
  }, []);
  async function sprawdz() {
    if (zajete.current) return;
    zajete.current = true;
    ustawPomiar(true);
    const odpowiedz = await new AdapterLokalizacji().sprawdz(
      miejsce,
      true,
      wydajnosc?.wiekPozycji ?? 0,
    );
    if (!aktywne.current) return;
    ustawWynik(odpowiedz);
    ustawPomiar(false);
    zajete.current = false;
  }
  return (
    <section className="karta cel-lokacji" aria-label="Potwierdzenie obecności">
      <p className="etykieta">Miejsce wyprawy</p>
      <h2>{miejsce.nazwa}</h2>
      <p className="status-celu">
        {potwierdzone ? "Cel potwierdzony" : "Cel aktywny"}
      </p>
      <h3>Cel</h3>
      <p>
        Cel terenowy · punkt i promień wymagają rekonesansu. Sprawdzenie pozycji
        jest jednorazowe i dobrowolne.
      </p>
      <h3>Akcje</h3>
      {potwierdzone ? (
        <p role="status">Obecność potwierdzona.</p>
      ) : (
        <>
          {miejsce.geo && miejsce.trybPotwierdzenia === "GPS_LUB_RECZNIE" && (
            <button type="button" disabled={pomiar} onClick={sprawdz}>
              Sprawdź moją lokalizację
            </button>
          )}
          <p role="status">
            {pomiar
              ? "Sprawdzam pozycję…"
              : wynik
                ? komunikaty[wynik]
                : "Pozycja nie jest zapisywana. GPS nie jest wymagany."}
          </p>
          {wynik === "W_PROMIENIU" && (
            <button type="button" onClick={potwierdz}>
              Potwierdź obecność po pomiarze
            </button>
          )}
          <button type="button" onClick={potwierdz}>
            Potwierdź ręcznie
          </button>
        </>
      )}
    </section>
  );
}
