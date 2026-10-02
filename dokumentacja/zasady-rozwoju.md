# Zasady rozwoju

- Przed każdą zmianą wykonaj audyt repozytorium: katalog roboczy, status, historia, repozytoria zdalne, gałęzie i struktura. Nie zakładaj stanu na podstawie promptu.
- Przy nieczystym drzewie roboczym opisz istniejące zmiany i oceń możliwość kontynuacji. Nie nadpisuj cudzej pracy.
- Nie pracuj bezpośrednio na main. Używaj brancha odpowiadającego zatwierdzonemu etapowi.
- Przed i po większym etapie wykonuj testy odpowiednie do zakresu. Dla etapu dokumentacyjnego sprawdzaj kompletność, spójność i diff; brak aplikacji nie uzasadnia instalowania narzędzi testowych.
- Twórz małe commity obejmujące wyłącznie zadanie. Przed commitem sprawdź status oraz pełny diff i dodawaj jawnie wskazane pliki.
- Nie używaj push --force.
- Nie rozszerzaj automatycznie zakresu. Nie implementuj kolejnego etapu bez zgody użytkownika.
- Własne pojęcia domenowe, foldery, typy, zdarzenia, statusy, pliki treści, funkcje, zmienne, komponenty i komentarze zapisuj po polsku. W nazwach plików, katalogów, identyfikatorach i symbolach kodu nie używaj polskich znaków; w zwykłej treści dokumentacji stosuj poprawną polszczyznę.
- Zachowuj nazwy technologii i standardowe nazwy ekosystemu: React, TypeScript, Vite, Next.js, Ink, inkjs, Zod, Vitest, Leaflet, IndexedDB, Workbox, Howler, package.json, tsconfig i README.md. Zachowuj również wymagane nazwy właściwości i poleceń narzędzi.
- Raportuj po polsku, stosując sekcje ETAP, ZREALIZOWANO, PLIKI UTWORZONE, PLIKI ZMIENIONE, TESTY, BUILD, TYPECHECK, LINT, OGRANICZENIA, STATUS GIT i GOTOWOSC DO KOLEJNEGO ETAPU. Gotowość oznaczaj jako GOTOWE DO ETAPU X albo WYMAGANE POPRAWKI; format wskazany dla konkretnego zadania ma pierwszeństwo.
- Kod ma być minimalny, lokalny i czytelny. Modyfikuj możliwie najmniej plików, bez nieużywanych funkcji i kodu na przyszłość.
- Nie dodawaj API, integracji, automatyzacji ani AI bez wyraźnego polecenia.
- Każdy moduł działa niezależnie. Lokalne wzorce nie wymuszają zmian innych modułów. Globalne abstrakcje wymagają zgody.
- Kontrolowana analiza architektury jest dopuszczalna na polecenie użytkownika lub przy potrzebie konsolidacji. Pozwala na analizę redundancji i lekkie zmiany poprawiające spójność, bez pełnej przebudowy i refactoru dla porządku.
- TYMCZASOWA nie przechodzi w ZAAKCEPTOWANA bez bezpośredniego zatwierdzenia przez użytkownika. Zmiany decyzji odnotowuj w Rejestrze Decyzji, zachowując ich historię.

Etap 0 obejmuje wyłącznie dokumentację. Nie instaluj zależności npm ani nie twórz Reacta, Next.js, Ink, Silnika Gry, mapy, GPS, PWA, audio, backendu, baz danych czy płatności.

Etap 1 obejmuje npm workspaces, React + TypeScript + Vite dla gry, Next.js + TypeScript dla strony, minimalne pakiety TypeScript i opis przyszłego układu treści. Nie obejmuje mechaniki, Ink, Zod, mapy, GPS, PWA, audio, zapisu, backendu, baz danych ani płatności. Nazwy `app`, `layout.tsx`, `page.tsx`, `children` i `metadata` pozostają wymaganymi nazwami Next.js; własne komponenty i lokalne symbole są polskie.

Z katalogu głównego uruchamiaj `npm run build`, `npm run typecheck`, `npm run lint` i `npm run test`. Testy smoke korzystają z wbudowanego runnera Node.js i najpierw budują artefakty, więc działają również na świeżej instalacji. Formatowanie: `npm run format`. Nie dodawaj równoległego ESLint ani Prettier. Zależności i lockfile instaluj z katalogu głównego; nie twórz osobnych lockfile'ów w workspace'ach.
