// Vorgaben der Einstellungen. Einstellungen sind keine Befehle und kommen nicht in den Spielstand;
// der Browser speichert Abweichungen getrennt (localStorage).
export default {
  zoom: 16,
  zoomstufen: [16, 32, 48, 64],
  reisePause: 30,             // Millisekunden zwischen zwei Schritten einer Reise (nur Anzeige)
  reiseTrotzFeinden: false,   // false: keine Reise, solange Feinde in Sicht sind
  // Gründe, aus denen eine Reise anhält: Gefahrenprüfungen (Register "gefahren") und "gegenstand"
  reiseHalt: ["gegner_in_sicht", "schaden", "gegenstand"],
};
