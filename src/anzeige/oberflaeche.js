// Seitenleiste (docs/Oberflaeche.md, Seitenleiste): Kopf mit Ort und Zeit, Ninkasi (LP, MP, PP, Pegel als logarithmische
// Leiste mit Schwellen, freie EP, Heimlichkeit, laufende Aktion, Zustände, Last), Zielen und Untersuchen, Gefährten
// mit LP, Wesen in Sicht nach Abstand. Liest den Zustand nur. Inventar, Fähigkeiten, Charakter, Verlauf, Spielmenü und
// Hilfe sind Fenster über der Karte (anzeige/fenster.js), die Fähigkeiten stehen in der Schnellleiste
// (anzeige/bedienzeile.js); Startwert und Version zeigt das Spielmenü. Im Zielmodus (eingabe/zielmodus.js)
// steht, womit gezielt wird, was dagegen spricht und wen es mit welcher Trefferchance trifft; beim Untersuchen
// (Taste X, Rechtsklick) stattdessen, was Ninkasi über das Feld weiß (systeme/untersuchen.js), auf ihr selbst mit der
// Aufschlüsselung ihrer Werte. Die Liste In Sicht nennt Wachzustand, Zustände und laufende Aktion.
// tooltipHtml liefert die Kurzfassung eines Feldes für den Tooltip. Den Kopf mit Ort und Zeit liefert kopfHtml, die
// Minikarte darunter zeichnet anzeige/minikarte.js. Jedes Wesen in den Listen trägt data-wesen (seine ID); das Wesen
// mit hervorgehobenId (unter dem Zeiger auf der Karte oder dem Cursor beim Untersuchen) ist hervorgehoben.

import { spielerin, gesteuerteEntitaet, entitaetMitId } from "../kern/zustand.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { hoechstwert } from "../kern/werte.js";
import { optimalerPegel } from "../systeme/stoffwechsel.js";
import { promilleText, leistenanteil, TEILSTRICHE } from "./pegelanzeige.js";

import { anzahlVon } from "../systeme/inventar.js";
import { faehigkeitVon } from "../systeme/faehigkeiten.js";
import { lastText } from "./fenster.js";
import { feldBeschreiben, zustaendeVon, laufendeAktionVon, werteAufschluesseln, wesenBeschreiben } from "../systeme/untersuchen.js";
import { heimlichkeitsweite } from "../systeme/wahrnehmung.js";
import { lichtWirkt, lichtstufeAuf } from "../systeme/licht.js";

// Anzeige eines Modifikators nach Art (kern/werte.js)
const MODIFIKATOR_FORMEN = {
  plus: (betrag) => (betrag >= 0 ? `+${betrag}` : `${betrag}`),
  prozent: (betrag) => (betrag >= 0 ? `+${betrag} %` : `${betrag} %`),
  mal: (betrag) => `x ${betrag} %`,
  mindestens: (betrag) => `>= ${betrag}`,
  hoechstens: (betrag) => `<= ${betrag}`,
  setzen: (betrag) => `= ${betrag}`,
};

function balken(beschriftung, aktuellerWert, hoechsterWert, cssKlasse) {
  const fuellungProzent = hoechsterWert > 0 ? Math.round((aktuellerWert / hoechsterWert) * 100) : 0;
  return `<div class="wert ${cssKlasse}">
    <div class="wert-kopf"><span>${beschriftung}</span><span>${aktuellerWert} / ${hoechsterWert}</span></div>
    <div class="balken"><div class="fuellung" style="width:${fuellungProzent}%"></div></div>
  </div>`;
}

// Pegel nach oben offen: Leiste in Verdopplungsschritten, Schwellen, Optimum der LP, genauer Wert
function pegelLeiste(beschriftung, pegel, schwellen, optimumLp) {
  const prozentAufLeiste = (wert) => (leistenanteil(wert) * 100).toFixed(2);
  const schwellenMarken = schwellen
    .map((schwelle) => `<span class="schwelle" style="left:${prozentAufLeiste(schwelle)}%"></span>`)
    .join("");
  const optimumMarke = optimumLp === undefined ? "" : `<span class="optimum" style="left:${prozentAufLeiste(optimumLp)}%"></span>`;
  const teilstrichBeschriftung = TEILSTRICHE
    .map((teilstrich) => `<span style="left:${prozentAufLeiste(teilstrich)}%">${promilleText(teilstrich).replace(",0 ‰", "").replace(" ‰", "")}</span>`)
    .join("");
  return `<div class="wert pegel">
    <div class="wert-kopf"><span>${beschriftung}</span><span>${promilleText(pegel)}</span></div>
    <div class="balken"><div class="fuellung" style="width:${prozentAufLeiste(pegel)}%"></div>${schwellenMarken}${optimumMarke}</div>
    <div class="teilstriche">${teilstrichBeschriftung}</div>
  </div>`;
}

