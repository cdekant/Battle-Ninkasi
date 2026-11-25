// Räumender Bot (siehe docs/Entwicklung.md, Bot und Werkzeuge): Ninkasi räumt eine Ebene gezielt, um das EP-Budget
// und die Härte einer Ebene zu messen (Ziel in docs/Charakter.md, Anfangsbalance). Anders als der Zufallsbot
// (werkzeuge/bot.js) spielt er so gut, wie es die Bausteine der Eingabe und der Taktik erlauben.
// Aufruf: node werkzeuge/raeumen.js [Läufe=20] [erster Startwert=1] [--ebenen n] [--rasten prozent] [--json datei]
//
// Vorgehen je Zug, in dieser Reihenfolge:
//   1. ein Feind ist wahrgenommen: der Befehl der Taktik fernkampf (ki/taktik.js: trinkt unter 40 % LP, wirft auf
//      Abstand, sonst Nahkampf); wartet sie mehrmals, weil der Weg nur über eine Gefahr führt, geht der Bot darüber
//   2. kein Feind, LP unter --rasten Prozent (Vorgabe 60): Rasten, bis die LP voll sind (eingabe/rasten.js)
//   3. kein Feind, ein Getränk oder eine Wurfwaffe liegt auf einem bekannten Feld: hingehen und aufheben
//   4. sonst weiter erkunden (eingabe/erkunden.js); liegt das Unerkundete nur hinter einer bekannten Gefahr, gleich ein
//      zweites Mal mit trotzGefahr, wie eine Spielerin, die das Risiko in Kauf nimmt
//   5. noch Feinde auf der Ebene, aber nichts mehr zu erkunden oder das Erkunden kommt gerade nicht weiter: die Taktik
//      jagt sie mit dem Wissen, wo sie stehen (ein Messwerkzeug, kein faires Spiel); was nach dem vollständigen
//      Erkunden fällt, zählt als "erjagt"; nach GRENZE_STILLSTAND Zügen ohne Fortschritt gilt der Lauf als "fest"
//   6. die Ebene ist leer: mit --ebenen weiter über die Treppe hinab, sonst Ende; dazu eine Obergrenze an Befehlen
// Lernen: freie EP gehen sofort in die Skills nach LERNREIHENFOLGE, jeder bis Stufe 5; gebundene EP fließen von selbst.
// Wiederholbar: jeder Lauf ist eine gewöhnliche Befehlsliste und wird nachgespielt und verglichen.

import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { datenLaden, neuesSpiel, befehlGeben, spielstand, nachspielen } from "../src/kern/spiel.js";
import { spielerin, entitaetenMitPosition, istWesen, bewegungVon } from "../src/kern/zustand.js";
import { weg } from "../src/welt/wege.js";
import { hoererAnmelden } from "../src/kern/ereignisse.js";
import { hoechstwert } from "../src/kern/werte.js";
import { feindlich } from "../src/systeme/kampf.js";
import { wahrgenommeneFeinde } from "../src/systeme/gefahr.js";
import { epBisStufe, stufeVon } from "../src/systeme/skills.js";
import { taktikbefehl } from "../src/ki/taktik.js";
import { feldBekannt, bekanntesGelaendeAuf, passierbar } from "../src/welt/karte.js";
import { reiseBeginnen, naechsterReiseschritt } from "../src/eingabe/reise.js";
import { rastenBeginnen, naechsterRastschritt } from "../src/eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "../src/eingabe/erkunden.js";
import vorgaben from "../src/eingabe/einstellungen.js";

export const LERNREIHENFOLGE = ["nahkampf_grund", "zaehigkeit_grund", "ausweichen_grund"];
const TAKTIK = "fernkampf";
const GRENZE_BEFEHLE = 20000;
const GRENZE_STILLSTAND = 200; // so viele Züge ohne Fortschritt hintereinander, dann gilt der Lauf als fest
const NACHLAUF = 10; // so viele Züge bleibt der Bot nach dem letzten wahrgenommenen Feind beim Kampf
const GRENZE_KAMPFWARTEN = 5; // so oft wartet die Taktik vor einem wahrgenommenen Feind, dann geht der Bot ohne Meiden
// Abläufe halten bei jedem Feind und bei Schaden; Gegenstände sucht der Bot selbst (Schritt 3)
const EINSTELLUNGEN = { ...vorgaben, reiseHalt: ["gegner_in_sicht", "schaden"], rastenBis: ["lp"], rastenTrotzFeinden: false };

