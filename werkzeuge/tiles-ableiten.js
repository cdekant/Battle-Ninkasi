// Leitet die kleineren Tile-Sätze (48, 32, 16 px) aus dem Satz 64 px ab und schreibt grafik/tileset.js neu.
// Aufruf: node werkzeuge/tiles-ableiten.js [--ueberschreiben] [tilename ...]
//   ohne --ueberschreiben bleiben vorhandene abgeleitete Dateien unberührt (Handnacharbeit geht nicht verloren)
//   ohne Tilenamen werden alle Tiles des Satzes 64 bearbeitet
// Verfahren je Zielpixel (Fläche der Vorlage über dem Zielpixel, auch bei krummen Faktoren wie 64 zu 48):
//   1. Umriss der Vorlage (Schwarz am Rand zur Durchsichtigkeit) zählt als durchsichtig
//   2. deckt die Fläche zu wenig, bleibt das Pixel durchsichtig
//   3. Vorrangfarben: kommt eine Signalfarbe in der Fläche vor, gewinnt sie (Augen, Wunden, Glut bleiben sichtbar)
//   4. Fugen: bei Gelände (ohne Durchsichtigkeit) gewinnt die dunkelste Farbe, wenn sie genug Fläche hat
//   5. sonst Flächenmittel, gesetzt auf die nächste Farbe aus den Farben der Vorlage
//   6. Umriss in Schwarz neu setzen, wenn die Vorlage einen hatte
// Danach prüft das Werkzeug jedes abgeleitete Tile gegen die Vorlage und meldet Verdachtsfälle für die Nacharbeit:
// verschwundene Signalfarben, zerfallene Figuren, ausgedünnte Fugen.
// Eine eigene Quellenangabe der Vorlage geht in die abgeleiteten Tiles über; das Werkzeug selbst wird nie genannt.

import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const ZIELGROESSEN = [48, 32, 16];
const QUELLGROESSE = 64;
const MINDESTDECKUNG = 0.35; // Anteil deckender Vorlagenfläche, ab dem ein Zielpixel gefüllt wird
// Bei Gelände gewinnt die dunkelste Farbe, wenn sie etwa eine durchgehende Linie von 1 px über die Fläche bildet
// (Anteil 1 / Faktor); einzelne dunkle Körner bleiben darunter und werden nicht zu Fugen
const FUGENLINIE = 0.9;
const FUGENVERLUST = 0.5;    // Warnung, wenn der Fugenanteil auf weniger als diesen Teil der Vorlage sinkt
const UMRISS = "0";
// Rampen der Palette, deren Farben beim Ableiten Vorrang haben (Signalfarben der Fibel)
export const VORRANG_RAMPEN = ["blut", "saeure", "gift", "lauge", "psi", "magie", "leuchtrot"];

const NACHBARN = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function hexZuRgb(hex) {
  const zahl = parseInt(hex.slice(1), 16);
  return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
}

// Farbabstand nach "redmean", nah an der Wahrnehmung und ohne Umrechnung
function farbabstand([rot1, gruen1, blau1], [rot2, gruen2, blau2]) {
  const rotMittel = (rot1 + rot2) / 2;
  const deltaRot = rot1 - rot2, deltaGruen = gruen1 - gruen2, deltaBlau = blau1 - blau2;
  return (2 + rotMittel / 256) * deltaRot ** 2 + 4 * deltaGruen ** 2 + (2 + (255 - rotMittel) / 256) * deltaBlau ** 2;
}

// Umrisspixel: Schwarz, das an Durchsichtiges oder den Rand des Tiles grenzt
export function umrissFinden(pixel, durchsichtig) {
  const groesse = pixel.length;
  const umriss = new Set();
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      if (pixel[y][x] !== UMRISS) continue;
      const amRand = NACHBARN.some(([dx, dy]) => {
        const nachbarX = x + dx, nachbarY = y + dy;
        return nachbarX >= 0 && nachbarY >= 0 && nachbarX < groesse && nachbarY < groesse && pixel[nachbarY][nachbarX] === durchsichtig;
      });
      if (amRand) umriss.add(`${x},${y}`);
    }
  }
  return umriss;
}

export function umrissSetzen(zeilen, durchsichtig) {
  const groesse = zeilen.length;
  const raster = zeilen.map((zeile) => [...zeile]);
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      if (zeilen[y][x] !== durchsichtig) continue;
      const anFigur = NACHBARN.some(([dx, dy]) => {
        const nachbar = zeilen[y + dy]?.[x + dx];
        return nachbar !== undefined && nachbar !== durchsichtig;
      });
      if (anFigur) raster[y][x] = UMRISS;
    }
  }
  return raster.map((zeile) => zeile.join(""));
}

