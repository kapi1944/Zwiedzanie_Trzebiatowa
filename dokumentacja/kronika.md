# Kronika zdobytej wiedzy

Kronika jest projekcją istniejącego `GameState` i `WidokSesji`, bez drugiego
magazynu wiedzy. Pokazuje odwiedzone miejsca, przyznane przedmioty i ślady,
zapisane wyniki zagadek i użyte podpowiedzi, rozpoczęte lub rozstrzygnięte wątki,
przeczytane scenki oraz odkrycia przyznane przez resolver zakończeń.
Nie odczytuje banku 83 miejsc ani 249 kandydatów zadań.

Wiedza pochodzi wyłącznie z wpisów odblokowanych przez warunki sesji.
Legenda kaszana pojawia się po przeczytaniu sceny Baszty; wykorzystuje istniejący
przekaz i źródło `gmina_zabytki`. Nierozpoczęte wątki, przyszłe informacje,
odpowiedzi na zagadki i nieodkryte scenki pozostają ukryte.

## Warstwy

- **FAKT HISTORYCZNY**: informacja klasyfikowana jako FAKT z pewnością POTWIERDZONE.
- **LEGENDA / PRZEKAZ**: LEGENDA lub TRADYCJA, z objaśnieniem, że przekaz nie dowodzi wydarzenia.
- **FABULARYZACJA GRY**: fikcja i zdarzenia wyprawy, w tym zdobycie przedmiotu czy wynik zagadki.
- **INFORMACJA DO WERYFIKACJI**: pozostałe informacje, także dawne wpisy FAKT bez określonej pewności.

Poziom pewności i potrzeba weryfikacji towarzyszą informacjom historycznym.
Bibliografia znajduje się w rozwijanej sekcji wpisu. Źródła nie są automatycznie
pobierane z sieci; lokalny opis pozostaje dostępny offline.

## Duża liczba wpisów i dostępność

Wyszukiwanie i filtr warstwy działają tylko na zdobytych wpisach. Strona zawiera
maksymalnie 20 kart; nie ujawnia liczby wszystkich nieodkrytych informacji.
Zmiana strony przenosi fokus na nagłówek listy, a licznik jest regionem statusu.
Kontrolki mają etykiety, układ mieści się na wąskim ekranie, długie teksty zawijają się.
Brak animacji, timerów, obrazów i nowych żądań sieciowych służy także trybowi EKO.

Po wznowieniu wpisy są wyliczane z zapisu i przypiętego pakietu offline.
Nie dodano pól do zapisu ani nowych zdarzeń silnika. Filtry są lokalnym stanem UI.
Wątki pokazują nazwę i osiągnięty stan; nie ujawniają przyszłych fragmentów fabuły.

Testy obejmują ukrywanie danych, klasyfikację, źródła, zapis/wznowienie oraz
1000 zdobytych wpisów przy ograniczonej liczbie kart. Test przeglądarkowy obejmuje
320 px, EKO, wyszukiwanie, filtrowanie, axe i wznowienie offline.
Próba w Chromium nie zastępuje odbioru na fizycznym telefonie ani TalkBack.

## Kontrola 2026-10-04

Build obu aplikacji i pakietów, typecheck, 273 testy (8 fundamentu, 21 narracji,
67 silnika, 66 treści, 111 UI), limity gzip oraz lint zmienionego kodu: PASS.
Graf: 1080 dróg slice i 154 świadectwa kampanii. `git diff --check`: PASS.
Pełny lint: FAIL przez dwa zastane błędy nieśledzonego skryptu użytkownika
`zastap_teksty_trzebiatow_v2.mjs`, którego nie zmieniono.

Scenariusz Chromium Kroniki: PASS (320 px, EKO, axe, filtry, offline).
Pierwsza próba przekroczyła czas oczekiwania na service worker; powtórzenie
po zakończeniu budowy przeszło. Proces Playwright zawiesił się przy zamykaniu
serwera preview po wyniku i został przerwany; nie jest to pełny PASS polecenia E2E.
Pozostałych scenariuszy E2E ani odbioru terenowego nie ponawiano.

Zachowano limity wydajności; wpis legendy wykorzystuje treść istniejącej sceny,
a opis epilogu pomocy skrócono do „Kronika zachowuje podpowiedzi i pomoc”.
Warunki i mechanika pozostają bez zmian.

[Status projektu](status-projektu.md) · [Etap 12](etap-12-pelna-kampania.md) ·
[Źródła](zrodla-contentu.md) · [Zakończenia](zakonczenia.md)
