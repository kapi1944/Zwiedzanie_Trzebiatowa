# Diagnostyka awarii mapy — 2026-10-06

PRZYCZYNA NADAL NIEODTWORZONA. Brak raportu pierwotnego wyjątku; kontrolowany wyjątek testowy nie dowodzi jego przyczyny.

GranicaMapy używa componentDidCatch. Raport MAP-RENDER-0001 tylko w DEV/test zawiera Error.name (pole nazwa), message, stack, React componentStack, aktywny motyw, ustawiony tryb animacji i efektywne ograniczenie ruchu, efektywny profil wydajności, navigator.onLine i dostępność geolokalizacji. Kod identyfikuje granicę renderowania, nie konkretną przyczynę. Fallback zawiera komunikat i kod, bez szczegółów błędu. Raport nie odczytuje sesji, zapisu, historii ani współrzędnych GPS. Boundary obejmuje renderowanie i synchroniczne efekty React, nie błędy asynchronicznych callbacków ani zdarzeń.

Sprawdzone źródła mapy:
- Sesja i lokalizacje: SesjaGry waliduje definicje schematDefinicjiGry. Zapis jest sprawdzany pod względem zgodności wersji/pakietu, schematu i odtworzenia dziennika przed wznowieniem. Niepełne tablice stanu nie trafiają tą ścieżką do mapy.
- Ustawienia motywu/wydajności: istnieją listy dozwolonych wartości i wartości domyślne; brak dostępu do storage nie blokuje gry.
- Ślad: MagazynZapisu.odczytajSlad wywołuje odczytajSlad, który sprawdza tablice, pomiary, flagi i generację. Hook obsługuje odrzucenie odczytu, pozostawia bezpieczny pusty stan w pamięci i zachowuje zapis na dysku. Nie dodano drugiej walidacji ani kasowania danych.
- Podkład geometrii: fetch wcześniej zwracał JSON bez sprawdzenia struktury. Niepełny obiekt może spowodować wyjątek rysowania (np. brak obiekty/punkty/tagi). Dodano walidację struktury i zakresów współrzędnych przed ustawieniem geometrii. Odrzucenie wykorzystuje istniejący fallback podkładu w Mapa. Poprawny JSON zachowuje wszystkie pola i geometrię. Luka jest potwierdzona, jej związek z pierwotnym crashem nie jest potwierdzony.

PWA/cache: index.html i główne JS są w precache; mapowy lazy chunk i geometria są poza precache i mają adresy z hashem. CacheFirst jest kluczowany pełnym URL, więc stary chunk nie zastępuje nowego adresu. skipWaiting=false i clientsClaim=false ograniczają przejęcie klienta w trakcie sesji. Nie znaleziono konkretnej niespójności wymagającej zmiany Service Workera. Ryzyko wdrożeniowe: usunięcie starych assetów może uniemożliwić staremu klientowi pierwsze pobranie starego lazy chunku; to błąd pobrania obsługiwany przez boundary, nie podmiana chunku. Zachowania rzeczywistego hostingu nie zweryfikowano.

Kontrole końcowe: git diff --check PASS; typecheck wszystkich workspace oraz treści/E2E PASS; build PASS; testy aplikacji 121/121 PASS; testy granicy/geometrii/kampanii-GPS 16/16 PASS; mapa-regresja.spec.ts + teren.spec.ts 24/24 E2E PASS. To weryfikacja lokalna w Chromium, bez odtworzenia pierwotnej awarii na urządzeniu użytkownika. Test produkcyjny potwierdza brak własnego raportu boundary i brak szczegółów wyjątku w UI.
