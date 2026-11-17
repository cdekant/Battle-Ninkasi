import { test } from "node:test";
import assert from "node:assert/strict";
import { neuerZustand } from "../src/kern/zustand.js";
import { einreihen, akteurEinreihen, ereignisEinreihen, erster, entnehmen, akteurEntfernen } from "../src/kern/zeit.js";

const reihenfolge = (z) => {
  const aus = [];
  let e;
  while ((e = entnehmen(z))) aus.push(e.art === "akteur" ? `akteur ${e.id}` : e.art === "ereignis" ? e.typ : e.art);
  return aus;
};

test("leere Warteschlange liefert null", () => {
  const z = neuerZustand(1);
  assert.equal(erster(z), null);
  assert.equal(entnehmen(z), null);
});

test("früherer Zeitpunkt kommt zuerst, die Uhr springt auf ihn", () => {
  const z = neuerZustand(1);
  akteurEinreihen(z, 1, 200);
  akteurEinreihen(z, 2, 100);
  assert.equal(entnehmen(z).id, 2);
  assert.equal(z.zeit, 100);
  assert.equal(entnehmen(z).id, 1);
  assert.equal(z.zeit, 200);
});

test("Gleichstand: Weltuhr, dann Ereignisse nach Einreihung, dann Akteure nach ID", () => {
  const z = neuerZustand(1);
  akteurEinreihen(z, 5, 100);
  ereignisEinreihen(z, 100, "zweites");
  akteurEinreihen(z, 2, 100);
  einreihen(z, { zeit: 100, art: "weltuhr" });
  ereignisEinreihen(z, 100, "drittes");
  assert.deepEqual(reihenfolge(z), ["weltuhr", "zweites", "drittes", "akteur 2", "akteur 5"]);
});

test("akteurEntfernen entfernt nur die Einträge dieses Akteurs", () => {
  const z = neuerZustand(1);
  akteurEinreihen(z, 1, 100);
  akteurEinreihen(z, 2, 100);
  ereignisEinreihen(z, 100, "bleibt", { id: 1 });
  akteurEntfernen(z, 1);
  assert.deepEqual(reihenfolge(z), ["bleibt", "akteur 2"]);
});
