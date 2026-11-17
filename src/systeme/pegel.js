// Pegel: Abklingen der PP und Regeneration mit Pegel, je Welttick.
// Komponente in den Daten:
//   pegel: { abklingen: 100, regeneration: { lp: 50, mp: 50 }, schwellen: [25, 50, 75] }
// Alle Raten in Hundertsteln pro Welttick. Nüchtern (PP = 0) keine Regeneration.

import { anmelden } from "../kern/register.js";
import { alle } from "../kern/zustand.js";
import { wertAendernHundertstel } from "../kern/effekte.js";
import { melden, bezug } from "../kern/ereignisse.js";

anmelden("welttick", "pegel", (spiel) => {
  for (const ent of alle(spiel.zustand)) {
    if (!ent.pegel || !ent.werte || !ent.werte.pp || ent.position === undefined) continue;
    if (ent.werte.pp.aktuell > 0) {
      for (const [wert, rate] of Object.entries(ent.pegel.regeneration || {})) {
        if (ent.werte[wert]) wertAendernHundertstel(spiel, ent, wert, rate);
      }
    }
    if (ent.pegel.abklingen) wertAendernHundertstel(spiel, ent, "pp", -ent.pegel.abklingen);
  }
});

// Schwellen beim Steigen und Sinken melden
anmelden("haken", "nach_wertaenderung", (spiel, { ent, name, vorher, nachher }) => {
  if (name !== "pp" || !ent.pegel) return;
  for (const s of ent.pegel.schwellen || []) {
    if (vorher < s && nachher >= s) melden(spiel, "pegel_steigt", { wer: bezug(ent), schwelle: s });
    if (vorher >= s && nachher < s) melden(spiel, "pegel_sinkt", { wer: bezug(ent), schwelle: s });
  }
  if (vorher > 0 && nachher === 0) melden(spiel, "nuechtern", { wer: bezug(ent) });
});
