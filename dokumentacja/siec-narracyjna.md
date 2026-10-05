# Robocza sieć narracyjna Etapu 12

[Dane sieci](../tresc/kampania/siec-narracyjna.json) rozwijają model warkocza
opisany w [Etapie 12](etap-12-pelna-kampania.md). Sieć ma 8 osi, 38 węzłów:
16 niezależnych wejść, 8 ukrytych rozwinięć, 6 splotów i 8 późniejszych scen.
Jest propozycją autora, bez finalnych dialogów, trasy i wyboru zadań.

| Oś | Niezależne wejścia w banku | Pytanie rozwijane przez oś |
| --- | --- | --- |
| Historia miasta | Rynek, układ ulic | Jak czytać kolejne warstwy miasta? |
| Pamięć i kronika | Muzeum pałacowe, lapidarium | Jak zapisywać ślady i luki w wiedzy? |
| Fortyfikacje | Mury, pozostałości fosy | Gdzie kończy się obserwacja, a zaczyna rekonstrukcja? |
| Rega i rozwój | Most kamienny, Młynówka | Jak porównywać przeprawy i infrastrukturę? |
| Miejsca sakralne | Kościół Mariacki, kaplica św. Ducha | Jak czytać funkcje i pamięć wspólnot? |
| Mieszkańcy i opowieści | Kamienice rynku, Galeria Feininger | Jak nie dopisywać głosu nieobecnym mieszkańcom? |
| Udokumentowany przekaz legendy | Baszta Kaszana, mural legendy | Jak oddzielać przekaz od dowodu wydarzenia? |
| Obrazy miasta | Sgraffito Hansken, mural Feiningera | Jak przedstawienia zmieniają zapis pamięci? |

Węzeł nie jest fizyczną lokalizacją. `idMiejsc` wskazuje osobne rekordy
[banku 83 miejsc](rejestr-lokalizacji.md), bez ich scalania lub aktywacji.
Źródła i pewność twierdzeń należą do rekordów informacji historycznych;
opis węzła to propozycja fabularna, a nie nowy fakt historyczny.
Nie potwierdzono dostępności wnętrz ani obecności detali. Źródła WWW i opisy
robocze nadal wymagają weryfikacji. Oś legend dotyczy istniejącego przekazu
kaszanego; nie tworzy nowych legend na podstawie sugestywnej nazwy miejsca.

Każda oś zaczyna się w jednym z dwóch niezależnych węzłów `WEJSCIE`.
Warunek `DOWOLNY` odsłania rozwinięcie po dowolnym wejściu; nie wymaga obu.
`UKRYTA` oznacza nieujawnioną propozycję do chwili spełnienia warunku.
Brak odkrycia splotu lub pominięcie całej osi nie blokuje innych osi.

Sploty mają warunek `WSZYSTKIE` i łączą co najmniej dwie osie:

- Rega i granice: przeprawy oraz fortyfikacje.
- Pamięć wspólnot: kronika oraz mieszkańcy.
- Warstwy sakralne: historia miasta oraz obiekty sakralne.
- Legenda i obraz: przekaz kaszany oraz jego przedstawienie.
- Miasto nad rzeką: urbanistyka oraz Rega.
- Głosy w kronice: mieszkańcy oraz obrazy miasta.

Każda oś prowadzi samodzielnie do `SCENA_POZNIEJSZA`. Jej podstawowa wersja
działa bez splotów. `warianty` dopisują propozycje nawiązania do splotów
odkrytych wcześniej; kilka wariantów może współistnieć. Kolejność odkrycia
nie zmienia wyników dla tego samego zbioru ukończonych węzłów.
To nie system nagród, zakończeń ani drugi zapis stanu gry.

Format węzła: `id`, `idOsi`, `idMiejsc`, `rodzaj`, `widocznosc`, `opis`,
`warunek: { rodzaj, idWezlow }`, `warianty: [{ id, warunek, opis }]`,
`status: PROPOZYCJA`, `statusWeryfikacji: DO_WERYFIKACJI`.
Pusty warunek jest dozwolony tylko w jawnym wejściu.

[Walidator](../narzedzia/siec-narracyjna.ts) sprawdza referencje i duplikaty,
niezależne wejścia, wieloosiowość splotów, osiągalność i zakleszczenia oraz
samodzielną drogę każdej osi do późniejszej sceny. Uwzględnia alternatywne
warunki, więc sam cykl z osiągalnym wejściem nie oznacza zakleszczenia.
Testy sprawdzają oba wejścia każdej osi, niepełne odkrycia, sploty, warianty,
różne przeploty i negatywne przypadki grafu. Nie dowodzą jakości finalnej fabuły.

`odczytajKampanie` waliduje sieć przy budowaniu contentu, ale nie dołącza jej
do pakietu gry. Runtime zachowuje 7 miejsc, swoje istniejące wątki i flagi.
Po późniejszym wyborze treści autor powinien przypisać wybrane węzły do
istniejących warunków Quest Engine, scen Ink i zweryfikowanych kandydatów zadań.
Nie ma automatycznej konwersji ani wyboru finalnego contentu.

GOTOWE TECHNICZNIE: model autora, symulacja dostępności, walidacja i testy.
CZĘŚCIOWO GOTOWE: większa architektura narracyjna. DO_WERYFIKACJI: źródła
i powiązania tematyczne. WYMAGA_REKONESANSU: punkty obserwacji i dostęp.
PLANOWANE: wybór contentu oraz implementacja wybranych scen. Etap 12 nieukończony.

Powiązania: [status projektu](status-projektu.md),
[warstwa źródłowa](zrodla-contentu.md), [bank zadań](bank-zadan-terenowych.md).

Kontrola lokalna: build, 250 testów, typecheck, lint śledzonych plików i nowych
plików sieci oraz `git diff --check` PASS. Istniejące 1080 dróg slice i 153
świadectwa kampanii nadal PASS. Pełny lint FAIL przez dwa wcześniejsze błędy
w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`. E2E i terenu nie ponawiano.
