// Richtungen des Absuds im Probeinhalt (siehe docs/Sude.md, Absud; Spieldesign in docs/Brauen.md, Absud): eine
// Schadensart oder ein anderes Feld der Wirkung, je mit zwei Polen; Zahlen vorläufig. Die Reihenfolge entscheidet bei
// Gleichstand der Punkte.
//   elixier, gift: { stufen: [{ ab, zustand, misslingen? }] }; es gilt die höchste Stufe, deren ab die Stärke des
//   Absuds erreicht; misslingen sind Punkte auf die Chance, dass der Absud ganz misslingt (anspruchsvolle Wirkungen)
//   Das Getränk je Pol ist ein Gegenstand mit absud: { richtung, pol } (datenproben/absude.js).
export default {
  feuer: {
    text: "absudrichtung.feuer",
    elixier: { stufen: [{ ab: 1, zustand: "feuerschutz" }, { ab: 4, zustand: "feuerfest", misslingen: 25 }] },
    gift: { stufen: [{ ab: 1, zustand: "brennend" }] },
  },
  saeure: {
    text: "absudrichtung.saeure",
    elixier: { stufen: [{ ab: 1, zustand: "saeureschutz" }] },
    gift: { stufen: [{ ab: 1, zustand: "veraetzt" }] },
  },
  sicht: {
    text: "absudrichtung.sicht",
    elixier: { stufen: [{ ab: 1, zustand: "hellsicht" }] },
    gift: { stufen: [{ ab: 1, zustand: "trugbilder" }] },
  },
};
