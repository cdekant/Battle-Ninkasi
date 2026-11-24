// Glimmer (siehe docs/Wesen.md, Glimmer): Psi lässt die Spielerin für Psi-Jägerinnen sichtbar werden.
// Wert "glimmer" ohne Höchstwert an der Spielerin (daten/ninkasi.js), sinkt nie von selbst.
// Regeln in regeln.glimmer:
//   zuwachs:  Kurve [pegel, prozent]: jede Fähigkeit mit dem Tag "psi" hebt den Glimmer um die bezahlten PP mal diesem
//             Anteil beim Pegel der Wirkenden; Modifikator "glimmer" (Plus oder Prozent) auf den Zuwachs (Abschirmen)
//   betreten: Kurve [glimmer, prozent]: Chance beim Betreten einer Ebene, dass eine Jägerin kommt; sie trifft zu einer
//             Zeit nach eintreffen [von, bis] Zeiteinheiten ein, verlässt die Spielerin die Ebene vorher, verfällt es
//   psi:      Kurve [glimmer, prozent]: Chance bei jeder Psi-Fähigkeit der Spielerin, dass sofort eine Jägerin erscheint
//   abstand:  so viele Schritte entlang des Wegs mindestens von der Spielerin entfernt erscheint sie, auf einem freien
//             Feld außer Sicht, von dem aus sie die Spielerin erreicht
//   senkenBeimAuftreten: so viel Prozent des Glimmers verfliegen, wenn eine Jägerin erscheint
// Jägerinnen sind Wesen mit psiJaegerin: { glimmerAb } in den Daten; es kommt die mit der höchsten erreichten Schwelle,
// höchstens eine zur Zeit auf der Ebene, nie im Hub (Tiefe 0) und nicht in der Arena. Sie kennt den Ort der Spielerin
// (Vorrangbefehl angreifen, ki/vorrang.js).

import { anmelden } from "../kern/register.js";
import { spielerin, alleEntitaeten, istWesen, ausDatenErzeugen, entitaetEntfernen, entitaetenAuf, bewegungVon } from "../kern/zustand.js";
import { modifiziert, hatWert, prozentVon, lebenswertName } from "../kern/werte.js";
import { wertAufKurve } from "../kern/kurven.js";
import { wertAendern } from "../kern/effekte.js";
import { wurfProzent, wurfGanzzahl, wurfAuswahl } from "../kern/wurf.js";
import { ereignisEinreihen, akteurEinreihen } from "../kern/zeit.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { indexVerwerfen } from "../kern/raumindex.js";
import { betretbarFuer, oeffnetTueren } from "../welt/karte.js";
import { abstandskarte } from "../welt/wege.js";

// Sichere Fälle würfeln nicht, so bleibt die Zahlenfolge des Zufalls ungestört
function trittEin(spiel, wurfname, chance) {
  if (chance <= 0) return false;
  return chance >= 100 || wurfProzent(spiel, wurfname, chance);
}

// Zuwachs des Glimmers für eine Psi-Fähigkeit mit pp bezahlten PP, beim aktuellen Pegel der Wirkenden, nie negativ
export function glimmerZuwachs(spiel, wesen, pp) {
  if (pp <= 0) return 0;
  const pegel = hatWert(wesen, "pegel") ? wesen.werte.pegel.aktuell : 0;
  const anteil = wertAufKurve(spiel.daten.regeln.glimmer.zuwachs, pegel);
  return Math.max(0, modifiziert(spiel, wesen, "glimmer", prozentVon(pp, anteil)));
}

const glimmerVon = (wesen) => (hatWert(wesen, "glimmer") ? wesen.werte.glimmer.aktuell : 0);

// Ob jetzt überhaupt eine Jägerin kommen darf: Spielerin mit Glimmer, nicht im Hub, nicht in der Arena, keine da
function jagdMoeglich(spiel, ninkasi) {
  if (!ninkasi?.position || spiel.zustand.vorbei || spiel.zustand.tiefe === 0 || spiel.optionen?.spielart === "arena") return false;
  if (!hatWert(ninkasi, "glimmer")) return false;
  return !alleEntitaeten(spiel.zustand).some((entitaet) => istJaegerin(spiel, entitaet) && entitaet.position
    && (entitaet.werte?.[lebenswertName(entitaet)]?.aktuell ?? 1) > 0);
}

export function istJaegerin(spiel, entitaet) {
  return istWesen(entitaet) && Boolean(spiel.daten.wesen[entitaet.typ]?.psiJaegerin);
}

// Typ der Jägerin beim Glimmer: die höchste erreichte Schwelle, bei Gleichstand die erste in den Daten; sonst null
export function jaegerinFuer(spiel, glimmer) {
  let gewaehlt = null;
  for (const [typ, datensatz] of Object.entries(spiel.daten.wesen)) {
    const ab = datensatz.psiJaegerin?.glimmerAb;
    if (datensatz.abstrakt || ab === undefined || ab > glimmer) continue;
    if (!gewaehlt || ab > gewaehlt.ab) gewaehlt = { typ, ab };
  }
  return gewaehlt?.typ ?? null;
}

