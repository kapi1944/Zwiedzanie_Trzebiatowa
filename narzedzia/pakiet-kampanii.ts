import { readFileSync as odczytajPlik } from "node:fs";
import {
  type DefinicjaLokalizacji,
  schematDefinicjiGry,
  schematDefinicjiSceny,
  schematRejestruMiejsc,
} from "@zwiedzanie/schemat-tresci";
import { Compiler as KompilatorInk } from "inkjs/full";
import { odczytajPakiet, sprawdzSceny } from "./pakiet-gry.ts";
import { odczytajSiecNarracyjna } from "./siec-narracyjna.ts";

export function odczytajBankMiejsc() {
  const dane: unknown = JSON.parse(
    odczytajPlik(
      new URL("../tresc/kampania/bank-miejsc.json", import.meta.url),
      "utf8",
    ),
  );
  return schematRejestruMiejsc.parse(dane);
}

export function sprawdzPowiazaniaMiejsc(
  rejestr: ReturnType<typeof odczytajBankMiejsc>,
  lokalizacje: DefinicjaLokalizacji[],
) {
  for (const miejsce of rejestr)
    for (const id of miejsce.wykorzystanieWKampanii.idLokalizacji)
      if (!lokalizacje.some((lokalizacja) => lokalizacja.id === id))
        throw new Error(
          `Miejsce ${miejsce.id}: nieistniejaca lokalizacja kampanii ${id}.`,
        );
  for (const lokalizacja of lokalizacje) {
    const odpowiedniki = rejestr.filter(
      (miejsce) =>
        miejsce.wykorzystanieWKampanii.status === "WYKORZYSTANE" &&
        miejsce.wykorzystanieWKampanii.idLokalizacji.includes(lokalizacja.id),
    );
    if (odpowiedniki.length !== 1)
      throw new Error(
        `Lokalizacja ${lokalizacja.id} wymaga jednego odpowiednika WYKORZYSTANE w rejestrze.`,
      );
  }
}

export function odczytajKampanie() {
  const baza = odczytajPakiet();
  const katalog = new URL("../tresc/kampania/", import.meta.url);
  const rozszerzenie = JSON.parse(
    odczytajPlik(new URL("kampania.json", katalog), "utf8"),
  );
  if (
    !rozszerzenie.zakonczenia.every(
      (regula: { idScenyWejscia?: string }) => regula.idScenyWejscia,
    )
  )
    throw new Error(
      "Kazde autorskie zakonczenie kampanii wymaga sceny wejscia.",
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
  const bank = odczytajBankMiejsc();
  sprawdzPowiazaniaMiejsc(bank, definicje.lokalizacje);
  odczytajSiecNarracyjna(new Set(bank.map((miejsce) => miejsce.id)));
  return { definicje, sceny, narracja };
}
