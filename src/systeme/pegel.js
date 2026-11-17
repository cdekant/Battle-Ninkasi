// Pegel: Abklingen der PP und Regeneration mit Pegel, je Welttick.
// Komponente in den Daten:
//   pegel: { abklingenHundertstel: 100, regenerationHundertstel: { lp: 50, mp: 50 }, schwellen: [25, 50, 75] }
// Alle Raten in Hundertsteln pro Welttick. Nüchtern (PP = 0) keine Regeneration.

import { anmelden } from "../kern/register.js";
import { alleEntitaeten } from "../kern/zustand.js";
import { wertAendernInHundertsteln } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";

anmelden("welttick", "pegel", (spiel) => {
  for (const entitaet of alleEntitaeten(spiel.zustand)) {
    const pegel = entitaet.pegel;
    if (!pegel || !entitaet.werte || !entitaet.werte.pp || entitaet.position === undefined) continue;
    if (entitaet.werte.pp.aktuell > 0) {
      for (const [wertName, hundertstelProTick] of Object.entries(pegel.regenerationHundertstel || {})) {
        if (entitaet.werte[wertName]) wertAendernInHundertsteln(spiel, entitaet, wertName, hundertstelProTick);
      }
    }
    if (pegel.abklingenHundertstel) wertAendernInHundertsteln(spiel, entitaet, "pp", -pegel.abklingenHundertstel);
  }
});

// Schwellen beim Steigen und Sinken melden
anmelden("haken", "nach_wertaenderung", (spiel, { entitaet, wertName, vorher, nachher }) => {
  if (wertName !== "pp" || !entitaet.pegel) return;
  for (const schwelle of entitaet.pegel.schwellen || []) {
    if (vorher < schwelle && nachher >= schwelle) melden(spiel, "pegel_steigt", { wer: bezugAuf(entitaet), schwelle });
    if (vorher >= schwelle && nachher < schwelle) melden(spiel, "pegel_sinkt", { wer: bezugAuf(entitaet), schwelle });
  }
  if (vorher > 0 && nachher === 0) melden(spiel, "nuechtern", { wer: bezugAuf(entitaet) });
});
