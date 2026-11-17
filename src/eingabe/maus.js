// Maus: Umrechnung von Pixeln in Felder und Deutung eines Klicks.
// Ein Klick wird über eine geordnete Regelliste gedeutet, die erste passende Regel greift.
// Weitere Regeln (Kessel benutzen, mit Händlern reden) kommen einfach in die Liste.
// Ergebnis einer Regel: { befehl } oder { reise: feld }.

import { spieler, an } from "../kern/zustand.js";
import { abstand, imLevel } from "../welt/karte.js";
import { feindlich } from "../systeme/kampf.js";
import { istSichtbar } from "../systeme/sicht.js";

export function feldAnPixel(px, py, kamera, zoom) {
  return { x: kamera.x + Math.floor(px / zoom), y: kamera.y + Math.floor(py / zoom) };
}

export const KLICKREGELN = [
  {
    name: "aufheben",
    passt: (spiel, feld, p) => feld.x === p.position.x && feld.y === p.position.y && an(spiel.zustand, feld.x, feld.y).some((g) => g.aufhebbar),
    aktion: () => ({ befehl: { art: "aufheben" } }),
  },
  {
    name: "angreifen",
    passt: (spiel, feld, p) =>
      abstand(feld, p.position) === 1 && istSichtbar(spiel.zustand, feld.x, feld.y) && an(spiel.zustand, feld.x, feld.y).some((e) => feindlich(p, e)),
    aktion: (spiel, feld, p) => ({ befehl: { art: "bewegen", dx: feld.x - p.position.x, dy: feld.y - p.position.y } }),
  },
  {
    name: "reisen",
    passt: (spiel, feld) => imLevel(spiel.zustand.ebene, feld.x, feld.y),
    aktion: (spiel, feld) => ({ reise: feld }),
  },
];

export function klickDeuten(spiel, feld, regeln = KLICKREGELN) {
  const p = spieler(spiel.zustand);
  for (const r of regeln) {
    if (r.passt(spiel, feld, p)) return r.aktion(spiel, feld, p);
  }
  return null;
}
