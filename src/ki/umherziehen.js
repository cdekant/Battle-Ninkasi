// Umherziehen für das Modul "jagen" (siehe docs/Wesen.md, KI), Vorbild Brogue: ein waches Wesen, das keinem Lärm
// nachgeht, zieht von Wegpunkt zu Wegpunkt (zustand.ebene.wegpunkte, Ebenenschritt wegpunkte), damit Ebenen nicht
// stillstehen, bis Ninkasi kommt.
//   Daten an der KI: umherziehen (Vorgabe true; false: es wartet wie ein Wächter)
//   Laufzeit an der KI: wanderung: { tiefe, ziel, besucht: [Nummern] } für die Ebene der Tiefe tiefe; auf einer anderen
//     Ebene beginnt sie neu
//   Erster Wegpunkt: gewürfelt (Wurf "umherziehen"); erreicht ist er auf höchstens einem Feld Abstand oder wenn kein Weg
//     hinführt, dann kommt er zu besucht und es geht zum nächsten unbesuchten (Schachbrett, bei Gleichstand der
//     frühere); sind alle besucht, beginnt besucht neu.
//   Schritt: über die Abstandskarte des Wegpunkts (welt/wege.js) auf das freie Nachbarfeld, das ihm am nächsten ist
//     (bei Gleichstand in fester Richtungsfolge), ohne gefährliche Felder und Fallen; ist keins frei, wartet es.
//   Rudel: ein Mitglied mit ki.anfuehrerinId zieht nicht selbst, sondern geht zur Anführerin, wenn sie mehr als
//     regeln.ki.rudelAbstand Felder entfernt ist, sonst wartet es; ist sie fort oder tot, zieht es allein weiter.
// Verändert ki (wanderung, anfuehrerinId), darum nur für den gewählten Befehl aufrufen.

import { abstand, aufDerKarte, feldIndex } from "../welt/karte.js";
import { naechstesWegfeld, abstandskarte } from "../welt/wege.js";
import { ACHT_RICHTUNGEN, wesenAufFeld } from "../welt/geometrie.js";
import { lebenswertName } from "../kern/werte.js";
import { wurfGanzzahl } from "../kern/wurf.js";
import { istUnbeweglich } from "../systeme/bewegung.js";
import { abwarten } from "./abwarten.js";
import { wegOptionenFuer } from "./verfolgen.js";

const lebt = (entitaet) => (entitaet.werte?.[lebenswertName(entitaet)]?.aktuell ?? 1) > 0;

// Ein Schritt zum Feld ziel um Wesen herum, oder null, wenn kein Weg hinführt
function schrittZu(spiel, wesen, ziel) {
  const feld = naechstesWegfeld(spiel, wesen.position, ziel, { ...wegOptionenFuer(spiel, wesen), wesenMeiden: true });
  return feld ? { art: "bewegen", dx: feld.x - wesen.position.x, dy: feld.y - wesen.position.y } : null;
}

// Schritt zum Wegpunkt über seine Abstandskarte: { schritt } (null, wenn kein freies Feld näher ist) oder null, wenn er
// von hier aus nicht erreichbar ist
function schrittZumWegpunkt(spiel, wesen, wegpunkt) {
  const ebene = spiel.zustand.ebene;
  const optionen = wegOptionenFuer(spiel, wesen);
  const karte = abstandskarte(spiel, wegpunkt, optionen);
  const hier = karte[feldIndex(ebene, wesen.position.x, wesen.position.y)];
  if (hier < 0) return null;
  let bester = null, besterAbstand = hier;
  for (const { dx, dy } of ACHT_RICHTUNGEN) {
    const x = wesen.position.x + dx, y = wesen.position.y + dy;
    if (!aufDerKarte(ebene, x, y)) continue;
    const dort = karte[feldIndex(ebene, x, y)];
    if (dort < 0 || dort >= besterAbstand || optionen.meiden?.(x, y) || wesenAufFeld(spiel, { x, y }).length) continue;
    bester = { art: "bewegen", dx, dy };
    besterAbstand = dort;
  }
  return { schritt: bester };
}

// Die Anführerin des Rudels oder null; eine fortgegangene oder tote wird dabei vergessen
function anfuehrerinVon(spiel, ki) {
  if (ki.anfuehrerinId == null) return null;
  const anfuehrerin = spiel.zustand.entitaeten[ki.anfuehrerinId];
  if (anfuehrerin?.position && lebt(anfuehrerin)) return anfuehrerin;
  delete ki.anfuehrerinId;
  return null;
}

// Nächster unbesuchter Wegpunkt nach Abstand; sind alle besucht, beginnt besucht mit dem gerade erreichten neu
function naechsterWegpunkt(wesen, wegpunkte, wanderung) {
  if (wanderung.besucht.length >= wegpunkte.length) wanderung.besucht = wanderung.ziel == null ? [] : [wanderung.ziel];
  let bester = null;
  wegpunkte.forEach((wegpunkt, nummer) => {
    if (wanderung.besucht.includes(nummer)) return;
    if (bester === null || abstand(wesen.position, wegpunkt) < abstand(wesen.position, wegpunkte[bester])) bester = nummer;
  });
  return bester;
}

function wanderungVon(spiel, wegpunkte, ki) {
  const tiefe = spiel.zustand.tiefe;
  if (ki.wanderung?.tiefe !== tiefe) ki.wanderung = { tiefe, ziel: wurfGanzzahl(spiel, "umherziehen", 0, wegpunkte.length - 1), besucht: [] };
  return ki.wanderung;
}

export function umherziehbefehl(spiel, wesen, ki) {
  if (ki.umherziehen === false || istUnbeweglich(wesen)) return abwarten();
  const anfuehrerin = anfuehrerinVon(spiel, ki);
  if (anfuehrerin) {
    if (abstand(wesen.position, anfuehrerin.position) <= spiel.daten.regeln.ki.rudelAbstand) return abwarten();
    return schrittZu(spiel, wesen, anfuehrerin.position) ?? abwarten();
  }
  const wegpunkte = spiel.zustand.ebene.wegpunkte;
  if (!wegpunkte?.length) return abwarten();
  const wanderung = wanderungVon(spiel, wegpunkte, ki);
  // höchstens zwei Wegpunkte je Zug: der bisherige und, wenn er erreicht ist, der nächste
  for (let versuch = 0; versuch < 2; versuch++) {
    const ziel = wegpunkte[wanderung.ziel];
    if (ziel && abstand(wesen.position, ziel) > 1) {
      const weiter = schrittZumWegpunkt(spiel, wesen, ziel);
      if (weiter) return weiter.schritt ?? abwarten();
    }
    if (wanderung.ziel != null && !wanderung.besucht.includes(wanderung.ziel)) wanderung.besucht.push(wanderung.ziel);
    wanderung.ziel = naechsterWegpunkt(wesen, wegpunkte, wanderung);
  }
  return abwarten();
}
