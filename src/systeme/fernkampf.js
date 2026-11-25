// Fernkampf (siehe docs/Wesen.md, Fernkampf): Schießen und Nachladen mit angelegten Fernwaffen, ein Modell für alle
// Gattungen von der Schleuder bis zum Laser; was sie unterscheidet, sind die Werte.
// Daten an der Waffe: ausruestung.schuss: { name, genauigkeit, effekt, reichweite, sorte?, kosten?, kritchance?,
//   zielart?: "geschoss" | "strahl", schuesse?, laerm?, tags?, magazin? }
//   sorte:    welche Munition sie verschießt (geschoss.sorte); fehlt nur bei einem Magazin, das sich selbst füllt
//   kosten:   Zeitkosten eines Schusses (Vorgabe aktionen.schiessen); ohne Magazin steckt das Laden darin
//   zielart:  geschoss trifft das erste Wesen der Bahn, strahl alle auf der Linie bis zur Reichweite (Durchschuss)
//   schuesse: Salve, so viele Schüsse in einer Aktion, jeder mit eigener Munition und eigenem Wurf (Vorgabe 1)
//   laerm:    Lautstärke am Abschuss (Vorgabe regeln.wahrnehmung.laermSchuss), Modifikatoren auf "laerm" (Schalldämpfer)
//   magazin:  { fasst, nachladen?, auffuellen?: { je } }; ohne magazin nimmt jeder Schuss ein Stück aus dem Gepäck
//             (Munitionsart "gepaeck"), mit magazin schießt die Waffe aus ihrem Inhalt (Munitionsart "magazin"):
//             nachladen kostet so viel Zeit (Vorgabe aktionen.nachladen) und füllt das ganze Magazin aus dem Gepäck,
//             auffuellen füllt es ohne Munition mit einem Schuss je je Zeiteinheiten (Druck)
// Daten an der Munition: geschoss: { sorte, bruchchance?, effekt?, genauigkeit?, kritchance? }
//   der Effekt der Waffe wirkt, der der Munition kommt bei einem Treffer dazu, Genauigkeit und Krit addieren sich;
//   nach dem Schuss landet das Stück (nach einem Treffer unter dem Ziel) oder zerbricht nach bruchchance (Vorgabe
//   regeln.fernkampf.bruchchance, systeme/werfen.js landenOderBrechen), mit 100 ist es verbraucht (Kugel, Zelle)
// Inhalt des Magazins am Gegenstand: geladen: { typ, anzahl, gewichtJe } bzw. mit auffuellen { anzahl, seit } (der Stand
//   folgt aus der Zeit seit seit, nachgerechnet nur bei Bedarf); nur eine Munitionsart zugleich; Fundstücke liegen leer,
//   ein Wesen bekommt ein volles Magazin über die Ausstattung { typ, angelegt: true, geladen: munitionstyp }
// Befehle: { art: "schiessen", waffeId?, munitionId?, ziel: { x, y } | { id } } mit der ersten angelegten Fernwaffe ohne
//   waffeId, der ersten passenden Munition im Gepäck ohne munitionId; { art: "nachladen", waffeId?, munitionId? }
//   Ablehnungen: keine_fernwaffe, keine_munition, leer, nicht_nachladbar, schon_geladen und die der Zielauswahl
//   Nachgeladen wird nie von selbst: eine leere Waffe schießt nicht.
// Meldungen: geschossen, geschoss, gelandet bzw. zerbrochen, nachgeladen; Lärm "schuss" am Abschuss, "aufschlag", wo
//   ein Stück landet oder zerbricht; Haken gegenstand_benutzt mit art "schiessen" bzw. "nachladen"
// KI (ki/handlungen.js): schussbefehl und nachladebefehl, ohne Nebenwirkungen

import { anmelden, holen } from "../kern/register.js";
import { entitaetMitId, entitaetEntfernen, ausDatenErzeugen, ausDemInventarNehmen } from "../kern/zustand.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { kontextVervollstaendigen } from "../kern/effekte.js";
import { modifiziert } from "../kern/werte.js";
import { ausgeruestete, istAngelegt } from "./ausruestung.js";
import { einenAbnehmen, insInventar, anzahlVon } from "./inventar.js";
import { trefferwurfMitFolgen } from "./kampf.js";
import { zielAufloesen } from "./zielauswahl.js";
import { laermMachen } from "./wahrnehmung.js";
import { landenOderBrechen, bruchchanceVorgabe } from "./werfen.js";

