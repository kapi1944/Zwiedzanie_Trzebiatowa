import * as silnik from "@zwiedzanie/silnik-gry";
import { act as wykonajReact } from "react";
import {
  type Root as Korzen,
  createRoot as utworzKorzen,
} from "react-dom/client";
import {
  expect,
  afterEach as poTescie,
  beforeEach as przedTestem,
  test,
  vi,
} from "vitest";
import Aplikacja, { GranicaBledu } from "../src/Aplikacja";
import { zapiszUstawienia } from "../src/MenedzerWydajnosci";
import { SesjaGry } from "../src/sesja-gry";

let korzen: Korzen;
let kontener: HTMLDivElement;
let sesja: SesjaGry;

przedTestem(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.history.replaceState(null, "", "/");
  kontener = document.createElement("div");
  document.body.append(kontener);
  korzen = utworzKorzen(kontener);
});

poTescie(async () => {
  await wykonajReact(() => korzen.unmount());
  kontener.remove();
  vi.restoreAllMocks();
  localStorage.clear();
});

async function pokaz(
  uruchom = async () => {
    sesja = new SesjaGry();
    return sesja;
  },
) {
  await wykonajReact(() =>
    korzen.render(
      <GranicaBledu>
        <Aplikacja uruchom={uruchom} />
      </GranicaBledu>,
    ),
  );
}

function przycisk(tekst: string) {
  const element = [...kontener.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === tekst,
  );
  if (!element)
    throw new Error(`Brak przycisku: ${tekst}. ${kontener.textContent}`);
  return element;
}

async function kliknij(tekst: string) {
  await wykonajReact(async () => przycisk(tekst).click());
}

test("reczny fallback w Opowiesci bez otwierania mapy i bez GPS", async () => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  await kliknij("Potwierdź ręcznie");
  expect(sesja.odczytaj().stan.potwierdzoneLokalizacje).toEqual(["rynek"]);
  expect(kontener.textContent).toContain("Obecność potwierdzona.");
  expect(kontener.querySelector(".mapa")).toBeNull();
});

test("odmowa GPS pozostawia reczny fallback bez zapisu pozycji", async () => {
  const pomiar = vi.fn((_sukces, blad) => blad({ code: 1 }));
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: pomiar } });
  try {
    await pokaz();
    await kliknij("Rozpocznij opowieść");
    expect(pomiar).not.toHaveBeenCalled();
    await kliknij("Sprawdź moją lokalizację");
    expect(kontener.textContent).toContain("Odmówiono dostępu");
    expect(sesja.odczytaj().stan.potwierdzoneLokalizacje).toEqual([]);
    await kliknij("Potwierdź ręcznie");
    expect(sesja.odczytaj().stan.potwierdzoneLokalizacje).toEqual(["rynek"]);
  } finally {
    vi.unstubAllGlobals();
  }
});

test("GPS w promieniu wymaga swiadomego potwierdzenia bez przekazania wspolrzednych", async () => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  const geo = sesja.definicje.lokalizacje[0]?.geo;
  if (!geo) throw new Error("Brak geo rynku.");
  vi.stubGlobal("navigator", {
    geolocation: {
      getCurrentPosition: (sukces: PositionCallback) =>
        sukces({
          coords: {
            latitude: geo.szerokosc,
            longitude: geo.dlugosc,
            accuracy: 5,
          },
        } as GeolocationPosition),
    },
  });
  try {
    await kliknij("Sprawdź moją lokalizację");
    expect(sesja.odczytaj().stan.potwierdzoneLokalizacje).toEqual([]);
    await kliknij("Potwierdź obecność po pomiarze");
    expect(sesja.odczytaj().stan.potwierdzoneLokalizacje).toEqual(["rynek"]);
    expect(JSON.stringify(sesja.odczytaj().stan)).not.toContain("szerokosc");
  } finally {
    vi.unstubAllGlobals();
  }
});

