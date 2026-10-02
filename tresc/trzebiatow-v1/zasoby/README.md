# Zasoby audio

**PLACEHOLDER — DO WYMIANY**

Pliki `audio/placeholder-*.wav` to własne tony techniczne wygenerowane skryptem
`narzedzia/generuj-placeholdery-audio.mjs`. Nie zawierają cudzych nagrań, sampli,
melodii ani imitacji utworu/kompozytora. Nie stanowią finalnej ścieżki muzycznej.
Skrypt jest deterministyczny: mono, PCM16, 8 kHz; prosta sinusoida z obwiednią.

Efekty: przejscie, przewrocenie_kartki, subtelny_metal, atmosfera.
Muzyka testowa: tajemnica, rynek, sacrum, napiecie, final.
`cisza` nie ma pliku. IDs i ścieżki są zarejestrowane w `manifest.yaml`.
Treść używa kontrolowanych tagów `dzwiek:` i `nastroj:`; nie odtwarza plików.

Przyszły asset może zastąpić placeholder dopiero po udokumentowaniu:

- autora/właściciela oraz źródła i daty pozyskania;
- konkretnej licencji lub zgody, z kopią warunków;
- prawa do użycia w grze, redystrybucji, modyfikacji, pętli i zastosowania
  komercyjnego, jeśli będzie wymagane;
- obowiązkowej atrybucji i ograniczeń, wraz z miejscem jej publikacji.

Nie wystarcza „royalty free”, wynik wyszukiwarki ani dostępność pliku do pobrania.
Nie dodawać przypadkowych plików z internetu ani muzyki chronionej bez właściwej
licencji. Preferować własne nagrania i muzykę lub zasoby z jasno udokumentowaną
licencją. Licencja MIT Howlera dotyczy biblioteki, nie przyszłych nagrań.

EKO pobiera tylko aktualnie potrzebne audio i ogranicza współbieżność.
Nie preładować przyszłych nastrojów. Nie dodawać WAV do precache.
Audio jest opcjonalne, inicjalizowane po gestach; brak dźwięku nigdy nie może
zmieniać wyborów, zagadek ani zakończeń. Szczegóły: [audio.md](../../../dokumentacja/audio.md).
