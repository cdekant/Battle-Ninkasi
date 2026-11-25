// Unbekannte Gegenstände (siehe docs/Gegenstaende.md, Unbekanntes); Vorbild Brogue: je Lauf zufällige Etiketten.
// Daten am Typ: unbekannt: { gruppe, schwierigkeit }; die Etiketten je Gruppe in datenproben/etiketten.js (Textschlüssel).
// Beim Spielstart ordnet etikettenZuordnen jedem unbekannten Typ ein Etikett seiner Gruppe zu, über einen eigenen
// abgeleiteten Zufall ("etiketten"), wiederholbar je Startwert. Das Wissen des Laufs steht im Zustand:
//   zustand.wissen = { etiketten: { typ: etikett }, erkannt: [typ], vertrautheit: { typ: Zahl } }
// Ein Gegenstand eines noch nicht erkannten Typs trägt etikett (beim Erzeugen gesetzt); Bezüge in Meldungen und die
// Anzeige nennen dann das Etikett. Erkannt wird immer die ganze Art und nur durch Ninkasi, es gilt für den Lauf:
//   Trinken erkennt sofort (systeme/inventar.js)
//   Benutzen erhöht die Vertrautheit: je Welttick, in dem Rüstung oder Schmuck angelegt ist, und je Angriff einer Waffe;
//     mit jeder Erhöhung ein Wurf (vertrautheit + kennerschaft) / (vertrautheit + kennerschaft + schwierigkeit)
//   Aufheben: ein Wurf kennerschaft / (kennerschaft + schwierigkeit), ohne Kennerschaft keiner
// kennerschaft ist ein Kampfwert (Vorgabe 0); später speisen ihn Sinnlichkeit und Braukunde (Skills).
// Meldung erkannt mit dem Etikett (vorher) und dem echten Namen (was).

import { anmelden } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { modifiziert } from "../kern/werte.js";
import { zufallErzeugen, zufallsGanzzahl, startwertAbleiten } from "../kern/zufall.js";
import { wurfAnteil } from "../kern/wurf.js";
import { spielerin } from "../kern/zustand.js";
import { erkanntGebucht } from "./wissen.js";

// Ordnet den unbekannten Typen ihre Etiketten zu (vor dem Erzeugen der ersten Ebene, kern/spiel.js)
export function etikettenZuordnen(spiel) {
  const { daten, zustand } = spiel;
  const zufall = zufallErzeugen(startwertAbleiten(zustand.startwert, "etiketten"));
  const wissen = { etiketten: {}, erkannt: [], vertrautheit: {} };
  for (const [gruppe, etiketten] of Object.entries(daten.etiketten || {})) {
    const vorrat = [...etiketten];
    for (const [typ, gegenstand] of Object.entries(daten.gegenstaende)) {
      if (gegenstand.abstrakt || gegenstand.unbekannt?.gruppe !== gruppe) continue;
      wissen.etiketten[typ] = vorrat.splice(zufallsGanzzahl(zufall, 0, vorrat.length - 1), 1)[0];
    }
  }
  zustand.wissen = wissen;
}

export function istUnbekannt(zustand, typ) {
  const wissen = zustand.wissen;
  return Boolean(wissen && typ in wissen.etiketten && !wissen.erkannt.includes(typ));
}

anmelden("beimErzeugen", "etikett", (zustand, entitaet) => {
  if (entitaet.unbekannt && entitaet.etikett === undefined && istUnbekannt(zustand, entitaet.typ)) entitaet.etikett = zustand.wissen.etiketten[entitaet.typ];
});

