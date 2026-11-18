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
+ Auslöser auch an Zuständen (Punkt 3), Skills (Punkt 4) und an Ausrüstung und Inventar der Trägerin nach dem Vorbild der Kaskade in Caves of Qud (Punkt 9)
+ Die reservierten Haken des Katalogs in Betrieb nehmen: `vor_befehl`, `zug_beginn`, `zug_ende`, `zustand_beginnt`, `zustand_endet` (Punkt 3), `vor_angriff` (Punkt 5), `betritt_feld`, `verlaesst_feld` (Punkt 8), `gegenstand_benutzt` (Punkt 9)
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

Status: offen

+ Liste je Entität: `{ name, quelle, urheberId, beginn, ende, staerke, stapel, verlauf }`, Ende über Zeitereignis
+ Stapelregeln (erneuern, aufaddieren, nur der stärkste) und Verlauf (gleichbleibend, abklingend, ansteigend) wie in [Architektur.md](Architektur.md)
+ Takt für Wirkung über Zeit: Weltuhr oder Zug der Trägerin; offene Entscheidung, sie bestimmt, wie Hast und Verlangsamung auf Schaden über Zeit wirken
+ Handlungsunfähig (Betäubung, Lähmung, Filmriss): Trägerin wird eingereiht, muss aber warten
+ Befehl verändern (Torkeln, Verwirrung) über den Haken `vor_befehl`; Grundlage für "Torkeln, Fehlschläge" des Pegels
+ KI überlagern (Furcht, Psi-Kontrolle, Wut): Stapel von KI-Modulen und Fraktionen, der jüngste gilt, nach Ende kehrt der ursprüngliche Stand zurück
+ Zustände, die an ihre Quelle gebunden sind (aufrechterhaltener Zauber endet mit dem Tod der Wirkenden)

## 4. Modifikatoren

Status: offen

+ Bisher als Liste gespeichert (`entitaet.modifikatoren`); künftig bei Bedarf aus allen Quellen gesammelt: Ausrüstung, Zustände, Skills, Auren in Reichweite, Pegelschwellen, über ein Register der Modifikatorquellen
+ Auren ändern sich mit jedem Schritt und sind nur so sauber abbildbar
+ Verrechnung erweitern: neben `plus` und `prozent` auch `mal` (Vorschlag "zwischen Quellen multiplizieren" in [Charakter.md](Charakter.md)), `setzen`, Mindest- und Höchstwert
+ Bedingungen am Modifikator: ab Pegel X, unter 30 % LP, nur gegen Bakterien, Set aus zwei Kupfer-Items
+ Ziele über Tags, z.B. `kosten.tag:psi`, `schaden.tag:feuer`; Umsetzung des Tag-Systems aus [Charakter.md](Charakter.md)

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
+ Beziehungen der Fraktionen als Daten statt "andere Fraktion ist feindlich": Phagen gegen Bakterien, Kulturhefe gegen wilde Hefe, Händler neutral; Überschreibungen je Wesen (provoziert, kontrolliert)
+ Wahrnehmung je Wesen statt der Vereinfachung des Prototyps: Wachzustand (schläft, wach, jagt), Lärm, Schleichen; siehe Wahrnehmung in [Architektur.md](Architektur.md)
+ Bewegungsarten (unbeweglich, laufend, fliegend, schwebend), Passierbarkeit und Wegfindung je Bewegungsart
+ Verschieben: Rückstoß, Ziehen, Platztausch, Teleport mit Kollisionsregeln
+ Gelegenheitsangriffe und Konter als Reaktionen ohne Zeitkosten
+ Leistung: räumlicher Index im `zwischenspeicher` (aus dem Zustand ableitbar, nicht gespeichert), schnellere Warteschlange, Obergrenze der Population für teilende Mikroorganismen
+ Mehrfeld-Wesen und Bossphasen: offen, ob nötig

## 8. Gelände, Feldschichten, Ebenen

Status: offen

+ Zustand je Feld: Tür offen oder geschlossen, zerstörbare Wand, Hebel, Schalter
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
