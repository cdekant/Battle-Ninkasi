// Verhaltensmodul "jagen": jagt das nächste sichtbare Wesen, das nach trifft ein Ziel ist (Vorgabe "feinde",
// mit "wesen" jedes andere Wesen: Rausch), und greift es an, sobald es daneben steht; verliert es alle aus den
// Augen, geht es zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", trifft?, wachzustand?, letzteBekanntePosition: { x, y } | null,
//   faehigkeiten?, abstandHalten? }
// Sieht es seine Beute, setzt es zuerst eine passende Fähigkeit ein (ki/faehigkeitenwahl.js). Mit abstandHalten: n
// weicht es zurück, solange die Beute näher als n steht (in die Ecke gedrängt greift es normal an), wartet auf
// genau n Feldern und kommt bei mehr näher (Abstand nach Schachbrett). Wege nach der eigenen Bewegungsart; ein
// unbewegliches Wesen setzt Fähigkeiten ein, greift an, wer daneben steht, und wartet sonst.
// Wachzustand (systeme/wahrnehmung.js): schlaeft wartet; wach geht nur Lärm nach; jagt verfolgt Ziele innerhalb der
// Spurweite und wird wieder wach, wenn es an der letzten bekannten Position niemanden mehr findet.
// Steht auf dem nächsten Feld ein Wesen, das kein Ziel ist (z.B. ein Verbündeter im Gang), sucht es einen Weg um alle
// Wesen herum und nimmt ihn, wenn er höchstens regeln.bewegung.umwegHoechstens Felder länger ist; sonst wartet es.

import { anmelden } from "../kern/register.js";
import { weg } from "../welt/wege.js";
import { wesenAufFeld, gleichesFeld } from "../welt/geometrie.js";
import { abwarten } from "./abwarten.js";
import { naechstesSichtbaresZiel, istZielFuer } from "./ziele.js";
import { spurweite } from "../systeme/wahrnehmung.js";
import { abstand, oeffnetTueren } from "../welt/karte.js";
import { fallenMeiden } from "../systeme/fallen.js";
import { gefahrenMeiden, meidenZusammen } from "../systeme/schichten.js";
import { faehigkeitWaehlen } from "./faehigkeitenwahl.js";
import { schrittWeg } from "./schritte.js";
import { bewegungVon } from "../kern/zustand.js";
import { istUnbeweglich } from "../systeme/bewegung.js";

// Unbeweglich: greift die Beute an, wenn sie daneben steht, sonst wartet es
function angriffDaneben(spiel, jaeger, beute, trifft) {
  if (!beute || abstand(jaeger.position, beute.position) !== 1 || !istZielFuer(spiel, jaeger, beute, trifft)) return abwarten();
  return { art: "bewegen", dx: beute.position.x - jaeger.position.x, dy: beute.position.y - jaeger.position.y, angreifen: true };
}

// Befehl, um den Abstand zur Beute zu halten, oder null (dann jagt es wie sonst)
function abstandWahren(spiel, jaeger, beute, gewuenschterAbstand) {
  const entfernung = abstand(jaeger.position, beute.position);
  if (entfernung === gewuenschterAbstand) return abwarten();
  if (entfernung > gewuenschterAbstand) return null;
  const richtung = schrittWeg(spiel, jaeger, beute.position);
  return richtung ? { art: "bewegen", ...richtung } : null;
}

anmelden("ki", "jagen", (spiel, jaeger, ki) => {
  if (spiel.zustand.vorbei) return abwarten();
  const wachzustand = ki.wachzustand ?? "jagt";
  if (wachzustand === "schlaeft") return abwarten();
  const trifft = ki.trifft ?? "feinde";
  const position = jaeger.position;
  const aufDerSpur = (kandidat) => abstand(position, kandidat.position) <= spurweite(spiel, kandidat);
  const beute = wachzustand === "jagt" ? naechstesSichtbaresZiel(spiel, jaeger, trifft, aufDerSpur) : null;
  if (beute) {
    ki.letzteBekanntePosition = { x: beute.position.x, y: beute.position.y };
    const faehigkeitsbefehl = faehigkeitWaehlen(spiel, jaeger, ki, beute);
    if (faehigkeitsbefehl) return faehigkeitsbefehl;
    const abstandsbefehl = ki.abstandHalten ? abstandWahren(spiel, jaeger, beute, ki.abstandHalten) : null;
    if (abstandsbefehl) return abstandsbefehl;
  }
  const ziel = ki.letzteBekanntePosition;
  if (!ziel) return abwarten();
  if (gleichesFeld(ziel, position)) {
    ki.letzteBekanntePosition = null;
    // Spur verloren: nur die eigene KI wird wieder wach, eine überlagerte (Rausch) bleibt, wie sie ist
    if (wachzustand === "jagt" && ki === jaeger.ki) ki.wachzustand = "wach";
    return abwarten();
  }

  if (istUnbeweglich(jaeger)) return angriffDaneben(spiel, jaeger, beute, trifft);
  const wegOptionen = { bewegung: bewegungVon(jaeger), oeffnetTueren: oeffnetTueren(jaeger), meiden: meidenZusammen(fallenMeiden(spiel), gefahrenMeiden(spiel)) };
  const direkterWeg = weg(spiel, position, ziel, wegOptionen);
  if (!direkterWeg?.length) return abwarten();
  const naechstesFeld = direkterWeg[0];
  const schritt = (feld) => ({ art: "bewegen", dx: feld.x - position.x, dy: feld.y - position.y });
  const wesenImWeg = wesenAufFeld(spiel, naechstesFeld)[0];
  if (!wesenImWeg) return schritt(naechstesFeld);
  if (istZielFuer(spiel, jaeger, wesenImWeg, trifft)) return { ...schritt(naechstesFeld), angreifen: true };
  return umwegSchritt(spiel, position, ziel, wegOptionen, direkterWeg.length) ?? abwarten();
});

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
