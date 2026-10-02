import { StrictMode as TrybScisly } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import Aplikacja, { GranicaBledu } from "./Aplikacja";
import "./style.css";
import { useRegisterSW as uzyjServiceWorkera } from "virtual:pwa-register/react";
import { MagazynZapisu } from "./MagazynZapisu";

const magazyn = new MagazynZapisu();
function GraZPwa() {
  const {
    needRefresh: [dostepnaAktualizacja],
    offlineReady: [gotoweOffline],
    updateServiceWorker: aktualizuj,
  } = uzyjServiceWorkera();
  return (
    <Aplikacja
      magazyn={magazyn}
      pwa={{
        dostepnaAktualizacja,
        gotoweOffline,
        aktualizuj: () => aktualizuj(true),
      }}
    />
  );
}

const korzen = document.getElementById("korzen");
if (!korzen) throw new Error("Brak korzenia aplikacji gry.");

utworzKorzen(korzen).render(
  <TrybScisly>
    <GranicaBledu>
      <GraZPwa />
    </GranicaBledu>
  </TrybScisly>,
);
