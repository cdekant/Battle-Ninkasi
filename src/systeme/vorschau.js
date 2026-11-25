// Vorschau für den Zielmodus (siehe docs/Bedienung.md, Zielmodus): reine Lesefunktionen, ändern nichts und würfeln nicht.
// Eine Auswahl sagt, womit gezielt wird:
//   { zweck: "werfen", gegenstandId }       ein Gegenstand aus dem Gepäck (systeme/werfen.js)
//   { zweck: "schiessen", waffeId }         eine angelegte Fernwaffe (systeme/fernkampf.js)
// Wurfwaffen und Schüsse zeigen die Chance ihres eigenen Trefferwurfs; ein zerspringender Wurf zeigt die Felder, auf die
// er streuen kann (streuung).
//   { zweck: "faehigkeit", faehigkeit }     eine Fähigkeit der Akteurin (systeme/faehigkeiten.js)
// Trefferchance: nur, wenn die Wirkung unmittelbar mit einem Baustein trefferwurf beginnt; ein Trefferwurf, der erst
// verschachtelt kommt (z.B. in fuer_jedes_ziel), ist ohne Simulation nicht vorherzusagen, die Chance bleibt dann offen.

import { holen } from "../kern/register.js";
import { entitaetMitId, istWesen, istGesteuert } from "../kern/zustand.js";
import { trefferanteil, anteilInProzent, angriffeVon } from "./kampf.js";
import { istAhnungslos } from "./wahrnehmung.js";
import { istWehrlos } from "./zustaende.js";
import { istSichtbar } from "./sicht.js";
import { zielAufloesen } from "./zielauswahl.js";
import { faehigkeitFuer, faehigkeitPruefen, wirkungsziele } from "./faehigkeiten.js";
import { wurfbahn, streufelder } from "./werfen.js";
import { fernwaffeVon, schussbahn, schussZiele, schusswerte, naechsteMunition } from "./fernkampf.js";

const ohneDoppelte = (liste) => [...new Set(liste)];
const tagsDesEffekts = (spiel, effektName) => spiel.daten.effekte?.[effektName]?.tags || [];

// Steckt in einem Effekt irgendwo ein Trefferwurf (auch in verschachtelten Effekten)?
function enthaeltTrefferwurf(spiel, effektName, besucht = new Set()) {
  if (!effektName || besucht.has(effektName)) return false;
  besucht.add(effektName);
  for (const schritt of spiel.daten.effekte?.[effektName]?.schritte || []) {
    if (schritt.baustein === "trefferwurf") return true;
    const beschreibung = holen("bausteine", schritt.baustein).parameter || {};
    for (const [parameterName, art] of Object.entries(beschreibung)) {
      if (typeof art === "string" && art.startsWith("effekt") && enthaeltTrefferwurf(spiel, schritt[parameterName], besucht)) return true;
    }
  }
  return false;
}

// Chance, dass ein Effekt das Ziel trifft: { prozent, hinterhalt? } oder { sicher: true } (kein Trefferwurf)
// oder null (Trefferwurf nur verschachtelt); tags: die Tags der Wirkung (z.B. der Fähigkeit), die des Effekts kommen dazu
export function trefferchanceVorschau(spiel, quelle, ziel, effektName, tags = []) {
  const effekt = spiel.daten.effekte?.[effektName];
  if (!effekt) return { sicher: true };
  const ersterSchritt = effekt.schritte[0];
  if (ersterSchritt?.baustein !== "trefferwurf") return enthaeltTrefferwurf(spiel, effektName) ? null : { sicher: true };
  if (quelle && istAhnungslos(ziel)) return { prozent: 100, hinterhalt: true };
  if (istWehrlos(spiel, ziel)) return { prozent: 100 };
  const alleTags = ohneDoppelte([...tags, ...tagsDesEffekts(spiel, effektName), ...tagsDesEffekts(spiel, ersterSchritt.effekt)]);
  const { zaehler, nenner } = trefferanteil(spiel, { quelle, ziel, genauigkeit: ersterSchritt.genauigkeit, gegen: ersterSchritt.gegen, tags: alleTags });
  return { prozent: anteilInProzent(zaehler, nenner) };
}

// Chance des ersten Angriffsprofils eines Wesens gegen ein anderes (Untersuchen, systeme/untersuchen.js):
// { prozent, hinterhalt? } oder null ohne Angriff; die Tags wie in kampf.js (Profil und Effekt)
export function nahkampfchanceVorschau(spiel, angreifer, ziel) {
  const profil = angriffeVon(spiel, angreifer)[0];
  if (!profil) return null;
  if (istAhnungslos(ziel)) return { prozent: 100, hinterhalt: true };
  if (istWehrlos(spiel, ziel)) return { prozent: 100 };
  const tags = ohneDoppelte([...(profil.tags || []), ...tagsDesEffekts(spiel, profil.effekt)]);
  const { zaehler, nenner } = trefferanteil(spiel, { quelle: angreifer, ziel, genauigkeit: profil.genauigkeit, tags });
  return { prozent: anteilInProzent(zaehler, nenner) };
}

// Wesen, auf die die Wirkung fällt, mit ihrer Trefferchance; für Ninkasi nur, was sie sieht
function betroffeneMitChance(spiel, akteur, zielIds, effektName, tags) {
  const zustand = spiel.zustand;
  return ohneDoppelte(zielIds)
    .map((id) => entitaetMitId(zustand, id))
    .filter((entitaet) => entitaet && istWesen(entitaet) && entitaet.position)
    .filter((entitaet) => !istGesteuert(zustand, akteur) || istSichtbar(zustand, entitaet.position.x, entitaet.position.y))
    .map((entitaet) => ({ id: entitaet.id, chance: trefferchanceVorschau(spiel, akteur, entitaet, effektName, tags) }));
}

