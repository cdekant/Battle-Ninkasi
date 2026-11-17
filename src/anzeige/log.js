// Log: übersetzt Meldungen in Textzeilen. Hört nur zu, verändert nichts.
// Unten 5 Zeilen, aufklappbar (Anzeige-Zustand).

import { satzanfang } from "./texte.js";

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
      case "schaden":
        return this.zeile(text("log.schaden", meldung), meldung.ziel.id === this.spielerinId ? "schlimm" : "");
      case "geheilt":
      case "wert_geaendert": {
        if (meldung.menge === 0) return;
        const vorzeichen = meldung.menge > 0 ? "+" : "";
        const platzhalter = { ...meldung, menge: vorzeichen + meldung.menge, wertName: text(`ui.${meldung.wertName}`) };
        return this.zeile(text(`log.${meldung.art}`, platzhalter), "gut");
      }
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
