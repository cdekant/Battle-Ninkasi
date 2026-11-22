// Verhaltensmodul "jagen": jagt das nächste sichtbare Wesen, das nach trifft ein Ziel ist (Vorgabe "feinde",
// mit "wesen" jedes andere Wesen: Rausch), und greift es an, sobald es daneben steht; verliert es alle aus den
// Augen, geht es zur letzten bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", trifft?, wachzustand?, letzteBekanntePosition: { x, y } | null,
//   handlungen?, wahl?, vorrang? }
// Sieht es seine Beute, wählt es zuerst eine Handlung (ki/handlungen.js: Fähigkeit, Abstand halten, Fliehen, Warten,
// Verfolgen); kommt keine in Frage oder heißt die Wahl "verfolgen", setzt es der Beute nach (ki/verfolgen.js).
// Wachzustand (systeme/wahrnehmung.js): schlaeft wartet; wach geht nur Lärm nach; jagt verfolgt Ziele innerhalb der
// Spurweite und wird wieder wach, wenn es an der letzten bekannten Position niemanden mehr findet.
// Ein Vorrangbefehl (ki/vorrang.js) gilt vor alledem, außer im Schlaf.

import { anmelden } from "../kern/register.js";
import { abwarten } from "./abwarten.js";
import { naechstesSichtbaresZiel } from "./ziele.js";
import { spurweite } from "../systeme/wahrnehmung.js";
import { abstand } from "../welt/karte.js";
import { sieht } from "../systeme/sicht.js";
import { handlungWaehlen, VERFOLGEN } from "./handlungen.js";
import { verfolgungsbefehl } from "./verfolgen.js";
import { geltenderVorrang, vorrangBefehl } from "./vorrang.js";

anmelden("ki", "jagen", (spiel, jaeger, ki) => {
  if (spiel.zustand.vorbei) return abwarten();
  const wachzustand = ki.wachzustand ?? "jagt";
  if (wachzustand === "schlaeft") return abwarten();
  const trifft = ki.trifft ?? "feinde";
  const position = jaeger.position;

  const vorrang = geltenderVorrang(spiel, ki);
  if (vorrang && vorrang.anweisung !== "angreifen") return vorrangBefehl(spiel, jaeger, ki, vorrang, trifft);
  const befohlenId = vorrang?.zielId ?? null;
  let beute;
  if (vorrang) {
    // befohlenes Ziel: seine Position ist bekannt, gesehen wird es nur in Sichtweite
    const ziel = spiel.zustand.entitaeten[befohlenId];
    ki.letzteBekanntePosition = { x: ziel.position.x, y: ziel.position.y };
    beute = sieht(spiel, jaeger, ziel) ? ziel : null;
  } else {
    const aufDerSpur = (kandidat) => abstand(position, kandidat.position) <= spurweite(spiel, kandidat);
    beute = wachzustand === "jagt" ? naechstesSichtbaresZiel(spiel, jaeger, trifft, aufDerSpur) : null;
  }

  if (beute) {
    ki.letzteBekanntePosition = { x: beute.position.x, y: beute.position.y };
    const befehl = handlungWaehlen(spiel, jaeger, ki, beute);
    if (befehl && befehl !== VERFOLGEN) return befehl;
  }
  return verfolgungsbefehl(spiel, jaeger, ki, beute, trifft, befohlenId);
});
