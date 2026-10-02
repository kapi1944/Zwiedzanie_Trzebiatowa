import { Story as HistoriaInk } from "inkjs";
import type { RamkaNarracji, SesjaNarracji } from "./modele.js";
import type { MostNarracji } from "./most-narracji.js";
import { parsujTagiNarracji } from "./tagi.js";

interface DaneSesji {
  historia: HistoriaInk;
  tresc: string;
  most: MostNarracji | undefined;
}

const sesje = new WeakMap<SesjaNarracji, DaneSesji>();

function odczytajSesje(sesja: SesjaNarracji): DaneSesji {
  const dane = sesje.get(sesja);
  if (!dane) throw new Error("Nieznana sesja narracji.");
  return dane;
}

function przekazKontekst(dane: DaneSesji): void {
  const zmienne = dane.most?.odczytajZmienne();
  if (!zmienne) return;
  for (const [nazwa, wartosc] of zmienne) {
    const poprzednia = dane.historia.variablesState.$(nazwa);
    if (poprzednia === null || typeof poprzednia !== typeof wartosc) {
      throw new Error("Brak zmiennej Ink lub niezgodny typ powiazania.");
    }
  }
  for (const [nazwa, wartosc] of zmienne)
    dane.historia.variablesState.$(nazwa, wartosc);
}

function zbudujRamke(
  historia: HistoriaInk,
  akapity: string[],
  tagi: readonly string[] = [],
): RamkaNarracji {
  return {
    akapity,
    opcje: historia.currentChoices.map((opcja) => ({
      indeks: opcja.index,
      tekst: opcja.text.trim(),
      tagi: parsujTagiNarracji(opcja.tags ?? []),
    })),
    tagi: parsujTagiNarracji(tagi),
    moznaKontynuowac: historia.canContinue,
  };
}

export function utworzSesjeNarracji(
  tresc: string,
  most?: MostNarracji,
): SesjaNarracji {
  const historia = new HistoriaInk(tresc.replace(/^\uFEFF/, ""));
  historia.allowExternalFunctionFallbacks = false;
  historia.ValidateExternalBindings();
  const dane = { historia, tresc, most };
  przekazKontekst(dane);
  const sesja: SesjaNarracji = Object.freeze({ rodzaj: "sesja-narracji" });
  sesje.set(sesja, dane);
  return sesja;
}

export function kontynuujNarracje(sesja: SesjaNarracji): RamkaNarracji {
  const dane = odczytajSesje(sesja);
  przekazKontekst(dane);
  if (!dane.historia.canContinue) return zbudujRamke(dane.historia, []);
  const tekst = dane.historia.Continue()?.trim() ?? "";
  return zbudujRamke(
    dane.historia,
    tekst ? [tekst] : [],
    dane.historia.currentTags ?? [],
  );
}

export function wybierzOpcjeNarracji(
  sesja: SesjaNarracji,
  indeks: number,
): void {
  const dane = odczytajSesje(sesja);
  if (
    dane.historia.canContinue ||
    !Number.isInteger(indeks) ||
    !dane.historia.currentChoices.some((opcja) => opcja.index === indeks)
  )
    throw new Error("Opcja narracji nie jest teraz dostepna.");
  przekazKontekst(dane);
  dane.historia.ChooseChoiceIndex(indeks);
}

export function eksportujStanNarracji(
  sesja: SesjaNarracji,
  hashNarracji?: string,
): string {
  const dane = odczytajSesje(sesja);
  przekazKontekst(dane);
  return JSON.stringify({
    ...(hashNarracji
      ? { wersja: 2, hashNarracji }
      : { wersja: 1, tresc: dane.tresc }),
    stanInk: dane.historia.state.ToJson(),
  });
}

export function przywrocStanNarracji(
  sesja: SesjaNarracji,
  zapis: string,
  hashNarracji?: string,
): void {
  const dane = odczytajSesje(sesja);
  const stan: unknown = JSON.parse(zapis);
  if (
    typeof stan !== "object" ||
    stan === null ||
    !("wersja" in stan) ||
    !(
      (stan.wersja === 1 &&
        "tresc" in stan &&
        stan.tresc === dane.tresc &&
        !hashNarracji) ||
      (stan.wersja === 2 &&
        !!hashNarracji &&
        "hashNarracji" in stan &&
        stan.hashNarracji === hashNarracji)
    ) ||
    !("stanInk" in stan) ||
    typeof stan.stanInk !== "string"
  )
    throw new Error("Niepoprawny zapis lub inna wersja historii.");
  const historia = new HistoriaInk(dane.tresc.replace(/^\uFEFF/, ""));
  historia.allowExternalFunctionFallbacks = false;
  historia.ValidateExternalBindings();
  historia.state.LoadJson(stan.stanInk);
  const przywrocone = { ...dane, historia };
  przekazKontekst(przywrocone);
  sesje.set(sesja, przywrocone);
}
