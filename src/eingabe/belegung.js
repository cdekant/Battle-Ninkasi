// Tastenbelegung (Vorgabe), frei änderbar. Schlüssel sind KeyboardEvent.code (physische Taste).
// befehle: werden zu Befehlen an die Logik; anzeige: reine Anzeige-Aktionen, kein Befehl.
export default {
  befehle: {
    Numpad7: { art: "bewegen", dx: -1, dy: -1 },
    Numpad8: { art: "bewegen", dx: 0, dy: -1 },
    Numpad9: { art: "bewegen", dx: 1, dy: -1 },
    Numpad4: { art: "bewegen", dx: -1, dy: 0 },
    Numpad6: { art: "bewegen", dx: 1, dy: 0 },
    Numpad1: { art: "bewegen", dx: -1, dy: 1 },
    Numpad2: { art: "bewegen", dx: 0, dy: 1 },
    Numpad3: { art: "bewegen", dx: 1, dy: 1 },
    Numpad5: { art: "warten" },
    KeyG: { art: "aufheben" },
    KeyT: { art: "trinken" }, // Gegenstand wählt die Eingabe: erstes Getränk im Gepäck
    Space: { art: "fortsetzen" }, // unterbrochene lange Aktion weiterführen
    IntlBackslash: { art: "treppe" }, // Taste <> auf deutscher Tastatur: Treppe hinab oder hinauf
  },
  anzeige: {
    NumpadAdd: "zoom_rein",
    NumpadSubtract: "zoom_raus",
    BracketRight: "zoom_rein", // "+" auf deutscher Tastatur
    Slash: "zoom_raus",        // "-" auf deutscher Tastatur
    Equal: "zoom_rein",        // US-Tastatur
    Minus: "zoom_raus",        // US-Tastatur
    Tab: "log_umschalten",
    Enter: "neustart",
    NumpadEnter: "neustart",
    Escape: "reise_abbrechen",
    KeyR: "rasten",   // bis LP und MP voll sind
    KeyO: "erkunden", // automatisch erkunden
    KeyI: "inventar", // Inventarfenster öffnen (eingabe/inventar.js)
    KeyY: "faehigkeiten", // Taste Z auf deutscher Tastatur: Fähigkeitenfenster (eingabe/faehigkeiten.js)
    KeyX: "untersuchen",  // Untersuchen mit dem Cursor des Zielmodus (eingabe/zielmodus.js)
  },
  // Maustasten nach MouseEvent.button (0 links, 1 Mitte, 2 rechts); Rad: Zoom oder nichts
  maus: {
    0: "handeln", // Klick wird über die Klickregeln gedeutet (eingabe/maus.js)
  },
  rad: "zoom",
};
