// Zutaten zum Brauen (Daten am Gegenstand: zutat, siehe docs/Sude.md, Profil); Zahlen vorläufig
//   extrakt: Zehntel °Plato bei einem ganz mit dieser Zutat gefüllten Kessel; farbe in EBC und bitter in IBU, ebenso je
//   vollem Kessel; aromen: Anteile, die sich nach Menge mitteln
const zutat = (text, daten) => ({ text, aufhebbar: true, stapelbar: true, gewicht: 500, zutat: daten });

export default {
  gerstenmalz: zutat("gegenstand.gerstenmalz", { art: "grundstoff", extrakt: 160, farbe: 8, aromen: { malz: 80, suesse: 20 } }),
  emmer: zutat("gegenstand.emmer", { art: "grundstoff", extrakt: 140, farbe: 6, aromen: { malz: 60, kraeuter: 10, saeure: 10 } }),
  // Bappir: gebackenes Bierbrot, dunkel und röstig
  bierbrot: zutat("gegenstand.bierbrot", { art: "grundstoff", extrakt: 120, farbe: 60, aromen: { malz: 40, roest: 50, suesse: 10 } }),
  datteln: zutat("gegenstand.datteln", { art: "grundstoff", extrakt: 180, farbe: 25, aromen: { frucht: 60, suesse: 40 } }),
  honig: zutat("gegenstand.honig", { art: "grundstoff", extrakt: 200, farbe: 4, aromen: { suesse: 90, kraeuter: 10 } }),
  wacholder: zutat("gegenstand.wacholder", { art: "gewuerz", bitter: 40, aromen: { kraeuter: 80, frucht: 20 } }),
};
