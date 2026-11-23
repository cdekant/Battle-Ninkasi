// Vorrangbefehle an der KI (siehe docs/Wesen.md, KI): eine Anweisung, die vor der eigenen Wahl gilt, für Begleiter.
// Feld an der KI: vorrang: { anweisung: "angreifen" | "warten" | "folgen", zielId?, bis? }
//   angreifen: das Ziel (zielId) wird zur Beute, auch wenn es nach trifft keins wäre; ist es fort oder tot, endet der Vorrang
//   warten:    bleibt stehen und wehrt sich nur gegen ein Ziel daneben
//   folgen:    geht zu zielId (Vorgabe Ninkasi), bis es daneben steht, dort wie warten
//   bis:       Zeitpunkt, ab dem die Anweisung nicht mehr gilt (ohne Angabe bis zum Widerruf, also bis vorrang fehlt)
// Gesetzt wird das Feld später über einen Befehl Ninkasis an ihre Begleiter; die KI liest es nur.

import { abstand } from "../welt/karte.js";
import { naechstesWegfeld } from "../welt/wege.js";
import { lebenswertName } from "../kern/werte.js";
import { abwarten } from "./abwarten.js";
import { naechstesWahrgenommenesZiel } from "./ziele.js";
import { angriffDaneben, wegOptionenFuer } from "./verfolgen.js";

export const ANWEISUNGEN = ["angreifen", "warten", "folgen"];

const lebt = (entitaet) => (entitaet.werte?.[lebenswertName(entitaet)]?.aktuell ?? 1) > 0;

// Die geltende Anweisung oder null; eine abgelaufene oder gegenstandslose wird dabei gelöscht
export function geltenderVorrang(spiel, ki) {
  const vorrang = ki.vorrang;
  if (!vorrang) return null;
  const ziel = vorrang.zielId != null ? spiel.zustand.entitaeten[vorrang.zielId] : null;
  const abgelaufen = vorrang.bis !== undefined && spiel.zustand.zeit >= vorrang.bis;
  const zielFort = vorrang.anweisung === "angreifen" && (!ziel?.position || !lebt(ziel));
  if (abgelaufen || zielFort) {
    delete ki.vorrang;
    return null;
  }
  return vorrang;
}

// Befehl für warten und folgen (angreifen setzt nur die Beute, das übernimmt ki/jagen.js), sonst null
export function vorrangBefehl(spiel, wesen, ki, vorrang, trifft) {
  const daneben = () => angriffDaneben(spiel, wesen, naechstesWahrgenommenesZiel(spiel, wesen, trifft), trifft);
  if (vorrang.anweisung === "warten") return daneben();
  if (vorrang.anweisung === "folgen") {
    const ziel = spiel.zustand.entitaeten[vorrang.zielId ?? spiel.zustand.spielerinId];
    if (!ziel?.position || abstand(wesen.position, ziel.position) <= 1) return daneben();
    const feld = naechstesWegfeld(spiel, wesen.position, ziel.position, { ...wegOptionenFuer(spiel, wesen), wesenMeiden: true });
    return feld ? { art: "bewegen", dx: feld.x - wesen.position.x, dy: feld.y - wesen.position.y } : abwarten();
  }
  return null;
}