test("start jest semantyczny, bez spoilerow i bez ladowania silnika", async () => {
  const uruchom = vi.fn(async () => new SesjaGry());
  await pokaz(uruchom);
  expect(kontener.querySelector("h1")?.textContent).toBe("Kronika nad Regą");
  expect(kontener.textContent).toContain("To wczesna wersja demonstracyjna.");
  expect(kontener.querySelector("main")).not.toBeNull();
  expect(
    kontener.querySelector('nav[aria-label="Główna nawigacja"]'),
  ).not.toBeNull();
  przycisk("Rozpocznij opowieść").focus();
  expect(document.activeElement).toBe(przycisk("Rozpocznij opowieść"));
  expect(uruchom).not.toHaveBeenCalled();
  await kliknij("Kronika");
  expect(kontener.textContent).toContain("Kronika jest jeszcze pusta");
  expect(kontener.textContent).not.toContain("Hansken");
  expect(kontener.textContent).not.toContain("Dwie notatki");
});

test.each(
  [
    {
      nazwa: "A",
      prolog: "Szukam tego, co można udowodnić.",
      final: "Najpierw zapisuję to, co potwierdzają ślady.",
      profil: "kronikarz",
    },
    {
      nazwa: "B",
      prolog: "Szukam tego, co ludzie zapamiętali.",
      final: "Najpierw zapisuję opowieść mieszkańców.",
      profil: "straznik_opowiesci",
    },
    {
      nazwa: "C",
      prolog: "Najpierw chcę wysłuchać obu stron.",
      final: "Zachowuję obie wersje i zaznaczam ich różny charakter.",
      profil: "lacznik",
    },
  ].flatMap((droga) =>
    (["PELNY", "EKO"] as const).map((profilWydajnosci) => ({
      ...droga,
      profilWydajnosci,
    })),
  ),
)(
  "droga $nazwa w $profilWydajnosci: React, oba silniki i mini-final",
  async ({ nazwa, prolog, final, profil, profilWydajnosci }) => {
    zapiszUstawienia({ profil: profilWydajnosci, ruch: "SYSTEMOWY" });
    const wykonanie = vi.spyOn(silnik, "wykonajKrok");
    await pokaz();
    expect(
      kontener.querySelector(".aplikacja")?.getAttribute("data-profil"),
    ).toBe(profilWydajnosci);
    await kliknij("Rozpocznij opowieść");
    expect(kontener.querySelector("h1")?.textContent).toBe("Rynek i Ratusz");
    expect(document.activeElement).toBe(kontener.querySelector("h1"));
    await kliknij("Wątki");
    expect(kontener.textContent).toContain("Odkrywasz");
    expect(kontener.textContent).not.toContain("AKTYWNY");
    await kliknij("Opowieść");
    await kliknij(prolog);
    expect(kontener.querySelector("h1")?.textContent).toContain("Hansken");
    expect(kontener.textContent).not.toContain("wzp_hansken");
    expect(kontener.textContent).not.toContain(
      "Otwieram miejsce na własną notatkę.",
    );
    if (nazwa === "B") await kliknij("Poproś o podpowiedź");
    if (nazwa === "C") await kliknij("Pomiń zagadkę i idź dalej");
    else await potwierdzObserwacje();
    expect(document.activeElement).toBe(
      kontener.querySelector("#wybierz-droge"),
    );
    await kliknij(
      nazwa === "A"
        ? "Otwieram miejsce na własną notatkę."
        : "Najpierw słucham, jak obraz staje się opowieścią.",
    );
    expect(kontener.querySelector("h1")?.textContent).toContain("Kościół");
    expect(kontener.textContent).toContain("opóźniona konsekwencja");
    if (nazwa === "A") {
      await kliknij("Zestawiam obie notatki.");
      await kliknij("Wracam do wspólnej drogi.");
    }
    await kliknij(
      nazwa === "B"
        ? "Zachowuję pytanie o pamięć tego miejsca."
        : "Zapisuję informację i jej źródło.",
    );
    expect(kontener.querySelector("h1")?.textContent).toBe("Baszta Kaszana");
    if (nazwa === "B") await kliknij("Poproś o podpowiedź");
    if (nazwa === "C") await kliknij("Pomiń zagadkę i idź dalej");
    else await odpowiedzNaZagadke("Opowieść o misce gorącej kaszy");
    await kliknij(final);
    expect(kontener.textContent).toContain("Podróż zapisana");
    expect(sesja.odczytaj().profil?.zakonczenieGlowne).toBe(profil);
    expect(sesja.odczytaj().profil?.epilogiWatkow).toHaveLength(2);
    expect(
      wykonanie.mock.calls.some(
        (wywolanie) => wywolanie[2].rodzaj === "DOKONAJ_WYBORU",
      ),
    ).toBe(true);
    expect(sesja.odczytaj().stan.dokonaneWybory).toHaveLength(
      nazwa === "A" ? 6 : 4,
    );
    await kliknij("Kronika");
    expect(kontener.textContent).toContain("Baszta");
    expect(kontener.textContent?.includes("Fragment Kroniki")).toBe(
      nazwa !== "C",
    );
    expect(kontener.textContent?.includes("Bonusowy fragment")).toBe(
      nazwa === "A",
    );
    await kliknij("Wątki");
    expect(kontener.textContent).toContain("Ukończony");
    expect(kontener.textContent).not.toContain("UKONCZONY");
    await kliknij("Opowieść");
    expect(kontener.textContent).toContain("Podróż zapisana");
  },
);

