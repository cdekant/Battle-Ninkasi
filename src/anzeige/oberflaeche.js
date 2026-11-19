// Seitenleiste: LP, MP, PP, Pegel als logarithmische Leiste mit Schwellen, Gepäck, sichtbare Gegner, Startwert.
// Liest den Zustand nur. Das Gepäck ist zugleich das Inventarfenster (eingabe/inventar.js): offen zeigt es Buchstaben,
// den gewählten Gegenstand und die Tasten der Handlungen; Angelegtes ist immer markiert.

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";
import { hoechstwert } from "../kern/werte.js";
import { optimalerPegel } from "../systeme/stoffwechsel.js";
import { promilleText, leistenanteil, TEILSTRICHE } from "./pegelanzeige.js";
import { istAngelegt } from "../systeme/ausruestung.js";
import { anzahlVon, ladungenVon, lastVon, tragkraftVon, lastZuschlag } from "../systeme/inventar.js";
import { BUCHSTABEN } from "../eingabe/inventar.js";

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

  // fenster: Zustand des Inventarfensters (null oder { gewaehlt }), siehe eingabe/inventar.js
  anzeigen(spiel, fenster = null) {
    const { text, nomenForm } = this.texte;
    const zustand = spiel.zustand;
    const ninkasi = spielerin(zustand);
    const werte = ninkasi.werte;
    const sichtbareFelder = new Set(zustand.sichtbareFelder);

    // Gepäck je Gegenstand; offen mit Buchstaben, angelegt markiert
    const gegenstaende = ninkasi.inventar.map((id) => entitaetMitId(zustand, id)).filter(Boolean);
    const gepaeckZeilen = gegenstaende.map((gegenstand, stelle) => {
      const buchstabe = fenster ? `<span class="buchstabe">${BUCHSTABEN[stelle] ?? " "})</span> ` : "";
      const angelegt = istAngelegt(ninkasi, gegenstand.id) ? ` <span class="leise">(${text("ui.angelegt")})</span>` : "";
      const gewaehlt = fenster?.gewaehlt === gegenstand.id ? ' class="gewaehlt"' : "";
      const anzahl = anzahlVon(gegenstand) > 1 ? ` x ${anzahlVon(gegenstand)}` : "";
      const ladungen = gegenstand.ladungen ? ` (${ladungenVon(gegenstand)}/${gegenstand.ladungen.hoechstens})` : "";
      return `<li${gewaehlt}>${buchstabe}${nomenForm(gegenstand, "nom", "ohne")}${anzahl}${ladungen}${angelegt}</li>`;
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
      ? sichtbareGegner.map((gegner) => `<li>${balken(nomenForm(gegner, "nom", "ohne"), gegner.werte.lp.aktuell, hoechstwert(spiel, gegner, "lp"), "lp klein")}</li>`).join("")
      : `<li class="leise">${text("ui.niemand")}</li>`;

    this.element.innerHTML = `
      <h1>${nomenForm(ninkasi, "nom", "ohne")}</h1>
      ${balken(text("ui.lp"), werte.lp.aktuell, hoechstwert(spiel, ninkasi, "lp"), "lp")}
      ${balken(text("ui.mp"), werte.mp.aktuell, hoechstwert(spiel, ninkasi, "mp"), "mp")}
      ${balken(text("ui.pp"), werte.pp.aktuell, hoechstwert(spiel, ninkasi, "pp"), "pp")}
      <h2>${text("ui.pegel")}</h2>
      ${pegelLeiste(text("ui.promille"), werte.pegel.aktuell, ninkasi.stoffwechsel.schwellen || [], optimalerPegel(spiel, ninkasi, "lp"))}
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
