// Probedurchstich (docs/Systemausbau.md): typische Inhalte nur aus Daten, als bleibende Tests.
// Was heute schon geht, ist ein gewöhnlicher Test; was Code verlangt, ist ein Test mit "todo" und dem Punkt der
// Arbeitsliste, der die Lücke schließt. Ein todo-Test läuft mit, macht node --test aber nicht rot; ist die Lücke
// geschlossen, fällt das todo weg. Die Daten der todo-Tests sind Entwürfe, wie der Inhalt später aussehen soll.
// Alle Daten stehen hier und nicht in datenproben/, damit sie weder im Spiel noch im Kompendium erscheinen.

import { test } from "node:test";
import { positionSetzen } from "../src/kern/raumindex.js";
import assert from "node:assert/strict";
import "../src/kern/spiel.js"; // meldet Bausteine, Systeme und Verhaltensmodule an
import { miniSpiel, wesen, spielerinSetzen, allesSichtbar, gegenstandTragen, weltLaufenLassen, meldungenMitschneiden } from "./hilfen.js";
import { befehlAusfuehren, befehlGeben } from "../src/kern/spiel.js";
import { holen } from "../src/kern/register.js";
import { rohdaten } from "../src/inhalt.js";
import { vorbereiten } from "../src/kern/daten.js";
import { akteurEinreihen } from "../src/kern/zeit.js";
import { effektAnwenden } from "../src/kern/effekte.js";
import { vorgangAbschliessen } from "../src/kern/vorgang.js";
import { werteAusDaten, modifiziert, modifikatorHinzufuegen } from "../src/kern/werte.js";
import { fraktionVon } from "../src/kern/zustand.js";
import { zustandSetzen, hatZustand } from "../src/systeme/zustaende.js";
import { faehigkeitPruefen } from "../src/systeme/faehigkeiten.js";
import { wahrnehmen } from "../src/systeme/wahrnehmung.js";
import { schichtAuf } from "../src/welt/schichten.js";
import { nahkampf } from "../src/systeme/kampf.js";

const RAUM = [
  "#############",
  "#...........#",
  "#...........#",
  "#...........#",
  "#############",
];

// Daten der Proben, die heute schon gehen; die Datenprüfung muss sie annehmen
const EFFEKTE = {
  // 1. Teilung
  sprossen: { schritte: [{ baustein: "beschwoeren", wesen: "hefezelle_probe", abstammung: true }] },
  gallerte_teilen: { schritte: [{ baustein: "beschwoeren", wesen: "gallerte_probe", abstammung: true }] },
  myzel_wachsen: { schritte: [{ baustein: "oberflaeche_setzen", art: "myzel_probe", menge: 1 }] },
  sporen_freisetzen: { schritte: [{ baustein: "gas_setzen", art: "sporen_probe", menge: 6 }] },
  zerfallen: { schritte: [{ baustein: "beschwoeren", wesen: "faulkeim_probe", anzahl: 2 }] },
  zweite_phase: { schritte: [{ baustein: "zustand_setzen", zustand: "raserei_probe" }, { baustein: "beschwoeren", wesen: "faulkeim_probe" }] },
  hieb_probe: { schritte: [{ baustein: "schaden", art: "magie", menge: 1 }] },
  schwerer_hieb_probe: { schritte: [{ baustein: "schaden", art: "magie", menge: 11 }] },
  // 3. Zauber über die Zeit
  hopfensud_giessen: { schritte: [{ baustein: "oberflaeche_setzen", art: "hopfensud", menge: 3, muster: { art: "kreis", radius: 1 } }] },
  hopfensud_beruhigt: { schritte: [{ baustein: "zustand_setzen", zustand: "beruhigt" }] },
  segen_setzen: { schritte: [{ baustein: "zustand_setzen", zustand: "gesegnet" }] },
  ritual_patzer: { schritte: [{ baustein: "schaden", art: "magie", menge: 5 }] },
  // 4. Psi
  gedankenstoss: { schritte: [{ baustein: "schaden", art: "psi", menge: 4 }, { baustein: "wert_aendern", wertName: "glimmer", menge: 10, auf: "quelle" }] },
  psi_rueckschlag_probe: { schritte: [{ baustein: "schaden", art: "psi", menge: 3 }] },
  // 7. Heiler
  heilspruch: { schritte: [{ baustein: "heilen", menge: 5 }] },
  // 8. Krankheit
  schleimbiss: { schritte: [{ baustein: "schaden", art: "gift", menge: 1 }] },
  anstecken: { schritte: [{ baustein: "zustand_setzen", zustand: "halsweh" }] },
  glotrot_ausbruch: { schritte: [{ baustein: "zustand_setzen", zustand: "glotrot" }] },
  glotrot_zehrt: { schritte: [{ baustein: "schaden", art: "gift", menge: 1 }] },
  glotrot_heilmittel: { schritte: [{ baustein: "zustand_entfernen", tag: "krankheit.glotrot" }] },
};