test("silnik odrzuca przedwczesny wybor i nie zmienia stanu", () => {
  const gra = new SesjaGry();
  gra.wybierz(0);
  const poprzedni = gra.odczytaj().stan;
  expect(() => gra.wybierz(0)).toThrow("Wybor nie jest dostepny");
  expect(gra.odczytaj().stan).toEqual(poprzedni);
  expect(gra.odczytaj().stan.wynikiZagadek.zagadka_hansken).toBeUndefined();
});

test("bledna odpowiedz Baszty pozwala ponowic i zakonczyc zagadke", async () => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  await kliknij("Najpierw chcę wysłuchać obu stron.");
  await kliknij("Pomiń zagadkę i idź dalej");
  await kliknij("Najpierw słucham, jak obraz staje się opowieścią.");
  await kliknij("Zapisuję informację i jej źródło.");
  await odpowiedzNaZagadke("Zachowana baszta obronna");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta).toBeUndefined();
  expect(sesja.odczytaj().stan.postepyZagadek.zagadka_baszta?.liczbaProb).toBe(
    1,
  );
  await odpowiedzNaZagadke("Opowieść o misce gorącej kaszy");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta?.wynik).toBe(
    "ROZWIAZANA_SAMODZIELNIE",
  );
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta?.liczbaProb).toBe(
    2,
  );
});

test("ladowanie jest oglaszane i blokuje drugi start", async () => {
  let zakoncz: ((gra: SesjaGry) => void) | undefined;
  const uruchom = vi.fn(
    () =>
      new Promise<SesjaGry>((rozwiaz) => {
        zakoncz = rozwiaz;
      }),
  );
  await pokaz(uruchom);
  await kliknij("Rozpocznij opowieść");
  expect(przycisk("Rozpocznij opowieść").disabled).toBe(true);
  expect(kontener.querySelector('main [role="status"]')?.textContent).toContain(
    "Przygotowuję",
  );
  await wykonajReact(() => zakoncz?.(new SesjaGry()));
  expect(uruchom).toHaveBeenCalledTimes(1);
});

test("niespojny pakiet ma bezpieczny ekran bledu", async () => {
  await pokaz(async () => new SesjaGry({}));
  await kliknij("Rozpocznij opowieść");
  expect(kontener.querySelector('[role="alert"]')?.textContent).toContain(
    "Wystąpił problem z uruchomieniem opowieści.",
  );
  expect(przycisk("Uruchom ponownie")).toBeDefined();
});

test("odrzucenie zdarzenia przez Silnik Gry zatrzymuje narracje", async () => {
  const wykonajKrok = silnik.wykonajKrok;
  vi.spyOn(silnik, "wykonajKrok").mockImplementation(
    (definicje, stan, zdarzenie) => {
      if (zdarzenie.rodzaj === "DOKONAJ_WYBORU")
        throw new Error("Odrzucone zdarzenie.");
      return wykonajKrok(definicje, stan, zdarzenie);
    },
  );
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  await kliknij("Szukam tego, co można udowodnić.");
  expect(kontener.querySelector('[role="alert"]')).not.toBeNull();
  expect(sesja.odczytaj().stan.aktualnaScena).toBe("prolog");
  expect(sesja.odczytaj().stan.dokonaneWybory).toEqual([]);
});

test("blad renderowania trafia do granicy bledu", async () => {
  function UszkodzonyWidok(): never {
    throw new Error("Uszkodzony widok.");
  }
  vi.spyOn(console, "error").mockImplementation(() => {});
  await wykonajReact(() =>
    korzen.render(
      <GranicaBledu>
        <UszkodzonyWidok />
      </GranicaBledu>,
    ),
  );
  expect(kontener.querySelector('[role="alert"]')?.textContent).toContain(
    "Wystąpił problem",
  );
});

