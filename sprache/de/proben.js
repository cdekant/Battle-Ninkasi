// Deutsche Texte des Probeinhalts (datenproben/, siehe docs/Entwicklung.md, Probeinhalt); Aufbau wie sprache/de/texte.js.
// Kommt in src/inhalt.js zu den Texten des Grundgerüsts. Ohne englische Fassung, der Probeinhalt verschwindet mit dem
// echten Inhalt; im Englischen gelten diese Texte als Rückfall (src/anzeige/texte.js).
export default {
  "wesen.essigbakterium": {
    geschlecht: "n",
    einzahl: { nom: "Essigbakterium", gen: "Essigbakteriums", dat: "Essigbakterium", akk: "Essigbakterium" },
    mehrzahl: { nom: "Essigbakterien", gen: "Essigbakterien", dat: "Essigbakterien", akk: "Essigbakterien" },
  },
  "wesen.fernkaempfer_test": {
    geschlecht: "m",
    einzahl: { nom: "Fernkämpfer-Test", gen: "Fernkämpfer-Tests", dat: "Fernkämpfer-Test", akk: "Fernkämpfer-Test" },
    mehrzahl: { nom: "Fernkämpfer-Tests", gen: "Fernkämpfer-Tests", dat: "Fernkämpfer-Tests", akk: "Fernkämpfer-Tests" },
  },
  "falle.saeureduese": {
    geschlecht: "f",
    einzahl: { nom: "Säuredüse", gen: "Säuredüse", dat: "Säuredüse", akk: "Säuredüse" },
    mehrzahl: { nom: "Säuredüsen", gen: "Säuredüsen", dat: "Säuredüsen", akk: "Säuredüsen" },
  },
  "falle.klappergeschirr": {
    geschlecht: "n",
    einzahl: { nom: "Klappergeschirr", gen: "Klappergeschirrs", dat: "Klappergeschirr", akk: "Klappergeschirr" },
    mehrzahl: { nom: "Klappergeschirre", gen: "Klappergeschirre", dat: "Klappergeschirren", akk: "Klappergeschirre" },
  },
  "gegenstand.brandflasche": {
    geschlecht: "f",
    einzahl: { nom: "Brandflasche", gen: "Brandflasche", dat: "Brandflasche", akk: "Brandflasche" },
    mehrzahl: { nom: "Brandflaschen", gen: "Brandflaschen", dat: "Brandflaschen", akk: "Brandflaschen" },
  },
  "gegenstand.schoepfkelle": {
    geschlecht: "f",
    einzahl: { nom: "Schöpfkelle", gen: "Schöpfkelle", dat: "Schöpfkelle", akk: "Schöpfkelle" },
    mehrzahl: { nom: "Schöpfkellen", gen: "Schöpfkellen", dat: "Schöpfkellen", akk: "Schöpfkellen" },
  },
  "gegenstand.fasshammer": {
    geschlecht: "m",
    einzahl: { nom: "Fasshammer", gen: "Fasshammers", dat: "Fasshammer", akk: "Fasshammer" },
    mehrzahl: { nom: "Fasshämmer", gen: "Fasshämmer", dat: "Fasshämmern", akk: "Fasshämmer" },
  },
  "gegenstand.lederschuerze": {
    geschlecht: "f",
    einzahl: { nom: "Lederschürze", gen: "Lederschürze", dat: "Lederschürze", akk: "Lederschürze" },
    mehrzahl: { nom: "Lederschürzen", gen: "Lederschürzen", dat: "Lederschürzen", akk: "Lederschürzen" },
  },
  "gegenstand.laterne": {
    geschlecht: "f",
    einzahl: { nom: "Laterne", gen: "Laterne", dat: "Laterne", akk: "Laterne" },
    mehrzahl: { nom: "Laternen", gen: "Laternen", dat: "Laternen", akk: "Laternen" },
  },
  "gegenstand.kupferhelm": {
    geschlecht: "m",
    einzahl: { nom: "Kupferhelm", gen: "Kupferhelms", dat: "Kupferhelm", akk: "Kupferhelm" },
    mehrzahl: { nom: "Kupferhelme", gen: "Kupferhelme", dat: "Kupferhelmen", akk: "Kupferhelme" },
  },
  "gegenstand.lederhose": {
    geschlecht: "f",
    einzahl: { nom: "Lederhose", gen: "Lederhose", dat: "Lederhose", akk: "Lederhose" },
    mehrzahl: { nom: "Lederhosen", gen: "Lederhosen", dat: "Lederhosen", akk: "Lederhosen" },
  },
  "gegenstand.hopfenkette": {
    geschlecht: "f",
    einzahl: { nom: "Hopfenkette", gen: "Hopfenkette", dat: "Hopfenkette", akk: "Hopfenkette" },
    mehrzahl: { nom: "Hopfenketten", gen: "Hopfenketten", dat: "Hopfenketten", akk: "Hopfenketten" },
  },
  "gegenstand.kupferring": {
    geschlecht: "m",
    einzahl: { nom: "Kupferring", gen: "Kupferrings", dat: "Kupferring", akk: "Kupferring" },
    mehrzahl: { nom: "Kupferringe", gen: "Kupferringe", dat: "Kupferringen", akk: "Kupferringe" },
  },
  "gegenstand.bierfass": {
    geschlecht: "n",
    einzahl: { nom: "Bierfass", gen: "Bierfasses", dat: "Bierfass", akk: "Bierfass" },
    mehrzahl: { nom: "Bierfässer", gen: "Bierfässer", dat: "Bierfässern", akk: "Bierfässer" },
  },
  // Hauptwort mit festem Adjektiv: die leere Flasche, einer leeren Flasche, 3 leere Flaschen
  "gegenstand.leere_flasche": {
    geschlecht: "f", adjektive: ["adjektiv.leer"],
    einzahl: { nom: "Flasche", gen: "Flasche", dat: "Flasche", akk: "Flasche" },
    mehrzahl: { nom: "Flaschen", gen: "Flaschen", dat: "Flaschen", akk: "Flaschen" },
  },
  "gegenstand.sauerbier": {
    geschlecht: "n",
    einzahl: { nom: "Sauerbier", gen: "Sauerbiers", dat: "Sauerbier", akk: "Sauerbier" },
    mehrzahl: { nom: "Sauerbiere", gen: "Sauerbiere", dat: "Sauerbieren", akk: "Sauerbiere" },
  },
  "gegenstand.lederfetzen": {
    geschlecht: "m",
    einzahl: { nom: "Lederfetzen", gen: "Lederfetzens", dat: "Lederfetzen", akk: "Lederfetzen" },
    mehrzahl: { nom: "Lederfetzen", gen: "Lederfetzen", dat: "Lederfetzen", akk: "Lederfetzen" },
  },
  "gegenstand.kupferschrott": {
    geschlecht: "m",
    einzahl: { nom: "Kupferschrott", gen: "Kupferschrotts", dat: "Kupferschrott", akk: "Kupferschrott" },
    mehrzahl: { nom: "Kupferschrotte", gen: "Kupferschrotte", dat: "Kupferschrotten", akk: "Kupferschrotte" },
  },
  "etikett.tonkrug": {
    geschlecht: "m",
    einzahl: { nom: "Tonkrug", gen: "Tonkrugs", dat: "Tonkrug", akk: "Tonkrug" },
    mehrzahl: { nom: "Tonkrüge", gen: "Tonkrüge", dat: "Tonkrügen", akk: "Tonkrüge" },
  },
  "etikett.steinkrug": {
    geschlecht: "m",
    einzahl: { nom: "Steinkrug", gen: "Steinkrugs", dat: "Steinkrug", akk: "Steinkrug" },
    mehrzahl: { nom: "Steinkrüge", gen: "Steinkrüge", dat: "Steinkrügen", akk: "Steinkrüge" },
  },
  "etikett.buegelflasche": {
    geschlecht: "f",
    einzahl: { nom: "Bügelflasche", gen: "Bügelflasche", dat: "Bügelflasche", akk: "Bügelflasche" },
    mehrzahl: { nom: "Bügelflaschen", gen: "Bügelflaschen", dat: "Bügelflaschen", akk: "Bügelflaschen" },
  },
  "etikett.henkelflasche": {
    geschlecht: "f",
    einzahl: { nom: "Henkelflasche", gen: "Henkelflasche", dat: "Henkelflasche", akk: "Henkelflasche" },
    mehrzahl: { nom: "Henkelflaschen", gen: "Henkelflaschen", dat: "Henkelflaschen", akk: "Henkelflaschen" },
  },
  "etikett.bocksbeutel": {
    geschlecht: "m",
    einzahl: { nom: "Bocksbeutel", gen: "Bocksbeutels", dat: "Bocksbeutel", akk: "Bocksbeutel" },
    mehrzahl: { nom: "Bocksbeutel", gen: "Bocksbeutel", dat: "Bocksbeuteln", akk: "Bocksbeutel" },
  },
  "gegenstand.leeres_fass": {
    geschlecht: "n",
    einzahl: { nom: "Fass", gen: "Fasses", dat: "Fass", akk: "Fass" },
    mehrzahl: { nom: "Fässer", gen: "Fässer", dat: "Fässern", akk: "Fässer" },
  },
  "gegenstand.bier": {
    geschlecht: "n",
    einzahl: { nom: "Bier", gen: "Biers", dat: "Bier", akk: "Bier" },
    mehrzahl: { nom: "Biere", gen: "Biere", dat: "Bieren", akk: "Biere" },
  },
  "gegenstand.riechwasser": {
    geschlecht: "n",
    einzahl: { nom: "Riechwasser", gen: "Riechwassers", dat: "Riechwasser", akk: "Riechwasser" },
    mehrzahl: { nom: "Riechwasser", gen: "Riechwasser", dat: "Riechwassern", akk: "Riechwasser" },
  },
  // Adjektive: fest am Hauptwort (leer) und als Affix aus einem Zustand (gereizt)
  "adjektiv.leer": { adjektiv: "leer" },
  "adjektiv.gereizt": { adjektiv: "gereizt" },
  "skill.zaehigkeit_grund": "Zähigkeit",
  "skill.zaehigkeit_experte": "Zähigkeit (Expertin)",
  "skill.nahkampf_grund": "Nahkampf",
  "skill.ausweichen_grund": "Ausweichen",
  "faehigkeit.testfaehigkeit": "Testfähigkeit",
  "zustand.testzustand": "Testzustand",
  "zustand.witterung": "Witterung",
  "zustand.gereizt": "Gereizt",
  "gelaende.gaerbottich": "Gärbottich",
  "gelaende.wandfackel": "Wandfackel",
  "faehigkeit.saeurespucke": "Säurespucke",
  "faehigkeit.saeureschwall": "Säureschwall",
  "faehigkeit.saeureschwall.ankuendigung": "{wer.nom} bläht sich auf und zielt. Gleich kommt ein Schwall.",
  "oberflaeche.saeure": "Säure",
  "oberflaeche.brand": "Brandlache",
  "oberflaeche.asche": "Asche",
  "gas.co2": "CO2",
  "fraktion.verderber": "Verderber",
  "arena.essigbakterien": "Essigbakterien",
  "arena.fernkaempfer": "Fernkämpfer in zwei Wellen",
  "arena.engpass": "Rudel im Engpass",
  "arena.keller_reihe": "Reihe aus dem Keller, Tiefe 1",
  "arena.keller_alle": "Alle Gegner des Kellers, Tiefe 1",
  "skillset.zaehigkeit": "Zähigkeit",
  "skillset.nahkampf": "Nahkampf",
  "skillset.ausweichen": "Ausweichen",
};
