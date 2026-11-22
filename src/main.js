// Einstieg im Browser: verdrahtet Logik, Anzeige und Eingabe.
// Die Seite öffnet den Titelbildschirm (docs/Titelbildschirm.md); ?seed=1234 beginnt stattdessen gleich einen Lauf mit
// diesem Startwert auf dem ersten freien Platz (für Entwicklung und Fehlerberichte), danach verschwindet er aus der
// Adresse, damit Neuladen wieder zum Titel führt.

import VERSION from "./version.js";
import rohdaten from "../daten/index.js";
import tileset from "../grafik/tileset.js";
import texteDe from "../sprache/de/texte.js";
import grammatikDe from "../sprache/de/grammatik.js";
import belegungsVorgabe from "./eingabe/belegung.js";
import { abweichungenAnwenden, abweichungenGueltig } from "./eingabe/belegunganpassen.js";
import { einstellungsfensterOeffnen } from "./eingabe/einstellungsfenster.js";
import { befehlszeileOeffnen } from "./eingabe/befehlszeile.js";
import "./anzeige/einstellungsanzeige.js";
import vorgaben from "./eingabe/einstellungen.js";
import { datenLaden, neuesSpiel, befehlGeben, SPIELARTEN } from "./kern/spiel.js";
import { entitaetenAuf, istWesen } from "./kern/zustand.js";
import { hoererAnmelden } from "./kern/ereignisse.js";
import { startwertAbleiten } from "./kern/zufall.js";
import { gesteuerteEntitaet, bewegungVon } from "./kern/zustand.js";
import { weg } from "./welt/wege.js";
import { erstelleTexte } from "./anzeige/texte.js";
import { erstelleGrammatik } from "./anzeige/grammatik.js";
import { Renderer } from "./anzeige/renderer.js";
import { tilebilderErstellen } from "./anzeige/tilebilder.js";
import { neueKamera, folgen } from "./anzeige/kamera.js";
import { Oberflaeche } from "./anzeige/oberflaeche.js";
import { Log } from "./anzeige/log.js";
import { angekuendigteFelder } from "./anzeige/ankuendigungen.js";
import { uebersetzen, aktionsergebnis } from "./eingabe/eingabe.js";
import { feldAnPixel, klickDeuten } from "./eingabe/maus.js";
import { reiseBeginnen, naechsterReiseschritt } from "./eingabe/reise.js";
import { rastenBeginnen, naechsterRastschritt } from "./eingabe/rasten.js";
import { erkundenBeginnen, naechsterErkundungsschritt } from "./eingabe/erkunden.js";
import { laufenBeginnen, naechsterLaufschritt } from "./eingabe/laufen.js";
import { neueLeisten, leistenNachfuehren, platzAusloesen, platzBelegen, platzLeeren, plaetzeTauschen, leisteWechseln, ohneSchluessel, aktivePlaetze } from "./eingabe/schnellleiste.js";
import { ANZAHL_PLAETZE, speicherschluesselPlatz, SPEICHERSCHLUESSEL_ALTER_LAUF, SPEICHERSCHLUESSEL_LETZTER_LAUF, speicherstandText, speicherstandLesen, platzVorschau, platzFuerNeuesSpiel } from "./eingabe/speicherstand.js";
import { SPEICHERSCHLUESSEL_CHRONIK, chronikGueltig, meldungZaehlen, sichtungenZaehlen, laufEintragen } from "./eingabe/chronik.js";
import "./eingabe/karte.js";
import { escSchritt } from "./eingabe/esckette.js";
import { menueOeffnen, endeOeffnen } from "./eingabe/menue.js";
import { titelOeffnen } from "./eingabe/titel.js";
import { titelHtml } from "./anzeige/titel.js";
import { titelbildWaehlen } from "./anzeige/titelbilder.js";
import { korpustextZerlegen, spruchWaehlen } from "./anzeige/korpus.js";
import korpusliste from "../sprache/de/korpus/index.js";
import { verlaufOeffnen } from "./eingabe/verlauf.js";
import "./eingabe/inventar.js";
import "./eingabe/faehigkeiten.js";
import "./eingabe/hilfe.js";
import { charakterfensterOeffnen } from "./eingabe/charakter.js";
import { erstellungOeffnen } from "./eingabe/erstellung.js";
import { fensterOeffnen, fensterTaste, fensterKlick, oberstesFenster } from "./eingabe/fenster.js";
import { AKTIONEN, aktionDerTaste } from "./eingabe/aktionskatalog.js";
import { fensterHtml } from "./anzeige/fenster.js";
import "./anzeige/charakterfenster.js";
import "./anzeige/systemfenster.js";
import { Bedienzeile } from "./anzeige/bedienzeile.js";
import { minikartenBild, zeichnen as minikarteZeichnen, feldgroesseFuer, feldAmPunkt } from "./anzeige/minikarte.js";
import { zielmodusBeginnen, zielmodusTaste, zielmodusVorschau, zielmodusBestaetigen, cursorSetzen } from "./eingabe/zielmodus.js";
import { istSichtbar } from "./systeme/sicht.js";
import { neueAnimation, geschossEinreihen, laeuftAnimation, aktuellesGeschoss, animationWeiter, animationLeeren } from "./anzeige/animation.js";

const SPEICHERSCHLUESSEL_EINSTELLUNGEN = "battle-ninkasi.einstellungen";
const SPEICHERSCHLUESSEL_EIGENSCHAFTEN = "battle-ninkasi.eigenschaften"; // letzte Verteilung der Charaktererstellung
const SPEICHERSCHLUESSEL_BELEGUNG = "battle-ninkasi.belegung"; // Abweichungen von der Tastenbelegung
const RAD_PAUSE_MS = 150; // zwischen zwei Zoomschritten per Rad
const SPEICHERN_NACH_MS = 300; // Speichern gesammelt, höchstens so oft; beim Verlassen der Seite sofort
const MINIKARTE_HOECHSTENS = 3; // Pixel je Feld; in Variante B streckt CSS sie auf die Breite der Log-Spalte
const UEBERSICHT_HOECHSTENS = 10; // Pixel je Feld auf der Übersichtskarte
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

