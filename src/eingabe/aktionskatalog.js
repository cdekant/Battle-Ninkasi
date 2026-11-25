// Aktionskatalog (siehe docs/Bedienung.md, Eingabe, und docs/Oberflaeche.md, Tastatur): jede Aktion der Oberfläche
// einmal, mit Text, Gruppe für die Hilfe und, wenn sie zum Befehl an die Logik wird, der Vorlage des Befehls.
// Welche Taste welche Aktion auslöst, steht in eingabe/belegung.js; aus beidem entstehen Hilfe, Knöpfe der
// Bedienzeile (KNOEPFE), Befehlszeile (eingabe/befehlszeile.js) und die Tastenbelegung im Einstellungsfenster.
//   id: { text, gruppe, befehl?, knopf?, platz? }
//   gruppe: bewegen, handeln, schnellleiste, ablaeufe, fenster, anzeige (Reihenfolge der Hilfe: GRUPPEN)
//   knopf:  kurzes Wort auf dem Knopf der Bedienzeile (Sprachschlüssel)
//   platz:  Stelle in der Schnellleiste (0 bis 9), siehe eingabe/schnellleiste.js
//   leiste: Nummer der Leiste (0 bis 4), auf die die Aktion umschaltet
//   ohneTaste: hat in der Vorgabe keine Taste (erreichbar über Spielmenü und Befehlszeile), belegbar im Einstellungsfenster
// Aktionen ohne befehl wertet src/main.js aus (Fenster öffnen, Zoom, Abläufe); die Logik kennt sie nicht.

export const GRUPPEN = ["bewegen", "handeln", "schnellleiste", "ablaeufe", "fenster", "anzeige"];

// Knöpfe der Bedienzeile in zwei Reihen zu je vier, in dieser Reihenfolge (docs/Oberflaeche.md, Bedienzeile)
export const KNOEPFE = ["inventar", "faehigkeiten", "charakter", "karte", "rasten", "erkunden", "hilfe", "abbrechen"];

export const PLAETZE_DER_LEISTE = 10;
const ANZAHL_LEISTEN_IM_KATALOG = 5; // wie ANZAHL_LEISTEN in eingabe/schnellleiste.js (dort importiert dieses Modul)

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
  fallenlassen_waehlen: { text: "aktion.fallenlassen_waehlen", gruppe: "handeln" }, // Inventar mit Absicht (eingabe/inventar.js)
  werfen_waehlen: { text: "aktion.werfen_waehlen", gruppe: "handeln" },
  fernangriff: { text: "aktion.fernangriff", gruppe: "handeln" }, // Zielmodus zum Schießen oder Werfen (eingabe/fernangriff.js)
  nachladen: { text: "aktion.nachladen", gruppe: "handeln", befehl: { art: "nachladen" } },
  brauen: { text: "aktion.brauen", gruppe: "handeln" }, // Braufenster am Kessel (eingabe/brauen.js)
  ...Object.fromEntries(Array.from({ length: PLAETZE_DER_LEISTE }, (_, platz) => [`schnellplatz_${platz + 1}`, { text: "aktion.schnellplatz", gruppe: "schnellleiste", platz }])),
  ...Object.fromEntries(Array.from({ length: ANZAHL_LEISTEN_IM_KATALOG }, (_, leiste) => [`leiste_${leiste + 1}`, { text: "aktion.leiste", gruppe: "schnellleiste", leiste }])),
  rasten: { text: "aktion.rasten", gruppe: "ablaeufe", knopf: "knopf.rasten" },
  erkunden: { text: "aktion.erkunden", gruppe: "ablaeufe", knopf: "knopf.erkunden" },
  autokampf: { text: "aktion.autokampf", gruppe: "ablaeufe" }, // nur in der Arena: Ninkasi kämpft nach der Taktik (eingabe/arenakampf.js)
  abbrechen: { text: "aktion.abbrechen", gruppe: "ablaeufe", knopf: "knopf.menue" }, // Esc-Kette (eingabe/esckette.js)
  inventar: { text: "aktion.inventar", gruppe: "fenster", knopf: "knopf.inventar" },
  faehigkeiten: { text: "aktion.faehigkeiten", gruppe: "fenster", knopf: "knopf.faehigkeiten" },
  charakter: { text: "aktion.charakter", gruppe: "fenster", knopf: "knopf.charakter" },
  verlauf: { text: "aktion.verlauf", gruppe: "fenster", knopf: "knopf.verlauf" },
  karte: { text: "aktion.karte", gruppe: "fenster", knopf: "knopf.karte" },
  hilfe: { text: "aktion.hilfe", gruppe: "fenster", knopf: "knopf.hilfe" },
  befehlszeile: { text: "aktion.befehlszeile", gruppe: "fenster" }, // eingabe/befehlszeile.js
  einstellungen: { text: "aktion.einstellungen", gruppe: "fenster", ohneTaste: true }, // eingabe/einstellungsfenster.js
  zoom_rein: { text: "aktion.zoom_rein", gruppe: "anzeige" },
  zoom_raus: { text: "aktion.zoom_raus", gruppe: "anzeige" },
  neustart: { text: "aktion.neustart", gruppe: "anzeige" },
};

// Aktion einer Taste nach der Belegung: mit Umschalt zuerst umschaltTasten, dann das Zeichen (KeyboardEvent.key, für
// Zeichen ohne feste Lage wie ?), dann die physische Taste (KeyboardEvent.code), zuletzt die weiteren Tasten;
// null, wenn nichts belegt ist
export function aktionDerTaste(belegung, tastencode, zeichen, umschalt = false) {
  if (umschalt && belegung.umschaltTasten?.[tastencode]) return belegung.umschaltTasten[tastencode];
  if (typeof zeichen === "string" && belegung.zeichen?.[zeichen]) return belegung.zeichen[zeichen];
  return belegung.tasten[tastencode] ?? belegung.weitereTasten?.[tastencode] ?? null;
}

// Stelle in der Schnellleiste, auf die eine Taste ohne Umschalt zeigt (Ziffern 1 bis 0), sonst null
export function platzDerTaste(belegung, tastencode) {
  return AKTIONEN[aktionDerTaste(belegung, tastencode)]?.platz ?? null;
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
  const mitUmschalt = Object.entries(belegung.umschaltTasten || {}).filter(([, ziel]) => ziel === aktion).map(([taste]) => ({ code: taste, umschalt: true }));
  return [...zeichen, ...tasten, ...mitUmschalt];
}
