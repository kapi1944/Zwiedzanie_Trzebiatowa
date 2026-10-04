# Geometria centrum Trzebiatowa

Dane i pochodna baza `geometria.json`: © OpenStreetMap contributors,
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Pobranie 2026-10-04. Atrybucja jest również w interfejsie mapy.

Źródła bez danych screenshotów Google:

- `centrum.osm.gz`: https://api.openstreetmap.org/api/0.6/map?bbox=15.253,54.057,15.281,54.068
- `rega.osm.gz`: https://api.openstreetmap.org/api/0.6/relation/3246784/full
- `mlynowka.osm.gz`: https://api.openstreetmap.org/api/0.6/relation/17840805/full

Odtworzenie: `python narzedzia/importuj-geometrie.py` z katalogu repo.
Importer zachowuje identyfikatory, wersje i współrzędne; eksportuje potrzebne
tagi. Łączy fragmenty relacji według identycznych identyfikatorów węzłów,
domyka brzegi i zachowuje wyspę oraz dziedziniec Ratusza. Nie zgaduje braków.
SHA-256 zdekompresowanych źródeł jest w metadanych wynikowej bazy.

ODbL dotyczy danych geograficznych; narracja i kod nie są tą bazą danych.
Przy dalszym rozpowszechnianiu danych/pochodnych zachowaj licencję, atrybucję
i dostęp do pochodnej bazy zgodnie z ODbL. Nie usuwaj tej informacji przy
publikacji mapy gry.

Punkty zaliczenia, obecna dostępność, wysokości bez źródła i historyczna
rekonstrukcja nie są potwierdzane przez tę bazę. Wymagają osobnej weryfikacji.
