// Maus: Umrechnung von Pixeln in Felder und Deutung eines Klicks.
// Ein Klick wird über eine geordnete Regelliste gedeutet, die erste passende Regel greift.
// Weitere Regeln (mit Händlern reden) kommen einfach in die Liste.
// Ergebnis einer Regel: { befehl }, { aktion } (eine Aktion des Katalogs, z.B. brauen) oder { reise: feld }.

import { gesteuerteEntitaet, entitaetenAuf } from "../kern/zustand.js";
import { abstand, aufDerKarte } from "../welt/karte.js";
import { feindlich } from "../systeme/kampf.js";
import { istSichtbar } from "../systeme/sicht.js";
import { gelaendeAuf } from "../welt/karte.js";

export function feldAnPixel(pixelX, pixelY, kamera, zoom) {
  return { x: kamera.x + Math.floor(pixelX / zoom), y: kamera.y + Math.floor(pixelY / zoom) };
}

export const KLICKREGELN = [
  {
    name: "aufheben",
    passt: (spiel, feld, gesteuerte) =>
      feld.x === gesteuerte.position.x && feld.y === gesteuerte.position.y
      && entitaetenAuf(spiel.zustand, feld.x, feld.y).some((entitaet) => entitaet.aufhebbar),
    aktion: () => ({ befehl: { art: "aufheben" } }),
  },
  {
    name: "angreifen",
    passt: (spiel, feld, gesteuerte) =>
      abstand(feld, gesteuerte.position) === 1 && istSichtbar(spiel.zustand, feld.x, feld.y)
      && entitaetenAuf(spiel.zustand, feld.x, feld.y).some((entitaet) => feindlich(spiel, gesteuerte, entitaet)),
    aktion: (spiel, feld, gesteuerte) => ({ befehl: { art: "bewegen", dx: feld.x - gesteuerte.position.x, dy: feld.y - gesteuerte.position.y } }),
  },
  {
    name: "brauen",
    passt: (spiel, feld, gesteuerte) => abstand(feld, gesteuerte.position) <= 1 && Boolean(gelaendeAuf(spiel, feld.x, feld.y)?.kessel),
    aktion: () => ({ aktion: "brauen" }),
  },
  {
    name: "reisen",
    passt: (spiel, feld) => aufDerKarte(spiel.zustand.ebene, feld.x, feld.y),
    aktion: (spiel, feld) => ({ reise: feld }),
  },
];

export function klickDeuten(spiel, feld, regeln = KLICKREGELN) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  for (const regel of regeln) {
    if (regel.passt(spiel, feld, gesteuerte)) return regel.aktion(spiel, feld, gesteuerte);
  }
  return null;
}
