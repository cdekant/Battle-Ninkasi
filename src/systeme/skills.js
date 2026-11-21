// Eigenschaften und Skills (siehe docs/Wesen.md, Skills und Lernen; Spieldesign in docs/Charakter.md).
// Eigenschaften (daten/eigenschaften.js): Grundwerte an Ninkasi als eigenschaften: { koerperlichkeit: 14, ... };
//   vorübergehende Änderungen sind Modifikatoren auf eigenschaft.<name>. Das Lerntempo rechnet mit dem Grundwert,
//   Anforderungen und Bedingungen mit dem wirksamen Wert (eigenschaftWirksam).
// Skills (daten/skills.js):
//   name: { text, set, tier, rang?, primaer, sekundaer, voraussetzungen?, freischaltung?, jeStufe?, abStufe?, lernt?, verwandt? }
//   tier:            1 Grund, 2 Experte, 3 Meister, 4 göttlich; rang ohne Angabe aus regeln.lernen.raengeNachTier
//   voraussetzungen: [{ skill, stufe }] zusätzlich zu denen der Tiers (regeln.lernen.tierVoraussetzungen im selben Set)
//   freischaltung:   true heißt, erst der Baustein skill_freischalten macht den Skill lernbar
//   jeStufe:         Modifikatoren je Stufe, nur plus und prozent; plus wächst mit der Stufe, prozent wird bei
//                    regeln.lernen.verrechnung "multiplizieren" zu einem mal (100 + Prozent x Stufe), sonst prozent
//   abStufe:         { 3: { modifikatoren?, ausloeser? } } gilt ab dieser Stufe unverändert
//   lernt, verwandt: Lernanlässe und Querlernen, siehe systeme/lernen.js
// Lernstand an Ninkasi: skills: { name: { lernpunkte, rest } }, rest in Bruchteilen von regeln.lernen.bezugswert;
//   die Stufe ergibt sich aus den Schwellen (regeln.lernen.stufen x Rang, aufsummiert), Stufen gehen nie verloren.
// Befehl { art: "lernen", skill, ep } verteilt freie EP ohne Zeitkosten (ohneZeit, siehe kern/spiel.js befehlGeben);
//   Ablehnungen: ungueltig, unbekannter_skill, nicht_freigeschaltet, skill_voraussetzung, hoechststufe, zu_wenig_ep.
// Bedingungen: skill_ab { skill, stufe }, eigenschaft_ab { eigenschaft, wert }, eigenschaft_unter { eigenschaft, wert };
//   die beiden letzten lesen den wirksamen Wert samt Modifikatoren (Ausnahme von der Rohwert-Regel, die Datenprüfung
//   verbietet sie an Modifikatoren auf eigenschaft.*).
// Bausteine: eigenschaft_aendern { eigenschaft, wuerfel|menge } (Grundwert, mindestens 1), skill_freischalten { skill }.
// Anforderungen an Ausrüstung: ausruestung.anforderung: { koerperlichkeit: 15 }, wahlweise ausruestung.abzugJePunkt
//   (sonst regeln.lernen.anforderungAbzug); je fehlendem Punkt (wirksamer Wert) gilt der Abzug einmal, für die
//   Trägerin insgesamt (Modifikatorquelle "anforderungen", Quelle anforderung:<id>). Ein Prozentabzug sinkt nicht
//   unter -100. Abzüge auf eigenschaft.* verbietet die Datenprüfung, sonst fragte die Quelle sich selbst ab.

import { anmelden } from "../kern/register.js";
import { modifiziert } from "../kern/werte.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { bausteinAnmelden, mengeBestimmen } from "../kern/bausteine.js";
import { bedingungAnmelden } from "./modifikatoren.js";
import { ausgeruestete } from "./ausruestung.js";

export const HOECHSTE_STUFE = 5;
export const ANZAHL_TIERS = 4;

const lernregeln = (spiel) => spiel.daten.regeln.lernen;

export function skillVon(spiel, name) {
  return spiel.daten.skills?.[name] ?? null;
}

// Eigenschaften

export function eigenschaftGrundwert(wesen, name) {
  return wesen.eigenschaften?.[name] ?? 0;
}

export function eigenschaftWirksam(spiel, wesen, name) {
  return modifiziert(spiel, wesen, `eigenschaft.${name}`, eigenschaftGrundwert(wesen, name));
}

// Summe der fehlenden Punkte einer Anforderung { name: wert }, mit wirksamen Werten
export function fehlendePunkte(spiel, wesen, anforderung = {}) {
  let summe = 0;
  for (const [name, wert] of Object.entries(anforderung)) summe += Math.max(0, wert - eigenschaftWirksam(spiel, wesen, name));
  return summe;
}

