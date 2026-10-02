import { readFileSync as odczytajPlik } from "node:fs";
import {
  schematDefinicjiGry,
  schematDefinicjiSceny,
} from "@zwiedzanie/schemat-tresci";
import { Story as HistoriaInk, Compiler as KompilatorInk } from "inkjs/full";
import { parseDocument as parsujDokument } from "yaml";

export function parsujYaml(tekst: string): unknown {
  const dokument = parsujDokument(tekst, { uniqueKeys: true, version: "1.2" });
  if (dokument.errors.length || dokument.warnings.length)
    throw new Error(
      "Niepoprawny YAML: bledy, duplikaty kluczy lub nieznane tagi.",
    );
  return dokument.toJS({ maxAliasCount: 0 });
}

export function odczytajPakiet(
  katalog = new URL("../tresc/trzebiatow-v1/", import.meta.url),
) {
  const czytaj = (plik: string) =>
    parsujYaml(odczytajPlik(new URL(plik, katalog), "utf8"));
  const definicje = schematDefinicjiGry.parse({
    manifest: czytaj("manifest.yaml"),
    lokalizacje: czytaj("lokalizacje.yaml"),
    watki: czytaj("watki.yaml"),
    zadania: czytaj("zadania.yaml"),
    zagadki: czytaj("zagadki.yaml"),
    scenki: czytaj("scenki-opcjonalne.yaml"),
    wybory: czytaj("wybory.yaml"),
    zakonczenia: czytaj("zakonczenia.yaml"),
    zrodla: czytaj("zrodla.yaml"),
    zasoby: czytaj("zasoby/manifest.yaml"),
    przedmioty: czytaj("slady.yaml"),
  });
  const rejestr = czytaj("sceny.yaml");
  if (!Array.isArray(rejestr)) throw new Error("Rejestr scen musi byc lista.");
  const sceny = rejestr.map((scena: unknown) =>
    schematDefinicjiSceny.parse(scena),
  );
  if (new Set(sceny.map((scena) => scena.id)).size !== sceny.length)
    throw new Error("Duplikat ID sceny.");
  for (const scena of sceny) {
    for (const id of scena.idZrodla)
      if (!definicje.zrodla.some((zrodlo) => zrodlo.id === id))
        throw new Error("Brak zrodla sceny.");
    if (scena.klasyfikacja !== "FABULARYZOWANE" && !scena.idZrodla.length)
      throw new Error("Scena historyczna wymaga zrodla.");
  }
  const zrodloInk = odczytajPlik(
    new URL("narracja/glowna.ink", katalog),
    "utf8",
  );
  const kompilator = new KompilatorInk(zrodloInk);
  const historia = kompilator.Compile();
  if (kompilator.errors.length || kompilator.warnings.length)
    throw new Error(
      `Blad kompilacji Ink: ${[...kompilator.errors, ...kompilator.warnings].join("; ")}`,
    );
  historia.allowExternalFunctionFallbacks = false;
  historia.ValidateExternalBindings();
  const narracja = historia.ToJson();
  if (typeof narracja !== "string") throw new Error("Brak JSON Ink.");
  sprawdzSceny(
    definicje,
    sceny.map((scena) => scena.id),
    narracja,
  );
  return { definicje, sceny, narracja };
}

export function sprawdzSceny(
  definicje: ReturnType<typeof schematDefinicjiGry.parse>,
  sceny: readonly string[],
  narracja: string,
): void {
  const historia = new HistoriaInk(narracja);
  const odwolania = [
    definicje.manifest.scenaStartowa,
    ...definicje.lokalizacje.map((element) => element.idSceny),
    ...definicje.scenki.map((element) => element.idSceny),
    ...definicje.wybory.flatMap((element) => [
      element.idSceny,
      element.nastepnaScena,
    ]),
    ...definicje.wybory.flatMap((element) =>
      element.efekty
        .filter((efekt) => efekt.rodzaj === "POKAZ_SCENE")
        .map((efekt) => efekt.id),
    ),
    ...definicje.zagadki.flatMap((element) =>
      Object.values(element.konsekwencje).flatMap((konsekwencja) =>
        konsekwencja.efekty
          .filter((efekt) => efekt.rodzaj === "POKAZ_SCENE")
          .map((efekt) => efekt.id),
      ),
    ),
  ];
  for (const id of [...sceny, ...odwolania]) {
    if (!sceny.includes(id) || !historia.KnotContainerWithName(id))
      throw new Error(`Nieistniejaca scena: ${id}.`);
  }
}
