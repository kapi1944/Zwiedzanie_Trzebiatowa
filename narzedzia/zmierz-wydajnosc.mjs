import { readFileSync as odczytajPlik } from "node:fs";
import { gzipSync as spakuj } from "node:zlib";

export function zmierzWydajnosc() {
  const katalog = new URL("../aplikacje/gra/dist/", import.meta.url);
  const manifest = JSON.parse(
    odczytajPlik(new URL(".vite/manifest.json", katalog), "utf8"),
  );
  const rozmiar = (plik) => spakuj(odczytajPlik(new URL(plik, katalog))).length;
  const poczatkowe = new Set();
  function odwiedz(klucz) {
    if (poczatkowe.has(klucz)) return;
    poczatkowe.add(klucz);
    for (const zaleznosc of manifest[klucz].imports ?? []) odwiedz(zaleznosc);
  }
  odwiedz("index.html");
  const style = new Set(
    [...poczatkowe].flatMap((klucz) => manifest[klucz].css ?? []),
  );
  return {
    initialJsGzip: [...poczatkowe].reduce(
      (suma, klucz) => suma + rozmiar(manifest[klucz].file),
      0,
    ),
    sesjaGzip: rozmiar(manifest["src/sesja-gry.ts"].file),
    mapaGzip: rozmiar(manifest["src/Mapa.tsx"].file),
    cssInitialGzip: [...style].reduce((suma, plik) => suma + rozmiar(plik), 0),
    cssMapaGzip: (manifest["src/Mapa.tsx"].css ?? []).reduce(
      (suma, plik) => suma + rozmiar(plik),
      0,
    ),
    poczatkowe: [...poczatkowe],
  };
}
