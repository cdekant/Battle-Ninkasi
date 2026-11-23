// Beschreibung der Inhalte als Daten (siehe docs/Anzeige.md, Beschreibung): Steckbriefe zu allen Einträgen aus
// daten/, ohne DOM und ohne Texte der Sprache. Gemeinsame Grundlage für das Kompendium der Entwicklung
// (werkzeuge/kompendium.html) und später Bestiarium, Lore, Bierrezepte und Bierwissen im Spiel, damit beide dasselbe
// zeigen. Gelesen werden vorbereitete Daten (Vorlagen aufgelöst, src/kern/daten.js vorbereiten).
//
// Ein Steckbrief: { art, name, text, abstrakt, zeichen, merkmale }
//   text:     Textschlüssel des Namens (Hauptwort), die Anzeige setzt ihn mit texte.nomenForm ein
//   zeichen:  Eintrag aus daten/zeichen.js oder null
//   merkmale: { feld: wert } in fester Reihenfolge; wert ist Zahl, Text, Wahrheitswert oder Liste von Texten

// Arten der Inhalte: wo die Einträge liegen und unter welchem Bereich ihre Zeichen stehen
export const ARTEN = {
  wesen: { eintraege: (daten) => daten.wesen, zeichen: "wesen" },
  gegenstaende: { eintraege: (daten) => daten.gegenstaende, zeichen: "gegenstaende" },
  gelaende: { eintraege: (daten) => daten.gelaende, zeichen: "gelaende" },
  fallen: { eintraege: (daten) => daten.fallen, zeichen: "fallen" },
  oberflaechen: { eintraege: (daten) => daten.schichten?.oberflaechen, zeichen: "schichten" },
  gase: { eintraege: (daten) => daten.schichten?.gase, zeichen: "schichten" },
  zustaende: { eintraege: (daten) => daten.zustaende },
  faehigkeiten: { eintraege: (daten) => daten.faehigkeiten },
  effekte: { eintraege: (daten) => daten.effekte },
  skills: { eintraege: (daten) => daten.skills },
  eigenschaften: { eintraege: (daten) => daten.eigenschaften },
  fraktionen: { eintraege: (daten) => daten.fraktionen },
  schadensarten: { eintraege: (daten) => daten.schadensarten },
  etiketten: { eintraege: (daten) => daten.etiketten },
  populationen: { eintraege: (daten) => daten.populationen },
  ebenen: { eintraege: (daten) => daten.ebenen },
  arenen: { eintraege: (daten) => daten.arenen },
  taktiken: { eintraege: (daten) => daten.taktiken },
};

// Felder, die jeder Steckbrief schon gesondert führt
const OHNE_MERKMAL = ["text", "abstrakt", "vorlage"];

// Namen der Einträge einer Art, in der Reihenfolge der Daten
export function eintragsnamen(daten, art) {
  return Object.keys(ARTEN[art].eintraege(daten) ?? {});
}

export function steckbrief(daten, art, name) {
  const eintrag = ARTEN[art].eintraege(daten)?.[name];
  if (!eintrag) return null;
  const zeichenBereich = ARTEN[art].zeichen;
  const besonders = { wesen: wesenMerkmale, gegenstaende: gegenstandMerkmale, effekte: effektMerkmale }[art];
  return {
    art,
    name,
    text: typeof eintrag.text === "string" ? eintrag.text : null,
    abstrakt: Boolean(eintrag.abstrakt),
    zeichen: (zeichenBereich && daten.zeichen?.[zeichenBereich]?.[name]) || null,
    merkmale: besonders ? besonders(daten, name, eintrag) : allgemeineMerkmale(eintrag),
  };
}

// Alle Felder außer Name und Vorlage; Verschachteltes als kurzes JSON
export function allgemeineMerkmale(eintrag) {
  if (Array.isArray(eintrag)) return { eintraege: eintrag.map(kurz) };
  const merkmale = {};
  for (const [feld, wert] of Object.entries(eintrag)) {
    if (!OHNE_MERKMAL.includes(feld)) merkmale[feld] = einfach(wert) ? wert : kurz(wert);
  }
  return merkmale;
}

const einfach = (wert) => ["number", "string", "boolean"].includes(typeof wert);
const kurz = (wert) => (einfach(wert) ? String(wert) : JSON.stringify(wert));
const ohneLeeres = (merkmale) => Object.fromEntries(Object.entries(merkmale).filter(([, wert]) => wert !== undefined && !(Array.isArray(wert) && wert.length === 0)));

// Angriffsprofil kurz: "biss 70 % → biss_klein", Kosten nur, wenn sie von 100 abweichen
export function angriffKurz(profil) {
  const kosten = profil.kosten !== undefined && profil.kosten !== 100 ? `, ${profil.kosten} Zeit` : "";
  return `${profil.name} ${profil.genauigkeit} % → ${profil.effekt}${kosten}`;
}

