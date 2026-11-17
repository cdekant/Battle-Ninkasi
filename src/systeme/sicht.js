// Sichtfeld von Ninkasi: PreciseShadowcasting aus rot.js.
// Ergebnis im Zustand: zustand.sichtbareFelder (Feldindizes) und zustand.ebene.erkundet.
// Komponente in den Daten: sicht: { reichweite: 8 }

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { durchsichtig, feldIndex, aufDerKarte } from "../welt/karte.js";
import { modifiziert } from "../kern/werte.js";
import { spielerin } from "../kern/zustand.js";

export function reichweiteSicht(entitaet) {
  return modifiziert(entitaet, "reichweiteSicht", entitaet.sicht ? entitaet.sicht.reichweite : 0);
}

export function sichtfeldAktualisieren(spiel) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const ninkasi = spielerin(zustand);
  const sichtbareFelder = new Set();
  const lichtDurchlaessig = (x, y) => aufDerKarte(ebene, x, y) && durchsichtig(spiel, x, y);
  const schattenwurf = new PreciseShadowcasting(lichtDurchlaessig, { topology: 8 });
  schattenwurf.compute(ninkasi.position.x, ninkasi.position.y, reichweiteSicht(ninkasi), (x, y) => {
    if (aufDerKarte(ebene, x, y)) sichtbareFelder.add(feldIndex(ebene, x, y));
  });
  zustand.sichtbareFelder = [...sichtbareFelder].sort((indexA, indexB) => indexA - indexB);
  for (const index of zustand.sichtbareFelder) ebene.erkundet[index] = 1;
}

export function istSichtbar(zustand, x, y) {
  return zustand.sichtbareFelder.includes(feldIndex(zustand.ebene, x, y));
}
