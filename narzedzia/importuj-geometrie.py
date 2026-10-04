"""Import otwartego wycinka OSM. Nie odrysowuje obrazow referencyjnych."""
import gzip
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as drzewo

katalog = Path(__file__).resolve().parent.parent / "tresc" / "mapa"
plik = katalog / "centrum.osm.gz"
surowe = gzip.decompress(plik.read_bytes())
korzen = drzewo.fromstring(surowe)
# API bbox zwraca niepelnych czlonkow relacji. Pelne brzegi pochodza z API /full.
zrodlaUzupelniajace = []
for nazwa, identyfikator in [("rega.osm.gz", "3246784"), ("mlynowka.osm.gz", "17840805")]:
    zawartosc = gzip.decompress((katalog / nazwa).read_bytes())
    uzupelnienie = drzewo.fromstring(zawartosc)
    for element in uzupelnienie:
        poprzedni = korzen.find(f"{element.tag}[@id='{element.get('id')}']")
        if poprzedni is not None:
            korzen.remove(poprzedni)
        korzen.append(element)
    zrodlaUzupelniajace.append({"adres": f"https://api.openstreetmap.org/api/0.6/relation/{identyfikator}/full", "hashZrodla": hashlib.sha256(zawartosc).hexdigest()})
wezly = {wezel.get("id"): [float(wezel.get("lon")), float(wezel.get("lat"))] for wezel in korzen.findall("node")}
drogi = {droga.get("id"): droga for droga in korzen.findall("way")}
obiekty = []
for identyfikator, droga in drogi.items():
    tagi = {tag.get("k"): tag.get("v") for tag in droga.findall("tag")}
    punkty = [wezly[wezel.get("ref")] for wezel in droga.findall("nd") if wezel.get("ref") in wezly]
    if len(punkty) < 2 or not any(54.0596 <= punkt[1] <= 54.0658 and 15.260 <= punkt[0] <= 15.2745 for punkt in punkty):
        continue
    rodzaj = ""
    if tagi.get("building") or tagi.get("building:part"):
        rodzaj = "budynek"
    elif tagi.get("historic") == "citywalls":
        rodzaj = "mur"
    elif tagi.get("waterway") or tagi.get("natural") == "water":
        rodzaj = "woda"
    elif tagi.get("leisure") in ["park", "garden"] or tagi.get("landuse") in ["grass", "forest", "recreation_ground"]:
        rodzaj = "zielen"
    elif tagi.get("highway"):
        rodzaj = "droga"
    if not rodzaj:
        continue
    potrzebne = ["name", "building", "building:part", "building:levels", "height", "min_height", "roof:shape", "roof:height", "highway", "waterway", "natural", "bridge", "tunnel", "historic", "amenity"]
    obiekty.append({"id": identyfikator, "wersja": int(droga.get("version")), "rodzaj": rodzaj, "tagi": {klucz: tagi[klucz] for klucz in potrzebne if klucz in tagi}, "punkty": punkty})

# Relacje budynkow: prawdziwy obrys i dziedzince; nie wypelniamy ich domem.
for relacja in korzen.findall("relation"):
    tagi = {tag.get("k"): tag.get("v") for tag in relacja.findall("tag")}
    if not tagi.get("building"):
        continue
    for czlonek in relacja.findall("member"):
        if czlonek.get("type") != "way" or czlonek.get("role") != "outer" or czlonek.get("ref") not in drogi:
            continue
        droga = drogi[czlonek.get("ref")]
        punkty = [wezly[wezel.get("ref")] for wezel in droga.findall("nd") if wezel.get("ref") in wezly]
        if len(punkty) < 3 or not any(54.0596 <= p[1] <= 54.0658 and 15.260 <= p[0] <= 15.2745 for p in punkty):
            continue
        otwory = [[wezly[wezel.get("ref")] for wezel in drogi[wnetrze.get("ref")].findall("nd") if wezel.get("ref") in wezly] for wnetrze in relacja.findall("member") if wnetrze.get("role") == "inner" and wnetrze.get("ref") in drogi]
        obiekty = [obiekt for obiekt in obiekty if obiekt["id"] != czlonek.get("ref")]
        obiekty.append({"id": czlonek.get("ref"), "wersja": int(droga.get("version")), "rodzaj": "budynek", "tagi": {klucz: tagi[klucz] for klucz in potrzebne if klucz in tagi}, "punkty": punkty, "otwory": otwory, "relacja": relacja.get("id")})

# Domkniete obrysy ciekow z relacji, z zachowaniem wewnetrznych wysp.
for relacja in korzen.findall("relation"):
    tagi = {tag.get("k"): tag.get("v") for tag in relacja.findall("tag")}
    if tagi.get("natural") != "water":
        continue
    for rola in ["outer", "inner"]:
        fragmenty = [[wezel.get("ref") for wezel in drogi[czlonek.get("ref")].findall("nd")] for czlonek in relacja.findall("member") if czlonek.get("type") == "way" and czlonek.get("role") == rola and czlonek.get("ref") in drogi]
        while fragmenty:
            lancuch = fragmenty.pop(0)
            zmieniono = True
            while zmieniono and lancuch[0] != lancuch[-1]:
                zmieniono = False
                for indeks, fragment in enumerate(fragmenty):
                    if fragment[0] == lancuch[-1] or fragment[-1] == lancuch[-1]:
                        lancuch.extend((fragment if fragment[0] == lancuch[-1] else fragment[::-1])[1:])
                        fragmenty.pop(indeks)
                        zmieniono = True
                        break
            if lancuch[0] == lancuch[-1] and all(wezel in wezly for wezel in lancuch):
                punkty = [wezly[wezel] for wezel in lancuch]
                if any(54.057 <= punkt[1] <= 54.068 and 15.253 <= punkt[0] <= 15.281 for punkt in punkty):
                    obiekty.append({"id": "relacja_" + relacja.get("id") + "_" + rola + "_" + str(len(obiekty)), "wersja": int(relacja.get("version")), "rodzaj": "wyspa" if rola == "inner" else "woda", "tagi": {"natural": "water", "name": tagi.get("name", "")}, "punkty": punkty})
dane = {"zrodlo": "https://api.openstreetmap.org/api/0.6/map?bbox=15.253,54.057,15.281,54.068", "licencja": "ODbL 1.0", "atrybucja": "© OpenStreetMap contributors", "odczyt": "2026-10-04", "hashZrodla": hashlib.sha256(surowe).hexdigest(), "obiekty": obiekty}
dane["zrodlaUzupelniajace"] = zrodlaUzupelniajace
(katalog / "geometria.json").write_text(json.dumps(dane, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("OSM:", len(obiekty), "obiektow;", len([obiekt for obiekt in obiekty if obiekt["rodzaj"] == "budynek"]), "budynkow")
