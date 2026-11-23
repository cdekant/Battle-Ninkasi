// Sichtfeld von Ninkasi: PreciseShadowcasting aus rot.js.
// Ergebnis im Zustand: zustand.sichtbareFelder (Feldindizes), zustand.ebene.erkundet und die Erinnerung der Karte
// (systeme/erinnerung.js).
// Komponente in den Daten: sicht: { reichweite: 8, imDunkeln? } (imDunkeln: so weit sieht das Wesen auf finstere Felder,
// Vorgabe regeln.licht.imDunkeln; Modifikatorziel sichtImDunkeln, die Nachtsicht); Licht siehe systeme/licht.js

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { feldIndex, aufDerKarte, abstand } from "../welt/karte.js";
import { sichtdurchlaessig } from "../welt/schichten.js";
import { sichtlinieFrei } from "../welt/geometrie.js";
import { modifiziert } from "../kern/werte.js";
import { gesteuerteEntitaet, istGesteuert, sichtVon, entitaetenMitPosition, entitaetenImUmkreis } from "../kern/zustand.js";
import { epFuerErkundung } from "./lernen.js";
import { erinnerungAuffrischen } from "./erinnerung.js";
import { lichtWirkt, lichtstufeAuf, lichtVon } from "./licht.js";

export function reichweiteSicht(spiel, entitaet) {
  return modifiziert(spiel, entitaet, "reichweiteSicht", sichtVon(entitaet)?.reichweite ?? 0);
}

export function sichtImDunkeln(spiel, entitaet) {
  return modifiziert(spiel, entitaet, "sichtImDunkeln", sichtVon(entitaet)?.imDunkeln ?? spiel.daten.regeln.licht.imDunkeln);
}

// Ob genug Licht auf dem Feld liegt, dass der Betrachter es sieht: ein Feld einer Stufe mit verbirgt (finster) nur
// bis zum Abstand sichtImDunkeln; weite: sichtImDunkeln, falls schon bekannt
export function hellGenug(spiel, betrachter, feld, weite = null) {
  if (!lichtWirkt(spiel)) return true;
  if (abstand(betrachter.position, feld) <= (weite ?? sichtImDunkeln(spiel, betrachter))) return true;
  return !lichtstufeAuf(spiel, feld.x, feld.y).verbirgt;
}

export function sichtfeldAktualisieren(spiel) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const gesteuerte = gesteuerteEntitaet(zustand);
  const sichtbareFelder = new Set();
  // Gelände und dichter Rauch (welt/schichten.js) halten die Sicht auf
  const lichtDurchlaessig = (x, y) => aufDerKarte(ebene, x, y) && sichtdurchlaessig(spiel, x, y);
  const schattenwurf = new PreciseShadowcasting(lichtDurchlaessig, { topology: 8 });
  // finstere Felder sieht Ninkasi nur aus der Nähe (hellGenug)
  const weiteImDunkeln = sichtImDunkeln(spiel, gesteuerte);
  schattenwurf.compute(gesteuerte.position.x, gesteuerte.position.y, reichweiteSicht(spiel, gesteuerte), (x, y) => {
    if (aufDerKarte(ebene, x, y) && hellGenug(spiel, gesteuerte, { x, y }, weiteImDunkeln)) sichtbareFelder.add(feldIndex(ebene, x, y));
  });
  // die bisher sichtbaren Felder halten fest, wie Ninkasi sie zuletzt gesehen hat, die jetzt sichtbaren den heutigen Stand
  const bisher = zustand.sichtbareFelder.filter((index) => !sichtbareFelder.has(index));
  zustand.sichtbareFelder = [...sichtbareFelder].sort((indexA, indexB) => indexA - indexB);
  erinnerungAuffrischen(spiel, bisher);
  erinnerungAuffrischen(spiel, zustand.sichtbareFelder);
  // zum ersten Mal gesehene Felder bringen freie EP (systeme/lernen.js); ein kartiertes Feld (systeme/erinnerung.js)
  // ist nur erinnert, nicht erkundet, und zählt hier erst beim wirklichen Sehen
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
// Sichtlinie innerhalb ihrer Sichtweite (auch Ninkasi), wenn genug Licht auf seinem Feld liegt (hellGenug).
export function sieht(spiel, betrachter, ziel) {
  const zustand = spiel.zustand;
  if (!betrachter.position || !ziel.position) return false;
  if (istGesteuert(zustand, betrachter)) return istSichtbar(zustand, ziel.position.x, ziel.position.y);
  const nahGenug = abstand(betrachter.position, ziel.position) <= reichweiteSicht(spiel, betrachter);
  return nahGenug && sichtlinieFrei(spiel, betrachter.position, ziel.position) && hellGenug(spiel, betrachter, ziel.position);
}

// Wen ein Betrachter überhaupt sehen könnte, nach ID: für Ninkasi alle Entitäten mit Position (ihr Sichtfeld steht in
// sichtbareFelder), für alle anderen nur die innerhalb ihrer Sichtweite (räumlicher Index); gesehen ist damit noch nichts
export function kandidatenInSicht(spiel, betrachter) {
  if (istGesteuert(spiel.zustand, betrachter)) return entitaetenMitPosition(spiel.zustand);
  return entitaetenImUmkreis(spiel.zustand, betrachter.position, reichweiteSicht(spiel, betrachter));
}

// Leuchtet die Entität selbst oder mit einem angelegten Gegenstand? (systeme/licht.js)
export function traegtLicht(spiel, entitaet) {
  if (lichtVon(entitaet)) return true;
  return (entitaet.ausgeruestet || []).some((gegenstandId) => lichtVon(spiel.zustand.entitaeten[gegenstandId]));
}