// Prüft eine Verteilung bei der Erstellung; null oder der Grund als Text
export function eigenschaftenPruefen(daten, eigenschaften) {
  const { eigenschaftStart: start, eigenschaftPunkte: punkte, eigenschaftHoechstens: hoechstens } = daten.regeln.lernen;
  const namen = Object.keys(daten.eigenschaften || {});
  if (!eigenschaften || typeof eigenschaften !== "object" || Array.isArray(eigenschaften)) return "eigenschaften muss ein Objekt { name: wert } sein";
  const fremde = Object.keys(eigenschaften).filter((name) => !namen.includes(name));
  if (fremde.length) return `unbekannte Eigenschaft ${fremde.join(", ")}`;
  let summe = 0;
  for (const name of namen) {
    const wert = eigenschaften[name];
    if (!Number.isInteger(wert) || wert < start || wert > hoechstens) return `${name} muss eine ganze Zahl von ${start} bis ${hoechstens} sein`;
    summe += wert;
  }
  const erwartet = start * namen.length + punkte;
  return summe === erwartet ? null : `die Summe ist ${summe} statt ${erwartet}`;
}

// Stufen

export function rangVon(spiel, definition) {
  return definition.rang ?? lernregeln(spiel).raengeNachTier[definition.tier - 1];
}

// Lernpunkte, ab denen die Stufen 1 bis 5 erreicht sind
export function schwellenVon(spiel, definition) {
  const rang = rangVon(spiel, definition);
  let summe = 0;
  return lernregeln(spiel).stufen.map((kosten) => (summe += kosten * rang));
}

export function lernstandVon(wesen, name) {
  return wesen.skills?.[name] ?? { lernpunkte: 0, rest: 0 };
}

export function stufeVon(spiel, wesen, name) {
  const definition = skillVon(spiel, name);
  if (!definition || !wesen.skills?.[name]) return 0;
  const { lernpunkte } = wesen.skills[name];
  return schwellenVon(spiel, definition).filter((schwelle) => lernpunkte >= schwelle).length;
}

// Voraussetzungen der Tiers (aus set und tier) und die eigenen, je Datensatz einmal berechnet
const VORAUSSETZUNGEN = new WeakMap();

function alleVoraussetzungen(spiel) {
  const daten = spiel.daten;
  if (VORAUSSETZUNGEN.has(daten)) return VORAUSSETZUNGEN.get(daten);
  const skills = daten.skills || {};
  const tiersJeSet = {};
  for (const [name, definition] of Object.entries(skills)) (tiersJeSet[definition.set] ??= {})[definition.tier] = name;
  const ergebnis = {};
  for (const [name, definition] of Object.entries(skills)) {
    const stufenDerTiers = daten.regeln.lernen.tierVoraussetzungen[definition.tier - 1] || [];
    const ausTiers = stufenDerTiers
      .map((stufe, nummer) => ({ skill: tiersJeSet[definition.set][nummer + 1], stufe }))
      .filter((voraussetzung) => voraussetzung.skill !== undefined);
    ergebnis[name] = [...ausTiers, ...(definition.voraussetzungen || [])];
  }
  VORAUSSETZUNGEN.set(daten, ergebnis);
  return ergebnis;
}

export function voraussetzungenVon(spiel, name) {
  return alleVoraussetzungen(spiel)[name] || [];
}

// Ob ein Skill jetzt EP aufnimmt: null oder der Grund (auch die Ablehnung des Befehls lernen)
export function skillGesperrt(spiel, wesen, name) {
  const definition = skillVon(spiel, name);
  if (!definition) return "unbekannter_skill";
  if (definition.freischaltung && !(wesen.freigeschaltet || []).includes(name)) return "nicht_freigeschaltet";
  if (voraussetzungenVon(spiel, name).some(({ skill, stufe }) => stufeVon(spiel, wesen, skill) < stufe)) return "skill_voraussetzung";
  if (stufeVon(spiel, wesen, name) >= HOECHSTE_STUFE) return "hoechststufe";
  return null;
}

// 2 x primär + sekundär mit den Grundwerten
function lernfaktor(wesen, definition) {
  return 2 * eigenschaftGrundwert(wesen, definition.primaer) + eigenschaftGrundwert(wesen, definition.sekundaer);
}

