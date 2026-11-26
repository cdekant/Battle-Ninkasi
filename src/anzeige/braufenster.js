// Inhalt des Braufensters (Tastenlogik in eingabe/brauen.js, siehe docs/Bedienung.md, Fenster): oben Portionen,
// Füllung, Maische, Gewürz, Kultur und ob nach Rezept gebraut wird, links die Zutaten im Gepäck mit der Menge im Kessel
// oder die Rezepte im Buch (Tab), rechts die Vorschau als Spinnennetz (anzeige/spinnennetz.js) mit den Umrissen der
// aufgedeckten Zielgebiete, darunter je Achse der Bereich als Zahl, der Restzucker, die Chance des Verderbens und die
// erreichbaren Zielgebiete; kann noch nicht gebraut werden, steht das Netz ohne Vorschau da, darunter der Grund.
// Ohne Kultur ein Absud (systeme/absud.js): rechts Balken je Richtung mit der führenden hervorgehoben, die Mächtigkeit
// mit der Stärke, die Wirkung des gewählten Pols und die Chancen der drei Ausgänge, alles nach der Vermutung über
// unbekannte Kräuter (in der Liste mit "?"), oben die Absicht. Als Trockenbier abgefüllt (Taste 5): rechts die Würze
// ohne Gärung und ohne Zielgebiete, oben statt Kultur und Absicht das Abfüllen.
// Dazu das Fenster zum Anrühren von Trockenbier (eingabe/anruehren.js): Kulturen mit der Zeit oder dem Grund dagegen.
// Liest den Zustand nur; die Vorschau ist dieselbe Rechnung wie der Befehl (sudVorbereiten, systeme/brauen.js).

