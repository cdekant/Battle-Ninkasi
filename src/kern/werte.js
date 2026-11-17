// Werte (LP, MP, PP und weitere) als erweiterbarer Satz, berechnet aus Grundwert und Modifikatoren.
// Wert in der Entität:   werte: { lp: { grund: 100, aktuell: 100, speicher: 0 } }
//   speicher: Bruchteile in Hundertsteln, ein voller Punkt wird gutgeschrieben
// Modifikator:           { ziel: "lp" | "kosten.bewegen" | "kosten.alle" | ..., art: "plus" | "prozent", betrag, quelle }
// Verrechnung vorläufig: alle Plus-Werte und alle Prozente addieren, Prozente vom Grundwert.

// Einheitliche Rundung für Prozentrechnung
export function prozentVon(wert, prozent) {
  return Math.round((wert * prozent) / 100);
}

// Wendet alle Modifikatoren mit einem der Ziele auf einen Basiswert an
export function modifiziert(ent, ziele, basis) {
  const liste = Array.isArray(ziele) ? ziele : [ziele];
  let plus = 0, prozent = 0;
  for (const m of ent.modifikatoren || []) {
    if (!liste.includes(m.ziel)) continue;
    if (m.art === "plus") plus += m.betrag;
    else if (m.art === "prozent") prozent += m.betrag;
  }
  return basis + plus + prozentVon(basis, prozent);
}

export function hatWert(ent, name) {
  return Boolean(ent.werte && ent.werte[name]);
}

export function maximum(ent, name) {
  return modifiziert(ent, name, ent.werte[name].grund);
}

export function aktuell(ent, name) {
  return ent.werte[name].aktuell;
}

// Ändert einen Wert innerhalb 0 bis Maximum, gibt die tatsächliche Änderung zurück
export function aendern(ent, name, delta) {
  const w = ent.werte[name];
  const vorher = w.aktuell;
  w.aktuell = Math.max(0, Math.min(maximum(ent, name), vorher + delta));
  return w.aktuell - vorher;
}

// Änderung in Hundertsteln über den Speicher; gibt die Änderung in vollen Punkten zurück
export function aendernHundertstel(ent, name, hundertstel) {
  const w = ent.werte[name];
  w.speicher = (w.speicher || 0) + hundertstel;
  const voll = Math.trunc(w.speicher / 100);
  w.speicher -= voll * 100;
  const geaendert = voll !== 0 ? aendern(ent, name, voll) : 0;
  // am Anschlag keinen Rest ansammeln
  if ((w.aktuell >= maximum(ent, name) && w.speicher > 0) || (w.aktuell <= 0 && w.speicher < 0)) w.speicher = 0;
  return geaendert;
}

export function modifikatorHinzufuegen(ent, modifikator) {
  if (!ent.modifikatoren) ent.modifikatoren = [];
  ent.modifikatoren.push(modifikator);
}

// Entfällt eine Quelle, entfallen genau ihre Modifikatoren
export function modifikatorenEntfernen(ent, quelle) {
  if (ent.modifikatoren) ent.modifikatoren = ent.modifikatoren.filter((m) => m.quelle !== quelle);
}

// Erzeugt den Wertesatz einer Entität aus Daten: { lp: { grund: 100, start?: 100 } }
export function ausDaten(wertedaten) {
  const werte = {};
  for (const [name, d] of Object.entries(wertedaten || {})) {
    werte[name] = { grund: d.grund, aktuell: d.start ?? d.grund, speicher: 0 };
  }
  return werte;
}
