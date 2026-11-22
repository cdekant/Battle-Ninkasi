// Erinnerung der Karte (siehe docs/Welt.md, Sicht und Erinnerung): was Ninkasi über Felder weiß, die sie gerade nicht sieht.
// Daten an der Ebene:
//   erinnerung:     je Feld die Kennung des zuletzt gesehenen (oder kartierten) Geländes, null für unbekannt
//   erinnerteDinge: { feldindex: { oberflaeche?: art, gegenstaende?: [{ typ, text, anzahl }], fallen?: [{ typ, text }] } }
//                   nur Felder mit etwas darauf; gespeichert wird das Aussehen, nie eine ID, damit die Anzeige über die
//                   Erinnerung nicht den heutigen Zustand nachschlagen kann; Wesen, Gas und Feuer sind flüchtig und
//                   werden nicht erinnert
// erkundet (einmal wirklich gesehen, bringt die EP) bleibt davon getrennt: Kartieren setzt nur die Erinnerung, Vergessen
// löscht nur die Erinnerung; so bringt ein kartiertes Feld erst beim Sehen EP und ein vergessenes nicht noch einmal.
// Nachgeführt wird bei jeder Neuberechnung der Sicht (systeme/sicht.js) für die Felder, die bis dahin sichtbar waren,
// und für die jetzt sichtbaren: so hält die Erinnerung den letzten Stand fest, den Ninkasi gesehen hat.

import { entitaetenAuf, istWesen } from "../kern/zustand.js";
import { feldVonIndex } from "../welt/schichten.js";
import { anzahlVon } from "./inventar.js";
import { istBekannt } from "./fallen.js";

// Legt die Erinnerung einer Ebene an, falls sie fehlt (neue Ebenen bekommen sie beim Anlegen)
function erinnerungVon(ebene) {
  if (!ebene.erinnerung) ebene.erinnerung = new Array(ebene.breite * ebene.hoehe).fill(null);
  if (!ebene.erinnerteDinge) ebene.erinnerteDinge = {};
  return ebene;
}

// Was gerade auf einem Feld liegt, als Aussehen; null, wenn nichts zu erinnern ist
function dingeAuf(spiel, ebene, index) {
  const { x, y } = feldVonIndex(ebene, index);
  const dinge = {};
  const oberflaeche = ebene.schichten?.oberflaeche?.[index];
  if (oberflaeche) dinge.oberflaeche = oberflaeche.art;
  for (const entitaet of entitaetenAuf(spiel.zustand, x, y)) {
    if (istWesen(entitaet)) continue;
    if (entitaet.falle) {
      if (istBekannt(entitaet)) (dinge.fallen ??= []).push({ typ: entitaet.typ, text: entitaet.text });
      continue;
    }
    (dinge.gegenstaende ??= []).push({ typ: entitaet.typ, text: entitaet.text, anzahl: anzahlVon(entitaet) });
  }
  return Object.keys(dinge).length ? dinge : null;
}

// Schreibt den heutigen Stand der Felder in die Erinnerung (Gelände und Dinge); feldIndizes: Indizes der aktuellen Ebene
export function erinnerungAuffrischen(spiel, feldIndizes) {
  const ebene = erinnerungVon(spiel.zustand.ebene);
  for (const index of feldIndizes) {
    const { x, y } = feldVonIndex(ebene, index);
    ebene.erinnerung[index] = ebene.felder[y][x];
    const dinge = dingeAuf(spiel, ebene, index);
    if (dinge) ebene.erinnerteDinge[index] = dinge;
    else delete ebene.erinnerteDinge[index];
  }
}

// Macht Felder bekannt, ohne dass Ninkasi sie sieht (Kartierung): das Gelände, mit mitDingen auch was darauf liegt;
// erkundet bleibt unberührt, die EP kommen erst beim Sehen
export function kartieren(spiel, feldIndizes, { mitDingen = false } = {}) {
  const ebene = erinnerungVon(spiel.zustand.ebene);
  for (const index of feldIndizes) {
    if (mitDingen) {
      erinnerungAuffrischen(spiel, [index]);
      continue;
    }
    const { x, y } = feldVonIndex(ebene, index);
    ebene.erinnerung[index] = ebene.felder[y][x];
  }
}

// Löscht die Erinnerung an Felder (Filmriss); erkundet bleibt, ein Wiedersehen bringt keine EP mehr. Gerade sichtbare
// Felder kommen mit der nächsten Neuberechnung der Sicht wieder in die Erinnerung.
export function vergessen(spiel, feldIndizes) {
  const ebene = erinnerungVon(spiel.zustand.ebene);
  for (const index of feldIndizes) {
    ebene.erinnerung[index] = null;
    delete ebene.erinnerteDinge[index];
  }
}

// Erinnerte Dinge auf einem Feld: { oberflaeche, gegenstaende, fallen } (leere Listen und null, wenn nichts)
export function erinnerteDingeAuf(ebene, index) {
  const dinge = ebene.erinnerteDinge?.[index];
  return { oberflaeche: dinge?.oberflaeche ?? null, gegenstaende: dinge?.gegenstaende ?? [], fallen: dinge?.fallen ?? [] };
}
