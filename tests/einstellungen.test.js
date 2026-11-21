// Einstellungen 0.30.0: Katalog (eingabe/einstellungskatalog.js), eigene Tastenbelegung (eingabe/belegunganpassen.js),
// Einstellungsfenster (eingabe/einstellungsfenster.js, anzeige/einstellungsanzeige.js), Befehlszeile
// (eingabe/befehlszeile.js) und Suche im Verlauf (eingabe/verlauf.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import "../src/kern/spiel.js";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import vorgaben from "../src/eingabe/einstellungen.js";
import belegungsVorgabe from "../src/eingabe/belegung.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { REITER, EINSTELLUNGEN, einstellungLesen, einstellungSetzen, einstellungSchritt, einstellungVorgabe } from "../src/eingabe/einstellungskatalog.js";
import { abweichungenAnwenden, tasteSetzen, tasteEntfernen, aktionAufVorgabe, konfliktVon, tasteGesperrt, leereAbweichungen, aenderbareTasten } from "../src/eingabe/belegunganpassen.js";
import { einstellungsfensterOeffnen, einstellungsfensterTaste, tastenZeilen, ALLE_AUF_VORGABE } from "../src/eingabe/einstellungsfenster.js";
import { befehlstreffer, befehlseintraege, befehlsquelleAnmelden, befehlszeileOeffnen, befehlszeileTaste } from "../src/eingabe/befehlszeile.js";
import { verlaufOeffnen, verlaufTaste, passtZumFilter } from "../src/eingabe/verlauf.js";
import { suchform, texteingabeTaste } from "../src/eingabe/texteingabe.js";
import { aktionDerTaste } from "../src/eingabe/aktionskatalog.js";
import { fensterHtml } from "../src/anzeige/fenster.js";
import { fensterOeffnen } from "../src/eingabe/fenster.js";
import "../src/anzeige/einstellungsanzeige.js";
import { erstelleTexte } from "../src/anzeige/texte.js";
import { erstelleGrammatik } from "../src/anzeige/grammatik.js";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);
const daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });

test("Katalog: jede Einstellung hat Reiter, Texte und eine passende Vorgabe", () => {
  for (const [id, eintrag] of Object.entries(EINSTELLUNGEN)) {
    assert.ok(REITER.includes(eintrag.reiter) && eintrag.reiter !== "tasten", `${id}: Reiter`);
    assert.ok(`einstellung.${id}` in texteDe && `einstellung.${id}.erklaerung` in texteDe, `${id}: Texte`);
    const wert = einstellungLesen(vorgaben, id);
    if (eintrag.art === "zahl") assert.ok(wert >= eintrag.min && wert <= eintrag.max && (wert - eintrag.min) % eintrag.schritt === 0, `${id}: Vorgabe in den Grenzen`);
    if (eintrag.art === "auswahl") assert.ok(eintrag.werte.includes(wert), `${id}: Vorgabe unter den Werten`);
    if (eintrag.art === "schalter" || eintrag.art === "listenschalter") assert.equal(typeof wert, "boolean", `${id}: Schalter`);
  }
  for (const reiter of REITER) assert.ok(`einstellung.reiter.${reiter}` in texteDe);
});

test("Setzen, Schritt und Vorgabe: Grenzen, Auswahl rundum, Listenschalter, das Original bleibt", () => {
  assert.equal(einstellungSetzen(vorgaben, "logZeilen", 99).logZeilen, 14, "obere Grenze");
  assert.equal(einstellungSchritt(vorgaben, "reisePause", -1).reisePause, 20);
  assert.equal(einstellungSchritt({ ...vorgaben, layout: "kompakt" }, "layout", 1).layout, "a", "rundum");
  const ohneHalt = einstellungSchritt(vorgaben, "haltBeiGegenstand", 1);
  assert.deepEqual(ohneHalt.reiseHalt, ["gegner_in_sicht", "schaden"]);
  assert.equal(einstellungLesen(einstellungVorgabe(ohneHalt, vorgaben, "haltBeiGegenstand"), "haltBeiGegenstand"), true);
  assert.deepEqual(vorgaben.reiseHalt, ["gegner_in_sicht", "schaden", "gegenstand"], "Vorgaben unverändert");
  assert.equal(einstellungSetzen(vorgaben, "zoom", 17).zoom, 16, "nur Werte der Auswahl");
});

