# Resolver zakończeń

Resolver korzysta wyłącznie z `StanGry` i definicji contentu. Nie zapisuje
drugiego stanu. Czysta funkcja `wyznaczProfilZakonczenia` waliduje definicje,
stan i ich zgodność, nie zamyka sesji ani nie wykonuje efektów prezentacyjnych.
Wymaga ukończenia obowiązkowych wątków, a rozpoczęta kampania
musi dojść do sceny finału i spełnić jej warunek.

Najpierw ocenia reguły, potem wybiera zakończenie główne i komponuje dodatki.
Warunki DSL czytają decyzje, odwiedzone miejsca, zadania, wyniki, podpowiedzi,
flagi, odkryte scenki, przedmioty i stany wątków. `wymaganaWiedza` odwołuje się
do istniejących wpisów wiedzy: odblokowanie wynika z ich warunków, nie z
dodatkowej flagi. Nie oznacza potwierdzenia prawdziwości historycznej informacji.

| Rodzaj | Rozstrzygnięcie |
| --- | --- |
| `GLOWNE` | Jedno pasujące zakończenie z najwyższym priorytetem; bezwarunkowe domyślne jest rezerwą |
| `WARIANT_ZAKONCZENIA` | Dodatki wyłącznie do rzeczywiście wybranego zakończenia głównego |
| `EPILOG_WATKU` | Niezależne epilogi, w tym dla częściowo rozwiniętych wątków |
| `SPECJALNE_ODKRYCIE` | Niezależne odkrycia wynikające z wyprawy |
| `KONSEKWENCJA_ZAGADKI` | Zachowana wcześniejsza kategoria konsekwencji wyników |

Nowe opcjonalne pola reguły:

- `idScenyWejscia`: scena, w której reguła może uczestniczyć w finale.
- `idZakonczeniaGlownego`: wymagany rodzic wariantu.
- `grupa`: jedno rozstrzygnięcie na grupę w obrębie kategorii.
- `idWatku`: powiązanie epilogu z istniejącym wątkiem; bez jawnej grupy
  identyfikator wątku pełni funkcję grupy.
- `wymaganaWiedza`: lista wpisów, których wszystkie warunki muszą być spełnione.

Wariant wymaga rodzica, grupy i warunku. Epilog może świadomie dotyczyć stanu
AKTYWNY lub UKONCZONY; samo `idWatku` nie wymusza ukończenia. Grupy wybierają
najwyższy priorytet. Różne grupy mogą współistnieć. Sortowanie po id zapewnia
deterministyczność remisu w zgodnym starszym contentcie, ale nowe niejednoznaczne
reguły należy rozstrzygnąć priorytetem lub rozłącznymi warunkami.

Profil zwraca `zakonczenieGlowne`, `wariantyZakonczenia`, `epilogiWatkow`,
`specjalneOdkrycia` i `konsekwencjeZagadek`. Interfejs finału wyświetla także
teksty wariantów. Profil po wznowieniu jest ponownie wyliczany z zapisu stanu;
nie dodano nowego formatu zapisu. Starsze reguły bez nowych pól pozostają zgodne.

Przykład `wariant_otwarte_slady` wymaga łącznie: decyzji zapisu Hansken,
odwiedzonego miejsca, wykonanego zadania, samodzielnego wyniku bez podpowiedzi,
aktywnego wątku Znaki, notatki postaci i odblokowanej wiedzy. Pasuje tylko do
Otwartej Kroniki. Identyczny wybór zamknięcia wyprawy po podpowiedzi lub
pominięciu nie daje tego wariantu. Teksty zakończeń są krótkimi reprezentantami,
a nie finalną pełną redakcją kampanii.

## Walidacja autora

[Walidator reguł](../narzedzia/reguly-zakonczen.ts) i schemat sprawdzają:

- Nieistniejące rodzice, wiedzę, wątki i niedozwolone powiązania kategorii.
- Nieistniejącą lub odciętą scenę wejścia w grafie przejść.
- Sprzeczne atomy logiczne, wyniki jednej zagadki, stany wątku i zakresy liczb.
- Dodatnie flagi, których content nie może ustawić; uwzględnia flagi zadań.
- Martwe alternatywy: są raportowane, ale żywa gałąź OR pozwala zachować regułę.
- Konflikty równych priorytetów w grupach i identycznych regułach głównych.

Analiza rozwija AND/OR/NOT i ma limit 2048 alternatyw, sprawdzany przed
iloczynem gałęzi. Przekroczenie blokuje walidację i wymaga uproszczenia reguły;
nie jest wynikiem PASS. Dla różnych reguł głównych sama logiczna możliwość
współwystąpienia flag nie dowodzi konfliktu w osiągalnym stanie.

Dlatego drugi poziom używa prawdziwych końcowych stanów po legalnych zdarzeniach
Quest Engine. `sprawdzSwiadectwaZakonczen` odwołuje się do tego samego resolvera,
wykrywa remis głównych reguł w osiągalnym stanie i wymaga rzeczywistego wyboru
każdego sprawdzanego zakończenia. Reguła zasłonięta przez wyższy priorytet jest
odrzucana jako pozbawiona świadectwa, mimo że jej własny warunek jest spełniony.

Budowa sprawdza reguły obu pakietów. Slice zachowuje kontrolę 1080 dróg; ich końcowe stany są również
świadectwami wyboru wszystkich jego zakończeń. Kampania sprawdza 154 reprezentatywne przebiegi i wszystkie reguły
przypisane do swojego finału. Każda nowa reguła w autorskim `kampania.json`
musi deklarować scenę wejścia. Brak świadectwa blokuje budowę; autor dodaje
legalny przebieg albo poprawia regułę. Zestaw świadectw nie jest matematycznym
dowodem przeszukania wszystkich przyszłych kombinacji całej kampanii.

GOTOWE TECHNICZNIE: architektura, resolver i walidacja. CZĘŚCIOWO GOTOWE:
redakcja zakończeń. PLANOWANE: finalny dobór contentu. Historyczne twierdzenia
i teren nadal DO_WERYFIKACJI / WYMAGA_REKONESANSU. Etap 12 pozostaje nieukończony.

[Etap 12](etap-12-pelna-kampania.md) · [status](status-projektu.md) ·
[sieć narracyjna](siec-narracyjna.md) · [źródła](zrodla-contentu.md).

Kontrola rozszerzenia resolvera: build, 269 testów (pełny zestaw oraz dodatkowe
przypadki walidatora), typecheck, lint śledzonego kodu i nowych narzędzi,
limity gzip/lazy oraz `git diff --check` PASS. Walidacja 1080 dróg slice
oraz 154 świadectw kampanii PASS. Pełny lint FAIL przez dwa wcześniejsze błędy
w nieśledzonym `zastap_teksty_trzebiatow_v2.mjs`. E2E i terenu nie ponawiano.
