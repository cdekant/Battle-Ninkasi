// Aktionskatalog (siehe docs/Architektur.md, Eingabe, und docs/Oberflaeche.md, Tastatur): jede Aktion der Oberfläche
// einmal, mit Text, Gruppe für die Hilfe und, wenn sie zum Befehl an die Logik wird, der Vorlage des Befehls.
// Welche Taste welche Aktion auslöst, steht in eingabe/belegung.js; aus beidem entstehen Hilfe, Knöpfe der
// Bedienzeile (KNOEPFE), später Befehlszeile und die Seite zur Tastenbelegung.
//   id: { text, gruppe, befehl?, knopf?, platz? }
//   gruppe: bewegen, handeln, schnellleiste, ablaeufe, fenster, anzeige (Reihenfolge der Hilfe: GRUPPEN)
//   knopf:  kurzes Wort auf dem Knopf der Bedienzeile (Sprachschlüssel)
//   platz:  Stelle in der Schnellleiste (0 bis 9), siehe eingabe/schnellleiste.js
// Aktionen ohne befehl wertet src/main.js aus (Fenster öffnen, Zoom, Abläufe); die Logik kennt sie nicht.

export const GRUPPEN = ["bewegen", "handeln", "schnellleiste", "ablaeufe", "fenster", "anzeige"];

// Knöpfe der Bedienzeile in zwei Reihen zu je vier, in dieser Reihenfolge (docs/Oberflaeche.md, Bedienzeile)
export const KNOEPFE = ["inventar", "faehigkeiten", "charakter", "verlauf", "rasten", "erkunden", "hilfe", "abbrechen"];

export const PLAETZE_DER_LEISTE = 10;

const bewegen = (dx, dy) => ({ art: "bewegen", dx, dy });

export const AKTIONEN = {
  bewegen_nw: { text: "aktion.bewegen_nw", gruppe: "bewegen", befehl: bewegen(-1, -1) },
  bewegen_n: { text: "aktion.bewegen_n", gruppe: "bewegen", befehl: bewegen(0, -1) },
  bewegen_no: { text: "aktion.bewegen_no", gruppe: "bewegen", befehl: bewegen(1, -1) },
  bewegen_w: { text: "aktion.bewegen_w", gruppe: "bewegen", befehl: bewegen(-1, 0) },
  bewegen_o: { text: "aktion.bewegen_o", gruppe: "bewegen", befehl: bewegen(1, 0) },
  bewegen_sw: { text: "aktion.bewegen_sw", gruppe: "bewegen", befehl: bewegen(-1, 1) },
  bewegen_s: { text: "aktion.bewegen_s", gruppe: "bewegen", befehl: bewegen(0, 1) },
  bewegen_so: { text: "aktion.bewegen_so", gruppe: "bewegen", befehl: bewegen(1, 1) },
  laufen: { text: "aktion.laufen", gruppe: "bewegen" }, // Umschalt plus Richtung (belegung.umschaltBewegen), eingabe/laufen.js
  warten: { text: "aktion.warten", gruppe: "bewegen", befehl: { art: "warten" } },
  treppe: { text: "aktion.treppe", gruppe: "bewegen", befehl: { art: "treppe" } },
  aufheben: { text: "aktion.aufheben", gruppe: "handeln", befehl: { art: "aufheben" } },
  trinken: { text: "aktion.trinken", gruppe: "handeln", befehl: { art: "trinken" } }, // Gegenstand wählt die Eingabe
  fortsetzen: { text: "aktion.fortsetzen", gruppe: "handeln", befehl: { art: "fortsetzen" } },
  untersuchen: { text: "aktion.untersuchen", gruppe: "handeln" },
  ...Object.fromEntries(Array.from({ length: PLAETZE_DER_LEISTE }, (_, platz) => [`schnellplatz_${platz + 1}`, { text: "aktion.schnellplatz", gruppe: "schnellleiste", platz }])),
  rasten: { text: "aktion.rasten", gruppe: "ablaeufe", knopf: "knopf.rasten" },
  erkunden: { text: "aktion.erkunden", gruppe: "ablaeufe", knopf: "knopf.erkunden" },
  abbrechen: { text: "aktion.abbrechen", gruppe: "ablaeufe", knopf: "knopf.menue" }, // Esc-Kette (eingabe/esckette.js)
  inventar: { text: "aktion.inventar", gruppe: "fenster", knopf: "knopf.inventar" },
  faehigkeiten: { text: "aktion.faehigkeiten", gruppe: "fenster", knopf: "knopf.faehigkeiten" },
  charakter: { text: "aktion.charakter", gruppe: "fenster", knopf: "knopf.charakter" },
  verlauf: { text: "aktion.verlauf", gruppe: "fenster", knopf: "knopf.verlauf" },
  hilfe: { text: "aktion.hilfe", gruppe: "fenster", knopf: "knopf.hilfe" },
  zoom_rein: { text: "aktion.zoom_rein", gruppe: "anzeige" },
  zoom_raus: { text: "aktion.zoom_raus", gruppe: "anzeige" },
  neustart: { text: "aktion.neustart", gruppe: "anzeige" },
};

// Aktion einer Taste nach der Belegung: erst das Zeichen (KeyboardEvent.key, für Zeichen ohne feste Lage wie ?),
// dann die physische Taste (KeyboardEvent.code), zuletzt die weiteren Tasten; null, wenn nichts belegt ist
export function aktionDerTaste(belegung, tastencode, zeichen) {
  if (typeof zeichen === "string" && belegung.zeichen?.[zeichen]) return belegung.zeichen[zeichen];
  return belegung.tasten[tastencode] ?? belegung.weitereTasten?.[tastencode] ?? null;
}

// Vorlage des Befehls einer Aktion (eine Kopie) oder null
export function befehlDerAktion(aktion) {
  const vorlage = AKTIONEN[aktion]?.befehl;
  return vorlage ? structuredClone(vorlage) : null;
}

// Die angezeigten Tasten einer Aktion: Zeichen und Tasten der Belegung, ohne die weiteren Tasten;
// die Aktion für Umschalt plus Richtung zeigt die Pseudotaste { code: "UmschaltRichtung" }
export function tastenDerAktion(belegung, aktion) {
  if (aktion === belegung.umschaltBewegen) return [{ code: "UmschaltRichtung" }];
  const zeichen = Object.entries(belegung.zeichen || {}).filter(([, ziel]) => ziel === aktion).map(([taste]) => ({ zeichen: taste }));
  const tasten = Object.entries(belegung.tasten).filter(([, ziel]) => ziel === aktion).map(([taste]) => ({ code: taste }));
  return [...zeichen, ...tasten];
}
