import { readFileSync as odczytajPlik } from "node:fs";
import { schematId } from "@zwiedzanie/schemat-tresci";
import { z } from "zod";

const schematWarunkuSieci = z.strictObject({
  rodzaj: z.enum(["WSZYSTKIE", "DOWOLNY"]),
  idWezlow: z.array(schematId),
});
const schematSieci = z.strictObject({
  wersja: z.literal(1),
  status: z.literal("PROPOZYCJA"),
  osie: z
    .array(
      z.strictObject({
        id: schematId,
        nazwa: z.string().min(1),
        pytanie: z.string().min(1),
        status: z.literal("PROPOZYCJA"),
      }),
    )
    .min(1),
  wezly: z
    .array(
      z.strictObject({
        id: schematId,
        idOsi: schematId,
        idMiejsc: z.array(schematId).min(1),
        rodzaj: z.enum(["WEJSCIE", "ROZWINIECIE", "SPLOT", "SCENA_POZNIEJSZA"]),
        widocznosc: z.enum(["JAWNA", "UKRYTA"]),
        opis: z.string().min(1),
        warunek: schematWarunkuSieci,
        warianty: z.array(
          z.strictObject({
            id: schematId,
            warunek: schematWarunkuSieci,
            opis: z.string().min(1),
          }),
        ),
        status: z.literal("PROPOZYCJA"),
        statusWeryfikacji: z.literal("DO_WERYFIKACJI"),
      }),
    )
    .min(1),
});
export type SiecNarracyjna = z.infer<typeof schematSieci>;

function spelniaWarunek(
  warunek: SiecNarracyjna["wezly"][number]["warunek"],
  ukonczone: ReadonlySet<string>,
) {
  if (!warunek.idWezlow.length) return true;
  return warunek.rodzaj === "WSZYSTKIE"
    ? warunek.idWezlow.every((id) => ukonczone.has(id))
    : warunek.idWezlow.some((id) => ukonczone.has(id));
}

// Symulacja autora; nie tworzy stanu gry ani flag runtime.
export function dostepneWezly(
  siec: SiecNarracyjna,
  ukonczone: ReadonlySet<string>,
) {
  if ([...ukonczone].some((id) => !siec.wezly.some((wezel) => wezel.id === id)))
    throw new Error("Nieznany ukonczony wezel.");
  return siec.wezly
    .filter(
      (wezel) =>
        !ukonczone.has(wezel.id) && spelniaWarunek(wezel.warunek, ukonczone),
    )
    .map((wezel) => ({
      ...wezel,
      warianty: wezel.warianty.filter((wariant) =>
        spelniaWarunek(wariant.warunek, ukonczone),
      ),
    }));
}

export function sprawdzSiecNarracyjna(
  dane: unknown,
  idMiejsc: ReadonlySet<string>,
) {
  const siec = schematSieci.parse(dane);
  const osie = new Set(siec.osie.map((os) => os.id));
  const wezly = new Set(siec.wezly.map((wezel) => wezel.id));
  const warianty = siec.wezly.flatMap((wezel) =>
    wezel.warianty.map((wariant) => wariant.id),
  );
  if (
    osie.size !== siec.osie.length ||
    wezly.size !== siec.wezly.length ||
    new Set(warianty).size !== warianty.length
  )
    throw new Error("Duplikat osi, wezla lub wariantu.");
  for (const wezel of siec.wezly) {
    if (
      !osie.has(wezel.idOsi) ||
      wezel.idMiejsc.some((id) => !idMiejsc.has(id)) ||
      new Set(wezel.idMiejsc).size !== wezel.idMiejsc.length
    )
      throw new Error(`Niepoprawne powiazania miejsca lub osi: ${wezel.id}`);
    for (const warunek of [
      wezel.warunek,
      ...wezel.warianty.map((wariant) => wariant.warunek),
    ])
      if (
        warunek.idWezlow.some((id) => !wezly.has(id) || id === wezel.id) ||
        new Set(warunek.idWezlow).size !== warunek.idWezlow.length
      )
        throw new Error(`Niepoprawne powiazania wezlow: ${wezel.id}`);
    if (
      (wezel.rodzaj === "WEJSCIE") !== (wezel.warunek.idWezlow.length === 0) ||
      (wezel.rodzaj === "WEJSCIE" && wezel.widocznosc !== "JAWNA")
    )
      throw new Error(`Wejscie musi byc jawne i niezalezne: ${wezel.id}`);
    if (
      wezel.rodzaj === "SPLOT" &&
      (wezel.warunek.rodzaj !== "WSZYSTKIE" ||
        new Set(
          wezel.warunek.idWezlow.map(
            (id) => siec.wezly.find((element) => element.id === id)?.idOsi,
          ),
        ).size < 2)
    )
      throw new Error(`Splot wymaga wezlow z roznych osi: ${wezel.id}`);
  }
  for (const os of siec.osie) {
    if (
      !siec.wezly.some(
        (wezel) => wezel.idOsi === os.id && wezel.rodzaj === "WEJSCIE",
      )
    )
      throw new Error(`Os bez niezaleznego wejscia: ${os.id}`);
    const ukonczone = new Set<string>();
    while (true) {
      const dostepne = dostepneWezly(siec, ukonczone).filter(
        (wezel) => wezel.idOsi === os.id,
      );
      if (!dostepne.length) break;
      for (const wezel of dostepne) ukonczone.add(wezel.id);
    }
    if (
      !siec.wezly.some(
        (wezel) =>
          wezel.idOsi === os.id &&
          wezel.rodzaj === "SCENA_POZNIEJSZA" &&
          ukonczone.has(wezel.id),
      )
    )
      throw new Error(
        `Os nie prowadzi samodzielnie do pozniejszej sceny: ${os.id}`,
      );
  }
  const ukonczone = new Set<string>();
  while (true) {
    const dostepne = dostepneWezly(siec, ukonczone);
    if (!dostepne.length) break;
    for (const wezel of dostepne) ukonczone.add(wezel.id);
  }
  if (ukonczone.size !== siec.wezly.length)
    throw new Error("Nieosiagalny wezel lub zakleszczenie sieci.");
  return siec;
}

export function odczytajSiecNarracyjna(idMiejsc: ReadonlySet<string>) {
  return sprawdzSiecNarracyjna(
    JSON.parse(
      odczytajPlik(
        new URL("../tresc/kampania/siec-narracyjna.json", import.meta.url),
        "utf8",
      ),
    ),
    idMiejsc,
  );
}
