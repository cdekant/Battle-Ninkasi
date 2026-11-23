// Textzugriff für die Anzeige (siehe docs/Texte.md, Sprachdateien): Schlüssel nachschlagen, Platzhalter füllen.
// {menge} setzt einen Wert ein; für Entitäten (Meldungen tragen Bezüge { id, typ, text, etikett?, adjektive?, anzahl? }):
//   {ziel.akk}       Fall mit bestimmtem Artikel (Standard: nom, bestimmt)
//   {was.nom.ein}    Fall mit unbestimmtem Artikel, in der Mehrzahl mit der Zahl
//   {was.akk.zahl}   Fall ohne Artikel, in der Mehrzahl mit der Zahl
//   {wer.gen.ohne}   Fall ohne Artikel
// Mehrzahl, wenn der Bezug eine anzahl über 1 trägt; Adjektive aus dem Bezug (adjektive) oder den Zuständen einer
// Entität und die festen des Hauptworts. Rückfall: fehlt ein Schlüssel, gilt die zweite Sprache mit ihrer Grammatik
// (Englisch fällt auf Deutsch zurück, solange Texte fehlen, etwa die des Probeinhalts).

import { adjektiveVon } from "../kern/ereignisse.js";

export function erstelleTexte(texte, grammatik, rueckfall = null) {
  const sprachen = [{ texte, grammatik }, ...(rueckfall ? [rueckfall] : [])];
  const spracheMit = (schluessel) => sprachen.find((sprache) => schluessel in sprache.texte);

  function fehlt(schluessel) {
    console.warn(`Text fehlt: ${schluessel}`);
    return `[${schluessel}]`;
  }

  function rohtext(schluessel) {
    const sprache = spracheMit(schluessel);
    return sprache ? sprache.texte[schluessel] : fehlt(schluessel);
  }

  // Hauptwort einer Entität im gewünschten Fall und mit gewünschtem Artikel; unbekannte Gegenstände mit ihrem Etikett;
  // Adjektive kommen aus derselben Sprache wie das Hauptwort
  function nomenForm(bezug, fall = "nom", artikel = "bestimmt") {
    const schluessel = bezug.etikett ?? bezug.text;
    const sprache = spracheMit(schluessel);
    if (!sprache) return fehlt(schluessel);
    const eintrag = sprache.texte[schluessel];
    if (typeof eintrag === "string") return eintrag;
    const adjektivschluessel = [...new Set([...(bezug.adjektive ?? adjektiveVon(bezug)), ...(eintrag.adjektive ?? [])])];
    const adjektive = adjektivschluessel.filter((adjektiv) => adjektiv in sprache.texte || (fehlt(adjektiv), false))
      .map((adjektiv) => sprache.texte[adjektiv]);
    return sprache.grammatik.nomen(eintrag, fall, artikel, { anzahl: bezug.anzahl ?? 1, adjektive });
  }

  // Text zu einem Schlüssel, Platzhalter aus platzhalterWerte gefüllt
  function text(schluessel, platzhalterWerte = {}) {
    const vorlage = rohtext(schluessel);
    return String(vorlage).replace(/\{(\w+)(?:\.(\w+))?(?:\.(\w+))?\}/g, (_, name, fall, artikel) => {
      const wert = platzhalterWerte[name];
      if (wert === undefined || wert === null) return "";
      if (typeof wert === "object" && wert.text) return nomenForm(wert, fall, artikel);
      return String(wert);
    });
  }

  // Text nach der Zahl: in der Mehrzahl gilt <schluessel>.mehrzahl, wenn es ihn gibt (Hier liegen 3 Biere)
  function textNachZahl(schluessel, anzahl, platzhalterWerte = {}) {
    const mehrzahl = `${schluessel}.mehrzahl`;
    return text(anzahl > 1 && spracheMit(mehrzahl) ? mehrzahl : schluessel, platzhalterWerte);
  }

  return { text, textNachZahl, nomenForm, hatSchluessel: (schluessel) => Boolean(spracheMit(schluessel)) };
}

export function satzanfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Platzhalter einer Vorlage als sortierte Liste ihrer Namen (für den Vergleich der Sprachen, tests/sprachen.test.js)
export function platzhalterVon(vorlage) {
  if (typeof vorlage !== "string") return [];
  return [...new Set([...vorlage.matchAll(/\{(\w+)(?:\.\w+)*\}/g)].map((treffer) => treffer[1]))].sort();
}
