# Rekonesans terenowy vertical slice

Aktualnie **WYMAGA_REKONESANSU**: wszystkie 7 miejsc runtime, zero zatwierdzonych. Formularz poniżej dotyczy czterech miejsc slice; dla Ratusza, murów i Pałacu należy zastosować te same pola w osobnym protokole. Hansken jest wspólny dla slice i nowego zadania. [Zakres zadań Etapu 12](etap-12-pelna-kampania.md#rzeczywisty-content-i-rekonesans) · [status projektu](status-projektu.md).

Status wszystkich punktów: **NIETESTOWANE / WYMAGA TERENU**.
Wypełnia człowiek na miejscu. Puste pola nie oznaczają potwierdzenia.
Nie publikować prywatnych zdjęć ani danych osób postronnych w repozytorium.

| Pole | RYNEK | HANSKEN | KOSCIOL | BASZTA |
| --- | --- | --- | --- | --- |
| Data | | | | |
| Godzina | | | | |
| Pogoda | | | | |
| GPS (współrzędne punktu) | | | | |
| Dokładność GPS w metrach | | | | |
| Bezpieczny punkt postoju | | | | |
| Widoczność | | | | |
| Dostępność | | | | |
| Ruch uliczny | | | | |
| Bariery | | | | |
| Czytelność ekranu | | | | |
| Głośność otoczenia | | | | |
| Czas dojścia od poprzedniego punktu | | | | |
| Czas czytania | | | | |
| Sprawdzony detal | | | | |
| Zdjęcia referencyjne prywatne (lokalne odnośniki) | | | | |
| Uwagi | | | | |

Nie zatwierdzać roboczego detalu Hansken ani promieni GPS przed oględzinami.
Oceniać możliwość przejścia z GPS wyłączonym, bez wchodzenia na jezdnię
i bez blokowania przejścia. Mapa nie wyznacza bezpiecznej trasy pieszej.

## Telefon — Android / Chrome

Każdy przypadek ma obecnie status **NIETESTOWANE**. Wykonać na fizycznym
telefonie z produkcyjnym buildem udostępnionym przez HTTPS (localhost na
komputerze nie zapewnia bezpiecznego kontekstu telefonu).
Najpierw wykonać `npm ci`, `npm run sprawdz`, `npm run test:e2e`.
Zanotować model telefonu, wersję Androida i Chrome, datę i adres builda.
Nie usuwać istniejącego zapisu bez jego zabezpieczenia; użyć osobnego profilu.

| Przypadek | Procedura / oczekiwany rezultat | Status | Wynik, data, uwagi |
| --- | --- | --- | --- |
| Instalacja PWA | Otwórz stronę online, zaczekaj na gotowość offline, zainstaluj z menu Chrome; uruchom z ikony | NIETESTOWANE | |
| Pierwszy start | Rozpocznij; Rynek, wybory i zapis są czytelne; brak automatycznego pytania GPS | NIETESTOWANE | |
| Offline | Po przygotowaniu wyłącz sieć, przejdź drogę C; zamknij/odśwież i wznów zapis; mapa działa bez podkładu lub pokazuje fallback | NIETESTOWANE | |
| GPS allow | Włącz zgodę przy świadomym sprawdzeniu; wynik pokazuje dokładność/promień; ręczne potwierdzenie pozostaje dostępne | NIETESTOWANE | |
| GPS deny | Odmów dostępu; komunikat i ręczne potwierdzenie pozwalają kontynuować | NIETESTOWANE | |
| EKO | Wybierz EKO; przejdź zagadkę i mini-final, sprawdź zachowanie ustawienia po wznowieniu | NIETESTOWANE | |
| Audio | Włącz efekty/muzykę gestem; sprawdź głośność, OFF, retry i kontynuację przy braku audio offline | NIETESTOWANE | |
| Uśpienie ekranu | Zablokuj ekran w zagadce; sprawdź brak niekontrolowanego audio | NIETESTOWANE | |
| Powrót | Odblokuj po kilku minutach; postęp i zagadka pozostają zgodne, brak powielonych efektów | NIETESTOWANE | |
| Niski poziom baterii | Włącz systemowe oszczędzanie energii; sprawdź zapis, powrót, GPS i EKO; zanotuj rzeczywisty poziom baterii | NIETESTOWANE | |
| Obrót ekranu | Obróć w zagadce, mapie i ustawieniach; brak utraty stanu i zasłoniętych kontrolek | NIETESTOWANE | |
| Większa czcionka | Zwiększ systemową czcionkę i rozmiar wyświetlania; sprawdź wszystkie widoki, przewijanie i nawigację | NIETESTOWANE | |
| TalkBack | Przejdź start, zagadkę, status zapisu, ustawienia i finał czytnikiem; sprawdź kolejność i ogłoszenia | NIETESTOWANE | |

Po wykonaniu wpisać rzeczywisty wynik PASS/FAIL i dowód. Rekonesans oraz
telefon wymagają osobnego potwierdzenia człowieka; automat ich nie zastępuje.
