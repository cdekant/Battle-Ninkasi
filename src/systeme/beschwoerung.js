// Beschwören und Verschwinden (siehe docs/Architektur.md, Zustände).
//   beschwoeren:  { wesen, anzahl?, muster?, zustand?, dauer? } erzeugt Wesen aus den Daten auf freien Feldern des
//                 Musters (Vorgabe angrenzend um den Ursprung, in der Reihenfolge der Felder), höchstens anzahl
//                 (Vorgabe 1); sie bekommen die Fraktion der Urheberin und beschworenVon (ihnen Zugerechnetes
//                 geht an die Beschwörerin), handeln nach einer Aktion Wartezeit und tragen den Zustand
//                 (Quelle ist die Beschwörerin, dauer für den Zustand), z.B. mit gebundenAnQuelle und
//                 beimEnde "verschwinden"; höchstens bis zur Obergrenze regeln.population.hoechstWesen, darüber
//                 entsteht nichts und es kommt die Meldung "population_voll"
//   verschwinden: entfernt das Ziel ohne Tod: keine Meldung "tod", kein nach_tod, keine Hinterlassenschaft;
//                 Zustände, die an das Ziel als Quelle gebunden sind, enden; wirkt nicht auf Ninkasi

import { bausteinAnmelden } from "../kern/bausteine.js";
import { entitaetAusDatensatz, entitaetEntfernen, anzahlWesen } from "../kern/zustand.js";
import { akteurEinreihen } from "../kern/zeit.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { betretbarFuer } from "../welt/karte.js";
import { wesenAufFeld } from "../welt/geometrie.js";
import { musterFelder } from "./zielauswahl.js";
import { zustandSetzen, quelleEntfaellt } from "./zustaende.js";

bausteinAnmelden("beschwoeren", { wesen: "wesen", anzahl: "ganzzahl?", muster: "muster?", zustand: "zustand?", dauer: "ganzzahl?" }, (spiel, kontext, parameter) => {
  if (!kontext.ursprung) return;
  const zustand = spiel.zustand;
  const auswahl = { ursprung: kontext.ursprung, zielpunkt: kontext.zielfeld ?? kontext.ursprung, quelleId: kontext.quelleId };
  const bewegung = spiel.daten.wesen[parameter.wesen].bewegung ?? "laufend";
  const freieFelder = musterFelder(spiel, parameter.muster ?? { art: "angrenzend" }, auswahl)
    .filter((feld) => betretbarFuer(spiel, feld.x, feld.y, bewegung) && wesenAufFeld(spiel, feld).length === 0);
  const urheber = zustand.entitaeten[kontext.urheberId];
  const gewuenscht = Math.min(freieFelder.length, parameter.anzahl ?? 1);
  const platz = Math.max(0, spiel.daten.regeln.population.hoechstWesen - anzahlWesen(zustand));
  if (gewuenscht > platz) melden(spiel, "population_voll", { wesen: parameter.wesen, hoechstWesen: spiel.daten.regeln.population.hoechstWesen, ausgefallen: gewuenscht - platz });
  for (const feld of freieFelder.slice(0, Math.min(gewuenscht, platz))) {
    const beschworen = entitaetAusDatensatz(zustand, parameter.wesen, spiel.daten.wesen[parameter.wesen], feld);
    if (kontext.urheberFraktion != null) beschworen.fraktion = kontext.urheberFraktion;
    if (kontext.urheberId != null) beschworen.beschworenVon = kontext.urheberId;
    if (beschworen.ki) akteurEinreihen(zustand, beschworen.id, spiel.daten.aktionen?.warten ?? 100);
    melden(spiel, "beschworen", { wer: urheber ? bezugAuf(urheber) : null, was: bezugAuf(beschworen) });
    if (parameter.zustand) {
      zustandSetzen(spiel, beschworen, parameter.zustand, {
        quelleId: kontext.urheberId, urheberId: kontext.urheberId, urheberFraktion: kontext.urheberFraktion,
        dauer: parameter.dauer, kettentiefe: kontext.kettentiefe,
      });
    }
  }
});

bausteinAnmelden("verschwinden", {}, (spiel, kontext) => {
  const zustand = spiel.zustand;
  const ziel = zustand.entitaeten[kontext.zielId];
  if (ziel.id === zustand.spielerinId) return;
  melden(spiel, "verschwindet", { wer: bezugAuf(ziel) });
  entitaetEntfernen(zustand, ziel.id);
  quelleEntfaellt(spiel, ziel.id, kontext.kettentiefe);
}, { brauchtZiel: true });
