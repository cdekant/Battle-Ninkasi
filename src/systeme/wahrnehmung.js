// Wahrnehmung (siehe docs/Wesen.md, Wahrnehmung), Vorbild Brogue.
// Wachzustand in der KI-Komponente: ki.wachzustand = "schlaeft" | "wach" | "jagt" (Vorgabe "jagt", wie bisher)
//   schlaeft: tut nichts, bis es etwas bemerkt (dann jagt) oder Lärm hört (dann wach)
//   wach:     hat noch niemanden bemerkt; geht Lärm nach (letzteBekanntePosition), sonst wartet es
//   jagt:     verfolgt sichtbare Ziele innerhalb der Spurweite; verliert es die Spur, wird es wieder wach
// Bemerken: vor seinem Zug würfelt ein Wesen, das nicht jagt, für jedes sichtbare feindliche Ziel innerhalb von dessen
//   Heimlichkeitsweite mit regeln.wahrnehmung.bemerkenChance; Treffer oder Fehlschlag gegen es wecken es sofort.
// Heimlichkeitsweite: Kampfwert heimlichkeit (Vorgabe aus den Regeln) mit Modifikatoren, dann nach der letzten eigenen
//   Aktion skaliert (Kämpfen verdoppelt, Warten halbiert), nie unter heimlichkeitMindestens.
// Ahnungslos ist ein Wesen mit KI, das nicht jagt: Angriffe darauf sind ein Hinterhalt (systeme/kampf.js).
// Lärm: breitet sich wie eine Wegsuche mit Kosten aus, ein passierbares Feld kostet 1, anderes Gelände seine
//   laermdaempfung (ohne Angabe undurchlässig); wer innerhalb der Lautstärke liegt, hört ihn.

import { anmelden } from "../kern/register.js";
import { entitaetenImUmkreis, fraktionVon, istWesen, gesteuerteEntitaet } from "../kern/zustand.js";
import { modifiziert, lebenswertName } from "../kern/werte.js";
import { mitProzentChance } from "../kern/zufall.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { abstand, aufDerKarte, feldIndex, passierbar, gelaendeAuf } from "../welt/karte.js";
import { ACHT_RICHTUNGEN } from "../welt/geometrie.js";
import { trifftZu } from "./zielauswahl.js";
import { sieht, kandidatenInSicht } from "./sicht.js";

export const WACHZUSTAENDE = ["schlaeft", "wach", "jagt"];

const regelnVon = (spiel) => spiel.daten.regeln.wahrnehmung;

export function wachzustandVon(wesen) {
  return wesen.ki?.wachzustand ?? "jagt";
}

export function istAhnungslos(wesen) {
  return Boolean(wesen?.ki) && wachzustandVon(wesen) !== "jagt";
}

export function heimlichkeitsweite(spiel, wesen) {
  const regeln = regelnVon(spiel);
  const grundweite = modifiziert(spiel, wesen, "heimlichkeit", wesen.kampfwerte?.heimlichkeit ?? regeln.heimlichkeitVorgabe);
  const nachAktion = regeln.heimlichkeitNachAktion[wesen.letzteAktion] ?? 100;
  return Math.max(regeln.heimlichkeitMindestens, Math.round((grundweite * nachAktion) / 100));
}

// Ein jagendes Wesen behält ein Ziel nur innerhalb dieser Weite im Blick
export function spurweite(spiel, ziel) {
  return regelnVon(spiel).spurFaktor * heimlichkeitsweite(spiel, ziel);
}

const lebt = (entitaet) => (entitaet.werte?.[lebenswertName(entitaet)]?.aktuell ?? 1) > 0;

// Sichtbare feindliche Ziele nach Abstand, bei Gleichstand nach ID
function sichtbareFeinde(spiel, wesen) {
  const urheber = { id: wesen.id, fraktion: fraktionVon(wesen) ?? null };
  return kandidatenInSicht(spiel, wesen)
    .filter((kandidat) => kandidat.id !== wesen.id && kandidat.position && lebt(kandidat)
      && trifftZu(spiel, "feinde", urheber, kandidat) && sieht(spiel, wesen, kandidat))
    .sort((erstes, zweites) => abstand(wesen.position, erstes.position) - abstand(wesen.position, zweites.position) || erstes.id - zweites.id);
}

function wecken(spiel, wesen, wachzustand) {
  wesen.ki.wachzustand = wachzustand;
}

// Vor dem Zug eines Wesens mit eigener KI: Bemerken (ändert nur ki.wachzustand)
export function wahrnehmen(spiel, wesen) {
  const ki = wesen.ki;
  if (!ki || !wesen.position || wachzustandVon(wesen) === "jagt") return;
  const chance = regelnVon(spiel).bemerkenChance;
  for (const ziel of sichtbareFeinde(spiel, wesen)) {
    if (abstand(wesen.position, ziel.position) > heimlichkeitsweite(spiel, ziel)) continue;
    const bemerkt = chance >= 100 || (chance > 0 && mitProzentChance(spiel.zustand.zufallszustand, chance));
    if (!bemerkt) continue;
    wecken(spiel, wesen, "jagt");
    melden(spiel, "bemerkt", { wer: bezugAuf(wesen), ziel: bezugAuf(ziel) });
    return;
  }
}

