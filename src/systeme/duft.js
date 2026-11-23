// Spur als Duft (siehe docs/Welt.md, Duft), Vorbild Brogue: die gesteuerte Entität hinterlässt nach jedem Zug Duft
// auf allen Feldern in ihrer Sichtlinie, mit der Entfernung schwächer; statt jedes Feld altern zu lassen, steigt ein
// globaler Zähler. Jagende, die ihre Beute verloren haben, gehen zum stärksten Duft daneben (ki/jagen.js).
// Daten: zustand.duftZaehler (über den ganzen Lauf), ebene.duft: je Feld eine ganze Zahl (fehlt die Liste oder steht 0,
//   war dort nie Duft), regeln.duft: { jeZug, reichweite, haltbarkeitZuege }.
// Wert eines Felds: Zähler minus Duftabstand (die längere Achse doppelt, die kürzere einfach: gerade 2, schräg 3); ein
//   Feld behält den stärksten Wert. Frisch ist Duft, der höchstens haltbarkeitZuege * jeZug unter dem Zähler liegt.
// Licht spielt keine Rolle (der Schattenwurf fragt nur das Gelände), Rauch auch nicht.

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { anmelden } from "../kern/register.js";
import { gesteuerteEntitaet, istGesteuert, entitaetMitId } from "../kern/zustand.js";
import { aufDerKarte, feldIndex, durchsichtig, betretbar } from "../welt/karte.js";
import { ACHT_RICHTUNGEN } from "../welt/geometrie.js";

const regelnVon = (spiel) => spiel.daten.regeln.duft;

export function duftabstand(von, nach) {
  const dx = Math.abs(nach.x - von.x), dy = Math.abs(nach.y - von.y);
  return 2 * Math.max(dx, dy) + Math.min(dx, dy);
}

// Der Duft auf einem Feld der aktuellen Ebene, 0 ohne Duft
export function duftAuf(spiel, x, y) {
  const ebene = spiel.zustand.ebene;
  if (!aufDerKarte(ebene, x, y)) return 0;
  return ebene.duft?.[feldIndex(ebene, x, y)] ?? 0;
}

export function duftFrisch(spiel, wert) {
  const regeln = regelnVon(spiel);
  return wert > 0 && spiel.zustand.duftZaehler - wert <= regeln.haltbarkeitZuege * regeln.jeZug;
}

// Ein Zug der gesteuerten Entität: der Zähler steigt, ihr Duft legt sich auf die Felder in ihrer Sichtlinie
export function duftLegen(spiel) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const gesteuerte = gesteuerteEntitaet(zustand);
  if (!ebene || !gesteuerte?.position) return;
  const regeln = regelnVon(spiel);
  zustand.duftZaehler = (zustand.duftZaehler ?? 0) + regeln.jeZug;
  ebene.duft ??= new Array(ebene.breite * ebene.hoehe).fill(0);
  const ursprung = gesteuerte.position;
  const offen = (x, y) => aufDerKarte(ebene, x, y) && durchsichtig(spiel, x, y);
  new PreciseShadowcasting(offen, { topology: 8 }).compute(ursprung.x, ursprung.y, regeln.reichweite, (x, y) => {
    if (!aufDerKarte(ebene, x, y)) return;
    const index = feldIndex(ebene, x, y);
    const wert = zustand.duftZaehler - duftabstand(ursprung, { x, y });
    if (wert > ebene.duft[index]) ebene.duft[index] = wert;
  });
}

// nach jedem Zug der gesteuerten Entität (auch jedem Schritt einer langen Aktion)
anmelden("haken", "zug_ende", (spiel, kontext) => {
  if (istGesteuert(spiel.zustand, entitaetMitId(spiel.zustand, kontext.akteurId))) duftLegen(spiel);
});

// Das Nachbarfeld mit dem stärksten frischen Duft, der stärker ist als auf dem eigenen Feld und das das Wesen betreten
// kann (meiden: Felder, die es scheut), bei Gleichstand in fester Richtungsfolge; sonst null. Wer dort steht, prüft der Aufrufer.
export function duftfeld(spiel, wesen, meiden = null) {
  let bestes = null, besterWert = duftAuf(spiel, wesen.position.x, wesen.position.y);
  for (const { dx, dy } of ACHT_RICHTUNGEN) {
    const feld = { x: wesen.position.x + dx, y: wesen.position.y + dy };
    const wert = duftAuf(spiel, feld.x, feld.y);
    if (wert <= besterWert || !duftFrisch(spiel, wert) || meiden?.(feld.x, feld.y) || !betretbar(spiel, wesen, feld)) continue;
    bestes = feld;
    besterWert = wert;
  }
  return bestes;
}
