# Zwiedzanie Trzebiatowa

Projekt wielowątkowej i wielozakończeniowej gry terenowej w Trzebiatowie oraz strony marketingowej prezentującej grę i umożliwiającej zakup, a później aktywację i obsługę konta.

Aktualny status: rozpoczęty Etap 12 — pierwsza wielowątkowa kampania z czterema zadaniami obserwacyjnymi, wyborem celów, mini-finałem i czterema nowymi zakończeniami. Prototyp panoramy centrum korzysta z geometrii OSM; opcjonalny ślad GPS pozostaje lokalnie w zapisie. Zachowane są PWA/offline, EKO, audio i wcześniejszy vertical slice. Content i mapa wymagają rekonesansu oraz odbioru w terenie; Etap 12 nie jest jeszcze zamknięty.

Gra będzie projektowana przede wszystkim na smartfony i do działania bez internetu, z decyzjami oraz wynikami zagadek wpływającymi na późniejszą narrację i kompozytowe zakończenia.

## Status i dokumentacja

Etap 12 jest **CZĘŚCIOWO GOTOWY i nieukończony**. Mechanizmy są **GOTOWE TECHNICZNIE**;
wszystkie miejsca pozostają **WYMAGA_REKONESANSU**. Robocze dane i próby na telefonie
są **DO_WERYFIKACJI**. Kolejny content, docelowa ilustracja i zakup/konto są **PLANOWANE**.
Znaczenie kategorii i aktualne bramki: [status projektu](dokumentacja/status-projektu.md).

Dokumentacja:

- [Centralny rejestr 83 lokalizacji — format i walidacja](dokumentacja/rejestr-lokalizacji.md)
- [Bank 249 kandydatów zadań terenowych — model i rekonesans](dokumentacja/bank-zadan-terenowych.md)
- [Kronika zdobytej wiedzy — warstwy, filtry i offline](dokumentacja/kronika.md)
- [Wizja produktu](dokumentacja/wizja.md)
- [Architektura](dokumentacja/architektura.md)
- [Rejestr Decyzji](dokumentacja/decyzje.md)
- [Zasady rozwoju](dokumentacja/zasady-rozwoju.md)
- [Wydajność](dokumentacja/wydajnosc.md)
- [Zasady treści](dokumentacja/zasady-tresci.md)
- [Etap 12 — kampania, mapa, ślad GPS i wyniki walidacji](dokumentacja/etap-12-pelna-kampania.md)

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
| `npm run test` | Budowa, osiem testów fundamentu oraz testy Vitest narracji, mechaniki, schematów i interfejsu |

Gra trafia do `aplikacje/gra/dist`, statyczna strona do `aplikacje/strona/out`, a moduły ESM i deklaracje typów do `pakiety/*/dist`. Wyniki budowy nie są wersjonowane. Strona korzysta z App Routera i eksportu statycznego, bez API biznesowego i backendu. Biome jest jedynym linterem i formatterem.

Pakiety `silnik-gry`, `silnik-narracji` i `schemat-tresci` zawierają czysty rdzeń mechaniki, runtime Ink oraz walidację Zod. `typy-wspolne` udostępnia identyfikatory i neutralny KontekstNarracji. Panorama na pergaminie ładuje lokalną geometrię OSM na żądanie; gra działa także bez mapy i GPS. IndexedDB przechowuje zapis, przypięty pakiet oraz oddzielny lokalny ślad GPS; PWA zachowuje zasoby offline. Audio jest opcjonalne i pozostaje ładowane na żądanie. Pierwszy rozdział opisuje [README vertical slice](tresc/trzebiatow-v1/README.md), a rozszerzenie [dokument Etapu 12](dokumentacja/etap-12-pelna-kampania.md).

- [Silnik Gry](dokumentacja/silnik-gry.md)
- [Model stanu](dokumentacja/model-stanu.md)
- [Zakończenia](dokumentacja/zakonczenia.md)
- [Vertical slice](dokumentacja/vertical-slice.md)
- [Test ręczny interfejsu](dokumentacja/test-reczny-vertical-slice.md)

- [Zagadki i zadania](dokumentacja/zagadki-i-zadania.md)

- [Mapa i lokalizacja](dokumentacja/mapa-i-lokalizacja.md)

- [Zapis, PWA i offline — format, test ręczny i ograniczenia](dokumentacja/zapis-pwa-offline.md)

Warstwa źródłowa i poziomy pewności: [format informacji historycznych](dokumentacja/zrodla-contentu.md).

Robocza [sieć narracyjna](dokumentacja/siec-narracyjna.md): 8 osi, 38 węzłów,
16 niezależnych wejść i 6 splotów. Model autora jest walidowany przy budowie;
nie aktywuje miejsc ani scen w runtime. Finalny wybór contentu pozostaje PLANOWANE.

[Architektura zakończeń](dokumentacja/zakonczenia.md): resolver komponuje zakończenie
główne, warianty, epilogi i odkrycia z przebiegu gry. Nowe reguły kampanii
mają jawne sceny wejścia; walidacja łączy analizę logiczną i świadectwa resolvera.
Etap 12 pozostaje nieukończony.
