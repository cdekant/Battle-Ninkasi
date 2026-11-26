// Mitwirkende (siehe docs/Titelbildschirm.md, Mitwirkende): wer das Spiel gemacht hat und wer an welchem Inhalt
// beteiligt war, gesammelt aus den Quellenangaben (anzeige/quellenangabe.js) von Titelbildern, Tiles und Korpustexten,
// dazu das Literaturverzeichnis und die Bibliotheken. Die Fensterart steht in eingabe/mitwirkende.js; mitwirkendeSammeln
// ist ohne DOM und wird getestet. Liest nur.
// umgebung zusätzlich: { tileset, korpustexte, literatur } (src/main.js); fehlt etwas, entfällt nur sein Abschnitt.

import { fensterinhaltAnmelden } from "./fenster.js";
import { quellenangabeText, quellenangabeAusKopf, literaturangabe } from "./quellenangabe.js";
import { TITELBILDER } from "./titelbilder.js";
import { tileQuellenangabe } from "./tilebilder.js";

// Wer das Spiel macht; kuerzel ist die Art "chd" der Quellenangaben
export const IMPRESSUM = { name: "Christian Dekant", kuerzel: "chd", repo: "https://github.com/cdekant/Battle-Ninkasi" };

// Rollen am Spiel selbst, die in keinem einzelnen Werk stecken; Text unter mitwirkende.rolle.<rolle>
export const ROLLEN = [
  { rolle: "idee", quellenangabe: { art: "chd" } },
  { rolle: "ausarbeitung", quellenangabe: { art: "chd", beteiligt: [{ wer: "Claude", anteil: "ausarbeitung" }] } },
  { rolle: "code", quellenangabe: { art: "generiert", beteiligt: [{ wer: "Claude" }] } },
];

// Spiele, von denen Ideen kommen (nur die Titel)
export const VORBILDER = ["EVE Online", "Skyrim", "Caves of Qud", "Brogue", "Dungeon Crawl Stone Soup", "NetHack", "Hades", "Slay the Spire", "World of Warcraft"];

// Bibliotheken in lib/ mit Urheber und Lizenz (Lizenzdatei im Ordner der Bibliothek, LIZENZEN.md)
export const BIBLIOTHEKEN = [{ name: "rot.js", urheber: "Ondřej Žára", lizenz: "BSD-3-Clause" }];

// Name eines Tiles aus den Texten von Gelände, Wesen oder Gegenstand gleichen Schlüssels, sonst der Schlüssel
function tileName(texte, daten, name) {
  const eintrag = daten?.gelaende?.[name] ?? daten?.wesen?.[name] ?? daten?.gegenstaende?.[name];
  return eintrag?.text && texte.hatSchluessel(eintrag.text) ? texte.nomenForm({ text: eintrag.text }, "nom", "ohne") : name;
}

// Tiles nach gleicher Quellenangabe: [{ was, angabe }]; weicht die Angabe eines Tiles zwischen den Sätzen ab, steht es
// je Satz mit der Größe da ("Bier (16 px)")
function tileGruppen(texte, daten, tileset) {
  const satzGroessen = Object.keys(tileset.saetze).map(Number).sort((erste, zweite) => zweite - erste);
  const namen = [...new Set(satzGroessen.flatMap((satzGroesse) => Object.keys(tileset.saetze[satzGroesse])))];
  const gruppen = new Map();
  const eintragen = (was, angabe) => {
    const schluessel = JSON.stringify(angabe);
    if (!gruppen.has(schluessel)) gruppen.set(schluessel, { namen: [], angabe });
    gruppen.get(schluessel).namen.push(was);
  };
  for (const name of namen) {
    const jeSatz = satzGroessen.filter((satzGroesse) => tileset.saetze[satzGroesse][name])
      .map((satzGroesse) => ({ satzGroesse, angabe: tileQuellenangabe(tileset, satzGroesse, name) }));
    const anzeigename = tileName(texte, daten, name);
    if (new Set(jeSatz.map(({ angabe }) => JSON.stringify(angabe))).size === 1) eintragen(anzeigename, jeSatz[0].angabe);
    else for (const { satzGroesse, angabe } of jeSatz) eintragen(`${anzeigename} (${satzGroesse} px)`, angabe);
  }
  return [...gruppen.values()].map(({ namen: gruppenNamen, angabe }) => ({ was: gruppenNamen.join(", "), angabe }));
}