test("Belegung: neue Taste ersetzt die alte, Konflikt verdrängt, Zeichen verliert seine Aktion, Vorgabe räumt auf", () => {
  const start = leereAbweichungen();
  const { abweichungen, verdraengt } = tasteSetzen(belegungsVorgabe, start, "inventar", { code: "KeyI" }, { code: "KeyQ", zeichen: "q" });
  assert.equal(verdraengt, null);
  const belegung = abweichungenAnwenden(belegungsVorgabe, abweichungen);
  assert.equal(aktionDerTaste(belegung, "KeyQ", "q"), "inventar");
  assert.equal(aktionDerTaste(belegung, "KeyI", "i"), null, "die alte Taste ist frei");
  assert.equal(konfliktVon(belegung, { code: "KeyG", zeichen: "g" }, "inventar"), "aufheben");
  const verschoben = tasteSetzen(belegungsVorgabe, abweichungen, "inventar", null, { code: "KeyG", zeichen: "g" });
  assert.equal(verschoben.verdraengt, "aufheben");
  assert.equal(aktionDerTaste(abweichungenAnwenden(belegungsVorgabe, verschoben.abweichungen), "KeyG", "g"), "inventar");
  const punkt = tasteSetzen(belegungsVorgabe, start, "aufheben", null, { code: "Period", zeichen: "." });
  assert.equal(punkt.verdraengt, "warten", "das Zeichen . gehörte warten");
  assert.equal(aktionDerTaste(abweichungenAnwenden(belegungsVorgabe, punkt.abweichungen), "Period", "."), "aufheben");
  const zurueck = aktionAufVorgabe(belegungsVorgabe, abweichungen, "inventar");
  assert.deepEqual(zurueck, leereAbweichungen(), "zurück auf Vorgabe hinterlässt keine Abweichung");
  const ohne = tasteEntfernen(belegungsVorgabe, start, { code: "KeyG" });
  assert.equal(aktionDerTaste(abweichungenAnwenden(belegungsVorgabe, ohne), "KeyG", "g"), null);
  assert.deepEqual(aenderbareTasten(belegungsVorgabe, "laufen"), [], "Umschalt+Richtung ist fest");
  for (const taste of [{ code: "Escape" }, { code: "Enter" }, { code: "Tab" }, { code: "F5" }, { code: "Minus", zeichen: "?" }]) assert.ok(tasteGesperrt(taste), JSON.stringify(taste));
  assert.ok(!tasteGesperrt({ code: "KeyQ", zeichen: "q" }));
});

test("Einstellungsfenster: Reiter, Ändern, Vorgabe, Knopf; Tasten mit Aufnahme, Sperre, Konflikt und Vorgabe für alle", () => {
  let kontext = { einstellungen: structuredClone(vorgaben), vorgaben, belegung: belegungsVorgabe, belegungsVorgabe, abweichungen: leereAbweichungen() };
  let zustand = einstellungsfensterOeffnen();
  assert.equal(zustand.reiter, "anzeige");
  assert.equal(einstellungsfensterTaste(zustand, { code: "Tab", umschalt: true }, kontext).zustand.reiter, "barrierefreiheit", "Umschalt+Tab rückwärts");
  const groesser = einstellungsfensterTaste({ ...zustand, gewaehlt: 1 }, { code: "ArrowRight" }, kontext);
  assert.equal(groesser.einstellungen.oberflaecheGroesse, 16);
  assert.equal(einstellungsfensterTaste({ ...zustand, gewaehlt: 1 }, { code: "Delete" }, { ...kontext, einstellungen: groesser.einstellungen }).einstellungen.oberflaecheGroesse, 15);
  assert.deepEqual(einstellungsfensterTaste(einstellungsfensterOeffnen("vollbild"), { code: "Enter" }, kontext).aktion, "vollbild");
  assert.deepEqual(einstellungsfensterOeffnen("farbenblind").reiter, "barrierefreiheit");
  // Tasten: Zeile Inventar, Enter nimmt auf, gesperrt, dann q
  zustand = { ...einstellungsfensterOeffnen(), reiter: "tasten", gewaehlt: tastenZeilen().indexOf("inventar") };
  zustand = einstellungsfensterTaste(zustand, { code: "Enter" }, kontext).zustand;
  assert.equal(zustand.aufnahme, true);
  assert.equal(einstellungsfensterTaste(zustand, { code: "Escape" }, kontext).zustand.aufnahme, false, "Esc bricht die Aufnahme ab, statt zu schließen");
  assert.equal(einstellungsfensterTaste(zustand, { code: "F5", zeichen: "F5" }, kontext).zustand.hinweis, "gesperrt");
  const belegt = einstellungsfensterTaste(zustand, { code: "KeyQ", zeichen: "q" }, kontext);
  assert.equal(aktionDerTaste(abweichungenAnwenden(belegungsVorgabe, belegt.abweichungen), "KeyQ", "q"), "inventar");
  // Konflikt mit g: erst Hinweis, Enter bestätigt
  const konflikt = einstellungsfensterTaste(zustand, { code: "KeyG", zeichen: "g" }, kontext);
  assert.equal(konflikt.zustand.konflikt.verdraengt, "aufheben");
  assert.equal(konflikt.abweichungen, undefined, "noch nichts geändert");
  const bestaetigt = einstellungsfensterTaste(konflikt.zustand, { code: "Enter" }, kontext);
  assert.equal(aktionDerTaste(abweichungenAnwenden(belegungsVorgabe, bestaetigt.abweichungen), "KeyG", "g"), "inventar");
  kontext = { ...kontext, abweichungen: bestaetigt.abweichungen };
  const alle = { ...einstellungsfensterOeffnen(), reiter: "tasten", gewaehlt: tastenZeilen().indexOf(ALLE_AUF_VORGABE) };
  assert.deepEqual(einstellungsfensterTaste(alle, { code: "Enter" }, kontext).abweichungen, leereAbweichungen());
});

