import type {
  DefinicjeGry,
  StanGry,
  Warunek,
} from "@zwiedzanie/schemat-tresci";

import {
  pasujeRegulaZakonczenia,
  wyznaczProfilZakonczenia,
} from "@zwiedzanie/silnik-gry";

type Atom = { warunek: Warunek; negacja: boolean };

// Rozwiniecie logiczne sluzy autorowi, nie jest przeszukiwaniem stanu gry.
function alternatywy(warunek: Warunek, negacja = false): Atom[][] {
  if (warunek.rodzaj === "nie") return alternatywy(warunek.warunek, !negacja);
  if (warunek.rodzaj !== "wszystkie" && warunek.rodzaj !== "dowolny")
    return [[{ warunek, negacja }]];
  const koniunkcja = (warunek.rodzaj === "wszystkie") !== negacja;
  let wynik: Atom[][] = koniunkcja ? [[]] : [];
  for (const element of warunek.warunki) {
    const czesc = alternatywy(element, negacja);
    if (
      (koniunkcja ? wynik.length * czesc.length : wynik.length + czesc.length) >
      2048
    )
      throw new Error(
        "Regula przekracza limit analizy logicznej; uprosc warunek.",
      );
    wynik = koniunkcja
      ? wynik.flatMap((lewa) => czesc.map((prawa) => [...lewa, ...prawa]))
      : [...wynik, ...czesc];
    if (wynik.length > 2048)
      throw new Error(
        "Regula przekracza limit analizy logicznej; uprosc warunek.",
      );
  }
  return wynik;
}

function spojne(atomy: Atom[]) {
  const znaki = new Map<string, boolean>();
  const wartosci = new Map<string, string>();
  const zakresy = new Map<string, [number, number]>();
  for (const { warunek, negacja } of atomy) {
    if (
      warunek.rodzaj === "wszystkie" ||
      warunek.rodzaj === "dowolny" ||
      warunek.rodzaj === "nie"
    )
      continue;
    const klucz = JSON.stringify(warunek, Object.keys(warunek).sort());
    if (znaki.has(klucz) && znaki.get(klucz) !== negacja) return false;
    znaki.set(klucz, negacja);
    if (warunek.rodzaj === "flagaJest") {
      const id = `flaga:${warunek.id}`;
      const wartosc = String(warunek.wartosc !== negacja);
      if (wartosci.has(id) && wartosci.get(id) !== wartosc) return false;
      wartosci.set(id, wartosc);
    }
    if (
      !negacja &&
      (warunek.rodzaj === "wynikZagadkiJest" ||
        warunek.rodzaj === "stanWatkuJest")
    ) {
      const id = `${warunek.rodzaj}:${warunek.id}`;
      const wartosc =
        warunek.rodzaj === "wynikZagadkiJest" ? warunek.wynik : warunek.stan;
      if (wartosci.has(id) && wartosci.get(id) !== wartosc) return false;
      wartosci.set(id, wartosc);
    }
    if (
      warunek.rodzaj === "powinowactwoCoNajmniej" ||
      warunek.rodzaj === "podpowiedziCoNajwyzej"
    ) {
      const powinowactwo = warunek.rodzaj === "powinowactwoCoNajmniej";
      const id = powinowactwo ? `os:${warunek.os}` : `pomoc:${warunek.id}`;
      const granica = powinowactwo ? warunek.wartosc : warunek.liczba;
      const zakres =
        zakresy.get(id) ?? (powinowactwo ? [-5, 5] : [0, Infinity]);
      if (powinowactwo !== negacja)
        zakres[0] = Math.max(zakres[0], granica + (powinowactwo ? 0 : 1));
      else zakres[1] = Math.min(zakres[1], granica - (powinowactwo ? 1 : 0));
      if (zakres[0] > zakres[1]) return false;
      zakresy.set(id, zakres);
    }
  }
  return true;
}

