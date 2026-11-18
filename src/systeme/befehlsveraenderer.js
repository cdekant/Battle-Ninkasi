// Befehlsveränderer aus Zuständen (Register "befehlsveraenderer", aufgerufen am Haken "vor_befehl",
// siehe systeme/zustaende.js): (spiel, akteur, befehl, parameter, staerkeProzent) => befehl
// Jeder Veränderer beschreibt seine Parameter in "parameter" für die Datenprüfung (wie die Bausteine).
//   abweichen: { chance, freundeAngreifen? } Torkeln und Verwirrung. Ein Schritt geht mit der Chance
//              (skaliert mit der Stärke des Zustands) auf ein zufälliges anderes freies Nachbarfeld;
//              gibt es keins, bleibt der Befehl. Ein Feind auf dem Feld wird angegriffen, ein Verbündeter
//              nur mit freundeAngreifen, sonst zählt sein Feld nicht als frei. Andere Befehle bleiben unverändert.

import { anmelden, holen } from "../kern/register.js";
import { mitProzentChance, zufallsGanzzahl } from "../kern/zufall.js";
import { prozentVon } from "../kern/werte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { ACHT_RICHTUNGEN, wesenAufFeld } from "../welt/geometrie.js";
import { feindlich } from "./kampf.js";

function veraendererAnmelden(name, parameterBeschreibung, funktion) {
  funktion.parameter = parameterBeschreibung;
  anmelden("befehlsveraenderer", name, funktion);
}

// Sichere Fälle würfeln nicht, so bleibt die Zahlenfolge des Zufalls ungestört
function trittEin(spiel, chance) {
  if (chance <= 0) return false;
  return chance >= 100 || mitProzentChance(spiel.zustand.zufallszustand, chance);
}

veraendererAnmelden("abweichen", { chance: "ganzzahl", freundeAngreifen: "wahrheitswert?" }, (spiel, akteur, befehl, parameter, staerkeProzent) => {
  if (befehl?.art !== "bewegen") return befehl;
  if (!trittEin(spiel, prozentVon(parameter.chance, staerkeProzent))) return befehl;
  const bewegen = holen("befehle", "bewegen");
  const kandidaten = [];
  for (const richtung of ACHT_RICHTUNGEN) {
    if (richtung.dx === befehl.dx && richtung.dy === befehl.dy) continue;
    const feld = { x: akteur.position.x + richtung.dx, y: akteur.position.y + richtung.dy };
    const wesenDort = wesenAufFeld(spiel, feld)[0];
    const ausweichbefehl = { art: "bewegen", dx: richtung.dx, dy: richtung.dy };
    if (wesenDort) {
      if (!feindlich(akteur, wesenDort) && !parameter.freundeAngreifen) continue;
      ausweichbefehl.angreifen = true;
    }
    if (!bewegen.pruefen(spiel, akteur, ausweichbefehl)) kandidaten.push(ausweichbefehl);
  }
  if (!kandidaten.length) return befehl;
  melden(spiel, "abgewichen", { wer: bezugAuf(akteur) });
  return kandidaten[zufallsGanzzahl(spiel.zustand.zufallszustand, 0, kandidaten.length - 1)];
});
