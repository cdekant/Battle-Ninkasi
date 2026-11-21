// Renderer: zeichnet die Karte auf ein Canvas. Liest den Zustand nur.
// Gezeichnet wird ein Tile aus grafik/ (über tilebilder.js), wenn ein Satz scharf zur Zoomstufe passt;
// sonst das Zeichen aus daten/zeichen.js; fehlt auch das, erscheint "?".
// Bildschirmfelder (bildX, bildY) zählen ab der linken oberen Ecke des Ausschnitts.

const SCHRIFT = '"DejaVu Sans Mono", "Cascadia Mono", Consolas, monospace';
const DECKKRAFT_ERINNERT = 0.35; // erkundete, aber gerade nicht sichtbare Felder

import { istBekannt } from "../systeme/fallen.js";
import { schichtenVon, feldVonIndex } from "../welt/schichten.js";

// Deckkraft der Feldschichten: Oberfläche und Feuer fest, Gas mit der Menge zunehmend bis höchstens GAS_DECKKRAFT
const OBERFLAECHE_DECKKRAFT = 0.4, FEUER_DECKKRAFT = 0.6, GAS_DECKKRAFT = 0.6, GAS_VOLL = 100;

export class Renderer {
  // zeichensatz: daten/zeichen.js; tilebilder: aus tilebilderErstellen oder null (nur Zeichen)
  constructor(canvas, zeichensatz, tilebilder = null) {
    this.canvas = canvas;
    this.pinsel = canvas.getContext("2d");
    this.zeichensatz = zeichensatz;
    this.tilebilder = tilebilder;
  }

  tilebild(name, zoom) {
    return this.tilebilder ? this.tilebilder.bild(name, zoom) : null;
  }

  // Passt das Canvas an seinen Container an und gibt die Ansicht in Feldern zurück
  ansicht(zoom) {
    const rahmen = this.canvas.parentElement.getBoundingClientRect();
    const pixelVerhaeltnis = window.devicePixelRatio || 1;
    const breite = Math.floor(rahmen.width), hoehe = Math.floor(rahmen.height);
    if (this.canvas.width !== breite * pixelVerhaeltnis || this.canvas.height !== hoehe * pixelVerhaeltnis) {
      this.canvas.width = breite * pixelVerhaeltnis;
      this.canvas.height = hoehe * pixelVerhaeltnis;
      this.canvas.style.width = `${breite}px`;
      this.canvas.style.height = `${hoehe}px`;
    }
    this.pinsel.setTransform(pixelVerhaeltnis, 0, 0, pixelVerhaeltnis, 0, 0);
    this.groesseInPixeln = { breite, hoehe };
    return { breite: Math.floor(breite / zoom), hoehe: Math.floor(hoehe / zoom) };
  }

  // Zeichnet ein Feld als Tile, wenn eines passt, sonst als Zeichen mit Hintergrund
  feldZeichnen(bildX, bildY, zoom, name, zeichenEintrag, deckkraft) {
    const pinsel = this.pinsel;
    const pixelX = bildX * zoom, pixelY = bildY * zoom;
    pinsel.globalAlpha = deckkraft;
    const bild = this.tilebild(name, zoom);
    if (bild) {
      pinsel.drawImage(bild, pixelX, pixelY, zoom, zoom);
    } else {
      if (zeichenEintrag && zeichenEintrag.hintergrund) {
        pinsel.fillStyle = zeichenEintrag.hintergrund;
        pinsel.fillRect(pixelX, pixelY, zoom, zoom);
      }
      pinsel.fillStyle = zeichenEintrag?.farbe ?? "#ff00ff";
      pinsel.fillText(zeichenEintrag?.zeichen ?? "?", pixelX + zoom / 2, pixelY + zoom / 2 + 1);
    }
    pinsel.globalAlpha = 1;
  }

