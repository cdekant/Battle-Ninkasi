# Battle Ninkasi - Anzeige

Stand: 2026-11-22

Zuständig für: `src/anzeige/renderer.js`, `src/anzeige/kamera.js`, `src/anzeige/oberflaeche.js`, `src/anzeige/log.js`, `src/anzeige/logzeilen.js`, `src/anzeige/ankuendigungen.js`, `src/anzeige/animation.js`, `src/anzeige/pegelanzeige.js`, `src/anzeige/minikarte.js`, `src/anzeige/bedienzeile.js`, `src/anzeige/stil.css`, `src/systeme/wahrnehmbar.js`

Mitprüfen bei Änderungen: [Bedienung.md](Bedienung.md), [Oberflaeche.md](Oberflaeche.md), [Tileset.md](Tileset.md), [Animationen.md](Animationen.md), [Texte.md](Texte.md), [Welt.md](Welt.md)

## Zweck

Technik der Anzeige: Renderer und Tiles auf der Karte, Markierungen, Wahrnehmbarkeit der Meldungen, Layout und Seitenleiste, Minikarte, Bedienzeile, Kamera und Log. Das Schema der Oberfläche steht in [Oberflaeche.md](Oberflaeche.md), die Tiles selbst in [Tileset.md](Tileset.md), die Eingabe in [Bedienung.md](Bedienung.md). Die Anzeige liest den Zustand nur und hört auf Meldungen; alles hier lässt sich ändern, ohne die Logik zu berühren. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Anzeige

Daten:

+ Tiles als Pixeldaten in `grafik/` (Sätze 64, 48, 32 und 16 px), Zeichen als Ersatz in `daten/zeichen.js` (dort auch die Farben von Gelände und Schichten); siehe [Tileset.md](Tileset.md)
+ Einstellungen `zoom` (Vorgabe 16) und `zoomstufen` (16, 32, 48, 64), siehe [Bedienung.md](Bedienung.md), Einstellungen
+ Die Levelgröße ist ein Datenwert, Levels dürfen unterschiedlich groß sein; Ziel: größer als Brogue (79x29)

Schnittstellen:

+ `Renderer` (`src/anzeige/renderer.js`): zeichnet die Karte auf ein Canvas und liest den Zustand nur; `ansicht(zoom)` passt das Canvas an seinen Container an und gibt den Ausschnitt in Feldern; Bilder aus `src/anzeige/tilebilder.js`, beim Start gebaut, Fehler im Tileset erscheinen wie Datenfehler
+ Markierungen über der Karte: Wegvorschau, Feld unter dem Zeiger, die Zielfelder angekündigter Angriffe sichtbarer Gegner (rötlich, `angekuendigteFelder` in `src/anzeige/ankuendigungen.js`, beim Zeichnen aus `laufendeAktion` berechnet, nicht gespeichert), die Vorschau des Zielmodus und das fliegende Geschoss (`src/anzeige/animation.js`, siehe [Bedienung.md](Bedienung.md), Zielmodus)
+ Wahrnehmbarkeit (`src/systeme/wahrnehmbar.js`, reine Lesefunktionen mit Tests): `meldungWahrnehmbar`, `geraeuschGehoert`, `richtungZu` (acht Himmelsrichtungen)

Regeln:

