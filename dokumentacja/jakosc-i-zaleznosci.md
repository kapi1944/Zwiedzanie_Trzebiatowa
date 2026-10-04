# Jakość i zależności — Etap 11

> Historyczny przegląd Etapu 11, bez ponownego audytu zależności. Leaflet pozostaje w manifeście, ale panorama Etapu 12 używa canvas i lokalnej geometrii OSM. [Bieżące bramki](status-projektu.md#bieżąca-weryfikacja) · [Etap 12](etap-12-pelna-kampania.md).

Stan odczytany 2026-10-03 z manifestów, lockfile i lokalnych metadanych npm.
`npm audit`: 0 podatności przed i po dodaniu narzędzi testowych. Pierwsze
wywołanie bez dostępu sieciowego nie dało wyniku; ponowione z dostępem
do registry zakończyło się poprawnie. Nie aktualizowano istniejących wersji.

## Bezpośrednie zewnętrzne zależności runtime

| Zależność | Wersja zainstalowana | Licencja | Użycie |
| --- | --- | --- | --- |
| react, react-dom | 19.3.0 | MIT | UI gry i strony |
| next | 16.3.8 | MIT | Statyczna strona |
| zod | 4.6.5 | MIT | Schematy contentu i zapisów |
| inkjs | 2.4.0 | MIT | Interpreter narracji |
| howler | 2.2.4 | MIT | Adapter audio |
| idb | 8.0.3 | ISC | Adapter IndexedDB |
| leaflet | 1.9.4 | BSD-2-Clause | Adapter mapy |

Pakiety `@zwiedzanie/*` są lokalnymi workspace'ami; nie są zewnętrzną usługą.

## Bezpośrednie zależności developerskie (bez duplikatów workspace)

| Zależność | Wersja | Licencja |
| --- | --- | --- |
| @biomejs/biome | 2.5.15 | MIT OR Apache-2.0 |
| @types/node | 24.19.1 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @types/howler | 2.2.13 | MIT |
| @types/leaflet | 1.9.22 | MIT |
| @vitejs/plugin-react | 6.1.1 | MIT |
| typescript | 7.0.2 | Apache-2.0 |
| vite | 8.3.2 | MIT |
| vite-plugin-pwa | 1.3.0 | MIT |
| vitest | 5.0.3 | MIT |
| jsdom | 30.1.1 | MIT |
| fake-indexeddb | 6.2.5 | Apache-2.0 |
| yaml | 2.9.1 | ISC |
| inkjs | 2.4.0 | MIT |
| @playwright/test | 1.63.0 | Apache-2.0 |
| axe-core | 4.13.0 | MPL-2.0 |

Przed instalacją Playwright i axe-core odczytano wersje, licencje i rozmiary
z registry. Playwright wymaga Node >=20; projekt wymaga >=24.15.0.
Narzędzia są open source, bez abonamentu. Koszt operacyjny: czas CI, transfer
i miejsce Chromium (pobranie Windows: około 311 MiB z headless shell),
axe-core około 3.1 MB po rozpakowaniu. Nie trafiają do runtime gry.
Źródła: [Playwright](https://github.com/microsoft/playwright),
[axe-core](https://github.com/dequelabs/axe-core).

## Bramki i zakres kontroli

`npm run sprawdz`: build → typecheck → lint → test:bez-build. Build wykonywany
raz; `npm run test` zachowuje samodzielny build. E2E wymaga wcześniejszego
builda, następnie `npx playwright install chromium` i `npm run test:e2e`.
CI wykonuje npm ci, sprawdz, diff --check, instaluje Chromium i uruchamia E2E.
Node 24.15.0 i cache z głównym package-lock.json. CI ma wyłącznie odczyt repo.

Silnik Gry importuje tylko lokalne moduły, schematy i typy. Nie używa DOM,
storage, GPS, audio, czasu systemowego ani losowania. Zdarzenia dostarczają
czas. Narracja importuje Ink i typy; nie importuje React ani Silnika Gry.
Zewnętrzne funkcje Ink nie mają fallbacków; istniejące testy sprawdzają
odrzucanie nieobsługiwanych wywołań. Mechanika kanoniczna pozostaje w silniku.
React orkiestruje sesję i adaptery: lokalizacja/Mapa, MagazynZapisu, audio.
Test fundamentu pilnuje zakazanych odwołań i cykli literalnych importów,
reeksportów oraz lazy importów w produkcyjnych źródłach TS/TSX. To lokalna
kontrola statyczna, nie ogólny parser ani dowód dla dynamicznie budowanych ścieżek.

Build analizuje wszystkie zagnieżdżone warunki flag oraz zmiany contentu.
Odczytywane bez ustawiania: błąd realnego pakietu. Ustawiane bez odczytu:
jawne ostrzeżenie (`final_lacznik`, `rozrozniono_warstwy`). Nie blokuje to
celowych fixtures, bo ogólny schemat nie narzuca rejestru flag.

Raport flag bieżącego pakietu:

- Ustawiane: `czytano_kosciol`, `final_kronikarz`, `final_lacznik`,
  `final_straznik`, `hansken_domkniety`, `otwarto_notatke`, `rozrozniono_warstwy`.
- Odczytywane: `czytano_kosciol`, `final_kronikarz`, `final_straznik`,
  `hansken_domkniety`, `otwarto_notatke`.
- Nigdy nieustawiane: brak.
- Nigdy nieczytane: `final_lacznik`, `rozrozniono_warstwy`.

Graf skończonego slice korzysta z tych samych 1080 symulacji. Rejestruje sceny,
lokalizacje, wybrane opcje, odkryte scenki, profile/epilogi, ukończone wymagane
wątki i zagadki z wyjściem do finału. Przerwana droga blokuje build; martwy
element daje identyfikator w błędzie. Walidator nie obsługuje dowolnej przyszłej
kampanii: rozszerzenie contentu wymaga rozszerzenia enumeratora dróg.

Warstwy testów: wszystkie 1080 dróg mechanicznych/Ink; istniejące 1080 porównań
PELNY/EKO; osiem pełnych dróg C w Chromium pokrywających każdą parę wartości
GPS dostępny/niedostępny, online/offline, restore/brak restore, PELNY/EKO,
audio ON/OFF. GPS jest symulowany, audio fizyczne nie jest potwierdzone.
Mapa jest odwiedzana przed offline, aby cache adaptera był przygotowany.
Istniejące testy sprawdzają także brak adaptera i błędy GPS/audio/storage.

Sześć szerokości 320/360/390/412/768/1024: kontrola wszystkich widoków,
przewijania, geometrii kontrolek i trafienia w ich środek. Brak dialogów
w aktualnym UI. axe-core sprawdza WCAG A/AA, kontrast tekstu, role, etykiety,
landmarki i nagłówki; klawiatura sprawdza skip link, wybór Enter i fokus.
Istniejące testy React sprawdzają statusy aria-live. Automat nie zastępuje
TalkBack, większej czcionki systemowej ani rzeczywistego ekranu w słońcu.
