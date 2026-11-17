// Einstieg im Browser: verdrahtet Logik, Anzeige und Eingabe.
// Startwert per URL (?seed=1234), sonst zufällig; wird in die URL geschrieben, damit Neuladen denselben Lauf ergibt.

import VERSION from "./version.js";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "./eingabe/belegung.js";
import vorgaben from "./eingabe/einstellungen.js";
import { datenLaden, neuesSpiel, befehl } from "./kern/spiel.js";
import { hoeren } from "./kern/ereignisse.js";
import { ableiten } from "./kern/zufall.js";
import { spieler } from "./kern/zustand.js";
import { weg } from "./welt/wege.js";
import { erstelleTexte } from "./anzeige/texte.js";
import { erstelleGrammatik } from "./anzeige/grammatik.js";
import { Renderer } from "./anzeige/renderer.js";
import { neueKamera, folgen } from "./anzeige/kamera.js";
import { Oberflaeche } from "./anzeige/oberflaeche.js";
import { Log } from "./anzeige/log.js";
import { uebersetzen } from "./eingabe/eingabe.js";
import { feldAnPixel, klickDeuten } from "./eingabe/maus.js";
import { reiseBeginnen, naechsterSchritt } from "./eingabe/reise.js";

const SPEICHER = "battle-ninkasi.einstellungen";
const RAD_PAUSE = 150; // ms zwischen zwei Zoomschritten per Rad

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);

function fehlerZeigen(titel, text) {
  const el = document.getElementById("fehler");
  el.hidden = false;
  el.textContent = `${titel}\n\n${text}`;
}

// Einstellungen sind keine Befehle; gespeichert werden nur Abweichungen von den Vorgaben
function einstellungenLaden() {
  try {
    return { ...structuredClone(vorgaben), ...JSON.parse(localStorage.getItem(SPEICHER) || "{}") };
  } catch {
    return structuredClone(vorgaben);
  }
}
function einstellungenSpeichern(e) {
  const abweichend = {};
  for (const [k, v] of Object.entries(e)) {
    if (JSON.stringify(v) !== JSON.stringify(vorgaben[k])) abweichend[k] = v;
  }
  try { localStorage.setItem(SPEICHER, JSON.stringify(abweichend)); } catch { /* ohne Speicher weiter */ }
}

function startwertAusUrl() {
  const s = new URLSearchParams(location.search).get("seed");
  if (s === null || s === "") return null;
  return /^\d+$/.test(s) ? Number(s) >>> 0 : ableiten(0, s);
}

function zufaelligerStartwert() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

let daten;
try {
  daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
} catch (e) {
  fehlerZeigen(texte.t("ui.datenfehler"), e.message);
  throw e;
}

const einstellungen = einstellungenLaden();
if (!einstellungen.zoomstufen.includes(einstellungen.zoom)) einstellungen.zoom = einstellungen.zoomstufen[0];

const canvas = document.getElementById("karte-canvas");
const renderer = new Renderer(canvas, daten.zeichen);
const oberflaeche = new Oberflaeche(document.getElementById("seitenleiste"), texte, VERSION);
const log = new Log(document.getElementById("log"), texte);

// Anzeige-Zustand, gehört nicht zum Spielzustand
let kamera = neueKamera();
let spiel;
let zeiger = null;      // Feld unter dem Mauszeiger
let reise = null;       // laufende Reise
let reiseTimer = null;
let letzterRadZoom = 0;

function zeichnen() {
  const ansicht = renderer.ansicht(einstellungen.zoom);
  const p = spieler(spiel.zustand);
  folgen(kamera, p.position, ansicht, spiel.zustand.ebene);
  // Wegvorschau zum Feld unter dem Zeiger, nur über erkundete Felder
  const vorschau = zeiger && !reise && !spiel.zustand.vorbei ? weg(spiel, p.position, zeiger, { nurErkundet: true }) || [] : [];
  renderer.zeichnen(spiel, kamera, ansicht, einstellungen.zoom, { zeiger, weg: vorschau });
  oberflaeche.anzeigen(spiel);
}

