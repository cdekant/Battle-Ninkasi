// Seitenleiste: LP, MP, Pegel mit Schwellen, Gepäck, sichtbare Gegner, Startwert.
// Liest den Zustand nur.

import { spieler, holen } from "../kern/zustand.js";
import { maximum } from "../kern/werte.js";

function balken(name, wert, max, klasse, schwellen = []) {
  const anteil = max > 0 ? Math.round((wert / max) * 100) : 0;
  const marken = schwellen.map((s) => `<span class="schwelle" style="left:${Math.round((s / max) * 100)}%"></span>`).join("");
  return `<div class="wert ${klasse}">
    <div class="wert-kopf"><span>${name}</span><span>${wert} / ${max}</span></div>
    <div class="balken"><div class="fuellung" style="width:${anteil}%"></div>${marken}</div>
  </div>`;
}

export class Oberflaeche {
  constructor(element, texte, version) {
    this.el = element;
    this.texte = texte;
    this.version = version;
  }

  anzeigen(spiel) {
    const { t, form } = this.texte;
    const z = spiel.zustand;
    const p = spieler(z);
    const w = p.werte;
    const sichtbar = new Set(z.sichtbar);

    // Gepäck nach Typ zusammengefasst
    const gepaeck = {};
    for (const id of p.inventar) {
      const g = holen(z, id);
      if (g) gepaeck[g.text] = (gepaeck[g.text] || 0) + 1;
    }
    const gepaeckHtml = Object.keys(gepaeck).length
      ? Object.entries(gepaeck).map(([text, n]) => `<li>${form({ text }, "nom", "ohne")} x ${n}</li>`).join("")
      : `<li class="leise">${t("ui.leer")}</li>`;

    const gegner = Object.values(z.entitaeten).filter(
      (e) => e.position && e.fraktion !== undefined && e.fraktion !== p.fraktion && sichtbar.has(e.position.y * z.ebene.breite + e.position.x)
    );
    const gegnerHtml = gegner.length
      ? gegner.map((g) => `<li>${balken(form(g, "nom", "ohne"),g.werte.lp.aktuell, maximum(g, "lp"), "lp klein")}</li>`).join("")
      : `<li class="leise">${t("ui.niemand")}</li>`;

    this.el.innerHTML = `
      <h1>${form(p, "nom", "ohne")}</h1>
      ${balken(t("ui.lp"), w.lp.aktuell, maximum(p, "lp"), "lp")}
      ${balken(t("ui.mp"), w.mp.aktuell, maximum(p, "mp"), "mp")}
      <h2>${t("ui.pegel")}</h2>
      ${balken(t("ui.pp"), w.pp.aktuell, maximum(p, "pp"), "pegel", p.pegel.schwellen)}
      <h2>${t("ui.gepaeck")}</h2>
      <ul>${gepaeckHtml}</ul>
      <h2>${t("ui.in_sicht")}</h2>
      <ul class="gegner">${gegnerHtml}</ul>
      <div class="fuss">
        <div>${t("ui.startwert")}: ${z.startwert}</div>
        <div>${t("ui.zeit")}: ${z.zeit}</div>
        <div>${t("ui.version")}: ${this.version}</div>
        <div class="tasten">${t("ui.tasten")}</div>
      </div>`;
  }
}
