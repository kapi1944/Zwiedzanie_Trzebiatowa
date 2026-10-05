# Analiza gałęzi i przygotowania połączenia — 2026-10-05

## Aktualizacja po autoryzacji uporządkowania

Poniższy audyt opisuje stan sprzed porządkowania. Na późniejsze polecenie użytkownika
zapisano kod i testy w `1830525`, a cztery źródłowe PDF-y w `3efade4`.
Zależne zmiany aplikacji, kampanii, schematu i silnika pozostawiono w jednym
spójnym commicie zamiast tworzyć przejściowo niespójne kontrakty.
Formatowanie CSS i kolejność selektorów poprawiono lokalnie. Pełne `sprawdz`:
PASS (build, typy, lint i 279 testów); końcowe E2E: 18/18 PASS.
Dokumentacja, snapshoty i reguły ignorowania stanowią osobny commit.
Przygotowana metoda połączenia z main: fast-forward, bez przepisywania historii.
Nie wykonano push.

Kopia 184 roboczych plików istnieje w `.kopie-lokalne/scalenie-2026-10-05/`,
wraz ze spisem; sprawdzono brak brakujących plików. Pierwotną kopię utworzono
w `test-results`, ale Playwright czyści ten katalog podczas testów, dlatego
odtworzono zabezpieczenie w trwałym katalogu poza wynikami testów.
Materiały PROMO/IIWŚ, w tym ZIP-y przekraczające limit GitHub, oraz jednorazowy
skrypt pozostają na dysku i w kopii, z jawnymi wpisami w `.gitignore`.
Nie stanowią części historii aplikacji ani przyszłego push. Cztery źródłowe
PDF-y są w historii; zgodność ich bajtów z indeksem Git potwierdzono.

## Pierwotny audyt

Zakres: historia gałęzi `codex/etap-12-pelna-kampania`, różnice od podstawy Etapu 12 (`671a580`), zmiany względem `main`, wszystkie pozycje bieżącego statusu Git. To analiza integracji i wykonane kontrole, nie gwarancja braku wszystkich błędów ani audyt historycznych źródeł PDF. Nie wykonano commit, push, merge, reset, stash ani przełączenia gałęzi. Instrukcje zawarte w zastanych dokumentach potraktowano jako materiał historyczny.

## Stan Git

- Bezpośredni odczyt `git ls-remote --heads origin` potwierdził: `main` na GitHubie = `26f7458`, lokalny `main` również = `26f7458`.
- HEAD = `5058037`. Gałąź Etapu 12 nie istnieje na origin i nie ma upstream.
- `main...HEAD`: 0 commitów tylko na main, 16 tylko na obecnej gałęzi. Wszystkie wcześniejsze etapy są przodkami HEAD.
- Etap 12 ma dwa commity: `75aef33` (kampania, mapa i GPS) oraz `5058037` (status i dokumentacja).
- Przed utworzeniem tego raportu: 166 pozycji, 31 zmodyfikowanych plików śledzonych i 135 nowych plików. Lista z ekranów odpowiada aktualnemu statusowi.
- Dwa commity Etapu 12 obejmują 57 plików. Późniejsze zmiany śledzone: 12227 dodanych i 1715 usuniętych linii; nowe pliki nie wchodzą do tej statystyki.
- Technicznie możliwy jest fast-forward main do tej gałęzi. Nie ma potrzeby przepisywać historii ani przenosić pojedynczych commitów starszych etapów. Stan origin trzeba ponownie odczytać tuż przed integracją.

## Analiza zmian i ich zależności

