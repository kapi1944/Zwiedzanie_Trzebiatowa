# Zapis gry, PWA i offline — Etap 8

Gra zapisuje postęp lokalnie po zakończonej akcji i pozwala wznowić sesję po odświeżeniu lub ponownym uruchomieniu. Nie ma kont, backendu, cloud sync, płatności, DRM, audio, EKO ani pakietów offline OSM. Etap 9 nie jest rozpoczęty.

## Biblioteki i zgodność

Zweryfikowano 2026-10-02 w npm i oficjalnych repozytoriach:

| Biblioteka | Stabilna wersja używana | Licencja | Zgodność / utrzymanie |
| --- | --- | --- | --- |
| [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa/releases) | 1.3.0 | MIT | Peer Vite 3–8; aktualne wydania projektu Vite PWA. Repo używa Vite 8.3.2. |
| [idb](https://github.com/jakearchibald/idb) | 8.0.3 | ISC | Mała warstwa Promise nad IndexedDB; typy TS i moduły ESM, bez frameworka. Dojrzały projekt, rzadsze wydania; współczesne przeglądarki. |
| [Workbox](https://github.com/GoogleChrome/workbox/releases) | 7.4.1 | MIT | `workbox-build` i `workbox-window` rzeczywiście rozwiązane do 7.4.1; Node >=20, tutaj 24.16.0. |

`fake-indexeddb` jest wyłącznie zależnością testową. Zod 4.6.5 waliduje zapis, w wersji już używanej w repo. Deklaracje zewnętrzne pluginu/Workbox mają brakujące opcjonalne typy assets-generator i konflikt z `exactOptionalPropertyTypes`; lokalny `aplikacje/gra/tsconfig.json` stosuje `skipLibCheck`. Własny kod i testy nadal podlegają strict, noUnused i typecheck; ustawienia pozostałych pakietów nie zmieniły się. Build PWA z Vite 8 jest sprawdzany rzeczywistym generowaniem artefaktów.

## Format ZapisGry

`zapis-gry.ts` definiuje jawny, ścisły schemat i typ `ZapisGry`:

| Pole | Znaczenie |
| --- | --- |
| wersjaFormatuZapisu | dokładnie 1, wersja aplikacyjnej koperty |
| idGry, wersjaGry, wersjaTresci, wersjaSchematZapisu | przypięta tożsamość kampanii; schemat stanu dokładnie 1 |
| idSesji | UUID z prefiksem `sesja_`, wygenerowany przy nowej grze; zachowany przy restore |
| idPakietu | SHA-256 definicji i skompilowanej narracji |
| hashNarracji | SHA-256 skompilowanej narracji |
| stanGry | pełny StanGry, włącznie z kanonicznym dziennikiem |
| stanNarracji | serializowany stan Ink, aktualna ramka i komunikaty |
| zapisanoDnia | ISO UTC, czas wykonania snapshotu |

Ramka zachowuje już wyświetlone akapity, tagi i opcje. Ink jest zatrzymany przy wyborze lub zakończeniu, więc ponowne wywołanie Continue nie odtworzyłoby przeczytanego tekstu. Profil zakończenia wyliczamy ponownie z przywróconego StanGry; nie zapisujemy drugiej niezależnej kopii profilu.

W `ZapisGry` nie ma skompilowanego JSON Ink. Osobny `PakietOffline` zawiera definicje i narrację tylko raz, pod kluczem SHA-256. To lokalna kopia przypiętych zasobów treści, potrzebna także po aktualizacji app-shell. Build treści generuje ignorowany `tozsamosc.json`; hashe nie obejmują losowego runtime stanu Ink. Web Crypto sprawdza hashe pakietu przed odczytem i zapisem.

API Silnika Narracji zachowuje dawny export/restore v1 dla dotychczasowych odbiorców i testów. Aplikacja podaje hash i używa kompaktowej koperty v2 `{wersja, hashNarracji, stanInk}` bez `tresc`. Przy export aktualny kontekst Mostu jest synchronizowany do Ink. LoadJson najpierw działa na nowej historii, więc błąd nie podmienia poprawnej sesji.

## Restore i wersjonowanie

`SesjaGry.eksportujZapis()` tworzy odłączony snapshot. `SesjaGry.przywroc()` sprawdza schemat, tożsamość, replay całego dziennika przez Silnik Gry i zgodność replayu ze StanGry. Odtwarza profil, Most, stan Ink, ramkę i komunikaty. Opcje przywróconego Ink muszą odpowiadać zapisanej ramce, a narracja musi być zatrzymana. Wznowienie nie dopisuje ponownie nagród, wyborów ani zdarzenia startu.

`ocenZgodnoscZapisu()` rozróżnia:

- `ZGODNY`: format 1, schemat 1, identyczne wersje i hashe przypiętego pakietu; v1 → v1 to walidacja bez zmiany danych.
- `WYMAGA_MIGRACJI`: inny format, schemat, wersja gry lub treści. Nie ma automatycznej migracji pomiędzy takimi wersjami.
- `NIEZGODNY`: obca gra, uszkodzony schemat, inna tożsamość lub hash.

Magazyn odczytuje pakiet wskazany przez zapis, zamiast podmieniać go aktualną treścią aplikacji. Nowszy shell może wznowić starszą kampanię, jeśli nadal obsługuje jej format i kontrakty. Nieobsługiwana wersja, brak pakietu lub uszkodzenie zatrzymują wznowienie i nie nadpisują danych nową grą. Nie ma przycisku kasowania/rozpoczynania od nowa ani migracji „w ciemno”. Zachowanie starszych kontraktów trzeba sprawdzać przy przyszłych zmianach silników.

## IndexedDB i atomowość

`MagazynZapisu` jest warstwą aplikacyjną oddzieloną od Reacta i Silnika Gry. Baza `zwiedzanie-trzebiatowa` v1 ma dwa store'y: `zapisy` (jeden klucz `aktywna`) i `pakiety` (klucz SHA-256). Nie używamy localStorage. Pakiet i zapis trafiają do jednej transakcji readwrite, z żądaniem durability `strict`; powodzenie jest ogłaszane dopiero po `transaction.done`.

Silnik nadal tylko emituje `ZAPISZ_STAN`. Sesja oznacza potrzebę zapisu po tym efekcie. Aplikacja wykonuje IO po całej akcji: zmianach mechaniki, przejściu Ink, odczycie ramki i ewentualnym rozpoczęciu zagadki. Nie utrwala stanów pośrednich pomiędzy tymi krokami. Zapisane pary Gry i Ink są walidowane przed transakcją.

Magazyn odłącza snapshot przed kolejką i wykonuje zapisy kolejno, także po odrzuceniu błędnej próby. Transakcja porównuje przypięty pakiet, id sesji i prefiks dziennika; starszy zapis lub rozbieżne działania innej karty nie mogą cofnąć postępu. Ten sam pakiet jest dodawany tylko przy pierwszym zapisie. Po konflikcie należy odświeżyć i wznowić zachowany postęp.

Podczas IO interfejs gry jest nieaktywny i ogłasza „Zapisuję postęp…”. Błąd quota/IDB daje status oraz „Ponów zapis”, zachowując poprzedni zapis i bieżącą sesję w pamięci. Nie należy wtedy zamykać ani aktualizować aplikacji. Przerwanie procesu w trakcie transakcji może zachować poprzedni ukończony zapis, ale nie połowę pary Gry/Ink. Nie obiecujemy utrwalenia ostatniego kliknięcia przed końcem transakcji; przed zamknięciem poczekaj na „Postęp zapisany na tym urządzeniu”.

## PWA, cache i mapa

`vite-plugin-pwa` używa `generateSW` Workbox. Nie napisano własnego SW. Manifest ma polską nazwę i język, start `/`, zakres `/`, standalone oraz kolory projektu. Własne techniczne ikony PNG 192/512 przedstawiają kartę Kroniki, bez cudzych logotypów.

Precache obejmuje lokalne HTML, JS, CSS i ikony, także dynamiczne chunki mapy i sesji z treścią. Mapa nadal jest lazy dla wykonania JS, choć plik jest pobierany do cache podczas instalacji SW. Navigacje używają lokalnego `index.html`. Brak runtime caching zewnętrznych adresów, kafelków OSM, masowego pobierania i offline tile packa.

Po poprawnym ukończeniu pierwszej instalacji SW aplikacja może wystartować bez serwera. Sama jednorazowa wizyta przed ukończeniem pobrania nie gwarantuje offline. SW wymaga HTTPS lub localhost; `vite dev` nie jest dowodem działania produkcyjnego SW. Sprawdzać build przez `npx vite preview` z katalogu gry.

Mapa bez sieci pokazuje lokalne markery/listę i komunikat o niedostępnym podkładzie. Błąd kafelków zachowuje fallback z Etapu 7. Gra nie potrzebuje mapy ani GPS. Status Online/Offline wynika z `navigator.onLine` i zdarzeń browsera, nie jest testem dostępności konkretnego serwera; może pozostać Online przy awarii hosta.

## Aktualizacja

Tryb `prompt`, `skipWaiting: false`, `clientsClaim: false`; nowy SW czeka. UI pokazuje: „Dostępna jest nowa wersja. Zaktualizuj po zapisaniu postępu.” Dopiero „Zapisz postęp i zaktualizuj” blokuje nowe akcje, czeka na skuteczne IO i wywołuje `updateServiceWorker(true)`. Błąd zapisu blokuje aktualizację; błąd aktualizacji przywraca możliwość działania. Nie ma automatycznego reloadu aktywnej sceny.

Nowy app-shell może usunąć przestarzałe cache Workbox, lecz nie usuwa przypiętego pakietu w IndexedDB. Na tym etapie nie ma garbage collection dawnych pakietów ani synchronizacji między urządzeniami. Aktualizację warto wykonywać z jedną otwartą kartą gry; inne karty mogą korzystać ze wspólnego SW, a rozbieżne zapisy są odrzucane.

## Test ręczny: refresh i offline

Wykonać na produkcyjnym buildzie w tym samym profilu i originie (protokół, host, port). Nie zaznaczać „Update on reload” ani „Bypass for network” w DevTools.

| Krok | Akcja | Oczekiwany wynik |
| --- | --- | --- |
| 1 | Uruchom grę online, poczekaj na gotowość offline w pierwszej instalacji SW. | SW aktywny, lokalne zasoby w Cache Storage. |
| 2 | Wybierz drogę z rynku, użyj podpowiedzi, zapisz obserwację Hansken. Poczekaj na status zapisu. | Scena, wynik i opcje zachowane. |
| 3 | Refresh. | Ekran startowy z „Wznów opowieść”. |
| 4 | Wznów sesję. | Ten sam tekst, wynik Hansken, podpowiedź, przedmiot i dalsze opcje. |
| 5 | DevTools → Network → Offline. | Subtelny status Offline, opowieść pozostaje dostępna. |
| 6 | Kontynuuj do Kościoła, otwórz scenkę, opcjonalnie mapę. | Treść i lazy mapa działają; podkład niedostępny, markery/lista dostępne; zapis lokalny udany. |
| 7 | Zamknij kartę po potwierdzeniu zapisu. | Dane pozostają w IndexedDB. |
| 8 | Otwórz ponownie ten sam adres offline. Jeśli DevTools Offline był przypięty do karty, włącz tryb offline również w nowej karcie. | App-shell uruchamia się z SW. |
| 9 | Wznów. | Kontynuacja tej samej sceny i postępu. |

Wynik zapisać jako PASS / FAIL / NIETESTOWANE, z przeglądarką, urządzeniem, miejscem przerwania i komunikatem błędu. Dodatkowo: kontrolowany nowy build powinien pokazać prompt, bez reloadu do kliknięcia; po aktualizacji starszy zapis ma korzystać z przypiętego pakietu.

## Weryfikacja i ograniczenia

Testy Node używają fake-indexeddb do prawdziwego adaptera idb: snapshot, restore nowej instancji, wynik, scenka, profil, hashe, wersje, uszkodzenie, kolejka i konflikt kart. Testy UI sprawdzają wznowienie, błąd IO, ponowienie, status sieci i kolejność zapis → update. Test SW bada rzeczywiste artefakty buildu, manifest, pliki precache i brak tiles; nie udaje SW przez mock jsdom.

Pełna bramka: build, typecheck, lint i 175 testów PASS; pipeline treści sprawdza również 1080 dróg. Główne JS gzip: 107,77 kB; lazy mapa: 44,41 kB; sesja: 45,42 kB; Workbox Window: 2,20 kB. Precache: 12 wpisów, 694,15 KiB. Leaflet nadal nie trafia do initial bundle.

W przeglądarce Codex (Chromium) produkcyjny build na localhost przeszedł: zapis wyboru/podpowiedzi/wyniku Hansken → refresh → wznowienie. Po wyłączeniu lokalnego serwera i zamknięciu karty nowa karta wystartowała z cache i wznowiła grę; dalszy wybór doprowadził do Kościoła i został zapisany, a lazy mapa pokazała lokalne markery. Następny build wywołał prompt aktualizacji; scena pozostała aktywna do kliknięcia, po aktualizacji wznowiono ten sam Kościół z zachowaną konsekwencją podpowiedzi. To test niedostępnego serwera, nie wyłączenia interfejsu sieciowego; DevTools Offline i instalacja PWA na fizycznym Android/iOS pozostają **NIETESTOWANE**.

IndexedDB/cache są zależne od originu i polityki przeglądarki. Czyszczenie danych, tryb prywatny, brak miejsca lub usunięcie danych przez system mogą je utracić. Nie ma backupu poza urządzeniem ani gwarancji przeżycia usunięcia danych witryny. Aktualizacja kontraktów zapisu w przyszłości wymaga jawnej migracji i zachowania zgodności pakietów.
