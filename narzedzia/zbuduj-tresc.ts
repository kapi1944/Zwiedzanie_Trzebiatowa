import {
  mkdirSync as utworzKatalog,
  writeFileSync as zapiszPlik,
} from "node:fs";
import { odczytajPakiet } from "./pakiet-gry.ts";
import { sprawdzDrogi } from "./sciezki-slice.ts";

const pakiet = odczytajPakiet();
const raport = sprawdzDrogi(pakiet.definicje, pakiet.narracja);
const katalog = new URL("../tresc/trzebiatow-v1/dist/", import.meta.url);
utworzKatalog(katalog, { recursive: true });
zapiszPlik(
  new URL("pakiet.json", katalog),
  JSON.stringify(pakiet.definicje, null, 2),
);
zapiszPlik(new URL("glowna.json", katalog), pakiet.narracja);
console.log(
  `Pakiet Gry: ${raport.liczbaDrog} drog PASS; profile: ${raport.profile.join(", ")}.`,
);
