# Bank kandydatów zadań terenowych — Etap 12

[Dane banku](../tresc/kampania/bank-miejsc.json) ·
[rejestr lokalizacji](rejestr-lokalizacji.md) · [status projektu](status-projektu.md)

Bank zachowuje **83 osobne miejsca i 249 kandydatów**. Każde miejsce ma obecnie
trzy propozycje, ale model dopuszcza od jednej do trzech. Litery `a`, `b`, `c`
identyfikują kandydatów, nie poziomy trudności, priorytety ani wybór finalny.
Żaden kandydat nie został przeniesiony do zadań, zagadek, nagród lub warunków
kampanii. Pipeline waliduje bank autora, a do aplikacji buduje osobny pakiet gry.
Wykorzystanie miejsca w runtime nie oznacza wykorzystania jego kandydatów.

## Zasada obserwacji

Gracz patrzy na rzeczywisty Trzebiatów: liczy elementy konkretnego fragmentu,
odczytuje istniejący napis, odnajduje detal lub porównuje dwa widoki. Nazwa,
data podana w nazwie punktu, quiz historyczny, rekonstrukcja w aplikacji ani
znacznik GPS nie wystarczają do rozwiązania. Usunięto pytania tak/nie,
quizy o historii i funkcji obiektów oraz założenia o dodanych kodach gry.
Nie dodano AR, skanowania, aparatu, integracji ani nowych mechanik runtime.

Przykłady zmiany:

- Mostowa 12: zamiast pytania o symetrię — liczba osi po obu stronach wejścia
  i położenie wskazanego detalu.
- Dzwony: zamiast wybierania daty podanej w tytule — fragment inskrypcji,
  detal powierzchni albo widoczne mocowanie.
- Sala Tradycji: oglądanie udostępnionych eksponatów, bez zgadywania emblematów
  na podstawie wiedzy ogólnej.
- Białoboki i dawne bramy: po potwierdzeniu lokalizacji porównanie zatwierdzonego
  planu z rzeczywistym otoczeniem albo odczyt istniejącej informacji terenowej.
  Nie sugeruje się, że niewidoczny relikt można znaleźć na powierzchni.

Nowe polecenia są propozycjami autorskimi opartymi na tematach encyklopedii
i wcześniejszym banku. Zachowane źródła identyfikują temat miejsca; nie
potwierdzają istnienia każdego proponowanego detalu, tablicy, ornamentu ani
publicznego stanowiska. Takie założenia pozostają WYMAGA_REKONESANSU.

## Model kandydata

Każdy element `kandydaciZadan` ma wymagane pola:

| Pole | Znaczenie |
| --- | --- |
| `id` | `bank_NN_zadanie_a`, `_b` lub `_c`; należy do miejsca `bank_NN` |
| `typ` | `LICZENIE`, `ODCZYT`, `ROZPOZNANIE_DETALU`, `POROWNANIE`, `PAMIEC` lub `POLACZENIE_WSKAZOWEK` |
| `polecenie` | Robocze polecenie oparte na obserwacji; konkretne stanowisko, granice fragmentu i detal należy ustalić podczas rekonesansu |
| `celObserwacji` | Osobny, niepusty cel każdego kandydata; nie jest potwierdzeniem istnienia detalu |
| `wymagaObecnosci` | Zawsze `true`; deklaracja autora, nie automatyczny dowód obecności gracza |
| `status` | Zawsze `KANDYDAT_ROBOCZY`; bank nie wybiera finalnego zadania |
| `statusWykorzystania` | Zawsze `BANK_KANDYDATOW`; potwierdzenie odpowiedzi nie aktywuje zadania |
| `odpowiedz` | `null`, dopóki nie powstanie terenowo potwierdzony klucz; później niepusty tekst |
| `statusOdpowiedzi` | `WYMAGA_REKONESANSU`, `DO_WERYFIKACJI` albo `POTWIERDZONE_TERENOWO` |
| `weryfikacjaTerenowa` | `null` albo `{ data: "YYYY-MM-DD", protokol: "odniesienie do rzeczywistego protokołu" }`; obowiązkowa przy potwierdzonej odpowiedzi |
| `rekonesans` | Niepusta lista warunków do sprawdzenia, w tym identyfikacja detalu, legalny punkt i wykonanie zadania |
| `zrodla` | Niepusta lista unikalnych id źródeł miejsca, np. `["s1", "s4", "s22"]`; bez dawnych zbiorczych ciągów `S1, S4, S22` |

