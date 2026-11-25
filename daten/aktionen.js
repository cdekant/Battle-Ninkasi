// Zeitkosten je Aktionsart in Zeiteinheiten (Standard 100).
// Modifikatoren zielen auf "kosten.<aktion>" oder "kosten.alle".
export default {
  bewegen: 100,
  nahkampf: 100,
  warten: 100,
  aufheben: 100,
  trinken: 100,
  lesen: 100,
  werfen: 100, // Vorgabe, wenn ein Gegenstand keine eigenen wurf.kosten nennt
  schiessen: 100, // Vorgabe, wenn eine Fernwaffe keine eigenen schuss.kosten nennt
  nachladen: 100, // Vorgabe, wenn ein Magazin keine eigene Zeit fürs Nachladen nennt
  benutzen: 100,
  treppe: 100,
  anlegen: 100,
  ablegen: 100,
  fallenlassen: 100,
  brauen: 100, // ein Sud am Kessel (src/systeme/brauen.js)
  faehigkeit: 100, // Vorgabe, wenn eine Fähigkeit keine eigene zeit nennt
};
