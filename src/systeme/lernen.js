// Erfahrungspunkte (siehe docs/Wesen.md, Skills und Lernen; Spieldesign in docs/Charakter.md).
// Ninkasi lernt, sobald lernenEinrichten ihr skills, freieEp und freigeschaltet gegeben hat (kern/spiel.js neuesSpiel);
//   ohne diese Komponenten (z.B. in Unittests mit eigener Ninkasi) bleibt alles hier still.
// Freie EP: Startguthaben regeln.lernen.startEp, dazu epJeFeld je Feld, das zum ersten Mal gesehen wird (systeme/sicht.js);
//   verteilt werden sie mit dem Befehl lernen (systeme/skills.js).
// Gebundene EP: nur Wesen mit ep in den Daten bringen sie, und nur, wenn Ninkasi an ihnen etwas gelernt hat.
//   Beitragsbuch am Wesen: beitraege: [{ anlass, tags }], je Anlass und Tags ein Eintrag (Gewichtung "erste").
//   Lernanlässe (Register "lernanlaesse"):
//     wirkung           Ninkasi ist Urheberin eines Treffers, eines Schadens oder eines Zustands am Wesen; Tags des
//                       Angriffs, der Fähigkeit und des Effekts, dazu die Schadensart bzw. die Tags des Zustands und
//                       "beschworen", wenn eine Beschworene Ninkasis gewirkt hat
//     ausgewichen, geblockt  das Wesen verfehlt Ninkasi
//     ruestung          Ninkasis Rüstung fängt Schaden des Wesens ab; Tags des Angriffs, die Schadensart und die Tags
//                       der angelegten Stücke, die Rüstung geben (z.B. ruestung_leicht, ruestung_schwer)
//     schaden_erlitten  das Wesen fügt Ninkasi Schaden zu
//   Beim Tod (Haken nach_tod) teilen sich die EP zu gleichen Teilen auf die Bucheinträge, je Eintrag zu gleichen Teilen
//   auf die Skills, deren lernt passt (gleicher Anlass, ihre Tags sind im Eintrag); verwandt gibt zusätzlich Anteile an
//   verwandte Skills; Rundungsreste, Einträge ohne passenden Skill und was ein Skill nicht aufnimmt, werden freie EP.
//   Meldung "ep_erhalten" { wer, opfer, ep, skills: [{ skill, ep }], frei }.
// Topf je Abstammungslinie: beschwoeren mit abstammung (systeme/beschwoerung.js) gibt dem neuen Wesen die topfId der
//   Quelle; die Quelle eröffnet ihn mit ep x regeln.lernen.topfFaktor (zustand.toepfe: { topfId: rest }). Wer zu einem
//   Topf gehört, bringt höchstens, was noch darin ist.

import { anmelden } from "../kern/register.js";
import { spielerin } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { RANG_RUESTUNG } from "../kern/hakenkatalog.js";
import { eigenschaftenPruefen, epAufSkill } from "./skills.js";
import { ausgeruestete } from "./ausruestung.js";

const lernregeln = (spiel) => spiel.daten.regeln.lernen;

export const LERNANLAESSE = ["wirkung", "ausgewichen", "geblockt", "ruestung", "schaden_erlitten"];
for (const name of LERNANLAESSE) anmelden("lernanlaesse", name, {});

// Gibt Ninkasi, was sie zum Lernen braucht; eigenschaften (freiwillig) ersetzt die Vorgabe aus den Daten
export function lernenEinrichten(spiel, ninkasi, eigenschaften) {
  if (eigenschaften !== undefined) {
    const grund = eigenschaftenPruefen(spiel.daten, eigenschaften);
    if (grund) throw new Error(`Eigenschaften ungültig: ${grund}`);
    ninkasi.eigenschaften = { ...eigenschaften };
  }
  ninkasi.skills = {};
  ninkasi.freieEp = lernregeln(spiel).startEp;
  ninkasi.freigeschaltet = [];
}

// Die lernende Ninkasi oder null
function lernende(spiel) {
  const ninkasi = spielerin(spiel.zustand);
  return ninkasi && ninkasi.freieEp !== undefined ? ninkasi : null;
}

