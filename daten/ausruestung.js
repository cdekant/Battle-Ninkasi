// Ausrüstung (Aufbau siehe src/systeme/ausruestung.js); alle Zahlen vorläufig.
// Waffen in den Händen ersetzen die Faust; Kupferteile bilden ein Set (traegt_tag kupfer, anzahl 2).
const KUPFERSET = { ziel: "willenskraft", art: "plus", betrag: 10, wenn: [{ bedingung: "traegt_tag", tag: "kupfer", anzahl: 2 }] };

export default {
  // flink und handlich: ein Hieb mit dem Schöpfer
  schoepfkelle: {
    text: "gegenstand.schoepfkelle", aufhebbar: true,
    ausruestung: { platz: "hand", angriffe: [{ name: "schoepfkelle", genauigkeit: 85, effekt: "kellenschlag", kosten: 90 }] },
  },
  // schwer, langsam, zweihändig
  fasshammer: {
    text: "gegenstand.fasshammer", aufhebbar: true,
    ausruestung: {
      platz: "hand", belegt: 2,
      angriffe: [{ name: "fasshammer", genauigkeit: 70, effekt: "hammerschlag", kosten: 150 }],
      modifikatoren: [{ ziel: "ausweichen", art: "plus", betrag: -5 }],
    },
  },
  lederschuerze: {
    text: "gegenstand.lederschuerze", aufhebbar: true,
    ausruestung: { platz: "brust", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 2 }, { ziel: "ausweichen", art: "plus", betrag: -5 }] },
  },
  kupferhelm: {
    text: "gegenstand.kupferhelm", aufhebbar: true, tags: ["kupfer"],
    ausruestung: { platz: "kopf", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }, KUPFERSET] },
  },
  lederhose: {
    text: "gegenstand.lederhose", aufhebbar: true,
    ausruestung: { platz: "beine", modifikatoren: [{ ziel: "ruestung", art: "plus", betrag: 1 }] },
  },
  hopfenkette: {
    text: "gegenstand.hopfenkette", aufhebbar: true,
    ausruestung: { platz: "hals", modifikatoren: [{ ziel: "regeneration.lp", art: "prozent", betrag: 20 }] },
  },
  kupferring: {
    text: "gegenstand.kupferring", aufhebbar: true, tags: ["kupfer"],
    ausruestung: { platz: "finger", modifikatoren: [{ ziel: "willenskraft", art: "plus", betrag: 5 }, KUPFERSET] },
  },
};
