// Fraktionen, Ruf und Beistand (siehe docs/Wesen.md, Fraktionen).
// Daten (daten/fraktionen.js): name: { text, beziehungen?: { andereFraktion: "feind" | "neutral" | "verbuendet" }, rufFest? }
//   Eine Beziehung gilt in beide Richtungen; sagen beide Seiten etwas anderes, gewinnt die strengere
//   (feind vor neutral vor verbuendet). Gleiche Fraktion ist verbündet, "eigene:<nummer>" (Zwietracht) mit allen
//   verfeindet; fehlt eine Angabe, gilt regeln.fraktionen.beziehungVorgabe.
// Ruf (zustand.ruf: { fraktion: Zahl }, Vorgabe 0) gehört der Fraktion regeln.fraktionen.rufTraeger: Ansehen =
//   Grundwert der Beziehung aus der Tabelle + Ruf, die Schwellen ordnen das Ansehen wieder einer Beziehung zu; bei Ruf 0
//   gilt die Tabelle. Er ändert sich über den Baustein ruf_aendern und durch Tötungen einer Täterin dieser Fraktion.
// Zorn: Wer ein neutrales Wesen angreift, macht es und alle Wesen seiner Fraktion, die die Angreiferin sehen,
//   ihr gegenüber feindlich; jedes merkt sich das einzeln in zornAuf: [IDs]. Zorn geht vor allem anderen.
// Beistand: Wer ein Wesen angreift, mit dessen Fraktion die Fraktion einer neutralen Zuschauerin verfeindet ist, dem
//   steht sie bei, wenn sie die Angreiferin sieht: beistandFuer: { angreiferinId: [Gegner-IDs] }, verbündet statt
//   neutral, solange ein Gegner noch da ist und eine der beiden im Kampf ist (systeme/kampfzustand.js).
// Urheber in Abfragen: { id, fraktion }, damit eine schon entfernte Urheberin ihre Fraktion behält.

import { anmelden } from "../kern/register.js";
import { fraktionVon, entitaetenMitPosition, istWesen } from "../kern/zustand.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { bausteinAnmelden, mengeBestimmen } from "../kern/bausteine.js";
import { sieht } from "./sicht.js";
import { imKampf } from "./kampfzustand.js";

export const BEZIEHUNGEN = ["feind", "neutral", "verbuendet"];
const STRENGE = { verbuendet: 0, neutral: 1, feind: 2 };

const fraktionsregeln = (spiel) => spiel.daten.regeln.fraktionen;
const istEigene = (fraktion) => String(fraktion).startsWith("eigene:");

// Angaben der Tabelle zu einem Paar (beide Richtungen), ohne Vorgabe
function tabellenangaben(spiel, ersteFraktion, zweiteFraktion) {
  const tabelle = spiel.daten.fraktionen || {};
  return [tabelle[ersteFraktion]?.beziehungen?.[zweiteFraktion], tabelle[zweiteFraktion]?.beziehungen?.[ersteFraktion]].filter(Boolean);
}

// Beziehung nach der Tabelle allein (ohne Ruf)
function tabellenbeziehung(spiel, ersteFraktion, zweiteFraktion) {
  const angaben = tabellenangaben(spiel, ersteFraktion, zweiteFraktion);
  if (angaben.length === 0) return fraktionsregeln(spiel).beziehungVorgabe;
  return angaben.reduce((strengste, angabe) => (STRENGE[angabe] > STRENGE[strengste] ? angabe : strengste));
}

export function rufBei(spiel, fraktion) {
  return spiel.zustand?.ruf?.[fraktion] ?? 0;
}

// Grundbeziehung aus der Tabelle, verschoben um den Ruf bei der anderen Fraktion
function mitRuf(spiel, grundbeziehung, andereFraktion) {
  const ruf = rufBei(spiel, andereFraktion);
  if (ruf === 0 || spiel.daten.fraktionen?.[andereFraktion]?.rufFest) return grundbeziehung;
  const regeln = fraktionsregeln(spiel);
  const ansehen = regeln.rufGrundwert[grundbeziehung] + ruf;
  if (ansehen <= regeln.rufSchwellen.feind) return "feind";
  if (ansehen >= regeln.rufSchwellen.verbuendet) return "verbuendet";
  return "neutral";
}

// Beziehung zwischen zwei Fraktionen (Namen), mit Ruf; ohne Fraktion auf einer Seite neutral
export function beziehung(spiel, ersteFraktion, zweiteFraktion) {
  if (ersteFraktion == null || zweiteFraktion == null) return "neutral";
  if (ersteFraktion === zweiteFraktion) return "verbuendet";
  if (istEigene(ersteFraktion) || istEigene(zweiteFraktion)) return "feind";
  const grundbeziehung = tabellenbeziehung(spiel, ersteFraktion, zweiteFraktion);
  const rufTraeger = fraktionsregeln(spiel).rufTraeger;
  if (ersteFraktion === rufTraeger) return mitRuf(spiel, grundbeziehung, zweiteFraktion);
  if (zweiteFraktion === rufTraeger) return mitRuf(spiel, grundbeziehung, ersteFraktion);
  return grundbeziehung;
}

