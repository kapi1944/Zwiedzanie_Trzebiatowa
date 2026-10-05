import { act as wykonajReact } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { przygotujWpisyKroniki } from "../src/kronika";
import { SesjaGry } from "../src/sesja-gry";
import { WidokKroniki } from "../src/WidokKroniki";

function wybierz(gra: SesjaGry, id: string) {
  const opcja = gra
    .odczytaj()
    .opcje.find((element) =>
      element.tagi.some((tag) => tag.rodzaj === "sygnal" && tag.wartosc === id),
    );
  if (!opcja) throw new Error(`Brak wyboru ${id}`);
  gra.wybierz(opcja.indeks);
}

function dojdzDoBaszty() {
  const gra = new SesjaGry();
  wybierz(gra, "prolog_obie");
  gra.pomin();
  wybierz(gra, "hansken_slucham");
  wybierz(gra, "kosciol_zapis");
  gra.pomin();
  return gra;
}

test("Kronika ukrywa niezebrane miejsca, wiedze, przedmioty, zagadki i watki", () => {
  const gra = new SesjaGry();
  const dane = gra.odczytaj();
  const wpisy = przygotujWpisyKroniki(gra.definicje, dane);
  for (const miejsce of gra.definicje.lokalizacje)
    expect(wpisy.some((wpis) => wpis.id === `miejsce_${miejsce.id}`)).toBe(
      dane.stan.odwiedzoneLokalizacje.includes(miejsce.id),
    );
  for (const przedmiot of gra.definicje.przedmioty)
    expect(wpisy.some((wpis) => wpis.id === `przedmiot_${przedmiot.id}`)).toBe(
      dane.stan.sladyIPrzedmioty.includes(przedmiot.id),
    );
  for (const zagadka of gra.definicje.zagadki)
    expect(wpisy.some((wpis) => wpis.id === `zagadka_${zagadka.id}`)).toBe(
      !!dane.stan.wynikiZagadek[zagadka.id],
    );
  for (const watek of gra.definicje.watki)
    expect(wpisy.some((wpis) => wpis.id === `watek_${watek.id}`)).toBe(
      ["AKTYWNY", "UKONCZONY", "POMINIETY"].includes(
        dane.stan.watki[watek.id] ?? "",
      ),
    );
  expect(wpisy.some((wpis) => wpis.id === "wiedza_legenda_kaszy")).toBe(false);
});

test("poznana legenda, wynik i zrodla wracaja z zapisu bez ujawniania przyszlej wiedzy", () => {
  const gra = dojdzDoBaszty();
  const wpisy = przygotujWpisyKroniki(gra.definicje, gra.odczytaj());
  const legenda = wpisy.find((wpis) => wpis.id === "wiedza_legenda_kaszy");
  expect(legenda?.warstwa).toBe("LEGENDA / PRZEKAZ");
  expect(legenda?.zrodla.map((zrodlo) => zrodlo.id)).toContain("gmina_zabytki");
  expect(
    wpisy.some(
      (wpis) =>
        wpis.rodzaj === "Rezultat zagadki" && wpis.tekst.includes("Pominięta"),
    ),
  ).toBe(true);
  expect(wpisy.some((wpis) => wpis.id === "wiedza_wiedza_teren_ratusz")).toBe(
    false,
  );
  const odtworzona = SesjaGry.przywroc(
    gra.eksportujZapis(),
    gra.eksportujPakiet(),
  );
  expect(
    przygotujWpisyKroniki(odtworzona.definicje, odtworzona.odczytaj()),
  ).toEqual(wpisy);
});

