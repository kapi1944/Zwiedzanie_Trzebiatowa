// Mechanika pozostaje w Quest Engine. Ink czyta wylacznie kontekst Mostu.
VAR zapisano_mury = false
VAR glos_ratusz = false
VAR glos_mury = false
VAR obserwacja_postaci = ""
VAR pomoc_postaci = false
VAR odkryte_notatki = false
VAR granice_gotowe = false
VAR ma_notatke_muru = false

=== kontynuacja_kampanii ===
FABULARYZOWANE: Pierwszy rozdział za tobą. Kolejność dalszych miejsc wybierasz sam.
* [Rozwijam Kronikę — wybieram dalszą wyprawę. #sygnal:rozpocznij_kampanie]
    -> rozdroze

=== rozdroze ===
FABULARYZOWANE: Wybierz cel lub zamknij wyprawę po pierwszym powrocie. Wcześniejsze notatki zmieniają dalsze sceny.
* [Idę do sgraffito Hansken. #sygnal:cel_hansken]
    -> hansken_powrot
* [Idę do Ratusza. #sygnal:cel_ratusz]
    -> ratusz_obserwacja
* [Idę do murów obronnych. #sygnal:cel_mury]
    -> mury_obserwacja
{ granice_gotowe && ma_notatke_muru:
    FABULARYZOWANE: Notatka muru otwiera porównanie z Pałacem.
}
* {granice_gotowe && ma_notatke_muru} [Porównuję notatkę murów z Pałacem. #sygnal:cel_palac_z_notatka]
    -> palac_obserwacja
* [Idę do Pałacu Książęcego. #sygnal:cel_palac]
    -> palac_obserwacja
* [Łączę notatkę o postaci z obserwacją Ratusza. #sygnal:cel_splot]
    -> splot_notatek
* [Zamykam dzisiejszą wyprawę. #sygnal:kampania_final]
    -> final_kampanii

=== hansken_powrot ===
FABULARYZOWANE: Rynek 26: spójrz poza słonicę. Zapisz szczegół przed lekturą objaśnienia. Nie stawaj na jezdni. #nastroj:tajemnica
{ glos_ratusz:
    FABULARYZOWANE: Głosy z Ratusza wracają: szukasz uczestnika sceny.
}
* [Zachowuję ślad i jego źródło. #sygnal:hansken_teren_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:hansken_glos]
    -> rozdroze

=== ratusz_obserwacja ===
FABULARYZOWANE: Obejdź Ratusz w przestrzeni publicznej. Zatrzymaj się przed liczeniem; jedno spojrzenie nie obejmuje całości. #nastroj:rynek
{ obserwacja_postaci == "POMINIETA" || obserwacja_postaci == "NIEUDANA":
    FABULARYZOWANE: Notatka postaci pozostała otwarta; nie jest dowodem.
- else:
    { obserwacja_postaci != "":
        FABULARYZOWANE: Rozpoznanie postaci pod sgraffito przypomina: obejrzyj całość.
    }
}
{ pomoc_postaci:
    FABULARYZOWANE: Podpowiedź pomogła ci przy sgraffito. Tu zacznij od własnej obserwacji.
}
* [Zachowuję ślad i jego źródło. #sygnal:ratusz_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:ratusz_glos]
    -> rozdroze

=== mury_obserwacja ===
FABULARYZOWANE: Obejrzyj podstawę zachodniego odcinka murów z alejki, przed lekturą historii. Nie wspinaj się ani nie przekraczaj ogrodzeń. Gdy roślinność zasłania widok, nie wymyślaj odpowiedzi. #nastroj:napiecie
{ glos_ratusz:
    FABULARYZOWANE — głos fikcyjnej Kronikarki: Pozostawiłeś miejsce na ludzką opowieść. Legenda nie wskazuje dawnych bram. Obserwację podpisz osobno.
- else:
    FABULARYZOWANE — głos fikcyjnej Kronikarki: Zacznij od śladu. Przerwa może być późniejsza od bramy; potrzebujesz źródła.
}
* [Zachowuję ślad i jego źródło. #sygnal:mury_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:mury_glos]
    -> rozdroze

=== palac_obserwacja ===
{ granice_gotowe && ma_notatke_muru:
    FABULARYZOWANE: Przynosisz notatkę muru. Nie dowodzi ona historii Pałacu.
}
{ odkryte_notatki:
    FABULARYZOWANE: Odkrycie dwóch notatek wraca przy Pałacu: rozdziel obserwację i opowieść.
}
FABULARYZOWANE: Wojska Polskiego 67: obejrzyj połączenie skrzydeł Pałacu z dostępnego terenu, bez wchodzenia do środka. Zamknięty widok możesz pominąć lub skorzystać z pomocy. #nastroj:tajemnica
{ zapisano_mury:
    FABULARYZOWANE: Po murach pytasz o granicę rezydencji. Jedna elewacja nie jest całością; sprawdź drugi widok.
}
{ glos_mury:
    FABULARYZOWANE: Głosy z murów zmieniają pytanie o rezydencję: kto nadaje jej znaczenie? Wygląd nie dowodzi legendy.
}
* [Zachowuję ślad i jego źródło. #sygnal:palac_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:palac_glos]
    -> rozdroze

=== splot_notatek ===
FABULARYZOWANE — mini-finał Znaki: Postać i Ratusz łączą notatki: sprawdzaj więcej niż pierwszy kadr. To interpretacja wyprawy, nie teza historyczna. #dzwiek:przewrocenie_kartki
* [Wracam do wyboru dalszego celu. #sygnal:splot_powrot]
    -> rozdroze

=== final_kampanii ===
FABULARYZOWANE: Zamykasz wyprawę. Miejsca, decyzje i sposób rozwiązania tworzą wynik; luki pozostają pytaniami. #nastroj:final
{ pomoc_postaci:
    FABULARYZOWANE: W finale zapisujesz także wykorzystaną podpowiedź; nie przypisuj jej sobie.
}
{ granice_gotowe && ma_notatke_muru:
    FABULARYZOWANE: Zamknięty wątek Granic zostawia notatkę muru; inne osie są otwarte.
}
{ odkryte_notatki:
    FABULARYZOWANE: Dwie notatki pozostają osobnymi głosami również w finale.
}
-> END
