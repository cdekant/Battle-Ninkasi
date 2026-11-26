// Titelbilder (siehe docs/Titelbildschirm.md): je Start eines aus den freigeschalteten. Die Bilder liegen als
// öffentliche Konzeptbilder in Artwork/titel/ (CC0, LIZENZEN.md) und werden von dort geladen, nicht kopiert; ein Test
// prüft, dass jede Datei existiert.
//   datei: Pfad relativ zu index.html
//   schutzbereich: { links, oben, rechts, unten } in Prozent des Bildes, der beim Beschneiden sichtbar bleibt; das Bild
//     füllt die Höhe des Fensters und die freie Mitte zwischen den Spalten, und der Schutzbereich rückt in diese Mitte
//     (anzeige/titeleffekte.js)
//   freischaltung: null (immer) oder eine Bedingung der Chronik { zaehler, mindestens } (eingabe/chronik.js),
//     z.B. { zaehler: "besiegt.abstinenzler", mindestens: 1 } für Ninkasi im Kampf mit einem Abstinenzler
//   quellenangabe: wer das Bild samt Masken und Sprites gemacht hat (anzeige/quellenangabe.js), als Bildunterschrift im
//     Titel; Pflicht, ein Test prüft sie
//   effekte (wahlweise): bewegte Effekte über dem Bild (anzeige/titeleffekte.js), nur für dieses Bild; ein anderes Bild
//     bringt eigene Masken, Sprites und Punkte mit oder lässt Arten weg; alle Punkte in Prozent des Bildes
//     masken: { name: Datei } Schwarzweiß-PNG in Bildgröße, weiß ist die Figur bzw. die Anlage
//     vordergrund: Namen der Masken, die vor dem Dampf stehen (er wird dort ausgestanzt)
//     aura: Name der Maske, um die ein bläulicher Saum pulsiert
//     sprites: { schwaden, stoesse, nebel } Listen gemalter Schwaden für Dampf, Dampfstöße und Bodennebel
//     dampf: Quellen [{ x, y, breite, vorn? }], an denen Dampf aufsteigt (breite in Prozent der Bildbreite); vorn: true
//       liegt vor den Figuren, sonst steht der Dampf hinter den Masken aus vordergrund
//     augen: je Wesen { farbe: "gelb" | "rot", groesse, punkte }: leuchtende Augen, die im eigenen Takt anschwellen und
//       zurückgehen (groesse ist der Radius des Scheins in Prozent der Bildbreite)
//     bodennebel: { y, hoehe } Band, in dem Nebel vor allem treibt
//     dampfstoesse: Ventile [{ x, y, richtung: "links" | "rechts" }], aus denen ab und zu seitlich Dampf zischt
//     blitze: { quellen, ziele, ueberschlaege, widerschein, ueberschlagMaske, kontur }: Blitze springen von einer
//       Quelle zu einem Ziel; manchmal schlägt einer weiter auf einen Punkt aus ueberschlaege über; widerschein und
//       ueberschlagMaske nennen die Masken, auf denen Quelle und Überschlag kurz aufleuchten, kontur die Maske, über
//       deren Umriss nach dem Einschlag Funken kriechen

import { freigeschaltet } from "../eingabe/chronik.js";

// Jedes Titelbild bringt seine eigenen Effekte mit; Masken und Sprites tragen den Namen ihres Bildes
const BILD_03 = "Artwork/titel/cover-ninkasi-bierschlaechterin-03";

