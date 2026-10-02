import type { Metadata as Metadane } from "next";
import type { ReactNode as WezelReact } from "react";
import "./style.css";

export const metadata: Metadane = {
  title: "Zwiedzanie Trzebiatowa",
  description: "Interaktywna gra terenowa. Projekt w przygotowaniu.",
};

export default function Uklad({
  children: zawartosc,
}: {
  children: WezelReact;
}) {
  return (
    <html lang="pl">
      <body>{zawartosc}</body>
    </html>
  );
}