const ZUSTAENDE = {
  raserei_probe: { text: "zustand.raserei_probe", modifikatoren: [{ ziel: "genauigkeit", art: "plus", betrag: 20 }] },
  beruhigt: { text: "zustand.beruhigt", dauer: 200, modifikatoren: [{ ziel: "kosten.alle", art: "prozent", betrag: 50 }] },
  gesegnet: { text: "zustand.gesegnet", dauer: 1000, modifikatoren: [{ ziel: "genauigkeit", art: "plus", betrag: 10 }] },
  hopfenaura: {
    text: "zustand.hopfenaura", unterhalt: { mp: 1 },
    auren: [{ reichweite: 2, trifft: "feinde", modifikatoren: [{ ziel: "genauigkeit", art: "plus", betrag: -20 }] }],
  },
  // Krankheit in Stufen: die Vorstufe geht nach Ablauf in den Ausbruch über
  halsweh: { text: "zustand.halsweh", tags: ["krankheit", "krankheit.glotrot"], dauer: 300, beimAblauf: "glotrot_ausbruch" },
  glotrot: { text: "zustand.glotrot", tags: ["krankheit", "krankheit.glotrot"], jeTick: "glotrot_zehrt" },
};

const FAEHIGKEITEN = {
  sprossen: { text: "faehigkeit.sprossen", tags: ["koerper"], abklingzeit: 5, ziel: { art: "selbst" }, wirkung: "sprossen" },
  hopfensud: { text: "faehigkeit.hopfensud", tags: ["magie"], ziel: { art: "feld", reichweite: 6 }, wirkung: "hopfensud_giessen" },
  segensritual: { text: "faehigkeit.segensritual", tags: ["magie"], verbrauch: { mp: 20 }, dauer: { schritte: 3 }, unterbrechbar: true, ziel: { art: "selbst" }, wirkung: "segen_setzen", beimAbbruch: "ritual_patzer" },
  hopfenaura: { text: "faehigkeit.hopfenaura", art: "aufrecht", tags: ["magie"], verbrauch: { mp: 5 }, zustand: "hopfenaura" },
  gedankenstoss: { text: "faehigkeit.gedankenstoss", tags: ["psi"], verbrauch: { pp: 5 }, risiko: "psi_probe", ziel: { art: "wesen", reichweite: 5 }, wirkung: "gedankenstoss" },
  heilspruch: { text: "faehigkeit.heilspruch", tags: ["magie"], zweck: ["heilen"], ziel: { art: "wesen", reichweite: 5, trifft: "verbuendete" }, wirkung: "heilspruch" },
};

// Psi: nüchtern sicher (zur Probe), ab 3 ‰ sicherer Rückschlag
const RISIKEN = {
  psi_probe: [{ name: "rueckschlag", chance: [[0, 0], [299, 0], [300, 100]], wirkt: false, effekt: "psi_rueckschlag_probe" }],
};

