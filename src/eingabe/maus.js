// Maus: Umrechnung von Pixeln in Felder und Deutung eines Klicks.
// Ein Klick wird über eine geordnete Regelliste gedeutet, die erste passende Regel greift.
// Weitere Regeln (Kessel benutzen, mit Händlern reden) kommen einfach in die Liste.
// Ergebnis einer Regel: { befehl } oder { reise: feld }.

import { spielerin, entitaetenAuf } from "../kern/zustand.js";
import { abstand, aufDerKarte } from "../welt/karte.js";
import { feindlich } from "../systeme/kampf.js";
import { istSichtbar } from "../systeme/sicht.js";

export function feldAnPixel(pixelX, pixelY, kamera, zoom) {
  return { x: kamera.x + Math.floor(pixelX / zoom), y: kamera.y + Math.floor(pixelY / zoom) };
}

export const KLICKREGELN = [
  {
    name: "aufheben",
    passt: (spiel, feld, ninkasi) =>
      feld.x === ninkasi.position.x && feld.y === ninkasi.position.y
      && entitaetenAuf(spiel.zustand, feld.x, feld.y).some((entitaet) => entitaet.aufhebbar),
    aktion: () => ({ befehl: { art: "aufheben" } }),
  },
  {
    name: "angreifen",
    passt: (spiel, feld, ninkasi) =>
      abstand(feld, ninkasi.position) === 1 && istSichtbar(spiel.zustand, feld.x, feld.y)
      && entitaetenAuf(spiel.zustand, feld.x, feld.y).some((entitaet) => feindlich(spiel, ninkasi, entitaet)),
    aktion: (spiel, feld, ninkasi) => ({ befehl: { art: "bewegen", dx: feld.x - ninkasi.position.x, dy: feld.y - ninkasi.position.y } }),
  },
  {
    name: "reisen",
    passt: (spiel, feld) => aufDerKarte(spiel.zustand.ebene, feld.x, feld.y),
    aktion: (spiel, feld) => ({ reise: feld }),
  },
];

export function klickDeuten(spiel, feld, regeln = KLICKREGELN) {
  const ninkasi = spielerin(spiel.zustand);
  for (const regel of regeln) {
    if (regel.passt(spiel, feld, ninkasi)) return regel.aktion(spiel, feld, ninkasi);
  }
  return null;
}
