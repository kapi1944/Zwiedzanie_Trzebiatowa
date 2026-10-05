# Snapshot UI BEFORE — Visual Pass 1.0

Data: 2026-10-05. Rzeczywista aplikacja z aktualnego builda, Chromium headless.
Nie zmieniano CSS, komponentów, tekstów, motywów ani mechaniki. Wcześniejsze
zmiany working tree zostały zachowane. Bez commita i push.

**40 PNG: 20 podstawowych + 20 dodatkowych kadrów.**
Viewport mobile: **390 × 844**. Viewport desktop: **1280 × 900**.
Podstawowe obrazy korzystają z fullPage: ich wysokość odpowiada całej stronie,
nie wysokości viewportu. Wszystkie strony zmieściły się poniżej limitu 4000 px.
Dodatkowe kadry mają dokładne rozmiary viewportu i powstały przez przewijanie.
Nie ukrywano nawigacji, nie wstrzykiwano CSS ani nie retuszowano obrazów.

## Mobile — wszystkie siedem ekranów

| Widok | LIGHT | DARK |
| --- | --- | --- |
| Start | [PNG](mobile/light/01-start.png) | [PNG](mobile/dark/01-start.png) |
| Opowieść | [PNG](mobile/light/02-opowiesc.png) | [PNG](mobile/dark/02-opowiesc.png) |
| Mapa | [PNG](mobile/light/03-mapa.png) | [PNG](mobile/dark/03-mapa.png) |
| Kronika | [PNG](mobile/light/04-kronika.png) | [PNG](mobile/dark/04-kronika.png) |
| Wątki | [PNG](mobile/light/05-watki.png) | [PNG](mobile/dark/05-watki.png) |
| O grze | [PNG](mobile/light/06-o-grze.png) | [PNG](mobile/dark/06-o-grze.png) |
| Ustawienia | [PNG](mobile/light/07-ustawienia.png) | [PNG](mobile/dark/07-ustawienia.png) |

## Desktop — reprezentatywne ekrany

| Widok | LIGHT | DARK |
| --- | --- | --- |
| Start | [PNG](desktop/light/start.png) | [PNG](desktop/dark/start.png) |
| Mapa | [PNG](desktop/light/mapa.png) | [PNG](desktop/dark/mapa.png) |
| Ustawienia | [PNG](desktop/light/ustawienia.png) | [PNG](desktop/dark/ustawienia.png) |

## Stan gry

Start: przed rozpoczęciem wyprawy. Kolejne widoki: po rzeczywistym przejściu
rynku i Hansken, przed zagadką przy kościele. Ścieżka została wykonana przez UI:
Rozpocznij opowieść → Najpierw chcę wysłuchać obu stron. → Pomiń zagadkę i idź dalej
→ Najpierw słucham, jak obraz staje się opowieścią.
Kronika pokazuje **6 rzeczywiście zdobytych wpisów**. Wątki pokazują stan
tej samej wyprawy. Aktywną lokacją jest Kościół Macierzyństwa NMP.
Nie fabrykowano zapisów, danych kampanii ani lokacji. Każda para viewport/motyw
korzystała z osobnego, tymczasowego kontekstu przeglądarki.

Ustawienia: motyw wybrany rzeczywistymi przyciskami, wydajność Automatyczny
(aktywny Pełny), ruch zgodny z systemem, audio domyślnie OFF (efekty 40%, muzyka 20%).
Mapa: istniejąca panorama i dane aplikacji; GPS nie był włączany.

## Dodatkowe kadry

Pokazują kontrolki i całą mapę z nawigacją, kartę celu, pierwsze wpisy Kroniki,
audio i dolne przyciski — miejsca zasłonięte przez stałą nawigację na fullPage.

