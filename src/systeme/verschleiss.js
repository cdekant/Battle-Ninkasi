// Verschleiß der Gegenstände (siehe docs/Gegenstaende.md, Verschleiß).
// Verderben: verdirbt: { nach, wird } am Gegenstand; beim Erzeugen bekommt er den Zeitpunkt verdirbtUm und ein
//   gebundenes Zeitereignis (systeme/inventar.js verderbenEinplanen). Ist es so weit, wird er zum Typ wird, am selben
//   Ort oder im selben Gepäck, mit derselben Anzahl (Meldung verdorben); mit wird: null vergeht er (Meldung vergangen,
//   mit traegerin nur, wenn er getragen wurde). Auf verlassenen Ebenen ruht das Verderben
//   mit (systeme/ebenen.js), was Ninkasi trägt, verdirbt weiter. Eigene Arten des Verderbens melden sich im Register
//   "verderben" an und haben Vorrang (ein Sud rückt eine Stufe weiter, systeme/reifen.js); verdirbt braucht dann kein wird.
// Haltbarkeit: haltbarkeit: { hoechstens, wirdZu, unempfindlich?: { <schadensart>: prozent } } am Gegenstand, der Stand
//   in haltbarkeit.aktuell (Vorgabe hoechstens).
//   Abgenutzt wird nur über den Baustein abnutzen, nicht durch Gebrauch; angefressen wirkt ein Gegenstand schwächer
//   (systeme/ausruestung.js haltbarkeitProzent). Bei 0 ist er kaputt: die Zustandsprüfung kaputt (nach Tod und Lage,
//   nur für Vorgemerktes) macht ihn zu wirdZu, abgelegt und ins Gepäck (Meldung kaputt).

import { anmelden, alle } from "../kern/register.js";
import { bausteinAnmelden, mengeBestimmen } from "../kern/bausteine.js";
import { melden, bezugAuf } from "../kern/ereignisse.js";
import { entitaetMitId, entitaetEntfernen, entitaetAusDatensatz, ausDemInventarNehmen } from "../kern/zustand.js";
import { kaputtVormerken, kaputtOffenEntnehmen } from "../kern/raumindex.js";
import { wurfAuswahl, wurfProzent } from "../kern/wurf.js";
import { anzahlVon, insInventar } from "./inventar.js";
import { ausgeruestete, haltbarkeitProzent } from "./ausruestung.js";

export const haltbarkeitVon = (gegenstand) => (gegenstand.haltbarkeit ? gegenstand.haltbarkeit.aktuell ?? gegenstand.haltbarkeit.hoechstens : null);

// Ersetzt einen Gegenstand durch einen neuen des Typs, am selben Ort oder im Gepäck derselben Trägerin (dort fließt
// er in einen gleichen Stapel), mit derselben Anzahl; gibt { neu, traegerin } zurück
export function gegenstandErsetzen(spiel, alt, typ) {
  const zustand = spiel.zustand;
  const traegerin = alt.getragenVon !== undefined ? entitaetMitId(zustand, alt.getragenVon) : null;
  const position = alt.position ? { x: alt.position.x, y: alt.position.y } : null;
  const anzahl = anzahlVon(alt);
  if (traegerin) ausDemInventarNehmen(traegerin, alt.id);
  delete alt.getragenVon;
  entitaetEntfernen(zustand, alt.id);
  let neu = entitaetAusDatensatz(zustand, typ, spiel.daten.gegenstaende[typ], traegerin ? null : position);
  if (anzahl > 1) neu.anzahl = anzahl;
  if (traegerin) neu = insInventar(spiel, traegerin, neu);
  return { neu, traegerin };
}

