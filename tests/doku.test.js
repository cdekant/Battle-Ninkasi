// Prüfung der Dokumentation (siehe docs/Entwicklung.md, Tests und Balancing, und CLAUDE.md, Dokumentation):
// Verweise zeigen auf vorhandene Dateien und Abschnitte, jede Datei hat genau ein zuständiges Dokument, jedes
// Dokument steht in CLAUDE.md, CLAUDE.md bleibt unter dem Limit, "Mitprüfen" gilt in beide Richtungen, Design-Dokumente
// nennen je Abschnitt ihre Umsetzung. Ob etwas doppelt beschrieben ist oder inhaltlich übereinstimmt, prüft das nicht.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const hauptverzeichnis = join(dirname(fileURLToPath(import.meta.url)), "..");
const doku = join(hauptverzeichnis, "docs");
const HOECHSTE_LAENGE_CLAUDE = 12000;

// Ordner und Dateien, die ein zuständiges Dokument brauchen; nicht im Repo liegende Teile bleiben außen vor
const ZUGEORDNETE_ORDNER = ["src", "daten", "sprache", "grafik", "lib", "werkzeuge", "tests"];
const ZUGEORDNETE_DATEIEN = ["index.html", "package.json", "starten.py", "starten.bat"];
const AUSGENOMMEN = ["sprache/Literatur/", "__pycache__/"];

const lesen = (pfad) => readFileSync(pfad, "utf8");
const relativerPfad = (pfad) => relative(hauptverzeichnis, pfad).split(sep).join("/");

function dateienUnter(ordner) {
  const ergebnis = [];
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (AUSGENOMMEN.some((ausnahme) => (relativerPfad(pfad) + (eintrag.isDirectory() ? "/" : "")).includes(ausnahme))) continue;
    if (eintrag.isDirectory()) ergebnis.push(...dateienUnter(pfad));
    else ergebnis.push(pfad);
  }
  return ergebnis;
}

const dokumente = readdirSync(doku).filter((name) => name.endsWith(".md")).sort();
const dokumenttexte = Object.fromEntries(dokumente.map((name) => [name, lesen(join(doku, name))]));
const claudeText = lesen(join(hauptverzeichnis, "CLAUDE.md"));