// Eigene Tastenbelegung: gespeichert werden nur die Abweichungen (eingabe/belegunganpassen.js)
function belegungsabweichungenLaden() {
  try {
    return abweichungenGueltig(JSON.parse(localStorage.getItem(SPEICHERSCHLUESSEL_BELEGUNG) || "null"));
  } catch {
    return abweichungenGueltig(null);
  }
}
function belegungsabweichungenSpeichern(abweichungen) {
  try { localStorage.setItem(SPEICHERSCHLUESSEL_BELEGUNG, JSON.stringify(abweichungen)); } catch { /* ohne Speicher weiter */ }
}
let belegungsabweichungen = belegungsabweichungenLaden();
let belegung = abweichungenAnwenden(belegungsVorgabe, belegungsabweichungen);

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

// Chronik über alle Läufe (eingabe/chronik.js); gespeichert mit den Läufen
function chronikLaden() {
  try {
    return chronikGueltig(JSON.parse(localStorage.getItem(SPEICHERSCHLUESSEL_CHRONIK) || "null"));
  } catch {
    return chronikGueltig(null);
  }
}
function chronikSpeichern() {
  try { localStorage.setItem(SPEICHERSCHLUESSEL_CHRONIK, JSON.stringify(chronik)); } catch { /* ohne Speicher weiter */ }
}
const chronik = chronikLaden();

// Speicherplätze (eingabe/speicherstand.js): was der Titel über jeden weiß
function plaetzeLesen() {
  return Array.from({ length: ANZAHL_PLAETZE }, (_, stelle) => {
    try {
      return platzVorschau(localStorage.getItem(speicherschluesselPlatz(stelle)));
    } catch {
      return null;
    }
  });
}
function platzLoeschen(stelle) {
  if (stelle === null) return;
  try { localStorage.removeItem(speicherschluesselPlatz(stelle)); } catch { /* ohne Speicher weiter */ }
}
// der eine Platz bis 0.31.0 passt zu keiner neueren Version
try { localStorage.removeItem(SPEICHERSCHLUESSEL_ALTER_LAUF); } catch { /* ohne Speicher weiter */ }

// ?seed= und ?spielart= aus der Adresse lesen und entfernen (auch das frühere &neu); eine unbekannte Spielart zählt nicht
function startAusUrl() {
  const parameter = new URLSearchParams(location.search);
  const startwertText = parameter.get("seed"), spielartText = parameter.get("spielart");
  const adresse = new URL(location.href);
  for (const name of ["seed", "spielart", "neu"]) adresse.searchParams.delete(name);
  history.replaceState(null, "", adresse);
  const startwert = startwertText === null || startwertText === "" ? null
    : /^\d+$/.test(startwertText) ? Number(startwertText) >>> 0 : startwertAbleiten(0, startwertText);
  return { startwert, spielart: SPIELARTEN.includes(spielartText) ? spielartText : null };
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
const spielElement = document.getElementById("spiel");

const kartenCanvas = document.getElementById("karte-canvas");
const renderer = new Renderer(kartenCanvas, daten.zeichen, tilebilder);
const oberflaeche = new Oberflaeche(document.getElementById("seiteninhalt"), texte, VERSION);
const seitenkopfElement = document.getElementById("seitenkopf");
const minikartenCanvas = document.getElementById("minikarte");

// Einstellungen anwenden, die die Seite betreffen (eingabe/einstellungskatalog.js): Layout als data-layout (in
// Variante B steht die Minikarte links über dem Log, sonst in der Seitenleiste unter dem Kopf), Logzeilen in A,
// Größe der Oberfläche als Schriftgröße von :root, Minikarte, Kontrast und Palette als data-Attribute an <html>
const LAYOUTS = ["a", "b", "kompakt"];
function einstellungenAnwenden() {
  if (!LAYOUTS.includes(einstellungen.layout)) einstellungen.layout = LAYOUTS[0];
  if (!einstellungen.zoomstufen.includes(einstellungen.zoom)) einstellungen.zoom = einstellungen.zoomstufen[0];
  spielElement.dataset.layout = einstellungen.layout;
  if (einstellungen.layout === "b") document.getElementById("minikarte-links").append(minikartenCanvas);
  else seitenkopfElement.after(minikartenCanvas);
  spielElement.style.setProperty("--log-zeilen", einstellungen.layout === "a" ? String(einstellungen.logZeilen) : "");
  const wurzel = document.documentElement;
  wurzel.style.fontSize = `${einstellungen.oberflaecheGroesse}px`;
  wurzel.dataset.kontrast = einstellungen.hoherKontrast ? "hoch" : "normal";
  wurzel.dataset.palette = einstellungen.farbenblind ? "farbenblind" : "normal";
  minikartenCanvas.hidden = !einstellungen.minikarte;
  document.getElementById("minikarte-links").hidden = !einstellungen.minikarte;
}
einstellungenAnwenden();

// Neue Einstellungen aus dem Einstellungsfenster: übernehmen, anwenden, speichern
function einstellungenUebernehmen(neu) {
  const zoomVorher = einstellungen.zoom;
  Object.assign(einstellungen, neu);
  einstellungenAnwenden();
  einstellungenSpeichern(einstellungen);
  if (einstellungen.zoom !== zoomVorher) kamera.gesetzt = false;
}

// Neue Tastenbelegung aus dem Einstellungsfenster
function belegungUebernehmen(abweichungen) {
  belegungsabweichungen = abweichungen;
  belegung = abweichungenAnwenden(belegungsVorgabe, belegungsabweichungen);
  bedienzeile.belegung = belegung;
  belegungsabweichungenSpeichern(belegungsabweichungen);
}

// Vollbild an oder aus (der Browser verlangt dafür eine Handlung der Spielerin, ein Tastendruck zählt)
function vollbildUmschalten() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => { /* abgelehnt */ });
}
const log = new Log(document.getElementById("log"), texte);
const bedienzeile = new Bedienzeile(document.getElementById("bedienzeile"), texte, belegung);
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
// Zuletzt gewähltes Ziel (ID eines Wesens) für die Vorbelegung des Cursors (eingabe/zielmodus.js)
let letztesZielId = null;
// Schnellleiste (eingabe/schnellleiste.js), gespeichert im Teil oberflaeche des Speicherstands
let leisten = neueLeisten();
// Wesen, über dem in der Seitenleiste der Zeiger steht (Hervorheben auf der Karte)
let seitenleisteWesenId = null;
// Feldgröße und Bild der Minikarte vom letzten Zeichnen, für Klicks
let minikarte = null;
let speicherZeitgeber = null;
// Geschossbahnen aus den Meldungen "geschoss", abgespielt im Takt geschossPause (anzeige/animation.js)
const animation = neueAnimation();
let animationsZeitgeber = null;
// Titel und Speicherplätze: Stelle des laufenden Spiels (0 bis ANZAHL_PLAETZE - 1), was der Titel über die Plätze
// zeigt, das Titelbild dieses Starts und der Spruch aus dem Korpus (kommt nach, sobald die Texte geladen sind)
let aktuelleStelle = null;
let plaetze = plaetzeLesen();
const titelbild = titelbildWaehlen(chronik, Math.random());
let spruch = null;
// Chronik im laufenden Lauf: schon gezählte Wesenarten, die Todesmeldung Ninkasis, abgeschlossene Läufe
let gesehenImLauf = new Set();
let todesmeldung = null;
const abgeschlosseneSpiele = new WeakSet();
const titelElement = document.getElementById("titel");

