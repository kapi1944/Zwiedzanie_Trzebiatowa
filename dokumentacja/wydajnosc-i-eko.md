# Etap 9 — wydajność i EKO

Bramka Etapu 8 na `feat/etapy-7-11`, commit `63b3287`: czysty status,
build, typecheck, lint i test PASS. Zakres kończy się na Etapie 9.

## Profile i ustawienia

`MenedzerWydajnosci` jest czystą funkcją aplikacyjną. Techniczne profile:
`AUTOMATYCZNY`, `PELNY`, `EKO`; etykiety: Automatyczny, Pełny, EKO.
Ręczny wybór jest nadrzędny, również przy Save-Data. Automatyczny wybiera Pełny
tylko przy znanych, skończonych wartościach większych niż 4 rdzenie i 4 GB RAM,
bez Save-Data oraz bez `slow-2g`, `2g`, `3g`. Słabe lub niepełne dane oznaczają
EKO. To konserwatywna decyzja prezentacji, nie ocena możliwości uruchomienia gry.
Brak API nie blokuje mechaniki ani ręcznego wyboru.

Ustawienia dostępne z nawigacji także przed rozpoczęciem gry. Są zapisywane w
`localStorage`, klucz `trzebiatow.wydajnosc.v1`, niezależnie od IndexedDB i save.
Uszkodzony zapis ustawień daje wartości domyślne. Brak dostępu do pamięci
pozostawia działające ustawienia w sesji i wyświetla informację o braku utrwalenia.

Ograniczenie ruchu: `SYSTEMOWY`, `OGRANICZONY`, `PELNY`. Systemowe ustawienie
śledzi `prefers-reduced-motion`, także jego zmianę. Możliwe są Pełny z ograniczonym
ruchem i EKO bez preferencji systemowej. EKO upraszcza prezentację niezależnie od
tej preferencji; ruch nie wpływa na heurystykę profilu. Zmiany wskazówek połączenia
są odczytywane, jeśli API udostępnia zdarzenia.

## Zachowanie EKO i granice lazy

- Mapa i Leaflet są importowane dopiero po otwarciu Mapy w rozpoczętej grze.
  JS i CSS mapy są wyłączone z precache we wszystkich profilach, więc instalacja
  PWA nie omija wyboru EKO. Workbox CacheFirst zachowuje je po użyciu,
  maksymalnie 8 wpisów. Pierwsze otwarcie offline wymaga wcześniejszego otwarcia
  online; błąd ładowania pozwala wrócić do Opowieści. Kafelki OSM pozostają
  dobrowolne i nie są automatycznie pobierane ani cache'owane.
- SesjaGry, Ink i pakiet treści pozostają poza początkowym grafem wykonania JS.
  Sesja jest importowana przy rozpoczęciu lub wznowieniu istniejącego zapisu.
  Precache nadal obejmuje sesję i treść, aby zachować grę offline z Etapu 8.
- Brak parallax; EKO usuwa ozdobną linię Regi, wyłącza animacje/przejścia,
  filtry i backdrop blur. Mapa wyłącza animacje zoomu, markerów i zanikania
  zarówno dla EKO, jak i ograniczonego ruchu.
- GPS pozostaje jednorazowy, dobrowolny, bez watchPosition/pollingu.
  EKO dopuszcza pozycję z ostatnich 60 s (`maximumAge`), Pełny żąda świeżej.
  Dokładność i promień celu pozostają takie same. Browser może wykorzystać cache,
  nie gwarantujemy mniejszej liczby pomiarów fizycznych. Potwierdzenie ręczne
  pozostaje dostępne.
- Nie ma playera ani preload audio. Punkt rozszerzenia Etapu 10: istniejące tagi
  narracji `dzwiek` mogą uruchomić dynamiczny import przyszłego adaptera dopiero
  na żądanie użytkownika. Audio nie należy dodawać do globPatterns precache;
  EKO nie powinno wyprzedzająco pobierać dźwięków. Adapter nie jest implementowany.

## Konwencja assetów

