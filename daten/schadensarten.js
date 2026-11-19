// Schadensarten (siehe docs/Architektur.md, Kampfwerte). Jeder Schritt "schaden" nennt seine Art.
//   text:     Schlüssel in der Sprachdatei
//   ruestung: true, wenn der Kampfwert ruestung dagegen hilft (körperliche Arten); gegen alle Arten wirkt
//             zusätzlich ruestung.<art> aus Modifikatoren, z.B. eine säurefeste Schürze mit ruestung.saeure
// Die Art geht als Tag in die Abfragen der Modifikatoren (schaden, ruestung, widerstand, immunitaet).
// Das Mittel ist davon getrennt ein Tag am Effekt: ein magischer Feuerball macht Feuer mit dem Tag "magie".
export default {
  stumpf: { text: "schaden.stumpf", ruestung: true },
  schnitt: { text: "schaden.schnitt", ruestung: true },
  saeure: { text: "schaden.saeure" },
  lauge: { text: "schaden.lauge" },
  feuer: { text: "schaden.feuer" },
  elektrisch: { text: "schaden.elektrisch" },
  alkohol: { text: "schaden.alkohol" },
  gift: { text: "schaden.gift" },
  psi: { text: "schaden.psi" },
  magie: { text: "schaden.magie" }, // reine Magie, z.B. ein Energieball
};