function reiseMelden(grund) {
  const schluessel = `reise.${grund}`;
  if (texte.hat(schluessel)) log.zeile(texte.t(schluessel), "leise");
}

function reiseBeenden(grund) {
  clearTimeout(reiseTimer);
  reiseTimer = null;
  reise = null;
  if (grund) reiseMelden(grund);
  zeichnen();
}

function reiseTakt() {
  reiseTimer = null;
  if (!reise) return;
  const s = naechsterSchritt(spiel, reise, einstellungen);
  if (s.halt) return reiseBeenden(s.halt);
  if (!befehl(spiel, s.befehl).ok) return reiseBeenden("abgelehnt");
  zeichnen();
  reiseTimer = setTimeout(reiseTakt, einstellungen.reisePause);
}

function reiseStarten(ziel) {
  const r = reiseBeginnen(spiel, ziel, einstellungen);
  if (r.grund) return reiseMelden(r.grund);
  reise = r.reise;
  reiseTakt();
}

function starten(startwert) {
  if (reise) reiseBeenden(null);
  spiel = neuesSpiel(daten, startwert);
  window.spiel = spiel; // zum Nachsehen in der Konsole
  kamera = neueKamera();
  log.leeren(spiel.zustand.spielerId);
  hoeren(spiel, log.melden);
  log.zeile(texte.t("log.willkommen"));
  const url = new URL(location.href);
  url.searchParams.set("seed", String(spiel.zustand.startwert));
  history.replaceState(null, "", url);
  zeichnen();
}

function zoomen(richtung) {
  const stufen = einstellungen.zoomstufen;
  const i = stufen.indexOf(einstellungen.zoom) + richtung;
  if (i < 0 || i >= stufen.length) return;
  einstellungen.zoom = stufen[i];
  einstellungenSpeichern(einstellungen);
  kamera.gesetzt = false;
  zeichnen();
}

function befehlGeben(b) {
  befehl(spiel, b);
  zeichnen();
}

window.addEventListener("keydown", (e) => {
  // Während einer Reise bricht jede Taste ab und wird dabei geschluckt
  if (reise) {
    e.preventDefault();
    return reiseBeenden("abgebrochen");
  }
  const r = uebersetzen(e, belegung, spiel);
  if (!r) return;
  e.preventDefault();
  if (r.anzeige === "zoom_rein") return zoomen(1);
  if (r.anzeige === "zoom_raus") return zoomen(-1);
  if (r.anzeige === "log_umschalten") return log.umschalten();
  if (r.anzeige === "neustart") {
    if (spiel.zustand.vorbei) starten(zufaelligerStartwert());
    return;
  }
  if (r.befehl) befehlGeben(r.befehl);
});

canvas.addEventListener("mousemove", (e) => {
  const f = feldAnPixel(e.offsetX, e.offsetY, kamera, einstellungen.zoom);
  if (zeiger && zeiger.x === f.x && zeiger.y === f.y) return;
  zeiger = f;
  zeichnen();
});

canvas.addEventListener("mouseleave", () => {
  zeiger = null;
  zeichnen();
});

canvas.addEventListener("mousedown", (e) => {
  if (reise) return reiseBeenden("abgebrochen");
  if (belegung.maus[e.button] !== "handeln" || spiel.zustand.vorbei) return;
  e.preventDefault();
  const r = klickDeuten(spiel, feldAnPixel(e.offsetX, e.offsetY, kamera, einstellungen.zoom));
  if (!r) return;
  if (r.befehl) befehlGeben(r.befehl);
  else if (r.reise) reiseStarten(r.reise);
});

canvas.addEventListener("wheel", (e) => {
  if (belegung.rad !== "zoom") return;
  e.preventDefault();
  const jetzt = performance.now();
  if (jetzt - letzterRadZoom < RAD_PAUSE) return;
  letzterRadZoom = jetzt;
  zoomen(e.deltaY < 0 ? 1 : -1);
}, { passive: false });

window.addEventListener("resize", () => zeichnen());

starten(startwertAusUrl() ?? zufaelligerStartwert());
