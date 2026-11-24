// Betäubung (siehe docs/Wirkungen.md, Kontrolle): schiebt die nächste Aktion des Ziels hinaus.
// Baustein betaeuben { dauer, zustand } auf das Ziel:
//   die Dauer läuft durch die abnehmende Kontrolle (systeme/zustaende.js kontrollDauer), immun heißt: nichts geschieht;
//   eine laufende lange Aktion bricht ab (Grund "betaeubt"); der Eintrag des Ziels in der Warteschlange rückt um die
//   wirksame Dauer nach hinten; handelt das Ziel gerade selbst (kein Eintrag), merkt es sich den Aufschub in aufschub
//   und kern/spiel.js befehlAusfuehren rechnet ihn beim Wiedereinreihen dazu;
//   der Zustand (z.B. betaeubt mit den Tags kontrolle und wehrlos) hält bis zur nächsten Aktion des Ziels, er zeigt die
//   Betäubung an und macht wehrlos; seine Dauer ist schon bemessen und zählt nicht ein zweites Mal als Kontrolle.

import { bausteinAnmelden } from "../kern/bausteine.js";
import { akteurVerschieben } from "../kern/zeit.js";
import { istWesen } from "../kern/zustand.js";
import { kontrollDauer, zustandSetzen } from "./zustaende.js";
import { aktionAbbrechen } from "./laufendeAktionen.js";

export function betaeuben(spiel, ziel, dauer, zustandName, angaben = {}) {
  const wirksam = kontrollDauer(spiel, ziel, dauer);
  if (wirksam === 0) return 0;
  if (ziel.laufendeAktion) aktionAbbrechen(spiel, ziel, "betaeubt");
  const zustand = spiel.zustand;
  const naechsterZug = akteurVerschieben(zustand, ziel.id, wirksam);
  let bisZumZug = wirksam;
  if (naechsterZug === null) ziel.aufschub = (ziel.aufschub ?? 0) + wirksam;
  else bisZumZug = naechsterZug - zustand.zeit;
  zustandSetzen(spiel, ziel, zustandName, { ...angaben, dauer: Math.max(1, bisZumZug), kontrolleGeprueft: true });
  return wirksam;
}

bausteinAnmelden("betaeuben", { dauer: "ganzzahl", zustand: "zustand" }, (spiel, kontext, parameter) => {
  const ziel = spiel.zustand.entitaeten[kontext.zielId];
  if (!istWesen(ziel)) return;
  betaeuben(spiel, ziel, parameter.dauer, parameter.zustand, {
    quelleId: kontext.quelleId, urheberId: kontext.urheberId, urheberFraktion: kontext.urheberFraktion, kettentiefe: kontext.kettentiefe,
  });
}, { brauchtZiel: true });
