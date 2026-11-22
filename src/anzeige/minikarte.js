// Minikarte und Übersichtskarte (docs/Oberflaeche.md, Seitenleiste): ein Rechteck je Feld in der Farbe des Geländes,
// darüber Punkte für Treppen, Gegenstände und Wesen in Sicht. Liest den Zustand nur.
// minikartenBild rechnet ohne DOM (testbar): { breite, hoehe, felder: [farbe | null], gedaempft: [bool], punkte }
//   felder:    je Feld (Zeile für Zeile) die Farbe des bekannten Geländes aus daten/zeichen.js, null für Unbekanntes
//   gedaempft: bekannt, aber gerade nicht sichtbar (wird blasser gezeichnet)
//   punkte:    [{ x, y, farbe, art }] art: "treppe", "gegenstand", "gegner", "verbuendet", "neutral", "ninkasi"
// Nur was Ninkasi kennt: Gelände und Treppen nach der Erinnerung (systeme/erinnerung.js), Gegenstände in Sicht oder
// erinnert, Wesen nur in Sicht.
// zeichnen() malt das Bild mit feldgroesse Pixeln je Feld auf ein Canvas; derselbe Code dient der Minikarte in der
// Seitenleiste und der Übersichtskarte (Fenster "karte").

import { gesteuerteEntitaet, entitaetenMitPosition, istWesen } from "../kern/zustand.js";
import { bekannterGelaendeName } from "../welt/karte.js";
import { erinnerteDingeAuf } from "../systeme/erinnerung.js";
import { beziehungZwischen, urheberVon } from "../systeme/fraktionen.js";

export const PUNKTFARBEN = {
  treppe: "#f2c14e",
  gegenstand: "#c87533",
  gegner: "#e5533d",
  verbuendet: "#5aa9e6",
  neutral: "#9a9a9a",
  ninkasi: "#ffffff",
};
const DECKKRAFT_GEDAEMPFT = 0.45;
const ERSATZFARBE = "#6b5a44";

export function minikartenBild(spiel, zeichensatz) {
  const zustand = spiel.zustand;
  const ebene = zustand.ebene;
  const sichtbar = new Set(zustand.sichtbareFelder);
  const felder = new Array(ebene.breite * ebene.hoehe).fill(null);
  const gedaempft = new Array(ebene.breite * ebene.hoehe).fill(false);
  const punkte = [];
  for (let y = 0; y < ebene.hoehe; y++) {
    for (let x = 0; x < ebene.breite; x++) {
      const index = y * ebene.breite + x;
      const name = bekannterGelaendeName(spiel, x, y);
      if (name === null) continue;
      felder[index] = zeichensatz.gelaende?.[name]?.farbe ?? ERSATZFARBE;
      gedaempft[index] = !sichtbar.has(index);
      if (spiel.daten.gelaende[name]?.treppe) punkte.push({ x, y, farbe: PUNKTFARBEN.treppe, art: "treppe" });
      if (gedaempft[index] && erinnerteDingeAuf(ebene, index).gegenstaende.length) punkte.push({ x, y, farbe: PUNKTFARBEN.gegenstand, art: "gegenstand" });
    }
  }
  const gesteuerte = gesteuerteEntitaet(zustand);
  for (const entitaet of entitaetenMitPosition(zustand)) {
    const { x, y } = entitaet.position;
    if (entitaet.id === gesteuerte.id || !sichtbar.has(y * ebene.breite + x)) continue;
    if (istWesen(entitaet)) {
      const beziehung = beziehungZwischen(spiel, urheberVon(gesteuerte), entitaet);
      const art = beziehung === "verbuendet" ? "verbuendet" : beziehung === "feind" ? "gegner" : "neutral";
      punkte.push({ x, y, farbe: PUNKTFARBEN[art], art, id: entitaet.id });
    } else if (entitaet.aufhebbar) {
      punkte.push({ x, y, farbe: PUNKTFARBEN.gegenstand, art: "gegenstand" });
    }
  }
  // Wesen über Gegenständen und Treppen, Ninkasi zuletzt
  const rang = { treppe: 0, gegenstand: 1, neutral: 2, verbuendet: 3, gegner: 4 };
  punkte.sort((erster, zweiter) => rang[erster.art] - rang[zweiter.art]);
  punkte.push({ x: gesteuerte.position.x, y: gesteuerte.position.y, farbe: PUNKTFARBEN.ninkasi, art: "ninkasi", id: gesteuerte.id });
  return { breite: ebene.breite, hoehe: ebene.hoehe, felder, gedaempft, punkte };
}

// Größte ganze Feldgröße, mit der die Ebene in die verfügbare Breite passt (mindestens 1, höchstens hoechstens)
export function feldgroesseFuer(verfuegbareBreite, ebenenbreite, hoechstens) {
  return Math.max(1, Math.min(hoechstens, Math.floor(verfuegbareBreite / ebenenbreite)));
}

// Feld unter einem Pixel des Canvas oder null außerhalb
export function feldAmPunkt(bild, feldgroesse, pixelX, pixelY) {
  const x = Math.floor(pixelX / feldgroesse), y = Math.floor(pixelY / feldgroesse);
  return x >= 0 && y >= 0 && x < bild.breite && y < bild.hoehe ? { x, y } : null;
}

// Malt das Bild; hervorgehobenId bekommt einen Rahmen
export function zeichnen(canvas, bild, feldgroesse, { hervorgehobenId = null } = {}) {
  canvas.width = bild.breite * feldgroesse;
  canvas.height = bild.hoehe * feldgroesse;
  const pinsel = canvas.getContext("2d");
  pinsel.fillStyle = "#000";
  pinsel.fillRect(0, 0, canvas.width, canvas.height);
  bild.felder.forEach((farbe, index) => {
    if (!farbe) return;
    pinsel.globalAlpha = bild.gedaempft[index] ? DECKKRAFT_GEDAEMPFT : 1;
    pinsel.fillStyle = farbe;
    pinsel.fillRect((index % bild.breite) * feldgroesse, Math.floor(index / bild.breite) * feldgroesse, feldgroesse, feldgroesse);
  });
  pinsel.globalAlpha = 1;
  for (const punkt of bild.punkte) {
    pinsel.fillStyle = punkt.farbe;
    pinsel.fillRect(punkt.x * feldgroesse, punkt.y * feldgroesse, feldgroesse, feldgroesse);
    if (punkt.id !== undefined && punkt.id === hervorgehobenId) {
      pinsel.strokeStyle = PUNKTFARBEN.treppe;
      pinsel.lineWidth = 1;
      pinsel.strokeRect(punkt.x * feldgroesse - 1.5, punkt.y * feldgroesse - 1.5, feldgroesse + 3, feldgroesse + 3);
    }
  }
}