// Freie EP für zum ersten Mal gesehene Felder (systeme/sicht.js)
export function epFuerErkundung(spiel, anzahlFelder) {
  const ninkasi = lernende(spiel);
  if (ninkasi && anzahlFelder > 0) ninkasi.freieEp += anzahlFelder * lernregeln(spiel).epJeFeld;
}

const gleicheListe = (links, rechts) => links.length === rechts.length && links.every((eintrag, nummer) => eintrag === rechts[nummer]);

// Trägt einen Lernanlass ins Buch eines Wesens ein, je Anlass und Tags einmal (Gewichtung "erste")
export function beitragEintragen(spiel, wesenId, anlass, tags = []) {
  const zustand = spiel.zustand;
  if (wesenId == null || wesenId === zustand.spielerinId || !lernende(spiel)) return;
  const wesen = zustand.entitaeten[wesenId];
  if (!wesen) return;
  const sortiert = [...new Set(tags.filter(Boolean))].sort();
  if (!wesen.beitraege) wesen.beitraege = [];
  if (wesen.beitraege.some((eintrag) => eintrag.anlass === anlass && gleicheListe(eintrag.tags, sortiert))) return;
  wesen.beitraege.push({ anlass, tags: sortiert });
}

// Tags einer Wirkung Ninkasis; "beschworen", wenn eine Beschworene unmittelbar gewirkt hat
function tagsDerWirkung(spiel, kontext, ...weitere) {
  const quelle = spiel.zustand.entitaeten[kontext.quelleId];
  const beschworen = quelle && quelle.id !== spiel.zustand.spielerinId && quelle.beschworenVon != null ? "beschworen" : null;
  return [...(kontext.tags || []), ...weitere, beschworen];
}

anmelden("haken", "nach_treffer", (spiel, kontext) => {
  if (kontext.urheberId === spiel.zustand.spielerinId) beitragEintragen(spiel, kontext.zielId, "wirkung", tagsDerWirkung(spiel, kontext));
});

anmelden("haken", "nach_schaden", (spiel, kontext) => {
  const spielerinId = spiel.zustand.spielerinId;
  if (kontext.urheberId === spielerinId) beitragEintragen(spiel, kontext.zielId, "wirkung", tagsDerWirkung(spiel, kontext, kontext.schadensart));
  else if (kontext.zielId === spielerinId) beitragEintragen(spiel, kontext.urheberId, "schaden_erlitten", [...(kontext.tags || []), kontext.schadensart]);
});

anmelden("haken", "zustand_beginnt", (spiel, kontext) => {
  if (kontext.urheberId !== spiel.zustand.spielerinId) return;
  beitragEintragen(spiel, kontext.zielId, "wirkung", spiel.daten.zustaende?.[kontext.zustand]?.tags || []);
});

anmelden("haken", "verfehlt", (spiel, kontext) => {
  if (kontext.zielId !== spiel.zustand.spielerinId || !LERNANLAESSE.includes(kontext.grund)) return;
  beitragEintragen(spiel, kontext.urheberId, kontext.grund, kontext.tags || []);
});

// Tags der angelegten Stücke mit einem Modifikator auf ruestung oder ruestung.<art>, damit Skills nach der Art der
// Rüstung lernen; Stücke ohne Rüstung (Ring, Waffe) bleiben außen vor
const gibtRuestung = (gegenstand) => (gegenstand.ausruestung.modifikatoren || []).some(({ ziel }) => ziel === "ruestung" || ziel?.startsWith?.("ruestung."));
const tagsDerRuestung = (spiel, wesen) => ausgeruestete(spiel, wesen).filter(gibtRuestung).flatMap((gegenstand) => gegenstand.tags || []);

// Nach der Rüstung (systeme/kampf.js), damit ruestungAbzug feststeht
anmelden("haken", "vor_schaden", (spiel, kontext) => {
  if (kontext.zielId !== spiel.zustand.spielerinId || !((kontext.ruestungAbzug ?? 0) > 0)) return;
  const ninkasi = spiel.zustand.entitaeten[kontext.zielId];
  beitragEintragen(spiel, kontext.urheberId, "ruestung", [...(kontext.tags || []), kontext.schadensart, ...tagsDerRuestung(spiel, ninkasi)]);
}, { rang: RANG_RUESTUNG + 1 });

