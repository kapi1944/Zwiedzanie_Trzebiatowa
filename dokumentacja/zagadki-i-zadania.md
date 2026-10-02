# Zagadki i zadania — Etap 6

TEKST ROBOCZY — NIE JEST TO FINALNA WERSJA FABULY.

Zadanie grupuje `idZagadek` w istniejącym Pakiecie Gry. Przebieg i zaliczenie wynikają z wyników jego zagadek; nie dodajemy drugiego magazynu stanu ani osobnego licznika punktów. `WidokZagadki`, `Podpowiedzi` i `InformacjaOWyniku` renderują definicje. Silnik Gry sprawdza odpowiedzi, warunki i konsekwencje; React obsługuje formularz i prezentację.

## Typy

Każda definicja zawiera `typ`, `pytanie`, politykę kontynuacji i konsekwencje wszystkich pięciu wyników.

| Typ | Definicja | Zdarzenie |
| --- | --- | --- |
| WYBOR | `odpowiedzi: [{id, tekst}]`, `poprawneOdpowiedzi: [id]`; co najmniej dwie opcje, jedna lub więcej poprawnych | `UDZIEL_ODPOWIEDZI` z pojedynczym id |
| TEKST | `poprawneOdpowiedzi: [tekst]`, jawne `normalizacja` | `UDZIEL_ODPOWIEDZI` z tekstem |
| OBSERWACJA | `potwierdzenie`; deklaracja użytkownika | `POTWIERDZ_OBSERWACJE` |

WYBOR akceptuje każdą opcję z listy poprawnych; nie wymaga zaznaczenia kilku naraz. Schemat odrzuca duplikaty opcji i odpowiedzi wskazujące nieistniejące id. TEKST stosuje Unicode NFC, a następnie zadeklarowane `trim`, `ignorujWielkoscLiter` (lokalizacja pl-PL) oraz `usunPolskieZnaki`. Wszystkie trzy flagi są wymagane. Usuwanie polskich znaków obejmuje ł/Ł. Warianty wpisuje autor w listę; schemat odrzuca puste i zduplikowane odpowiedzi po normalizacji. Nie ma fuzzy matching ani wysyłania odpowiedzi do serwera.

OBSERWACJA wymaga świadomego zaznaczenia pola i wysłania formularza. Potwierdzenie nie dowodzi obecności w terenie ani rozpoznania detalu. Nie używa GPS, aparatu ani zewnętrznych usług. Renderer i uniwersalny silnik nie rozgałęziają się po id Hansken.

## Próby, podpowiedzi i pomoc

Rozpoczęcie zapisuje zero prób. `liczbaProb` rośnie przy przyjętej odpowiedzi lub potwierdzeniu obserwacji. Błędna odpowiedź zapisuje próbę, `ostatniaOdpowiedzPoprawna: false` i komunikat; pozostawia zagadkę aktywną, bez wyniku końcowego i nagrody. Nieznane id opcji lub nielegalne zdarzenie są odrzucane bez zmiany stanu i dziennika.

Brak `limitProb` oznacza dowolną liczbę prób. Limit 1–100 blokuje następne odpowiedzi po jego osiągnięciu, lecz nie kończy automatycznie zadania. Schemat wymaga wtedy bezwarunkowego wyjścia: pominięcia, świadomego nierozstrzygnięcia lub pomocy pozwalającej zaliczyć. Warunkowa alternatywa sama nie spełnia tego zabezpieczenia.

`POPROS_O_PODPOWIEDZ` odsłania kolejny tekst z `podpowiedzi[]`, zapisuje `liczbaPodpowiedzi` i `uzytePodpowiedzi`. Po ostatnim tekście przycisk jest wyłączony, a silnik odrzuca kolejne żądanie. Podpowiedzi Hansken i Baszty stopniowo zawężają wskazówkę.

`POTRZEBUJE_POMOCY` zapisuje `potrzebujePomocy: true` i pokazuje mocną wskazówkę `pomoc.tekst`. Gdy `pozwalaZaliczyc: true`, dostępne jest „Kontynuuj z pomocą”. Poprawna odpowiedź po pomocy również daje wynik z pomocą. Pomoc ma pierwszeństwo przed podpowiedzią, a podpowiedź przed samodzielnym rozwiązaniem. Te drogi nie oceniają wartości gracza.

## Wyniki i konsekwencje

| Wynik | Powstanie | Przykład Hansken |
| --- | --- | --- |
| ROZWIAZANA_SAMODZIELNIE | poprawna odpowiedź/obserwacja lub dopuszczona alternatywa bez wskazówek | fragment Kroniki; coda o własnej obserwacji; możliwość bonusu przy pozostałych warunkach |
| ROZWIAZANA_Z_PODPOWIEDZIA | rozwiązanie po co najmniej jednej podpowiedzi | fragment; coda pamiętająca wskazówkę |
| ROZWIAZANA_Z_POMOCA | zaliczenie z pomocą lub wspomagana alternatywa | bez fragmentu za obserwację; kontynuacja i coda perspektywy źródłowej |
| POMINIETA | `POMIN_ZAGADKE`, tylko przy `moznaPominac: true` | bez fragmentu; otwarte miejsce w notatce i kontynuacja |
| NIEUDANA | świadome „Zakończ zadanie bez rozstrzygnięcia”, tylko przy `moznaZakonczycBezRozwiazania: true` | otwarte pytanie, alternatywny tekst i kontynuacja |

