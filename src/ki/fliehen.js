// Verhaltensmodul "fliehen" (Furcht): weg von der Bedrohung (schrittWeg in ki/schritte.js); ist kein Feld weiter weg, wartet es.
// Bedrohung: ki.bedrohungId (bei einem Zustand dessen Urheberin), sonst das nächste wahrgenommene feindliche Wesen.
// Zustand in der Komponente: ki: { modul: "fliehen", bedrohungId? }

import { anmelden } from "../kern/register.js";
import { abwarten } from "./abwarten.js";
import { naechstesWahrgenommenesZiel } from "./ziele.js";
import { schrittWeg } from "./schritte.js";

function bedrohungFuer(spiel, fluechtende, ki) {
  const benannt = ki.bedrohungId != null && ki.bedrohungId !== fluechtende.id ? spiel.zustand.entitaeten[ki.bedrohungId] : null;
  return benannt?.position ? benannt : naechstesWahrgenommenesZiel(spiel, fluechtende, "feinde");
}

anmelden("ki", "fliehen", (spiel, fluechtende, ki) => {
  const bedrohung = bedrohungFuer(spiel, fluechtende, ki);
  if (!bedrohung) return abwarten();
  const richtung = schrittWeg(spiel, fluechtende, bedrohung.position);
  return richtung ? { art: "bewegen", ...richtung } : abwarten();
});