export const TITELBILDER = [
  {
    datei: `${BILD_03}.jpg`,
    schutzbereich: { links: 27, oben: 31, rechts: 72, unten: 85 },   // Ninkasi vom Weizen bis zu den Stiefeln
    freischaltung: null,
    quellenangabe: {
      art: "generiert",
      beteiligt: [
        { wer: "ChatGPT", anteil: "motiv" },
        { wer: "Grok", anteil: "dampf" },
        { wer: "Grok", anteil: "masken" },
        { wer: "Grok", anteil: "format" },
        { wer: "Claude", anteil: "animation" },
      ],
    },
    effekte: {
      masken: { frau: `${BILD_03}-maske-frau.png`, gegner: `${BILD_03}-maske-gegner.png`, anlagen: `${BILD_03}-maske-anlagen.png` },
      vordergrund: ["frau", "gegner"],
      aura: "frau",
      sprites: {
        schwaden: [1, 2, 3, 4, 5, 6].map((nummer) => `${BILD_03}-dampf-schwade-0${nummer}.png`),
        stoesse: [1, 2].map((nummer) => `${BILD_03}-dampf-stoss-0${nummer}.png`),
        nebel: [1, 2, 3].map((nummer) => `${BILD_03}-dampf-nebel-0${nummer}.png`),
      },
      dampf: [
        { x: 20.7, y: 19.6, breite: 3 },   // Hals des linken Kessels
        { x: 86, y: 16.5, breite: 3 },     // Hals des rechten Kessels
        { x: 61.6, y: 30, breite: 2.5 },   // Hals des mittleren Kessels
        { x: 36, y: 10, breite: 6 },       // Rohre unter der Decke
        { x: 70, y: 8, breite: 6 },
        { x: 8, y: 15, breite: 4 },        // Rohre links und rechts
        { x: 94, y: 12, breite: 4 },
        { x: 45, y: 20, breite: 5 },       // hinten in der Mitte
        { x: 28, y: 40, breite: 5 },       // zwischen den Kesseln
        { x: 75, y: 35, breite: 5 },
        { x: 6, y: 80, breite: 8, vorn: true },   // vorn aus den Pfützen am Boden
        { x: 34, y: 90, breite: 8, vorn: true },
        { x: 62, y: 88, breite: 8, vorn: true },
        { x: 93, y: 78, breite: 8, vorn: true },
      ],
      augen: [
        { farbe: "rot", groesse: 1.8, punkte: [{ x: 32, y: 50.1 }, { x: 34.05, y: 49.5 }] },     // Lebensmittelkontrolleur
        { farbe: "gelb", groesse: 2.2, punkte: [{ x: 18.6, y: 61.85 }, { x: 21.45, y: 61.55 }] }, // Schleime links
        { farbe: "gelb", groesse: 2.4, punkte: [{ x: 14.75, y: 69.75 }, { x: 18.45, y: 69.75 }] },
        { farbe: "gelb", groesse: 2.4, punkte: [{ x: 64.1, y: 52.75 }, { x: 67.6, y: 53 }] },     // Schleime rechts
        { farbe: "gelb", groesse: 2, punkte: [{ x: 77.5, y: 57 }, { x: 79.7, y: 57.45 }] },
        { farbe: "gelb", groesse: 2.6, punkte: [{ x: 66.7, y: 63.25 }, { x: 70.35, y: 64.35 }] },
      ],
      bodennebel: { y: 76, hoehe: 8 },
      dampfstoesse: [
        { x: 27, y: 22, richtung: "rechts" },   // Manometer am linken Kessel
        { x: 69, y: 47, richtung: "links" },    // Manometer am mittleren Kessel
        { x: 89, y: 40, richtung: "links" },    // Rohr rechts
      ],
      blitze: {
        quellen: [
          { x: 25, y: 22.6 }, { x: 16, y: 43 }, { x: 17, y: 27 },              // links: Manometer, Kesselschulter
          { x: 52, y: 14.5 }, { x: 61.6, y: 20.7 },                            // Mitte: Deckenrohr, Kesselhals
          { x: 69.6, y: 45 }, { x: 81, y: 45 }, { x: 91, y: 38.5 }, { x: 83, y: 24 }, // rechts: Manometer, Kesselschulter
        ],
        ziele: [{ x: 40, y: 35 }, { x: 44, y: 33 }, { x: 64.5, y: 41 }, { x: 50.3, y: 35.3 }], // Weizen, Spitze, Krug, Diadem
        ueberschlaege: [{ x: 30.5, y: 49 }, { x: 67, y: 55 }, { x: 77.6, y: 57 }, { x: 19, y: 61 }, { x: 69, y: 63.6 }, { x: 14.5, y: 69 }], // Zombie, Schleime
        widerschein: "anlagen",
        ueberschlagMaske: "gegner",
        kontur: "frau",
      },
    },
  },
];

// Ein freigeschaltetes Titelbild; zufallszahl in [0, 1) (kosmetisch)
export function titelbildWaehlen(chronik, zufallszahl) {
  const frei = TITELBILDER.filter((bild) => freigeschaltet(chronik, bild.freischaltung));
  return frei[Math.floor(zufallszahl * frei.length)] ?? TITELBILDER[0];
}