Wszystkie pięć wyników jest końcowych. `NIEUDANA` nie oznacza błędnej odpowiedzi i nie jest automatyczną karą za limit. Powtórne zaliczenie jest odrzucane przez silnik. Sesja ignoruje ponowne wysłanie po zamknięciu, a formularz blokuje drugi submit przed aktualizacją React. Konsekwencje i nagrody stosowane są raz.

Każdy wynik deklaruje osobne `zmiany[]` i `efekty[]`. Mogą zmieniać ślady, flagi, późniejszy tekst, dostępność scenek i kompozycję epilogu. Hansken ma pięć różnych komunikatów oraz pięć gałęzi późniejszej narracji. Nie tworzymy rankingu ani moralnej hierarchii finałów.

## Alternatywne zaliczenia

`alternatywneZaliczenia[]` zawiera `{id, nazwa, warunek, wynik}`. Warunek używa istniejącego DSL, np. `posiadaPrzedmiot` lub `odkrytoScenke`. Silnik ponownie sprawdza go przy `ZALICZ_ALTERNATYWNIE`; UI pokazuje tylko aktualnie dostępne drogi. Wynik deklarowany to samodzielny albo z pomocą; wcześniejsze wskazówki nadal wpływają na wynik końcowy.

Baszta pozwala skorzystać z fragmentu Hansken i notatki (z pomocą) albo zastosować rozróżnienie poznane w scence „Dwie notatki” (samodzielnie, jeśli nie użyto wskazówek). Alternatywa nie zwiększa licznika odpowiedzi. Pomoc, pominięcie i zakończenie bez rozwiązania są osobnymi deklaratywnymi politykami.

## Hansken i brak soft-lock

Hansken pozostaje roboczą OBSERWACJĄ: `wymagaWeryfikacjiTerenowej: true`, `odpowiedz: null`, bez daty rekonesansu. Checkbox opisuje deklarację obserwacji bez zatwierdzania detalu lub interpretacji historycznej. UI wyraźnie sygnalizuje ten status również w buildzie produkcyjnym. Nie dopisano niezweryfikowanej odpowiedzi terenowej.

Wszystkie wyniki Hansken i Baszty otwierają główne wybory kontynuacji. Brak fragmentu wyłącza opcjonalną scenkę i bonus, lecz nie mini-finał. Enumerator sprawdza **1080 dróg**: 900 podstawowych oraz 180 ze scenką dostępną po samodzielnym lub podpowiedzianym Hansken. Pomoc nie przyznaje już fragmentu za własną obserwację, stąd zmiana względem 1170 dróg Etapu 5. Każda droga przechodzi prawdziwy Silnik Gry i odpowiadające wybory Ink do mini-finału.

Schemat chroni wyjście po limicie; nie dowodzi osiągalności dowolnej przyszłej kampanii. Autor musi projektować warunki kontynuacji i rozszerzać macierz przy zmianie treści.

## Weryfikacja

`npm run test` obejmuje typy odpowiedzi, normalizację, próby, limity, stopniowane podpowiedzi, pomoc, polityki kontynuacji, warunki alternatyw i powtórne nagrody. Macierz wszystkich pięciu wyników Hansken sprawdza StanGry, DziennikZdarzen, EfektyGry, późniejsze cody i mini-finał. Testy React sprawdzają wszystkie wyniki, formularze trzech typów, błędną próbę, pomoc po limicie, alternatywy ze śladu/scenki, double-submit i semantykę etykiet/legend/statusów.

Bramki: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run test`, `git diff --check`. Testy DOM i przeglądarki nie zastępują sprawdzenia czytnika ekranu, fizycznego telefonu ani rekonesansu.

Etap 7 nie jest rozpoczęty.

Weryfikacja wykonana 2026-10-02:

| Kontrola | Wynik |
| --- | --- |
| Build, typecheck, lint, git diff --check | PASS |
| 136 testów: 6 smoke, 21 narracji, 67 silnika, 21 slice, 21 UI | PASS |
| 1080 dróg Gry + Ink do mini-finału, wszystkie wyniki Hansken | PASS |
| Przeglądarka: pomoc Hansken → Kościół → błędna odpowiedź Baszty → podpowiedź → poprawna odpowiedź → mini-finał | PASS |
| Formularz 390 px: klawiatura, etykiety, kontrolki ponad 44 px, brak przewijania poziomego | PASS |
| Mini-finał 320 px: brak przewijania poziomego | PASS |
| Fizyczny telefon, czytnik ekranu, rekonesans | NIETESTOWANE |
