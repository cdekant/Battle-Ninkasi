// Fensterstapel (siehe docs/Architektur.md, Fenster): reine Tastenlogik ohne DOM, damit sie testbar ist.
// Der Stapel ist Anzeige-Zustand, nicht Spielzustand: [{ art, zustand }], das letzte Fenster liegt oben und bekommt
// jede Taste. Fenster kosten keine Spielzeit; die Logik sieht nur die Befehle, die ein Fenster ausgibt.
// Fensterarten melden sich hier an (eingabe/inventar.js, faehigkeiten.js, charakter.js, erstellung.js, hilfe.js):
//   { taste(zustand, taste, kontext) => ergebnis }
//   taste:    { code, zeichen, umschalt } (KeyboardEvent.code, KeyboardEvent.key, Umschalttaste)
//   kontext:  { spiel, daten, belegung }
//   ergebnis: { zustand, befehl?, auswahl?, grund?, oeffnen?, start?, aktion?, leiste? }
//     zustand null schließt das Fenster, sonst ersetzt er den Zustand des Fensters
//     befehl:  an die Logik (z.B. lernen, trinken); auswahl: für den Zielmodus, schließt alle Fenster
//     grund:   warum nichts geschieht (das Log nennt ihn); oeffnen: { art, zustand } legt ein Fenster obenauf
//     start:   Startoptionen für einen neuen Lauf (Charaktererstellung)
//     aktion:  Aktion der Oberfläche, die src/main.js ausführt (Spielmenü: neustart, layout, beenden)
//     leiste:  Änderung der Schnellleiste { belegen: { stelle, platz } } oder { entfernen: platz } (eingabe/schnellleiste.js)
// Die Anzeige der Fenster steht in anzeige/fenster.js.

const fensterarten = new Map();

export function fensterartAnmelden(name, art) {
  fensterarten.set(name, art);
}

export function fensterart(name) {
  return fensterarten.get(name) ?? null;
}

export function oberstesFenster(stapel) {
  return stapel.length ? stapel[stapel.length - 1] : null;
}

export function fensterOeffnen(stapel, art, zustand = {}) {
  if (!fensterarten.has(art)) throw new Error(`Unbekannte Fensterart ${art}`);
  return [...stapel, { art, zustand }];
}

// Gibt die Taste an das oberste Fenster; { stapel, befehl?, auswahl?, grund?, start?, aktion?, leiste? }
export function fensterTaste(stapel, taste, kontext) {
  const oben = oberstesFenster(stapel);
  if (!oben) return { stapel };
  const ergebnis = fensterarten.get(oben.art).taste(oben.zustand, taste, kontext) ?? { zustand: oben.zustand };
  let neuerStapel = ergebnis.zustand === null ? stapel.slice(0, -1) : [...stapel.slice(0, -1), { art: oben.art, zustand: ergebnis.zustand }];
  if (ergebnis.oeffnen) neuerStapel = fensterOeffnen(neuerStapel, ergebnis.oeffnen.art, ergebnis.oeffnen.zustand);
  if (ergebnis.auswahl) neuerStapel = [];
  const { befehl, auswahl, grund, start, aktion, leiste } = ergebnis;
  return { stapel: neuerStapel, ...(befehl && { befehl }), ...(auswahl && { auswahl }), ...(grund && { grund }), ...(start && { start }), ...(aktion && { aktion }), ...(leiste && { leiste }) };
}