export class Oberflaeche {
  constructor(element, texte, version) {
    this.element = element;
    this.texte = texte;
    this.version = version;
  }

  // Chance aus systeme/vorschau.js als Text
  chanceText(chance) {
    const { text } = this.texte;
    if (chance === null) return text("ui.chance_offen");
    if (chance.sicher) return text("ui.sicher");
    return chance.hinterhalt ? `${chance.prozent} % (${text("ui.hinterhalt")})` : `${chance.prozent} %`;
  }

  // Zielmodus: Auswahl, Grund dagegen, Betroffene mit Chance; ziel = { modus, vorschau } oder null
  zielHtml(spiel, ziel) {
    if (!ziel) return "";
    const { text, nomenForm, hatSchluessel } = this.texte;
    const zustand = spiel.zustand;
    const { auswahl } = ziel.modus, vorschau = ziel.vorschau;
    const gegenstand = auswahl.zweck === "werfen" ? entitaetMitId(zustand, auswahl.gegenstandId) : null;
    const was = gegenstand ? `${text("ui.werfen")}: ${nomenForm(gegenstand, "akk", "bestimmt")}` : text(faehigkeitVon(spiel, auswahl.faehigkeit)?.text ?? "ui.zielen");
    const grundSchluessel = `log.abgelehnt.${vorschau.grund}`;
    const grund = vorschau.ok ? "" : `<li class="schlimm">${hatSchluessel(grundSchluessel) ? text(grundSchluessel) : vorschau.grund}</li>`;
    const betroffene = vorschau.betroffene.map(({ id, chance }) => {
      const wesen = entitaetMitId(zustand, id);
      return `<li>${nomenForm(wesen, "nom", "ohne")} <span class="chance">${this.chanceText(chance)}</span></li>`;
    });
    const niemand = vorschau.ok && !betroffene.length ? `<li class="leise">${text("ui.trifft_niemanden")}</li>` : "";
    return `<h2 class="offen">${text("ui.zielen")}</h2>
      <ul class="ziel offen"><li class="gewaehlt">${was}</li>${grund}${betroffene.join("")}${niemand}<li class="hinweis">${text("ui.zielen_hinweis")}</li></ul>`;
  }

  // Name eines Zustands mit Stärke (ab 2) und Restdauer
  zustandText(spiel, eintrag) {
    const { text, hatSchluessel } = this.texte;
    const schluessel = spiel.daten.zustaende?.[eintrag.name]?.text;
    const name = schluessel && hatSchluessel(schluessel) ? text(schluessel) : eintrag.name;
    const staerke = eintrag.staerke > 1 ? ` ${eintrag.staerke}` : "";
    const dauer = eintrag.zuege === null ? "" : ` <span class="leise">(${text("ui.abklingend", { zuege: eintrag.zuege })})</span>`;
    return `${name}${staerke}${dauer}`;
  }

  // Laufende Aktion: "Testritual: Schritt 2 von 5", unterbrochen markiert
  aktionText(spiel, aktion) {
    const { text, hatSchluessel } = this.texte;
    const definition = aktion.faehigkeit ? faehigkeitVon(spiel, aktion.faehigkeit) : null;
    const name = definition ? text(definition.text) : hatSchluessel(`ui.aktion.${aktion.art}`) ? text(`ui.aktion.${aktion.art}`) : aktion.art;
    const unterbrochen = aktion.unterbrochen ? ` <span class="schlimm">(${text("ui.unterbrochen")})</span>` : "";
    return `${name}: ${text("ui.schritt_von", { erledigt: aktion.erledigt, gesamt: aktion.gesamt })}${unterbrochen}`;
  }

  gelaendeText(spiel, name) {
    const schluessel = spiel.daten.gelaende[name]?.text;
    return schluessel ? this.texte.text(schluessel) : name;
  }

  // Oberfläche, Gas oder Feuer mit Menge
  schichtText(spiel, eintrag) {
    const { text } = this.texte;
    const arten = eintrag.schicht === "gas" ? spiel.daten.schichten.gase : spiel.daten.schichten.oberflaechen;
    const name = eintrag.schicht === "feuer" ? text("ui.feuer") : text(arten[eintrag.art]?.text ?? eintrag.art);
    // erinnerte Oberflächen haben keine Menge (systeme/untersuchen.js)
    return eintrag.menge === null ? name : `${name} <span class="leise">(${eintrag.menge})</span>`;
  }