// Angelegte Fernwaffen eines Wesens in der Reihenfolge des Anlegens
export function fernwaffen(spiel, wesen) {
  if (!wesen?.ausgeruestet?.length) return [];
  return ausgeruestete(spiel, wesen).filter((gegenstand) => gegenstand.ausruestung.schuss);
}

// Die Fernwaffe für einen Befehl: mit waffeId diese, wenn sie angelegt ist, sonst die erste; null ohne
export function fernwaffeVon(spiel, wesen, waffeId) {
  const waffen = fernwaffen(spiel, wesen);
  return waffeId === undefined ? waffen[0] ?? null : waffen.find((waffe) => waffe.id === waffeId) ?? null;
}

const schussVon = (waffe) => waffe.ausruestung.schuss;
const passt = (gegenstand, sorte) => sorte !== undefined && gegenstand?.geschoss?.sorte === sorte;
export const munitionsartVon = (schuss) => (schuss.magazin ? "magazin" : "gepaeck");

// Passende Munition im Gepäck in seiner Reihenfolge, ohne Angelegtes
export function munitionImGepaeck(spiel, wesen, sorte) {
  return (wesen.inventar || []).map((id) => entitaetMitId(spiel.zustand, id))
    .filter((gegenstand) => passt(gegenstand, sorte) && !istAngelegt(wesen, gegenstand.id));
}

// Die Munition für einen Befehl: mit munitionId dieses Stück, wenn es passt, sonst das erste passende
function munitionWaehlen(spiel, wesen, sorte, munitionId) {
  if (munitionId === undefined) return munitionImGepaeck(spiel, wesen, sorte)[0] ?? null;
  return munitionImGepaeck(spiel, wesen, sorte).find((gegenstand) => gegenstand.id === munitionId) ?? null;
}

// Schuss im Magazin (ohne Magazin null); mit auffuellen nach der Zeit seit dem letzten Stand, höchstens fasst
export function magazinStand(spiel, waffe) {
  const magazin = schussVon(waffe).magazin;
  if (!magazin) return null;
  const anzahl = waffe.geladen?.anzahl ?? 0;
  if (!magazin.auffuellen) return anzahl;
  const seit = waffe.geladen?.seit ?? spiel.zustand.zeit;
  return Math.min(magazin.fasst, anzahl + Math.floor((spiel.zustand.zeit - seit) / magazin.auffuellen.je));
}

// Ein Magazin, das sich selbst füllt, beginnt leer zur Zeit seines Entstehens
anmelden("beimErzeugen", "magazin_auffuellen", (zustand, entitaet) => {
  if (entitaet.ausruestung?.schuss?.magazin?.auffuellen && !entitaet.geladen) entitaet.geladen = { anzahl: 0, seit: zustand.zeit };
});

// Füllt ein Magazin ganz mit einer Munitionsart, ohne Gepäck (Ausstattung beim Erzeugen)
function magazinFuellen(spiel, waffe, typ) {
  const magazin = schussVon(waffe).magazin;
  waffe.geladen = { typ, anzahl: magazin.fasst, gewichtJe: spiel.daten.gegenstaende[typ].gewicht ?? 0 };
}

// Ausstattung mit geladen: die angelegte Waffe dieses Typs bekommt ein volles Magazin (nach systeme/inventar.js)
anmelden("ausDaten", "ausstattung_geladen", (spiel, wesen, datensatz) => {
  for (const eintrag of datensatz.ausstattung || []) {
    if (!eintrag.geladen) continue;
    const waffe = fernwaffen(spiel, wesen).find((kandidat) => kandidat.typ === eintrag.typ && !kandidat.geladen);
    if (waffe) magazinFuellen(spiel, waffe, eintrag.geladen);
  }
});

