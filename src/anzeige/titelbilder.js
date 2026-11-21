// Titelbilder (siehe docs/Titelbildschirm.md): je Start eines aus den freigeschalteten. Die Bilder liegen als
// öffentliche Konzeptbilder in Artwork/titel/ (CC0, LIZENZEN.md) und werden von dort geladen, nicht kopiert; ein Test
// prüft, dass jede Datei existiert.
//   datei: Pfad relativ zu index.html
//   fokus: Punkt in Prozent der Breite und Höhe, der beim Beschneiden im Bild bleibt (CSS object-position)
//   freischaltung: null (immer) oder eine Bedingung der Chronik { zaehler, mindestens } (eingabe/chronik.js),
//     z.B. { zaehler: "besiegt.abstinenzler", mindestens: 1 } für Ninkasi im Kampf mit einem Abstinenzler

import { freigeschaltet } from "../eingabe/chronik.js";

export const TITELBILDER = [
  { datei: "Artwork/titel/cover-ninkasi-bierschlaechterin-02.jpg", fokus: { x: 50, y: 55 }, freischaltung: null },
  { datei: "Artwork/titel/cover-ninkasi-bierschlaechterin-01.jpg", fokus: { x: 50, y: 50 }, freischaltung: null },
];

// Ein freigeschaltetes Titelbild; zufallszahl in [0, 1) (kosmetisch)
export function titelbildWaehlen(chronik, zufallszahl) {
  const frei = TITELBILDER.filter((bild) => freigeschaltet(chronik, bild.freischaltung));
  return frei[Math.floor(zufallszahl * frei.length)] ?? TITELBILDER[0];
}
