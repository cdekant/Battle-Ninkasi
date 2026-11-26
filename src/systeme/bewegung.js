// Befehle "bewegen" (mit Angriff durch Hineinlaufen) und "warten"; versetzen für alles, was Wesen bewegt.
// Befehle: { art: "bewegen", dx: -1..1, dy: -1..1, angreifen?, insLeere? }, { art: "warten" }
// Hineinlaufen greift Feinde an; mit angreifen: true jedes Wesen (Rausch, Verwirrung, gezielter Angriff auf Freunde).
// Platztausch: die gesteuerte Entität tauscht beim Schritt ohne angreifen den Platz mit einem Wesen, das ihr nicht
// feind ist, wenn beide beweglich sind und jedes das Feld des anderen betreten kann (Versetzart "tausch", Meldung
// getauscht); sonst ist das Feld besetzt.
// insLeere: true ist ein Schlag auf ein Feld ohne Wesen (Fehlschlag im Rausch, systeme/befehlsveraenderer.js): kostet
// einen Angriff, bewegt nicht und trifft nichts; steht doch ein Wesen dort, gilt es als Angriff mit angreifen: true.
// Bewegungsarten siehe welt/karte.js: betretbar ist, was die wirksame Bewegungsart des Wesens zulässt;
// ein unbewegliches Wesen greift an, bewegt sich aber nicht und lässt sich nicht verschieben (systeme/verschieben.js).
// Tür: der Schritt auf eine geschlossene Tür mit tuer.aufschlag (daten/gelaende.js) kostet so viel Prozent mehr als
// die eigenen Grundkosten fürs Bewegen; geöffnet wird sie beim Betreten (systeme/gelaende.js).

import { anmelden } from "../kern/register.js";
import { entitaetenAuf, bewegungVon, positionSetzen, istGesteuert, gesteuerteEntitaet, grundkostenVon } from "../kern/zustand.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { betretbar, gelaendeAuf } from "../welt/karte.js";
import { prozentVon } from "../kern/werte.js";
import { istWesen, feindlich, nahkampf, kannAngreifen, angriffskosten } from "./kampf.js";
import { sichtfeldAktualisieren, traegtLicht } from "./sicht.js";
import { lichtWirkt } from "./licht.js";
import { aktionAbbrechen } from "./laufendeAktionen.js";

export const VERSETZARTEN = ["schritt", "stoss", "zug", "tausch", "teleport", "herausgedrueckt"];

export function istUnbeweglich(wesen) {
  return bewegungVon(wesen) === "unbeweglich";
}

// Setzt ein Wesen auf ein Feld; alle Bewegungen laufen hierüber, die Position selbst über positionSetzen (kern/raumindex.js).
// Haken verlaesst_feld und betritt_feld mit dem Feld als position und der art (VERSETZARTEN); Quelle ist, wer das
// Wesen bewegt (optionen.urheberId, Vorgabe das Wesen selbst). Wird ein Wesen von einer anderen Urheberin versetzt,
// bricht eine lange Aktion ab, die "versetzt" in unterbrechbar nennt (systeme/laufendeAktionen.js).
// Prüft nichts: ob das Feld frei und betretbar ist, entscheidet die Aufruferin.
export function versetzen(spiel, wesen, feld, art, optionen = {}) {
  const beteiligte = beteiligteDesVersetzens(wesen, art, optionen);
  hakenAusloesen(spiel, "verlaesst_feld", { ...beteiligte, position: { x: wesen.position.x, y: wesen.position.y } });
  positionSetzen(spiel.zustand, wesen, feld);
  angekommen(spiel, wesen, feld, beteiligte);
}

// Zwei Wesen tauschen die Plätze (Versetzart "tausch"): erst beide Positionen, dann die Haken, so ist keines der beiden
// Felder dazwischen leer (eine offene Tür bleibt offen, systeme/gelaende.js). Prüft nichts, wie versetzen.
export function plaetzeTauschen(spiel, erstes, zweites, optionen = {}) {
  const feldErstes = { x: erstes.position.x, y: erstes.position.y }, feldZweites = { x: zweites.position.x, y: zweites.position.y };
  const beteiligteErstes = beteiligteDesVersetzens(erstes, "tausch", optionen), beteiligteZweites = beteiligteDesVersetzens(zweites, "tausch", optionen);
  positionSetzen(spiel.zustand, erstes, feldZweites);
  positionSetzen(spiel.zustand, zweites, feldErstes);
  hakenAusloesen(spiel, "verlaesst_feld", { ...beteiligteErstes, position: feldErstes });
  hakenAusloesen(spiel, "verlaesst_feld", { ...beteiligteZweites, position: feldZweites });
  angekommen(spiel, erstes, feldZweites, beteiligteErstes);
  angekommen(spiel, zweites, feldErstes, beteiligteZweites);
}

function beteiligteDesVersetzens(wesen, art, { urheberId = wesen.id, kettentiefe = 0 } = {}) {
  return { quelleId: urheberId, urheberId, zielId: wesen.id, ursache: "bewegung", kettentiefe, art };
}

