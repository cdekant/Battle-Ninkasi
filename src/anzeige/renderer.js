// Renderer: zeichnet die Karte auf ein Canvas, vorerst mit Zeichen statt Tiles.
// Liest den Zustand nur. Tileset aus daten/zeichen.js; fehlt ein Eintrag, erscheint "?".
// Später: Tilesets je Auflösung, Wahl des passenden Satzes zur Zoomstufe.

const SCHRIFT = '"DejaVu Sans Mono", "Cascadia Mono", Consolas, monospace';
const ERINNERT = 0.35; // Deckkraft erkundeter, aber gerade nicht sichtbarer Felder

export class Renderer {
  constructor(canvas, tileset) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tileset = tileset;
  }

  // Passt das Canvas an seinen Container an und gibt die Ansicht in Feldern zurück
  ansicht(zoom) {
    const box = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const b = Math.floor(box.width), h = Math.floor(box.height);
    if (this.canvas.width !== b * dpr || this.canvas.height !== h * dpr) {
      this.canvas.width = b * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = `${b}px`;
      this.canvas.style.height = `${h}px`;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.pixel = { b, h };
    return { breite: Math.floor(b / zoom), hoehe: Math.floor(h / zoom) };
  }

  feld(sx, sy, zoom, eintrag, deckkraft) {
    const ctx = this.ctx;
    const x = sx * zoom, y = sy * zoom;
    ctx.globalAlpha = deckkraft;
    if (eintrag && eintrag.hintergrund) {
      ctx.fillStyle = eintrag.hintergrund;
      ctx.fillRect(x, y, zoom, zoom);
    }
    ctx.fillStyle = eintrag?.farbe ?? "#ff00ff";
    ctx.fillText(eintrag?.zeichen ?? "?", x + zoom / 2, y + zoom / 2 + 1);
    ctx.globalAlpha = 1;
  }

  zeichnen(spiel, kamera, ansicht, zoom) {
    const ctx = this.ctx;
    const z = spiel.zustand;
    const e = z.ebene;
    const ts = this.tileset;
    const gelaendeNamen = {};
    for (const [n, g] of Object.entries(spiel.daten.gelaende)) gelaendeNamen[g.kennung] = n;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.pixel.b, this.pixel.h);
    ctx.font = `${Math.max(8, Math.floor(zoom * 0.9))}px ${SCHRIFT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const sichtbar = new Set(z.sichtbar);
    for (let sy = 0; sy < ansicht.hoehe; sy++) {
      const y = kamera.y + sy;
      if (y < 0 || y >= e.hoehe) continue;
      for (let sx = 0; sx < ansicht.breite; sx++) {
        const x = kamera.x + sx;
        if (x < 0 || x >= e.breite) continue;
        const i = y * e.breite + x;
        if (!e.erkundet[i]) continue;
        this.feld(sx, sy, zoom, ts.gelaende[gelaendeNamen[e.felder[y][x]]], sichtbar.has(i) ? 1 : ERINNERT);
      }
    }

    // Gegenstände unter Wesen; nur, was gerade sichtbar ist
    const ents = Object.values(z.entitaeten).filter((n) => n.position && sichtbar.has(n.position.y * e.breite + n.position.x));
    const istWesen = (n) => n.fraktion !== undefined;
    for (const n of [...ents.filter((n) => !istWesen(n)), ...ents.filter(istWesen)]) {
      const sx = n.position.x - kamera.x, sy = n.position.y - kamera.y;
      if (sx < 0 || sy < 0 || sx >= ansicht.breite || sy >= ansicht.hoehe) continue;
      const eintrag = istWesen(n) ? ts.wesen[n.typ] : ts.gegenstaende[n.typ];
      const boden = ts.gelaende[gelaendeNamen[e.felder[n.position.y][n.position.x]]];
      this.feld(sx, sy, zoom, { ...eintrag, hintergrund: boden && boden.hintergrund }, 1);
    }
  }
}
