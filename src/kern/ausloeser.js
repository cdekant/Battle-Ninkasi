// Auslöser aus Daten (siehe docs/Architektur.md, Auslöser).
// Daten an einer Entität: ausloeser: [{ bei, rolle?, ziel?, effekt, chance?, daempfung? }]
//   bei:       Haken aus dem Katalog mit ausloeserErlaubt (kern/hakenkatalog.js)
//   rolle:     "quelle" | "ziel", welche Rolle die Trägerin im Ereignis haben muss; ohne Angabe jede
//   ziel:      "selbst" (Vorgabe) | "quelle" | "ziel" des Ereignisses | "feld": Position im Ereignis
//              (nach_tod: die letzte Position des Opfers), sonst die der Trägerin; der Effekt läuft dann
//              ohne Wesen als Ziel, mit Ursprung und Zielfeld auf diesem Feld (z.B. fuer_jedes_ziel im Kreis)
//   chance:    Prozent, Vorgabe 100; sinkt je Kettenstufe um daempfung (Vorgabe aus daten/regeln.js)
// Ein Haken stellt passende Auslöser nur in eine Warteschlange (nicht im Zustand, sie ist nach jedem
// Vorgang leer); abgearbeitet werden sie nacheinander in der Reihenfolge des Vormerkens, siehe
// kern/vorgang.js. Ihre Effekte laufen eine Kettenstufe tiefer; ab der höchsten Kettentiefe wird nichts
// mehr vorgemerkt. Gefragt werden bisher nur die beteiligten Entitäten selbst (Quelle, dann Ziel).

import { anmelden } from "./register.js";
import { HAKENKATALOG, AUSLOESER_ROLLEN } from "./hakenkatalog.js";
import { effektAnwenden } from "./effekte.js";
import { mitProzentChance } from "./zufall.js";
import { prozentWiederholt } from "./werte.js";

// Der Verteiler läuft nach allen Code-Handlern eines Hakens
export const RANG_AUSLOESER = 1000;

export function anstehendeAusloeser(spiel) {
  if (!spiel.anstehendeAusloeser) spiel.anstehendeAusloeser = [];
  return spiel.anstehendeAusloeser;
}

// Chance auf einer Kettenstufe: je Stufe um daempfung Prozent, einheitlich gerundet
export function wirksameChance(grundchance, kettentiefe, daempfung) {
  return prozentWiederholt(grundchance, daempfung, kettentiefe);
}

const feldKopie = (feld) => (feld ? { x: feld.x, y: feld.y } : null);

function ausloeserVormerken(spiel, hakenName, kontext) {
  const kettentiefe = kontext.kettentiefe ?? 0;
  if (kettentiefe >= spiel.daten.regeln.ausloeser.hoechsteKettentiefe) return;
  const warteschlange = anstehendeAusloeser(spiel);
  const schonVorgemerkt = new Set();
  for (const rolle of AUSLOESER_ROLLEN) {
    const traegerinId = kontext[`${rolle}Id`];
    const traegerin = traegerinId == null ? null : spiel.zustand.entitaeten[traegerinId];
    if (!traegerin || !traegerin.ausloeser) continue;
    traegerin.ausloeser.forEach((ausloeser, nummer) => {
      if (ausloeser.bei !== hakenName) return;
      if (ausloeser.rolle && ausloeser.rolle !== rolle) return;
      const schluessel = `${traegerinId}:${nummer}`;
      if (schonVorgemerkt.has(schluessel)) return;
      schonVorgemerkt.add(schluessel);
      warteschlange.push({
        ausloeser, traegerinId, traegerinFraktion: traegerin.fraktion ?? null,
        quelleId: kontext.quelleId ?? null, zielId: kontext.zielId ?? null,
        feld: feldKopie(kontext.position) ?? feldKopie(traegerin.position), kettentiefe,
      });
    });
  }
}

for (const [hakenName, eintrag] of Object.entries(HAKENKATALOG)) {
  if (eintrag.ausloeserErlaubt) anmelden("haken", hakenName, (spiel, kontext) => ausloeserVormerken(spiel, hakenName, kontext), { rang: RANG_AUSLOESER });
}

// Führt den ältesten vorgemerkten Auslöser aus; false, wenn keiner ansteht
export function naechstenAusloeserAusfuehren(spiel) {
  const vorgemerkt = anstehendeAusloeser(spiel).shift();
  if (!vorgemerkt) return false;
  const { ausloeser } = vorgemerkt;
  const zielart = ausloeser.ziel ?? "selbst";
  const zielNachArt = { selbst: vorgemerkt.traegerinId, quelle: vorgemerkt.quelleId, ziel: vorgemerkt.zielId, feld: null };
  const zielId = zielNachArt[zielart];
  const zielFehlt = zielart === "feld" ? !vorgemerkt.feld : zielId == null || !spiel.zustand.entitaeten[zielId];
  if (zielFehlt) return true;
  const daempfung = ausloeser.daempfung ?? spiel.daten.regeln.ausloeser.daempfungProStufe;
  const chance = wirksameChance(ausloeser.chance ?? 100, vorgemerkt.kettentiefe, daempfung);
  // sichere Fälle würfeln nicht, so bleibt die Zahlenfolge des Zufalls ungestört
  if (chance <= 0) return true;
  if (chance < 100 && !mitProzentChance(spiel.zustand.zufallszustand, chance)) return true;
  const kontext = { quelleId: vorgemerkt.traegerinId, urheberFraktion: vorgemerkt.traegerinFraktion, zielId, ursache: "ausloeser", kettentiefe: vorgemerkt.kettentiefe + 1 };
  if (zielart === "feld") Object.assign(kontext, { ursprung: vorgemerkt.feld, zielfeld: vorgemerkt.feld });
  effektAnwenden(spiel, ausloeser.effekt, kontext);
  return true;
}
