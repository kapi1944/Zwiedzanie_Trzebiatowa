# Tajemnice Trzebiatowa — Visual Pass 1

Data: 2026-10-05. Gałąź: `codex/etap-12-pelna-kampania`, obecny worktree.

## Zmiany

- Wspólne tokeny: padding panelu `clamp(20px, 3vw, 28px)`, odstęp sekcji 24px, promień 6px i lżejszy cień `0 2px 8px`. Dwie jasne powierzchnie ocieplono do papieru/kości słoniowej; zachowano istniejącą paletę DARK i mechanizm wyboru motywu.
- `.karta`, `.narracja`, `.powitanie`: spójne proporcje i padding, usunięcie zbędnych marginesów na początku/końcu treści. Kolejne H2 wewnątrz panelu mają odstęp i delikatną linię rozdzielającą sekcje.
- H1: zrównoważone łamanie wierszy i odstęp pod tytułem; H3: jawny rytm marginesów. Zachowano Georgia dla nagłówków i czytelny krój systemowy dla tekstów użytkowych. Polskie znaki w oglądanych treściach wyświetlają się prawidłowo.
- Przyciski, pola i filtry: spokojniejsze proporcje, wspólna interlinia pól, czytelniejsze etykiety, hover obramowania. Kontrolki zachowują minimalne wysokości 44–48px oraz dotychczasowy focus.
- Suwaki: wspólna powierzchnia toru, uchwyt w kolorze akcentu i zachowana obsługa klawiaturą. Checkboxy korzystają z koloru akcentu; przełączniki Ustawień zachowują dotychczasowy mechanizm. Pozostawiono reguły wymuszonych kolorów.
- Ustawienia na desktopie ograniczono do 36rem (576px). Naprawiono przesunięcie drugiego przycisku motywu powodowane wspólną regułą `button + button`.

Zmiany aplikacji dotyczą wyłącznie `style.css` i `motywy.css`. Nie zmieniono komponentów TSX, fabuły, danych, tras, mechaniki, zapisu ani funkcjonalności mapy. Zachowano reguły dolnej nawigacji, safe-area i odstępu końca treści. Zastane niezacommitowane pliki pozostawiono; bez commita i pushu.

## Kontrola Chromium

Przed zmianami i po końcowej korekcie obejrzano wszystkie 28 wariantów. Start przed wyprawą; pozostałe ekrany po normalnym przejściu rynku i Hansken, przed zagadką przy kościele. Kronika zawiera 6 zdobytych wpisów. Obejrzano pełne treści oraz dodatkowe fragmenty mapy, kart i formularza audio.

| Ekran | 390×844 LIGHT | 390×844 DARK | 1280×900 LIGHT | 1280×900 DARK |
| --- | --- | --- | --- | --- |
| Start | PASS | PASS | PASS | PASS |
| Opowieść | PASS | PASS | PASS | PASS |
| Mapa | PASS | PASS | PASS | PASS |
| Kronika | PASS | PASS | PASS | PASS |
| Wątki | PASS | PASS | PASS | PASS |
| O grze | PASS | PASS | PASS | PASS |
| Ustawienia | PASS | PASS | PASS | PASS |

Brak poziomego przewijania i błędów JavaScript w 28 wariantach. Sprawdzono hierarchię, odstępy, czytelność, powierzchnie, ramki i kontrolki. Dodatkowa kontrola Ustawień w czterech wariantach: wyrównanie wyboru motywu, hover i focus selecta, przełącznik ON/OFF, stan disabled/enabled przycisku audio oraz suwak zmieniany strzałką (40% → 45%) — PASS. Widoczny focus klawiatury suwaka potwierdzono pomiarem i screenshotem.

Lokalne artefakty kontroli (ignorowane przez Git): `test-results/visual-pass-1/przed/` i `test-results/visual-pass-1/po/`, po 50 screenshotów głównych widoków i fragmentów, manifesty oraz dodatkowe screenshoty kontrolek. To kontrola Chromium w zadanych viewportach; nie stanowi testu fizycznego telefonu ani pełnego audytu dostępności.

## Weryfikacja

- `npm.cmd run test --workspace=@zwiedzanie/gra`: **117/117 PASS**, 14 plików testów. Pierwsza próba zbiegła się z przebudową `dist` i zakończyła błędem braku `sw.js`; powtórka po zakończonym buildzie przeszła w całości.
- `npm.cmd run typecheck`: **PASS** dla całego repozytorium.
- `npm.cmd run build`: **PASS** dla całego repozytorium; po ostatniej korekcie selektora CSS ponowiono `npm.cmd run build --workspace=@zwiedzanie/gra`: **PASS**.
- Pełnego E2E nie uruchamiano: zakres zmian jest wyłącznie wizualny/CSS. Przechwytywanie screenshotów i kontrola kontrolek odbyły się w Chromium przez Playwright.

## Celowo później

Bogate ilustracje, tekstury pergaminu, dodatkowy krój pisma i większy redesign układu pozostają poza tym passem. Współczesny podkład mapy i oznaczenia roboczej treści pozostawiono. Nie przebudowywano systemu LIGHT/DARK ani dolnej nawigacji; nie dodawano ozdobników z innych epok.

## Kontynuacja — menu u góry

Na późniejsze wyraźne polecenie użytkownika „Przenieś na górę” przeniesiono istniejącą nawigację w `Aplikacja.tsx` bezpośrednio pod nagłówek. W `style.css` zmieniono dolny pasek na `position: sticky; top: 0`: dwa rzędy na mobile, jeden od szerokości 760px. Zmieniono kierunek cienia, obramowanie, safe-area i `scroll-padding-top`; usunięto dolną rezerwę miejsca. Link „Przejdź do treści” pozostaje nad paskiem pod względem warstw. Mechanika i kolory motywów pozostają bez zmian.

Weryfikacja po przeniesieniu: testy aplikacji **117/117 PASS**, repozytoryjne `npm.cmd run typecheck` **PASS**, `npm.cmd run build --workspace=@zwiedzanie/gra` **PASS**. Chromium: wszystkie 7 ekranów w 390×844 i 1280×900, LIGHT/DARK — **28/28 PASS**, bez poziomego scrolla i błędów JavaScript. Dodatkowo w czterech wariantach sprawdzono położenie menu pod nagłówkiem, przyklejenie podczas przewijania, przewijanie pola poniżej menu, zmianę widoku i link pomijający nawigację — **PASS**. Artefakty: `test-results/nawigacja-gorna/`. Bez pełnego E2E, commita i pushu.
