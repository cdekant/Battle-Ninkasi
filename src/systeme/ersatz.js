// Ersatzwirkungen aus Daten (siehe docs/Wirkungen.md, Ersatzwirkungen): sie greifen sofort an einem Haken "davor" ein,
// statt wie Auslöser nur vorgemerkt zu werden, und können sich dabei verbrauchen (Phönixbier, Barriere).
// Daten: ersatz: [{ bei, effekt?, ziel?, tag?, wenn?, chance?, verbrauchen?, text? }]
//   bei:         Haken aus dem Katalog mit ersatzErlaubt (kern/hakenkatalog.js), heute vor_tod und vor_schaden
//   effekt:      wirkt sofort, eine Kettenstufe tiefer, Quelle die Trägerin; ziel "selbst" (Vorgabe) oder "quelle"
//                (wer den Schaden bringt, z.B. Gegenschlag der Barriere)
//   tag:         nur, wenn das Ereignis dieses Tag oder diese Schadensart trägt (an vor_tod gibt es keine Tags)
//   wenn:        Bedingungen an der Trägerin wie an Modifikatoren, Gegenüber ist die Quelle des Ereignisses
//   chance:      Prozent, Vorgabe 100, ohne Dämpfung; gewürfelt wird nur zwischen 0 und 100 (Wurf "ersatz")
//   verbrauchen: true verbraucht die Quelle, wenn die Ersatzwirkung gewirkt hat (Vorgabe false)
//   text:        eigener Schlüssel der Meldung, sonst log.ersatz.<haken>.<herkunft>
// Wo sie sitzen, in dieser Reihenfolge (Kaskade wie bei den Auslösern): am Wesen selbst, an seinen Zuständen
// (zustaende.<name>.ersatz), an angelegten Gegenständen (ausruestung.ersatz), an Gegenständen im Gepäck (ersatz am
// Gegenstand, die Ausnahme für passive Wirkungen aus dem Gepäck), dann aus dem Register "ersatzquellen". Gefragt wird
// nur das Ziel des Ereignisses; je Ereignis wirkt höchstens eine, und keine wirkt wieder, solange sie selbst läuft.
// Wirkung je Haken:
//   vor_tod:     nach dem Effekt wird der Tod abgebrochen; gewirkt hat sie nur, wenn der Lebenswert danach über 0
//                liegt, sonst wird sie nicht verbraucht und die nächste gefragt
//   vor_schaden: fängt den Treffer ganz ab (Abbruch), nach dem Widerstand und nur bei Schaden über 0; den Marker
//                unblockbar achtet sie
// Verbrauchen: am Wesen fällt der Eintrag weg; ein Zustand verliert einen Stapel, der letzte endet mit dem Grund
// "verbraucht"; ein Gegenstand gibt ein Stück oder eine Ladung, angelegt wird er dabei abgelegt.
// Meldung ersatz_gewirkt { wer, quelle?, haken, was? (Gegenstand) | zustand?, text? }; ein unbekannter Gegenstand wird erkannt.

import { anmelden, alle } from "../kern/register.js";
import { HAKENKATALOG, RANG_ERSATZ } from "../kern/hakenkatalog.js";
import { effektAnwenden } from "../kern/effekte.js";
import { wurfProzent } from "../kern/wurf.js";
import { bedingungenErfuellt, lebenswertName, geteiltGerundet } from "../kern/werte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { entitaetMitId, fraktionVon } from "../kern/zustand.js";
import { zustandBeenden } from "./zustaende.js";
import { einStueckVerbrauchen } from "./inventar.js";
import { erkennen } from "./kennen.js";

export const ERSATZ_ZIELE = ["selbst", "quelle"];

// Was je Haken gilt: ob die Ersatzwirkung überhaupt in Frage kommt und ob sie nach dem Effekt gewirkt hat
const JE_HAKEN = {
  vor_tod: {
    kommtInFrage: () => true,
    gewirkt: (spiel, traegerin) => (traegerin.werte?.[lebenswertName(traegerin)]?.aktuell ?? 0) > 0,
  },
  vor_schaden: {
    kommtInFrage: (kontext) => kontext.menge > 0 && !(kontext.tags || []).includes("unblockbar"),
    gewirkt: () => true,
  },
};

