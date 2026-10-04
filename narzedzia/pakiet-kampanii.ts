import { readFileSync as odczytajPlik } from "node:fs";
import {
  schematDefinicjiGry,
  schematDefinicjiSceny,
  schematKandydataMiejsca,
} from "@zwiedzanie/schemat-tresci";
import { Compiler as KompilatorInk } from "inkjs/full";
import { odczytajPakiet, sprawdzSceny } from "./pakiet-gry.ts";

export function odczytajBankMiejsc() {
  const dane: unknown = JSON.parse(
    odczytajPlik(
      new URL("../tresc/kampania/bank-miejsc.json", import.meta.url),
      "utf8",
    ),
  );
  if (!Array.isArray(dane)) throw new Error("Bank musi byc lista.");
  const bank = dane.map((element: unknown) =>
    schematKandydataMiejsca.parse(element),
  );
  if (new Set(bank.map((miejsce) => miejsce.id)).size !== bank.length)
    throw new Error("Duplikat w banku miejsc.");
  return bank;
}

export function odczytajKampanie() {
  const baza = odczytajPakiet();
  const katalog = new URL("../tresc/kampania/", import.meta.url);
  const rozszerzenie = JSON.parse(
    odczytajPlik(new URL("kampania.json", katalog), "utf8"),
  );
  const definicje = schematDefinicjiGry.parse({
    ...baza.definicje,
    manifest: { ...baza.definicje.manifest, wersjaTresci: "kampania-12.1" },
    ...Object.fromEntries(
      [
        "lokalizacje",
        "watki",
        "zadania",
        "zagadki",
        "scenki",
        "wybory",
        "zakonczenia",
        "zrodla",
        "przedmioty",
      ].map((pole) => [
        pole,
        [
          ...baza.definicje[pole as "lokalizacje"],
          ...(rozszerzenie[pole] ?? []),
        ],
      ]),
    ),
    kampania: rozszerzenie.kampania,
  });
  const sceny = [
    ...baza.sceny,
    ...rozszerzenie.sceny.map((scena: unknown) =>
      schematDefinicjiSceny.parse(scena),
    ),
  ];
  const zrodlo = odczytajPlik(
    new URL("../tresc/trzebiatow-v1/narracja/glowna.ink", import.meta.url),
    "utf8",
  ).replaceAll("-> END", "-> kontynuacja_kampanii");
  const kompilator = new KompilatorInk(
    `${zrodlo}\n${odczytajPlik(new URL("kampania.ink", katalog), "utf8")}`,
  );
  const historia = kompilator.Compile();
  if (kompilator.errors.length || kompilator.warnings.length)
    throw new Error([...kompilator.errors, ...kompilator.warnings].join("; "));
  historia.allowExternalFunctionFallbacks = false;
  historia.ValidateExternalBindings();
  const narracja = historia.ToJson();
  if (!narracja) throw new Error("Brak narracji kampanii.");
  sprawdzSceny(
    definicje,
    sceny.map((scena) => scena.id),
    narracja,
  );
  odczytajBankMiejsc();
  return { definicje, sceny, narracja };
}
