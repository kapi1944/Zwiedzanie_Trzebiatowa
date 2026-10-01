# Decision Log

Każda decyzja zawiera ID, Title, Status, Decision, Reason, Consequences i Date. Dozwolone statusy: ACCEPTED (bezpośrednio zatwierdzona przez użytkownika), PROVISIONAL (robocze założenie), SUPERSEDED (zastąpiona, z odwołaniem do następcy) i REJECTED (odrzucona z uzasadnieniem).

Wszystkie poniższe decyzje pozostają PROVISIONAL zgodnie z zakresem Etapu 0. Codex nie może samodzielnie nadać im ACCEPTED. Przy zmianie zachowujemy poprzednią treść i status w historii wpisu; zastąpienie wskazuje ID nowej decyzji. Data oznacza datę rejestracji lub udokumentowanej zmiany.

## D001

- ID: D001
- Title: Monorepo
- Status: PROVISIONAL
- Decision: Gra, strona, pakiety i treści będą w jednym repozytorium.
- Reason: Wspólna dokumentacja i spójne kontrakty produktu.
- Consequences: Docelowe katalogi apps, packages, content i docs; narzędzia monorepo wymagają późniejszego wyboru.
- Date: 2026-10-02

## D002

- ID: D002
- Title: Separate Game and Website apps
- Status: PROVISIONAL
- Decision: Oddzielne aplikacje apps/game i apps/website.
- Reason: Gra terenowa i marketing mają różne odpowiedzialności.
- Consequences: Niezależne interfejsy; zakup, aktywacja i konto nie są implementowane w Etapie 0.
- Date: 2026-10-02

## D003

- ID: D003
- Title: React/Vite for Game
- Status: PROVISIONAL
- Decision: GAME PWA użyje React + TypeScript + Vite.
- Reason: Podstawa interfejsu mobile-first i gry działającej offline.
- Consequences: Konfiguracja i zależności powstaną dopiero w zatwierdzonym etapie implementacji.
- Date: 2026-10-02

## D004

- ID: D004
- Title: Next.js for Website
- Status: PROVISIONAL
- Decision: WEBSITE użyje Next.js + TypeScript.
- Reason: Oddzielna strona marketingowa z wymaganiami SEO.
- Consequences: Wybór sposobu publikacji i obsługi zakupu pozostaje otwarty.
- Date: 2026-10-02

## D005

- ID: D005
- Title: Hybrid Ink + Quest Engine
- Status: PROVISIONAL
- Decision: Własny Quest Engine w czystym TypeScript jest źródłem prawdy mechanicznej; Ink / inkjs odpowiada za narrację.
- Reason: Wielowątkowa gra wymaga rozdzielenia mechaniki i tekstu.
- Consequences: Ink nie zarządza GPS, obecnością, inventory, wynikami zagadek, stanem lokacji ani globalną mechaniką. Kontrakty komunikacji wymagają późniejszego ustalenia.
- Date: 2026-10-02

## D006

- ID: D006
- Title: Composite endings
- Status: PROVISIONAL
- Decision: EndingProfile łączy primaryEnding, threadCodas[], specialDiscoveries[] i challengeConsequences[]; docelowo około 4–6 głównych profili.
- Reason: Konsekwencje wielu wątków bez tworzenia 30 osobnych zakończeń.
- Consequences: Potrzebne będą reguły ending resolvera i warianty epilogów.
- Date: 2026-10-02

## D007

- ID: D007
- Title: Offline-first
- Status: PROVISIONAL
- Decision: Po wcześniejszym przygotowaniu trasy gra działa bez internetu.
- Reason: Niezawodność terenowa ma najwyższy priorytet.
- Consequences: Należy później określić przygotowanie zasobów i zapis rozgrywki oraz sprawdzić je na urządzeniu offline.
- Date: 2026-10-02

## D008

- ID: D008
- Title: GPS as assistance only
- Status: PROVISIONAL
- Decision: GPS pomaga, ale nigdy nie jest jedyną możliwością kontynuacji.
- Reason: Warunki terenowe i brak poprawnego odczytu nie mogą blokować gry.
- Consequences: Zadania zależne od miejsca wymagają alternatywnej drogi kontynuacji, której szczegóły ustalimy później.
- Date: 2026-10-02

## D009

- ID: D009
- Title: ECO performance profile
- Status: PROVISIONAL
- Decision: Architektura przewiduje FULL, AUTO i ECO; ECO nie zmienia fabuły ani dostępnych zakończeń.
- Reason: Gra ma działać także na starszych smartfonach.
- Consequences: Koszt prezentacji będzie regulowany niezależnie od narracji; budżety ustalimy po baseline i testach na słabszym telefonie.
- Date: 2026-10-02

## D010

- ID: D010
- Title: FACT/TRADITION/LEGEND/DISPUTED/FICTIONALIZED
- Status: PROVISIONAL
- Decision: Każda treść umożliwia klasyfikację historyczną według tych pięciu kategorii.
- Reason: Rozróżnienie informacji źródłowych, przekazu i fikcji.
- Consequences: Treści wymagają oznaczeń i source IDs; legendy nie mogą być przedstawiane jako fakty.
- Date: 2026-10-02

## D011

- ID: D011
- Title: Model BRAID i wielowymiarowe wyniki zadań
- Status: PROVISIONAL
- Decision: Wątki rozgałęziają się i częściowo zbiegają przez konsekwencje oraz storylety. Wyniki obejmują solved_clean, solved_with_hint, assisted, skipped i failed.
- Reason: Realne i opóźnione konsekwencje bez eksplozji liczby scen.
- Consequences: Późniejsze dialogi, sceny, przedmioty i zakończenia uwzględniają wyniki; błędna odpowiedź nie powoduje trwałego soft-locka.
- Date: 2026-10-02
