// Plan des Laufs (siehe docs/Welt.md, Plan des Laufs): beim Start aus dem Startwert festgelegt, was jede Tiefe
// bekommt, bevor die erste Ebene entsteht; Ebenen entstehen erst beim ersten Betreten und lesen dann ihren Eintrag.
// zustand.plan = { tiefen: [{ vorlage, inhalte: [] }] }
//   vorlage: Name der Ebene aus daten/ebenen.js (Schritt "abfolge" überträgt daten.abfolge)
//   inhalte: was Schritte des Plans für diese Tiefe vorsehen (z.B. später Schatzraum, Schlüssel, Quest, Struktur),
//     jeder Eintrag ein Datenobjekt mit art; die Ebenenschritte lesen es aus bau.planEintrag
// Schritte des Plans melden sich im Register planschritte an und laufen in Anmeldereihenfolge mit einem gemeinsamen
// Zufall "plan"; der Plan gehört zum Zustand, damit ihn spätere Ereignisse im Lauf ändern können (z.B. eine Quest).

import { anmelden, alle } from "../kern/register.js";
import { startwertAbleiten, zufallErzeugen } from "../kern/zufall.js";

export function laufPlanen(spiel) {
  const plan = { tiefen: [] };
  const zufall = zufallErzeugen(startwertAbleiten(spiel.zustand.startwert, "plan"));
  for (const [, schritt] of alle("planschritte")) schritt(spiel, plan, zufall);
  spiel.zustand.plan = plan;
}

// Name der Ebene einer Tiefe, null, wenn es die Tiefe nicht gibt
export function ebenennameFuer(zustand, tiefe) {
  return zustand.plan.tiefen[tiefe]?.vorlage ?? null;
}

export function planEintragFuer(zustand, tiefe) {
  return zustand.plan.tiefen[tiefe] ?? null;
}

anmelden("planschritte", "abfolge", (spiel, plan) => {
  plan.tiefen = spiel.daten.abfolge.map((vorlage) => ({ vorlage, inhalte: [] }));
});