test("debug jest ukryty domyslnie i dostepny tylko po wlaczeniu", async () => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  expect(kontener.querySelector(".debug")).toBeNull();
  window.history.replaceState(null, "", "/?debug=1");
  await kliknij("Wątki");
  expect(kontener.querySelector(".debug")?.textContent).toContain(
    "ostatnieZdarzenia",
  );
});

async function potwierdzObserwacje() {
  const pole = kontener.querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  );
  if (!pole) throw new Error("Brak potwierdzenia obserwacji.");
  await wykonajReact(() => pole.click());
  await kliknij("Zapisz obserwację");
}
async function odpowiedzNaZagadke(tekst: string) {
  const etykieta = [...kontener.querySelectorAll("label")].find(
    (element) => element.textContent?.trim() === tekst,
  );
  const pole = etykieta?.querySelector<HTMLInputElement>("input");
  if (!pole) throw new Error("Brak odpowiedzi wyboru.");
  await wykonajReact(() => pole.click());
  await kliknij("Sprawdź odpowiedź");
}

test.each([
  "ROZWIAZANA_SAMODZIELNIE",
  "ROZWIAZANA_Z_PODPOWIEDZIA",
  "ROZWIAZANA_Z_POMOCA",
  "POMINIETA",
  "NIEUDANA",
])("UI Hansken %s otwiera dalsza scene i zachowuje wynik", async (wynik) => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  await kliknij("Najpierw chcę wysłuchać obu stron.");
  expect(kontener.querySelector("fieldset legend")?.textContent).toContain(
    "sgraffito",
  );
  const pole = kontener.querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  );
  expect(pole?.required).toBe(true);
  expect(pole?.closest("label")?.textContent).toContain("bez zatwierdzania");
  expect(przycisk("Zapisz obserwację").disabled).toBe(true);
  if (wynik === "ROZWIAZANA_Z_PODPOWIEDZIA") {
    await kliknij("Poproś o podpowiedź");
    await kliknij("Poproś o podpowiedź");
    expect(kontener.querySelectorAll(".zadanie ol li")).toHaveLength(2);
    expect(przycisk("Poproś o podpowiedź").disabled).toBe(true);
  }
  if (wynik === "ROZWIAZANA_Z_POMOCA") {
    await kliknij("Potrzebuję pomocy");
    expect(
      sesja.odczytaj().stan.postepyZagadek.zagadka_hansken?.potrzebujePomocy,
    ).toBe(true);
    await kliknij("Kontynuuj z pomocą");
  } else if (wynik === "POMINIETA") await kliknij("Pomiń zagadkę i idź dalej");
  else if (wynik === "NIEUDANA")
    await kliknij("Zakończ zadanie bez rozstrzygnięcia");
  else await potwierdzObserwacje();
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_hansken?.wynik).toBe(
    wynik,
  );
  expect(kontener.textContent).not.toContain(wynik);
  expect(kontener.querySelector(".zadanie")).toBeNull();
  await kliknij("Najpierw słucham, jak obraz staje się opowieścią.");
  expect(kontener.querySelector("h1")?.textContent).toContain("Kościół");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_hansken?.wynik).toBe(
    wynik,
  );
});

test("podwojne wyslanie obserwacji zapisuje tylko jedna probe i nagrode", async () => {
  await pokaz();
  await kliknij("Rozpocznij opowieść");
  await kliknij("Najpierw chcę wysłuchać obu stron.");
  const pole = kontener.querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  );
  if (!pole) throw new Error("Brak obserwacji.");
  await wykonajReact(() => pole.click());
  const formularz = kontener.querySelector("form");
  if (!formularz) throw new Error("Brak formularza.");
  await wykonajReact(() => {
    formularz.requestSubmit();
    formularz.requestSubmit();
  });
  const stan = structuredClone(sesja.odczytaj().stan);
  expect(stan.wynikiZagadek.zagadka_hansken?.liczbaProb).toBe(1);
  expect(
    stan.dziennikZdarzen.filter(
      (wpis) => wpis.rodzaj === "POTWIERDZ_OBSERWACJE",
    ),
  ).toHaveLength(1);
  expect(
    stan.sladyIPrzedmioty.filter((id) => id === "fragment_kroniki_hansken"),
  ).toHaveLength(1);
  sesja.potwierdzObserwacje();
  expect(sesja.odczytaj().stan).toEqual(stan);
});

