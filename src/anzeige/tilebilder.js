// Tilebilder: baut aus den Pixeldaten in grafik/ die Bilder für den Renderer.
// Reine Funktionen (passendeSaetze, pixelZuRgba, tilesetPruefen) laufen auch in Node und werden getestet;
// erst tilebilderErstellen braucht den Browser (Canvas).
// Ein Satz ist eine Kantenlänge in Pixeln (64, 48, 32, 16); scharf bleibt ein Satz nur in ganzzahligen Vielfachen.

import { quellenangabeFehler } from "./quellenangabe.js";

// Quellenangabe eines Tiles (grafik/quellenangabe.js): die eigene des Tiles, sonst die seines Satzes, sonst die
// Vorgabe; null, wenn es das Tile nicht gibt oder nichts gilt
export function tileQuellenangabe(tileset, satzGroesse, name) {
  const tile = tileset.saetze[satzGroesse]?.[name];
  if (!tile) return null;
  return tile.quellenangabe ?? tileset.quellenangabe?.saetze?.[satzGroesse] ?? tileset.quellenangabe?.vorgabe ?? null;
}

// Sätze, die zur Zoomstufe scharf passen (Zoom ist ganzzahliges Vielfaches), der größte zuerst;
// fehlt einem Satz ein Tile, kommt der nächste dran, zuletzt ein Zeichen
export function passendeSaetze(satzGroessen, zoom) {
  return satzGroessen
    .filter((satzGroesse) => satzGroesse <= zoom && zoom % satzGroesse === 0)
    .sort((erste, zweite) => zweite - erste);
}

function hexZuRgb(hex) {
  const zahl = parseInt(hex.slice(1), 16);
  return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
}

// Wandelt eine Pixelmatrix in RGBA-Daten (wie ImageData.data); durchsichtige Pixel bleiben 0
export function pixelZuRgba(tile, palette) {
  const farbeNachZeichen = new Map(palette.farben.map((farbe) => [farbe.zeichen, hexZuRgb(farbe.hex)]));
  const rgba = new Uint8ClampedArray(tile.groesse * tile.groesse * 4);
  tile.pixel.forEach((zeile, y) => {
    for (let x = 0; x < tile.groesse; x++) {
      const zeichen = zeile[x];
      if (zeichen === palette.durchsichtig) continue;
      rgba.set([...farbeNachZeichen.get(zeichen), 255], (y * tile.groesse + x) * 4);
    }
  });
  return rgba;
}

// Prüft das Tileset; gibt eine Liste von Fehlermeldungen zurück (leer, wenn alles stimmt); jedes Tile braucht eine
// gültige Quellenangabe (texte, wahlweise, prüft auch die Anteile)
export function tilesetPruefen(tileset, { texte = null } = {}) {
  const fehler = [];
  const zeichenDerPalette = new Set(tileset.palette.farben.map((farbe) => farbe.zeichen));
  if (zeichenDerPalette.size !== tileset.palette.farben.length) fehler.push("palette: Zeichen doppelt vergeben");
  if (zeichenDerPalette.has(tileset.palette.durchsichtig)) fehler.push("palette: Zeichen für durchsichtig ist zugleich eine Farbe");
  const angabenPruefen = (ort, angabe) => fehler.push(...quellenangabeFehler(angabe, { texte }).map((meldung) => `${ort}: ${meldung}`));
  if (tileset.quellenangabe?.vorgabe) angabenPruefen("quellenangabe.vorgabe", tileset.quellenangabe.vorgabe);
  for (const [satzGroesse, angabe] of Object.entries(tileset.quellenangabe?.saetze ?? {})) angabenPruefen(`quellenangabe.saetze.${satzGroesse}`, angabe);
  for (const [satzGroesseText, satz] of Object.entries(tileset.saetze)) {
    const satzGroesse = Number(satzGroesseText);
    for (const [name, tile] of Object.entries(satz)) {
      const ort = `tiles/${satzGroesse}/${name}`;
      if (tile.quellenangabe) angabenPruefen(ort, tile.quellenangabe);
      else if (!tileQuellenangabe(tileset, satzGroesse, name)) fehler.push(`${ort}: ohne Quellenangabe`);
      if (tile.groesse !== satzGroesse) fehler.push(`${ort}: groesse ${tile.groesse} passt nicht zum Satz ${satzGroesse}`);
      if (tile.pixel.length !== tile.groesse) fehler.push(`${ort}: ${tile.pixel.length} statt ${tile.groesse} Zeilen`);
      tile.pixel.forEach((zeile, y) => {
        if (zeile.length !== tile.groesse) fehler.push(`${ort}: Zeile ${y} hat ${zeile.length} statt ${tile.groesse} Zeichen`);
        for (const zeichen of new Set(zeile)) {
          if (zeichen !== tileset.palette.durchsichtig && !zeichenDerPalette.has(zeichen)) {
            fehler.push(`${ort}: Zeile ${y} enthält unbekanntes Zeichen "${zeichen}"`);
          }
        }
      });
    }
  }
  return fehler;
}

// Browser: baut je Satz und Tile ein Canvas in Originalgröße; der Renderer skaliert ganzzahlig ohne Glättung
export function tilebilderErstellen(tileset) {
  const fehler = tilesetPruefen(tileset);
  if (fehler.length) throw new Error(fehler.join("\n"));
  const bilderNachSatz = new Map();
  for (const [satzGroesseText, satz] of Object.entries(tileset.saetze)) {
    const bilder = new Map();
    for (const [name, tile] of Object.entries(satz)) {
      const leinwand = document.createElement("canvas");
      leinwand.width = tile.groesse;
      leinwand.height = tile.groesse;
      const bild = new ImageData(pixelZuRgba(tile, tileset.palette), tile.groesse, tile.groesse);
      leinwand.getContext("2d").putImageData(bild, 0, 0);
      bilder.set(name, leinwand);
    }
    bilderNachSatz.set(Number(satzGroesseText), bilder);
  }
  const satzGroessen = [...bilderNachSatz.keys()];
  return {
    // Liefert das Bild eines Tiles für die Zoomstufe oder null (dann zeichnet der Renderer ein Zeichen)
    bild(name, zoom) {
      for (const satzGroesse of passendeSaetze(satzGroessen, zoom)) {
        const bild = bilderNachSatz.get(satzGroesse).get(name);
        if (bild) return bild;
      }
      return null;
    },
  };
}
