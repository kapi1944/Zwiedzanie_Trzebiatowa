# Zasady rozwoju

- Przed każdą zmianą wykonaj audyt repozytorium: katalog roboczy, status, historia, remotes, branche i struktura. Nie zakładaj stanu na podstawie promptu.
- Przy nieczystym working tree opisz istniejące zmiany i oceń możliwość kontynuacji. Nie nadpisuj cudzej pracy.
- Nie pracuj bezpośrednio na main. Używaj brancha odpowiadającego zatwierdzonemu etapowi.
- Przed i po większym etapie wykonuj testy odpowiednie do zakresu. Dla etapu dokumentacyjnego sprawdzaj kompletność, spójność i diff; brak aplikacji nie uzasadnia instalowania narzędzi testowych.
- Twórz małe commity obejmujące wyłącznie zadanie. Przed commitem sprawdź status oraz pełny diff i dodawaj jawnie wskazane pliki.
- Nie używaj push --force.
- Nie rozszerzaj automatycznie zakresu. Nie implementuj kolejnego etapu bez zgody użytkownika.
- Wszystkie nazwy funkcji, zmiennych, komponentów i komentarze zapisuj po polsku. Nazwy technologii i uzgodnionych kontraktów dokumentacyjnych zachowuj zgodnie z ustaleniami.
- Kod ma być minimalny, lokalny i czytelny. Modyfikuj możliwie najmniej plików, bez nieużywanych funkcji i kodu na przyszłość.
- Nie dodawaj API, integracji, automatyzacji ani AI bez wyraźnego polecenia.
- Każdy moduł działa niezależnie. Lokalne wzorce nie wymuszają zmian innych modułów. Globalne abstrakcje wymagają zgody.
- Kontrolowana analiza architektury jest dopuszczalna na polecenie użytkownika lub przy potrzebie konsolidacji. Pozwala na analizę redundancji i lekkie zmiany poprawiające spójność, bez pełnej przebudowy i refactoru dla porządku.
- PROVISIONAL nie przechodzi w ACCEPTED bez bezpośredniego zatwierdzenia przez użytkownika. Zmiany decyzji odnotowuj w Decision Log, zachowując ich historię.

Etap 0 obejmuje wyłącznie dokumentację. Nie instaluj zależności npm ani nie twórz Reacta, Next.js, Ink, Quest Engine, mapy, GPS, PWA, audio, backendu, baz danych czy płatności.
