import {
  Howler as BibliotekaAudio,
  Howl as Dzwiek,
} from "howler/dist/howler.core.min.js";
import atmosfera from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-atmosfera.wav?url";
import final from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-final.wav?url";
import napiecie from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-napiecie.wav?url";
import przejscie from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-przejscie.wav?url";
import kartka from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-przewrocenie_kartki.wav?url";
import rynek from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-rynek.wav?url";
import sacrum from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-sacrum.wav?url";
import metal from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-subtelny_metal.wav?url";
import tajemnica from "../../../tresc/trzebiatow-v1/zasoby/audio/placeholder-tajemnica.wav?url";
import { type FabrykaAudio, MenedzerAudio } from "./MenedzerAudio";
import type { UstawieniaAudio } from "./ustawienia-audio";

const fabryka: FabrykaAudio = (sciezka, petla, glosnosc, zakoncz, blad) => {
  const dzwiek = new Dzwiek({
    src: [sciezka],
    format: ["wav"],
    preload: false,
    autoplay: false,
    loop: petla,
    volume: glosnosc,
    pool: 1,
    onend: () => {
      if (!petla) zakoncz();
    },
    onloaderror: blad,
    onplayerror: blad,
  });
  let identyfikator: number | undefined;
  let gra = false;
  return {
    graj: () => {
      if (gra) return;
      gra = true;
      identyfikator =
        identyfikator === undefined
          ? dzwiek.play()
          : dzwiek.play(identyfikator);
    },
    pauza: () => {
      gra = false;
      dzwiek.pause(identyfikator);
    },
    zwolnij: () => {
      gra = false;
      dzwiek.unload();
    },
    glosnosc: (wartosc) => {
      dzwiek.volume(wartosc);
    },
    przejscie: (od, doWartosci, czas) => {
      dzwiek.fade(od, doWartosci, czas);
    },
  };
};

export function utworzMenedzerAudio(
  ustawienia: UstawieniaAudio,
  profil: "PELNY" | "EKO",
  blad: () => void,
) {
  return new MenedzerAudio(
    fabryka,
    {
      dzwieki: {
        przejscie,
        przewrocenie_kartki: kartka,
        subtelny_metal: metal,
        atmosfera,
      },
      nastroje: { tajemnica, rynek, sacrum, napiecie, final },
    },
    ustawienia,
    profil,
    async () => {
      if (BibliotekaAudio.ctx?.state === "suspended")
        await BibliotekaAudio.ctx.resume();
    },
    blad,
  );
}
