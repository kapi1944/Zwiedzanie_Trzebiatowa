import { resolve as rozwiazSciezke } from "node:path";
import { preview as uruchomPodglad } from "vite";

export default async function przygotujPodglad() {
  const podglad = await uruchomPodglad({
    root: rozwiazSciezke(import.meta.dirname, "../../aplikacje/gra"),
    preview: { host: "127.0.0.1", port: 4173, strictPort: true, open: false },
  });

  return async function zamknijPodglad() {
    await new Promise<void>((zakoncz, odrzuc) => {
      podglad.httpServer.close((blad) => (blad ? odrzuc(blad) : zakoncz()));
    });
  };
}