- [mobile/light/02-opowiesc-panel-celu.png](mobile/light/02-opowiesc-panel-celu.png)
- [mobile/light/03-mapa-mapa-i-kontrolki.png](mobile/light/03-mapa-mapa-i-kontrolki.png)
- [mobile/light/03-mapa-panel-celu.png](mobile/light/03-mapa-panel-celu.png)
- [mobile/light/04-kronika-pierwsze-wpisy.png](mobile/light/04-kronika-pierwsze-wpisy.png)
- [mobile/light/07-ustawienia-audio.png](mobile/light/07-ustawienia-audio.png)
- [mobile/light/07-ustawienia-audio-dol.png](mobile/light/07-ustawienia-audio-dol.png)
- [mobile/dark/02-opowiesc-panel-celu.png](mobile/dark/02-opowiesc-panel-celu.png)
- [mobile/dark/03-mapa-mapa-i-kontrolki.png](mobile/dark/03-mapa-mapa-i-kontrolki.png)
- [mobile/dark/03-mapa-panel-celu.png](mobile/dark/03-mapa-panel-celu.png)
- [mobile/dark/04-kronika-pierwsze-wpisy.png](mobile/dark/04-kronika-pierwsze-wpisy.png)
- [mobile/dark/07-ustawienia-audio.png](mobile/dark/07-ustawienia-audio.png)
- [mobile/dark/07-ustawienia-audio-dol.png](mobile/dark/07-ustawienia-audio-dol.png)
- [desktop/light/mapa-mapa-i-kontrolki.png](desktop/light/mapa-mapa-i-kontrolki.png)
- [desktop/light/mapa-panel-celu.png](desktop/light/mapa-panel-celu.png)
- [desktop/light/ustawienia-audio.png](desktop/light/ustawienia-audio.png)
- [desktop/light/ustawienia-audio-dol.png](desktop/light/ustawienia-audio-dol.png)
- [desktop/dark/mapa-mapa-i-kontrolki.png](desktop/dark/mapa-mapa-i-kontrolki.png)
- [desktop/dark/mapa-panel-celu.png](desktop/dark/mapa-panel-celu.png)
- [desktop/dark/ustawienia-audio.png](desktop/dark/ustawienia-audio.png)
- [desktop/dark/ustawienia-audio-dol.png](desktop/dark/ustawienia-audio-dol.png)

## Zauważone problemy / ograniczenia — bez napraw

- Mapa znajduje się poniżej pierwszego ekranu telefonu, po nagłówku i rozbudowanej
  karcie aktywnej lokacji. Aby zobaczyć podkład, trzeba przewinąć stronę.
- Duże okrągłe znaczniki mapy zasłaniają fragmenty kartografii i etykiet. W DARK
  ich ciemne wypełnienie mocno odcina się od jasnego podkładu, który pozostaje jasny.
- Stała dolna nawigacja na obrazie fullPage występuje na wysokości końca
  początkowego viewportu i zasłania fragment treści. To ograniczenie tego typu
  capture, nie dowód, że treść jest niedostępna podczas normalnego przewijania.
  Dlatego dołączono dodatkowe kadry bez modyfikowania nawigacji.
- Nie wykryto błędów JavaScript ani poziomego przewijania. Nie wykonano testu
  fizycznego urządzenia ani geolokalizacji w terenie; jest to snapshot przeglądarkowy.

## Weryfikacja

- npm run build: **PASS**.
- node narzedzia/snapshot-ui.mjs: **PASS**, 40 PNG; proces sam zakończył się kodem 0.
- Wszystkie 40 plików istnieją; sprawdzono sygnatury PNG i szerokości,
  a dla kadrów także dokładne wysokości viewportów.
- Po zakończeniu serwer na porcie 4173 nie odpowiada: **port wolny**.
- Skrypt korzysta z istniejącego serwera podglądu E2E i zamyka każdy context,
  przeglądarkę oraz podgląd w finally. Brak zmian infrastruktury Playwright.

Lista plików, viewporty, typ capture i wysokości: [manifest.json](manifest.json).
Powtórzenie: npm run build, następnie node narzedzia/snapshot-ui.mjs.
