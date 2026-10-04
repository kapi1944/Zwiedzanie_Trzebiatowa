# Zakończenia — Etap 3

Bazowy resolver poniżej pozostaje używany. Dla rozpoczętej kampanii Etap 12 dodaje bramkę sceny finału i `warunekFinalu` oraz cztery nowe zakończenia główne. [Reguły Etapu 12](etap-12-pelna-kampania.md#flagi-i-zakończenia) · [status projektu](status-projektu.md).

`wyznaczProfilZakonczenia(definicje, stan)` jest czystą funkcją. Waliduje definicje i stan, sprawdza ich zgodność oraz ukończenie wszystkich nieopcjonalnych wątków i wątków z `wymaganyDoFinalu: true`. Pozostałe opcjonalne wątki mogą być zablokowane, dostępne, aktywne lub pominięte i nie blokują profilu.

`ProfilZakonczenia` zawiera wyłącznie identyfikatory:

```ts
{
  zakonczenieGlowne: string;
  epilogiWatkow: string[];
  specjalneOdkrycia: string[];
  konsekwencjeZagadek: string[];
}
```

Definicje zakończeń mają rodzaj GLOWNE, EPILOG_WATKU, SPECJALNE_ODKRYCIE lub KONSEKWENCJA_ZAGADKI, warunek DSL (opcjonalny), całkowity priorytet i boolean `domyslne`. Nie zawierają finalnych tekstów.

Spośród pasujących głównych definicji wybierana jest niedomyślna z najwyższym priorytetem. Przy remisie rozstrzyga rosnący identyfikator porównywany znakowo, bez zależności od locale. Jeśli żadna niedomyślna nie pasuje, wybierane jest obowiązkowe bezwarunkowe zakończenie domyślne. Jego priorytet nie wyprzedza wariantów specjalnych.

Pozostałe trzy listy zawierają wszystkie pasujące definicje danego rodzaju, w tej samej kolejności priorytet/id. Warunki mogą odwoływać się do wyników zagadek, wyborów, flag, powinowactw, przedmiotów, wątków i odkrytych scenek. Finał nie wymaga zebrania opcjonalnych przedmiotów ani odkrycia scenek. Autor może jawnie oznaczyć opcjonalny wątek jako wymagany; wtedy odpowiada za jego osiągalność.

Fixture testowy sprawdza bazowy profil, profil zależny od powinowactwa, epilog ukończonego wątku, odkrycie zależne od przedmiotu i konsekwencję pominięcia zagadki. Jest demonstracją techniczną, bez fabuły Trzebiatowa. Wyznaczenie profilu nie kończy automatycznie sesji ani nie wykonuje efektów prezentacyjnych.
