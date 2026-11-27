// Kessel als Gegenstände (docs/Brauen.md, Kessel; Daten in docs/Sude.md, Befehl): gebraut wird an einem Kessel, der auf
// oder neben dem Feld der Brauerin am Boden steht, im Gepäck braut er nicht; Tiers nach Material, Zahlen vorläufig
//   kessel: { portionen, verderben?, unschaerfe?, stueckeJePortion? } wie am Gelände (Vorgabe für stueckeJePortion:
//   regeln.brauen.stueckeJePortion); der Tonkessel steht als Gelände in datenproben/gelaende.js
const kessel = (text, gewicht, daten) => ({ text, aufhebbar: true, gewicht, kessel: daten });

export default {
  // leicht und klein, verdirbt eher: Holz lässt sich schlecht reinigen (das Steinbier mit heißen Steinen folgt später)
  holzkessel: kessel("gegenstand.holzkessel", 3000, { portionen: 2, stueckeJePortion: 3, verderben: 5 }),
  // schwer, fasst viel, verdirbt seltener und streut weniger
  kupferkessel: kessel("gegenstand.kupferkessel", 10000, { portionen: 6, stueckeJePortion: 5, verderben: -10, unschaerfe: 80 }),
};
