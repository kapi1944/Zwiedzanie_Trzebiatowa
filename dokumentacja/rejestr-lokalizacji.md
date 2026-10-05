# Centralny rejestr lokalizacji — Etap 12

Źródło danych: [bank-miejsc.json](../tresc/kampania/bank-miejsc.json).
Dotychczasowy bank jest centralnym rejestrem autora: **83 osobne miejsca i 249
kandydatów zadań**. Nie powstał drugi katalog ani finalna trasa kampanii.
Identyfikatory `bank_01`–`bank_83`, nazwy i pochodzenie zachowano. Następnie
przeredagowano 249 poleceń zgodnie z zasadą obserwacji prawdziwego miasta;
obecny [model kandydatów zadań](bank-zadan-terenowych.md) nie wybiera finalnych zadań.
Rejestr nie jest pakietem runtime i nie jest wysyłany do aplikacji.

[Status projektu](status-projektu.md) · [Etap 12](etap-12-pelna-kampania.md) ·
[rekonesans terenowy](rekonesans-terenowy.md)

## Podstawa opracowania

Odczyt lokalny: 2026-10-04. Rekord nr N odpowiada stronie N+4 encyklopedii
`Trzebiatow_Encyklopedia_miejsc_i_bank_zadan_v0.1.pdf` oraz stronie N+17
`Tajemnice_Trzebiatowa_Encyklopedia_100str_MAPA_PIERWSZA_v0.7.pdf`.
Typ pochodzi z kategorii starego banku. Krótki opis jest początkiem opracowania
encyklopedycznego v0.7, bez przenoszenia kluczy odpowiedzi do zadań.
Bibliografię S1–S24 rozwinięto ze stron 88–89 v0.1 do tytułów i adresów URL.

Adresy źródeł przepisano z PDF, bez nowej weryfikacji internetowej; mają
`DO_WERYFIKACJI`. PDF-y pozostają lokalnymi, nieśledzonymi materiałami
użytkownika. Walidacja rejestru nie wymaga ich obecności ani dostępu do sieci.
Podpis „fotografia rzeczywista lokacji” nie jest dowodem identyfikacji punktu,
dostępności ani wykonania rekonesansu. Dotyczy to także mniej opisanych punktów,
np. Kamienia Ofiarnego i Zieleńca WAGANT, których nie usunięto ani nie scalono.

## Format rekordu

Plik JSON zawiera tablicę rekordów. Wszystkie poniższe pola są obowiązkowe.

