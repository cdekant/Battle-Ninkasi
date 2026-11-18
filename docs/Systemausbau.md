# Battle Ninkasi - Systemausbau

Stand: 2026-11-18

Arbeitsliste der Strukturen, die Logik und Datenmodell noch brauchen, damit Fernkampf, Flächenwirkung, Effekte über Zeit, Magie, Psi, Nahkampf und viele Gegner überwiegend als Daten abbildbar sind. Grundlage ist eine Prüfung von Doku und Code mit Stand 0.3.0. Die Begriffe (Wirkungsarten, Effektsystem, Register, Zeitmodell) stehen in [Architektur.md](Architektur.md).

## Arbeitsweise

+ Jeder Punkt wird vor der Umsetzung als Vorschlag ausgearbeitet und freigegeben
+ Ist ein Punkt umgesetzt, wandert seine Beschreibung nach [Architektur.md](Architektur.md) (bzw. [Grundlagen.md](Grundlagen.md), [Charakter.md](Charakter.md)) und wird hier gestrichen; bleibt nur ein Rest offen, steht hier nur der Rest
+ Status je Punkt: offen, in Arbeit, umgesetzt in Version X
+ Die Reihenfolge ist eine Empfehlung: 1 bis 4 sind Kernarchitektur, danach sind die meisten Systeme Daten plus wenige neue Bausteine

## Bekannte Fehler

+ Zurzeit keine; die drei Fehler aus der Prüfung (Tod durch `wert_aendern`, verwaiste Gegenstände, verwaiste Zeitereignisse) sind mit 0.4.0 behoben

## 1. Tod, Haken, Auslöser

Status: umgesetzt in Version 0.4.0, beschrieben in [Architektur.md](Architektur.md) (Ereignisse, Tod und Zustandsprüfung, Auslöser)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Ersatzwirkungen aus Daten (z.B. "Phönixbier verhindert einmal den Tod", "Schild fängt einen Treffer ab"): eigener Typ, der sofort am Haken "davor" wirkt und sich verbrauchen kann; mit den Zuständen (Punkt 3)
+ Auslöser auch an Skills (Punkt 4) und an Ausrüstung und Inventar der Trägerin nach dem Vorbild der Kaskade in Caves of Qud (Punkt 9)
+ Die reservierten Haken des Katalogs in Betrieb nehmen: `zug_beginn`, `zug_ende` (Punkt 3, sobald etwas sie braucht), `vor_angriff` (Punkt 5), `betritt_feld`, `verlaesst_feld` (Punkt 8), `gegenstand_benutzt` (Punkt 9)
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud); erst nötig, wenn mehr als die Beteiligten gefragt werden
+ Erster Auslöser im Spielinhalt (z.B. Säurespritzer des Essigbakteriums beim Tod): Spieldesign, noch nicht entschieden

## 2. Effektkontext, Zielauswahl, verschachtelte Effekte

Status: umgesetzt in Version 0.5.0, beschrieben in [Architektur.md](Architektur.md) (Effektsystem, Auslöser, Zielauswahl)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Befehl `faehigkeit` mit Zielangabe, Zielmodus und Tooltip der Anzeige auf Grundlage von `zielAufloesen` (Punkt 6)
+ Vorschau je Wesen "sicher" oder "vielleicht" getroffen, sobald Trefferwurf und Ausweichen für Flächen gelten (Punkt 5)
+ Wirkung auf die Quelle innerhalb eines Effekts, z.B. Vampirbiss (Schaden am Ziel, Heilung am Angreifer); bisher nur über einen Effekt mit der Quelle als Ziel (Lebensraub-Nova); möglicher Parameter `auf: "quelle"` an den Mengenbausteinen
+ Sichtlinie und Flugbahn für die KI (Punkt 7); nach dem Anspielen prüfen, ob Ersatzlinien oder symmetrischer Schattenwurf für das Sichtfeld nötig sind
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt (Punkt 9), Animation der Meldungen `geschoss` und `flaeche` in der Anzeige

## 3. Zustände

Status: umgesetzt in Version 0.6.0 (Grundgerüst) und 0.7.0 (Verhalten, Beschwörung), beschrieben in [Architektur.md](Architektur.md) (Zustände, Befehle, Wahrnehmung)

Entschieden: Takt ist die Weltuhr; Stapelregel je Zustand, Vorgabe `erneuern`; Verlauf mit drei Namen oder eigener Kurve; handlungsunfähige Ninkasi wartet je Eingabe eine Aktion; Torkeln und Verwirrung über denselben Veränderer, Verwirrung greift auch Freunde an; Beschworene werden der Beschwörerin zugerechnet; Zustände im Spielinhalt erst, wenn der Systemausbau abgeschlossen ist (bis dahin nur in den Tests); seit 0.8.0 kommen ihre Modifikatoren aus der Modifikatorquelle `zustaende`

Offener Rest:

