import { przygotujWidokWyprawy } from "@zwiedzanie/silnik-gry/wyprawa";
import { act as wykonajReact } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import { expect, test } from "vitest";
import Aplikacja from "../src/Aplikacja";
import { SesjaGry } from "../src/sesja-gry";

function wybierz(gra: SesjaGry, id: string) {
  const opcja = gra
    .odczytaj()
    .opcje.find((element) =>
      element.tagi.some((tag) => tag.rodzaj === "sygnal" && tag.wartosc === id),
    );
  if (!opcja) throw new Error(`Brak wyboru ${id}`);
  gra.wybierz(opcja.indeks);
}
function odczytajWyprawe(gra: SesjaGry) {
  const dane = gra.odczytaj();
  return przygotujWidokWyprawy(gra.definicje, dane.stan, dane.opcje);
}
function rozdroze() {
  const gra = new SesjaGry();
  wybierz(gra, "prolog_obie");
  gra.pomin();
  wybierz(gra, "hansken_slucham");
  wybierz(gra, "kosciol_zapis");
  gra.pomin();
  wybierz(gra, "baszta_obie");
  wybierz(gra, "rozpocznij_kampanie");
  return gra;
}

test("Quest Engine ukrywa przyszle miejsca, nierozpoczete watki i niezdobyte wskazowki", () => {
  const gra = rozdroze();
  const dane = gra.odczytaj();
  expect(odczytajWyprawe(gra).cele.map((cel) => cel.id)).toEqual([
    "hansken",
    "ratusz",
    "mury",
  ]);
  expect(odczytajWyprawe(gra).cele.some((cel) => cel.id === "palac")).toBe(
    false,
  );
  const stan = structuredClone(dane.stan);
  const watek = gra.definicje.watki[0];
  if (!watek) throw new Error("Brak wątku");
  for (const status of ["DOSTEPNY", "ZABLOKOWANY"] as const) {
    stan.watki[watek.id] = status;
    expect(
      przygotujWidokWyprawy(gra.definicje, stan, dane.opcje).watki.some(
        (element) => element.id === watek.id,
      ),
    ).toBe(false);
  }
  for (const status of ["AKTYWNY", "UKONCZONY", "POMINIETY"] as const) {
    stan.watki[watek.id] = status;
    expect(
      przygotujWidokWyprawy(gra.definicje, stan, dane.opcje).watki.find(
        (element) => element.id === watek.id,
      )?.status,
    ).toBe(status);
  }
  for (const wskazowka of odczytajWyprawe(gra).wskazowki)
    expect([
      ...dane.stan.sladyIPrzedmioty,
      ...dane.stan.odkryteScenki,
    ]).toContain(wskazowka.id);
  stan.odblokowaneLokalizacje = stan.odblokowaneLokalizacje.filter(
    (id) => id !== "ratusz",
  );
  expect(
    przygotujWidokWyprawy(gra.definicje, stan, dane.opcje).cele.some(
      (cel) => cel.id === "ratusz",
    ),
  ).toBe(false);
});

test("UI prezentuje legalne alternatywy i wybiera cel przez istniejaca sesje bez spoilerow", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const gra = rozdroze();
  const kontener = document.createElement("div");
  document.body.append(kontener);
  const korzen = utworzKorzen(kontener);
  const kliknij = async (tekst: string) => {
    const przycisk = [...kontener.querySelectorAll("button")].find(
      (element) => element.textContent?.trim() === tekst,
    );
    if (!przycisk) throw new Error(`Brak przycisku ${tekst}`);
    await wykonajReact(() => przycisk.click());
  };
  try {
    await wykonajReact(() =>
      korzen.render(<Aplikacja uruchom={async () => gra} />),
    );
    await kliknij("Rozpocznij opowieść");
    await kliknij("Wątki");
    const tekst = kontener.querySelector("main")?.textContent ?? "";
    expect(tekst).toContain("Możesz wybrać kierunek");
    expect(tekst).toContain("Ratusz — wieżyczka zegarowa");
    expect(tekst).not.toContain("Pałac Książęcy");
    for (const watek of gra.definicje.watki)
      if (
        !odczytajWyprawe(gra).watki.some((element) => element.id === watek.id)
      )
        expect(tekst).not.toContain(watek.nazwa.replace("WĄTEK ", ""));
    for (const przedmiot of gra.definicje.przedmioty)
      if (!gra.odczytaj().stan.sladyIPrzedmioty.includes(przedmiot.id))
        expect(tekst).not.toContain(przedmiot.nazwa);
    for (const final of gra.definicje.zakonczenia)
      expect(tekst).not.toContain(final.nazwa);
    const cel = odczytajWyprawe(gra).cele.find(
      (element) => element.id === "ratusz",
    );
    if (!cel) throw new Error("Brak celu Ratusz");
    await kliknij(cel.tekst);
    expect(gra.odczytaj().stan.aktualnaScena).toBe("ratusz_obserwacja");
    await kliknij("Wątki");
    expect(kontener.querySelector("main")?.textContent).not.toContain(
      "Idę do murów obronnych.",
    );
    expect(odczytajWyprawe(gra).cele).toEqual([]);
    const odtworzona = SesjaGry.przywroc(
      gra.eksportujZapis(),
      gra.eksportujPakiet(),
    );
    expect(odczytajWyprawe(odtworzona)).toEqual(odczytajWyprawe(gra));
  } finally {
    await wykonajReact(() => korzen.unmount());
    kontener.remove();
    localStorage.clear();
  }
});
