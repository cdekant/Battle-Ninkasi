// Kulturen des Probeinhalts (siehe docs/Sude.md, Profil); Zahlen vorläufig
//   vergaerung: Prozent der Stammwürze, die vergärt (vor der Maische); vertraegt: höchster Alkohol in Zehnteln Vol.-%;
//   aromen: kommen zum Profil dazu; verderben: Punkte auf die Chance, dass ein Sud verdirbt
export default {
  bierhefe: { text: "kultur.bierhefe", vergaerung: 75, vertraegt: 90, aromen: { frucht: 10 } },
  milchsaeure: { text: "kultur.milchsaeure", vergaerung: 20, vertraegt: 20, aromen: { saeure: 50 }, verderben: 5 },
};
