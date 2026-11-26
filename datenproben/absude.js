// Getränke des Absuds im Probeinhalt (siehe docs/Sude.md, Absud): je Richtung und Pol ein Gegenstand; die Stärke setzt
// der Befehl brauen (src/systeme/absud.js), gefundene haben Stärke 1. Unbekannt mit Etikett der Gruppe "absude", bis
// Ninkasi die Sorte braut, trinkt oder wirft (src/systeme/kennen.js). Zahlen vorläufig.
const absud = (text, richtung, pol) => ({
  text, aufhebbar: true, stapelbar: true, gewicht: 900,
  absud: { richtung, pol, staerke: 1 },
  trinkbar: { effekt: "absud_trinken" },
  wurf: { effekt: "absud_zerspringt", ...(pol === "gift" && { zweck: ["angriff"] }) },
  unbekannt: { gruppe: "absude", schwierigkeit: 50 },
});

export default {
  feuerelixier: absud("gegenstand.feuerelixier", "feuer", "elixier"),
  feuergift: absud("gegenstand.feuergift", "feuer", "gift"),
  saeureelixier: absud("gegenstand.saeureelixier", "saeure", "elixier"),
  saeuregift: absud("gegenstand.saeuregift", "saeure", "gift"),
  sichtelixier: absud("gegenstand.sichtelixier", "sicht", "elixier"),
  sichtgift: absud("gegenstand.sichtgift", "sicht", "gift"),
};
