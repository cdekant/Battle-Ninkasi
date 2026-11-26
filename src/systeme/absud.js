// Absud (siehe docs/Sude.md, Absud; Spieldesign in docs/Brauen.md, Absud): ein Sud ohne Kultur, dessen Gärung die Magie
// lenkt. Hier stehen die Rechnung, das Wissen über Kräuter mit der Vermutung und das Wirken; den Befehl am Kessel führt
// systeme/brauen.js aus.
// Daten:
//   absudrichtungen: { <name>: { text, elixier: { stufen }, gift: { stufen } } }, stufen [{ ab, zustand, misslingen? }]
//   Zutat: zutat.richtungen { <richtung>: punkte je Stück }, zutat.neigung (Punkte je Stück zum Elixier, minus zum Gift),
//          zutat.misslingen (Punkte auf das Misslingen, je Zutatenart einmal), zutat.schwierigkeit (unbekannt zu Beginn)
//   Getränk: absud: { richtung, pol, staerke } am Gegenstand, je Richtung und Pol genau ein Typ
//   regeln.brauen.absud (daten/regeln.js)
// Rechnung (absudRechnen): Punkte je Richtung = Summe der Punkte mal Menge; es führt die mit den meisten, bei Gleichstand
//   die erste der Daten. Mächtigkeit = Extrakt je Portion x maechtigkeitProzent (Modifikator brauen.maechtigkeit),
//   Stärke = Mächtigkeit / staerkeJe, zwischen 1 und hoechstStaerke. Chance der Absicht = absicht.grund plus die mittlere
//   Neigung (beim Gift minus), Modifikator brauen.absicht, zwischen mindestens und hoechstens. Misslingen = misslingen
//   plus die Kräuter plus die Stufe des gewählten Pols (Modifikator brauen.misslingen), ohne Richtung immer.
//   Chancen der drei Ausgänge: misslungen, gelungen = (100 - misslungen) x Absicht / 100, umgeschlagen der Rest.
// Wissen über Kräuter: zustand.wissen.kraeuter [typ]; ein Kraut mit schwierigkeit ist unbekannt, bis Ninkasi mit ihm braut
//   (Meldung kraut_erkannt); zu Beginn das Vorwissen optionen.vorwissen.kraeuter, in der Spielart "allmaechtig" alle.
// Vermutung (zutatImAbsud): ein unbekanntes Kraut zeigt seine Beiträge nur, wenn ein fester Wurf je Lauf und Kraut (1 bis
//   100, aus dem Startwert) höchstens 100 x (grund + Kräuterkunde) / (grund + Kräuterkunde + Schwierigkeit) ist; sonst
//   liegen seine Punkte auf anderen Richtungen (ebenso fest gewürfelt), die Neigung ist umgekehrt, kein Misslingen.
//   Kräuterkunde ist ein Kampfwert (Vorgabe 0, Modifikator kraeuterkunde); mit ihr kippt die Vermutung zur Wahrheit.
// Baustein absud_wirken: setzt den Zustand der Stufe für den Absud aus der Ablage (kontext.werte.absud) mit seiner Stärke
//   und regeln.brauen.absud.dauer. Geworfen erkennt Ninkasi die Sorte wie beim Trinken (Haken gegenstand_benutzt).

import { anmelden, holen } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { modifiziert } from "../kern/werte.js";
import { entitaetMitId } from "../kern/zustand.js";
import { zufallErzeugen, zufallsGanzzahl, startwertAbleiten } from "../kern/zufall.js";
import { wissenVon } from "./wissen.js";
import { erkennen } from "./kennen.js";

export const POLE = ["elixier", "gift"];
export const gegenpol = (pol) => (pol === "elixier" ? "gift" : "elixier");
export const absudregeln = (daten) => daten.regeln.brauen.absud;
const begrenzt = (wert, unten, oben) => Math.max(unten, Math.min(oben, wert));

// Die Stufe eines Pols für eine Stärke: die höchste, deren ab erreicht ist
export function stufeDesPols(daten, richtung, pol, staerke) {
  const stufen = daten.absudrichtungen[richtung][pol].stufen;
  return stufen.filter((stufe) => stufe.ab <= staerke).at(-1) ?? stufen[0];
}