const WESEN = {
  hefezelle_probe: {
    text: "wesen.hefezelle_probe", fraktion: "verderber", werte: { lp: { grundwert: 8 } }, ep: 4, sicht: { reichweite: 9 },
    faehigkeiten: ["sprossen"], ki: { modul: "jagen", letzteBekanntePosition: null, handlungen: [{ handlung: "faehigkeit", name: "sprossen" }] },
  },
  // Teilung beim Treffer (Gallerte in Brogue, Pudding in NetHack): jeder Schaden teilt, bis die Linie vier zählt
  gallerte_probe: {
    text: "wesen.gallerte_probe", fraktion: "verderber", werte: { lp: { grundwert: 10 } }, ep: 4,
    ausloeser: [{ bei: "nach_schaden", rolle: "ziel", effekt: "gallerte_teilen", wenn: [{ bedingung: "anzahl_unter", anzahl: 4, linie: true }] }],
  },
  // Myzel: der Schimmel lässt es nach jedem eigenen Zug wachsen, beim Tod setzt er Sporen frei
  schimmel_probe: {
    text: "wesen.schimmel_probe", fraktion: "verderber", werte: { lp: { grundwert: 6 } }, ep: 4,
    ausloeser: [{ bei: "zug_ende", effekt: "myzel_wachsen" }, { bei: "nach_tod", rolle: "ziel", ziel: "feld", effekt: "sporen_freisetzen" }],
  },
  // Zerfall: aus den Resten eines Bakteriums entstehen zwei Faulkeime
  bakterium_probe: {
    text: "wesen.bakterium_probe", fraktion: "verderber", werte: { lp: { grundwert: 6 } }, ep: 4,
    ausloeser: [{ bei: "nach_tod", rolle: "ziel", ziel: "feld", effekt: "zerfallen" }],
  },
  faulkeim_probe: { text: "wesen.faulkeim_probe", fraktion: "verderber", werte: { lp: { grundwert: 3 } }, ep: 1 },
  // Bossphase: unter der Hälfte der LP einmal Raserei und ein Begleiter
  boss_probe: {
    text: "wesen.boss_probe", fraktion: "verderber", werte: { lp: { grundwert: 20 } }, ep: 20,
    ausloeser: [{ bei: "nach_schaden", rolle: "ziel", effekt: "zweite_phase", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }, { bedingung: "ohne_zustand", zustand: "raserei_probe" }] }],
  },
};

const SCHICHTEN = {
  oberflaechen: {
    hopfensud: { text: "oberflaeche.hopfensud", schwund: 1, hoechstens: 3, jeTick: "hopfensud_beruhigt" },
    myzel_probe: { text: "oberflaeche.myzel_probe", ausbreitung: { chance: 100 } },
  },
  gase: { sporen_probe: { text: "gas.sporen_probe", abbau: 1 } },
};

function aufstellen({ regeln, gegenstaende = {}, effekte = {}, zustaende = {}, faehigkeiten = {} } = {}) {
  const spiel = miniSpiel(RAUM, {
    effekte: { ...EFFEKTE, ...effekte }, zustaende: { ...ZUSTAENDE, ...zustaende }, faehigkeiten: { ...FAEHIGKEITEN, ...faehigkeiten },
    risiken: RISIKEN, wesen: WESEN, schichten: SCHICHTEN, gegenstaende, regeln,
  });
  const ninkasi = spielerinSetzen(spiel, 1, 2);
  ninkasi.werte = werteAusDaten({ lp: { grundwert: 100 }, mp: { grundwert: 100 }, pp: { grundwert: 100 }, pegel: { anfangswert: 0 }, glimmer: { anfangswert: 0 } });
  ninkasi.faehigkeiten = Object.keys(FAEHIGKEITEN);
  ninkasi.sicht = { reichweite: 9 };
  ninkasi.inventar = [];
  akteurEinreihen(spiel.zustand, ninkasi.id, 0);
  allesSichtbar(spiel);
  return { spiel, ninkasi };
}

const entscheiden = (spiel, wesenMitKi) => holen("ki", "jagen")(spiel, wesenMitKi, wesenMitKi.ki);
const hefezelle = (spiel, x, y, wachzustand = "jagt") => {
  const zelle = wesen(spiel, x, y, "verderber", 8, structuredClone({ ...WESEN.hefezelle_probe, typ: "hefezelle_probe" }));
  zelle.ki.wachzustand = wachzustand;
  return zelle;
};
const alleVom = (spiel, typ) => Object.values(spiel.zustand.entitaeten).filter((entitaet) => entitaet.typ === typ);
const zellen = (spiel) => alleVom(spiel, "hefezelle_probe");
// Ein Wesen aus WESEN mit Werten nach den Daten
const probewesen = (spiel, typ, x, y) => {
  const { werte, fraktion, ...rest } = structuredClone(WESEN[typ]);
  return wesen(spiel, x, y, fraktion, werte.lp.grundwert, { ...rest, typ });
};
const treffen = (spiel, quelle, ziel, effekt = "hieb_probe") => {
  effektAnwenden(spiel, effekt, { quelleId: quelle.id, zielId: ziel.id });
  vorgangAbschliessen(spiel);
};

