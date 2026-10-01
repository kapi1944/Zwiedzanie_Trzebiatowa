# Zasady treści

Treści gry przechowujemy poza Reactem, docelowo w tresc/trzebiatow-v1. Komponenty prezentują treść; nie zawierają kampanii zapisanej na stałe.

Docelowy Pakiet Gry ma następującą strukturę; pliki te nie powstają w Etapie 0:

```text
tresc/trzebiatow-v1/
  manifest.yaml
  lokalizacje.yaml
  watki.yaml
  zadania.yaml
  zagadki.yaml
  scenki-opcjonalne.yaml
  zakonczenia.yaml
  zrodla.yaml
  narracja/
    glowna.ink
  zasoby/
    manifest.yaml
```

Treści historyczne mają identyfikatory źródeł odwołujące się do identyfikowalnych źródeł. Materiał fikcjonalizowany musi być oznaczony, a jego historyczne podstawy powiązane ze źródłami. Dokładny format rejestru źródeł zostanie ustalony później.

## Klasyfikacja historyczna

Każda treść musi umożliwiać klasyfikację:

- FAKT: informacja potwierdzona źródłami.
- TRADYCJA: przekaz tradycyjny, oznaczony jako taki.
- LEGENDA: legenda, bez przedstawiania jej jako faktu.
- SPORNE: informacja sporna, z zaznaczeniem niepewności.
- FABULARYZOWANE: element opracowany lub wymyślony na potrzeby fabuły.

## Weryfikacja terenowa

Weryfikacja terenowa obejmuje sprawdzenie miejsca, dostępności, widoczności wskazówek i wykonalności zadania podczas rekonesansu. Nie zatwierdzaj finalnych zagadek bez rekonesansu terenowego.

Zagadki oparte na terenie muszą mieć alternatywną drogę kontynuacji na wypadek niedostępności lub zmiany elementu. GPS nigdy nie jest jedyną drogą kontynuacji. Błędna odpowiedź nie może powodować trwałego zablokowania rozgrywki.

Projektuj wyniki ROZWIAZANA_SAMODZIELNIE, ROZWIAZANA_Z_PODPOWIEDZIA, ROZWIAZANA_Z_POMOCA, POMINIETA i NIEUDANA jako potencjalnie różne konsekwencje narracyjne. Uwzględniaj decyzje, opóźnione konsekwencje, zadania opcjonalne, scenki opcjonalne i warianty epilogów. Tryb EKO nie ogranicza treści ani zakończeń.