test("Befehlszeile: Umlaute, Wortanfang zuerst, Tab übernimmt, Enter führt aus, weitere Quellen melden sich an", () => {
  const kontext = { texte };
  const eintraege = befehlseintraege(kontext);
  assert.ok(eintraege.some((eintrag) => eintrag.ziel.einstellung === "farbenblind"));
  assert.ok(!eintraege.some((eintrag) => eintrag.ziel.aktion === "laufen"), "Laufen braucht eine Richtung");
  assert.equal(befehlstreffer(eintraege, "uebersicht")[0].ziel.aktion, "karte", "ue findet ü");
  assert.equal(befehlstreffer(eintraege, "rast")[0].ziel.aktion, "rasten", "Wortanfang vor Teilwort");
  assert.equal(befehlstreffer(eintraege, "zzzz").length, 0);
  let zustand = befehlszeileOeffnen();
  for (const zeichen of "inve") zustand = befehlszeileTaste(zustand, { code: `Key${zeichen.toUpperCase()}`, zeichen }, kontext).zustand;
  assert.equal(zustand.eingabe, "inve");
  zustand = befehlszeileTaste(zustand, { code: "Backspace" }, kontext).zustand;
  assert.equal(zustand.eingabe, "inv");
  assert.equal(befehlszeileTaste(zustand, { code: "Tab" }, kontext).zustand.eingabe, "Inventar");
  assert.deepEqual(befehlszeileTaste(zustand, { code: "Enter" }, kontext), { zustand: null, befehlszeile: { aktion: "inventar" } });
  befehlsquelleAnmelden("testquelle", () => [{ schluessel: "testrezept", text: "Hopfentrunk", ziel: { aktion: "hilfe" } }]);
  assert.equal(befehlstreffer(befehlseintraege(kontext), "hopfen")[0].text, "Hopfentrunk");
});

test("Suche im Verlauf und Texteingabe", () => {
  assert.equal(suchform("Größe Übel"), "groesse uebel");
  assert.equal(texteingabeTaste("ab", { code: "Backspace" }), "a");
  assert.equal(texteingabeTaste("ab", { code: "ArrowLeft", zeichen: "ArrowLeft" }), null, "keine Texttaste");
  let zustand = verlaufOeffnen();
  zustand = verlaufTaste(zustand, { code: "Digit7", zeichen: "/" }).zustand;
  assert.equal(zustand.sucheAktiv, true);
  for (const zeichen of "rat") zustand = verlaufTaste(zustand, { code: "KeyX", zeichen }).zustand;
  assert.equal(zustand.suche, "rat");
  zustand = verlaufTaste(zustand, { code: "Enter" }).zustand;
  assert.deepEqual([zustand.sucheAktiv, zustand.suche], [false, "rat"], "Enter beendet die Eingabe, die Suche bleibt");
  assert.ok(passtZumFilter({ spalte: "kampf", art: "angriff", text: "Die Ratte beißt." }, "alle", zustand.suche));
  assert.ok(!passtZumFilter({ spalte: "kampf", art: "angriff", text: "Ninkasi trinkt." }, "alle", zustand.suche));
  zustand = verlaufTaste(zustand, { code: "Escape" }).zustand;
  assert.deepEqual([zustand !== null, zustand.suche], [true, ""], "erstes Esc löscht die Suche");
  assert.equal(verlaufTaste(zustand, { code: "Escape" }).zustand, null, "zweites Esc schließt");
});

test("Anzeige: alle Reiter des Einstellungsfensters und die Befehlszeile ohne fehlende Texte", (t) => {
  const warnungen = [];
  t.mock.method(console, "warn", (meldung) => warnungen.push(meldung));
  const spiel = neuesSpiel(daten, 3);
  const umgebung = { spiel, daten, texte, belegung: belegungsVorgabe, belegungsVorgabe, abweichungen: leereAbweichungen(), einstellungen: vorgaben, vorgaben, logzeilen: [] };
  for (const reiter of REITER) {
    const html = fensterHtml(umgebung, fensterOeffnen([], "einstellungen", { ...einstellungsfensterOeffnen(), reiter }));
    assert.match(html, new RegExp(texteDe[`einstellung.reiter.${reiter}`]));
  }
  const konflikt = { ...einstellungsfensterOeffnen(), reiter: "tasten", konflikt: { neueTaste: { code: "KeyG", zeichen: "g" }, verdraengt: "aufheben" } };
  assert.match(fensterHtml(umgebung, fensterOeffnen([], "einstellungen", konflikt)), /gehört schon zu: aufheben/);
  assert.match(fensterHtml(umgebung, fensterOeffnen([], "befehlszeile", { eingabe: "kar", gewaehlt: 0 })), /:kar.*Übersichtskarte/s);
  assert.deepEqual(warnungen, []);
});