  // markierungen (reine Anzeige): { zeiger: {x, y} | null, weg: [{x, y}], gefahr: [{x, y}] angekündigte Zielfelder,
  //   ziel: null | { cursor: {x, y}, ok, bahn: [{x, y}], felder: [{x, y}], betroffene: [{x, y}] } Zielmodus,
  //   geschoss: {x, y} | null Feld der laufenden Geschossanimation }
  zeichnen(spiel, kamera, ansicht, zoom, markierungen = {}) {
    const pinsel = this.pinsel;
    const zustand = spiel.zustand;
    const ebene = zustand.ebene;
    const zeichensatz = this.zeichensatz;
    const gelaendeNameNachKennung = {};
    for (const [name, gelaende] of Object.entries(spiel.daten.gelaende)) gelaendeNameNachKennung[gelaende.kennung] = name;

    pinsel.imageSmoothingEnabled = false; // Pixelart scharf; nach jeder Größenänderung des Canvas neu setzen
    pinsel.fillStyle = "#000";
    pinsel.fillRect(0, 0, this.groesseInPixeln.breite, this.groesseInPixeln.hoehe);
    pinsel.font = `${Math.max(8, Math.floor(zoom * 0.9))}px ${SCHRIFT}`;
    pinsel.textAlign = "center";
    pinsel.textBaseline = "middle";

    const sichtbareFelder = new Set(zustand.sichtbareFelder);
    for (let bildY = 0; bildY < ansicht.hoehe; bildY++) {
      const y = kamera.y + bildY;
      if (y < 0 || y >= ebene.hoehe) continue;
      for (let bildX = 0; bildX < ansicht.breite; bildX++) {
        const x = kamera.x + bildX;
        if (x < 0 || x >= ebene.breite) continue;
        const feldIndex = y * ebene.breite + x;
        if (!ebene.erkundet[feldIndex]) continue;
        const gelaendeName = gelaendeNameNachKennung[ebene.felder[y][x]];
        const deckkraft = sichtbareFelder.has(feldIndex) ? 1 : DECKKRAFT_ERINNERT;
        this.feldZeichnen(bildX, bildY, zoom, gelaendeName, zeichensatz.gelaende[gelaendeName], deckkraft);
      }
    }

    // Oberfläche und Feuer liegen unter allem, was auf dem Feld steht
    this.schichtZeichnen(spiel, kamera, ansicht, zoom, sichtbareFelder, "oberflaeche");
    this.schichtZeichnen(spiel, kamera, ansicht, zoom, sichtbareFelder, "feuer");

    // Fallen unter Gegenständen unter Wesen; nur, was gerade sichtbar ist, verborgene Fallen erst, wenn entdeckt
    const sichtbareEntitaeten = Object.values(zustand.entitaeten).filter((entitaet) =>
      entitaet.position && sichtbareFelder.has(entitaet.position.y * ebene.breite + entitaet.position.x)
      && (!entitaet.falle || istBekannt(entitaet))
    );
    const istWesen = (entitaet) => entitaet.fraktion !== undefined;
    const ebeneVon = (entitaet) => (entitaet.falle ? 0 : istWesen(entitaet) ? 2 : 1);
    const zeichenreihenfolge = [0, 1, 2].flatMap((stufe) => sichtbareEntitaeten.filter((entitaet) => ebeneVon(entitaet) === stufe));
    for (const entitaet of zeichenreihenfolge) {
      const bildX = entitaet.position.x - kamera.x, bildY = entitaet.position.y - kamera.y;
      if (bildX < 0 || bildY < 0 || bildX >= ansicht.breite || bildY >= ansicht.hoehe) continue;
      const zeichenEintrag = entitaet.falle ? zeichensatz.fallen?.[entitaet.typ] : istWesen(entitaet) ? zeichensatz.wesen[entitaet.typ] : zeichensatz.gegenstaende[entitaet.typ];
      // Tiles sind durchsichtig und liegen auf dem schon gezeichneten Boden; ein Zeichen braucht den Hintergrund
      // des Bodens nur, wenn der Boden selbst als Zeichen gezeichnet wurde
      const bodenName = gelaendeNameNachKennung[ebene.felder[entitaet.position.y][entitaet.position.x]];
      const bodenAlsZeichen = !this.tilebild(bodenName, zoom);
      const hintergrund = bodenAlsZeichen ? zeichensatz.gelaende[bodenName]?.hintergrund : undefined;
      this.feldZeichnen(bildX, bildY, zoom, entitaet.typ, { ...zeichenEintrag, hintergrund }, 1);
    }

    // Gas schwebt über allem
    this.schichtZeichnen(spiel, kamera, ansicht, zoom, sichtbareFelder, "gas");
    this.markierungenZeichnen(kamera, ansicht, zoom, markierungen);
  }