// Der Gegenstand eines Pols einer Richtung
export function getraenkFuer(daten, richtung, pol) {
  return Object.keys(daten.gegenstaende).find((typ) => !daten.gegenstaende[typ].abstrakt && daten.gegenstaende[typ].absud?.richtung === richtung && daten.gegenstaende[typ].absud?.pol === pol) ?? null;
}

// Wissen über Kräuter

export function krautUnbekannt(spiel, typ) {
  const zutat = spiel.daten.gegenstaende[typ]?.zutat;
  return zutat?.schwierigkeit !== undefined && !(spiel.zustand.wissen?.kraeuter ?? []).includes(typ);
}

// Ninkasi kennt ein Kraut nach dem ersten Absud mit ihm; true, wenn es neu war
export function krautKennenlernen(spiel, wesen, typ) {
  if (wesen.id !== spiel.zustand.spielerinId || !krautUnbekannt(spiel, typ)) return false;
  const wissen = wissenVon(spiel.zustand);
  wissen.kraeuter = [...(wissen.kraeuter ?? []), typ];
  melden(spiel, "kraut_erkannt", { wer: bezugAuf(wesen), was: { typ, text: spiel.daten.gegenstaende[typ].text } });
  return true;
}

anmelden("laufbeginn", "kraeuter", (spiel) => {
  const alle = Object.keys(spiel.daten.gegenstaende).filter((typ) => spiel.daten.gegenstaende[typ].zutat?.schwierigkeit !== undefined);
  const vorwissen = spiel.optionen?.spielart === "allmaechtig" ? alle : (spiel.optionen?.vorwissen?.kraeuter ?? []).filter((typ) => alle.includes(typ));
  wissenVon(spiel.zustand).kraeuter = [...new Set(vorwissen)];
});

export function kraeuterkundeVon(spiel, wesen) {
  return Math.max(0, modifiziert(spiel, wesen, "kraeuterkunde", wesen.kampfwerte?.kraeuterkunde ?? 0));
}

function wahreBeitraege(spiel, typ) {
  const zutat = spiel.daten.gegenstaende[typ].zutat;
  return { richtungen: { ...(zutat.richtungen ?? {}) }, neigung: zutat.neigung ?? 0, misslingen: zutat.misslingen ?? 0 };
}

// Beiträge einer Zutat zum Absud, wie die Brauerin sie sieht: { richtungen, neigung, misslingen, vermutet }
export function zutatImAbsud(spiel, wesen, typ) {
  const zutat = spiel.daten.gegenstaende[typ].zutat;
  const wahr = wahreBeitraege(spiel, typ);
  if (!krautUnbekannt(spiel, typ)) return { ...wahr, vermutet: false };
  const zufall = zufallErzeugen(startwertAbleiten(spiel.zustand.startwert, `vermutung:${typ}`));
  const wurf = zufallsGanzzahl(zufall, 1, 100);
  const kunde = absudregeln(spiel.daten).vermutung.grund + kraeuterkundeVon(spiel, wesen);
  if (wurf * (kunde + zutat.schwierigkeit) <= 100 * kunde) return { ...wahr, vermutet: true };
  const richtungen = {};
  for (const [richtung, punkte] of Object.entries(wahr.richtungen)) {
    const andere = Object.keys(spiel.daten.absudrichtungen).filter((name) => name !== richtung);
    const ziel = andere.length ? andere[zufallsGanzzahl(zufall, 0, andere.length - 1)] : richtung;
    richtungen[ziel] = (richtungen[ziel] ?? 0) + punkte;
  }
  return { richtungen, neigung: -wahr.neigung, misslingen: 0, vermutet: true };
}

