# Założenia wydajności

Projekt jest projektowany przede wszystkim na smartfony i uwzględnia starsze smartfony oraz warunki terenowe. Niezawodność i czytelność mają pierwszeństwo przed efektami wizualnymi.

- Stosuj ładowanie na żądanie dla funkcji i zasobów ładowanych dopiero w razie potrzeby.
- Mapa nie należy do początkowego pakietu aplikacji.
- Audio nie należy do początkowego pakietu aplikacji. Przygotowanie trasy offline musi zapewnić dostęp do potrzebnych zasobów przed rozgrywką bez internetu; oddzielamy to od początkowego pobrania aplikacji.
- W animacjach preferuj transform i opacity.
- Uwzględniaj preferencję ograniczenia ruchu.
- Profile techniczne: PELNY, AUTOMATYCZNY i EKO. Ręczny wybór jest nadrzędny; brak wystarczających danych urządzenia oznacza EKO. Ograniczenie ruchu jest osobnym ustawieniem.
- Tryb EKO ogranicza koszt prezentacji, ale nie zmienia fabuły, mechaniki wpływającej na jej przebieg ani dostępnych zakończeń.
- Weryfikuj działanie na prawdziwym słabszym telefonie, również po przygotowaniu trasy i odłączeniu internetu.

Pomiary Etapu 8 i 9, konwencję MALY/STANDARDOWY/HD i budżety regresji opisano w [wydajnosc-i-eko.md](wydajnosc-i-eko.md). Initial JS gzip: 106725 → 107764 B; sesja: 45122 → 45121 B; mapa: 44091 → 44123 B; CSS początkowy: 1491 → 1546 B, mapy: 6371 B. Progi testowe wynikają z bazy Etapu 8: 15% tolerancji plus 512 B. Mapa nie jest już pobierana przez precache; sesja i treść zachowują gotowość offline.