+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber; Texte der Oberfläche mit eigenen Schriftgrößen, unabhängig vom Tile-Raster
+ Bezugsgröße 1920x1080, bevorzugt im Vollbild; Vollbild erst nach einer Nutzeraktion (Browser-Regel)
+ Das Canvas hat die Auflösung des Geräts (`devicePixelRatio`), gezeichnet wird in CSS-Pixeln; bei 200 % (4K) wird so jedes Tile-Pixel doppelt; Ziel ist ganzzahlige Skalierung (1080p 1:1, 4K doppelt, dazwischen 1:1 mit Rand), offen ist ein Verhältnis wie 125 % unter Windows, bei dem ein Tile-Pixel kein ganzzahliges Vielfaches eines Bildschirmpixels ist
+ Zoom ist eine Einstellung mit frei festlegbaren Stufen; scharf bleibt Pixelart nur in ganzzahligen Vielfachen ihrer Auflösung (16 als 16, 32, 48, 64 px; 32 als 32, 64, 96 px)
+ Der Renderer zeichnet ein Tile, wenn ein Satz scharf zur Zoomstufe passt (Zoom ist ganzzahliges Vielfaches, größter Satz zuerst; fehlt dort das Tile, der nächste), sonst das Zeichen
+ Keine Zeichen als Platzhalter: jede neue Entität kommt direkt als Tile ins Spiel (Ablauf in [Tileset.md](Tileset.md)); das Zeichen bleibt nur Absicherung, falls ein Tile fehlt
+ Das Log zeigt nur, was Ninkasi wahrnimmt: Meldungen mit ihr als Beteiligter (`wer`, `ziel`, `quelle`, `opfer`, `was`, `mit`, `auf`, `traegerin`, `vorher`), Meldungen, bei denen ein beteiligter Bezug mit `ort` oder ein Feld (`ursprung`, `aufschlag`, `bahn`, `felder`) gerade sichtbar ist, und Meldungen ganz ohne Ort (Pegel, Hinweise); `bemerkt` nur, wenn sie das bemerkende Wesen sieht
+ Hören: Lärm, der Ninkasis Feld erreicht (`gesteuerteHoert` an der Meldung `laerm`) und dessen Ursprung sie nicht sieht, schreibt das Log als vage Zeile mit grober Richtung, je nach `geraeusch` Kampflärm, Klirren oder ein Geräusch, höchstens eine Zeile je 100 Zeiteinheiten; wer dort was tut, sagt es nicht
+ Texte zu Zuständen: `log.zustand_beginnt` und `log.zustand_endet` allgemein, ein Zustand kann eigene mitbringen (`log.zustand.<name>.beginnt` bzw. `.endet`); dazu `abgewichen`, `beschworen` (ohne Urheberin `log.erschienen`) und `verschwindet`

## Oberfläche

Daten:

+ Zonen als CSS-Grid (`src/anzeige/stil.css`), Maße als Variablen in `rem` (`--breite-seite`, `--hoehe-log`, `--hoehe-bedienzeile`), Farben als Variablen, getrennt vom Layout; Layout als `data-layout` an `#spiel` (Einstellung `layout`: "a", "b", "kompakt")
+ Elemente: Karte, Seitenleiste (`#seitenkopf`, `#minikarte`, `#seiteninhalt`), Log, Bedienzeile; über der Karte eine noch leere Effektschicht (`#effektschicht`, für die Metaeffekte aus [Animationen.md](Animationen.md)), der Tooltip (`#tooltip`) und die Fenster; der Titel in `#titel`
+ Punktfarben der Minikarte (`PUNKTFARBEN`): Feind rot, Gefährte blau, neutral grau, Ninkasi weiß

Schnittstellen:

+ `Oberflaeche` (`src/anzeige/oberflaeche.js`): Seitenleiste (`kopfHtml` für Tiefe und Zug) und `tooltipHtml` (siehe [Bedienung.md](Bedienung.md), Untersuchen)
+ Pegel (`src/anzeige/pegelanzeige.js`): `promilleText`, `leistenanteil`, `TEILSTRICHE` (0, 0,5, 1, 2, 4, 8, 16 ‰)
+ `Bedienzeile` (`src/anzeige/bedienzeile.js`): links die Nummer der aktiven Leiste und die Schnellleiste (siehe [Bedienung.md](Bedienung.md), Schnellleiste), rechts die Knöpfe aus dem Aktionskatalog (`KNOEPFE`, Text `knopf`)
+ Minikarte und Übersichtskarte (`src/anzeige/minikarte.js`): `minikartenBild` (ohne DOM), `feldgroesseFuer`, `feldAmPunkt`, `zeichnen`
+ `layoutAnwenden` und `einstellungenAnwenden` in `src/main.js` setzen Layout, Größe und Farben (siehe [Bedienung.md](Bedienung.md), Einstellungen)

Regeln:

+ Das Layout folgt [Oberflaeche.md](Oberflaeche.md); die Größe der Oberfläche skaliert über die Schriftgröße, getrennt vom Zoom der Tiles
+ Variante A (Vorgabe): Karte, darunter das Log in zwei Spalten, rechts die Seitenleiste, unten die Bedienzeile; Variante B: links oben die Minikarte so breit wie die Spalte, darunter das Log (Geschehen über Kampf), Karte in der Mitte; `layoutAnwenden` setzt das Canvas der Minikarte dafür um; kompakt siehe [Bedienung.md](Bedienung.md), Einstellungen
+ Seitenleiste: Kopf mit Tiefe und Zug, darunter die Minikarte, dann Ninkasi (LP, MP und PP als Balken, Pegel, freie EP immer, auch 0, Heimlichkeitsweite, laufende Aktion "Schritt 2 von 5", Zustände mit Stärke und Restdauer, Last), Zielen bzw. Untersuchen nur im Zielmodus, Gefährten mit LP, dann "In Sicht": die übrigen Wesen nach Abstand (Schachbrett, dann ID) mit Wachzustand (außer `jagt`), Zuständen und "wirkt etwas" bei einer laufenden Aktion (Vorbild Brogue); Startwert und Version zeigt das Spielmenü
+ Der Pegel ist nach oben offen und wird logarithmisch angezeigt, in Verdopplungsschritten gleicher Breite; eingezeichnet sind Schwellen und das Optimum der LP-Regeneration, daneben steht der genaue Wert (z.B. 2,35 ‰)
+ Bedienzeile: acht Knöpfe in zwei Reihen, je mit Taste und Wort: Gepäck, Fähigkeiten, Charakter, Karte; Rasten, Erkunden, Hilfe, Menü; den Verlauf öffnet Tab oder ein Klick auf das Log; ein Klick wirkt wie die Taste, bei offenem Fenster oder im Zielmodus geht nur Menü (wie Esc); Knöpfe nehmen keinen Fokus
+ Minikarte: je Feld die Farbe des Geländes (Unerkundetes leer, gerade nicht Sichtbares gedämpft) und Punkte für Treppen, Gegenstände und Wesen in Sicht (Ninkasi zuletzt); gezeichnet mit höchstens 3 px je Feld in der Seitenleiste, die Übersichtskarte (Taste m, Fenster `karte`) mit höchstens 10 px und Legende; ein Klick auf eine von beiden reist dorthin (nur über Erkundetes)
+ Hervorheben (Vorbild Brogue): Steht der Zeiger über einem Wesen der Seitenleiste (`data-wesen`), bekommt sein Feld auf der Karte und auf der Minikarte einen Rahmen; das Wesen unter dem Zeiger auf der Karte oder unter dem Cursor beim Untersuchen ist in der Seitenleiste hervorgehoben
+ Fenster über der Karte (Inventar, Fähigkeiten, Charakter und Skills, Verlauf, Spielmenü, Hilfe, später Handel und Brauen) siehe [Bedienung.md](Bedienung.md), Fenster

## Kamera

Daten:

+ Kamera (`src/anzeige/kamera.js`): `{ x, y, gesetzt }`, die linke obere Ecke des Ausschnitts in Feldern; reiner Anzeige-Zustand

Schnittstellen:

+ `neueKamera`, `folgen(kamera, ziel, ansicht, ebene)`

Regeln:

+ Eine Kamera ist immer eingebaut: ist der Ausschnitt größer als das Level, ist das ganze Level sichtbar und steht mittig, sonst scrollt die Karte; Zoomstufen sind nur Kameraeinstellungen
+ Folgen mit Randabstand: die Kamera bewegt sich erst, wenn Ninkasi näher als ein Viertel des Ausschnitts an den Rand kommt; am Levelrand bleibt sie stehen, jenseits des Levels ist nichts zu sehen
+ Feldweises Springen; weiches Scrollen später als reine Anzeige (siehe [Animationen.md](Animationen.md))
+ Vorgesehen, noch nicht umgesetzt: Umschauen (Karte frei verschieben per Maus oder Taste, ein Anzeige-Zustand) und weitere austauschbare, einstellbare Verhaltensweisen (Zentrieren, Springen)

