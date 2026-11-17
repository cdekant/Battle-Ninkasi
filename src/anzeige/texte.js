// Textzugriff für die Anzeige: Schlüssel nachschlagen, Platzhalter füllen.
// {menge} setzt einen Wert ein; für Entitäten (Meldungen tragen Bezüge { id, typ, text }):
//   {ziel.akk}       Fall mit bestimmtem Artikel (Standard: nom, bestimmt)
//   {was.nom.ein}    Fall mit unbestimmtem Artikel
//   {wer.gen.ohne}   Fall ohne Artikel

export function erstelleTexte(texte, grammatik) {
  function roh(schluessel) {
    if (!(schluessel in texte)) {
      console.warn(`Text fehlt: ${schluessel}`);
      return `[${schluessel}]`;
    }
    return texte[schluessel];
  }

  function form(bezug, fall = "nom", artikel = "bestimmt") {
    const eintrag = roh(bezug.text);
    if (typeof eintrag === "string") return eintrag;
    return grammatik.nomen(eintrag, fall, artikel);
  }

  function t(schluessel, werte = {}) {
    const vorlage = roh(schluessel);
    return String(vorlage).replace(/\{(\w+)(?:\.(\w+))?(?:\.(\w+))?\}/g, (_, name, fall, artikel) => {
      const w = werte[name];
      if (w === undefined || w === null) return "";
      if (typeof w === "object" && w.text) return form(w, fall, artikel);
      return String(w);
    });
  }

  return { t, form, hat: (s) => s in texte };
}

export function satzanfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
