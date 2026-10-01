# Rejestr Decyzji

Każda decyzja zawiera ID, Tytuł, Status, Decyzja, Uzasadnienie, Konsekwencje i Data. Dozwolone statusy: ZAAKCEPTOWANA (bezpośrednio zatwierdzona przez użytkownika), TYMCZASOWA (robocze założenie), ZASTAPIONA (zastąpiona, z odwołaniem do następcy) i ODRZUCONA (odrzucona z uzasadnieniem).

Wszystkie poniższe decyzje mają status TYMCZASOWA zgodnie z zakresem Etapu 0. Codex nie może samodzielnie nadać im statusu ZAAKCEPTOWANA. Przy zmianie zachowujemy poprzednią treść i status w historii wpisu; zastąpienie wskazuje ID nowej decyzji. Data oznacza datę rejestracji lub udokumentowanej zmiany.

## D001

- ID: D001
- Tytuł: Monorepo
- Status: TYMCZASOWA
- Decyzja: Gra, strona, pakiety i treści będą w jednym repozytorium.
- Uzasadnienie: Wspólna dokumentacja i spójne kontrakty produktu.
- Konsekwencje: Docelowe katalogi aplikacje, pakiety, tresc i dokumentacja; narzędzia monorepo wymagają późniejszego wyboru.
- Data: 2026-10-02

## D002

- ID: D002
- Tytuł: Osobne aplikacje gry i strony
- Status: TYMCZASOWA
- Decyzja: Oddzielne aplikacje aplikacje/gra i aplikacje/strona.
- Uzasadnienie: Gra terenowa i marketing mają różne odpowiedzialności.
- Konsekwencje: Niezależne interfejsy; zakup, aktywacja i konto nie są implementowane w Etapie 0.
- Data: 2026-10-02

## D003

- ID: D003
- Tytuł: React/Vite dla gry
- Status: TYMCZASOWA
- Decyzja: Gra PWA użyje React + TypeScript + Vite.
- Uzasadnienie: Podstawa interfejsu projektowanego przede wszystkim na smartfony i gry działającej offline.
- Konsekwencje: Konfiguracja i zależności powstaną dopiero w zatwierdzonym etapie implementacji.
- Data: 2026-10-02

## D004

- ID: D004
- Tytuł: Next.js dla strony
- Status: TYMCZASOWA
- Decyzja: Strona internetowa użyje Next.js + TypeScript.
- Uzasadnienie: Oddzielna strona marketingowa z wymaganiami SEO.
- Konsekwencje: Wybór sposobu publikacji i obsługi zakupu pozostaje otwarty.
- Data: 2026-10-02

## D005

- ID: D005
- Tytuł: Hybryda Ink + Silnik Gry
- Status: TYMCZASOWA
- Decyzja: Własny Silnik Gry w czystym TypeScript jest źródłem prawdy mechanicznej; Ink / inkjs odpowiada za narrację.
- Uzasadnienie: Wielowątkowa gra wymaga rozdzielenia mechaniki i tekstu.
- Konsekwencje: Ink nie zarządza GPS, obecnością, śladami i przedmiotami, wynikami zagadek, stanem lokacji ani globalną mechaniką. Kontrakty komunikacji wymagają późniejszego ustalenia.
- Data: 2026-10-02

## D006

- ID: D006
- Tytuł: Kompozytowe zakończenia
- Status: TYMCZASOWA
- Decyzja: ProfilZakonczenia łączy glowneZakonczenie, epilogiWatkow[], wazneOdkrycia[] i konsekwencjeZagadek[]; docelowo około 4–6 głównych profili.
- Uzasadnienie: Konsekwencje wielu wątków bez tworzenia 30 osobnych zakończeń.
- Konsekwencje: Potrzebne będą reguły mechanizmu zakończeń i warianty epilogów.
- Data: 2026-10-02

## D007

- ID: D007
- Tytuł: Działanie bez internetu
- Status: TYMCZASOWA
- Decyzja: Po wcześniejszym przygotowaniu trasy gra działa bez internetu.
- Uzasadnienie: Niezawodność terenowa ma najwyższy priorytet.
- Konsekwencje: Należy później określić przygotowanie zasobów i zapis rozgrywki oraz sprawdzić je na urządzeniu offline.
- Data: 2026-10-02

## D008

- ID: D008
- Tytuł: GPS wyłącznie jako pomoc
- Status: TYMCZASOWA
- Decyzja: GPS pomaga, ale nigdy nie jest jedyną możliwością kontynuacji.
- Uzasadnienie: Warunki terenowe i brak poprawnego odczytu nie mogą blokować gry.
- Konsekwencje: Zadania zależne od miejsca wymagają alternatywnej drogi kontynuacji, której szczegóły ustalimy później.
- Data: 2026-10-02

## D009

- ID: D009
- Tytuł: Profil wydajności EKO
- Status: TYMCZASOWA
- Decyzja: Architektura przewiduje PEŁNY, AUTOMATYCZNY i EKO; EKO nie zmienia fabuły ani dostępnych zakończeń.
- Uzasadnienie: Gra ma działać także na starszych smartfonach.
- Konsekwencje: Koszt prezentacji będzie regulowany niezależnie od narracji; budżety ustalimy po pomiarze bazowym i testach na słabszym telefonie.
- Data: 2026-10-02

## D010

- ID: D010
- Tytuł: FAKT/TRADYCJA/LEGENDA/SPORNE/FABULARYZOWANE
- Status: TYMCZASOWA
- Decyzja: Każda treść umożliwia klasyfikację historyczną według tych pięciu kategorii.
- Uzasadnienie: Rozróżnienie informacji źródłowych, przekazu i fikcji.
- Konsekwencje: Treści wymagają oznaczeń i identyfikatorów źródeł; legendy nie mogą być przedstawiane jako fakty.
- Data: 2026-10-02

## D011

- ID: D011
- Tytuł: Model warkocza i wielowymiarowe wyniki zadań
- Status: TYMCZASOWA
- Decyzja: Wątki rozgałęziają się i częściowo zbiegają przez konsekwencje oraz scenki opcjonalne. Wyniki obejmują ROZWIAZANA_SAMODZIELNIE, ROZWIAZANA_Z_PODPOWIEDZIA, ROZWIAZANA_Z_POMOCA, POMINIETA i NIEUDANA.
- Uzasadnienie: Realne i opóźnione konsekwencje bez eksplozji liczby scen.
- Konsekwencje: Późniejsze dialogi, sceny, przedmioty i zakończenia uwzględniają wyniki; błędna odpowiedź nie powoduje trwałego zablokowania rozgrywki.
- Data: 2026-10-02
