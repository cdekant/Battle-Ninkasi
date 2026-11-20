// Einstieg im Browser: verdrahtet Logik, Anzeige und Eingabe.
// Startwert per URL (?seed=1234), sonst zufällig; wird in die URL geschrieben, damit Neuladen denselben Lauf ergibt.

import VERSION from "./version.js";
import rohdaten from "../daten/index.js";
import tileset from "../grafik/tileset.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegung from "./eingabe/belegung.js";
import vorgaben from "./eingabe/einstellungen.js";
import { datenLaden, neuesSpiel, befehlGeben } from "./kern/spiel.js";
import { hoererAnmelden } from "./kern/ereignisse.js";
import { startwertAbleiten } from "./kern/zufall.js";
import { spielerin, bewegungVon } from "./kern/zustand.js";
import { weg } from "./welt/wege.js";
import { erstelleTexte } from "./anzeige/texte.js";
import { erstelleGrammatik } from "./anzeige/grammatik.js";
import { Renderer } from "./anzeige/renderer.js";
import { tilebilderErstellen } from "./anzeige/tilebilder.js";
import { neueKamera, folgen } from "./anzeige/kamera.js";
import { Oberflaeche } from "./anzeige/oberflaeche.js";
import { Log } from "./anzeige/log.js";
import { angekuendigteFelder } from "./anzeige/ankuendigungen.js";
import { uebersetzen } from "./eingabe/eingabe.js";
import { feldAnPixel, klickDeuten } from "./eingabe/maus.js";
import { reiseBeginnen, naechsterReiseschritt } from "./eingabe/reise.js";
import { rastenBeginnen, naechsterRastschritt } from "./eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "./eingabe/erkunden.js";
import "./eingabe/inventar.js";
import "./eingabe/faehigkeiten.js";
import "./eingabe/hilfe.js";
import { charakterfensterOeffnen } from "./eingabe/charakter.js";
import { erstellungOeffnen } from "./eingabe/erstellung.js";
import { fensterOeffnen, fensterTaste, oberstesFenster } from "./eingabe/fenster.js";
import { aktionDerTaste } from "./eingabe/aktionskatalog.js";
import { fensterHtml } from "./anzeige/fenster.js";
import "./anzeige/charakterfenster.js";
import { zielmodusBeginnen, zielmodusTaste, zielmodusVorschau, zielmodusBestaetigen, cursorSetzen } from "./eingabe/zielmodus.js";
import { istSichtbar } from "./systeme/sicht.js";
import { neueAnimation, geschossEinreihen, laeuftAnimation, aktuellesGeschoss, animationWeiter, animationLeeren } from "./anzeige/animation.js";

const SPEICHERSCHLUESSEL_EINSTELLUNGEN = "battle-ninkasi.einstellungen";
const SPEICHERSCHLUESSEL_EIGENSCHAFTEN = "battle-ninkasi.eigenschaften"; // letzte Verteilung der Charaktererstellung
const RAD_PAUSE_MS = 150; // zwischen zwei Zoomschritten per Rad
const TOOLTIP_ABSTAND = 6; // Pixel zwischen Feld und Tooltip

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

// Letzte Verteilung der Eigenschaften, Vorbelegung der nächsten Charaktererstellung (geprüft in erstellungOeffnen)
function letzteEigenschaftenLaden() {
  try {
    return JSON.parse(localStorage.getItem(SPEICHERSCHLUESSEL_EIGENSCHAFTEN) || "null");
  } catch {
    return null;
  }
}
function letzteEigenschaftenSpeichern(eigenschaften) {
  try { localStorage.setItem(SPEICHERSCHLUESSEL_EIGENSCHAFTEN, JSON.stringify(eigenschaften)); } catch { /* ohne Speicher weiter */ }
}

function startwertAusUrl() {
  const startwertText = new URLSearchParams(location.search).get("seed");
  if (startwertText === null || startwertText === "") return null;
  return /^\d+$/.test(startwertText) ? Number(startwertText) >>> 0 : startwertAbleiten(0, startwertText);
}

