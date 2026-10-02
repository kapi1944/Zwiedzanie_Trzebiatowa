export type ProfilWydajnosci = "AUTOMATYCZNY" | "PELNY" | "EKO";
export type TrybRuchu = "SYSTEMOWY" | "OGRANICZONY" | "PELNY";
export type WariantAssetu = "MALY" | "STANDARDOWY" | "HD";
export interface UstawieniaWydajnosci {
  profil: ProfilWydajnosci;
  ruch: TrybRuchu;
}
export interface WskazowkiUrzadzenia {
  rdzenie?: number | undefined;
  pamiec?: number | undefined;
  oszczedzanieDanych?: boolean | undefined;
  polaczenie?: string | undefined;
  ograniczonyRuch?: boolean | undefined;
}
export const domyslneUstawienia: UstawieniaWydajnosci = {
  profil: "AUTOMATYCZNY",
  ruch: "SYSTEMOWY",
};
const kluczUstawien = "trzebiatow.wydajnosc.v1";

export function odczytajWskazowki(): WskazowkiUrzadzenia {
  if (typeof navigator === "undefined") return {};
  const urzadzenie = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  return {
    rdzenie: urzadzenie.hardwareConcurrency,
    pamiec: urzadzenie.deviceMemory,
    oszczedzanieDanych: urzadzenie.connection?.saveData,
    polaczenie: urzadzenie.connection?.effectiveType,
    ograniczonyRuch:
      typeof matchMedia === "function"
        ? matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
  };
}

export function MenedzerWydajnosci(
  ustawienia: UstawieniaWydajnosci,
  wskazowki: WskazowkiUrzadzenia = {},
) {
  const wystarczajaceDane =
    Number.isFinite(wskazowki.rdzenie) &&
    (wskazowki.rdzenie ?? 0) > 4 &&
    Number.isFinite(wskazowki.pamiec) &&
    (wskazowki.pamiec ?? 0) > 4;
  const slabaSiec = ["slow-2g", "2g", "3g"].includes(
    wskazowki.polaczenie ?? "",
  );
  const profil =
    ustawienia.profil === "AUTOMATYCZNY"
      ? wystarczajaceDane && !wskazowki.oszczedzanieDanych && !slabaSiec
        ? "PELNY"
        : "EKO"
      : ustawienia.profil;
  return {
    profil,
    ograniczonyRuch:
      ustawienia.ruch === "SYSTEMOWY"
        ? wskazowki.ograniczonyRuch === true
        : ustawienia.ruch === "OGRANICZONY",
    wariantAssetu: (profil === "EKO" ? "MALY" : "STANDARDOWY") as WariantAssetu,
    wiekPozycji: profil === "EKO" ? 60000 : 0,
  };
}

export function wybierzAsset(
  warianty: Partial<Record<WariantAssetu, string>> & { STANDARDOWY: string },
  profil: "PELNY" | "EKO",
): string {
  return (
    (profil === "EKO" ? warianty.MALY : warianty.STANDARDOWY) ??
    warianty.STANDARDOWY
  );
}

export function odczytajUstawienia(): UstawieniaWydajnosci {
  try {
    const dane = JSON.parse(localStorage.getItem(kluczUstawien) ?? "null");
    if (
      dane &&
      ["AUTOMATYCZNY", "PELNY", "EKO"].includes(dane.profil) &&
      ["SYSTEMOWY", "OGRANICZONY", "PELNY"].includes(dane.ruch)
    )
      return dane;
  } catch {
    // Brak dostepu do pamieci nie blokuje gry.
  }
  return { ...domyslneUstawienia };
}

export function zapiszUstawienia(ustawienia: UstawieniaWydajnosci): boolean {
  try {
    localStorage.setItem(kluczUstawien, JSON.stringify(ustawienia));
    return true;
  } catch {
    return false;
  }
}
