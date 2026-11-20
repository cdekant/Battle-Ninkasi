// Seitenleiste: LP, MP, PP, Pegel als logarithmische Leiste mit Schwellen, Zielmodus, Fähigkeiten, Gepäck, sichtbare
// Gegner, Startwert. Liest den Zustand nur. Das Gepäck ist zugleich das Inventarfenster (eingabe/inventar.js): offen
// zeigt es Buchstaben, den gewählten Gegenstand und die Tasten der Handlungen; Angelegtes ist immer markiert.
// Ebenso sind die Fähigkeiten das Fähigkeitenfenster (eingabe/faehigkeiten.js). Im Zielmodus (eingabe/zielmodus.js)
// steht oben, womit gezielt wird, was dagegen spricht und wen es mit welcher Trefferchance trifft; beim Untersuchen
// (Taste X) stattdessen, was Ninkasi über das Feld weiß (systeme/untersuchen.js), auf ihr selbst mit der Aufschlüsselung
// ihrer Werte. Unter den Balken stehen Heimlichkeitsweite, laufende Aktion und Zustände; die Gegnerliste nennt
// Wachzustand, Zustände und laufende Aktion. tooltipHtml liefert die Kurzfassung eines Feldes für den Tooltip.

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { hoechstwert } from "../kern/werte.js";
import { optimalerPegel } from "../systeme/stoffwechsel.js";
import { promilleText, leistenanteil, TEILSTRICHE } from "./pegelanzeige.js";
import { istAngelegt, haltbarkeitProzent } from "../systeme/ausruestung.js";

