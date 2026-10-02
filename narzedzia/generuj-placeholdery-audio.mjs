import {
  mkdirSync as utworzKatalog,
  writeFileSync as zapiszPlik,
} from "node:fs";

// PLACEHOLDER — DO WYMIANY. Wlasne tony techniczne, bez materialu zewnetrznego.
const katalog = new URL(
  "../tresc/trzebiatow-v1/zasoby/audio/",
  import.meta.url,
);
utworzKatalog(katalog, { recursive: true });
const probkowanie = 8000;
const dzwieki = {
  przejscie: [0.18, 320],
  przewrocenie_kartki: [0.22, 740],
  subtelny_metal: [0.35, 1100],
  atmosfera: [0.6, 120],
  tajemnica: [3, 110],
  rynek: [3, 165],
  sacrum: [3, 220],
  napiecie: [3, 140],
  final: [3, 260],
};
for (const [nazwa, [czas, czestotliwosc]] of Object.entries(dzwieki)) {
  const liczba = Math.round(czas * probkowanie);
  const dane = Buffer.alloc(44 + liczba * 2);
  dane.write("RIFF", 0);
  dane.writeUInt32LE(dane.length - 8, 4);
  dane.write("WAVEfmt ", 8);
  dane.writeUInt32LE(16, 16);
  dane.writeUInt16LE(1, 20);
  dane.writeUInt16LE(1, 22);
  dane.writeUInt32LE(probkowanie, 24);
  dane.writeUInt32LE(probkowanie * 2, 28);
  dane.writeUInt16LE(2, 32);
  dane.writeUInt16LE(16, 34);
  dane.write("data", 36);
  dane.writeUInt32LE(liczba * 2, 40);
  for (let indeks = 0; indeks < liczba; indeks++) {
    const sekundy = indeks / probkowanie;
    const obwiednia = Math.sin((Math.PI * indeks) / liczba) ** 2;
    const sygnal = Math.sin(2 * Math.PI * czestotliwosc * sekundy);
    dane.writeInt16LE(Math.round(sygnal * obwiednia * 1800), 44 + indeks * 2);
  }
  zapiszPlik(new URL(`placeholder-${nazwa}.wav`, katalog), dane);
}
console.log(
  "9 wlasnych placeholderow WAV: mono, PCM16, 8 kHz. PLACEHOLDER — DO WYMIANY.",
);
