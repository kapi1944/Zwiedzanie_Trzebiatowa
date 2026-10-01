# Wizja produktu

Zwiedzanie Trzebiatowa łączy poznawanie miasta z terenową grą narracyjną. Odbiorcami są odwiedzający i mieszkańcy zainteresowani odkrywaniem miejsc, historii i opowieści poprzez samodzielną rozgrywkę na smartfonie.

Produkt obejmuje GAME PWA oraz osobny WEBSITE. Gra przewiduje GPS, mapę, audio i zapis rozgrywki. Strona marketingowa opisuje grę, wspiera SEO i zakup; aktywacja oraz konto należą do późniejszego zakresu.

Gra jest mobile-first i offline-first: po wcześniejszym przygotowaniu trasy musi działać bez internetu. GPS pomaga odnaleźć miejsce, lecz nigdy nie stanowi jedynej możliwości kontynuacji.

## Narracja i rozgrywka

Gra nie jest liniowym przewodnikiem. Wspiera wiele aktywnych wątków, różne kolejności ich realizacji, zadania opcjonalne, storylety (warunkowo dostępne krótkie sceny), przedmioty i ślady, ukryte flagi oraz ukryte affinities (wartości opisujące tendencje gracza).

Decyzje mają również opóźnione konsekwencje. Wynik zadania nie ogranicza się do true / false. Przewidywane wyniki to solved_clean, solved_with_hint, assisted, skipped i failed. Mogą zmieniać późniejsze dialogi, dostępność scen i storyletów, przedmioty oraz zakończenia. Błędna odpowiedź nie może trwale zablokować kontynuacji gry.

Stosujemy model BRAID / warkocza: rozgałęzienie → indywidualne konsekwencje → storylety → częściowa konwergencja → kolejne rozgałęzienie. Realne decyzje nie wymagają osobnej pełnej kampanii dla każdej ścieżki.

## Kompozytowe zakończenia

Docelowy EndingProfile obejmuje primaryEnding, threadCodas[], specialDiscoveries[] i challengeConsequences[]. Gracz otrzymuje jeden główny profil zakończenia, epilogi wątków, reakcje na ważne odkrycia oraz sposób rozwiązania zagadek. Przewidujemy około 4–6 głównych profili, zamiast 30 całkowicie osobnych zakończeń. Szczegółowe warunki pozostają do ustalenia.

## Priorytety

1. Niezawodność terenowa.
2. Czytelność.
3. Fabuła.
4. Atmosfera.
5. Efekty wizualne.

Treści umożliwiają klasyfikację FACT, TRADITION, LEGEND, DISPUTED i FICTIONALIZED. Profile wydajności FULL, AUTO i ECO nie zmieniają fabuły ani dostępnych zakończeń.
