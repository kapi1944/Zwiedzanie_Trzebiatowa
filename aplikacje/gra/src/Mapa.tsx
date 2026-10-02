import type { DefinicjaLokalizacji, StanGry } from "@zwiedzanie/schemat-tresci";
import {
  latLngBounds as granice,
  map as utworzMape,
  tileLayer as warstwaKafelkow,
  circleMarker as znacznik,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useEffect as uzyjEfektu,
  useRef as uzyjReferencji,
  useState as uzyjStanu,
} from "react";
import { aktualneMiejsce, miejscaNaMapie } from "./lokalizacja";

export default function Mapa({
  lokalizacje,
  stan,
}: {
  lokalizacje: readonly DefinicjaLokalizacji[];
  stan: StanGry;
}) {
  const kontener = uzyjReferencji<HTMLElement>(null);
  const [online, ustawOnline] = uzyjStanu(false);
  const [siec, ustawSiec] = uzyjStanu(navigator.onLine !== false);
  const [bladKafelkow, ustawBladKafelkow] = uzyjStanu(false);
  const miejsca = miejscaNaMapie(lokalizacje, stan);
  const cel = aktualneMiejsce(lokalizacje, stan);
  uzyjEfektu(() => {
    const sprawdz = () => ustawSiec(navigator.onLine !== false);
    window.addEventListener("online", sprawdz);
    window.addEventListener("offline", sprawdz);
    return () => {
      window.removeEventListener("online", sprawdz);
      window.removeEventListener("offline", sprawdz);
    };
  }, []);
  uzyjEfektu(() => {
    if (!kontener.current) return;
    const mapa = utworzMape(kontener.current, { scrollWheelZoom: false });
    const punkty: [number, number][] = [];
    for (const miejsce of miejscaNaMapie(lokalizacje, stan)) {
      if (!miejsce.geo) continue;
      const punkt: [number, number] = [
        miejsce.geo.szerokosc,
        miejsce.geo.dlugosc,
      ];
      punkty.push(punkt);
      const opis = document.createElement("span");
      opis.textContent = `${miejsce.nazwa}${miejsce.id === cel?.id ? " · CEL" : ""}${stan.odwiedzoneLokalizacje.includes(miejsce.id) ? " · odwiedzone w opowieści" : ""}`;
      znacznik(punkt, {
        radius: miejsce.id === cel?.id ? 14 : 8,
        color: miejsce.id === cel?.id ? "#a53a12" : "#263e2e",
        fillOpacity: 0.7,
      })
        .addTo(mapa)
        .bindTooltip(opis, { permanent: true, direction: "top" });
    }
    if (punkty.length)
      mapa.fitBounds(granice(punkty), { maxZoom: 17, padding: [65, 65] });
    if (online && siec)
      warstwaKafelkow("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      })
        .on("tileerror", () => ustawBladKafelkow(true))
        .addTo(mapa);
    return () => {
      mapa.remove();
    };
  }, [lokalizacje, stan, cel?.id, online, siec]);
  return (
    <section>
      {!siec && (
        <p role="status">
          Offline — podkład mapy jest niedostępny. Markery i lista miejsc
          pozostają dostępne.
        </p>
      )}
      <p>
        Pomarańczowy znacznik: aktualny cel opowieści. Mapa nie wyznacza
        bezpiecznej trasy pieszej.
      </p>
      <label>
        <input
          type="checkbox"
          checked={online}
          onChange={(zdarzenie) => {
            ustawOnline(zdarzenie.target.checked);
            ustawBladKafelkow(false);
          }}
        />{" "}
        Włącz podkład online OpenStreetMap (wymaga internetu)
      </label>
      {bladKafelkow && (
        <p role="status">
          Podkład jest niedostępny. Korzystaj z listy miejsc i opowieści.
        </p>
      )}
      <section
        ref={kontener}
        className="mapa"
        aria-label="Mapa odblokowanych miejsc"
      />
      <ul>
        {miejsca.map((miejsce) => (
          <li key={miejsce.id}>
            {miejsce.nazwa}
            {miejsce.id === cel?.id ? " · aktualny cel" : ""}
            {stan.odwiedzoneLokalizacje.includes(miejsce.id)
              ? " · odwiedzone w opowieści"
              : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
