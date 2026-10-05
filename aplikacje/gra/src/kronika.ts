import type { DefinicjeGry, WynikZagadki } from "@zwiedzanie/schemat-tresci";
import type { WidokSesji } from "./sesja-gry";

export const warstwyKroniki = [
  "FAKT HISTORYCZNY",
  "LEGENDA / PRZEKAZ",
  "FABULARYZACJA GRY",
  "INFORMACJA DO WERYFIKACJI",
] as const;
export type WarstwaKroniki = (typeof warstwyKroniki)[number];
export interface WpisKroniki {
  id: string;
  nazwa: string;
  rodzaj: string;
  tekst: string;
  warstwa: WarstwaKroniki;
  uwagi?: string | undefined;
  zrodla: {
    id: string;
    tytul: string;
    opisBibliograficzny: string;
    url?: string | undefined;
  }[];
}

const wyniki: Record<WynikZagadki, string> = {
  ROZWIAZANA_SAMODZIELNIE: "Rozwiązana samodzielnie",
  ROZWIAZANA_Z_PODPOWIEDZIA: "Rozwiązana z podpowiedzią",
  ROZWIAZANA_Z_POMOCA: "Rozwiązana z pomocą",
  POMINIETA: "Pominięta — pytanie pozostaje otwarte",
  NIEUDANA: "Nieudana — bez rozstrzygnięcia",
};

// Projekcja zdobytych danych sesji; nie przechowuje osobnego stanu wiedzy.
export function przygotujWpisyKroniki(
  definicje: DefinicjeGry,
  dane: WidokSesji,
): WpisKroniki[] {
  const wpisy: WpisKroniki[] = [];
  const zrodla = new Map(definicje.zrodla.map((zrodlo) => [zrodlo.id, zrodlo]));
  const dodaj = (id: string, nazwa: string, rodzaj: string, tekst: string) =>
    wpisy.push({
      id,
      nazwa,
      rodzaj,
      tekst,
      warstwa: "FABULARYZACJA GRY",
      zrodla: [],
    });
  for (const miejsce of definicje.lokalizacje)
    if (dane.stan.odwiedzoneLokalizacje.includes(miejsce.id))
      dodaj(
        `miejsce_${miejsce.id}`,
        miejsce.nazwa,
        "Miejsce",
        "Odkryte w przebiegu gry. Ten zapis nie potwierdza rekonesansu terenowego.",
      );
  for (const wiedza of dane.wiedza) {
    if (wiedza.informacjeHistoryczne) {
      for (const informacja of wiedza.informacjeHistoryczne) {
        const przekaz = ["LEGENDA", "TRADYCJA"].includes(
          informacja.klasyfikacja,
        );
        const warstwa: WarstwaKroniki =
          informacja.klasyfikacja === "FABULARYZOWANE"
            ? "FABULARYZACJA GRY"
            : przekaz
              ? "LEGENDA / PRZEKAZ"
              : informacja.klasyfikacja === "FAKT" &&
                  informacja.poziomPewnosci === "POTWIERDZONE"
                ? "FAKT HISTORYCZNY"
                : "INFORMACJA DO WERYFIKACJI";
        wpisy.push({
          id: `wiedza_${wiedza.id}_${informacja.id}`,
          nazwa: wiedza.nazwa,
          rodzaj: "Informacja historyczna",
          tekst: informacja.tekst,
          warstwa,
          uwagi: `${informacja.poziomPewnosci.replaceAll("_", " ")}${informacja.wymagaDodatkowejWeryfikacji ? " — wymaga dodatkowej weryfikacji" : ""}${przekaz ? ". Przekaz nie dowodzi opisywanego wydarzenia." : ""}`,
          zrodla: informacja.zrodla.map((zrodlo, indeks) => ({
            id: `${informacja.id}_${indeks}`,
            tytul: "Źródło informacji",
            opisBibliograficzny: zrodlo.opisBibliograficzny,
          })),
        });
      }
    } else {
      const przekaz = ["LEGENDA", "TRADYCJA"].includes(wiedza.klasyfikacja);
      wpisy.push({
        id: `wiedza_${wiedza.id}`,
        nazwa: wiedza.nazwa,
        rodzaj: "Informacja historyczna",
        tekst: wiedza.tekst.replace(/^FAKT:\s*/, ""),
        warstwa:
          wiedza.klasyfikacja === "FABULARYZOWANE"
            ? "FABULARYZACJA GRY"
            : przekaz
              ? "LEGENDA / PRZEKAZ"
              : "INFORMACJA DO WERYFIKACJI",
        uwagi: przekaz
          ? "Przekaz nie dowodzi opisywanego wydarzenia."
          : wiedza.klasyfikacja === "FABULARYZOWANE"
            ? undefined
            : "Poziom pewności nie został określony — do weryfikacji.",
        zrodla: wiedza.idZrodla.flatMap((id) => {
          const zrodlo = zrodla.get(id);
          return zrodlo ? [zrodlo] : [];
        }),
      });
    }
  }
  for (const przedmiot of definicje.przedmioty)
    if (dane.stan.sladyIPrzedmioty.includes(przedmiot.id))
      dodaj(
        `przedmiot_${przedmiot.id}`,
        przedmiot.nazwa,
        przedmiot.rodzaj === "FRAGMENT_KRONIKI"
          ? "Fragment Kroniki"
          : przedmiot.rodzaj === "TROP"
            ? "Ślad"
            : "Przedmiot",
        "Znaleziony w opowieści gry.",
      );
  for (const zagadka of definicje.zagadki) {
    const wynik = dane.stan.wynikiZagadek[zagadka.id];
    if (wynik)
      dodaj(
        `zagadka_${zagadka.id}`,
        zagadka.nazwa,
        "Rezultat zagadki",
        `${wyniki[wynik.wynik]}. Użyte podpowiedzi: ${dane.stan.uzytePodpowiedzi[zagadka.id] ?? 0}.`,
      );
  }
  for (const watek of definicje.watki) {
    const stan = dane.stan.watki[watek.id];
    if (stan === "AKTYWNY" || stan === "UKONCZONY" || stan === "POMINIETY")
      dodaj(
        `watek_${watek.id}`,
        watek.nazwa,
        "Fragment wątku",
        stan === "UKONCZONY"
          ? "Wątek ukończony."
          : stan === "POMINIETY"
            ? "Wątek pominięty."
            : "Wątek rozwijany; jego dalsze fragmenty pozostają nieodkryte.",
      );
  }
  for (const scenka of definicje.scenki)
    if (dane.stan.odkryteScenki.includes(scenka.id))
      dodaj(
        `scenka_${scenka.id}`,
        scenka.nazwa,
        "Opowieść",
        "Przeczytana podczas podróży.",
      );
  for (const id of dane.profil?.specjalneOdkrycia ?? []) {
    const odkrycie = definicje.zakonczenia.find((regula) => regula.id === id);
    if (odkrycie)
      dodaj(
        `odkrycie_${id}`,
        odkrycie.nazwa,
        "Odkrycie",
        odkrycie.tekst ?? "Odkryte przez twój przebieg wyprawy.",
      );
  }
  return wpisy;
}
