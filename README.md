# Zwiedzanie Trzebiatowa

Projekt wielowątkowej i wielozakończeniowej gry terenowej w Trzebiatowie oraz strony marketingowej prezentującej grę i umożliwiającej zakup, a później aktywację i obsługę konta.

Aktualny status: Etap 7 — mapa ładowana na żądanie, punktowy GPS oraz ręczne potwierdzenie obecności. Zagadki, podpowiedzi, pomoc i alternatywne zaliczenia pozostają dostępne. Treść pozostaje robocza i wymaga rekonesansu. Strona marketingowa ma ekran startowy; PWA nie jest zaimplementowane.

Gra będzie projektowana przede wszystkim na smartfony i do działania bez internetu, z decyzjami oraz wynikami zagadek wpływającymi na późniejszą narrację i kompozytowe zakończenia.

Dokumentacja:

- [Wizja produktu](dokumentacja/wizja.md)
- [Architektura](dokumentacja/architektura.md)
- [Rejestr Decyzji](dokumentacja/decyzje.md)
- [Zasady rozwoju](dokumentacja/zasady-rozwoju.md)
- [Wydajność](dokumentacja/wydajnosc.md)
- [Zasady treści](dokumentacja/zasady-tresci.md)

Decyzje architektoniczne D001–D011 zachowują status TYMCZASOWA. Zmiana ich statusu wymaga bezpośredniego zatwierdzenia przez użytkownika; bieżący kod opisują dokumenty poszczególnych silników.

## Uruchomienie i weryfikacja

Wymagane: Node.js 24.15 lub nowszy (testy UI używają jsdom 30) oraz npm 11 lub nowszy. Instalacja z katalogu głównego: `npm install` (dla odtwarzalnej instalacji z lockfile: `npm ci`).

| Polecenie | Działanie |
| --- | --- |
| `npm run dev:gra` | Budowa rdzenia i pakietu treści, potem grywalna demonstracja Vite (port 5173) |
| `npm run dev:strona` | Strona na lokalnym serwerze Next.js (domyślnie port 3000) |
| `npm run build` | Budowa obu aplikacji, czterech pakietów i walidacja kampanii |
| `npm run typecheck` | Sprawdzenie typów wszystkich workspace'ów |
| `npm run lint` | Kontrola kodu i formatowania przez Biome |
| `npm run format` | Formatowanie przez Biome |
| `npm run test` | Budowa, sześć testów smoke oraz testy Vitest narracji, mechaniki, schematów i interfejsu |

Gra trafia do `aplikacje/gra/dist`, statyczna strona do `aplikacje/strona/out`, a moduły ESM i deklaracje typów do `pakiety/*/dist`. Wyniki budowy nie są wersjonowane. Strona korzysta z App Routera i eksportu statycznego, bez API biznesowego i backendu. Biome jest jedynym linterem i formatterem.

Pakiety `silnik-gry`, `silnik-narracji` i `schemat-tresci` zawierają czysty rdzeń mechaniki, runtime Ink oraz walidację Zod. `typy-wspolne` udostępnia identyfikatory i neutralny KontekstNarracji. Mapa Leaflet ma opcjonalny podkład online OSM; gra nie wymaga mapy ani GPS. Audio runtime, storage i PWA pozostają poza bieżącym zakresem. Układ przyszłych treści opisuje [README pakietu treści](tresc/trzebiatow-v1/README.md).

- [Silnik Gry](dokumentacja/silnik-gry.md)
- [Model stanu](dokumentacja/model-stanu.md)
- [Zakończenia](dokumentacja/zakonczenia.md)
- [Vertical slice](dokumentacja/vertical-slice.md)
- [Test ręczny interfejsu](dokumentacja/test-reczny-vertical-slice.md)

- [Zagadki i zadania](dokumentacja/zagadki-i-zadania.md)

- [Mapa i lokalizacja](dokumentacja/mapa-i-lokalizacja.md)
