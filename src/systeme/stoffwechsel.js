// Stoffwechsel: je Welttick Regeneration oder Schwund nach Kurven über dem Pegel, danach Abbau des Pegels;
// im Kampf ruhen die Raten nach imKampf, dafür bringt jeder Treffer Gewinn nach kampfgewinn (Kampfespegel).
// Der Wert "pegel" zählt in Hundertstel Promille (100 = 1 ‰) und ist nach oben offen.
// Komponente in den Daten:
//   stoffwechsel: {
//     abbauHundertstel: 100,              // Abbau des Pegels je Welttick, in Hundertsteln eines Pegelpunkts
//     schwellen: [50, 100, 200, 300],     // Pegel, deren Über- und Unterschreiten gemeldet wird
//     regeneration: { lp: [[0, 30], [150, 80]], ... },  // je Wert eine Kurve: [pegel, Hundertstel je Welttick]
//     imKampf: { lp: 0, mp: 0 },          // Prozent der Rate im Kampf (systeme/kampfzustand.js), fehlt ein Wert: 100
//     kampfgewinn: { pp: { jeTreffer: 200, kurve: [[50, 0], [150, 100]] } },  // Hundertstel je Treffer, ausgeteilt
//   }                                     // wie erlitten, mal Prozent der Kurve über dem Pegel
// Negative Kurvenwerte sind Schwund. Modifikatoren (siehe kern/werte.js):
//   "regeneration.<wert>"       Plus oder Prozent auf eine positive Rate
//   "schwund.<wert>"            Plus oder Prozent auf den Betrag einer negativen Rate
//   "kurvenverschiebung.<wert>" Plus verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben)
//   "abbau.pegel"               Plus oder Prozent auf den Abbau des Pegels
//   "imKampf.<wert>"            Plus in Prozentpunkten auf den Anteil der Rate im Kampf (z.B. Regeneration im Kampf)
//   "kampfgewinn.<wert>"        Plus oder Prozent auf den Gewinn je Treffer

import { anmelden } from "../kern/register.js";
import { alleEntitaeten, istWesen } from "../kern/zustand.js";
import { modifiziert, hatWert, prozentVon } from "../kern/werte.js";
import { wertAufKurve, stelleDesHoechstwerts } from "../kern/kurven.js";
import { wertAendernInHundertsteln } from "../kern/effekte.js";
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

// Schwellen des Pegels beim Steigen und Sinken melden
anmelden("haken", "nach_wertaenderung", (spiel, { entitaet, wertName, vorher, nachher }) => {
  if (wertName !== "pegel" || !entitaet.stoffwechsel) return;
  for (const schwelle of entitaet.stoffwechsel.schwellen || []) {
    if (vorher < schwelle && nachher >= schwelle) melden(spiel, "pegel_steigt", { wer: bezugAuf(entitaet), schwelle });
    if (vorher >= schwelle && nachher < schwelle) melden(spiel, "pegel_sinkt", { wer: bezugAuf(entitaet), schwelle });
  }
  if (vorher > 0 && nachher === 0) melden(spiel, "nuechtern", { wer: bezugAuf(entitaet) });
});
