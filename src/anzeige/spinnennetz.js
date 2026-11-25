// Spinnennetz eines Suds (siehe docs/Bedienung.md, Fenster; Spieldesign in docs/Brauen.md, Profil des Suds): ein
// SVG als Text, ohne DOM. Je Achse von regeln.brauen.achsen eine Speiche in ihrer Reihenfolge, oben beginnend im
// Uhrzeigersinn, linear bis hoechstens der Achse; Ringe bei einem Viertel, der Hälfte, drei Vierteln und am Rand.
//   bereich:  { <achse>: [unten, oben] } wird ein Band zwischen zwei Polygonen (die Vorschau)
//   punkt:    { <achse>: wert } wird ein Polygon mit Punkten (die Mitte der Vorschau oder ein fertiger Sud)
//   umrisse:  [{ spannen, hervorgehoben? }] je genannter Achse ein Abschnitt von unten bis oben (Zielgebiete); freie
//             Achsen bleiben leer, damit ein Gebiet nicht größer aussieht, als es ist
//   beschriftungen: { <achse>: text } an den Enden der Speichen; titel: Text für Bildschirmleser
// Gerechnet wird in Kommazahlen, das ist nur Anzeige; die Logik rechnet in ganzen Zahlen (systeme/sud.js).

const RADIUS = 100;
const RINGE = [25, 50, 75, 100];
const RAND = 46; // Platz für die Beschriftungen um das Netz

const runden = (zahl) => Math.round(zahl * 10) / 10;
const escapen = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Punkt auf der Speiche einer Achse bei einem Anteil von 0 bis 1
function punktAuf(stelle, anzahl, anteil) {
  const winkel = -Math.PI / 2 + (stelle * 2 * Math.PI) / anzahl;
  return [runden(Math.cos(winkel) * RADIUS * anteil), runden(Math.sin(winkel) * RADIUS * anteil)];
}

const polygon = (punkte) => punkte.map(([x, y]) => `${x},${y}`).join(" ");
const pfad = (punkte) => `M${punkte.map(([x, y]) => `${x},${y}`).join("L")}Z`;

// Beschriftungen der Achsen aus der Sprachdatei (achse.<name>)
export const achsenBeschriftungen = (achsen, text) => Object.fromEntries(Object.keys(achsen).map((achse) => [achse, text(`achse.${achse}`)]));

export function spinnennetzSvg(achsen, { bereich = null, punkt = null, umrisse = [], beschriftungen = {}, titel = "" } = {}) {
  const namen = Object.keys(achsen), anzahl = namen.length;
  const anteil = (achse, wert) => Math.max(0, Math.min(1, wert / achsen[achse].hoechstens));
  const auf = (werte) => namen.map((achse, stelle) => punktAuf(stelle, anzahl, anteil(achse, werte(achse))));
  const teile = [];
  for (const ring of RINGE) teile.push(`<polygon class="netz-ring" points="${polygon(namen.map((_, stelle) => punktAuf(stelle, anzahl, ring / 100)))}"/>`);
  namen.forEach((achse, stelle) => {
    const [x, y] = punktAuf(stelle, anzahl, 1);
    teile.push(`<line class="netz-speiche" x1="0" y1="0" x2="${x}" y2="${y}"/>`);
  });
  for (const { spannen, hervorgehoben } of umrisse) {
    for (const [achse, [unten, oben]] of Object.entries(spannen)) {
      const stelle = namen.indexOf(achse);
      if (stelle < 0) continue;
      const [x1, y1] = punktAuf(stelle, anzahl, anteil(achse, unten)), [x2, y2] = punktAuf(stelle, anzahl, anteil(achse, oben));
      teile.push(`<line class="netz-umriss${hervorgehoben ? " hervorgehoben" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`);
    }
  }
  if (bereich) teile.push(`<path class="netz-band" fill-rule="evenodd" d="${pfad(auf((achse) => bereich[achse][1]))}${pfad(auf((achse) => bereich[achse][0]))}"/>`);
  if (punkt) {
    const punkte = auf((achse) => punkt[achse]);
    teile.push(`<polygon class="netz-profil" points="${polygon(punkte)}"/>`);
    for (const [x, y] of punkte) teile.push(`<circle class="netz-punkt" cx="${x}" cy="${y}" r="2.5"/>`);
  }
  namen.forEach((achse, stelle) => {
    if (!beschriftungen[achse]) return;
    const [x, y] = punktAuf(stelle, anzahl, 1.14);
    const anker = Math.abs(x) < 8 ? "middle" : x > 0 ? "start" : "end";
    teile.push(`<text class="netz-text" x="${x}" y="${runden(y + 4)}" text-anchor="${anker}">${escapen(beschriftungen[achse])}</text>`);
  });
  const weite = RADIUS + RAND;
  return `<svg class="spinnennetz" viewBox="${-weite - 20} ${-weite} ${2 * weite + 40} ${2 * weite}" role="img" aria-label="${escapen(titel)}"><title>${escapen(titel)}</title>${teile.join("")}</svg>`;
}
