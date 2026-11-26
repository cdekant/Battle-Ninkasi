// Wissens-EP (siehe docs/Wesen.md, Skills und Lernen; Spieldesign in docs/Charakter.md, Freie EP): das erste Mal im Lauf
// bringt freie EP (Vorbild Sil), jede Sache einmal; vergeben über freieEpGeben (systeme/lernen.js, Quelle "wissen").
//   Wesenart: Ninkasi sieht zum ersten Mal ein Wesen dieser Art (Wahrnehmungsart "gesehen", nicht gespürt oder gehört),
//     regeln.lernen.wissenWesenart Prozent der EP der Art; nur Arten mit ep; gemerkt in zustand.wissen.gesehen
//   Gegenstand: Ninkasi erkennt einen unbekannten Typ (Meldung "erkannt", systeme/kennen.js), regeln.lernen.wissenGegenstand
//   Zutat: Ninkasi hebt zum ersten Mal im Lauf eine Zutat dieser Art auf, regeln.lernen.wissenZutat; gemerkt in
//     zustand.wissen.zutaten (Aufruf aus systeme/brauen.js, Haken aufgehoben)
//   Kultur: Ninkasi gewinnt eine Kultur, die sie noch nicht hatte, regeln.lernen.wissenKultur; jede Form zählt für
//     sich (systeme/kulturen.js), die Kulturen vom Start zählen nicht (gemerkt in zustand.wissen.kulturen)
// Später melden sich hier besondere Orte an.

import { anmelden } from "../kern/register.js";
import { spielerin, entitaetenMitPosition, istWesen } from "../kern/zustand.js";
import { freieEpGeben } from "./lernen.js";
import { wahrnehmungsart } from "./sinne.js";

export const wissenVon = (zustand) => (zustand.wissen ??= { etiketten: {}, erkannt: [], vertrautheit: {} });

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

// Einmal je Lauf und Sache: liste in zustand.wissen, nur für Ninkasi mit Lernstand
function einmalBuchen(spiel, wesen, liste, name, ep, bezug) {
  if (wesen.id !== spiel.zustand.spielerinId || wesen.freieEp === undefined) return;
  const wissen = wissenVon(spiel.zustand);
  wissen[liste] ??= [];
  if (wissen[liste].includes(name)) return;
  wissen[liste].push(name);
  freieEpGeben(spiel, "wissen", ep, bezug);
}

export function zutatGebucht(spiel, wesen, typ) {
  einmalBuchen(spiel, wesen, "zutaten", typ, spiel.daten.regeln.lernen.wissenZutat, { typ, text: spiel.daten.gegenstaende[typ]?.text });
}

// kultur ist der Schlüssel der Form, bezug ihr Bezug für die Meldung (systeme/kulturen.js kulturBezug)
export function kulturGebucht(spiel, wesen, kultur, bezug) {
  einmalBuchen(spiel, wesen, "kulturen", kultur, spiel.daten.regeln.lernen.wissenKultur, { ...bezug, typ: kultur });
}

// Ein erkannter Gegenstandstyp; die Meldung "erkannt" kommt nur einmal je Typ (systeme/kennen.js erkennen)
export function erkanntGebucht(spiel, typ) {
  freieEpGeben(spiel, "wissen", spiel.daten.regeln.lernen.wissenGegenstand, { typ, text: spiel.daten.gegenstaende[typ]?.text });
}