test("Datenprüfung: die Daten der gelungenen Proben sind gültig", () => {
  const daten = structuredClone(rohdaten);
  Object.assign(daten.effekte, EFFEKTE);
  Object.assign(daten.zustaende, ZUSTAENDE);
  Object.assign(daten.faehigkeiten, FAEHIGKEITEN);
  Object.assign(daten.risiken, RISIKEN);
  Object.assign(daten.wesen, WESEN);
  Object.assign(daten.schichten.oberflaechen, SCHICHTEN.oberflaechen);
  Object.assign(daten.schichten.gase, SCHICHTEN.gase);
  for (const typ of Object.keys(WESEN)) daten.zeichen.wesen[typ] = { zeichen: "h", farbe: "#ffffff" };
  for (const art of ["hopfensud", "myzel_probe", "sporen_probe"]) daten.zeichen.schichten[art] = { zeichen: "~", farbe: "#88aa44" };
  assert.deepEqual(vorbereiten(daten).fehler, []);
});

// 1. Teilung und Wachstum: Zellen, die sich teilen, Myzel, Zerfall und Bossphase

// Entschieden: eine Teilung ergibt zwei Wesen mit vollen Werten, Zweiteilung und Sprossung gehen also gleich
test("Teilung: eine jagende Zelle sprosst über eine Fähigkeit, die Tochter teilt Fraktion und EP-Topf", () => {
  const { spiel, ninkasi } = aufstellen();
  const mutter = hefezelle(spiel, 6, 2);
  const befehl = entscheiden(spiel, mutter);
  assert.equal(befehl.faehigkeit, "sprossen");
  befehlAusfuehren(spiel, mutter, befehl);
  vorgangAbschliessen(spiel);
  const [, tochter] = zellen(spiel);
  assert.ok(tochter, "eine zweite Zelle");
  assert.equal(fraktionVon(tochter), "verderber");
  assert.equal(tochter.topfId, mutter.topfId);
  assert.equal(tochter.werte.lp.aktuell, 8, "Sprossung: die Tochter kommt mit vollen LP");
  assert.ok(ninkasi);
});

test("Teilung: an der Obergrenze der Population versucht es keine Zelle, statt einen Zug zu verlieren", () => {
  const { spiel } = aufstellen({ regeln: { population: { hoechstWesen: 2 } } });
  const mutter = hefezelle(spiel, 6, 2);
  assert.notEqual(entscheiden(spiel, mutter)?.faehigkeit, "sprossen");
  assert.equal(zellen(spiel).length, 1);
});

// Entschieden: Handlungen nur, solange die KI ihre Beute sieht
test("Teilung: ohne Beute in Sicht teilt sich nichts", () => {
  const { spiel } = aufstellen();
  const mutter = hefezelle(spiel, 6, 2, "wach");
  assert.notEqual(entscheiden(spiel, mutter)?.faehigkeit, "sprossen");
});

test("Teilung: eine Art hört bei ihrer eigenen Obergrenze auf", () => {
  const { spiel } = aufstellen({ faehigkeiten: { sprossen: { ...FAEHIGKEITEN.sprossen, voraussetzungen: [{ bedingung: "anzahl_unter", anzahl: 2 }] } } });
  const mutter = hefezelle(spiel, 6, 2);
  assert.equal(entscheiden(spiel, mutter)?.faehigkeit, "sprossen", "allein darunter");
  hefezelle(spiel, 8, 2);
  assert.notEqual(entscheiden(spiel, mutter)?.faehigkeit, "sprossen", "zu zweit an der Grenze");
});

