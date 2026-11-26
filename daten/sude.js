// Getränke aus dem Brauen und der Essig, zu dem sie am Ende werden (siehe docs/Sude.md, Wirkung): was regeln.brauen.getraenk und regeln.brauen.verdorben.getraenk
// nennen. Profil (sud), Name eines getroffenen Zielgebiets (text), Gefäß (wirdZu) und Gewicht setzt der Befehl brauen
// (src/systeme/brauen.js) an jede Portion; die Wirkung rechnet der Baustein sud_wirken aus dem Profil.
export default {
  sud: {
    text: "gegenstand.sud", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "sud_trinken", zweck: ["heilen"] },
  },
  sud_verdorben: {
    text: "gegenstand.sud_verdorben", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "sud_trinken" },
  },
  // ein misslungener Absud (regeln.brauen.absud.misslungen, src/systeme/absud.js): getrunken oder geworfen unwohl
  bruehe: {
    text: "gegenstand.bruehe", aufhebbar: true, stapelbar: true, gewicht: 900,
    trinkbar: { effekt: "bruehe_trinken" }, wurf: { effekt: "bruehe_zerspringt", zweck: ["angriff"] },
  },
  // Trockenbier (regeln.brauen.trockenbier.gegenstand, src/systeme/trockenbier.js): die Würze eines Suds, leicht und
  // ohne Gefäß; die Würze (trockenbier) setzt der Befehl brauen, angerührt wird es mit Gefäß und Kultur
  trockenbier: { text: "gegenstand.trockenbier", aufhebbar: true, stapelbar: true, gewicht: 100 },
  // nach der letzten Stufe des Verderbens (regeln.brauen.essig, src/systeme/reifen.js): eine Zutat, vor allem Säure
  essig: {
    text: "gegenstand.essig", aufhebbar: true, stapelbar: true, gewicht: 900,
    zutat: { art: "grundstoff", aromen: { saeure: 100 } },
  },
};