function helligkeit([rot, gruen, blau]) {
  return 0.2126 * rot + 0.7152 * gruen + 0.0722 * blau;
}

function vorrangZeichen(palette) {
  return new Set(palette.farben.filter((farbe) => VORRANG_RAMPEN.includes(farbe.rampe)).map((farbe) => farbe.zeichen));
}

// Leitet eine Pixelmatrix auf eine kleinere Kantenlänge ab; palette wie in grafik/palette.js
export function tileAbleiten(pixel, zielGroesse, palette) {
  const quellGroesse = pixel.length;
  const durchsichtig = palette.durchsichtig;
  const rgbNachZeichen = new Map(palette.farben.map((farbe) => [farbe.zeichen, hexZuRgb(farbe.hex)]));
  const vorrang = vorrangZeichen(palette);
  const umriss = umrissFinden(pixel, durchsichtig);
  const hatUmriss = umriss.size > 0;
  const istGelaende = pixel.every((zeile) => !zeile.includes(durchsichtig));
  // nur Farben, die in der Vorlage vorkommen (Farbbudget der Fibel), ohne den Umriss
  const kandidaten = new Set();
  pixel.forEach((zeile, y) => [...zeile].forEach((zeichen, x) => {
    if (zeichen !== durchsichtig && !umriss.has(`${x},${y}`)) kandidaten.add(zeichen);
  }));
  const faktor = quellGroesse / zielGroesse;
  const zeilen = [];
  for (let zielY = 0; zielY < zielGroesse; zielY++) {
    let zeile = "";
    for (let zielX = 0; zielX < zielGroesse; zielX++) {
      // Gewicht je Farbe in der Fläche des Zielpixels
      const gewichtNachZeichen = new Map();
      let deckung = 0;
      const anfangX = zielX * faktor, endeX = (zielX + 1) * faktor;
      const anfangY = zielY * faktor, endeY = (zielY + 1) * faktor;
      for (let quellY = Math.floor(anfangY); quellY < Math.ceil(endeY); quellY++) {
        const anteilY = Math.min(endeY, quellY + 1) - Math.max(anfangY, quellY);
        for (let quellX = Math.floor(anfangX); quellX < Math.ceil(endeX); quellX++) {
          const anteilX = Math.min(endeX, quellX + 1) - Math.max(anfangX, quellX);
          const zeichen = pixel[quellY][quellX];
          if (zeichen === durchsichtig || umriss.has(`${quellX},${quellY}`)) continue;
          const gewicht = anteilX * anteilY;
          gewichtNachZeichen.set(zeichen, (gewichtNachZeichen.get(zeichen) ?? 0) + gewicht);
          deckung += gewicht;
        }
      }
      const flaeche = faktor * faktor;
      if (deckung === 0 || deckung / flaeche < (hatUmriss ? MINDESTDECKUNG : 0)) {
        zeile += durchsichtig;
        continue;
      }
      zeile += farbeWaehlen(gewichtNachZeichen, deckung, flaeche);
    }
    zeilen.push(zeile);
  }
  return hatUmriss ? umrissSetzen(zeilen, durchsichtig) : zeilen;

  function farbeWaehlen(gewichtNachZeichen, deckung, flaeche) {
    const eintraege = [...gewichtNachZeichen.entries()];
    // Vorrangfarben: die stärkste Signalfarbe der Fläche gewinnt
    const signale = eintraege.filter(([zeichen]) => vorrang.has(zeichen));
    if (signale.length) return signale.reduce((beste, eintrag) => (eintrag[1] > beste[1] ? eintrag : beste))[0];
    // Mittel aller Farben der Fläche
    const mittel = [0, 0, 0];
    for (const [zeichen, gewicht] of eintraege) {
      rgbNachZeichen.get(zeichen).forEach((wert, kanal) => { mittel[kanal] += (wert * gewicht) / deckung; });
    }
    // Fugen: bei Gelände gewinnt die dunkelste Farbe, wenn sie genug Fläche hat und dunkler als das Mittel ist
    if (istGelaende) {
      const [dunkelsteFarbe, gewichtDunkelste] = eintraege.reduce((dunkelste, eintrag) =>
        helligkeit(rgbNachZeichen.get(eintrag[0])) < helligkeit(rgbNachZeichen.get(dunkelste[0])) ? eintrag : dunkelste);
      if (gewichtDunkelste / flaeche >= FUGENLINIE / faktor && helligkeit(rgbNachZeichen.get(dunkelsteFarbe)) < helligkeit(mittel)) {
        return dunkelsteFarbe;
      }
    }
    let besteFarbe = null, besterAbstand = Infinity;
    for (const zeichen of kandidaten) {
      const abstand = farbabstand(mittel, rgbNachZeichen.get(zeichen));
      if (abstand < besterAbstand) { besterAbstand = abstand; besteFarbe = zeichen; }
    }
    return besteFarbe;
  }
}

