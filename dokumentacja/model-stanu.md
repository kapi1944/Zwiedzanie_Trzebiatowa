# Model stanu gry — Etap 3

`StanGry` jest serializowalnym obiektem JSON walidowanym przez `schematStanuGry` z `@zwiedzanie/schemat-tresci`. Silnik zwraca nowy obiekt po kroku. Nie ma danych osobowych ani pozycji GPS.

| Pole | Znaczenie |
| --- | --- |
| idGry, wersjaGry, wersjaTresci | tożsamość zgodna z manifestem |
| wersjaSchematZapisu | obecnie dokładnie 1 |
| idSesji | identyfikator przekazany w starcie |
| aktualnaScena | identyfikator narracyjnej sceny |
| odwiedzoneLokalizacje, potwierdzoneLokalizacje | osobne zbiory wizyt i deklarowanych potwierdzeń |
| wynikiZagadek | słownik `{ wynik, liczbaProb, liczbaPodpowiedzi }` |
| postepyZagadek, aktywnaZagadka | liczniki prób i podpowiedzi, jedno aktywne id lub null |
| dokonaneWybory | identyfikatory dokonanych wyborów |
| flagi | słownik boolean |
| sladyIPrzedmioty | identyfikatory posiadanych elementów |
| watki | słownik stanu każdego zdefiniowanego wątku |
| powinowactwa | całkowite osie dowod/legenda/pamiec/zmiana w -5..5 |
| odkryteScenki | identyfikatory otwartych scenek |
| uzytePodpowiedzi | liczba użytych podpowiedzi dla zagadki |
| pominieteZagadki | identyfikatory zagadek z wynikiem POMINIETA |
| odblokowaneLokalizacje | trwałe odblokowania |
| dziennikZdarzen | przyjęte zdarzenia domenowe z id i czasem wejściowym |

Wyniki: ROZWIAZANA_SAMODZIELNIE, ROZWIAZANA_Z_PODPOWIEDZIA, ROZWIAZANA_Z_POMOCA, POMINIETA, NIEUDANA. Nie zastępujemy ich booleanem. Pierwsze cztery zamykają zagadkę; NIEUDANA umożliwia ponowną próbę lub pominięcie. Licznik prób rośnie na rozpoczęciu. Pominięcie bez próby ma liczbaProb=0.

Stany wątku: ZABLOKOWANY, DOSTEPNY, AKTYWNY, UKONCZONY, POMINIETY. Start inicjalizuje wątki, a spełnienie warunku daje dostępność. Zdarzenia aktywacji/zakończenia wymagają poprzedniego stanu; pominięcie dotyczy tylko niewymaganego opcjonalnego wątku.

Ślad/przedmiot ma definicję `SladLubPrzedmiot` o rodzaju TROP, PAMIATKA, FRAGMENT_KRONIKI lub SYMBOLICZNY_KLUCZ. Stan przechowuje id; definicje i DSL wskazują konsekwencje dla tekstów, scenek, epilogów i odkryć. Brak elementów opcjonalnych nie ogranicza domyślnego zakończenia. Zależności obowiązkowych wątków trzeba świadomie projektować w treści; silnik nie dowodzi osiągalności całej kampanii.

Zgodność wersji, identyfikatorów, wątków, początku dziennika, kolejności czasu i wybranych liczników jest kontrolowana przed krokiem i wyznaczeniem zakończenia. Walidacja nie jest migracją ani dowodem, że zewnętrzny zapis powstał z autentycznego replayu. Przyszły odbiorca odpowiada za trwały zapis i zaufanie do niego.

Dziennik zawiera wyłącznie jawne zdarzenia opisane w [Silniku Gry](silnik-gry.md), także wznowienie sesji. Nie ma zdarzeń kliknięć interfejsu ani telemetrycznych. Replay zaczyna od null i wykonuje kolejno wpisy z tym samym Pakietem Gry. Odrzucone zdarzenia nie są dopisywane. Zapis dziennika przygotowuje debug i przyszłe migracje; migracje nie są zaimplementowane.