const istFeind = (spiel, ninkasi, entitaet) => istWesen(entitaet) && entitaet.position && entitaet.id !== ninkasi.id && feindlich(spiel, ninkasi, entitaet);
const feindeDerEbene = (spiel, ninkasi) => entitaetenMitPosition(spiel.zustand).filter((entitaet) => istFeind(spiel, ninkasi, entitaet));

// Getränke und Wurfwaffen auf bekannten Feldern, das nächste zuerst (nach Schachbrett-Abstand)
function naechsterFund(spiel, ninkasi, unerreichbar) {
  const ebene = spiel.zustand.ebene;
  let bester = null, besterAbstand = Infinity;
  for (const entitaet of entitaetenMitPosition(spiel.zustand)) {
    if (!entitaet.aufhebbar || !(entitaet.trinkbar || entitaet.wurf?.genauigkeit !== undefined)) continue;
    const { x, y } = entitaet.position;
    if (!feldBekannt(ebene, x, y) || unerreichbar.has(`${x},${y}`)) continue;
    const weite = Math.max(Math.abs(x - ninkasi.position.x), Math.abs(y - ninkasi.position.y));
    if (weite < besterAbstand) { bester = entitaet; besterAbstand = weite; }
  }
  return bester;
}

// Freie EP nach der Lernreihenfolge verteilen (Befehl lernen, ohne Zeit)
function freieEpVerteilen(spiel, ninkasi) {
  for (const skill of LERNREIHENFOLGE) {
    if (!ninkasi.freieEp) return;
    const noetig = epBisStufe(spiel, ninkasi, skill, 5);
    if (noetig > 0) befehlGeben(spiel, { art: "lernen", skill, ep: Math.min(noetig, ninkasi.freieEp) });
  }
}

// Einen Ablauf der Eingabe bis zum Halt laufen lassen; gibt den Haltegrund zurück
function ablaufLaufenLassen(spiel, beginn, naechsterSchritt, zaehler) {
  if (beginn.grund) return beginn.grund;
  const ablauf = beginn.reise ?? beginn.ablauf;
  for (let schritt = 0; schritt < 2000; schritt++) {
    const ergebnis = naechsterSchritt(spiel, ablauf, EINSTELLUNGEN);
    if (ergebnis.halt) return ergebnis.halt;
    if (!befehlGeben(spiel, ergebnis.befehl).ok) return "abgelehnt";
    zaehler.befehle++;
  }
  return "zu_lang";
}