// Zahl der zusammenhängenden Teile (vier Nachbarn) aus nicht durchsichtigen Pixeln
function teileZaehlen(pixel, durchsichtig) {
  const groesse = pixel.length;
  const besucht = new Set();
  let teile = 0;
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      if (pixel[y][x] === durchsichtig || besucht.has(`${x},${y}`)) continue;
      teile++;
      const stapel = [[x, y]];
      besucht.add(`${x},${y}`);
      while (stapel.length) {
        const [aktuellX, aktuellY] = stapel.pop();
        for (const [dx, dy] of NACHBARN) {
          const nachbarX = aktuellX + dx, nachbarY = aktuellY + dy;
          const nachbar = pixel[nachbarY]?.[nachbarX];
          if (nachbar === undefined || nachbar === durchsichtig || besucht.has(`${nachbarX},${nachbarY}`)) continue;
          besucht.add(`${nachbarX},${nachbarY}`);
          stapel.push([nachbarX, nachbarY]);
        }
      }
    }
  }
  return teile;
}

// Prüft ein abgeleitetes Tile gegen die Vorlage; gibt Warnungen für die Nacharbeit zurück
export function ableitungPruefen(vorlage, abgeleitet, palette) {
  const warnungen = [];
  const durchsichtig = palette.durchsichtig;
  const vorrang = vorrangZeichen(palette);
  const zeichenIn = (pixel) => new Set(pixel.join(""));
  const zeichenVorlage = zeichenIn(vorlage), zeichenAbgeleitet = zeichenIn(abgeleitet);
  const fehlendeSignale = [...zeichenVorlage].filter((zeichen) => vorrang.has(zeichen) && !zeichenAbgeleitet.has(zeichen));
  if (fehlendeSignale.length) warnungen.push(`Signalfarbe verschwunden: ${fehlendeSignale.join(" ")}`);
  const teileVorlage = teileZaehlen(vorlage, durchsichtig), teileAbgeleitet = teileZaehlen(abgeleitet, durchsichtig);
  if (teileAbgeleitet > teileVorlage) warnungen.push(`Figur zerfallen: ${teileAbgeleitet} statt ${teileVorlage} Teile`);
  const istGelaende = vorlage.every((zeile) => !zeile.includes(durchsichtig));
  if (istGelaende) {
    const rgbNachZeichen = new Map(palette.farben.map((farbe) => [farbe.zeichen, hexZuRgb(farbe.hex)]));
    const dunkelste = [...zeichenVorlage].reduce((dunkelstes, zeichen) =>
      helligkeit(rgbNachZeichen.get(zeichen)) < helligkeit(rgbNachZeichen.get(dunkelstes)) ? zeichen : dunkelstes);
    const anteil = (pixel) => [...pixel.join("")].filter((zeichen) => zeichen === dunkelste).length / (pixel.length * pixel.length);
    const anteilVorlage = anteil(vorlage), anteilAbgeleitet = anteil(abgeleitet);
    if (anteilAbgeleitet < anteilVorlage * FUGENVERLUST) {
      warnungen.push(`Fugen ausgedünnt: Anteil "${dunkelste}" ${Math.round(anteilAbgeleitet * 100)} % statt ${Math.round(anteilVorlage * 100)} %`);
    }
  }
  return warnungen;
}

// Dateiname klein mit Bindestrichen, Schlüssel in camelCase
function schluesselAusDateiname(dateiname) {
  return dateiname.replace(/\.js$/, "").replace(/-([a-z])/g, (_, buchstabe) => buchstabe.toUpperCase());
}

