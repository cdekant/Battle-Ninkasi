// Normierung (siehe docs/Wesen.md, Normierung): rechnet für jedes Wesen den Standardangriff gegen Ninkasi zu Beginn
// aus, ohne zu würfeln, und ordnet es einer Stärke aus regeln.normierung zu; die Normwesen müssen ihre Stärke innerhalb
// der Toleranz treffen (geprüft in tests/normierung.test.js). Wie Kämpfe wirklich ausgehen, misst die Arena:
// node werkzeuge/arena.js normwesen bzw. normwesen_drei.
// Aufruf: node werkzeuge/normierung.js
//   Ninkasi zu Beginn: die der Arena "normwesen" (Faust, ohne Skills und Ausrüstung)
//   Standardangriff: das erste Angriffsprofil, sein mittlerer Schaden aus dem ersten Baustein schaden, auch hinter
//   einem trefferwurf; Fernangriffe aus Fähigkeiten zählen nicht mit
//   Treffer bis zum Tod: LP / mittlerer Schaden, ohne Rüstung und Widerstand (beide fehlen zu Beginn)
//   Zeit bis zum Tod: Treffer / Trefferchance x Kosten des Profils, in Zeiteinheiten

import { pathToFileURL } from "node:url";
import { rohdaten, texteDe as texte } from "../src/inhalt.js";
import { datenLaden, neuesSpiel } from "../src/kern/spiel.js";
import { spielerin, ausDatenErzeugen, entitaetEntfernen } from "../src/kern/zustand.js";
import { wuerfelSpanne } from "../src/kern/zufall.js";
import { trefferanteil, angriffeVon, kostenDesProfils } from "../src/systeme/kampf.js";
import { aufstellungAus } from "../src/systeme/arena.js";

// Mittlerer Schaden eines Effekts: der erste Baustein schaden, sonst der Effekt hinter dem ersten trefferwurf; 0 ohne
export function mittlererSchaden(daten, effektName, besucht = new Set()) {
  const effekt = daten.effekte?.[effektName];
  if (!effekt || besucht.has(effektName)) return 0;
  besucht.add(effektName);
  for (const schritt of effekt.schritte) {
    if (schritt.baustein === "schaden") {
      if (schritt.wuerfel === undefined) return schritt.menge ?? 0;
      const { kleinster, groesster } = wuerfelSpanne(schritt.wuerfel);
      return (kleinster + groesster) / 2;
    }
    if (schritt.baustein === "trefferwurf") return mittlererSchaden(daten, schritt.effekt, besucht);
  }
  return 0;
}

// Ein Angriff von quelle auf ziel: { trefferchance (Prozent), treffer (bis zum Tod), zeit } oder null ohne Angriff
function angriffAuswerten(spiel, quelle, ziel) {
  const profil = angriffeVon(spiel, quelle)[0];
  if (!profil) return null;
  const tags = [...(profil.tags || []), ...(spiel.daten.effekte?.[profil.effekt]?.tags || [])];
  const { zaehler, nenner } = trefferanteil(spiel, { quelle, ziel, genauigkeit: profil.genauigkeit, tags });
  const anteil = nenner > 0 ? zaehler / nenner : 0;
  const schaden = mittlererSchaden(spiel.daten, profil.effekt);
  const treffer = schaden > 0 ? ziel.werte.lp.aktuell / schaden : Infinity;
  return { trefferchance: Math.round(anteil * 100), treffer, zeit: anteil > 0 ? (treffer / anteil) * kostenDesProfils(spiel, quelle, profil) : Infinity };
}

// Abweichung in Prozent des Ziels
const abweichung = (wert, ziel) => (Math.abs(wert - ziel) * 100) / ziel;

// Die nächste Stärke (1 bis n) nach der mittleren Abweichung beider Trefferzahlen
function naechsteStaerke(staerken, ninkasiTreffer, wesenTreffer) {
  let beste = 1, kleinste = Infinity;
  staerken.forEach((stufe, stelle) => {
    const summe = abweichung(ninkasiTreffer, stufe.ninkasiTreffer) + abweichung(wesenTreffer, stufe.wesenTreffer);
    if (summe < kleinste) { kleinste = summe; beste = stelle + 1; }
  });
  return beste;
}

