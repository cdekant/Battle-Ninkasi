// Sichtfeld von Ninkasi: PreciseShadowcasting aus rot.js.
// Ergebnis im Zustand: zustand.sichtbareFelder (Feldindizes) und zustand.ebene.erkundet.
// Komponente in den Daten: sicht: { reichweite: 8 }

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { feldIndex, aufDerKarte, abstand } from "../welt/karte.js";
import { sichtdurchlaessig } from "../welt/schichten.js";
import { sichtlinieFrei } from "../welt/geometrie.js";
import { modifiziert } from "../kern/werte.js";
import { spielerin, entitaetenMitPosition, entitaetenImUmkreis } from "../kern/zustand.js";
import { epFuerErkundung } from "./lernen.js";

export function reichweiteSicht(spiel, entitaet) {
  return modifiziert(spiel, entitaet, "reichweiteSicht", entitaet.sicht ? entitaet.sicht.reichweite : 0);
}

export function sichtfeldAktualisieren(spiel) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const ninkasi = spielerin(zustand);
  const sichtbareFelder = new Set();
  // Gelände und dichter Rauch (welt/schichten.js) halten die Sicht auf
  const lichtDurchlaessig = (x, y) => aufDerKarte(ebene, x, y) && sichtdurchlaessig(spiel, x, y);
  const schattenwurf = new PreciseShadowcasting(lichtDurchlaessig, { topology: 8 });
  schattenwurf.compute(ninkasi.position.x, ninkasi.position.y, reichweiteSicht(spiel, ninkasi), (x, y) => {
    if (aufDerKarte(ebene, x, y)) sichtbareFelder.add(feldIndex(ebene, x, y));
  });
  zustand.sichtbareFelder = [...sichtbareFelder].sort((indexA, indexB) => indexA - indexB);
  // zum ersten Mal gesehene Felder bringen freie EP (systeme/lernen.js); ein später magisch kartiertes Feld
  // bekommt einen eigenen Wert in erkundet und zählt hier dann erst beim wirklichen Sehen
  let neuGesehen = 0;
  for (const index of zustand.sichtbareFelder) {
    if (ebene.erkundet[index] !== 1) neuGesehen++;
    ebene.erkundet[index] = 1;
  }
  epFuerErkundung(spiel, neuGesehen);
}

// Menge zur Liste der sichtbaren Felder, neben dem Zustand gehalten; neu gebaut, wenn die Liste ersetzt wurde oder
// ihre Länge sich geändert hat (die Liste enthält keine doppelten Felder)
const SICHTBARE_MENGEN = new WeakMap();

export function istSichtbar(zustand, x, y) {
  const liste = zustand.sichtbareFelder;
  let eintrag = SICHTBARE_MENGEN.get(liste);
  if (!eintrag || eintrag.laenge !== liste.length) {
    eintrag = { laenge: liste.length, menge: new Set(liste) };
    SICHTBARE_MENGEN.set(liste, eintrag);
  }
  return eintrag.menge.has(feldIndex(zustand.ebene, x, y));
}

// Sieht ein Wesen ein anderes? Ninkasi sieht, was in ihrem Sichtfeld liegt; alle anderen sehen ein Ziel mit freier
// Sichtlinie innerhalb ihrer Sichtweite (auch Ninkasi). Licht kommt später (siehe docs/Architektur.md, Licht).
export function sieht(spiel, betrachter, ziel) {
  const zustand = spiel.zustand;
  if (!betrachter.position || !ziel.position) return false;
  if (betrachter.id === zustand.spielerinId) return istSichtbar(zustand, ziel.position.x, ziel.position.y);
  const nahGenug = abstand(betrachter.position, ziel.position) <= reichweiteSicht(spiel, betrachter);
  return nahGenug && sichtlinieFrei(spiel, betrachter.position, ziel.position);
}

// Wen ein Betrachter überhaupt sehen könnte, nach ID: für Ninkasi alle Entitäten mit Position (ihr Sichtfeld steht in
// sichtbareFelder), für alle anderen nur die innerhalb ihrer Sichtweite (räumlicher Index); gesehen ist damit noch nichts
export function kandidatenInSicht(spiel, betrachter) {
  if (betrachter.id === spiel.zustand.spielerinId) return entitaetenMitPosition(spiel.zustand);
  return entitaetenImUmkreis(spiel.zustand, betrachter.position, reichweiteSicht(spiel, betrachter));
}
