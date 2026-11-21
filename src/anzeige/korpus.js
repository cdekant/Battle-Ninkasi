// Korpus zur Laufzeit (siehe docs/Texte.md, Korpus): liest Korpustexte (YAML-Kopf im Pandoc-Stil, Zeile = Vers,
// Leerzeile = Strophe, Sprecherrollen als "(Hausherr:)" am Zeilenanfang) und zerlegt sie in Sätze. Ohne DOM; die
// Texte holt src/main.js mit fetch nach der Liste in sprache/<sprache>/korpus/index.js.
// Erster Nutzer ist der wechselnde Spruch im Titel; Bücher und Markow-Ketten können später dieselbe Zerlegung nehmen.

// Text einer Korpusdatei: { name, kopf: { titel, art, vorlage, quelle, lizenz }, strophen: [[vers]] }
export function korpustextZerlegen(name, text) {
  const zeilen = text.replace(/\r/g, "").split("\n");
  const kopf = {};
  let stelle = 0;
  if (zeilen[0] === "---") {
    stelle = 1;
    while (stelle < zeilen.length && zeilen[stelle] !== "---") {
      const treffer = /^([a-z]+):\s*(.*)$/.exec(zeilen[stelle]);
      if (treffer) kopf[treffer[1]] = treffer[2];
      stelle++;
    }
    stelle++;
  }
  const strophen = [];
  let strophe = [];
  for (const zeile of zeilen.slice(stelle)) {
    const vers = zeile.replace(/^\([^)]*:\)\s*/, "").replace(/"/g, "").trim();
    if (vers) strophe.push(vers);
    else if (strophe.length) {
      strophen.push(strophe);
      strophe = [];
    }
  }
  if (strophe.length) strophen.push(strophe);
  return { name, kopf, strophen };
}

// Sätze eines Korpustexts: [{ verse, titel }]; ein Satz endet mit einem Vers auf . ! ? oder mit der Strophe. Längere
// Sätze gehen als Ausschnitt ihrer ersten zwei Verse ein (Hymnen wiederholen ihr erstes Verspaar), ein Komma am Ende
// wird dann zu "…"; Sätze mit Lücken der Überlieferung ("...") fallen weg
export const AUSSCHNITT_VERSE = 2;
export function saetzeAus(korpustext, hoechstensVerse = 3) {
  const saetze = [];
  const titel = korpustext.kopf.titel ?? korpustext.name;
  for (const strophe of korpustext.strophen) {
    let satz = [];
    for (const [nummer, vers] of strophe.entries()) {
      satz.push(vers);
      if (!/[.!?]$/.test(vers) && nummer < strophe.length - 1) continue;
      if (!satz.some((teil) => teil.includes("..."))) {
        if (satz.length <= hoechstensVerse) saetze.push({ verse: satz, titel });
        else {
          const ausschnitt = satz.slice(0, AUSSCHNITT_VERSE);
          ausschnitt[ausschnitt.length - 1] = ausschnitt.at(-1).replace(/[,;:]$/, "…");
          saetze.push({ verse: ausschnitt, titel });
        }
      }
      satz = [];
    }
  }
  return saetze;
}

// Ein Spruch aus allen Korpustexten oder null; zufallszahl in [0, 1) (kosmetisch, nicht der Spiel-Zufall)
export function spruchWaehlen(korpustexte, zufallszahl) {
  const saetze = korpustexte.flatMap((korpustext) => saetzeAus(korpustext));
  return saetze.length ? saetze[Math.floor(zufallszahl * saetze.length)] : null;
}
