# Silnik Gry — Etap 3

`@zwiedzanie/silnik-gry` jest kanonicznym, deterministycznym rdzeniem mechaniki. Nie importuje Reacta, Ink, DOM, GPS ani storage. Aplikacje nadal mają ekrany startowe i nie wykonują efektów silnika.

## Kontrakt kroku

`wykonajKrok(definicje, stan, zdarzenie)` zwraca `{ stan, efekty }`. Definicje, stan i zdarzenie są walidowane przez Zod na każdym wejściu; oryginalne obiekty pozostają bez zmian. Błędne dane, niezgodne wersje i niedozwolone przejścia zgłaszają wyjątek. Tylko `ROZPOCZNIJ_GRE` przyjmuje `stan: null`; start istniejącej sesji jest odrzucany.

Zdarzenie zawiera `idZdarzenia` i `czas` (nieujemna liczba całkowita, milisekundy dostarczone przez wywołującego). Start zawiera także `idSesji`. Silnik nie generuje czasu ani losowych identyfikatorów. Powtórzony identyfikator zdarzenia i czas wcześniejszy od ostatniego wpisu są odrzucane. Kolejność zdarzeń jest częścią wejścia; identyczne wejście daje identyczny stan i efekty.

## Zdarzenia

| Zdarzenie | Dane i zachowanie |
| --- | --- |
| `ROZPOCZNIJ_GRE` | `idSesji`; inicjalizacja i scena startowa |
| `WEJDZ_DO_LOKALIZACJI` | `idLokalizacji`; wymaga odblokowania, zapisuje wizytę i scenę |
| `POTWIERDZ_OBECNOSC` | `idLokalizacji`; wymaga wcześniejszej wizyty, bez sprawdzania GPS |
| `ROZPOCZNIJ_ZAGADKE` | `idZagadki`; wymaga wizyty, braku wyniku i aktywnej zagadki; inicjuje zero prób |
| `ZAKONCZ_ZAGADKE` | `idZagadki`, `wynik`; tylko pomoc albo świadome NIEUDANA zgodnie z polityką |
| `POPROS_O_PODPOWIEDZ` | `idZagadki`; kolejna zdefiniowana podpowiedź, zwiększa licznik |
| `POMIN_ZAGADKE` | `idZagadki`; wynik POMINIETA również bez rozpoczętej próby |
| `DOKONAJ_WYBORU` | `idWyboru`; wymaga właściwej sceny i warunku, zapisuje wybór i konsekwencje |
| `AKTYWUJ_WATEK` | `idWatku`; DOSTEPNY → AKTYWNY |
| `ZAKONCZ_WATEK` | `idWatku`; AKTYWNY → UKONCZONY |
| `POMIN_WATEK` | `idWatku`; opcjonalny i niewymagany do finału → POMINIETY |
| `DODAJ_PRZEDMIOT`, `USUN_PRZEDMIOT` | `idPrzedmiotu`; tylko przedmiot z definicji |
| `OTWORZ_SCENKE` | `idScenki`; wymaga warunku, zapisuje odkrycie i pokazuje scenę |
| `WZNOW_GRE` | ponownie deklaruje prezentację aktualnej sceny |

Aktualizacja Etapu 6: wszystkie wyniki są końcowe, a błędna odpowiedź pozostawia zagadkę aktywną bez wyniku. Silnik ocenia WYBOR/TEKST przez UDZIEL_ODPOWIEDZI oraz deklarację OBSERWACJA przez POTWIERDZ_OBSERWACJE. POTRZEBUJE_POMOCY udostępnia pomoc; ZALICZ_ALTERNATYWNIE sprawdza warunek sposobu w definicji. Sukces uwzględnia historię podpowiedzi i pomocy. Konsekwencje stosowane są raz. Pełny kontrakt: [zagadki i zadania](zagadki-i-zadania.md).

## Definicje i efekty

Pakiet Treści waliduje manifest, lokalizacje, wątki, zadania, zagadki, scenki opcjonalne, wybory, zakończenia, źródła historyczne, zasoby i ślady/przedmioty. Sprawdza unikalność identyfikatorów w kolekcjach, źródła i odwołania domenowe. Wymaga dokładnie jednego bezwarunkowego domyślnego zakończenia głównego. Identyfikatory scen są odwołaniami narracyjnymi; Etap 3 nie zawiera rejestru ani walidacji węzłów Ink.