function zufaelligerStartwert() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

let daten, tilebilder;
try {
  daten = datenLaden(rohdaten, { texte: texteDe, nomenPruefen: grammatik.pruefen });
  tilebilder = tilebilderErstellen(tileset);
} catch (fehler) {
  fehlerZeigen(texte.text("ui.datenfehler"), fehler.message);
  throw fehler;
}

// Favicon aus dem Tile von Ninkasi im Satz 32; fehlt es, bleibt das leere Icon aus index.html
const ninkasiBild = tilebilder.bild("ninkasi", 32);
if (ninkasiBild) document.getElementById("favicon").href = ninkasiBild.toDataURL("image/png");

const einstellungen = einstellungenLaden();
if (!einstellungen.zoomstufen.includes(einstellungen.zoom)) einstellungen.zoom = einstellungen.zoomstufen[0];

const kartenCanvas = document.getElementById("karte-canvas");
const renderer = new Renderer(kartenCanvas, daten.zeichen, tilebilder);
const oberflaeche = new Oberflaeche(document.getElementById("seitenleiste"), texte, VERSION);
const log = new Log(document.getElementById("log"), texte);
const tooltipElement = document.getElementById("tooltip");
const fensterElement = document.getElementById("fenster");

// Anzeige-Zustand, gehört nicht zum Spielzustand
let kamera = neueKamera();
let spiel;
let feldUnterZeiger = null;
// Laufender Ablauf aus Einzelbefehlen (Reise, Rasten, Erkunden): { zustand, naechsterSchritt }
let laufenderAblauf = null;
let ablaufZeitgeber = null;
let letzterRadZoom = 0;
// Fensterstapel (eingabe/fenster.js): [{ art, zustand }], reine Anzeige, nicht im Spielzustand
let fensterStapel = [];
// Zielmodus: null oder { auswahl, zielart, cursor } (eingabe/zielmodus.js), auch zum Untersuchen (auswahl { zweck: "untersuchen" })
let zielModus = null;
// Geschossbahnen aus den Meldungen "geschoss", abgespielt im Takt geschossPause (anzeige/animation.js)
const animation = neueAnimation();
let animationsZeitgeber = null;

function zeichnen() {
  const ansicht = renderer.ansicht(einstellungen.zoom);
  const ninkasi = spielerin(spiel.zustand);
  folgen(kamera, ninkasi.position, ansicht, spiel.zustand.ebene);
  // Wegvorschau zum Feld unter dem Zeiger, nur über erkundete Felder; im Zielmodus stattdessen dessen Vorschau
  const vorschauZeigen = feldUnterZeiger && !laufenderAblauf && !zielModus && !spiel.zustand.vorbei;
  const wegvorschau = vorschauZeigen ? weg(spiel, ninkasi.position, feldUnterZeiger, { nurErkundet: true, bewegung: bewegungVon(ninkasi) }) || [] : [];
  const zielvorschau = zielModus ? zielmodusVorschau(spiel, zielModus) : null;
  const zielmarkierung = zielvorschau && {
    cursor: zielModus.cursor,
    ok: zielvorschau.ok,
    bahn: zielvorschau.aufloesung?.bahn?.felder ?? [],
    felder: zielvorschau.aufloesung?.ok && !zielvorschau.aufloesung.bahn ? zielvorschau.aufloesung.felder : [],
    betroffene: zielvorschau.betroffene.map(({ id }) => spiel.zustand.entitaeten[id].position),
  };
  // Untersuchen: nur der Cursor, ohne Bahn und Fläche
  const untersuchmarkierung = zielModus && !zielvorschau && { cursor: zielModus.cursor, ok: true, bahn: [], felder: [], betroffene: [] };
  renderer.zeichnen(spiel, kamera, ansicht, einstellungen.zoom, {
    zeiger: feldUnterZeiger, weg: wegvorschau, gefahr: angekuendigteFelder(spiel), ziel: zielmarkierung || untersuchmarkierung, geschoss: aktuellesGeschoss(animation),
  });
  oberflaeche.anzeigen(spiel, { ziel: zielModus && { modus: zielModus, vorschau: zielvorschau } });
  const fensterInhalt = fensterHtml({ spiel, daten, texte, belegung }, fensterStapel);
  fensterElement.hidden = !fensterInhalt;
  fensterElement.innerHTML = fensterInhalt;
  tooltipZeigen();
}