export const urheberVon = (entitaet) => ({ id: entitaet.id, fraktion: fraktionVon(entitaet) ?? null });

// Gilt der Beistand der Helferin für die Angreiferin noch? Ein Gegner muss noch da sein (gestorben oder auf einer
// anderen Ebene heißt weg) und eine der beiden im Kampf.
function beistandGilt(spiel, helferin, angreiferinId) {
  const gegnerIds = helferin.beistandFuer?.[angreiferinId];
  if (!gegnerIds) return false;
  const entitaeten = spiel.zustand.entitaeten;
  if (!gegnerIds.some((gegnerId) => entitaeten[gegnerId]?.position)) return false;
  return imKampf(spiel, helferin) || imKampf(spiel, entitaeten[angreiferinId]);
}

// Beziehung ohne Beistand: Zorn, dann Tabelle und Ruf
function grundbeziehungZwischen(spiel, urheber, entitaet, urheberEntitaet) {
  if (entitaet.zornAuf?.includes(urheber.id) || urheberEntitaet?.zornAuf?.includes(entitaet.id)) return "feind";
  return beziehung(spiel, urheber.fraktion, fraktionVon(entitaet));
}

// Beziehung einer Urheberin ({ id, fraktion }) zu einer Entität, mit Zorn und Beistand (in beide Richtungen)
export function beziehungZwischen(spiel, urheber, entitaet) {
  if (urheber.id != null && urheber.id === entitaet.id) return "verbuendet";
  const urheberEntitaet = urheber.id != null ? spiel.zustand.entitaeten[urheber.id] : null;
  const grundbeziehung = grundbeziehungZwischen(spiel, urheber, entitaet, urheberEntitaet);
  if (grundbeziehung !== "neutral") return grundbeziehung;
  if (beistandGilt(spiel, entitaet, urheber.id) || (urheberEntitaet && beistandGilt(spiel, urheberEntitaet, entitaet.id))) return "verbuendet";
  return "neutral";
}

// Ruf

// Verschiebt den Ruf bei einer Fraktion; Meldung ruf mit der Änderung und dem neuen Stand
export function rufAendern(spiel, fraktion, menge) {
  if (!menge || spiel.daten.fraktionen?.[fraktion]?.rufFest) return;
  if (!spiel.zustand.ruf) spiel.zustand.ruf = {};
  const ruf = rufBei(spiel, fraktion) + menge;
  if (ruf === 0) delete spiel.zustand.ruf[fraktion];
  else spiel.zustand.ruf[fraktion] = ruf;
  melden(spiel, "ruf", { fraktion, menge, ruf });
}

// Parameter: fraktion, Menge siehe mengeBestimmen (auch negativ); wirkt auf den Ruf, nicht auf ein Ziel
bausteinAnmelden("ruf_aendern", { fraktion: "fraktion", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  rufAendern(spiel, parameter.fraktion, mengeBestimmen(spiel, kontext, parameter));
});

// Sieht ein Wesen der Fraktion die Täterin oder das Opfer? (Zeugen einer Tötung)
function zeugeDa(spiel, fraktion, taeterin, opfer) {
  return entitaetenMitPosition(spiel.zustand).some((zeuge) => zeuge !== taeterin && zeuge !== opfer && istWesen(zeuge)
    && fraktionVon(zeuge) === fraktion && (sieht(spiel, zeuge, taeterin) || sieht(spiel, zeuge, opfer)));
}

// Tötet ein Wesen der Ruf-Fraktion ein anderes, steigt der Ruf bei den ausdrücklichen Feinden der Fraktion des Opfers
// (Einträge der Tabelle, nicht die Vorgabe) und sinkt bei der Fraktion des Opfers; mit rufNurMitZeugen nur, wenn ein
// Wesen der jeweiligen Fraktion zusieht. Unter fremder Fraktion (Verkleidung, Besessenheit) ändert sich nichts.
function rufNachTod(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const taeterin = entitaeten[kontext.urheberId], opfer = entitaeten[kontext.zielId];
  if (!istWesen(taeterin) || !opfer || taeterin.id === opfer.id) return;
  const regeln = fraktionsregeln(spiel);
  const opferFraktion = fraktionVon(opfer);
  if (fraktionVon(taeterin) !== regeln.rufTraeger || opferFraktion == null || opferFraktion === regeln.rufTraeger) return;
  for (const fraktion of Object.keys(spiel.daten.fraktionen || {})) {
    if (fraktion === regeln.rufTraeger) continue;
    let menge = 0;
    if (fraktion === opferFraktion) menge = regeln.rufToetungEigene;
    else if (tabellenangaben(spiel, fraktion, opferFraktion).includes("feind")) menge = regeln.rufToetungFeind;
    if (!menge) continue;
    if (regeln.rufNurMitZeugen && !zeugeDa(spiel, fraktion, taeterin, opfer)) continue;
    rufAendern(spiel, fraktion, menge);
  }
}

anmelden("haken", "nach_tod", rufNachTod);

// Zorn

