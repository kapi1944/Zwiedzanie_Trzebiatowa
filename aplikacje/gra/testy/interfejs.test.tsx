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

test.each([
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
])(
  "droga $nazwa: React, oba silniki i mini-final",
  async ({ nazwa, prolog, final, profil }) => {
    const wykonanie = vi.spyOn(silnik, "wykonajKrok");
    await pokaz();
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
    await kliknij(
      nazwa === "C"
        ? "Pomiń zagadkę i idź dalej"
        : "Symuluj rozwiązanie Hansken",
    );
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
    await kliknij(
      nazwa === "C"
        ? "Pomiń zagadkę i idź dalej"
        : "Opowieść o misce gorącej kaszy",
    );
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
  await kliknij("Zachowana baszta obronna");
  expect(sesja.odczytaj().stan.wynikiZagadek.zagadka_baszta?.wynik).toBe(
    "NIEUDANA",
  );
  await kliknij("Opowieść o misce gorącej kaszy");
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
  expect(kontener.querySelector('[role="status"]')?.textContent).toContain(
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
