// Licht (siehe docs/Welt.md, Licht): Helligkeit je Feld als reine Abfrage, nichts davon steht im Zustand; was sich
// ändert (eine bewegte Lampe, ein gelöschtes Feuer), gilt damit sofort und ohne Neuberechnung.
// Helligkeit: Grundhelligkeit der Ebene (ebene.licht.grundhelligkeit, Vorgabe 100) plus die Beiträge aller Quellen,
//   höchstens 100. Stufen aus regeln.licht.stufen (finster bis taghell); ist schon die Grundhelligkeit in der obersten
//   Stufe, wirkt Licht gar nicht (lichtWirkt), und jedes Feld liegt in der obersten Stufe.
// Quelle: Komponente licht: { reichweite, staerke, farbe? } (farbe nur für die Anzeige) an
//   einer Entität mit Position (Wesen, Gegenstand am Boden),
//   einem angelegten Gegenstand (leuchtet vom Feld der Trägerin aus; im Gepäck leuchtet nichts),
//   einem Gelände (daten/gelaende.js, etwa eine Wandfackel),
//   einer Art der Feldschichten (daten/schichten.js) und dem Feuer (regeln.feuer.licht).
// Beitrag im Abstand d (Schachbrett) bis zur Reichweite: staerke * (2 * reichweite - d) / (2 * reichweite), abgerundet,
//   am Rand also die halbe Stärke; nur auf Felder mit freier Sichtlinie von der Quelle (welt/geometrie.js).

import { abstand, aufDerKarte, gelaendeAuf } from "../welt/karte.js";
import { sichtlinieFrei } from "../welt/geometrie.js";
import { schichtenVon, feldVonIndex } from "../welt/schichten.js";
import { entitaetenImUmkreis, entitaetMitId } from "../kern/zustand.js";

export const HOECHSTE_HELLIGKEIT = 100;

const regelnVon = (spiel) => spiel.daten.regeln.licht;

export function lichtVon(entitaet) {
  return entitaet?.licht ?? null;
}

export function grundhelligkeit(spiel) {
  return spiel.zustand.ebene?.licht?.grundhelligkeit ?? HOECHSTE_HELLIGKEIT;
}

const oberste = (spiel) => regelnVon(spiel).stufen.at(-1);

// Ob Licht auf dieser Ebene etwas ändert: nur, wenn die Grundhelligkeit unter der obersten Stufe liegt
export function lichtWirkt(spiel) {
  return grundhelligkeit(spiel) < oberste(spiel).ab;
}

export function lichtbeitrag(licht, entfernung) {
  if (entfernung > licht.reichweite) return 0;
  if (licht.reichweite === 0) return licht.staerke;
  return Math.floor((licht.staerke * (2 * licht.reichweite - entfernung)) / (2 * licht.reichweite));
}

// Größte Reichweite aller Quellen in den Daten: weiter weg sucht die Abfrage nicht; je Datenstand einmal
const HOECHSTE_REICHWEITEN = new WeakMap();

function hoechsteReichweite(daten) {
  if (!HOECHSTE_REICHWEITEN.has(daten)) {
    let reichweite = daten.regeln.feuer?.licht?.reichweite ?? 0;
    const merken = (eintrag) => { if (eintrag?.licht) reichweite = Math.max(reichweite, eintrag.licht.reichweite); };
    for (const bereich of ["wesen", "gegenstaende", "gelaende"]) Object.values(daten[bereich] || {}).forEach(merken);
    for (const arten of [daten.schichten?.oberflaechen, daten.schichten?.gase]) Object.values(arten || {}).forEach(merken);
    HOECHSTE_REICHWEITEN.set(daten, reichweite);
  }
  return HOECHSTE_REICHWEITEN.get(daten);
}

// Gelände mit Licht auf der Ebene, aus der Karte abgeleitet und im zwischenspeicher gehalten; gelaendeSetzen verwirft
// ihn (systeme/gelaende.js), ein Wechsel der Ebene auch
function gelaendelichter(spiel) {
  const ebene = spiel.zustand.ebene;
  const zwischen = spiel.zwischenspeicher;
  if (zwischen.gelaendelichter?.ebene !== ebene) {
    const quellen = [];
    for (let y = 0; y < ebene.hoehe; y++) {
      for (let x = 0; x < ebene.breite; x++) {
        const licht = gelaendeAuf(spiel, x, y)?.licht;
        if (licht) quellen.push({ x, y, licht });
      }
    }
    zwischen.gelaendelichter = { ebene, quellen };
  }
  return zwischen.gelaendelichter.quellen;
}