// Ein Lauf: { startwert, ergebnis, ebenen: [{ tiefe, ... }], ep: {...}, skills, befehle, zeit, ... }
export function laufRaeumen(daten, startwert, { ebenen = 1, rastenAb = 60, protokoll = null } = {}) {
  const spiel = neuesSpiel(daten, startwert);
  const ninkasi = spielerin(spiel.zustand);
  const taktik = daten.taktiken[TAKTIK];
  // was zu Beginn schon gesehen ist, zählt zur Erkundung, das Startguthaben steht in den Regeln
  const ep = { start: daten.regeln.lernen.startEp, erkundung: 0, gebunden: 0, freiAusBeute: 0 };
  let erwarteteFreieEp = ep.start;
  const zaehler = { befehle: 0, getraenke: 0, wuerfe: 0, rastzeit: 0 };
  let phase = "erkunden", ebeneJetzt = null, letzteTodesursache = null;
  const ebenenListe = [];

  hoererAnmelden(spiel, (meldung) => {
    if (meldung.art === "gelernt") erwarteteFreieEp -= meldung.ep;
    if (meldung.art === "ep_erhalten") {
      ep.gebunden += meldung.ep - meldung.frei;
      ep.freiAusBeute += meldung.frei;
      erwarteteFreieEp += meldung.frei;
    }
    if (meldung.art === "tod" && ebeneJetzt) {
      if (meldung.opfer.id === ninkasi.id) letzteTodesursache = meldung.ursache ?? "unbekannt";
      else if (phase === "jagd") ebeneJetzt.erjagt++;
    }
  });
  // Erkundung: was an freien EP mehr da ist, als Lernen und Beute erklären
  const erkundungBuchen = () => {
    ep.erkundung += ninkasi.freieEp - erwarteteFreieEp;
    erwarteteFreieEp = ninkasi.freieEp;
  };
  const geben = (befehl) => {
    const antwort = befehlGeben(spiel, befehl);
    if (antwort.ok) {
      zaehler.befehle++;
      if (befehl.art === "trinken") zaehler.getraenke++;
      if (befehl.art === "werfen") zaehler.wuerfe++;
    }
    return antwort.ok;
  };
  const ebeneBeginnen = () => {
    ebeneJetzt = { tiefe: spiel.zustand.tiefe, feinde: feindeDerEbene(spiel, ninkasi).length, besiegt: 0, erjagt: 0, felder: 0, erkundet: 0, ergebnis: null };
    ebenenListe.push(ebeneJetzt);
    phase = "erkunden";
  };
  const ebeneAbschliessen = (ergebnis) => {
    const ebene = spiel.zustand.ebene;
    let felder = 0, erkundet = 0;
    for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) {
      if (!passierbar(spiel, x, y)) continue;
      felder++;
      if (feldBekannt(ebene, x, y)) erkundet++;
    }
    Object.assign(ebeneJetzt, { besiegt: ebeneJetzt.feinde - feindeDerEbene(spiel, ninkasi).length, felder, erkundet, ergebnis });
  };

  ebeneBeginnen();
  const unerreichbar = new Set();
  let ergebnis = null, stillstand = 0, kampfwarten = 0, nachlauf = 0;
  while (!ergebnis) {
    erkundungBuchen();
    freieEpVerteilen(spiel, ninkasi);
    if (spiel.zustand.vorbei) { ergebnis = "tot"; break; }
    if (zaehler.befehle >= GRENZE_BEFEHLE) { ergebnis = "grenze"; break; }
    const lp = ninkasi.werte.lp.aktuell, lpHoechst = hoechstwert(spiel, ninkasi, "lp");

    // 1. Kampf, auch noch NACHLAUF Züge nach dem letzten wahrgenommenen Feind (sonst pendelt der Bot zwischen Kampf und
    // Erkunden, wenn ein Feind hinter einer Ecke verschwindet)
    if (wahrgenommeneFeinde(spiel).length) nachlauf = NACHLAUF;
    else if (nachlauf > 0) nachlauf--;
    if (nachlauf > 0 && feindeDerEbene(spiel, ninkasi).length) {
      let befehl = taktikbefehl(spiel, taktik);
      // die Taktik meidet Fallen und Gefahren; führt der einzige Weg darüber, wartet sie, und der Feind, der sie ebenso
      // meidet, auch: nach GRENZE_KAMPFWARTEN Zügen nimmt der Bot die Gefahr in Kauf
      kampfwarten = befehl.art === "warten" ? kampfwarten + 1 : 0;
      if (kampfwarten > GRENZE_KAMPFWARTEN) befehl = schrittOhneMeiden(spiel, ninkasi, positionenVon(spiel, feindeDerEbene(spiel, ninkasi).map((feind) => feind.id))) ?? befehl;
      if (kampfwarten > GRENZE_STILLSTAND) { ergebnis = "fest"; break; }
      protokoll?.("kampf", JSON.stringify(befehl), zaehler.befehle);
      if (!geben(befehl)) geben({ art: "warten" });
      continue;
    }
    // 2. Rasten
    if (lp * 100 < lpHoechst * rastenAb) {
      const vorher = spiel.zustand.zeit;
      const halt = ablaufLaufenLassen(spiel, rastenBeginnen(spiel, EINSTELLUNGEN), naechsterRastschritt, zaehler);
      protokoll?.("rasten", halt, zaehler.befehle);
      zaehler.rastzeit += spiel.zustand.zeit - vorher;
      if (halt === "voll" || halt === "schon_voll" || halt === "zu_lang" || halt === "gegner_in_sicht" || halt === "schaden") continue;
    }
    // 3. Aufheben
    const fund = naechsterFund(spiel, ninkasi, unerreichbar);
    if (fund) {
      const ziel = { x: fund.position.x, y: fund.position.y };
      const dort = ninkasi.position.x === ziel.x && ninkasi.position.y === ziel.y;
      const halt = dort ? "angekommen" : ablaufLaufenLassen(spiel, reiseBeginnen(spiel, ziel, EINSTELLUNGEN), naechsterReiseschritt, zaehler);
      protokoll?.("fund", halt, zaehler.befehle);
      if (halt === "angekommen") { if (!geben({ art: "aufheben" })) unerreichbar.add(`${ziel.x},${ziel.y}`); }
      else if (halt !== "gegner_in_sicht" && halt !== "schaden") unerreichbar.add(`${ziel.x},${ziel.y}`);
      continue;
    }
    // 4. Erkunden, immer wieder: ein Wesen oder eine Gefahr im Weg hält es nur für den Moment auf
    const befehleVorher = zaehler.befehle;
    let halt = ablaufLaufenLassen(spiel, erkundenBeginnen(spiel, EINSTELLUNGEN), naechsterErkundungsschritt, zaehler);
    // liegt das Unerkundete nur hinter einer bekannten Gefahr, nimmt der Bot sie in Kauf wie eine Spielerin, die noch
    // einmal erkundet (eingabe/erkunden.js, trotzGefahr)
    if (halt === "gefahr_im_weg") halt = ablaufLaufenLassen(spiel, erkundenBeginnen(spiel, EINSTELLUNGEN, { trotzGefahr: true }), naechsterErkundungsschritt, zaehler);
    protokoll?.("erkunden", halt, zaehler.befehle);
    if (halt === "alles_erkundet") phase = "jagd";
    else if (zaehler.befehle > befehleVorher) { stillstand = 0; continue; }
    // 5. Jagd auf die übrigen Feinde, auch solange das Erkunden nicht weiterkommt
    if (feindeDerEbene(spiel, ninkasi).length) {
      let befehl = taktikbefehl(spiel, taktik);
      if (befehl.art === "warten" && stillstand >= GRENZE_KAMPFWARTEN) befehl = schrittOhneMeiden(spiel, ninkasi, positionenVon(spiel, feindeDerEbene(spiel, ninkasi).map((feind) => feind.id))) ?? befehl;
      protokoll?.("jagd", JSON.stringify(befehl), zaehler.befehle);
      stillstand = befehl.art === "warten" || befehl.dx !== undefined && !befehl.angreifen ? stillstand + 1 : 0;
      if (stillstand > GRENZE_STILLSTAND) { ergebnis = "fest"; break; }
      if (!geben(befehl) && !geben({ art: "warten" })) { ergebnis = "fest"; break; }
      continue;
    }
    if (phase !== "jagd") {
      // keine Feinde mehr, aber das Erkunden kommt nicht weiter: warten, bis der Weg frei wird
      if (++stillstand > GRENZE_STILLSTAND) { ergebnis = "fest"; break; }
      geben({ art: "warten" });
      continue;
    }
    // 6. Ebene leer: auswerten, dann mit --ebenen über die Treppe hinab, ist der sichere Weg versperrt, auch über Gefahren
    if (!ebeneJetzt.ergebnis) ebeneAbschliessen("geraeumt");
    if (ebenenListe.length >= ebenen) { ergebnis = "geraeumt"; break; }
    const treppe = treppeHinab(spiel);
    if (!treppe) { ergebnis = "keine_treppe"; break; }
    if (ninkasi.position.x === treppe.x && ninkasi.position.y === treppe.y) {
      if (!geben({ art: "treppe" })) { ergebnis = "keine_treppe"; break; }
      unerreichbar.clear();
      stillstand = 0;
      ebeneBeginnen();
      continue;
    }
    const haltTreppe = ablaufLaufenLassen(spiel, reiseBeginnen(spiel, treppe, EINSTELLUNGEN), naechsterReiseschritt, zaehler);
    if (haltTreppe === "angekommen" || haltTreppe === "gegner_in_sicht" || haltTreppe === "schaden") continue;
    const schritt = schrittOhneMeiden(spiel, ninkasi, [treppe]);
    if (!schritt || ++stillstand > GRENZE_STILLSTAND || !geben(schritt)) { ergebnis = "keine_treppe"; break; }
  }
  erkundungBuchen();
  if (!ebeneJetzt.ergebnis) ebeneAbschliessen(ergebnis);
  // eine Meldung tod an Ninkasi gibt es auch, wenn etwas sie davor bewahrt; zählt nur, wenn der Lauf so endet
  const todesursache = ergebnis === "tot" ? letzteTodesursache : null;

  const skills = Object.fromEntries(LERNREIHENFOLGE.map((skill) => [skill, stufeVon(spiel, ninkasi, skill)]));
  const gesamt = ep.start + ep.erkundung + ep.gebunden + ep.freiAusBeute;
  return {
    startwert, ergebnis, todesursache, ebenen: ebenenListe, ep: { ...ep, gesamt },
    grundskillsAufFuenf: grundskillsAufFuenf(daten, gesamt), skills, lp: ninkasi.werte.lp.aktuell,
    zeit: spiel.zustand.zeit, ...zaehler, spiel,
  };
}