// Lerntempo in Prozent: 100 bei der durchschnittlichen Ninkasi (2 x primär + sekundär = bezugswert)
export function lerntempoProzent(spiel, wesen, definition) {
  return Math.round((lernfaktor(wesen, definition) * 100) / lernregeln(spiel).bezugswert);
}

// EP, die ein Skill bis zu einer Stufe (1 bis 5) noch aufnimmt (aufgerundet); 0, wenn sie erreicht ist
export function epBisStufe(spiel, wesen, name, stufe) {
  const definition = skillVon(spiel, name);
  const faktor = lernfaktor(wesen, definition);
  const { lernpunkte, rest } = lernstandVon(wesen, name);
  const offen = schwellenVon(spiel, definition)[Math.min(stufe, HOECHSTE_STUFE) - 1] - lernpunkte;
  if (offen <= 0) return 0;
  if (faktor <= 0) return Infinity;
  return Math.max(0, Math.ceil((offen * lernregeln(spiel).bezugswert - rest) / faktor));
}

// EP, die ein Skill bis zur höchsten Stufe noch aufnimmt (aufgerundet)
export function epBisHoechststufe(spiel, wesen, name) {
  return epBisStufe(spiel, wesen, name, HOECHSTE_STUFE);
}

// Lernstand nach ep EP, ohne etwas zu ändern: { aufgenommen, lernpunkte, rest, stufe }; die Rechnung von epAufSkill
function lernstandNach(spiel, wesen, name, ep) {
  const definition = skillVon(spiel, name);
  const faktor = lernfaktor(wesen, definition);
  const stand = lernstandVon(wesen, name);
  const aufgenommen = faktor > 0 ? Math.max(0, Math.min(ep, epBisHoechststufe(spiel, wesen, name))) : 0;
  const bezugswert = lernregeln(spiel).bezugswert;
  const zaehler = aufgenommen * faktor + stand.rest;
  let lernpunkte = stand.lernpunkte + Math.floor(zaehler / bezugswert);
  let rest = zaehler % bezugswert;
  const hoechst = schwellenVon(spiel, definition)[HOECHSTE_STUFE - 1];
  if (lernpunkte >= hoechst) {
    lernpunkte = hoechst;
    rest = 0;
  }
  const stufe = schwellenVon(spiel, definition).filter((schwelle) => lernpunkte >= schwelle).length;
  return { aufgenommen, lernpunkte, rest, stufe };
}

// Vorschau des Befehls lernen (Skillfenster): { ok, grund?, ep, stufe, freieEpDanach }; ändert nichts
export function lernvorschau(spiel, wesen, name, ep) {
  const grund = skillGesperrt(spiel, wesen, name) ?? (!(ep > 0) ? "ungueltig" : (wesen.freieEp ?? 0) < ep ? "zu_wenig_ep" : null);
  if (grund) return { ok: false, grund, ep: 0, stufe: stufeVon(spiel, wesen, name), freieEpDanach: wesen.freieEp ?? 0 };
  const nachher = lernstandNach(spiel, wesen, name, ep);
  return { ok: true, ep: nachher.aufgenommen, stufe: nachher.stufe, freieEpDanach: wesen.freieEp - nachher.aufgenommen };
}

// Skills, die diesen voraussetzen (umgekehrte Voraussetzungen), in der Reihenfolge der Daten
export function ermoeglicht(spiel, name) {
  return Object.keys(spiel.daten.skills || {}).filter((anderer) => voraussetzungenVon(spiel, anderer).some(({ skill }) => skill === name));
}

// Übersicht für das Skillfenster: alle Skills, die Ninkasi sehen darf, nach Set (Reihenfolge des ersten Auftretens)
// und Tier; Skills mit freischaltung erscheinen erst, wenn sie freigeschaltet sind.
// Je Eintrag: { name, definition, set, tier, stufe, gesperrt (Grund oder null), voraussetzungen: [{ skill, stufe, erfuellt }],
//   epBisNaechste (0 bei Stufe 5), epBisHoechste, lerntempo }
export function skillUebersicht(spiel, wesen) {
  const skills = spiel.daten.skills || {};
  const setReihenfolge = [];
  for (const definition of Object.values(skills)) if (!setReihenfolge.includes(definition.set)) setReihenfolge.push(definition.set);
  return Object.entries(skills)
    .filter(([name, definition]) => !definition.freischaltung || (wesen.freigeschaltet || []).includes(name))
    .map(([name, definition]) => {
      const stufe = stufeVon(spiel, wesen, name);
      return {
        name, definition, set: definition.set, tier: definition.tier, stufe,
        gesperrt: skillGesperrt(spiel, wesen, name),
        voraussetzungen: voraussetzungenVon(spiel, name).map((voraussetzung) => ({ ...voraussetzung, erfuellt: stufeVon(spiel, wesen, voraussetzung.skill) >= voraussetzung.stufe })),
        epBisNaechste: stufe >= HOECHSTE_STUFE ? 0 : epBisStufe(spiel, wesen, name, stufe + 1),
        epBisHoechste: epBisHoechststufe(spiel, wesen, name),
        lerntempo: lerntempoProzent(spiel, wesen, definition),
      };
    })
    .sort((links, rechts) => setReihenfolge.indexOf(links.set) - setReihenfolge.indexOf(rechts.set) || links.tier - rechts.tier);
}