test("Teilung: eine Linie hört bei ihrer eigenen Obergrenze auf, eine fremde Linie nicht", () => {
  const { spiel } = aufstellen({ faehigkeiten: { sprossen: { ...FAEHIGKEITEN.sprossen, voraussetzungen: [{ bedingung: "anzahl_unter", anzahl: 2, linie: true }] } } });
  const mutter = hefezelle(spiel, 6, 2);
  befehlAusfuehren(spiel, mutter, entscheiden(spiel, mutter));
  vorgangAbschliessen(spiel);
  const [, tochter] = zellen(spiel);
  const fremde = hefezelle(spiel, 9, 3);
  assert.equal(faehigkeitPruefen(spiel, tochter, "sprossen"), "voraussetzung", "Mutter und Tochter sind zwei");
  assert.equal(entscheiden(spiel, fremde)?.faehigkeit, "sprossen", "die fremde Linie zählt nur sich");
});

// Teilung beim Treffer über einen Auslöser, nach den Gallerten in Brogue und den Puddings in NetHack
test("Teilung beim Treffer: jeder Schaden teilt die Gallerte, bis ihre Linie vier zählt, jede Teilung mit vollen LP", () => {
  const { spiel, ninkasi } = aufstellen();
  const gallerte = probewesen(spiel, "gallerte_probe", 6, 2);
  for (let i = 0; i < 5; i++) treffen(spiel, ninkasi, gallerte);
  const gallerten = alleVom(spiel, "gallerte_probe");
  assert.equal(gallerten.length, 4);
  assert.equal(gallerte.werte.lp.aktuell, 5);
  assert.ok(gallerten.every((andere) => andere.topfId === gallerte.id), "eine Linie mit einem EP-Topf");
  assert.ok(gallerten.filter((andere) => andere !== gallerte).every((tochter) => tochter.werte.lp.aktuell === 10));
});

// Myzel und Sporen nur aus Daten: Oberfläche mit Ausbreitung, Auslöser an zug_ende und nach_tod
test("Myzel: der Schimmel lässt Myzel wachsen, beim Tod setzt er Sporen auf seinem Feld frei", () => {
  const { spiel, ninkasi } = aufstellen();
  const schimmel = probewesen(spiel, "schimmel_probe", 6, 2);
  befehlAusfuehren(spiel, schimmel, { art: "warten" });
  vorgangAbschliessen(spiel);
  assert.equal(schichtAuf(spiel, "oberflaeche", 6, 2)?.art, "myzel_probe");
  treffen(spiel, ninkasi, schimmel, "schwerer_hieb_probe");
  assert.equal(spiel.zustand.entitaeten[schimmel.id], undefined);
  assert.deepEqual([schichtAuf(spiel, "gas", 6, 2)?.art, schichtAuf(spiel, "gas", 6, 2)?.menge], ["sporen_probe", 6]);
});

// Zweite Phase eines Kampfes: aus den Resten entstehen neue Wesen
test("Zerfall: aus den Resten eines Bakteriums entstehen zwei Faulkeime in seiner Fraktion, ohne Beschwörerin", () => {
  const { spiel, ninkasi } = aufstellen();
  const bakterium = probewesen(spiel, "bakterium_probe", 6, 2);
  treffen(spiel, ninkasi, bakterium, "schwerer_hieb_probe");
  const faulkeime = alleVom(spiel, "faulkeim_probe");
  assert.equal(spiel.zustand.entitaeten[bakterium.id], undefined);
  assert.equal(faulkeime.length, 2);
  assert.ok(faulkeime.every((keim) => fraktionVon(keim) === "verderber" && keim.beschworenVon === undefined));
  assert.ok(faulkeime.every((keim) => Math.max(Math.abs(keim.position.x - 6), Math.abs(keim.position.y - 2)) <= 1), "um sein Feld");
});

test("Bossphase: unter der Hälfte der LP einmal Raserei und ein Begleiter, beim nächsten Treffer nicht noch einmal", () => {
  const { spiel, ninkasi } = aufstellen();
  const boss = probewesen(spiel, "boss_probe", 6, 2);
  treffen(spiel, ninkasi, boss);
  assert.equal(hatZustand(boss, "raserei_probe"), false, "über der Hälfte");
  treffen(spiel, ninkasi, boss, "schwerer_hieb_probe");
  assert.equal(hatZustand(boss, "raserei_probe"), true);
  treffen(spiel, ninkasi, boss);
  const begleiter = alleVom(spiel, "faulkeim_probe");
  assert.equal(begleiter.length, 1);
  assert.equal(begleiter[0].beschworenVon, boss.id);
});

// 2. Ein Kontrolleur mit Taschenlampe im Dunkeln (Licht, siehe docs/Welt.md)

