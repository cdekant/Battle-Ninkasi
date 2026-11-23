// Zusammenführen von Inhaltsdaten: ein Zusatz (Probeinhalt, später Mods) kommt zu einem Grundstock
// (siehe docs/Architektur.md, Inhalte als Daten). Rein und ohne Importe, damit das Laden der Inhalte keine
// Systeme anmeldet und die Reihenfolge der Register unberührt bleibt.
//
// zusatz: {
//   eintraege?: { <sammlung>: { <name>: eintrag } }   neue Einträge; ein Name, den der Grundstock schon hat, ist ein Fehler
//   ergaenzen?: { <sammlung>: { <name>: felder } }    Felder für vorhandene Einträge, flach überschrieben
//   abfolge?, starttiefe?                              ersetzen die des Grundstocks
// }
// Verschachtelte Sammlungen (eine Ebene tiefer benannt) sind schichten und zeichen.

const VERSCHACHTELT = ["schichten", "zeichen"];
const ERSETZBAR = ["abfolge", "starttiefe"];

const istObjekt = (wert) => wert !== null && typeof wert === "object" && !Array.isArray(wert);

// Fügt die Einträge einer Sammlung hinzu und merkt doppelte Namen
function sammlungZusammenfuegen(grundsammlung, zusatzsammlung, ort, fehler) {
  const ergebnis = { ...grundsammlung };
  for (const [name, eintrag] of Object.entries(zusatzsammlung)) {
    if (name in ergebnis) fehler.push(`${ort}.${name} gibt es schon`);
    else ergebnis[name] = eintrag;
  }
  return ergebnis;
}

export function datenZusammenfuegen(grundstock, zusatz) {
  const fehler = [];
  const ergebnis = structuredClone(grundstock);

  for (const [sammlung, inhalt] of Object.entries(zusatz.eintraege ?? {})) {
    if (!istObjekt(inhalt) || !istObjekt(ergebnis[sammlung])) {
      fehler.push(`eintraege.${sammlung}: keine Sammlung des Grundstocks`);
      continue;
    }
    if (VERSCHACHTELT.includes(sammlung)) {
      for (const [teil, teilinhalt] of Object.entries(inhalt)) {
        ergebnis[sammlung][teil] = sammlungZusammenfuegen(ergebnis[sammlung][teil] ?? {}, structuredClone(teilinhalt), `${sammlung}.${teil}`, fehler);
      }
    } else {
      ergebnis[sammlung] = sammlungZusammenfuegen(ergebnis[sammlung], structuredClone(inhalt), sammlung, fehler);
    }
  }

  for (const [sammlung, namen] of Object.entries(zusatz.ergaenzen ?? {})) {
    for (const [name, felder] of Object.entries(namen)) {
      const eintrag = ergebnis[sammlung]?.[name];
      if (!istObjekt(eintrag)) fehler.push(`ergaenzen.${sammlung}.${name}: kein Eintrag des Grundstocks`);
      else Object.assign(eintrag, structuredClone(felder));
    }
  }

  for (const schluessel of ERSETZBAR) {
    if (schluessel in zusatz) ergebnis[schluessel] = structuredClone(zusatz[schluessel]);
  }
  for (const schluessel of Object.keys(zusatz)) {
    if (!["eintraege", "ergaenzen", ...ERSETZBAR].includes(schluessel)) fehler.push(`${schluessel}: unbekannter Teil eines Zusatzes`);
  }

  if (fehler.length) throw new Error(`Zusatz passt nicht zum Grundstock:\n${fehler.join("\n")}`);
  return ergebnis;
}

// Die Namen eines Zusatzes je Sammlung (verschachtelt als "schichten.gase" usw.), z.B. für das Kompendium
export function namenDesZusatzes(zusatz) {
  const namen = {};
  for (const [sammlung, inhalt] of Object.entries(zusatz.eintraege ?? {})) {
    if (VERSCHACHTELT.includes(sammlung)) {
      for (const [teil, teilinhalt] of Object.entries(inhalt)) namen[`${sammlung}.${teil}`] = Object.keys(teilinhalt);
    } else {
      namen[sammlung] = Object.keys(inhalt);
    }
  }
  return namen;
}
