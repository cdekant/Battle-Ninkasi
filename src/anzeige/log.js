// Log: übersetzt Meldungen in Textzeilen. Hört nur zu, verändert nichts.
// Unten 5 Zeilen, aufklappbar (Anzeige-Zustand).

import { satzanfang } from "./texte.js";

const SICHTBAR = 5;
const MAX = 500;

export class Log {
  constructor(element, texte) {
    this.el = element;
    this.texte = texte;
    this.zeilen = [];
    this.offen = false;
    this.spielerId = null;
  }

  leeren(spielerId) {
    this.zeilen = [];
    this.spielerId = spielerId;
    this.anzeigen();
  }

  zeile(text, klasse = "") {
    this.zeilen.push({ text: satzanfang(text), klasse });
    if (this.zeilen.length > MAX) this.zeilen.shift();
    this.anzeigen();
  }

  umschalten() {
    this.offen = !this.offen;
    this.anzeigen();
  }

  // Hörer für Spielmeldungen
  melden = (m) => {
    const { t } = this.texte;
    switch (m.art) {
      case "tod":
        if (m.opfer.id === this.spielerId) return this.zeile(t("log.tod_ninkasi"), "schlimm");
        return this.zeile(t("log.tod", m), "gut");
      case "schaden":
        return this.zeile(t("log.schaden", m), m.ziel.id === this.spielerId ? "schlimm" : "");
      case "geheilt":
      case "wert_geaendert": {
        if (m.menge === 0) return;
        const vorzeichen = m.menge > 0 ? "+" : "";
        return this.zeile(t(`log.${m.art}`, { ...m, menge: vorzeichen + m.menge, wert: t(`ui.${m.wert}`) }), "gut");
      }
      case "abgelehnt": {
        const schluessel = `log.abgelehnt.${m.grund}`;
        if (this.texte.hat(schluessel)) this.zeile(t(schluessel), "leise");
        return;
      }
      default: {
        const schluessel = `log.${m.art}`;
        if (this.texte.hat(schluessel)) this.zeile(t(schluessel, m));
      }
    }
  };

  anzeigen() {
    const liste = this.offen ? this.zeilen : this.zeilen.slice(-SICHTBAR);
    this.el.classList.toggle("offen", this.offen);
    this.el.replaceChildren(
      ...liste.map((z) => {
        const div = document.createElement("div");
        div.textContent = z.text;
        if (z.klasse) div.className = z.klasse;
        return div;
      })
    );
    this.el.scrollTop = this.el.scrollHeight;
  }
}