test("Kontrolleur: im Dunkeln bemerkt er Ninkasi nur im Schein seiner Lampe", () => {
  // Ebene in Finsternis, Lampe als angelegter Gegenstand mit licht: { reichweite: 3, staerke: 80 }; im Abstand 6
  // steht Ninkasi im Finstern, er sieht sie nicht; drei Felder vor ihm ist es dämmrig (40), er sieht und bemerkt sie
  const { spiel, ninkasi } = aufstellen({ regeln: { wahrnehmung: { bemerkenChance: 100 } } });
  spiel.zustand.ebene.licht = { grundhelligkeit: 0 };
  const kontrolleur = wesen(spiel, 7, 2, "kontrolle", 20, { sicht: { reichweite: 9 }, ki: { modul: "jagen", wachzustand: "wach", letzteBekanntePosition: null } });
  const lampe = gegenstandTragen(spiel, kontrolleur, { typ: "taschenlampe", ausruestung: { platz: "hand" }, licht: { reichweite: 3, staerke: 80 } });
  kontrolleur.ausgeruestet = [lampe.id];
  wahrnehmen(spiel, kontrolleur);
  assert.equal(kontrolleur.ki.wachzustand, "wach", "Ninkasi steht im Dunkeln");
  positionSetzen(spiel.zustand, ninkasi, { x: 4, y: 2 });
  wahrnehmen(spiel, kontrolleur);
  assert.equal(kontrolleur.ki.wachzustand, "jagt", "im Schein der Lampe");
});

// 3. Ein Zauber, der über die Zeit wirkt

test("Fläche über die Zeit: Hopfensud beruhigt, wer darin steht, und trocknet ab", () => {
  const { spiel, ninkasi } = aufstellen();
  const feind = wesen(spiel, 6, 2, "verderber", 20);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "hopfensud", ziel: { x: 6, y: 2 } });
  assert.equal(schichtAuf(spiel, "oberflaeche", 6, 2)?.art, "hopfensud");
  weltLaufenLassen(spiel, 100);
  assert.ok(hatZustand(feind, "beruhigt"));
  weltLaufenLassen(spiel, 600);
  assert.equal(schichtAuf(spiel, "oberflaeche", 6, 2), null, "abgetrocknet");
});

test("Fläche über die Zeit: die Wirkung wird der Wirkenden zugerechnet", () => {
  const { spiel, ninkasi } = aufstellen();
  const feind = wesen(spiel, 6, 2, "verderber", 20);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "hopfensud", ziel: { x: 6, y: 2 } });
  weltLaufenLassen(spiel, 100);
  assert.equal(feind.zustaende.find((instanz) => instanz.name === "beruhigt").urheberId, ninkasi.id);
});

test("Ritual: drei Schritte, bezahlt am Anfang, der Segen kommt nach dem letzten", () => {
  const { spiel, ninkasi } = aufstellen();
  assert.equal(befehlGeben(spiel, { art: "faehigkeit", faehigkeit: "segensritual" }).ok, true);
  assert.equal(ninkasi.werte.mp.aktuell, 80);
  assert.ok(hatZustand(ninkasi, "gesegnet"));
  assert.equal(modifiziert(spiel, ninkasi, "genauigkeit", 70), 80);
});

test("Aufrechter Zauber mit Aura: Feinde nah bei der Wirkenden treffen schlechter, bis sie ihn beendet", () => {
  const { spiel, ninkasi } = aufstellen();
  const nah = wesen(spiel, 3, 2, "verderber", 20);
  const fern = wesen(spiel, 8, 2, "verderber", 20);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "hopfenaura" });
  assert.deepEqual([modifiziert(spiel, nah, "genauigkeit", 70), modifiziert(spiel, fern, "genauigkeit", 70)], [50, 70]);
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "hopfenaura" });
  assert.equal(modifiziert(spiel, nah, "genauigkeit", 70), 70);
});

// 4. Ein Psi-Zauber mit Rückschlag

