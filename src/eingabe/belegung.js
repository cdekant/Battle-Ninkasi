// Tastenbelegung (Vorgabe), frei änderbar: Taste -> Aktion aus dem Aktionskatalog (eingabe/aktionskatalog.js).
//   tasten:        physische Tasten nach KeyboardEvent.code, in der Hilfe angezeigt
//   weitereTasten: wirken genauso, die Hilfe nennt sie nicht (z.B. die Lage von + und - auf der US-Tastatur)
//   zeichen:       nach dem Zeichen der Taste (KeyboardEvent.key), für Zeichen ohne feste Lage; gehen den Tasten vor
// Eine Aktion darf mehrere Tasten haben. Der Satz "vi" (h j k l ...) folgt mit 0.28.0, siehe docs/Oberflaeche.md.
export default {
  tasten: {
    Numpad7: "bewegen_nw",
    Numpad8: "bewegen_n",
    Numpad9: "bewegen_no",
    Numpad4: "bewegen_w",
    Numpad6: "bewegen_o",
    Numpad1: "bewegen_sw",
    Numpad2: "bewegen_s",
    Numpad3: "bewegen_so",
    Numpad5: "warten",
    IntlBackslash: "treppe", // Taste <> auf deutscher Tastatur: Treppe hinab oder hinauf
    KeyG: "aufheben",
    KeyT: "trinken", // Gegenstand wählt die Eingabe: erstes Getränk im Gepäck
    Space: "fortsetzen", // unterbrochene lange Aktion weiterführen
    KeyX: "untersuchen", // Untersuchen mit dem Cursor des Zielmodus (eingabe/zielmodus.js)
    KeyR: "rasten", // bis LP und MP voll sind
    KeyO: "erkunden", // automatisch erkunden
    Escape: "abbrechen", // Reise, Rasten, Erkunden; offene Fenster und der Zielmodus fangen Esc vorher ab
    KeyI: "inventar", // Inventarfenster (eingabe/inventar.js)
    KeyY: "faehigkeiten", // Taste Z auf deutscher Tastatur: Fähigkeitenfenster (eingabe/faehigkeiten.js)
    KeyC: "charakter", // Charakter und Skills (eingabe/charakter.js)
    NumpadAdd: "zoom_rein",
    NumpadSubtract: "zoom_raus",
    BracketRight: "zoom_rein", // "+" auf deutscher Tastatur
    Slash: "zoom_raus", // "-" auf deutscher Tastatur
    Tab: "log_umschalten",
    Enter: "neustart",
  },
  weitereTasten: {
    Equal: "zoom_rein", // US-Tastatur
    Minus: "zoom_raus", // US-Tastatur
    NumpadEnter: "neustart",
  },
  zeichen: {
    "?": "hilfe", // deutsche Tastatur Umschalt+ß, US Umschalt+/
  },
  // Maustasten nach MouseEvent.button (0 links, 1 Mitte, 2 rechts); Rad: Zoom oder nichts
  maus: {
    0: "handeln", // Klick wird über die Klickregeln gedeutet (eingabe/maus.js)
  },
  rad: "zoom",
};
