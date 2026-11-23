// Vorgaben der Einstellungen. Einstellungen sind keine Befehle und kommen nicht in den Spielstand;
// der Browser speichert Abweichungen getrennt (localStorage).
// Was im Einstellungsfenster änderbar ist, beschreibt eingabe/einstellungskatalog.js.
export default {
  sprache: "browser",         // "de", "en" oder "browser": die erste Sprache des Browsers, die es gibt, sonst Englisch
  layout: "a",                // Variante des Layouts: "a" (Log unter der Karte), "b" (Log links), "kompakt", docs/Oberflaeche.md
  oberflaecheGroesse: 15,     // Schriftgröße von :root in px; alle Maße der Oberfläche hängen daran (rem), nicht die Tiles
  logZeilen: 8,               // sichtbare Logzeilen in Variante A (kompakt fest 3, B so hoch wie die Spalte)
  minikarte: true,
  zoom: 16,
  zoomstufen: [16, 32, 48, 64],
  reisePause: 30,             // Millisekunden zwischen zwei Schritten einer Reise (nur Anzeige)
  geschossPause: 30,          // Millisekunden je Feld einer Geschossbahn (nur Anzeige), 0 zeigt keine Bahn
  // true: Reise, Laufen und Erkunden beginnen auch mit Feinden in Sicht und halten nur bei einem neuen Feind
  // (Prüfung gegner_in_sicht; wer aus der Sicht gerät und wieder auftaucht, zählt als neu); false: kein Beginn
  reiseTrotzFeinden: true,
  // Gründe, aus denen eine Reise anhält: Gefahrenprüfungen (Register "gefahren") und "gegenstand"
  reiseHalt: ["gegner_in_sicht", "schaden", "gegenstand"], // gilt auch für das Auto-Erkunden
  rastenBis: ["lp", "mp"],    // Rasten endet, wenn diese Vorräte voll sind
  rastenTrotzFeinden: true,   // true: Rasten (r) beginnt auch mit Feinden in Sicht und hält bei einem neuen Feind
  rastenHalt: ["gegner_in_sicht", "schaden"],
  rastenHoechstens: 1000,     // höchstens so viele Schritte warten
  sofortAusloesen: false,     // Schnellleiste: mit vorbelegtem Ziel ohne zweiten Tastendruck wirken
  neustartNachfragen: true,   // Neuer Lauf im Spielmenü fragt nach
  bewegungReduzieren: false,  // schaltet alle bewegten Effekte ab (Geschossbahn, Effekte des Titelbilds)
  hoherKontrast: false,
  farbenblind: false,         // Blau und Orange statt Grün und Rot (Kampflog, Gut und Schlimm, LP)
};
