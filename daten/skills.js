// Skills (siehe docs/Charakter.md, Skills, und src/systeme/skills.js). Vorläufige Einträge, bis der Skillkatalog
// in einer eigenen Sitzung entsteht; alle Zahlen vorläufig.
//   name: { text, set, tier, rang?, primaer, sekundaer, voraussetzungen?, freischaltung?, jeStufe?, abStufe?, lernt?, verwandt? }
export default {
  // Zähigkeit: mehr LP, lernt aus erlittenem Schaden
  zaehigkeit_grund: {
    text: "skill.zaehigkeit_grund", set: "zaehigkeit", tier: 1,
    primaer: "koerperlichkeit", sekundaer: "trinkfestigkeit",
    jeStufe: [{ ziel: "lp", art: "prozent", betrag: 5 }],
    lernt: [{ anlass: "schaden_erlitten" }],
    verwandt: [{ skill: "zaehigkeit_experte", anteil: 20 }],
  },
  zaehigkeit_experte: {
    text: "skill.zaehigkeit_experte", set: "zaehigkeit", tier: 2,
    primaer: "koerperlichkeit", sekundaer: "trinkfestigkeit",
    jeStufe: [{ ziel: "lp", art: "prozent", betrag: 5 }],
    lernt: [{ anlass: "schaden_erlitten" }],
  },
  // Nahkampf: genauer mit allem, was den Tag nahkampf trägt
  nahkampf_grund: {
    text: "skill.nahkampf_grund", set: "nahkampf", tier: 1,
    primaer: "koerperlichkeit", sekundaer: "gewandtheit",
    jeStufe: [{ ziel: "genauigkeit", tag: "nahkampf", art: "prozent", betrag: 4 }],
    lernt: [{ anlass: "wirkung", tags: ["nahkampf"] }],
  },
  // Ausweichen: feste Punkte, lernt aus jedem Angriff, dem Ninkasi ausweicht
  ausweichen_grund: {
    text: "skill.ausweichen_grund", set: "ausweichen", tier: 1,
    primaer: "gewandtheit", sekundaer: "sinnlichkeit",
    jeStufe: [{ ziel: "ausweichen", art: "plus", betrag: 4 }],
    lernt: [{ anlass: "ausgewichen" }],
  },
};
