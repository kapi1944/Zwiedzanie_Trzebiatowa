// Mechanika pozostaje w Quest Engine. Ink czyta wylacznie kontekst Mostu.
VAR kampania_rozpoczeta = false
VAR zapisano_ratusz = false
VAR zapisano_mury = false
VAR glos_ratusz = false
VAR glos_mury = false
VAR polaczono_znaki = false
VAR obserwacja_postaci = ""

=== kontynuacja_kampanii ===
FABULARYZOWANE: To był pierwszy rozdział. Dalej możesz wybrać własną kolejność obserwacji. Nie musisz zobaczyć wszystkiego podczas jednej wyprawy.
* [Rozwijam Kronikę — wybieram dalszą wyprawę. #sygnal:rozpocznij_kampanie]
    -> rozdroze

=== rozdroze ===
FABULARYZOWANE: Na brzegu pergaminu zostało miejsce. Wybierz jeden z dostępnych celów. Każda notatka może zmienić znaczenie następnej. Wyprawę możesz zamknąć po powrocie z pierwszego miejsca.
* [Idę do sgraffito Hansken. #sygnal:cel_hansken]
    -> hansken_powrot
* [Idę do Ratusza. #sygnal:cel_ratusz]
    -> ratusz_obserwacja
* [Idę do murów obronnych. #sygnal:cel_mury]
    -> mury_obserwacja
* [Idę do Pałacu Książęcego. #sygnal:cel_palac]
    -> palac_obserwacja
* [Łączę notatkę o postaci z obserwacją Ratusza. #sygnal:cel_splot]
    -> splot_notatek
* [Zamykam dzisiejszą wyprawę. #sygnal:kampania_final]
    -> final_kampanii

=== hansken_powrot ===
FABULARYZOWANE: Wracasz pod obraz na Rynku 26. Tym razem spójrz poza samą słonicę. Szczegół, który nazwiesz, zapiszesz przed przeczytaniem objaśnienia. Nie stawaj na jezdni dla lepszego widoku. #nastroj:tajemnica
{ glos_ratusz:
    FABULARYZOWANE: Pamiętasz swoją decyzję przy Ratuszu: zachować miejsce na głosy. Ktoś towarzyszy również temu obrazowi. Zamiast pytać tylko o zwierzę, szukasz uczestnika sceny.
}
* [Zachowuję ślad i jego źródło. #sygnal:hansken_teren_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:hansken_glos]
    -> rozdroze

=== ratusz_obserwacja ===
FABULARYZOWANE: Ratusz możesz obejść, pozostając w dostępnej przestrzeni publicznej. Patrz wysoko, ale zatrzymaj się przed liczeniem. Jedno spojrzenie nie zastępuje obejścia budowli. #nastroj:rynek
{ obserwacja_postaci != "":
    FABULARYZOWANE: Pod sgraffito szukałeś kogoś poza główną figurą. Tutaj też spróbuj objąć całość zamiast zapisywać pierwszy widoczny fragment.
}
* [Zachowuję ślad i jego źródło. #sygnal:ratusz_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:ratusz_glos]
    -> rozdroze

=== mury_obserwacja ===
FABULARYZOWANE: Podejdź do zachodniego odcinka murów, gdzie z alejki widoczna jest podstawa. Nie wspinaj się i nie wchodź za ogrodzenia. Jeśli zasłania ją roślinność, nie wymyślaj odpowiedzi. Obejrzyj materiał, zanim przeczytasz jego historię. #nastroj:napiecie
{ glos_ratusz:
    FABULARYZOWANE — głos fikcyjnej Kronikarki: Pozostawiłeś miejsce na ludzką opowieść. Pamiętaj jednak: legenda o alarmie nie mówi, gdzie stała każda brama. Podpisz osobno to, co zobaczyłeś.
- else:
    FABULARYZOWANE — głos fikcyjnej Kronikarki: Zacznij od śladu. Przerwa w murze może być późniejszym przejściem, a nie dawną bramą. Dopiero źródło pozwoli je odróżnić.
}
* [Zachowuję ślad i jego źródło. #sygnal:mury_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:mury_glos]
    -> rozdroze

=== palac_obserwacja ===
FABULARYZOWANE: Stań przy Pałacu Książęcym, Wojska Polskiego 67. Obejrzyj połączenie skrzydeł z dostępnego terenu. Bez wchodzenia do środka odszukaj kształt budowli. Jeśli widok jest zamknięty, pomoc i pominięcie pozostają dostępne. #nastroj:tajemnica
{ zapisano_mury:
    FABULARYZOWANE: Po murach przyglądasz się granicy tej rezydencji. Czy oglądasz całą budowlę, czy tylko jedną elewację? Zanim narysujesz brakujący fragment, przejdź do drugiego widoku.
}
{ glos_mury:
    FABULARYZOWANE: Zostawiłeś miejsce na opowieści ludzi przy murze. Kronikarka dopisuje na marginesie: najpierw rozpoznaj bryłę, potem pytaj, kto nadaje jej znaczenie. Sam wygląd rezydencji nie dowodzi legendy.
}
* [Zachowuję ślad i jego źródło. #sygnal:palac_zapis]
    -> rozdroze
* [Zostawiam miejsce na opowieści ludzi. #sygnal:palac_glos]
    -> rozdroze

=== splot_notatek ===
FABULARYZOWANE — mini-finał Znaki: Pod obrazem zauważyłeś towarzyszącą postać, przy Ratuszu zebrałeś spojrzenia z kilku stron. Dwie notatki mówią teraz o tym samym: nie pomijaj tego, co znajduje się poza pierwszym kadrem. To twoja interpretacja wyprawy, nie teza historyczna. #dzwiek:przewrocenie_kartki
* [Wracam do wyboru dalszego celu. #sygnal:splot_powrot]
    -> rozdroze

=== final_kampanii ===
FABULARYZOWANE: Zamykasz dzisiejszą wyprawę. Jej wynik wynika z odwiedzonych miejsc, zadań, sposobu obserwacji, otrzymanej pomocy i decyzji. Każda nieuzupełniona notatka pozostaje pytaniem. #nastroj:final
-> END
