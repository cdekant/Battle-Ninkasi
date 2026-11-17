// Textzugriff für die Anzeige: Schlüssel nachschlagen, Platzhalter füllen.
// {menge} setzt einen Wert ein, {quelle.nom} die Form "nom" des Textes einer Entität
// (Meldungen tragen Bezüge { id, typ, text }).

export function erstelleTexte(texte) {
  function roh(schluessel) {
    if (!(schluessel in texte)) {
      console.warn(`Text fehlt: ${schluessel}`);
      return `[${schluessel}]`;
    }
    return texte[schluessel];
  }

  function form(bezug, fall = "name") {
    const formen = roh(bezug.text);
    if (typeof formen === "string") return formen;
    return formen[fall] ?? formen.name;
  }

  function t(schluessel, werte = {}) {
    const vorlage = roh(schluessel);
    return String(vorlage).replace(/\{(\w+)(?:\.(\w+))?\}/g, (_, name, fall) => {
      const w = werte[name];
      if (w === undefined || w === null) return "";
      if (typeof w === "object" && w.text) return form(w, fall);
      return String(w);
    });
  }

  return { t, form, hat: (s) => s in texte };
}

export function satzanfang(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
