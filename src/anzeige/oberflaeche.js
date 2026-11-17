// Seitenleiste: LP, MP, Pegel mit Schwellen, Gepäck, sichtbare Gegner, Startwert.
// Liest den Zustand nur.

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { hoechstwert } from "../kern/werte.js";

function balken(beschriftung, aktuellerWert, hoechsterWert, cssKlasse, schwellen = []) {
  const fuellungProzent = hoechsterWert > 0 ? Math.round((aktuellerWert / hoechsterWert) * 100) : 0;
  const schwellenMarken = schwellen
    .map((schwelle) => `<span class="schwelle" style="left:${Math.round((schwelle / hoechsterWert) * 100)}%"></span>`)
    .join("");
  return `<div class="wert ${cssKlasse}">
    <div class="wert-kopf"><span>${beschriftung}</span><span>${aktuellerWert} / ${hoechsterWert}</span></div>
    <div class="balken"><div class="fuellung" style="width:${fuellungProzent}%"></div>${schwellenMarken}</div>
  </div>`;
}

export class Oberflaeche {
  constructor(element, texte, version) {
    this.element = element;
    this.texte = texte;
    this.version = version;
  }

  anzeigen(spiel) {
    const { text, nomenForm } = this.texte;
    const zustand = spiel.zustand;
    const ninkasi = spielerin(zustand);
    const werte = ninkasi.werte;
    const sichtbareFelder = new Set(zustand.sichtbareFelder);

    // Gepäck nach Typ zusammengefasst
    const anzahlNachText = {};
    for (const id of ninkasi.inventar) {
      const gegenstand = entitaetMitId(zustand, id);
      if (gegenstand) anzahlNachText[gegenstand.text] = (anzahlNachText[gegenstand.text] || 0) + 1;
    }
    const gepaeckHtml = Object.keys(anzahlNachText).length
      ? Object.entries(anzahlNachText).map(([textSchluessel, anzahl]) => `<li>${nomenForm({ text: textSchluessel }, "nom", "ohne")} x ${anzahl}</li>`).join("")
      : `<li class="leise">${text("ui.leer")}</li>`;

    const sichtbareGegner = Object.values(zustand.entitaeten).filter((entitaet) =>
      entitaet.position && entitaet.fraktion !== undefined && entitaet.fraktion !== ninkasi.fraktion
      && sichtbareFelder.has(entitaet.position.y * zustand.ebene.breite + entitaet.position.x)
    );
    const gegnerHtml = sichtbareGegner.length
      ? sichtbareGegner.map((gegner) => `<li>${balken(nomenForm(gegner, "nom", "ohne"), gegner.werte.lp.aktuell, hoechstwert(gegner, "lp"), "lp klein")}</li>`).join("")
      : `<li class="leise">${text("ui.niemand")}</li>`;

    this.element.innerHTML = `
      <h1>${nomenForm(ninkasi, "nom", "ohne")}</h1>
      ${balken(text("ui.lp"), werte.lp.aktuell, hoechstwert(ninkasi, "lp"), "lp")}
      ${balken(text("ui.mp"), werte.mp.aktuell, hoechstwert(ninkasi, "mp"), "mp")}
      <h2>${text("ui.pegel")}</h2>
      ${balken(text("ui.pp"), werte.pp.aktuell, hoechstwert(ninkasi, "pp"), "pegel", ninkasi.pegel.schwellen)}
      <h2>${text("ui.gepaeck")}</h2>
      <ul>${gepaeckHtml}</ul>
      <h2>${text("ui.in_sicht")}</h2>
      <ul class="gegner">${gegnerHtml}</ul>
      <div class="fuss">
        <div>${text("ui.startwert")}: ${zustand.startwert}</div>
        <div>${text("ui.zeit")}: ${zustand.zeit}</div>
        <div>${text("ui.version")}: ${this.version}</div>
        <div class="tasten">${text("ui.tasten")}</div>
      </div>`;
  }
}
