import { useEffect as uzyjEfektu, useState as uzyjStanu } from "react";

export interface ObslugaPwa {
  dostepnaAktualizacja: boolean;
  gotoweOffline: boolean;
  aktualizuj: () => Promise<void>;
}
export function StatusPwa({
  pwa,
  zajete,
  przygotujAktualizacje,
  bladAktualizacji,
}: {
  pwa: ObslugaPwa | undefined;
  zajete: boolean;
  przygotujAktualizacje: () => Promise<void>;
  bladAktualizacji?: () => void;
}) {
  const [online, ustawOnline] = uzyjStanu(navigator.onLine !== false);
  const [aktualizowanie, ustawAktualizowanie] = uzyjStanu(false);
  const [blad, ustawBlad] = uzyjStanu<string>();
  uzyjEfektu(() => {
    const sprawdz = () => ustawOnline(navigator.onLine !== false);
    window.addEventListener("online", sprawdz);
    window.addEventListener("offline", sprawdz);
    return () => {
      window.removeEventListener("online", sprawdz);
      window.removeEventListener("offline", sprawdz);
    };
  }, []);
  async function aktualizuj() {
    ustawAktualizowanie(true);
    try {
      await przygotujAktualizacje();
      await pwa?.aktualizuj();
    } catch {
      bladAktualizacji?.();
      ustawBlad(
        "Aktualizacja nie powiodła się. Zachowano bieżącą sesję; spróbuj ponownie po zapisaniu postępu.",
      );
    } finally {
      ustawAktualizowanie(false);
    }
  }
  return (
    <aside className="status-pwa" aria-label="Stan aplikacji">
      <p role="status">
        {online ? "Online" : "Offline"}
        {pwa?.gotoweOffline ? " · Gra gotowa do pracy offline" : ""}
      </p>
      {pwa?.dostepnaAktualizacja && (
        <div>
          <p>Dostępna jest nowa wersja. Zaktualizuj po zapisaniu postępu.</p>
          <p>
            Aktualizacja odświeży aplikację. Bieżąca podróż zachowa przypięty
            pakiet treści.
          </p>
          <button
            type="button"
            disabled={zajete || aktualizowanie}
            onClick={aktualizuj}
          >
            Zapisz postęp i zaktualizuj
          </button>
        </div>
      )}
      {blad && <p role="status">{blad}</p>}
    </aside>
  );
}
