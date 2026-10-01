# Architektura docelowa

Dokument opisuje założenia PROVISIONAL. W Etapie 0 nie tworzymy aplikacji, pakietów ani mechanizmów wykonawczych.

```text
apps/
  game/
  website/
packages/
  quest-engine/
  narrative-runtime/
  content-schema/
  shared-types/
content/
  trzebiatow-v1/
docs/
```

## Odpowiedzialności

- apps/game: GAME PWA w React + TypeScript + Vite; interfejs mobile-first, przygotowanie trasy offline, GPS, mapa, audio i zapis rozgrywki.
- apps/website: Next.js + TypeScript; marketing, informacje o grze, SEO i zakup, później aktywacja oraz konto.
- packages/quest-engine: własny, czysty TypeScript; źródło prawdy mechanicznej dla GameState, QuestState, lokacji i ich stanu, zadań, wyników, wyborów, flag, inventory, wątków, storyletów, affinities, ending resolvera oraz event logu.
- packages/narrative-runtime: uruchamianie Ink / inkjs i granica komunikacji z Quest Engine; tekst narracyjny, dialogi, rozgałęzienia tekstowe, lokalne wybory i warunkowe warianty narracji.
- packages/content-schema: kontrakty i walidacja treści gry, ich identyfikatorów, źródeł oraz klasyfikacji historycznej.
- packages/shared-types: wyłącznie typy rzeczywiście potrzebne na granicach modułów; bez globalnej warstwy mechaniki ani abstrakcji na przyszłość.
- content/trzebiatow-v1: treści kampanii poza Reactem, w tym sceny, wątki, zadania i odwołania do źródeł.
- docs: wizja, decyzje oraz zasady rozwoju, wydajności i treści.

## Model hybrydowy

Quest Engine rozstrzyga mechanikę. Ink przedstawia narrację zależną od udostępnionego stanu. Ink nie jest źródłem prawdy dla GPS, zaliczenia obecności, inventory, wyników zagadek, stanu lokacji ani globalnej mechaniki. Wybór tekstowy wpływający na mechanikę musi zostać rozstrzygnięty przez Quest Engine.

Model BRAID łączy rozgałęzienia i indywidualne konsekwencje przez storylety oraz częściową konwergencję. Ending resolver wyznacza kompozytowy EndingProfile: primaryEnding, threadCodas[], specialDiscoveries[] i challengeConsequences[]. Nie implementujemy pełnego drzewa osobnych kampanii.

Moduły mają niezależne odpowiedzialności. Szczegóły kontraktów, zapisu, przygotowania offline i narzędzi monorepo zostaną ustalone w kolejnych zatwierdzonych etapach. Nie dodajemy teraz backendu, baz danych ani integracji.