Historyczne elementy zawierają klasyfikację FAKT/TRADYCJA/LEGENDA/SPORNE/FABULARYZOWANE, `idZrodla[]`, `wymagaWeryfikacjiTerenowej` i opcjonalną datę `zweryfikowanoTerenowoDnia`. Klasyfikacje poza FABULARYZOWANE wymagają źródła. Schemat kontroluje format i poprawność daty, ale nie potwierdza przeprowadzenia rekonesansu. Fixture techniczny nie zawiera dat weryfikacji ani twierdzeń historycznych.

Konsekwencje wyboru i każdego z pięciu wyników zagadki mają `zmiany[]` i `efekty[]`. Zmiany ustawiają flagę, przesuwają powinowactwo lub dodają/usuwają przedmiot. Powinowactwa są całkowite, clampowane do -5..5, dla osi dowod/legenda/pamiec/zmiana. Nie są prezentowane użytkownikowi.

Efekty: POKAZ_SCENE, USTAW_KONTEKST_NARRACJI, ODTWORZ_DZWIEK, USTAW_NASTROJ_MUZYKI, ODBLOKUJ_LOKALIZACJE, ODBLOKUJ_WATEK, DODAJ_WPIS_DO_KRONIKI, ZAPISZ_STAN, POKAZ_KOMUNIKAT. Efekty wskazujące zasób lub element zawierają `id`, komunikat zawiera `tekst`. USTAW_KONTEKST_NARRACJI i ZAPISZ_STAN oznaczają użycie zwróconego stanu, bez kopii całego stanu w efekcie. Silnik aktualizuje kanoniczną scenę i odblokowania, ale nie wykonuje IO ani callbacków. Odbiorca wykona deklaracje w przyszłym etapie.

Spełnione warunki odblokowują lokalizacje i wątki po kroku. Odblokowanie jest trwałe; utrata przedmiotu nie zamyka już udostępnionego wątku. Scenka sprawdza warunek przy każdym otwarciu. Zadania grupują zagadki w definicjach; osobny lifecycle zadania nie jest zaimplementowany.

## DSL

`ocenWarunek(warunek, stan)` waliduje warunek i zwraca boolean. Operatory to wszystkie/dowolny/nie oraz flagaJest, wynikZagadkiJest, posiadaPrzedmiot, odwiedzono, stanWatkuJest, powinowactwoCoNajmniej, wybrano, odkrytoScenke. Każdy obiekt ma `rodzaj` i pola odpowiednie dla operatora. Pusta lista wszystkie jest prawdą, pusta dowolny fałszem. Brak flagi oznacza false; brak wyniku/wyboru/odkrycia nie spełnia warunku.

Nie ma eval, Function ani JS z danych. Zod działa z `jitless: true`; nie używamy kompilacji schematów. Zod 4.6.5 (MIT) sprawdzono 2026-10-02 w npm oraz [oficjalnych wydaniach](https://github.com/colinhacks/zod/releases/tag/v4.6.5). [Wymagania Zod](https://zod.dev/) obejmują TypeScript 5.5+ i strict; repo używa TypeScript 7.0.2, strict i Node 24.16.0. Typy Node dostarczają deklarację URL wymaganą przez Zod, bez dodania DOM do bibliotek TypeScript.

## Narracja i weryfikacja

`przygotujKontekstNarracji(stan)` tworzy kopię danych dla Mostu Narracji. Neutralny kontrakt jest w `typy-wspolne`; silniki nie mają wzajemnej zależności runtime. Silnik Gry zależy od Schematów Treści i typów wspólnych; Silnik Narracji od inkjs i typów wspólnych. Build kompiluje pakiety w kolejności zależności.

Ink → Silnik Narracji → Most Narracji transportuje bezpieczny sygnał. Sam sygnał nie jest `ZdarzenieGry` i zostanie odrzucony przez walidację kroku. Odbiorca musi jawnie zdecydować o jego znaczeniu i wysłać zdarzenie domenowe; dopiero Silnik Gry sprawdza legalność i stosuje konsekwencje. Nie ma automatycznego mapowania sygnałów, a Ink nie dostaje referencji do StanGry.

Vitest działa w Node. Testy obejmują mechanikę, walidację schematów, deterministyczność, niemutowalność wejść, replay, zakończenia i rzeczywisty przepływ sygnału z Ink. inkjs i Silnik Narracji są zależnościami wyłącznie testowymi Silnika Gry. Polecenia z katalogu głównego: build, typecheck, lint i test. Nie implementujemy magazynu stanu, migracji, audio, GPS ani flow React.
