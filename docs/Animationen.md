# Battle Ninkasi - Animationen

Stand: 2026-11-20, Entwurf

Konzept für Bewegung und Effekte in der Anzeige: Effektschicht, Kampfanimation, Kamera. Alles hier ist reine Anzeige und berührt weder den Spielzustand noch den Spiel-Zufall; die Logik liefert über ihre Meldungen schon alles Nötige. Grafik (Varianten von Boden und Wand, bewegte Tiles) steht in [Tileset.md](Tileset.md), die Arbeitsliste in Punkt 12 von [Systemausbau.md](Systemausbau.md), Licht in [Architektur.md](Architektur.md) (Licht, Wahrnehmung).

## Stand

+ `src/anzeige/animation.js` spielt nur Geschossbahnen ab: nacheinander, ein helles Quadrat je Feld, Takt per `setTimeout` aus `src/main.js` (Einstellung `geschossPause`, 30 ms); jede Taste überspringt, die Taste wirkt trotzdem (siehe Zielmodus in [Architektur.md](Architektur.md))
+ Meldungen, an denen Animationen hängen können: `schaden` (mit `kritisch`, `immun`, `schadensart`), `verfehlt` (mit `grund`), `geheilt`, `wert_geaendert`, `tod`, `geschoss` (`bahn`, `aufschlag`), `flaeche` (`felder`), `hinterhalt`, `zustand_beginnt`, `zustand_endet`, `teleportiert`, `gestossen`, `gezogen`, `beschworen`, `verschwindet`, `entzuendet`, `erloschen`, `zerbrochen`
+ Das Log filtert schon nach dem, was Ninkasi wahrnimmt (`meldungWahrnehmbar` in `src/systeme/wahrnehmbar.js`); Animationen folgen derselben Regel

## Teile

1. Gerüst für Effekte und Kampfanimation (zuerst, alles andere baut darauf auf)
   + Eigene Effektschicht über der Karte statt `animation.js`, im Bildtakt des Browsers (`requestAnimationFrame`), mehrere Effekte gleichzeitig oder nacheinander, Tempo als Einstellung
   + Darauf: schwebende Zahlen (Krit größer und farbig, Heilung grün), kurzes Aufblitzen bei Treffern, Explosionen und Schwälle aus `flaeche`, ein richtiges Geschoss statt des Quadrats, vielleicht ein leichtes Wackeln bei Krits
   + Die Zeitleiste ohne DOM und Timer, testbar wie die heutige Animation
2. Varianten von Boden und Wand: siehe [Tileset.md](Tileset.md) (Varianten und Schmuck); der Aufwand liegt vor allem in der Grafik und kann neben Teil 1 in der Tilewerkstatt laufen
3. Bewegte Tiles (siehe [Tileset.md](Tileset.md)), weiches Scrollen der Kamera; Licht gehört wegen der Wahrnehmung nicht hierher

## Offene Fragen

1. Halten Animationen die Eingabe auf? Empfehlung nein, wie heute: jede Taste überspringt, die Taste wirkt trotzdem, die Optik bremst das Spiel nie; dagegen Brogue, das kurz wartet, bis eine Explosion durch ist (schöner, aber zäh bei schnellem Spiel)
2. Reihenfolge Gerüst, Kampfanimation, Varianten, bewegte Tiles, oder die Varianten vorziehen, weil man sie ständig sieht?
3. Wie weit gehen Varianten? Empfehlung zwei Stufen, siehe [Tileset.md](Tileset.md)

## Recherche

Noch offen: Vorbilder für Kampfanimation und Rückmeldung (Brogue, DCSS, Cogmind, Into the Breach), danach ein Plan mit Datenformaten und Versionen.