+ Anzeige der Zustände an Ninkasi und an Gegnern (Oberfläche, Log-Texte zu `zustand_beginnt`, `zustand_endet`, `abgewichen`, `beschworen`, `verschwindet`); mit dem großen Punkt Oberfläche
+ Torkeln aus dem Pegel: eine Schwelle des Stoffwechsels setzt einen Zustand (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Wer bei Verwirrung Zauber oder Fernkampf benutzt, trifft womöglich ein anderes Ziel: eigener Veränderer mit dem Befehl `faehigkeit` (Punkt 6)
+ Ob gebundene EP für Tötungen durch Beschworene in den Skill der Beschwörung fließen: Spieldesign in [Charakter.md](Charakter.md)

## 4. Modifikatoren

Status: in Arbeit; umgesetzt in Version 0.8.0 (Register der Modifikatorquellen, Verrechnung, Zustände ohne Nachführen), beschrieben in [Architektur.md](Architektur.md) (Modifikatoren, Zustände)

Entschieden: Verrechnung nach dem Vorbild "increased" und "more" (Prozente addieren, nur `mal` multipliziert, einmal gerundet, `hoechstens` gewinnt gegen `mindestens`); Boni zwischen Quellen multiplizieren nicht automatisch, sondern nur über `mal` in den Daten; Auren ohne Sichtlinie (Option `sichtlinie: true`), `wen` aus Sicht der Trägerin, standardmäßig nicht auf sich selbst; Tags als eigenes Feld am Modifikator

Offen, für Version 0.9.0:

+ Bedingungen am Modifikator `wenn: [{ bedingung, ...parameter }]` über ein Register `modifikatorbedingungen`: `pegel_ab { wert }`, `wert_unter_prozent { wert, prozent }`, `gegenueber_tag { tag }` (Gegenüber über `umstaende.gegenueberId`); Bedingungen lesen nur Rohwerte, ein Schutz meldet Rekursion; Sets aus Gegenständen mit Punkt 9; Pegelschwellen sind damit gewöhnliche Modifikatoren mit `pegel_ab`
+ Tags: `{ ziel: "kosten", tag: "psi", ... }` wirkt nur, wenn die Abfrage den Tag in `umstaende.tags` mitbringt (aus `mittel` und Effektkontext); Tags an Wesen für "nur gegen Bakterien"; Schadensarten als Tags folgen mit Punkt 5
+ Auren: `auren: [{ reichweite, wen: "feinde" | "freunde" | "alle", selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen, Kreis wie in der Zielauswahl, als Modifikatorquelle `auren`; räumlicher Index erst mit Punkt 7, wenn der Bot es zeigt
+ Quellen `ausruestung` (Punkt 9) und `skills` (mit dem Skillsystem)

## 5. Kampfwerte

Status: offen

+ Schadensarten (z.B. stumpf, Säure, Feuer, Alkohol, geistig) als Daten
+ Widerstand, Immunität und Verwundbarkeit je Schadensart über Modifikatoren; wichtigster Hebel für die Vielfalt der Mikroorganismen
+ Verteidigung des Ziels im Trefferwurf (Ausweichen), Rüstung als Abzug im Haken `vor_schaden`
+ Krit als Mechanik (die Anzeige plant Krit-Zahlen schon ein)
+ Marker am Angriff: unblockbar, verfehlt nie, ignoriert Rüstung
+ Mehrere Angriffe je Wesen (Biss und Sporenstoß) und Waffen mit eigenem Angriffsprofil statt einer einzigen Komponente `angriff`

## 6. Fähigkeiten und lange Aktionen

Status: offen

+ Datentyp Fähigkeit für Magie, Psi, Fernkampf und körpereigene Aktionen: Kosten (MP, PP, Pegel, Material, Zeit), Abklingzeit, Voraussetzungen (Skillstufe, Mindestpegel, nüchtern), Zielart (selbst, Einzelziel, Feld, Richtung, Muster), Reichweite, Wirkung, Tags
+ Psi: Risikotabelle (Fehlschlag, Rückschlag, Glimmer) abhängig vom Pegel
+ Magie: Unterhaltskosten je Tick für aufrechterhaltene Zauber, Kanalisieren über mehrere Schritte (Rituale)
+ Befehl mit Ziel: `{ art: "faehigkeit", faehigkeitId, ziel: {x, y} | zielId }`; der Zielmodus ist Anzeige-Zustand
+ Laufende Aktion als Komponente am Akteur, unterbrechbar über die Gefahrenprüfung: Brauen, Ritual, Rasten bis voll, Auto-Erkunden

## 7. Fernkampf, Fraktionen, Wahrnehmung, viele Gegner

Status: offen

+ Sichtlinie und Flugbahn gibt es seit 0.5.0 (`src/welt/geometrie.js`); offen ist, dass Gegner sie benutzen, wenn sie schießen oder Psi wirken
+ Option für Verbündete im Weg einer Flugbahn (darüber hinweg oder vorbei); die Anzeige spielt die Bahn aus der Meldung `geschoss` ab
+ Wurfgegenstände landen auf einem Feld (Flasche werfen: Fernkampf, Fläche und Gegenstand zugleich)
+ Beziehungen der Fraktionen als Daten statt "andere Fraktion ist feindlich": Phagen gegen Bakterien, Kulturhefe gegen wilde Hefe, Händler neutral; Überschreibungen je Wesen gibt es seit 0.7.0 über Zustände (`fraktionVon`)
+ Wahrnehmung je Wesen statt der Vereinfachung des Prototyps: Wachzustand (schläft, wach, jagt), Lärm, Schleichen; siehe Wahrnehmung in [Architektur.md](Architektur.md)
+ Bewegungsarten (unbeweglich, laufend, fliegend, schwebend), Passierbarkeit und Wegfindung je Bewegungsart
+ Verschieben: Rückstoß, Ziehen, Platztausch, Teleport mit Kollisionsregeln
+ Gelegenheitsangriffe und Konter als Reaktionen ohne Zeitkosten
+ Leistung: räumlicher Index im `zwischenspeicher` (aus dem Zustand ableitbar, nicht gespeichert), schnellere Warteschlange, Obergrenze der Population für teilende Mikroorganismen
+ Mehrfeld-Wesen und Bossphasen: offen, ob nötig

## 8. Gelände, Feldschichten, Ebenen

Status: offen

+ Zustand je Feld: Tür offen oder geschlossen, zerstörbare Wand, Hebel, Schalter
+ Was Linien aufhält: bisher enden Linie, Strahl und Flugbahn an undurchsichtigen Feldern, wie die Sichtlinie (`src/welt/geometrie.js`); für Gelände, das durchsichtig, aber nicht passierbar ist (Gitter, Gärröhren aus Glas), eine eigene Eigenschaft im Gelände, ob Geschosse durchfliegen
+ Feldschichten als eigene Gitter im Zustand: Gelände, Oberfläche (Bierpfütze, Säure, Schleim, Myzel, Blut), Gas mit Konzentration; je Schicht ein Handler der Weltuhr für Ausbreitung (Vorbild Brogue)
+ Feuer mit Ausbreitung, Zusammenspiel mit Alkohol (Hochprozentiges als Brandbeschleuniger) und Gas (CO2 im Gärkeller sammelt sich und erstickt)
+ Ereignis beim Betreten eines Felds (Fallen, Oberflächen)
+ Mehrere Ebenen: Treppen, Hub, ob Ebenen erhalten bleiben
+ Populationen nach Tiefe: gewichtete Tabellen, Rudel, Gegner aus tieferen Ebenen, Affixe; bisher feste Zahlen in der Ebene `keller`

## 9. Gegenstände

Status: offen

+ Stapel, Ladungen, Behälter (leere Flasche, Fass)
+ Ausrüstung mit Slots, Befehle `anlegen` und `ablegen`, Modifikatoren mit dem Gegenstand als Quelle (siehe Punkt 4)
+ Gewicht und Tragkraft (Körperlichkeit "Tragen")
+ Haltbarkeit und Verderben (Bier wird sauer), Fluch
+ Unidentifizierte Gegenstände: unbekannte Biere mit Etiketten, Probieren kostet, Sinnlichkeit oder Braukunde erkennt

## 10. Weitere Systeme aus gängigen Roguelikes

Status: offen, jeweils erst Spieldesign in [Grundlagen.md](Grundlagen.md) entscheiden

+ Gunst der Nebengottheiten als Wert mit Geboten und Tabus (Vorbild DCSS)
+ Fallen, Türen, Schlüssel, Hebel, Themenräume (Vorbild Brogue "Machines"); Struktur für Rätsel, die EP bringen
+ Druck gegen endloses Rasten: Nahrungsuhr, Nachrücken oder Verderben; LP regenerieren immer, Pegelabbau und Psi-Schwund allein sind kein Druck
+ Telepathie (Psi-Gedankenlesen als Wahrnehmungsart "Wesen durch Wände") und Unsichtbarkeit
+ Filmriss als Mechanik: Zeitsprung, verlorene Erinnerung an erkundete Felder
+ Untersuchen mit Beschreibung und Gefahreneinschätzung, Vorschau der Trefferchance ohne Spiel-Zufall
+ Todesbericht (Morgue) mit Todesursache und Statistik des Laufs; braucht die Urheberkette aus Punkt 2
+ Speichern als Schnappschuss zusätzlich zum Nachspielen, da lange Läufe sonst langsam laden; Mods gehören in die Prüfsumme der Daten
+ Vorschau durch Simulation auf einer Kopie des Zustands (Vorbild Desktop Dungeons), z.B. "wie viel Schaden macht dieser Angriff"; der Zustand ist JSON, die Kopie also billig
+ Leichen als Hinterlassenschaft: gärende Überreste, Nahrung für Mikroorganismen
