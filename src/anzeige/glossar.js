// Glossar (siehe docs/Texte.md, Glossar): die Begriffe aus daten/glossar.js mit ihren Texten, ohne DOM.
// Für das Wörterbuch im Kompendium (werkzeuge/kompendium.html, werkzeuge/kompendium.js) und später das Glossar im Spiel.

// Einträge in einer Sprache, nach dem Begriff sortiert; texte ist ein Textzugriff aus anzeige/texte.js
export function glossarEintraege(glossar, texte) {
  return Object.entries(glossar ?? {})
    .map(([name, eintrag]) => ({
      name,
      gebiet: texte.text(`glossargebiet.${eintrag.gebiet}`),
      begriff: texte.text(eintrag.text),
      erklaerung: texte.text(`${eintrag.text}.erklaerung`),
    }))
    .sort((links, rechts) => links.begriff.localeCompare(rechts.begriff, texte.text("sprache.code")));
}

// Wörterbuch über mehrere Sprachen: je Begriff { name, <sprache>: { gebiet, begriff, erklaerung } }, sortiert nach
// der ersten Sprache; textzugriffe: { de: texte, en: texte }
export function woerterbuch(glossar, textzugriffe) {
  const [ersteSprache, ...weitere] = Object.keys(textzugriffe);
  const nachName = (sprache) => Object.fromEntries(glossarEintraege(glossar, textzugriffe[sprache]).map((eintrag) => [eintrag.name, eintrag]));
  const weitereNachName = Object.fromEntries(weitere.map((sprache) => [sprache, nachName(sprache)]));
  return glossarEintraege(glossar, textzugriffe[ersteSprache]).map((eintrag) => ({
    name: eintrag.name,
    [ersteSprache]: { gebiet: eintrag.gebiet, begriff: eintrag.begriff, erklaerung: eintrag.erklaerung },
    ...Object.fromEntries(weitere.map((sprache) => {
      const { gebiet, begriff, erklaerung } = weitereNachName[sprache][eintrag.name];
      return [sprache, { gebiet, begriff, erklaerung }];
    })),
  }));
}
