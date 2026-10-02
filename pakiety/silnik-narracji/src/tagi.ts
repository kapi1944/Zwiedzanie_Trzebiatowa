import type { RodzajTagu, TagNarracji } from "./modele.js";

const dozwoloneTagi: Readonly<Record<RodzajTagu, readonly string[]>> = {
  dzwiek: ["przejscie", "przewrocenie_kartki", "subtelny_metal", "atmosfera"],
  nastroj: ["cisza", "tajemnica", "rynek", "sacrum", "napiecie", "final"],
  kronika: ["hansken"],
  sygnal: [],
};

export function parsujTagiNarracji(tagi: readonly string[]): TagNarracji[] {
  const wynik: TagNarracji[] = [];
  for (const tag of tagi) {
    const dopasowanie = /^#?([a-z]+):([a-z][a-z0-9_]*)$/.exec(tag.trim());
    if (!dopasowanie) continue;
    const [, rodzaj, wartosc] = dopasowanie;
    if (!rodzaj || !wartosc || !Object.hasOwn(dozwoloneTagi, rodzaj)) continue;
    const rodzajTagu = rodzaj as RodzajTagu;
    if (
      rodzajTagu === "sygnal" ||
      dozwoloneTagi[rodzajTagu].includes(wartosc)
    ) {
      wynik.push({ rodzaj: rodzajTagu, wartosc });
    }
  }
  return wynik;
}