function zeichnen() {
  // der Titel liegt unten im Fensterstapel und deckt die ganze Seite; Fenster darüber stehen dann mittig (stil.css)
  const titelOffen = fensterStapel[0]?.art === "titel";
  document.documentElement.dataset.bildschirm = titelOffen ? "titel" : "spiel";
  titelElement.hidden = !titelOffen;
  titelElement.innerHTML = titelOffen ? titelHtml(fensterumgebung(), fensterStapel) : "";
  if (spiel && !titelOffen) spielZeichnen();
  const fensterInhalt = fensterHtml(fensterumgebung(), fensterStapel);
  fensterElement.hidden = !fensterInhalt;
  fensterElement.innerHTML = fensterInhalt;
  if (spiel && !titelOffen) {
    uebersichtskarteZeichnen();
    tooltipZeigen();
  }
}

function spielZeichnen() {
  const ansicht = renderer.ansicht(einstellungen.zoom);
  const gesteuerte = gesteuerteEntitaet(spiel.zustand);
  folgen(kamera, gesteuerte.position, ansicht, spiel.zustand.ebene);
  // Wegvorschau zum Feld unter dem Zeiger, nur über bekannte Felder; im Zielmodus stattdessen dessen Vorschau
  const vorschauZeigen = feldUnterZeiger && !laufenderAblauf && !zielModus && !spiel.zustand.vorbei;
  const wegvorschau = vorschauZeigen ? weg(spiel, gesteuerte.position, feldUnterZeiger, { nurBekannt: true, bewegung: bewegungVon(gesteuerte) }) || [] : [];
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
  const hervorgehobenesWesen = seitenleisteWesenId !== null ? spiel.zustand.entitaeten[seitenleisteWesenId] : null;
  renderer.zeichnen(spiel, kamera, ansicht, einstellungen.zoom, {
    zeiger: feldUnterZeiger, weg: wegvorschau, gefahr: angekuendigteFelder(spiel), ziel: zielmarkierung || untersuchmarkierung, geschoss: aktuellesGeschoss(animation),
    hervorgehoben: hervorgehobenesWesen?.position ?? null,
  });
  const hervorgehobenId = seitenleisteWesenId ?? wesenIdAuf(zielModus?.auswahl.zweck === "untersuchen" ? zielModus.cursor : feldUnterZeiger);
  seitenkopfElement.textContent = oberflaeche.kopfHtml(spiel);
  minikarteAktualisieren(hervorgehobenId);
  oberflaeche.anzeigen(spiel, { ziel: zielModus && { modus: zielModus, vorschau: zielvorschau }, hervorgehobenId });
  bedienzeile.anzeigen(spiel, leisten);
}

// Was Fenster zum Zeichnen und für ihre Tasten bekommen (anzeige/fenster.js, eingabe/fenster.js)
function fensterumgebung() {
  return { spiel, daten, texte, belegung, belegungsVorgabe, abweichungen: belegungsabweichungen, leisten, logzeilen: log.zeilen, einstellungen, vorgaben, version: VERSION, plaetze, titelbild, spruch };
}

// ID des sichtbaren Wesens auf einem Feld oder null
function wesenIdAuf(feld) {
  if (!feld || !istSichtbar(spiel.zustand, feld.x, feld.y)) return null;
  return entitaetenAuf(spiel.zustand, feld.x, feld.y).find(istWesen)?.id ?? null;
}

// Minikarte in der Seitenleiste (anzeige/minikarte.js); passt sich der Breite der Seitenleiste an
function minikarteAktualisieren(hervorgehobenId) {
  const bild = minikartenBild(spiel, daten.zeichen);
  const verfuegbar = innenbreite(minikartenCanvas.parentElement) - 2 || bild.breite * MINIKARTE_HOECHSTENS;
  const feldgroesse = feldgroesseFuer(verfuegbar, bild.breite, MINIKARTE_HOECHSTENS);
  minikarteZeichnen(minikartenCanvas, bild, feldgroesse, { hervorgehobenId });
  minikarte = { bild, feldgroesse };
}

// Breite eines Elements ohne seine Polsterung
function innenbreite(element) {
  const stil = getComputedStyle(element);
  return element.clientWidth - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight);
}

// Pixel eines Mausereignisses im Koordinatensystem des Canvas (falls CSS es verkleinert)
function canvasPunkt(canvas, mausereignis) {
  return { x: mausereignis.offsetX * (canvas.width / canvas.clientWidth), y: mausereignis.offsetY * (canvas.height / canvas.clientHeight) };
}

// Übersichtskarte im offenen Fenster "karte"
function uebersichtskarteZeichnen() {
  const canvas = fensterElement.querySelector("canvas.uebersichtskarte");
  if (!canvas) return;
  const bild = minikartenBild(spiel, daten.zeichen);
  const verfuegbar = innenbreite(canvas.parentElement) || kartenCanvas.clientWidth;
  minikarteZeichnen(canvas, bild, feldgroesseFuer(verfuegbar, bild.breite, UEBERSICHT_HOECHSTENS));
}

