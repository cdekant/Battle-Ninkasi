// Ausrüstung (siehe docs/Gegenstaende.md, Ausrüstung): Plätze, anlegen und ablegen, Modifikatoren, Waffen, Sets.
// Plätze am Wesen: plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 } (Namen aus
//   regeln.ausruestung.plaetze); angelegt ist, was in ausgeruestet: [IDs] steht, der Gegenstand bleibt im Inventar.
// Gegenstand: ausruestung: { platz, belegt?, angriffe?, modifikatoren?, ausloeser? }, dazu tags am Gegenstand für Sets
//   belegt:        so viele Stellen des Platzes (Vorgabe 1), ein Zweihänder belegt beide Hände
//   angriffe:      Angriffsprofile; angelegte Waffen ersetzen die eigenen Profile des Wesens (die Faust), zwei Waffen
//                  sind zwei Profile (die Aktion kostet so viel wie das langsamste, systeme/kampf.js angriffeVon)
//   modifikatoren: wirken, solange der Gegenstand angelegt ist (Modifikatorquelle "ausruestung", Quelle
//                  "ausruestung:<id>"), z.B. Rüstung, Abzug aufs Ausweichen, Set-Boni mit wenn traegt_tag
//   ausloeser:     gelten für die Trägerin, nach ihren eigenen und denen ihrer Zustände (kern/ausloeser.js)
// Befehle: { art: "anlegen", gegenstandId } legt an; ist der Platz voll, legt derselbe Befehl die ältesten Gegenstände
//   dort ab, bis genug frei ist (tauschen), und kostet beides (aktionen.anlegen plus je aktionen.ablegen);
//   { art: "ablegen", gegenstandId }. Ablehnungen: nicht_im_gepaeck, nicht_anlegbar, schon_angelegt, kein_platz,
//   nicht_angelegt, verflucht. Haken gegenstand_benutzt mit art "anlegen" bzw. "ablegen".
// Fluch: verflucht: true am Gegenstand; angelegt lässt er sich weder ablegen noch fallen lassen, werfen oder beim
//   Anlegen wegtauschen (Ablehnung verflucht); bekannt wird der Fluch erst beim Anlegen (fluchBekannt, Meldung
//   fluch_entdeckt). Baustein fluch_aufheben nimmt die Flüche der angelegten Gegenstände des Ziels.
// Haltbarkeit (systeme/verschleiss.js): ein angefressener Gegenstand wirkt schwächer, seine Vorteile sinken im
//   Verhältnis der Haltbarkeit (haltbarkeitProzent), Nachteile bleiben voll.

import { anmelden } from "../kern/register.js";
import { melden, bezugAuf, hakenAusloesen } from "../kern/ereignisse.js";
import { entitaetMitId, plaetzeVon } from "../kern/zustand.js";
import { modifikatorSkaliert } from "../kern/werte.js";
import { bausteinAnmelden } from "../kern/bausteine.js";

export function ausgeruestete(spiel, wesen) {
  return (wesen.ausgeruestet || []).map((id) => entitaetMitId(spiel.zustand, id)).filter(Boolean);
}

export function istAngelegt(wesen, gegenstandId) {
  return (wesen.ausgeruestet || []).includes(gegenstandId);
}

const belegtVon = (gegenstand) => gegenstand.ausruestung.belegt ?? 1;

// Ob ein Fluch das Wesen hindert, den Gegenstand loszuwerden (nur angelegt wirkt er)
export function fluchHindert(spiel, wesen, gegenstandId) {
  return istAngelegt(wesen, gegenstandId) && Boolean(entitaetMitId(spiel.zustand, gegenstandId)?.verflucht);
}

// Haltbarkeit in Prozent des Höchstwerts, abgerundet; ohne Haltbarkeit 100
export function haltbarkeitProzent(gegenstand) {
  const haltbarkeit = gegenstand.haltbarkeit;
  if (!haltbarkeit) return 100;
  return Math.floor(((haltbarkeit.aktuell ?? haltbarkeit.hoechstens) * 100) / haltbarkeit.hoechstens);
}

// Vorteil heißt: plus und prozent über 0, mal über 100; nur Vorteile sinken mit der Haltbarkeit
const istVorteil = ({ art, betrag }) => ((art === "plus" || art === "prozent") && betrag > 0) || (art === "mal" && betrag > 100);

// Angelegte Gegenstände auf einem Platz, in der Reihenfolge des Anlegens (älteste zuerst)
function aufDemPlatz(spiel, wesen, platz) {
  return ausgeruestete(spiel, wesen).filter((gegenstand) => gegenstand.ausruestung.platz === platz);
}

