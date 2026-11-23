// Verhaltensmodul "jagen": jagt das nächste wahrgenommene (gesehene oder gespürte, systeme/sinne.js) Wesen, das nach
// trifft ein Ziel ist (Vorgabe "feinde", mit "wesen" jedes andere Wesen: Rausch), und greift es an, sobald es daneben
// steht; verliert es alle, folgt es dem Duft der gesteuerten Entität (systeme/duft.js), sonst geht es zur letzten
// bekannten Position und wartet dort ab.
// Zustand in der Komponente: ki: { modul: "jagen", trifft?, wachzustand?, duftFolgen?, letzteBekanntePosition: { x, y } | null,
//   handlungen?, wahl?, vorrang? }
// Nimmt es seine Beute wahr, wählt es zuerst eine Handlung (ki/handlungen.js: Fähigkeit, Abstand halten, Fliehen,
// Warten, Verfolgen); kommt keine in Frage oder heißt die Wahl "verfolgen", setzt es der Beute nach (ki/verfolgen.js).
// Wachzustand (systeme/wahrnehmung.js): schlaeft wartet; wach geht nur Lärm nach, sonst zieht es umher
// (ki/umherziehen.js); jagt verfolgt Ziele innerhalb der Spurweite und wird wieder wach, wenn es an der letzten
// bekannten Position niemanden mehr findet und kein frischer Duft weiterführt.
// Ein Vorrangbefehl (ki/vorrang.js) gilt vor alledem, außer im Schlaf.

import { anmelden } from "../kern/register.js";
import { abwarten } from "./abwarten.js";
import { naechstesWahrgenommenesZiel } from "./ziele.js";
import { spurweite } from "../systeme/wahrnehmung.js";
import { abstand } from "../welt/karte.js";
import { nimmtWahr } from "../systeme/sinne.js";
import { handlungWaehlen, VERFOLGEN } from "./handlungen.js";
import { verfolgungsbefehl, duftfolgebefehl } from "./verfolgen.js";
import { geltenderVorrang, vorrangBefehl } from "./vorrang.js";
import { umherziehbefehl } from "./umherziehen.js";

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
    // befohlenes Ziel: seine Position ist bekannt, wahrgenommen wird es nur in Reichweite der Sinne
    const ziel = spiel.zustand.entitaeten[befohlenId];
    ki.letzteBekanntePosition = { x: ziel.position.x, y: ziel.position.y };
    beute = nimmtWahr(spiel, jaeger, ziel) ? ziel : null;
  } else {
    const aufDerSpur = (kandidat) => abstand(position, kandidat.position) <= spurweite(spiel, kandidat);
    beute = wachzustand === "jagt" ? naechstesWahrgenommenesZiel(spiel, jaeger, trifft, aufDerSpur) : null;
  }

  if (beute) {
    ki.letzteBekanntePosition = { x: beute.position.x, y: beute.position.y };
    const befehl = handlungWaehlen(spiel, jaeger, ki, beute);
    if (befehl && befehl !== VERFOLGEN) return befehl;
  } else if (wachzustand === "jagt" && !vorrang) {
    const befehl = duftfolgebefehl(spiel, jaeger, ki, trifft);
    if (befehl) return befehl;
  }
  if (wachzustand === "wach" && !vorrang && !ki.letzteBekanntePosition) return umherziehbefehl(spiel, jaeger, ki);
  return verfolgungsbefehl(spiel, jaeger, ki, beute, trifft, befohlenId);
});
