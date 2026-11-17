// Grammatik: bildet Hauptwörter mit Artikel aus den Regeln einer Sprache (sprache/<code>/grammatik.js).
// Hauptwort in der Sprachdatei:
//   { geschlecht: "n", eigenname?: true, einzahl: { nom, gen, dat, akk } }
// Artikelart: "bestimmt" (Standard), "ein" (unbestimmt), "ohne". Eigennamen stehen immer ohne Artikel.
// Für Sprachen mit Sonderregeln (z.B. englisch a/an) kommt später eigener Code dazu.

export function erstelleGrammatik(regeln) {
  function nomen(eintrag, fall = "nom", artikel = "bestimmt") {
    const wort = eintrag.einzahl[fall] ?? eintrag.einzahl.nom;
    if (eintrag.eigenname || artikel === "ohne") return wort;
    const tabelle = regeln.artikel[artikel];
    if (!tabelle) return wort;
    return `${tabelle[eintrag.geschlecht][fall]} ${wort}`;
  }

  // Prüft ein Hauptwort, gibt eine Liste von Fehlern zurück
  function pruefen(eintrag, ort) {
    const fehler = [];
    if (!eintrag || typeof eintrag !== "object") return [`${ort}: Text muss ein Hauptwort mit Formen sein`];
    if (!regeln.geschlechter.includes(eintrag.geschlecht)) fehler.push(`${ort}: geschlecht muss eines von ${regeln.geschlechter.join(", ")} sein`);
    for (const fall of regeln.faelle) {
      if (typeof eintrag.einzahl?.[fall] !== "string") fehler.push(`${ort}: einzahl.${fall} fehlt`);
    }
    return fehler;
  }

  return { nomen, pruefen, artikelarten: [...Object.keys(regeln.artikel), "ohne"], faelle: regeln.faelle };
}
