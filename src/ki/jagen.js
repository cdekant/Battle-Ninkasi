// Verhaltensmodul "jagen": jagt das nächste sichtbare Wesen, das nach trifft ein Ziel ist (Vorgabe "feinde",
// mit "wesen" jedes andere Wesen: Rausch), und greift es an, sobald es daneben steht; verliert es alle aus den
// Augen, geht es zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", trifft?, wachzustand?, letzteBekanntePosition: { x, y } | null }
// Wachzustand (systeme/wahrnehmung.js): schlaeft wartet; wach geht nur Lärm nach; jagt verfolgt Ziele innerhalb der
// Spurweite und wird wieder wach, wenn es an der letzten bekannten Position niemanden mehr findet.

import { anmelden } from "../kern/register.js";
import { naechstesWegfeld } from "../welt/wege.js";
import { wesenAufFeld, gleichesFeld } from "../welt/geometrie.js";
import { abwarten } from "./abwarten.js";
import { naechstesSichtbaresZiel, istZielFuer } from "./ziele.js";
import { spurweite } from "../systeme/wahrnehmung.js";
import { abstand } from "../welt/karte.js";

anmelden("ki", "jagen", (spiel, jaeger, ki) => {
  if (spiel.zustand.vorbei) return abwarten();
  const wachzustand = ki.wachzustand ?? "jagt";
  if (wachzustand === "schlaeft") return abwarten();
  const trifft = ki.trifft ?? "feinde";
  const position = jaeger.position;
  const aufDerSpur = (kandidat) => abstand(position, kandidat.position) <= spurweite(spiel, kandidat);
  const beute = wachzustand === "jagt" ? naechstesSichtbaresZiel(spiel, jaeger, trifft, aufDerSpur) : null;
  if (beute) ki.letzteBekanntePosition = { x: beute.position.x, y: beute.position.y };
  const ziel = ki.letzteBekanntePosition;
  if (!ziel) return abwarten();
  if (gleichesFeld(ziel, position)) {
    ki.letzteBekanntePosition = null;
    // Spur verloren: nur die eigene KI wird wieder wach, eine überlagerte (Rausch) bleibt, wie sie ist
    if (wachzustand === "jagt" && ki === jaeger.ki) ki.wachzustand = "wach";
    return abwarten();
  }

  const naechstesFeld = naechstesWegfeld(spiel, position, ziel);
  if (!naechstesFeld) return abwarten();
  const befehl = { art: "bewegen", dx: naechstesFeld.x - position.x, dy: naechstesFeld.y - position.y };
  const wesenImWeg = wesenAufFeld(spiel, naechstesFeld)[0];
  if (!wesenImWeg) return befehl;
  return istZielFuer(spiel, jaeger, wesenImWeg, trifft) ? { ...befehl, angreifen: true } : abwarten();
});
