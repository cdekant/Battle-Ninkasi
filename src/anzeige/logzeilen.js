// Logzeilen: übersetzt eine Spielmeldung in beschriebene Zeilen, ohne DOM, damit es testbar ist (anzeige/log.js zeigt sie).
// Zeile: { spalte, art, text, seite?, ton?, magisch?, zahlen? }
//   spalte: "geschehen" (Erzählung, Bemerktes, Gehörtes, Hinweise) oder "kampf" (Treffer, Abwehr, Tod, Fähigkeiten,
//           angekündigte Angriffe), siehe docs/Oberflaeche.md, Log
//   art:    Art für Symbol und Filter (ARTEN)
//   seite:  wer handelt, nur im Kampf: "ninkasi", "verbuendet", "gegner", "neutral" (Farbfamilie)
//   ton:    Ausgang, nur im Kampf: "treffer", "krit", "abgewehrt", "ankuendigung" (Ton innerhalb der Farbfamilie)
//   magisch: Psi oder Magie (Gegner in Lila)
//   zahlen: [{ text, klasse, titel? }] in festen Spalten (ZAHLENSPALTEN): Trefferchance, Schaden, Krit-Faktor und
//           Abzug (Rüstung und Widerstand zusammen, titel nennt die Aufteilung)
// Die Wahrnehmbarkeit prüft der Aufrufer (systeme/wahrnehmbar.js); hier geht es nur um die Form.

import { promilleText } from "./pegelanzeige.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { spielerin } from "../kern/zustand.js";

// Arten mit Symbol, in dieser Reihenfolge auch im Filter des Verlaufs; Farbe nie allein (Prinzip 6)
export const ARTEN = {
  gefahr: "⚠",
  angriff: "⚔",
  krit: "✦",
  abgewehrt: "○",
  widerstand: "◆",
  tod: "☠",
  heilung: "+",
  pegel: "◉",
  fund: "◇",
  lernen: "▲",
  geschehen: "·",
  hinweis: "›",
};

const MAGISCHE_SCHADENSARTEN = ["psi", "magie"];

// Feste Spalten der Zahlen im Kampflog, in dieser Reihenfolge; die Kopfzeile nennt sie (log.spalte.<name>)
export const ZAHLENSPALTEN = ["chance", "menge", "krit", "abzug"];

// Seite eines Wesens aus Sicht Ninkasis; ohne Wesen (schon fort) neutral
export function seiteVon(spiel, bezug) {
  if (!bezug) return "neutral";
  const ninkasi = spielerin(spiel.zustand);
  if (bezug.id === ninkasi.id) return "ninkasi";
  const wesen = spiel.zustand.entitaeten[bezug.id];
  if (!wesen) return "neutral";
  const beziehung = beziehungZwischen(spiel, urheberVon(ninkasi), wesen);
  return beziehung === "verbuendet" ? "verbuendet" : beziehung === "feind" ? "gegner" : "neutral";
}

const prozentText = (texte, wert) => texte.text("log.zahl.chance", { prozent: wert });
const faktorText = (texte, kritfaktor) => texte.text("log.zahl.krit", { faktor: String(kritfaktor / 100).replace(".", ",") });

function schadenszahlen(texte, meldung) {
  const zahlen = [];
  if (meldung.trefferchance !== null && meldung.trefferchance !== undefined) zahlen.push({ text: prozentText(texte, meldung.trefferchance), klasse: "chance" });
  zahlen.push({ text: String(meldung.menge), klasse: "menge" });
  if (meldung.kritfaktor) zahlen.push({ text: faktorText(texte, meldung.kritfaktor), klasse: "krit" });
  const widerstand = meldung.immun ? 0 : meldung.widerstanden || 0;
  const abzug = (meldung.ruestungAbzug || 0) + widerstand;
  if (abzug) {
    const teile = [];
    if (meldung.ruestungAbzug) teile.push(texte.text("log.zahl.ruestung", { menge: meldung.ruestungAbzug }));
    if (widerstand) teile.push(texte.text("log.zahl.widerstand", { menge: widerstand }));
    zahlen.push({ text: texte.text("log.zahl.abzug", { menge: abzug }), klasse: "abzug", titel: teile.join(", ") });
  }
  return zahlen;
}