// Tooltip: Kurzfassung des Feldes unter dem Zeiger, beim Untersuchen unter dem Cursor (auch per Tastatur);
// rechts neben dem Feld, am rechten Rand links davon
function tooltipZeigen() {
  const untersuchen = zielModus?.auswahl.zweck === "untersuchen";
  const feld = untersuchen ? zielModus.cursor : feldUnterZeiger;
  const html = feld && !laufenderAblauf ? oberflaeche.tooltipHtml(spiel, feld) : "";
  tooltipElement.hidden = !html;
  if (!html) return;
  tooltipElement.innerHTML = html;
  const zoom = einstellungen.zoom;
  const links = (feld.x - kamera.x + 1) * zoom + TOOLTIP_ABSTAND;
  const oben = (feld.y - kamera.y) * zoom;
  const passtRechts = links + tooltipElement.offsetWidth <= kartenCanvas.clientWidth;
  tooltipElement.style.left = `${passtRechts ? links : Math.max(0, (feld.x - kamera.x) * zoom - TOOLTIP_ABSTAND - tooltipElement.offsetWidth)}px`;
  tooltipElement.style.top = `${Math.max(0, Math.min(oben, kartenCanvas.clientHeight - tooltipElement.offsetHeight))}px`;
}

// Geschossbahnen: nur die Felder, die Ninkasi gerade sieht; der Takt läuft unabhängig von Reise und Eingabe
function geschossGemeldet(meldung) {
  if (meldung.art !== "geschoss" || einstellungen.geschossPause <= 0) return;
  geschossEinreihen(animation, meldung.bahn.filter((feld) => istSichtbar(spiel.zustand, feld.x, feld.y)));
}
function animationTakt() {
  animationsZeitgeber = null;
  const weiter = animationWeiter(animation);
  zeichnen();
  if (weiter) animationsZeitgeber = setTimeout(animationTakt, einstellungen.geschossPause);
}
function animationStarten() {
  if (animationsZeitgeber || !laeuftAnimation(animation)) return;
  zeichnen();
  animationsZeitgeber = setTimeout(animationTakt, einstellungen.geschossPause);
}
function animationUeberspringen() {
  clearTimeout(animationsZeitgeber);
  animationsZeitgeber = null;
  animationLeeren(animation);
}

function ablehnungMelden(grund) {
  const schluessel = `log.abgelehnt.${grund}`;
  if (texte.hatSchluessel(schluessel)) log.zeile(texte.text(schluessel), "leise");
}

// Auswahl aus Inventar (Werfen) oder Fähigkeitenfenster: Zielmodus, sofortiger Befehl oder Grund dagegen
function auswahlStarten(auswahl) {
  const beginn = zielmodusBeginnen(spiel, auswahl);
  if (beginn.befehl) return befehlGebenUndZeichnen(beginn.befehl);
  if (beginn.grund) ablehnungMelden(beginn.grund);
  zielModus = beginn.modus ?? null;
  zeichnen();
}

// Ergebnis von zielmodusTaste oder zielmodusBestaetigen
function zielergebnisAnwenden(ergebnis) {
  zielModus = ergebnis.modus;
  if (ergebnis.grund) ablehnungMelden(ergebnis.grund);
  if (ergebnis.befehl) return befehlGebenUndZeichnen(ergebnis.befehl);
  zeichnen();
}

function ablaufMelden(grund) {
  const schluessel = `reise.${grund}`;
  if (texte.hatSchluessel(schluessel)) log.zeile(texte.text(schluessel), "leise");
}

