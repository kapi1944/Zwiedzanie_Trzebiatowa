# Silnik Narracji — Etap 2

Silnik Narracji znajduje się w `pakiety/silnik-narracji`. Jest niezależnym modułem TypeScript bez Reacta i DOM. Przyjmuje skompilowany JSON Ink i zwraca dane, które później będzie mógł prezentować React. W tym etapie aplikacje nie importują silnika; początkowy pakiet gry pozostaje bez inkjs.

## Wybór technologii

Research wykonano 2026-10-02 przed instalacją, na podstawie dokumentacji i metadanych npm.

| Narzędzie | Wersja | Licencja | Rola i powód wyboru |
| --- | --- | --- | --- |
| Ink (inkle) | 1.2.1 | MIT | Oficjalny język narracyjny; najnowsze stabilne wydanie, format historii JSON 21 |
| inkjs | 2.4.0 | MIT | Port wskazywany przez twórców Ink, runtime Node i przeglądarkowy bez DOM i zależności runtime; wbudowany kompilator |
| Vitest | 5.0.3 | MIT | Testy jednostkowe w środowisku Node, wyłącznie zależność deweloperska pakietu |

Nie instalujemy silnika C# Ink, inklecate ani Inky do aplikacji. Build pakietu kompiluje wyłącznie uniwersalny runtime TypeScript. Testy kompilują lokalny fixture przez `inkjs/full`. Runtime importuje tylko `inkjs`, bez kompilatora. Ink 1.2.1 i inkjs 2.4.0 deklarują format historii 21; nie oznacza to automatycznej zgodności dowolnych przyszłych skryptów i zapisów. Historia demonstracyjna została skompilowana i uruchomiona w Node.