test("Psi: stärker mit Pegel, Glimmer steigt bei der Wirkenden, ab 3 ‰ schlägt er zurück", () => {
  const { spiel, ninkasi } = aufstellen();
  const feind = wesen(spiel, 5, 2, "verderber", 30);
  modifikatorHinzufuegen(ninkasi, { ziel: "schaden", tag: "psi", art: "prozent", betrag: 50, wenn: [{ bedingung: "pegel_ab", wert: 100 }], quelle: "probe" });
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "gedankenstoss", ziel: { id: feind.id } });
  assert.equal(feind.werte.lp.aktuell, 26, "nüchtern 4");
  assert.equal(ninkasi.werte.glimmer.aktuell, 10);
  ninkasi.werte.pegel.aktuell = 150;
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "gedankenstoss", ziel: { id: feind.id } });
  assert.equal(feind.werte.lp.aktuell, 20, "mit 1,5 ‰ 6");
  ninkasi.werte.pegel.aktuell = 300;
  befehlAusfuehren(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "gedankenstoss", ziel: { id: feind.id } });
  assert.equal(feind.werte.lp.aktuell, 20, "Rückschlag: wirkt nicht");
  assert.equal(ninkasi.werte.lp.aktuell, 95, "der Rückschlag trägt das Tag psi und wächst mit: 3 x 1,5, gerundet");
  assert.equal(ninkasi.werte.pp.aktuell, 85, "bezahlt ist bezahlt");
});

// 5. Ein Gegenstand mit Ersatzwirkung (Punkt 4)

test("Phönixbier: verhindert einmal den Tod und ist dann verbraucht", () => {
  // ersatz am Gegenstand wirkt aus dem Gepäck (passiv), siehe docs/Wirkungen.md, Ersatzwirkungen
  const { spiel, ninkasi } = aufstellen({
    effekte: { phoenix: { schritte: [{ baustein: "heilen", menge: 10 }] }, toedlich: { schritte: [{ baustein: "schaden", art: "stumpf", menge: 500 }] } },
  });
  const bier = gegenstandTragen(spiel, ninkasi, { typ: "phoenixbier", ersatz: [{ bei: "vor_tod", effekt: "phoenix", verbrauchen: true }] });
  effektAnwenden(spiel, "toedlich", { quelleId: null, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.equal(ninkasi.werte.lp.aktuell, 10);
  assert.equal(spiel.zustand.entitaeten[bier.id], undefined);
});

// 6. Ein Gegenstand, der eine Fähigkeit gewährt, und eine Schriftrolle, die eine lehrt (Punkt 5)

const ANSTURM = { ansturm: { text: "faehigkeit.ansturm", ziel: { art: "wesen", reichweite: 3 }, wirkung: "ritual_patzer" } };

test("Braupaddel: angelegt gewährt es den Ansturm", () => {
  const { spiel, ninkasi } = aufstellen({ faehigkeiten: ANSTURM });
  ninkasi.faehigkeiten = [];
  ninkasi.plaetze = { hand: 2 };
  const feind = wesen(spiel, 3, 2, "verderber", 20);
  const paddel = gegenstandTragen(spiel, ninkasi, { typ: "braupaddel", ausruestung: { platz: "hand", faehigkeiten: ["ansturm"] } });
  befehlAusfuehren(spiel, ninkasi, { art: "anlegen", gegenstandId: paddel.id });
  assert.equal(holen("befehle", "faehigkeit").pruefen(spiel, ninkasi, { art: "faehigkeit", faehigkeit: "ansturm", ziel: { id: feind.id } }), null);
});

test("Schriftrolle: Lesen lehrt den Ansturm dauerhaft, die Rolle ist verbraucht", () => {
  const { spiel, ninkasi } = aufstellen({ faehigkeiten: ANSTURM, effekte: { ansturm_lehren: { schritte: [{ baustein: "faehigkeit_lehren", faehigkeit: "ansturm" }] } } });
  ninkasi.faehigkeiten = [];
  const rolle = gegenstandTragen(spiel, ninkasi, { typ: "schriftrolle", lesbar: { effekt: "ansturm_lehren" } });
  befehlAusfuehren(spiel, ninkasi, { art: "lesen", gegenstandId: rolle.id });
  assert.deepEqual(ninkasi.faehigkeiten, ["ansturm"]);
  assert.equal(spiel.zustand.entitaeten[rolle.id], undefined);
});

// 7. Ein Heiler unter den Gegnern (Punkt 7)

test("Heiler: heilt einen verwundeten Verbündeten", () => {
  const { spiel } = aufstellen();
  const heilen = { handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "zielLpProzent", kurve: "heilenNachLp" }] };
  const heiler = wesen(spiel, 7, 2, "verderber", 10, { sicht: { reichweite: 9 }, faehigkeiten: ["heilspruch"], ki: { modul: "jagen", letzteBekanntePosition: null, handlungen: [heilen] } });
  const verwundeter = wesen(spiel, 5, 2, "verderber", 10);
  verwundeter.werte.lp.aktuell = 3;
  const befehl = entscheiden(spiel, heiler);
  assert.deepEqual(befehl, { art: "faehigkeit", faehigkeit: "heilspruch", ziel: { id: verwundeter.id } });
});

