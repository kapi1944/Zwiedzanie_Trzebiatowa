# Zwiedzanie Trzebiatowa

Projekt wielowątkowej i wielozakończeniowej gry terenowej w Trzebiatowie oraz strony marketingowej prezentującej grę i umożliwiającej zakup, a później aktywację i obsługę konta.

Aktualny status: Etap 1 — fundament monorepo npm workspaces. Gra React + TypeScript + Vite i strona Next.js + TypeScript mają wyłącznie ekrany startowe. Cztery pakiety TypeScript udostępniają minimalne eksporty; treści mają osobny katalog. PWA i mechanika gry nie są jeszcze zaimplementowane.

Gra będzie projektowana przede wszystkim na smartfony i do działania bez internetu, z decyzjami oraz wynikami zagadek wpływającymi na późniejszą narrację i kompozytowe zakończenia.

Dokumentacja:

- [Wizja produktu](dokumentacja/wizja.md)
- [Architektura](dokumentacja/architektura.md)
- [Rejestr Decyzji](dokumentacja/decyzje.md)
- [Zasady rozwoju](dokumentacja/zasady-rozwoju.md)
- [Wydajność](dokumentacja/wydajnosc.md)
- [Zasady treści](dokumentacja/zasady-tresci.md)

Decyzje architektoniczne D001–D011 zachowują status TYMCZASOWA. Ich akceptacja oraz rozpoczęcie Etapu 2 wymagają bezpośredniego zatwierdzenia przez użytkownika.

## Uruchomienie i weryfikacja

Wymagane: Node.js 24 lub nowszy oraz npm 11 lub nowszy. Instalacja z katalogu głównego: `npm install` (dla odtwarzalnej instalacji z lockfile: `npm ci`).

| Polecenie | Działanie |
| --- | --- |
| `npm run dev:gra` | Gra na lokalnym serwerze Vite (domyślnie port 5173) |
| `npm run dev:strona` | Strona na lokalnym serwerze Next.js (domyślnie port 3000) |
| `npm run build` | Budowa obu aplikacji i wszystkich czterech pakietów |
| `npm run typecheck` | Sprawdzenie typów wszystkich workspace'ów |
| `npm run lint` | Kontrola kodu i formatowania przez Biome |
| `npm run format` | Formatowanie przez Biome |
| `npm run test` | Budowa i sześć testów smoke artefaktów |

Gra trafia do `aplikacje/gra/dist`, statyczna strona do `aplikacje/strona/out`, a moduły ESM i deklaracje typów do `pakiety/*/dist`. Wyniki budowy nie są wersjonowane. Strona korzysta z App Routera i eksportu statycznego, bez API biznesowego i backendu. Biome jest jedynym linterem i formatterem.

Pakiety `silnik-gry`, `silnik-narracji` i `schemat-tresci` eksportują na razie pusty moduł. `typy-wspolne` eksportuje typy identyfikatorów. Biblioteki Ink, Zod, mapy, audio, zapisu i PWA pozostają poza Etapem 1. Układ przyszłych treści opisuje [README pakietu treści](tresc/trzebiatow-v1/README.md).