Wszystkie 249 rekordów ma obecnie `odpowiedz: null`,
`statusOdpowiedzi: "WYMAGA_REKONESANSU"` i `weryfikacjaTerenowa: null`.
Nie wpisano odpowiedzi z PDF ani domyślnych wartości takich jak zero lub
„brak tablicy”. Statusy źródeł i miejsca są niezależne od statusu klucza zadania.
`POTWIERDZONE_ZRODLOWO` nie jest dopuszczalnym statusem odpowiedzi terenowej.

## Niezależność i niedostępne miejsca

Każdy kandydat jest oddzielną propozycją: nie wymaga wykonania kandydata `a`
przed `b`, zdobycia przedmiotu ani ukończenia innego punktu. `PAMIEC` oznacza
zapamiętanie obserwacji i odtworzenie jej w obrębie tego samego zadania;
`POLACZENIE_WSKAZOWEK` łączy dwa detale możliwe do obejrzenia w danej lokalizacji.
Te typy nie ustanawiają kolejności kampanii.

Wnętrza, ekspozycje, dzwony, relikty i teren wojskowy wymagają potwierdzenia
udostępnienia. Kandydat zależny od tablicy pozostaje roboczy, gdy tablicy nie
znaleziono. Przy dawnych bramach i stanowiskach archeologicznych potrzebne są
dokumentacja położenia oraz publiczny punkt obserwacji współczesnego otoczenia.
Nie dopisano współrzędnych, promieni GPS, fikcyjnych reliktów ani znaczników.
Brak wykonalnego celu oznacza `DO_WERYFIKACJI` odpowiedzi z nadal pustym kluczem,
a nie automatyczne zaliczenie. Nie wybrano za użytkownika kandydata zastępczego.

## Walidacja i jej granice

`schematKandydataZadaniaTerenowego` sprawdza pola, dozwolone typy, obowiązek
obserwacji, status banku i źródła. Potwierdzona odpowiedź wymaga niepustego
klucza i protokołu z poprawną datą. Niepotwierdzone odpowiedzi i protokoły
pozostają `null`. Schemat odrzuca jawne polecenia „odpowiedz tak lub nie” /
„wybierz prawda albo fałsz” oraz nieobsługiwane pola zależności i aktywacji.

`schematRejestruMiejsc` zachowuje komplet 83 miejsc, wymaga od 1 do 3 kandydatów,
sprawdza przynależność id do miejsca, unikalność id/celów/poleceń i źródła.
Walidacja działa w istniejącej budowie treści. Testy sprawdzają ponadto komplet
249 propozycji i ich brak w zbudowanym pakiecie runtime.

Kontrola strukturalna i prosty filtr tekstu nie dowodzą, że każde możliwe
sformułowanie wymaga wizyty, cele są semantycznie niezależne ani że protokół
jest prawdziwy. Te kwestie wymagają przeglądu autora i próby na miejscu.
Przed wyborem finalnego zadania należy określić dokładny fragment i punkt
obserwacji, wykonać zadanie, zapisać odpowiedź oraz sprawdzić, czy sam tytuł,
wiedza ogólna lub materiały aplikacji nie zdradzają klucza.

## Wyniki kontroli — 2026-10-04

- PASS: build i 243 testy (8 fundamentu, 21 narracji, 67 silnika, 43 treści, 104 UI).
- PASS: typecheck wszystkich workspace, treści i E2E; 1080 dróg slice i 153 świadectwa kampanii.
- PASS: Biome na 99 śledzonych plikach, linki/kotwice w 5 dokumentach i `git diff --check`.
- PASS: porównanie z poprzednim bankiem zachowuje metadane 83 miejsc oraz źródła wszystkich 249 kandydatów.
- FAIL: root `npm run lint` — dwa zastane błędy importów/formatowania w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`; plik użytkownika niezmieniony.
- E2E i rekonesansu nie ponawiano w tej zmianie banku autora.

Etap 12 pozostaje nieukończony. Zadania nie zostały zatwierdzone terenowo ani
wybrane jako finalne.
