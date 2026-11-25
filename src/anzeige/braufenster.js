// Inhalt des Braufensters (Tastenlogik in eingabe/brauen.js, siehe docs/Bedienung.md, Fenster): oben Portionen,
// Füllung, Maische, Gewürz, Kultur und ob nach Rezept gebraut wird, links die Zutaten im Gepäck mit der Menge im Kessel
// oder die Rezepte im Buch (Tab), rechts die Vorschau als Spinnennetz (anzeige/spinnennetz.js) mit den Umrissen der
// aufgedeckten Zielgebiete, darunter je Achse der Bereich als Zahl, der Restzucker, die Chance des Verderbens und die
// erreichbaren Zielgebiete.
// Liest den Zustand nur; die Vorschau ist dieselbe Rechnung wie der Befehl (sudVorbereiten, systeme/brauen.js).

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { zutatenIm, sudVorbereiten, verderbenChance } from "../systeme/brauen.js";
import { KENNZAHLEN, zielgebietFinden } from "../systeme/sud.js";
import { aufgedeckteZielgebiete } from "../systeme/rezepte.js";
import { braubefehl, rezepteImBuch } from "../eingabe/brauen.js";
import { fensterinhaltAnmelden, buchstabeHtml, zielAttribut } from "./fenster.js";
import { spinnennetzSvg, achsenBeschriftungen } from "./spinnennetz.js";

// Kennzahlen in ihren Einheiten (Zehntel für Stammwürze und Alkohol), Aromen als Zahl
const EINHEITEN = { stammwuerze: " °P", alkohol: " %", bittere: " IBU", farbe: " EBC" };
const ZEHNTEL = ["stammwuerze", "alkohol"];
export function achsenwertText(achse, wert) {
  const zahl = ZEHNTEL.includes(achse) ? (wert / 10).toFixed(1).replace(".", ",") : String(wert);
  return zahl + (EINHEITEN[achse] ?? "");
}

// Name eines Rezepts im Buch: ein gefundenes mit seinem Text, ein Hausrezept nach seinem Zielgebiet
export function rezeptName(spiel, texte, schluessel, rezept) {
  if (rezept.art === "gefunden") return texte.text(spiel.daten.rezepte[schluessel].text);
  return texte.text("ui.brauen.hausrezept", { zielgebiet: texte.nomenForm({ text: spiel.daten.zielgebiete[rezept.zielgebiet].text }, "nom", "ohne") });
}

function vorschauHtml(spiel, texte, ninkasi, vorbereitet) {
  const { text, nomenForm } = texte;
  if (vorbereitet.grund) return `<h2>${text("ui.brauen.vorschau")}</h2><p class="leise">${text(`log.abgelehnt.${vorbereitet.grund}`)}</p>`;
  const zielgebiete = spiel.daten.zielgebiete ?? {};
  // im Nebel nur die aufgedeckten; hervorgehoben das der Mitte, sonst das erste erreichbare
  const aufgedeckt = aufgedeckteZielgebiete(spiel);
  const mitte = zielgebietFinden(spiel.daten, vorbereitet.mitte)?.name;
  const imBlick = aufgedeckt.includes(mitte) ? mitte : vorbereitet.erreichbar[0] ?? null;
  const umrisse = aufgedeckt.map((name) => ({ spannen: zielgebiete[name].spannen, hervorgehoben: name === imBlick }));
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

// Linke Liste: Zutaten mit der Menge im Kessel oder Rezepte mit Portionen und Güte
function listeHtml(spiel, texte, ninkasi, zustand) {
  const { text, nomenForm } = texte;
  if (zustand.liste === "rezepte") {
    const rezepte = rezepteImBuch(spiel);
    if (!rezepte.length) return `<h2>${text("ui.brauen.rezepte")}</h2><p class="leise">${text("ui.brauen.keine_rezepte")}</p>`;
    const zeilen = rezepte.map(([schluessel, rezept], stelle) => {
      const zeile = text("ui.brauen.rezept_zeile", { rezept: rezeptName(spiel, texte, schluessel, rezept), portionen: rezept.portionen, guete: rezept.guete });
      return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${zeile}</li>`;
    });
    return `<h2>${text("ui.brauen.rezepte")}</h2><ul>${zeilen.join("")}</ul>`;
  }
  const zutaten = zutatenIm(spiel, ninkasi);
  if (!zutaten.length) return `<h2>${text("ui.brauen.zutaten")}</h2><p class="leise">${text("ui.brauen.keine_zutaten")}</p>`;
  const zeilen = zutaten.map((zutat, stelle) => {
    const menge = zustand.mengen[zutat.id] ?? 0;
    const imKessel = menge ? ` <span class="gut">→ ${menge}</span>` : "";
    return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${nomenForm(zutat, "nom", "zahl")}${imKessel}</li>`;
  });
  return `<h2>${text("ui.brauen.zutaten")}</h2><ul>${zeilen.join("")}</ul>`;
}

fensterinhaltAnmelden("brauen", ({ spiel, texte }, zustand) => {
  const { text, textNachZahl } = texte;
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const fassen = zustand.portionen * spiel.daten.regeln.brauen.stueckeJePortion;
  const fuellung = zutatenIm(spiel, ninkasi).reduce((summe, zutat) => summe + (zustand.mengen[zutat.id] ?? 0), 0);
  const vorbereitet = sudVorbereiten(spiel, ninkasi, braubefehl(spiel, zustand));
  const kultur = zustand.kultur ? text(spiel.daten.kulturen[zustand.kultur].text) : text("ui.brauen.ohne_kultur");
  const rezept = vorbereitet.rezept ? spiel.zustand.rezepte[vorbereitet.rezept] : null;
  const kopf = [
    textNachZahl("ui.brauen.portionen", zustand.portionen, { anzahl: zustand.portionen }),
    text("ui.brauen.fuellung", { menge: fuellung, fassen }),
    `${text("ui.brauen.maische")}: ${text(`maische.${zustand.maische}`)}`,
    `${text("ui.brauen.gewuerz")}: ${text(`gewuerz.${zustand.gewuerz}`)}`,
    `${text("ui.brauen.kultur")}: ${kultur}`,
    rezept ? `<span class="gut">${text("ui.brauen.nach_rezept", { rezept: rezeptName(spiel, texte, vorbereitet.rezept, rezept) })}</span>` : text("ui.brauen.frei"),
  ].join(" · ");
  return {
    titel: text("ui.brauen"),
    kopf,
    liste: listeHtml(spiel, texte, ninkasi, zustand),
    details: vorschauHtml(spiel, texte, ninkasi, vorbereitet),
    knoepfe: [
      { taste: { code: "Enter" }, text: text("ui.knopf.brauen") },
      { taste: { code: "Tab" }, text: text(zustand.liste === "rezepte" ? "ui.brauen.zutaten" : "ui.brauen.rezepte") },
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
