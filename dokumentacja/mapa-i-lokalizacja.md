# Mapa i lokalizacja — Etap 7

Mapa jest pomocniczym widokiem. Fabuła, odblokowania i potwierdzenia pozostają w Silniku Gry. Gra działa bez otwierania mapy, podkładu online oraz bez zgody na GPS. Etap 8 nie jest zaimplementowany.

## Scena a lokalizacja

`DefinicjaSceny` / `schematDefinicjiSceny` opisuje węzeł narracji: id węzła Ink, nazwę i metadane treści. Pipeline waliduje `sceny.yaml` osobno, sprawdza źródła, unikalność i obecność w Ink. Scena nie przyjmuje geo, warunku odblokowania miejsca ani trybu potwierdzenia. Usunięto redundantne `idSceny` z rejestru; odwołania do Ink nadal używają `id`.

`DefinicjaLokalizacji` jest miejscem terenowym z odwołaniem `idSceny` do opowieści. Mapa używa wyłącznie `lokalizacje.yaml`, nigdy rejestru scen. `dwie_notatki`, `kosciol_decyzja`, `mini_final` i epilogi nie są punktami mapy. W scenie pobocznej cel pozostaje ostatnim odwiedzonym miejscem. Odwiedzenie w opowieści nie dowodzi fizycznej obecności.

## Dane geo i źródła

Opcjonalne `geo` zawiera `szerokosc` (-90..90), `dlugosc` (-180..180), dodatni `promienPotwierdzeniaMetry`, opcjonalną dodatnią `dokladnoscWymaganaMetry`, URL `zrodloWspolrzednych` oraz `charakterDanych`. Współrzędne są w stopniach WGS84. `GPS_LUB_RECZNIE` wymaga geo; `TYLKO_RECZNIE` nie uruchamia pomiaru. Brak trybu w starszych definicjach technicznych oznacza bezpiecznie `TYLKO_RECZNIE`.

Odczyt internetowy: 2026-10-02. Wartości skopiowane z markerów map instytucji publicznych (atrybuty `data-latitude` / `data-longitude` portalu województwa oraz marker / odnośnik GPX NID).

