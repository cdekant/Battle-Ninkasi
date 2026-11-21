// Vorgaben der Einstellungen. Einstellungen sind keine Befehle und kommen nicht in den Spielstand;
// der Browser speichert Abweichungen getrennt (localStorage).
export default {
  layout: "a",                // Variante des Layouts: "a" (Log unter der Karte) oder "b" (Log links), docs/Oberflaeche.md
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
};
