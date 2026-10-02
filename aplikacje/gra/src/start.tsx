import { StrictMode as TrybScisly } from "react";
import { createRoot as utworzKorzen } from "react-dom/client";
import Aplikacja from "./Aplikacja";
import "./style.css";

const korzen = document.getElementById("korzen");
if (!korzen) throw new Error("Brak korzenia aplikacji gry.");

utworzKorzen(korzen).render(
  <TrybScisly>
    <Aplikacja />
  </TrybScisly>,
);
