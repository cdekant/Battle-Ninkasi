// Veränderliches Gelände (siehe docs/Architektur.md, Gelände): Felder der Karte ändern, Türen, Benutzen.
//   gelaendeSetzen(spiel, feld, name)   ändert ein Feld; Meldung "gelaende_geaendert"; das Sichtfeld wird neu berechnet,
//                                        wenn das Feld in Ninkasis Sichtweite liegt; Wesen darauf kommen in die Lageprüfung
//                                        (eine Wand an ihrem Platz klemmt sie ein, systeme/verschieben.js)
//   Baustein gelaende_setzen { gelaende, muster? }   auf das Zielfeld oder jedes Feld des Musters
//   Baustein gelaende_zerstoeren { muster? }         Gelände mit zerstoerbar: { wird } wird zu "wird"
//   Befehl benutzen { dx, dy }                       Nachbarfeld oder eigenes Feld mit beimBenutzen: Effekt, z.B. Hebel;
//                                                    Ziel des Effekts ist das Feld (Ursache "benutzen")
// Türen: die geschlossene trägt tuer: { offen: Gelände }, die offene tuer: { zu: Gelände }. Betritt ein Wesen, das
// Türen öffnet (tueren, welt/karte.js), eine geschlossene Tür, geht sie auf; verlässt das letzte Wesen eine offene Tür
// und liegt nichts mehr darin, geht sie zu (Haken betritt_feld und verlaesst_feld). Geschlossen versperrt sie die Sicht.

import { anmelden } from "../kern/register.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { effektAnwenden } from "../kern/effekte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { entitaetenAuf, spielerin } from "../kern/zustand.js";
import { lageVormerken } from "../kern/raumindex.js";
import { aufDerKarte, gelaendeAuf, gelaendeName, oeffnetTueren, abstand } from "../welt/karte.js";
import { musterFelder } from "./zielauswahl.js";
import { sichtfeldAktualisieren, reichweiteSicht } from "./sicht.js";

export function gelaendeSetzen(spiel, feld, name) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  if (!aufDerKarte(ebene, feld.x, feld.y)) return;
  const vorher = gelaendeName(spiel, feld.x, feld.y);
  if (vorher === name) return;
  const zeile = ebene.felder[feld.y];
  ebene.felder[feld.y] = zeile.slice(0, feld.x) + spiel.daten.gelaende[name].kennung + zeile.slice(feld.x + 1);
  // aus der Karte abgeleitete Vorräte verwerfen (Gasquellen, systeme/schichten.js)
  spiel.zwischenspeicher.gasquellen = null;
  melden(spiel, "gelaende_geaendert", { feld: { x: feld.x, y: feld.y }, vorher, nachher: name });
  for (const entitaet of entitaetenAuf(zustand, feld.x, feld.y)) lageVormerken(zustand, entitaet);
  const ninkasi = zustand.spielerinId != null ? spielerin(zustand) : null;
  if (ninkasi?.position && abstand(ninkasi.position, feld) <= reichweiteSicht(spiel, ninkasi)) sichtfeldAktualisieren(spiel);
}

// Felder eines Effekts: das Zielfeld oder die Felder des Musters vom Ursprung zum Zielfeld
function felderDesEffekts(spiel, kontext, muster) {
  const zielfeld = kontext.zielfeld ?? kontext.ursprung;
  if (!zielfeld) return [];
  if (!muster) return [zielfeld];
  return musterFelder(spiel, muster, { ursprung: kontext.ursprung ?? zielfeld, zielpunkt: zielfeld, quelleId: kontext.quelleId });
}

bausteinAnmelden("gelaende_setzen", { gelaende: "gelaende", muster: "muster?" }, (spiel, kontext, parameter) => {
  for (const feld of felderDesEffekts(spiel, kontext, parameter.muster)) gelaendeSetzen(spiel, feld, parameter.gelaende);
});

bausteinAnmelden("gelaende_zerstoeren", { muster: "muster?" }, (spiel, kontext, parameter) => {
  for (const feld of felderDesEffekts(spiel, kontext, parameter.muster)) {
    const wird = gelaendeAuf(spiel, feld.x, feld.y)?.zerstoerbar?.wird;
    if (wird) gelaendeSetzen(spiel, feld, wird);
  }
});

const istVersatz = (wert) => Number.isInteger(wert) && wert >= -1 && wert <= 1;
const feldDesBefehls = (akteur, befehl) => ({ x: akteur.position.x + befehl.dx, y: akteur.position.y + befehl.dy });

anmelden("befehle", "benutzen", {
  pruefen(spiel, akteur, befehl) {
    if (!istVersatz(befehl.dx) || !istVersatz(befehl.dy)) return "ungueltig";
    const feld = feldDesBefehls(akteur, befehl);
    return gelaendeAuf(spiel, feld.x, feld.y)?.beimBenutzen ? null : "nichts_zu_benutzen";
  },
  ausfuehren(spiel, akteur, befehl) {
    const feld = feldDesBefehls(akteur, befehl);
    const name = gelaendeName(spiel, feld.x, feld.y);
    melden(spiel, "benutzt", { wer: bezugAuf(akteur), gelaende: name, feld });
    effektAnwenden(spiel, gelaendeAuf(spiel, feld.x, feld.y).beimBenutzen, {
      quelleId: akteur.id, zielId: null, ursprung: feld, zielfeld: feld, ursache: "benutzen", mittel: { art: "gelaende", name },
    });
    return "benutzen";
  },
});

// Türen öffnen sich beim Betreten ...
anmelden("haken", "betritt_feld", (spiel, kontext) => {
  const wesen = spiel.zustand.entitaeten[kontext.zielId];
  const offen = gelaendeAuf(spiel, kontext.position.x, kontext.position.y)?.tuer?.offen;
  if (offen && wesen && oeffnetTueren(wesen)) gelaendeSetzen(spiel, kontext.position, offen);
});

// ... und schließen sich, wenn das letzte Wesen geht und nichts darin liegt (das gehende steht noch auf dem Feld)
anmelden("haken", "verlaesst_feld", (spiel, kontext) => {
  const zu = gelaendeAuf(spiel, kontext.position.x, kontext.position.y)?.tuer?.zu;
  if (!zu) return;
  const uebrige = entitaetenAuf(spiel.zustand, kontext.position.x, kontext.position.y).filter((entitaet) => entitaet.id !== kontext.zielId);
  if (!uebrige.length) gelaendeSetzen(spiel, kontext.position, zu);
});