Warianty `MALY`, `STANDARDOWY`, `HD`: jeden zasób semantyczny, te same informacje,
różne rozdzielczości/kompresja. `wybierzAsset` przyjmuje mapę URL i profil efektywny:
EKO wybiera MALY, Pełny STANDARDOWY. Brak MALY daje fallback STANDARDOWY.
HD jest zarezerwowane dla świadomego przyszłego żądania, nie domyślnego pobrania.
Nie dodano finalnych zdjęć; funkcja wyboru jest sprawdzana testami. Warianty nigdy
nie mogą usuwać szczegółów potrzebnych do zagadki ani zastępować treści tekstowej.

## Pomiary rzeczywistych buildów

Windows, lokalny Node/npm, ten sam checkout i zależności. Rozmiary w bajtach,
gzip Node `gzipSync` (domyślny poziom 6), sumowane osobno dla każdego pliku.
Initial JS obejmuje rekurencyjny graf importów statycznych manifestu Vite,
bez importów dynamicznych, service workera i jego instalacyjnego precache.
Chunki sesji/mapy podano bez współdzielonego initial JS. CSS również gzip.
Nie należy mieszać tych liczb z zaokrąglonym raportem Vite (inne parametry gzip).

| Metryka | Baza Etapu 8 | Etap 9 | Próg regresji |
| --- | ---: | ---: | ---: |
| Initial JS gzip | 106725 B | 107764 B | 123246 B |
| Chunk sesji gzip | 45122 B | 45121 B | 52403 B |
| Chunk mapy gzip | 44091 B | 44123 B | 51217 B |
| Początkowy CSS gzip | 1491 B | 1546 B | 2227 B |
| CSS mapy gzip | 6371 B | 6371 B | 7839 B |
| Cały build root (czas ścienny) | 16,524 s | 16,513 s | pomiar informacyjny |

Precache według raportu Workbox: 694,15 → 535,13 KiB, 12 → 10 wpisów.
Limity testowe wynikają z bazy: `ceil(baza × 1,15) + 512 B`. Tolerancja 15%
uwzględnia lokalne funkcje i zmiany kompilatora, a 512 B ogranicza kruchość
małych plików CSS. Test liczy cały statyczny graf, więc wykryje również przeniesienie
lazy modułu do wejścia. Osobno sprawdza brak mapy i sesji w tym grafie.
Czas builda nie jest twardym testem ze względu na obciążenie Windows/CI;
pomiar wykonano `Measure-Command { npm.cmd run build }`, bez instalacji zależności.

Powtórzenie pomiarów rozmiaru:

```powershell
npm.cmd run build
node --input-type=module -e 'import {zmierzWydajnosc} from "./narzedzia/zmierz-wydajnosc.mjs"; console.log(zmierzWydajnosc())'
```

## Weryfikacja

Testy obejmują ręczny Pełny/EKO, słabe i brakujące hints, brak navigator,
Save-Data, słabą sieć, niezależny ruch, assety/fallback, maximumAge GPS,
utrwalenie ustawień i ponowne zamontowanie UI, awarię pamięci, lazy graf i precache.
Trzy drogi interfejsu React do mini-finalu wykonują się w obu profilach.
Porównanie wszystkich 1080 dróg sprawdza identyczny stan, kroki i cały
ProfilZakonczenia w Pełny/EKO. Profil prezentacji celowo nie jest parametrem
silnika gry ani narracji; dotychczasowy test 1080 dróg z Ink pozostaje aktywny.

Nie wykonano fizycznego testu starszego Androida/tabletu, FPS ani pomiaru RAM.
Przed wydaniem sprawdzić na słabszym urządzeniu: oba profile, zmianę systemowego
ruchu, Save-Data, wznowienie offline, mapę przed/po zapisaniu jej w cache oraz GPS.
Nie dodano backendu, analityki, cloud sync, pełnej kampanii ani finalnych audio.

Końcowe `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`
i `git diff --check`: PASS. Testy: 7 fundamentu, 21 narracji, 67 silnika gry,
21 treści i 79 aplikacji — łącznie 195. GOTOWE DO ETAPU 10; Etap 10 nie rozpoczęty.