// Munitionsarten: bereit (Grund oder null), entnehmen (nimmt einen Schuss: { daten, gegenstand } mit den Daten der
// Munition und dem Stück, das fliegt, oder null ohne Stück), vorrat ({ geladen, fasst, imGepaeck } für die Anzeige)
anmelden("munitionsarten", "gepaeck", {
  bereit(spiel, wesen, waffe, munitionId) {
    return munitionWaehlen(spiel, wesen, schussVon(waffe).sorte, munitionId) ? null : "keine_munition";
  },
  entnehmen(spiel, wesen, waffe, munitionId) {
    const sorte = schussVon(waffe).sorte;
    const vorrat = munitionWaehlen(spiel, wesen, sorte, munitionId) ?? munitionWaehlen(spiel, wesen, sorte);
    if (!vorrat) return null;
    const gegenstand = einenAbnehmen(spiel, wesen, vorrat);
    return { daten: gegenstand.geschoss, gegenstand };
  },
  vorrat(spiel, wesen, waffe) {
    const imGepaeck = munitionImGepaeck(spiel, wesen, schussVon(waffe).sorte).reduce((summe, gegenstand) => summe + anzahlVon(gegenstand), 0);
    return { geladen: null, fasst: null, imGepaeck };
  },
});

anmelden("munitionsarten", "magazin", {
  bereit(spiel, wesen, waffe) {
    return magazinStand(spiel, waffe) > 0 ? null : "leer";
  },
  entnehmen(spiel, wesen, waffe) {
    const stand = magazinStand(spiel, waffe);
    if (stand <= 0) return null;
    const magazin = schussVon(waffe).magazin;
    if (magazin.auffuellen) {
      // der Stand rückt um die vollen Abschnitte vor, ein volles Magazin füllt ab jetzt nach
      const seit = waffe.geladen?.seit ?? spiel.zustand.zeit;
      const neuerBeginn = stand >= magazin.fasst ? spiel.zustand.zeit : seit + Math.floor((spiel.zustand.zeit - seit) / magazin.auffuellen.je) * magazin.auffuellen.je;
      waffe.geladen = { anzahl: stand - 1, seit: neuerBeginn };
      return { daten: {}, gegenstand: null };
    }
    const typ = waffe.geladen.typ;
    waffe.geladen.anzahl = stand - 1;
    if (waffe.geladen.anzahl === 0) delete waffe.geladen;
    const daten = spiel.daten.gegenstaende[typ].geschoss;
    // was sicher verbraucht ist, entsteht gar nicht erst als Stück
    if ((daten.bruchchance ?? bruchchanceVorgabe(spiel)) >= 100) return { daten, gegenstand: null };
    return { daten, gegenstand: ausDatenErzeugen(spiel, "gegenstaende", typ, null) };
  },
  vorrat(spiel, wesen, waffe) {
    const schuss = schussVon(waffe);
    const imGepaeck = schuss.sorte === undefined ? null
      : munitionImGepaeck(spiel, wesen, schuss.sorte).reduce((summe, gegenstand) => summe + anzahlVon(gegenstand), 0);
    return { geladen: magazinStand(spiel, waffe), fasst: schuss.magazin.fasst, imGepaeck, typ: waffe.geladen?.typ ?? null };
  },
});

const munitionsart = (waffe) => holen("munitionsarten", munitionsartVon(schussVon(waffe)));

// Vorrat der Waffe für die Anzeige: { geladen, fasst, imGepaeck, typ? }
export function munitionsvorrat(spiel, wesen, waffe) {
  return munitionsart(waffe).vorrat(spiel, wesen, waffe);
}

// Zielart des Schusses für diese Schützin: Reichweite nach Modifikatoren auf "reichweite" mit den Tags des Schusses
export function schussZielart(spiel, wesen, waffe) {
  const schuss = schussVon(waffe);
  const reichweite = Math.max(1, modifiziert(spiel, wesen, "reichweite", schuss.reichweite, { tags: schuss.tags || [] }));
  return schuss.zielart === "strahl" ? { art: "geschoss", reichweite, durchdringend: true, ueberZielHinaus: true } : { art: "geschoss", reichweite };
}

export function schussbahn(spiel, wesen, waffe, zielangabe) {
  return zielAufloesen(spiel, wesen, schussZielart(spiel, wesen, waffe), zielangabe);
}

// Wen ein Schuss auf dieser Bahn trifft: ein Geschoss das erste Wesen, ein Strahl alle
export function schussZiele(waffe, bahn) {
  return schussVon(waffe).zielart === "strahl" ? [...bahn.getroffene] : bahn.getroffene.slice(0, 1);
}

// Genauigkeit und Krit eines Schusses mit dieser Munition
export function schusswerte(waffe, munitionsdaten = {}) {
  const schuss = schussVon(waffe);
  return { genauigkeit: schuss.genauigkeit + (munitionsdaten.genauigkeit ?? 0), kritchance: (schuss.kritchance ?? 0) + (munitionsdaten.kritchance ?? 0) };
}

