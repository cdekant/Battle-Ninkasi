// Verhaltensmodul "fliehen" (Furcht): weg von der Bedrohung, auf das freie Nachbarfeld mit dem größten Abstand
// (dx² + dy², bei Gleichstand das erste in fester Richtungsfolge); ist keins weiter weg, wartet es.
// Bedrohung: ki.bedrohungId (bei einem Zustand dessen Urheberin), sonst das nächste sichtbare feindliche Wesen.
// Zustand in der Komponente: ki: { modul: "fliehen", bedrohungId? }

import { anmelden } from "../kern/register.js";
import { passierbar } from "../welt/karte.js";
import { ACHT_RICHTUNGEN, abstandQuadrat, wesenAufFeld } from "../welt/geometrie.js";
import { abwarten } from "./abwarten.js";
import { naechstesSichtbaresZiel } from "./ziele.js";

function bedrohungFuer(spiel, fluechtende, ki) {
  const benannt = ki.bedrohungId != null && ki.bedrohungId !== fluechtende.id ? spiel.zustand.entitaeten[ki.bedrohungId] : null;
  return benannt?.position ? benannt : naechstesSichtbaresZiel(spiel, fluechtende, "feinde");
}

anmelden("ki", "fliehen", (spiel, fluechtende, ki) => {
  const bedrohung = bedrohungFuer(spiel, fluechtende, ki);
  if (!bedrohung) return abwarten();
  const position = fluechtende.position;
  let besteRichtung = null, besterAbstand = abstandQuadrat(position, bedrohung.position);
  for (const richtung of ACHT_RICHTUNGEN) {
    const feld = { x: position.x + richtung.dx, y: position.y + richtung.dy };
    if (!passierbar(spiel, feld.x, feld.y) || wesenAufFeld(spiel, feld).length) continue;
    const feldAbstand = abstandQuadrat(feld, bedrohung.position);
    if (feldAbstand > besterAbstand) {
      besteRichtung = richtung;
      besterAbstand = feldAbstand;
    }
  }
  return besteRichtung ? { art: "bewegen", dx: besteRichtung.dx, dy: besteRichtung.dy } : abwarten();
});