// Stufen der Anzeige angefressener Gegenstände, die schlimmste zuerst (unter so viel Prozent der Haltbarkeit)
const VERSCHLEISS_STUFEN = [
  { unter: 25, text: "ui.zerfressen" },
  { unter: 50, text: "ui.stark_angefressen" },
  { unter: 75, text: "ui.angefressen" },
];
import { anzahlVon, ladungenVon, lastVon, tragkraftVon, lastZuschlag } from "../systeme/inventar.js";
import { BUCHSTABEN } from "../eingabe/inventar.js";
import { faehigkeitVon, faehigkeitFuer, verbrauchVon, zuegeBisBereit } from "../systeme/faehigkeiten.js";
import { feldBeschreiben, zustaendeVon, laufendeAktionVon, werteAufschluesseln, wesenBeschreiben } from "../systeme/untersuchen.js";
import { heimlichkeitsweite } from "../systeme/wahrnehmung.js";

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
    return `${name} <span class="leise">(${eintrag.menge})</span>`;
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
    for (const id of beschreibung.gegenstaende) {
      const gegenstand = entitaetMitId(zustand, id);
      const anzahl = anzahlVon(gegenstand) > 1 ? ` x ${anzahlVon(gegenstand)}` : "";
      zeilen.push(`<li>${nomenForm(gegenstand, "nom", "ohne")}${anzahl}</li>`);
    }
    for (const id of beschreibung.fallen) zeilen.push(`<li class="schlimm">${nomenForm(entitaetMitId(zustand, id), "nom", "ohne")}</li>`);
    for (const eintrag of beschreibung.schichten) zeilen.push(`<li>${this.schichtText(spiel, eintrag)}</li>`);
    const erinnert = beschreibung.sichtbar ? "" : ` <span class="leise">(${text("ui.erinnert")})</span>`;
    zeilen.push(`<li class="leise">${this.gelaendeText(spiel, beschreibung.gelaende)}${erinnert}</li>`);
    return zeilen;
  }

  // Untersuchen: das Feld unter dem Cursor; auf Ninkasi dazu ihre Werte
  untersuchenHtml(spiel, modus) {
    const { text } = this.texte;
    const ninkasi = spielerin(spiel.zustand);
    const beschreibung = feldBeschreiben(spiel, modus.cursor);
    const aufNinkasi = modus.cursor.x === ninkasi.position.x && modus.cursor.y === ninkasi.position.y;
    const werte = aufNinkasi ? this.werteZeilen(spiel, ninkasi) : [];
    return `<h2 class="offen">${text("ui.untersuchen")}</h2>
      <ul class="untersuchen offen">${this.feldZeilen(spiel, beschreibung, true).join("")}${werte.join("")}<li class="hinweis">${text("ui.untersuchen_hinweis")}</li></ul>`;
  }

  // Kurzfassung eines Feldes für den Tooltip, leer bei unbekanntem Feld
  tooltipHtml(spiel, feld) {
    const beschreibung = feldBeschreiben(spiel, feld);
    return beschreibung ? `<ul>${this.feldZeilen(spiel, beschreibung, false).join("")}</ul>` : "";
  }

  // Heimlichkeitsweite, laufende Aktion und Zustände Ninkasis unter den Balken
  lageHtml(spiel, ninkasi) {
    const { text } = this.texte;
    const zustaende = zustaendeVon(spiel, ninkasi);
    const aktion = laufendeAktionVon(ninkasi);
    const heimlichkeit = `<div class="leise">${text("ui.heimlichkeit", { felder: heimlichkeitsweite(spiel, ninkasi) })}</div>`;
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

  // Fähigkeiten mit Verbrauch und Abklingzeit; offen mit Buchstaben
  faehigkeitenHtml(spiel, ninkasi, offen) {
    const namen = ninkasi.faehigkeiten || [];
    if (!namen.length && !offen) return "";
    const { text } = this.texte;
    const zeilen = namen.map((name, stelle) => {
      const definition = faehigkeitFuer(spiel, ninkasi, name);
      const buchstabe = offen ? `<span class="buchstabe">${BUCHSTABEN[stelle] ?? " "})</span> ` : "";
      const verbrauch = Object.entries(verbrauchVon(spiel, ninkasi, definition))
        .filter(([, menge]) => menge > 0)
        .map(([wertName, menge]) => `${menge} ${text(`ui.${wertName}`)}`).join(", ");
      const zuege = zuegeBisBereit(ninkasi, name);
      const abklingend = zuege > 0 ? ` <span class="schlimm">(${text("ui.abklingend", { zuege })})</span>` : "";
      return `<li>${buchstabe}${text(definition.text)}${verbrauch ? ` <span class="leise">${verbrauch}</span>` : ""}${abklingend}</li>`;
    });
    const hinweis = offen ? `<li class="hinweis">${text(namen.length ? "ui.faehigkeiten_waehlen" : "ui.faehigkeiten_keine")}</li>` : "";
    return `<h2${offen ? ' class="offen"' : ""}>${text("ui.faehigkeiten")}</h2>
      <ul class="faehigkeiten${offen ? " offen" : ""}">${zeilen.join("")}${hinweis}</ul>`;
  }

  // fenster: { inventar: null | { gewaehlt } (eingabe/inventar.js), faehigkeiten: null | {} (eingabe/faehigkeiten.js),
  //            ziel: null | { modus, vorschau } (eingabe/zielmodus.js; beim Untersuchen ist vorschau null) }
  anzeigen(spiel, { inventar: fenster = null, faehigkeiten: faehigkeitenFenster = null, ziel = null } = {}) {
    const { text, nomenForm } = this.texte;
    const zustand = spiel.zustand;
    const ninkasi = spielerin(zustand);
    const werte = ninkasi.werte;
    const sichtbareFelder = new Set(zustand.sichtbareFelder);

    // Zusatz für angefressene und als verflucht bekannte Gegenstände (systeme/verschleiss.js, systeme/ausruestung.js)
    const verschleissText = (gegenstand) => {
      const prozent = haltbarkeitProzent(gegenstand);
      const stufe = VERSCHLEISS_STUFEN.find((eintrag) => prozent < eintrag.unter);
      const angefressen = stufe ? ` <span class="schlimm">(${text(stufe.text)}, ${prozent} %)</span>` : "";
      const verflucht = gegenstand.fluchBekannt ? ` <span class="schlimm">(${text("ui.verflucht")})</span>` : "";
      return angefressen + verflucht;
    };

    // Gepäck je Gegenstand; offen mit Buchstaben, angelegt markiert
    const gegenstaende = ninkasi.inventar.map((id) => entitaetMitId(zustand, id)).filter(Boolean);
    const gepaeckZeilen = gegenstaende.map((gegenstand, stelle) => {
      const buchstabe = fenster ? `<span class="buchstabe">${BUCHSTABEN[stelle] ?? " "})</span> ` : "";
      const angelegt = istAngelegt(ninkasi, gegenstand.id) ? ` <span class="leise">(${text("ui.angelegt")})</span>` : "";
      const gewaehlt = fenster?.gewaehlt === gegenstand.id ? ' class="gewaehlt"' : "";
      const anzahl = anzahlVon(gegenstand) > 1 ? ` x ${anzahlVon(gegenstand)}` : "";
      const ladungen = gegenstand.ladungen ? ` (${ladungenVon(gegenstand)}/${gegenstand.ladungen.hoechstens})` : "";
      return `<li${gewaehlt}>${buchstabe}${nomenForm(gegenstand, "nom", "ohne")}${anzahl}${ladungen}${verschleissText(gegenstand)}${angelegt}</li>`;
    });
    // offen immer mit Hinweis, auch bei leerem Gepäck, sonst sähe das Öffnen aus, als geschähe nichts
    const hinweisSchluessel = !gegenstaende.length ? "ui.inventar_leer" : fenster?.gewaehlt === null ? "ui.inventar_waehlen" : "ui.inventar_handeln";
    const hinweis = fenster ? `<li class="hinweis">${text(hinweisSchluessel)}</li>` : "";
    const kilo = (gramm) => (gramm / 1000).toFixed(1).replace(".", ",");
    const ueberladen = lastZuschlag(spiel, ninkasi) ? ` <span class="schlimm">${text("ui.ueberladen")}</span>` : "";
    const lastZeile = `<div class="leise">${text("ui.last")} ${kilo(lastVon(spiel, ninkasi))} / ${kilo(tragkraftVon(spiel, ninkasi))} kg${ueberladen}</div>`;
    const gepaeckHtml = (gepaeckZeilen.length ? gepaeckZeilen.join("") : `<li class="leise">${text("ui.leer")}</li>`) + hinweis;

    const sichtbareGegner = Object.values(zustand.entitaeten).filter((entitaet) =>
      entitaet.position && entitaet.fraktion !== undefined && entitaet.id !== ninkasi.id
      && beziehungZwischen(spiel, urheberVon(ninkasi), entitaet) !== "verbuendet"
      && sichtbareFelder.has(entitaet.position.y * zustand.ebene.breite + entitaet.position.x)
    );
    const gegnerHtml = sichtbareGegner.length
      ? sichtbareGegner.map((gegner) => `<li>${balken(nomenForm(gegner, "nom", "ohne"), gegner.werte.lp.aktuell, hoechstwert(spiel, gegner, "lp"), "lp klein")}${this.gegnerZusatz(spiel, gegner)}</li>`).join("")
      : `<li class="leise">${text("ui.niemand")}</li>`;

    this.element.innerHTML = `
      <h1>${nomenForm(ninkasi, "nom", "ohne")}</h1>
      ${balken(text("ui.lp"), werte.lp.aktuell, hoechstwert(spiel, ninkasi, "lp"), "lp")}
      ${balken(text("ui.mp"), werte.mp.aktuell, hoechstwert(spiel, ninkasi, "mp"), "mp")}
      ${balken(text("ui.pp"), werte.pp.aktuell, hoechstwert(spiel, ninkasi, "pp"), "pp")}
      <h2>${text("ui.pegel")}</h2>
      ${pegelLeiste(text("ui.promille"), werte.pegel.aktuell, ninkasi.stoffwechsel.schwellen || [], optimalerPegel(spiel, ninkasi, "lp"))}
      ${this.lageHtml(spiel, ninkasi)}
      ${ziel?.modus.auswahl.zweck === "untersuchen" ? this.untersuchenHtml(spiel, ziel.modus) : this.zielHtml(spiel, ziel)}
      ${this.faehigkeitenHtml(spiel, ninkasi, Boolean(faehigkeitenFenster))}
      <h2${fenster ? ' class="offen"' : ""}>${text(fenster ? "ui.inventar" : "ui.gepaeck")}</h2>
      ${lastZeile}
      <ul class="gepaeck${fenster ? " offen" : ""}">${gepaeckHtml}</ul>
      <h2>${text("ui.in_sicht")}</h2>
      <ul class="gegner">${gegnerHtml}</ul>
      <div class="fuss">
        <div>${text("ui.startwert")}: ${zustand.startwert}</div>
        <div>${text("ui.zeit")}: ${zustand.zeit}</div>
        <div>${text("ui.tiefe")}: ${zustand.tiefe}</div>
        <div>${text("ui.version")}: ${this.version}</div>
        <div class="tasten">${text("ui.tasten")}</div>
      </div>`;
  }
}