test("Heiler, was heute geht: eine Aura stärkt Verbündete in der Nähe", () => {
  const { spiel } = aufstellen();
  wesen(spiel, 7, 2, "verderber", 10, { auren: [{ reichweite: 2, trifft: "verbuendete", modifikatoren: [{ ziel: "regeneration.lp", art: "plus", betrag: 20 }] }] });
  const nah = wesen(spiel, 8, 2, "verderber", 10);
  const fern = wesen(spiel, 11, 2, "verderber", 10);
  assert.deepEqual([modifiziert(spiel, nah, "regeneration.lp", 0), modifiziert(spiel, fern, "regeneration.lp", 0)], [20, 0]);
});

// 8. Eine Krankheit in Stufen

test("Krankheit: ein Biss steckt über einen Auslöser an, nach Ablauf bricht sie aus und zehrt", () => {
  const { spiel, ninkasi } = aufstellen();
  const schleim = wesen(spiel, 2, 2, "verderber", 10, {
    angriffe: [{ name: "biss", genauigkeit: 100, effekt: "schleimbiss" }],
    ausloeser: [{ bei: "nach_schaden", rolle: "quelle", ziel: "ziel", effekt: "anstecken" }],
  });
  nahkampf(spiel, schleim, ninkasi);
  vorgangAbschliessen(spiel);
  assert.ok(hatZustand(ninkasi, "halsweh"));
  weltLaufenLassen(spiel, 300);
  assert.ok(!hatZustand(ninkasi, "halsweh"));
  assert.ok(hatZustand(ninkasi, "glotrot"));
  const lp = ninkasi.werte.lp.aktuell;
  weltLaufenLassen(spiel, 500);
  assert.ok(ninkasi.werte.lp.aktuell < lp, "Glotrot zehrt");
});

test("Krankheit: nur das passende Heilmittel nimmt sie", () => {
  const { spiel, ninkasi } = aufstellen();
  zustandSetzen(spiel, ninkasi, "glotrot");
  effektAnwenden(spiel, "glotrot_heilmittel", { quelleId: ninkasi.id, zielId: ninkasi.id });
  assert.ok(!hatZustand(ninkasi, "glotrot"));
});

test("Krankheit: wer die Vorstufe heilt, löst den Ausbruch nicht aus", () => {
  const { spiel, ninkasi } = aufstellen({ effekte: { vorstufe_heilen: { schritte: [{ baustein: "zustand_entfernen", zustand: "halsweh" }] } } });
  zustandSetzen(spiel, ninkasi, "halsweh");
  effektAnwenden(spiel, "vorstufe_heilen", { quelleId: ninkasi.id, zielId: ninkasi.id });
  vorgangAbschliessen(spiel);
  assert.ok(!hatZustand(ninkasi, "glotrot"));
});

test("Krankheit: die Vorstufe heilt mit einer Chance von selbst aus", () => {
  // chance 0: sicher ausgeheilt
  const { spiel, ninkasi } = aufstellen({
    effekte: { vielleicht_ausbruch: { schritte: [{ baustein: "zufall", chance: 0, effekt: "glotrot_ausbruch" }] } },
    zustaende: { halsweh: { ...ZUSTAENDE.halsweh, beimAblauf: "vielleicht_ausbruch" } },
  });
  zustandSetzen(spiel, ninkasi, "halsweh");
  weltLaufenLassen(spiel, 300);
  assert.ok(!hatZustand(ninkasi, "halsweh"));
  assert.ok(!hatZustand(ninkasi, "glotrot"));
});
