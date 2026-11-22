// Erzeugung einer Ebene in Schritten (siehe docs/Welt.md, Ebenen): die Ebene der Tiefe t ist die Vorlage aus dem
// Plan des Laufs (welt/plan.js), ein Eintrag aus daten/ebenen.js; mehrere Tiefen dürfen dieselbe Vorlage nutzen.
// Die Schritte stehen im Register ebenenschritte (welt/ebenenschritte.js), ihre Folge in ebenendaten.schritte, sonst
// regeln.ebenen.schritteFest (Ebenen mit karte) oder regeln.ebenen.schritteErzeugt.
// Baukontext bau, den die Schritte nacheinander füllen:
//   { tiefe, name, ebenendaten, planEintrag, versuch, schluessel, zufall(name), zeilen: [[Kennung]], raeume,
//     tuerFelder: Set "x,y", treppen: { treppeAuf, treppeAb }, freieFelder: [{ x, y }] }
// Zufall: jede Tiefe würfelt für sich, abgeleitet aus dem Startwert mit schluessel "ebene.<tiefe>.<name>" (der Digger)
//   und "<schluessel>.<name>" für bau.zufall(name); nie aus dem Spielverlauf. Verwirft ein Schritt den Versuch
//   (z.B. erreichbarkeit), beginnt der Bau neu mit schluessel "ebene.<tiefe>.<name>.versuch<n>", höchstens
//   regeln.ebenen.versuche Mal.
// Ninkasi legt die Ebene nicht an; ebeneErzeugen gibt die Treppenfelder zurück: { treppeAuf, treppeAb } (oder null).

import { holen } from "../kern/register.js";
import { startwertAbleiten, zufallErzeugen } from "../kern/zufall.js";
import { ebenennameFuer, planEintragFuer } from "./plan.js";
import { NEUER_VERSUCH } from "./ebenenschritte.js";

// Folge der Schritte einer Ebene
export function schritteDerEbene(daten, ebenendaten) {
  return ebenendaten.schritte ?? (ebenendaten.karte ? daten.regeln.ebenen.schritteFest : daten.regeln.ebenen.schritteErzeugt);
}

function bauBeginnen(spiel, tiefe, versuch) {
  const name = ebenennameFuer(spiel.zustand, tiefe);
  const schluessel = `ebene.${tiefe}.${name}${versuch > 1 ? `.versuch${versuch}` : ""}`;
  const zufaelle = {};
  return {
    tiefe, name, ebenendaten: spiel.daten.ebenen[name], planEintrag: planEintragFuer(spiel.zustand, tiefe), versuch, schluessel,
    zufall: (zufallsName) => (zufaelle[zufallsName] ??= zufallErzeugen(startwertAbleiten(spiel.zustand.startwert, `${schluessel}.${zufallsName}`))),
    zeilen: null, raeume: [], tuerFelder: new Set(), treppen: { treppeAuf: null, treppeAb: null }, freieFelder: [],
  };
}

// Erzeugt die Ebene der Tiefe und setzt sie als zustand.ebene; gibt { treppeAuf, treppeAb } zurück
export function ebeneErzeugen(spiel, tiefe) {
  const hoechsteVersuche = spiel.daten.regeln.ebenen.versuche;
  for (let versuch = 1; versuch <= hoechsteVersuche; versuch++) {
    const bau = bauBeginnen(spiel, tiefe, versuch);
    const schritte = schritteDerEbene(spiel.daten, bau.ebenendaten);
    let verworfen = false;
    const geliefert = new Set();
    for (const schrittName of schritte) {
      const schritt = holen("ebenenschritte", schrittName);
      if (schritt.ausfuehren(spiel, bau) === NEUER_VERSUCH) {
        // die Datenprüfung stellt verwerfende Schritte vor "ebene_anlegen"; hier nur zur Sicherheit
        if (geliefert.has("ebene")) throw new Error(`Ebenenschritt "${schrittName}" verwirft eine schon angelegte Ebene`);
        verworfen = true;
        break;
      }
      for (const teil of schritt.liefert) geliefert.add(teil);
    }
    if (!verworfen) return bau.treppen;
  }
  throw new Error(`Ebene "${ebenennameFuer(spiel.zustand, tiefe)}" in Tiefe ${tiefe}: nach ${hoechsteVersuche} Versuchen keine gültige Karte`);
}