// Topf der Abstammungslinie eines Wesens; eröffnet ihn, wenn es noch keinen hat
export function topfVon(spiel, wesen) {
  if (wesen.topfId != null) return wesen.topfId;
  const zustand = spiel.zustand;
  if (!zustand.toepfe) zustand.toepfe = {};
  zustand.toepfe[wesen.id] = (wesen.ep ?? 0) * lernregeln(spiel).topfFaktor;
  wesen.topfId = wesen.id;
  return wesen.id;
}

// EP, die ein Wesen jetzt bringt, und Abbuchung aus seinem Topf
function epDesOpfers(spiel, opfer) {
  const ep = opfer.ep ?? 0;
  if (opfer.topfId == null) return ep;
  const toepfe = spiel.zustand.toepfe || {};
  const gebracht = Math.min(ep, toepfe[opfer.topfId] ?? 0);
  toepfe[opfer.topfId] = (toepfe[opfer.topfId] ?? 0) - gebracht;
  return gebracht;
}

const passtZu = (definition, eintrag) => (definition.lernt || []).some((lernt) => lernt.anlass === eintrag.anlass && (lernt.tags || []).every((tag) => eintrag.tags.includes(tag)));

// Teilt EP nach dem Beitragsbuch auf; gibt { zuteilung: { skill: ep }, frei } zurück
export function epAufteilen(spiel, beitraege, ep) {
  const skills = Object.entries(spiel.daten.skills || {});
  const zuteilung = {};
  const jeEintrag = Math.floor(ep / beitraege.length);
  let frei = ep - jeEintrag * beitraege.length;
  for (const eintrag of beitraege) {
    const passende = skills.filter(([, definition]) => passtZu(definition, eintrag)).map(([name]) => name);
    if (passende.length === 0) {
      frei += jeEintrag;
      continue;
    }
    const jeSkill = Math.floor(jeEintrag / passende.length);
    frei += jeEintrag - jeSkill * passende.length;
    for (const name of passende) zuteilung[name] = (zuteilung[name] ?? 0) + jeSkill;
  }
  // Querlernen: zusätzlich je verwandtem Skill sein Anteil, abgerundet
  const zusaetzlich = {};
  for (const [name, definition] of skills) {
    if (!zuteilung[name]) continue;
    for (const { skill, anteil } of definition.verwandt || []) zusaetzlich[skill] = (zusaetzlich[skill] ?? 0) + Math.floor((zuteilung[name] * anteil) / 100);
  }
  for (const [name, menge] of Object.entries(zusaetzlich)) if (menge > 0) zuteilung[name] = (zuteilung[name] ?? 0) + menge;
  return { zuteilung, frei };
}

anmelden("haken", "nach_tod", (spiel, kontext) => {
  const ninkasi = lernende(spiel);
  const opfer = spiel.zustand.entitaeten[kontext.zielId];
  if (!ninkasi || !opfer || opfer === ninkasi || !opfer.beitraege?.length || !(opfer.ep > 0)) return;
  const ep = epDesOpfers(spiel, opfer);
  if (ep <= 0) return;
  const { zuteilung, frei: freiAusDerTeilung } = epAufteilen(spiel, opfer.beitraege, ep);
  let frei = freiAusDerTeilung, gesamt = freiAusDerTeilung;
  const skills = [];
  for (const name of Object.keys(spiel.daten.skills || {})) {
    const menge = zuteilung[name];
    if (!menge) continue;
    const nichtAufgenommen = epAufSkill(spiel, ninkasi, name, menge);
    frei += nichtAufgenommen;
    gesamt += menge;
    if (menge > nichtAufgenommen) skills.push({ skill: name, ep: menge - nichtAufgenommen });
  }
  ninkasi.freieEp += frei;
  melden(spiel, "ep_erhalten", { wer: bezugAuf(ninkasi), opfer: bezugAuf(opfer), ep: gesamt, skills, frei });
});