// Kandidaten einer Trägerin: [{ eintrag, schluessel, gegenstandId? | zustand?, verbrauchen(kettentiefe) }] in der Reihenfolge der Kaskade
function ersatzDer(spiel, traegerin) {
  const ergebnis = [];
  (traegerin.ersatz || []).forEach((eintrag, nummer) => ergebnis.push({
    eintrag, schluessel: `${traegerin.id}:${nummer}`,
    verbrauchen: () => {
      traegerin.ersatz = traegerin.ersatz.filter((andere) => andere !== eintrag);
      if (!traegerin.ersatz.length) delete traegerin.ersatz;
    },
  }));
  for (const instanz of traegerin.zustaende || []) {
    (spiel.daten.zustaende?.[instanz.name]?.ersatz || []).forEach((eintrag, nummer) => ergebnis.push({
      eintrag, schluessel: `${traegerin.id}:z${instanz.nummer}:${nummer}`, zustand: instanz.name,
      verbrauchen: (kettentiefe) => stapelVerbrauchen(spiel, traegerin, instanz, kettentiefe),
    }));
  }
  const angelegt = traegerin.ausgeruestet || [];
  const gegenstandsEintraege = (gegenstandId, liste, kennung) => liste.forEach((eintrag, nummer) => ergebnis.push({
    eintrag, schluessel: `${traegerin.id}:${kennung}${gegenstandId}:${nummer}`, gegenstandId,
    verbrauchen: () => einStueckVerbrauchen(spiel, traegerin, entitaetMitId(spiel.zustand, gegenstandId)),
  }));
  for (const gegenstandId of angelegt) gegenstandsEintraege(gegenstandId, entitaetMitId(spiel.zustand, gegenstandId)?.ausruestung?.ersatz || [], "g");
  for (const gegenstandId of traegerin.inventar || []) gegenstandsEintraege(gegenstandId, entitaetMitId(spiel.zustand, gegenstandId)?.ersatz || [], "i");
  for (const [, quelle] of alle("ersatzquellen")) ergebnis.push(...quelle(spiel, traegerin));
  return ergebnis;
}

// Ein Stapel weniger; der letzte beendet den Zustand
function stapelVerbrauchen(spiel, traegerin, instanz, kettentiefe) {
  if ((instanz.stapel ?? 1) > 1) {
    instanz.staerke -= geteiltGerundet(instanz.staerke, instanz.stapel);
    instanz.stapel -= 1;
    return;
  }
  zustandBeenden(spiel, traegerin, instanz, "verbraucht", kettentiefe);
}

function passtZumEreignis(spiel, traegerin, eintrag, kontext) {
  if (eintrag.tag !== undefined && ![...(kontext.tags || []), kontext.schadensart].includes(eintrag.tag)) return false;
  if (eintrag.wenn && !bedingungenErfuellt(spiel, traegerin, eintrag.wenn, { gegenueberId: kontext.quelleId ?? null })) return false;
  const chance = eintrag.chance ?? 100;
  if (chance <= 0) return false;
  return chance >= 100 || wurfProzent(spiel, "ersatz", chance);
}

const laufende = (spiel) => (spiel.laufendeErsatzwirkungen ??= new Set());

function ersatzPruefen(spiel, hakenName, kontext) {
  if (kontext.abgebrochen) return;
  const regel = JE_HAKEN[hakenName];
  const traegerin = entitaetMitId(spiel.zustand, kontext.zielId);
  if (!traegerin || !regel.kommtInFrage(kontext)) return;
  const kettentiefe = (kontext.kettentiefe ?? 0) + 1;
  for (const kandidat of ersatzDer(spiel, traegerin)) {
    const { eintrag, schluessel } = kandidat;
    if (eintrag.bei !== hakenName || laufende(spiel).has(schluessel)) continue;
    if (!passtZumEreignis(spiel, traegerin, eintrag, kontext)) continue;
    const gegenstand = kandidat.gegenstandId == null ? null : entitaetMitId(spiel.zustand, kandidat.gegenstandId);
    laufende(spiel).add(schluessel);
    try {
      if (eintrag.effekt) {
        const zielId = (eintrag.ziel ?? "selbst") === "quelle" ? kontext.quelleId : traegerin.id;
        if (zielId != null && spiel.zustand.entitaeten[zielId]) {
          const mittel = gegenstand ? { art: "gegenstand", name: gegenstand.typ } : kandidat.zustand ? { art: "zustand", name: kandidat.zustand } : null;
          effektAnwenden(spiel, eintrag.effekt, { quelleId: traegerin.id, urheberFraktion: fraktionVon(traegerin) ?? null, zielId, ursache: "ersatz", mittel, kettentiefe });
        }
      }
    } finally {
      laufende(spiel).delete(schluessel);
    }
    if (!spiel.zustand.entitaeten[traegerin.id] || !regel.gewirkt(spiel, traegerin, kontext)) continue;
    kontext.abgebrochen = true;
    // erkannt vor der Meldung, damit sie den Namen trägt (Vorbild NetHack: das Amulett zeigt sich, wenn es rettet)
    if (gegenstand) erkennen(spiel, traegerin, gegenstand.typ);
    const quelle = entitaetMitId(spiel.zustand, kontext.quelleId);
    melden(spiel, "ersatz_gewirkt", {
      wer: bezugAuf(traegerin), quelle: quelle ? bezugAuf(quelle) : null, haken: hakenName,
      was: gegenstand ? bezugAuf(gegenstand) : null, zustand: kandidat.zustand ?? null, text: eintrag.text ?? null,
    });
    if (eintrag.verbrauchen) kandidat.verbrauchen(kettentiefe);
    return;
  }
}

for (const [hakenName, eintrag] of Object.entries(HAKENKATALOG)) {
  if (!eintrag.ersatzErlaubt) continue;
  if (!JE_HAKEN[hakenName]) throw new Error(`Ersatzwirkung: für den Haken "${hakenName}" fehlt die Regel in systeme/ersatz.js`);
  anmelden("haken", hakenName, (spiel, kontext) => ersatzPruefen(spiel, hakenName, kontext), { rang: RANG_ERSATZ });
}
