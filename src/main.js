// Einstieg im Browser: verdrahtet Logik, Anzeige und Eingabe.
// Startwert per URL (?seed=1234), sonst zufällig; wird in die URL geschrieben, damit Neuladen denselben Lauf ergibt.

import VERSION from "./version.js";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "./eingabe/belegung.js";
import vorgaben from "./eingabe/einstellungen.js";
import { datenLaden, neuesSpiel, befehlGeben } from "./kern/spiel.js";
import { hoererAnmelden } from "./kern/ereignisse.js";
import { startwertAbleiten } from "./kern/zufall.js";
import { spielerin } from "./kern/zustand.js";
import { weg } from "./welt/wege.js";
import { erstelleTexte } from "./anzeige/texte.js";
import { erstelleGrammatik } from "./anzeige/grammatik.js";
import { Renderer } from "./anzeige/renderer.js";
import { neueKamera, folgen } from "./anzeige/kamera.js";
import { Oberflaeche } from "./anzeige/oberflaeche.js";
import { Log } from "./anzeige/log.js";
import { uebersetzen } from "./eingabe/eingabe.js";
import { feldAnPixel, klickDeuten } from "./eingabe/maus.js";
import { reiseBeginnen, naechsterReiseschritt } from "./eingabe/reise.js";

const SPEICHERSCHLUESSEL_EINSTELLUNGEN = "battle-ninkasi.einstellungen";
const RAD_PAUSE_MS = 150; // zwischen zwei Zoomschritten per Rad

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);

function fehlerZeigen(titel, meldung) {
  const fehlerElement = document.getElementById("fehler");
  fehlerElement.hidden = false;
  fehlerElement.textContent = `${titel}\n\n${meldung}`;
}

// Einstellungen sind keine Befehle; gespeichert werden nur Abweichungen von den Vorgaben
function einstellungenLaden() {
  try {
    return { ...structuredClone(vorgaben), ...JSON.parse(localStorage.getItem(SPEICHERSCHLUESSEL_EINSTELLUNGEN) || "{}") };
  } catch {
    return structuredClone(vorgaben);
  }
}
function einstellungenSpeichern(aktuelleEinstellungen) {
  const abweichungen = {};
  for (const [name, wert] of Object.entries(aktuelleEinstellungen)) {
    if (JSON.stringify(wert) !== JSON.stringify(vorgaben[name])) abweichungen[name] = wert;
  }
  try { localStorage.setItem(SPEICHERSCHLUESSEL_EINSTELLUNGEN, JSON.stringify(abweichungen)); } catch { /* ohne Speicher weiter */ }
}

function startwertAusUrl() {
  const startwertText = new URLSearchParams(location.search).get("seed");
  if (startwertText === null || startwertText === "") return null;
  return /^\d+$/.test(startwertText) ? Number(startwertText) >>> 0 : startwertAbleiten(0, startwertText);
}

function zufaelligerStartwert() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

let daten;
try {
  daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
} catch (fehler) {
  fehlerZeigen(texte.text("ui.datenfehler"), fehler.message);
  throw fehler;
}

const einstellungen = einstellungenLaden();
if (!einstellungen.zoomstufen.includes(einstellungen.zoom)) einstellungen.zoom = einstellungen.zoomstufen[0];

const kartenCanvas = document.getElementById("karte-canvas");
const renderer = new Renderer(kartenCanvas, daten.zeichen);
const oberflaeche = new Oberflaeche(document.getElementById("seitenleiste"), texte, VERSION);
const log = new Log(document.getElementById("log"), texte);

// Anzeige-Zustand, gehört nicht zum Spielzustand
let kamera = neueKamera();
let spiel;
let feldUnterZeiger = null;
let laufendeReise = null;
let reiseZeitgeber = null;
let letzterRadZoom = 0;

function zeichnen() {
  const ansicht = renderer.ansicht(einstellungen.zoom);
  const ninkasi = spielerin(spiel.zustand);
  folgen(kamera, ninkasi.position, ansicht, spiel.zustand.ebene);
  // Wegvorschau zum Feld unter dem Zeiger, nur über erkundete Felder
  const vorschauZeigen = feldUnterZeiger && !laufendeReise && !spiel.zustand.vorbei;
  const wegvorschau = vorschauZeigen ? weg(spiel, ninkasi.position, feldUnterZeiger, { nurErkundet: true }) || [] : [];
  renderer.zeichnen(spiel, kamera, ansicht, einstellungen.zoom, { zeiger: feldUnterZeiger, weg: wegvorschau });
  oberflaeche.anzeigen(spiel);
}

