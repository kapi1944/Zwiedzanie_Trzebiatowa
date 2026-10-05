export type Motyw = "light" | "dark";
export const kluczMotywu = "trzebiatow.motyw.v1";
export function odczytajMotyw(): Motyw {
  try {
    const zapisany = localStorage.getItem(kluczMotywu);
    if (zapisany === "light" || zapisany === "dark") return zapisany;
  } catch {
    // Brak pamieci nie blokuje wyswietlania gry.
  }
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
export function zapiszMotyw(motyw: Motyw): boolean {
  try {
    localStorage.setItem(kluczMotywu, motyw);
    return true;
  } catch {
    return false;
  }
}