async function dojdzDoBaszty() {
  await kliknij("Rozpocznij opowieść");
  await kliknij("Najpierw chcę wysłuchać obu stron.");
  await kliknij("Pomiń zagadkę i idź dalej");
  await kliknij("Najpierw słucham, jak obraz staje się opowieścią.");
  await kliknij("Zapisuję informację i jej źródło.");
}

test("limit odpowiedzi nie zamyka zadania i pozostawia pomoc oraz final", async () => {
  await pokaz();
  await dojdzDoBaszty();
  expect(kontener.querySelectorAll('input[type="radio"]')).toHaveLength(2);
  for (const pole of kontener.querySelectorAll<HTMLInputElement>(
    'input[type="radio"]',
  )) {
    expect(pole.required).toBe(true);
    expect(pole.closest("label")?.textContent?.trim()).not.toBe("");
  }
  for (let proba = 0; proba < 3; proba++)
    await odpowiedzNaZagadke("Zachowana baszta obronna");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta).toBeUndefined();
  expect(sesja.odczytaj().stan.postepyZagadek.zagadka_baszta?.liczbaProb).toBe(
    3,
  );
  expect(przycisk("Sprawdź odpowiedź").disabled).toBe(true);
  await kliknij("Potrzebuję pomocy");
  await kliknij("Kontynuuj z pomocą");
  await kliknij("Zachowuję obie wersje i zaznaczam ich różny charakter.");
  expect(kontener.textContent).toContain("Podróż zapisana");
});

test.each([false, true])(
  "alternatywa Baszty z notatki, scenka=%s",
  async (scenka) => {
    await pokaz();
    await kliknij("Rozpocznij opowieść");
    await kliknij("Szukam tego, co można udowodnić.");
    await potwierdzObserwacje();
    await kliknij("Otwieram miejsce na własną notatkę.");
    if (scenka) {
      await kliknij("Zestawiam obie notatki.");
      await kliknij("Wracam do wspólnej drogi.");
    }
    await kliknij("Zapisuję informację i jej źródło.");
    await kliknij(
      scenka
        ? "Zastosuj rozróżnienie z dwóch notatek"
        : "Skorzystaj z notatki i fragmentu Kroniki",
    );
    expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta).toMatchObject({
      wynik: scenka ? "ROZWIAZANA_SAMODZIELNIE" : "ROZWIAZANA_Z_POMOCA",
      liczbaProb: 0,
    });
    await kliknij("Najpierw zapisuję to, co potwierdzają ślady.");
    expect(kontener.textContent).toContain("Podróż zapisana");
  },
);

test("formularz TEKST ma etykiete i przekazuje odpowiedz do realnego silnika", async () => {
  await pokaz(async () => {
    const definicje = structuredClone(new SesjaGry().definicje);
    const zagadki = definicje.zagadki.map((zagadka) => {
      if (zagadka.id !== "zagadka_baszta") return zagadka;
      const dane: Record<string, unknown> = { ...zagadka };
      delete dane.odpowiedzi;
      return {
        ...dane,
        typ: "TEKST",
        poprawneOdpowiedzi: ["kasza"],
        normalizacja: {
          trim: true,
          ignorujWielkoscLiter: true,
          usunPolskieZnaki: false,
        },
      };
    });
    sesja = new SesjaGry({ ...definicje, zagadki });
    return sesja;
  });
  await dojdzDoBaszty();
  const pole = kontener.querySelector<HTMLInputElement>("#odpowiedz-zagadki");
  if (!pole) throw new Error("Brak odpowiedzi tekstowej.");
  expect(
    kontener.querySelector('label[for="odpowiedz-zagadki"]')?.textContent,
  ).toBe("Twoja odpowiedź");
  expect(pole.required).toBe(true);
  expect(kontener.querySelector("fieldset legend")?.textContent).toContain(
    "legendę",
  );
  const wpisz = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  await wykonajReact(() => {
    wpisz?.call(pole, " KASZA ");
    pole.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await kliknij("Sprawdź odpowiedź");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta?.wynik).toBe(
    "ROZWIAZANA_SAMODZIELNIE",
  );
});
