// Zielgebiete des Probeinhalts (siehe docs/Sude.md, Zielgebiete): die antike Familie mit den Namen sumerischer
// Biersorten (docs/Brauen.md, Zielgebiete), die Spannen sind Erfindung des Spiels; Zahlen vorläufig
//   text: Hauptwort des Getränks; spannen: [unten, oben] je Achse, nicht genannte Achsen sind frei;
//   bonus: Prozent auf das Budget der Wirkung (Vorgabe 100); effekt: wirkt beim Trinken zusätzlich
export default {
  gefiltertes_bier: { text: "zielgebiet.gefiltertes_bier", familie: "antik", spannen: { farbe: [0, 15], malz: [60, 100], saeure: [0, 15] }, bonus: 120 },
  dunkles_bier: { text: "zielgebiet.dunkles_bier", familie: "antik", spannen: { farbe: [30, 150], roest: [20, 70] }, bonus: 120 },
  suesses_dunkles_bier: { text: "zielgebiet.suesses_dunkles_bier", familie: "antik", spannen: { farbe: [30, 150], roest: [10, 50], suesse: [40, 100] }, bonus: 130 },
  roetliches_bier: { text: "zielgebiet.roetliches_bier", familie: "antik", spannen: { farbe: [15, 30], frucht: [20, 60] }, bonus: 120 },
  starkes_bier: { text: "zielgebiet.starkes_bier", familie: "antik", spannen: { stammwuerze: [170, 250], alkohol: [70, 150] }, bonus: 120 },
};
