// Demonstracja techniczna, bez historycznych twierdzen i fabuly kampanii.
VAR droga = ""
-> start

=== start ===
START. Przed tobą dwie wersje tej samej opowieści. #nastroj:tajemnica
* [Podążam za tym, co zapisano.]
    ~ droga = "zapis"
    Wątek zapisu: czytasz notatkę na starej kartce. #dzwiek:przewrocenie_kartki
    -> konwergencja
* [Podążam za tym, co zapamiętano.]
    ~ droga = "pamiec"
    Wątek pamięci: słuchasz krótkiego wspomnienia.
    -> konwergencja

=== konwergencja ===
Obie drogi prowadzą na ten sam pusty plac.
-> pozniejsza_scena

=== pozniejsza_scena ===
{ droga == "zapis":
    Później rozpoznajesz zdanie z przeczytanej notatki. #sygnal:odkryto_trop
- else:
    Później rozpoznajesz słowa z usłyszanego wspomnienia. #sygnal:odkryto_trop
}
* [Sprawdzam kolejną opowieść.]
    Otwierasz nowy wątek.
    -> END
* [Pozostawiam pytanie bez odpowiedzi.]
    Wracasz do wspólnej drogi.
    -> END
