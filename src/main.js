// Einstieg im Browser: verdrahtet Logik, Anzeige und Eingabe.
// Startwert per URL (?seed=1234), sonst zufällig; wird in die URL geschrieben, damit Neuladen denselben Lauf ergibt.

import VERSION from "./version.js";
import rohdaten from "../daten/index.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "./eingabe/belegung.js";
import { datenLaden, neuesSpiel, befehl } from "./kern/spiel.js";
import { hoeren } from "./kern/ereignisse.js";
import { ableiten } from "./kern/zufall.js";
import { spieler } from "./kern/zustand.js";
import { erstelleTexte } from "./anzeige/texte.js";
import { erstelleGrammatik } from "./anzeige/grammatik.js";
import { Renderer } from "./anzeige/renderer.js";
import { neueKamera, folgen } from "./anzeige/kamera.js";
import { Oberflaeche } from "./anzeige/oberflaeche.js";
import { Log } from "./anzeige/log.js";
import { uebersetzen } from "./eingabe/eingabe.js";

const ZOOMSTUFEN = [16, 32, 48, 64];
const SPEICHER = "battle-ninkasi.einstellungen";

const grammatik = erstelleGrammatik(grammatikDe);
const texte = erstelleTexte(texteDe, grammatik);

function fehlerZeigen(titel, text) {
  const el = document.getElementById("fehler");
  el.hidden = false;
  el.textContent = `${titel}\n\n${text}`;
}

// Einstellungen sind keine Befehle und werden getrennt gespeichert
function einstellungenLaden() {
  try {
    return { zoom: 16, ...JSON.parse(localStorage.getItem(SPEICHER) || "{}") };
  } catch {
    return { zoom: 16 };
  }
}
function einstellungenSpeichern(e) {
  try { localStorage.setItem(SPEICHER, JSON.stringify(e)); } catch { /* ohne Speicher weiter */ }
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
if (!ZOOMSTUFEN.includes(einstellungen.zoom)) einstellungen.zoom = 16;

const renderer = new Renderer(document.getElementById("karte-canvas"), daten.zeichen);
const oberflaeche = new Oberflaeche(document.getElementById("seitenleiste"), texte, VERSION);
const log = new Log(document.getElementById("log"), texte);
let kamera = neueKamera();
let spiel;

function zeichnen() {
  const ansicht = renderer.ansicht(einstellungen.zoom);
  folgen(kamera, spieler(spiel.zustand).position, ansicht, spiel.zustand.ebene);
  renderer.zeichnen(spiel, kamera, ansicht, einstellungen.zoom);
  oberflaeche.anzeigen(spiel);
}

function starten(startwert) {
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
  const i = ZOOMSTUFEN.indexOf(einstellungen.zoom) + richtung;
  if (i < 0 || i >= ZOOMSTUFEN.length) return;
  einstellungen.zoom = ZOOMSTUFEN[i];
  einstellungenSpeichern(einstellungen);
  kamera.gesetzt = false;
  zeichnen();
}

window.addEventListener("keydown", (e) => {
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
  if (r.befehl) {
    befehl(spiel, r.befehl);
    zeichnen();
  }
});

window.addEventListener("resize", () => zeichnen());

starten(startwertAusUrl() ?? zufaelligerStartwert());
