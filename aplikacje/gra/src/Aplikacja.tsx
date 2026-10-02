import {
  Component as Komponent,
  lazy as leniwie,
  Suspense as Oczekiwanie,
  type ReactNode,
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import { aktualneMiejsce } from "./lokalizacja";
import type { MagazynZapisu } from "./MagazynZapisu";
import { PotwierdzenieObecnosci } from "./PotwierdzenieObecnosci";
import { type ObslugaPwa, StatusPwa } from "./StatusPwa";
import type { SesjaGry, WidokSesji } from "./sesja-gry";
import { InformacjaOWyniku, WidokZagadki } from "./WidokZagadki";

const Mapa = leniwie(() => import("./Mapa"));

type Widok = "start" | "gra" | "mapa" | "kronika" | "watki" | "informacje";
const nazwyWidokow: Record<Widok, string> = {
  start: "Start",
  gra: "Opowieść",
  mapa: "Mapa",
  kronika: "Kronika",
  watki: "Wątki",
  informacje: "O grze",
};
const nazwyScen: Record<string, string> = {
  prolog: "Rynek i Ratusz",
  hansken: "Hansken · Rynek 26",
  kosciol: "Kościół Macierzyństwa NMP",
  kosciol_decyzja: "Kościół Macierzyństwa NMP",
  dwie_notatki: "Dwie notatki",
  baszta: "Baszta Kaszana",
  mini_final: "Twoja Kronika",
};

export class GranicaBledu extends Komponent<
  { children: ReactNode },
  { blad: boolean }
> {
  state = { blad: false };
  static getDerivedStateFromError() {
    return { blad: true };
  }
  render() {
    return this.state.blad ? (
      <main>
        <BladGry szczegoly="Błąd wyświetlania opowieści." />
      </main>
    ) : (
      this.props.children
    );
  }
}

class GranicaMapy extends Komponent<
  { children: ReactNode },
  { blad: boolean }
> {
  state = { blad: false };
  static getDerivedStateFromError() {
    return { blad: true };
  }
  render() {
    return this.state.blad ? (
      <p role="status">Mapa jest niedostępna. Kontynuuj w widoku Opowieść.</p>
    ) : (
      this.props.children
    );
  }
}

function BladGry({ szczegoly }: { szczegoly: string }) {
  return (
    <section role="alert" className="karta">
      <h1>Wystąpił problem z uruchomieniem opowieści.</h1>
      <p>Odśwież stronę, aby wznowić ostatni poprawny zapis.</p>
      {import.meta.env.DEV && <pre>{szczegoly}</pre>}
      <button type="button" onClick={() => window.location.reload()}>
        Uruchom ponownie
      </button>
    </section>
  );
}

export default function Aplikacja({
  magazyn,
  pwa,
  uruchom = async () => {
    const { SesjaGry } = await import("./sesja-gry");
    return new SesjaGry();
  },
}: {
  uruchom?: () => Promise<SesjaGry>;
  magazyn?: MagazynZapisu;
  pwa?: ObslugaPwa;
}) {
  const [widok, ustawWidok] = uzyjStanu<Widok>("start");
  const [dane, ustawDane] = uzyjStanu<WidokSesji>();
  const [ladowanie, ustawLadowanie] = uzyjStanu(!!magazyn);
  const [blad, ustawBlad] = uzyjStanu<string>();
  const [problemZapisu, ustawProblemZapisu] = uzyjStanu<string>();
  const [zablokowanyZapis, ustawZablokowanyZapis] = uzyjStanu(false);
  const [zapisywanie, ustawZapisywanie] = uzyjStanu(false);
  const [zapisano, ustawZapisano] = uzyjStanu(false);
  const [aktualizacjaWTrakcie, ustawAktualizacjaWTrakcie] = uzyjStanu(false);
  const sesja = uzyjReferencji<SesjaGry | null>(null);
  const naglowek = uzyjReferencji<HTMLHeadingElement>(null);
  const naglowekWyborow = uzyjReferencji<HTMLHeadingElement>(null);
  const poprzedniaZagadka = uzyjReferencji<string | undefined>(undefined);
  const zajete = uzyjReferencji(false);
  const kluczFokusu = `${widok}:${dane?.stan.aktualnaScena ?? ""}`;
  uzyjEfektu(() => {
    if (!zapisywanie && kluczFokusu !== "start:") naglowek.current?.focus();
  }, [kluczFokusu, zapisywanie]);
  const idZagadki = dane?.zagadka?.id;
  uzyjEfektu(() => {
    if (poprzedniaZagadka.current && !idZagadki)
      naglowekWyborow.current?.focus();
    poprzedniaZagadka.current = idZagadki;
  }, [idZagadki]);

  uzyjEfektu(() => {
    if (!magazyn) return;
    let aktywne = true;
    ustawLadowanie(true);
    void magazyn
      .odczytaj()
      .then(async (zachowane) => {
        if (!zachowane) return;
        const { SesjaGry } = await import("./sesja-gry");
        const przywrocona = SesjaGry.przywroc(
          zachowane.zapis,
          zachowane.pakiet,
        );
        if (aktywne) {
          sesja.current = przywrocona;
          ustawDane(przywrocona.odczytaj());
          ustawZapisano(true);
        }
      })
      .catch((problem) => {
        if (aktywne) {
          ustawProblemZapisu(
            problem instanceof Error
              ? problem.message
              : "Nie udało się odczytać zapisu.",
          );
          ustawZablokowanyZapis(true);
        }
      })
      .finally(() => {
        if (aktywne) ustawLadowanie(false);
      });
    return () => {
      aktywne = false;
    };
  }, [magazyn]);

  async function utrwal() {
    const gra = sesja.current;
    if (!gra || !magazyn || !gra.wymagaZapisu) return;
    ustawZapisywanie(true);
    ustawZapisano(false);
    try {
      const zapis = gra.eksportujZapis();
      await magazyn.zapisz(zapis, gra.eksportujPakiet());
      gra.potwierdzZapisanie(zapis.stanGry.dziennikZdarzen.length);
      ustawProblemZapisu(undefined);
      ustawZapisano(true);
    } catch (problem) {
      ustawProblemZapisu(
        problem instanceof Error ? problem.message : "Zapis nie powiódł się.",
      );
      throw problem;
    } finally {
      ustawZapisywanie(false);
    }
  }

  async function rozpocznij() {
    if (zajete.current) return;
    if (sesja.current) {
      ustawWidok("gra");
      return;
    }
    zajete.current = true;
    ustawLadowanie(true);
    ustawBlad(undefined);
    try {
      sesja.current = await uruchom();
      ustawDane(sesja.current.odczytaj());
      ustawWidok("gra");
      await utrwal();
    } catch (problem) {
      if (!sesja.current)
        ustawBlad(
          problem instanceof Error ? problem.message : "Nieznany błąd.",
        );
    } finally {
      zajete.current = false;
      ustawLadowanie(false);
    }
  }

  async function wykonaj(akcja: (gra: SesjaGry) => WidokSesji) {
    if (!sesja.current || zajete.current) return;
    zajete.current = true;
    try {
      ustawDane(akcja(sesja.current));
      await utrwal().catch(() => undefined);
    } catch (problem) {
      ustawBlad(problem instanceof Error ? problem.message : "Nieznany błąd.");
    } finally {
      zajete.current = false;
    }
  }

  const definicje = sesja.current?.definicje;
  const zagadka = dane?.zagadka;
  const miejsce =
    definicje && dane && !dane.profil
      ? aktualneMiejsce(definicje.lokalizacje, dane.stan)
      : undefined;
  const diagnostyka =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("debug") === "1";
  const tytul =
    widok === "gra"
      ? (nazwyScen[dane?.stan.aktualnaScena ?? ""] ?? "Opowieść")
      : nazwyWidokow[widok];

  return (
    <div className="aplikacja">
      <a className="pomin-nawigacje" href="#tresc">
        Przejdź do treści
      </a>
      <header className="naglowek">
        <button
          type="button"
          onClick={() => ustawWidok("start")}
          className="marka"
        >
          Kronika <span>nad Regą</span>
        </button>
        <span className="etykieta">Trzebiatów</span>
      </header>
      <StatusPwa
        pwa={pwa}
        zajete={ladowanie || zapisywanie || zablokowanyZapis}
        przygotujAktualizacje={async () => {
          if (zajete.current || zablokowanyZapis)
            throw new Error("Poczekaj na zakończenie zapisu.");
          zajete.current = true;
          ustawAktualizacjaWTrakcie(true);
          await utrwal();
        }}
        bladAktualizacji={() => {
          zajete.current = false;
          ustawAktualizacjaWTrakcie(false);
        }}
      />
      {problemZapisu && (
        <section className="karta" role="status">
          <p>
            Postęp nie jest bezpiecznie zapisany: {problemZapisu}. Poprzedni
            zapis pozostaje zachowany.
          </p>
          {!zablokowanyZapis && (
            <button
              type="button"
              disabled={zapisywanie}
              onClick={() => {
                void utrwal().catch(() => undefined);
              }}
            >
              Ponów zapis
            </button>
          )}
        </section>
      )}
      {magazyn && dane && (
        <p className="status-zapisu" role="status">
          {zapisywanie
            ? "Zapisuję postęp…"
            : zapisano
              ? "Postęp zapisany na tym urządzeniu."
              : "Postęp jeszcze nie jest zapisany."}
        </p>
      )}
      <main
        id="tresc"
        aria-busy={ladowanie || zapisywanie || aktualizacjaWTrakcie}
        inert={zapisywanie || aktualizacjaWTrakcie}
      >
        {blad ? (
          <BladGry szczegoly={blad} />
        ) : (
          <>
            {widok === "start" ? (
              <section className="powitanie">
                <p className="etykieta">Miasto · ślady · opowieści</p>
                <h1>Kronika nad Regą</h1>
                <p className="wprowadzenie">
                  Interaktywna opowieść prowadząca przez Trzebiatów.
                </p>
                <div className="linia-regi" aria-hidden="true">
                  ∿
                </div>
                <p>
                  Jedno miasto, dwie perspektywy. Zbieraj ślady, słuchaj
                  opowieści i zdecyduj, co zapiszesz w swojej Kronice.
                </p>
                <button
                  className="glowny"
                  type="button"
                  disabled={ladowanie || zablokowanyZapis}
                  onClick={rozpocznij}
                >
                  {dane ? "Wznów opowieść" : "Rozpocznij opowieść"}
                </button>
                <p className="uwaga">
                  To wczesna wersja demonstracyjna. Postęp zapisujemy na tym
                  urządzeniu po każdej zakończonej akcji.
                </p>
              </section>
            ) : (
              <h1 ref={naglowek} tabIndex={-1}>
                {tytul}
              </h1>
            )}
            {ladowanie && <p role="status">Przygotowuję opowieść…</p>}
            {(widok === "gra" || widok === "mapa") && miejsce && dane && (
              <PotwierdzenieObecnosci
                key={miejsce.id + widok}
                miejsce={miejsce}
                potwierdzone={dane.stan.potwierdzoneLokalizacje.includes(
                  miejsce.id,
                )}
                potwierdz={() =>
                  wykonaj((gra) => gra.potwierdzObecnosc(miejsce.id))
                }
              />
            )}
            {widok === "mapa" &&
              (dane && definicje ? (
                <Oczekiwanie fallback={<p role="status">Ładuję mapę…</p>}>
                  <GranicaMapy>
                    <Mapa
                      lokalizacje={definicje.lokalizacje}
                      stan={dane.stan}
                    />
                  </GranicaMapy>
                </Oczekiwanie>
              ) : (
                <p>Rozpocznij opowieść, aby odkryć miejsca.</p>
              ))}
            {widok === "gra" && dane && (
              <>
                <p className="etykieta">
                  {dane.profil ? "Zapis podróży" : "Twoja opowieść"}
                </p>
                <article className="narracja" aria-label="Treść opowieści">
                  {dane.ramka.akapity.map((tekst) => (
                    <p key={`${dane.stan.aktualnaScena}_${tekst}`}>
                      {tekst.replace(/\s*\[[a-z][a-z0-9_]*\]/g, "")}
                    </p>
                  ))}
                </article>
                <div role="status" aria-live="polite" className="komunikaty">
                  {[...new Set(dane.komunikaty)].map((tekst) => (
                    <p key={tekst}>{tekst}</p>
                  ))}
                </div>
                <InformacjaOWyniku wynik={dane.wynikZagadki} />
                {zagadka && (
                  <WidokZagadki
                    key={zagadka.id}
                    dostepneZaliczenia={dane.dostepneZaliczenia}
                    zagadka={zagadka}
                    stan={dane.stan}
                    wykonaj={wykonaj}
                  />
                )}
                {dane.opcje.length > 0 && (
                  <section aria-labelledby="wybierz-droge">
                    <h2 id="wybierz-droge" ref={naglowekWyborow} tabIndex={-1}>
                      Co zapiszesz?
                    </h2>
                    <div className="wybory">
                      {dane.opcje.map((opcja) => (
                        <button
                          type="button"
                          key={opcja.indeks}
                          onClick={() =>
                            wykonaj((gra) => gra.wybierz(opcja.indeks))
                          }
                        >
                          {opcja.tekst}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
                {dane.profil && (
                  <section className="karta">
                    <h2>Podróż zapisana</h2>
                    <p>
                      Twoja droga:{" "}
                      {
                        definicje?.zakonczenia.find(
                          (element) =>
                            element.id === dane.profil?.zakonczenieGlowne,
                        )?.nazwa
                      }
                      .
                    </p>
                    <button type="button" onClick={() => ustawWidok("kronika")}>
                      Otwórz swoją Kronikę
                    </button>
                  </section>
                )}
              </>
            )}
            {widok === "gra" && !dane && !ladowanie && (
              <button type="button" onClick={rozpocznij}>
                Rozpocznij opowieść
              </button>
            )}
            {widok === "kronika" && (
              <>
                <p>Miejsca i ślady z twojej podróży.</p>
                {!dane?.stan.odwiedzoneLokalizacje.length && (
                  <p>
                    Twoja Kronika jest jeszcze pusta. Pierwszy wpis czeka na
                    rynku.
                  </p>
                )}
                <ul className="lista-kart">
                  {definicje?.lokalizacje
                    .filter((element) =>
                      dane?.stan.odwiedzoneLokalizacje.includes(element.id),
                    )
                    .map((miejsce) => (
                      <li className="karta" key={miejsce.id}>
                        <p className="etykieta">Miejsce</p>
                        <h2>{miejsce.nazwa}</h2>
                        <p>Odwiedzone w twojej opowieści.</p>
                      </li>
                    ))}
                  {definicje?.przedmioty
                    .filter((element) =>
                      dane?.stan.sladyIPrzedmioty.includes(element.id),
                    )
                    .map((przedmiot) => (
                      <li className="karta" key={przedmiot.id}>
                        <p className="etykieta">Fragment Kroniki</p>
                        <h2>{przedmiot.nazwa}</h2>
                        <p>Fikcyjny ślad w twojej Kronice.</p>
                      </li>
                    ))}
                  {definicje?.scenki
                    .filter((element) =>
                      dane?.stan.odkryteScenki.includes(element.id),
                    )
                    .map((scenka) => (
                      <li className="karta" key={scenka.id}>
                        <p className="etykieta">Opowieść</p>
                        <h2>{scenka.nazwa}</h2>
                        <p>Przeczytana podczas podróży.</p>
                      </li>
                    ))}
                  {dane?.profil?.specjalneOdkrycia.map((id) => (
                    <li className="karta" key={id}>
                      <p className="etykieta">Odkrycie</p>
                      <h2>
                        {
                          definicje?.zakonczenia.find(
                            (element) => element.id === id,
                          )?.nazwa
                        }
                      </h2>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {widok === "watki" && (
              <>
                <p>Dwie perspektywy jednej podróży.</p>
                {!dane && <p>Rozpocznij opowieść, aby odkryć jej wątki.</p>}
                <ul className="lista-kart">
                  {definicje?.watki
                    .filter(
                      (element) =>
                        dane && dane.stan.watki[element.id] !== "ZABLOKOWANY",
                    )
                    .map((watek) => (
                      <li className="karta" key={watek.id}>
                        <h2>{watek.nazwa.replace("WĄTEK ", "")}</h2>
                        <p>
                          {dane?.stan.watki[watek.id] === "UKONCZONY"
                            ? "Ukończony"
                            : "Odkrywasz"}
                        </p>
                      </li>
                    ))}
                </ul>
              </>
            )}
            {widok === "informacje" && (
              <section className="karta">
                <h2>Dwie perspektywy miasta</h2>
                <p>
                  Krótka demonstracja prowadzi od rynku przez Hansken i Kościół
                  Macierzyństwa NMP do Baszty Kaszanej.
                </p>
                <p>
                  Fakty, legenda i elementy fabularne są oznaczone osobno. Treść
                  jest robocza; zagadka Hansken wymaga rekonesansu.
                </p>
                <p>
                  Gra zapisuje twoją drogę na tym urządzeniu. Po odświeżeniu lub
                  ponownym uruchomieniu wybierz „Wznów opowieść”. Możesz
                  przełączać widoki bez utraty miejsca w opowieści.
                </p>
                <p>To wczesna wersja demonstracyjna.</p>
              </section>
            )}
            {diagnostyka && dane && (
              <details className="debug">
                <summary>Diagnostyka sesji · DEV</summary>
                <pre>
                  {JSON.stringify(
                    {
                      scena: dane.stan.aktualnaScena,
                      flagi: dane.stan.flagi,
                      wyniki: dane.stan.wynikiZagadek,
                      watki: dane.stan.watki,
                      powinowactwa: dane.stan.powinowactwa,
                      ostatnieZdarzenia: dane.stan.dziennikZdarzen.slice(-6),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            )}
          </>
        )}
      </main>
      <nav className="nawigacja" aria-label="Główna nawigacja">
        {(Object.keys(nazwyWidokow) as Widok[]).map((id) => (
          <button
            type="button"
            key={id}
            aria-current={widok === id ? "page" : undefined}
            onClick={() => ustawWidok(id)}
          >
            {nazwyWidokow[id]}
          </button>
        ))}
      </nav>
    </div>
  );
}
