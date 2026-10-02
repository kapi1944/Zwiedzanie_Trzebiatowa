import {
  schematDefinicjiGry,
  schematStanuGry,
} from "@zwiedzanie/schemat-tresci";
import { z } from "zod";

const schematHashu = z.string().regex(/^[a-f0-9]{64}$/);
const schematTagu = z.strictObject({
  rodzaj: z.enum(["dzwiek", "nastroj", "kronika", "sygnal"]),
  wartosc: z.string(),
});
export const schematZapisuGry = z
  .strictObject({
    wersjaFormatuZapisu: z.literal(1),
    idGry: z.string().min(1),
    wersjaGry: z.string().min(1),
    wersjaTresci: z.string().min(1),
    wersjaSchematZapisu: z.literal(1),
    idSesji: z.string().min(1),
    idPakietu: schematHashu,
    hashNarracji: schematHashu,
    stanGry: schematStanuGry,
    stanNarracji: z.strictObject({
      zapisInk: z.string().min(1),
      ramka: z.strictObject({
        akapity: z.array(z.string()),
        opcje: z.array(
          z.strictObject({
            indeks: z.number().int().nonnegative(),
            tekst: z.string(),
            tagi: z.array(schematTagu),
          }),
        ),
        tagi: z.array(schematTagu),
        moznaKontynuowac: z.literal(false),
      }),
      komunikaty: z.array(z.string()),
    }),
    zapisanoDnia: z.iso.datetime(),
  })
  .refine(
    (zapis) =>
      [
        "idGry",
        "wersjaGry",
        "wersjaTresci",
        "wersjaSchematZapisu",
        "idSesji",
      ].every(
        (pole) =>
          zapis[pole as keyof typeof zapis] ===
          zapis.stanGry[pole as keyof typeof zapis.stanGry],
      ),
    { message: "Niespojna tozsamosc zapisu." },
  );
export type ZapisGry = z.infer<typeof schematZapisuGry>;
export const schematPakietuOffline = z.strictObject({
  idPakietu: schematHashu,
  hashNarracji: schematHashu,
  definicje: schematDefinicjiGry,
  narracja: z.string().min(1),
});
export type PakietOffline = z.infer<typeof schematPakietuOffline>;
export type ZgodnoscZapisu = "ZGODNY" | "WYMAGA_MIGRACJI" | "NIEZGODNY";
export function ocenZgodnoscZapisu(
  dane: unknown,
  pakiet: PakietOffline,
): ZgodnoscZapisu {
  if (
    !dane ||
    typeof dane !== "object" ||
    !("idGry" in dane) ||
    dane.idGry !== pakiet.definicje.manifest.idGry
  )
    return "NIEZGODNY";
  if (
    !("wersjaFormatuZapisu" in dane) ||
    dane.wersjaFormatuZapisu !== 1 ||
    !("wersjaSchematZapisu" in dane) ||
    dane.wersjaSchematZapisu !==
      pakiet.definicje.manifest.wersjaSchematZapisu ||
    !("wersjaTresci" in dane) ||
    dane.wersjaTresci !== pakiet.definicje.manifest.wersjaTresci ||
    !("wersjaGry" in dane) ||
    dane.wersjaGry !== pakiet.definicje.manifest.wersjaGry
  )
    return "WYMAGA_MIGRACJI";
  const wynik = schematZapisuGry.safeParse(dane);
  return wynik.success &&
    wynik.data.idPakietu === pakiet.idPakietu &&
    wynik.data.hashNarracji === pakiet.hashNarracji
    ? "ZGODNY"
    : "NIEZGODNY";
}
export async function sprawdzPakietOffline(
  dane: unknown,
): Promise<PakietOffline> {
  const pakiet = schematPakietuOffline.parse(dane);
  const hash = async (tekst: string) => {
    const bajty = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(tekst),
    );
    return Array.from(new Uint8Array(bajty), (bajt) =>
      bajt.toString(16).padStart(2, "0"),
    ).join("");
  };
  if (
    (await hash(pakiet.narracja)) !== pakiet.hashNarracji ||
    (await hash(
      JSON.stringify({
        definicje: pakiet.definicje,
        narracja: pakiet.narracja,
      }),
    )) !== pakiet.idPakietu
  )
    throw new Error("Uszkodzony pakiet tresci offline.");
  return pakiet;
}
