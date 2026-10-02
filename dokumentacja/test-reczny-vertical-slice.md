# Etap 6 — test ręczny grywalnego vertical slice

TEKST ROBOCZY — NIE JEST TO FINALNA WERSJA FABULY.

Wymagane: Node >=24.15 i npm >=11. Z katalogu repozytorium uruchom `npm run dev:gra` i otwórz URL podany przez Vite (domyślnie `http://localhost:5173/`). Polecenie buduje rdzeń, waliduje 1080 dróg, generuje JSON kampanii i uruchamia interfejs. Nie wymaga wcześniejszego ręcznego eksportu Ink.

## Droga C — dostępna również w buildzie produkcyjnym

| Krok | Działanie | Oczekiwany rezultat |
| --- | --- | --- |
| 1 | Otwórz grę. | „Kronika nad Regą”, opis interaktywnej opowieści, informacja o demonstracji. |
| 2 | Przed startem otwórz Kronikę. | Pusta Kronika; brak przyszłych miejsc, przedmiotów i bonusów. |
| 3 | Wróć na Start i wybierz „Rozpocznij opowieść”. | Rynek i Ratusz; trzy wybory. Fokus na nagłówku miejsca. |
| 4 | Wybierz „Najpierw chcę wysłuchać obu stron.” | Hansken, Rynek 26; oznaczenie rekonesansu, brak zgadywanej odpowiedzi. |
| 5 | Wybierz „Pomiń zagadkę i idź dalej”. | Komunikat pominięcia; dwa wybory Ink. Fokus przechodzi do nagłówka wyborów. |
| 6 | Wybierz „Najpierw słucham, jak obraz staje się opowieścią.” | Kościół NMP; tekst pamięta obie perspektywy i brak fragmentu Hansken. Scenka opcjonalna nie jest oferowana. |
| 7 | Wybierz „Zapisuję informację i jej źródło.” | Baszta Kaszana, osobno FAKT i LEGENDA; zagadka źródłowa. |
| 8 | Opcjonalnie wybierz błędnie „Zachowana baszta obronna”. | Czytelny komunikat; nadal można odpowiedzieć lub pominąć. |
| 9 | Wybierz „Pomiń zagadkę i idź dalej”. | Końcowe trzy wybory; brak blokady po nieudanej próbie. |
| 10 | Wybierz „Zachowuję obie wersje i zaznaczam ich różny charakter.” | ŁĄCZNIK, dwa krótkie epilogi, „Podróż zapisana”. Brak bonusu wymagającego fragmentu. |
| 11 | Otwórz Kronikę. | Cztery odwiedzone miejsca; brak fragmentu Hansken, scenki i ukrytego bonusu. |
| 12 | Otwórz Wątki. | Dwa wątki opisane jako „Ukończony”; brak surowych statusów i liczb powinowactw. |
| 13 | Wróć do Opowieści, potem na Start i do Opowieści. | Ten sam finał; zmiana widoku nie rozpoczyna nowej sesji. |

## Drogi A/B — robocza deklaracja obserwacji

Hansken nie ma zatwierdzonej odpowiedzi terenowej. Zaznacz pole deklaracji i wybierz „Zapisz obserwację”. To deklaracja użytkownika; komunikat roboczej treści pozostaje widoczny także w produkcji. Nie jest to zatwierdzenie szczegółu terenowego.

| Droga | Konkretne decyzje | Oczekiwany profil |
| --- | --- | --- |
| A | Dowód w prologu → deklaracja obserwacji bez podpowiedzi → własna notatka → „Zestawiam obie notatki” → powrót → zapis źródła → odpowiedź o misce kaszy → pierwszeństwo śladów. | KRONIKARZ; fragment, scenka, bonus „Dwie warstwy”, dwa epilogi. |
| B | Pamięć w prologu → podpowiedź Hansken → deklaracja obserwacji → słuchanie → pytanie o pamięć Kościoła → podpowiedź Baszty → odpowiedź o misce kaszy → pierwszeństwo opowieści. | STRAŻNIK OPOWIEŚCI; fragment, dwa epilogi, brak bonusu samodzielnego Hansken. |

Przed kolejną drogą odśwież stronę. Zapis pozostaje wyłącznie w pamięci bieżącej sesji; nie ma localStorage, IndexedDB ani produkcyjnego mechanizmu wznowienia.

## Nawigacja, debug i obsługa błędów

Pięć widoków: Start, Opowieść, Kronika, Wątki i O grze. Są lokalnym stanem React, bez React Routera: nie wymagają linkowania osobnych scen, a mechanika pozostaje niezależna od URL. Widoki nie tworzą historii Wstecz/Dalej przeglądarki ani adresów `/gra` czy `/kronika`.