  // Ein Wesen für Untersuchen und Tooltip; ausfuehrlich mit Zuständen, Aktion und Trefferchancen
  wesenZeilen(spiel, beschreibung, ausfuehrlich) {
    const { text, nomenForm } = this.texte;
    const wesen = entitaetMitId(spiel.zustand, beschreibung.id);
    const lp = beschreibung.lp ? ` <span class="leise">${text("ui.lp")} ${beschreibung.lp.aktuell} / ${beschreibung.lp.hoechst}</span>` : "";
    const wach = beschreibung.wachzustand ? ` <span class="leise">(${text(`ui.wachzustand.${beschreibung.wachzustand}`)})</span>` : "";
    const zeilen = [`<li class="gewaehlt">${nomenForm(wesen, "nom", "ohne")}${lp}${wach}</li>`];
    if (!ausfuehrlich) return zeilen;
    for (const eintrag of beschreibung.zustaende) zeilen.push(`<li>${this.zustandText(spiel, eintrag)}</li>`);
    if (beschreibung.laufendeAktion) zeilen.push(`<li>${this.aktionText(spiel, beschreibung.laufendeAktion)}</li>`);
    if (beschreibung.chanceNinkasi) zeilen.push(`<li>${text("ui.chance_ninkasi")} <span class="chance">${this.chanceText(beschreibung.chanceNinkasi)}</span></li>`);
    if (beschreibung.chanceGegen) zeilen.push(`<li>${text("ui.chance_gegen")} <span class="chance">${this.chanceText(beschreibung.chanceGegen)}</span></li>`);
    return zeilen;
  }

  // Aufschlüsselung der Werte eines Wesens (Untersuchen von Ninkasi)
  werteZeilen(spiel, wesen) {
    const { text, nomenForm, hatSchluessel } = this.texte;
    const herkunftText = (herkunft) => {
      if (herkunft.art === "gegenstand") {
        const gegenstand = entitaetMitId(spiel.zustand, herkunft.id);
        return gegenstand ? nomenForm(gegenstand, "nom", "ohne") : text("ui.herkunft.sonstige");
      }
      if (herkunft.art === "zustand" && herkunft.name) return this.zustandText(spiel, { name: herkunft.name, staerke: 1, zuege: null });
      return text(`ui.herkunft.${herkunft.art === "zustand" ? "sonstige" : herkunft.art}`);
    };
    return werteAufschluesseln(spiel, wesen).flatMap((eintrag) => {
      const name = hatSchluessel(`ui.wert.${eintrag.name}`) ? text(`ui.wert.${eintrag.name}`) : eintrag.name;
      const grund = eintrag.modifikatoren.length ? ` <span class="leise">(${text("ui.grundwert")} ${eintrag.grundwert})</span>` : "";
      const kopf = `<li>${name}${grund} <span class="chance">${eintrag.wert}</span></li>`;
      const modifikatoren = eintrag.modifikatoren.map((modifikator) =>
        `<li class="leise einzug">${MODIFIKATOR_FORMEN[modifikator.art]?.(modifikator.betrag) ?? modifikator.betrag} ${herkunftText(modifikator.herkunft)}</li>`);
      return [kopf, ...modifikatoren];
    });
  }

  // Alles, was Ninkasi über ein Feld weiß (systeme/untersuchen.js), als Listenpunkte; ausfuehrlich für die Seitenleiste
  feldZeilen(spiel, beschreibung, ausfuehrlich) {
    const { text, nomenForm } = this.texte;
    if (!beschreibung) return [`<li class="leise">${text("ui.unerkundet")}</li>`];
    const zustand = spiel.zustand;
    const zeilen = beschreibung.wesen.flatMap((wesen) => this.wesenZeilen(spiel, wesen, ausfuehrlich));
    // gespürte Wesen nur als Hinweis, ohne Art (systeme/sinne.js)
    if (beschreibung.gespuert) zeilen.push(`<li>${text("ui.gespuert")}${beschreibung.gespuert > 1 ? ` x ${beschreibung.gespuert}` : ""}</li>`);
    // ein unbekanntes Feld mit gespürten Wesen: kein Gelände
    if (beschreibung.gelaende === null) return [...zeilen, `<li class="leise">${text("ui.unerkundet")}</li>`];
    for (const id of beschreibung.gegenstaende) {
      const gegenstand = entitaetMitId(zustand, id);
      const anzahl = anzahlVon(gegenstand) > 1 ? ` x ${anzahlVon(gegenstand)}` : "";
      zeilen.push(`<li>${nomenForm(gegenstand, "nom", "ohne")}${anzahl}</li>`);
    }
    for (const id of beschreibung.fallen) zeilen.push(`<li class="schlimm">${nomenForm(entitaetMitId(zustand, id), "nom", "ohne")}</li>`);
    for (const bezug of beschreibung.erinnert.gegenstaende) zeilen.push(`<li>${nomenForm(bezug, "nom", "ohne")}${bezug.anzahl > 1 ? ` x ${bezug.anzahl}` : ""}</li>`);
    for (const bezug of beschreibung.erinnert.fallen) zeilen.push(`<li class="schlimm">${nomenForm(bezug, "nom", "ohne")}</li>`);
    for (const eintrag of beschreibung.schichten) zeilen.push(`<li>${this.schichtText(spiel, eintrag)}</li>`);
    const erinnert = beschreibung.sichtbar ? "" : ` <span class="leise">(${text("ui.erinnert")})</span>`;
    zeilen.push(`<li class="leise">${this.gelaendeText(spiel, beschreibung.gelaende)}${erinnert}</li>`);
    return zeilen;
  }