// Speichern (eingabe/speicherstand.js) auf den Platz des Laufs, gesammelt nach Befehlen, dazu die Chronik; nicht
// während der Charaktererstellung; ein beendeter Lauf räumt seinen Platz (laufAbschliessen)
function speichernJetzt() {
  clearTimeout(speicherZeitgeber);
  speicherZeitgeber = null;
  if (!spiel || aktuelleStelle === null || fensterStapel.some(({ art }) => art === "erstellung")) return;
  if (spiel.zustand.vorbei) return laufAbschliessen("tod");
  try {
    localStorage.setItem(speicherschluesselPlatz(aktuelleStelle), speicherstandText(spiel, { leisten, logzeilen: log.zeilen, gesehen: gesehenImLauf, gespeichertAm: Date.now() }));
  } catch { /* ohne Speicher weiter */ }
  chronikSpeichern();
}
function speichernVormerken() {
  if (!speicherZeitgeber) speicherZeitgeber = setTimeout(speichernJetzt, SPEICHERN_NACH_MS);
}
window.addEventListener("pagehide", speichernJetzt);

// Ende eines Laufs (Tod oder aufgegeben), einmal je Lauf: Eintrag in die Chronik, die Aufzeichnung bleibt als letzter
// Lauf für ein späteres Abspielen, der Platz wird frei
function laufAbschliessen(ergebnis) {
  if (!spiel || abgeschlosseneSpiele.has(spiel) || !spiel.befehle.length) return;
  abgeschlosseneSpiele.add(spiel);
  laufEintragen(chronik, spiel, { ergebnis, datum: Date.now(), version: VERSION, todesmeldung });
  chronikSpeichern();
  try {
    localStorage.setItem(SPEICHERSCHLUESSEL_LETZTER_LAUF, speicherstandText(spiel, { leisten, logzeilen: log.zeilen, gesehen: gesehenImLauf, gespeichertAm: Date.now() }));
  } catch { /* ohne Speicher weiter */ }
  platzLoeschen(aktuelleStelle);
}

// Meldungen der Logik für die Chronik; die Todesmeldung Ninkasis nennt später die Ursache
function chronikMelden(meldung) {
  meldungZaehlen(chronik, spiel, meldung);
  if (meldung.art === "tod" && meldung.opfer.id === spiel.zustand.spielerinId) todesmeldung = meldung;
}

// Nach jedem angenommenen Befehl: Schnellleiste nachführen, Sichtungen zählen, speichern; nach dem Tod Ninkasis das
// Fenster "ende"
function nachDemBefehl() {
  leisten = leistenNachfuehren(spiel, leisten);
  sichtungenZaehlen(chronik, spiel, gesehenImLauf);
  speichernVormerken();
  if (spiel.zustand.vorbei && !abgeschlosseneSpiele.has(spiel)) {
    laufAbschliessen("tod");
    fensterStapel = fensterOeffnen([], "ende", endeOeffnen());
  }
}

// Änderung der Schnellleiste aus einem Fenster: { belegen: { stelle, platz } } oder { entfernen: platz }
function leisteAendern(aenderung) {
  if (aenderung.belegen) leisten = platzBelegen(leisten, aenderung.belegen.stelle, aenderung.belegen.platz);
  if (aenderung.entfernen) leisten = ohneSchluessel(leisten, platzSchluesselVon(aenderung.entfernen));
  speichernVormerken();
}
const platzSchluesselVon = (platz) => (platz.art === "faehigkeit" ? `faehigkeit:${platz.faehigkeit}` : `gegenstand:${platz.typ}`);

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
  if (meldung.art !== "geschoss" || einstellungen.geschossPause <= 0 || einstellungen.bewegungReduzieren) return;
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
  if (texte.hatSchluessel(schluessel)) log.zeile(texte.text(schluessel), "hinweis");
}

// Auswahl aus Inventar (Werfen), Fähigkeitenfenster oder Schnellleiste (optionen.platz): Zielmodus, sofortiger Befehl
// oder Grund dagegen
function auswahlStarten(auswahl, optionen = {}) {
  const beginn = zielmodusBeginnen(spiel, auswahl, { ...optionen, letztesZielId });
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
  if (texte.hatSchluessel(schluessel)) log.zeile(texte.text(schluessel), "hinweis");
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
  nachDemBefehl();
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
  platzLoeschen(aktuelleStelle);
  spielEinsetzen(neuesSpiel(daten, startwert, optionen), neueLeisten());
  log.zeile(texte.text("log.willkommen"));
  zeichnen();
}

// Ein Spiel wird das laufende: Anzeige-Zustand zurücksetzen, Hörer anmelden (Log, Geschosse, Chronik);
// gesehen: schon gezählte Wesenarten dieses Laufs (aus dem Speicherstand)
function spielEinsetzen(neuesSpielObjekt, neueLeistenStand, gesehen = []) {
  if (laufenderAblauf) ablaufBeenden(null);
  zielModus = null;
  letztesZielId = null;
  seitenleisteWesenId = null;
  animationUeberspringen();
  spiel = neuesSpielObjekt;
  window.spiel = spiel; // zum Nachsehen in der Konsole
  kamera = neueKamera();
  log.leeren(spiel);
  hoererAnmelden(spiel, log.melden);
  hoererAnmelden(spiel, geschossGemeldet);
  hoererAnmelden(spiel, chronikMelden);
  leisten = leistenNachfuehren(spiel, neueLeistenStand);
  // gezählt wird erst nach dem ersten Befehl, sonst zählte die Vorschau der Charaktererstellung mit
  gesehenImLauf = new Set(gesehen);
  todesmeldung = null;
}

// Titelbildschirm: der laufende Lauf ist gespeichert, der Titel wird die einzige Ebene
function titelZeigen(hinweis = null) {
  speichernJetzt();
  if (laufenderAblauf) ablaufBeenden(null);
  zielModus = null;
  spiel = null;
  aktuelleStelle = null;
  plaetze = plaetzeLesen();
  fensterStapel = fensterOeffnen([], "titel", { ...titelOeffnen(), hinweis });
  zeichnen();
}