// Was nach dem Setzen der Position folgt: Sicht, Gegenstände auf dem Feld, Haken betritt_feld, Abbruch langer Aktionen
function angekommen(spiel, wesen, feld, beteiligte) {
  const urheberId = beteiligte.urheberId;
  // eine bewegte Lichtquelle ändert, was Ninkasi sieht (systeme/licht.js)
  if (!istGesteuert(spiel.zustand, wesen) && lichtWirkt(spiel) && traegtLicht(spiel, wesen) && gesteuerteEntitaet(spiel.zustand)?.position) sichtfeldAktualisieren(spiel);
  if (istGesteuert(spiel.zustand, wesen)) {
    sichtfeldAktualisieren(spiel);
    for (const gegenstand of entitaetenAuf(spiel.zustand, feld.x, feld.y)) {
      if (gegenstand.aufhebbar) melden(spiel, "liegt_hier", { wer: bezugAuf(wesen), was: bezugAuf(gegenstand), anzahl: gegenstand.anzahl ?? 1 });
    }
  }
  hakenAusloesen(spiel, "betritt_feld", { ...beteiligte, position: { x: feld.x, y: feld.y } });
  if (urheberId !== wesen.id && wesen.laufendeAktion?.unterbrechbar?.includes("versetzt")) aktionAbbrechen(spiel, wesen, "versetzt");
}

function zielfeld(akteur, befehl) {
  return { x: akteur.position.x + befehl.dx, y: akteur.position.y + befehl.dy };
}

function wesenAuf(spiel, x, y) {
  return entitaetenAuf(spiel.zustand, x, y).find(istWesen) || null;
}

// Kann die Akteurin beim Schritt mit dem anderen Wesen den Platz tauschen? (siehe Kopf)
export function platztauschMoeglich(spiel, akteur, anderesWesen) {
  return istGesteuert(spiel.zustand, akteur) && !feindlich(spiel, akteur, anderesWesen) && !istUnbeweglich(akteur) && !istUnbeweglich(anderesWesen)
    && betretbar(spiel, akteur, anderesWesen.position) && betretbar(spiel, anderesWesen, akteur.position);
}

// Greift der Schritt das Wesen auf dem Zielfeld an?
const greiftAn = (spiel, akteur, anderesWesen, befehl) => kannAngreifen(spiel, akteur)
  && (feindlich(spiel, akteur, anderesWesen) || befehl.angreifen === true || befehl.insLeere === true);

const istEinzelschritt = (versatz) => Number.isInteger(versatz) && versatz >= -1 && versatz <= 1;

anmelden("befehle", "bewegen", {
  pruefen(spiel, akteur, befehl) {
    if (!istEinzelschritt(befehl.dx) || !istEinzelschritt(befehl.dy) || (befehl.dx === 0 && befehl.dy === 0)) return "ungueltig";
    if (befehl.angreifen !== undefined && typeof befehl.angreifen !== "boolean") return "ungueltig";
    if (befehl.insLeere !== undefined && typeof befehl.insLeere !== "boolean") return "ungueltig";
    const feld = zielfeld(akteur, befehl);
    const anderesWesen = wesenAuf(spiel, feld.x, feld.y);
    if (anderesWesen) return greiftAn(spiel, akteur, anderesWesen, befehl) || (befehl.angreifen !== true && platztauschMoeglich(spiel, akteur, anderesWesen)) ? null : "besetzt";
    if (befehl.insLeere === true) return kannAngreifen(spiel, akteur) ? null : "ungueltig";
    if (istUnbeweglich(akteur)) return "unbeweglich";
    if (!betretbar(spiel, akteur, feld)) return "wand";
    return null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const feld = zielfeld(akteur, befehl);
    const anderesWesen = wesenAuf(spiel, feld.x, feld.y);
    if (anderesWesen && greiftAn(spiel, akteur, anderesWesen, befehl)) {
      return { aktion: "nahkampf", grundkosten: nahkampf(spiel, akteur, anderesWesen) };
    }
    if (anderesWesen) {
      plaetzeTauschen(spiel, akteur, anderesWesen, { urheberId: akteur.id });
      melden(spiel, "getauscht", { wer: bezugAuf(akteur), mit: bezugAuf(anderesWesen) });
      return "bewegen";
    }
    if (befehl.insLeere === true) {
      melden(spiel, "ins_leere", { wer: bezugAuf(akteur), felder: [feld] });
      return { aktion: "nahkampf", grundkosten: angriffskosten(spiel, akteur) ?? grundkostenVon(spiel, akteur, "nahkampf") };
    }
    const aufschlag = gelaendeAuf(spiel, feld.x, feld.y)?.tuer?.aufschlag ?? 0;
    versetzen(spiel, akteur, feld, "schritt");
    if (!aufschlag) return "bewegen";
    return { aktion: "bewegen", grundkosten: prozentVon(grundkostenVon(spiel, akteur, "bewegen"), 100 + aufschlag) };
  },
});

anmelden("befehle", "warten", {
  pruefen() { return null; },
  ausfuehren() { return "warten"; },
});