Źródła: [wydanie Ink 1.2.1](https://github.com/inkle/ink/releases/tag/v1.2.1), [licencja Ink](https://github.com/inkle/ink/blob/v1.2.1/LICENSE.txt), [dokumentacja inkjs 2.4.0](https://github.com/y-lohse/inkjs/tree/v2.4.0), [licencja inkjs](https://github.com/y-lohse/inkjs/blob/v2.4.0/LICENSE.md), [API runtime Ink](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md).

## Odpowiedzialności

Docelowy przepływ: Silnik Gry ↔ Most Narracji ↔ Silnik Narracji / inkjs → RamkaNarracji → React.

- Ink opisuje tekst, wybory narracyjne, rozgałęzienia i lokalną pamięć opowieści.
- Silnik Narracji utrzymuje pozycję w historii, wykonuje kontrolowane operacje runtime i parsuje tagi.
- Most Narracji przekazuje wyłącznie jawne powiązania zmiennych oraz odczytuje dozwolone sygnały.
- Silnik Gry z Etapu 3 jest właścicielem mechaniki i danych kanonicznych; aplikacje jeszcze go nie uruchamiają.

Wynik zagadki, posiadany przedmiot, stan wątku, GPS i zakończenia mechaniczne nie są rozstrzygane przez Ink. Silnik Narracji transportuje bezpieczne identyfikatory sygnałów bez znajomości ich znaczenia. Odbiorca jawnie przekazuje zdarzenie domenowe do Silnika Gry; silnik waliduje je i rozstrzyga mechanikę.

## Publiczne API

| Eksport | Działanie |
| --- | --- |
| `utworzSesjeNarracji(tresc, most?)` | Nowa sesja ze skompilowanego JSON, opcjonalnie z mostem |
| `kontynuujNarracje(sesja)` | Jeden krok tekstowy Ink, zwraca ramkę |
| `wybierzOpcjeNarracji(sesja, indeks)` | Wybór dostępnej opcji, bez automatycznego konsumowania tekstu |
| `eksportujStanNarracji(sesja)` | Zapis JSON stanu narracyjnego |
| `przywrocStanNarracji(sesja, zapis)` | Przywrócenie stanu do sesji tej samej historii |
| `parsujTagiNarracji(tagi)` | Kontrolowane parsowanie tagów |
| `MostNarracji` | Mapowanie kontekstu i filtrowanie sygnałów |

`RamkaNarracji` zawiera `akapity`, `opcje` (indeks, tekst, tagi), `tagi` i `moznaKontynuowac`. W tym etapie krok odpowiada jednej linii zwracanej przez Ink, więc akapity zawierają zero lub jeden element. Dopóki `moznaKontynuowac` jest prawdą, odbiorca kontynuuje pobieranie. Gdy jest fałszem, wybiera opcję albo rozpoznaje koniec po pustej liście opcji. Ponowny odczyt na zatrzymaniu zwraca opcje bez powtarzania tekstu i sygnałów ostatniej linii.

Sesja jest nieprzezroczystym uchwytem; nie udostępnia obiektu Story, mutowania zmiennych ani wiązania funkcji JavaScript. Indeks wyboru musi być całkowity i dostępny w aktualnym punkcie historii. Błędy są zgłaszane jako wyjątki; późniejszy odbiorca powinien je obsłużyć.

## Kontekst i Most Narracji

`KontekstNarracji` jest współdzielonym kontraktem z `typy-wspolne`, re-eksportowanym przez Silnik Narracji. Zawiera flagi, wyniki zagadek, stany wątków, ślady i przedmioty, powinowactwa, odwiedzone lokalizacje i dokonane wybory. To uproszczona kopia danych wejściowych, bez implementacji mechaniki.

Most przyjmuje kontekst i listę `PowiazanieNarracji`: `zmiennaInk`, `obszar`, `klucz`. Przykład: `{ zmiennaInk: "zna_trop", obszar: "flagi", klucz: "trop" }` wymaga w Ink `VAR zna_trop = false`. Dla słowników przekazuje wartość prostą, dla kolekcji — informację boolean o obecności identyfikatora. Bez powiązania dane nie trafiają do Ink. Brak danych, brak zmiennej Ink lub niezgodny typ powodują błąd.

`aktualizujKontekst` kopiuje nowy kontekst. Silnik ponownie stosuje wskazane dane przy tworzeniu sesji, przed kontynuacją i wyborem oraz po przywróceniu. Zmiana zmiennej przez Ink nie zmienia oryginalnych danych ani kontekstu mostu. Autor nie powinien przypisywać wartości do zmiennych dostarczanych przez most. Lokalne zmienne narracyjne, np. `droga`, pozostają własnością Ink.

`odczytajSygnaly(ramka.tagi)` zwraca wyłącznie dozwolone sygnały. Nie wykonuje żadnej mechaniki, nie modyfikuje kontekstu i nie uruchamia callbacków. Nie rejestrujemy funkcji EXTERNAL; historie wymagające zewnętrznych funkcji są odrzucane.

## Model Warkocza

Demonstracja `pakiety/silnik-narracji/testy/fixtures/testowa.ink` łączy:

START → zapis albo pamięć → różne krótkie fragmenty → wspólny plac → późniejszy tekst zależny od zmiennej `droga` → kolejny wybór.

Konwergencja łączy przebieg, lecz nie usuwa pamięci wyboru. Dwa wątki narracyjne wracają do wspólnej sceny, a opóźniona konsekwencja przywraca ich indywidualny charakter. Nie powstaje pełne drzewo osobnych kampanii ani system zarządzania wątkami mechaniki.

## Serializacja

Wewnątrz używamy `story.state.ToJson()` i `story.state.LoadJson()`. Publiczny zapis zawiera `wersja: 1`, dokładną skompilowaną `tresc` oraz `stanInk`. Powielenie treści w zapisie to prosty sposób odrzucenia innej historii bez dodatkowych zależności; zapis nie jest jeszcze zoptymalizowanym formatem produkcyjnym.

Nową instancję tworzymy z tej samej treści, przywracamy zapis, następnie kontynuujemy. Przywrócenie najpierw ładuje stan do tymczasowej instancji; błędny zapis nie zastępuje działającej sesji. Aktualny kontekst mostu ma pierwszeństwo przed jego kopią w stanie Ink.

Zapis obejmuje tylko narrację, nie kanoniczny stan gry i nie historię już wyświetlonych ramek. Nie dodajemy magazynu zapisu, migracji, IndexedDB ani gwarancji zgodności po zmianie treści/inkjs.

## Tagi

Allow-list wartości prezentacyjnych obejmuje:

- `dzwiek:przewrocenie_kartki`
- `nastroj:tajemnica`
- `kronika:hansken`

Sygnały mają postać `sygnal:<identyfikator>`, gdzie identyfikator spełnia `[a-z][a-z0-9_]*`. Nie ma listy znaczeń mechanicznych. Most ponownie waliduje strukturę również dla tagów przekazanych bezpośrednio do `odczytajSygnaly`.

Parser przyjmuje zapis z opcjonalnym początkowym `#`, usuwa zewnętrzne odstępy i kontroluje zarówno rodzaj, jak i wartość. Nieznane lub niepoprawne tagi są ignorowane. Nowe wartości prezentacyjne wymagają jawnej zmiany parsera i testów. Nowe poprawne identyfikatory sygnałów nie wymagają zmiany runtime. Tagi dźwięku nie odtwarzają audio; identyfikatory kroniki nie są twierdzeniami historycznymi. Nie interpretujemy tekstu jako JavaScript.

## Weryfikacja

Granica zależności: Pakiet Gry → kompilacja treści → Silnik Narracji. Pakiet Gry dostarcza skompilowany JSON, a runtime nie odwołuje się do katalogu konkretnej gry. `npm run build --workspace=@zwiedzanie/silnik-narracji` buduje wyłącznie moduł i deklaracje typów. Fixture techniczny jest kompilowany w pamięci podczas testów i nie trafia do produkcyjnego builda. `npm run typecheck` obejmuje również testy i konfigurację Vitest. `npm run test` buduje repo, uruchamia dotychczasowe smoke testy oraz Vitest w Node. Testy obejmują obie drogi, pamięć wyboru, konwergencję, zapis/przywrócenie, końce historii, błędne dane, most i odrzucenie zewnętrznych funkcji.
