// Anzeige des Fensterstapels (eingabe/fenster.js) über der Karte, nach der Grammatik aus docs/Oberflaeche.md:
// Titel mit dem Weg durch den Stapel, darunter wahlweise ein Kopf, links die Liste, rechts die Einzelheiten des
// Gewählten, unten die Fußzeile mit den gültigen Tasten. Gezeigt wird nur das oberste Fenster. Liest den Zustand nur.
// Jede Fensterart meldet hier ihren Inhalt an: (umgebung, zustand) => { titel, kopf?, liste, details?, fuss, hilfewerte? }
//   hilfewerte: Platzhalter für den Text der Hilfe zu diesem Fenster (hilfe.thema.<art>), z.B. { punkte }
//   umgebung: { spiel, daten, texte, belegung, darunter } (darunter: Inhalt des Fensters darunter oder null)
// Inhalte von Inventar, Fähigkeiten und Hilfe stehen hier, Charakter und Erstellung in anzeige/charakterfenster.js.

import { spielerin, entitaetMitId } from "../kern/zustand.js";
import { istAngelegt, haltbarkeitProzent } from "../systeme/ausruestung.js";
import { anzahlVon, ladungenVon, lastVon, tragkraftVon, lastZuschlag } from "../systeme/inventar.js";
import { faehigkeitFuer, verbrauchVon, zuegeBisBereit } from "../systeme/faehigkeiten.js";
import { BUCHSTABEN } from "../eingabe/inventar.js";
import { hilfeGruppen } from "../eingabe/hilfe.js";

const inhalte = new Map();

export function fensterinhaltAnmelden(art, inhalt) {
  inhalte.set(art, inhalt);
}

export const buchstabeHtml = (stelle) => `<span class="buchstabe">${BUCHSTABEN[stelle] ?? " "})</span> `;

// HTML des obersten Fensters oder "" bei leerem Stapel
export function fensterHtml(umgebung, stapel) {
  if (!stapel.length) return "";
  const titel = [];
  let oben = null;
  for (const eintrag of stapel) {
    // jedes Fenster kennt den Inhalt des Fensters darunter (die Hilfe zum Fenster nennt dessen Tasten)
    oben = inhalte.get(eintrag.art)({ ...umgebung, darunter: oben }, eintrag.zustand);
    titel.push(oben.titel);
  }
  const details = oben.details ? `<div class="fenster-details">${oben.details}</div>` : "";
  // ohne Einzelheiten ist das Fenster schmal, sonst stünde eine kurze Liste allein in der Breite
  return `<div class="fenster-rahmen${oben.details ? "" : " schmal"}">
    <h1>${titel.join(" › ")}</h1>
    ${oben.kopf ? `<div class="fenster-kopf">${oben.kopf}</div>` : ""}
    <div class="fenster-inhalt"><div class="fenster-liste">${oben.liste}</div>${details}</div>
    <div class="fenster-fuss">${oben.fuss}</div>
  </div>`;
}

// Inventar

// Stufen der Anzeige angefressener Gegenstände, die schlimmste zuerst (unter so viel Prozent der Haltbarkeit)
const VERSCHLEISS_STUFEN = [
  { unter: 25, text: "ui.zerfressen" },
  { unter: 50, text: "ui.stark_angefressen" },
  { unter: 75, text: "ui.angefressen" },
];

// Zusatz für angefressene und als verflucht bekannte Gegenstände (systeme/verschleiss.js, systeme/ausruestung.js)
export function verschleissText(texte, gegenstand) {
  const { text } = texte;
  const prozent = haltbarkeitProzent(gegenstand);
  const stufe = VERSCHLEISS_STUFEN.find((eintrag) => prozent < eintrag.unter);
  const angefressen = stufe ? ` <span class="schlimm">(${text(stufe.text)}, ${prozent} %)</span>` : "";
  const verflucht = gegenstand.fluchBekannt ? ` <span class="schlimm">(${text("ui.verflucht")})</span>` : "";
  return angefressen + verflucht;
}