  // Eine Feldschicht als farbige Überlagerung auf sichtbaren Feldern (Farben in zeichen.schichten, Feuer mit Zeichen)
  schichtZeichnen(spiel, kamera, ansicht, zoom, sichtbareFelder, schicht) {
    const pinsel = this.pinsel;
    const ebene = spiel.zustand.ebene;
    const farben = this.zeichensatz.schichten || {};
    for (const [indexText, eintrag] of Object.entries(schichtenVon(ebene)[schicht])) {
      const index = Number(indexText);
      if (!sichtbareFelder.has(index)) continue;
      const { x, y } = feldVonIndex(ebene, index);
      const bildX = x - kamera.x, bildY = y - kamera.y;
      if (bildX < 0 || bildY < 0 || bildX >= ansicht.breite || bildY >= ansicht.hoehe) continue;
      const darstellung = farben[schicht === "feuer" ? "feuer" : eintrag.art];
      if (!darstellung) continue;
      const deckkraft = schicht === "gas" ? Math.min(GAS_DECKKRAFT, (GAS_DECKKRAFT * eintrag.menge) / GAS_VOLL)
        : schicht === "feuer" ? FEUER_DECKKRAFT : OBERFLAECHE_DECKKRAFT;
      pinsel.globalAlpha = deckkraft;
      pinsel.fillStyle = darstellung.farbe;
      pinsel.fillRect(bildX * zoom, bildY * zoom, zoom, zoom);
      if (darstellung.zeichen) {
        pinsel.globalAlpha = 1;
        pinsel.fillText(darstellung.zeichen, bildX * zoom + zoom / 2, bildY * zoom + zoom / 2 + 1);
      }
    }
    pinsel.globalAlpha = 1;
  }

  // Rahmen um ein Feld, innen an der Feldgrenze
  feldRahmen(kamera, zoom, feld, farbe) {
    const pinsel = this.pinsel;
    pinsel.strokeStyle = farbe;
    pinsel.lineWidth = Math.max(1, Math.floor(zoom / 16));
    const halbeLinienbreite = pinsel.lineWidth / 2;
    pinsel.strokeRect(
      (feld.x - kamera.x) * zoom + halbeLinienbreite, (feld.y - kamera.y) * zoom + halbeLinienbreite,
      zoom - 2 * halbeLinienbreite, zoom - 2 * halbeLinienbreite
    );
  }

  // hervorgehoben: Feld eines Wesens, über dem in der Seitenleiste der Zeiger steht (Rahmen in Biergold)
  markierungenZeichnen(kamera, ansicht, zoom, { zeiger = null, weg = [], gefahr = [], ziel = null, geschoss = null, hervorgehoben = null }) {
    const pinsel = this.pinsel;
    const imAusschnitt = (feld) =>
      feld.x - kamera.x >= 0 && feld.y - kamera.y >= 0 && feld.x - kamera.x < ansicht.breite && feld.y - kamera.y < ansicht.hoehe;
    const flaeche = (felder, farbe) => {
      pinsel.fillStyle = farbe;
      for (const feld of felder) {
        if (imAusschnitt(feld)) pinsel.fillRect((feld.x - kamera.x) * zoom, (feld.y - kamera.y) * zoom, zoom, zoom);
      }
    };
    pinsel.fillStyle = "rgba(200, 60, 40, 0.35)";
    for (const feld of gefahr) {
      if (imAusschnitt(feld)) pinsel.fillRect((feld.x - kamera.x) * zoom, (feld.y - kamera.y) * zoom, zoom, zoom);
    }
    pinsel.fillStyle = "rgba(224, 168, 58, 0.25)";
    for (const feld of weg) {
      if (imAusschnitt(feld)) pinsel.fillRect((feld.x - kamera.x) * zoom, (feld.y - kamera.y) * zoom, zoom, zoom);
    }
    // Zielmodus: Bahn, Fläche, Betroffene, Cursor grün (ginge) oder rot (Grund dagegen); er ersetzt den Zeiger
    if (ziel) {
      flaeche(ziel.bahn, "rgba(242, 230, 200, 0.18)");
      flaeche(ziel.felder, "rgba(120, 170, 255, 0.30)");
      for (const feld of ziel.betroffene) if (imAusschnitt(feld)) this.feldRahmen(kamera, zoom, feld, "#f2c14e");
      if (imAusschnitt(ziel.cursor)) this.feldRahmen(kamera, zoom, ziel.cursor, ziel.ok ? "#7fd36b" : "#d9553b");
    } else if (zeiger && imAusschnitt(zeiger)) {
      this.feldRahmen(kamera, zoom, zeiger, "#c87533");
    }
    if (hervorgehoben && imAusschnitt(hervorgehoben)) {
      this.feldRahmen(kamera, zoom, hervorgehoben, "#f2c14e");
    }
    // Geschoss als kleines helles Quadrat in der Feldmitte
    if (geschoss && imAusschnitt(geschoss)) {
      const kante = Math.max(2, Math.floor(zoom / 3));
      pinsel.fillStyle = "#f2e6c8";
      pinsel.fillRect((geschoss.x - kamera.x) * zoom + (zoom - kante) / 2, (geschoss.y - kamera.y) * zoom + (zoom - kante) / 2, kante, kante);
    }
  }
}
