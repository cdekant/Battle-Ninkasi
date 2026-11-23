// Kompendium in Node (siehe docs/Entwicklung.md, Kompendium): gibt die Lücken der Inhalte aus (werkzeuge/luecken.js),
// auf Wunsch die Steckbriefe einer Art als Liste (src/anzeige/beschreibung.js). Dieselben Quellen wie
// werkzeuge/kompendium.html im Browser.
// Aufruf: node werkzeuge/kompendium.js [Art]
//   ohne Art: alle Lücken nach Gruppe; Rückgabewert 1, wenn eine Lücke der Stufe "fehler" dabei ist
//   mit Art (wesen, gegenstaende, effekte …): die Steckbriefe dieser Art
//   woerterbuch [de|en]: das Glossar als Wörterbuch, nach der genannten Sprache sortiert (Vorgabe de)

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { rohdaten, texte as texteJeSprache, texteDe as texte, probenamen, probentexte } from "../src/inhalt.js";
import grammatik from "../sprache/de/grammatik.js";
import grammatikEn from "../sprache/en/grammatik.js";
import { woerterbuch } from "../src/anzeige/glossar.js";
import korpuslisteDe from "../sprache/de/korpus/index.js";
import korpuslisteEn from "../sprache/en/korpus/index.js";
import tileset from "../grafik/tileset.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { korpustextZerlegen } from "../src/anzeige/korpus.js";
import { vorbereiten } from "../src/kern/daten.js";
import { ARTEN, eintragsnamen, steckbrief } from "../src/anzeige/beschreibung.js";
import { lueckenFinden } from "./luecken.js";

const hauptverzeichnis = new URL("../", import.meta.url);
// Korpus aller Sprachen, benannt als <sprache>/<datei>
const KORPUSLISTEN = { de: korpuslisteDe, en: korpuslisteEn };

// Alle Quellen wie im Browser, aus den Dateien gelesen
export function quellenLaden() {
  const korpus = Object.entries(KORPUSLISTEN).flatMap(([code, liste]) => liste.map((datei) =>
    korpustextZerlegen(`${code}/${datei}`, readFileSync(new URL(`sprache/${code}/korpus/${datei}`, hauptverzeichnis), "utf8"))));
  const literatur = JSON.parse(readFileSync(new URL("sprache/literatur.json", hauptverzeichnis), "utf8"));
  const sprache = { texte, nomenPruefen: erstelleGrammatik(grammatik).pruefen };
  return { rohdaten, sprache, tileset, korpus, literatur, probenamen, probentexte, uebersetzungen: { en: texteJeSprache.en } };
}

// Lücken als Textzeilen, nach Gruppe geordnet
export function lueckenText(luecken) {
  const zeilen = [];
  for (const gruppe of [...new Set(luecken.map((luecke) => luecke.gruppe))]) {
    const inGruppe = luecken.filter((luecke) => luecke.gruppe === gruppe);
    zeilen.push(`${gruppe} (${inGruppe.length})`);
    for (const luecke of inGruppe) zeilen.push(`  ${luecke.stufe === "fehler" ? "FEHLER " : ""}${luecke.ort}: ${luecke.meldung}`);
  }
  const fehlerzahl = luecken.filter((luecke) => luecke.stufe === "fehler").length;
  zeilen.push(`${luecken.length} Lücken, davon ${fehlerzahl} Fehler`);
  return zeilen;
}

function steckbriefeText(daten, art) {
  const textzugriff = erstelleTexte(texte, erstelleGrammatik(grammatik));
  const zeilen = [];
  for (const name of eintragsnamen(daten, art)) {
    const brief = steckbrief(daten, art, name);
    const anzeigename = brief.text && textzugriff.hatSchluessel(brief.text) ? ` (${textzugriff.nomenForm({ text: brief.text }, "nom", "ohne")})` : "";
    zeilen.push(`${name}${anzeigename}${brief.abstrakt ? " [Vorlage]" : ""}`);
    for (const [feld, wert] of Object.entries(brief.merkmale)) zeilen.push(`  ${feld}: ${Array.isArray(wert) ? wert.join("; ") : wert}`);
  }
  return zeilen;
}

// Wörterbuch als Textzeilen: Begriff, Übersetzung und Erklärung in der Sprache der Sortierung
export function woerterbuchText(sprache = "de") {
  const deutsch = erstelleTexte(texte, erstelleGrammatik(grammatik));
  const englisch = erstelleTexte(texteJeSprache.en, erstelleGrammatik(grammatikEn), { texte, grammatik: erstelleGrammatik(grammatik) });
  const andere = sprache === "de" ? "en" : "de";
  const zugriffe = sprache === "de" ? { de: deutsch, en: englisch } : { en: englisch, de: deutsch };
  return woerterbuch(rohdaten.glossar, zugriffe).map((zeile) => `${zeile[sprache].begriff} (${zeile[andere].begriff}), ${zeile[sprache].gebiet}: ${zeile[sprache].erklaerung}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const quellen = quellenLaden();
  const art = process.argv[2];
  if (art === "woerterbuch") {
    console.log(woerterbuchText(process.argv[3] === "en" ? "en" : "de").join("\n"));
  } else if (art) {
    if (!ARTEN[art]) {
      console.log(`Art "${art}" gibt es nicht: ${Object.keys(ARTEN).join(", ")}`);
      process.exit(1);
    }
    console.log(steckbriefeText(vorbereiten(quellen.rohdaten, quellen.sprache).daten, art).join("\n"));
  } else {
    const luecken = lueckenFinden(quellen);
    console.log(lueckenText(luecken).join("\n"));
    if (luecken.some((luecke) => luecke.stufe === "fehler")) process.exit(1);
  }
}
