// Log: übersetzt Meldungen in Textzeilen. Hört nur zu, verändert nichts.
// Unten 5 Zeilen, aufklappbar (Anzeige-Zustand).
// Nur was Ninkasi wahrnimmt (systeme/wahrnehmbar.js); Lärm, dessen Ursprung sie nicht sieht, hört sie als vage Zeile
// mit Richtung, höchstens eine je Zug (ZEIT_ZWISCHEN_GERAEUSCHEN).

import { satzanfang } from "./texte.js";
import { promilleText } from "./pegelanzeige.js";
import { meldungWahrnehmbar, geraeuschGehoert } from "../systeme/wahrnehmbar.js";

const SICHTBARE_ZEILEN = 5;
const HOECHSTE_ZEILENZAHL = 500;
const ZEIT_ZWISCHEN_GERAEUSCHEN = 100;

export class Log {
  constructor(element, texte) {
    this.element = element;
    this.texte = texte;
    this.zeilen = [];
    this.aufgeklappt = false;
    this.spiel = null;
    this.spielerinId = null;
    this.letztesGeraeusch = -Infinity;
  }

  leeren(spiel) {
    this.zeilen = [];
    this.spiel = spiel;
    this.spielerinId = spiel.zustand.spielerinId;
    this.letztesGeraeusch = -Infinity;
    this.anzeigen();
  }

  // Gehörter Lärm: eine Zeile je Zug, mit grober Richtung
  geraeusch(meldung) {
    const gehoert = geraeuschGehoert(this.spiel, meldung);
    if (!gehoert || meldung.zeit - this.letztesGeraeusch < ZEIT_ZWISCHEN_GERAEUSCHEN) return;
    this.letztesGeraeusch = meldung.zeit;
    const { text } = this.texte;
    this.zeile(text(`log.geraeusch.${gehoert.geraeusch}`, { richtung: text(`richtung.${gehoert.richtung ?? "nah"}`) }), "leise");
  }

  // Name eines Zustands aus seinen Daten
  zustandsname(name) {
    const { text, hatSchluessel } = this.texte;
    const schluessel = this.spiel.daten.zustaende?.[name]?.text;
    return schluessel && hatSchluessel(schluessel) ? text(schluessel) : name;
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
    if (meldung.art === "laerm") return this.geraeusch(meldung);
    if (!meldungWahrnehmbar(this.spiel, meldung)) return;
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
      case "ebene_gewechselt":
        return this.zeile(text("log.ebene_gewechselt", { ...meldung, richtung: text(meldung.richtung === "ab" ? "ui.hinab" : "ui.hinauf") }));
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
      // Verschleiß und Flüche nur an Ninkasis Sachen; was anderswo verdirbt, bleibt still
      case "verdorben":
      case "kaputt":
        if (meldung.traegerin?.id === this.spielerinId) this.zeile(text(`log.${meldung.art}`, meldung), "schlimm");
        return;
      case "abgenutzt":
        if (meldung.wer.id === this.spielerinId) this.zeile(text("log.abgenutzt", meldung), "schlimm");
        return;
      case "fluch_entdeckt":
        if (meldung.wer.id === this.spielerinId) this.zeile(text("log.fluch_entdeckt", meldung), "schlimm");
        return;
      case "fluch_aufgehoben":
        if (meldung.wer.id === this.spielerinId) this.zeile(text("log.fluch_aufgehoben", meldung), "gut");
        return;
      // eigener Text des Zustands (log.zustand.<name>.beginnt), sonst der allgemeine
      case "zustand_beginnt":
      case "zustand_endet": {
        const vorgang = meldung.art === "zustand_beginnt" ? "beginnt" : "endet";
        const eigenerSchluessel = `log.zustand.${meldung.zustand}.${vorgang}`;
        const schluessel = hatSchluessel(eigenerSchluessel) ? eigenerSchluessel : `log.zustand_${vorgang}`;
        return this.zeile(text(schluessel, { ...meldung, zustand: this.zustandsname(meldung.zustand) }));
      }
      case "beschworen":
        return this.zeile(text(meldung.wer ? "log.beschworen" : "log.erschienen", meldung));
      // Skillsystem (systeme/skills.js, systeme/lernen.js): nur, was Ninkasi selbst lernt
      case "skillstufe":
      case "gelernt":
      case "skill_freigeschaltet":
        if (meldung.wer.id === this.spielerinId) this.zeile(text(`log.${meldung.art}`, { ...meldung, skill: hatSchluessel(meldung.text) ? text(meldung.text) : meldung.skill }), "gut");
        return;
      case "ep_erhalten":
        if (meldung.ep > 0) this.zeile(text("log.ep_erhalten", meldung), "leise");
        return;
      case "eigenschaft_geaendert": {
        if (meldung.wer.id !== this.spielerinId) return;
        const eigenschaft = text(this.spiel.daten.eigenschaften?.[meldung.eigenschaft]?.text ?? meldung.eigenschaft);
        return this.zeile(text("log.eigenschaft_geaendert", { eigenschaft, menge: (meldung.menge > 0 ? "+" : "") + meldung.menge }), meldung.menge > 0 ? "gut" : "schlimm");
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
