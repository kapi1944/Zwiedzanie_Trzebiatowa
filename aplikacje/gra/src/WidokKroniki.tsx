import type { DefinicjeGry } from "@zwiedzanie/schemat-tresci";
import {
  useMemo as uzyjMemo,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import { przygotujWpisyKroniki, warstwyKroniki } from "./kronika";
import type { WidokSesji } from "./sesja-gry";

const rozmiarStrony = 20;

export function WidokKroniki({
  definicje,
  dane,
}: {
  definicje: DefinicjeGry | undefined;
  dane: WidokSesji | undefined;
}) {
  const [szukane, ustawSzukane] = uzyjStanu("");
  const [warstwa, ustawWarstwe] = uzyjStanu("WSZYSTKIE");
  const [strona, ustawStrone] = uzyjStanu(0);
  const naglowek = uzyjReferencji<HTMLHeadingElement>(null);
  const wpisy = uzyjMemo(
    () => (definicje && dane ? przygotujWpisyKroniki(definicje, dane) : []),
    [definicje, dane],
  );
  const pasujace = uzyjMemo(() => {
    const fraza = szukane.trim().toLocaleLowerCase("pl");
    return wpisy.filter(
      (wpis) =>
        (warstwa === "WSZYSTKIE" || wpis.warstwa === warstwa) &&
        `${wpis.nazwa} ${wpis.rodzaj} ${wpis.tekst}`
          .toLocaleLowerCase("pl")
          .includes(fraza),
    );
  }, [wpisy, warstwa, szukane]);
  const ostatnia = Math.max(0, Math.ceil(pasujace.length / rozmiarStrony) - 1);
  const biezaca = Math.min(strona, ostatnia);
  const poczatek = biezaca * rozmiarStrony;
  const zmienStrone = (numer: number) => {
    ustawStrone(numer);
    naglowek.current?.focus();
  };
  return (
    <>
      <p>
        Zdobyte miejsca, wiedza i ślady. Fabularne odkrycie nie jest
        potwierdzeniem historycznym.
      </p>
      <h2 ref={naglowek} tabIndex={-1}>
        Wpisy w Kronice
      </h2>
      {!wpisy.length ? (
        <p>Twoja Kronika jest jeszcze pusta. Pierwszy wpis czeka na rynku.</p>
      ) : (
        <>
          <div className="kronika-filtry">
            <label htmlFor="kronika-szukaj">
              Szukaj w zdobytych wpisach
              <input
                id="kronika-szukaj"
                type="search"
                value={szukane}
                onChange={(zdarzenie) => {
                  ustawSzukane(zdarzenie.target.value);
                  ustawStrone(0);
                }}
              />
            </label>
            <label htmlFor="kronika-warstwa">
              Warstwa wpisu
              <select
                id="kronika-warstwa"
                value={warstwa}
                onChange={(zdarzenie) => {
                  ustawWarstwe(zdarzenie.target.value);
                  ustawStrone(0);
                }}
              >
                <option value="WSZYSTKIE">Wszystkie zdobyte wpisy</option>
                {warstwyKroniki.map((nazwa) => (
                  <option key={nazwa} value={nazwa}>
                    {nazwa}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p role="status" aria-live="polite">
            {pasujace.length
              ? `Wpisy ${poczatek + 1}–${Math.min(poczatek + rozmiarStrony, pasujace.length)} z ${pasujace.length}`
              : "Brak zdobytych wpisów pasujących do filtrów."}
          </p>
          <ul className="lista-kart kronika-wpisy">
            {pasujace.slice(poczatek, poczatek + rozmiarStrony).map((wpis) => (
              <li className="karta" key={wpis.id}>
                <p className="etykieta">
                  {wpis.warstwa} · {wpis.rodzaj}
                </p>
                <h3>{wpis.nazwa}</h3>
                <p>{wpis.tekst}</p>
                {wpis.uwagi && <p>{wpis.uwagi}</p>}
                {!!wpis.zrodla.length && (
                  <details>
                    <summary>Źródła wpisu</summary>
                    <ul>
                      {wpis.zrodla.map((zrodlo) => (
                        <li key={zrodlo.id}>
                          {zrodlo.url ? (
                            <a href={zrodlo.url}>{zrodlo.tytul}</a>
                          ) : (
                            zrodlo.tytul
                          )}
                          <p>{zrodlo.opisBibliograficzny}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
          {pasujace.length > rozmiarStrony && (
            <nav aria-label="Strony Kroniki">
              <button
                type="button"
                disabled={biezaca === 0}
                onClick={() => zmienStrone(biezaca - 1)}
              >
                Poprzednie wpisy
              </button>
              <button
                type="button"
                disabled={biezaca === ostatnia}
                onClick={() => zmienStrone(biezaca + 1)}
              >
                Następne wpisy
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
