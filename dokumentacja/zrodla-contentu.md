# Warstwa źródłowa contentu

Etap 12 pozostaje częściowo gotowy. Technicznie gotowe są model i walidacja;
83 opisy banku wymagają dalszego sprawdzenia. Nie wykonano nowej weryfikacji
WWW ani rekonesansu. Mechanika i wybór zadań kampanii pozostają bez zmian.

`informacjeHistoryczne` to lista twierdzeń z polami:

| Pole | Znaczenie |
| --- | --- |
| `id` | Identyfikator twierdzenia |
| `tekst` | Treść z jawnym oznaczeniem niepewności, jeżeli występuje |
| `zrodla` | Cytowania: `opisBibliograficzny` oraz `rodzajZrodla` |
| `klasyfikacja` | FAKT, TRADYCJA, LEGENDA, SPORNE, FABULARYZOWANE, DO_WERYFIKACJI |
| `poziomPewnosci` | POTWIERDZONE, PRAWDOPODOBNE, NIEPEWNE, SPRZECZNE_ŹRÓDŁA |
| `wymagaDodatkowejWeryfikacji` | Sprawdzenie źródeł; niezależne od rekonesansu |

Rodzaje źródeł: `ENCYKLOPEDIA_ROBOCZA`, `OPRACOWANIE`, `REJESTR_ZABYTKOW`,
`SERWIS_INSTYTUCJONALNY`, `RELACJA`, `INNE`, `DO_WERYFIKACJI`.
PDF/WWW określają nośnik, a nie jakość źródła. Cytowanie powinno wskazywać
plik i stronę PDF albo autora, tytuł, adres i konkretny fragment.

Każdy rekord banku ma obowiązkową listę informacji. Obecne 83 rekordy cytują
opis roboczy z obu zapisanych encyklopedii, z numerami stron PDF.
Dwie wersje opracowania nie stanowią dwóch niezależnych potwierdzeń.
Nie przepisujemy automatycznie bibliografii WWW jako dowodu każdego zdania.
Złożone opisy trzeba przy dalszej pracy rozbić na osobne twierdzenia i przypisać
im konkretne dowody; obecny rekord obejmuje cały opis jako NIEPEWNE.

Ten sam schemat jest dostępny opcjonalnie w scenach i elementach kampanii,
w tym wiedzy. Opcjonalność zachowuje zgodność istniejących pakietów i zapisów.
Brak nowych metadanych w starszym elemencie nie oznacza POTWIERDZONE.
Dotychczasowe `idZrodla` i klasyfikacje nadal obowiązują; ich walidacja wymaga
cytowań dla contentu historycznego i sprawdza odwołania do katalogu źródeł.
Katalog dopuszcza dodatkowe `rodzajZrodla` bez zmiany istniejących wpisów.

Walidator nowych twierdzeń odrzuca brak cytowania poza FABULARYZOWANE,
brak rodzaju źródła, FAKT bez POTWIERDZONE, brak dodatkowej weryfikacji przy
niższej pewności i SPRZECZNE_ŹRÓDŁA bez dwóch różnych cytowań.
Nie analizuje semantyki zdań ani autentyczności dowodów. Redaktor musi
oznaczyć niepewne twierdzenie w tekście i nie przedstawiać go graczowi jako faktu.
POTWIERDZONE wymaga dowodu dotyczącego konkretnego twierdzenia; legenda
może mieć potwierdzone istnienie przekazu, co nie dowodzi wydarzenia z legendy.

Walidacja jest wykonywana podczas `npm run build:tresc`, testy regresji przez
`npm test`. Bank pozostaje materiałem autora, niewłączanym do pakietu gry.

Powiązania: [rejestr miejsc](rejestr-lokalizacji.md),
[bank zadań](bank-zadan-terenowych.md), [status](status-projektu.md),
[Etap 12](etap-12-pelna-kampania.md).