| Obszar | Zmiana i ocena integracji |
| --- | --- |
| Kampania i Ink | Kampania rozbudowuje dotychczasowy slice, zachowuje wcześniejsze sceny i dopina kontynuację. JSON, Ink, schemat, generator, most sesji i testy muszą wejść jako spójna całość. Nowe konsekwencje podpowiedzi i wariant Pałacu są odtwarzane po zapisie. |
| Silnik | Zadania wynikają z rezultatów zagadek, aktywacja i ukończenie wątków z warunków. Zagadki scenowe wymagają właściwej sceny i potwierdzenia obecności. `czyWyborDostepny` jest wspólnym mechanizmem legalności dla wykonania i sesji. |
| Zakończenia | Resolver dodaje warianty, wymagania wiedzy i scenę wejścia; wybiera epilogi według grup i priorytetów. Nowe narzędzie waliduje logiczną spójność i świadectwa dojścia. Analiza logiczna nie zastępuje przeszukania wszystkich możliwych stanów. |
| Rejestr miejsc | 83 osobne rekordy, kandydaci terenowi, źródła, pewność i powiązania runtime. Walidacja pilnuje kompletności, identyfikatorów i protokołu dla potwierdzonej odpowiedzi. Bank kandydatów nie jest równoznaczny z 83 grywalnymi miejscami. |
| Sieć narracyjna | Schemat, dane i symulacja autora; status `PROPOZYCJA`. Sprawdzane są powiązania, wejścia, sploty i osiągalność. Sieć nie tworzy stanu ani flag gry i nie jest pełną implementacją rozgrywki banku. |
| Kronika | Projekcja zdobytej wiedzy i stanu sesji; brak osobnego magazynu postępu. Rozróżnia warstwy informacji, filtruje, wyszukuje, stronicuje po 20 wpisów. Stare oznaczenie FAKT bez poziomu pewności nie wystarcza do pokazania potwierdzonego faktu. |
| Wyprawa i cele | `wyprawa.ts` projektuje znane wątki, wskazówki i bieżące cele z zatwierdzonych opcji. Mapa i ekran wątków korzystają ze wspólnej projekcji; wybór celu przechodzi przez istniejącą sesję. |
| Mapa | Lokalna geometria OSM, import z zachowanych plików, Canvas, poziomy szczegółów, przesuwanie i powiększanie, wspólna projekcja dla GPS i znaczników. Niepewne historyczne położenia nie są rekonstruowane jako pewne. To POC, nie terenowo potwierdzona mapa. |
| GPS i zapis | IndexedDB migruje z wersji 1 do 2, dodając osobny magazyn śladu. Nowa wyprawa archiwizuje poprzedni zapis transakcyjnie. Ślad filtruje niewiarygodne pomiary, rozdziela odcinki i zabezpiecza zapis między kartami generacją. Zachowanie fizycznego GPS i baterii wymaga telefonu. |
| PWA | Geometria mapy jest ładowana i cache'owana na żądanie razem z mapą. Offline podkładu wymaga wcześniejszego otwarcia online; gra ma fallback przy braku podkładu. |
| Motywy i wygląd | Motyw odczytywany przed startem React, zapisywany w localStorage; fallback przy braku pamięci. Nowe tokeny LIGHT/DARK, formularze i pergamin, zmieniona hierarchia karty obecności, nawigacja sticky u góry. Wspólne pliki TSX/CSS zawierają kilka funkcji — podział commitów wymaga fragmentów, nie wyłącznie list ścieżek. |
| Testy i infrastruktura | Rozbudowane testy kampanii, Kroniki, legalnych celów, motywów, zapisu/GPS i E2E. Preview Vite przeniesiono do globalSetup z zamykaniem serwera. Snapshoty są dowodem określonego stanu UI, nie automatycznym testem porównania obrazów. |
| Budżet CSS | Baza limitu gzip CSS podniesiona z 1491 do 2823 bajtów na potrzeby dwóch motywów. To świadoma zmiana kryterium akceptacji, a nie wyłącznie dodanie testu. Bieżący test budżetów przechodzi. |
| Dokumentacja | Nowe opisy źródeł, terenowych kandydatów, sieci, Kroniki, motywów i statusów. Etap 12 nadal nie ma dowodu pełnej akceptacji terenowej. |
| Skrypt roboczy | `zastap_teksty_trzebiatow_v2.mjs` oczekuje starej gałęzi `feat/etapy-7-11` i czystego worktree. Nie uruchomiono go; nie jest częścią normalnego builda gry. Nie zalecam dodawania go do commita aplikacji bez decyzji o jego dalszej roli. |
| Materiały | PROMO, IIWŚ, PDF/PPTX/ZIP nie są kodem aplikacji. Dwa nowe ZIP przekraczają limit zwykłego GitHub: około 194,34 i 135,61 MiB. Nie dodawać ich zwykłym `git add .`; rozważyć osobne przechowywanie albo świadomie skonfigurowany LFS. |

