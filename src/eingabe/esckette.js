// Esc als Kette (docs/Oberflaeche.md): was Esc gerade tut, ohne DOM, damit die Reihenfolge testbar ist.
//   1. Zielmodus abbrechen, 2. oberstes Fenster schließen (das Fenster entscheidet selbst, z.B. erst zurück zur Liste),
//   3. Reise, Rasten, Laufen oder Erkunden abbrechen, 4. sonst das Spielmenü öffnen
// Gibt "zielmodus", "fenster", "ablauf" oder "menue" zurück.
export function escSchritt({ zielModus, fensterStapel, laufenderAblauf }) {
  if (zielModus) return "zielmodus";
  if (fensterStapel?.length) return "fenster";
  if (laufenderAblauf) return "ablauf";
  return "menue";
}
