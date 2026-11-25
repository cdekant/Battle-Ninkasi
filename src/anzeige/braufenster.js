// Inhalt des Braufensters (Tastenlogik in eingabe/brauen.js, siehe docs/Bedienung.md, Fenster): oben Maische, Gewürz,
// Kultur und Füllung, links die Zutaten im Gepäck mit der Menge im Kessel, rechts die Vorschau je Achse als Bereich,
// dazu Portionen, Chance des Verderbens und erreichbare Zielgebiete. Prüfstand der Rechnung; das Spinnennetz folgt.
// Liest den Zustand nur; die Vorschau ist dieselbe Rechnung wie der Befehl (sudVorbereiten, systeme/brauen.js).

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { zutatenIm, sudVorbereiten, verderbenChance } from "../systeme/brauen.js";
import { KENNZAHLEN } from "../systeme/sud.js";
import { gelaendeAuf } from "../welt/karte.js";
import { braubefehl } from "../eingabe/brauen.js";
import { fensterinhaltAnmelden, buchstabeHtml, zielAttribut } from "./fenster.js";

// Kennzahlen in ihren Einheiten (Zehntel für Stammwürze und Alkohol), Aromen als Zahl
const EINHEITEN = { stammwuerze: " °P", alkohol: " %", bittere: " IBU", farbe: " EBC" };
const ZEHNTEL = ["stammwuerze", "alkohol"];
export function achsenwertText(achse, wert) {
  const zahl = ZEHNTEL.includes(achse) ? (wert / 10).toFixed(1).replace(".", ",") : String(wert);
  return zahl + (EINHEITEN[achse] ?? "");
}

function vorschauHtml(spiel, texte, ninkasi, zustand) {
  const { text, nomenForm } = texte;
  const vorbereitet = sudVorbereiten(spiel, ninkasi, braubefehl(spiel, zustand));
  if (vorbereitet.grund) return `<h2>${text("ui.brauen.vorschau")}</h2><p class="leise">${text(`log.abgelehnt.${vorbereitet.grund}`)}</p>`;
  const achsen = spiel.daten.regeln.brauen.achsen;
  const zeilen = Object.entries(vorbereitet.bereich).map(([achse, [unten, oben]]) => {
    const hoechstens = achsen[achse].hoechstens;
    const links = Math.floor((unten * 100) / hoechstens), breite = Math.max(1, Math.floor(((oben - unten) * 100) / hoechstens));
    const balken = `<span class="brau-balken"><span style="margin-left:${links}%;width:${breite}%"></span></span>`;
    const bereich = unten === oben ? achsenwertText(achse, unten) : `${achsenwertText(achse, unten)} – ${achsenwertText(achse, oben)}`;
    return `<tr${KENNZAHLEN.includes(achse) ? ' class="kennzahl"' : ""}><td>${text(`achse.${achse}`)}</td><td>${balken}</td><td>${bereich}</td></tr>`;
  });
  const erreichbar = vorbereitet.erreichbar.map((name) => nomenForm({ text: spiel.daten.zielgebiete[name].text }, "nom", "ohne"));
  const portionen = vorbereitet.portionen
    ? text("ui.brauen.portionen", { anzahl: vorbereitet.portionen })
    : `<span class="schlimm">${text("log.abgelehnt.keine_gefaesse")}</span>`;
  return `<h2>${text("ui.brauen.vorschau")}</h2><table class="brau-vorschau">${zeilen.join("")}</table><ul>
    <li>${portionen}</li>
    <li>${text("ui.brauen.verderben", { prozent: verderbenChance(spiel, ninkasi, vorbereitet) })}</li>
    <li>${text("ui.brauen.erreichbar")}: ${erreichbar.length ? erreichbar.join(", ") : text("ui.nichts")}</li>
  </ul>`;
}

fensterinhaltAnmelden("brauen", ({ spiel, texte }, zustand) => {
  const { text, nomenForm } = texte;
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const zutaten = zutatenIm(spiel, ninkasi);
  const fasst = gelaendeAuf(spiel, zustand.kessel.x, zustand.kessel.y)?.kessel?.fasst;
  const fuellung = zutaten.reduce((summe, zutat) => summe + (zustand.mengen[zutat.id] ?? 0), 0);
  const zeilen = zutaten.map((zutat, stelle) => {
    const menge = zustand.mengen[zutat.id] ?? 0;
    const imKessel = menge ? ` <span class="gut">→ ${menge}</span>` : "";
    return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${nomenForm(zutat, "nom", "zahl")}${imKessel}</li>`;
  });
  const kultur = zustand.kultur ? text(spiel.daten.kulturen[zustand.kultur].text) : text("ui.brauen.ohne_kultur");
  const kopf = [
    `${text("ui.brauen.maische")}: ${text(`maische.${zustand.maische}`)}`,
    `${text("ui.brauen.gewuerz")}: ${text(`gewuerz.${zustand.gewuerz}`)}`,
    `${text("ui.brauen.kultur")}: ${kultur}`,
    text("ui.brauen.fuellung", { menge: fuellung, fasst: fasst ?? "?" }),
  ].join(" · ");
  return {
    titel: text("ui.brauen"),
    kopf,
    liste: zutaten.length ? `<ul>${zeilen.join("")}</ul>` : `<p class="leise">${text("ui.brauen.keine_zutaten")}</p>`,
    details: vorschauHtml(spiel, texte, ninkasi, zustand),
    knoepfe: [
      { taste: { code: "Enter" }, text: text("ui.knopf.brauen") },
      { taste: { code: "Digit1" }, text: text("ui.brauen.maische") },
      { taste: { code: "Digit2" }, text: text("ui.brauen.gewuerz") },
      { taste: { code: "Digit3" }, text: text("ui.brauen.kultur") },
      { taste: { code: "Backspace" }, text: text("ui.knopf.leeren") },
    ],
    fuss: text("ui.brauen.hinweis"),
  };
});