## Kontrole z tego audytu

- Build całego repozytorium: PASS.
- Typecheck całego repozytorium: PASS.
- Walidacja treści podczas builda: 1080 dróg slice i 154 świadectwa kampanii PASS.
- `git diff --check`: PASS przed dodaniem raportu.
- `npm run sprawdz`: FAIL na formatowaniu `aplikacje/gra/src/style.css`; dodatkowo ostrzeżenie specyficzności selektorów. Bez automatycznych poprawek.
- Testy uruchomiono osobno po buildzie: 8 fundamentu + 21 narracji + 67 silnika + 66 treści + 117 aplikacji = 279 PASS.
- Pełne E2E Chromium: 18/18 PASS, proces zakończył się prawidłowo (1,5 minuty).
- CI GitHub i fizyczny telefon/teren nie zostały sprawdzone tym uruchomieniem.

## Zalecana kolejność integracji

1. Zachować kopię wszystkich roboczych plików, w tym materiałów poza Git. Sam znacznik gałęzi nie zabezpiecza niezacommitowanych danych.
2. Naprawić lokalnie formatowanie CSS, rozpatrzyć ostrzeżenie i ponowić wymagane kontrole. Nie trzeba kończyć całego Etapu 12, żeby zapisać jego działający stan.
3. Zapisać spójne commity: (a) silnik, schemat, kampania, walidatory i ich testy; (b) Kronika, sesja i cele z testami; (c) motywy, wygląd i górne menu z testami; (d) infrastruktura E2E, snapshoty i aktualna dokumentacja. Wspólne fragmenty Aplikacja.tsx/style.css przypisać do właściwych commitów. Jeśli podział przecina zależności, połączyć części zamiast tworzyć niedziałające commity.
4. Materiały promocyjne zabezpieczyć osobno, nie usuwać. PDF będące źródłami wymagają zachowania dostępności i odnośników. Dwa za duże ZIP nie mogą wejść do zwykłej historii Git.
5. Opublikować bieżącą gałąź na origin i otrzymać kopię commitów na GitHubie; to nie zmienia main. Sprawdzić CI i przygotować PR obejmujący również wcześniejsze etapy.
6. Po akceptacji połączyć z main. Przy niezmienionym main wystarczy fast-forward; jeśli main ruszy, ponownie przeanalizować różnice i rozwiązać konflikty bez nadpisywania cudzej pracy. Zachować istniejącą historię zamiast squashowania całych etapów 0–12 w jeden commit.
7. Push main wykonać dopiero po połączeniu i kontrolach. Po scaleniu kontynuować pracę z aktualnego main; status nieukończonego Etapu 12 pozostaje jawny.

Publikacja gałęzi może nastąpić wcześniej jako kopia zapasowa działającej pracy/WIP; nie jest certyfikatem ukończenia etapu. Nie stosować force push ani reset do porządkowania tej sytuacji.

## Dlaczego wcześniej nie publikowano

Historia potwierdza wcześniejsze commity oraz opublikowane gałęzie etapów 0–11. Z zapisów poprzednich prac wynika wyraźne polecenie „Nie wykonuj push ani merge” przy Etapie 12, a nie techniczny zakaz publikacji. Późniejsze zadania pozostawiały zmiany bez commita; zastany raport Visual Pass opisuje to wprost. Brak push miał podstawę w ograniczeniu zakresu; narastanie dużego worktree było problemem organizacji punktów zapisu. Niedokończony etap nie wymaga pozostawiania całej pracy bez commitów.