const kilo = (gramm) => (gramm / 1000).toFixed(1).replace(".", ",");

export function lastText(spiel, texte, ninkasi) {
  const ueberladen = lastZuschlag(spiel, ninkasi) ? ` <span class="schlimm">${texte.text("ui.ueberladen")}</span>` : "";
  return `${texte.text("ui.last")} ${kilo(lastVon(spiel, ninkasi))} / ${kilo(tragkraftVon(spiel, ninkasi))} kg${ueberladen}`;
}

fensterinhaltAnmelden("inventar", ({ spiel, texte }, zustand) => {
  const { text, nomenForm } = texte;
  const ninkasi = spielerin(spiel.zustand);
  const gegenstaende = ninkasi.inventar.map((id) => entitaetMitId(spiel.zustand, id)).filter(Boolean);
  const zeilen = gegenstaende.map((gegenstand, stelle) => {
    const angelegt = istAngelegt(ninkasi, gegenstand.id) ? ` <span class="leise">(${text("ui.angelegt")})</span>` : "";
    const gewaehlt = zustand.gewaehlt === gegenstand.id ? ' class="gewaehlt"' : "";
    const anzahl = anzahlVon(gegenstand) > 1 ? ` x ${anzahlVon(gegenstand)}` : "";
    const ladungen = gegenstand.ladungen ? ` (${ladungenVon(gegenstand)}/${gegenstand.ladungen.hoechstens})` : "";
    return `<li${gewaehlt}>${buchstabeHtml(stelle)}${nomenForm(gegenstand, "nom", "ohne")}${anzahl}${ladungen}${verschleissText(texte, gegenstand)}${angelegt}</li>`;
  });
  const gewaehlt = zustand.gewaehlt !== null ? entitaetMitId(spiel.zustand, zustand.gewaehlt) : null;
  const details = gewaehlt
    ? `<h2>${nomenForm(gewaehlt, "nom", "ohne")}</h2><ul>
        ${anzahlVon(gewaehlt) > 1 ? `<li>${text("ui.anzahl")}: ${anzahlVon(gewaehlt)}</li>` : ""}
        ${gewaehlt.ladungen ? `<li>${text("ui.ladungen")}: ${ladungenVon(gewaehlt)} / ${gewaehlt.ladungen.hoechstens}</li>` : ""}
        ${gewaehlt.haltbarkeit ? `<li>${text("ui.haltbarkeit")}: ${haltbarkeitProzent(gewaehlt)} %</li>` : ""}
        ${istAngelegt(ninkasi, gewaehlt.id) ? `<li>${text("ui.angelegt")}</li>` : ""}
        ${gewaehlt.fluchBekannt ? `<li class="schlimm">${text("ui.verflucht")}</li>` : ""}
      </ul>`
    : "";
  const hinweis = !gegenstaende.length ? "ui.inventar_leer" : zustand.gewaehlt === null ? "ui.inventar_waehlen" : "ui.inventar_handeln";
  return {
    titel: text("ui.inventar"),
    kopf: `<div class="leise">${lastText(spiel, texte, ninkasi)}</div>`,
    liste: `<ul>${zeilen.length ? zeilen.join("") : `<li class="leise">${text("ui.leer")}</li>`}</ul>`,
    details,
    fuss: text(hinweis),
  };
});

// Fähigkeiten

// Verbrauch einer Fähigkeit als Text, z.B. "10 MP"
export function verbrauchText(spiel, texte, wesen, definition) {
  return Object.entries(verbrauchVon(spiel, wesen, definition))
    .filter(([, menge]) => menge > 0)
    .map(([wertName, menge]) => `${menge} ${texte.text(`ui.${wertName}`)}`).join(", ");
}