// quellenangabe (wahlweise): die eigene Angabe der Vorlage, sonst gilt grafik/quellenangabe.js
export function tileDateiText(kommentar, groesse, zeilen, quellenangabe = null) {
  return [
    `// ${kommentar}`,
    `// Pixelmatrix ${groesse}x${groesse}, ein Zeichen je Pixel, Schlüssel in ../../palette.js, "." durchsichtig`,
    "export default {",
    ...(quellenangabe ? [`  quellenangabe: ${JSON.stringify(quellenangabe)},`] : []),
    `  groesse: ${groesse},`,
    "  pixel: [",
    ...zeilen.map((zeile) => `    "${zeile}",`),
    "  ],",
    "};",
    "",
  ].join("\n");
}

function tilesetDateiText(tilesOrdner) {
  const satzGroessen = readdirSync(tilesOrdner).map(Number).filter(Number.isInteger).sort((erste, zweite) => zweite - erste);
  const importe = [];
  const saetze = [];
  for (const satzGroesse of satzGroessen) {
    const dateien = readdirSync(path.join(tilesOrdner, String(satzGroesse))).filter((datei) => datei.endsWith(".js")).sort();
    const eintraege = dateien.map((datei) => {
      const schluessel = schluesselAusDateiname(datei);
      importe.push(`import ${schluessel}${satzGroesse} from "./tiles/${satzGroesse}/${datei}";`);
      return `${schluessel}: ${schluessel}${satzGroesse}`;
    });
    saetze.push(`    ${satzGroesse}: { ${eintraege.join(", ")} },`);
  }
  return [
    "// Tileset: Palette und Tiles je Satz (Kantenlänge in Pixeln).",
    "// Erzeugt von werkzeuge/tiles-ableiten.js aus den Dateien in tiles/, nicht von Hand ändern.",
    "// Schlüssel der Tiles folgen daten/zeichen.js; wer die Tiles gemacht hat, steht in quellenangabe.js.",
    'import palette from "./palette.js";',
    'import quellenangabe from "./quellenangabe.js";',
    ...importe,
    "",
    "export default {",
    "  palette,",
    "  quellenangabe,",
    "  saetze: {",
    ...saetze,
    "  },",
    "};",
    "",
  ].join("\n");
}

async function hauptprogramm() {
  const argumente = process.argv.slice(2);
  const ueberschreiben = argumente.includes("--ueberschreiben");
  const gewuenschteNamen = argumente.filter((argument) => !argument.startsWith("--"));
  const grafikOrdner = fileURLToPath(new URL("../grafik/", import.meta.url));
  const tilesOrdner = path.join(grafikOrdner, "tiles");
  const palette = (await import(pathToFileURL(path.join(grafikOrdner, "palette.js")))).default;
  const quellOrdner = path.join(tilesOrdner, String(QUELLGROESSE));
  const quellDateien = readdirSync(quellOrdner).filter((datei) => datei.endsWith(".js"))
    .filter((datei) => gewuenschteNamen.length === 0 || gewuenschteNamen.includes(datei.replace(/\.js$/, "")));

  let warnungenGesamt = 0;
  for (const datei of quellDateien) {
    const vorlage = (await import(pathToFileURL(path.join(quellOrdner, datei)))).default;
    for (const zielGroesse of ZIELGROESSEN) {
      const zielOrdner = path.join(tilesOrdner, String(zielGroesse));
      const zielDatei = path.join(zielOrdner, datei);
      const ort = `tiles/${zielGroesse}/${datei}`;
      let zeilen;
      if (existsSync(zielDatei) && !ueberschreiben) {
        zeilen = (await import(pathToFileURL(zielDatei))).default.pixel;
        console.log(`übersprungen (vorhanden): ${ort}`);
      } else {
        mkdirSync(zielOrdner, { recursive: true });
        zeilen = tileAbleiten(vorlage.pixel, zielGroesse, palette);
        const kommentar = `${datei.replace(/\.js$/, "")} ${zielGroesse} px: abgeleitet aus 64 px mit werkzeuge/tiles-ableiten.js`;
        writeFileSync(zielDatei, tileDateiText(kommentar, zielGroesse, zeilen, vorlage.quellenangabe));
        console.log(`geschrieben: ${ort}`);
      }
      for (const warnung of ableitungPruefen(vorlage.pixel, zeilen, palette)) {
        console.log(`  WARNUNG ${ort}: ${warnung}`);
        warnungenGesamt++;
      }
    }
  }
  writeFileSync(path.join(grafikOrdner, "tileset.js"), tilesetDateiText(tilesOrdner));
  console.log("geschrieben: grafik/tileset.js");
  console.log(warnungenGesamt ? `${warnungenGesamt} Warnungen: diese Tiles in der Tilewerkstatt prüfen und nacharbeiten` : "keine Warnungen");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await hauptprogramm();
