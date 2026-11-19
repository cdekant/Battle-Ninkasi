// Log: übersetzt Meldungen in Textzeilen. Hört nur zu, verändert nichts.
// Unten 5 Zeilen, aufklappbar (Anzeige-Zustand).

import { satzanfang } from "./texte.js";
import { promilleText } from "./pegelanzeige.js";

const SICHTBARE_ZEILEN = 5;
const HOECHSTE_ZEILENZAHL = 500;

export class Log {
  constructor(element, texte) {
    this.element = element;
    this.texte = texte;
    this.zeilen = [];
    this.aufgeklappt = false;
    this.spielerinId = null;
  }

  leeren(spielerinId) {
    this.zeilen = [];
    this.spielerinId = spielerinId;
    this.anzeigen();
  }

  zeile(text, cssKlasse = "") {
    this.zeilen.push({ text: satzanfang(text), cssKlasse });
    if (this.zeilen.length > HOECHSTE_ZEILENZAHL) this.zeilen.shift();
    this.anzeigen();
  }

  umschalten() {
    this.aufgeklappt = !this.aufgeklappt;
    this.anzeigen();
  }

  // Hörer für Spielmeldungen
  melden = (meldung) => {
    const { text, hatSchluessel } = this.texte;
    switch (meldung.art) {
      case "tod":
        if (meldung.opfer.id === this.spielerinId) return this.zeile(text("log.tod_ninkasi"), "schlimm");
        return this.zeile(text("log.tod", meldung), "gut");
      case "schaden": {
        const schluessel = meldung.immun ? "log.schaden_immun" : meldung.kritisch ? "log.schaden_kritisch" : "log.schaden";
        const art = meldung.schadensart && hatSchluessel(`schaden.${meldung.schadensart}`) ? text(`schaden.${meldung.schadensart}`) : "?";
        return this.zeile(text(schluessel, { ...meldung, art }), meldung.ziel.id === this.spielerinId ? "schlimm" : "");
      }
      case "faehigkeit":
        return this.zeile(text("log.faehigkeit", { ...meldung, faehigkeit: hatSchluessel(meldung.text) ? text(meldung.text) : meldung.faehigkeit }));
      case "aktion_beginnt":
        // angekündigte Angriffe: eigener Text der Fähigkeit, sonst still
        if (meldung.ankuendigung && hatSchluessel(meldung.ankuendigung)) this.zeile(text(meldung.ankuendigung, meldung), meldung.wer.id === this.spielerinId ? "" : "schlimm");
        return;
      case "population_voll":
        // ausdrücklicher Hinweis statt stillschweigend, auch auf der Konsole für die Entwicklung
        console.warn(`Obergrenze der Population erreicht (${meldung.hoechstWesen}), ${meldung.ausgefallen} Wesen entstehen nicht`);
        return this.zeile(text("log.population_voll", meldung), "hinweis");
      case "risiko": {
        const schluessel = `log.risiko.${meldung.ausgang}`;
        if (hatSchluessel(schluessel)) this.zeile(text(schluessel, meldung), "schlimm");
        return;
      }
      case "verfehlt":
        return this.zeile(text(meldung.grund === "geblockt" ? "log.geblockt" : "log.verfehlt", meldung));
      case "geheilt":
      case "wert_geaendert": {
        if (meldung.menge === 0) return;
        const vorzeichen = meldung.menge > 0 ? "+" : "";
        const menge = meldung.wertName === "pegel" ? promilleText(meldung.menge) : meldung.menge;
        const platzhalter = { ...meldung, menge: vorzeichen + menge, wertName: text(`ui.${meldung.wertName}`) };
        return this.zeile(text(`log.${meldung.art}`, platzhalter), "gut");
      }
      case "pegel_steigt":
      case "pegel_sinkt":
        return this.zeile(text(`log.${meldung.art}`, { ...meldung, schwelle: promilleText(meldung.schwelle) }));
      case "abgelehnt": {
        const schluessel = `log.abgelehnt.${meldung.grund}`;
        if (hatSchluessel(schluessel)) this.zeile(text(schluessel), "leise");
        return;
      }
      default: {
        const schluessel = `log.${meldung.art}`;
        if (hatSchluessel(schluessel)) this.zeile(text(schluessel, meldung));
      }
    }
  };

  anzeigen() {
    const angezeigteZeilen = this.aufgeklappt ? this.zeilen : this.zeilen.slice(-SICHTBARE_ZEILEN);
    this.element.classList.toggle("offen", this.aufgeklappt);
    this.element.replaceChildren(
      ...angezeigteZeilen.map((zeile) => {
        const div = document.createElement("div");
        div.textContent = zeile.text;
        if (zeile.cssKlasse) div.className = zeile.cssKlasse;
        return div;
      })
    );
    this.element.scrollTop = this.element.scrollHeight;
  }
}