// Freie Felder außer Sicht, auf denen die Jägerin stehen kann und von denen sie die Spielerin erreicht, mindestens
// abstand Schritte entlang des Wegs entfernt (zeilenweise)
function erscheinungsfelder(spiel, jaegerin, ninkasi) {
  const ebene = spiel.zustand.ebene;
  const sichtbar = new Set(spiel.zustand.sichtbareFelder || []);
  const mindestens = spiel.daten.regeln.glimmer.abstand;
  const wegabstand = abstandskarte(spiel, ninkasi.position, { bewegung: bewegungVon(jaegerin), oeffnetTueren: oeffnetTueren(jaegerin) });
  const felder = [];
  for (let y = 0; y < ebene.hoehe; y++) {
    for (let x = 0; x < ebene.breite; x++) {
      const feld = { x, y };
      const schritte = wegabstand[y * ebene.breite + x];
      if (sichtbar.has(y * ebene.breite + x) || schritte < 0 || schritte < mindestens) continue;
      // ohne Türen: eine geschlossene Tür wäre für Wesen, die Türen öffnen, betretbar, stehen kann man darauf nicht
      if (!betretbarFuer(spiel, x, y, bewegungVon(jaegerin), false) || entitaetenAuf(spiel.zustand, x, y).some(istWesen)) continue;
      felder.push(feld);
    }
  }
  return felder;
}

// Lässt eine Jägerin erscheinen, wenn eine kommen darf und es ein Feld gibt; gibt sie zurück oder null
export function jaegerinErscheinen(spiel) {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  if (!jagdMoeglich(spiel, ninkasi)) return null;
  const typ = jaegerinFuer(spiel, glimmerVon(ninkasi));
  if (!typ) return null;
  const jaegerin = ausDatenErzeugen(spiel, "wesen", typ, null);
  const felder = erscheinungsfelder(spiel, jaegerin, ninkasi);
  if (!felder.length) {
    entitaetEntfernen(zustand, jaegerin.id);
    return null;
  }
  const feld = wurfAuswahl(spiel, "jaegerin_feld", felder);
  jaegerin.position = { x: feld.x, y: feld.y };
  indexVerwerfen(zustand);
  if (jaegerin.ki) {
    jaegerin.ki.wachzustand = "jagt";
    jaegerin.ki.vorrang = { anweisung: "angreifen", zielId: ninkasi.id };
    akteurEinreihen(zustand, jaegerin.id, 0);
  }
  melden(spiel, "jaegerin_naht", { wer: bezugAuf(ninkasi), was: bezugAuf(jaegerin) });
  const verflogen = prozentVon(glimmerVon(ninkasi), spiel.daten.regeln.glimmer.senkenBeimAuftreten);
  if (verflogen > 0) wertAendern(spiel, ninkasi, "glimmer", -verflogen);
  return jaegerin;
}

// Psi-Fähigkeit gewirkt: Glimmer steigt; bei der Spielerin danach der Wurf auf eine Jägerin, die sofort erscheint
anmelden("haken", "faehigkeit_gewirkt", (spiel, kontext) => {
  if (!(kontext.tags || []).includes("psi")) return;
  const wesen = spiel.zustand.entitaeten[kontext.quelleId];
  if (!wesen || !hatWert(wesen, "glimmer")) return;
  const zuwachs = glimmerZuwachs(spiel, wesen, kontext.verbrauch?.pp ?? 0);
  if (zuwachs > 0) wertAendern(spiel, wesen, "glimmer", zuwachs);
  if (wesen !== spielerin(spiel.zustand) || !jagdMoeglich(spiel, wesen)) return;
  if (trittEin(spiel, "jaegerin", wertAufKurve(spiel.daten.regeln.glimmer.psi, glimmerVon(wesen)))) jaegerinErscheinen(spiel);
});

// Ebene betreten: der Wurf, ob auf dieser Ebene eine Jägerin kommt; ihr Eintreffen gilt nur für diesen Besuch
anmelden("haken", "ebene_betreten", (spiel, kontext) => {
  const zustand = spiel.zustand;
  const ninkasi = zustand.entitaeten[kontext.zielId];
  if (ninkasi !== spielerin(zustand)) return;
  zustand.ebeneBetretenUm = zustand.zeit;
  if (!jagdMoeglich(spiel, ninkasi)) return;
  const regeln = spiel.daten.regeln.glimmer;
  if (!trittEin(spiel, "jaegerin", wertAufKurve(regeln.betreten, glimmerVon(ninkasi)))) return;
  const [von, bis] = regeln.eintreffen;
  const zeitpunkt = zustand.zeit + wurfGanzzahl(spiel, "jaegerin_eintreffen", von, bis);
  ereignisEinreihen(zustand, zeitpunkt, "jaegerin_eintreffen", { tiefe: zustand.tiefe, betretenUm: zustand.zeit });
});

anmelden("zeitereignisse", "jaegerin_eintreffen", (spiel, { tiefe, betretenUm }) => {
  if (spiel.zustand.tiefe !== tiefe || spiel.zustand.ebeneBetretenUm !== betretenUm) return;
  jaegerinErscheinen(spiel);
});