| Punkt | Szerokość | Długość | Źródło |
| --- | --- | --- | --- |
| Rynek / Ratusz | 54.062392199421 | 15.265858022611 | [Samorząd województwa, karta 1636](https://rowery.wzp.pl/en/1636-pomorze-zachodnie-the-town-hall) |
| Hansken — Rynek 26 | 54.061859999421 | 15.266039973629 | [Samorząd województwa, karta 3726](https://rowery.wzp.pl/en/3726-pomorze-zachodnie-sgraffito-of-hansken-the-elephant-on-the-facade) |
| Kościół Macierzyństwa NMP | 54.063962100817 | 15.266927061477 | [Narodowy Instytut Dziedzictwa](https://zabytek.pl/pl/obiekty/trzebiatow-kosciol-par-pw-macierzynstwa-nmp) |
| Baszta Kaszana | 54.060467053052 | 15.266369228073 | [Samorząd województwa, karta 2447](https://rowery.wzp.pl/2447-pomorze-zachodnie-baszta-prochowa-baszta-kaszana-w-trzebiatowie) |

To punkty obiektów, nie pomiary geodezyjne ani zatwierdzone stanowiska postoju. Liczba cyfr nie oznacza dokładności. Dostawcy nie deklarują dokładności terenowej. Wszystkie cztery miejsca wymagają rekonesansu, bez daty `zweryfikowanoTerenowoDnia`.

Roboczo ustawiono promień 60 m i maksymalną raportowaną niedokładność 40 m. Te parametry wymagają kalibracji w terenie. Czysty Haversine (`obliczOdlegloscMetry`, promień Ziemi 6371000 m) porównuje dystans do punktu z promieniem włącznie z granicą. Dokładność jest osobną bramką: nie rozszerza promienia. Bez jawnego limitu dokładności adapter używa promienia miejsca. Raportowana dokładność przeglądarki jest szacunkiem, nie dowodem obecności ani zabezpieczeniem przeciw fałszowaniu GPS.

## Adapter i świadome potwierdzenie

`AdapterLokalizacji` znajduje się w aplikacji. Przyjmuje wymienny interfejs `getCurrentPosition`, dzięki czemu testy używają atrap w Node. Obsługuje brak wsparcia, brak świadomej zgody, odmowę systemową, niedostępność, timeout, słabą dokładność, pozycję w promieniu i poza nim. Pomiar następuje po przycisku „Sprawdź moją lokalizację”: `enableHighAccuracy: true`, `timeout: 12000`, `maximumAge: 0`. Nie ma `watchPosition`, odpytywania w tle ani ponawiania automatycznego. Przeglądarka wymaga bezpiecznego kontekstu HTTPS (localhost do testów) i może pokazać własne pytanie o zgodę.

Wynik w promieniu udostępnia „Potwierdź obecność po pomiarze”. To oddzielna świadoma akcja, która wysyła wyłącznie kanoniczne `POTWIERDZ_OBECNOSC` z id miejsca. Silnik nadal wymaga wcześniejszej wizyty narracyjnej. Nie dostaje pozycji ani dokładności i nie zmienia przebiegu fabuły. Powtórne potwierdzenie w sesji nie dopisuje zdarzenia.

„Potwierdź ręcznie” jest dostępne w Opowieści i Mapie, zgodnie z oboma trybami definicji. Odmowa, timeout, słaby GPS, indoor i test developerski nie blokują gry. Dziennik zapisuje normalne potwierdzenie bez rankingu jakości gracza ani danych pomiaru.

## Prywatność

Surowa pozycja istnieje tylko podczas callbacku adaptera; zwracana jest ocena, bez współrzędnych. Ocena UI znika po opuszczeniu widoku lub zmianie miejsca. Brak historii ruchu, zapisu trasy, GPS w StanGry / DziennikZdarzen, analityki, storage i backendu. Włączenie podkładu online wysyła zwykłe zapytania o kafelki aktualnego widoku do OSM (IP i obszar mapy), bez pozycji użytkownika; podkład jest domyślnie wyłączony.

## Leaflet i opcjonalny podkład

Sprawdzono [oficjalny download](https://leafletjs.com/download.html), [licencję](https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE) i metadane npm przed instalacją: stabilny Leaflet **1.9.4**, **BSD-2-Clause**, rozmiar paczki po rozpakowaniu **3739487 B**; 2.0.0-alpha.1 nie jest wydaniem stabilnym. Bezpośredni import JS i CSS działa z Vite 8 / React; lifecycle obsługuje lokalny efekt React z `map.remove()` przy demontażu. Nie ma wrappera React ani MapLibre. Deklaracje `@types/leaflet` są zależnością developerską.

`React.lazy(() => import("./Mapa"))` ładuje mapę dopiero po otwarciu widoku rozpoczętej gry. Leaflet i jego CSS są w dynamicznym chunku. Błąd ładowania mapy ma lokalną granicę błędu i pozwala wrócić do Opowieści. Lista i markery pokazują wyłącznie `odblokowaneLokalizacje`, status wizyty oraz wyróżniony cel. Ukryte miejsca nie mają markerów ani nazw na mapie.

Podkład po zaznaczeniu checkboxa używa `https://tile.openstreetmap.org/{z}/{x}/{y}.png` i widocznej atrybucji OpenStreetMap contributors; atrybucja Leaflet pozostaje widoczna. Stosujemy [politykę tile servera OSM](https://operations.osmfoundation.org/policies/tiles/): normalne wyświetlanie, bez masowego pobierania, pre-cache, service workera, zmiany Referer ani nagłówków wyłączających cache przeglądarki. Usługa nie gwarantuje dostępności. Błąd kafelków daje komunikat; lista i Opowieść pozostają dostępne. Etap 8 musi zapewnić własne zasoby offline bez prefetch publicznych kafelków. Tutaj nie ma offline tiles, PWA, IndexedDB ani PMTiles.

## Pomiary i weryfikacja

Vite podaje rozmiary gzip JS (kB dziesiętne). Baza Etapu 6: initial **73,17 kB**, sesja ładowana na żądanie **72,26 kB**. Etap 7: initial **74,66 kB**, mapa **44,27 kB**, sesja **72,86 kB**; osobny CSS mapy **6,36 kB gzip**. Nie narzucono arbitralnego budżetu. Manifest buildu i test sprawdzają, że mapa jest dynamicznym wejściem i nie należy do statycznych zależności initial JS.

Testy obejmują Haversine, promień i granicę, dokładność, błędy i zgodę, ręczny fallback, potwierdzenie po pomiarze, brak GPS w zdarzeniu, odblokowania mapy, kontrakt scen i lazy build. Istniejąca macierz **1080 dróg** nadal dowodzi przejścia Gry + Ink bez GPS. Testy browser API są symulowane, nie testują fizycznego odbiornika.

Rekonesans i urządzenia: **NIETESTOWANE**. Sprawdzić bezpieczne dojścia i postoje (szczególnie Hansken), widoczność detalu, punkt przy Kościele bez wymogu wejścia, otoczenie Baszty, faktyczną dokładność GPS i promienie, odmowę/timeout na Android/iOS, słabszy telefon, czytnik ekranu oraz tempo spaceru. Dopiero przeprowadzona wizyta uzasadnia datę weryfikacji terenowej.

Weryfikacja lokalna 2026-10-02: build, typecheck, lint, test i diff-check PASS; **155 testów** (6 smoke, 21 narracji, 67 silnika, 21 treści, 40 aplikacji). Przeglądarka: mapa rynku, odblokowanie Hansken bez markerów Kościoła/Baszty, ręczne potwierdzenie i powrót do Opowieści PASS. Podkład i atrybucja OSM sprawdzone lokalnie; brak gwarancji dostępności kafelków w terenie.
