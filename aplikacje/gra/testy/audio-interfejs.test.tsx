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
import { MenedzerAudio } from "../src/MenedzerAudio";
import { SesjaGry } from "../src/sesja-gry";
import {
  domyslneAudio,
  odczytajUstawieniaAudio,
  zapiszUstawieniaAudio,
} from "../src/ustawienia-audio";

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
  localStorage.clear();
  vi.restoreAllMocks();
});
async function kliknij(tekst: string) {
  const przycisk = [...kontener.querySelectorAll("button")].find(
    (element) => element.textContent === tekst,
  );
  if (!przycisk) throw new Error(`Brak przycisku ${tekst}`);
  await wykonajReact(() => przycisk.click());
}
test("zapisane ON nie importuje audio przed gestem; visibility trafia do menedzera", async () => {
  const ustawienia = { ...domyslneAudio, muzyka: true };
  zapiszUstawieniaAudio(ustawienia);
  const menedzer = new MenedzerAudio(
    () => ({
      graj: vi.fn(),
      pauza: vi.fn(),
      zwolnij: vi.fn(),
      glosnosc: vi.fn(),
      przejscie: vi.fn(),
    }),
    { nastroje: { rynek: "/rynek.wav" }, dzwieki: {} },
    ustawienia,
    "EKO",
    async () => {},
    vi.fn(),
  );
  const widocznosc = vi.spyOn(menedzer, "ustawWidocznosc");
  const zaladujAudio = vi.fn(async () => ({
    utworzMenedzerAudio: () => menedzer,
  }));
  await wykonajReact(() =>
    korzen.render(<Aplikacja zaladujAudio={zaladujAudio} />),
  );
  expect(zaladujAudio).not.toHaveBeenCalled();
  await kliknij("Rozpocznij opowieść");
  expect(zaladujAudio).toHaveBeenCalledOnce();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  await wykonajReact(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  expect(widocznosc).toHaveBeenLastCalledWith(false);
  await kliknij("Ustawienia");
  await kliknij("Wycisz wszystko");
  expect(odczytajUstawieniaAudio()).toMatchObject({
    muzyka: false,
    dzwiek: false,
  });
});
test("odrzucenie importu audio nie blokuje startu i wyborow", async () => {
  zapiszUstawieniaAudio({ ...domyslneAudio, dzwiek: true });
  const gra = new SesjaGry();
  const zaladujAudio = vi.fn(async () => {
    throw new Error("offline audio");
  });
  await wykonajReact(() =>
    korzen.render(
      <Aplikacja zaladujAudio={zaladujAudio} uruchom={async () => gra} />,
    ),
  );
  await kliknij("Rozpocznij opowieść");
  await kliknij("Szukam tego, co można udowodnić.");
  expect(gra.odczytaj().stan.aktualnaScena).toBe("hansken");
  expect(kontener.textContent).not.toContain(
    "Wystąpił problem z uruchomieniem",
  );
  await kliknij("Ustawienia");
  expect(kontener.textContent).toContain(
    "Audio jest niedostępne lub zablokowane",
  );
});
test("OFF nie importuje audio nawet po rozpoczeciu", async () => {
  const zaladujAudio = vi.fn(async () => {
    throw new Error("nie wywolywac");
  });
  await wykonajReact(() =>
    korzen.render(<Aplikacja zaladujAudio={zaladujAudio} />),
  );
  await kliknij("Rozpocznij opowieść");
  expect(zaladujAudio).not.toHaveBeenCalled();
});
