# Battle Ninkasi - Animationen

Stand: 2026-11-24, Entwurf, zurückgestellt

Mitprüfen bei Änderungen: [Anzeige.md](Anzeige.md), [Oberflaeche.md](Oberflaeche.md), [Bedienung.md](Bedienung.md)

Konzept für Bewegung und Effekte in der Anzeige: Effektschicht, Kampfanimation, Kamera. Alles hier ist reine Anzeige und berührt weder den Spielzustand noch den Spiel-Zufall; die Logik liefert über ihre Meldungen schon alles Nötige. Grafik (Varianten von Boden und Wand, bewegte Tiles) steht in [Tileset.md](Tileset.md), die Arbeitsliste in Punkt 13 von [Systemausbau.md](Systemausbau.md), Licht in [Welt.md](Welt.md) (Licht), [Wesen.md](Wesen.md) (Wahrnehmung).

## Stand

+ `src/anzeige/animation.js` spielt nur Geschossbahnen ab: nacheinander, ein helles Quadrat je Feld, Takt per `setTimeout` aus `src/main.js` (Einstellung `geschossPause`, 30 ms); jede Taste überspringt, die Taste wirkt trotzdem (siehe Zielmodus in [Bedienung.md](Bedienung.md))
+ Meldungen, an denen Animationen hängen können: `schaden` (mit `kritisch`, `immun`, `schadensart`), `verfehlt` (mit `grund`), `geheilt`, `wert_geaendert`, `tod`, `geschoss` (`bahn`, `aufschlag`), `flaeche` (`felder`), `hinterhalt`, `zustand_beginnt`, `zustand_endet`, `teleportiert`, `gestossen`, `gezogen`, `beschworen`, `verschwindet`, `entzuendet`, `erloschen`, `zerbrochen`
+ Das Log filtert schon nach dem, was Ninkasi wahrnimmt (`meldungWahrnehmbar` in `src/systeme/wahrnehmbar.js`); Animationen folgen derselben Regel

Umsetzung: siehe [Anzeige.md](Anzeige.md), Anzeige; siehe [Bedienung.md](Bedienung.md), Zielmodus

## Teile

1. Gerüst für Effekte und Kampfanimation (zuerst, alles andere baut darauf auf)
   + Eigene Effektschicht über der Karte statt `animation.js`, im Bildtakt des Browsers (`requestAnimationFrame`), mehrere Effekte gleichzeitig oder nacheinander, Tempo als Einstellung
   + Darauf: schwebende Zahlen (Krit größer und farbig, Heilung grün), kurzes Aufblitzen bei Treffern, Explosionen und Schwälle aus `flaeche`, ein richtiges Geschoss statt des Quadrats, vielleicht ein leichtes Wackeln bei Krits
   + Die Zeitleiste ohne DOM und Timer, testbar wie die heutige Animation
2. Varianten von Boden und Wand: siehe [Tileset.md](Tileset.md) (Varianten und Schmuck); der Aufwand liegt vor allem in der Grafik und kann neben Teil 1 in der Tilewerkstatt laufen
3. Bewegte Tiles (siehe [Tileset.md](Tileset.md)), weiches Scrollen der Kamera; Licht gehört wegen der Wahrnehmung nicht hierher

Umsetzung: offen, siehe [Systemausbau.md](Systemausbau.md), Punkt 13

## Entschieden

Der ganze Bereich ist zurückgestellt (Stand 2026-11-20); festgehalten ist, was beim Wiederaufnehmen gilt:

+ Animationen halten die Eingabe auf (Vorbild Brogue): Alle Animationen aus den Meldungen seit Ninkasis letzter Aktion laufen vollständig ab, bevor sie wieder handeln kann; auch wenn mehrere Wesen in der Weltzeit dicht hintereinander handeln (die Weltuhr rechnet in Hundertsteln einer Aktion), geht nichts verloren
+ Vorgabe: alles nacheinander in der Reihenfolge der Meldungen; Gleichzeitiges zusammenzufassen wäre eine spätere Einstellung
+ Kaskaden als Schauspiel (Vorbild Caves of Qud): Handeln nach einer Aktion Ninkasis mehrere Wesen dicht hintereinander, etwa ein flinker Gegner zweimal, zeigt die Animation jede Aktion kurz für sich, sodass man Reihenfolge und Ursache sieht (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo)
+ Reise, Rasten und Erkunden: Vorgabe ist anhalten und alles nacheinander abspielen; das Gerüst stellt dafür Schalter bereit (z.B. Animationen unterwegs verkürzen oder überspringen)
+ Bewegte Tiles und Umgebungseffekte (lodernde Kesselfeuer, blubbernde Bottiche, wogendes Gas) laufen im Bildtakt auch dann, wenn keine Spielzeit vergeht; sie halten die Eingabe nie auf, nur Animationen aus Meldungen tun das; ihr Takt und Flackern kommen aus dem kosmetischen Zufall, die Logik bleibt unberührt
+ Reihenfolge: Gerüst, Kampfanimation, bewegte Tiles (alle drei brauchen den Bildtakt des Gerüsts); Varianten von Boden und Wand hängen nicht daran und sind gesondert zurückgestellt (siehe [Tileset.md](Tileset.md))

Umsetzung: offen, siehe [Systemausbau.md](Systemausbau.md), Punkt 13

## Recherche

Noch offen: Vorbilder für Kampfanimation und Rückmeldung (Brogue, DCSS, Caves of Qud, Cogmind, Into the Breach), danach ein Plan mit Datenformaten und Versionen.