test("pewnosc informacji decyduje o warstwie, a nie samo dawne oznaczenie FAKT", () => {
  const gra = new SesjaGry();
  const wzor = gra.definicje.kampania?.wiedza[0];
  if (!wzor) throw new Error("Brak wiedzy kampanii");
  const dane = gra.odczytaj();
  dane.wiedza = [
    {
      ...wzor,
      id: "stara",
      klasyfikacja: "FAKT",
      tekst: "FAKT: Informacja bez pewności.",
    },
    {
      ...wzor,
      id: "pewna",
      informacjeHistoryczne: [
        {
          id: "informacja",
          tekst: "Treść próbna do testu klasyfikacji.",
          klasyfikacja: "FAKT",
          poziomPewnosci: "POTWIERDZONE",
          wymagaDodatkowejWeryfikacji: false,
          zrodla: [
            {
              opisBibliograficzny: "Źródło próbne testu",
              rodzajZrodla: "INNE",
            },
          ],
        },
      ],
    },
    {
      ...wzor,
      id: "niepewna",
      informacjeHistoryczne: [
        {
          id: "informacja",
          tekst: "Hipoteza próbna.",
          klasyfikacja: "DO_WERYFIKACJI",
          poziomPewnosci: "NIEPEWNE",
          wymagaDodatkowejWeryfikacji: true,
          zrodla: [
            {
              opisBibliograficzny: "Źródło próbne testu",
              rodzajZrodla: "INNE",
            },
          ],
        },
      ],
    },
  ];
  const wpisy = przygotujWpisyKroniki(gra.definicje, dane);
  expect(wpisy.find((wpis) => wpis.id === "wiedza_stara")?.warstwa).toBe(
    "INFORMACJA DO WERYFIKACJI",
  );
  expect(wpisy.find((wpis) => wpis.id === "wiedza_stara")?.tekst).not.toMatch(
    /^FAKT:/,
  );
  expect(
    wpisy.find((wpis) => wpis.id === "wiedza_pewna_informacja")?.warstwa,
  ).toBe("FAKT HISTORYCZNY");
  expect(
    wpisy.find((wpis) => wpis.id === "wiedza_niepewna_informacja")?.uwagi,
  ).toContain("NIEPEWNE — wymaga dodatkowej weryfikacji");
});

test("duzy bank renderuje najwyzej 20 zdobytych wpisow, filtruje i przenosi fokus bez sieci", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const gra = new SesjaGry();
  const dane = gra.odczytaj();
  const wzor = gra.definicje.kampania?.wiedza[0];
  if (!wzor) throw new Error("Brak wiedzy kampanii");
  dane.wiedza = Array.from({ length: 1000 }, (_, indeks) => ({
    ...wzor,
    id: `test_${indeks}`,
    nazwa: `Zdobyty wpis ${indeks}`,
    klasyfikacja: "FABULARYZOWANE" as const,
  }));
  const kontener = document.createElement("div");
  document.body.append(kontener);
  const korzen = utworzKorzen(kontener);
  const pobierz = vi.fn();
  vi.stubGlobal("fetch", pobierz);
  try {
    await wykonajReact(() =>
      korzen.render(<WidokKroniki definicje={gra.definicje} dane={dane} />),
    );
    expect(kontener.querySelectorAll(".kronika-wpisy > li")).toHaveLength(20);
    const nastepne = [...kontener.querySelectorAll("button")].find(
      (element) => element.textContent === "Następne wpisy",
    );
    await wykonajReact(() => nastepne?.click());
    expect(kontener.querySelector('[role="status"]')?.textContent).toContain(
      "21–40",
    );
    expect(document.activeElement).toBe(kontener.querySelector("h2"));
    const filtr = kontener.querySelector("select");
    if (!filtr) throw new Error("Brak filtra");
    await wykonajReact(() => {
      filtr.value = "FAKT HISTORYCZNY";
      filtr.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(kontener.querySelectorAll(".kronika-wpisy > li")).toHaveLength(0);
    expect(kontener.textContent).toContain("Brak zdobytych wpisów pasujących");
    expect(kontener.textContent).not.toContain("Legenda kaszana");
    expect(pobierz).not.toHaveBeenCalled();
  } finally {
    await wykonajReact(() => korzen.unmount());
    kontener.remove();
    vi.unstubAllGlobals();
  }
});