function reiseMelden(grund) {
  const schluessel = `reise.${grund}`;
  if (texte.hatSchluessel(schluessel)) log.zeile(texte.text(schluessel), "leise");
}

function reiseBeenden(grund) {
  clearTimeout(reiseZeitgeber);
  reiseZeitgeber = null;
  laufendeReise = null;
  if (grund) reiseMelden(grund);
  zeichnen();
}

function reiseTakt() {
  reiseZeitgeber = null;
  if (!laufendeReise) return;
  const schritt = naechsterReiseschritt(spiel, laufendeReise, einstellungen);
  if (schritt.halt) return reiseBeenden(schritt.halt);
  if (!befehlGeben(spiel, schritt.befehl).ok) return reiseBeenden("abgelehnt");
  zeichnen();
  reiseZeitgeber = setTimeout(reiseTakt, einstellungen.reisePause);
}

function reiseStarten(ziel) {
  const ergebnis = reiseBeginnen(spiel, ziel, einstellungen);
  if (ergebnis.grund) return reiseMelden(ergebnis.grund);
  laufendeReise = ergebnis.reise;
  reiseTakt();
}

function starten(startwert) {
  if (laufendeReise) reiseBeenden(null);
  spiel = neuesSpiel(daten, startwert);
  window.spiel = spiel; // zum Nachsehen in der Konsole
  kamera = neueKamera();
  log.leeren(spiel.zustand.spielerinId);
  hoererAnmelden(spiel, log.melden);
  log.zeile(texte.text("log.willkommen"));
  const adresse = new URL(location.href);
  adresse.searchParams.set("seed", String(spiel.zustand.startwert));
  history.replaceState(null, "", adresse);
  zeichnen();
}

function zoomen(richtung) {
  const zoomstufen = einstellungen.zoomstufen;
  const neueStufe = zoomstufen.indexOf(einstellungen.zoom) + richtung;
  if (neueStufe < 0 || neueStufe >= zoomstufen.length) return;
  einstellungen.zoom = zoomstufen[neueStufe];
  einstellungenSpeichern(einstellungen);
  kamera.gesetzt = false;
  zeichnen();
}

function befehlGebenUndZeichnen(befehl) {
  befehlGeben(spiel, befehl);
  zeichnen();
}

window.addEventListener("keydown", (tastenereignis) => {
  // Während einer Reise bricht jede Taste ab und wird dabei geschluckt
  if (laufendeReise) {
    tastenereignis.preventDefault();
    return reiseBeenden("abgebrochen");
  }
  const ergebnis = uebersetzen(tastenereignis, belegung, spiel);
  if (!ergebnis) return;
  tastenereignis.preventDefault();
  if (ergebnis.anzeige === "zoom_rein") return zoomen(1);
  if (ergebnis.anzeige === "zoom_raus") return zoomen(-1);
  if (ergebnis.anzeige === "log_umschalten") return log.umschalten();
  if (ergebnis.anzeige === "neustart") {
    if (spiel.zustand.vorbei) starten(zufaelligerStartwert());
    return;
  }
  if (ergebnis.befehl) befehlGebenUndZeichnen(ergebnis.befehl);
});

kartenCanvas.addEventListener("mousemove", (mausereignis) => {
  const feld = feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom);
  if (feldUnterZeiger && feldUnterZeiger.x === feld.x && feldUnterZeiger.y === feld.y) return;
  feldUnterZeiger = feld;
  zeichnen();
});

kartenCanvas.addEventListener("mouseleave", () => {
  feldUnterZeiger = null;
  zeichnen();
});

kartenCanvas.addEventListener("mousedown", (mausereignis) => {
  if (laufendeReise) return reiseBeenden("abgebrochen");
  if (belegung.maus[mausereignis.button] !== "handeln" || spiel.zustand.vorbei) return;
  mausereignis.preventDefault();
  const ergebnis = klickDeuten(spiel, feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom));
  if (!ergebnis) return;
  if (ergebnis.befehl) befehlGebenUndZeichnen(ergebnis.befehl);
  else if (ergebnis.reise) reiseStarten(ergebnis.reise);
});

kartenCanvas.addEventListener("wheel", (radereignis) => {
  if (belegung.rad !== "zoom") return;
  radereignis.preventDefault();
  const jetzt = performance.now();
  if (jetzt - letzterRadZoom < RAD_PAUSE_MS) return;
  letzterRadZoom = jetzt;
  zoomen(radereignis.deltaY < 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("resize", () => zeichnen());

starten(startwertAusUrl() ?? zufaelligerStartwert());
