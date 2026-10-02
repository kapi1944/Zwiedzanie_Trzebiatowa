// TEKST ROBOCZY - NIE JEST TO FINALNA WERSJA FABULY.
// Zmienne mechaniki sa kopiowane przez Most, bez przypisywania w Ink.
VAR wybrano_dowod = false
VAR wybrano_pamiec = false
VAR hansken_wynik = ""
VAR ma_fragment = false
VAR otwarto_notatke = false
VAR final_kronikarz = false
VAR final_straznik = false
VAR odkryto_dwie_warstwy = false
-> prolog

=== prolog ===
FAKT [gmina_zabytki]: Ratusz stoi w centrum rynku. To tutaj zaczynasz przejście przez trzy miejsca i dwie perspektywy: zapis oraz pamięć.
FABULARYZOWANE: Wyobraź sobie pustą kartę Kroniki. Nikt nie każe ci wybierać między prawdą a piękną opowieścią. Możesz pytać, co da się potwierdzić, a co ludzie zachowują, opowiadając sobie miasto. Na razie zdecyduj tylko, od którego pytania rozpoczniesz.
* [Szukam tego, co można udowodnić. #sygnal:prolog_dowod]
    Otwierasz kolumnę na ślady i źródła. Druga kolumna pozostaje wolna.
    -> hansken
* [Szukam tego, co ludzie zapamiętali. #sygnal:prolog_pamiec]
    Otwierasz kolumnę na głosy i opowieści. Zostawiasz miejsce na sprawdzanie.
    -> hansken
* [Najpierw chcę wysłuchać obu stron. #sygnal:prolog_obie]
    Dwie kolumny rozpoczynają się obok siebie. Nie muszą mówić tego samego.
    -> hansken

=== hansken ===
FAKT [wzp_hansken]: Przy Rynku 26 znajduje się sgraffito wiązane ze słonicą Hansken. Samorządowy opis podaje jej wizytę w Trzebiatowie w 1639 roku. To informacja źródłowa; nie twierdzenie, że wizerunek jest kopią Rembrandta.
FABULARYZOWANE: Obraz można oglądać, ale nie wszystkie jego znaczenia zobaczysz od razu. Zatrzymaj się przy granicy między własną obserwacją a cudzym objaśnieniem. Fragment Kroniki, który możesz otrzymać, jest przedmiotem gry, nie odnalezionym dokumentem historycznym.
ZADANIE ROBOCZE: detal i odpowiedź obserwacyjna wymagają rekonesansu. Bez niego wynik można jedynie zasymulować w teście. Pominięcie zawsze pozwala kontynuować.
* [Otwieram miejsce na własną notatkę. #sygnal:hansken_zapis]
    -> kosciol
* [Najpierw słucham, jak obraz staje się opowieścią. #sygnal:hansken_slucham]
    -> kosciol

=== kosciol ===
FAKT [nid_kosciol]: Kościół Macierzyństwa NMP jest gotycką świątynią z masywem wieżowym. NID opisuje na wieży dzwon Maria z 1515 roku, dzieło ludwisarza Lütke Rose. Nie zakładamy, że w tej chwili możesz zobaczyć dzwon albo wejść na wieżę.
TRADYCJA / INFORMACJA DO DALSZEGO SPRAWDZENIA [gmina_zabytki]: Materiał gminny przypisuje wieży dawną rolę latarni morskiej. W tym szkicu traktujemy to jako przypisany źródłu przekaz wymagający dalszej weryfikacji, bez potwierdzania sposobu jej działania.
{
- wybrano_dowod:
    FABULARYZOWANE — opóźniona konsekwencja: Twoje pierwsze pytanie z rynku wraca. Tym razem obok nazwy dzwonu dopisujesz źródło informacji. Oglądanie miejsca i znajomość jego opisu to dwa różne rodzaje wiedzy.
- wybrano_pamiec:
    FABULARYZOWANE — opóźniona konsekwencja: Pamiętasz pytanie z rynku o to, co ludzie zachowali. Nazwa dzwonu prowadzi teraz do pytania o pamięć miejsca; nie staje się dowodem opowieści, której nikt tu nie potwierdził.
- else:
    FABULARYZOWANE — opóźniona konsekwencja: Dwie kolumny z rynku spotykają się znowu. Jedna mieści opis zabytku, druga pytania o pamięć. Nadal możesz je zestawiać, nie zacierając granicy.
}
{ hansken_wynik == "POMINIETA":
    Nie masz fragmentu Kroniki Hansken. Puste miejsce w notatce nie zamyka dalszej drogi.
- else:
    Pamięć wyniku Hansken zostaje z tobą; sposób przejścia nie musi być identyczny z drogą innej osoby.
}
* { ma_fragment && otwarto_notatke } [Zestawiam obie notatki. #sygnal:kosciol_do_scenki]
    -> dwie_notatki
* [Zapisuję informację i jej źródło. #sygnal:kosciol_zapis]
    -> baszta
* [Zachowuję pytanie o pamięć tego miejsca. #sygnal:kosciol_opowiesc]
    -> baszta

=== dwie_notatki ===
FABULARYZOWANE — scenka opcjonalna: Kładziesz fragment Kroniki obok własnej notatki. Jeden jest nagrodą w grze, druga zapisem twojej interpretacji. Żaden nie zastępuje źródła historycznego. Zauważasz za to, jak łatwo opis obrazu zamienić w dopowiedzenie. Możesz zachować oba, jeżeli jasno podpiszesz ich pochodzenie.
* [Wracam do wspólnej drogi. #sygnal:scenka_powrot]
    -> kosciol_decyzja

=== kosciol_decyzja ===
FABULARYZOWANE: Wracasz do wspólnego punktu. Scenka zmieniła twoją notatkę, lecz nie przeniosła cię na osobną trasę. Dalej czeka Baszta i pytanie, czy legenda potrzebuje tego samego rodzaju potwierdzenia co mur.
* [Zapisuję informację i jej źródło. #sygnal:kosciol_zapis_po_scence]
    -> baszta
* [Zachowuję pytanie o pamięć tego miejsca. #sygnal:kosciol_opowiesc_po_scence]
    -> baszta

=== baszta ===
FAKT [gmina_zabytki]: Baszta Kaszana, nazywana też Prochową, należy do historycznych fortyfikacji miasta.
LEGENDA [gmina_zabytki]: Opowieść o gorącej kaszy mówi o strażniku, misce strąconej na napastnika i alarmie, który miał pomóc obrońcom. To legenda objaśniająca nazwę; nie potwierdzony raport z bitwy.
FABULARYZOWANE: W twojej Kronice obie warstwy mogą istnieć obok siebie. Zanim zdecydujesz o kolejności zapisu, rozdziel w zadaniu to, co dotyczy obiektu, od fabuły legendy. Nie potrzebujesz wejścia na basztę ani odnalezienia ukrytego detalu.
* [Najpierw zapisuję to, co potwierdzają ślady. #sygnal:baszta_fakt]
    -> mini_final
* [Najpierw zapisuję opowieść mieszkańców. #sygnal:baszta_legenda]
    -> mini_final
* [Zachowuję obie wersje i zaznaczam ich różny charakter. #sygnal:baszta_obie]
    -> mini_final

=== mini_final ===
FABULARYZOWANE — mini-finał:
{
- final_kronikarz:
    KRONIKARZ. Na pierwszym planie umieszczasz ślad i jego źródło. Opowieść pozostaje obok, opisana własnym językiem. Twoja droga nie unieważnia pamięci; nadaje zapisowi wyraźny porządek.
- final_straznik:
    STRAŻNIK OPOWIEŚCI. Zaczynasz od tego, co ludzie przekazują dalej. Zachowujesz oznaczenie legendy i miejsce na sprawdzenie faktów. Pamięć nie potrzebuje udawać dokumentu, aby zasługiwać na uwagę.
- else:
    ŁĄCZNIK. Zachowujesz dwie wersje obok siebie i podpisujesz ich różny charakter. Nie obiecujesz, że zawsze się zgodzą. Twoja Kronika staje się miejscem rozmowy między zapisem a pamięcią.
}
-> epilog_kroniki

=== epilog_kroniki ===
FABULARYZOWANE — epilog Kroniki: W zapisie pozostają źródła, granice obserwacji i pytania, których jeszcze nie rozstrzygnięto.
-> epilog_pamieci

=== epilog_pamieci ===
FABULARYZOWANE — epilog Pamięci: Opowieść o kaszy pozostaje legendą. Nie odbiera jej to miejsca w pamięci miasta.
{ odkryto_dwie_warstwy:
    -> odkrycie_dwie_warstwy
- else:
    -> END
}

=== odkrycie_dwie_warstwy ===
FABULARYZOWANE — bonusowy fragment Kroniki: Samodzielna obserwacja Hansken i zestawienie notatek pozwalają ci nazwać różnicę między śladem a dopowiedzeniem. To dodatkowy fragment, nie lepsze zakończenie.
-> END
