import { przygotujWidokWyprawy } from "@zwiedzanie/silnik-gry/wyprawa";
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
import type { MenedzerAudio } from "./MenedzerAudio";
import {
  MenedzerWydajnosci,
  odczytajUstawienia,
  odczytajWskazowki,
  type ProfilWydajnosci,
  type TrybRuchu,
  type UstawieniaWydajnosci,
  zapiszUstawienia,
} from "./MenedzerWydajnosci";
import {
  odczytajMotyw,
  odczytajWyborMotywu,
  type WyborMotywu,
  zapiszMotyw,
  zastosujMotyw,
} from "./motyw";
import { PotwierdzenieObecnosci } from "./PotwierdzenieObecnosci";
import { type ObslugaPwa, StatusPwa } from "./StatusPwa";
import type { SesjaGry, WidokSesji } from "./sesja-gry";
import {
  odczytajUstawieniaAudio,
  type UstawieniaAudio,
  zapiszUstawieniaAudio,
} from "./ustawienia-audio";
import { uzyjSladuGps } from "./uzyjSladuGps";
import { WidokKroniki } from "./WidokKroniki";
import { InformacjaOWyniku, WidokZagadki } from "./WidokZagadki";

const Mapa = leniwie(() => import("./Mapa"));

type Widok =
  | "start"
  | "gra"
  | "mapa"
  | "kronika"
  | "watki"
  | "informacje"
  | "ustawienia";
