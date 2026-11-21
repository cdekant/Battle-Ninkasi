// Log: hört auf Spielmeldungen und zeigt sie in zwei Spalten, Geschehen und Kampf (docs/Oberflaeche.md, Log).
// Die Form der Zeilen entsteht ohne DOM in anzeige/logzeilen.js; hier liegen Zugmarke, Zusammenfassen und Darstellung.
// Nur was Ninkasi wahrnimmt (systeme/wahrnehmbar.js); Lärm, dessen Ursprung sie nicht sieht, hört sie als vage Zeile
// mit Richtung, höchstens eine je Zug (ZEIT_ZWISCHEN_GERAEUSCHEN).
// Zeile im Speicher: { zug, spalte, art, text, seite?, ton?, magisch?, zahlen?, anzahl }
// Wie viele Zeilen sichtbar sind, entscheidet das Layout (stil.css): jede Spalte zeigt die neuesten unten.
// Den ganzen Verlauf zeigt das Fenster "verlauf" (eingabe/verlauf.js, anzeige/fenster.js).

import { satzanfang } from "./texte.js";
import { zeilenAusMeldung, ARTEN, ZAHLENSPALTEN } from "./logzeilen.js";
import { spielerin } from "../kern/zustand.js";
import { meldungWahrnehmbar, geraeuschGehoert } from "../systeme/wahrnehmbar.js";

export const SPALTEN = ["geschehen", "kampf"];
const GEZEICHNETE_ZEILEN = 60; // je Spalte; mehr passt in keinem Layout
const HOECHSTE_ZEILENZAHL = 500;
const ZEIT_ZWISCHEN_GERAEUSCHEN = 100;
const VERBLASSEN_AB = 3; // die neuesten Zeilen bleiben voll, ältere werden in Stufen blasser
const VERBLASSEN_STUFEN = 4;

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (zeichen) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[zeichen]);

// HTML einer Zeile; vorher: die Zeile davor in derselben Liste (für den Strich zwischen den Zügen), alter: Stufe 0 bis 4
export function logzeileHtml(zeile, vorher, alter = 0) {
  const klassen = ["logzeile", `art-${zeile.art}`];
  if (zeile.seite) klassen.push(`seite-${zeile.seite}`);
  if (zeile.ton) klassen.push(`ton-${zeile.ton}`);
  if (zeile.magisch) klassen.push("magisch");
  if (vorher && vorher.zug !== zeile.zug) klassen.push("neuer-zug");
  if (alter) klassen.push(`alter-${alter}`);
  const anzahl = zeile.anzahl > 1 ? ` <span class="anzahl">x${zeile.anzahl}</span>` : "";
  // Kampfzeilen haben je Zahl eine feste Spalte (ZAHLENSPALTEN), auch wenn sie leer bleibt
  const zahlen = zeile.spalte === "kampf"
    ? ZAHLENSPALTEN.map((klasse) => {
      const zahl = (zeile.zahlen || []).find((eintrag) => eintrag.klasse === klasse);
      const titel = zahl?.titel ? ` title="${escapeHtml(zahl.titel)}"` : "";
      return `<span class="zahl ${klasse}"${titel}>${zahl ? escapeHtml(zahl.text) : ""}</span>`;
    }).join("")
    : "";
  return `<div class="${klassen.join(" ")}"><span class="zug">${vorher?.zug === zeile.zug ? "" : zeile.zug}</span>`
    + `<span class="symbol" aria-hidden="true">${ARTEN[zeile.art] ?? ""}</span><span class="text">${escapeHtml(zeile.text)}${anzahl}</span>`
    + `${zahlen}</div>`;
}

// Kopfzeile einer Spalte; im Kampf mit den Überschriften der Zahlen in denselben festen Spalten wie die Zeilen
export function logkopfHtml(texte, spalte) {
  const { text } = texte;
  if (spalte !== "kampf") return `<div class="logkopf"><span class="zug"></span><span class="symbol"></span><span class="text">${text(`log.spalte.${spalte}`)}</span></div>`;
  return `<div class="logkopf kampf"><span class="zug"></span><span class="symbol"></span><span class="text">${text("log.spalte.kampf")}</span>`
    + ZAHLENSPALTEN.map((klasse) => `<span class="zahl ${klasse}">${text(`log.spalte.${klasse}`)}</span>`).join("") + "</div>";
}