  // Untersuchen: das Feld unter dem Cursor; auf der gesteuerten Entität dazu ihre Werte
  untersuchenHtml(spiel, modus) {
    const { text } = this.texte;
    const gesteuerte = gesteuerteEntitaet(spiel.zustand);
    const beschreibung = feldBeschreiben(spiel, modus.cursor);
    const aufGesteuerter = modus.cursor.x === gesteuerte.position.x && modus.cursor.y === gesteuerte.position.y;
    const werte = aufGesteuerter ? this.werteZeilen(spiel, gesteuerte) : [];
    return `<h2 class="offen">${text("ui.untersuchen")}</h2>
      <ul class="untersuchen offen">${this.feldZeilen(spiel, beschreibung, true).join("")}${werte.join("")}<li class="hinweis">${text("ui.untersuchen_hinweis")}</li></ul>`;
  }

  // Kurzfassung eines Feldes für den Tooltip, leer bei unbekanntem Feld
  tooltipHtml(spiel, feld) {
    const beschreibung = feldBeschreiben(spiel, feld);
    return beschreibung ? `<ul>${this.feldZeilen(spiel, beschreibung, false).join("")}</ul>` : "";
  }

  // Heimlichkeitsweite, Licht auf ihrem Feld (nur, wo Licht wirkt), laufende Aktion und Zustände Ninkasis unter den Balken
  lageHtml(spiel, gesteuerte) {
    const { text } = this.texte;
    const zustaende = zustaendeVon(spiel, gesteuerte);
    const aktion = laufendeAktionVon(gesteuerte);
    const licht = lichtWirkt(spiel) && gesteuerte.position
      ? `<div class="leise">${text("ui.licht", { stufe: text(`licht.${lichtstufeAuf(spiel, gesteuerte.position.x, gesteuerte.position.y).name}`) })}</div>`
      : "";
    const heimlichkeit = `<div class="leise">${text("ui.heimlichkeit", { felder: heimlichkeitsweite(spiel, gesteuerte) })}</div>${licht}`;
    const aktionHtml = aktion ? `<div>${this.aktionText(spiel, aktion)}</div>` : "";
    const zustaendeHtml = zustaende.length
      ? `<h2>${text("ui.zustaende")}</h2><ul class="zustaende">${zustaende.map((eintrag) => `<li>${this.zustandText(spiel, eintrag)}</li>`).join("")}</ul>`
      : "";
    return `${heimlichkeit}${aktionHtml}${zustaendeHtml}`;
  }

  // Zusatz in der Gegnerliste: Wachzustand außer "jagt", Zustände, laufende Aktion
  gegnerZusatz(spiel, gegner) {
    const { text } = this.texte;
    const beschreibung = wesenBeschreiben(spiel, gegner);
    const teile = [];
    if (beschreibung.wachzustand && beschreibung.wachzustand !== "jagt") teile.push(text(`ui.wachzustand.${beschreibung.wachzustand}`));
    for (const eintrag of beschreibung.zustaende) teile.push(this.zustandText(spiel, { ...eintrag, zuege: null }));
    if (beschreibung.laufendeAktion) teile.push(text("ui.wirkt"));
    return teile.length ? `<div class="leise zusatz">${teile.join(", ")}</div>` : "";
  }

