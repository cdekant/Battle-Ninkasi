// Textzugriff für die Anzeige: Schlüssel nachschlagen, Platzhalter füllen.
// {menge} setzt einen Wert ein; für Entitäten (Meldungen tragen Bezüge { id, typ, text }):
//   {ziel.akk}       Fall mit bestimmtem Artikel (Standard: nom, bestimmt)
//   {was.nom.ein}    Fall mit unbestimmtem Artikel
//   {wer.gen.ohne}   Fall ohne Artikel

export function erstelleTexte(texte, grammatik) {
  function rohtext(schluessel) {
    if (!(schluessel in texte)) {
      console.warn(`Text fehlt: ${schluessel}`);
      return `[${schluessel}]`;
    }
    return texte[schluessel];
  }

  // Hauptwort einer Entität im gewünschten Fall und mit gewünschtem Artikel; unbekannte Gegenstände mit ihrem Etikett
  function nomenForm(bezug, fall = "nom", artikel = "bestimmt") {
    const eintrag = rohtext(bezug.etikett ?? bezug.text);
    if (typeof eintrag === "string") return eintrag;
    return grammatik.nomen(eintrag, fall, artikel);
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

  return { text, nomenForm, hatSchluessel: (schluessel) => schluessel in texte };
}

export function satzanfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
