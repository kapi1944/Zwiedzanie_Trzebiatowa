import { expect, afterEach as poTescie, test, vi } from "vitest";
import { domyslneAudio } from "../src/ustawienia-audio";

const { dzwieki, wznow } = vi.hoisted(() => ({
  dzwieki: [] as {
    opcje: Record<string, unknown>;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    unload: ReturnType<typeof vi.fn>;
    volume: ReturnType<typeof vi.fn>;
    fade: ReturnType<typeof vi.fn>;
  }[],
  wznow: vi.fn(async () => {}),
}));
vi.mock("howler/dist/howler.core.min.js", () => ({
  Howler: { ctx: { state: "suspended", resume: wznow } },
  Howl: class {
    play = vi.fn(() => 7);
    pause = vi.fn();
    unload = vi.fn();
    volume = vi.fn();
    fade = vi.fn();
    constructor(public opcje: Record<string, unknown>) {
      dzwieki.push(this);
    }
  },
}));

import { utworzMenedzerAudio } from "../src/audio";

poTescie(() => {
  dzwieki.length = 0;
  vi.clearAllMocks();
});
test("Howler Core bez preload i autoplay, ponowne gesty nie duplikuja tracku", () => {
  const menedzer = utworzMenedzerAudio(
    { ...domyslneAudio, muzyka: true },
    "EKO",
    vi.fn(),
  );
  menedzer.wykonaj([{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: "rynek" }]);
  expect(dzwieki).toHaveLength(0);
  menedzer.aktywuj();
  const muzyka = dzwieki[0];
  expect(muzyka?.opcje).toMatchObject({
    preload: false,
    autoplay: false,
    loop: true,
    pool: 1,
    format: ["wav"],
  });
  menedzer.aktywuj();
  menedzer.aktywuj();
  expect(muzyka?.play).toHaveBeenCalledTimes(1);
  menedzer.ustawWidocznosc(false);
  expect(muzyka?.pause).toHaveBeenCalledWith(7);
  menedzer.ustawWidocznosc(true);
  expect(muzyka?.play).toHaveBeenLastCalledWith(7);
  expect(muzyka?.play).toHaveBeenCalledTimes(2);
  expect(dzwieki).toHaveLength(1);
  menedzer.zamknij();
  expect(muzyka?.unload).toHaveBeenCalledOnce();
});
test("blad ladowania i blad odtwarzania zwalniaja instancje, mozliwa ponowna proba", () => {
  const blad = vi.fn();
  const menedzer = utworzMenedzerAudio(
    { ...domyslneAudio, muzyka: true },
    "EKO",
    blad,
  );
  menedzer.aktywuj();
  menedzer.wykonaj([{ rodzaj: "USTAW_NASTROJ_MUZYKI", id: "rynek" }]);
  const pierwsza = dzwieki[0];
  if (!pierwsza) throw new Error("Brak muzyki");
  (pierwsza.opcje.onloaderror as () => void)();
  expect(blad).toHaveBeenCalledOnce();
  expect(pierwsza?.unload).toHaveBeenCalledOnce();
  menedzer.aktywuj();
  expect(dzwieki).toHaveLength(2);
  const druga = dzwieki[1];
  if (!druga) throw new Error("Brak ponownej proby");
  (druga.opcje.onplayerror as () => void)();
  expect(blad).toHaveBeenCalledTimes(2);
  menedzer.zamknij();
});