// Abschnitte des Fensters: [{ abschnitt, zeilen: [{ was, text?, link? }] }]; Abschnitte ohne Zeilen fallen weg
export function mitwirkendeSammeln(texte, { daten = null, tileset = null, korpustexte = [], literatur = [], titelbilder = TITELBILDER } = {}) {
  const { text } = texte;
  const angabe = (quellenangabe) => quellenangabeText(texte, quellenangabe, literatur);
  const abschnitte = [
    { abschnitt: "impressum", zeilen: [
      { was: IMPRESSUM.name, link: IMPRESSUM.repo },
      { was: text("mitwirkende.kuerzel", { kuerzel: IMPRESSUM.kuerzel, name: IMPRESSUM.name }) },
    ] },
    { abschnitt: "spiel", zeilen: ROLLEN.map(({ rolle, quellenangabe }) => ({ was: text(`mitwirkende.rolle.${rolle}`), text: angabe(quellenangabe) })) },
    { abschnitt: "vorbilder", zeilen: [{ was: VORBILDER.join(", ") }] },
    { abschnitt: "titelbilder", zeilen: titelbilder.map((bild, stelle) => ({ was: text("mitwirkende.titelbild", { nummer: stelle + 1 }), text: angabe(bild.quellenangabe) })) },
    { abschnitt: "tiles", zeilen: tileset ? tileGruppen(texte, daten, tileset).map(({ was, angabe: tileAngabe }) => ({ was, text: angabe(tileAngabe) })) : [] },
    { abschnitt: "texte", zeilen: korpustexte.map(({ name, kopf }) => ({ was: kopf.titel ?? name, text: angabe(quellenangabeAusKopf(kopf)) })) },
    { abschnitt: "literatur", zeilen: literatur.map((eintrag) => ({ was: literaturangabe(texte, eintrag) }))
      .sort((erste, zweite) => erste.was.localeCompare(zweite.was, text("sprache.code"))) },
    { abschnitt: "bibliotheken", zeilen: [
      ...BIBLIOTHEKEN.map(({ name, urheber, lizenz }) => ({ was: name, text: text("mitwirkende.bibliothek", { urheber, lizenz }) })),
      { was: text("mitwirkende.lizenzen") },
    ] },
  ];
  return abschnitte.filter(({ zeilen }) => zeilen.length);
}

const escapeHtml = (wert) => String(wert).replace(/[&<>"]/g, (zeichen) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[zeichen]);

function zeileHtml({ was, text, link }) {
  const wasHtml = link ? `${escapeHtml(was)} · <a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(link)}</a>` : escapeHtml(was);
  return `<li>${wasHtml}${text ? ` <span class="leise">${escapeHtml(text)}</span>` : ""}</li>`;
}

fensterinhaltAnmelden("mitwirkende", ({ texte, daten, tileset, korpustexte, literatur }) => {
  const { text } = texte;
  const abschnitte = mitwirkendeSammeln(texte, { daten, tileset, korpustexte, literatur });
  return {
    titel: text("mitwirkende.titel"),
    liste: abschnitte.map(({ abschnitt, zeilen }) => `<h2>${text(`mitwirkende.abschnitt.${abschnitt}`)}</h2><ul class="mitwirkende">${zeilen.map(zeileHtml).join("")}</ul>`).join(""),
    fuss: text("mitwirkende.fuss"),
    breit: true,
  };
});