export function sprawdzRegulyZakonczen(definicje: DefinicjeGry) {
  const sceny = new Set([
    definicje.manifest.scenaStartowa,
    ...definicje.wybory.flatMap((wybor) => [
      wybor.idSceny,
      wybor.nastepnaScena,
    ]),
  ]);
  const osiagalne = new Set([definicje.manifest.scenaStartowa]);
  const kolejka = [...osiagalne];
  for (const scena of kolejka)
    for (const wybor of definicje.wybory.filter(
      (element) => element.idSceny === scena,
    ))
      if (!osiagalne.has(wybor.nastepnaScena)) {
        osiagalne.add(wybor.nastepnaScena);
        kolejka.push(wybor.nastepnaScena);
      }
  const ustawiane = new Set(
    definicje.zadania.map((zadanie) => `zadanie_${zadanie.id}`),
  );
  const zbierzFlagi = (dane: unknown): void => {
    if (!dane || typeof dane !== "object") return;
    if (
      "rodzaj" in dane &&
      dane.rodzaj === "USTAW_FLAGE" &&
      "id" in dane &&
      typeof dane.id === "string" &&
      "wartosc" in dane &&
      dane.wartosc === true
    )
      ustawiane.add(dane.id);
    Object.values(dane).forEach(zbierzFlagi);
  };
  zbierzFlagi(definicje);
  const martweGalezie: string[] = [];
  const warunki = new Map<string, Atom[][]>();
  for (const zakonczenie of definicje.zakonczenia) {
    if (
      zakonczenie.idScenyWejscia &&
      (!sceny.has(zakonczenie.idScenyWejscia) ||
        !osiagalne.has(zakonczenie.idScenyWejscia))
    )
      throw new Error(`Zakonczenie bez drogi wejscia: ${zakonczenie.id}`);
    const rodzic = definicje.zakonczenia.find(
      (element) => element.id === zakonczenie.idZakonczeniaGlownego,
    );
    if (
      rodzic?.idScenyWejscia &&
      zakonczenie.idScenyWejscia &&
      rodzic.idScenyWejscia !== zakonczenie.idScenyWejscia
    )
      throw new Error(`Sprzeczne sceny wejscia wariantu: ${zakonczenie.id}`);
    const skladniki: Warunek[] = [];
    for (const regula of rodzic ? [zakonczenie, rodzic] : [zakonczenie]) {
      if (regula.warunek) skladniki.push(regula.warunek);
      for (const id of regula.wymaganaWiedza ?? []) {
        const wiedza = definicje.kampania?.wiedza.find(
          (wpis) => wpis.id === id,
        );
        if (!wiedza) throw new Error(`Brak wiedzy: ${id}`);
        skladniki.push(wiedza.warunek);
      }
    }
    const galezie = alternatywy({
      rodzaj: "wszystkie",
      warunki: skladniki,
    });
    const mozliwe = galezie.filter(
      (galaz) =>
        spojne(galaz) &&
        galaz.every(
          ({ warunek, negacja }) =>
            warunek.rodzaj !== "flagaJest" ||
            warunek.wartosc === negacja ||
            ustawiane.has(warunek.id),
        ),
    );
    if (!mozliwe.length)
      throw new Error(
        `Sprzeczna regula / martwy warunek zakonczenia: ${zakonczenie.id}`,
      );
    if (mozliwe.length < galezie.length) martweGalezie.push(zakonczenie.id);
    warunki.set(zakonczenie.id, mozliwe);
  }
  for (const [indeks, lewa] of definicje.zakonczenia.entries())
    for (const prawa of definicje.zakonczenia.slice(indeks + 1)) {
      const konkurencja =
        lewa.rodzaj === prawa.rodzaj &&
        !lewa.domyslne &&
        !prawa.domyslne &&
        (lewa.rodzaj === "GLOWNE" ||
          ((lewa.grupa ?? lewa.idWatku) &&
            (lewa.grupa ?? lewa.idWatku) === (prawa.grupa ?? prawa.idWatku) &&
            lewa.idZakonczeniaGlownego === prawa.idZakonczeniaGlownego));
      if (
        !konkurencja ||
        lewa.priorytet !== prawa.priorytet ||
        (lewa.idScenyWejscia &&
          prawa.idScenyWejscia &&
          lewa.idScenyWejscia !== prawa.idScenyWejscia)
      )
        continue;
      if (
        (lewa.grupa ||
          lewa.idWatku ||
          JSON.stringify(lewa.warunek) === JSON.stringify(prawa.warunek)) &&
        (warunki.get(lewa.id) ?? []).some((a) =>
          (warunki.get(prawa.id) ?? []).some((b) => spojne([...a, ...b])),
        )
      )
        throw new Error(
          `Sprzeczne reguly o rownym priorytecie: ${lewa.id}, ${prawa.id}`,
        );
    }
  return { martweGalezie };
}

export function sprawdzSwiadectwaZakonczen(
  definicje: DefinicjeGry,
  stany: readonly StanGry[],
  wymagane: readonly string[] = definicje.zakonczenia.map(
    (regula) => regula.id,
  ),
) {
  const osiagniete = new Set<string>();
  for (const stan of stany) {
    const profil = wyznaczProfilZakonczenia(definicje, stan);
    const glowne = definicje.zakonczenia.filter(
      (regula) =>
        regula.rodzaj === "GLOWNE" &&
        !regula.domyslne &&
        pasujeRegulaZakonczenia(definicje, stan, regula),
    );
    const najwyzszy = Math.max(...glowne.map((regula) => regula.priorytet));
    if (glowne.filter((regula) => regula.priorytet === najwyzszy).length > 1)
      throw new Error(
        "Sprzeczne reguly glowne w osiagalnym stanie: remis priorytetow.",
      );
    for (const id of [
      profil.zakonczenieGlowne,
      ...profil.wariantyZakonczenia,
      ...profil.epilogiWatkow,
      ...profil.specjalneOdkrycia,
      ...profil.konsekwencjeZagadek,
    ])
      osiagniete.add(id);
  }
  for (const id of wymagane)
    if (!osiagniete.has(id))
      throw new Error(
        `Zakonczenie bez drogi / nigdy nieosiagniete przez resolver: ${id}`,
      );
  return [...osiagniete].sort();
}