function ablaufBeenden(grund) {
  clearTimeout(ablaufZeitgeber);
  ablaufZeitgeber = null;
  laufenderAblauf = null;
  if (grund) ablaufMelden(grund);
  zeichnen();
}

function ablaufTakt() {
  ablaufZeitgeber = null;
  if (!laufenderAblauf) return;
  const schritt = laufenderAblauf.naechsterSchritt(spiel, laufenderAblauf.zustand, einstellungen);
  if (schritt.halt) return ablaufBeenden(schritt.halt);
  if (!befehlGeben(spiel, schritt.befehl).ok) return ablaufBeenden("abgelehnt");
  zeichnen();
  animationStarten();
  ablaufZeitgeber = setTimeout(ablaufTakt, einstellungen.reisePause);
}

// beginn: Ergebnis von reiseBeginnen, rastenBeginnen oder erkundenBeginnen ({ grund } oder { reise | ablauf })
function ablaufStarten(beginn, naechsterSchritt) {
  if (beginn.grund) return ablaufMelden(beginn.grund);
  laufenderAblauf = { zustand: beginn.reise ?? beginn.ablauf, naechsterSchritt };
  ablaufTakt();
}

// Ein Lauf mit Startoptionen (Charaktererstellung); dieselbe Ebene wie in der Vorschau, die Eigenschaften
// ändern an der Erzeugung nichts
function laufBeginnen(startwert, optionen) {
  if (laufenderAblauf) ablaufBeenden(null);
  zielModus = null;
  animationUeberspringen();
  spiel = neuesSpiel(daten, startwert, optionen);
  window.spiel = spiel; // zum Nachsehen in der Konsole
  kamera = neueKamera();
  log.leeren(spiel);
  hoererAnmelden(spiel, log.melden);
  hoererAnmelden(spiel, geschossGemeldet);
  log.zeile(texte.text("log.willkommen"));
  const adresse = new URL(location.href);
  adresse.searchParams.set("seed", String(spiel.zustand.startwert));
  history.replaceState(null, "", adresse);
  zeichnen();
}

// Neuer Lauf: erst die Charaktererstellung über der Karte des Laufs, vorbelegt mit der letzten Verteilung
function starten(startwert) {
  const erstellung = erstellungOeffnen(daten, letzteEigenschaftenLaden());
  fensterStapel = fensterOeffnen([], "erstellung", erstellung);
  laufBeginnen(startwert, { eigenschaften: erstellung.eigenschaften });
}

// Ergebnis der Charaktererstellung: derselbe Startwert mit der gewählten Verteilung
function erstellungAbschliessen(startoptionen) {
  letzteEigenschaftenSpeichern(startoptionen.eigenschaften);
  laufBeginnen(spiel.zustand.startwert, startoptionen);
}

function fensterAuf(art, zustand) {
  if (spiel.zustand.vorbei) return;
  fensterStapel = fensterOeffnen(fensterStapel, art, zustand);
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
  if (spiel.zustand.vorbei) zielModus = null;
  zeichnen();
  animationStarten();
}

