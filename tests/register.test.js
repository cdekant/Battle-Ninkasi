import { test } from "node:test";
import assert from "node:assert/strict";
import { anmelden, abmelden, holen, hat } from "../src/kern/register.js";
import { hakenAusloesen } from "../src/kern/ereignisse.js";

test("Haken laufen nach Rang, bei gleichem Rang nach Anmeldung", () => {
  const reihenfolge = [];
  const spaet = () => reihenfolge.push("spaet");
  const erster = () => reihenfolge.push("erster");
  const zweiter = () => reihenfolge.push("zweiter");
  const frueh = () => reihenfolge.push("frueh");
  anmelden("haken", "zug_ende", spaet, { rang: 500 });
  anmelden("haken", "zug_ende", erster);
  anmelden("haken", "zug_ende", zweiter);
  anmelden("haken", "zug_ende", frueh, { rang: 1 });
  hakenAusloesen({}, "zug_ende", {});
  assert.deepEqual(reihenfolge, ["frueh", "erster", "zweiter", "spaet"]);
  for (const handler of [spaet, erster, zweiter, frueh]) abmelden("haken", "zug_ende", handler);
  assert.equal(hat("haken", "zug_ende"), false);
});

test("abmelden entfernt bei Haken genau den einen Handler", () => {
  const bleibt = () => {};
  const geht = () => {};
  anmelden("haken", "zug_beginn", bleibt);
  anmelden("haken", "zug_beginn", geht);
  abmelden("haken", "zug_beginn", geht);
  assert.deepEqual(holen("haken", "zug_beginn"), [bleibt]);
  abmelden("haken", "zug_beginn", bleibt);
});

test("Haken außerhalb des Katalogs werden abgelehnt", () => {
  assert.throws(() => anmelden("haken", "gibt_es_nicht", () => {}), /Katalog/);
  assert.throws(() => hakenAusloesen({}, "gibt_es_nicht", {}), /Katalog/);
});

test("abmelden bei anderen Arten entfernt den Namen", () => {
  anmelden("bausteine", "test_voruebergehend", () => {});
  abmelden("bausteine", "test_voruebergehend");
  assert.equal(hat("bausteine", "test_voruebergehend"), false);
});
