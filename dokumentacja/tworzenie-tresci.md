# Tworzenie treści Ink

Etap 2 zawiera tylko historię demonstracyjną `pakiety/silnik-narracji/testy/fixtures/testowa.ink`. Nie jest to scenariusz ani historia Trzebiatowa. Nadal obowiązują [zasady treści](zasady-tresci.md): źródła, klasyfikacja historyczna i rekonesans przed zatwierdzeniem zagadek.

## Narzędzie autora

[Inky](https://github.com/inkle/inky) to edytor twórców Ink z podglądem opowieści i możliwością eksportu JSON. Autor może zainstalować go osobno i otworzyć plik `.ink`. Inky nie jest zależnością runtime ani wymogiem lokalnego builda. Wersję silnika Ink w edytorze należy sprawdzić w jego informacji o wersji; numer Inky nie jest numerem Ink.

W repo kompilujemy przez inkjs 2.4.0. Po zmianie historii uruchom:

```sh
npm run test --workspace=@zwiedzanie/silnik-narracji
```

Testy kompilują fixture w pamięci przez `inkjs/full`. Build Silnika Narracji buduje tylko runtime. Docelowa granica to Pakiet Gry → kompilacja treści → Silnik Narracji; kompilacja treści należy do procesu przygotowania Pakietu Gry. Nie dodajemy teraz produkcyjnego procesu budowania kampanii. Nie edytuj wygenerowanego JSON. Runtime przyjmuje JSON, nie źródło `.ink`. Przed użyciem eksportu Inky sprawdź go z naszą wersją runtime i testami; sam zgodny numer formatu nie zastępuje testu.

## Pisanie Warkocza

1. Otwórz wspólną scenę.
2. Daj dwie sensowne opcje i zapamiętaj lokalny wybór w zmiennej Ink.
3. Pokaż różny tekst dla obu dróg.
4. Skieruj obie drogi do wspólnego węzła.
5. W późniejszej scenie użyj pamięci wcześniejszego wyboru.
6. Pozwól na następne rozgałęzienie bez dublowania całej kampanii.

Demonstracja używa węzłów `start`, `konwergencja` i `pozniejsza_scena` oraz zmiennej `droga`. Każdą drogę trzeba sprawdzić osobno, również po zapisie i przywróceniu stanu.

## Granica narracji i mechaniki

Ink może pamiętać wybór tekstowy, wizytę w scenie i lokalną wiedzę opowieści. Nie przyznaje kanonicznych przedmiotów, nie rozwiązuje zagadek, nie potwierdza GPS i nie ustala mechanicznego zakończenia.

Dane mechaniki zostaną przekazane przez [Most Narracji](silnik-narracji.md). Zmienną przeznaczoną do odczytu z mostu deklaruj z właściwym typem i nie nadpisuj jej w Ink. Potrzebę zmiany mechaniki zgłaszaj tylko dozwolonym sygnałem; odbiorca musi jawnie przesłać zdarzenie domenowe do Silnika Gry, który sprawdzi jego legalność. Nie używaj EXTERNAL ani treści mającej uruchamiać JavaScript.

## Tagi i tekst

Przykład: `Czytasz kartkę. #dzwiek:przewrocenie_kartki #nastroj:tajemnica`.

Dozwolone są wyłącznie wartości wymienione w [specyfikacji silnika](silnik-narracji.md). Audio nie jest jeszcze zaimplementowane. Nie wpisuj ścieżek plików, URL, kodu ani dowolnych poleceń w tagach. Parser odrzuca nierozpoznane wartości prezentacyjne oraz sygnały niespełniające formatu `sygnal:[a-z][a-z0-9_]*`. Runtime i Most Narracji transportują sygnały, a Silnik Gry stosuje konsekwencje dopiero po jawnym zdarzeniu domenowym.

Tekst i etykiety wyborów są zwykłymi tekstami; przyszły interfejs powinien wyświetlać je jako tekst, bez interpretowania HTML. Własne symbole Ink zapisuj po polsku bez polskich znaków, treść dla czytelnika — poprawną polszczyzną.

## Zapis i kontrola zmian

Przywracaj zapis wyłącznie z tą samą skompilowaną historią. Zmiana źródła lub kompilatora może zmienić JSON i unieważnić wcześniejszy zapis. Migracje oraz zapis kanonicznej mechaniki nie należą do Etapu 2.

Przed commitem wykonaj build, typecheck, lint i testy z katalogu głównego. Nie dodawaj prawdziwych zagadek, map, audio, PWA ani pełnej fabuły w ramach fundamentu narracji.
