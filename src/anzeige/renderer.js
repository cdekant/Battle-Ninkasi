// Renderer: zeichnet die Karte auf ein Canvas, vorerst mit Zeichen statt Tiles.
// Liest den Zustand nur. Tileset aus daten/zeichen.js; fehlt ein Eintrag, erscheint "?".
// Später: Tilesets je Auflösung, Wahl des passenden Satzes zur Zoomstufe.
// Bildschirmfelder (bildX, bildY) zählen ab der linken oberen Ecke des Ausschnitts.

const SCHRIFT = '"DejaVu Sans Mono", "Cascadia Mono", Consolas, monospace';
const DECKKRAFT_ERINNERT = 0.35; // erkundete, aber gerade nicht sichtbare Felder

export class Renderer {
  constructor(canvas, tileset) {
    this.canvas = canvas;
    this.pinsel = canvas.getContext("2d");
    this.tileset = tileset;
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

  feldZeichnen(bildX, bildY, zoom, tilesetEintrag, deckkraft) {
    const pinsel = this.pinsel;
    const pixelX = bildX * zoom, pixelY = bildY * zoom;
    pinsel.globalAlpha = deckkraft;
    if (tilesetEintrag && tilesetEintrag.hintergrund) {
      pinsel.fillStyle = tilesetEintrag.hintergrund;
      pinsel.fillRect(pixelX, pixelY, zoom, zoom);
    }
    pinsel.fillStyle = tilesetEintrag?.farbe ?? "#ff00ff";
    pinsel.fillText(tilesetEintrag?.zeichen ?? "?", pixelX + zoom / 2, pixelY + zoom / 2 + 1);
    pinsel.globalAlpha = 1;
  }

  // markierungen: { zeiger: {x, y} | null, weg: [{x, y}] } (reine Anzeige)
  zeichnen(spiel, kamera, ansicht, zoom, markierungen = {}) {
    const pinsel = this.pinsel;
    const zustand = spiel.zustand;
    const ebene = zustand.ebene;
    const tileset = this.tileset;
    const gelaendeNameNachKennung = {};
    for (const [name, gelaende] of Object.entries(spiel.daten.gelaende)) gelaendeNameNachKennung[gelaende.kennung] = name;

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
        const gelaendeEintrag = tileset.gelaende[gelaendeNameNachKennung[ebene.felder[y][x]]];
        this.feldZeichnen(bildX, bildY, zoom, gelaendeEintrag, sichtbareFelder.has(feldIndex) ? 1 : DECKKRAFT_ERINNERT);
      }
    }

    // Gegenstände unter Wesen; nur, was gerade sichtbar ist
    const sichtbareEntitaeten = Object.values(zustand.entitaeten).filter((entitaet) =>
      entitaet.position && sichtbareFelder.has(entitaet.position.y * ebene.breite + entitaet.position.x)
    );
    const istWesen = (entitaet) => entitaet.fraktion !== undefined;
    const zeichenreihenfolge = [...sichtbareEntitaeten.filter((entitaet) => !istWesen(entitaet)), ...sichtbareEntitaeten.filter(istWesen)];
    for (const entitaet of zeichenreihenfolge) {
      const bildX = entitaet.position.x - kamera.x, bildY = entitaet.position.y - kamera.y;
      if (bildX < 0 || bildY < 0 || bildX >= ansicht.breite || bildY >= ansicht.hoehe) continue;
      const tilesetEintrag = istWesen(entitaet) ? tileset.wesen[entitaet.typ] : tileset.gegenstaende[entitaet.typ];
      const bodenEintrag = tileset.gelaende[gelaendeNameNachKennung[ebene.felder[entitaet.position.y][entitaet.position.x]]];
      this.feldZeichnen(bildX, bildY, zoom, { ...tilesetEintrag, hintergrund: bodenEintrag && bodenEintrag.hintergrund }, 1);
    }

    this.markierungenZeichnen(kamera, ansicht, zoom, markierungen);
  }

  markierungenZeichnen(kamera, ansicht, zoom, { zeiger = null, weg = [] }) {
    const pinsel = this.pinsel;
    const imAusschnitt = (feld) =>
      feld.x - kamera.x >= 0 && feld.y - kamera.y >= 0 && feld.x - kamera.x < ansicht.breite && feld.y - kamera.y < ansicht.hoehe;
    pinsel.fillStyle = "rgba(224, 168, 58, 0.25)";
    for (const feld of weg) {
      if (imAusschnitt(feld)) pinsel.fillRect((feld.x - kamera.x) * zoom, (feld.y - kamera.y) * zoom, zoom, zoom);
    }
    if (zeiger && imAusschnitt(zeiger)) {
      pinsel.strokeStyle = "#c87533";
      pinsel.lineWidth = Math.max(1, Math.floor(zoom / 16));
      const halbeLinienbreite = pinsel.lineWidth / 2;
      pinsel.strokeRect(
        (zeiger.x - kamera.x) * zoom + halbeLinienbreite, (zeiger.y - kamera.y) * zoom + halbeLinienbreite,
        zoom - 2 * halbeLinienbreite, zoom - 2 * halbeLinienbreite
      );
    }
  }
}
