# Battle Ninkasi - Anzeige

Stand: 2026-11-21

Zuständig für: `src/anzeige/renderer.js`, `src/anzeige/kamera.js`, `src/anzeige/oberflaeche.js`, `src/anzeige/log.js`, `src/anzeige/logzeilen.js`, `src/anzeige/ankuendigungen.js`, `src/anzeige/animation.js`, `src/anzeige/pegelanzeige.js`, `src/anzeige/minikarte.js`, `src/anzeige/bedienzeile.js`, `src/anzeige/stil.css`, `src/systeme/wahrnehmbar.js`

Mitprüfen bei Änderungen: [Bedienung.md](Bedienung.md), [Oberflaeche.md](Oberflaeche.md), [Tileset.md](Tileset.md)

Technik der Anzeige: Renderer, Oberfläche, Kamera und Log; das Schema der Oberfläche steht in [Oberflaeche.md](Oberflaeche.md).

## Anzeige

+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Bezugsgröße 1920x1080, bevorzugt im Vollbild; Vollbild erst nach einer Nutzeraktion (Browser-Regel)
+ Ganzzahlige Skalierung, damit Pixelart scharf bleibt: 1080p 1:1, 4K doppelt, dazwischen 1:1 mit Rand
+ Pixelart in vier Sätzen: 16, 32, 48 und 64 px
+ Gezeichnet wird nur der größte Satz (64 px); die kleineren leitet `werkzeuge/tiles-ableiten.js` daraus ab (Flächenmittel, Vorrang für Signalfarben, Fugenregel für Gelände, Palette, Umriss neu) und warnt bei Verdacht auf verlorene Details; nachgearbeitet wird nur bei Warnungen oder sichtbaren Mängeln; so haben alle Sätze dieselben Formen
+ Keine Zeichen als Platzhalter: Jede neue Entität kommt direkt als Tile ins Spiel, gezeichnet in 64 px, die kleineren Sätze abgeleitet; das Zeichen bleibt nur Absicherung, falls ein Tile fehlt
+ Ein Tileset ist eine Datendatei mit Einträgen je Auflösung; der Renderer wählt zur Zoomstufe den passenden Satz und einen ganzzahligen Faktor
+ Tiles sind Pixeldaten (Palette plus Pixelmatrix als JS-Datendatei in `grafik/`), der Renderer baut daraus beim Start die Bilder; Einzelheiten in [Tileset.md](Tileset.md)
+ Zoom ist eine Einstellung mit frei festlegbaren Stufen, nicht an bestimmte Tile-Größen gebunden; scharf bleibt Pixelart nur in ganzzahligen Vielfachen ihrer Auflösung (16 als 16, 32, 48, 64 px; 32 als 32, 64, 96 px)
+ Der Renderer zeichnet ein Tile, wenn ein Satz scharf zur Zoomstufe passt (Zoom ist ganzzahliges Vielfaches, größter Satz zuerst; fehlt dort das Tile, der nächste), sonst das Zeichen aus `daten/zeichen.js`; die Bilder baut `src/anzeige/tilebilder.js` beim Start, Fehler im Tileset erscheinen wie Datenfehler
+ Standard-Zoomstufe 16 px; vorhanden sind die Sätze 64, 48, 32 und 16 px
+ Offen: Bei einem Geräte-Pixelverhältnis ungleich 1 (z. B. 125 % Skalierung unter Windows) ist ein Tile-Pixel kein ganzzahliges Vielfaches eines Bildschirmpixels; gehört zur ganzzahligen Skalierung, siehe oben
+ Eine Kamera ist immer eingebaut: Ist der Ausschnitt größer als das Level, ist das ganze Level sichtbar, sonst scrollt die Karte; Zoomstufen sind nur Kameraeinstellungen
+ Die Levelgröße ist ein Datenwert, Levels dürfen unterschiedlich groß sein; Ziel: größer als Brogue (79x29)
+ Texte der Oberfläche sind HTML/CSS mit eigenen Schriftgrößen, unabhängig vom Tile-Raster
+ Markierungen über der Karte: Wegvorschau, Feld unter dem Zeiger, die Zielfelder angekündigter Angriffe sichtbarer Gegner (rötlich, `src/anzeige/ankuendigungen.js`, beim Zeichnen aus `laufendeAktion` berechnet, nicht gespeichert), die Vorschau des Zielmodus und das fliegende Geschoss (siehe [Bedienung.md](Bedienung.md), Zielmodus)
+ Das Log zeigt nur, was Ninkasi wahrnimmt (`meldungWahrnehmbar` in `src/systeme/wahrnehmbar.js`, reine Lesefunktion mit Tests): Meldungen mit ihr als Beteiligter (`wer`, `ziel`, `quelle`, `opfer`, `was`, `mit`, `auf`, `traegerin`, `vorher`), Meldungen, bei denen ein beteiligter Bezug mit `ort` oder ein Feld (`ursprung`, `aufschlag`, `bahn`, `felder`) gerade sichtbar ist, und Meldungen ganz ohne Ort (Pegel, Hinweise); `bemerkt` nur, wenn sie das bemerkende Wesen sieht
+ Hören: Lärm, der Ninkasis Feld erreicht (`spielerinHoert` an der Meldung `laerm`) und dessen Ursprung sie nicht sieht, schreibt das Log als vage Zeile mit grober Richtung (`geraeuschGehoert`, `richtungZu`: acht Himmelsrichtungen), je nach `geraeusch` Kampflärm, Klirren oder ein Geräusch, höchstens eine Zeile je 100 Zeiteinheiten; wer dort was tut, sagt es nicht
+ Texte zu Zuständen: `log.zustand_beginnt` und `log.zustand_endet` allgemein, ein Zustand kann eigene mitbringen (`log.zustand.<name>.beginnt` bzw. `.endet`); dazu `abgewichen`, `beschworen` (ohne Urheberin `log.erschienen`) und `verschwindet`

