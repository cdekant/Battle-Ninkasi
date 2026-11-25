// Ausrüstung (Aufbau siehe src/systeme/ausruestung.js); alle Zahlen vorläufig.
// Waffen in den Händen ersetzen die Faust; Kupferteile bilden ein Set (traegt_tag kupfer, anzahl 2).
// Rüstung trägt den Tag ruestung_leicht oder ruestung_schwer, danach lernen die Rüstungsskills (src/systeme/lernen.js).
// zeit: An- und Ablegen je Stück; verlangsamung: eine volle leichte Rüstung bremst um 10 %, eine volle schwere um 30 %.
// Haltbarkeit (src/systeme/verschleiss.js): Säure frisst an Rüstung, angefressen schützt sie weniger, bei 0 bleiben Reste;
// Leder ist gegen Säure unempfindlich (haltbarkeit.unempfindlich) und schützt ein wenig vor ihr (ruestung.saeure).
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
    text: "gegenstand.lederschuerze", aufhebbar: true, gewicht: 2000, tags: ["ruestung_leicht"], haltbarkeit: { hoechstens: 20, wirdZu: "lederfetzen", unempfindlich: { saeure: 75 } },
    ausruestung: { platz: "brust", zeit: 200, verlangsamung: 6, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }, { ziel: "ruestung.saeure", art: "plus", betrag: 1 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] },
  },
  // leuchtet angelegt vom Feld der Trägerin aus, am Boden auch, im Gepäck nicht (src/systeme/licht.js)
  laterne: {
    text: "gegenstand.laterne", aufhebbar: true, gewicht: 800,
    licht: { reichweite: 4, staerke: 80, farbe: "#ffd27a" },
    ausruestung: { platz: "hand", zeit: 50 },
  },
  kupferhelm: {
    text: "gegenstand.kupferhelm", aufhebbar: true, gewicht: 1500, tags: ["kupfer", "ruestung_schwer"], haltbarkeit: { hoechstens: 40, wirdZu: "kupferschrott" },
    ausruestung: { platz: "kopf", zeit: 100, verlangsamung: 6, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }, KUPFERSET] },
  },
  lederhose: {
    text: "gegenstand.lederhose", aufhebbar: true, gewicht: 1500, tags: ["ruestung_leicht"], haltbarkeit: { hoechstens: 20, wirdZu: "lederfetzen", unempfindlich: { saeure: 75 } },
    ausruestung: { platz: "beine", zeit: 200, verlangsamung: 4, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }, { ziel: "ruestung.saeure", art: "plus", betrag: 1 }] },
  },
  hopfenkette: {
    text: "gegenstand.hopfenkette", aufhebbar: true, gewicht: 100,
    ausruestung: { platz: "hals", zeit: 50, modifikatoren: [{ ziel: "regeneration.lp", art: "prozent", betrag: 20 }] },
  },
  kupferring: {
    text: "gegenstand.kupferring", aufhebbar: true, gewicht: 20, tags: ["kupfer"],
    ausruestung: { platz: "finger", zeit: 50, modifikatoren: [{ ziel: "willenskraft", art: "plus", betrag: 5 }, KUPFERSET] },
  },
  // Ninkasis Dolch der Grundausstattung (datenproben/index.js), dazu Prüfwaffen und Prüfrüstungen nur für die Arenen
  // pruefwaffen, pruefruestung und kette (datenproben/arenen.js), auf keiner Ebene; Ziele und Messwerte in docs/Entwicklung.md. Gegen ein Normwesen ohne Ausweichen in Schaden je 100
  // Zeiteinheiten: Faust 8,8, Dolch 10,6 (dazu Krits), Speer 10,9 (trifft zwei in Linie), Schwert 12,0, Zweihänder 14,4.
  dolch: {
    text: "gegenstand.dolch", aufhebbar: true, gewicht: 500,
    ausruestung: { platz: "hand", zeit: 50, angriffe: [{ name: "dolch", genauigkeit: 90, effekt: "dolchstich", kosten: 50, kritchance: 10, tags: ["nahkampf", "kurze_klinge"] }] },
  },
  pruefschwert: {
    text: "gegenstand.pruefschwert", aufhebbar: true, gewicht: 1500,
    ausruestung: { platz: "hand", zeit: 50, angriffe: [{ name: "pruefschwert", genauigkeit: 80, effekt: "pruefschwert_hieb", kosten: 70, tags: ["nahkampf", "lange_klinge"] }] },
  },
  pruefspeer: {
    text: "gegenstand.pruefspeer", aufhebbar: true, gewicht: 2500,
    ausruestung: {
      platz: "hand", belegt: 2, zeit: 100,
      angriffe: [{ name: "pruefspeer", genauigkeit: 80, effekt: "pruefspeer_stoss", kosten: 70, muster: { art: "linie", laenge: 2 }, tags: ["nahkampf", "stangenwaffe"] }],
    },
  },
  pruefzweihaender: {
    text: "gegenstand.pruefzweihaender", aufhebbar: true, gewicht: 6000,
    ausruestung: {
      platz: "hand", belegt: 2, zeit: 150,
      angriffe: [{ name: "pruefzweihaender", genauigkeit: 70, effekt: "pruefzweihaender_schlag", kosten: 100, tags: ["nahkampf", "wuchtwaffe"] }],
      modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -5 }],
    },
  },
  // Rüstung in zwei Familien (leicht, schwer), das Gewicht ist ein eigener Wert; Leder ist gegen Säure unempfindlich
  // und schützt ein wenig vor ihr, Metall nicht, hält dafür länger
  lederwams: {
    text: "gegenstand.lederwams", aufhebbar: true, gewicht: 3000, tags: ["ruestung_leicht"],
    haltbarkeit: { hoechstens: 20, wirdZu: "lederfetzen", unempfindlich: { saeure: 75 } },
    ausruestung: { platz: "brust", zeit: 200, verlangsamung: 4, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }, { ziel: "ruestung.saeure", art: "plus", betrag: 1 }, { ziel: "ausweichen", art: "plus", betrag: -3 }] },
  },
  polsterrock: {
    text: "gegenstand.polsterrock", aufhebbar: true, gewicht: 6000, tags: ["ruestung_leicht"],
    haltbarkeit: { hoechstens: 30, wirdZu: "lederfetzen", unempfindlich: { saeure: 75 } },
    ausruestung: { platz: "brust", zeit: 200, verlangsamung: 6, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 3 }, { ziel: "ruestung.saeure", art: "plus", betrag: 1 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] },
  },
  schuppenhemd: {
    text: "gegenstand.schuppenhemd", aufhebbar: true, gewicht: 8000, tags: ["ruestung_schwer"],
    haltbarkeit: { hoechstens: 40, wirdZu: "kupferschrott" },
    ausruestung: { platz: "brust", zeit: 300, verlangsamung: 12, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 4 }, { ziel: "ausweichen", art: "plus", betrag: -8 }] },
  },
  plattenharnisch: {
    text: "gegenstand.plattenharnisch", aufhebbar: true, gewicht: 14000, tags: ["ruestung_schwer"],
    haltbarkeit: { hoechstens: 60, wirdZu: "kupferschrott" },
    ausruestung: { platz: "brust", zeit: 400, verlangsamung: 18, modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 6 }, { ziel: "ausweichen", art: "plus", betrag: -12 }] },
  },
  // Reste zerfressener Rüstung; Ballast, später vielleicht Material
  lederfetzen: { text: "gegenstand.lederfetzen", aufhebbar: true, stapelbar: true, gewicht: 300 },
  kupferschrott: { text: "gegenstand.kupferschrott", aufhebbar: true, stapelbar: true, gewicht: 500 },
};