anmelden("zeitereignisse", "verderben", (spiel, { gegenstandId }) => {
  const gegenstand = entitaetMitId(spiel.zustand, gegenstandId);
  if (!gegenstand?.verdirbt) return;
  for (const [, behandeln] of alle("verderben")) if (behandeln(spiel, gegenstand)) return;
  const vorher = bezugAuf(gegenstand), anzahl = anzahlVon(gegenstand);
  if (gegenstand.verdirbt.wird === null) {
    const traegerin = gegenstand.getragenVon !== undefined ? entitaetMitId(spiel.zustand, gegenstand.getragenVon) : null;
    if (traegerin) ausDemInventarNehmen(traegerin, gegenstand.id);
    entitaetEntfernen(spiel.zustand, gegenstand.id);
    melden(spiel, "vergangen", { was: { ...vorher, anzahl }, traegerin: traegerin ? bezugAuf(traegerin) : null, anzahl });
    return;
  }
  const { neu, traegerin } = gegenstandErsetzen(spiel, gegenstand, gegenstand.verdirbt.wird);
  melden(spiel, "verdorben", { was: vorher, wird: bezugAuf(neu), traegerin: traegerin ? bezugAuf(traegerin) : null, anzahl });
});

// Nutzt einen angelegten Gegenstand des Ziels mit Haltbarkeit ab (Säure frisst an der Rüstung);
// platz: nur dort (Vorgabe: unter allen angelegten mit Haltbarkeit zufällig), Menge siehe mengeBestimmen;
// art: Schadensart des Abnutzens; haltbarkeit.unempfindlich: { <art>: prozent } am Gegenstand ist die Chance, dass ihm
// ein Abnutzen dieser Art nichts tut (Leder gegen Säure), gewürfelt mit "abnutzen_unempfindlich"
bausteinAnmelden("abnutzen", { platz: "text?", art: "schadensart?", wuerfel: "wuerfel|menge" }, (spiel, kontext, parameter) => {
  const zustand = spiel.zustand;
  const ziel = entitaetMitId(zustand, kontext.zielId);
  if (!ziel) return;
  const kandidaten = ausgeruestete(spiel, ziel)
    .filter((gegenstand) => haltbarkeitVon(gegenstand) > 0 && (parameter.platz === undefined || gegenstand.ausruestung.platz === parameter.platz));
  if (!kandidaten.length) return;
  const getroffen = wurfAuswahl(spiel, "abnutzen_wohin", kandidaten);
  const unempfindlich = parameter.art === undefined ? 0 : getroffen.haltbarkeit.unempfindlich?.[parameter.art] ?? 0;
  if (unempfindlich > 0 && wurfProzent(spiel, "abnutzen_unempfindlich", unempfindlich)) return;
  const menge = Math.max(0, mengeBestimmen(spiel, kontext, parameter));
  if (menge === 0) return;
  const vorher = haltbarkeitVon(getroffen);
  getroffen.haltbarkeit.aktuell = Math.max(0, vorher - menge);
  melden(spiel, "abgenutzt", { wer: bezugAuf(ziel), was: bezugAuf(getroffen), menge: vorher - getroffen.haltbarkeit.aktuell, prozent: haltbarkeitProzent(getroffen) });
  if (getroffen.haltbarkeit.aktuell === 0) kaputtVormerken(zustand, getroffen);
}, { brauchtZiel: true });

anmelden("zustandspruefungen", "kaputt", (spiel) => {
  let veraendert = false;
  for (const gegenstandId of kaputtOffenEntnehmen(spiel.zustand)) {
    const gegenstand = entitaetMitId(spiel.zustand, gegenstandId);
    if (!gegenstand || haltbarkeitVon(gegenstand) !== 0) continue;
    const vorher = bezugAuf(gegenstand);
    const { neu, traegerin } = gegenstandErsetzen(spiel, gegenstand, gegenstand.haltbarkeit.wirdZu);
    melden(spiel, "kaputt", { was: vorher, wird: bezugAuf(neu), traegerin: traegerin ? bezugAuf(traegerin) : null });
    veraendert = true;
  }
  return veraendert;
});
