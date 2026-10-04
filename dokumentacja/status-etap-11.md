# Etap 11 — jakość i rekonesans

> Historyczny raport Etapu 11. Bieżący stan: [status projektu](status-projektu.md) i [rozpoczęty Etap 12](etap-12-pelna-kampania.md).

Data: 2026-10-03. Branch: `feat/etapy-7-11`.
Zakres: utwardzenie istniejącego vertical slice, bez rozszerzania kampanii.

| Obszar | AUTOMATYCZNIE POTWIERDZONE | RĘCZNIE POTWIERDZONE | NIETESTOWANE | WYMAGA TERENU |
| --- | --- | --- | --- | --- |
| Build, typecheck, lint | PASS lokalnie | — | — | — |
| Testy jednostkowe/integracyjne | 213 PASS; 1080 dróg mechanicznych/Ink zachowane | — | — | — |
| Architektura | Granice silników i brak cykli literalnych importów PASS | Przegląd źródeł przez agenta | — | — |
| Flagi | Analiza zapisów/odczytów PASS; 0 odczytów bez ustawiania | Dwie flagi nieczytane jawnie udokumentowane | — | — |
| Graf | Osiągalność scen, miejsc, wyborów, scenek i zakończeń; wymagane wątki i wyjścia zagadek PASS | — | — | — |
| Macierz adapterów | 8 wariantów drogi C; każda para wartości pięciu osi | — | Realny GPS i fizyczne audio | TAK |
| E2E Chromium | 14 PASS na produkcyjnym buildzie, w tym refresh/restore offline | — | Chrome Android | TAK |
| Responsywność | 320, 360, 390, 412, 768, 1024 px; wszystkie widoki PASS | — | Obrót i duża czcionka systemowa na telefonie | TAK |
| Accessibility | axe WCAG A/AA, statyczny kontrast tekstu, landmarki, etykiety i nagłówki; klawiatura i fokus PASS | — | TalkBack, percepcja komunikatów i kontrast w słońcu | TAK |
| Zależności | npm audit: 0 podatności | Licencje i manifesty przejrzane przez agenta | — | — |
| CI config | YAML i wymagane kroki zweryfikowane lokalnie | — | Zdalny run GitHub Actions (bez push) | — |
| Rekonesans | — | — | Wszystkie cztery punkty | TAK |
| Fizyczny telefon | — | — | Cała procedura Android / Chrome | TAK |

„Ręcznie” w wierszach przeglądu kodu oznacza inspekcję agenta, nie próbę
człowieka na telefonie. Żaden test terenowy ani telefon nie otrzymał PASS.

## Dowody i ograniczenia

- Bramka wejściowa: 210 testów PASS oraz build/typecheck/lint PASS.
- Końcowa bramka: `npm run sprawdz`, `git diff --check`, `npm run test:e2e`.
- 213 testów = 8 fundamentu + 21 narracji + 67 silnika + 23 contentu + 94 UI/adapterów.
- 14 E2E = 8 wariantów macierzy + 6 szerokości z axe i kontrolą geometrii.
- Przy 320 px potwierdzono zasłanianie przycisku podpowiedzi podczas przewijania;
  lokalna poprawka `scroll-padding-bottom` uwzględnia stałą nawigację.
- Odczyty flag bez ustawienia blokują build; `final_lacznik` i
  `rozrozniono_warstwy` są jawnymi ostrzeżeniami flag ustawianych bez odczytu.
- Walidacja grafu dotyczy skończonego slice i jego enumeratora 1080 dróg,
  nie dowolnej przyszłej kampanii. Powiększenie contentu wymaga aktualizacji dróg.
- Offline smoke przygotowuje cache mapy online; świeży pierwszy start bez sieci
  nie jest obiecywany. Brak audio lub podkładu nie może blokować opowieści.
- CI nie uruchomiono na GitHub: etap kończy się lokalnym commitem, bez push.
- Pełne E2E zakończyło się kodem 0 (14 PASS). Na Windows w sandboxie runner
  blokował się przy zamykaniu serwera po testach; uruchomienie z dostępem
  do zamykania lokalnych procesów rozwiązało problem środowiska.

Procedury i puste formularze: [rekonesans-terenowy.md](rekonesans-terenowy.md).
Zależności, architektura i sposób uruchamiania: [jakosc-i-zaleznosci.md](jakosc-i-zaleznosci.md).

**GOTOWE DO REKONESANSU TERENOWEGO** — techniczny vertical slice.
To nie jest gotowy produkt, finalna fabuła ani zatwierdzone historyczne zagadki.