`?debug=1` w DEV pokazuje rozwijaną diagnostykę: scenę, flagi, wyniki, wątki, powinowactwa i ostatnie zdarzenia. Domyślnie ukryta. W buildzie produkcyjnym parametr nie uruchamia diagnostyki. Podczas zmiany źródeł Vite może odświeżyć stronę i wyzerować sesję.

Przy błędzie ładowania, niespójnych definicjach, odrzuconym zdarzeniu lub błędzie renderowania pojawia się „Wystąpił problem z uruchomieniem opowieści.” z możliwością ponownego uruchomienia. Szczegóły są dostępne tylko w DEV. Rozpoczęcie ogłasza ładowanie i blokuje ponowne kliknięcie. Nie należy ręcznie uszkadzać produkcyjnych danych; przypadki błędów weryfikują testy.

## Dostępność i pomiary

- Sprawdź 320 px, 390 px i szeroki ekran: bez poziomego przewijania, czytelne akapity, wszystkie przyciski minimum 44 px.
- Tab i Shift+Tab mają widoczny fokus; Enter/Spacja uruchamiają natywne przyciski. Link „Przejdź do treści” jest dostępny z klawiatury.
- Nagłówki, główna nawigacja, komunikaty statusu i ekran błędu mają semantyczne znaczenie. Bieżący widok wskazują tekst, podkreślenie i `aria-current`, nie sam kolor.
- Ustaw ograniczenie ruchu: nie ma animacji JS, a CSS respektuje `prefers-reduced-motion`.
- Sprawdź czytnik ekranu, powiększenie tekstu i fizyczny telefon; automatyczny smoke nie zastępuje tych prób.

Start ładuje React i UI. Dynamiczny import `sesja-gry` ładuje silniki oraz wygenerowany Pakiet Gry dopiero po rozpoczęciu. Kompilator Ink, YAML, Vitest i jsdom nie wchodzą do przeglądarkowego runtime. Biblioteka DOM dla testów: [jsdom](https://github.com/jsdom/jsdom); interakcje React wykonywane przez [act](https://react.dev/reference/react/act), bez dodatkowej Testing Library.

Build Etapu 5 raportuje główny JS **72,06 kB gzip** i osobny chunk sesji **70,17 kB gzip** (pomiar Vite). Dla porównania shell Etapu 4 miał 68,74 kB gzip. Początkowy przyrost wynosi 3,32 kB; silniki i treść są ładowane na żądanie.

Wynik testu zapisuj jako PASS / FAIL / NIETESTOWANE. Przy FAIL zanotuj krok, widoczną odpowiedź, przeglądarkę i rozmiar ekranu.

| Weryfikacja Etapu 5 | Wynik |
| --- | --- |
| Automatyczne testy React + realne silniki, A/B/C | PASS |
| Przejście C w przeglądarce, również po błędnej odpowiedzi Baszty | PASS |
| Start z Enter i przeniesienie fokusu na scenę | PASS |
| Widoki 320, 390 i 1024 px; brak poziomego przewijania | PASS |
| Produkcyjna droga C, Kronika, Wątki; debug wyłączony (pomiar Etapu 5) | PASS |
| Fizyczny telefon, teren, czytnik ekranu | NIETESTOWANE |

Treść, źródła i rekonesans: [vertical slice Etapu 4](vertical-slice.md). Nie dodano mapy, GPS, audio, PWA, trwałego zapisu ani backendu. Kontrakt Etapu 6: [zagadki i zadania](zagadki-i-zadania.md). Etap 7 nie jest rozpoczęty.

## Dodatkowe próby Etapu 6

- Hansken: sprawdź każdą z pięciu dróg (deklaracja; podpowiedź i deklaracja; pomoc i kontynuacja; pominięcie; świadome zakończenie bez rozstrzygnięcia). Każda otwiera wybory i Kościół; tylko dwie pierwsze przyznają fragment.
- Baszta: zaznacz radio i wyślij odpowiedź. Błędny wybór zwiększa liczbę prób, bez wyniku NIEUDANA. Po trzech błędnych odpowiedziach formularz blokuje następne próby; pomoc nadal umożliwia finał.
- Po uzyskaniu fragmentu lub odwiedzeniu scenki sprawdź oferowane alternatywne zaliczenia Baszty.
- Dwukrotne szybkie wysłanie nie może podwoić liczby prób ani nagrody; formularz znika po wyniku.
- Sprawdź etykiety, legendę, komunikaty statusu oraz radio/checkbox z klawiatury. Czytnik ekranu i teren wymagają osobnego sprawdzenia.