## Znaczenie operacji

- Commit: lokalny punkt historii obejmujący wybrane zmiany.
- Origin: nazwa zdalnego repozytorium; main: nazwa gałęzi.
- Push / Push origin: wysłanie commitów do repozytorium, zwykle do odpowiednika bieżącej gałęzi. Na tej gałęzi nie oznacza aktualizacji main.
- Push do main: aktualizacja zdalnej gałęzi main wybranymi commitami; należy poprzedzić ją właściwym połączeniem.
- Fetch origin (nie „fetch do origin”): odczyt i pobranie historii z origin, bez automatycznego scalania do bieżącej gałęzi.
- Publish branch: pierwszy push tej gałęzi i ustanowienie jej zdalnego odpowiednika/upstream. W obecnym stanie wyśle historię do 5058037, w tym wcześniejsze etapy, lecz nie 166 roboczych pozycji. Nie scala main ani nie publikuje działającej witryny; skonfigurowane CI może się uruchomić.
- Przełączenie na main nie usuwa commitów bocznej gałęzi. Pliki w katalogu zaczynają odzwierciedlać main, więc nowości mogą zniknąć z widoku do czasu powrotu lub merge. Niezacommitowane zmiany wymagają osobnego potraktowania; Desktop może zaoferować pozostawienie/przeniesienie ich. Najpierw zapisać i zabezpieczyć.

Źródła zachowania Desktop: https://docs.github.com/en/desktop/making-changes-in-a-branch/managing-branches-in-github-desktop oraz https://docs.github.com/en/desktop/making-changes-in-a-branch/pushing-changes-to-github-from-github-desktop . Limit plików: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github .

## Pełny spis 166 pozycji roboczych przed raportem

Status M: zmiana śledzona; ??: nowy plik bez commita.

~~~text
 M README.md
 M aplikacje/gra/index.html
 M aplikacje/gra/src/Aplikacja.tsx
 M aplikacje/gra/src/PotwierdzenieObecnosci.tsx
 M aplikacje/gra/src/mapa/pergamin.css
 M aplikacje/gra/src/sesja-gry.ts
 M aplikacje/gra/src/style.css
 M aplikacje/gra/testy/kampania-gps.test.tsx
 M dokumentacja/etap-12-pelna-kampania.md
 M dokumentacja/status-projektu.md
 M dokumentacja/zakonczenia.md
 M narzedzia/graf-kampanii.ts
 M narzedzia/narracja-slice.ts
 M narzedzia/pakiet-kampanii.ts
 M narzedzia/walidacja-contentu.ts
 M narzedzia/zbuduj-tresc.ts
 M pakiety/schemat-tresci/src/index.ts
 M pakiety/silnik-gry/package.json
 M pakiety/silnik-gry/src/index.ts
 M pakiety/silnik-gry/src/krok.ts
 M pakiety/silnik-gry/src/stan.ts
 M pakiety/silnik-gry/src/warunki.ts
 M pakiety/silnik-gry/src/zakonczenia.ts
 M pakiety/silnik-gry/testy/gra.test.ts
 M playwright.config.ts
 M testy/e2e/kampania.spec.ts
 M testy/fundament.test.mjs
 M testy/kampania.test.ts
 M tresc/kampania/bank-miejsc.json
 M tresc/kampania/kampania.ink
 M tresc/kampania/kampania.json
