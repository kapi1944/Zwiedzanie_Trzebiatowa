# Plan commitów przed Visual Pass

Data: 2026-10-05.

Podstawa: aktualny git status --short --untracked-files=all: 31 zmienionych plików śledzonych i 133 untracked, przed zapisem planu.

Propozycja opiera się wyłącznie na ścieżkach. Nie czytano diffów, zawartości plików ani historii Git i nie uruchamiano testów. Cele opisują proponowany zakres, a nie potwierdzone działanie kodu. Lista obejmuje wszystkie pliki statusu oraz niniejszy nowy dokument.

## Pliki wspólne i zależności

- `aplikacje/gra/src/Aplikacja.tsx` i `aplikacje/gra/src/style.css`: przypisane głównie do systemu motywów; fragmenty integracji kroniki i wątków powinny należeć do commita 3. Dokładny podział wymaga późniejszego odczytu diffów.
- `pakiety/schemat-tresci/src/index.ts`, `pakiety/silnik-gry/src/index.ts` i `pakiety/silnik-gry/package.json`: przypisane do silnika. Fragmenty związane wyłącznie z budowaniem kampanii lub lint należy przypisać odpowiednio do commita 2 lub 5 po potwierdzeniu.
- Testy funkcji pozostają razem z funkcjami. Do commita 5 należą tylko potwierdzone poprawki lint i infrastruktury E2E; nie należy wydzielać tam wszystkich zmian testów.
- Proponowana kolejność: silnik i kampania, kronika i motywy, infrastruktura i scenariusze E2E, snapshoty, dokumentacja. Zależności między commitami 1–4 wymagają potwierdzenia w diffach; jeśli są nierozdzielne, połączyć wymagane części.
- Materiały promocyjne, PDF i skrypt roboczy są oddzielnymi kandydatami, niezależnymi od podziału zmian aplikacji. Sam fakt untracked nie przesądza o ich włączeniu do repozytorium.

## 1. Rozszerzenie silnika wyprawy i zakończeń

Cel: Zebrać powiązane zmiany stanu, warunków, przebiegu wyprawy, zakończeń i ich testów. Zachować razem kontrakt schematu i silnika.

Pliki:

- `pakiety/schemat-tresci/src/index.ts`
- `pakiety/silnik-gry/package.json`
- `pakiety/silnik-gry/src/index.ts`
- `pakiety/silnik-gry/src/krok.ts`
- `pakiety/silnik-gry/src/stan.ts`
- `pakiety/silnik-gry/src/warunki.ts`
- `pakiety/silnik-gry/src/zakonczenia.ts`
- `pakiety/silnik-gry/testy/gra.test.ts`
- `pakiety/silnik-gry/src/wyprawa.ts`

## 2. Sieć narracyjna i budowanie kampanii

Cel: Połączyć dane kampanii z narzędziami budowania i walidacji oraz testami kampanii.

Pliki:

- `narzedzia/graf-kampanii.ts`
- `narzedzia/narracja-slice.ts`
- `narzedzia/pakiet-kampanii.ts`
- `narzedzia/walidacja-contentu.ts`
- `narzedzia/zbuduj-tresc.ts`
- `testy/fundament.test.mjs`
- `testy/kampania.test.ts`
- `tresc/kampania/bank-miejsc.json`
- `tresc/kampania/kampania.ink`
- `tresc/kampania/kampania.json`
- `narzedzia/reguly-zakonczen.ts`
- `narzedzia/siec-narracyjna.ts`
- `tresc/kampania/siec-narracyjna.json`

## 3. Kronika i wątki gracza

Cel: Wydzielić prezentację kroniki i wątków wraz z testami oraz integracją sesji i potwierdzania obecności.

Pliki:

- `aplikacje/gra/src/PotwierdzenieObecnosci.tsx`
- `aplikacje/gra/src/sesja-gry.ts`
- `aplikacje/gra/testy/kampania-gps.test.tsx`
- `aplikacje/gra/src/WidokKroniki.tsx`
- `aplikacje/gra/src/kronika.ts`
- `aplikacje/gra/testy/kronika.test.tsx`
- `aplikacje/gra/testy/watki.test.tsx`

