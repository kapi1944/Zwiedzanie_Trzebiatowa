import {
  type GeometriaMapy,
  naEkran,
  type ObiektMapy,
  projektuj,
  type WidokMapy,
} from "./geometria";

export function rysujMiasto(
  pioro: CanvasRenderingContext2D,
  geometria: GeometriaMapy,
  szerokosc: number,
  wysokosc: number,
  widok: WidokMapy,
  poziom: number,
  eko: boolean,
) {
  const punkt = (para: number[], wysokoscBudynku = 0) =>
    naEkran(
      projektuj(
        { dlugosc: para[0] ?? 0, szerokosc: para[1] ?? 0 },
        wysokoscBudynku,
      ),
      widok,
      szerokosc,
      wysokosc,
    );
  const skala = Math.min(szerokosc / 1200, wysokosc / 900) * widok.zoom;
  const etykiety: { nazwa: string; x: number; y: number }[] = [];
  const zajeteNapisy: { x: number; y: number; polowa: number }[] = [];
  function napisz(nazwa: string, x: number, y: number, wazny: boolean) {
    pioro.font = wazny ? "bold 12px Georgia" : "11px Georgia";
    const polowa = pioro.measureText(nazwa).width / 2 + 3;
    if (
      x - polowa < 8 ||
      x + polowa > szerokosc - 8 ||
      y < 20 ||
      y > wysokosc - 8 ||
      zajeteNapisy.some(
        (napis) =>
          Math.abs(napis.x - x) < napis.polowa + polowa &&
          Math.abs(napis.y - y) < 16,
      )
    )
      return;
    zajeteNapisy.push({ x, y, polowa });
    pioro.textAlign = "center";
    pioro.lineWidth = 3;
    pioro.strokeStyle = "#f4e6c9";
    pioro.strokeText(nazwa, x, y);
    pioro.fillStyle = wazny ? "#3c2b20" : "#584232";
    pioro.fillText(nazwa, x, y);
  }
  const linia = (punkty: number[][], wysokoscBudynku = 0) => {
    pioro.beginPath();
    punkty.forEach((para, indeks) => {
      const miejsce = punkt(para, wysokoscBudynku);
      if (!indeks) pioro.moveTo(miejsce.x, miejsce.y);
      else pioro.lineTo(miejsce.x, miejsce.y);
    });
  };
  pioro.clearRect(0, 0, szerokosc, wysokosc);
  const papier = pioro.createLinearGradient(0, 0, szerokosc, wysokosc);
  papier.addColorStop(0, "#e4c893");
  papier.addColorStop(0.5, "#f4e6c9");
  papier.addColorStop(1, "#dec08d");
  pioro.fillStyle = papier;
  pioro.fillRect(0, 0, szerokosc, wysokosc);
  // Akwarela i kreskowanie nie zmieniaja geometrii.
  for (const obiekt of geometria.obiekty.filter((obiekt) =>
    ["zielen", "woda", "wyspa"].includes(obiekt.rodzaj),
  )) {
    const domkniety =
      JSON.stringify(obiekt.punkty[0]) === JSON.stringify(obiekt.punkty.at(-1));
    linia(obiekt.punkty);
    pioro.strokeStyle = "#63817d";
    pioro.lineWidth = 1;
    if (domkniety) {
      pioro.fillStyle =
        obiekt.rodzaj === "woda"
          ? "#93b4b1"
          : obiekt.rodzaj === "wyspa"
            ? "#e6d6b4"
            : "#adb58b";
      pioro.fill("evenodd");
      pioro.stroke();
    }
    // Otwarte osie ciekow bez obrysu brzegow pozostaja cienka kreska zrodlowa.
    else if (obiekt.rodzaj === "woda" && obiekt.tagi.tunnel !== "yes") {
      pioro.lineWidth = 2 * skala;
      pioro.stroke();
    }
  }
  for (const obiekt of geometria.obiekty.filter(
    (obiekt) => obiekt.rodzaj === "droga",
  )) {
    if (
      poziom === 1 &&
      ["service", "footway", "path"].includes(obiekt.tagi.highway ?? "")
    )
      continue;
    const piesza = ["footway", "path", "steps"].includes(
      obiekt.tagi.highway ?? "",
    );
    linia(obiekt.punkty);
    pioro.lineWidth =
      (piesza ? 2 : obiekt.tagi.highway === "primary" ? 10 : 6) * skala;
    pioro.strokeStyle = "#aa9877";
    pioro.lineJoin = "round";
    pioro.lineCap = "round";
    pioro.stroke();
    pioro.lineWidth = Math.max(1, pioro.lineWidth - 1.5);
    pioro.strokeStyle = "#f8edd4";
    pioro.stroke();
    if (obiekt.tagi.bridge === "yes") {
      pioro.lineWidth = 1;
      pioro.strokeStyle = "#594e3c";
      pioro.stroke();
    }
  }
  const budynki = geometria.obiekty
    .filter((obiekt) => obiekt.rodzaj === "budynek")
    .sort(
      (lewy, prawy) =>
        punkt(lewy.punkty[0] ?? []).y - punkt(prawy.punkty[0] ?? []).y,
    );
  for (const obiekt of budynki) rysujBudynek(obiekt);
  function rysujBudynek(obiekt: ObiektMapy) {
    const dol = obiekt.punkty.map((para) => punkt(para));
    if (
      dol.every(
        (miejsce) =>
          miejsce.x < -100 ||
          miejsce.x > szerokosc + 100 ||
          miejsce.y < -100 ||
          miejsce.y > wysokosc + 100,
      )
    )
      return;
    const wyrozniony =
      ["299734923", "371202011", "382942478"].includes(obiekt.id) ||
      obiekt.tagi.amenity === "townhall";
    const wysokoscBudynku =
      obiekt.id === "371202011"
        ? 17
        : obiekt.id === "382942478"
          ? 30
          : Math.min(
              32,
              Number(obiekt.tagi.height) ||
                Number(obiekt.tagi["building:levels"] ?? 2) * 3,
            );
    const dach = obiekt.punkty.map((para) => punkt(para, wysokoscBudynku));
    pioro.lineWidth = wyrozniony ? 1 : 0.55;
    pioro.strokeStyle = "#654e39";
    for (let indeks = 1; indeks < dol.length; indeks++) {
      const a = dol[indeks - 1];
      const b = dol[indeks];
      const c = dach[indeks];
      const d = dach[indeks - 1];
      if (!a || !b || !c || !d) continue;
      pioro.beginPath();
      pioro.moveTo(a.x, a.y);
      pioro.lineTo(b.x, b.y);
      pioro.lineTo(c.x, c.y);
      pioro.lineTo(d.x, d.y);
      pioro.closePath();
      pioro.fillStyle = b.x > a.x ? "#c2ad85" : "#e3d2ae";
      pioro.fill();
      pioro.stroke();
      if (poziom >= 2 && !eko && Math.hypot(b.x - a.x, b.y - a.y) > 12) {
        pioro.strokeStyle = "#917a58";
        for (let podzial = 1; podzial < 4; podzial++) {
          const t = podzial / 4;
          pioro.beginPath();
          pioro.moveTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
          pioro.lineTo(d.x + (c.x - d.x) * t, d.y + (c.y - d.y) * t);
          pioro.stroke();
        }
        pioro.strokeStyle = "#654e39";
      }
    }
    linia(obiekt.punkty, wysokoscBudynku);
    pioro.closePath();
    for (const otwor of obiekt.otwory ?? []) {
      otwor.forEach((para, indeks) => {
        const miejsce = punkt(para, wysokoscBudynku);
        if (!indeks) pioro.moveTo(miejsce.x, miejsce.y);
        else pioro.lineTo(miejsce.x, miejsce.y);
      });
      pioro.closePath();
    }
    const barwy = ["#a65c42", "#b47750", "#9b8061", "#807c67", "#ba805f"];
    pioro.fillStyle = barwy[Number(obiekt.id) % barwy.length] ?? "#a65c42";
    pioro.fill("evenodd");
    pioro.stroke();
    // Podbarwione polacie pozostaja wewnatrz rzeczywistego obrysu, bez obrotu budynku.
    const srodekGeo = {
      dlugosc:
        obiekt.punkty.reduce((suma, para) => suma + (para[0] ?? 0), 0) /
        obiekt.punkty.length,
      szerokosc:
        obiekt.punkty.reduce((suma, para) => suma + (para[1] ?? 0), 0) /
        obiekt.punkty.length,
    };
    const srodekDachu = naEkran(
      projektuj(
        srodekGeo,
        wysokoscBudynku + (obiekt.id === "371202011" ? 4 : 3),
      ),
      widok,
      szerokosc,
      wysokosc,
    );
    pioro.save();
    pioro.clip("evenodd");
    for (let indeks = 1; indeks < dach.length; indeks++) {
      const a = dach[indeks - 1];
      const b = dach[indeks];
      if (!a || !b) continue;
      pioro.beginPath();
      pioro.moveTo(a.x, a.y);
      pioro.lineTo(b.x, b.y);
      pioro.lineTo(srodekDachu.x, srodekDachu.y);
      pioro.closePath();
      pioro.fillStyle = b.x > a.x ? "#8d503e55" : "#e2aa6755";
      pioro.fill();
    }
    pioro.restore();
    if (poziom >= 2 && !eko) {
      linia(obiekt.punkty, wysokoscBudynku);
      pioro.closePath();
      for (const otwor of obiekt.otwory ?? []) {
        otwor.forEach((para, indeks) => {
          const miejsce = punkt(para, wysokoscBudynku);
          if (!indeks) pioro.moveTo(miejsce.x, miejsce.y);
          else pioro.lineTo(miejsce.x, miejsce.y);
        });
        pioro.closePath();
      }
      pioro.save();
      pioro.clip("evenodd");
      pioro.strokeStyle = "#79513e";
      pioro.lineWidth = 0.4;
      const minX = Math.min(...dach.map((miejsce) => miejsce.x));
      const maxX = Math.max(...dach.map((miejsce) => miejsce.x));
      const minY = Math.min(...dach.map((miejsce) => miejsce.y));
      const maxY = Math.max(...dach.map((miejsce) => miejsce.y));
      for (let kreska = minX; kreska < maxX; kreska += 4) {
        pioro.beginPath();
        pioro.moveTo(kreska, minY);
        pioro.lineTo(kreska + 8, maxY);
        pioro.stroke();
      }
      pioro.restore();
    }
    // Sylwetki wg NID i gminy; podzial wysokosci i rozmiary detalu sa stylizacja.
    // Zachodnia wieza kosciola i wschodnia wiezyczka Ratusza pozostaja na obrysie OSM.
    if (obiekt.id === "382942478" || obiekt.tagi.amenity === "townhall") {
      const zachod = obiekt.id === "382942478";
      const skrajny = obiekt.punkty.reduce((wybrany, para) =>
        (
          zachod
            ? (para[0] ?? 0) < (wybrany[0] ?? 0)
            : (para[0] ?? 0) > (wybrany[0] ?? 0)
        )
          ? para
          : wybrany,
      );
      const podstawa = {
        dlugosc: (skrajny[0] ?? 0) * 0.7 + srodekGeo.dlugosc * 0.3,
        szerokosc: (skrajny[1] ?? 0) * 0.7 + srodekGeo.szerokosc * 0.3,
      };
      const szerokoscWiezy = zachod ? 7 : 2.7;
      const dolWiezy = naEkran(
        projektuj(podstawa, wysokoscBudynku),
        widok,
        szerokosc,
        wysokosc,
      );
      const goraWiezy = naEkran(
        projektuj(podstawa, zachod ? 65 : 15),
        widok,
        szerokosc,
        wysokosc,
      );
      const wierzcholek = naEkran(
        projektuj(podstawa, zachod ? 90 : 19),
        widok,
        szerokosc,
        wysokosc,
      );
      const polowa = szerokoscWiezy * skala;
      pioro.beginPath();
      pioro.moveTo(dolWiezy.x - polowa, dolWiezy.y);
      pioro.lineTo(goraWiezy.x - polowa, goraWiezy.y);
      pioro.lineTo(goraWiezy.x + polowa, goraWiezy.y);
      pioro.lineTo(dolWiezy.x + polowa, dolWiezy.y);
      pioro.closePath();
      pioro.fillStyle = zachod ? "#ab7352" : "#e5c985";
      pioro.fill();
      pioro.strokeStyle = "#4c3627";
      pioro.stroke();
      pioro.beginPath();
      pioro.moveTo(goraWiezy.x - polowa * 1.15, goraWiezy.y);
      pioro.lineTo(wierzcholek.x, wierzcholek.y);
      pioro.lineTo(goraWiezy.x + polowa * 1.15, goraWiezy.y);
      pioro.closePath();
      pioro.fillStyle = zachod ? "#685b49" : "#81634c";
      pioro.fill();
      pioro.stroke();
      if (poziom > 1) {
        pioro.beginPath();
        pioro.arc(
          goraWiezy.x,
          goraWiezy.y + (dolWiezy.y - goraWiezy.y) * 0.35,
          Math.max(1, polowa * 0.4),
          0,
          Math.PI * 2,
        );
        pioro.fillStyle = "#efe4c4";
        pioro.fill();
        pioro.stroke();
      }
    }
    if (obiekt.id === "371202011") {
      for (let indeks = 1; indeks < dach.length; indeks++) {
        const a = dach[indeks - 1];
        const b = dach[indeks];
        if (!a || !b) continue;
        pioro.beginPath();
        pioro.moveTo(a.x, a.y);
        pioro.lineTo(srodekDachu.x, srodekDachu.y);
        pioro.lineTo(b.x, b.y);
        pioro.closePath();
        pioro.fillStyle = indeks % 2 ? "#a66847" : "#b67a55";
        pioro.fill();
        pioro.stroke();
      }
    }
    if (wyrozniony && obiekt.tagi.name && poziom > 1) {
      const srodekX =
        dach.reduce((suma, miejsce) => suma + miejsce.x, 0) / dach.length;
      const srodekY = Math.min(...dach.map((miejsce) => miejsce.y));
      const nazwa =
        obiekt.id === "382942478"
          ? "Kościół Mariacki"
          : obiekt.id === "299734923"
            ? "Pałac Książęcy"
            : obiekt.tagi.amenity === "townhall"
              ? "Ratusz"
              : obiekt.tagi.name;
      etykiety.push({ nazwa, x: srodekX, y: srodekY - 8 });
    }
  }
  for (const etykieta of etykiety)
    napisz(etykieta.nazwa, etykieta.x, etykieta.y, true);
  if (poziom >= 2) {
    const nazwy = new Set<string>();
    for (const obiekt of geometria.obiekty.filter(
      (obiekt) => obiekt.rodzaj === "droga" && obiekt.tagi.name,
    )) {
      const nazwa = obiekt.tagi.name ?? "";
      if (nazwy.has(nazwa)) continue;
      nazwy.add(nazwa);
      const miejsce = punkt(
        obiekt.punkty[Math.floor(obiekt.punkty.length / 2)] ?? [],
      );
      napisz(nazwa, miejsce.x, miejsce.y, false);
    }
  }
}
