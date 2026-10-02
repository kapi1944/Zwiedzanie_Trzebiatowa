import type {
  DefinicjaZagadki,
  StanGry,
  WynikZagadki,
} from "@zwiedzanie/schemat-tresci";
import {
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import type { SesjaGry, WidokSesji } from "./sesja-gry";

export function InformacjaOWyniku({
  wynik,
}: {
  wynik: WynikZagadki | undefined;
}) {
  if (!wynik) return null;
  const opisy: Record<WynikZagadki, string> = {
    ROZWIAZANA_SAMODZIELNIE:
      "Udało się zapisać trop samodzielnie. Możesz iść dalej.",
    ROZWIAZANA_Z_PODPOWIEDZIA:
      "Podpowiedź naprowadziła cię na właściwy ślad. Możesz kontynuować.",
    ROZWIAZANA_Z_POMOCA: "Pomoc otworzyła dalszą drogę. Twoja opowieść trwa.",
    POMINIETA: "Zostawiasz to pytanie na później. Możesz kontynuować opowieść.",
    NIEUDANA:
      "Zadanie kończy się bez rozstrzygnięcia. Dalsza opowieść pozostaje otwarta.",
  };
  return (
    <p role="status" className="karta">
      {opisy[wynik]}
    </p>
  );
}

export function Podpowiedzi({
  zagadka,
  stan,
  zlec,
}: {
  zagadka: DefinicjaZagadki;
  stan: StanGry;
  zlec: (akcja: (gra: SesjaGry) => WidokSesji) => void;
}) {
  const liczba = stan.postepyZagadek[zagadka.id]?.liczbaPodpowiedzi ?? 0;
  return (
    <section aria-labelledby="naglowek-podpowiedzi">
      <h3 id="naglowek-podpowiedzi">Podpowiedzi</h3>
      {liczba > 0 && (
        <ol>
          {zagadka.podpowiedzi.slice(0, liczba).map((tekst) => (
            <li key={tekst}>{tekst}</li>
          ))}
        </ol>
      )}
      <button
        type="button"
        disabled={liczba >= zagadka.podpowiedzi.length}
        onClick={() => zlec((gra) => gra.podpowiedz())}
      >
        Poproś o podpowiedź
      </button>
    </section>
  );
}

export function WidokZagadki({
  zagadka,
  stan,
  wykonaj,
  dostepneZaliczenia,
}: {
  zagadka: DefinicjaZagadki;
  stan: StanGry;
  wykonaj: (akcja: (gra: SesjaGry) => WidokSesji) => void;
  dostepneZaliczenia: DefinicjaZagadki["alternatywneZaliczenia"];
}) {
  const [odpowiedz, ustawOdpowiedz] = uzyjStanu("");
  const [potwierdzono, ustawPotwierdzenie] = uzyjStanu(false);
  const blokada = uzyjReferencji(false);
  const postep = stan.postepyZagadek[zagadka.id];
  const liczbaProb = postep?.liczbaProb ?? 0;
  const limit =
    zagadka.limitProb !== undefined && liczbaProb >= zagadka.limitProb;
  const kluczOdswiezenia = `${liczbaProb}:${postep?.liczbaPodpowiedzi ?? 0}:${postep?.potrzebujePomocy ?? false}`;
  uzyjEfektu(() => {
    if (kluczOdswiezenia) blokada.current = false;
  }, [kluczOdswiezenia]);
  function zlec(akcja: (gra: SesjaGry) => WidokSesji) {
    if (blokada.current) return;
    blokada.current = true;
    wykonaj(akcja);
  }
  return (
    <section className="karta zadanie" aria-labelledby="tytul-zadania">
      <p className="etykieta">Zatrzymaj się na chwilę</p>
      <h2 id="tytul-zadania">{zagadka.nazwa}</h2>
      {zagadka.wymagaWeryfikacjiTerenowej && (
        <p className="uwaga">
          Zadanie robocze — szczegół wymaga rekonesansu. Potwierdzenie zapisuje
          twoją deklarację, a nie zweryfikowaną odpowiedź terenową.
        </p>
      )}
      <form
        onSubmit={(zdarzenie) => {
          zdarzenie.preventDefault();
          if (
            !limit &&
            (zagadka.typ === "OBSERWACJA" ? potwierdzono : odpowiedz.length > 0)
          )
            zlec((gra) =>
              zagadka.typ === "OBSERWACJA"
                ? gra.potwierdzObserwacje()
                : gra.odpowiedz(odpowiedz),
            );
        }}
      >
        <fieldset disabled={limit}>
          <legend>{zagadka.pytanie}</legend>
          {zagadka.typ === "WYBOR" &&
            zagadka.odpowiedzi.map((element) => (
              <label className="odpowiedz" key={element.id}>
                <input
                  type="radio"
                  name="odpowiedz"
                  required
                  value={element.id}
                  checked={odpowiedz === element.id}
                  onChange={() => ustawOdpowiedz(element.id)}
                />
                {element.tekst}
              </label>
            ))}
          {zagadka.typ === "TEKST" && (
            <>
              <label htmlFor="odpowiedz-zagadki">Twoja odpowiedź</label>
              <input
                id="odpowiedz-zagadki"
                type="text"
                required
                maxLength={1000}
                value={odpowiedz}
                onChange={(zdarzenie) => ustawOdpowiedz(zdarzenie.target.value)}
                autoComplete="off"
              />
            </>
          )}
          {zagadka.typ === "OBSERWACJA" && (
            <label className="odpowiedz">
              <input
                type="checkbox"
                required
                checked={potwierdzono}
                onChange={(zdarzenie) =>
                  ustawPotwierdzenie(zdarzenie.target.checked)
                }
              />
              {zagadka.potwierdzenie}
            </label>
          )}
          <button
            type="submit"
            disabled={
              limit ||
              (zagadka.typ === "OBSERWACJA" ? !potwierdzono : !odpowiedz)
            }
          >
            {zagadka.typ === "OBSERWACJA"
              ? "Zapisz obserwację"
              : "Sprawdź odpowiedź"}
          </button>
        </fieldset>
      </form>
      <p>
        Liczba prób: {liczbaProb}
        {zagadka.limitProb !== undefined ? ` z ${zagadka.limitProb}` : ""}.
      </p>
      {postep?.ostatniaOdpowiedzPoprawna === false && (
        <p role="status">
          Ten trop jeszcze nie pasuje. Możesz spróbować ponownie lub skorzystać
          z dalszej drogi.
        </p>
      )}
      {limit && (
        <p role="status">
          Limit prób osiągnięty. Pomoc lub dostępna droga kontynuacji pozostają
          otwarte.
        </p>
      )}
      <Podpowiedzi zagadka={zagadka} stan={stan} zlec={zlec} />
      {zagadka.pomoc && (
        <section aria-labelledby="naglowek-pomocy">
          <h3 id="naglowek-pomocy">Inna droga</h3>
          {postep?.potrzebujePomocy ? (
            <>
              <p>{zagadka.pomoc.tekst}</p>
              {zagadka.pomoc.pozwalaZaliczyc && (
                <button
                  type="button"
                  onClick={() => zlec((gra) => gra.zaliczZPomoca())}
                >
                  Kontynuuj z pomocą
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={() => zlec((gra) => gra.pomoc())}>
              Potrzebuję pomocy
            </button>
          )}
        </section>
      )}
      <div className="wybory">
        {dostepneZaliczenia.map((sposob) => (
          <button
            type="button"
            key={sposob.id}
            onClick={() => zlec((gra) => gra.alternatywnie(sposob.id))}
          >
            {sposob.nazwa}
          </button>
        ))}
        {zagadka.moznaPominac && (
          <button type="button" onClick={() => zlec((gra) => gra.pomin())}>
            Pomiń zagadkę i idź dalej
          </button>
        )}
        {zagadka.moznaZakonczycBezRozwiazania && (
          <button
            type="button"
            onClick={() => zlec((gra) => gra.zakonczBezRozwiazania())}
          >
            Zakończ zadanie bez rozstrzygnięcia
          </button>
        )}
      </div>
    </section>
  );
}
