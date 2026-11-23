// Sinne (siehe docs/Wesen.md, Wahrnehmung): wie ein Betrachter ein Ziel wahrnimmt, als Art statt ja oder nein.
// Register "sinne": { art, reichweite(spiel, betrachter), nimmtWahr(spiel, betrachter, ziel) }; die Anmeldereihenfolge
// ist der Vorrang, die erste Art, die wahrnimmt, gilt. Hier angemeldet: sehen (Art "gesehen", systeme/sicht.js) und
// spueren (Art "gespuert"); Telepathie, Schätze orten und Magie orten hängen sich später als weitere Sinne ein.
// Spüren: Komponente spueren: { reichweite } (Modifikatorziel reichweiteSpueren, ohne Komponente 0); ohne Licht,
//   entlang der Wege durch alles, was offen ist (offenFuerSpueren): bis zur Reichweite über Nachbarfelder, Wände und
//   geschlossene Türen halten es auf.

import { anmelden, alle } from "../kern/register.js";
import { modifiziert } from "../kern/werte.js";
import { spuerenVon, istGesteuert, istWesen, entitaetenMitPosition, entitaetenImUmkreis } from "../kern/zustand.js";
import { abstand, aufDerKarte, feldIndex, fest } from "../welt/karte.js";
import { gasdurchlaessig } from "../welt/schichten.js";
import { ACHT_RICHTUNGEN, gleichesFeld } from "../welt/geometrie.js";
import { sieht, reichweiteSicht } from "./sicht.js";

export const WAHRNEHMUNGSARTEN = ["gesehen", "gespuert"];

export function reichweiteSpueren(spiel, entitaet) {
  return modifiziert(spiel, entitaet, "reichweiteSpueren", spuerenVon(entitaet)?.reichweite ?? 0);
}

// Offen für das Spüren ist ein Feld, das Gas durchlässt oder für irgendeine Bewegungsart passierbar ist (Wasser,
// Abgrund); fest und gasdicht sind Wände und geschlossene Türen
export function offenFuerSpueren(spiel, x, y) {
  return gasdurchlaessig(spiel, x, y) || !fest(spiel, x, y);
}

// Ob das Spüren vom Feld von das Feld nach in höchstens weite Schritten über offene Felder erreicht (Suche in die Breite,
// jeder Schritt kostet 1, auch schräg); das Zielfeld selbst muss nicht offen sein
function spuerweg(spiel, von, nach, weite) {
  if (gleichesFeld(von, nach)) return true;
  if (abstand(von, nach) > weite) return false;
  const ebene = spiel.zustand.ebene;
  const erreicht = new Set([feldIndex(ebene, von.x, von.y)]);
  let rand = [von];
  for (let schritt = 1; schritt <= weite && rand.length; schritt++) {
    const naechster = [];
    for (const feld of rand) {
      for (const { dx, dy } of ACHT_RICHTUNGEN) {
        const x = feld.x + dx, y = feld.y + dy;
        if (x === nach.x && y === nach.y) return true;
        if (!aufDerKarte(ebene, x, y) || abstand({ x, y }, von) > weite) continue;
        const index = feldIndex(ebene, x, y);
        if (erreicht.has(index) || !offenFuerSpueren(spiel, x, y)) continue;
        erreicht.add(index);
        naechster.push({ x, y });
      }
    }
    rand = naechster;
  }
  return false;
}

// Spürt der Betrachter das Ziel? Innerhalb seiner Reichweite, ohne Licht, entlang offener Felder
export function spuert(spiel, betrachter, ziel) {
  if (!betrachter.position || !ziel.position || betrachter.id === ziel.id) return false;
  const weite = reichweiteSpueren(spiel, betrachter);
  return weite > 0 && spuerweg(spiel, betrachter.position, ziel.position, weite);
}

anmelden("sinne", "sehen", {
  art: "gesehen",
  // Ninkasi sieht, was in ihrem Sichtfeld liegt; ihre Kandidaten sind ohnehin alle mit Position
  reichweite: (spiel, betrachter) => reichweiteSicht(spiel, betrachter),
  nimmtWahr: sieht,
});

anmelden("sinne", "spueren", {
  art: "gespuert",
  reichweite: reichweiteSpueren,
  nimmtWahr: spuert,
});

// Wie nimmt der Betrachter das Ziel wahr? Die Art des ersten Sinns, der es wahrnimmt ("gesehen", "gespuert"), sonst null
export function wahrnehmungsart(spiel, betrachter, ziel) {
  for (const [, sinn] of alle("sinne")) if (sinn.nimmtWahr(spiel, betrachter, ziel)) return sinn.art;
  return null;
}

// Nimmt der Betrachter das Ziel auf irgendeine Art wahr?
export function nimmtWahr(spiel, betrachter, ziel) {
  return wahrnehmungsart(spiel, betrachter, ziel) !== null;
}

// Wen ein Betrachter überhaupt wahrnehmen könnte: für die gesteuerte Entität alle mit Position, für alle anderen die
// innerhalb der größten Reichweite ihrer Sinne (räumlicher Index); wahrgenommen ist damit noch nichts
export function kandidatenWahrnehmbar(spiel, betrachter) {
  if (istGesteuert(spiel.zustand, betrachter)) return entitaetenMitPosition(spiel.zustand);
  let weite = 0;
  for (const [, sinn] of alle("sinne")) weite = Math.max(weite, sinn.reichweite(spiel, betrachter));
  return entitaetenImUmkreis(spiel.zustand, betrachter.position, weite);
}

// Die Wesen, die der Betrachter gerade auf genau diese Art wahrnimmt (z.B. "gespuert" für die Anzeige)
export function wesenMitWahrnehmungsart(spiel, betrachter, art) {
  return kandidatenWahrnehmbar(spiel, betrachter)
    .filter((kandidat) => istWesen(kandidat) && kandidat.id !== betrachter.id && wahrnehmungsart(spiel, betrachter, kandidat) === art);
}
