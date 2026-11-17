import { test } from "node:test";
import assert from "node:assert/strict";
import { neuerZustand } from "../src/kern/zustand.js";
import {
  einreihen, akteurEinreihen, ereignisEinreihen, ersterEintrag, ersterEintragEntnehmen, akteurEntfernen,
} from "../src/kern/zeit.js";

// Leert die Warteschlange und beschreibt die Einträge in der Reihenfolge der Entnahme
const entnahmereihenfolge = (zustand) => {
  const beschreibungen = [];
  let eintrag;
  while ((eintrag = ersterEintragEntnehmen(zustand))) {
    if (eintrag.art === "akteur") beschreibungen.push(`akteur ${eintrag.akteurId}`);
    else if (eintrag.art === "ereignis") beschreibungen.push(eintrag.ereignistyp);
    else beschreibungen.push(eintrag.art);
  }
  return beschreibungen;
};

test("leere Warteschlange liefert null", () => {
  const zustand = neuerZustand(1);
  assert.equal(ersterEintrag(zustand), null);
  assert.equal(ersterEintragEntnehmen(zustand), null);
});

test("früherer Zeitpunkt kommt zuerst, die Uhr springt auf ihn", () => {
  const zustand = neuerZustand(1);
  akteurEinreihen(zustand, 1, 200);
  akteurEinreihen(zustand, 2, 100);
  assert.equal(ersterEintragEntnehmen(zustand).akteurId, 2);
  assert.equal(zustand.zeit, 100);
  assert.equal(ersterEintragEntnehmen(zustand).akteurId, 1);
  assert.equal(zustand.zeit, 200);
});

test("Gleichstand: Weltuhr, dann Ereignisse nach Einreihung, dann Akteure nach ID", () => {
  const zustand = neuerZustand(1);
  akteurEinreihen(zustand, 5, 100);
  ereignisEinreihen(zustand, 100, "zweites");
  akteurEinreihen(zustand, 2, 100);
  einreihen(zustand, { zeit: 100, art: "weltuhr" });
  ereignisEinreihen(zustand, 100, "drittes");
  assert.deepEqual(entnahmereihenfolge(zustand), ["weltuhr", "zweites", "drittes", "akteur 2", "akteur 5"]);
});

test("akteurEntfernen entfernt nur die Einträge dieses Akteurs", () => {
  const zustand = neuerZustand(1);
  akteurEinreihen(zustand, 1, 100);
  akteurEinreihen(zustand, 2, 100);
  ereignisEinreihen(zustand, 100, "bleibt", { akteurId: 1 });
  akteurEntfernen(zustand, 1);
  assert.deepEqual(entnahmereihenfolge(zustand), ["bleibt", "akteur 2"]);
});
