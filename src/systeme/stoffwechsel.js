// Stoffwechsel: je Welttick Regeneration oder Schwund nach Kurven über dem Pegel, danach Abbau des Pegels;
// im Kampf ruhen die Raten nach imKampf, dafür bringt jeder Treffer Gewinn nach kampfgewinn (Kampfespegel).
// Der Wert "pegel" zählt in Hundertstel Promille (100 = 1 ‰) und ist nach oben offen.
// Komponente in den Daten:
//   stoffwechsel: {
//     abbauHundertstel: 100,              // Abbau des Pegels je Welttick, in Hundertsteln eines Pegelpunkts
//     stufen: [{ name: "angeheitert", ab: 200 }, ...],  // Stufen des Rauschs aufsteigend; darunter "nuechtern";
//                                         // Über- und Unterschreiten wird gemeldet, Texte rausch.<name>
//     regeneration: { lp: [[0, 30], [150, 80]], ... },  // je Wert eine Kurve: [pegel, Hundertstel je Welttick]
//     imKampf: { lp: 0, mp: 0 },          // Prozent der Rate im Kampf (systeme/kampfzustand.js), fehlt ein Wert: 100
//     kampfgewinn: { pp: { jeTreffer: 200, kurve: [[50, 0], [150, 100]] } },  // Hundertstel je Treffer, ausgeteilt
//     rausch: {                           // Strafen des Rauschs über dem Pegel
//       befehle: [{ veraenderer, chance: kurve, ...parameter }],  // Befehlsveränderer (systeme/befehlsveraenderer.js)
//                                         // mit der Chance in Prozent nach der Kurve über dem Pegel
//       modifikatoren: [{ ziel, art, betrag, wenn? }],  // gelten immer, Schwellen über pegel_ab (Quelle "rausch")
//     },
//     filmriss: { alleTicks: 100, chance: kurve, effekt },  // alle alleTicks Weltticks, nur außerhalb des Kampfes,
//                                         // mit der Chance in Prozent über dem Pegel der Effekt auf sich selbst
//   }                                     // wie erlitten, mal Prozent der Kurve über dem Pegel
// Negative Kurvenwerte sind Schwund. Modifikatoren (siehe kern/werte.js):
//   "regeneration.<wert>"       Plus oder Prozent auf eine positive Rate
//   "schwund.<wert>"            Plus oder Prozent auf den Betrag einer negativen Rate
//   "kurvenverschiebung.<wert>" Plus verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben)
//   "abbau.pegel"               Plus oder Prozent auf den Abbau des Pegels
//   "imKampf.<wert>"            Plus in Prozentpunkten auf den Anteil der Rate im Kampf (z.B. Regeneration im Kampf)
//   "kampfgewinn.<wert>"        Plus oder Prozent auf den Gewinn je Treffer
//   "rausch.<veraenderer>"      Plus oder Prozent auf die Chance eines Befehlsveränderers aus dem Rausch (Standfestigkeit)
//   "rausch.filmriss"           Plus oder Prozent auf die Chance des Filmrisses

