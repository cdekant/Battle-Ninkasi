// Taktik für die gesteuerte Entität (siehe docs/Wesen.md, KI): der Befehl, mit dem Ninkasi nach einer Taktik aus
// daten/taktiken.js kämpft, für den automatischen Kampf in der Arena (eingabe/arenakampf.js), das Werkzeug
// werkzeuge/arena.js und den Bot. Ändert nichts am Zustand; der Befehl geht wie jeder andere über befehlGeben.
//   Beute: der nächste sichtbare Feind; die Handlungen der Taktik wählen wie bei der KI (ki/handlungen.js), kommt
//   keine in Frage oder heißt die Wahl "verfolgen", setzt sie ihr nach und greift an (ki/verfolgen.js)
//   Sieht sie keinen Feind, geht sie zum nächsten, den es noch gibt (in der Arena ist das kein Geheimnis); sonst wartet sie.

import { gesteuerteEntitaet, alleEntitaeten, istWesen } from "../kern/zustand.js";
import { abstand } from "../welt/karte.js";
import { naechstesSichtbaresZiel, istZielFuer } from "./ziele.js";
import { handlungWaehlen, VERFOLGEN } from "./handlungen.js";
import { verfolgungsbefehl } from "./verfolgen.js";
import { abwarten } from "./abwarten.js";

function naechsterFeind(spiel, wesen) {
  let naechster = null;
  for (const kandidat of alleEntitaeten(spiel.zustand)) {
    if (!istWesen(kandidat) || !kandidat.position || kandidat.id === wesen.id || !istZielFuer(spiel, wesen, kandidat, "feinde")) continue;
    if (!naechster || abstand(wesen.position, kandidat.position) < abstand(wesen.position, naechster.position)) naechster = kandidat;
  }
  return naechster;
}

// taktik: Eintrag aus daten/taktiken.js ({ handlungen, wahl? })
export function taktikbefehl(spiel, taktik) {
  const wesen = gesteuerteEntitaet(spiel.zustand);
  if (!wesen?.position || spiel.zustand.vorbei) return abwarten();
  const beute = naechstesSichtbaresZiel(spiel, wesen, "feinde");
  const ziel = beute ?? naechsterFeind(spiel, wesen);
  if (!ziel) return abwarten();
  if (beute) {
    const befehl = handlungWaehlen(spiel, wesen, taktik, beute);
    if (befehl && befehl !== VERFOLGEN) return befehl;
  }
  // verfolgungsbefehl merkt sich die Position in der übergebenen KI; hier ein Wegwerfobjekt, der Zustand bleibt unberührt
  return verfolgungsbefehl(spiel, wesen, { letzteBekanntePosition: { x: ziel.position.x, y: ziel.position.y } }, beute, "feinde");
}