?? "IIWŚ/ChatGPT Image 5 paź 2026, 03_27_22 (4).png"
?? "IIWŚ/Trzebiatów 1939–1945_ Historia w aplikacji.png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (1).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (10).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (2).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (3).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (4).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (5).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (6).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (7).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (8).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (9).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (1).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (2).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (3).png"
?? "PROMO/ChatGPT Image 5 paź 2026, 03_32_19.png"
?? PROMO/III/01_TREPTOV_plakat_promocyjny_PION.jpg
?? PROMO/III/02_TREPTOV_gadzety_i_akcesoria_POZIOM.jpg
?? PROMO/III/03_TREPTOV_gra_planszowa_PREMIUM_POZIOM.jpg
?? PROMO/III/04_TREPTOV_gra_karciana_ARCHIWUM_POZIOM.jpg
?? PROMO/III/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.jpg
?? PROMO/III/06_TREPTOV_EDYCJA_16PLUS_KONCEPCJA.jpg
?? PROMO/III/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pdf
?? PROMO/III/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pptx
?? PROMO/III/TREPTOV_IIWS_PAKIET_GRAFIK_PROMOCYJNYCH.pdf
?? PROMO/III/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA.pdf
?? PROMO/III/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA.pptx
?? "PROMO/IIWS/ChatGPT Image 5 paź 2026, 03_47_12.png"
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/01_TREPTOV_PLAKAT_PROMOCYJNY_PION.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/01_TREPTOV_PLAKAT_PROMOCYJNY_PION.png
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/02_TREPTOV_KOLEKCJA_GADZETY_POZIOM.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/02_TREPTOV_KOLEKCJA_GADZETY_POZIOM.png
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/03_TREPTOV_GRA_PLANSZOWA_PREMIUM_POZIOM.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/03_TREPTOV_GRA_PLANSZOWA_PREMIUM_POZIOM.png
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/04_TREPTOV_GRA_KARCIANA_ARCHIWUM_POZIOM.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/04_TREPTOV_GRA_KARCIANA_ARCHIWUM_POZIOM.png
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.png
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/06_TREPTOV_EDYCJA_16PLUS_PION.jpg
?? PROMO/IIWS/GRAFIKI_PROMOCYJNE/06_TREPTOV_EDYCJA_16PLUS_PION.png
?? PROMO/IIWS/README.txt
?? PROMO/IIWS/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pdf
?? PROMO/IIWS/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pptx
?? PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_PION.pdf
?? PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_PION.pptx
?? PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_POZIOM.pdf
?? PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_POZIOM.pptx
?? PROMO/IIWS/TREPTOV_IIWS_PAKIET_FINAL_V2.zip
?? PROMO/IIWS/TREPTOV_IIWS_PAKIET_GRAFIK_PROMOCYJNYCH.pdf
?? PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_PION.pdf
?? PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_PION.pptx
?? PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_POZIOM.pdf
?? PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_POZIOM.pptx
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/00_indeks_plikow.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/01_key_art_Tajemnice_Trzebiatowa_1939-1945.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/02_na_czym_polega_gra.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/03_prawdziwe_miejsca_nowe_spojrzenie.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/04_sound_fx_dzwieki_wojny_i_miasta.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/05_gadzety_i_pamiatki.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/06_edycja_kolekcjonerska_walizka.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/07_archiwum_gracza_akcesoria.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/08_dlaczego_warto_dla_trzebiatowa.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/09_wspolpraca_z_gmina_i_partnerami.png
?? PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/10_reklama_poznaj_trzebiatow_na_nowo.png
?? PROMO/TRYLOGIA/Tajemnice_Trzebiatowa_trylogia_premium_v1.zip
?? Tajemnice_Trzebiatowa_Encyklopedia_100str_MAPA_PIERWSZA_v0.7.pdf
?? Tajemnice_Trzebiatowa_Encyklopedia_100str_gotyk_realne_zdjecia_v0.6.pdf
?? Trzebiatow_Encyklopedia_miejsc_i_bank_zadan_v0.1.pdf
?? Trzebiatow_Encyklopedia_pergamin_i_mapa_gracza_v0.2.pdf
?? aplikacje/gra/src/WidokKroniki.tsx
?? aplikacje/gra/src/kronika.ts
?? aplikacje/gra/src/motyw.ts
?? aplikacje/gra/src/motywy.css
?? aplikacje/gra/testy/kronika.test.tsx
?? aplikacje/gra/testy/motyw.test.tsx
?? aplikacje/gra/testy/watki.test.tsx
?? dokumentacja/bank-zadan-terenowych.md
?? dokumentacja/kronika.md
?? dokumentacja/motywy-ui.md
?? dokumentacja/rejestr-lokalizacji.md
?? dokumentacja/siec-narracyjna.md
?? dokumentacja/status/PLAN_COMMITOW_PRZED_VISUAL_PASS.md
?? dokumentacja/status/VISUAL_PASS_1.md
?? dokumentacja/status/WORKTREE_BEFORE_VISUAL_PASS_1.md
?? dokumentacja/ui-snapshot/README.md
?? dokumentacja/ui-snapshot/desktop/dark/mapa-mapa-i-kontrolki.png
?? dokumentacja/ui-snapshot/desktop/dark/mapa-panel-celu.png
?? dokumentacja/ui-snapshot/desktop/dark/mapa.png
?? dokumentacja/ui-snapshot/desktop/dark/start.png
?? dokumentacja/ui-snapshot/desktop/dark/ustawienia-audio-dol.png
?? dokumentacja/ui-snapshot/desktop/dark/ustawienia-audio.png
?? dokumentacja/ui-snapshot/desktop/dark/ustawienia.png
?? dokumentacja/ui-snapshot/desktop/light/mapa-mapa-i-kontrolki.png
?? dokumentacja/ui-snapshot/desktop/light/mapa-panel-celu.png
?? dokumentacja/ui-snapshot/desktop/light/mapa.png
?? dokumentacja/ui-snapshot/desktop/light/start.png
?? dokumentacja/ui-snapshot/desktop/light/ustawienia-audio-dol.png
?? dokumentacja/ui-snapshot/desktop/light/ustawienia-audio.png
?? dokumentacja/ui-snapshot/desktop/light/ustawienia.png
?? dokumentacja/ui-snapshot/manifest.json
?? dokumentacja/ui-snapshot/mobile/dark/01-start.png
?? dokumentacja/ui-snapshot/mobile/dark/02-opowiesc-panel-celu.png
?? dokumentacja/ui-snapshot/mobile/dark/02-opowiesc.png
?? dokumentacja/ui-snapshot/mobile/dark/03-mapa-mapa-i-kontrolki.png
?? dokumentacja/ui-snapshot/mobile/dark/03-mapa-panel-celu.png
?? dokumentacja/ui-snapshot/mobile/dark/03-mapa.png
?? dokumentacja/ui-snapshot/mobile/dark/04-kronika-pierwsze-wpisy.png
?? dokumentacja/ui-snapshot/mobile/dark/04-kronika.png
?? dokumentacja/ui-snapshot/mobile/dark/05-watki.png
?? dokumentacja/ui-snapshot/mobile/dark/06-o-grze.png
?? dokumentacja/ui-snapshot/mobile/dark/07-ustawienia-audio-dol.png
?? dokumentacja/ui-snapshot/mobile/dark/07-ustawienia-audio.png
?? dokumentacja/ui-snapshot/mobile/dark/07-ustawienia.png
?? dokumentacja/ui-snapshot/mobile/light/01-start.png
?? dokumentacja/ui-snapshot/mobile/light/02-opowiesc-panel-celu.png
?? dokumentacja/ui-snapshot/mobile/light/02-opowiesc.png
?? dokumentacja/ui-snapshot/mobile/light/03-mapa-mapa-i-kontrolki.png
?? dokumentacja/ui-snapshot/mobile/light/03-mapa-panel-celu.png
?? dokumentacja/ui-snapshot/mobile/light/03-mapa.png
?? dokumentacja/ui-snapshot/mobile/light/04-kronika-pierwsze-wpisy.png
?? dokumentacja/ui-snapshot/mobile/light/04-kronika.png
?? dokumentacja/ui-snapshot/mobile/light/05-watki.png
?? dokumentacja/ui-snapshot/mobile/light/06-o-grze.png
?? dokumentacja/ui-snapshot/mobile/light/07-ustawienia-audio-dol.png
?? dokumentacja/ui-snapshot/mobile/light/07-ustawienia-audio.png
?? dokumentacja/ui-snapshot/mobile/light/07-ustawienia.png
?? dokumentacja/zrodla-contentu.md
?? narzedzia/reguly-zakonczen.ts
?? narzedzia/siec-narracyjna.ts
?? narzedzia/snapshot-ui.mjs
?? pakiety/silnik-gry/src/wyprawa.ts
?? testy/e2e/motywy.spec.ts
?? testy/e2e/serwer-podgladu.ts
?? tresc/kampania/siec-narracyjna.json
?? zastap_teksty_trzebiatow_v2.mjs
~~~