const positionenVon = (spiel, ids) => ids.map((id) => spiel.zustand.entitaeten[id].position);

// Ein Schritt zum nächsten der Ziele (Felder), ohne Fallen und Gefahren zu meiden; steht dort ein Feind, ein Angriff;
// sonst null
function schrittOhneMeiden(spiel, ninkasi, ziele) {
  let bester = null;
  for (const ziel of ziele) {
    const pfad = weg(spiel, ninkasi.position, ziel, { bewegung: bewegungVon(ninkasi), oeffnetTueren: true });
    if (pfad?.length && (!bester || pfad.length < bester.length)) bester = pfad;
  }
  if (!bester) return null;
  return { art: "bewegen", dx: bester[0].x - ninkasi.position.x, dy: bester[0].y - ninkasi.position.y, angreifen: true };
}

// Die Treppe hinab auf einem bekannten Feld
function treppeHinab(spiel) {
  const ebene = spiel.zustand.ebene;
  for (let y = 0; y < ebene.hoehe; y++) for (let x = 0; x < ebene.breite; x++) {
    if (feldBekannt(ebene, x, y) && bekanntesGelaendeAuf(spiel, x, y)?.treppe === "ab") return { x, y };
  }
  return null;
}

// Für wie viele Grundskills auf Stufe 5 die EP bei einer durchschnittlichen Ninkasi reichen (Rang des Grund-Tiers,
// Eigenschaften gleich verteilt, Lernpunkte = EP x 3 x Eigenschaft / bezugswert), auf Zehntel gerundet
export function grundskillsAufFuenf(daten, ep) {
  const { eigenschaftStart, eigenschaftPunkte, bezugswert, stufen, raengeNachTier } = daten.regeln.lernen;
  const anzahlEigenschaften = Object.keys(daten.eigenschaften).length;
  const lernpunkteJeEp = (3 * (eigenschaftStart * anzahlEigenschaften + eigenschaftPunkte)) / (anzahlEigenschaften * bezugswert);
  const jeGrundskill = stufen.reduce((summe, kosten) => summe + kosten, 0) * raengeNachTier[0];
  return Math.round((ep * lernpunkteJeEp * 10) / jeGrundskill) / 10;
}