// Wer angegriffen wird, jagt sofort und kennt die Position der Urheberin
function angegriffen(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const ziel = entitaeten[kontext.zielId];
  const angreiferin = entitaeten[kontext.urheberId] ?? entitaeten[kontext.quelleId];
  // nur Wesen lösen das aus, keine Fallen oder Fässer
  if (!ziel?.ki || !angreiferin?.position || !istWesen(angreiferin) || angreiferin.id === ziel.id) return;
  if (wachzustandVon(ziel) !== "jagt") melden(spiel, "bemerkt", { wer: bezugAuf(ziel), ziel: bezugAuf(angreiferin) });
  wecken(spiel, ziel, "jagt");
  ziel.ki.letzteBekanntePosition = { x: angreiferin.position.x, y: angreiferin.position.y };
}

for (const haken of ["nach_treffer", "verfehlt", "nach_schaden"]) anmelden("haken", haken, angegriffen, { rang: 200 });

// Kosten, die Lärm für ein Feld zahlt; Infinity, wenn er nicht durchdringt
function laermkosten(spiel, x, y) {
  if (passierbar(spiel, x, y)) return 1;
  return gelaendeAuf(spiel, x, y)?.laermdaempfung ?? Infinity;
}

// Felder (Indizes), die Lärm der Lautstärke vom Ursprung aus erreicht (Kosten höchstens lautstaerke)
export function laermFelder(spiel, ursprung, lautstaerke) {
  const ebene = spiel.zustand.ebene;
  const kosten = new Map([[feldIndex(ebene, ursprung.x, ursprung.y), 0]]);
  const eimer = [[ursprung]];
  for (let stand = 0; stand <= lautstaerke; stand++) {
    for (const feld of eimer[stand] || []) {
      if (kosten.get(feldIndex(ebene, feld.x, feld.y)) !== stand) continue;
      for (const { dx, dy } of ACHT_RICHTUNGEN) {
        const x = feld.x + dx, y = feld.y + dy;
        if (!aufDerKarte(ebene, x, y)) continue;
        const neu = stand + laermkosten(spiel, x, y);
        const index = feldIndex(ebene, x, y);
        if (neu > lautstaerke || neu >= (kosten.get(index) ?? Infinity)) continue;
        kosten.set(index, neu);
        (eimer[neu] ??= []).push({ x, y });
      }
    }
  }
  return new Set(kosten.keys());
}

// Arten von Geräuschen für die Meldung "laerm" (Ninkasi hört sie als vage Zeile im Log, systeme/wahrnehmbar.js)
export const GERAEUSCHE = ["nahkampf", "aufschlag", "sonstiges"];

// Lärm am Ursprung: Schlafende werden wach, Wache gehen ihm nach; wer jagt, bleibt dabei.
// Die Meldung sagt mit gesteuerteHoert, ob der Lärm das Feld der gesteuerten Entität erreicht (ihr eigener zählt nicht).
export function laermMachen(spiel, ursprung, lautstaerke, urheberId = null, geraeusch = "sonstiges") {
  if (!ursprung || lautstaerke <= 0) return;
  const ebene = spiel.zustand.ebene;
  const erreicht = laermFelder(spiel, ursprung, lautstaerke);
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  const gesteuerteHoert = Boolean(gesteuerte?.position) && gesteuerte.id !== urheberId && erreicht.has(feldIndex(ebene, gesteuerte.position.x, gesteuerte.position.y));
  melden(spiel, "laerm", { ursprung: { x: ursprung.x, y: ursprung.y }, lautstaerke, geraeusch, gesteuerteHoert });
  // jedes Feld kostet mindestens 1, weiter als die Lautstärke (Schachbrett) trägt Lärm also nie
  for (const wesen of entitaetenImUmkreis(spiel.zustand, ursprung, lautstaerke)) {
    if (!wesen.ki || !wesen.position || wesen.id === urheberId) continue;
    if (!erreicht.has(feldIndex(ebene, wesen.position.x, wesen.position.y))) continue;
    const vorher = wachzustandVon(wesen);
    if (vorher === "jagt") continue;
    if (vorher === "schlaeft") melden(spiel, "aufgewacht", { wer: bezugAuf(wesen) });
    wecken(spiel, wesen, "wach");
    if (!wesen.ki.letzteBekanntePosition) wesen.ki.letzteBekanntePosition = { x: ursprung.x, y: ursprung.y };
  }
}

// Baustein laerm { lautstaerke } am Ursprung des Effekts
bausteinAnmelden("laerm", { lautstaerke: "ganzzahl" }, (spiel, kontext, parameter) => {
  laermMachen(spiel, kontext.ursprung, parameter.lautstaerke, kontext.quelleId);
});
