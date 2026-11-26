// Nebel und Rezeptbuch (siehe docs/Sude.md, Nebel und Rezepte; Spieldesign in docs/Brauen.md, Zielgebiete und Rezepte).
// Nebel: Ninkasi kennt nur aufgedeckte Zielgebiete, zustand.wissen.zielgebiete: [name]; zu Beginn das Vorwissen aus den
//   Startoptionen (optionen.vorwissen.zielgebiete, gefüllt von der Oberfläche, siehe docs/Architektur.md, Speichern), in der Spielart "allmaechtig"
//   alle; aufgedeckt wird durch einen Treffer beim Brauen oder ein gelerntes Rezept (Meldung zielgebiet_entdeckt mit wie).
// Rezeptbuch des Laufs: zustand.rezepte = { <schluessel>: rezept }, Schlüssel der Name eines gefundenen Rezepts
//   (daten.rezepte) oder "haus:<zielgebiet>"
//   rezept: { art: "gefunden" | "haus", zielgebiet, portionen, zutaten: [{ typ, menge }], verfahren, kultur, punkt, guete,
//             gelungen }; punkt ist die gerundete Mitte des Profils, guete ihre Güte im Zielgebiet (0 außerhalb)
//   Ein Sud ist nach Rezept, wenn Kultur und Verfahren gleich sind, dieselben Zutatenarten drin sind und für jede
//   Menge x Rezeptportionen = Rezeptmenge x Portionen gilt; das gefundene geht dem Hausrezept vor.
// Baustein rezept_lernen { rezept }: trägt ein gefundenes Rezept ein (Meldung rezept_gelernt oder rezept_bekannt).
// Hausrezept: ein freier Sud, der trifft, nicht verdirbt und dessen Mitte im Zielgebiet liegt, wird Hausrezept seines
//   Zielgebiets, wenn es dort keines gibt oder die Güte seiner Mitte höher ist (Meldung hausrezept bzw. hausrezept_besser).

import { anmelden } from "../kern/register.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { bausteinAnmelden } from "../kern/bausteine.js";
import { wissenVon } from "./wissen.js";
import { freieEpGeben } from "./lernen.js";
import { profilBerechnen, profilRunden, imZielgebiet, gueteImZielgebiet } from "./sud.js";

const zielgebietBezug = (spiel, name) => ({ name, text: spiel.daten.zielgebiete[name].text });

// Namen der aufgedeckten Zielgebiete in der Reihenfolge, in der Ninkasi sie fand
export const aufgedeckteZielgebiete = (spiel) => spiel.zustand.wissen?.zielgebiete ?? [];

// Deckt ein Zielgebiet für Ninkasi auf; wie: "getroffen" | "rezept"; gibt true, wenn es neu war
export function zielgebietAufdecken(spiel, wesen, name, wie) {
  if (wesen.id !== spiel.zustand.spielerinId || !spiel.daten.zielgebiete?.[name]) return false;
  const wissen = wissenVon(spiel.zustand);
  wissen.zielgebiete ??= [];
  if (wissen.zielgebiete.includes(name)) return false;
  wissen.zielgebiete.push(name);
  melden(spiel, "zielgebiet_entdeckt", { wer: bezugAuf(wesen), zielgebiet: zielgebietBezug(spiel, name), wie });
  return true;
}

// Vorwissen beim Start: nur Zielgebiete, die es gibt, jedes einmal
anmelden("laufbeginn", "zielgebiete", (spiel) => {
  const alle = Object.keys(spiel.daten.zielgebiete ?? {});
  const vorwissen = spiel.optionen?.spielart === "allmaechtig" ? alle : (spiel.optionen?.vorwissen?.zielgebiete ?? []).filter((name) => alle.includes(name));
  wissenVon(spiel.zustand).zielgebiete = [...new Set(vorwissen)];
});

// Zutaten nach Art zusammengezählt, in der Reihenfolge ihres ersten Auftretens
export function zutatenNachArt(zutaten) {
  const mengen = new Map();
  for (const { typ, menge } of zutaten) mengen.set(typ, (mengen.get(typ) ?? 0) + menge);
  return [...mengen].map(([typ, menge]) => ({ typ, menge }));
}

// Passt eine Eingabe { zutaten, verfahren, kultur, portionen } zu einem Rezept
export function nachRezept(rezept, eingabe) {
  if (rezept.kultur !== eingabe.kultur || rezept.verfahren.maische !== eingabe.verfahren.maische || rezept.verfahren.gewuerz !== eingabe.verfahren.gewuerz) return false;
  const zutaten = zutatenNachArt(eingabe.zutaten);
  if (zutaten.length !== rezept.zutaten.length) return false;
  return rezept.zutaten.every(({ typ, menge }) => {
    const eigene = zutaten.find((zutat) => zutat.typ === typ);
    return Boolean(eigene) && eigene.menge * rezept.portionen === menge * eingabe.portionen;
  });
}

