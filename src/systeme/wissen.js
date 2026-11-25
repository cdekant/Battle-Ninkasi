// Wissens-EP (siehe docs/Wesen.md, Skills und Lernen; Spieldesign in docs/Charakter.md, Freie EP): das erste Mal im Lauf
// bringt freie EP (Vorbild Sil), jede Sache einmal; vergeben über freieEpGeben (systeme/lernen.js, Quelle "wissen").
//   Wesenart: Ninkasi sieht zum ersten Mal ein Wesen dieser Art (Wahrnehmungsart "gesehen", nicht gespürt oder gehört),
//     regeln.lernen.wissenWesenart Prozent der EP der Art; nur Arten mit ep; gemerkt in zustand.wissen.gesehen
//   Gegenstand: Ninkasi erkennt einen unbekannten Typ (Meldung "erkannt", systeme/kennen.js), regeln.lernen.wissenGegenstand
// Später melden sich hier Zutaten, Kulturen und besondere Orte an.

import { anmelden } from "../kern/register.js";
import { spielerin, entitaetenMitPosition, istWesen } from "../kern/zustand.js";
import { freieEpGeben } from "./lernen.js";
import { wahrnehmungsart } from "./sinne.js";

const wissenVon = (zustand) => (zustand.wissen ??= { etiketten: {}, erkannt: [], vertrautheit: {} });

// Wesenarten, die Ninkasi jetzt zum ersten Mal sieht (nach jeder Aktualisierung des Sichtfelds)
anmelden("nachSicht", "wissen_wesenart", (spiel) => {
  const zustand = spiel.zustand;
  const ninkasi = spielerin(zustand);
  if (!ninkasi?.position || ninkasi.freieEp === undefined) return;
  const wissen = wissenVon(zustand);
  wissen.gesehen ??= [];
  for (const wesen of entitaetenMitPosition(zustand)) {
    if (!istWesen(wesen) || wesen.id === ninkasi.id || !wesen.typ || !(wesen.ep > 0) || wissen.gesehen.includes(wesen.typ)) continue;
    if (wahrnehmungsart(spiel, ninkasi, wesen) !== "gesehen") continue;
    wissen.gesehen.push(wesen.typ);
    const ep = Math.floor((wesen.ep * spiel.daten.regeln.lernen.wissenWesenart) / 100);
    freieEpGeben(spiel, "wissen", ep, { typ: wesen.typ, text: wesen.text });
  }
});

// Ein erkannter Gegenstandstyp; die Meldung "erkannt" kommt nur einmal je Typ (systeme/kennen.js erkennen)
export function erkanntGebucht(spiel, typ) {
  freieEpGeben(spiel, "wissen", spiel.daten.regeln.lernen.wissenGegenstand, { typ, text: spiel.daten.gegenstaende[typ]?.text });
}
