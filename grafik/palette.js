// Grundpalette für alle Tiles, Entwurf.
// 62 Farben, Schlüssel sind genau die Zeichen 0-9, a-z, A-Z; jedes Zeichen steht in den Pixelmatrizen der Tiles.
// Jedes Tile darf jede Farbe benutzen; Rampen ordnen nur.
// Rampen laufen von dunkel nach hell; dunkle Stufen kühler, helle wärmer.
// Geteilte Schatten: Rampen ohne eigene dunkelste Stufe leihen sie sich von einer Nachbarrampe
// (Holz und Kupfer bei Bier und Haut, Stahl bei Stein, Gold bei Holz, Hopfen bei Holz, Rosa bei Blut und Magie, Lapis beim Schwarz).
// Signalfarben (Gameplay-Bedeutung, nicht großflächig für neutrales Material): Blut, Säure, Gift, Lauge, Psi, Magie;
// Säure, Gift, Psi und Magie enden in einer Leuchtfarbe, Leuchtrot steht einzeln.
export default {
  durchsichtig: ".",
  farben: [
    // Schwarz: Umriss, tiefster Schatten von Stein und Bier (Stout)
    { zeichen: "0", rampe: "schwarz", stufe: 0, hex: "#100a0a" },

    { zeichen: "1", rampe: "stein", stufe: 1, hex: "#221b1c" },
    { zeichen: "2", rampe: "stein", stufe: 2, hex: "#362c2b" },
    { zeichen: "3", rampe: "stein", stufe: 3, hex: "#4f4340" },
    { zeichen: "4", rampe: "stein", stufe: 4, hex: "#6e605a" },
    { zeichen: "5", rampe: "stein", stufe: 5, hex: "#938478" },

    { zeichen: "6", rampe: "schaum", stufe: 0, hex: "#cdbd98" },
    { zeichen: "7", rampe: "schaum", stufe: 1, hex: "#efe3c4" },
    { zeichen: "8", rampe: "glanz", stufe: 0, hex: "#fffbf0" },
    { zeichen: "9", rampe: "leuchtrot", stufe: 0, hex: "#ff2a3a" },

    // Bier von Porter bis Pils, darunter das Schwarz als Stout
    { zeichen: "a", rampe: "bier", stufe: 1, hex: "#1e0c07" },
    { zeichen: "b", rampe: "bier", stufe: 2, hex: "#331309" },
    { zeichen: "c", rampe: "bier", stufe: 3, hex: "#4e200b" },
    { zeichen: "d", rampe: "bier", stufe: 4, hex: "#8c4510" },
    { zeichen: "e", rampe: "bier", stufe: 5, hex: "#c97c1a" },
    { zeichen: "f", rampe: "bier", stufe: 6, hex: "#f0b84a" },
    { zeichen: "g", rampe: "bier", stufe: 7, hex: "#f8dc8c" },

    { zeichen: "h", rampe: "holz", stufe: 1, hex: "#472a19" },
    { zeichen: "i", rampe: "holz", stufe: 2, hex: "#6b4226" },
    { zeichen: "j", rampe: "holz", stufe: 3, hex: "#92653a" },

    { zeichen: "k", rampe: "kupfer", stufe: 1, hex: "#7f3a22" },
    { zeichen: "l", rampe: "kupfer", stufe: 2, hex: "#bb6438" },
    { zeichen: "m", rampe: "kupfer", stufe: 3, hex: "#e39a6a" },

    { zeichen: "n", rampe: "stahl", stufe: 1, hex: "#47525d" },
    { zeichen: "o", rampe: "stahl", stufe: 2, hex: "#758390" },
    { zeichen: "p", rampe: "stahl", stufe: 3, hex: "#b1bec7" },

    { zeichen: "q", rampe: "gold", stufe: 1, hex: "#8a6414" },
    { zeichen: "r", rampe: "gold", stufe: 2, hex: "#d0a02a" },
    { zeichen: "s", rampe: "gold", stufe: 3, hex: "#f6dc6a" },

    { zeichen: "t", rampe: "hopfen", stufe: 1, hex: "#4e5a22" },
    { zeichen: "u", rampe: "hopfen", stufe: 2, hex: "#7d8a36" },
    { zeichen: "v", rampe: "hopfen", stufe: 3, hex: "#b4bd62" },

    { zeichen: "w", rampe: "rosa", stufe: 1, hex: "#8a2a5a" },
    { zeichen: "x", rampe: "rosa", stufe: 2, hex: "#d0558e" },
    { zeichen: "y", rampe: "rosa", stufe: 3, hex: "#f3a2c4" },

    { zeichen: "A", rampe: "haut", stufe: 0, hex: "#3a1e15" },
    { zeichen: "B", rampe: "haut", stufe: 1, hex: "#5e3424" },
    { zeichen: "C", rampe: "haut", stufe: 2, hex: "#7f4a33" },
    { zeichen: "D", rampe: "haut", stufe: 3, hex: "#9c5f43" },
    { zeichen: "E", rampe: "haut", stufe: 4, hex: "#b97a59" },
    { zeichen: "F", rampe: "haut", stufe: 5, hex: "#d9a07c" },

    { zeichen: "G", rampe: "lapis", stufe: 1, hex: "#1c2350" },
    { zeichen: "H", rampe: "lapis", stufe: 2, hex: "#33438a" },
    { zeichen: "I", rampe: "lapis", stufe: 3, hex: "#5b72c4" },

    { zeichen: "J", rampe: "blut", stufe: 0, hex: "#3d0609" },
    { zeichen: "K", rampe: "blut", stufe: 1, hex: "#6a0c10" },
    { zeichen: "L", rampe: "blut", stufe: 2, hex: "#c0262a" },

    { zeichen: "M", rampe: "saeure", stufe: 0, hex: "#6e6a0e" },
    { zeichen: "N", rampe: "saeure", stufe: 1, hex: "#c4c21e" },
    { zeichen: "O", rampe: "saeure", stufe: 2, hex: "#fff23a" },

    { zeichen: "P", rampe: "gift", stufe: 0, hex: "#1f4a10" },
    { zeichen: "Q", rampe: "gift", stufe: 1, hex: "#5aa820" },
    { zeichen: "R", rampe: "gift", stufe: 2, hex: "#4dff5a" },

    { zeichen: "S", rampe: "lauge", stufe: 0, hex: "#0e4f4a" },
    { zeichen: "T", rampe: "lauge", stufe: 1, hex: "#1f9a8c" },
    { zeichen: "U", rampe: "lauge", stufe: 2, hex: "#7fe0cf" },

    { zeichen: "V", rampe: "psi", stufe: 0, hex: "#154a8a" },
    { zeichen: "W", rampe: "psi", stufe: 1, hex: "#1f8fd8" },
    { zeichen: "X", rampe: "psi", stufe: 2, hex: "#3af2ff" },

    { zeichen: "Y", rampe: "magie", stufe: 0, hex: "#3a1452" },
    { zeichen: "Z", rampe: "magie", stufe: 1, hex: "#6e2e9a" },
    { zeichen: "z", rampe: "magie", stufe: 2, hex: "#e83aff" },
  ],
};