// Lauf auf einem Platz fortsetzen; lässt er sich nicht einsetzen, wird er gelöscht und der Titel sagt es
function platzFortsetzen(stelle) {
  let text = null;
  try { text = localStorage.getItem(speicherschluesselPlatz(stelle)); } catch { /* ohne Speicher */ }
  const gelesen = text ? speicherstandLesen(daten, text) : { grund: "kaputt" };
  if (gelesen.grund) {
    platzLoeschen(stelle);
    return titelZeigen("titel.verworfen");
  }
  aktuelleStelle = stelle;
  fensterStapel = [];
  spielEinsetzen(gelesen.spiel, gelesen.oberflaeche.leisten, gelesen.oberflaeche.gesehen);
  log.zeilenEinsetzen(gelesen.oberflaeche.log);
  log.zeile(texte.text("log.fortgesetzt"), "hinweis");
  zeichnen();
}

// Neuer Lauf auf einem Platz: erst die Charaktererstellung über der Karte des Laufs, vorbelegt mit der letzten Verteilung;
// die Testkammer (Spielart "allmaechtig") beginnt gleich, mit den Eigenschaften aus den Daten
function starten(stelle, startwert, spielart = "normal") {
  aktuelleStelle = stelle;
  if (spielart !== "normal") {
    fensterStapel = [];
    laufBeginnen(startwert, { spielart });
    return speichernJetzt();
  }
  const erstellung = erstellungOeffnen(daten, letzteEigenschaftenLaden());
  fensterStapel = fensterOeffnen([], "erstellung", erstellung);
  laufBeginnen(startwert, { eigenschaften: erstellung.eigenschaften });
}

// Ergebnis der Charaktererstellung: derselbe Startwert mit der gewählten Verteilung
function erstellungAbschliessen(startoptionen) {
  letzteEigenschaftenSpeichern(startoptionen.eigenschaften);
  laufBeginnen(spiel.zustand.startwert, startoptionen);
  speichernJetzt();
}

// Fenster obenauf legen; nach dem Tod nur die, die nichts am Lauf ändern (Spielmenü, Hilfe, Verlauf, Karte,
// Einstellungen, Befehlszeile, Bestätigung und das Fenster "ende")
const FENSTER_NACH_DEM_TOD = ["menue", "hilfe", "verlauf", "karte", "einstellungen", "befehlszeile", "bestaetigung", "ende"];
function fensterAuf(art, zustand) {
  if (spiel.zustand.vorbei && !FENSTER_NACH_DEM_TOD.includes(art)) return;
  fensterStapel = fensterOeffnen(fensterStapel, art, zustand);
  zeichnen();
}

// Aktionen, die ein Fenster zurückgibt (eingabe/menue.js, eingabe/titel.js): ein Name oder { art, ... }
function fensteraktionAusfuehren(aktion) {
  const { art, ...werte } = typeof aktion === "string" ? { art: aktion } : aktion;
  if (art === "neustart") {
    // ein Lauf, der nicht zu Ende ist, geht als aufgegeben in die Chronik; der neue nimmt denselben Platz
    if (!spiel.zustand.vorbei) laufAbschliessen("aufgegeben");
    fensterStapel = [];
    return starten(aktuelleStelle, zufaelligerStartwert(), spiel.optionen.spielart);
  }
  if (art === "zum_titel") return titelZeigen();
  if (art === "fortsetzen") return platzFortsetzen(werte.stelle);
  if (art === "neuesSpiel") {
    fensterStapel = [];
    return starten(werte.stelle, zufaelligerStartwert(), werte.spielart);
  }
  if (art === "platzLoeschen") {
    platzLoeschen(werte.stelle);
    plaetze = plaetzeLesen();
    return zeichnen();
  }
  if (art === "vollbild") {
    vollbildUmschalten();
    return zeichnen();
  }
  if (art === "beenden") {
    // gelingt im Fenster aus starten.py (dom.allow_scripts_to_close_windows); sonst bleibt der Hinweis
    window.close();
    if (fensterStapel[0]?.art === "titel") fensterStapel[0] = { art: "titel", zustand: { ...fensterStapel[0].zustand, hinweis: "menue.beenden_hinweis" } };
    else log.zeile(texte.text("menue.beenden_hinweis"), "hinweis");
    return zeichnen();
  }
}

// Platz der Schnellleiste (eingabe/schnellleiste.js): Getränk sofort, Fähigkeit über den Zielmodus mit Vorbelegung
function platzBenutzen(stelle) {
  if (spiel.zustand.vorbei) return;
  const ergebnis = platzAusloesen(spiel, leisten, stelle);
  if (!ergebnis) return;
  if (ergebnis.grund) {
    ablehnungMelden(ergebnis.grund);
    return zeichnen();
  }
  if (ergebnis.befehl) return befehlGebenUndZeichnen(ergebnis.befehl);
  // sofort auslösen: mit gültigem vorbelegtem Ziel gleich wirken, sonst bleibt der Zielmodus offen
  if (einstellungen.sofortAusloesen) {
    const beginn = zielmodusBeginnen(spiel, ergebnis.auswahl, { platz: stelle, letztesZielId });
    if (beginn.befehl) return befehlGebenUndZeichnen(beginn.befehl);
    if (beginn.modus) {
      const bestaetigt = zielmodusBestaetigen(spiel, beginn.modus);
      if (bestaetigt.befehl) return befehlGebenUndZeichnen(bestaetigt.befehl);
    }
  }
  auswahlStarten(ergebnis.auswahl, { platz: stelle });
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
  const ergebnis = befehlGeben(spiel, befehl);
  if (ergebnis.ok && befehl.ziel?.id != null) letztesZielId = befehl.ziel.id;
  if (ergebnis.ok) nachDemBefehl();
  if (spiel.zustand.vorbei) zielModus = null;
  zeichnen();
  animationStarten();
}

