import { createHash as utworzHash } from "node:crypto";
import {
  mkdirSync as utworzKatalog,
  writeFileSync as zapiszPlik,
} from "node:fs";
import type { StanGry } from "@zwiedzanie/schemat-tresci";
import { sprawdzGrafKampanii } from "./graf-kampanii.ts";
import { odczytajPakiet } from "./pakiet-gry.ts";
import { odczytajKampanie } from "./pakiet-kampanii.ts";
import {
  sprawdzRegulyZakonczen,
  sprawdzSwiadectwaZakonczen,
} from "./reguly-zakonczen.ts";
import { sprawdzDrogi } from "./sciezki-slice.ts";
import { analizujFlagi, utworzKontroleGrafu } from "./walidacja-contentu.ts";

const pakiet = odczytajPakiet();
const reguly = sprawdzRegulyZakonczen(pakiet.definicje);
if (reguly.martweGalezie.length)
  console.warn(
    `Martwe galezie regul zakonczen: ${reguly.martweGalezie.join(", ")}`,
  );
const flagi = analizujFlagi(pakiet.definicje);
if (flagi.nigdyNieustawiane.length)
  throw new Error(
    `Flagi nigdy nieustawiane: ${flagi.nigdyNieustawiane.join(", ")}`,
  );
if (flagi.nigdyNieczytane.length)
  console.warn(`Flagi nigdy nieczytane: ${flagi.nigdyNieczytane.join(", ")}`);
const kontrola = utworzKontroleGrafu(
  pakiet.definicje,
  pakiet.sceny.map((scena) => scena.id),
);
const stanyFinaluSlice: StanGry[] = [];
const raport = sprawdzDrogi(pakiet.definicje, pakiet.narracja, (droga) => {
  kontrola.odwiedz(droga);
  stanyFinaluSlice.push(droga.stan);
});
kontrola.zakoncz();
sprawdzSwiadectwaZakonczen(pakiet.definicje, stanyFinaluSlice);
const katalog = new URL("../tresc/trzebiatow-v1/dist/", import.meta.url);
utworzKatalog(katalog, { recursive: true });
zapiszPlik(
  new URL("pakiet.json", katalog),
  JSON.stringify(pakiet.definicje, null, 2),
);
zapiszPlik(new URL("glowna.json", katalog), pakiet.narracja);
const narracja = JSON.stringify(JSON.parse(pakiet.narracja));
const hash = (tekst: string) =>
  utworzHash("sha256").update(tekst).digest("hex");
zapiszPlik(
  new URL("tozsamosc.json", katalog),
  JSON.stringify({
    hashNarracji: hash(narracja),
    hashPakietu: hash(
      JSON.stringify({ definicje: pakiet.definicje, narracja }),
    ),
  }),
);
console.log(
  `Pakiet Gry: ${raport.liczbaDrog} drog PASS; profile: ${raport.profile.join(", ")}.`,
);
const kampania = odczytajKampanie();
const flagiKampanii = analizujFlagi(kampania.definicje);
if (flagiKampanii.nigdyNieustawiane.length)
  throw new Error(
    `Flagi kampanii bez ustawienia: ${flagiKampanii.nigdyNieustawiane.join(", ")}`,
  );
const grafKampanii = sprawdzGrafKampanii(kampania.definicje, kampania.narracja);
if (grafKampanii.martweGalezieZakonczen.length)
  console.warn(
    `Martwe galezie regul kampanii: ${grafKampanii.martweGalezieZakonczen.join(", ")}`,
  );
const katalogKampanii = new URL("../tresc/kampania/dist/", import.meta.url);
utworzKatalog(katalogKampanii, { recursive: true });
const narracjaKampanii = JSON.stringify(JSON.parse(kampania.narracja));
zapiszPlik(
  new URL("pakiet.json", katalogKampanii),
  JSON.stringify(kampania.definicje),
);
zapiszPlik(new URL("glowna.json", katalogKampanii), narracjaKampanii);
zapiszPlik(
  new URL("tozsamosc.json", katalogKampanii),
  JSON.stringify({
    hashNarracji: hash(narracjaKampanii),
    hashPakietu: hash(
      JSON.stringify({
        definicje: kampania.definicje,
        narracja: narracjaKampanii,
      }),
    ),
  }),
);
console.log(
  `Kampania: ${grafKampanii.liczbaSwiadectw} swiadectwa PASS; zakonczenia: ${grafKampanii.zakonczenia.join(", ")}`,
);