window.addEventListener("keydown", (tastenereignis) => {
  // Eine laufende Geschossbahn überspringt jede Taste, die Taste wirkt trotzdem
  if (laeuftAnimation(animation)) animationUeberspringen();
  // Während eines Ablaufs (Reise, Rasten, Erkunden) bricht jede Taste ab und wird dabei geschluckt
  if (laufenderAblauf) {
    tastenereignis.preventDefault();
    return ablaufBeenden("abgebrochen");
  }
  // Offene Fenster bekommen jede Taste (eingabe/fenster.js); ? legt die Hilfe zum obersten Fenster obenauf
  if (fensterStapel.length) {
    tastenereignis.preventDefault();
    if (aktionDerTaste(belegung, tastenereignis.code, tastenereignis.key) === "hilfe" && oberstesFenster(fensterStapel).art !== "hilfe") {
      fensterStapel = fensterOeffnen(fensterStapel, "hilfe", { thema: oberstesFenster(fensterStapel).art });
      return zeichnen();
    }
    const taste = { code: tastenereignis.code, zeichen: tastenereignis.key, umschalt: tastenereignis.shiftKey };
    const { stapel, befehl, auswahl, grund, start } = fensterTaste(fensterStapel, taste, { spiel, daten });
    fensterStapel = stapel;
    if (grund) ablehnungMelden(grund);
    if (start) return erstellungAbschliessen(start);
    if (befehl) return befehlGebenUndZeichnen(befehl);
    if (auswahl) return auswahlStarten(auswahl);
    return zeichnen();
  }
  // Zielmodus: Bewegungstasten zielen, dazu Tab, Enter und Esc (eingabe/zielmodus.js)
  if (zielModus) {
    tastenereignis.preventDefault();
    return zielergebnisAnwenden(zielmodusTaste(spiel, zielModus, tastenereignis.code, belegung));
  }
  const ergebnis = uebersetzen(tastenereignis, belegung, spiel);
  if (!ergebnis) return;
  tastenereignis.preventDefault();
  if (ergebnis.aktion === "inventar") return fensterAuf("inventar", { gewaehlt: null });
  if (ergebnis.aktion === "faehigkeiten") return fensterAuf("faehigkeiten", {});
  if (ergebnis.aktion === "charakter") return fensterAuf("charakter", charakterfensterOeffnen());
  if (ergebnis.aktion === "hilfe") return fensterAuf("hilfe", {});
  if (ergebnis.aktion === "untersuchen") {
    if (spiel.zustand.vorbei) return;
    zielModus = zielmodusBeginnen(spiel, { zweck: "untersuchen" }).modus;
    return zeichnen();
  }
  if (ergebnis.aktion === "zoom_rein") return zoomen(1);
  if (ergebnis.aktion === "zoom_raus") return zoomen(-1);
  if (ergebnis.aktion === "log_umschalten") return log.umschalten();
  if (ergebnis.aktion === "rasten") return ablaufStarten(rastenBeginnen(spiel, einstellungen), naechsterRastschritt);
  if (ergebnis.aktion === "erkunden") return ablaufStarten(erkundenBeginnen(spiel, einstellungen), naechsterErkundungsschritt);
  if (ergebnis.aktion === "neustart") {
    if (spiel.zustand.vorbei) starten(zufaelligerStartwert());
    return;
  }
  if (ergebnis.befehl) befehlGebenUndZeichnen(ergebnis.befehl);
});

kartenCanvas.addEventListener("mousemove", (mausereignis) => {
  const feld = feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom);
  if (feldUnterZeiger && feldUnterZeiger.x === feld.x && feldUnterZeiger.y === feld.y) return;
  feldUnterZeiger = feld;
  if (zielModus) zielModus = cursorSetzen(spiel, zielModus, feld);
  zeichnen();
});

kartenCanvas.addEventListener("mouseleave", () => {
  feldUnterZeiger = null;
  zeichnen();
});

kartenCanvas.addEventListener("mousedown", (mausereignis) => {
  if (laufenderAblauf) return ablaufBeenden("abgebrochen");
  // ein offenes Fenster liegt über der Karte, der Klick dahinter zählt nicht
  if (fensterStapel.length || belegung.maus[mausereignis.button] !== "handeln" || spiel.zustand.vorbei) return;
  mausereignis.preventDefault();
  // im Zielmodus bestätigt ein Klick das Feld unter dem Zeiger
  if (zielModus) {
    zielModus = cursorSetzen(spiel, zielModus, feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom));
    return zielergebnisAnwenden(zielmodusBestaetigen(spiel, zielModus));
  }
  const ergebnis = klickDeuten(spiel, feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom));
  if (!ergebnis) return;
  if (ergebnis.befehl) befehlGebenUndZeichnen(ergebnis.befehl);
  else if (ergebnis.reise) ablaufStarten(reiseBeginnen(spiel, ergebnis.reise, einstellungen), naechsterReiseschritt);
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
