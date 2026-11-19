// Populationstabellen (Aufbau siehe src/welt/ebene.js): { typ, gewicht, tiefe: [von, bis], rudel?, affixe? }.
// Je Wurf gewichtet unter den Einträgen der Tiefe, gelegentlich aus einer tieferen (regeln.population). Vorläufig, bis
// es mehr Gegner gibt: Essigbakterien in Rudeln, Fernkämpfer werden nach unten häufiger.
export default {
  keller: [
    { typ: "essigbakterium", gewicht: 10, tiefe: [1, 3], rudel: [1, 3] },
    { typ: "fernkaempfer_test", gewicht: 2, tiefe: [1, 1] },
    { typ: "fernkaempfer_test", gewicht: 5, tiefe: [2, 3] },
  ],
};
