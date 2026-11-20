// Aktionskatalog (siehe docs/Architektur.md, Eingabe, und docs/Oberflaeche.md, Tastatur): jede Aktion der Oberfläche
// einmal, mit Text, Gruppe für die Hilfe und, wenn sie zum Befehl an die Logik wird, der Vorlage des Befehls.
// Welche Taste welche Aktion auslöst, steht in eingabe/belegung.js; aus beidem entstehen Hilfe, später Knöpfe,
// Befehlszeile und die Seite zur Tastenbelegung.
//   id: { text, gruppe, befehl? }
//   gruppe: bewegen, handeln, ablaeufe, fenster, anzeige (Reihenfolge der Hilfe: GRUPPEN)
// Aktionen ohne befehl wertet src/main.js aus (Fenster öffnen, Zoom, Abläufe); die Logik kennt sie nicht.

export const GRUPPEN = ["bewegen", "handeln", "ablaeufe", "fenster", "anzeige"];

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
  warten: { text: "aktion.warten", gruppe: "bewegen", befehl: { art: "warten" } },
  treppe: { text: "aktion.treppe", gruppe: "bewegen", befehl: { art: "treppe" } },
  aufheben: { text: "aktion.aufheben", gruppe: "handeln", befehl: { art: "aufheben" } },
  trinken: { text: "aktion.trinken", gruppe: "handeln", befehl: { art: "trinken" } }, // Gegenstand wählt die Eingabe
  fortsetzen: { text: "aktion.fortsetzen", gruppe: "handeln", befehl: { art: "fortsetzen" } },
  untersuchen: { text: "aktion.untersuchen", gruppe: "handeln" },
  rasten: { text: "aktion.rasten", gruppe: "ablaeufe" },
  erkunden: { text: "aktion.erkunden", gruppe: "ablaeufe" },
  abbrechen: { text: "aktion.abbrechen", gruppe: "ablaeufe" },
  inventar: { text: "aktion.inventar", gruppe: "fenster" },
  faehigkeiten: { text: "aktion.faehigkeiten", gruppe: "fenster" },
  charakter: { text: "aktion.charakter", gruppe: "fenster" },
  hilfe: { text: "aktion.hilfe", gruppe: "fenster" },
  zoom_rein: { text: "aktion.zoom_rein", gruppe: "anzeige" },
  zoom_raus: { text: "aktion.zoom_raus", gruppe: "anzeige" },
  log_umschalten: { text: "aktion.log_umschalten", gruppe: "anzeige" },
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

// Die angezeigten Tasten einer Aktion: Zeichen und Tasten der Belegung, ohne die weiteren Tasten
export function tastenDerAktion(belegung, aktion) {
  const zeichen = Object.entries(belegung.zeichen || {}).filter(([, ziel]) => ziel === aktion).map(([taste]) => ({ zeichen: taste }));
  const tasten = Object.entries(belegung.tasten).filter(([, ziel]) => ziel === aktion).map(([taste]) => ({ code: taste }));
  return [...zeichen, ...tasten];
}
