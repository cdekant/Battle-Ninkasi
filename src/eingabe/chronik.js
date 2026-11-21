// Chronik (siehe docs/Titelbildschirm.md): was über alle Läufe hinweg bleibt, getrennt von den Speicherplätzen und
// ohne Aufzeichnungen, damit sie neue Versionen übersteht. Kern ohne DOM und ohne localStorage; src/main.js speichert
// sie unter SPEICHERSCHLUESSEL_CHRONIK.
//   { format, laeufe: [{ version, startwert, spielart, datum, tiefe, zuege, befehle, ergebnis, ursache }], zaehler: { name: zahl } }
// Zähler sind frei benannt ("besiegt.<typ>", "gesehen.<typ>", "tode", "laeufe"); erhoben werden sie in der Oberfläche
// aus den Meldungen der Logik (ZAEHLREGELN) und aus dem Sichtfeld, nie in der Logik. Gezählt wird nur beim echten
// Spielen: Laden eines Schnappschusses meldet nichts, ein späterer Abspieler zählt nicht mit.
// Freischaltungen (Titelbilder, später Erfolge, Bestiarium) sind Bedingungen auf Zählern: { zaehler, mindestens }.

export const SPEICHERSCHLUESSEL_CHRONIK = "battle-ninkasi.chronik";
export const CHRONIK_FORMAT = 1;
export const HOECHSTENS_LAEUFE = 500; // älteste Einträge fallen heraus, die Zähler bleiben

export function neueChronik() {
  return { format: CHRONIK_FORMAT, laeufe: [], zaehler: {} };
}

// Gespeicherte Chronik prüfen; Unlesbares ergibt eine neue, ungültige Zähler fallen weg
export function chronikGueltig(roh) {
  if (!roh || typeof roh !== "object" || roh.format !== CHRONIK_FORMAT || !Array.isArray(roh.laeufe) || !roh.zaehler || typeof roh.zaehler !== "object") return neueChronik();
  const zaehler = Object.fromEntries(Object.entries(roh.zaehler).filter(([, wert]) => Number.isInteger(wert) && wert >= 0));
  return { format: CHRONIK_FORMAT, laeufe: roh.laeufe.filter((lauf) => lauf && typeof lauf === "object"), zaehler };
}

export function zaehlerstand(chronik, name) {
  return chronik.zaehler[name] ?? 0;
}

export function zaehlerErhoehen(chronik, name, um = 1) {
  chronik.zaehler[name] = zaehlerstand(chronik, name) + um;
}

// Zählregeln je Art der Meldung: (meldung, spiel) => Name eines Zählers oder null; ein neuer Zähler ist eine Zeile hier
export const ZAEHLREGELN = {
  tod: (meldung, spiel) => {
    const ninkasiId = spiel.zustand.spielerinId;
    if (meldung.opfer.id === ninkasiId) return "tode";
    if (meldung.quelle?.id === ninkasiId) return `besiegt.${meldung.opfer.typ}`;
    return null;
  },
};

// Eine Meldung der Logik zählen (als Hörer angemeldet in src/main.js)
export function meldungZaehlen(chronik, spiel, meldung) {
  const name = ZAEHLREGELN[meldung.art]?.(meldung, spiel);
  if (name) zaehlerErhoehen(chronik, name);
}

// Wesenarten in Sicht zählen, je Lauf jede Art einmal ("gesehen.<typ>"); gesehen: Set der Arten dieses Laufs, gehört
// zum Speicherstand (Teil oberflaeche), damit ein fortgesetzter Lauf nicht doppelt zählt. Freundliche Wesen sind damit
// auch "getroffen".
export function sichtungenZaehlen(chronik, spiel, gesehen) {
  const zustand = spiel.zustand;
  if (!zustand.sichtbareFelder || !zustand.ebene) return;
  const sichtbar = new Set(zustand.sichtbareFelder);
  for (const entitaet of Object.values(zustand.entitaeten)) {
    if (!entitaet.position || entitaet.fraktion === undefined || entitaet.id === zustand.spielerinId || gesehen.has(entitaet.typ)) continue;
    if (!sichtbar.has(entitaet.position.y * zustand.ebene.breite + entitaet.position.x)) continue;
    gesehen.add(entitaet.typ);
    zaehlerErhoehen(chronik, `gesehen.${entitaet.typ}`);
  }
}

// Ein beendeter Lauf; ergebnis "tod" oder "aufgegeben"; todesmeldung: die Meldung "tod" Ninkasis oder null;
// datum (Millisekunden) und version setzt src/main.js
export function laufEintragen(chronik, spiel, { ergebnis, datum, version, todesmeldung = null }) {
  const ninkasi = spiel.zustand.entitaeten[spiel.zustand.spielerinId];
  chronik.laeufe.push({
    version,
    startwert: spiel.zustand.startwert,
    spielart: spiel.optionen.spielart ?? "normal",
    datum,
    tiefe: spiel.zustand.tiefe,
    zuege: ninkasi?.zuege ?? 0,
    befehle: spiel.befehle.length,
    ergebnis,
    ursache: todesmeldung ? { quelle: todesmeldung.quelle?.typ ?? null, ursache: todesmeldung.ursache ?? null } : null,
  });
  if (chronik.laeufe.length > HOECHSTENS_LAEUFE) chronik.laeufe.splice(0, chronik.laeufe.length - HOECHSTENS_LAEUFE);
  zaehlerErhoehen(chronik, "laeufe");
}

// Bedingung einer Freischaltung: null (immer frei) oder { zaehler, mindestens }
export function freigeschaltet(chronik, bedingung) {
  return !bedingung || zaehlerstand(chronik, bedingung.zaehler) >= bedingung.mindestens;
}
