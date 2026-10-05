export type Motyw = "light" | "dark";
export type WyborMotywu = Motyw | "auto";
export const kluczMotywu = "trzebiatow.motyw.v1";
export function odczytajWyborMotywu(): WyborMotywu {
  try {
    const zapisany = localStorage.getItem(kluczMotywu);
    if (zapisany === "light" || zapisany === "dark") return zapisany;
  } catch {
    // Brak pamieci nie blokuje wyswietlania gry.
  }
  return "auto";
}
export function odczytajMotyw(wybor = odczytajWyborMotywu()): Motyw {
  if (wybor !== "auto") return wybor;
  return typeof matchMedia === "function" &&
    matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
export function zastosujMotyw(motyw: Motyw): void {
  document.documentElement.dataset.theme = motyw;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", motyw === "dark" ? "#242720" : "#f3efe4");
}
export function zapiszMotyw(motyw: WyborMotywu): boolean {
  try {
    localStorage.setItem(kluczMotywu, motyw);
    return true;
  } catch {
    return false;
  }
}
