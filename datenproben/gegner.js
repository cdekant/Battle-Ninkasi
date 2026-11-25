// Gegner. Einträge mit "abstrakt: true" sind Vorlagen, "vorlage" erbt von ihnen.
export default {
  bakterium: {
    abstrakt: true,
    fraktion: "verderber",
    tueren: "nicht", // Mikroorganismen öffnen keine Türen
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
    spueren: { reichweite: 3 }, // spüren Beute ohne Licht entlang offener Felder (src/systeme/sinne.js), vorläufig
  },

  // Stärke 1 der Normierung (daten/regeln.js normierung, werkzeuge/normierung.js)
  essigbakterium: {
    vorlage: "bakterium",
    text: "wesen.essigbakterium",
    werte: { lp: { grundwert: 15 } },
    ep: 35, // gebundene EP beim Tod (src/systeme/lernen.js), vorläufig
    angriffe: [{ name: "biss", genauigkeit: 47, effekt: "biss_klein" }],
  },

  // Testgegner für die KI mit Fähigkeiten und Gepäck: hält Abstand, spuckt, kündigt einen Säureschwall an und trinkt
  // bei wenig LP sein Bier; vorläufig
  fernkaempfer_test: {
    vorlage: "bakterium",
    text: "wesen.fernkaempfer_test",
    werte: { lp: { grundwert: 22 } },
    ep: 70,
    angriffe: [{ name: "biss", genauigkeit: 47, effekt: "biss_mittel" }], // Stärke 2 der Normierung, dazu die Fernangriffe
    faehigkeiten: ["saeurespucke", "saeureschwall"],
    ausstattung: [{ typ: "bier" }],
    ki: {
      // der Reihe nach (wahl "erste"): unter 80 % LP zur Hälfte trinken, sonst Schwall, Spucke, Abstand halten, nachsetzen
      handlungen: [
        { handlung: "nutzen", zweck: "heilen", chance: 50, bewertung: [{ eingabe: "eigeneLpProzent", kurve: "heilenNachLp" }] },
        { handlung: "faehigkeit", name: "saeureschwall", chance: 30, abstandAb: 2, abstandBis: 5 },
        { handlung: "faehigkeit", name: "saeurespucke", abstandAb: 2 },
        { handlung: "abstand_halten", abstand: 3 },
      ],
    },
  },

  // Schützin mit Schleuder (src/systeme/fernkampf.js): Stärke 2 der Normierung im Nahkampf, dazu der Schuss; schießt aus
  // Abstand, hält ihn, wenn sie kann, und schlägt zu, wenn Ninkasi daneben steht; in keiner Population, nur in der Arena
  schuetzin_test: {
    vorlage: "normwesen",
    text: "wesen.schuetzin_test",
    werte: { lp: { grundwert: 22 } },
    ep: 70,
    plaetze: { hand: 2 },
    angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_2" }],
    ausstattung: [{ typ: "schleuder", angelegt: true }, { typ: "schleuderstein", anzahl: 12 }],
    ki: {
      modul: "jagen", letzteBekanntePosition: null,
      handlungen: [
        { handlung: "schiessen", abstandAb: 2 },
        { handlung: "abstand_halten", abstand: 4 },
      ],
    },
  },

  // Psi-Jägerin (src/systeme/glimmer.js): kommt ab Glimmer 30, kennt Ninkasis Ort; Stärke 3 der Normierung mit
  // Psi-Schaden; in keiner Population, später werden die Geister früherer Läufe zu Jägerinnen; vorläufig
  psi_jaegerin: {
    text: "wesen.psi_jaegerin",
    fraktion: "jaegerinnen",
    psiJaegerin: { glimmerAb: 30 },
    werte: { lp: { grundwert: 30 } },
    ep: 140,
    angriffe: [{ name: "gedankenpeitsche", genauigkeit: 47, effekt: "gedankenpeitsche" }],
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
  },

  // Normwesen der Stärken 1 bis 5 (siehe docs/Wesen.md, Normierung): Maßstab für Arena und Werkzeug, in keiner
  // Population; Tempo 100, Trefferchance gegen Ninkasi zu Beginn 70 %, Schaden stumpf
  normwesen: {
    abstrakt: true,
    fraktion: "verderber",
    ki: { modul: "jagen", letzteBekanntePosition: null },
    sicht: { reichweite: 7 },
  },
  normwesen_1: { vorlage: "normwesen", text: "wesen.normwesen_1", werte: { lp: { grundwert: 15 } }, ep: 35, angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_1" }] },
  normwesen_2: { vorlage: "normwesen", text: "wesen.normwesen_2", werte: { lp: { grundwert: 22 } }, ep: 70, angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_2" }] },
  normwesen_3: { vorlage: "normwesen", text: "wesen.normwesen_3", werte: { lp: { grundwert: 30 } }, ep: 140, angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_3" }] },
  normwesen_4: { vorlage: "normwesen", text: "wesen.normwesen_4", werte: { lp: { grundwert: 45 } }, ep: 280, angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_4" }] },
  normwesen_5: { vorlage: "normwesen", text: "wesen.normwesen_5", werte: { lp: { grundwert: 60 } }, ep: 560, angriffe: [{ name: "normschlag", genauigkeit: 47, effekt: "normschlag_5" }] },
};