const nazwyWidokow: Record<Widok, string> = {
  start: "Start",
  gra: "Opowieść",
  mapa: "Mapa",
  kronika: "Kronika",
  watki: "Wątki",
  informacje: "O grze",
  ustawienia: "Ustawienia",
};
const nazwyScen: Record<string, string> = {
  prolog: "Rynek i Ratusz",
  hansken: "Hansken · Rynek 26",
  kosciol: "Kościół Macierzyństwa NMP",
  kosciol_decyzja: "Kościół Macierzyństwa NMP",
  dwie_notatki: "Dwie notatki",
  baszta: "Baszta Kaszana",
  mini_final: "Twoja Kronika",
  rozdroze: "Wybierz kolejny ślad",
  hansken_powrot: "Postacie na sgraffito Hansken",
  ratusz_obserwacja: "Czas nad Rynkiem",
  mury_obserwacja: "Granice miasta",
  palac_obserwacja: "Skrzydła rezydencji",
  splot_notatek: "Splot notatek",
  final_kampanii: "Kronika wyprawy",
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
  zaladujAudio = () => import("./audio"),
  uruchom = async () => {
    const { SesjaGry } = await import("./sesja-gry");
    return new SesjaGry();
  },
}: {
  uruchom?: () => Promise<SesjaGry>;
  magazyn?: MagazynZapisu;
  pwa?: ObslugaPwa;
  zaladujAudio?: () => Promise<typeof import("./audio")>;
}) {
  const [wyborMotywu, ustawWyborMotywu] = uzyjStanu(odczytajWyborMotywu);
  const [motyw, ustawMotyw] = uzyjStanu(() => odczytajMotyw(wyborMotywu));
  const [zapisanoMotyw, ustawZapisanoMotyw] = uzyjStanu(true);
  uzyjEfektu(() => zastosujMotyw(motyw), [motyw]);
  uzyjEfektu(() => {
    if (wyborMotywu !== "auto" || typeof matchMedia !== "function") return;
    const system = matchMedia("(prefers-color-scheme: dark)");
    const aktualizuj = () => {
      const aktualny = system.matches ? "dark" : "light";
      zastosujMotyw(aktualny);
      ustawMotyw(aktualny);
    };
    aktualizuj();
    system.addEventListener("change", aktualizuj);
    return () => system.removeEventListener("change", aktualizuj);
  }, [wyborMotywu]);
  function zmienMotyw(nowy: WyborMotywu) {
    const aktualny = odczytajMotyw(nowy);
    zastosujMotyw(aktualny);
    ustawMotyw(aktualny);
    ustawWyborMotywu(nowy);
    ustawZapisanoMotyw(zapiszMotyw(nowy));
  }
  const [widok, ustawWidok] = uzyjStanu<Widok>("start");
  const [ustawienia, ustawUstawienia] = uzyjStanu(odczytajUstawienia);
  const [wskazowki, ustawWskazowki] = uzyjStanu(odczytajWskazowki);
  const [utrwalonoUstawienia, ustawUtrwalonoUstawienia] = uzyjStanu(true);
  const wydajnosc = MenedzerWydajnosci(ustawienia, wskazowki);
  const [ustawieniaAudio, ustawAudio] = uzyjStanu(odczytajUstawieniaAudio);
  const [problemAudio, ustawProblemAudio] = uzyjStanu<string>();
  const [zapisanoAudio, ustawZapisanoAudio] = uzyjStanu(true);
  const audio = uzyjReferencji<MenedzerAudio | undefined>(undefined);
  const ladowanieAudio = uzyjReferencji<Promise<void> | undefined>(undefined);
  const aktywneAudio = uzyjReferencji(true);
  const parametryAudio = uzyjReferencji({
    ustawienia: ustawieniaAudio,
    profil: wydajnosc.profil,
  });
  parametryAudio.current = {
    ustawienia: ustawieniaAudio,
    profil: wydajnosc.profil,
  };
  function zglosProblemAudio() {
    if (aktywneAudio.current)
      ustawProblemAudio(
        "Audio jest niedostępne lub zablokowane. Możesz grać dalej albo ponowić przyciskiem „Uruchom audio”.",
      );
  }
  function przygotujAudio() {
    if (
      !parametryAudio.current.ustawienia.dzwiek &&
      !parametryAudio.current.ustawienia.muzyka
    )
      return;
    ustawProblemAudio(undefined);
    if (audio.current) {
      audio.current.aktywuj();
      return;
    }
    if (ladowanieAudio.current) return;
    ladowanieAudio.current = zaladujAudio()
      .then((modul) => {
        if (!aktywneAudio.current) return;
        const aktualne = parametryAudio.current;
        if (!aktualne.ustawienia.dzwiek && !aktualne.ustawienia.muzyka) return;
        const menedzer = modul.utworzMenedzerAudio(
          aktualne.ustawienia,
          aktualne.profil,
          zglosProblemAudio,
        );
        audio.current = menedzer;
        menedzer.ustawWidocznosc(!document.hidden);
        menedzer.aktywuj();
        menedzer.przywrocNastroj(sesja.current?.odczytaj().ramka.tagi ?? []);
      })
      .catch(zglosProblemAudio)
      .finally(() => {
        ladowanieAudio.current = undefined;
      });
  }
  function zmienAudio(nowe: UstawieniaAudio) {
    parametryAudio.current.ustawienia = nowe;
    ustawAudio(nowe);
    ustawZapisanoAudio(zapiszUstawieniaAudio(nowe));
    audio.current?.ustaw(nowe, wydajnosc.profil);
    przygotujAudio();
  }
  uzyjEfektu(() => {
    audio.current?.ustaw(ustawieniaAudio, wydajnosc.profil);
  }, [ustawieniaAudio, wydajnosc.profil]);
  uzyjEfektu(() => {
    aktywneAudio.current = true;
    const widocznosc = () => audio.current?.ustawWidocznosc(!document.hidden);
    document.addEventListener("visibilitychange", widocznosc);
    return () => {
      aktywneAudio.current = false;
      document.removeEventListener("visibilitychange", widocznosc);
      audio.current?.zamknij();
      audio.current = undefined;
    };
  }, []);
  function zmienUstawienia(nowe: UstawieniaWydajnosci) {
    ustawUstawienia(nowe);
    ustawUtrwalonoUstawienia(zapiszUstawienia(nowe));
  }
  uzyjEfektu(() => {
    const ruch =
      typeof matchMedia === "function"
        ? matchMedia("(prefers-reduced-motion: reduce)")
        : undefined;
    const siec = (navigator as Navigator & { connection?: EventTarget })
      .connection;
    const odswiez = () => ustawWskazowki(odczytajWskazowki());
    ruch?.addEventListener?.("change", odswiez);
    siec?.addEventListener?.("change", odswiez);
    return () => {
      ruch?.removeEventListener?.("change", odswiez);
      siec?.removeEventListener?.("change", odswiez);
    };
  }, []);
  const [dane, ustawDane] = uzyjStanu<WidokSesji>();
  const sladGps = uzyjSladuGps(
    dane?.stan.idSesji,
    magazyn,
    wydajnosc.profil === "EKO",
  );
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
    przygotujAudio();
    if (sesja.current) {
      audio.current?.przywrocNastroj(sesja.current.odczytaj().ramka.tagi);
      ustawWidok("gra");
      return;
    }
    zajete.current = true;
    ustawLadowanie(true);
    ustawBlad(undefined);
    try {
      sesja.current = await uruchom();
      ustawDane(sesja.current.odczytaj());
      const efekty = sesja.current.odbierzEfektyAudio();
      audio.current?.wykonaj(efekty);
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
    if (audio.current) przygotujAudio();
    zajete.current = true;
    try {
      ustawDane(akcja(sesja.current));
      const efekty = sesja.current.odbierzEfektyAudio();
      audio.current?.wykonaj(efekty);
      await utrwal().catch(() => undefined);
    } catch (problem) {
      ustawBlad(problem instanceof Error ? problem.message : "Nieznany błąd.");
    } finally {
      zajete.current = false;
    }
  }
  async function rozpocznijNowa() {
    if (!sesja.current || zajete.current || zablokowanyZapis) return;
    zajete.current = true;
    ustawZapisywanie(true);
    try {
      await utrwal();
      ustawZapisywanie(true);
      const nowa = await uruchom();
      if (magazyn)
        await magazyn.rozpocznijNowa(
          sesja.current.odczytaj().stan.idSesji,
          nowa.eksportujZapis(),
          nowa.eksportujPakiet(),
        );
      sesja.current = nowa;
      nowa.potwierdzZapisanie(nowa.odczytaj().stan.dziennikZdarzen.length);
      ustawDane(nowa.odczytaj());
      ustawZapisano(!!magazyn);
      ustawProblemZapisu(undefined);
      ustawWidok("gra");
    } catch (problem) {
      ustawProblemZapisu(
        problem instanceof Error
          ? problem.message
          : "Nie udało się rozpocząć nowej wyprawy.",
      );
    } finally {
      ustawZapisywanie(false);
      zajete.current = false;
    }
  }

  const definicje = sesja.current?.definicje;
  const zagadka = dane?.zagadka;
  const miejsce =
    definicje && dane && !dane.profil
      ? aktualneMiejsce(
          definicje.lokalizacje,
          dane.stan,
          definicje.kampania?.scenyMiejsc,
        )
      : undefined;
  const diagnostyka =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("debug") === "1";
  const wyprawa =
    definicje && dane
      ? przygotujWidokWyprawy(definicje, dane.stan, dane.opcje)
      : undefined;
  const cele = wyprawa?.cele ?? [];
  const tytul =
    widok === "gra"
      ? (nazwyScen[dane?.stan.aktualnaScena ?? ""] ?? "Opowieść")
      : nazwyWidokow[widok];

  return (
    <div
      className="aplikacja"
      data-profil={wydajnosc.profil}
      data-ograniczony-ruch={wydajnosc.ograniczonyRuch}
    >
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
        <div className="narzedzia-naglowka">
          <span className="etykieta">Trzebiatów</span>
          <button
            type="button"
            className="przelacznik-motywu cichy"
            aria-label={
              motyw === "light" ? "Włącz ciemny motyw" : "Włącz jasny motyw"
            }
            onClick={() => zmienMotyw(motyw === "light" ? "dark" : "light")}
          >
            <span aria-hidden="true">{motyw === "light" ? "☾" : "☀"}</span>
          </button>
        </div>
      </header>
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
                {dane && (
                  <>
                    <button
                      type="button"
                      disabled={ladowanie || zapisywanie || zablokowanyZapis}
                      onClick={() => void rozpocznijNowa()}
                    >
                      Nowa wyprawa bez starego śladu
                    </button>
                    <p>
                      Dotychczasowy zapis pozostanie lokalną kopią. Nowa wyprawa
                      ma osobny ślad GPS.
                    </p>
                  </>
                )}
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
                wydajnosc={wydajnosc}
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
                      uproszczona={wydajnosc.profil === "EKO"}
                      ograniczoneAnimacje={wydajnosc.ograniczonyRuch}
                      lokalizacje={definicje.lokalizacje}
                      stan={dane.stan}
                      ukonczoneZadania={definicje.zadania
                        .filter(
                          (zadanie) => dane.stan.flagi[`zadanie_${zadanie.id}`],
                        )
                        .map((zadanie) => zadanie.idLokalizacji)}
                      scenyMiejsc={definicje.kampania?.scenyMiejsc ?? []}
                      dostepne={cele.map((cel) => cel.id)}
                      sladGps={sladGps}
                      wybierzCel={(id) => {
                        const cel = cele.find((element) => element.id === id);
                        if (cel) {
                          ustawWidok("gra");
                          void wykonaj((gra) => gra.wybierz(cel.indeks));
                        }
                      }}
                      odtworzPergamin={() =>
                        audio.current?.wykonaj([
                          {
                            rodzaj: "ODTWORZ_DZWIEK",
                            id: "przewrocenie_kartki",
                          },
                        ])
                      }
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
                    <p>
                      {
                        definicje?.zakonczenia.find(
                          (element) =>
                            element.id === dane.profil?.zakonczenieGlowne,
                        )?.tekst
                      }
                    </p>
                    {[
                      ...dane.profil.wariantyZakonczenia,
                      ...dane.profil.epilogiWatkow,
                      ...dane.profil.konsekwencjeZagadek,
                    ].map((id) => {
                      const epilog = definicje?.zakonczenia.find(
                        (element) => element.id === id,
                      );
                      return epilog?.tekst ? (
                        <p key={id}>{epilog.tekst}</p>
                      ) : null;
                    })}
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
              <WidokKroniki definicje={definicje} dane={dane} />
            )}
            {widok === "watki" && (
              <>
                <p>
                  Odkryte wątki twojej podróży. Kolejne mogą ujawnić się po
                  obserwacji.
                </p>
                {!dane && <p>Rozpocznij opowieść, aby odkryć jej wątki.</p>}
                {dane && !wyprawa?.watki.length && (
                  <p>Nie masz jeszcze rozpoczętych wątków.</p>
                )}
                <ul className="lista-kart">
                  {wyprawa?.watki.map((watek) => (
                    <li className="karta" key={watek.id}>
                      <h2>{watek.nazwa.replace("WĄTEK ", "")}</h2>
                      <p>
                        {watek.status === "UKONCZONY"
                          ? "Ukończony"
                          : watek.status === "POMINIETY"
                            ? "Pominięty"
                            : "Odkrywasz (aktywny)"}
                      </p>
                    </li>
                  ))}
                </ul>
                {dane && (
                  <>
                    <h2>Odkryte wskazówki</h2>
                    {wyprawa?.wskazowki.length ? (
                      <ul>
                        {wyprawa?.wskazowki.map((wskazowka) => (
                          <li key={wskazowka.id}>{wskazowka.nazwa}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nie znaleziono jeszcze wskazówek.</p>
                    )}
                    <h2>Dostępne teraz cele</h2>
                    {cele.length > 1 && (
                      <p>
                        Możesz wybrać kierunek wyprawy. Każda z poniższych opcji
                        jest teraz dostępna.
                      </p>
                    )}
                    {cele.length ? (
                      <ul className="lista-kart">
                        {cele.map((cel) => (
                          <li className="karta" key={cel.indeks}>
                            <h3>{cel.nazwa}</h3>
                            <button
                              type="button"
                              disabled={
                                ladowanie || zapisywanie || zablokowanyZapis
                              }
                              onClick={() => {
                                ustawWidok("gra");
                                void wykonaj((gra) => gra.wybierz(cel.indeks));
                              }}
                            >
                              {cel.tekst}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Brak nowego celu do wyboru w tej scenie. Kontynuuj
                        bieżącą opowieść.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {widok === "ustawienia" && (
              <section className="karta ustawienia">
                <h2>Wygląd</h2>
                <fieldset>
                  <legend>Motyw interfejsu</legend>
                  <div className="wybor-motywu">
                    <button
                      type="button"
                      aria-pressed={wyborMotywu === "auto"}
                      onClick={() => zmienMotyw("auto")}
                    >
                      Zgodnie z ustawieniami systemu
                    </button>
                    <button
                      type="button"
                      aria-pressed={wyborMotywu === "light"}
                      onClick={() => zmienMotyw("light")}
                    >
                      <span aria-hidden="true">☀ </span>Jasny
                    </button>
                    <button
                      type="button"
                      aria-pressed={wyborMotywu === "dark"}
                      onClick={() => zmienMotyw("dark")}
                    >
                      <span aria-hidden="true">☾ </span>Ciemny
                    </button>
                  </div>
                </fieldset>
                <p role="status">
                  Aktywny motyw: {motyw === "light" ? "Jasny" : "Ciemny"}
                  {wyborMotywu === "auto"
                    ? " (zgodnie z ustawieniami systemu)"
                    : ""}
                  .
                </p>
                {!zapisanoMotyw && (
                  <p role="status">
                    Nie udało się zapamiętać motywu. Obowiązuje do zamknięcia
                    aplikacji.
                  </p>
                )}
                <h2>Animacje interfejsu</h2>
                <label htmlFor="tryb-ruchu">Animacje interfejsu</label>
                <p id="opis-animacji">
                  Określa intensywność animacji i efektów ruchu. Nie wpływa na
                  rozgrywkę, mapę ani lokalizację.
                </p>
                <select
                  id="tryb-ruchu"
                  aria-describedby="opis-animacji"
                  value={ustawienia.ruch}
                  onChange={(zdarzenie) =>
                    zmienUstawienia({
                      ...ustawienia,
                      ruch: zdarzenie.target.value as TrybRuchu,
                    })
                  }
                >
                  <option value="SYSTEMOWY">
                    Zgodnie z ustawieniami systemu
                  </option>
                  <option value="OGRANICZONY">Ograniczone animacje</option>
                  <option value="PELNY">Pełne animacje</option>
                </select>
                <h2>Tryb wydajności</h2>
                <label htmlFor="profil-wydajnosci">Tryb wydajności</label>
                <select
                  id="profil-wydajnosci"
                  value={ustawienia.profil}
                  onChange={(zdarzenie) =>
                    zmienUstawienia({
                      ...ustawienia,
                      profil: zdarzenie.target.value as ProfilWydajnosci,
                    })
                  }
                >
                  <option value="AUTOMATYCZNY">Automatyczny</option>
                  <option value="PELNY">Pełny</option>
                  <option value="EKO">EKO</option>
                </select>
                <p role="status">
                  Aktywny tryb: {wydajnosc.profil === "EKO" ? "EKO" : "Pełny"}.
                  Możesz zmienić go w każdej chwili.
                </p>
                <p>
                  Ustawienia dotyczą tego urządzenia. Wybory, zagadki i
                  zakończenia są takie same we wszystkich trybach.
                </p>
                {!utrwalonoUstawienia && (
                  <p role="status">
                    Nie udało się zapamiętać ustawień. Obowiązują do zamknięcia
                    aplikacji.
                  </p>
                )}
                <h2>Audio</h2>
                <p className="uwaga material-tymczasowy">
                  Materiał tymczasowy · Dźwięki techniczne, bez finalnej muzyki.
                </p>
                <label className="odpowiedz">
                  <input
                    type="checkbox"
                    checked={ustawieniaAudio.dzwiek}
                    onChange={(zdarzenie) =>
                      zmienAudio({
                        ...ustawieniaAudio,
                        dzwiek: zdarzenie.target.checked,
                      })
                    }
                  />
                  Dźwięk (efekty): {ustawieniaAudio.dzwiek ? "ON" : "OFF"}
                </label>
                <label className="odpowiedz">
                  <input
                    type="checkbox"
                    checked={ustawieniaAudio.muzyka}
                    onChange={(zdarzenie) =>
                      zmienAudio({
                        ...ustawieniaAudio,
                        muzyka: zdarzenie.target.checked,
                      })
                    }
                  />
                  Muzyka: {ustawieniaAudio.muzyka ? "ON" : "OFF"}
                </label>
                <label htmlFor="glosnosc-efektow">
                  Głośność efektów:{" "}
                  {Math.round(ustawieniaAudio.glosnoscEfektow * 100)}%
                </label>
                <input
                  id="glosnosc-efektow"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ustawieniaAudio.glosnoscEfektow}
                  onChange={(zdarzenie) =>
                    zmienAudio({
                      ...ustawieniaAudio,
                      glosnoscEfektow: Number(zdarzenie.target.value),
                    })
                  }
                />
                <label htmlFor="glosnosc-muzyki">
                  Głośność muzyki:{" "}
                  {Math.round(ustawieniaAudio.glosnoscMuzyki * 100)}%
                </label>
                <input
                  id="glosnosc-muzyki"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ustawieniaAudio.glosnoscMuzyki}
                  onChange={(zdarzenie) =>
                    zmienAudio({
                      ...ustawieniaAudio,
                      glosnoscMuzyki: Number(zdarzenie.target.value),
                    })
                  }
                />
                <button
                  type="button"
                  disabled={!ustawieniaAudio.dzwiek && !ustawieniaAudio.muzyka}
                  onClick={przygotujAudio}
                >
                  Uruchom audio
                </button>
                <button
                  type="button"
                  onClick={() =>
                    zmienAudio({
                      ...ustawieniaAudio,
                      dzwiek: false,
                      muzyka: false,
                    })
                  }
                >
                  Wycisz wszystko
                </button>
                {!zapisanoAudio && (
                  <p role="status">
                    Nie udało się zapamiętać ustawień audio. Obowiązują do
                    zamknięcia aplikacji.
                  </p>
                )}
                {problemAudio && <p role="status">{problemAudio}</p>}
              </section>
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
    </div>
  );
}