## Oberfläche

+ Seit 0.28.0 das Layout aus [Oberflaeche.md](Oberflaeche.md): Zonen als CSS-Grid (`src/anzeige/stil.css`), Maße als Variablen in `rem` (`--breite-seite`, `--hoehe-log`, `--hoehe-bedienzeile`), so dass die Größe der Oberfläche über die Schriftgröße skaliert, getrennt vom Zoom der Tiles; Farben als Variablen, getrennt vom Layout
+ Variante A (Vorgabe): Karte, darunter das Log in zwei Spalten, rechts die Seitenleiste, unten die Bedienzeile; Variante B: links oben die Minikarte so breit wie die Spalte, darunter das Log (Geschehen über Kampf), Karte in der Mitte; `layoutAnwenden` in `src/main.js` setzt das Canvas der Minikarte dafür um; die Variante steht als `data-layout` an `#spiel`, Einstellung `layout` ("a", "b"), bis zum Einstellungsfenster umgeschaltet im Spielmenü
+ Über der Karte liegen eine noch leere Effektschicht (`#effektschicht`, für die Metaeffekte aus Punkt 12), der Tooltip und die Fenster
+ Seitenleiste (`#seitenkopf`, `#minikarte`, `#seiteninhalt`; `src/anzeige/oberflaeche.js`): Kopf mit Tiefe und Zug (`kopfHtml`), darunter die Minikarte, dann Ninkasi (LP, MP und PP als Balken, Pegel, freie EP immer, auch 0, Heimlichkeitsweite, laufende Aktion "Schritt 2 von 5", Zustände mit Stärke und Restdauer, Last), Zielen bzw. Untersuchen nur im Zielmodus (siehe dort), Gefährten mit LP, dann "In Sicht": die übrigen Wesen nach Abstand (Schachbrett, dann ID) mit Wachzustand (außer `jagt`), Zuständen und "wirkt etwas" bei einer laufenden Aktion (Vorbild Brogue); Startwert und Version zeigt das Spielmenü
+ Der Pegel ist nach oben offen und wird logarithmisch angezeigt (`src/anzeige/pegelanzeige.js`), in Verdopplungsschritten gleicher Breite (0, 0,5, 1, 2, 4, 8, 16 ‰ ...); eingezeichnet sind Schwellen und das Optimum der LP-Regeneration, daneben steht der genaue Wert (z.B. 2,35 ‰)
+ Bedienzeile (`src/anzeige/bedienzeile.js`): links die Nummer der aktiven Leiste und die Schnellleiste (siehe [Bedienung.md](Bedienung.md), Schnellleiste), rechts acht Knöpfe in zwei Reihen aus dem Aktionskatalog (`KNOEPFE`, Text `knopf`), je mit Taste und Wort: Gepäck, Fähigkeiten, Charakter, Karte; Rasten, Erkunden, Hilfe, Menü; den Verlauf öffnet Tab oder ein Klick auf das Log; ein Klick wirkt wie die Taste, bei offenem Fenster oder im Zielmodus geht nur Menü (wie Esc); Knöpfe nehmen keinen Fokus
+ Inventar, Fähigkeiten, Charakter und Skills, Verlauf, Spielmenü, Hilfe, später Handel und Brauen als Fenster über der Karte; Öffnen und Schließen sind keine Befehle (siehe [Bedienung.md](Bedienung.md), Fenster)
+ Minikarte und Übersichtskarte (`src/anzeige/minikarte.js`): `minikartenBild` rechnet ohne DOM je Feld die Farbe des Geländes aus `daten/zeichen.js` (Unerkundetes leer, gerade nicht Sichtbares gedämpft) und Punkte für Treppen, Gegenstände und Wesen in Sicht (Feind rot, Gefährte blau, neutral grau, Ninkasi weiß zuletzt); gezeichnet mit höchstens 3 px je Feld in der Seitenleiste, die Übersichtskarte (Taste m, Fenster `karte`) mit höchstens 10 px und Legende; ein Klick auf eine von beiden reist dorthin (nur über Erkundetes)
+ Hervorheben (Vorbild Brogue): Steht der Zeiger über einem Wesen der Seitenleiste (`data-wesen`), bekommt sein Feld auf der Karte und auf der Minikarte einen Rahmen; das Wesen unter dem Zeiger auf der Karte oder unter dem Cursor beim Untersuchen ist in der Seitenleiste hervorgehoben
+ Alle Elemente sind Anzeige und lassen sich ändern, ohne die Logik zu berühren
+ Was noch aussteht (Befehlszeile, Suche im Verlauf, Einstellungen, Titel), steht in [Oberflaeche.md](Oberflaeche.md) unter Stand der Umsetzung