// Überschriften je Dokument, ohne die Rauten
const ueberschriften = Object.fromEntries(Object.entries(dokumenttexte).map(([name, text]) => [
  name,
  text.split("\n").filter((zeile) => zeile.startsWith("#")).map((zeile) => zeile.replace(/^#+\s*/, "").trim()),
]));

// Ein Verweis "Datei.md, Abschnitt" stimmt, wenn der Text dahinter mit einer Überschrift der Datei beginnt;
// für die Arbeitsliste gilt auch "Punkt N"
function abschnittVorhanden(datei, textDahinter) {
  if (datei === "Systemausbau.md" && /^Punkte? \d+/.test(textDahinter)) return true;
  return ueberschriften[datei].some((ueberschrift) => textDahinter.startsWith(ueberschrift));
}

// Alle Textquellen mit Verweisen: Doku, CLAUDE.md und der Code
function quellenMitVerweisen() {
  const quellen = [{ pfad: join(hauptverzeichnis, "CLAUDE.md"), text: claudeText }];
  for (const name of dokumente) quellen.push({ pfad: join(doku, name), text: dokumenttexte[name] });
  for (const ordner of ["src", "daten", "werkzeuge", "tests"]) {
    for (const pfad of dateienUnter(join(hauptverzeichnis, ordner))) {
      if (pfad.endsWith(".js") || pfad.endsWith(".css")) quellen.push({ pfad, text: lesen(pfad) });
    }
  }
  return quellen;
}

test("Doku: jeder Markdown-Link auf ein Dokument zeigt auf eine vorhandene Datei", () => {
  const fehlend = [];
  for (const { pfad, text } of quellenMitVerweisen().filter(({ pfad }) => pfad.endsWith(".md"))) {
    for (const [, ziel] of text.matchAll(/\]\(([^)#\s]+\.md)(#[^)]*)?\)/g)) {
      if (!existsSync(join(dirname(pfad), ziel))) fehlend.push(`${relativerPfad(pfad)}: ${ziel}`);
    }
  }
  assert.deepEqual(fehlend, []);
});

test("Doku: Verweise mit Abschnitt nennen ein vorhandenes Dokument und eine vorhandene Überschrift", () => {
  const falsch = [];
  for (const { pfad, text } of quellenMitVerweisen()) {
    // im Code: docs/<Datei>.md, <Abschnitt>; Text dahinter klein (z.B. ein Pfad) ist kein Abschnitt
    const imCode = [...text.matchAll(/docs\/([A-Za-z]+\.md), ([^\n]*)/g)];
    // in Markdown: siehe [<Datei>.md](<Datei>.md), <Abschnitt>
    const inMarkdown = [...text.matchAll(/siehe \[([A-Za-z]+\.md)\]\([^)]*\), ([^\n]*)/g)];
    for (const [, datei, textDahinter] of [...imCode, ...inMarkdown]) {
      if (!(datei in ueberschriften)) falsch.push(`${relativerPfad(pfad)}: ${datei} gibt es nicht`);
      else if (/^[A-ZÄÖÜ]/.test(textDahinter) && !abschnittVorhanden(datei, textDahinter)) {
        falsch.push(`${relativerPfad(pfad)}: ${datei}, ${textDahinter.slice(0, 40)}`);
      }
    }
  }
  assert.deepEqual(falsch, []);
});

test("Doku: jede Datei hat genau ein zuständiges Dokument, jedes Muster trifft eine Datei", () => {
  // Muster aus den Zeilen "Zuständig für:"; "ordner/*" gilt für alles darunter
  const muster = [];
  for (const [name, text] of Object.entries(dokumenttexte)) {
    const zeile = text.split("\n").find((zeile) => zeile.startsWith("Zuständig für:"));
    if (!zeile) continue;
    for (const [, eintrag] of zeile.matchAll(/`([^`]+)`/g)) muster.push({ eintrag, dokument: name });
  }
  const passt = (datei, eintrag) => (eintrag.endsWith("/*") ? datei.startsWith(eintrag.slice(0, -1)) : datei === eintrag);

  const dateien = [
    ...ZUGEORDNETE_ORDNER.flatMap((ordner) => dateienUnter(join(hauptverzeichnis, ordner)).map(relativerPfad)),
    ...ZUGEORDNETE_DATEIEN.filter((datei) => existsSync(join(hauptverzeichnis, datei))),
  ];
  const ohneOderMehrfach = [];
  for (const datei of dateien) {
    const zustaendig = [...new Set(muster.filter(({ eintrag }) => passt(datei, eintrag)).map(({ dokument }) => dokument))];
    if (zustaendig.length !== 1) ohneOderMehrfach.push(`${datei}: ${zustaendig.join(", ") || "kein Dokument"}`);
  }
  assert.deepEqual(ohneOderMehrfach, []);

  const ohneDatei = muster.filter(({ eintrag }) => !dateien.some((datei) => passt(datei, eintrag)));
  assert.deepEqual(ohneDatei.map(({ eintrag, dokument }) => `${dokument}: ${eintrag}`), []);
});

test("Doku: CLAUDE.md verweist auf jedes Dokument in docs/", () => {
  const fehlend = dokumente.filter((name) => !claudeText.includes(`(docs/${name})`));
  assert.deepEqual(fehlend, []);
});

test("Doku: CLAUDE.md bleibt unter dem Limit", () => {
  const laenge = [...claudeText].length;
  assert.ok(laenge < HOECHSTE_LAENGE_CLAUDE, `CLAUDE.md hat ${laenge} Zeichen, erlaubt sind weniger als ${HOECHSTE_LAENGE_CLAUDE}`);
});

test("Doku: jedes Dokument nennt im Kopf, was mitzuprüfen ist", () => {
  const ohne = dokumente.filter((name) => !dokumenttexte[name].includes("Mitprüfen bei Änderungen:"));
  assert.deepEqual(ohne, []);
  assert.ok(statSync(doku).isDirectory());
});

// Die Arbeitsliste nennt "alle Dokumente, deren Punkte hier umgesetzt werden" und bleibt außen vor
const ARBEITSLISTE = "Systemausbau.md";
const verlinkteDokumente = (zeile) => [...zeile.matchAll(/\]\(([A-Za-z]+\.md)\)/g)].map(([, datei]) => datei);
const mitpruefenVon = (name) =>
  verlinkteDokumente(dokumenttexte[name].split("\n").find((zeile) => zeile.startsWith("Mitprüfen bei Änderungen:")) ?? "");

test("Doku: Mitprüfen gilt in beide Richtungen", () => {
  const einseitig = [];
  for (const name of dokumente.filter((name) => name !== ARBEITSLISTE)) {
    for (const nachbar of mitpruefenVon(name).filter((nachbar) => nachbar !== ARBEITSLISTE)) {
      if (!mitpruefenVon(nachbar).includes(name)) einseitig.push(`${name} nennt ${nachbar}, nicht zurück`);
    }
  }
  assert.deepEqual(einseitig, []);
});

// Design-Dokumente beschreiben keine Dateien (kein "Zuständig für:"); jeder Abschnitt nennt in einer Zeile
// "Umsetzung:", wo das Entschiedene technisch beschrieben ist (siehe CLAUDE.md, Dokumentation)
const ABSCHNITTE_OHNE_UMSETZUNG = ["Offen", "Offene Fragen", "Quellen", "Recherche", "Vorbilder", "Entscheidungen", "Stand der Umsetzung"];
const UMSETZUNGSZEILE = /^Umsetzung: (siehe |teilweise, siehe |offen|keine)/;

test("Doku: Design-Dokumente nennen je Abschnitt ihre Umsetzung, deren Dokumente stehen unter Mitprüfen", () => {
  const designDokumente = dokumente.filter((name) => name !== ARBEITSLISTE && !dokumenttexte[name].includes("\nZuständig für:"));
  const fehlend = [];
  for (const name of designDokumente) {
    const abschnitte = dokumenttexte[name].split(/\n(?=## )/).slice(1);
    for (const abschnitt of abschnitte) {
      const ueberschrift = abschnitt.split("\n")[0].slice(3).trim();
      if (ABSCHNITTE_OHNE_UMSETZUNG.includes(ueberschrift)) continue;
      const zeilen = abschnitt.split("\n").filter((zeile) => zeile.startsWith("Umsetzung:"));
      if (zeilen.length !== 1 || !UMSETZUNGSZEILE.test(zeilen[0])) {
        fehlend.push(`${name}, ${ueberschrift}: genau eine Zeile "Umsetzung: siehe|teilweise, siehe|offen|keine"`);
        continue;
      }
      for (const ziel of verlinkteDokumente(zeilen[0])) {
        if (ziel !== ARBEITSLISTE && ziel !== name && !mitpruefenVon(name).includes(ziel)) {
          fehlend.push(`${name}, ${ueberschrift}: ${ziel} fehlt unter Mitprüfen`);
        }
      }
    }
  }
  assert.deepEqual(fehlend, []);
});
