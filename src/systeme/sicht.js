// Sichtfeld von Ninkasi: PreciseShadowcasting aus rot.js.
// Ergebnis im Zustand: zustand.sichtbareFelder (Feldindizes) und zustand.ebene.erkundet.
// Komponente in den Daten: sicht: { reichweite: 8 }

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { durchsichtig, feldIndex, aufDerKarte, abstand } from "../welt/karte.js";
import { sichtlinieFrei } from "../welt/geometrie.js";
import { modifiziert } from "../kern/werte.js";
import { spielerin } from "../kern/zustand.js";

export function reichweiteSicht(spiel, entitaet) {
  return modifiziert(spiel, entitaet, "reichweiteSicht", entitaet.sicht ? entitaet.sicht.reichweite : 0);
}

export function sichtfeldAktualisieren(spiel) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const ninkasi = spielerin(zustand);
  const sichtbareFelder = new Set();
  const lichtDurchlaessig = (x, y) => aufDerKarte(ebene, x, y) && durchsichtig(spiel, x, y);
  const schattenwurf = new PreciseShadowcasting(lichtDurchlaessig, { topology: 8 });
  schattenwurf.compute(ninkasi.position.x, ninkasi.position.y, reichweiteSicht(spiel, ninkasi), (x, y) => {
    if (aufDerKarte(ebene, x, y)) sichtbareFelder.add(feldIndex(ebene, x, y));
  });
  zustand.sichtbareFelder = [...sichtbareFelder].sort((indexA, indexB) => indexA - indexB);
  for (const index of zustand.sichtbareFelder) ebene.erkundet[index] = 1;
}

export function istSichtbar(zustand, x, y) {
  return zustand.sichtbareFelder.includes(feldIndex(zustand.ebene, x, y));
}

// Sieht ein Wesen ein anderes? Vereinfachung bis zur Wahrnehmung (Punkt 7 der Arbeitsliste):
//   Ninkasi sieht, was in ihrem Sichtfeld liegt; ein Wesen sieht Ninkasi, wenn sie es sieht und es nah genug ist;
//   andere sehen einander mit freier Sichtlinie innerhalb ihrer Sichtweite.
export function sieht(spiel, betrachter, ziel) {
  const zustand = spiel.zustand;
  if (!betrachter.position || !ziel.position) return false;
  if (betrachter.id === zustand.spielerinId) return istSichtbar(zustand, ziel.position.x, ziel.position.y);
  const nahGenug = abstand(betrachter.position, ziel.position) <= reichweiteSicht(spiel, betrachter);
  if (ziel.id === zustand.spielerinId) return nahGenug && istSichtbar(zustand, betrachter.position.x, betrachter.position.y);
  return nahGenug && sichtlinieFrei(spiel, betrachter.position, ziel.position);
}