// Für alle Wesen mit Angriff außer Ninkasi (oder die genannten Typen):
// [{ typ, lp, ep, ninkasi: { trefferchance, treffer, zeit }, wesen: { ... }, staerke }]
export function normwerte(daten, typen = null) {
  const spiel = neuesSpiel(daten, 1, { spielart: "arena", arena: aufstellungAus(daten, "normwesen") });
  const ninkasi = spielerin(spiel.zustand);
  const { staerken } = daten.regeln.normierung;
  const kandidaten = typen ?? Object.keys(daten.wesen).filter((typ) => typ !== "ninkasi" && !daten.wesen[typ].abstrakt);
  const ergebnis = [];
  for (const typ of kandidaten) {
    const wesen = ausDatenErzeugen(spiel, "wesen", typ, null);
    const gegenNinkasi = angriffAuswerten(spiel, wesen, ninkasi);
    const vonNinkasi = angriffAuswerten(spiel, ninkasi, wesen);
    if (gegenNinkasi && vonNinkasi) {
      ergebnis.push({ typ, lp: wesen.werte.lp.aktuell, ep: wesen.ep ?? 0, ninkasi: vonNinkasi, wesen: gegenNinkasi, staerke: naechsteStaerke(staerken, vonNinkasi.treffer, gegenNinkasi.treffer) });
    }
    entitaetEntfernen(spiel.zustand, wesen.id);
  }
  return ergebnis;
}

// Weicht ein Wesen von den Zielen seiner Stärke ab? Liste der Abweichungen als Texte (leer, wenn alles passt)
export function abweichungenVon(daten, zeile, staerke = zeile.staerke) {
  const { toleranz, trefferchance, staerken } = daten.regeln.normierung;
  const ziel = staerken[staerke - 1];
  const funde = [];
  if (abweichung(zeile.ninkasi.treffer, ziel.ninkasiTreffer) > toleranz) funde.push(`Ninkasi braucht ${zeile.ninkasi.treffer.toFixed(1)} Treffer statt ${ziel.ninkasiTreffer}`);
  if (abweichung(zeile.wesen.treffer, ziel.wesenTreffer) > toleranz) funde.push(`das Wesen braucht ${zeile.wesen.treffer.toFixed(1)} Treffer statt ${ziel.wesenTreffer}`);
  if (zeile.ep !== ziel.ep) funde.push(`${zeile.ep} EP statt ${ziel.ep}`);
  if (Math.abs(zeile.ninkasi.trefferchance - trefferchance.ninkasi) > 2) funde.push(`Ninkasi trifft zu ${zeile.ninkasi.trefferchance} % statt ${trefferchance.ninkasi} %`);
  if (Math.abs(zeile.wesen.trefferchance - trefferchance.wesen) > 2) funde.push(`das Wesen trifft zu ${zeile.wesen.trefferchance} % statt ${trefferchance.wesen} %`);
  return funde;
}

function hauptprogramm() {
  const daten = datenLaden(rohdaten, texte);
  const zahl = (wert, stellen = 1) => (Number.isFinite(wert) ? wert.toFixed(stellen).replace(".", ",") : "-");
  console.log("Wesen                 Stärke  LP   EP   Ninkasi: Chance Treffer Zeit    Wesen: Chance Treffer Zeit    Abweichung");
  for (const zeile of normwerte(daten)) {
    const funde = abweichungenVon(daten, zeile);
    console.log(`${zeile.typ.padEnd(22)}${String(zeile.staerke).padEnd(8)}${String(zeile.lp).padEnd(5)}${String(zeile.ep).padEnd(5)}`
      + `${(zeile.ninkasi.trefferchance + " %").padStart(14)}${zahl(zeile.ninkasi.treffer).padStart(8)}${zahl(zeile.ninkasi.zeit, 0).padStart(6)}`
      + `${(zeile.wesen.trefferchance + " %").padStart(14)}${zahl(zeile.wesen.treffer).padStart(8)}${zahl(zeile.wesen.zeit, 0).padStart(6)}    ${funde.join("; ") || "passt"}`);
  }
  console.log("Treffer bis zum Tod gegen Ninkasi zu Beginn (Faust), Zeit in Zeiteinheiten; Stärke ist die nächste aus regeln.normierung");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) hauptprogramm();