// Chance eines eigenen Trefferwurfs mit dieser Genauigkeit (Wurfwaffe, Schuss): { prozent, hinterhalt? }
function chanceMitGenauigkeit(spiel, quelle, ziel, genauigkeit, effektName, tags) {
  if (istAhnungslos(ziel)) return { prozent: 100, hinterhalt: true };
  if (istWehrlos(spiel, ziel)) return { prozent: 100 };
  const { zaehler, nenner } = trefferanteil(spiel, { quelle, ziel, genauigkeit, tags: ohneDoppelte([...tags, ...tagsDesEffekts(spiel, effektName)]) });
  return { prozent: anteilInProzent(zaehler, nenner) };
}

// Sichtbare Wesen unter den Zielen mit der Chance eines eigenen Trefferwurfs
function betroffeneMitGenauigkeit(spiel, akteur, zielIds, genauigkeit, effektName, tags) {
  const zustand = spiel.zustand;
  return zielIds.map((id) => entitaetMitId(zustand, id))
    .filter((entitaet) => entitaet && istWesen(entitaet) && entitaet.position)
    .filter((entitaet) => !istGesteuert(zustand, akteur) || istSichtbar(zustand, entitaet.position.x, entitaet.position.y))
    .map((entitaet) => ({ id: entitaet.id, chance: chanceMitGenauigkeit(spiel, akteur, entitaet, genauigkeit, effektName, tags) }));
}

function wurfVorschau(spiel, akteur, auswahl, zielangabe) {
  const befehl = { art: "werfen", gegenstandId: auswahl.gegenstandId, ziel: zielangabe };
  const grund = holen("befehle", "werfen").pruefen(spiel, akteur, befehl);
  const gegenstand = entitaetMitId(spiel.zustand, auswahl.gegenstandId);
  const aufloesung = gegenstand ? wurfbahn(spiel, akteur, gegenstand, zielangabe) : { ok: false, grund: "nichts_zu_werfen" };
  // ohne effekt landet der Gegenstand nur, es trifft niemanden
  const getroffen = aufloesung.ok && gegenstand.wurf?.effekt ? aufloesung.bahn.getroffene.slice(0, 1) : [];
  const streuung = aufloesung.ok ? streufelder(spiel, akteur, gegenstand, aufloesung.bahn) : [];
  const betroffene = gegenstand?.wurf?.genauigkeit !== undefined
    ? betroffeneMitGenauigkeit(spiel, akteur, getroffen, gegenstand.wurf.genauigkeit, gegenstand.wurf.effekt, ["wurf"])
    : betroffeneMitChance(spiel, akteur, getroffen, gegenstand?.wurf?.effekt, []);
  return { grund, aufloesung, betroffene, befehl, streuung };
}

function schussVorschau(spiel, akteur, auswahl, zielangabe) {
  const befehl = { art: "schiessen", waffeId: auswahl.waffeId, ziel: zielangabe };
  const grund = holen("befehle", "schiessen").pruefen(spiel, akteur, befehl);
  const waffe = fernwaffeVon(spiel, akteur, auswahl.waffeId);
  if (!waffe) return { grund, aufloesung: { ok: false, grund }, betroffene: [], befehl };
  const aufloesung = schussbahn(spiel, akteur, waffe, zielangabe);
  const schuss = waffe.ausruestung.schuss;
  const { genauigkeit } = schusswerte(waffe, naechsteMunition(spiel, akteur, waffe));
  const zielIds = aufloesung.ok ? schussZiele(waffe, aufloesung.bahn) : [];
  return { grund, aufloesung, betroffene: betroffeneMitGenauigkeit(spiel, akteur, zielIds, genauigkeit, schuss.effekt, schuss.tags || []), befehl };
}

function faehigkeitVorschau(spiel, akteur, auswahl, zielangabe) {
  const definition = faehigkeitFuer(spiel, akteur, auswahl.faehigkeit);
  const befehl = { art: "faehigkeit", faehigkeit: auswahl.faehigkeit, ziel: zielangabe };
  const grund = faehigkeitPruefen(spiel, akteur, auswahl.faehigkeit, zielangabe);
  if (!definition?.ziel) return { grund, aufloesung: null, betroffene: [], befehl };
  const aufloesung = zielAufloesen(spiel, akteur, definition.ziel, zielangabe);
  const zielIds = aufloesung.ok ? wirkungsziele(spiel, akteur, definition.ziel, aufloesung).filter((id) => id !== null) : [];
  return { grund, aufloesung, betroffene: betroffeneMitChance(spiel, akteur, zielIds, definition.wirkung, definition.tags || []), befehl };
}

// Vorschau einer Auswahl auf eine Zielangabe ({ x, y } | { id } | { dx, dy }):
// { ok, grund (null, wenn der Befehl ginge), aufloesung (aus zielAufloesen, mit felder und bahn), betroffene: [{ id, chance }],
// befehl, streuung: [{ x, y }] }
const VORSCHAUEN = { werfen: wurfVorschau, schiessen: schussVorschau, faehigkeit: faehigkeitVorschau };
export function zielvorschau(spiel, akteur, auswahl, zielangabe) {
  const vorschau = VORSCHAUEN[auswahl.zweck](spiel, akteur, auswahl, zielangabe);
  return { ok: vorschau.grund === null, streuung: [], ...vorschau };
}
