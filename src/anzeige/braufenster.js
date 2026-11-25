// Inhalt des Braufensters (Tastenlogik in eingabe/brauen.js, siehe docs/Bedienung.md, Fenster): oben Portionen,
// Füllung, Maische, Gewürz und Kultur, links die Zutaten im Gepäck mit der Menge im Kessel, rechts die Vorschau als
// Spinnennetz (anzeige/spinnennetz.js) mit den Umrissen der Zielgebiete, darunter je Achse der Bereich als Zahl, der
// Restzucker, die Chance des Verderbens und die erreichbaren Zielgebiete.
// Liest den Zustand nur; die Vorschau ist dieselbe Rechnung wie der Befehl (sudVorbereiten, systeme/brauen.js).

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { zutatenIm, sudVorbereiten, verderbenChance } from "../systeme/brauen.js";
import { KENNZAHLEN, zielgebietFinden } from "../systeme/sud.js";
import { braubefehl } from "../eingabe/brauen.js";
import { fensterinhaltAnmelden, buchstabeHtml, zielAttribut } from "./fenster.js";
import { spinnennetzSvg, achsenBeschriftungen } from "./spinnennetz.js";

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
  const zielgebiete = spiel.daten.zielgebiete ?? {};
  // hervorgehoben: das Zielgebiet der Mitte, sonst das erste erreichbare; noch ohne Nebel (docs/Systemausbau.md, Punkt 23)
  const imBlick = zielgebietFinden(spiel.daten, vorbereitet.mitte)?.name ?? vorbereitet.erreichbar[0] ?? null;
  const umrisse = Object.entries(zielgebiete).map(([name, zielgebiet]) => ({ spannen: zielgebiet.spannen, hervorgehoben: name === imBlick }));
  const netz = spinnennetzSvg(spiel.daten.regeln.brauen.achsen, {
    bereich: vorbereitet.bereich, punkt: vorbereitet.mitte, umrisse, beschriftungen: achsenBeschriftungen(spiel.daten.regeln.brauen.achsen, text), titel: text("ui.brauen.vorschau"),
  });
  const zeilen = Object.entries(vorbereitet.bereich).map(([achse, [unten, oben]]) => {
    const bereich = unten === oben ? achsenwertText(achse, unten) : `${achsenwertText(achse, unten)} – ${achsenwertText(achse, oben)}`;
    return `<tr${KENNZAHLEN.includes(achse) ? ' class="kennzahl"' : ""}><td>${text(`achse.${achse}`)}</td><td>${bereich}</td></tr>`;
  });
  const erreichbar = vorbereitet.erreichbar.map((name) => nomenForm({ text: zielgebiete[name].text }, "nom", "ohne"));
  const gefaesse = vorbereitet.gefaesse >= vorbereitet.portionen ? "" : `<li class="schlimm">${text("log.abgelehnt.keine_gefaesse")}</li>`;
  return `<h2>${text("ui.brauen.vorschau")}</h2>${netz}<table class="brau-vorschau">${zeilen.join("")}</table><ul>
    ${gefaesse}
    <li>${text("ui.brauen.restzucker", { wert: achsenwertText("stammwuerze", vorbereitet.gaerung.restzucker) })}</li>
    <li>${text("ui.brauen.verderben", { prozent: verderbenChance(spiel, ninkasi, vorbereitet) })}</li>
    <li>${text("ui.brauen.erreichbar")}: ${erreichbar.length ? erreichbar.join(", ") : text("ui.nichts")}</li>
  </ul>`;
}

fensterinhaltAnmelden("brauen", ({ spiel, texte }, zustand) => {
  const { text, textNachZahl, nomenForm } = texte;
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const zutaten = zutatenIm(spiel, ninkasi);
  const fassen = zustand.portionen * spiel.daten.regeln.brauen.stueckeJePortion;
  const fuellung = zutaten.reduce((summe, zutat) => summe + (zustand.mengen[zutat.id] ?? 0), 0);
  const zeilen = zutaten.map((zutat, stelle) => {
    const menge = zustand.mengen[zutat.id] ?? 0;
    const imKessel = menge ? ` <span class="gut">→ ${menge}</span>` : "";
    return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${nomenForm(zutat, "nom", "zahl")}${imKessel}</li>`;
  });
  const kultur = zustand.kultur ? text(spiel.daten.kulturen[zustand.kultur].text) : text("ui.brauen.ohne_kultur");
  const kopf = [
    textNachZahl("ui.brauen.portionen", zustand.portionen, { anzahl: zustand.portionen }),
    text("ui.brauen.fuellung", { menge: fuellung, fassen }),
    `${text("ui.brauen.maische")}: ${text(`maische.${zustand.maische}`)}`,
    `${text("ui.brauen.gewuerz")}: ${text(`gewuerz.${zustand.gewuerz}`)}`,
    `${text("ui.brauen.kultur")}: ${kultur}`,
  ].join(" · ");
  return {
    titel: text("ui.brauen"),
    kopf,
    liste: zutaten.length ? `<ul>${zeilen.join("")}</ul>` : `<p class="leise">${text("ui.brauen.keine_zutaten")}</p>`,
    details: vorschauHtml(spiel, texte, ninkasi, zustand),
    knoepfe: [
      { taste: { code: "Enter" }, text: text("ui.knopf.brauen") },
      { taste: { code: "NumpadAdd", zeichen: "+" }, text: text("ui.brauen.mehr") },
      { taste: { code: "NumpadSubtract", zeichen: "-" }, text: text("ui.brauen.weniger") },
      { taste: { code: "Digit1" }, text: text("ui.brauen.maische") },
      { taste: { code: "Digit2" }, text: text("ui.brauen.gewuerz") },
      { taste: { code: "Digit3" }, text: text("ui.brauen.kultur") },
      { taste: { code: "Backspace" }, text: text("ui.knopf.leeren") },
    ],
    fuss: text("ui.brauen.hinweis"),
  };
});
