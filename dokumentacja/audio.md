# Etap 10 — audio i atmosfera

Bramka Etapu 9 (`9b9eb01`, `feat/etapy-7-11`): czysty Git, build, typecheck,
lint i wszystkie 195 testów PASS. Etap 11 nie jest częścią tej zmiany.

## Howler — research z 3 października 2026

Oficjalny rejestr npm (`npm view howler version license dist.unpackedSize`)
potwierdził **2.2.4**, **MIT**, 318465 B rozpakowanego pakietu.
Wersję potwierdza [oficjalny release](https://github.com/goldfire/howler.js/releases/tag/v2.2.4),
a warunki [licencja biblioteki](https://github.com/goldfire/howler.js/blob/v2.2.4/LICENSE.md).
Zachowano tekst licencji w publikowanym `licencja-howler.txt`.

Pomiar lokalnych plików npm, Node gzipSync (poziom 6):

| Wariant | Surowe bajty | Gzip |
| --- | ---: | ---: |
| howler.core.min.js | 26924 | 7937 |
| howler.min.js, Core + spatial | 36173 | 9722 |
| domyślne howler.js | 107970 | 22570 |

Wybrano import `howler/dist/howler.core.min.js`: obsługuje play/pause, pętle,
głośność i fade. Spatial nie jest potrzebny. Pakiet ma CommonJS/UMD jako main,
bez modułu ESM i deklaracji sideEffects; nie polegamy na tree-shakingu importu
`howler`. Mniejszy build Core jest wybierany jawnie.
[Dokumentacja producenta](https://github.com/goldfire/howler.js#documentation)
opisuje Web Audio z fallbackiem HTML5 Audio, mobile unlock oraz autoSuspend.
Wsparcie biblioteki nie zastępuje testu konkretnego Androida/iOS.

## Przepływ i nastroje

Silnik Gry nadal zwraca deklaratywne efekty; dla audio są to wyłącznie
`ODTWORZ_DZWIEK` i `USTAW_NASTROJ_MUZYKI`. Nie importuje Howlera.

Ink → parser Silnika Narracji → bezpieczne tagi → SesjaGry → warstwa aplikacji
→ MenedzerAudio → adapter Howler Core. `MenedzerAudio` nie zna scen, Ink ani Reacta.
Fabryka odtwarzaczy pozwala testować go bez urządzenia audio.

Allowlista tagów:

- `dzwiek`: przejscie, przewrocenie_kartki, subtelny_metal, atmosfera.
- `nastroj`: cisza, tajemnica, rynek, sacrum, napiecie, final.

Content mapuje sceny na nastroje w `narracja/glowna.ink`. Parser odrzuca URL,
ścieżki, kod oraz wartości spoza allowlisty. Menedżer ponownie sprawdza własne
klucze katalogu assetów, bez eval, dynamicznych ścieżek z treści ani wykonania kodu.
`cisza` zatrzymuje muzykę bez pobierania pliku. `SesjaGry` zbiera tagi wszystkich
akapitów ramki, nie tylko ostatniego. Jednorazowa kolejka efektów nie jest
zapisywana w save ani odtwarzana ponownie przy zmianie widoku. Po wznowieniu
przywracany jest jedynie nastrój z ramki. Tekst, wybory, zagadki i zakończenia
nie zależą od powodzenia odtwarzania.

## Gest, ustawienia i błędy

Domyślnie Dźwięk i Muzyka są OFF, ponieważ używamy technicznych placeholderów.
Dźwięk steruje efektami, Muzyka osobno tłem. Dostępne są dwa suwaki głośności
oraz „Wycisz wszystko”. Ustawienia przechowuje osobny klucz localStorage
`trzebiatow.audio.v1`; uszkodzenie lub brak pamięci nie blokuje gry.

Import modułu audio może nastąpić dopiero przy „Rozpocznij/Wznów opowieść”
z włączonym kanałem lub jawnej interakcji z ustawieniami audio. Samo otwarcie
aplikacji, przywrócenie save, zapisane ON i visibilitychange nie inicjalizują audio.
OFF nie importuje modułu nawet po rozpoczęciu gry.

Dynamiczny import może zakończyć się po wygaśnięciu aktywacji użytkownika.
Nie obchodzimy blokady: Howler korzysta ze standardowego odblokowania po gestach,
a „Uruchom audio” pozwala ponowić próbę po załadowaniu modułu. Istniejący adapter
wznawia AudioContext w obsłudze kolejnego gestu. Browser może nadal odmówić;
błąd ładowania/odtwarzania/importu daje informację w Ustawieniach i pozostawia grę
działającą. Nie ponawiamy w nieskończoność ani nie odtwarzamy zaległych efektów.

## Profile, tło i przejścia

W obu profilach `preload: false`, `autoplay: false`, pobranie dopiero przy play.
Pełny: maksymalnie 3 efekty i 1 bieżący track, podczas zmiany nastroju dodatkowo
1 wygaszany track przez 400 ms. Następna zmiana zwalnia poprzedni fade, więc
tracks nie kumulują się. EKO: maksymalnie 1 efekt i 1 track, bez crossfade.
Przełączenie na EKO natychmiast usuwa nadmiar. Efekty są zwalniane po zakończeniu
lub błędzie, track przy wyłączeniu/zmianie; cleanup zamyka wszystkie instancje.

`visibilitychange` pauzuje muzykę, zwalnia efekty i wygaszany track. Powrót
wznawia ten sam identyfikator, bez tworzenia drugiej pętli. Adapter ma osobną
blokadę ponownego play także podczas ładowania, gdy Howler playing() jeszcze
nie potwierdza odtwarzania. Zmiana nastroju w tle nie rozpoczyna pobierania.
Reduced motion jest niezależne; nie oznacza mute ani wyłączenia muzyki.

## Assety i offline

9 własnych WAV-ów, łącznie 261996 B: mono PCM16, 8 kHz, efekty 0,18–0,6 s,
nastroje 3 s. Są to proste tony testowe, nie finalna muzyka ani realistyczne
nagrania miasta/pergaminu/metalu. Wszystkie oznaczone **PLACEHOLDER — DO WYMIANY**.
Skrypt odtwarzania plików: `node narzedzia/generuj-placeholdery-audio.mjs`.
Nie pobrano nagrań z internetu ani nie imitowano utworu lub kompozytora.
Zasady przyszłych assetów: [README zasobów](../tresc/trzebiatow-v1/zasoby/README.md).

Audio JS jest wyłączone z precache; WAV nie należą do globPatterns i nie są
inline'owane w JS. Nie ma offline audio packa ani runtime cache audio w SW.
Pierwsza próba offline może zakończyć się ciszą; shell, treść i mechanika zachowują
offline z Etapu 8. Zwykły cache HTTP browsera nie jest gwarancją audio offline.

## Bundle i weryfikacja

Node gzipSync, domyślny poziom 6, pomiar rzeczywistych artefaktów po root build.
Initial to suma gzip wszystkich statycznych importów wejścia manifestu Vite;
uwzględnia także nowy współdzielony rolldown-runtime.

| Metryka | Przed, Etap 9 | Po, Etap 10 |
| --- | ---: | ---: |
| Initial JS gzip | 107764 B | 108864 B |
| Audio chunk gzip, adapter + Core + menedżer | brak | 9220 B |

Wzrost initial: 1100 B, około 1,02%. Nie zawiera Howlera ani WAV. Istniejące
budżety Etapu 9 pozostają aktywne; test sprawdza również brak audio w initial
grafie oraz brak audio/WAV w precache.

Testy obejmują gest, mute, music/effect off, EKO, zmianę/ciszę nastroju,
crossfade, limity instancji, pauzę/wznowienie, idempotencję adaptera w trakcie
ładowania, nieznane assety i niebezpieczne tagi, błędy importu/fabryki/load/play,
utrwalanie ustawień i kontynuację wyborów po awarii audio. Dotychczasowe testy
1080 dróg mechaniki oraz zgodności Pełny/EKO pozostają aktywne.

Wyniki lokalne: build, typecheck, lint, test i diff check — PASS.
210 testów: 7 fundamentu, 21 narracji, 67 silnika gry, 21 treści, 94 aplikacji.
Nie wykonano odsłuchu ani testu fizycznego urządzenia. Przed wydaniem należy
sprawdzić Android/iOS: pierwszą aktywację, powrót z tła, mute, obie głośności,
EKO, szybkie zmiany nastroju oraz niedostępność pliku/sieci.
Nie dodano finalnej ścieżki, voice-over, syntezy mowy, backendu ani streamingu.