export class Log {
  constructor(element, texte) {
    this.element = element;
    this.texte = texte;
    this.zeilen = [];
    this.spiel = null;
    this.letztesGeraeusch = -Infinity;
  }

  leeren(spiel) {
    this.zeilen = [];
    this.spiel = spiel;
    this.letztesGeraeusch = -Infinity;
    this.anzeigen();
  }

  // Zugmarke: Zahl der Züge Ninkasis; ein Strich trennt ihre Aktionen
  zug() {
    return this.spiel ? spielerin(this.spiel.zustand)?.zuege ?? 0 : 0;
  }

  // Gehörter Lärm: eine Zeile je Zug, mit grober Richtung
  geraeusch(meldung) {
    const gehoert = geraeuschGehoert(this.spiel, meldung);
    if (!gehoert || meldung.zeit - this.letztesGeraeusch < ZEIT_ZWISCHEN_GERAEUSCHEN) return;
    this.letztesGeraeusch = meldung.zeit;
    const { text } = this.texte;
    this.zeile(text(`log.geraeusch.${gehoert.geraeusch}`, { richtung: text(`richtung.${gehoert.richtung ?? "nah"}`) }), "hinweis");
  }

  // Name eines Zustands aus seinen Daten
  zustandsname = (name) => {
    const { text, hatSchluessel } = this.texte;
    const schluessel = this.spiel.daten.zustaende?.[name]?.text;
    return schluessel && hatSchluessel(schluessel) ? text(schluessel) : name;
  };

  // Eine Zeile der Oberfläche (Ablehnung, Reise, Willkommen); art aus logzeilen.js ARTEN
  zeile(text, art = "geschehen") {
    this.hinzufuegen({ spalte: "geschehen", art, text });
  }

  // Gleiche Zeilen hintereinander in derselben Spalte werden zusammengefasst ("x3")
  hinzufuegen(beschreibung) {
    const zeile = { ...beschreibung, text: satzanfang(beschreibung.text), zug: this.zug(), anzahl: 1 };
    const letzte = this.zeilen.findLast((vorhanden) => vorhanden.spalte === zeile.spalte);
    if (letzte && letzte.text === zeile.text && JSON.stringify(letzte.zahlen) === JSON.stringify(zeile.zahlen)) {
      letzte.anzahl++;
      letzte.zug = zeile.zug;
    } else {
      this.zeilen.push(zeile);
      if (this.zeilen.length > HOECHSTE_ZEILENZAHL) this.zeilen.shift();
    }
    this.anzeigen();
  }

  // Hörer für Spielmeldungen
  melden = (meldung) => {
    if (meldung.art === "laerm") return this.geraeusch(meldung);
    if (!meldungWahrnehmbar(this.spiel, meldung)) return;
    for (const beschreibung of zeilenAusMeldung({ spiel: this.spiel, texte: this.texte, zustandsname: this.zustandsname }, meldung)) this.hinzufuegen(beschreibung);
  };

  anzeigen() {
    this.element.innerHTML = SPALTEN.map((spalte) => {
      const zeilen = this.zeilen.filter((zeile) => zeile.spalte === spalte).slice(-GEZEICHNETE_ZEILEN);
      const html = zeilen.map((zeile, stelle) => {
        const vonUnten = zeilen.length - 1 - stelle;
        const alter = Math.min(VERBLASSEN_STUFEN, Math.max(0, vonUnten - VERBLASSEN_AB + 1));
        return logzeileHtml(zeile, zeilen[stelle - 1], alter);
      }).join("");
      return `<section class="log-spalte" data-spalte="${spalte}">${logkopfHtml(this.texte, spalte)}<div class="log-zeilen">${html}</div></section>`;
    }).join("");
  }
}