// Daten der Munition, die der nächste Schuss nimmt (für die Vorschau), ohne etwas zu ändern; {} ohne
export function naechsteMunition(spiel, wesen, waffe, munitionId) {
  const schuss = schussVon(waffe);
  if (schuss.magazin) return waffe.geladen?.typ ? spiel.daten.gegenstaende[waffe.geladen.typ].geschoss : {};
  return munitionWaehlen(spiel, wesen, schuss.sorte, munitionId)?.geschoss ?? {};
}

function einSchuss(spiel, akteur, waffe, munition, bahn) {
  const schuss = schussVon(waffe);
  const aufschlag = { x: bahn.aufschlag.x, y: bahn.aufschlag.y };
  melden(spiel, "geschoss", { quelle: bezugAuf(akteur), bahn: bahn.felder, aufschlag });
  const { genauigkeit, kritchance } = schusswerte(waffe, munition.daten);
  for (const zielId of schussZiele(waffe, bahn)) {
    const ziel = entitaetMitId(spiel.zustand, zielId);
    if (!ziel?.position) continue;
    trefferwurfMitFolgen(spiel, kontextVervollstaendigen(spiel, {
      quelleId: akteur.id, zielId, ursprung: aufschlag, zielfeld: { x: ziel.position.x, y: ziel.position.y }, tags: [...(schuss.tags || [])],
      ursache: "schuss", mittel: { art: "gegenstand", name: waffe.typ },
    }), { genauigkeit, effekt: schuss.effekt, kritchance, dazu: munition.daten.effekt });
  }
  if (munition.gegenstand) {
    landenOderBrechen(spiel, akteur, munition.gegenstand, bahn, munition.daten.bruchchance ?? bruchchanceVorgabe(spiel));
    laermMachen(spiel, aufschlag, spiel.daten.regeln.wahrnehmung.laermWurf, akteur.id, "aufschlag");
  }
}

anmelden("befehle", "schiessen", {
  pruefen(spiel, akteur, befehl) {
    const waffe = fernwaffeVon(spiel, akteur, befehl.waffeId);
    if (!waffe) return "keine_fernwaffe";
    const grund = munitionsart(waffe).bereit(spiel, akteur, waffe, befehl.munitionId);
    if (grund) return grund;
    const aufloesung = schussbahn(spiel, akteur, waffe, befehl.ziel);
    return aufloesung.ok ? null : aufloesung.grund;
  },
  ausfuehren(spiel, akteur, befehl) {
    const waffe = fernwaffeVon(spiel, akteur, befehl.waffeId);
    const schuss = schussVon(waffe);
    melden(spiel, "geschossen", { wer: bezugAuf(akteur), womit: bezugAuf(waffe) });
    hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: waffe.id, art: "schiessen", kettentiefe: 0 });
    // die Salve hält das Ziel; fällt es, fliegen die übrigen Schüsse auf sein Feld
    const erste = schussbahn(spiel, akteur, waffe, befehl.ziel);
    const zielfeld = befehl.ziel?.id !== undefined ? { ...entitaetMitId(spiel.zustand, befehl.ziel.id).position } : { x: befehl.ziel.x, y: befehl.ziel.y };
    for (let nummer = 0; nummer < (schuss.schuesse ?? 1); nummer++) {
      const zielangabe = befehl.ziel?.id !== undefined && entitaetMitId(spiel.zustand, befehl.ziel.id)?.position ? befehl.ziel : zielfeld;
      const aufloesung = nummer === 0 ? erste : schussbahn(spiel, akteur, waffe, zielangabe);
      if (!aufloesung.ok) break;
      const munition = munitionsart(waffe).entnehmen(spiel, akteur, waffe, befehl.munitionId);
      if (!munition) break;
      einSchuss(spiel, akteur, waffe, munition, aufloesung.bahn);
      if (!entitaetMitId(spiel.zustand, akteur.id)) break;
    }
    const lautstaerke = Math.max(0, modifiziert(spiel, akteur, "laerm", schuss.laerm ?? spiel.daten.regeln.wahrnehmung.laermSchuss, { tags: schuss.tags || [] }));
    if (akteur.position) laermMachen(spiel, akteur.position, lautstaerke, akteur.id, "schuss");
    return { aktion: "schiessen", grundkosten: schuss.kosten };
  },
});