// Was abgelegt werden muss, damit der Gegenstand passt (älteste zuerst), oder null, wenn er nie passt
export function zuTauschen(spiel, wesen, gegenstand) {
  const { platz } = gegenstand.ausruestung;
  const stellen = plaetzeVon(wesen)[platz] ?? 0;
  if (belegtVon(gegenstand) > stellen) return null;
  const dort = aufDemPlatz(spiel, wesen, platz);
  let frei = stellen - dort.reduce((summe, angelegt) => summe + belegtVon(angelegt), 0);
  const weg = [];
  for (const angelegt of dort) {
    if (frei >= belegtVon(gegenstand)) break;
    weg.push(angelegt);
    frei += belegtVon(angelegt);
  }
  return weg;
}

function benutztMelden(spiel, wesen, gegenstand, art) {
  hakenAusloesen(spiel, "gegenstand_benutzt", { quelleId: wesen.id, zielId: wesen.id, gegenstandId: gegenstand.id, art, kettentiefe: 0 });
}

function abnehmen(spiel, wesen, gegenstand) {
  wesen.ausgeruestet = wesen.ausgeruestet.filter((id) => id !== gegenstand.id);
  melden(spiel, "abgelegt", { wer: bezugAuf(wesen), was: bezugAuf(gegenstand) });
  benutztMelden(spiel, wesen, gegenstand, "ablegen");
}

anmelden("befehle", "anlegen", {
  pruefen(spiel, akteur, befehl) {
    if (!(akteur.inventar || []).includes(befehl.gegenstandId)) return "nicht_im_gepaeck";
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    if (!gegenstand?.ausruestung) return "nicht_anlegbar";
    if (istAngelegt(akteur, gegenstand.id)) return "schon_angelegt";
    const weg = zuTauschen(spiel, akteur, gegenstand);
    if (!weg) return "kein_platz";
    return weg.some((angelegt) => angelegt.verflucht) ? "verflucht" : null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const gegenstand = entitaetMitId(spiel.zustand, befehl.gegenstandId);
    const weg = zuTauschen(spiel, akteur, gegenstand);
    for (const angelegt of weg) abnehmen(spiel, akteur, angelegt);
    if (!akteur.ausgeruestet) akteur.ausgeruestet = [];
    akteur.ausgeruestet.push(gegenstand.id);
    melden(spiel, "angelegt", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    // ein Fluch zeigt sich erst, wenn es zu spät ist (Vorbild NetHack)
    if (gegenstand.verflucht && !gegenstand.fluchBekannt) {
      gegenstand.fluchBekannt = true;
      melden(spiel, "fluch_entdeckt", { wer: bezugAuf(akteur), was: bezugAuf(gegenstand) });
    }
    benutztMelden(spiel, akteur, gegenstand, "anlegen");
    const aktionen = spiel.daten.aktionen;
    return { aktion: "anlegen", grundkosten: aktionen.anlegen + weg.length * aktionen.ablegen };
  },
});

anmelden("befehle", "ablegen", {
  pruefen(spiel, akteur, befehl) {
    if (!istAngelegt(akteur, befehl.gegenstandId)) return "nicht_angelegt";
    return fluchHindert(spiel, akteur, befehl.gegenstandId) ? "verflucht" : null;
  },
  ausfuehren(spiel, akteur, befehl) {
    abnehmen(spiel, akteur, entitaetMitId(spiel.zustand, befehl.gegenstandId));
    return "ablegen";
  },
});

// Modifikatoren der angelegten Gegenstände; angefressene geben weniger Vorteil (Skalierung wie bei den Zuständen)
anmelden("modifikatorquellen", "ausruestung", (spiel, wesen) => {
  if (!wesen.ausgeruestet?.length) return [];
  const ergebnis = [];
  for (const gegenstand of ausgeruestete(spiel, wesen)) {
    const prozent = haltbarkeitProzent(gegenstand);
    for (const modifikator of gegenstand.ausruestung.modifikatoren || []) {
      const wirksam = prozent < 100 && istVorteil(modifikator) ? modifikatorSkaliert(modifikator, prozent) : modifikator;
      ergebnis.push({ ...wirksam, quelle: `ausruestung:${gegenstand.id}` });
    }
  }
  return ergebnis;
});

// Nimmt die Flüche aller angelegten Gegenstände des Ziels (Weihwasser, Segen einer Nebengottheit); Meldung fluch_aufgehoben
bausteinAnmelden("fluch_aufheben", {}, (spiel, kontext) => {
  const ziel = entitaetMitId(spiel.zustand, kontext.zielId);
  if (!ziel) return;
  for (const gegenstand of ausgeruestete(spiel, ziel)) {
    if (!gegenstand.verflucht) continue;
    delete gegenstand.verflucht;
    delete gegenstand.fluchBekannt;
    melden(spiel, "fluch_aufgehoben", { wer: bezugAuf(ziel), was: bezugAuf(gegenstand) });
  }
}, { brauchtZiel: true });

// Die Angriffsprofile angelegter Waffen in der Reihenfolge des Anlegens oder null ohne Waffe
export function waffenprofile(spiel, wesen) {
  if (!wesen.ausgeruestet?.length) return null;
  const profile = ausgeruestete(spiel, wesen).flatMap((gegenstand) => gegenstand.ausruestung.angriffe || []);
  return profile.length ? profile : null;
}