// Ergebnis von fensterTaste oder fensterKlick (eingabe/fenster.js): Stapel übernehmen, dann was das Fenster verlangt
function fensterergebnisVerarbeiten(ergebnis) {
  const { stapel, befehl, auswahl, grund, start, aktion, leiste, befehlszeile, einstellungen: neueEinstellungen, abweichungen } = ergebnis;
  fensterStapel = stapel;
  if (leiste) leisteAendern(leiste);
  if (neueEinstellungen) einstellungenUebernehmen(neueEinstellungen);
  if (abweichungen) belegungUebernehmen(abweichungen);
  if (befehlszeile) return befehlszeileAusfuehren(befehlszeile);
  if (grund) ablehnungMelden(grund);
  if (start) return erstellungAbschliessen(start);
  if (aktion) return fensteraktionAusfuehren(aktion);
  if (befehl) return befehlGebenUndZeichnen(befehl);
  if (auswahl) return auswahlStarten(auswahl);
  return zeichnen();
}

// Maus in Fenstern ("Klick ist Taste", anzeige/fenster.js): data-taste kommt als gewöhnliche Taste an, data-ziel über
// die klick-Funktion der Fensterart; ein Rechtsklick wirkt wie Esc; das Rad blättert im Verlauf
const datenAus = (element, name) => {
  try { return JSON.parse(element.dataset[name]); } catch { return null; }
};
fensterElement.addEventListener("click", (mausereignis) => {
  if (!fensterStapel.length || mausereignis.target.closest?.("canvas.uebersichtskarte")) return;
  const element = mausereignis.target.closest?.("[data-taste], [data-ziel]");
  if (!element) return;
  element.blur?.();
  const taste = element.dataset.taste !== undefined ? datenAus(element, "taste") : null;
  if (taste) return fensterergebnisVerarbeiten(fensterTaste(fensterStapel, taste, fensterumgebung()));
  const ziel = datenAus(element, "ziel");
  if (ziel) fensterergebnisVerarbeiten(fensterKlick(fensterStapel, ziel, fensterumgebung()));
});
fensterElement.addEventListener("contextmenu", (mausereignis) => {
  if (!fensterStapel.length) return;
  mausereignis.preventDefault();
  fensterergebnisVerarbeiten(fensterTaste(fensterStapel, { code: "Escape" }, fensterumgebung()));
});
fensterElement.addEventListener("wheel", (radereignis) => {
  if (oberstesFenster(fensterStapel)?.art !== "verlauf") return;
  radereignis.preventDefault();
  fensterergebnisVerarbeiten(fensterTaste(fensterStapel, { code: radereignis.deltaY < 0 ? "ArrowUp" : "ArrowDown" }, fensterumgebung()));
}, { passive: false });

// Klick außerhalb des obersten Fensters schließt es, außer bei Charaktererstellung und Bestätigung; gibt true zurück,
// wenn der Klick damit verbraucht ist (ein offenes Fenster schluckt Klicks dahinter immer)
const FENSTER_OHNE_KLICK_AUSSEN = ["erstellung", "bestaetigung", "titel"];
function klickAusserhalbDesFensters() {
  const oben = oberstesFenster(fensterStapel);
  if (!oben) return false;
  if (!FENSTER_OHNE_KLICK_AUSSEN.includes(oben.art)) {
    fensterStapel = fensterStapel.slice(0, -1);
    zeichnen();
  }
  return true;
}

// Ein Fenster, das gerade Text oder eine Taste aufnimmt, bekommt auch ? und Umschalt+Ziffer
function fensterNimmtText(fenster) {
  if (fenster.art === "befehlszeile") return true;
  if (fenster.art === "verlauf") return Boolean(fenster.zustand.sucheAktiv);
  if (fenster.art === "einstellungen") return Boolean(fenster.zustand.aufnahme || fenster.zustand.konflikt);
  return false;
}

window.addEventListener("keydown", (tastenereignis) => {
  // Eine laufende Geschossbahn überspringt jede Taste, die Taste wirkt trotzdem
  if (laeuftAnimation(animation)) animationUeberspringen();
  // Während eines Ablaufs (Reise, Laufen, Rasten, Erkunden) bricht jede Taste ab und wird dabei geschluckt
  if (laufenderAblauf) {
    tastenereignis.preventDefault();
    return ablaufBeenden("abgebrochen");
  }
  // Offene Fenster bekommen jede Taste (eingabe/fenster.js); ? legt die Hilfe zum obersten Fenster obenauf
  if (fensterStapel.length) {
    tastenereignis.preventDefault();
    const nimmtText = fensterNimmtText(oberstesFenster(fensterStapel));
    if (!nimmtText && aktionDerTaste(belegung, tastenereignis.code, tastenereignis.key) === "hilfe" && oberstesFenster(fensterStapel).art !== "hilfe") {
      fensterStapel = fensterOeffnen(fensterStapel, "hilfe", { thema: oberstesFenster(fensterStapel).art });
      return zeichnen();
    }
    const taste = { code: tastenereignis.code, zeichen: tastenereignis.key, umschalt: tastenereignis.shiftKey };
    // Umschalt+Ziffer wechselt die Leiste auch bei offenem Fenster (zum Belegen anderer Leisten)
    const leistenAktion = AKTIONEN[aktionDerTaste(belegung, tastenereignis.code, tastenereignis.key, tastenereignis.shiftKey)];
    if (spiel && !nimmtText && tastenereignis.shiftKey && leistenAktion?.leiste !== undefined) {
      leisten = leisteWechseln(leisten, leistenAktion.leiste);
      speichernVormerken();
      return zeichnen();
    }
    return fensterergebnisVerarbeiten(fensterTaste(fensterStapel, taste, fensterumgebung()));
  }
  // Zielmodus: Bewegungstasten zielen, dazu Tab, Enter und Esc (eingabe/zielmodus.js)
  if (zielModus) {
    tastenereignis.preventDefault();
    return zielergebnisAnwenden(zielmodusTaste(spiel, zielModus, tastenereignis.code, belegung));
  }
  const ergebnis = uebersetzen(tastenereignis, belegung, spiel);
  if (!ergebnis) return;
  tastenereignis.preventDefault();
  aktionAusfuehren(ergebnis);
});

