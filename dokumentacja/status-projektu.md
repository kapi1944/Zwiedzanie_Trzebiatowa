# Status projektu po rozpoczęciu Etapu 12

Stan: 2026-10-05, praca połączona z lokalnym `main` przez fast-forward do `cd8a572`;
implementacja i źródła
zapisane w commitach `1830525` oraz `3efade4`. Wcześniejsze etapy zachowują historię.
**Etap 12 pozostaje nieukończony.** Działa reprezentatywne rozszerzenie kampanii;
brak odbioru pełnej gry terenowej. Status techniczny nie zastępuje rekonesansu.

Kontrole po uporządkowaniu: pełne `npm run sprawdz` PASS (build, typy, lint,
279 testów), E2E Chromium 18/18 PASS, 1080 dróg slice i 154 świadectwa kampanii PASS.
Materiały `PROMO/`, `IIWŚ/` i jednorazowy skrypt podmiany tekstów pozostają lokalne,
poza historią aplikacji. Źródłowe PDF-y są zachowane w Git jako binarne.
Kopia pracy przed połączeniem: `.kopie-lokalne/scalenie-2026-10-05/` (lokalna,
ignorowana przez Git). Nie wykonano push; CI GitHub i odbiór terenowy pozostają
niezweryfikowane.

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
| Kronika | GOTOWE TECHNICZNIE | [Zdobyta wiedza](kronika.md), jawne warstwy i pewność, filtry i strony po 20 wpisów; fizyczny telefon nadal wymaga odbioru |
| Wątki i kierunek wyprawy | GOTOWE TECHNICZNIE | Rozpoczęte wątki, zdobyte wskazówki i cele aktualnej sceny z projekcji Quest Engine; wybór przez istniejącą sesję, testy ukrywania spoilerów |
| Miejsca runtime i bank | WYMAGA_REKONESANSU | 7 miejsc oraz 83 kandydatów, zero zatwierdzonych miejsc; 249 kandydatów zadań banku nie trafia do aplikacji |
| Dane i historia | DO_WERYFIKACJI | Robocze punkty mapy, niepotwierdzone odpowiedzi `null`, niezachowane fortyfikacje; źródła nie potwierdzają obecnej dostępności |
| Telefon i odbiór | DO_WERYFIKACJI | Realny GPS, Android/iOS, słońce, bateria, TalkBack i audio; Chromium z atrapami nie jest próbą terenową |
| Kolejny content i ilustracja | PLANOWANE | Nowe punkty, Biała Dama, Święto Kaszy, georeferencja planów, ręczna ilustracja i docelowe nagrania |
| Zakup, aktywacja i konto | PLANOWANE | Strona statyczna; brak API biznesowego i backendu |

D001–D011 pozostają TYMCZASOWA. Lokalne kontrole nie potwierdzają zdalnego CI.

[Centralny rejestr lokalizacji](rejestr-lokalizacji.md) zachowuje 83 miejsca
i 249 kandydatów zadań. Ujednolicono metadane i dodano walidację kompletności;
nie zmieniono trasy runtime ani nie wybrano finalnej trasy. Wszystkie miejsca
pozostają WYMAGA_REKONESANSU, a potwierdzone współrzędne są nieuzupełnione.

## Bieżąca weryfikacja

Kontrola redakcji banku zadań z 2026-10-04: build, 243 testy i typecheck PASS.
Wszystkie 249 propozycji wymagają rekonesansu; nie aktywowano ich w kampanii.
[Model i wyniki banku](bank-zadan-terenowych.md). E2E i rekonesansu nie ponawiano.

Wcześniejsza kontrola centralnego rejestru z 2026-10-04: build, 239 testów, typecheck, lint
śledzonych plików i diff-check PASS; root lint nadal FAIL przez nieśledzony
skrypt użytkownika. [Szczegóły i zakres kontroli](rejestr-lokalizacji.md#wyniki-kontroli-rejestru--2026-10-04).
E2E nie ponawiano; poniższa tabela zachowuje wyniki wcześniejszej zmiany dokumentacji.

Historyczna kontrola dokumentacji z 2026-10-04 (commit `5058037`):

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

Warstwa źródłowa: [model informacji historycznych](zrodla-contentu.md).
Walidacja techniczna i cytowania 83 opisów są gotowe; potwierdzenie twierdzeń
pozostaje DO_WERYFIKACJI. Opisy encyklopedii mają poziom NIEPEWNE,
rekonesans pozostaje WYMAGA_REKONESANSU. Etap 12 nie jest ukończony.
Kontrola tej zmiany: build, 245 testów, typecheck, lint śledzonych plików
oraz `git diff --check` PASS. Pełny lint: FAIL — dwa wcześniejsze błędy
w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`. E2E nie ponawiano.

Robocza [sieć narracyjna](siec-narracyjna.md): 8 osi, 38 węzłów,
16 niezależnych wejść i 6 splotów. Model autora jest walidowany przy budowie;
nie aktywuje miejsc ani scen w runtime. Finalny wybór contentu pozostaje PLANOWANE.

Konsekwencje istniejącej kampanii: GOTOWE TECHNICZNIE są warunki odczytu
Quest Engine → Ink oraz reprezentatywne przecięcia Znaki / Granice / Rezydencja
z pierwszym rozdziałem Kroniki. Szczegóły w [Etapie 12](etap-12-pelna-kampania.md).
Kontrola tej zmiany: build, 257 testów, typecheck, lint śledzonego kodu,
limity gzip/lazy i `git diff --check` PASS; 1080 dróg slice i 153 świadectwa
kampanii PASS. Pełny lint FAIL przez dwa wcześniejsze błędy nieśledzonego
skryptu użytkownika. E2E i terenu nie ponawiano. Pełny Etap 12 nadal
CZĘŚCIOWO GOTOWE; nie zmienia to DO_WERYFIKACJI i WYMAGA_REKONESANSU contentu.

[Architektura zakończeń](zakonczenia.md): resolver komponuje zakończenie
główne, warianty, epilogi i odkrycia z przebiegu gry. Nowe reguły kampanii
mają jawne sceny wejścia; walidacja łączy analizę logiczną i świadectwa resolvera.
Etap 12 pozostaje nieukończony.

Kontrola rozszerzenia resolvera: build, 269 testów (pełny zestaw oraz dodatkowe
przypadki walidatora), typecheck, lint śledzonego kodu i nowych narzędzi,
limity gzip/lazy oraz `git diff --check` PASS. Walidacja 1080 dróg slice
oraz 154 świadectw kampanii PASS. Pełny lint FAIL przez dwa wcześniejsze błędy
w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`. E2E i terenu nie ponawiano.