| Pole | Format i znaczenie |
| --- | --- |
| `id` | Stabilne `bank_01`–`bank_83`; nie jest identyfikatorem sceny ani miejsca runtime |
| `nazwa` | Zachowana nazwa osobnego punktu z banku |
| `typ` | Kategoria encyklopedii, np. `Detal architektoniczny`, `Archeologia`, `Mural / legenda`; nie ogranicza punktu do budynku |
| `opis` | Krótki opis źródłowy, 1–700 znaków; nie potwierdza aktualnego stanu terenowego |
| `zrodla` | Niepusta lista źródeł z unikalnymi identyfikatorami w obrębie rekordu; format poniżej |
| `klasyfikacjaInformacji` | `FAKT`, `TRADYCJA`, `LEGENDA`, `SPORNE`, `FABULARYZOWANE` albo `DO_WERYFIKACJI` |
| `statusInformacji` | `POTWIERDZONE_ZRODLOWO` albo `DO_WERYFIKACJI`; obecnie wszystkie rekordy wymagają niezależnego sprawdzenia źródeł |
| `statusRekonesansu` | `POTWIERDZONE`, `WYMAGA_REKONESANSU` albo `DO_WERYFIKACJI`; obecnie wszystkie 83 mają `WYMAGA_REKONESANSU` |
| `wspolrzedne` | `null` albo obiekt z `szerokosc` (−90..90), `dlugosc` (−180..180), `idZrodla` i niepustym `uzasadnienie`; WGS84 |
| `statusWspolrzednych` | `DO_WERYFIKACJI` przy `null`; `POTWIERDZONE_ZRODLOWO` wyłącznie przy współrzędnych i wskazanym źródle |
| `powiazaniaFabularne` | Niepusta lista `{ motyw, opis, status: "PROPOZYCJA" }`; propozycje autorskie, nie fakty historyczne ani włączone wątki |
| `wykorzystanieWKampanii` | `{ status, idLokalizacji, uwagi }`; odniesienie wyłącznie do istniejącego runtime, opisane poniżej |
| `pochodzenie` | Zachowana adnotacja pochodzenia z banku v0.1; oznaczenie autora V nie jest rekonesansem |
| `obszar` | Zachowana dawna kategoria banku; nie używać jako adresu lub współrzędnych |
| `kandydaciZadan` | Od 1 do 3 niezależnych rekordów [modelu zadania terenowego](bank-zadan-terenowych.md#model-kandydata); obecnie 3 na miejsce, wszystkie odpowiedzi `null` / `WYMAGA_REKONESANSU` |

Źródło PDF: `{ id, rodzaj: "PDF", plik, strona }`, numer strony liczony od 1.
Źródło WWW: `{ id, rodzaj: "WWW", tytul, url, status }`. Identyfikatory
`s1`–`s24` odpowiadają kodom S1–S24 z encyklopedii. Źródła zadań znormalizowano
do pojedynczych id, np. `["s1", "s4", "s22"]`; walidator sprawdza ich obecność w rekordzie.
Położenie obiektu i bezpieczny punkt wykonania zadania nie są tym samym.
Obecnie wszystkie współrzędne są `null`: robocze punkty runtime/OSM nie zostały
awansowane do potwierdzonych współrzędnych rejestru. Nie dodano promieni GPS.

Klasyfikacja określa charakter informacji. Niezweryfikowane opisy encyklopedii
nie są oznaczane jako `FAKT`; ich poziom pewności to `NIEPEWNE`.
Każdy opis ma rekord `informacjeHistoryczne` z cytowaniem obu wersji PDF.
Format i zasady: [warstwa źródłowa](zrodla-contentu.md).

## Istniejące wykorzystanie w kampanii

`WYKORZYSTANE` wskazuje konkretny punkt obserwacji istniejącego runtime;
`POWIAZANE_Z_RUNTIME` opisuje kontekst obiektu nadrzędnego;
`BANK_KANDYDATOW` oznacza brak obecnego użycia, z pustą listą `idLokalizacji`.
Ostatni status nie oznacza odrzucenia ani zaplanowania finalnej trasy.

| Rekord rejestru | Lokalizacja runtime | Status |
| --- | --- | --- |
| `bank_01` Rynek | `rynek` | WYKORZYSTANE |
| `bank_03` Ratusz Miejski | `rynek`, `ratusz` | POWIAZANE_Z_RUNTIME: budynek nadrzędny, osobny od wieżyczki |
| `bank_06` Wieża ratuszowa, zegary i hejnał | `ratusz` | WYKORZYSTANE: obecne zadanie zegara |
| `bank_07` Sgraffito Hansken | `hansken` | WYKORZYSTANE |
| `bank_12` Kościół Macierzyństwa NMP | `kosciol` | WYKORZYSTANE |
| `bank_20` Pałac | `palac` | WYKORZYSTANE |
| `bank_31` Baszta Kaszana | `baszta` | WYKORZYSTANE |
| `bank_32` Mury obronne | `mury` | WYKORZYSTANE: obecne zadanie zachodniego odcinka |

Pozostałe 75 rekordów ma `BANK_KANDYDATOW`. Rynek/Ratusz to historyczna nazwa
miejsca runtime; nie scala `bank_01` i `bank_03`. Kościół, wieża, taras i
dzwony, pałac i wnętrza, most i rzeźby, poszczególne bramy oraz murale zachowują
osobne identyfikatory i zadania. Powiązanie nie importuje nowych miejsc do gry.

## Walidacja i utrzymanie

`schematKandydataMiejsca` sprawdza format każdego rekordu;
`schematRejestruMiejsc` dodatkowo wymaga dokładnie 83 miejsc i pełnego zestawu
identyfikatorów, odrzuca duplikaty id/nazw/źródeł, niepełne rekordy, brakujące
źródła zadań, sprzeczne statusy współrzędnych i wykorzystania oraz powtórzone
powiązania runtime. `odczytajKampanie` sprawdza, czy odniesienia prowadzą do
istniejących lokalizacji i czy każda lokalizacja runtime ma dokładnie jeden odpowiednik
`WYKORZYSTANE` w rejestrze. Są to kontrole kompletności i spójności danych,
nie dowód prawdziwości historycznej ani geograficznej.

Walidacja działa w istniejącym pipeline `npm run build:tresc` (po budowie
pakietów), pełnym `npm run build` i `npm run test`. Testy kampanii odrzucają
brak i podmianę miejsca, scalanie nazw, brakujące metadane i pozorne
potwierdzenie GPS. Test SHA-256 chroni zachowane id i nazwy 83 miejsc.
Polecenia zadań przeszły zamówioną redakcję; aktualne testy chronią komplet
249 kandydatów, ich statusy, klucze i brak automatycznej aktywacji w kampanii.
Nie sortować miejsc według trasy ani nie renumerować identyfikatorów.

Etap 12 pozostaje **CZĘŚCIOWO GOTOWE**. Rejestr jest narzędziem autora,
a wszystkie miejsca nadal **WYMAGA_REKONESANSU**.

## Wyniki kontroli rejestru — 2026-10-04

Historyczne wyniki porządkowania lokalizacji, przed redakcją poleceń zadań.
Bieżące wyniki: [bank zadań terenowych](bank-zadan-terenowych.md#wyniki-kontroli--2026-10-04).

- PASS: pełny build i 239 testów (8 fundamentu, 21 narracji, 67 silnika, 39 treści, 104 UI).
- PASS: typecheck workspace, treści i E2E; graf 1080 dróg slice i 153 świadectwa kampanii.
- PASS: budżety gzip/lazy, Biome na 99 śledzonych plikach, linki lokalne i `git diff --check`.
- PASS: porównanie z poprzednim rejestrem zachowuje każde wcześniejsze pole wszystkich 83 rekordów.
- FAIL: root `npm run lint` — dwa zastane błędy importów/formatowania w nieśledzonym skrypcie użytkownika `zastap_teksty_trzebiatow_v2.mjs`; nie zmieniano tego pliku.
- E2E nie ponawiano w tej zmianie rejestru autora; wynik 16/16 w statusie projektu dotyczy wcześniejszego commita. Rekonesansu ani prób na fizycznym telefonie nie przeprowadzono.
