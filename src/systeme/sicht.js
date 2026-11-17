// Sichtfeld von Ninkasi: PreciseShadowcasting aus rot.js.
// Ergebnis im Zustand: zustand.sichtbar (Feldindizes) und zustand.ebene.erkundet.

import PreciseShadowcasting from "../../lib/rot/fov/precise-shadowcasting.js";
import { durchsichtig, index, imLevel } from "../welt/karte.js";
import { modifiziert } from "../kern/werte.js";
import { spieler } from "../kern/zustand.js";

export function sichtweite(ent) {
  return modifiziert(ent, "sichtweite", ent.sicht ? ent.sicht.weite : 0);
}

export function aktualisieren(spiel) {
  const z = spiel.zustand;
  const e = z.ebene;
  const p = spieler(z);
  const felder = new Set();
  const fov = new PreciseShadowcasting((x, y) => imLevel(e, x, y) && durchsichtig(spiel, x, y), { topology: 8 });
  fov.compute(p.position.x, p.position.y, sichtweite(p), (x, y) => {
    if (imLevel(e, x, y)) felder.add(index(e, x, y));
  });
  z.sichtbar = [...felder].sort((a, b) => a - b);
  for (const i of z.sichtbar) e.erkundet[i] = 1;
}

export function istSichtbar(zustand, x, y) {
  return zustand.sichtbar.includes(index(zustand.ebene, x, y));
}