// Was beim Nachladen fehlt, oder null, wenn es geht: { waffe, munition }
function nachladelage(spiel, akteur, befehl) {
  const waffe = fernwaffeVon(spiel, akteur, befehl.waffeId);
  if (!waffe) return { grund: "keine_fernwaffe" };
  const schuss = schussVon(waffe);
  if (!schuss.magazin || schuss.sorte === undefined) return { grund: "nicht_nachladbar" };
  const munition = munitionWaehlen(spiel, akteur, schuss.sorte, befehl.munitionId);
  if (!munition) return { grund: "keine_munition" };
  if (waffe.geladen?.typ === munition.typ && waffe.geladen.anzahl >= schuss.magazin.fasst) return { grund: "schon_geladen" };
  return { waffe, munition };
}

// Nimmt bis zu anzahl Stück eines Typs aus dem Gepäck, das gewählte Stück zuerst; gibt die genommene Zahl zurück
function ausDemGepaeckNehmen(spiel, akteur, gewaehlt, anzahl) {
  const vorrat = [gewaehlt, ...munitionImGepaeck(spiel, akteur, gewaehlt.geschoss.sorte).filter((gegenstand) => gegenstand.typ === gewaehlt.typ && gegenstand.id !== gewaehlt.id)];
  let genommen = 0;
  for (const stapel of vorrat) {
    if (genommen >= anzahl) break;
    const nimm = Math.min(anzahl - genommen, anzahlVon(stapel));
    genommen += nimm;
    if (nimm < anzahlVon(stapel)) stapel.anzahl = anzahlVon(stapel) - nimm;
    else {
      ausDemInventarNehmen(akteur, stapel.id);
      entitaetEntfernen(spiel.zustand, stapel.id);
    }
  }
  return genommen;
}

anmelden("befehle", "nachladen", {
  pruefen(spiel, akteur, befehl) {
    return nachladelage(spiel, akteur, befehl).grund ?? null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const { waffe, munition } = nachladelage(spiel, akteur, befehl);
    const magazin = schussVon(waffe).magazin;
    const typ = munition.typ, gewichtJe = munition.gewicht ?? 0;
    // eine andere Munitionsart kommt zurück ins Gepäck
    if (waffe.geladen && waffe.geladen.typ !== typ) {
      for (let i = 0; i < waffe.geladen.anzahl; i++) insInventar(spiel, akteur, ausDatenErzeugen(spiel, "gegenstaende", waffe.geladen.typ, null));
      delete waffe.geladen;
    }
    const vorher = waffe.geladen?.anzahl ?? 0;
    const genommen = ausDemGepaeckNehmen(spiel, akteur, munition, magazin.fasst - vorher);
    waffe.geladen = { typ, anzahl: vorher + genommen, gewichtJe };
    melden(spiel, "nachgeladen", { wer: bezugAuf(akteur), was: bezugAuf(waffe), anzahl: waffe.geladen.anzahl });
    hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: akteur.id, zielId: akteur.id, gegenstandId: waffe.id, art: "nachladen", kettentiefe: 0 });
    return { aktion: "nachladen", grundkosten: magazin.nachladen };
  },
});

// Für die KI: ein Schuss auf die Beute mit der ersten Fernwaffe, nur wenn die Bahn sie als erstes Wesen trifft; sonst null
export function schussbefehl(spiel, wesen, beute) {
  const waffe = fernwaffeVon(spiel, wesen);
  if (!waffe || !beute?.position) return null;
  const befehl = { art: "schiessen", waffeId: waffe.id, ziel: { id: beute.id } };
  if (holen("befehle", "schiessen").pruefen(spiel, wesen, befehl)) return null;
  return schussbahn(spiel, wesen, waffe, befehl.ziel).bahn.getroffene[0] === beute.id ? befehl : null;
}

// Für die KI: Nachladen, wenn das Magazin der ersten Fernwaffe leer ist und Munition da; sonst null
export function nachladebefehl(spiel, wesen) {
  const waffe = fernwaffeVon(spiel, wesen);
  if (!waffe || magazinStand(spiel, waffe) !== 0) return null;
  const befehl = { art: "nachladen", waffeId: waffe.id };
  return holen("befehle", "nachladen").pruefen(spiel, wesen, befehl) ? null : befehl;
}
