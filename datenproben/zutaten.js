// Zutaten zum Brauen (Daten am Gegenstand: zutat, siehe docs/Sude.md, Profil) und Proben von Kulturen; Zahlen vorläufig
//   extrakt: Zehntel °Plato, wenn ein Stück auf eine Portion kommt; farbe in EBC und bitter in IBU ebenso; aromen:
//   Anteile, die sich nach Menge mitteln
//   richtungen, neigung, misslingen, schwierigkeit: Beiträge zum Absud (src/systeme/absud.js); richtungen sind Punkte
//   je Stück, neigung Punkte zum Elixier (minus zum Gift), misslingen Punkte auf die Chance des Misslingens; mit
//   schwierigkeit ist das Kraut zu Beginn unbekannt und zeigt eine Vermutung
//   kultur: wer den Gegenstand aufhebt, gewinnt diese Kultur, der Gegenstand vergeht (src/systeme/brauen.js)
// Die Tontafel lehrt beim Lesen ein Rezept (Baustein rezept_lernen, src/systeme/rezepte.js) und vergeht.
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
  // Malzsorten bringen ihren Röstgrad mit; unvermälzte Gerste gibt wenig Stärke und bleibt Beigabe
  roestmalz: zutat("gegenstand.roestmalz", { art: "grundstoff", extrakt: 70, farbe: 60, aromen: { malz: 40, roest: 60 } }),
  gerste: zutat("gegenstand.gerste", { art: "grundstoff", extrakt: 20, farbe: 2, aromen: { malz: 30, kraeuter: 10 } }),
  // Kräuter für den Absud: Senf brennt, Bilsenkraut verwirrt die Sinne und neigt zum Gift, Kamille besänftigt
  senfsaat: zutat("gegenstand.senfsaat", { art: "gewuerz", bitter: 10, aromen: { kraeuter: 60 }, richtungen: { feuer: 30 }, schwierigkeit: 30 }),
  bilsenkraut: zutat("gegenstand.bilsenkraut", { art: "gewuerz", aromen: { kraeuter: 80 }, richtungen: { sicht: 30 }, neigung: -30, misslingen: 5, schwierigkeit: 60 }),
  kamille: zutat("gegenstand.kamille", { art: "gewuerz", aromen: { kraeuter: 50, suesse: 10 }, neigung: 30, schwierigkeit: 20 }),
  // Proben von Kulturen, bis Kulturen auf anderen Wegen zu gewinnen sind (docs/Systemausbau.md, Punkt 23)
  hefekrug: kulturprobe("gegenstand.hefekrug", "bierhefe"),
  sauerkrug: kulturprobe("gegenstand.sauerkrug", "milchsaeure"),
  tontafel_dunkles_bier: { text: "gegenstand.tontafel", aufhebbar: true, gewicht: 300, lesbar: { effekt: "rezept_dunkles_bier" } },
};
