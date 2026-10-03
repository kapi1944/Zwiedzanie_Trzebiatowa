import { createHash as utworzHash } from "node:crypto";
import {
  mkdirSync as utworzKatalog,
  writeFileSync as zapiszPlik,
} from "node:fs";
import { odczytajPakiet } from "./pakiet-gry.ts";
import { sprawdzDrogi } from "./sciezki-slice.ts";
import { analizujFlagi, utworzKontroleGrafu } from "./walidacja-contentu.ts";

const pakiet = odczytajPakiet();
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
const raport = sprawdzDrogi(
  pakiet.definicje,
  pakiet.narracja,
  kontrola.odwiedz,
);
kontrola.zakoncz();
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
