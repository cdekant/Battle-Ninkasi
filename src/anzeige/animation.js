// Animation der Geschossbahnen (siehe docs/Bedienung.md, Zielmodus): reine Anzeige, ohne Timer und DOM, damit sie
// testbar ist; den Takt gibt src/main.js vor (Einstellung geschossPause). Liest den Spielzustand nie.
// Zustand: { bahnen: [[{ x, y }]], schritt } die Bahnen der Meldungen "geschoss" in ihrer Reihenfolge; gezeigt wird
// je Takt ein Feld der ersten Bahn, danach die nächste. Jede Taste überspringt alles (animationLeeren).

export function neueAnimation() {
  return { bahnen: [], schritt: 0 };
}

// felder: die gesehenen Felder einer Bahn vom Ursprung zum Aufschlag; ohne Felder kommt nichts dazu
export function geschossEinreihen(animation, felder) {
  if (felder.length) animation.bahnen.push(felder.map((feld) => ({ x: feld.x, y: feld.y })));
}

export function laeuftAnimation(animation) {
  return animation.bahnen.length > 0;
}

// Das Feld, auf dem das Geschoss gerade gezeigt wird, oder null
export function aktuellesGeschoss(animation) {
  return animation.bahnen[0]?.[animation.schritt] ?? null;
}

// Einen Takt weiter; gibt zurück, ob danach noch etwas zu zeigen ist
export function animationWeiter(animation) {
  if (!laeuftAnimation(animation)) return false;
  animation.schritt++;
  if (animation.schritt >= animation.bahnen[0].length) {
    animation.bahnen.shift();
    animation.schritt = 0;
  }
  return laeuftAnimation(animation);
}

export function animationLeeren(animation) {
  animation.bahnen = [];
  animation.schritt = 0;
}
