// Fernwaffen und Munition (Modell siehe src/systeme/fernkampf.js, Spieldesign in docs/Skills.md, Kampf, Fernkampf);
// Zahlen vorläufig, Normierung in docs/Wesen.md, Normierung. Schleuder, Bogen, Steine und Pfeile liegen im Keller
// (datenproben/ebenen.js); Armbrust, Pistole, Druckkanone, Laser und Brandpfeil nur in Tests und Arena, je ein Teil des
// Modells: Magazin aus Munition, Salve, Magazin, das sich selbst füllt, Strahl, Munition mit eigener Wirkung.
const spannwaffe = (tags = []) => ["fernkampf", "spann", ...tags];

export default {
  // ohne Magazin: jeder Schuss nimmt einen Stein aus dem Gepäck, das Laden steckt in den Kosten
  schleuder: {
    text: "gegenstand.schleuder", aufhebbar: true, gewicht: 200,
    ausruestung: {
      platz: "hand",
      schuss: { name: "schleuderwurf", genauigkeit: 80, effekt: "schleuderstein_treffer", reichweite: 7, sorte: "stein", kosten: 100, laerm: 1, tags: spannwaffe() },
    },
  },
  // ohne Magazin, langsam (das Spannen steckt in den Kosten), trifft deutlich härter als ein Schwerthieb
  kurzbogen: {
    text: "gegenstand.kurzbogen", aufhebbar: true, gewicht: 800,
    ausruestung: {
      platz: "hand", belegt: 2,
      schuss: { name: "pfeilschuss", genauigkeit: 85, effekt: "pfeil_treffer", reichweite: 8, sorte: "pfeil", kosten: 150, tags: spannwaffe() },
    },
  },
  // vorladbar wie eine Feuerwaffe, lädt lange nach
  armbrust: {
    text: "gegenstand.armbrust", aufhebbar: true, gewicht: 3000,
    ausruestung: {
      platz: "hand", belegt: 2,
      schuss: { name: "bolzenschuss", genauigkeit: 90, effekt: "bolzen_treffer", reichweite: 9, sorte: "bolzen", kosten: 100, magazin: { fasst: 1, nachladen: 250 }, tags: spannwaffe() },
    },
  },
  // Magazin mit sechs Schuss, eine Salve aus zwei Schüssen je Aktion; laut
  pistole: {
    text: "gegenstand.pistole", aufhebbar: true, gewicht: 1200,
    ausruestung: {
      platz: "hand",
      schuss: { name: "pistolenschuss", genauigkeit: 85, effekt: "kugel_treffer", reichweite: 8, sorte: "kugel", kosten: 100, schuesse: 2, laerm: 15, magazin: { fasst: 6, nachladen: 200 }, tags: ["fernkampf", "feuer"] },
    },
  },
  // Druck: das Magazin füllt sich ohne Munition selbst, der Schuss stößt das Ziel zurück
  druckkanone: {
    text: "gegenstand.druckkanone", aufhebbar: true, gewicht: 5000,
    ausruestung: {
      platz: "hand", belegt: 2,
      schuss: { name: "druckstoss", genauigkeit: 75, effekt: "druckstoss", reichweite: 6, kosten: 100, laerm: 6, magazin: { fasst: 3, auffuellen: { je: 300 } }, tags: ["fernkampf", "druck"] },
    },
  },
  // Energie: Zellen im Magazin, ein Strahl durch alle Ziele in einer Linie
  laser: {
    text: "gegenstand.laser", aufhebbar: true, gewicht: 3000,
    ausruestung: {
      platz: "hand", belegt: 2,
      schuss: { name: "laserstrahl", genauigkeit: 95, effekt: "laserstrahl", reichweite: 10, zielart: "strahl", sorte: "zelle", kosten: 100, laerm: 3, magazin: { fasst: 20, nachladen: 150 }, tags: ["fernkampf", "energie"] },
    },
  },

  // Munition; der Schleuderstein taugt auch von Hand als schwache Wurfwaffe
  schleuderstein: {
    text: "gegenstand.schleuderstein", aufhebbar: true, stapelbar: true, gewicht: 100,
    geschoss: { sorte: "stein", bruchchance: 5 },
    wurf: { effekt: "stein_wurf", genauigkeit: 70, kosten: 70, bruchchance: 5, zweck: ["angriff"] },
  },
  pfeil: { text: "gegenstand.pfeil", aufhebbar: true, stapelbar: true, gewicht: 30, geschoss: { sorte: "pfeil" } },
  brandpfeil: { text: "gegenstand.brandpfeil", aufhebbar: true, stapelbar: true, gewicht: 40, geschoss: { sorte: "pfeil", effekt: "brandpfeil_glut", bruchchance: 100 } },
  bolzen: { text: "gegenstand.bolzen", aufhebbar: true, stapelbar: true, gewicht: 50, geschoss: { sorte: "bolzen" } },
  kugel: { text: "gegenstand.kugel", aufhebbar: true, stapelbar: true, gewicht: 20, geschoss: { sorte: "kugel", bruchchance: 100 } },
  zelle: { text: "gegenstand.zelle", aufhebbar: true, stapelbar: true, gewicht: 200, geschoss: { sorte: "zelle", bruchchance: 100 } },
};