// Rechnet EP mit den Grundwerten in diesem Moment in Lernpunkte um und schreibt sie gut; Bruchteile bleiben im rest.
// Gibt die EP zurück, die der Skill nicht aufnimmt (gesperrt oder über der höchsten Stufe).
// Meldung "skillstufe" für jede neu erreichte Stufe.
export function epAufSkill(spiel, wesen, name, ep) {
  if (ep <= 0) return 0;
  if (skillGesperrt(spiel, wesen, name)) return ep;
  const definition = skillVon(spiel, name);
  if (lernfaktor(wesen, definition) <= 0) return ep;
  const stufeVorher = stufeVon(spiel, wesen, name);
  const { aufgenommen, lernpunkte, rest } = lernstandNach(spiel, wesen, name, ep);
  if (!wesen.skills) wesen.skills = {};
  wesen.skills[name] = { lernpunkte, rest };
  const stufeNachher = stufeVon(spiel, wesen, name);
  for (let stufe = stufeVorher + 1; stufe <= stufeNachher; stufe++) melden(spiel, "skillstufe", { wer: bezugAuf(wesen), skill: name, text: definition.text, stufe });
  return ep - aufgenommen;
}

// Erreichte Einträge aus abStufe: [{ ab, eintrag }] in aufsteigender Stufe
function erreichteAbStufe(definition, stufe) {
  return Object.entries(definition.abStufe || {})
    .map(([ab, eintrag]) => ({ ab: Number(ab), eintrag }))
    .filter(({ ab }) => stufe >= ab)
    .sort((links, rechts) => links.ab - rechts.ab);
}

// Gelernte Skills mit Stufe > 0, in der Reihenfolge des Lernstands
function wirksameSkills(spiel, wesen) {
  const ergebnis = [];
  for (const name of Object.keys(wesen.skills || {})) {
    const definition = skillVon(spiel, name);
    const stufe = definition ? stufeVon(spiel, wesen, name) : 0;
    if (stufe > 0) ergebnis.push({ name, definition, stufe });
  }
  return ergebnis;
}

// Modifikatorquelle "skills" (Quelle skill:<name>)
anmelden("modifikatorquellen", "skills", (spiel, wesen) => {
  if (!wesen.skills) return [];
  const multiplizieren = lernregeln(spiel).verrechnung === "multiplizieren";
  const ergebnis = [];
  for (const { name, definition, stufe } of wirksameSkills(spiel, wesen)) {
    const quelle = `skill:${name}`;
    for (const modifikator of definition.jeStufe || []) {
      const betrag = modifikator.betrag * stufe;
      if (modifikator.art === "prozent" && multiplizieren) ergebnis.push({ ...modifikator, art: "mal", betrag: Math.max(0, 100 + betrag), quelle });
      else ergebnis.push({ ...modifikator, betrag, quelle });
    }
    for (const { eintrag } of erreichteAbStufe(definition, stufe)) {
      for (const modifikator of eintrag.modifikatoren || []) ergebnis.push({ ...modifikator, quelle });
    }
  }
  return ergebnis;
});

// Modifikatorquelle "anforderungen": Abzüge für angelegte Gegenstände, deren Anforderung die Trägerin nicht erfüllt.
// Während sie die Eigenschaften liest, liefert sie selbst nichts (ihre Abzüge treffen nie eigenschaft.*).
let anforderungenWerdenGelesen = false;

