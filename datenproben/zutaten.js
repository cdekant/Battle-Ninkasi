// Zutaten zum Brauen (Daten am Gegenstand: zutat, siehe docs/Sude.md, Profil) und Proben von Kulturen; Zahlen vorläufig
//   extrakt: Zehntel °Plato, wenn ein Stück auf eine Portion kommt; farbe in EBC und bitter in IBU ebenso; aromen:
//   Anteile, die sich nach Menge mitteln
//   kultur: wer den Gegenstand aufhebt, gewinnt diese Kultur, der Gegenstand vergeht (src/systeme/brauen.js)
const zutat = (text, daten) => ({ text, aufhebbar: true, stapelbar: true, gewicht: 500, zutat: daten });
const kulturprobe = (text, kultur) => ({ text, aufhebbar: true, gewicht: 0, kultur });

export default {
  gerstenmalz: zutat("gegenstand.gerstenmalz", { art: "grundstoff", extrakt: 80, farbe: 4, aromen: { malz: 80, suesse: 20 } }),
  emmer: zutat("gegenstand.emmer", { art: "grundstoff", extrakt: 70, farbe: 3, aromen: { malz: 60, kraeuter: 10, saeure: 10 } }),
  // Bappir: gebackenes Bierbrot, dunkel und röstig
  bierbrot: zutat("gegenstand.bierbrot", { art: "grundstoff", extrakt: 60, farbe: 30, aromen: { malz: 40, roest: 50, suesse: 10 } }),
  datteln: zutat("gegenstand.datteln", { art: "grundstoff", extrakt: 90, farbe: 12, aromen: { frucht: 60, suesse: 40 } }),
  honig: zutat("gegenstand.honig", { art: "grundstoff", extrakt: 100, farbe: 2, aromen: { suesse: 90, kraeuter: 10 } }),
  wacholder: zutat("gegenstand.wacholder", { art: "gewuerz", bitter: 20, aromen: { kraeuter: 80, frucht: 20 } }),
  // Proben von Kulturen, bis Kulturen auf anderen Wegen zu gewinnen sind (docs/Systemausbau.md, Punkt 23)
  hefekrug: kulturprobe("gegenstand.hefekrug", "bierhefe"),
  sauerkrug: kulturprobe("gegenstand.sauerkrug", "milchsaeure"),
};