// Schlüssel des Rezepts im Buch, nach dem die Eingabe gebraut wird, oder null; gefundene zuerst
export function rezeptFinden(spiel, eingabe) {
  const buch = Object.entries(spiel.zustand.rezepte ?? {});
  for (const art of ["gefunden", "haus"]) {
    const treffer = buch.find(([, rezept]) => rezept.art === art && nachRezept(rezept, eingabe));
    if (treffer) return treffer[0];
  }
  return null;
}

// Schlüssel des gefundenen Rezepts, nach dem ein Trockenbier abgefüllt wird (alles wie im Rezept bis auf die Kultur,
// die erst beim Anrühren dazukommt, systeme/trockenbier.js), oder null; Hausrezepte zählen nicht
export function rezeptFuerTrockenbier(spiel, eingabe) {
  const treffer = Object.entries(spiel.zustand.rezepte ?? {}).find(([, rezept]) => rezept.art === "gefunden" && nachRezept(rezept, { ...eingabe, kultur: rezept.kultur }));
  return treffer ? treffer[0] : null;
}

// Punkt und Güte eines Rezepts: die gerundete Mitte und ihre Güte im Zielgebiet (0, wenn sie nicht darin liegt)
function punktUndGuete(spiel, rezept, vertraegt) {
  const mitte = profilBerechnen(spiel.daten, { ...rezept, vertraegt });
  const zielgebiet = spiel.daten.zielgebiete[rezept.zielgebiet];
  return { punkt: profilRunden(spiel.daten, mitte), guete: imZielgebiet(mitte, zielgebiet) ? gueteImZielgebiet(spiel.daten, mitte, zielgebiet) : 0 };
}

// Ein gefundenes Rezept ins Buch; gibt false, wenn es schon drinsteht
export function rezeptLernen(spiel, wesen, name) {
  const daten = spiel.daten.rezepte[name];
  const buch = (spiel.zustand.rezepte ??= {});
  const bezug = { name, text: daten.text };
  if (buch[name]) {
    melden(spiel, "rezept_bekannt", { wer: bezugAuf(wesen), rezept: bezug });
    return false;
  }
  const rezept = { art: "gefunden", zielgebiet: daten.zielgebiet, portionen: daten.portionen, zutaten: structuredClone(daten.zutaten), verfahren: { ...daten.verfahren }, kultur: daten.kultur };
  buch[name] = { ...rezept, ...punktUndGuete(spiel, rezept), gelungen: false };
  melden(spiel, "rezept_gelernt", { wer: bezugAuf(wesen), rezept: bezug, zielgebiet: zielgebietBezug(spiel, daten.zielgebiet) });
  zielgebietAufdecken(spiel, wesen, daten.zielgebiet, "rezept");
  return true;
}

bausteinAnmelden("rezept_lernen", { rezept: "rezept" }, (spiel, kontext, parameter) => {
  const wesen = spiel.zustand.entitaeten[kontext.zielId];
  if (wesen) rezeptLernen(spiel, wesen, parameter.rezept);
}, { brauchtZiel: true });

// Nach einem gelungenen Sud (systeme/brauen.js): Zielgebiet aufdecken, erstes Gelingen eines gefundenen Rezepts
// (freie EP aus daten.rezepte.<name>.ep), Hausrezept anlegen oder verbessern
export function nachDemSud(spiel, wesen, vorbereitet, zielgebiet) {
  zielgebietAufdecken(spiel, wesen, zielgebiet, "getroffen");
  const buch = (spiel.zustand.rezepte ??= {});
  const nach = vorbereitet.rezept ? buch[vorbereitet.rezept] : null;
  if (nach?.art === "gefunden" && nach.zielgebiet === zielgebiet && !nach.gelungen) {
    nach.gelungen = true;
    const daten = spiel.daten.rezepte[vorbereitet.rezept];
    freieEpGeben(spiel, "rezept", daten.ep ?? 0, { text: daten.text });
  }
  if (nach || wesen.id !== spiel.zustand.spielerinId) return;
  const eingabe = vorbereitet.eingabe;
  const rezept = { art: "haus", zielgebiet, portionen: eingabe.portionen, zutaten: zutatenNachArt(eingabe.zutaten), verfahren: { ...eingabe.verfahren }, kultur: eingabe.kultur };
  const { punkt, guete } = punktUndGuete(spiel, rezept, eingabe.vertraegt);
  const schluessel = `haus:${zielgebiet}`, bisher = buch[schluessel];
  if (guete === 0 || (bisher && bisher.guete >= guete)) return;
  buch[schluessel] = { ...rezept, punkt, guete, gelungen: true };
  melden(spiel, bisher ? "hausrezept_besser" : "hausrezept", { wer: bezugAuf(wesen), zielgebiet: zielgebietBezug(spiel, zielgebiet) });
}