function zornMerken(wesen, angreiferinId) {
  if (!wesen.zornAuf) wesen.zornAuf = [];
  if (!wesen.zornAuf.includes(angreiferinId)) wesen.zornAuf.push(angreiferinId);
  // wer zornig ist, steht nicht mehr bei
  if (wesen.beistandFuer?.[angreiferinId]) {
    delete wesen.beistandFuer[angreiferinId];
    if (Object.keys(wesen.beistandFuer).length === 0) delete wesen.beistandFuer;
  }
}

// Greift die Urheberin ein neutrales Wesen an (auch eines, das ihr beisteht), werden es und seine Fraktion in Sicht zornig
function zornPruefen(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const angreiferin = entitaeten[kontext.urheberId], ziel = entitaeten[kontext.zielId];
  // nur Wesen ziehen Zorn auf sich, keine Fallen oder Fässer
  if (!angreiferin || !ziel || angreiferin.id === ziel.id || !istWesen(angreiferin)) return;
  if (grundbeziehungZwischen(spiel, urheberVon(angreiferin), ziel, angreiferin) !== "neutral") return;
  const fraktion = fraktionVon(ziel);
  zornMerken(ziel, angreiferin.id);
  for (const genosse of entitaetenMitPosition(spiel.zustand)) {
    if (genosse === ziel || genosse === angreiferin || fraktionVon(genosse) !== fraktion) continue;
    if (sieht(spiel, genosse, angreiferin)) zornMerken(genosse, angreiferin.id);
  }
  melden(spiel, "zorn", { wer: bezugAuf(ziel), auf: bezugAuf(angreiferin) });
}

for (const haken of ["nach_treffer", "verfehlt", "nach_schaden"]) anmelden("haken", haken, zornPruefen);

// Beistand

// Abgelaufenen Beistand entfernen, damit der Zustand nicht wächst
function beistandAufraeumen(spiel, wesen) {
  if (!wesen.beistandFuer) return;
  for (const angreiferinId of Object.keys(wesen.beistandFuer)) {
    if (!beistandGilt(spiel, wesen, angreiferinId)) delete wesen.beistandFuer[angreiferinId];
  }
  if (Object.keys(wesen.beistandFuer).length === 0) delete wesen.beistandFuer;
}

// Fraktionen, die der Angreiferin neutral gegenüberstehen und mit der Fraktion des Opfers verfeindet sind
function moeglicheHelferfraktionen(spiel, angreiferFraktion, opferFraktion) {
  return Object.keys(spiel.daten.fraktionen || {}).filter((fraktion) => fraktion !== angreiferFraktion && fraktion !== opferFraktion
    && beziehung(spiel, angreiferFraktion, fraktion) === "neutral" && beziehung(spiel, fraktion, opferFraktion) === "feind");
}

// Greift eine Urheberin ein Wesen an, stehen ihr neutrale Zuschauerinnen bei, deren Fraktion mit dem Opfer verfeindet ist
// und die sie sehen; sie wachen auf und jagen das Opfer
function beistandPruefen(spiel, kontext) {
  const entitaeten = spiel.zustand.entitaeten;
  const angreiferin = entitaeten[kontext.urheberId], opfer = entitaeten[kontext.zielId];
  if (!istWesen(angreiferin) || !istWesen(opfer) || angreiferin.id === opfer.id || !opfer.position) return;
  const helferfraktionen = moeglicheHelferfraktionen(spiel, fraktionVon(angreiferin), fraktionVon(opfer));
  if (helferfraktionen.length === 0) return;
  for (const zuschauerin of entitaetenMitPosition(spiel.zustand)) {
    if (zuschauerin === angreiferin || zuschauerin === opfer || !istWesen(zuschauerin)) continue;
    if (!helferfraktionen.includes(fraktionVon(zuschauerin))) continue;
    if (grundbeziehungZwischen(spiel, urheberVon(angreiferin), zuschauerin, angreiferin) !== "neutral") continue;
    if (!sieht(spiel, zuschauerin, angreiferin)) continue;
    beistandAufraeumen(spiel, zuschauerin);
    const neu = !zuschauerin.beistandFuer?.[angreiferin.id];
    if (!zuschauerin.beistandFuer) zuschauerin.beistandFuer = {};
    const gegnerIds = zuschauerin.beistandFuer[angreiferin.id] ?? (zuschauerin.beistandFuer[angreiferin.id] = []);
    if (!gegnerIds.includes(opfer.id)) gegnerIds.push(opfer.id);
    zuschauerin.kampfZuletzt = spiel.zustand.zeit;
    const ki = zuschauerin.ki;
    if (ki && (ki.wachzustand ?? "jagt") !== "jagt") {
      ki.wachzustand = "jagt";
      ki.letzteBekanntePosition = { x: opfer.position.x, y: opfer.position.y };
    }
    if (neu) melden(spiel, "beistand", { wer: bezugAuf(zuschauerin), fuer: bezugAuf(angreiferin) });
  }
}

for (const haken of ["nach_treffer", "verfehlt", "nach_schaden"]) anmelden("haken", haken, beistandPruefen);
