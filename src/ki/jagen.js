// Verhaltensmodul "jagen": sieht der Gegner Ninkasi, läuft er auf sie zu und greift an;
// verliert er sie aus den Augen, geht er zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", letzteBekanntePosition: { x, y } | null }
// Sicht vereinfacht: Der Gegner sieht Ninkasi, wenn sie ihn sieht und er nah genug ist.

import { anmelden } from "../kern/register.js";
import { spielerin, entitaetenAuf } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { naechstesWegfeld } from "../welt/wege.js";
import { istSichtbar, reichweiteSicht } from "../systeme/sicht.js";
import { istWesen } from "../systeme/kampf.js";
import { abwarten } from "./abwarten.js";

anmelden("ki", "jagen", (spiel, gegner) => {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  if (!ninkasi || zustand.vorbei) return abwarten();

  const position = gegner.position;
  const siehtNinkasi = istSichtbar(zustand, position.x, position.y) && abstand(position, ninkasi.position) <= reichweiteSicht(gegner);
  if (siehtNinkasi) {
    gegner.ki.letzteBekanntePosition = { x: ninkasi.position.x, y: ninkasi.position.y };
  }
  const ziel = gegner.ki.letzteBekanntePosition;
  if (!ziel) return abwarten();
  if (ziel.x === position.x && ziel.y === position.y) {
    gegner.ki.letzteBekanntePosition = null;
    return abwarten();
  }

  const naechstesFeld = naechstesWegfeld(spiel, position, ziel);
  if (!naechstesFeld) return abwarten();
  const wesenImWeg = entitaetenAuf(zustand, naechstesFeld.x, naechstesFeld.y).find(istWesen);
  if (wesenImWeg && wesenImWeg.id !== ninkasi.id) return abwarten();
  return { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y };
});
