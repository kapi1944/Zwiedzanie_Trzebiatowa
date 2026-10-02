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
import Aplikacja from "../src/Aplikacja";
import { MagazynZapisu } from "../src/MagazynZapisu";
import { StatusPwa } from "../src/StatusPwa";
import { SesjaGry } from "../src/sesja-gry";

let kontener: HTMLDivElement;
let korzen: Korzen;
przedTestem(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  kontener = document.createElement("div");
  document.body.append(kontener);
  korzen = utworzKorzen(kontener);
});
poTescie(async () => {
  await wykonajReact(() => korzen.unmount());
  kontener.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function kliknij(tekst: string) {
  const przycisk = [...kontener.querySelectorAll("button")].find(
    (element) => element.textContent?.trim() === tekst,
  );
  if (!przycisk) throw new Error(`Brak przycisku ${tekst}`);
  await wykonajReact(async () => {
    przycisk.click();
  });
}

test("update wywoluje zapis przed aktywacja i nigdy sam nie przeladowuje", async () => {
  const kolejnosc: string[] = [];
  const zapis = vi.fn(async () => {
    kolejnosc.push("zapis");
  });
  const aktualizuj = vi.fn(async () => {
    kolejnosc.push("aktualizacja");
  });
  await wykonajReact(() =>
    korzen.render(
      <StatusPwa
        zajete={false}
        przygotujAktualizacje={zapis}
        pwa={{ dostepnaAktualizacja: true, gotoweOffline: true, aktualizuj }}
      />,
    ),
  );
  expect(kontener.textContent).toContain(
    "Dostępna jest nowa wersja. Zaktualizuj po zapisaniu postępu.",
  );
  expect(aktualizuj).not.toHaveBeenCalled();
  await kliknij("Zapisz postęp i zaktualizuj");
  expect(kolejnosc).toEqual(["zapis", "aktualizacja"]);
});
test("blad zapisu blokuje update i zachowuje sesje", async () => {
  const aktualizuj = vi.fn(async () => undefined);
  await wykonajReact(() =>
    korzen.render(
      <StatusPwa
        zajete={false}
        przygotujAktualizacje={async () => {
          throw new Error("QuotaExceeded");
        }}
        pwa={{ dostepnaAktualizacja: true, gotoweOffline: false, aktualizuj }}
      />,
    ),
  );
  await kliknij("Zapisz postęp i zaktualizuj");
  expect(aktualizuj).not.toHaveBeenCalled();
  expect(kontener.textContent).toContain("Aktualizacja nie powiodła się");
});
test("subtelny status reaguje na offline i online", async () => {
  await wykonajReact(() =>
    korzen.render(
      <StatusPwa
        pwa={undefined}
        zajete={false}
        przygotujAktualizacje={async () => undefined}
      />,
    ),
  );
  expect(kontener.textContent).toContain("Online");
  vi.stubGlobal("navigator", { onLine: false });
  await wykonajReact(() => window.dispatchEvent(new Event("offline")));
  expect(kontener.textContent).toContain("Offline");
  expect(kontener.querySelector('[role="alert"]')).toBeNull();
  vi.stubGlobal("navigator", { onLine: true });
  await wykonajReact(() => window.dispatchEvent(new Event("online")));
  expect(kontener.textContent).toContain("Online");
});
test("nowa aplikacja wznawia poprawny zapis i nie rozpoczyna gry od poczatku", async () => {
  const gra = new SesjaGry();
  gra.wybierz(0);
  gra.podpowiedz();
  const magazyn = new MagazynZapisu("test-ui");
  vi.spyOn(magazyn, "odczytaj").mockResolvedValue({
    zapis: gra.eksportujZapis(),
    pakiet: gra.eksportujPakiet(),
  });
  const uruchom = vi.fn(async () => new SesjaGry());
  await wykonajReact(async () => {
    korzen.render(<Aplikacja magazyn={magazyn} uruchom={uruchom} />);
  });
  await kliknij("Wznów opowieść");
  expect(kontener.querySelector("h1")?.textContent).toContain("Hansken");
  expect(kontener.textContent).toContain(gra.odczytaj().ramka.akapity[0]);
  expect(uruchom).not.toHaveBeenCalled();
});
test("niezgodny zapis pozostaje zachowany i blokuje zastapienie nowa gra", async () => {
  const magazyn = new MagazynZapisu("test-ui");
  vi.spyOn(magazyn, "odczytaj").mockRejectedValue(new Error("WYMAGA_MIGRACJI"));
  const zapis = vi.spyOn(magazyn, "zapisz");
  const uruchom = vi.fn(async () => new SesjaGry());
  await wykonajReact(async () => {
    korzen.render(<Aplikacja magazyn={magazyn} uruchom={uruchom} />);
  });
  expect(kontener.textContent).toContain("Poprzedni zapis pozostaje zachowany");
  expect(
    [...kontener.querySelectorAll("button")].find(
      (element) => element.textContent === "Rozpocznij opowieść",
    )?.disabled,
  ).toBe(true);
  expect(zapis).not.toHaveBeenCalled();
  expect(uruchom).not.toHaveBeenCalled();
});
test("aplikacja utrwala stan po akcji, blad IO pozwala ponowic zapis", async () => {
  const magazyn = new MagazynZapisu("test-ui");
  const gra = new SesjaGry();
  vi.spyOn(magazyn, "odczytaj").mockResolvedValue(undefined);
  const zapis = vi.spyOn(magazyn, "zapisz").mockResolvedValue(undefined);
  await wykonajReact(async () => {
    korzen.render(<Aplikacja magazyn={magazyn} uruchom={async () => gra} />);
  });
  await kliknij("Rozpocznij opowieść");
  zapis.mockRejectedValueOnce(new Error("QuotaExceeded"));
  await kliknij("Szukam tego, co można udowodnić.");
  expect(kontener.textContent).toContain(
    "Postęp nie jest bezpiecznie zapisany",
  );
  expect(kontener.querySelector("h1")?.textContent).toContain("Hansken");
  expect(gra.wymagaZapisu).toBe(true);
  await kliknij("Ponów zapis");
  expect(gra.wymagaZapisu).toBe(false);
  expect(kontener.textContent).toContain("Postęp zapisany na tym urządzeniu");
});
