// Reifen und Verderben gebrauter Sude (siehe docs/Sude.md, Reifen und Verderben; Spieldesign in docs/Brauen.md,
// Gelingen und Verderben).
// Stufen: regeln.brauen.stufen = [{ name, wirkung, abStammwuerze?, saeure?, adjektiv? }] in ihrer Reihenfolge; ein Sud
//   trägt seine Stufe in sud.stufe, die Wirkung beim Trinken ist wirkung Prozent (systeme/sud.js wirkungBerechnen); eine
//   Stufe mit abStammwuerze überspringt ein schwächerer Sud; saeure kommt beim Erreichen der Stufe auf die Säure;
//   adjektiv steht am Getränk (Komponente adjektive, kern/ereignisse.js adjektiveVon)
//   Nach der letzten Stufe wird das Getränk zu regeln.brauen.essig (eine Zutat), mit derselben Anzahl.
// Dauer jeder Stufe (dauerDerStufen): regeln.brauen.reifen.grund mal (100 + Zuschlag) Prozent, höchstens hoechstens
//   Prozent; der Zuschlag ist je Achse in reifen.gewichte deren Wert mal Gewicht durch 100, dazu Güte mal reifen.guete
//   durch 100; Modifikatoren auf brauen.haltbarkeit an der Brauerin. Gemessen wird über das Verderben der Gegenstände:
//   verdirbt: { nach } am Getränk, Zeitpunkt verdirbtUm, Zeitereignis "verderben" (systeme/verschleiss.js); dieses
//   System meldet sich im Register "verderben" an und rückt den Sud eine Stufe weiter, statt den Typ zu wechseln.
// Verderber: verdirbt ein Sud beim Brauen, entsteht mit regeln.brauen.verderber.chance Prozent neben dem Kessel ein
//   Wesen, das der Kultur (verderber: name) oder regeln.brauen.verderber.wesen (null: keines; über den Baustein
//   beschwoeren; Meldung verderber_entsteht).

import { anmelden, holen } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { ausDemInventarNehmen, entitaetMitId } from "../kern/zustand.js";
import { modifiziert } from "../kern/werte.js";
import { wurfProzent } from "../kern/wurf.js";
import { brauregeln } from "./sud.js";
import { insInventar, verderbenEinplanen, anzahlVon } from "./inventar.js";
import { gegenstandErsetzen } from "./verschleiss.js";

const stufenVon = (daten) => brauregeln(daten).stufen;
export const stufeVon = (daten, name) => stufenVon(daten).find((stufe) => stufe.name === name) ?? null;

// Dauer jeder Stufe eines Suds in Zeiteinheiten; wesen ist die Brauerin (Modifikatoren auf brauen.haltbarkeit)
export function dauerDerStufen(spiel, wesen, sud) {
  const { grund, gewichte, guete, hoechstens } = brauregeln(spiel.daten).reifen;
  let zuschlag = Math.floor((sud.guete * guete) / 100);
  for (const [achse, gewicht] of Object.entries(gewichte)) zuschlag += Math.floor(((sud.profil[achse] ?? 0) * gewicht) / 100);
  const dauer = Math.floor((grund * Math.min(hoechstens, 100 + zuschlag)) / 100);
  return Math.max(1, modifiziert(spiel, wesen, "brauen.haltbarkeit", dauer));
}

// Setzt ein frisch gebrautes Getränk auf seine erste Stufe (verdorbene beginnen bei regeln.brauen.verdorben.stufe) und
// plant die nächste ein
export function stufenBeginnen(spiel, wesen, getraenk, verdorben) {
  const stufe = verdorben ? stufeVon(spiel.daten, brauregeln(spiel.daten).verdorben.stufe) : stufenVon(spiel.daten)[0];
  stufeSetzen(getraenk, stufe);
  getraenk.verdirbt = { nach: dauerDerStufen(spiel, wesen, getraenk.sud) };
  getraenk.verdirbtUm = spiel.zustand.zeit + getraenk.verdirbt.nach;
  verderbenEinplanen(spiel.zustand, getraenk);
}

