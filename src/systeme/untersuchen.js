// Untersuchen (siehe docs/Bedienung.md, Untersuchen): reine Lesefunktionen, was Ninkasi über ein Feld und die
// Wesen darauf weiß; ändern nichts und würfeln nicht. Grundlage für Tooltip und Seitenleiste (anzeige/oberflaeche.js).
// Ein unbekanntes Feld gibt nichts preis, ein bekanntes, das sie gerade nicht sieht, nur, woran sie sich erinnert
// (Gelände, Oberfläche, Gegenstände und Fallen als Aussehen, systeme/erinnerung.js), ein sichtbares alles: Gelände,
// Feldschichten, Gegenstände, bekannte Fallen und Wesen.
// Wesen: LP, Zustände mit Restdauer in Zügen, Wachzustand, laufende Aktion, Trefferchance in beide Richtungen
// (erstes Angriffsprofil, systeme/vorschau.js). Ninkasi selbst dazu mit der Aufschlüsselung ihrer Werte.

import { gesteuerteEntitaet, entitaetenAuf, istWesen, sichtVon } from "../kern/zustand.js";
import { feldBekannt, feldIndex, gelaendeName, bekannterGelaendeName } from "../welt/karte.js";
import { schichtAuf } from "../welt/schichten.js";
import { hatHoechstwert, hoechstwert, modifikatorenAufgeschluesselt, verrechnet, lebenswertName } from "../kern/werte.js";
import { istSichtbar } from "./sicht.js";
import { istBekannt } from "./fallen.js";
import { erinnerteDingeAuf } from "./erinnerung.js";
import { istUnbekannt } from "./kennen.js";
import { wachzustandVon } from "./wahrnehmung.js";
import { KAMPFWERTE, angriffeVon } from "./kampf.js";
import { nahkampfchanceVorschau } from "./vorschau.js";

// Höchstwerte, die die Aufschlüsselung zeigt, sofern das Wesen sie hat
const HOECHSTWERTE = ["lp", "mp", "pp"];

// Länge eines Zugs in Zeiteinheiten (Warten), für Restdauern
const zuglaenge = (spiel) => spiel.daten.aktionen?.warten ?? 100;

// Zustände eines Wesens: [{ nummer, name, staerke, zuege }], zuege null bei unbegrenzter Dauer, sonst mindestens 1
export function zustaendeVon(spiel, wesen) {
  const jetzt = spiel.zustand.zeit;
  return (wesen.zustaende || []).map((instanz) => ({
    nummer: instanz.nummer,
    name: instanz.name,
    staerke: instanz.staerke,
    zuege: instanz.ende === null || instanz.ende === undefined ? null : Math.max(1, Math.ceil((instanz.ende - jetzt) / zuglaenge(spiel))),
  }));
}

// Laufende Aktion eines Wesens: { art, faehigkeit?, erledigt, gesamt, unterbrochen } oder null
export function laufendeAktionVon(wesen) {
  const aktion = wesen.laufendeAktion;
  if (!aktion) return null;
  return { art: aktion.art, faehigkeit: aktion.faehigkeit ?? null, erledigt: aktion.schritteErledigt ?? 0, gesamt: aktion.schritteGesamt, unterbrochen: aktion.unterbrochen ?? null };
}

export function wesenBeschreiben(spiel, wesen) {
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  const istGesteuerte = wesen.id === gesteuerte.id;
  const lebenswert = wesen.werte?.[lebenswertName(wesen)];
  return {
    id: wesen.id,
    lp: lebenswert ? { aktuell: lebenswert.aktuell, hoechst: hoechstwert(spiel, wesen, lebenswertName(wesen)) } : null,
    zustaende: zustaendeVon(spiel, wesen),
    laufendeAktion: laufendeAktionVon(wesen),
    wachzustand: wesen.ki && !istGesteuerte ? wachzustandVon(wesen) : null,
    chanceNinkasi: istGesteuerte ? null : nahkampfchanceVorschau(spiel, gesteuerte, wesen),
    chanceGegen: istGesteuerte ? null : nahkampfchanceVorschau(spiel, wesen, gesteuerte),
  };
}

// Bezug für einen erinnerten Gegenstand (ohne ID): mit dem Etikett, solange sein Typ unbekannt ist
function erinnerterBezug(zustand, eintrag) {
  const bezug = { typ: eintrag.typ, text: eintrag.text };
  if (istUnbekannt(zustand, eintrag.typ)) bezug.etikett = zustand.wissen.etiketten[eintrag.typ];
  if (eintrag.anzahl !== undefined) bezug.anzahl = eintrag.anzahl;
  return bezug;
}