// Modifikator kurz: "ruestung +2", "regeneration.lp +20 %", mit Bedingung "(wenn traegt_tag)"
export function modifikatorKurz(modifikator) {
  const vorzeichen = modifikator.betrag >= 0 ? "+" : "";
  const prozent = modifikator.art === "prozent" ? " %" : "";
  const bedingung = modifikator.wenn?.length ? ` (wenn ${modifikator.wenn.map((teil) => teil.bedingung).join(", ")})` : "";
  return `${modifikator.ziel} ${vorzeichen}${modifikator.betrag}${prozent}${bedingung}`;
}

// Schritt eines Effekts kurz: "schaden art=saeure wuerfel=1W4"
export function schrittKurz(schritt) {
  const angaben = Object.entries(schritt).filter(([feld]) => feld !== "baustein").map(([feld, wert]) => `${feld}=${einfach(wert) ? wert : JSON.stringify(wert)}`);
  return [schritt.baustein, ...angaben].join(" ");
}

// Wo ein Wesen vorkommt: Populationen mit Tiefe und Arenen, z.B. "keller 1–3", "arena fernkaempfer"
export function vorkommenVon(daten, typ) {
  const orte = [];
  for (const [tabelle, eintraege] of Object.entries(daten.populationen ?? {})) {
    for (const eintrag of eintraege) {
      if (eintrag.typ !== typ) continue;
      const [von, bis] = eintrag.tiefe ?? [];
      orte.push(von === undefined ? tabelle : `${tabelle} ${von === bis ? von : `${von}–${bis}`}`);
    }
  }
  for (const [name, arena] of Object.entries(daten.arenen ?? {})) {
    if (JSON.stringify(arena).includes(`"typ":"${typ}"`)) orte.push(`arena ${name}`);
  }
  return orte;
}

function wesenMerkmale(daten, name, wesen) {
  const werte = Object.entries(wesen.werte ?? {}).map(([wert, angaben]) => `${wert} ${angaben.grundwert ?? angaben.anfangswert}`);
  return ohneLeeres({
    fraktion: wesen.fraktion,
    werte,
    ep: wesen.ep,
    angriffe: (wesen.angriffe ?? []).map(angriffKurz),
    faehigkeiten: wesen.faehigkeiten ?? [],
    kampfwerte: Object.entries(wesen.kampfwerte ?? {}).map(([wert, punkte]) => `${wert} ${punkte}`),
    widerstaende: Object.entries(wesen.widerstaende ?? {}).map(([art, punkte]) => `${art} ${punkte}`),
    immun: wesen.immun ?? [],
    sicht: wesen.sicht?.reichweite,
    bewegung: wesen.bewegung,
    verhalten: wesen.ki?.modul,
    ausstattung: (wesen.ausstattung ?? []).map((teil) => (teil.anzahl > 1 ? `${teil.anzahl} ${teil.typ}` : teil.typ)),
    tags: wesen.tags ?? [],
    vorkommen: vorkommenVon(daten, name),
  });
}

function gegenstandMerkmale(daten, name, gegenstand) {
  const ausruestung = gegenstand.ausruestung;
  return ohneLeeres({
    gewicht: gegenstand.gewicht,
    platz: ausruestung ? `${ausruestung.platz}${ausruestung.belegt > 1 ? ` ×${ausruestung.belegt}` : ""}` : undefined,
    angriffe: (ausruestung?.angriffe ?? []).map(angriffKurz),
    modifikatoren: (ausruestung?.modifikatoren ?? []).map(modifikatorKurz),
    trinkbar: gegenstand.trinkbar?.effekt,
    wurf: gegenstand.wurf?.effekt,
    zweck: [...(gegenstand.trinkbar?.zweck ?? []), ...(gegenstand.wurf?.zweck ?? [])],
    stapelbar: gegenstand.stapelbar,
    ladungen: gegenstand.ladungen?.hoechstens,
    haltbarkeit: gegenstand.haltbarkeit ? `${gegenstand.haltbarkeit.hoechstens} → ${gegenstand.haltbarkeit.wirdZu ?? "nichts"}` : undefined,
    wirdZu: gegenstand.wirdZu,
    verdirbt: gegenstand.verdirbt ? `nach ${gegenstand.verdirbt.nach} → ${gegenstand.verdirbt.wird}` : undefined,
    tags: gegenstand.tags ?? [],
  });
}

function effektMerkmale(daten, name, effekt) {
  const { schritte, ...uebrige } = effekt;
  return { schritte: (schritte ?? []).map(schrittKurz), ...allgemeineMerkmale(uebrige) };
}
