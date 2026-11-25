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
  // nach der letzten Stufe des Verderbens (regeln.brauen.essig, src/systeme/reifen.js): eine Zutat, vor allem Säure
  essig: {
    text: "gegenstand.essig", aufhebbar: true, stapelbar: true, gewicht: 900,
    zutat: { art: "grundstoff", aromen: { saeure: 100 } },
  },
};
