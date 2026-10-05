# Motywy UI — fundament kroniki

System motywów: `aplikacje/gra/src/motyw.ts` (odczyt, zastosowanie i zapis),
`motywy.css` (dwie palety tokenów), `style.css` (wspólna oprawa).
`index.html` ustawia `html[data-theme]` przed pierwszym renderowaniem.
Test sprawdza zgodność tego skryptu z odczytem w React.

Wybór LIGHT/DARK zapisuje się offline w localStorage pod kluczem
`trzebiatow.motyw.v1`. Bez poprawnego zapisu obowiązuje prefers-color-scheme
odczytane przy uruchomieniu; brak matchMedia oznacza LIGHT. Nie ma trybu
SYSTEM reagującego na późniejsze zmiany systemu. Brak dostępu do pamięci
nie blokuje gry; po zmianie motywu ustawienia pokazują informację o braku zapisu.

Ustawienia zawierają sekcję Wygląd gry. Nagłówek ma dyskretny przełącznik.
Wspólne powierzchnie, typografia, ramki, nawigacja, przyciski, formularze
oraz karta celu obejmują wszystkie istniejące ekrany. Ramka i kontrolki mapy
korzystają z tokenów; istniejący rysunek kartograficzny i mechanika pozostają.
Checkboxy audio zachowują semantykę, etykiety i obsługę klawiatury.
Przejścia respektują EKO, ograniczenie ruchu i prefers-reduced-motion.

Finalne ilustracje, tekstury, ikony i muzyka pozostają na późniejszy etap.
Istniejące techniczne dźwięki oznaczono jako Materiał tymczasowy.
Nie dodano zależności, fontów sieciowych ani nowych assetów dekoracyjnych.

## Budżet CSS

Nowe palety i oprawa podnoszą początkowy CSS do około 2,8 kB gzip.
W teście fundamentu wyłącznie baza CSS została zaktualizowana do zmierzonego
2823 B (próg z dotychczasową tolerancją: 3759 B).
Pozostałe budżety i kontrola leniwego ładowania mapy, sesji oraz audio pozostają.
Stara tabela w wydajnosc-i-eko.md dokumentuje historyczny pomiar Etapu 9.

## Weryfikacja

Testy motyw.test.tsx: systemowy fallback, walidacja zapisu, niedostępna pamięć,
ustawienia i nagłówek, root, odtworzenie po montowaniu, niezależność audio/EKO,
inicjalizacja motywu w head.
Test E2E motywy.spec.ts: 360/390/768/1280 px, oba motywy, siedem ekranów,
mapa, odtworzenie po reload, offline PWA, ograniczenie ruchu oraz kontrast,
etykiety i nazwy przycisków (axe).
Ocena fizycznego telefonu i odsłuch pozostają weryfikacją urządzenia.

## Domknięcie techniczne — 2026-10-05

Lint repo korzysta z Biome. Dwa błędy skryptu podmiany tekstów dotyczyły
kolejności importów oraz formatowania. Bezpieczna poprawka formattera i
organizacji importów została porównana z wejściem: żadnych zmian poza nimi,
bez uruchamiania skryptu i bez zmiany jego tekstów czy funkcjonalności.

Log diagnostyczny Playwright potwierdził zamknięcie Chromium z kodem 0,
a następnie zatrzymanie na Terminating the WebServer. Zainstalowany Playwright
na Windows uruchamiał serwer przez shell i kończył drzewo procesów przez taskkill,
po czym czekał na close procesu. Ten etap nie kończył się w tym środowisku.

Konfiguracja korzysta teraz z globalSetup i istniejącego API Vite preview.
Serwer działa w procesie testowym, a zwracany teardown czeka na httpServer.close.
Pozostaje ten sam port, host, strictPort i build gry, bez watch mode,
reutilizacji obcego serwera, zmian testu motywów, nowych zależności ani process.exit.
Nie modyfikowano UI, mechaniki ani wcześniejszych prac.

