// Tastenbelegung (Vorgabe), frei änderbar: Taste -> Aktion aus dem Aktionskatalog (eingabe/aktionskatalog.js).
//   tasten:        physische Tasten nach KeyboardEvent.code, in der Hilfe angezeigt
//   weitereTasten: wirken genauso, die Hilfe nennt sie nicht (z.B. die Lage von + und - auf der US-Tastatur)
//   zeichen:       nach dem Zeichen der Taste (KeyboardEvent.key), für Zeichen ohne feste Lage; gehen den Tasten vor
//   umschaltBewegen: Aktion für Umschalt plus eine Bewegungstaste (Laufen, eingabe/laufen.js)
//   umschaltTasten: physische Tasten mit Umschalt (Leiste wechseln); gehen allem anderen vor
// Eine Aktion darf mehrere Tasten haben. Bewegung nach den vi-Tasten der Roguelikes, nach der Lage der Taste:
// h j k l, dazu y u b n für die Diagonalen; auf der deutschen Tastatur liegt y auf der Taste mit der Aufschrift Z
// (KeyY). Ziffernblock und Pfeiltasten bleiben zusätzlich belegt (docs/Oberflaeche.md, Tastatur).
export default {
  tasten: {
    KeyY: "bewegen_nw", // Aufschrift Z auf deutscher Tastatur
    KeyK: "bewegen_n",
    KeyU: "bewegen_no",
    KeyH: "bewegen_w",
    KeyL: "bewegen_o",
    KeyB: "bewegen_sw",
    KeyJ: "bewegen_s",
    KeyN: "bewegen_so",
    Numpad7: "bewegen_nw",
    Numpad8: "bewegen_n",
    Numpad9: "bewegen_no",
    Numpad4: "bewegen_w",
    Numpad6: "bewegen_o",
    Numpad1: "bewegen_sw",
    Numpad2: "bewegen_s",
    Numpad3: "bewegen_so",
    Numpad5: "warten",
    KeyG: "aufheben",
    KeyT: "trinken", // Gegenstand wählt die Eingabe: erstes Getränk im Gepäck
    KeyD: "fallenlassen_waehlen", // Inventar, der Buchstabe lässt fallen
    KeyW: "werfen_waehlen", // Inventar, der Buchstabe wirft
    Space: "fortsetzen", // unterbrochene lange Aktion weiterführen
    KeyX: "untersuchen", // Untersuchen mit dem Cursor des Zielmodus (eingabe/zielmodus.js)
    Digit1: "schnellplatz_1",
    Digit2: "schnellplatz_2",
    Digit3: "schnellplatz_3",
    Digit4: "schnellplatz_4",
    Digit5: "schnellplatz_5",
    Digit6: "schnellplatz_6",
    Digit7: "schnellplatz_7",
    Digit8: "schnellplatz_8",
    Digit9: "schnellplatz_9",
    Digit0: "schnellplatz_10",
    KeyR: "rasten", // bis LP und MP voll sind
    KeyO: "erkunden", // automatisch erkunden
    KeyA: "autokampf", // in der Arena automatisch kämpfen; jede Taste hält an
    Escape: "abbrechen", // Esc-Kette: Zielmodus, Fenster, Ablauf, sonst Spielmenü (eingabe/esckette.js)
    KeyI: "inventar", // Inventarfenster (eingabe/inventar.js)
    KeyF: "faehigkeiten", // Fähigkeitenfenster (eingabe/faehigkeiten.js)
    KeyC: "charakter", // Charakter und Skills (eingabe/charakter.js)
    Tab: "verlauf", // ganzes Log als Fenster (eingabe/verlauf.js)
    KeyM: "karte", // Übersichtskarte (eingabe/karte.js)
    NumpadAdd: "zoom_rein",
    NumpadSubtract: "zoom_raus",
    BracketRight: "zoom_rein", // "+" auf deutscher Tastatur
    Slash: "zoom_raus", // "-" auf deutscher Tastatur
    Enter: "neustart",
  },
  weitereTasten: {
    ArrowUp: "bewegen_n",
    ArrowDown: "bewegen_s",
    ArrowLeft: "bewegen_w",
    ArrowRight: "bewegen_o",
    IntlBackslash: "treppe", // Taste <> der deutschen Tastatur, falls der Browser kein Zeichen meldet
    Equal: "zoom_rein", // US-Tastatur
    Minus: "zoom_raus", // US-Tastatur
    NumpadEnter: "neustart",
  },
  zeichen: {
    "?": "hilfe", // deutsche Tastatur Umschalt+ß, US Umschalt+/
    ":": "befehlszeile", // deutsche Tastatur Umschalt+., US Umschalt+;
    ".": "warten",
    "<": "treppe",
    ">": "treppe",
  },
  umschaltBewegen: "laufen",
  umschaltTasten: {
    Digit1: "leiste_1",
    Digit2: "leiste_2",
    Digit3: "leiste_3",
    Digit4: "leiste_4",
    Digit5: "leiste_5",
  },
  // Maustasten nach MouseEvent.button (0 links, 1 Mitte, 2 rechts); Rad: Zoom oder nichts
  maus: {
    0: "handeln", // Klick wird über die Klickregeln gedeutet (eingabe/maus.js)
    2: "untersuchen", // Rechtsklick beschreibt das Feld wie X, das Kontextmenü des Browsers bleibt zu
  },
  rad: "zoom",
};
