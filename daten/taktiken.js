// Taktiken, mit denen Ninkasi in der Arena automatisch kämpft (src/ki/taktik.js): Handlungen im Format der KI
// (src/ki/handlungen.js, siehe docs/Wesen.md, KI) gegen den nächsten sichtbaren Feind; kommt keine in Frage, setzt
// sie ihm nach und greift an. Vorläufig.
export default {
  // trinkt unter 40 % LP, sonst Nahkampf
  nahkampf: {
    text: "taktik.nahkampf",
    handlungen: [
      { handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: [[0, 1000], [39, 1000], [40, 0]] }] },
    ],
  },
  // trinkt unter 40 % LP; aus Abstand schießt sie mit der Fernwaffe und lädt nach, wenn sie leer ist, sonst nutzt sie,
  // was dem Angriff dient (Fähigkeiten, dann Würfe); steht der Feind daneben, Nahkampf (auch statt nachzuladen)
  fernkampf: {
    text: "taktik.fernkampf",
    handlungen: [
      { handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: [[0, 1000], [39, 1000], [40, 0]] }] },
      { handlung: "schiessen", abstandAb: 2 },
      { handlung: "nachladen", abstandAb: 2 },
      { handlung: "nutzen", zweck: "angriff", abstandAb: 2 },
    ],
  },
};