## Log

Daten:

+ Spalten (`SPALTEN` in `src/anzeige/log.js`): `geschehen` (Erzählung, Bemerktes, Gehörtes, Hinweise) und `kampf` (Treffer, Abwehr, Tod anderer, gewirkte Fähigkeiten, angekündigte Angriffe)
+ Zeile (`zeilenAusMeldung` in `src/anzeige/logzeilen.js`, ohne DOM, mit Tests): `{ spalte, art, text, seite?, ton?, magisch?, zahlen? }`; die Art (`ARTEN`) gibt Symbol und Filter (Gefahr ⚠, Angriff ⚔, Krit ✦, abgewehrt ○, Widerstand ◆, Tod ☠, Heilung, Pegel, Fund, Lernen, Geschehen, Hinweis)
+ Zahlenspalten im Kampf (`ZAHLENSPALTEN`): `chance`, `menge`, `krit`, `abzug`, Kopfzeile kurz "%", "DMG", "×", "–"
+ Im Speicherstand die letzten 200 Zeilen (siehe [Architektur.md](Architektur.md), Speichern); im Log höchstens 500 Zeilen

Schnittstellen:

+ `Log` (`src/anzeige/log.js`): `melden` als Hörer der Meldungen (`hoererAnmelden` in `src/main.js`), `zeile` für Hinweise der Oberfläche, `zeilenEinsetzen` beim Fortsetzen; `logzeileHtml`, `logkopfHtml`
+ `seiteVon` (`src/anzeige/logzeilen.js`)

Regeln:

+ In Variante B stehen die Spalten übereinander; je Spalte stehen die neuesten Zeilen unten, wie viele sichtbar sind, entscheidet das Layout
+ Farbe nie allein: jede Art hat ein Symbol
+ Jede Zeile in festen Spalten: Zugmarke (Zugzähler `zuege` Ninkasis, ein Strich trennt ihre Züge), Symbol, Text, im Kampf dazu je eine schmale Spalte für Chance, Schaden, Krit und Abzug (der Tooltip nennt die Bedeutung; leere Zellen bleiben stehen); Abzug fasst Rüstung und Widerstand zusammen, der Tooltip nennt die Aufteilung; gleiche Zeilen hintereinander werden zu "x3" zusammengefasst, ältere werden in vier Stufen blasser
+ Kampf nach Seite und Ton: die Farbfamilie folgt, wer handelt (Ninkasi Grün, Verbündete Blau, Gegner Rot, Neutrale Grau), der Ton dem Ausgang (Treffer, Krit hell und fett, abgewehrt gedämpft); bei Gegnern Gelb für angekündigte Angriffe und Lila für Psi und Magie; ein Tod in der Farbe der Seite, die ihn verursacht hat (ohne Quelle der Seite, der er nützt); Farben als Variablen in `stil.css`, die Palette für Farbenblinde ersetzt Grün und Rot
+ Zahlen im Kampf: Trefferchance (die Logik meldet `trefferchance` an `schaden` und `verfehlt`, in Prozent vor dem Blocken; ohne Trefferwurf `null`), Schaden, Krit-Faktor (`kritfaktor` an `schaden`, sonst `null`), Abzug der Rüstung, Widerstand (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Der Verlauf (Tab) zeigt das ganze Log als Fenster mit Filter nach Spalte oder Art (siehe [Bedienung.md](Bedienung.md), Fenster)

## Tests

+ `tests/oberflaeche.test.js` (Seite, Logzeilen, Log, Anzeige von Menü, Seitenleiste und Bedienzeile, Minikarte), `tests/pegelanzeige.test.js`, `tests/untersuchen.test.js` (Wahrnehmbarkeit der Meldungen), `tests/tilebilder.test.js` und `tests/tiles-ableiten.test.js` (siehe [Tileset.md](Tileset.md))

## Verweise

+ Schema und Stand der Umsetzung der Oberfläche: [Oberflaeche.md](Oberflaeche.md); Effektschicht, Kampfanimation und weiches Scrollen: [Animationen.md](Animationen.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 11 (Oberfläche) und Punkt 12 (Darstellung)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
