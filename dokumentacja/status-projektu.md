# Status projektu po rozpoczęciu Etapu 12

Stan: 2026-10-04, branch `codex/etap-12-pelna-kampania`, implementacja `75aef33`.
**Etap 12 pozostaje nieukończony.** Działa reprezentatywne rozszerzenie kampanii;
brak odbioru pełnej gry terenowej. Status techniczny nie zastępuje rekonesansu.

[README](../README.md) · [Etap 12](etap-12-pelna-kampania.md) · [historyczny Etap 11](status-etap-11.md)

## Znaczenie statusów

| Status | Znaczenie |
| --- | --- |
| GOTOWE TECHNICZNIE | Zaimplementowane i objęte lokalną walidacją; bez deklaracji odbioru na telefonie lub w terenie |
| CZĘŚCIOWO GOTOWE | Działa część zakresu albo prototyp; pozostają wymagania do odbioru całości |
| WYMAGA_REKONESANSU | Wymagana wizyta, potwierdzenie detali, dojścia i bezpiecznego punktu obserwacji |
| DO_WERYFIKACJI | Dane lub zachowanie bez wystarczającego potwierdzenia; nie traktować jako zaakceptowanych |
| PLANOWANE | Zakres przyszły, bez deklaracji działającej implementacji |

Kategorie opisują osobno mechanizmy, dane i odbiór. Gotowy mechanizm może nadal
korzystać z danych wymagających weryfikacji.

## Faktyczny zakres

| Obszar | Status | Stan i ograniczenia |
| --- | --- | --- |
| Silnik Gry, Ink, schematy | GOTOWE TECHNICZNIE | Deterministyczny stan, kanoniczne zdarzenia i most narracji |
| Vertical slice | GOTOWE TECHNICZNIE | Osobny pakiet i regresja 1080 dróg; nie dowodzi wszystkich historii kampanii |
| Kampania `kampania-12.1` | GOTOWE TECHNICZNIE | Łącznie 7 miejsc, 5 wątków, 6 zadań i 6 zagadek; 4 nowe zadania obserwacyjne, mini-finał i 4 nowe zakończenia główne |
| Pełna kampania / Etap 12 | CZĘŚCIOWO GOTOWE | 153 świadectwa legalnych przebiegów; brak odbioru pełnego contentu i wszystkich kombinacji |
| Panorama centrum | CZĘŚCIOWO GOTOWE | POC na geometrii OSM, wspólna transformacja warstw, pan/zoom; brak docelowej ilustracji i odbioru warunku R podczas spaceru |
| PWA, zapis i wznowienie | GOTOWE TECHNICZNIE | Stare przypięte pakiety, format stanu 1, IndexedDB v2; offline wymaga wcześniejszego przygotowania cache |
| GPS i ślad | GOTOWE TECHNICZNIE | Opcjonalne, domyślnie wyłączone, ślad lokalny poza mechaniką; bez wysyłania GPS |
| EKO i audio | GOTOWE TECHNICZNIE | Opcjonalne adaptery i lazy loading; bez pomiaru baterii i odsłuchu na telefonie |
| Miejsca runtime i bank | WYMAGA_REKONESANSU | 7 miejsc oraz 83 kandydatów, zero zatwierdzonych miejsc; 249 kandydatów zadań banku nie trafia do aplikacji |
| Dane i historia | DO_WERYFIKACJI | Robocze punkty mapy, niepotwierdzone odpowiedzi `null`, niezachowane fortyfikacje; źródła nie potwierdzają obecnej dostępności |
| Telefon i odbiór | DO_WERYFIKACJI | Realny GPS, Android/iOS, słońce, bateria, TalkBack i audio; Chromium z atrapami nie jest próbą terenową |
| Kolejny content i ilustracja | PLANOWANE | Nowe punkty, Biała Dama, Święto Kaszy, georeferencja planów, ręczna ilustracja i docelowe nagrania |
| Zakup, aktywacja i konto | PLANOWANE | Strona statyczna; brak API biznesowego i backendu |

D001–D011 pozostają TYMCZASOWA. Lokalne kontrole nie potwierdzają zdalnego CI.

## Bieżąca weryfikacja

Kontrola dokumentacji z 2026-10-04:

| Kontrola | Wynik |
| --- | --- |
| `npm run test` (obejmuje pełny build) | PASS: 235/235 = 8 fundamentu + 21 narracji + 67 silnika + 35 treści + 104 UI/adapterów |
| Graf slice / kampanii | PASS: 1080 dróg / 153 świadectwa |
| `npm run typecheck` | PASS: workspace, treści i E2E |
| `npm run lint` | FAIL: dwa zastane błędy organizacji importów i formatowania w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`; plik użytkownika niezmieniony |
| Biome na śledzonych plikach TS/JS/JSON/CSS | PASS: 99 plików; nie zastępuje wyniku root lint |
| `npm run test:e2e` | PASS: 16/16, kod 0; offline/wznowienie, kampania, GPS/ślad oraz axe i szerokości 320–1024 px |
| Budżety gzip i lazy loading | PASS w testach fundamentu |
| Linki lokalne w zmienionych dokumentach | PASS: 10 dokumentów |
| `git diff --check` | PASS |
| Rekonesans / fizyczny telefon / zdalny CI | DO_WERYFIKACJI; nie przeprowadzono |


Runner E2E czekał na zamknięcie serwera w sandboxie; po zakończeniu wyłącznie
potwierdzonego procesu Vite tej próby zwrócił kod 0. Próba ponowienia przed
zamknięciem serwera zakończyła się błędem zajętego portu, bez wykonania testów.
Nie zmieniano konfiguracji ani kodu aplikacji.

Historyczne wyniki implementacji są oddzielnie w [raporcie Etapu 12](etap-12-pelna-kampania.md#graf-flagi-i-walidacja).

## Warunki dalszego odbioru

Przeprowadzić [rekonesans](rekonesans-terenowy.md) miejsc runtime, zweryfikować
cztery nowe zadania i punkty obserwacji, odebrać panoramę podczas spaceru oraz
wykonać próby na fizycznym telefonie. Kolejne gałęzie wymagają źródeł i nowych
świadectw grafu. To warunki dalszej pracy, bez deklaracji zamknięcia Etapu 12.
