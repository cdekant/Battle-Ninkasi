// Ausrüstung (Aufbau siehe src/systeme/ausruestung.js); alle Zahlen vorläufig.
// Waffen in den Händen ersetzen die Faust; Kupferteile bilden ein Set (traegt_tag kupfer, anzahl 2).
// Rüstung trägt den Tag ruestung_leicht oder ruestung_schwer, danach lernen die Rüstungsskills (src/systeme/lernen.js).
// zeit: An- und Ablegen je Stück; verlangsamung: eine volle leichte Rüstung bremst um 10 %, eine volle schwere um 30 %.
// Haltbarkeit (src/systeme/verschleiss.js): Säure frisst an Rüstung, angefressen schützt sie weniger, bei 0 bleiben Reste.
const KUPFERSET = { ziel: "willenskraft", art: "plus", betrag: 10, wenn: [{ bedingung: "traegt_tag", tag: "kupfer", anzahl: 2 }] };

export default {
  // flink und handlich: ein Hieb mit dem Schöpfer
  schoepfkelle: {
    text: "gegenstand.schoepfkelle", aufhebbar: true, gewicht: 400,
    ausruestung: { platz: "hand", zeit: 50, angriffe: [{ name: "schoepfkelle", genauigkeit: 85, effekt: "kellenschlag", kosten: 70, tags: ["nahkampf"] }] },
  },
  // schwer, zweihändig, im Tempo der Norm
  fasshammer: {
    text: "gegenstand.fasshammer", aufhebbar: true, gewicht: 6000,
    ausruestung: {
      platz: "hand", belegt: 2, zeit: 150,
      angriffe: [{ name: "fasshammer", genauigkeit: 70, effekt: "hammerschlag", kosten: 100, tags: ["nahkampf"] }],
      modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -5 }],
    },
  },
  lederschuerze: {
    text: "gegenstand.lederschuerze", aufhebbar: true, gewicht: 2000, tags: ["ruestung_leicht"], haltbarkeit: { hoechstens: 20, wirdZu: "lederfetzen" },
    ausruestung: { platz: "brust", zeit: 200, verlangsamung: 6, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] },
  },
  // leuchtet angelegt vom Feld der Trägerin aus, am Boden auch, im Gepäck nicht (src/systeme/licht.js)
  laterne: {
    text: "gegenstand.laterne", aufhebbar: true, gewicht: 800,
    licht: { reichweite: 4, staerke: 80, farbe: "#ffd27a" },
    ausruestung: { platz: "hand", zeit: 50 },
  },
  kupferhelm: {
    text: "gegenstand.kupferhelm", aufhebbar: true, gewicht: 1500, tags: ["kupfer", "ruestung_schwer"], haltbarkeit: { hoechstens: 30, wirdZu: "kupferschrott" },
    ausruestung: { platz: "kopf", zeit: 100, verlangsamung: 6, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }, KUPFERSET] },
  },
  lederhose: {
    text: "gegenstand.lederhose", aufhebbar: true, gewicht: 1500, tags: ["ruestung_leicht"], haltbarkeit: { hoechstens: 20, wirdZu: "lederfetzen" },
    ausruestung: { platz: "beine", zeit: 200, verlangsamung: 4, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] },
  },
  hopfenkette: {
    text: "gegenstand.hopfenkette", aufhebbar: true, gewicht: 100,
    ausruestung: { platz: "hals", zeit: 50, modifikatoren: [{ ziel: "regeneration.lp", art: "prozent", betrag: 20 }] },
  },
  kupferring: {
    text: "gegenstand.kupferring", aufhebbar: true, gewicht: 20, tags: ["kupfer"],
    ausruestung: { platz: "finger", zeit: 50, modifikatoren: [{ ziel: "willenskraft", art: "plus", betrag: 5 }, KUPFERSET] },
  },
  // Reste zerfressener Rüstung; Ballast, später vielleicht Material
  lederfetzen: { text: "gegenstand.lederfetzen", aufhebbar: true, stapelbar: true, gewicht: 300 },
  kupferschrott: { text: "gegenstand.kupferschrott", aufhebbar: true, stapelbar: true, gewicht: 500 },
};