## 4. System motywów UI

Cel: Wydzielić motywy, style i testy motywów, wraz z odpowiednimi fragmentami integracji w aplikacji.

Pliki:

- `aplikacje/gra/index.html`
- `aplikacje/gra/src/Aplikacja.tsx`
- `aplikacje/gra/src/mapa/pergamin.css`
- `aplikacje/gra/src/style.css`
- `aplikacje/gra/src/motyw.ts`
- `aplikacje/gra/src/motywy.css`
- `aplikacje/gra/testy/motyw.test.tsx`
- `testy/e2e/motywy.spec.ts`

## 5. Poprawki lint i infrastruktury E2E

Cel: Wydzielić konfigurację i obsługę uruchamiania E2E. Sam status nie potwierdza, które zmiany naprawiają lint; przypisanie takich fragmentów wymaga późniejszego odczytu diffów.

Pliki:

- `playwright.config.ts`
- `testy/e2e/serwer-podgladu.ts`

## 6. Scenariusz E2E kampanii

Cel: Wydzielić zmiany scenariusza kampanii po zmianach funkcjonalnych i infrastrukturalnych.

Pliki:

- `testy/e2e/kampania.spec.ts`

## 7. Narzędzie snapshotów UI

Cel: Dodać mechanizm wykonywania snapshotów wraz z instrukcją i manifestem.

Pliki:

- `dokumentacja/ui-snapshot/README.md`
- `dokumentacja/ui-snapshot/manifest.json`
- `narzedzia/snapshot-ui.mjs`

## 8. Snapshoty UI desktop

Cel: Zapisać komplet odniesienia dla widoków desktop w obu motywach po wdrożeniu zmian UI.

Pliki:

- `dokumentacja/ui-snapshot/desktop/dark/mapa-mapa-i-kontrolki.png`
- `dokumentacja/ui-snapshot/desktop/dark/mapa-panel-celu.png`
- `dokumentacja/ui-snapshot/desktop/dark/mapa.png`
- `dokumentacja/ui-snapshot/desktop/dark/start.png`
- `dokumentacja/ui-snapshot/desktop/dark/ustawienia-audio-dol.png`
- `dokumentacja/ui-snapshot/desktop/dark/ustawienia-audio.png`
- `dokumentacja/ui-snapshot/desktop/dark/ustawienia.png`
- `dokumentacja/ui-snapshot/desktop/light/mapa-mapa-i-kontrolki.png`
- `dokumentacja/ui-snapshot/desktop/light/mapa-panel-celu.png`
- `dokumentacja/ui-snapshot/desktop/light/mapa.png`
- `dokumentacja/ui-snapshot/desktop/light/start.png`
- `dokumentacja/ui-snapshot/desktop/light/ustawienia-audio-dol.png`
- `dokumentacja/ui-snapshot/desktop/light/ustawienia-audio.png`
- `dokumentacja/ui-snapshot/desktop/light/ustawienia.png`

## 9. Snapshoty UI mobile

Cel: Zapisać komplet odniesienia dla widoków mobile w obu motywach po wdrożeniu zmian UI.

Pliki:

- `dokumentacja/ui-snapshot/mobile/dark/01-start.png`
- `dokumentacja/ui-snapshot/mobile/dark/02-opowiesc-panel-celu.png`
- `dokumentacja/ui-snapshot/mobile/dark/02-opowiesc.png`
- `dokumentacja/ui-snapshot/mobile/dark/03-mapa-mapa-i-kontrolki.png`
- `dokumentacja/ui-snapshot/mobile/dark/03-mapa-panel-celu.png`
- `dokumentacja/ui-snapshot/mobile/dark/03-mapa.png`
- `dokumentacja/ui-snapshot/mobile/dark/04-kronika-pierwsze-wpisy.png`
- `dokumentacja/ui-snapshot/mobile/dark/04-kronika.png`
- `dokumentacja/ui-snapshot/mobile/dark/05-watki.png`
- `dokumentacja/ui-snapshot/mobile/dark/06-o-grze.png`
- `dokumentacja/ui-snapshot/mobile/dark/07-ustawienia-audio-dol.png`
- `dokumentacja/ui-snapshot/mobile/dark/07-ustawienia-audio.png`
- `dokumentacja/ui-snapshot/mobile/dark/07-ustawienia.png`
- `dokumentacja/ui-snapshot/mobile/light/01-start.png`
- `dokumentacja/ui-snapshot/mobile/light/02-opowiesc-panel-celu.png`
- `dokumentacja/ui-snapshot/mobile/light/02-opowiesc.png`
- `dokumentacja/ui-snapshot/mobile/light/03-mapa-mapa-i-kontrolki.png`
- `dokumentacja/ui-snapshot/mobile/light/03-mapa-panel-celu.png`
- `dokumentacja/ui-snapshot/mobile/light/03-mapa.png`
- `dokumentacja/ui-snapshot/mobile/light/04-kronika-pierwsze-wpisy.png`
- `dokumentacja/ui-snapshot/mobile/light/04-kronika.png`
- `dokumentacja/ui-snapshot/mobile/light/05-watki.png`
- `dokumentacja/ui-snapshot/mobile/light/06-o-grze.png`
- `dokumentacja/ui-snapshot/mobile/light/07-ustawienia-audio-dol.png`
- `dokumentacja/ui-snapshot/mobile/light/07-ustawienia-audio.png`
- `dokumentacja/ui-snapshot/mobile/light/07-ustawienia.png`

## 10. Dokumentacja projektu i funkcjonalności

Cel: Zebrać opis bieżącego stanu projektu, kampanii, motywów, kroniki, lokalizacji i źródeł.

Pliki:

- `README.md`
- `dokumentacja/etap-12-pelna-kampania.md`
- `dokumentacja/status-projektu.md`
- `dokumentacja/zakonczenia.md`
- `dokumentacja/bank-zadan-terenowych.md`
- `dokumentacja/kronika.md`
- `dokumentacja/motywy-ui.md`
- `dokumentacja/rejestr-lokalizacji.md`
- `dokumentacja/siec-narracyjna.md`
- `dokumentacja/zrodla-contentu.md`

## 11. Spis worktree i plan commitów

Cel: Zachować dokumenty organizujące obecne zmiany.

Pliki:

- `dokumentacja/status/WORKTREE_BEFORE_VISUAL_PASS_1.md`
- `dokumentacja/status/PLAN_COMMITOW_PRZED_VISUAL_PASS.md`

## 12. Materiały encyklopedyczne PDF

Cel: Wydzielić dokumenty źródłowe PDF z katalogu głównego.

Pliki:

- `Tajemnice_Trzebiatowa_Encyklopedia_100str_MAPA_PIERWSZA_v0.7.pdf`
- `Tajemnice_Trzebiatowa_Encyklopedia_100str_gotyk_realne_zdjecia_v0.6.pdf`
- `Trzebiatow_Encyklopedia_miejsc_i_bank_zadan_v0.1.pdf`
- `Trzebiatow_Encyklopedia_pergamin_i_mapa_gracza_v0.2.pdf`

## 13. Grafiki historyczne IIWŚ

Cel: Wydzielić grafiki historyczne z katalogu IIWŚ.

Pliki:

- `IIWŚ/ChatGPT Image 5 paź 2026, 03_27_22 (4).png`
- `IIWŚ/Trzebiatów 1939–1945_ Historia w aplikacji.png`

## 14. Grafiki promocyjne z katalogu PROMO

Cel: Wydzielić luźne grafiki promocyjne.

Pliki:

- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (1).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (10).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (2).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (3).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (4).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (5).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (6).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (7).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (8).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_28_42 (9).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (1).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (2).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_29_00 (3).png`
- `PROMO/ChatGPT Image 5 paź 2026, 03_32_19.png`

## 15. Pakiet promocyjny III

Cel: Zachować razem grafiki, prezentacje i dokumenty pakietu III.

Pliki:

- `PROMO/III/01_TREPTOV_plakat_promocyjny_PION.jpg`
- `PROMO/III/02_TREPTOV_gadzety_i_akcesoria_POZIOM.jpg`
- `PROMO/III/03_TREPTOV_gra_planszowa_PREMIUM_POZIOM.jpg`
- `PROMO/III/04_TREPTOV_gra_karciana_ARCHIWUM_POZIOM.jpg`
- `PROMO/III/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.jpg`
- `PROMO/III/06_TREPTOV_EDYCJA_16PLUS_KONCEPCJA.jpg`
- `PROMO/III/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pdf`
- `PROMO/III/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pptx`
- `PROMO/III/TREPTOV_IIWS_PAKIET_GRAFIK_PROMOCYJNYCH.pdf`
- `PROMO/III/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA.pdf`
- `PROMO/III/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA.pptx`

## 16. Pakiet promocyjny IIWS

Cel: Zachować razem materiały i eksporty pakietu IIWS; jest to większy, ale tematycznie spójny zestaw.

Pliki:

- `PROMO/IIWS/ChatGPT Image 5 paź 2026, 03_47_12.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/01_TREPTOV_PLAKAT_PROMOCYJNY_PION.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/01_TREPTOV_PLAKAT_PROMOCYJNY_PION.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/02_TREPTOV_KOLEKCJA_GADZETY_POZIOM.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/02_TREPTOV_KOLEKCJA_GADZETY_POZIOM.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/03_TREPTOV_GRA_PLANSZOWA_PREMIUM_POZIOM.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/03_TREPTOV_GRA_PLANSZOWA_PREMIUM_POZIOM.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/04_TREPTOV_GRA_KARCIANA_ARCHIWUM_POZIOM.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/04_TREPTOV_GRA_KARCIANA_ARCHIWUM_POZIOM.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/05_TREPTOV_ARCHIWUM_OZYWA_POZIOM.png`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/06_TREPTOV_EDYCJA_16PLUS_PION.jpg`
- `PROMO/IIWS/GRAFIKI_PROMOCYJNE/06_TREPTOV_EDYCJA_16PLUS_PION.png`
- `PROMO/IIWS/README.txt`
- `PROMO/IIWS/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_KARTA_PROJEKTU_DLA_URZEDU_A4_PION.pptx`
- `PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_PION.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_PION.pptx`
- `PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_POZIOM.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_MATERIALY_PROMOCYJNE_POZIOM.pptx`
- `PROMO/IIWS/TREPTOV_IIWS_PAKIET_FINAL_V2.zip`
- `PROMO/IIWS/TREPTOV_IIWS_PAKIET_GRAFIK_PROMOCYJNYCH.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_PION.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_PION.pptx`
- `PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_POZIOM.pdf`
- `PROMO/IIWS/TREPTOV_IIWS_PREZENTACJA_DLA_URZEDU_I_BURMISTRZA_POZIOM.pptx`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/00_indeks_plikow.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/01_key_art_Tajemnice_Trzebiatowa_1939-1945.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/02_na_czym_polega_gra.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/03_prawdziwe_miejsca_nowe_spojrzenie.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/04_sound_fx_dzwieki_wojny_i_miasta.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/05_gadzety_i_pamiatki.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/06_edycja_kolekcjonerska_walizka.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/07_archiwum_gracza_akcesoria.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/08_dlaczego_warto_dla_trzebiatowa.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/09_wspolpraca_z_gmina_i_partnerami.png`
- `PROMO/IIWS/Tajemnice_Trzebiatowa_IIWS_materialy_promocyjne_v1/10_reklama_poznaj_trzebiatow_na_nowo.png`

## 17. Archiwum promocyjne trylogii

Cel: Wydzielić archiwum trylogii od pozostałych materiałów.

Pliki:

- `PROMO/TRYLOGIA/Tajemnice_Trzebiatowa_trylogia_premium_v1.zip`

## 18. Skrypt zamiany tekstów

Cel: Wydzielić skrypt roboczy. Uwzględnić w przyszłym commicie dopiero po ustaleniu jego roli i przydatności; status nie potwierdza, że powinien wejść do repozytorium.

Pliki:

- `zastap_teksty_trzebiatow_v2.mjs`