// Aktion aus Taste oder Knopf ohne offenes Fenster und ohne Zielmodus; ergebnis wie von uebersetzen
function aktionAusfuehren(ergebnis) {
  const aktion = ergebnis.aktion;
  if (AKTIONEN[aktion]?.platz !== undefined) return platzBenutzen(AKTIONEN[aktion].platz);
  if (AKTIONEN[aktion]?.leiste !== undefined) {
    leisten = leisteWechseln(leisten, AKTIONEN[aktion].leiste);
    speichernVormerken();
    return zeichnen();
  }
  if (aktion === "fallenlassen_waehlen") return fensterAuf("inventar", { gewaehlt: null, absicht: "fallenlassen" });
  if (aktion === "werfen_waehlen") return fensterAuf("inventar", { gewaehlt: null, absicht: "werfen" });
  if (aktion === "karte") return fensterAuf("karte", {});
  if (aktion === "befehlszeile") return fensterAuf("befehlszeile", befehlszeileOeffnen());
  if (aktion === "einstellungen") return fensterAuf("einstellungen", einstellungsfensterOeffnen());
  if (aktion === "abbrechen") {
    if (escSchritt({ zielModus, fensterStapel, laufenderAblauf }) === "menue") return fensterAuf("menue", menueOeffnen());
    return;
  }
  if (aktion === "inventar") return fensterAuf("inventar", { gewaehlt: null });
  if (aktion === "faehigkeiten") return fensterAuf("faehigkeiten", {});
  if (aktion === "charakter") return fensterAuf("charakter", charakterfensterOeffnen());
  if (aktion === "verlauf") return fensterAuf("verlauf", verlaufOeffnen());
  if (aktion === "hilfe") return fensterAuf("hilfe", {});
  if (aktion === "untersuchen") {
    if (spiel.zustand.vorbei) return;
    zielModus = zielmodusBeginnen(spiel, { zweck: "untersuchen" }).modus;
    return zeichnen();
  }
  if (aktion === "zoom_rein") return zoomen(1);
  if (aktion === "zoom_raus") return zoomen(-1);
  if (aktion === "rasten") return ablaufStarten(rastenBeginnen(spiel, einstellungen), naechsterRastschritt);
  if (aktion === "erkunden") return ablaufStarten(erkundenBeginnen(spiel, einstellungen), naechsterErkundungsschritt);
  if (aktion === "laufen") return ablaufStarten(laufenBeginnen(spiel, ergebnis.richtung, einstellungen), naechsterLaufschritt);
  // nach dem Tod öffnet Enter das Fenster "ende" wieder
  if (aktion === "neustart") {
    if (spiel.zustand.vorbei) fensterAuf("ende", endeOeffnen());
    return;
  }
  if (ergebnis.befehl) befehlGebenUndZeichnen(ergebnis.befehl);
}

// Ziel eines Treffers der Befehlszeile (eingabe/befehlszeile.js): eine Aktion wie ihre Taste, eine Einstellung öffnet
// das Einstellungsfenster an diesem Eintrag, ein Befehl (allmächtiger Lauf) geht durch die Eingangstür
function befehlszeileAusfuehren(ziel) {
  if (ziel.befehl) return befehlGebenUndZeichnen(ziel.befehl);
  if (ziel.einstellung) {
    fensterStapel = fensterOeffnen([], "einstellungen", einstellungsfensterOeffnen(ziel.einstellung));
    return zeichnen();
  }
  zeichnen();
  aktionAusfuehren(aktionsergebnis(ziel.aktion, spiel));
}

// Bedienzeile (anzeige/bedienzeile.js): Klick auf einen Platz oder Knopf wirkt wie seine Taste. Bei offenem Fenster oder
// Zielmodus geht nur der Knopf Menü (Esc), er schließt dann das oberste Fenster bzw. bricht das Zielen ab.
const bedienzeilenElement = document.getElementById("bedienzeile");
// Kein Fokus auf Knöpfen (sonst lösten Leertaste und Enter den Knopf aus); preventDefault beim Mausdruck ginge nicht,
// es verhinderte das Ziehen der Plätze
bedienzeilenElement.addEventListener("click", (mausereignis) => {
  const knopf = mausereignis.target.closest("button");
  if (!knopf) return;
  knopf.blur();
  if (laeuftAnimation(animation)) animationUeberspringen();
  if (laufenderAblauf) return ablaufBeenden("abgebrochen");
  const aktion = knopf.dataset.aktion;
  if (zielModus || fensterStapel.length) {
    if (aktion !== "abbrechen") return;
    if (zielModus) zielModus = null;
    else fensterStapel = fensterStapel.slice(0, -1);
    return zeichnen();
  }
  if (knopf.dataset.platz !== undefined) return platzBenutzen(Number(knopf.dataset.platz));
  if (aktion) aktionAusfuehren({ aktion });
});

// Ziehen mit der Maus (HTML-Drag-and-Drop): Plätze und Einträge aus Inventar und Fähigkeitenfenster tragen data-ziehen
// (Schlüssel des Platzes); auf einen Platz gezogen belegt bzw. tauscht, ein Platz aus der Leiste heraus gezogen wird leer
let gezogen = null; // { schluessel, vonStelle? }
document.addEventListener("dragstart", (ziehereignis) => {
  const quelle = ziehereignis.target.closest?.("[data-ziehen]");
  if (!quelle) return;
  const vonStelle = quelle.dataset.platz !== undefined ? Number(quelle.dataset.platz) : undefined;
  gezogen = { schluessel: quelle.dataset.ziehen, vonStelle, abgelegt: false };
  ziehereignis.dataTransfer.setData("text/plain", quelle.dataset.ziehen);
  ziehereignis.dataTransfer.effectAllowed = "move";
});
bedienzeilenElement.addEventListener("dragover", (ziehereignis) => {
  if (!gezogen || !ziehereignis.target.closest(".platz")) return;
  ziehereignis.preventDefault();
});
bedienzeilenElement.addEventListener("drop", (ziehereignis) => {
  const ziel = ziehereignis.target.closest(".platz");
  if (!gezogen || !ziel) return;
  ziehereignis.preventDefault();
  gezogen.abgelegt = true;
  const nachStelle = Number(ziel.dataset.platz);
  if (gezogen.vonStelle !== undefined) leisten = plaetzeTauschen(leisten, gezogen.vonStelle, nachStelle);
  else {
    const [art, name] = gezogen.schluessel.split(/:(.*)/);
    leisten = platzBelegen(leisten, nachStelle, art === "faehigkeit" ? { art, faehigkeit: name } : { art, typ: name });
  }
  speichernVormerken();
  zeichnen();
});
document.addEventListener("dragend", () => {
  if (gezogen && !gezogen.abgelegt && gezogen.vonStelle !== undefined && aktivePlaetze(leisten)[gezogen.vonStelle]) {
    leisten = platzLeeren(leisten, gezogen.vonStelle);
    speichernVormerken();
    zeichnen();
  }
  gezogen = null;
});