Źródła API: [Vite preview](https://vite.dev/guide/api-javascript#preview),
[Playwright global setup/teardown](https://playwright.dev/docs/test-global-setup-teardown).

| Weryfikacja | Wynik |
| --- | --- |
| npm run lint | PASS, 114 plików |
| npm run typecheck | PASS |
| npm run test (zawiera pełny build) | PASS, 279 testów |
| npm run build (wywołany przez npm run test) | PASS |
| npm run test:e2e -- testy/e2e/motywy.spec.ts --reporter=line | PASS, 1 test, 13,6 s, samodzielny exit 0 |
| Zamknięcie serwera po E2E | PASS, port 4173 wolny |
| git diff --check | PASS |

Po zmianie uruchamiania serwera dwie próby E2E zakończyły się samodzielnie
(11,3 s i 12,5 s). Ostatnia próba po końcowej poprawce typów: 13,6 s,
exit 0 i brak serwera na porcie 4173. Fizyczny telefon nie był przedmiotem tej naprawy.

## Przynależność zmian

A. Etap motywów (z poprzedniego zadania):

- aplikacje/gra/index.html
- aplikacje/gra/src/Aplikacja.tsx
- aplikacje/gra/src/motyw.ts
- aplikacje/gra/src/motywy.css
- aplikacje/gra/src/style.css
- aplikacje/gra/src/PotwierdzenieObecnosci.tsx
- aplikacje/gra/src/mapa/pergamin.css
- aplikacje/gra/testy/motyw.test.tsx
- testy/e2e/motywy.spec.ts
- testy/fundament.test.mjs
- dokumentacja/motywy-ui.md

Aplikacja.tsx oraz style.css zawierają także wcześniejsze zmiany Kroniki/kampanii.
Nie należy dodawać całych tych plików. W style.css wcześniejsza sekcja filtrów
Kroniki została wcześniej objęta tokenami; wymaga osobnej kontroli hunków.

B. Naprawa lint/E2E:

- playwright.config.ts
- testy/e2e/serwer-podgladu.ts
- zastap_teksty_trzebiatow_v2.mjs

Dokumentacja motywy-ui.md została zaktualizowana o obecny wynik i ten podział.
Skrypt zastap_teksty_trzebiatow_v2.mjs jest nadal untracked: jego pełna treść
pochodzi z wcześniejszej pracy użytkownika. Nie da się dodać tylko poprawki lint
jako odrębnego diffu względem HEAD bez włączenia całego wcześniejszego skryptu.
Dlatego poniższe polecenia celowo go nie dodają.

C. Wcześniejsze / niezwiązane pliki (status dokładny):

```text
 M README.md
 M aplikacje/gra/src/sesja-gry.ts
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
 M testy/e2e/kampania.spec.ts
 M testy/kampania.test.ts
 M tresc/kampania/bank-miejsc.json
 M tresc/kampania/kampania.ink
 M tresc/kampania/kampania.json
?? "IIW\305\232/"
?? PROMO/
?? Tajemnice_Trzebiatowa_Encyklopedia_100str_MAPA_PIERWSZA_v0.7.pdf
?? Tajemnice_Trzebiatowa_Encyklopedia_100str_gotyk_realne_zdjecia_v0.6.pdf
?? Trzebiatow_Encyklopedia_miejsc_i_bank_zadan_v0.1.pdf
?? Trzebiatow_Encyklopedia_pergamin_i_mapa_gracza_v0.2.pdf
?? aplikacje/gra/src/WidokKroniki.tsx
?? aplikacje/gra/src/kronika.ts
?? aplikacje/gra/testy/kronika.test.tsx
?? aplikacje/gra/testy/watki.test.tsx
?? dokumentacja/bank-zadan-terenowych.md
?? dokumentacja/kronika.md
?? dokumentacja/rejestr-lokalizacji.md
?? dokumentacja/siec-narracyjna.md
?? dokumentacja/zrodla-contentu.md
?? narzedzia/reguly-zakonczen.ts
?? narzedzia/siec-narracyjna.ts
?? pakiety/silnik-gry/src/wyprawa.ts
?? tresc/kampania/siec-narracyjna.json
```

## Pełny git status --short

```text
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
?? "IIW\305\232/"
?? PROMO/
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
?? dokumentacja/zrodla-contentu.md
?? narzedzia/reguly-zakonczen.ts
?? narzedzia/siec-narracyjna.ts
?? pakiety/silnik-gry/src/wyprawa.ts
?? testy/e2e/motywy.spec.ts
?? testy/e2e/serwer-podgladu.ts
?? tresc/kampania/siec-narracyjna.json
?? zastap_teksty_trzebiatow_v2.mjs
```

Indeks pozostał pusty. Nie wykonano git add, commita ani push.

## Polecenia dodające wyłącznie jednoznaczne pliki etapu

```powershell
git add -- playwright.config.ts testy/e2e/serwer-podgladu.ts
git add -- aplikacje/gra/index.html aplikacje/gra/src/PotwierdzenieObecnosci.tsx aplikacje/gra/src/mapa/pergamin.css aplikacje/gra/src/motyw.ts aplikacje/gra/src/motywy.css aplikacje/gra/testy/motyw.test.tsx testy/e2e/motywy.spec.ts testy/fundament.test.mjs dokumentacja/motywy-ui.md
```

To nie jest jeszcze kompletny commit motywów. Wspólne pliki wymagają wybrania
wyłącznie hunków motywów, z pominięciem kampanii/Kroniki; przy hunkach mieszanych
należy użyć split/edit i sprawdzić staged diff:

```powershell
git add -p -- aplikacje/gra/src/Aplikacja.tsx aplikacje/gra/src/style.css
git diff --cached
```
