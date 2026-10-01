# Wizja produktu

Zwiedzanie Trzebiatowa łączy poznawanie miasta z terenową grą narracyjną. Odbiorcami są odwiedzający i mieszkańcy zainteresowani odkrywaniem miejsc, historii i opowieści poprzez samodzielną rozgrywkę na smartfonie.

Produkt obejmuje grę PWA oraz osobną stronę internetową. Gra przewiduje GPS, mapę, audio i zapis rozgrywki. Strona marketingowa opisuje grę, wspiera SEO i zakup; aktywacja oraz konto należą do późniejszego zakresu.

Gra jest projektowana przede wszystkim na smartfony i do działania bez internetu: po wcześniejszym przygotowaniu trasy musi działać bez internetu. GPS pomaga odnaleźć miejsce, lecz nigdy nie stanowi jedynej możliwości kontynuacji.

## Narracja i rozgrywka

Gra nie jest liniowym przewodnikiem. Wspiera wiele aktywnych wątków, różne kolejności ich realizacji, zadania opcjonalne, scenki opcjonalne (warunkowo dostępne krótkie sceny), przedmioty i ślady, ukryte flagi oraz ukryte powinowactwa (wartości opisujące tendencje gracza).

Decyzje mają również opóźnione konsekwencje. Wynik zadania nie ogranicza się do odpowiedzi tak / nie. Przewidywane wyniki to ROZWIAZANA_SAMODZIELNIE, ROZWIAZANA_Z_PODPOWIEDZIA, ROZWIAZANA_Z_POMOCA, POMINIETA i NIEUDANA. Mogą zmieniać późniejsze dialogi, dostępność scen i scenek opcjonalnych, przedmioty oraz zakończenia. Błędna odpowiedź nie może trwale zablokować kontynuacji gry.

Stosujemy model warkocza: rozgałęzienie → indywidualne konsekwencje → scenki opcjonalne → częściowa konwergencja → kolejne rozgałęzienie. Realne decyzje nie wymagają osobnej pełnej kampanii dla każdej ścieżki.

## Kompozytowe zakończenia

Docelowy ProfilZakonczenia obejmuje glowneZakonczenie, epilogiWatkow[], wazneOdkrycia[] i konsekwencjeZagadek[]. Gracz otrzymuje jeden główny profil zakończenia, epilogi wątków, reakcje na ważne odkrycia oraz sposób rozwiązania zagadek. Przewidujemy około 4–6 głównych profili, zamiast 30 całkowicie osobnych zakończeń. Szczegółowe warunki pozostają do ustalenia.

## Priorytety

1. Niezawodność terenowa.
2. Czytelność.
3. Fabuła.
4. Atmosfera.
5. Efekty wizualne.

Treści umożliwiają klasyfikację FAKT, TRADYCJA, LEGENDA, SPORNE i FABULARYZOWANE. Profile wydajności PEŁNY, AUTOMATYCZNY i EKO nie zmieniają fabuły ani dostępnych zakończeń.