// Leuchtende Einträge einer Schicht: [{ x, y, licht }]; das Feuer nach regeln.feuer.licht, sonst nach der Art
function schichtlichter(spiel, schicht) {
  const ebene = spiel.zustand.ebene;
  const tabelle = schichtenVon(ebene)[schicht];
  const arten = schicht === "oberflaeche" ? spiel.daten.schichten?.oberflaechen : spiel.daten.schichten?.gase;
  const feuerlicht = spiel.daten.regeln.feuer?.licht;
  if (schicht === "feuer" ? !feuerlicht : !Object.values(arten || {}).some((art) => art.licht)) return [];
  const quellen = [];
  for (const [index, eintrag] of Object.entries(tabelle)) {
    const licht = schicht === "feuer" ? feuerlicht : arten[eintrag.art]?.licht;
    if (licht) quellen.push({ ...feldVonIndex(ebene, Number(index)), licht });
  }
  return quellen;
}

// Alle Quellen, die das Feld erreichen könnten: [{ x, y, licht }] (Reihenfolge ohne Bedeutung, die Summe ist dieselbe)
export function lichtquellenNahe(spiel, feld) {
  const zustand = spiel.zustand;
  const weite = hoechsteReichweite(spiel.daten);
  const quellen = [];
  const dazu = (licht, ort) => { if (licht && abstand(ort, feld) <= licht.reichweite) quellen.push({ x: ort.x, y: ort.y, licht }); };
  for (const entitaet of entitaetenImUmkreis(zustand, feld, weite)) {
    dazu(lichtVon(entitaet), entitaet.position);
    for (const gegenstandId of entitaet.ausgeruestet || []) dazu(lichtVon(entitaetMitId(zustand, gegenstandId)), entitaet.position);
  }
  for (const quelle of gelaendelichter(spiel)) dazu(quelle.licht, quelle);
  for (const schicht of ["oberflaeche", "gas", "feuer"]) for (const quelle of schichtlichter(spiel, schicht)) dazu(quelle.licht, quelle);
  return quellen;
}

// Beiträge der Quellen, die das Feld wirklich erreichen (freie Sichtlinie): [{ licht, beitrag }]; bisSumme: aufhören,
// sobald die Grundhelligkeit mit den Beiträgen sie erreicht
function beitraegeAuf(spiel, feld, bisSumme = Infinity) {
  const beitraege = [];
  let summe = Math.min(HOECHSTE_HELLIGKEIT, grundhelligkeit(spiel));
  for (const quelle of lichtquellenNahe(spiel, feld)) {
    const entfernung = abstand(quelle, feld);
    if (entfernung > 0 && !sichtlinieFrei(spiel, quelle, feld)) continue;
    const beitrag = lichtbeitrag(quelle.licht, entfernung);
    if (beitrag <= 0) continue;
    beitraege.push({ licht: quelle.licht, beitrag });
    summe += beitrag;
    if (summe >= bisSumme) break;
  }
  return beitraege;
}

// Helligkeit eines Felds von 0 bis 100
export function helligkeitAuf(spiel, x, y) {
  const grund = Math.min(HOECHSTE_HELLIGKEIT, grundhelligkeit(spiel));
  if (!lichtWirkt(spiel) || !aufDerKarte(spiel.zustand.ebene, x, y)) return grund;
  const summe = beitraegeAuf(spiel, { x, y }, HOECHSTE_HELLIGKEIT).reduce((bisher, eintrag) => bisher + eintrag.beitrag, grund);
  return Math.min(HOECHSTE_HELLIGKEIT, summe);
}

// Für die Anzeige: Helligkeit und die Beiträge mit ihren Farben, { helligkeit, grund, beitraege: [{ licht, beitrag }] }
export function lichtAufFeld(spiel, x, y) {
  const grund = Math.min(HOECHSTE_HELLIGKEIT, grundhelligkeit(spiel));
  if (!lichtWirkt(spiel) || !aufDerKarte(spiel.zustand.ebene, x, y)) return { helligkeit: grund, grund, beitraege: [] };
  const beitraege = beitraegeAuf(spiel, { x, y });
  const summe = beitraege.reduce((bisher, eintrag) => bisher + eintrag.beitrag, grund);
  return { helligkeit: Math.min(HOECHSTE_HELLIGKEIT, summe), grund, beitraege };
}

// Stufe zu einer Helligkeit: der Eintrag aus regeln.licht.stufen mit dem größten ab, das sie erreicht
export function stufeVonHelligkeit(spiel, helligkeit) {
  const stufen = regelnVon(spiel).stufen;
  for (let nummer = stufen.length - 1; nummer > 0; nummer--) if (helligkeit >= stufen[nummer].ab) return stufen[nummer];
  return stufen[0];
}

export function lichtstufeAuf(spiel, x, y) {
  if (!lichtWirkt(spiel)) return oberste(spiel);
  return stufeVonHelligkeit(spiel, helligkeitAuf(spiel, x, y));
}

// Heimlichkeit auf dem Feld in Prozent (regeln.licht.stufen); ohne Licht in den Daten 100
export function heimlichkeitImLicht(spiel, feld) {
  return lichtstufeAuf(spiel, feld.x, feld.y).heimlichkeit;
}
