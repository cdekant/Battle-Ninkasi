// Verfolgen für das Modul "jagen" (siehe docs/Wesen.md, KI): zur letzten bekannten Position der Beute gehen und
// angreifen, wer im Weg steht und ein Ziel ist; ein unbewegliches Wesen greift nur an, wer daneben steht.
// Steht auf dem nächsten Feld ein Wesen, das kein Ziel ist (z.B. ein Verbündeter im Gang), sucht es einen Weg um alle
// Wesen herum und nimmt ihn, wenn er höchstens regeln.bewegung.umwegHoechstens Felder länger ist; sonst wartet es.
// Verändert ki (letzteBekanntePosition, Wachzustand), darum nur für den gewählten Befehl aufrufen.

import { weg } from "../welt/wege.js";
import { wesenAufFeld, gleichesFeld } from "../welt/geometrie.js";
import { abstand, oeffnetTueren } from "../welt/karte.js";
import { bewegungVon } from "../kern/zustand.js";
import { fallenMeiden } from "../systeme/fallen.js";
import { gefahrenMeiden, meidenZusammen } from "../systeme/schichten.js";
import { istUnbeweglich } from "../systeme/bewegung.js";
import { abwarten } from "./abwarten.js";
import { istZielFuer } from "./ziele.js";

// Ziel für einen Angriff: nach trifft oder ausdrücklich befohlen (Vorrang, ki/vorrang.js)
const istAngriffsziel = (spiel, wesen, kandidat, trifft, befohlenId) => kandidat.id === befohlenId || istZielFuer(spiel, wesen, kandidat, trifft);

// Angriff auf ein Ziel daneben, sonst warten (auch für unbewegliche Wesen und die Anweisung "warten")
export function angriffDaneben(spiel, wesen, beute, trifft, befohlenId = null) {
  if (!beute || abstand(wesen.position, beute.position) !== 1 || !istAngriffsziel(spiel, wesen, beute, trifft, befohlenId)) return abwarten();
  return { art: "bewegen", dx: beute.position.x - wesen.position.x, dy: beute.position.y - wesen.position.y, angreifen: true };
}

// Wege nach Bewegungsart und Türen des Wesens, gefährliche Felder und Fallen meidend
export function wegOptionenFuer(spiel, wesen) {
  return { bewegung: bewegungVon(wesen), oeffnetTueren: oeffnetTueren(wesen), meiden: meidenZusammen(fallenMeiden(spiel), gefahrenMeiden(spiel)) };
}

// Erster Schritt eines Weges um alle Wesen herum, wenn er höchstens umwegHoechstens Felder länger ist als der direkte;
// sonst null. Das Ziel selbst darf besetzt sein (dort steht meist die Beute).
function umwegSchritt(spiel, position, ziel, wegOptionen, direkteLaenge) {
  const umwegHoechstens = spiel.daten.regeln.bewegung?.umwegHoechstens ?? 0;
  if (umwegHoechstens <= 0) return null;
  const umweg = weg(spiel, position, ziel, { ...wegOptionen, wesenMeiden: true });
  if (!umweg?.length || umweg.length > direkteLaenge + umwegHoechstens) return null;
  if (wesenAufFeld(spiel, umweg[0]).length) return null;
  return { art: "bewegen", dx: umweg[0].x - position.x, dy: umweg[0].y - position.y };
}

// Befehl, um der Beute (oder ihrer letzten bekannten Position) nachzusetzen
export function verfolgungsbefehl(spiel, jaeger, ki, beute, trifft, befohlenId = null) {
  const position = jaeger.position;
  const ziel = ki.letzteBekanntePosition;
  if (!ziel) return abwarten();
  if (gleichesFeld(ziel, position)) {
    ki.letzteBekanntePosition = null;
    // Spur verloren: nur die eigene KI wird wieder wach, eine überlagerte (Rausch) bleibt, wie sie ist
    if ((ki.wachzustand ?? "jagt") === "jagt" && ki === jaeger.ki) ki.wachzustand = "wach";
    return abwarten();
  }
  if (istUnbeweglich(jaeger)) return angriffDaneben(spiel, jaeger, beute, trifft, befohlenId);
  const wegOptionen = wegOptionenFuer(spiel, jaeger);
  const direkterWeg = weg(spiel, position, ziel, wegOptionen);
  if (!direkterWeg?.length) return abwarten();
  const naechstesFeld = direkterWeg[0];
  const schritt = (feld) => ({ art: "bewegen", dx: feld.x - position.x, dy: feld.y - position.y });
  const wesenImWeg = wesenAufFeld(spiel, naechstesFeld)[0];
  if (!wesenImWeg) return schritt(naechstesFeld);
  if (istAngriffsziel(spiel, jaeger, wesenImWeg, trifft, befohlenId)) return { ...schritt(naechstesFeld), angreifen: true };
  return umwegSchritt(spiel, position, ziel, wegOptionen, direkterWeg.length) ?? abwarten();
}