// Zeilen zu einer Meldung (meist eine, manchmal keine); kontext: { spiel, texte, zustandsname(name) }
export function zeilenAusMeldung(kontext, meldung) {
  const { spiel, texte } = kontext;
  const { text, hatSchluessel } = texte;
  const spielerinId = spiel.zustand.spielerinId;
  const geschehen = (zeilentext, art = "geschehen") => [{ spalte: "geschehen", art, text: zeilentext }];
  const kampf = (zeilentext, art, seite, ton, zusatz = {}) => [{ spalte: "kampf", art, text: zeilentext, seite, ton, ...zusatz }];

  switch (meldung.art) {
    case "tod": {
      if (meldung.opfer.id === spielerinId) return geschehen(text("log.tod_ninkasi"), "gefahr");
      // ohne bekannte Quelle die Seite, der der Tod nützt
      const opferSeite = seiteVon(spiel, meldung.opfer);
      const seite = meldung.quelle ? seiteVon(spiel, meldung.quelle) : opferSeite === "gegner" ? "ninkasi" : "gegner";
      return kampf(text("log.tod", meldung), "tod", seite, "treffer");
    }
    case "schaden": {
      const schluessel = meldung.immun ? "log.schaden_immun" : meldung.kritisch ? "log.schaden_kritisch" : "log.schaden";
      const art = meldung.schadensart && hatSchluessel(`schaden.${meldung.schadensart}`) ? text(`schaden.${meldung.schadensart}`) : "?";
      const seite = seiteVon(spiel, meldung.quelle);
      const ton = meldung.immun ? "abgewehrt" : meldung.kritisch ? "krit" : "treffer";
      const zeilenart = meldung.immun || meldung.widerstanden ? "widerstand" : meldung.kritisch ? "krit" : "angriff";
      return kampf(text(schluessel, { ...meldung, art }), zeilenart, seite, ton, {
        magisch: MAGISCHE_SCHADENSARTEN.includes(meldung.schadensart),
        zahlen: schadenszahlen(texte, meldung),
      });
    }
    case "verfehlt": {
      const zahlen = meldung.trefferchance !== null && meldung.trefferchance !== undefined ? [{ text: prozentText(texte, meldung.trefferchance), klasse: "chance" }] : [];
      return kampf(text(meldung.grund === "geblockt" ? "log.geblockt" : "log.verfehlt", meldung), "abgewehrt", seiteVon(spiel, meldung.quelle), "abgewehrt", { zahlen });
    }
    case "hinterhalt":
      return hatSchluessel("log.hinterhalt") ? kampf(text("log.hinterhalt", meldung), "krit", seiteVon(spiel, meldung.quelle), "krit") : [];
    case "faehigkeit":
      return kampf(text("log.faehigkeit", { ...meldung, faehigkeit: hatSchluessel(meldung.text) ? text(meldung.text) : meldung.faehigkeit }), "angriff", seiteVon(spiel, meldung.wer), "treffer");
    case "aktion_beginnt": {
      // angekündigte Angriffe: eigener Text der Fähigkeit, sonst still
      if (!meldung.ankuendigung || !hatSchluessel(meldung.ankuendigung)) return [];
      const seite = seiteVon(spiel, meldung.wer);
      return kampf(text(meldung.ankuendigung, meldung), seite === "gegner" ? "gefahr" : "angriff", seite, "ankuendigung");
    }
    case "ebene_gewechselt":
      return geschehen(text("log.ebene_gewechselt", { ...meldung, richtung: text(meldung.richtung === "ab" ? "ui.hinab" : "ui.hinauf") }));
    case "gefolgt":
      return geschehen(text("log.gefolgt", meldung));
    case "population_voll":
      // ausdrücklicher Hinweis statt stillschweigend, auch auf der Konsole für die Entwicklung
      console.warn(`Obergrenze der Population erreicht (${meldung.hoechstWesen}), ${meldung.ausgefallen} Wesen entstehen nicht`);
      return geschehen(text("log.population_voll", meldung), "hinweis");
    case "risiko": {
      const schluessel = `log.risiko.${meldung.ausgang}`;
      return hatSchluessel(schluessel) ? geschehen(text(schluessel, meldung), "gefahr") : [];
    }
    case "geheilt":
    case "wert_geaendert": {
      if (meldung.menge === 0) return [];
      const vorzeichen = meldung.menge > 0 ? "+" : "";
      const menge = meldung.wertName === "pegel" ? promilleText(meldung.menge) : meldung.menge;
      const platzhalter = { ...meldung, menge: vorzeichen + menge, wertName: text(`ui.${meldung.wertName}`) };
      return geschehen(text(`log.${meldung.art}`, platzhalter), meldung.wertName === "pegel" ? "pegel" : meldung.menge > 0 ? "heilung" : "gefahr");
    }
    case "pegel_steigt":
    case "pegel_sinkt":
      return geschehen(text(`log.${meldung.art}`, { ...meldung, schwelle: promilleText(meldung.schwelle) }), "pegel");
    case "abgelehnt": {
      const schluessel = `log.abgelehnt.${meldung.grund}`;
      return hatSchluessel(schluessel) ? geschehen(text(schluessel), "hinweis") : [];
    }
    // Verschleiß und Flüche nur an Ninkasis Sachen; was anderswo verdirbt, bleibt still
    case "verdorben":
    case "kaputt":
      return meldung.traegerin?.id === spielerinId ? geschehen(text(`log.${meldung.art}`, meldung), "gefahr") : [];
    case "abgenutzt":
      return meldung.wer.id === spielerinId ? geschehen(text("log.abgenutzt", meldung), "gefahr") : [];
    case "fluch_entdeckt":
      return meldung.wer.id === spielerinId ? geschehen(text("log.fluch_entdeckt", meldung), "gefahr") : [];
    case "fluch_aufgehoben":
      return meldung.wer.id === spielerinId ? geschehen(text("log.fluch_aufgehoben", meldung), "heilung") : [];
    // eigener Text des Zustands (log.zustand.<name>.beginnt), sonst der allgemeine
    case "zustand_beginnt":
    case "zustand_endet": {
      const vorgang = meldung.art === "zustand_beginnt" ? "beginnt" : "endet";
      const eigenerSchluessel = `log.zustand.${meldung.zustand}.${vorgang}`;
      const schluessel = hatSchluessel(eigenerSchluessel) ? eigenerSchluessel : `log.zustand_${vorgang}`;
      return geschehen(text(schluessel, { ...meldung, zustand: kontext.zustandsname(meldung.zustand) }));
    }
    // Ersatzwirkungen (systeme/ersatz.js): eigener Text, sonst nach Haken und Herkunft (gegenstand, zustand, selbst)
    case "ersatz_gewirkt": {
      const herkunft = meldung.was ? "gegenstand" : meldung.zustand ? "zustand" : "selbst";
      const schluessel = meldung.text && hatSchluessel(meldung.text) ? meldung.text : `log.ersatz.${meldung.haken}.${herkunft}`;
      const zeilentext = text(schluessel, { ...meldung, zustand: meldung.zustand ? kontext.zustandsname(meldung.zustand) : null });
      if (meldung.haken === "vor_schaden") return kampf(zeilentext, "abgewehrt", seiteVon(spiel, meldung.quelle), "abgewehrt");
      return geschehen(zeilentext, "heilung");
    }
    case "beschworen":
      return geschehen(text(meldung.wer ? "log.beschworen" : "log.erschienen", meldung));
    // Skillsystem (systeme/skills.js, systeme/lernen.js): nur, was Ninkasi selbst lernt
    case "skillstufe":
    case "gelernt":
    case "skill_freigeschaltet":
      return meldung.wer.id === spielerinId ? geschehen(text(`log.${meldung.art}`, { ...meldung, skill: hatSchluessel(meldung.text) ? text(meldung.text) : meldung.skill }), "lernen") : [];
    case "faehigkeit_gelernt":
    case "faehigkeit_schon_bekannt":
      return meldung.wer.id === spielerinId ? geschehen(text(`log.${meldung.art}`, { ...meldung, faehigkeit: hatSchluessel(meldung.text) ? text(meldung.text) : meldung.faehigkeit }), "lernen") : [];
    case "ep_erhalten":
      return meldung.ep > 0 ? geschehen(text("log.ep_erhalten", meldung), "lernen") : [];
    case "eigenschaft_geaendert": {
      if (meldung.wer.id !== spielerinId) return [];
      const eigenschaft = text(spiel.daten.eigenschaften?.[meldung.eigenschaft]?.text ?? meldung.eigenschaft);
      return geschehen(text("log.eigenschaft_geaendert", { eigenschaft, menge: (meldung.menge > 0 ? "+" : "") + meldung.menge }), meldung.menge > 0 ? "lernen" : "gefahr");
    }
    case "ruf": {
      const fraktion = text(spiel.daten.fraktionen?.[meldung.fraktion]?.text ?? meldung.fraktion);
      return geschehen(text("log.ruf", { fraktion, menge: (meldung.menge > 0 ? "+" : "") + meldung.menge }));
    }
    case "liegt_hier":
    case "aufgehoben":
      return hatSchluessel(`log.${meldung.art}`) ? geschehen(text(`log.${meldung.art}`, meldung), "fund") : [];
    default: {
      const schluessel = `log.${meldung.art}`;
      return hatSchluessel(schluessel) ? geschehen(text(schluessel, meldung)) : [];
    }
  }
}