  // Wesen mit Position in Sicht außer Ninkasi, nach Abstand und ID, getrennt in Gefährten und die übrigen
  wesenInSicht(spiel) {
    const zustand = spiel.zustand;
    const gesteuerte = gesteuerteEntitaet(zustand);
    const sichtbareFelder = new Set(zustand.sichtbareFelder);
    const abstand = (wesen) => Math.max(Math.abs(wesen.position.x - gesteuerte.position.x), Math.abs(wesen.position.y - gesteuerte.position.y));
    const sichtbar = Object.values(zustand.entitaeten)
      .filter((entitaet) => entitaet.position && entitaet.fraktion !== undefined && entitaet.id !== gesteuerte.id
        && sichtbareFelder.has(entitaet.position.y * zustand.ebene.breite + entitaet.position.x))
      .sort((erstes, zweites) => abstand(erstes) - abstand(zweites) || erstes.id - zweites.id);
    const verbuendet = (wesen) => beziehungZwischen(spiel, urheberVon(gesteuerte), wesen) === "verbuendet";
    return { gefaehrten: sichtbar.filter(verbuendet), andere: sichtbar.filter((wesen) => !verbuendet(wesen)) };
  }

  wesenlisteHtml(spiel, liste, mitZusatz, hervorgehobenId) {
    const { nomenForm } = this.texte;
    return liste.map((wesen) => `<li data-wesen="${wesen.id}"${wesen.id === hervorgehobenId ? ' class="hervorgehoben"' : ""}>${balken(nomenForm(wesen, "nom", "ohne"), wesen.werte.lp.aktuell, hoechstwert(spiel, wesen, "lp"), "lp klein")}${mitZusatz ? this.gegnerZusatz(spiel, wesen) : ""}</li>`).join("");
  }

  // Kopf der Seitenleiste: Ort und Zeit, dahinter eine andere Spielart als "normal" (z.B. Testkammer)
  kopfHtml(spiel) {
    const ortUndZeit = this.texte.text("ui.ort_und_zeit", { tiefe: spiel.zustand.tiefe, zug: spielerin(spiel.zustand).zuege ?? 0 });
    const spielart = spiel.optionen?.spielart ?? "normal";
    return spielart === "normal" ? ortUndZeit : `${ortUndZeit} · ${this.texte.text(`ui.spielart.${spielart}`)}`;
  }

  // ziel: null | { modus, vorschau } (eingabe/zielmodus.js; beim Untersuchen ist vorschau null)
  // hervorgehobenId: ID des Wesens, das in den Listen hervorgehoben wird
  anzeigen(spiel, { ziel = null, hervorgehobenId = null } = {}) {
    const { text, nomenForm } = this.texte;
    const zustand = spiel.zustand;
    const gesteuerte = gesteuerteEntitaet(zustand);
    const werte = gesteuerte.werte;
    const { gefaehrten, andere } = this.wesenInSicht(spiel);
    const gefaehrtenHtml = gefaehrten.length ? `<h2>${text("ui.gefaehrten")}</h2><ul class="gefaehrten">${this.wesenlisteHtml(spiel, gefaehrten, false, hervorgehobenId)}</ul>` : "";
    const andereHtml = andere.length ? this.wesenlisteHtml(spiel, andere, true, hervorgehobenId) : `<li class="leise">${text("ui.niemand")}</li>`;

    this.element.innerHTML = `
      <section class="ninkasi">
        <h1>${nomenForm(gesteuerte, "nom", "ohne")}</h1>
        ${balken(text("ui.lp"), werte.lp.aktuell, hoechstwert(spiel, gesteuerte, "lp"), "lp")}
        ${balken(text("ui.mp"), werte.mp.aktuell, hoechstwert(spiel, gesteuerte, "mp"), "mp")}
        ${balken(text("ui.pp"), werte.pp.aktuell, hoechstwert(spiel, gesteuerte, "pp"), "pp")}
        ${pegelLeiste(text("ui.promille"), werte.pegel.aktuell, gesteuerte.stoffwechsel.schwellen || [], optimalerPegel(spiel, gesteuerte, "lp"))}
        <div class="freie-ep">${text("ui.freie_ep")}: <b>${spielerin(zustand).freieEp ?? 0}</b> <span class="leise">${text("ui.freie_ep_hinweis")}</span></div>
        ${this.lageHtml(spiel, gesteuerte)}
        <div class="leise last">${lastText(spiel, this.texte, gesteuerte)}</div>
      </section>
      ${ziel?.modus.auswahl.zweck === "untersuchen" ? this.untersuchenHtml(spiel, ziel.modus) : this.zielHtml(spiel, ziel)}
      ${gefaehrtenHtml}
      <h2>${text("ui.in_sicht")}</h2>
      <ul class="gegner">${andereHtml}</ul>`;
  }
}
