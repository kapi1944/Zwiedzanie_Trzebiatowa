import type { DefinicjaLokalizacji, StanGry } from "@zwiedzanie/schemat-tresci";
import {
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import { aktualneMiejsce } from "./lokalizacja";
import {
  type GeometriaMapy,
  naEkran,
  poziomSzczegolow,
  projektuj,
  zaladujGeometrie,
} from "./mapa/geometria";
import { uzyjInterakcjiMapy } from "./mapa/interakcja";
import { przygotujNakladke } from "./mapa/nakladka-historyczna";
import { rysujMiasto } from "./mapa/warstwa-artystyczna";
import {
  miejscaGameplay,
  rozmiescZnaczniki,
  rysujHistorie,
  rysujSlad,
} from "./mapa/warstwy-gracza";
import type { uzyjSladuGps } from "./uzyjSladuGps";
import "./mapa/pergamin.css";

function czyRozwinieto(idSesji: string) {
  try {
    return sessionStorage.getItem(`pergamin:${idSesji}`) === "tak";
  } catch {
    return false;
  }
}
export default function Mapa({
  uproszczona = false,
  ograniczoneAnimacje = false,
  lokalizacje,
  stan,
  dostepne,
  sladGps,
  wybierzCel,
  odtworzPergamin,
  scenyMiejsc,
  ukonczoneZadania = [],
}: {
  uproszczona?: boolean;
  ograniczoneAnimacje?: boolean;
  lokalizacje: readonly DefinicjaLokalizacji[];
  stan: StanGry;
  dostepne?: readonly string[];
  sladGps?: ReturnType<typeof uzyjSladuGps>;
  wybierzCel?: (id: string) => void;
  odtworzPergamin?: () => void;
  scenyMiejsc?: readonly { idSceny: string; idLokalizacji: string }[];
  ukonczoneZadania?: readonly string[];
}) {
  const kontener = uzyjReferencji<HTMLDivElement>(null);
  const plotno = uzyjReferencji<HTMLCanvasElement>(null);
  const [rozmiar, ustawRozmiar] = uzyjStanu({ szerokosc: 390, wysokosc: 500 });
  const [rozwijanie, ustawRozwijanie] = uzyjStanu(
    () => !uproszczona && !czyRozwinieto(stan.idSesji),
  );
  const [wybrane, ustawWybrane] = uzyjStanu<string>();
  const [warstwaHistoryczna, ustawHistorie] = uzyjStanu(true);
  const [geometria, ustawGeometrie] = uzyjStanu<GeometriaMapy>();
  const [bladPodkladu, ustawBladPodkladu] = uzyjStanu(false);
  const odtworzenie = uzyjReferencji(odtworzPergamin);
  odtworzenie.current = odtworzPergamin;
  uzyjEfektu(() => {
    let aktywne = true;
    void zaladujGeometrie()
      .then((dane) => {
        if (aktywne) ustawGeometrie(dane);
      })
      .catch(() => {
        if (aktywne) ustawBladPodkladu(true);
      });
    return () => {
      aktywne = false;
    };
  }, []);
  const { widok, ustawWidok, powieksz, przesun, wskaznik } =
    uzyjInterakcjiMapy();
  const cel = aktualneMiejsce(lokalizacje, stan, scenyMiejsc);
  const miejsca = miejscaGameplay(
    lokalizacje,
    stan,
    dostepne ?? stan.odblokowaneLokalizacje,
    cel?.id,
  );
  const poziom = poziomSzczegolow(widok.zoom);
  const pozycja = sladGps?.slad.pozycja;
  const widoczne = miejsca.filter(
    (miejsce) => miejsce.punktMapy || miejsce.geo,
  );
  uzyjEfektu(() => {
    if (!rozwijanie) return;
    odtworzenie.current?.();
    const czas = setTimeout(
      () => {
        ustawRozwijanie(false);
      },
      ograniczoneAnimacje ? 0 : 480,
    );
    return () => clearTimeout(czas);
  }, [rozwijanie, ograniczoneAnimacje]);
  uzyjEfektu(() => {
    if (!rozwijanie)
      try {
        sessionStorage.setItem(`pergamin:${stan.idSesji}`, "tak");
      } catch {
        /* Powtorzenie animacji nie blokuje gry. */
      }
  }, [rozwijanie, stan.idSesji]);
  uzyjEfektu(() => {
    if (!kontener.current) return;
    const obserwator = new ResizeObserver(([wpis]) => {
      if (wpis)
        ustawRozmiar({
          szerokosc: wpis.contentRect.width,
          wysokosc: wpis.contentRect.height,
        });
    });
    obserwator.observe(kontener.current);
    return () => obserwator.disconnect();
  }, []);
  uzyjEfektu(() => {
    if (!plotno.current || !geometria) return;
    const gestosc = Math.min(
      window.devicePixelRatio || 1,
      uproszczona ? 1.5 : 2,
    );
    plotno.current.width = Math.round(rozmiar.szerokosc * gestosc);
    plotno.current.height = Math.round(rozmiar.wysokosc * gestosc);
    const pioro = plotno.current.getContext("2d");
    if (!pioro) return;
    pioro.setTransform(gestosc, 0, 0, gestosc, 0, 0);
    rysujMiasto(
      pioro,
      geometria,
      rozmiar.szerokosc,
      rozmiar.wysokosc,
      widok,
      poziom,
      uproszczona,
    );
    if (warstwaHistoryczna)
      rysujHistorie(
        pioro,
        przygotujNakladke(geometria.obiekty),
        widok,
        rozmiar.szerokosc,
        rozmiar.wysokosc,
      );
    if (sladGps)
      rysujSlad(
        pioro,
        sladGps.slad,
        widok,
        rozmiar.szerokosc,
        rozmiar.wysokosc,
      );
  }, [
    rozmiar,
    widok,
    poziom,
    uproszczona,
    warstwaHistoryczna,
    sladGps,
    geometria,
  ]);
  const punktGracza = pozycja
    ? naEkran(projektuj(pozycja), widok, rozmiar.szerokosc, rozmiar.wysokosc)
    : undefined;
  return (
    <section aria-label="Pergamin Trzebiatowa">
      <p>
        Współczesne centrum · panorama na pergaminie. Podkład działa offline po
        pierwszym otwarciu z połączeniem. Punktów zaliczenia i dostępności nie
        potwierdzono jeszcze w terenie.
      </p>
      {!geometria && (
        <p role="status">
          {bladPodkladu
            ? "Podkład niedostępny. Otwórz mapę ponownie po odzyskaniu połączenia. Opowieść i ręczne potwierdzanie nadal działają."
            : "Przygotowuję geometrię centrum…"}
        </p>
      )}
      <fieldset className="narzedzia-mapy">
        <legend>Sterowanie mapą</legend>
        <button
          type="button"
          onClick={() => powieksz(1.3)}
          disabled={rozwijanie}
        >
          Powiększ mapę
        </button>
        <button
          type="button"
          onClick={() => powieksz(1 / 1.3)}
          disabled={rozwijanie}
        >
          Oddal mapę
        </button>
        <button
          type="button"
          onClick={() => ustawWidok({ zoom: 1.8, x: 0, y: 0 })}
          disabled={rozwijanie}
        >
          Centrum miasta
        </button>
        <button
          type="button"
          onClick={() => przesun(80, 0)}
          disabled={rozwijanie}
          aria-label="Przesuń mapę w prawo"
        >
          →
        </button>
        <button
          type="button"
          onClick={() => przesun(-80, 0)}
          disabled={rozwijanie}
          aria-label="Przesuń mapę w lewo"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => przesun(0, 80)}
          disabled={rozwijanie}
          aria-label="Przesuń mapę w dół"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => przesun(0, -80)}
          disabled={rozwijanie}
          aria-label="Przesuń mapę w górę"
        >
          ↑
        </button>
        {punktGracza && (
          <button
            type="button"
            onClick={() =>
              przesun(
                rozmiar.szerokosc / 2 - punktGracza.x,
                rozmiar.wysokosc / 2 - punktGracza.y,
              )
            }
          >
            Znajdź moją pozycję
          </button>
        )}
      </fieldset>
      {rozwijanie && (
        <button type="button" onClick={() => ustawRozwijanie(false)}>
          Pomiń rozwijanie
        </button>
      )}
      <div
        ref={kontener}
        className={`mapa pergamin ${rozwijanie && !ograniczoneAnimacje ? "pergamin-rozwijany" : ""}`}
        {...(!rozwijanie ? wskaznik : {})}
        data-gotowa={!rozwijanie && !!geometria}
        data-poziom={poziom}
        data-slad-widoczny={sladGps?.slad.widoczny ?? false}
        data-slad-punktow={sladGps?.slad.punkty.length ?? 0}
      >
        <canvas
          ref={plotno}
          role="img"
          aria-label="Panorama współczesnego centrum Trzebiatowa z geometrii OpenStreetMap"
        />
        <span className="kompas-mapy" aria-hidden="true">
          N ↑
        </span>
        {!rozwijanie &&
          rozmiescZnaczniki(
            widoczne,
            widok,
            rozmiar.szerokosc,
            rozmiar.wysokosc,
            cel?.id,
          ).map(({ miejsce, punkt, pelny }) => {
            if (!pelny)
              return (
                <span
                  key={miejsce.id}
                  className="kotwica-miejsca"
                  aria-hidden="true"
                  style={{ left: punkt.x, top: punkt.y }}
                />
              );
            return (
              <button
                key={miejsce.id}
                type="button"
                className={`znacznik-miejsca ${miejsce.id === cel?.id ? "znacznik-celu" : ""}`}
                style={{ left: punkt.x, top: punkt.y }}
                aria-label={`${miejsce.nazwa}${miejsce.id === cel?.id ? " · aktualny cel" : ""}`}
                onClick={() => ustawWybrane(miejsce.id)}
              >
                {ukonczoneZadania.includes(miejsce.id)
                  ? "✓"
                  : stan.odwiedzoneLokalizacje.includes(miejsce.id)
                    ? "•"
                    : "◆"}
              </button>
            );
          })}
        {punktGracza && (
          <span
            className="pozycja-gracza"
            role="img"
            aria-label="Ostatnia zaakceptowana pozycja gracza"
            style={{ left: punktGracza.x, top: punktGracza.y }}
          >
            ●
          </span>
        )}
      </div>
      <p className="opis-mapy">
        Brąz: zachowane odcinki murów według OSM (geometria do weryfikacji).
        Niepewne dawne bramy pozostają bez położenia na mapie. Karmazyn:
        wyłącznie zaakceptowane pomiary przebytej drogi. Znacznik pozycji jest
        osobny.
      </p>
      <label>
        <input
          type="checkbox"
          checked={warstwaHistoryczna}
          onChange={(zdarzenie) => ustawHistorie(zdarzenie.target.checked)}
        />{" "}
        Pokaż zachowane fortyfikacje
      </label>
      {sladGps && (
        <fieldset className="karta">
          <legend>Pozycja i przebyty ślad</legend>
          <p>
            Historia pozostaje lokalnie na tym urządzeniu, osobno dla tej
            rozgrywki. Po wznowieniu włącz GPS ponownie. Widoczność linii nie
            steruje GPS.
          </p>
          <button
            type="button"
            disabled={!sladGps.gotowy}
            onClick={() => sladGps.ustawGps(!sladGps.gps)}
          >
            {sladGps.gps ? "Wyłącz GPS mapy" : "Włącz GPS mapy"}
          </button>
          <label>
            <input
              type="checkbox"
              disabled={!sladGps.gotowy}
              checked={sladGps.slad.rejestracja}
              onChange={(zdarzenie) =>
                sladGps.ustawRejestracje(zdarzenie.target.checked)
              }
            />{" "}
            Rejestruj przebytą drogę
          </label>
          <label>
            <input
              type="checkbox"
              disabled={!sladGps.gotowy}
              checked={sladGps.slad.widoczny}
              onChange={(zdarzenie) =>
                sladGps.ustawWidocznosc(zdarzenie.target.checked)
              }
            />{" "}
            Pokaż przebytą drogę
          </label>
          <button
            type="button"
            disabled={!sladGps.gotowy || !sladGps.slad.punkty.length}
            onClick={() => void sladGps.wyczysc()}
          >
            Wyczyść ślad tej rozgrywki
          </button>
          <p role="status">
            {sladGps.komunikat ||
              "GPS mapy jest wyłączony. Możesz korzystać z ręcznego potwierdzania miejsc."}
          </p>
        </fieldset>
      )}
      <ul>
        {miejsca.map((miejsce) => (
          <li
            key={miejsce.id}
            className={wybrane === miejsce.id ? "karta" : undefined}
          >
            <strong>{miejsce.nazwa}</strong>
            <button
              type="button"
              onClick={() => ustawWybrane(miejsce.id)}
              aria-label={`Szczegóły: ${miejsce.nazwa}`}
            >
              Szczegóły miejsca
            </button>
            {ukonczoneZadania.includes(miejsce.id)
              ? " · ukończone zadanie"
              : ""}
            {miejsce.id === cel?.id ? " · aktualny cel" : ""}
            {stan.odwiedzoneLokalizacje.includes(miejsce.id)
              ? " · odwiedzone w opowieści"
              : ""}
            {stan.potwierdzoneLokalizacje.includes(miejsce.id)
              ? " · obecność potwierdzona"
              : ""}
            {miejsce.wymaganiaDostepu && <p>{miejsce.wymaganiaDostepu}</p>}
            {dostepne?.includes(miejsce.id) && wybierzCel && (
              <button type="button" onClick={() => wybierzCel(miejsce.id)}>
                Wybierz cel: {miejsce.nazwa}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p>
        <a href="https://www.openstreetmap.org/copyright">
          © OpenStreetMap contributors · ODbL
        </a>{" "}
        · odczyt {geometria?.odczyt ?? "2026-10-04"}. Wysokości bez danych
        źródłowych są stylizacją. Prototyp wymaga oceny w terenie.
      </p>
    </section>
  );
}