## Pełny spis 57 plików z dwóch commitów Etapu 12

~~~text
M	README.md
M	aplikacje/gra/src/Aplikacja.tsx
M	aplikacje/gra/src/MagazynZapisu.ts
M	aplikacje/gra/src/Mapa.tsx
M	aplikacje/gra/src/WidokZagadki.tsx
M	aplikacje/gra/src/lokalizacja.ts
A	aplikacje/gra/src/mapa/geometria.ts
A	aplikacje/gra/src/mapa/interakcja.ts
A	aplikacje/gra/src/mapa/nakladka-historyczna.ts
A	aplikacje/gra/src/mapa/pergamin.css
A	aplikacje/gra/src/mapa/warstwa-artystyczna.ts
A	aplikacje/gra/src/mapa/warstwy-gracza.ts
M	aplikacje/gra/src/sesja-gry.ts
A	aplikacje/gra/src/slad-gps.ts
A	aplikacje/gra/src/uzyjSladuGps.ts
A	aplikacje/gra/testy/kampania-gps.test.tsx
M	aplikacje/gra/testy/lokalizacja.test.tsx
A	aplikacje/gra/testy/slad-hook.test.tsx
M	aplikacje/gra/testy/zapis.test.tsx
M	aplikacje/gra/vite.config.ts
M	biome.json
M	dokumentacja/architektura.md
A	dokumentacja/etap-12-pelna-kampania.md
M	dokumentacja/jakosc-i-zaleznosci.md
M	dokumentacja/mapa-i-lokalizacja.md
A	dokumentacja/mapa/historyczne-fortyfikacje-trzebiatowa.md
A	dokumentacja/mapa/pergamin-poc-390.png
M	dokumentacja/rekonesans-terenowy.md
M	dokumentacja/status-etap-11.md
A	dokumentacja/status-projektu.md
M	dokumentacja/zakonczenia.md
M	dokumentacja/zapis-pwa-offline.md
A	narzedzia/graf-kampanii.ts
A	narzedzia/importuj-geometrie.py
M	narzedzia/narracja-slice.ts
M	narzedzia/pakiet-gry.ts
A	narzedzia/pakiet-kampanii.ts
M	narzedzia/walidacja-contentu.ts
M	narzedzia/zbuduj-tresc.ts
M	pakiety/schemat-tresci/src/index.ts
M	pakiety/silnik-gry/src/krok.ts
M	pakiety/silnik-gry/src/warunki.ts
M	pakiety/silnik-gry/src/zagadki.ts
M	pakiety/silnik-gry/src/zakonczenia.ts
A	testy/e2e/kampania.spec.ts
M	testy/e2e/teren.spec.ts
A	testy/kampania.test.ts
A	tresc/kampania/bank-miejsc.json
A	tresc/kampania/kampania.ink
A	tresc/kampania/kampania.json
A	tresc/mapa/README.md
A	tresc/mapa/centrum.osm.gz
A	tresc/mapa/geometria.json
A	tresc/mapa/mlynowka.osm.gz
A	tresc/mapa/rega.osm.gz
M	tsconfig.tresc.json
M	vitest.tresc.config.ts
~~~
