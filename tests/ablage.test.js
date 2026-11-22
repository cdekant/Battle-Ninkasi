// Wissen über Läufe hinweg (siehe docs/Architektur.md, Speichern): ein Schutz davor, dass die Logik
// die Ablage außerhalb des Laufs (Chronik, Browserspeicher) selbst liest; was ein Lauf davon nutzt, kommt als Startoption

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const hauptverzeichnis = join(dirname(fileURLToPath(import.meta.url)), "..");

// Ordner der Logik, die auch in Node laufen und nur den Spielstand kennen
const ORDNER_DER_LOGIK = ["src/kern", "src/systeme", "src/ki", "src/welt"];

// Worte, an denen ein Zugriff auf die Ablage zu erkennen ist
const ZUGRIFF_AUF_ABLAGE = /\bchronik|localStorage|sessionStorage|indexedDB|battle-ninkasi\./i;

function dateienIn(ordner) {
  const gefunden = [];
  for (const eintrag of readdirSync(join(hauptverzeichnis, ordner), { withFileTypes: true })) {
    const pfad = `${ordner}/${eintrag.name}`;
    if (eintrag.isDirectory()) gefunden.push(...dateienIn(pfad));
    else if (eintrag.name.endsWith(".js")) gefunden.push(pfad);
  }
  return gefunden;
}

test("die Logik liest die Ablage außerhalb des Laufs nie", () => {
  const dateien = ORDNER_DER_LOGIK.flatMap(dateienIn);
  assert.ok(dateien.length > 0, "keine Dateien der Logik gefunden");
  for (const datei of dateien) {
    const quelltext = readFileSync(join(hauptverzeichnis, datei), "utf8");
    assert.doesNotMatch(quelltext, ZUGRIFF_AUF_ABLAGE, `${datei} greift auf die Ablage zu statt auf die Startoptionen`);
  }
});