anmelden("modifikatorquellen", "anforderungen", (spiel, wesen) => {
  if (anforderungenWerdenGelesen || !wesen.ausgeruestet?.length) return [];
  const ergebnis = [];
  anforderungenWerdenGelesen = true;
  try {
    for (const gegenstand of ausgeruestete(spiel, wesen)) {
      const anforderung = gegenstand.ausruestung?.anforderung;
      if (!anforderung) continue;
      const fehlend = fehlendePunkte(spiel, wesen, anforderung);
      if (fehlend === 0) continue;
      for (const modifikator of gegenstand.ausruestung.abzugJePunkt ?? lernregeln(spiel).anforderungAbzug) {
        const betrag = modifikator.art === "prozent" ? Math.max(-100, modifikator.betrag * fehlend) : modifikator.betrag * fehlend;
        ergebnis.push({ ...modifikator, betrag, quelle: `anforderung:${gegenstand.id}` });
      }
    }
  } finally {
    anforderungenWerdenGelesen = false;
  }
  return ergebnis;
});

// Auslöser der Skills, in der Kaskade nach denen der Ausrüstung (kern/ausloeser.js)
anmelden("ausloeserquellen", "skills", (spiel, wesen) => {
  if (!wesen.skills) return [];
  const ergebnis = [];
  for (const { name, definition, stufe } of wirksameSkills(spiel, wesen)) {
    for (const { ab, eintrag } of erreichteAbStufe(definition, stufe)) {
      (eintrag.ausloeser || []).forEach((ausloeser, nummer) => ergebnis.push({ ausloeser, schluessel: `${wesen.id}:s${name}:${ab}:${nummer}` }));
    }
  }
  return ergebnis;
});

bedingungAnmelden("skill_ab", { skill: "skill", stufe: "ganzzahl" }, (spiel, entitaet, { skill, stufe }) => stufeVon(spiel, entitaet, skill) >= stufe);

bedingungAnmelden("eigenschaft_ab", { eigenschaft: "eigenschaft", wert: "ganzzahl" }, (spiel, entitaet, { eigenschaft, wert }) => eigenschaftWirksam(spiel, entitaet, eigenschaft) >= wert);

bedingungAnmelden("eigenschaft_unter", { eigenschaft: "eigenschaft", wert: "ganzzahl" }, (spiel, entitaet, { eigenschaft, wert }) => eigenschaftWirksam(spiel, entitaet, eigenschaft) < wert);

// Freie EP verteilen, ohne Spielzeit; mehr EP als bis Stufe 5 nötig werden nicht abgebucht
anmelden("befehle", "lernen", {
  ohneZeit: true,
  pruefen(spiel, akteur, befehl) {
    if (typeof befehl.skill !== "string" || !Number.isInteger(befehl.ep) || befehl.ep <= 0 || akteur.freieEp === undefined) return "ungueltig";
    const grund = skillGesperrt(spiel, akteur, befehl.skill);
    if (grund) return grund;
    return akteur.freieEp < befehl.ep ? "zu_wenig_ep" : null;
  },
  ausfuehren(spiel, akteur, befehl) {
    const abgebucht = Math.min(befehl.ep, epBisHoechststufe(spiel, akteur, befehl.skill));
    akteur.freieEp -= abgebucht;
    epAufSkill(spiel, akteur, befehl.skill, abgebucht);
    melden(spiel, "gelernt", { wer: bezugAuf(akteur), skill: befehl.skill, text: skillVon(spiel, befehl.skill).text, ep: abgebucht });
  },
});

// Dauerhafte Änderung eines Grundwerts (seltenes Bier, Gabe einer Nebengottheit); nur an Wesen mit Eigenschaften
bausteinAnmelden("eigenschaft_aendern", { eigenschaft: "eigenschaft", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel.eigenschaften) return;
  const vorher = eigenschaftGrundwert(ziel, parameter.eigenschaft);
  ziel.eigenschaften[parameter.eigenschaft] = Math.max(1, vorher + mengeBestimmen(spiel, kontext, parameter));
  const menge = ziel.eigenschaften[parameter.eigenschaft] - vorher;
  if (menge !== 0) melden(spiel, "eigenschaft_geaendert", { wer: bezugAuf(ziel), eigenschaft: parameter.eigenschaft, menge });
}, { brauchtZiel: true });

// Macht einen Skill mit freischaltung lernbar (Braubücher, Rezepturen); nur an Wesen, die lernen
bausteinAnmelden("skill_freischalten", { skill: "skill" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!ziel.skills) return;
  if (!ziel.freigeschaltet) ziel.freigeschaltet = [];
  if (ziel.freigeschaltet.includes(parameter.skill)) return;
  ziel.freigeschaltet.push(parameter.skill);
  melden(spiel, "skill_freigeschaltet", { wer: bezugAuf(ziel), skill: parameter.skill, text: skillVon(spiel, parameter.skill).text });
}, { brauchtZiel: true });
