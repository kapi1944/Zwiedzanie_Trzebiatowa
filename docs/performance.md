# Założenia wydajności

Projekt jest mobile-first i uwzględnia starsze smartfony oraz warunki terenowe. Niezawodność i czytelność mają pierwszeństwo przed efektami wizualnymi.

- Stosuj lazy loading dla funkcji i zasobów ładowanych dopiero w razie potrzeby.
- Mapa nie należy do initial bundle.
- Audio nie należy do initial bundle. Przygotowanie trasy offline musi zapewnić dostęp do potrzebnych zasobów przed rozgrywką bez internetu; oddzielamy to od początkowego pobrania aplikacji.
- W animacjach preferuj transform i opacity.
- Uwzględniaj reduced motion.
- Przewiduj profile FULL, AUTO i ECO. Szczegóły wyboru AUTO oraz ograniczeń efektów pozostają do ustalenia.
- Eco Mode ogranicza koszt prezentacji, ale nie zmienia fabuły, mechaniki wpływającej na jej przebieg ani dostępnych zakończeń.
- Weryfikuj działanie na prawdziwym słabszym telefonie, również po przygotowaniu trasy i odłączeniu internetu.

Limity rozmiarów bundle i zasobów oraz konkretne budżety wydajności zostaną ustalone po pomiarze baseline. Nie ustalamy teraz arbitralnych sztywnych limitów KB.
