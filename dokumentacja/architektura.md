# Architektura docelowa

Dokument opisuje założenia docelowe o statusie TYMCZASOWA. Etap 1 tworzy strukturę npm workspaces, ekrany startowe aplikacji i minimalne pakiety TypeScript. Poniższe odpowiedzialności domenowe pozostają docelowe; mechanika, Ink, walidacja, PWA, GPS, mapa, audio i zapis nie są jeszcze zaimplementowane.

```text
aplikacje/
  gra/
  strona/
pakiety/
  silnik-gry/
  silnik-narracji/
  schemat-tresci/
  typy-wspolne/
tresc/
  trzebiatow-v1/
dokumentacja/
```

## Odpowiedzialności

- aplikacje/gra: gra PWA w React + TypeScript + Vite; interfejs projektowany przede wszystkim na smartfony, przygotowanie trasy offline, GPS, mapa, audio i zapis rozgrywki.
- aplikacje/strona: Next.js + TypeScript; marketing, informacje o grze, SEO i zakup, później aktywacja oraz konto.
- pakiety/silnik-gry: własny, czysty TypeScript; źródło prawdy mechanicznej dla StanGry, StanRozgrywki, lokacji i ich stanu, zadań, wyników, wyborów, flag, śladów i przedmiotów, wątków, scenek opcjonalnych, powinowactwa, mechanizmu zakończeń oraz dziennika zdarzeń.
- pakiety/silnik-narracji: uruchamianie Ink / inkjs i granica komunikacji z Silnikiem Gry; tekst narracyjny, dialogi, rozgałęzienia tekstowe, lokalne wybory i warunkowe warianty narracji.
- pakiety/schemat-tresci: kontrakty i walidacja treści gry, ich identyfikatorów, źródeł oraz klasyfikacji historycznej.
- pakiety/typy-wspolne: wyłącznie typy rzeczywiście potrzebne na granicach modułów; bez globalnej warstwy mechaniki ani abstrakcji na przyszłość.
- tresc/trzebiatow-v1: treści kampanii poza Reactem, w tym sceny, wątki, zadania i odwołania do źródeł.
- dokumentacja: wizja, decyzje oraz zasady rozwoju, wydajności i treści.

## Model hybrydowy

Silnik Gry rozstrzyga mechanikę. Ink przedstawia narrację zależną od udostępnionego stanu. Ink nie jest źródłem prawdy dla GPS, zaliczenia obecności, śladów i przedmiotów, wyników zagadek, stanu lokacji ani globalnej mechaniki. Wybór tekstowy wpływający na mechanikę musi zostać rozstrzygnięty przez Silnik Gry.

Model warkocza łączy rozgałęzienia i indywidualne konsekwencje przez scenki opcjonalne oraz częściową konwergencję. Mechanizm Zakończeń wyznacza kompozytowy ProfilZakonczenia: glowneZakonczenie, epilogiWatkow[], wazneOdkrycia[] i konsekwencjeZagadek[]. Nie implementujemy pełnego drzewa osobnych kampanii.

Moduły mają niezależne odpowiedzialności. Szczegóły kontraktów, zapisu i przygotowania offline zostaną ustalone w kolejnych zatwierdzonych etapach. Etap 1 używa wyłącznie npm workspaces (`aplikacje/*`, `pakiety/*`), wspólnego `tsconfig.base.json` oraz Biome. Pakiety budują niezależne moduły ESM i deklaracje typów, bez zależności runtime. Strona używa App Routera Next.js i eksportu statycznego. Nie dodajemy teraz backendu, baz danych ani integracji.

## Nazewnictwo domenowe

Własne nazwy są polskie. W plikach, katalogach, identyfikatorach i symbolach kodu nie używamy polskich znaków. Poniższe symbole są planowaną terminologią, a nie implementacją typów.

| Pojęcie | Planowany symbol lub katalog |
| --- | --- |
| Silnik Gry | silnik-gry |
| Silnik Narracji | silnik-narracji |
| Most Narracji | MostNarracji |
| Schemat Treści | schemat-tresci |
| Typy Wspólne | typy-wspolne |
| Stan Gry | StanGry |
| Stan Rozgrywki | StanRozgrywki |
| Zdarzenie Gry | ZdarzenieGry |
| Zagadka / Zadanie | Zagadka / Zadanie |
| Wynik Zagadki | WynikZagadki |
| Wątek | Watek |
| Stan Wątku | StanWatku |
| Scenka Opcjonalna | ScenkaOpcjonalna |
| Ślady i Przedmioty | SladyIPrzedmioty |
| Powinowactwo | Powinowactwo |
| Mechanizm Zakończeń | MechanizmZakonczen |
| Profil Zakończenia | ProfilZakonczenia |
| Dziennik Zdarzeń | DziennikZdarzen |
| Pakiet Gry | PakietGry |
| Weryfikacja Terenowa | WeryfikacjaTerenowa |
| Profil Wydajności | ProfilWydajnosci |

Nazwy prezentowane graczowi to PEŁNY, AUTOMATYCZNY i EKO; ich planowane identyfikatory to PELNY, AUTOMATYCZNY i EKO.

Katalogi aplikacje/ i pakiety/ są jawnie wskazane w konfiguracji obszarów roboczych npm. Jeśli sprawdzenie npm, Next.js lub Vite wykaże rzeczywisty problem, należy go udokumentować i przed zmianą zaproponować wyjątek dla nazw tych dwóch katalogów.