// Rechnung eines Absuds aus { zutaten: [{ typ, menge }], portionen, absicht }; beitragVon(typ) gibt die Beiträge einer
// Zutat (die wahren oder die vermuteten). Gibt { punkte, fuehrend, maechtigkeit, staerke, absicht, stufe, chancen }.
export function absudRechnen(spiel, wesen, eingabe, beitragVon) {
  const daten = spiel.daten, regeln = absudregeln(daten);
  const summen = {};
  let nahrung = 0, neigung = 0, stuecke = 0, kraeuter = 0;
  const arten = new Set();
  for (const { typ, menge } of eingabe.zutaten) {
    const beitrag = beitragVon(typ);
    for (const [richtung, punkte] of Object.entries(beitrag.richtungen)) summen[richtung] = (summen[richtung] ?? 0) + punkte * menge;
    nahrung += (daten.gegenstaende[typ].zutat.extrakt ?? 0) * menge;
    neigung += beitrag.neigung * menge;
    stuecke += menge;
    // das Misslingen eines Krauts zählt je Art einmal, auch aus zwei Stapeln
    if (!arten.has(typ)) kraeuter += beitrag.misslingen;
    arten.add(typ);
  }
  // in der Reihenfolge der Daten; bei Gleichstand führt die erste
  const punkte = {};
  let fuehrend = null;
  for (const richtung of Object.keys(daten.absudrichtungen ?? {})) {
    if (!(summen[richtung] > 0)) continue;
    punkte[richtung] = summen[richtung];
    if (fuehrend === null || summen[richtung] > punkte[fuehrend]) fuehrend = richtung;
  }
  const maechtigkeit = Math.max(0, modifiziert(spiel, wesen, "brauen.maechtigkeit", Math.floor((Math.floor(nahrung / eingabe.portionen) * regeln.maechtigkeitProzent) / 100)));
  const staerke = begrenzt(Math.floor(maechtigkeit / regeln.staerkeJe), 1, regeln.hoechstStaerke);
  const mittel = stuecke ? Math.trunc(neigung / stuecke) : 0;
  const absicht = begrenzt(modifiziert(spiel, wesen, "brauen.absicht", regeln.absicht.grund + (eingabe.absicht === "elixier" ? mittel : -mittel)), regeln.absicht.mindestens, regeln.absicht.hoechstens);
  const stufe = fuehrend ? stufeDesPols(daten, fuehrend, eingabe.absicht, staerke) : null;
  const misslungen = fuehrend ? begrenzt(modifiziert(spiel, wesen, "brauen.misslingen", regeln.misslingen + kraeuter + (stufe.misslingen ?? 0)), 0, 100) : 100;
  const gelungen = Math.floor(((100 - misslungen) * absicht) / 100);
  return { punkte, fuehrend, maechtigkeit, staerke, absicht, stufe, chancen: { gelungen, umgeschlagen: 100 - misslungen - gelungen, misslungen } };
}

// Vorschau eines Absuds: die wahre Rechnung für den Befehl, die vermutete für die Anzeige, dazu die unbekannten Kräuter
export function absudVorbereiten(spiel, wesen, eingabe) {
  const wahr = absudRechnen(spiel, wesen, eingabe, (typ) => wahreBeitraege(spiel, typ));
  const vermutet = absudRechnen(spiel, wesen, eingabe, (typ) => zutatImAbsud(spiel, wesen, typ));
  const unbekannt = [...new Set(eingabe.zutaten.map(({ typ }) => typ).filter((typ) => krautUnbekannt(spiel, typ)))];
  return { wahr, vermutet, unbekannt };
}

// Der Wurf des Absuds: "gelungen" | "umgeschlagen" | "misslungen"
export function ausgangWuerfeln(wurf, chancen) {
  if (wurf <= chancen.misslungen) return "misslungen";
  return wurf <= chancen.misslungen + chancen.gelungen ? "gelungen" : "umgeschlagen";
}

bausteinAnmelden("absud_wirken", {}, (spiel, kontext) => {
  const absud = kontext.werte.absud;
  if (!absud || !spiel.daten.absudrichtungen?.[absud.richtung]) return;
  const stufe = stufeDesPols(spiel.daten, absud.richtung, absud.pol, absud.staerke);
  holen("bausteine", "zustand_setzen")(spiel, kontext, { zustand: stufe.zustand, dauer: absudregeln(spiel.daten).dauer, staerke: absud.staerke });
}, { brauchtZiel: true });

// Wer einen Absud wirft, merkt, was es war, wie beim Trinken (systeme/inventar.js)
anmelden("haken", "gegenstand_benutzt", (spiel, kontext) => {
  if (kontext.art !== "werfen") return;
  const gegenstand = entitaetMitId(spiel.zustand, kontext.gegenstandId), wesen = entitaetMitId(spiel.zustand, kontext.quelleId);
  if (gegenstand?.absud && wesen) erkennen(spiel, wesen, gegenstand.typ);
});