## Kamera

+ Folgen mit Randabstand: Die Kamera bewegt sich erst, wenn Ninkasi näher als etwa ein Viertel des Ausschnitts an den Rand kommt
+ Am Levelrand bleibt die Kamera stehen, jenseits des Levels ist nichts zu sehen; kleinere Levels stehen mittig
+ Zunächst feldweises Springen, weiches Scrollen später als reine Anzeige (siehe [Animationen.md](Animationen.md))
+ Umschauen: Karte frei verschieben per Maus oder Taste, ein Anzeige-Zustand
+ Weitere Verhaltensweisen (Zentrieren, Springen) bleiben austauschbar und einstellbar

## Log

+ Zwei Spalten (`src/anzeige/log.js`): Geschehen (Erzählung, Bemerktes, Gehörtes, Hinweise) und Kampf (Treffer, Abwehr, Tod anderer, gewirkte Fähigkeiten, angekündigte Angriffe); in Variante B übereinander; je Spalte stehen die neuesten Zeilen unten, wie viele sichtbar sind, entscheidet das Layout
+ Die Form einer Zeile entsteht ohne DOM in `src/anzeige/logzeilen.js` (`zeilenAusMeldung`, mit Tests): `{ spalte, art, text, seite?, ton?, magisch?, zahlen? }`; die Art (`ARTEN`) gibt Symbol und Filter (Gefahr ⚠, Angriff ⚔, Krit ✦, abgewehrt ○, Widerstand ◆, Tod ☠, Heilung, Pegel, Fund, Lernen, Geschehen, Hinweis); Farbe nie allein
+ Jede Zeile in festen Spalten: Zugmarke (Zugzähler `zuege` Ninkasis, ein Strich trennt ihre Züge), Symbol, Text, im Kampf dazu je eine schmale Spalte für Chance, Schaden, Krit und Abzug (`ZAHLENSPALTEN`, Kopfzeile kurz "%", "DMG", "×", "–", der Tooltip nennt die Bedeutung; leere Zellen bleiben stehen); Abzug fasst Rüstung und Widerstand zusammen, der Tooltip nennt die Aufteilung; gleiche Zeilen hintereinander werden zu "x3" zusammengefasst, ältere werden in vier Stufen blasser
+ Kampf nach Seite und Ton: die Farbfamilie folgt, wer handelt (`seiteVon`: Ninkasi Grün, Verbündete Blau, Gegner Rot, Neutrale Grau), der Ton dem Ausgang (Treffer, Krit hell und fett, abgewehrt gedämpft); bei Gegnern Gelb für angekündigte Angriffe und Lila für Psi und Magie; ein Tod in der Farbe der Seite, die ihn verursacht hat (ohne Quelle der Seite, der er nützt); Farben als Variablen in `stil.css`
+ Zahlen im Kampf: Trefferchance (die Logik meldet `trefferchance` an `schaden` und `verfehlt`, in Prozent vor dem Blocken; ohne Trefferwurf `null`), Schaden, Krit-Faktor (`kritfaktor` an `schaden`, sonst `null`), Abzug der Rüstung, Widerstand
+ Der Verlauf (Tab) zeigt das ganze Log (höchstens 500 Zeilen) als Fenster mit Filter nach Spalte oder Art (siehe [Bedienung.md](Bedienung.md), Fenster)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