import { anmelden, holen } from "../kern/register.js";
import { alleEntitaeten, istWesen } from "../kern/zustand.js";
import { WELTTICK } from "../kern/zeit.js";
import { wurfProzent } from "../kern/wurf.js";
import { modifiziert, hatWert, prozentVon } from "../kern/werte.js";
import { wertAufKurve, stelleDesHoechstwerts } from "../kern/kurven.js";
import { wertAendernInHundertsteln, effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { imKampf } from "./kampfzustand.js";

function kurvenverschiebung(spiel, entitaet, wertName) {
  return modifiziert(spiel, entitaet, `kurvenverschiebung.${wertName}`, 0);
}

// Rate in Hundertsteln je Welttick beim aktuellen Pegel, mit Modifikatoren, ohne den Kampf; negativ heißt Schwund
export function rateBeimPegel(spiel, entitaet, wertName) {
  const kurve = entitaet.stoffwechsel.regeneration[wertName];
  const stelle = entitaet.werte.pegel.aktuell - kurvenverschiebung(spiel, entitaet, wertName);
  const rate = wertAufKurve(kurve, stelle);
  if (rate > 0) return Math.max(0, modifiziert(spiel, entitaet, `regeneration.${wertName}`, rate));
  if (rate < 0) return -Math.max(0, modifiziert(spiel, entitaet, `schwund.${wertName}`, -rate));
  return 0;
}

// Anteil der Rate im Kampf in Prozent, 0 bis 100; außerhalb des Kampfes immer 100
export function anteilImKampf(spiel, entitaet, wertName) {
  if (!imKampf(spiel, entitaet)) return 100;
  const anteil = modifiziert(spiel, entitaet, `imKampf.${wertName}`, entitaet.stoffwechsel.imKampf?.[wertName] ?? 100);
  return Math.min(100, Math.max(0, anteil));
}

// Rate, die im nächsten Welttick wirkt: Rate beim Pegel mal Anteil im Kampf
export function wirksameRate(spiel, entitaet, wertName) {
  return prozentVon(rateBeimPegel(spiel, entitaet, wertName), anteilImKampf(spiel, entitaet, wertName)) + 0;
}

// Gewinn eines Werts je Treffer in Hundertsteln beim aktuellen Pegel, mit Modifikatoren, nie negativ
export function gewinnJeTreffer(spiel, entitaet, wertName) {
  const gewinn = entitaet.stoffwechsel?.kampfgewinn?.[wertName];
  if (!gewinn) return 0;
  const anteil = wertAufKurve(gewinn.kurve, entitaet.werte.pegel.aktuell);
  return Math.max(0, modifiziert(spiel, entitaet, `kampfgewinn.${wertName}`, prozentVon(gewinn.jeTreffer, anteil)));
}

// Stufe des Rauschs beim aktuellen Pegel: Name der höchsten erreichten Stufe, darunter "nuechtern"
export function rauschstufe(entitaet) {
  const pegel = entitaet.werte?.pegel?.aktuell ?? 0;
  return stufeBeimPegel(entitaet.stoffwechsel?.stufen || [], pegel);
}

function stufeBeimPegel(stufen, pegel) {
  let name = "nuechtern";
  for (const stufe of stufen) if (pegel >= stufe.ab) name = stufe.name;
  return name;
}

// Chance eines Befehlsveränderers aus dem Rausch in Prozent beim aktuellen Pegel, mit Modifikatoren, 0 bis 100
export function rauschchance(spiel, entitaet, eintrag) {
  const grundchance = wertAufKurve(eintrag.chance, entitaet.werte.pegel.aktuell);
  return Math.min(100, Math.max(0, modifiziert(spiel, entitaet, `rausch.${eintrag.veraenderer}`, grundchance)));
}

// Chance des Filmrisses in Prozent beim aktuellen Pegel, mit Modifikatoren, 0 bis 100; 0 ohne filmriss
export function filmrisschance(spiel, entitaet) {
  const filmriss = entitaet.stoffwechsel?.filmriss;
  if (!filmriss) return 0;
  const grundchance = wertAufKurve(filmriss.chance, entitaet.werte.pegel.aktuell);
  return grundchance <= 0 ? 0 : Math.min(100, Math.max(0, modifiziert(spiel, entitaet, "rausch.filmriss", grundchance)));
}

// Filmriss: alle alleTicks Weltticks ein Wurf, nur außerhalb des Kampfes und nur mit einer Chance über 0
function filmrissWuerfeln(spiel, entitaet) {
  const filmriss = entitaet.stoffwechsel.filmriss;
  if (!filmriss || Math.floor(spiel.zustand.zeit / WELTTICK) % filmriss.alleTicks !== 0 || imKampf(spiel, entitaet)) return;
  const chance = filmrisschance(spiel, entitaet);
  if (chance <= 0 || !wurfProzent(spiel, "filmriss", chance)) return;
  const position = { x: entitaet.position.x, y: entitaet.position.y };
  effektAnwenden(spiel, filmriss.effekt, { quelleId: entitaet.id, zielId: entitaet.id, ursprung: position, zielfeld: position, ursache: "zustand", kettentiefe: 0, mittel: { art: "filmriss" } });
}

// Pegel mit der schnellsten Regeneration eines Werts, z.B. für die Anzeige des LP-Optimums
export function optimalerPegel(spiel, entitaet, wertName) {
  const kurve = entitaet.stoffwechsel?.regeneration?.[wertName];
  if (!kurve) return undefined;
  return stelleDesHoechstwerts(kurve) + kurvenverschiebung(spiel, entitaet, wertName);
}

anmelden("welttick", "stoffwechsel", (spiel) => {
  for (const entitaet of alleEntitaeten(spiel.zustand)) {
    const stoffwechsel = entitaet.stoffwechsel;
    if (!stoffwechsel || !hatWert(entitaet, "pegel") || entitaet.position === undefined) continue;
    // alle Raten am Pegel vor dem Abbau, in der Reihenfolge der Daten;
    // Schwund der LP kann töten (z.B. Alkoholvergiftung), getötet wird in der Zustandsprüfung (systeme/tod.js)
    for (const wertName of Object.keys(stoffwechsel.regeneration || {})) {
      if (!hatWert(entitaet, wertName)) continue;
      const rate = wirksameRate(spiel, entitaet, wertName);
      if (rate !== 0) wertAendernInHundertsteln(spiel, entitaet, wertName, rate, { urheberId: null, ursache: `schwund.${wertName}`, kettentiefe: 0 });
    }
    const abbau = Math.max(0, modifiziert(spiel, entitaet, "abbau.pegel", stoffwechsel.abbauHundertstel || 0));
    if (abbau > 0) wertAendernInHundertsteln(spiel, entitaet, "pegel", -abbau);
    if (spiel.zustand.entitaeten[entitaet.id]) filmrissWuerfeln(spiel, entitaet);
  }
});

// Kampfespegel: jeder Treffer zwischen zwei Wesen bringt beiden ihren Gewinn, ausgeteilt wie erlitten; je Treffer
// statt je Schadenspunkt, damit der Gewinn nicht mit dem Schaden der Tiefe wächst
function kampfgewinnVerbuchen(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const angreiferin = entitaeten[kontext.quelleId], ziel = entitaeten[kontext.zielId];
  if (!istWesen(angreiferin) || !istWesen(ziel) || angreiferin.id === ziel.id) return;
  for (const wesen of [angreiferin, ziel]) {
    if (!wesen.stoffwechsel?.kampfgewinn || !hatWert(wesen, "pegel")) continue;
    for (const wertName of Object.keys(wesen.stoffwechsel.kampfgewinn)) {
      if (!hatWert(wesen, wertName)) continue;
      const gewinn = gewinnJeTreffer(spiel, wesen, wertName);
      if (gewinn > 0) wertAendernInHundertsteln(spiel, wesen, wertName, gewinn);
    }
  }
}

anmelden("haken", "nach_treffer", kampfgewinnVerbuchen);

// Stufen des Rauschs beim Steigen und Sinken melden: stufe ist die Stufe, die beim Überschreiten beginnt bzw. nach
// dem Unterschreiten gilt
anmelden("haken", "nach_wertaenderung", (spiel, { entitaet, wertName, vorher, nachher }) => {
  if (wertName !== "pegel" || !entitaet.stoffwechsel) return;
  const stufen = entitaet.stoffwechsel.stufen || [];
  for (const stufe of stufen) {
    if (vorher < stufe.ab && nachher >= stufe.ab) melden(spiel, "pegel_steigt", { wer: bezugAuf(entitaet), schwelle: stufe.ab, stufe: stufe.name });
  }
  for (const stufe of [...stufen].reverse()) {
    if (vorher >= stufe.ab && nachher < stufe.ab) melden(spiel, "pegel_sinkt", { wer: bezugAuf(entitaet), schwelle: stufe.ab, stufe: stufeBeimPegel(stufen, stufe.ab - 1) });
  }
  if (vorher > 0 && nachher === 0) melden(spiel, "nuechtern", { wer: bezugAuf(entitaet) });
});

// Strafen des Rauschs: die Befehlsveränderer aus rausch.befehle in ihrer Reihenfolge, jeder mit seiner Chance beim Pegel;
// sichere Fälle (Chance 0) rufen den Veränderer nicht auf, so bleibt die Zahlenfolge des Zufalls nüchtern ungestört
anmelden("haken", "vor_befehl", (spiel, kontext) => {
  const akteur = spiel.zustand.entitaeten[kontext.akteurId];
  const befehle = akteur?.stoffwechsel?.rausch?.befehle;
  if (!befehle || !hatWert(akteur, "pegel")) return;
  for (const eintrag of befehle) {
    const chance = rauschchance(spiel, akteur, eintrag);
    if (chance <= 0) continue;
    const { veraenderer, chance: _kurve, ...parameter } = eintrag;
    kontext.befehl = holen("befehlsveraenderer", veraenderer)(spiel, akteur, kontext.befehl, { ...parameter, chance }, 100);
  }
});

// Modifikatoren des Rauschs (Genauigkeit über pegel_ab), Quelle "rausch"
anmelden("modifikatorquellen", "rausch", (spiel, entitaet) => {
  const modifikatoren = entitaet.stoffwechsel?.rausch?.modifikatoren;
  return modifikatoren?.length ? modifikatoren.map((modifikator) => ({ ...modifikator, quelle: "rausch" })) : [];
});