fensterinhaltAnmelden("faehigkeiten", ({ spiel, texte }) => {
  const { text } = texte;
  const ninkasi = spielerin(spiel.zustand);
  const namen = ninkasi.faehigkeiten || [];
  const zeilen = namen.map((name, stelle) => {
    const definition = faehigkeitFuer(spiel, ninkasi, name);
    const verbrauch = verbrauchText(spiel, texte, ninkasi, definition);
    const zuege = zuegeBisBereit(ninkasi, name);
    const abklingzeit = definition.abklingzeit ? ` <span class="leise">${text("ui.abklingzeit", { zuege: definition.abklingzeit })}</span>` : "";
    const abklingend = zuege > 0 ? ` <span class="schlimm">(${text("ui.abklingend", { zuege })})</span>` : "";
    return `<li>${buchstabeHtml(stelle)}${text(definition.text)}${verbrauch ? ` <span class="leise">${verbrauch}</span>` : ""}${abklingzeit}${abklingend}</li>`;
  });
  return {
    titel: text("ui.faehigkeiten"),
    liste: `<ul>${zeilen.join("")}</ul>`,
    fuss: text(namen.length ? "ui.faehigkeiten_waehlen" : "ui.faehigkeiten_keine"),
  };
});

// Hilfe

// Anzeigename einer Taste: eigener Text (taste.<code>), sonst aus dem Code (KeyG -> G, Numpad7 -> Num 7, Digit1 -> 1)
export function tastenname(texte, taste) {
  if (taste.zeichen !== undefined) return taste.zeichen;
  const schluessel = `taste.${taste.code}`;
  if (texte.hatSchluessel(schluessel)) return texte.text(schluessel);
  const buchstabe = /^Key([A-Z])$/.exec(taste.code)?.[1];
  if (buchstabe) return buchstabe;
  const ziffer = /^Digit([0-9])$/.exec(taste.code)?.[1];
  if (ziffer) return ziffer;
  const ziffernblock = /^Numpad(.+)$/.exec(taste.code)?.[1];
  return ziffernblock ? `Num ${ziffernblock}` : taste.code;
}

// Zwei Arten der Hilfe: aus einem Fenster (Zustand { thema }) nur der Text zu diesem Fenster und seine Tasten, die
// Fußzeile des Fensters darunter (umgebung.darunter); im Spiel ohne Fenster die allgemeine Hilfe mit allen Tasten
function fensterhilfe(texte, thema, darunter) {
  const { text, hatSchluessel } = texte;
  const themaSchluessel = `hilfe.thema.${thema}`;
  const erklaerung = hatSchluessel(themaSchluessel)
    ? `<p class="thema">${text(themaSchluessel, darunter?.hilfewerte ?? {})}</p>`
    : `<p>${text("hilfe.fenster")}</p>`;
  const tasten = darunter?.fuss ? `<h2>${text("hilfe.fenster_tasten")}</h2><p>${darunter.fuss}</p>` : "";
  return {
    titel: text("aktion.hilfe"),
    liste: `${erklaerung}${tasten}<p class="leise">${text("hilfe.alle_tasten")}</p>`,
    fuss: text("hilfe.schliessen"),
  };
}

fensterinhaltAnmelden("hilfe", ({ texte, belegung, darunter }, zustand) => {
  if (zustand.thema) return fensterhilfe(texte, zustand.thema, darunter);
  const { text } = texte;
  const gruppen = hilfeGruppen(belegung).map(({ gruppe, eintraege }) => `<h2>${text(`hilfe.gruppe.${gruppe}`)}</h2><ul class="hilfe">${eintraege
    .map((eintrag) => `<li><span class="tasten">${eintrag.tasten.map((taste) => tastenname(texte, taste)).join(", ")}</span> ${text(eintrag.text)}</li>`)
    .join("")}</ul>`);
  return {
    titel: text("aktion.hilfe"),
    liste: gruppen.join(""),
    details: `<h2>${text("hilfe.fenster_titel")}</h2><p>${text("hilfe.fenster")}</p>
      <h2>${text("hilfe.zielmodus_titel")}</h2><p>${text("hilfe.zielmodus")}</p>
      <h2>${text("hilfe.maus_titel")}</h2><p>${text("hilfe.maus")}</p>`,
    fuss: text("hilfe.schliessen"),
  };
});