// Klick auf das Log öffnet den Verlauf
document.getElementById("log").addEventListener("click", () => {
  if (fensterStapel.length) return klickAusserhalbDesFensters();
  if (!zielModus && !laufenderAblauf) fensterAuf("verlauf", verlaufOeffnen());
});
document.getElementById("seitenleiste").addEventListener("click", () => {
  if (fensterStapel.length) klickAusserhalbDesFensters();
});

// Klick auf Minikarte oder Übersichtskarte reist zum Feld (wie ein Klick auf die Karte, nur über Erkundetes)
function reiseNachKarte(feld) {
  if (!feld || spiel.zustand.vorbei) return;
  if (laufenderAblauf) return ablaufBeenden("abgebrochen");
  ablaufStarten(reiseBeginnen(spiel, feld, einstellungen), naechsterReiseschritt);
}
minikartenCanvas.addEventListener("click", (mausereignis) => {
  if (!minikarte || fensterStapel.length || zielModus) return;
  const punkt = canvasPunkt(minikartenCanvas, mausereignis);
  reiseNachKarte(feldAmPunkt(minikarte.bild, minikarte.feldgroesse, punkt.x, punkt.y));
});
fensterElement.addEventListener("click", (mausereignis) => {
  const canvas = mausereignis.target.closest?.("canvas.uebersichtskarte");
  if (!canvas) return;
  const bild = minikartenBild(spiel, daten.zeichen);
  const feldgroesse = canvas.width / bild.breite;
  const punkt = canvasPunkt(canvas, mausereignis);
  const feld = feldAmPunkt(bild, feldgroesse, punkt.x, punkt.y);
  fensterStapel = [];
  zeichnen();
  reiseNachKarte(feld);
});

// Seitenleiste und Karte heben sich gegenseitig hervor (Vorbild Brogue)
const seitenleisteElement = document.getElementById("seitenleiste");
seitenleisteElement.addEventListener("mouseover", (mausereignis) => {
  const id = mausereignis.target.closest?.("[data-wesen]")?.dataset.wesen;
  const neu = id === undefined ? null : Number(id);
  if (neu === seitenleisteWesenId) return;
  seitenleisteWesenId = neu;
  zeichnen();
});
seitenleisteElement.addEventListener("mouseleave", () => {
  if (seitenleisteWesenId === null) return;
  seitenleisteWesenId = null;
  zeichnen();
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

// Rechtsklick untersucht; das Kontextmenü des Browsers bleibt über der Karte zu
kartenCanvas.addEventListener("contextmenu", (mausereignis) => mausereignis.preventDefault());

kartenCanvas.addEventListener("mousedown", (mausereignis) => {
  if (laufenderAblauf) return ablaufBeenden("abgebrochen");
  // ein offenes Fenster liegt über der Karte: der Klick daneben schließt es (außer Erstellung und Bestätigung)
  if (fensterStapel.length) {
    mausereignis.preventDefault();
    return klickAusserhalbDesFensters();
  }
  if (spiel.zustand.vorbei) return;
  const feld = feldAnPixel(mausereignis.offsetX, mausereignis.offsetY, kamera, einstellungen.zoom);
  if (belegung.maus[mausereignis.button] === "untersuchen") {
    mausereignis.preventDefault();
    const beginn = zielModus?.auswahl.zweck === "untersuchen" ? zielModus : zielmodusBeginnen(spiel, { zweck: "untersuchen" }).modus;
    zielModus = cursorSetzen(spiel, beginn, feld);
    return zeichnen();
  }
  if (belegung.maus[mausereignis.button] !== "handeln") return;
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

// Titel: Klicks wie in Fenstern ("Klick ist Taste"); liegt ein Fenster darüber, schließt ein Klick auf den Titel es
// (außer Bestätigung); das Kontextmenü des Browsers bleibt zu
titelElement.addEventListener("click", (mausereignis) => {
  if (oberstesFenster(fensterStapel)?.art !== "titel") return klickAusserhalbDesFensters();
  const element = mausereignis.target.closest?.("[data-taste], [data-ziel]");
  if (!element) return;
  const taste = element.dataset.taste !== undefined ? datenAus(element, "taste") : null;
  if (taste) return fensterergebnisVerarbeiten(fensterTaste(fensterStapel, taste, fensterumgebung()));
  const ziel = datenAus(element, "ziel");
  if (ziel) fensterergebnisVerarbeiten(fensterKlick(fensterStapel, ziel, fensterumgebung()));
});
titelElement.addEventListener("contextmenu", (mausereignis) => {
  mausereignis.preventDefault();
  if (oberstesFenster(fensterStapel)?.art !== "titel") klickAusserhalbDesFensters();
});

// Spruch aus dem Korpus: die Texte kommen nach; fehlen sie, bleibt der Titel ohne Spruch
Promise.all(korpusliste.map((name) => fetch(`sprache/de/korpus/${name}`).then((antwort) => (antwort.ok ? antwort.text() : Promise.reject(new Error(name))))
  .then((text) => korpustextZerlegen(name, text))))
  .then((korpustexte) => {
    spruch = spruchWaehlen(korpustexte, Math.random());
    if (fensterStapel[0]?.art === "titel") zeichnen();
  })
  .catch(() => { /* ohne Spruch */ });

// Start: mit ?seed= oder ?spielart= gleich ein Lauf auf dem ersten freien Platz, sonst (oder ohne freien Platz) der Titel
const startDerAdresse = startAusUrl();
const freieStelle = platzFuerNeuesSpiel(plaetze);
if ((startDerAdresse.startwert !== null || startDerAdresse.spielart) && freieStelle !== null && !plaetze[freieStelle]) {
  starten(freieStelle, startDerAdresse.startwert ?? zufaelligerStartwert(), startDerAdresse.spielart ?? "normal");
} else titelZeigen();