import { gesteuerteEntitaet } from "../kern/zustand.js";
import { zutatenIm, sudVorbereiten, verderbenChance, sauerChance } from "../systeme/brauen.js";
import { KENNZAHLEN, zielgebietFinden, SPONTAN, kulturBezug } from "../systeme/sud.js";
import { aufgedeckteZielgebiete } from "../systeme/rezepte.js";
import { absudregeln, krautUnbekannt, POLE } from "../systeme/absud.js";
import { braubefehl, rezepteImBuch } from "../eingabe/brauen.js";
import { kulturenZumAnruehren } from "../eingabe/anruehren.js";
import { anruehrenVorbereiten } from "../systeme/trockenbier.js";
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
  const zielgebiete = spiel.daten.zielgebiete ?? {};
  const achsen = spiel.daten.regeln.brauen.achsen;
  // im Nebel nur die aufgedeckten; hervorgehoben das der Mitte, sonst das erste erreichbare
  const aufgedeckt = aufgedeckteZielgebiete(spiel);
  const mitte = vorbereitet.grund ? null : zielgebietFinden(spiel.daten, vorbereitet.mitte)?.name;
  const imBlick = vorbereitet.grund ? null : aufgedeckt.includes(mitte) ? mitte : vorbereitet.erreichbar[0] ?? null;
  const umrisse = aufgedeckt.map((name) => ({ spannen: zielgebiete[name].spannen, hervorgehoben: name === imBlick }));
  // das Netz steht immer, damit das Fenster mit der ersten Zutat nicht springt; ohne Vorschau ohne Band und Punkt
  const netz = spinnennetzSvg(achsen, {
    bereich: vorbereitet.bereich ?? null, punkt: vorbereitet.mitte ?? null, umrisse, beschriftungen: achsenBeschriftungen(achsen, text), titel: text("ui.brauen.vorschau"),
  });
  if (vorbereitet.grund) return `<h2>${text("ui.brauen.vorschau")}</h2>${netz}<p class="leise">${text(`log.abgelehnt.${vorbereitet.grund}`)}</p>`;
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
    <li>${text("ui.brauen.sauer", { prozent: sauerChance(spiel, ninkasi, vorbereitet) })}</li>
    <li>${text("ui.brauen.erreichbar")}: ${erreichbar.length ? erreichbar.join(", ") : text("ui.nichts")}</li>
  </ul>`;
}

// Vorschau eines Trockenbiers (systeme/trockenbier.js): das Spinnennetz der Würze ohne Gärung und ohne Zielgebiete, darunter
// der Bereich je Achse und der Hinweis, dass Kultur und Zielgebiet erst beim Anrühren dazukommen
function trockenbierHtml(spiel, texte, vorbereitet) {
  const { text } = texte;
  const achsen = spiel.daten.regeln.brauen.achsen;
  const netz = spinnennetzSvg(achsen, {
    bereich: vorbereitet.bereich ?? null, punkt: vorbereitet.mitte ?? null, umrisse: [], beschriftungen: achsenBeschriftungen(achsen, text), titel: text("ui.brauen.trockenbier"),
  });
  const titel = `<h2>${text("ui.brauen.trockenbier")}</h2>`;
  if (vorbereitet.grund) return `${titel}${netz}<p class="leise">${text(`log.abgelehnt.${vorbereitet.grund}`)}</p>`;
  const zeilen = Object.entries(vorbereitet.bereich).filter(([achse]) => achse !== "alkohol").map(([achse, [unten, oben]]) => {
    const bereich = unten === oben ? achsenwertText(achse, unten) : `${achsenwertText(achse, unten)} – ${achsenwertText(achse, oben)}`;
    return `<tr${KENNZAHLEN.includes(achse) ? ' class="kennzahl"' : ""}><td>${text(`achse.${achse}`)}</td><td>${bereich}</td></tr>`;
  });
  return `${titel}${netz}<table class="brau-vorschau">${zeilen.join("")}</table><p class="leise">${text("ui.brauen.trockenbier_hinweis")}</p>`;
}

const balkenHtml = (wert, hoechstens) => `<span class="balken brau-balken"><span class="fuellung" style="width:${Math.min(100, Math.floor((wert * 100) / Math.max(1, hoechstens)))}%"></span></span>`;

// Vorschau des Absuds nach der Vermutung (vorbereitet.vermutet)
function absudHtml(spiel, texte, vorbereitet) {
  const { text } = texte;
  const titel = `<h2>${text("ui.brauen.absud")}</h2>`;
  if (vorbereitet.grund) return `${titel}<p class="leise">${text(`log.abgelehnt.${vorbereitet.grund}`)}</p>`;
  const { vermutet } = vorbereitet;
  const regeln = absudregeln(spiel.daten);
  const groesste = Math.max(...Object.values(vermutet.punkte), 1);
  const zeilen = Object.entries(vermutet.punkte).map(([richtung, punkte]) =>
    `<tr${richtung === vermutet.fuehrend ? ' class="fuehrend"' : ""}><td>${text(spiel.daten.absudrichtungen[richtung].text)}</td><td>${balkenHtml(punkte, groesste)}</td><td>${punkte}</td></tr>`);
  const richtungen = zeilen.length ? `<table class="brau-absud">${zeilen.join("")}</table>` : `<p class="schlimm">${text("ui.brauen.keine_richtung")}</p>`;
  const maechtigkeit = `<p>${text("ui.brauen.maechtigkeit", { wert: vermutet.maechtigkeit, staerke: vermutet.staerke })}${balkenHtml(vermutet.maechtigkeit, regeln.staerkeJe * regeln.hoechstStaerke)}</p>`;
  const wirkung = vermutet.stufe ? `<li>${text("ui.brauen.wirkung", { zustand: text(spiel.daten.zustaende[vermutet.stufe.zustand].text) })}</li>` : "";
  const gefaesse = vorbereitet.gefaesse >= vorbereitet.portionen ? "" : `<li class="schlimm">${text("log.abgelehnt.keine_gefaesse")}</li>`;
  const vermutung = vorbereitet.unbekannt.length ? `<li class="leise">${text("ui.brauen.vermutung")}</li>` : "";
  const { gelungen, umgeschlagen, misslungen } = vermutet.chancen;
  return `${titel}<h3>${text("ui.brauen.richtungen")}</h3>${richtungen}${maechtigkeit}<ul>
    ${gefaesse}${wirkung}
    <li>${text("ui.brauen.gelingt", { prozent: gelungen })}</li>
    <li>${text("ui.brauen.schlaegt_um", { prozent: umgeschlagen })}</li>
    <li>${text("ui.brauen.misslingt", { prozent: misslungen })}</li>
    ${vermutung}
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
    const unbekannt = krautUnbekannt(spiel, zutat.typ) ? ' <span class="leise">?</span>' : "";
    return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${nomenForm(zutat, "nom", "zahl")}${unbekannt}${imKessel}</li>`;
  });
  return `<h2>${text("ui.brauen.zutaten")}</h2><ul>${zeilen.join("")}</ul>`;
}

// Anrühren von Trockenbier (eingabe/anruehren.js): die Kulturen zur Wahl, darunter die Zeit, wenn der Kampf sie bremst,
// oder warum es nicht geht
fensterinhaltAnmelden("anruehren", ({ spiel, texte }, zustand) => {
  const { text, nomenForm } = texte;
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const trockenbier = spiel.zustand.entitaeten[zustand.gegenstandId];
  const kulturen = kulturenZumAnruehren(spiel);
  const zeilen = kulturen.map((kultur, stelle) => {
    const name = kultur === SPONTAN ? text("ui.brauen.spontan") : nomenForm(kulturBezug(spiel.daten, kultur), "nom", "ohne");
    const vorbereitet = anruehrenVorbereiten(spiel, ninkasi, { gegenstandId: zustand.gegenstandId, kultur });
    const zusatz = vorbereitet.grund ? ` <span class="schlimm">${text(`log.abgelehnt.${vorbereitet.grund}`)}</span>` : ` <span class="leise">${text("ui.anruehren.zeit", { zuege: (vorbereitet.zeit / 100).toFixed(1).replace(".", ",") })}</span>`;
    return `<li${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${name}${zusatz}</li>`;
  });
  return {
    titel: text("ui.anruehren"),
    kopf: trockenbier ? nomenForm(trockenbier, "nom", "zahl") : "",
    liste: zeilen.length ? `<ul>${zeilen.join("")}</ul>` : `<p class="leise">${text("ui.anruehren.keine_kultur")}</p>`,
    fuss: text("ui.anruehren.hinweis"),
  };
});

fensterinhaltAnmelden("brauen", ({ spiel, texte }, zustand) => {
  const { text, textNachZahl } = texte;
  const ninkasi = gesteuerteEntitaet(spiel.zustand);
  const fassen = zustand.portionen * spiel.daten.regeln.brauen.stueckeJePortion;
  const fuellung = zutatenIm(spiel, ninkasi).reduce((summe, zutat) => summe + (zustand.mengen[zutat.id] ?? 0), 0);
  const vorbereitet = sudVorbereiten(spiel, ninkasi, braubefehl(spiel, zustand));
  const kultur = zustand.kultur === SPONTAN ? text("ui.brauen.spontan") : zustand.kultur ? texte.nomenForm(kulturBezug(spiel.daten, zustand.kultur), "nom", "ohne") : text("ui.brauen.ohne_kultur");
  const rezept = vorbereitet.rezept ? spiel.zustand.rezepte[vorbereitet.rezept] : null;
  const trocken = zustand.abfuellen === "trocken";
  const kopf = [
    textNachZahl("ui.brauen.portionen", zustand.portionen, { anzahl: zustand.portionen }),
    text("ui.brauen.fuellung", { menge: fuellung, fassen }),
    `${text("ui.brauen.maische")}: ${text(`maische.${zustand.maische}`)}`,
    `${text("ui.brauen.gewuerz")}: ${text(`gewuerz.${zustand.gewuerz}`)}`,
    ...(trocken ? [] : [`${text("ui.brauen.kultur")}: ${kultur}`]),
    ...(!trocken && zustand.kultur === null ? [`${text("ui.brauen.absicht")}: ${text(`pol.${zustand.absicht ?? POLE[0]}`)}`] : []),
    `${text("ui.brauen.abfuellen")}: ${text(`ui.brauen.abfuellen.${zustand.abfuellen ?? "gefaesse"}`)}`,
    rezept ? `<span class="gut">${text("ui.brauen.nach_rezept", { rezept: rezeptName(spiel, texte, vorbereitet.rezept, rezept) })}</span>` : text("ui.brauen.frei"),
  ].join(" · ");
  const details = trocken ? trockenbierHtml(spiel, texte, vorbereitet) : zustand.kultur === null ? absudHtml(spiel, texte, vorbereitet) : vorschauHtml(spiel, texte, ninkasi, vorbereitet);
  return {
    titel: text("ui.brauen"),
    kopf,
    liste: listeHtml(spiel, texte, ninkasi, zustand),
    details,
    knoepfe: [
      { taste: { code: "Enter" }, text: text("ui.knopf.brauen") },
      { taste: { code: "Tab" }, text: text(zustand.liste === "rezepte" ? "ui.brauen.zutaten" : "ui.brauen.rezepte") },
      { taste: { code: "NumpadAdd", zeichen: "+" }, text: text("ui.brauen.mehr") },
      { taste: { code: "NumpadSubtract", zeichen: "-" }, text: text("ui.brauen.weniger") },
      { taste: { code: "Digit1" }, text: text("ui.brauen.maische") },
      { taste: { code: "Digit2" }, text: text("ui.brauen.gewuerz") },
      { taste: { code: "Digit3" }, text: text("ui.brauen.kultur") },
      { taste: { code: "Digit4" }, text: text("ui.brauen.absicht") },
      { taste: { code: "Digit5" }, text: text("ui.brauen.abfuellen") },
      { taste: { code: "Backspace" }, text: text("ui.knopf.leeren") },
    ],
    fuss: text("ui.brauen.hinweis"),
  };
});
