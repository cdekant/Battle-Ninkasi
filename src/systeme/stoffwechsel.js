// Stoffwechsel: je Welttick Regeneration oder Schwund nach Kurven über dem Pegel, danach Abbau des Pegels.
// Der Wert "pegel" zählt in Hundertstel Promille (100 = 1 ‰) und ist nach oben offen.
// Komponente in den Daten:
//   stoffwechsel: {
//     abbauHundertstel: 100,              // Abbau des Pegels je Welttick, in Hundertsteln eines Pegelpunkts
//     schwellen: [50, 100, 200, 300],     // Pegel, deren Über- und Unterschreiten gemeldet wird
//     regeneration: { lp: [[0, 30], [150, 80]], ... },  // je Wert eine Kurve: [pegel, Hundertstel je Welttick]
//   }
// Negative Kurvenwerte sind Schwund. Modifikatoren (siehe kern/werte.js):
//   "regeneration.<wert>"       Plus oder Prozent auf eine positive Rate
//   "schwund.<wert>"            Plus oder Prozent auf den Betrag einer negativen Rate
//   "kurvenverschiebung.<wert>" Plus verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben)
//   "abbau.pegel"               Plus oder Prozent auf den Abbau des Pegels

import { anmelden } from "../kern/register.js";
import { alleEntitaeten } from "../kern/zustand.js";
import { modifiziert, hatWert } from "../kern/werte.js";
import { wertAufKurve, stelleDesHoechstwerts } from "../kern/kurven.js";
import { wertAendernInHundertsteln, toeten } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";

function kurvenverschiebung(entitaet, wertName) {
  return modifiziert(entitaet, `kurvenverschiebung.${wertName}`, 0);
}

// Rate in Hundertsteln je Welttick beim aktuellen Pegel, mit Modifikatoren; negativ heißt Schwund
export function rateBeimPegel(entitaet, wertName) {
  const kurve = entitaet.stoffwechsel.regeneration[wertName];
  const stelle = entitaet.werte.pegel.aktuell - kurvenverschiebung(entitaet, wertName);
  const rate = wertAufKurve(kurve, stelle);
  if (rate > 0) return Math.max(0, modifiziert(entitaet, `regeneration.${wertName}`, rate));
  if (rate < 0) return -Math.max(0, modifiziert(entitaet, `schwund.${wertName}`, -rate));
  return 0;
}

// Pegel mit der schnellsten Regeneration eines Werts, z.B. für die Anzeige des LP-Optimums
export function optimalerPegel(entitaet, wertName) {
  const kurve = entitaet.stoffwechsel?.regeneration?.[wertName];
  if (!kurve) return undefined;
  return stelleDesHoechstwerts(kurve) + kurvenverschiebung(entitaet, wertName);
}

anmelden("welttick", "stoffwechsel", (spiel) => {
  for (const entitaet of alleEntitaeten(spiel.zustand)) {
    const stoffwechsel = entitaet.stoffwechsel;
    if (!stoffwechsel || !hatWert(entitaet, "pegel") || entitaet.position === undefined) continue;
    // alle Raten am Pegel vor dem Abbau, in der Reihenfolge der Daten
    let gestorben = false;
    for (const wertName of Object.keys(stoffwechsel.regeneration || {})) {
      if (!hatWert(entitaet, wertName)) continue;
      const rate = rateBeimPegel(entitaet, wertName);
      if (rate !== 0) wertAendernInHundertsteln(spiel, entitaet, wertName, rate);
      // Schwund der LP kann töten (z.B. Alkoholvergiftung)
      if (wertName === "lp" && entitaet.werte.lp.aktuell <= 0) {
        toeten(spiel, entitaet, null);
        gestorben = true;
        break;
      }
    }
    if (gestorben) continue;
    const abbau = Math.max(0, modifiziert(entitaet, "abbau.pegel", stoffwechsel.abbauHundertstel || 0));
    if (abbau > 0) wertAendernInHundertsteln(spiel, entitaet, "pegel", -abbau);
  }
});

// Schwellen des Pegels beim Steigen und Sinken melden
anmelden("haken", "nach_wertaenderung", (spiel, { entitaet, wertName, vorher, nachher }) => {
  if (wertName !== "pegel" || !entitaet.stoffwechsel) return;
  for (const schwelle of entitaet.stoffwechsel.schwellen || []) {
    if (vorher < schwelle && nachher >= schwelle) melden(spiel, "pegel_steigt", { wer: bezugAuf(entitaet), schwelle });
    if (vorher >= schwelle && nachher < schwelle) melden(spiel, "pegel_sinkt", { wer: bezugAuf(entitaet), schwelle });
  }
  if (vorher > 0 && nachher === 0) melden(spiel, "nuechtern", { wer: bezugAuf(entitaet) });
});
