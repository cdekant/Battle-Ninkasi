// Dummer Bot: spielt mit zufälligen Befehlen, prüft Invarianten und Wiederholbarkeit.
// Aufruf: node werkzeuge/bot.js [läufe=20] [befehle=3000] [erster Startwert=1]
// Für jeden Lauf: spielen, dann aus Startwert und Befehlsliste nachspielen und Zustände vergleichen.

import rohdaten from "../daten/index.js";
import texte from "../sprache/de/texte.js";
import { datenLaden, neuesSpiel, befehl, spielstand, nachspielen } from "../src/kern/spiel.js";
import { erzeugen, ganzzahl } from "../src/kern/zufall.js";
import { alle, spieler } from "../src/kern/zustand.js";
import { passierbar } from "../src/welt/karte.js";
import { erstesGetraenk } from "../src/systeme/inventar.js";
import { hoeren } from "../src/kern/ereignisse.js";

const [laeufe = 20, maxBefehle = 3000, erster = 1] = process.argv.slice(2).map(Number);
const daten = datenLaden(rohdaten, texte);

function invarianten(spiel) {
  const z = spiel.zustand;
  const belegt = new Set();
  for (const e of alle(z)) {
    for (const [n, w] of Object.entries(e.werte || {})) {
      if (!Number.isInteger(w.aktuell) || w.aktuell < 0) throw new Error(`#${e.id} ${n} ungültig: ${w.aktuell}`);
    }
    if (e.position) {
      if (!passierbar(spiel, e.position.x, e.position.y)) throw new Error(`#${e.id} steht in der Wand`);
      if (e.fraktion !== undefined) {
        const k = `${e.position.x},${e.position.y}`;
        if (belegt.has(k)) throw new Error(`Zwei Wesen auf ${k}`);
        belegt.add(k);
      }
    }
  }
  if (!z.vorbei && spieler(z).werte.lp.aktuell <= 0) throw new Error("Ninkasi tot, Spiel nicht vorbei");
}

function zufallsbefehl(rng, spiel) {
  const p = spieler(spiel.zustand);
  const w = ganzzahl(rng, 1, 100);
  if (w <= 5) return { art: "warten" };
  if (w <= 10) return { art: "aufheben" };
  if (w <= 13 && p.werte.lp.aktuell < 70) return { art: "trinken", item: erstesGetraenk(spiel.zustand, p) };
  return { art: "bewegen", dx: ganzzahl(rng, -1, 1), dy: ganzzahl(rng, -1, 1) };
}

let tode = 0, fehler = 0;
console.log("Startwert  Befehle  Zeit     LP   PP  Getötet  Biere  Ergebnis");
for (let s = erster; s < erster + laeufe; s++) {
  try {
    const spiel = neuesSpiel(daten, s);
    let getoetet = 0, biere = 0;
    hoeren(spiel, (m) => {
      if (m.art === "tod" && m.opfer.id !== spiel.zustand.spielerId) getoetet++;
      if (m.art === "getrunken") biere++;
    });
    const rng = erzeugen(s);
    for (let i = 0; i < maxBefehle && !spiel.zustand.vorbei; i++) {
      befehl(spiel, zufallsbefehl(rng, spiel));
      invarianten(spiel);
    }
    const nach = nachspielen(daten, JSON.parse(JSON.stringify(spielstand(spiel))));
    const gleich = JSON.stringify(nach.zustand) === JSON.stringify(spiel.zustand);
    if (!gleich) throw new Error("Nachspielen ergibt anderen Zustand");
    const p = spieler(spiel.zustand);
    if (spiel.zustand.vorbei) tode++;
    console.log(
      `${String(s).padStart(9)}  ${String(spiel.befehle.length).padStart(7)}  ${String(spiel.zustand.zeit).padStart(7)}  ` +
      `${String(p.werte.lp.aktuell).padStart(3)}  ${String(p.werte.pp.aktuell).padStart(3)}  ${String(getoetet).padStart(7)}  ` +
      `${String(biere).padStart(5)}  ${spiel.zustand.vorbei ? "tot" : "lebt"}, nachgespielt ok`
    );
  } catch (e) {
    fehler++;
    console.log(`${String(s).padStart(9)}  FEHLER: ${e.stack}`);
  }
}
console.log(`\n${laeufe} Läufe, ${tode} tot, ${fehler} Fehler`);
process.exitCode = fehler ? 1 : 0;
