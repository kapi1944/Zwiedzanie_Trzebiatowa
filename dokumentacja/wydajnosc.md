# Założenia wydajności

Projekt jest projektowany przede wszystkim na smartfony i uwzględnia starsze smartfony oraz warunki terenowe. Niezawodność i czytelność mają pierwszeństwo przed efektami wizualnymi.

- Stosuj ładowanie na żądanie dla funkcji i zasobów ładowanych dopiero w razie potrzeby.
- Mapa nie należy do początkowego pakietu aplikacji.
- Audio nie należy do początkowego pakietu aplikacji. Przygotowanie trasy offline musi zapewnić dostęp do potrzebnych zasobów przed rozgrywką bez internetu; oddzielamy to od początkowego pobrania aplikacji.
- W animacjach preferuj transform i opacity.
- Uwzględniaj preferencję ograniczenia ruchu.
- Przewiduj profile PEŁNY, AUTOMATYCZNY i EKO. Szczegóły wyboru profilu AUTOMATYCZNY oraz ograniczeń efektów pozostają do ustalenia.
- Tryb EKO ogranicza koszt prezentacji, ale nie zmienia fabuły, mechaniki wpływającej na jej przebieg ani dostępnych zakończeń.
- Weryfikuj działanie na prawdziwym słabszym telefonie, również po przygotowaniu trasy i odłączeniu internetu.

Limity rozmiarów pakietu aplikacji i zasobów oraz konkretne budżety wydajności zostaną ustalone po pomiarze bazowym. Nie ustalamy teraz arbitralnych sztywnych limitów KB.
