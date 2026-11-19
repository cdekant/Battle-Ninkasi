# Battle Ninkasi - Systemausbau

Stand: 2026-11-19

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
+ Auslöser auch an Skills (mit dem Skillsystem) und an Ausrüstung und Inventar der Trägerin nach dem Vorbild der Kaskade in Caves of Qud (Punkt 9)
+ Die reservierten Haken des Katalogs in Betrieb nehmen: `zug_beginn`, `zug_ende` (Punkt 3, sobald etwas sie braucht), `betritt_feld`, `verlaesst_feld` (Punkt 8), `gegenstand_benutzt` (Punkt 9)
+ Index im `zwischenspeicher`, welche Entitäten Auslöser für einen Haken tragen (Vorbild "WantEvent" in Caves of Qud); erst nötig, wenn mehr als die Beteiligten gefragt werden
+ Erster Auslöser im Spielinhalt (z.B. Säurespritzer des Essigbakteriums beim Tod): Spieldesign, noch nicht entschieden

## 2. Effektkontext, Zielauswahl, verschachtelte Effekte

Status: umgesetzt in Version 0.5.0, beschrieben in [Architektur.md](Architektur.md) (Effektsystem, Auslöser, Zielauswahl)

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Zielmodus und Tooltip der Anzeige auf Grundlage von `zielAufloesen` (Oberfläche); den Befehl `faehigkeit` gibt es seit 0.12.0
+ Vorschau je Wesen "sicher" oder "vielleicht" getroffen; seit 0.10.0 liefert `trefferanteil` die Chance ohne Würfeln, offen ist die Anzeige (Punkt 6)
+ Sichtlinie und Flugbahn für die KI (Punkt 7); nach dem Anspielen prüfen, ob Ersatzlinien oder symmetrischer Schattenwurf für das Sichtfeld nötig sind
+ Waffen mit Muster (Rundumschlag, Speer) im Spielinhalt (Punkt 9), Animation der Meldungen `geschoss` und `flaeche` in der Anzeige

## 3. Zustände

Status: umgesetzt in Version 0.6.0 (Grundgerüst) und 0.7.0 (Verhalten, Beschwörung), beschrieben in [Architektur.md](Architektur.md) (Zustände, Befehle, Wahrnehmung)

Entschieden: Takt ist die Weltuhr; Stapelregel je Zustand, Vorgabe `erneuern`; Verlauf mit drei Namen oder eigener Kurve; handlungsunfähige Ninkasi wartet je Eingabe eine Aktion; Torkeln und Verwirrung über denselben Veränderer, Verwirrung greift auch Freunde an; Beschworene werden der Beschwörerin zugerechnet; Zustände im Spielinhalt erst, wenn der Systemausbau abgeschlossen ist (bis dahin nur in den Tests); seit 0.8.0 kommen ihre Modifikatoren aus der Modifikatorquelle `zustaende`

Offener Rest:

+ Anzeige der Zustände an Ninkasi und an Gegnern (Oberfläche, Log-Texte zu `zustand_beginnt`, `zustand_endet`, `abgewichen`, `beschworen`, `verschwindet`); mit dem großen Punkt Oberfläche
+ Torkeln aus dem Pegel: eine Schwelle des Stoffwechsels setzt einen Zustand (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Ob gebundene EP für Tötungen durch Beschworene in den Skill der Beschwörung fließen: Spieldesign in [Charakter.md](Charakter.md)

## 4. Modifikatoren

Status: umgesetzt in Version 0.8.0 (Register der Modifikatorquellen, Verrechnung, Zustände ohne Nachführen) und 0.9.0 (Bedingungen, Tags, Auren), beschrieben in [Architektur.md](Architektur.md) (Modifikatoren, Zustände)

Entschieden: Verrechnung nach dem Vorbild "increased" und "more" (Prozente addieren, nur `mal` multipliziert, einmal gerundet, `hoechstens` gewinnt gegen `mindestens`); Boni zwischen Quellen multiplizieren nicht automatisch, sondern nur über `mal` in den Daten; Auren ohne Sichtlinie (Option `sichtlinie: true`), `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl, standardmäßig nicht auf sich selbst; Tags als eigenes Feld am Modifikator

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Modifikatorquellen `ausruestung` (Punkt 9) und `skills` (mit dem Skillsystem in [Charakter.md](Charakter.md))
+ Bedingung für Sets aus Gegenständen, z.B. zwei Kupfer-Items (Punkt 9)
+ Tags in weiteren Abfragen: Schadensarten und Widerstände seit 0.10.0, Verbrauch, Zeit und Abklingzeit der Fähigkeiten seit 0.12.0
+ Räumlicher Index für die Suche nach Auren (Punkt 7); seit 0.9.0 braucht der Bot etwa ein Viertel länger
+ Anzeige der Aufschlüsselung (`modifikatorenAufgeschluesselt`) in der Oberfläche

## 5. Kampfwerte

Status: umgesetzt in Version 0.10.0 (Schadensarten, Widerstand, Immunität, Rüstung, Ausweichen, Willenskraft, Blocken, Krit, Marker, Baustein `trefferwurf`) und 0.11.0 (Angriffsprofile mit Zeitkosten, `vor_angriff`), beschrieben in [Architektur.md](Architektur.md) (Kampfwerte)

Entschieden: Kampfwerte sind Punkte, die über einen Halbwert zu Anteilen werden, die sich 100 % nur annähern (Trefferchance, Blocken, Kritchance, Widerstand); Trefferchance als Verhältnis von Genauigkeit zu Verteidigung plus Grundverteidigung, ohne harte Grenzen; Rüstung als fester Abzug mit Mindestschaden 1; Verwundbarkeit nähert sich dem doppelten Schaden; Immunität als eigener Sonderfall; Kritfaktor x1,5 als Regelwert, nach oben offen; `art` am Baustein `schaden` ist Pflicht; mehrere Angriffe laufen in einer Aktion nacheinander, die Aktion kostet so viel wie ihr langsamstes Profil; Durchschaubarkeit kommt aus der Anzeige der errechneten Prozentzahl, nicht aus der Formel

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Angekündigte Angriffe: ein Wesen wählt aus seinem Portfolio einen Angriff, setzt sich einen Zustand "holt aus" mit Meldung im Log und führt ihn aus, wenn es wieder dran ist; wer das Log liest, kann ausweichen (Vorbild Brogue, DCSS); braucht die Auswahl der KI und Fähigkeiten mit Ziel (Punkte 6 und 7)
+ Abzug der Rüstung auf das Ausweichen in den Daten der Rüstung, später womöglich über das Gewicht (Punkt 9)
+ Waffen bringen ihr Angriffsprofil über `angriffeVon` ein und ersetzen oder ergänzen die Faust; zwei Waffen sind zwei Profile (Punkt 9)
+ Ersatzwirkungen (Rest aus Punkt 1) achten den Marker `unblockbar`
+ Anzeige: schwebende Krit-Zahlen, Trefferchance in Tooltip und Untersuchen; mit dem großen Punkt Oberfläche
+ Zuordnung der Eigenschaften zu Kampfwerten (Gewandtheit zu Ausweichen, Trinkfestigkeit zu Widerstand gegen Gift): Skillsystem in [Charakter.md](Charakter.md)

## 6. Fähigkeiten und lange Aktionen

Status: umgesetzt in Version 0.12.0 (Datentyp Fähigkeit, Befehl `faehigkeit`, Verbrauch, Material, Abklingzeit, Voraussetzungen, Risikotabellen, aufrechterhaltene Zauber mit Unterhalt, dazu `auf: "quelle"` und der Veränderer `ziel_verfehlen`) und 0.13.0 (lange Aktionen mit Unterbrechung und `fortsetzen`, Rasten und Auto-Erkunden in der Eingabe), beschrieben in [Architektur.md](Architektur.md) (Fähigkeiten, Lange Aktionen, Zustände, Maus, Reise, Rasten und Erkunden)

Entschieden: Modifikatorziele `verbrauch.<wert>` für Vorräte, `kosten.*` bleibt die Zeit; Abklingzeit in eigenen Zügen der Wirkenden (schneller Handelnde haben Fähigkeiten in Weltzeit früher zurück); Psi-Risiko als Mechanismus mit vorläufigen Zahlen, die Folgen von Rückschlag und Glimmer sind Spieldesign; Rituale und Brauen laufen in der Logik, Rasten und Auto-Erkunden in der Eingabe wie die Reise; beim Abbruch einer langen Aktion sind die Kosten verloren, `beimAbbruch` wirkt; die Gründe zur Unterbrechung stehen in den Regeln, weil sie das Nachspielen bestimmen

Offener Rest, wird mit den genannten Punkten umgesetzt:

+ Zielmodus und Tooltip der Anzeige auf Grundlage von `zielAufloesen`, Belegung für Fähigkeiten, Anzeige einer laufenden Aktion (Fortschritt); mit dem großen Punkt Oberfläche
+ Gegner benutzen Fähigkeiten (Auswahl in der KI), kündigen Angriffe an und lassen sich bei langen Aktionen durch Schaden unterbrechen (Punkt 7)
+ Brauen als eigene Art langer Aktion (Register `laufendeaktionen`), sobald das Brausystem entworfen ist ([Grundlagen.md](Grundlagen.md))
+ Folgen von Rückschlag und Glimmer (Spieldesign in [Grundlagen.md](Grundlagen.md))
+ Passive Fähigkeiten sind Modifikatoren und Auslöser aus Skills und Ausrüstung (Modifikatorquellen `skills`, `ausruestung`)

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