// Nachspielen und vergleichen; wirft bei einer Abweichung
export function nachspielenPruefen(daten, spiel) {
  const nachgespielt = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
  if (JSON.stringify(nachgespielt.zustand) !== JSON.stringify(spiel.zustand)) throw new Error(`Startwert ${spiel.zustand.startwert}: Nachspielen weicht ab`);
}

const quantil = (werte, anteil) => {
  const sortiert = [...werte].sort((links, rechts) => links - rechts);
  return sortiert[Math.min(sortiert.length - 1, Math.floor(anteil * sortiert.length))];
};
const spanne = (werte) => `${quantil(werte, 0.5)}/${quantil(werte, 0.1)}/${quantil(werte, 0.9)}`;

function hauptprogramm(argumente) {
  const benannt = (name, vorgabe) => {
    const stelle = argumente.indexOf(name);
    return stelle >= 0 ? argumente.splice(stelle, 2)[1] : vorgabe;
  };
  const ebenen = Number(benannt("--ebenen", 1));
  const rastenAb = Number(benannt("--rasten", 60));
  const json = benannt("--json", null);
  const [laeufe = 20, ersterStartwert = 1] = argumente.map(Number);
  const daten = datenLaden(rohdaten, { texte });
  const ergebnisse = [];
  console.log(`Räumen: ${laeufe} Läufe ab Startwert ${ersterStartwert}, ${ebenen} Ebene(n), Rasten unter ${rastenAb} % LP`);
  console.log("Start  Ergebnis  Tiefe  Feinde besiegt/erjagt/alle  erkundet  EP Start/Erkundung/gebunden/frei = gesamt  Grundskills auf 5  Skills  Befehle  Zeit  Getränke  Würfe  Rastzeit");
  for (let startwert = ersterStartwert; startwert < ersterStartwert + laeufe; startwert++) {
    const lauf = laufRaeumen(daten, startwert, { ebenen, rastenAb });
    nachspielenPruefen(daten, lauf.spiel);
    delete lauf.spiel;
    ergebnisse.push(lauf);
    const letzte = lauf.ebenen.at(-1);
    const feinde = lauf.ebenen.map((ebene) => `${ebene.besiegt}/${ebene.erjagt}/${ebene.feinde}`).join(" ");
    const erkundet = lauf.ebenen.map((ebene) => `${Math.round((ebene.erkundet * 100) / Math.max(1, ebene.felder))} %`).join(" ");
    const { start, erkundung, gebunden, freiAusBeute, gesamt } = lauf.ep;
    console.log(`${String(startwert).padEnd(6)} ${(lauf.ergebnis + (lauf.todesursache ? ` (${lauf.todesursache})` : "")).padEnd(9)} ${String(letzte.tiefe).padEnd(6)} ${feinde.padEnd(27)} ${erkundet.padEnd(9)} ${`${start}/${erkundung}/${gebunden}/${freiAusBeute} = ${gesamt}`.padEnd(40)} ${String(lauf.grundskillsAufFuenf).padEnd(18)} ${Object.values(lauf.skills).join("/").padEnd(7)} ${String(lauf.befehle).padEnd(8)} ${String(lauf.zeit).padEnd(5)} ${String(lauf.getraenke).padEnd(9)} ${String(lauf.wuerfe).padEnd(6)} ${lauf.rastzeit}`);
  }
  const ueberlebt = ergebnisse.filter((lauf) => lauf.ergebnis !== "tot");
  console.log(`\n${ueberlebt.length} von ${ergebnisse.length} überlebt, ${ergebnisse.filter((lauf) => lauf.ergebnis === "geraeumt").length} geräumt; Median/P10/P90 über alle Läufe:`);
  const ersteEbene = ergebnisse.map((lauf) => lauf.ebenen[0]);
  console.log(`  erste Ebene: Feinde besiegt ${spanne(ersteEbene.map((ebene) => ebene.besiegt))} von ${spanne(ersteEbene.map((ebene) => ebene.feinde))}, erjagt ${spanne(ersteEbene.map((ebene) => ebene.erjagt))}, erkundet ${spanne(ersteEbene.map((ebene) => Math.round((ebene.erkundet * 100) / Math.max(1, ebene.felder))))} %`);
  for (const feld of ["erkundung", "gebunden", "freiAusBeute", "gesamt"]) console.log(`  EP ${feld}: ${spanne(ergebnisse.map((lauf) => lauf.ep[feld]))}`);
  console.log(`  Grundskills auf Stufe 5: ${spanne(ergebnisse.map((lauf) => lauf.grundskillsAufFuenf))}; Zeit ${spanne(ergebnisse.map((lauf) => lauf.zeit))}, Rastzeit ${spanne(ergebnisse.map((lauf) => lauf.rastzeit))}, Getränke ${spanne(ergebnisse.map((lauf) => lauf.getraenke))}, Würfe ${spanne(ergebnisse.map((lauf) => lauf.wuerfe))}`);
  const tode = ergebnisse.filter((lauf) => lauf.ergebnis === "tot").map((lauf) => `${lauf.startwert} (Tiefe ${lauf.ebenen.at(-1).tiefe}, ${lauf.todesursache})`);
  if (tode.length) console.log(`  Tode: ${tode.join(", ")}`);
  if (json) writeFileSync(json, JSON.stringify(ergebnisse, null, 2));
  console.log("0 Fehler");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) hauptprogramm(process.argv.slice(2));