// Ninkasi erkennt die ganze Art: alle Gegenstände dieses Typs verlieren ihr Etikett, auch auf verlassenen Ebenen
export function erkennen(spiel, wesen, typ) {
  const zustand = spiel.zustand;
  if (wesen.id !== zustand.spielerinId || !istUnbekannt(zustand, typ)) return false;
  zustand.wissen.erkannt.push(typ);
  const ablagen = [zustand.entitaeten, ...Object.values(zustand.abgelegteEbenen).map((abgelegt) => abgelegt.entitaeten)];
  for (const entitaeten of ablagen) {
    for (const entitaet of Object.values(entitaeten)) if (entitaet.typ === typ) delete entitaet.etikett;
  }
  melden(spiel, "erkannt", { wer: bezugAuf(wesen), vorher: { typ, text: zustand.wissen.etiketten[typ] }, was: { typ, text: spiel.daten.gegenstaende[typ].text } });
  erkanntGebucht(spiel, typ); // Wissens-EP (systeme/wissen.js)
  return true;
}

function kennerschaftVon(spiel, wesen) {
  return Math.max(0, modifiziert(spiel, wesen, "kennerschaft", wesen.kampfwerte?.kennerschaft ?? 0));
}

const schwierigkeitVon = (spiel, typ) => spiel.daten.gegenstaende[typ].unbekannt.schwierigkeit;

export function beimAufhebenErkennen(spiel, wesen, typ) {
  if (wesen.id !== spiel.zustand.spielerinId || !istUnbekannt(spiel.zustand, typ)) return;
  const kennerschaft = kennerschaftVon(spiel, wesen);
  if (kennerschaft === 0) return;
  if (wurfAnteil(spiel, "erkennen", kennerschaft, kennerschaft + schwierigkeitVon(spiel, typ))) erkennen(spiel, wesen, typ);
}

// Chance als Bruch: mit jeder Benutzung steigt sie und nähert sich 100 % (dieselbe Form wie die Kampfwerte)
export function erkennenChance(vertrautheit, kennerschaft, schwierigkeit) {
  return { zaehler: vertrautheit + kennerschaft, nenner: vertrautheit + kennerschaft + schwierigkeit };
}

function vertrauterWerden(spiel, wesen, typ) {
  const wissen = spiel.zustand.wissen;
  wissen.vertrautheit[typ] = (wissen.vertrautheit[typ] ?? 0) + 1;
  const { zaehler, nenner } = erkennenChance(wissen.vertrautheit[typ], kennerschaftVon(spiel, wesen), schwierigkeitVon(spiel, typ));
  if (wurfAnteil(spiel, "erkennen", zaehler, nenner)) erkennen(spiel, wesen, typ);
}

// Unbekannte angelegte Gegenstände Ninkasis, je Typ einmal, ausgewählt nach istPassend
function unbekanntAngelegt(spiel, ninkasi, istPassend) {
  const typen = [];
  for (const id of ninkasi.ausgeruestet || []) {
    const gegenstand = spiel.zustand.entitaeten[id];
    if (gegenstand && istPassend(gegenstand) && istUnbekannt(spiel.zustand, gegenstand.typ) && !typen.includes(gegenstand.typ)) typen.push(gegenstand.typ);
  }
  return typen;
}

// Rüstung und Schmuck: je Welttick angelegt
anmelden("welttick", "vertrautheit", (spiel) => {
  const ninkasi = spielerin(spiel.zustand);
  if (!ninkasi?.ausgeruestet?.length || spiel.zustand.vorbei || !spiel.zustand.wissen) return;
  for (const typ of unbekanntAngelegt(spiel, ninkasi, (gegenstand) => !gegenstand.ausruestung.angriffe)) vertrauterWerden(spiel, ninkasi, typ);
});

// Waffen: je Angriff mit einem ihrer Profile
anmelden("haken", "vor_angriff", (spiel, kontext) => {
  const ninkasi = spielerin(spiel.zustand);
  if (!ninkasi || kontext.quelleId !== ninkasi.id || !ninkasi.ausgeruestet?.length || !spiel.zustand.wissen) return;
  const mitDiesemProfil = (gegenstand) => (gegenstand.ausruestung.angriffe || []).some((profil) => profil.name === kontext.angriff);
  for (const typ of unbekanntAngelegt(spiel, ninkasi, mitDiesemProfil)) vertrauterWerden(spiel, ninkasi, typ);
});