// Was Ninkasi über ein Feld weiß, oder null (außerhalb der Karte oder unbekannt):
// { x, y, sichtbar, gelaende, schichten: [{ schicht, art, menge }], gegenstaende: [id], fallen: [id], wesen: [Beschreibung],
//   erinnert: { gegenstaende: [{ typ, text, etikett?, anzahl }], fallen: [{ typ, text }] } }
// Außer Sicht kommen Gelände und Oberfläche (menge null) aus der Erinnerung, Gegenstände und Fallen stehen unter erinnert
export function feldBeschreiben(spiel, feld) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  if (!feld || !feldBekannt(ebene, feld.x, feld.y)) return null;
  const sichtbar = istSichtbar(zustand, feld.x, feld.y);
  const gelaende = sichtbar ? gelaendeName(spiel, feld.x, feld.y) : bekannterGelaendeName(spiel, feld.x, feld.y);
  const beschreibung = { x: feld.x, y: feld.y, sichtbar, gelaende, schichten: [], gegenstaende: [], fallen: [], wesen: [], erinnert: { gegenstaende: [], fallen: [] } };
  if (!sichtbar) {
    const dinge = erinnerteDingeAuf(ebene, feldIndex(ebene, feld.x, feld.y));
    if (dinge.oberflaeche) beschreibung.schichten.push({ schicht: "oberflaeche", art: dinge.oberflaeche, menge: null });
    beschreibung.erinnert.gegenstaende = dinge.gegenstaende.map((eintrag) => erinnerterBezug(zustand, eintrag));
    beschreibung.erinnert.fallen = dinge.fallen.map((eintrag) => ({ typ: eintrag.typ, text: eintrag.text }));
    return beschreibung;
  }
  for (const schicht of ["oberflaeche", "gas"]) {
    const eintrag = schichtAuf(spiel, schicht, feld.x, feld.y);
    if (eintrag) beschreibung.schichten.push({ schicht, art: eintrag.art, menge: eintrag.menge });
  }
  const feuer = schichtAuf(spiel, "feuer", feld.x, feld.y);
  if (feuer) beschreibung.schichten.push({ schicht: "feuer", art: "feuer", menge: feuer.menge });
  for (const entitaet of entitaetenAuf(zustand, feld.x, feld.y)) {
    if (istWesen(entitaet)) beschreibung.wesen.push(wesenBeschreiben(spiel, entitaet));
    else if (entitaet.falle) { if (istBekannt(entitaet)) beschreibung.fallen.push(entitaet.id); }
    else beschreibung.gegenstaende.push(entitaet.id);
  }
  return beschreibung;
}

// Herkunft eines Modifikators aus seiner Quelle (kern/werte.js): { art: "eigen" | "gegenstand" (id) | "zustand" (name)
// | "aura" | "sonstige" (quelle) }
export function herkunftVon(wesen, quelle) {
  if (quelle === undefined || quelle === null) return { art: "eigen" };
  const [art, kennung] = String(quelle).split(":");
  if (art === "ausruestung") return { art: "gegenstand", id: Number(kennung) };
  if (art === "zustand") {
    const instanz = (wesen.zustaende || []).find((eintrag) => eintrag.nummer === Number(kennung));
    return { art: "zustand", name: instanz?.name ?? null };
  }
  if (art === "aura") return { art: "aura" };
  return { art: "sonstige", quelle: String(quelle) };
}

// Grundwert eines Werts für die Aufschlüsselung
function grundwertVon(spiel, wesen, name) {
  if (HOECHSTWERTE.includes(name)) return wesen.werte[name].grundwert;
  if (name === "reichweiteSicht") return sichtVon(wesen)?.reichweite ?? 0;
  // ohne Sicht auch keine Sicht im Dunkeln
  if (name === "sichtImDunkeln") return sichtVon(wesen) ? sichtVon(wesen).imDunkeln ?? spiel.daten.regeln.licht.imDunkeln : 0;
  if (name === "genauigkeit") return angriffeVon(spiel, wesen)[0]?.genauigkeit ?? 0;
  if (name === "heimlichkeit") return wesen.kampfwerte?.heimlichkeit ?? spiel.daten.regeln.wahrnehmung.heimlichkeitVorgabe;
  return wesen.kampfwerte?.[name] ?? 0;
}

// Aufschlüsselung der Werte: [{ name, grundwert, wert, modifikatoren: [{ art, betrag, herkunft }] }], nur Werte, die
// nicht 0 sind oder Modifikatoren haben; Modifikatoren mit Bedingungen an ein Gegenüber zählen hier nicht
// (ohne Umstände); Kampfwerte nie unter 0 wie in systeme/kampf.js
export function werteAufschluesseln(spiel, wesen) {
  const namen = [...HOECHSTWERTE.filter((name) => wesen.werte?.[name] && hatHoechstwert(wesen, name)), "genauigkeit", ...KAMPFWERTE, "reichweiteSicht", "sichtImDunkeln"];
  const ergebnis = [];
  for (const name of namen) {
    const grundwert = grundwertVon(spiel, wesen, name);
    const modifikatoren = modifikatorenAufgeschluesselt(spiel, wesen, name);
    const verrechneterWert = verrechnet(grundwert, modifikatoren);
    const wert = KAMPFWERTE.includes(name) ? Math.max(0, verrechneterWert) : verrechneterWert;
    if (wert === 0 && !modifikatoren.length) continue;
    ergebnis.push({
      name, grundwert, wert,
      modifikatoren: modifikatoren.map((modifikator) => ({ art: modifikator.art, betrag: modifikator.betrag, herkunft: herkunftVon(wesen, modifikator.quelle) })),
    });
  }
  return ergebnis;
}
