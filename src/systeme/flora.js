// Wilde Flora der Ebene für die spontane Gärung (siehe docs/Sude.md, Spontane Gärung; Spieldesign in docs/Brauen.md,
// Kulturen): der Ebenenschritt "flora" würfelt beim Erzeugen jeder Ebene eine Flora aus den Spannen in
// regeln.brauen.spontan, wiederholbar je Startwert und Tiefe (bau.zufall("flora")), und legt sie in ebene.flora:
//   { vergaerung, vertraegt, verderben, aromen: { <achse>: wert } }, aufgebaut wie eine Kultur (daten/kulturen)
// Ebenen ohne den Schritt (Hub, Testkammer, Arenen) haben keine Flora, dort gibt es keine spontane Gärung.
// Gebraut wird mit der Kultur "spontan" (systeme/sud.js SPONTAN, systeme/brauen.js).

import { anmelden } from "../kern/register.js";
import { zufallsGanzzahl } from "../kern/zufall.js";

// Eine Flora aus den Spannen [unten, oben] der Regeln
export function floraWuerfeln(spontan, zufall) {
  const ziehen = ([unten, oben]) => zufallsGanzzahl(zufall, unten, oben);
  const aromen = {};
  for (const [achse, spanne] of Object.entries(spontan.aromen ?? {})) aromen[achse] = ziehen(spanne);
  return { vergaerung: ziehen(spontan.vergaerung), vertraegt: ziehen(spontan.vertraegt), verderben: ziehen(spontan.verderben), aromen };
}

anmelden("ebenenschritte", "flora", {
  braucht: ["ebene"], liefert: [],
  ausfuehren(spiel, bau) {
    spiel.zustand.ebene.flora = floraWuerfeln(spiel.daten.regeln.brauen.spontan, bau.zufall("flora"));
  },
});