function stufeSetzen(getraenk, stufe) {
  getraenk.sud.stufe = stufe.name;
  if (stufe.adjektiv) getraenk.adjektive = [stufe.adjektiv];
  else delete getraenk.adjektive;
}

// Die nächste Stufe nach der des Suds, die er erreicht; null nach der letzten
function naechsteStufe(daten, sud) {
  const stufen = stufenVon(daten);
  for (let stelle = stufen.findIndex((stufe) => stufe.name === sud.stufe) + 1; stelle < stufen.length; stelle++) {
    const stufe = stufen[stelle];
    if (stufe.abStammwuerze === undefined || sud.profil.stammwuerze >= stufe.abStammwuerze) return stufe;
  }
  return null;
}

// Register "verderben" (systeme/verschleiss.js): ein Sud rückt eine Stufe weiter oder wird nach der letzten zu Essig
anmelden("verderben", "sud", (spiel, gegenstand) => {
  if (!gegenstand.sud) return false;
  const daten = spiel.daten, zustand = spiel.zustand;
  const vorher = bezugAuf(gegenstand), anzahl = anzahlVon(gegenstand);
  const stufe = naechsteStufe(daten, gegenstand.sud);
  if (!stufe) {
    const { neu, traegerin } = gegenstandErsetzen(spiel, gegenstand, brauregeln(daten).essig);
    melden(spiel, "verdorben", { was: vorher, wird: bezugAuf(neu), traegerin: traegerin ? bezugAuf(traegerin) : null, anzahl });
    return true;
  }
  const achse = brauregeln(daten).verdorben.achse;
  if (stufe.saeure) gegenstand.sud.profil[achse] = Math.min(brauregeln(daten).achsen[achse].hoechstens, gegenstand.sud.profil[achse] + stufe.saeure);
  stufeSetzen(gegenstand, stufe);
  gegenstand.verdirbtUm = zustand.zeit + gegenstand.verdirbt.nach;
  verderbenEinplanen(zustand, gegenstand);
  // im Gepäck neu einsortieren: ein gleicher Stapel derselben Stufe nimmt ihn auf
  const traegerin = gegenstand.getragenVon !== undefined ? entitaetMitId(zustand, gegenstand.getragenVon) : null;
  let jetzt = gegenstand;
  if (traegerin) {
    ausDemInventarNehmen(traegerin, gegenstand.id);
    delete gegenstand.getragenVon;
    jetzt = insInventar(spiel, traegerin, gegenstand);
  }
  melden(spiel, "verdorben", { was: vorher, wird: bezugAuf(jetzt), traegerin: traegerin ? bezugAuf(traegerin) : null, anzahl });
  return true;
});

// Ein Verderber aus dem Kessel nach einem verdorbenen Sud; kultur sind die Daten der Kultur oder Flora des Suds
export function verderberWuerfeln(spiel, kessel, kultur) {
  const regeln = brauregeln(spiel.daten).verderber;
  const wesen = kultur?.verderber ?? regeln.wesen;
  if (!wesen || !wurfProzent(spiel, "verderber", regeln.chance)) return;
  const vorher = new Set(Object.keys(spiel.zustand.entitaeten));
  const feld = { x: kessel.x, y: kessel.y };
  holen("bausteine", "beschwoeren")(spiel, { ursprung: feld, zielfeld: feld, quelleId: null, urheberId: null, urheberFraktion: null, kettentiefe: 0 }, { wesen });
  const entstanden = Object.values(spiel.zustand.entitaeten).find((entitaet) => !vorher.has(String(entitaet.id)) && entitaet.typ === wesen);
  if (entstanden) melden(spiel, "verderber_entsteht", { was: bezugAuf(entstanden), kessel: feld });
}
