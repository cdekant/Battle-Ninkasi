# Battle Ninkasi - Ausblick

Stand: 2026-11-23

Mitprüfen bei Änderungen: [Dokumentation.md](Dokumentation.md), [Grundlagen.md](Grundlagen.md), [Architektur.md](Architektur.md), [Systemausbau.md](Systemausbau.md), [Wesen.md](Wesen.md), [Welt.md](Welt.md), [Charakter.md](Charakter.md)

Ideen für Mechaniken, über die noch nicht entschieden ist, mit dem, was sie dem Kern abverlangen. Zweck: früh erkennen, wo heutiger Code einer Idee den Weg verbaut, und dort rechtzeitig vorbauen, statt später schwer umzubauen.

Abgrenzung: [Systemausbau.md](Systemausbau.md) ist die Arbeitsliste beschlossener Arbeit, [Grundlagen.md](Grundlagen.md), Offen sammelt Fragen des Spieldesigns (Raten, Schwellen, Inhalte). Hier stehen Ideen samt ihren Folgen für die Struktur. Wird eine Idee beschlossen oder verworfen, wandert ihr Spieldesign in das Design-Dokument und ihre Arbeit als Punkt in die Arbeitsliste; hier wird sie gestrichen. Wie es zu einer Entscheidung kam, steht in der Git-Historie. Die Form eines Eintrags regelt [Dokumentation.md](Dokumentation.md), Arten der Dokumente.

## Übersicht

| Idee | Wichtigkeit | Umbaurisiko | Vorkehrung nötig |
|---|---|---|---|
| Steuerung anderer Wesen | mittel, offen | gering | erledigt (Lesefunktion) |
| Schatzräume mit Schlüssel | hoch | gering (Plan des Laufs steht) | erledigt (Plan des Laufs) |
| Fraktionen: Ruf und Beistand | hoch | gering | erledigt (Ruf und Beistand) |
| Vorschau durch Simulation | hoch | mittel | erledigt (Würfe über eine Schnittstelle) |
| Hellsicht, Spüren, Unsichtbarkeit | hoch | mittel | teils erledigt (Erinnerung, Kartieren), offen: Art der Wahrnehmung |
| Zeitumkehr | hoch | mittel | ja |
| Verwandlung | mittel | mittel | erledigt (Lesefunktionen) |
| Veränderbares Gelände | hoch | mittel | erledigt (Erinnerung der Karte) |
| Flüssigkeiten und Gase | ungeklärt | gering, Mischen mittel | ja (über das Mischen entscheiden) |
| Begleiter und Befehle | hoch | gering bis mittel | teils erledigt (Treppen, Vorrang an der KI), offen: Befehl und Begleiter |
| Handel, Währung, Gespräch | hoch | gering bis mittel | ja (Befehle) |
| Bestiarium, Glossar, Rezeptbuch | hoch | gering | erledigt (Regel für Wissen über Läufe) |
| Erfolge | hoch | gering | nein |
| Ausrüstung und Effekte am Tile | hoch | gering | ja (Daten fürs Aussehen) |
| Wurfweite nach Skill und Gewicht | ungeklärt | gering | nein |
| Krankheiten | ungeklärt | gering | nein |
| Questsystem | hoch | gering bis mittel | teils erledigt (Plan des Laufs), offen: Ziele über Haken |
| Feste Strukturen | ungeklärt | gering bis mittel | erledigt (Erzeugung in Schritten) |
| Nachrückende Gegner | ungeklärt | gering | nein |
| Themenräume und Rätsel | mittel | gering bis mittel | erledigt (Erzeugung in Schritten) |
| Todesbericht | hoch | gering | nein |
| Schutz der Ablagen | ungeklärt | gering | teils erledigt (stabile Namen, Format der Chronik), Kandidaten in der Arbeitsliste |
| Druck gegen endloses Rasten | ungeklärt | gering | nein |
| Gunst der Nebengottheiten | ungeklärt | gering | nein |
| Filmriss | ungeklärt | gering | erledigt (Erinnerung der Karte) |
| EP für Erkundung | ungeklärt | gering | erledigt (gesehen getrennt von bekannt) |
| Mechaniken aus Pen-and-Paper | teils | gering | nein |

Umsetzung: keine

## Steuerung anderer Wesen

+ Wichtigkeit: mittel, "schon interessant" (2026-11-22); mindestens Begleiter mit Befehlen (eigener Abschnitt)
+ Vorbilder: Caves of Qud, Domination: Ninkasi übernimmt den Körper eines Nachbarn, ihr eigener bleibt reglos liegen; ein Treffer kann die Übernahme brechen, Tötungen bringen in dieser Zeit keine EP, ein misslungener Versuch erzürnt Neutrale; im Extremfall bleibt man dauerhaft im fremden Körper
+ Braucht: zwei getrennte Begriffe, wo heute einer steht: wer Befehle über die Eingangstür bekommt, wessen Sicht gilt und wem Kamera und Zielmodus folgen (die gesteuerte Entität), und wessen Tod den Lauf beendet, wer lernt und wer weiß (Ninkasi)
+ Berührt: `gesteuerteEntitaet` und `spielerin` (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); den umgekehrten Fall, dass Ninkasi eine KI bekommt (Furcht, Rausch, Psi-Kontrolle), gibt es schon in `src/kern/spiel.js`
+ Umbaurisiko: gering
+ Vorkehrung (leichte Fassung, erledigt, siehe [Architektur.md](Architektur.md), Entitäten und Komponenten): nur die Lesefunktion `gesteuerteEntitaet(zustand)`, die vorerst Ninkasi liefert; kommt Besessenheit, ändert sich nur diese Funktion
+ Abgrenzung: [Grundlagen.md](Grundlagen.md), Spiel sagt "Gesteuert wird nur Ninkasi" (Begleiter nehmen nur Vorrangbefehle an); Besessenheit wäre eine ausdrückliche Ausnahme davon und ist noch nicht entschieden

Umsetzung: offen (nur die Vorkehrung steht)

## Begleiter und Befehle

+ Wichtigkeit: hoch, mindestens Begleiter mit Befehlen (2026-11-22)
+ Vorbilder: Dungeon Crawl Stone Soup (Rufe an Verbündete: folgen, warten, angreifen); Caves of Qud (Begleiter kämpfen auf Anweisung angriffslustig oder nur zur Verteidigung, eigene Taste für Begleiter, Wesen werden durch Überreden zu Begleitern); Brogue (befreite Gefangene werden Verbündete und lernen Fähigkeiten besiegter Gegner); Ancardia (warten, folgen, gehen, angreifen; ein wartender Begleiter versperrt ein Nest)
+ Braucht: Befehlsart `befehlen { zielId, anweisung }`, die nur die Anweisung am Begleiter setzt (die Eingangstür bleibt bei Ninkasi); KI-Modul `begleiten`, das die Anweisung liest; Mitnehmen über Treppen; Begleiter in der Seitenleiste und im Untersuchen
+ Berührt: Ebenenwechsel (über das Register `mitnehmen`, siehe [Welt.md](Welt.md), Ebenen), Fraktionen (Begleiter gehören zur Fraktion `ninkasi`), Lernen (Zurechnung wie bei Beschworenen mit `beschworenVon`), Tod, Bot
+ Umbaurisiko: gering bis mittel, das Mittlere wegen der Treppen
+ Vorkehrung (erledigt, siehe [Welt.md](Welt.md), Ebenen): was beim Ebenenwechsel mitkommt, sammelt das Register `mitnehmen`; Begleiter melden dort einen eigenen Eintrag an
+ Vorkehrung für die Vorrangbefehle (erledigt, siehe [Wesen.md](Wesen.md), KI): `ki.vorrang` mit `angreifen`, `warten`, `folgen` und `bis`, die KI liest es; offen sind der Befehl `befehlen`, Taste und Anzeige, sie kommen mit den Begleitern
+ Entschieden: Begleiter handeln nach ihrer eigenen KI und nehmen Vorrangbefehle an, siehe [Grundlagen.md](Grundlagen.md), Spiel

Umsetzung: offen

## Verwandlung

+ Wichtigkeit: mittel, "interessant" (2026-11-22)
+ Vorbilder: Dungeon Crawl Stone Soup (Gestalten wie Statue oder Drache: Ausrüstung auf Plätzen, die die Gestalt nicht hat, verschmilzt und wirkt nicht, die Gestalt ändert Tempo und Angriffe); NetHack (Polymorph, Rüstung kann dabei zerreißen); Caves of Qud (Mutationen); Dungeon Crawl Classics (Korruption: Magie verändert den Körper dauerhaft)
+ Braucht: einen Zustand "Gestalt", der Komponenten überlagert statt sie zu ersetzen: Angriffe, Plätze, Bewegungsart, Sicht, Türen öffnen, Zeichen und Tile; Zahlenwerte gehen schon über Modifikatoren
+ Berührt: Systeme, die Komponenten ohne Zahl direkt aus der Entität lesen (`angriffe`, `plaetze`, `bewegung`, `tueren`, `sicht`); Ausrüstung (was mit angelegten Dingen auf fehlenden Plätzen geschieht); Anzeige
+ Umbaurisiko: mittel
+ Vorkehrung (erledigt, siehe [Architektur.md](Architektur.md), Entitäten und Komponenten): Komponenten ohne Zahl über Lesefunktionen mit Überlagerung durch Zustände, auch das Aussehen für Zeichen und Tile; ein Test wacht über direkte Zugriffe. Offen für die Gestalt selbst: die Felder an Zuständen zulassen, was mit angelegten Dingen auf fehlenden Plätzen geschieht und wie Waffen und Angriffe der Gestalt zusammenspielen (`angriffeVon` ist die einzige Stelle)

Umsetzung: offen

## Handel, Währung, Gespräch

+ Wichtigkeit: hoch, "auf jeden Fall" (2026-11-22)
+ Vorbilder: Caves of Qud (Währung ist Wasser in Dram, es braucht Behälter und wiegt, Händler geben Wechselgeld in Wasser; Wasserritual als Hebel für den Ruf bei Fraktionen; Gespräche als Baum in Daten aus Knoten und Wahlen mit Ziel); Old-School-Regelwerke (Reaktionswurf mit 2W6 bei jeder Begegnung: feindlich, neutral, freundlich; Moral als eigener Wurf); Dungeon Crawl Stone Soup (Läden)
+ Braucht: Wert an Gegenständen; Fensterarten Handel und Gespräch; Befehlsarten `handeln { mitId, geben, nehmen }` und `sprechen { mitId, wahl }`, damit Handel und Gespräch wiederholbar bleiben; Gespräche als Daten (Knoten, Wahl, Bedingung, Wirkung als Effekt; eine Wirkung kann den Ruf ändern, siehe Fraktionen: Ruf und Beistand)
+ Berührt: Fraktionen, Inventar, Texte und Grammatik, Hub (Dienste)
+ Umbaurisiko: gering bis mittel
+ Vorkehrung: Fenster für Handel und Gespräch nur über Befehle, nie direkt am Zustand (gilt als Prinzip ohnehin); offen ist die Währung (Gold, Alkohol, Tausch; Idee: Bier oder Pfandflaschen, die schon Gewicht haben)

Umsetzung: offen

## Veränderbares Gelände

+ Wichtigkeit: hoch, zerstörbar und veränderbar (2026-11-22)
+ Vorbilder: Brogue (Gras brennt, Brücken stürzen ein, Gelände reagiert in Ketten); Cogmind (fast alles ist zerstörbar, man bahnt sich Wege durch Wände); Brigador Killers (ganz zerstörbare Ebenen machen klassische Sperren wie verschlossene Türen wirkungslos); Noita (Stoffe reagieren miteinander)
+ Vorhanden: `gelaendeSetzen`, `zerstoerbar`, Feuer mit `verbrenntZu` (siehe [Welt.md](Welt.md), Gelände)
+ Braucht: Graben und Bauen (z.B. einen Kessel aufstellen) als Befehle; Wachstum (Schimmel, Hefe) als System am Welttick; Kosten je Gelände in der Wegfindung (dort schon als "später" vermerkt)
+ Berührt: Rätsel und Themenräume, die auf Sperren bauen; die Anzeige zeigt außer Sicht das Erinnerte, eine außer Sicht eingestürzte Wand verrät sich nicht mehr
+ Umbaurisiko: mittel
+ Vorkehrung (erledigt, siehe [Welt.md](Welt.md), Sicht und Erinnerung): eine Erinnerung je Feld (zuletzt gesehenes Gelände, dazu Oberfläche, Gegenstände und Fallen als Aussehen) neben `erkundet`, die Anzeige, Untersuchen und die Wege der Abläufe für nicht sichtbare Felder lesen

Umsetzung: offen

## Flüssigkeiten und Gase

+ Wichtigkeit: ungeklärt, Frage gestellt am 2026-11-23: tiefes Wasser, Verteilen und Verdunsten; tiefes Wasser zieht mit einer Chance in eine Richtung, ein Skill Schwimmen hilft
+ Vorbilder (aus der Erinnerung, nicht nachgeprüft): Brogue (tiefes Wasser als Gelände: wer schwimmt, verliert mit einer Chance nicht angelegte Gegenstände, die abtreiben; flaches Wasser dämpft; Gas verteilt sich und verfliegt); Dungeon Crawl Stone Soup (tiefes Wasser nur für Schwimmer und Flieger, schwere Rüstung zieht hinunter); Caves of Qud (Flüssigkeiten mischen sich in Pfützen und Gefäßen, jede Mischung hat eigene Wirkung, Tiefe von Pfütze bis See, Wasser als Währung); Noita (Stoffe fließen, verdampfen und reagieren miteinander)
+ Vorhanden: Flüssigkeiten sind Oberfläche mit Menge und Schwund (Verdunsten ohne Rückstand), je Feld eine Art, die neue verdrängt die alte; Gas mit Ausgleich zu den Nachbarn und Abbau; Gelände mit `passierbarFuer` für Wasser und Abgrund; Last aus dem Gewicht; Stoßen und Versetzen (siehe [Welt.md](Welt.md), Feldschichten und [Wesen.md](Wesen.md), Bewegung); im Inhalt gibt es noch kein Wasser
+ Braucht, je nach Entscheidung:
  + Tiefe: Stufen der Menge (Pfütze, flach, tief) oder tiefes Wasser als Gelände; tief heißt schwimmen, mit Folgen nach der Last (abtreiben, untergehen, Ertrinken als Zustand)
  + Strömung: eine Richtung je Feld (am Gelände oder als Schicht), die mit einer Chance versetzt (`versetzen` mit eigener Art); Schwimmen als Skill senkt die Chance über ein Modifikatorziel
  + Fließen: Oberfläche verteilt sich wie Gas zu den Nachbarn, aber erst über einer Schwelle und langsamer, nach unten (Abgrund, Senke) zuerst
  + Verdunsten zu Gas: Hochprozentiges wird zu brennbarem Dampf, Gärendes zu CO2 (eine Angabe an der Oberfläche, welches Gas mit welchem Anteil entsteht)
  + Mischen: mehrere Flüssigkeiten auf einem Feld und in Gefäßen, mit Regeln für Mischungen (Bier und Wasser, Würze und Hefe); berührt das Brausystem unmittelbar
  + Schwere des Gases: CO2 sinkt und sammelt sich in Senken, ohne echte Höhe über eine Angabe am Gelände
+ Berührt: das Format der Feldschichten (`{ art, menge }` je Feld), Wegfindung (Kosten statt nur Meiden), Ebenenerzeugung (Seen, Bäche), Brausystem, Inventar (Gefäße, Last), Licht (brennender Alkohol), Leistung (Fließen am Welttick)
+ Umbaurisiko: gering für Tiefe, Strömung, Fließen, Verdunsten und Schwere (Register `welttick`, Haken `betritt_feld`, Daten der Schichten); mittel für das Mischen, weil dann ein Feld mehrere Arten trägt und sich das Format der Feldschichten ändert
+ Vorkehrung: vor dem Inhalt entscheiden, ob Flüssigkeiten sich mischen sollen (siehe [Systemausbau.md](Systemausbau.md), Punkt 10); bis dahin keine Daten anlegen, die auf genau einer Art je Feld bestehen

Umsetzung: offen

## Zeitumkehr

+ Wichtigkeit: hoch, Zeitumkehr um einige Runden "sehr interessant" (2026-11-22)
+ Vorbilder: Caves of Qud, Präkognition (eine Vision beginnen und beenden; stirbt man darin, geht es zurück an den Anfang; Zufälliges kann dabei neu ausfallen); Into the Breach (Rückgängig bis zum Festlegen, dazu ein Zurücksetzen der ganzen Runde je Kampf; alles ist vorhersehbar, darum zählt nur anderes Handeln); Blades in the Dark (Rückblende: man legt nachträglich fest, was man vorbereitet hatte, und bezahlt mit Stress)
+ Braucht: Haltepunkte, also Kopien des Zustands vor den letzten N Zügen (der Schnappschuss existiert, siehe [Architektur.md](Architektur.md), Speichern); die Umkehr ist selbst ein Befehl, beim Nachspielen entstehen dieselben Haltepunkte von selbst
+ Entscheidungen für das Spieldesign: Was bleibt nach der Umkehr erhalten (Wissen über die Karte und Gegenstände, bezahlte Kosten, Pegel)? Fällt der Zufall neu aus? Mit dem alten Zufallszustand fällt jeder Wurf gleich, die Umkehr lohnt dann nur für anderes Handeln wie in Into the Breach; zum Neuwürfeln muss der Zufall nach der Umkehr weiterlaufen
+ Berührt: Speichern (fehlen die Haltepunkte nach dem Laden aus einem Schnappschuss, oder gehören sie hinein?), Log und Chronik (Meldungen aus der verworfenen Zeit), Lernen (EP aus der verworfenen Zeit)
+ Umbaurisiko: mittel
+ Vorkehrung: weiter alles außerhalb des Zustands ableitbar halten (räumlicher Index, Zwischenspeicher), dann ist eine Kopie vollständig; nichts Laufbezogenes in die Chronik schreiben, bevor der Lauf endet

Umsetzung: offen

## Hellsicht, Spüren, Unsichtbarkeit

+ Wichtigkeit: hoch, durch Wände sehen, Schätze und Gegner spüren "sehr interessant" (2026-11-22)
+ Vorbilder: Rogue und NetHack (Rolle der Kartierung zeigt die ganze Karte ohne Gegenstände; Erkennen von Wesen, von Magie); Brogue (Telepathie zeigt Wesen durch Wände, Kartierung; Brogue CE beschreibt magisch erkannte Felder als "erinnert"); gBrogue (ein geworfener Telepathietrank knüpft ein dauerhaftes Band zu einem Wesen); Caves of Qud (Hellsicht zeigt ein fernes Gebiet für einige Runden, ab hoher Stufe die ganze Karte; manches bleibt ohne Sichtlinie unsichtbar)
+ Braucht: Arten der Wahrnehmung neben dem Sehen: gesehen, gespürt (Ort bekannt, Art vielleicht nicht), kartiert (Gelände bekannt, nie gesehen); Unsichtbarkeit als Gegenstück; Anzeige je Art (z.B. Umriss für Gespürtes)
+ Berührt: `sieht` in `src/systeme/sicht.js` (für Ninkasi heißt Sehen heute "im Sichtfeld"), der Filter des Logs (`src/systeme/wahrnehmbar.js`), der Renderer, die Wegfindung mit `nurBekannt`, EP für Erkundung (ein kartiertes Feld zählt erst beim Sehen, siehe EP für Erkundung)
+ Umbaurisiko: mittel
+ Vorkehrung: eine Abfrage "wie nimmt Ninkasi dieses Ziel wahr" (Art statt ja oder nein), die neue Systeme statt `istSichtbar` fragen (beschlossen, siehe [Systemausbau.md](Systemausbau.md), Punkt 3); kartiert neben gesehen ist erledigt über die Erinnerung (`kartieren`, auf Wunsch mit Schätzen, siehe [Welt.md](Welt.md), Sicht und Erinnerung); Gegner erinnert die Karte nie, sie brauchen das Spüren

Umsetzung: offen

## Vorschau durch Simulation

+ Wichtigkeit: hoch, "auf jeden Fall" (2026-11-22)
+ Vorbilder: Desktop Dungeons (Ausgang eines Angriffs vorher sehen); Into the Breach (die Vorschau stimmt immer, weil es keinen eigenen Code für die Vorhersage gibt, nur einen Lauf auf einer Kopie des Bretts)
+ Vorhanden: Trefferchance im Zielmodus, nur wenn die Wirkung unmittelbar mit einem Trefferwurf beginnt (`src/systeme/vorschau.js`)
+ Braucht: einen Lauf der Wirkung auf einer Kopie des Zustands
+ Berührt: den Zufall: eine Kopie mit demselben Zufallszustand würfelt genau das, was gleich wirklich geschieht; die Vorschau verriete die Zukunft (eine ungewollte Hellsicht)
+ Umbaurisiko: mittel
+ Vorkehrung (erledigt, siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit): alle Würfe im Spiel laufen über eine Schnittstelle mit benannten Würfen, die eine Simulation gegen "kleinster Wurf", "größter Wurf" mit festgelegten Chancen oder einen fremden Zufall tauschen kann; die Vorschau zeigt dann Spannen statt eines Ergebnisses
+ Offen: die Simulation selbst, eine Kopie des Spiels samt Laufzeitdaten (Raumindex, Vormerkungen, Zwischenspeicher), auf der eine Wirkung läuft, ohne zu melden

Umsetzung: offen

## Themenräume und Rätsel

+ Wichtigkeit: mittel (Struktur für Rätsel, die EP bringen)
+ Vorbilder: Brogue (Machines: Räume aus Bausteinen mit Hebeln, Schlüsseln, Käfigen, Fallen; ein Schlüssel öffnet einen Altarraum anderswo auf der Ebene)
+ Braucht: Ebenenerzeugung in Schritten aus Daten (Räume einsetzen, Bezüge zwischen Feldern wie Hebel und Tor); Hebel mit Wirkung in der Ferne, verschlossene Türen mit Schlüssel; Lernanlass "Rätsel gelöst"
+ Berührt: die Ebenenerzeugung (in Schritten mit Register, siehe [Welt.md](Welt.md), Ebenen), veränderbares Gelände (zerstörbare Wände umgehen Sperren)
+ Umbaurisiko: gering bis mittel; ein Themenraum ist ein neuer Ebenenschritt, Bezüge zwischen Feldern wie Hebel und Tor fehlen noch
+ Vorkehrung: erledigt (Erzeugung in Schritten mit Register)

Umsetzung: offen

## Feste Strukturen

+ Wichtigkeit: ungeklärt, gewünscht (2026-11-22): feste Bauwerke mit Grundmuster in den zufälligen Ebenen, z.B. Sudhäuser
+ Vorbilder: Minecraft (Bauwerke aus Vorlagen: ein Startstück aus einem gewichteten Pool, Anschlusspunkte im Stück nennen den Pool für das nächste Stück, so wächst ein Dorf aus Häusern und Wegen; ein Ersatzpool schließt eine Kette sauber ab); Dungeon Crawl Stone Soup (Vaults als Text in `.des`-Dateien: Karte aus Zeichen, Zeichen als Platzhalter für Gegner, Gegenstände und Gelände aus Tabellen, Ersetzungen mit Zufall, Tiefe als Bedingung, frei platziert oder als ganze Ebene, Rand als Pflicht); Brogue (Machines, siehe Themenräume)
+ Vorhanden: feste Karten als Zeilen aus Kennungen, bisher nur für eine ganze Ebene (der Hub in `daten/ebenen.js`, Schritt `karte_fest`); jede Ebene entsteht in Schritten aus einem Register samt Prüfung der Erreichbarkeit und neuem Versuch (siehe [Welt.md](Welt.md), Ebenen)
+ Braucht: Strukturen als Daten im selben Format wie der Hub, dazu eine Legende für Platzhalter (Gegner aus einer Tabelle, Gegenstand, Falle, Gelände mit Zufall); Bedingungen (Tiefe, Ebenenart, höchstens einmal je Lauf) und Gewichte; einen Schritt der Erzeugung, der eine Struktur in die fertige Karte stempelt (Platz suchen, drehen oder spiegeln, Eingänge an Gänge anbinden), danach eine Prüfung, dass alles Begehbare erreichbar bleibt, sonst ein neuer Versuch mit abgeleitetem Zufall; später zusammengesetzte Strukturen aus Teilen nach Minecraft (Sudhalle, Lager, Gärkeller)
+ Berührt: `src/welt/ebene.js`, Themenräume (eine Struktur kann einen Themenraum enthalten), Schatzräume und Questsystem (der Plan des Laufs legt fest, welche Tiefe welche Struktur bekommt), Population (in Strukturen eigene Regeln), Nachrückende Gegner (nicht in Strukturen), veränderbares Gelände (geschützte Wände)
+ Umbaurisiko: gering bis mittel, auf die Ebenenerzeugung beschränkt; eine Struktur ist ein neuer Ebenenschritt zwischen Karte und `erreichbarkeit`
+ Vorkehrung: erledigt (Erzeugung in Schritten mit Register, Erreichbarkeit mit neuem Versuch); weiter gilt: das Kartenformat des Hubs als gemeinsames Format für Strukturen behalten

Umsetzung: offen

## Todesbericht

+ Wichtigkeit: hoch, "auf jeden Fall" (2026-11-22)
+ Vorbilder: Dungeon Crawl Stone Soup (Morgue-Datei als Text: Zusammenfassung, Werte, Inventar, Skills, Zauber, letzte Meldungen, Karte, getötete Gegner, wahlweise Züge und Tötungen je Ort); Cogmind (ausführliche Morgue mit Karte)
+ Braucht: Todesursache mit Urheberkette, Statistik des Laufs, Fensterart oder Datei zum Speichern
+ Idee: der Lauf ist wiederholbar, der Bericht lässt sich also nachträglich durch Nachspielen mit Hörern auf die Meldungen erzeugen; während des Spiels muss nichts mitgezählt werden
+ Berührt: Chronik und Fenster nach dem Tod ([Titelbildschirm.md](Titelbildschirm.md))
+ Umbaurisiko: gering
+ Vorkehrung: keine, solange Meldungen Urheber und Ort tragen

Umsetzung: offen

## Schutz der Ablagen

+ Wichtigkeit: ungeklärt; die Arbeit steht in [Systemausbau.md](Systemausbau.md), Punkt 11
+ Inhalt: was außerhalb eines Laufs liegt (Chronik, Einstellungen, Belegung, später Vorwissen und Mods), soll Änderungen an Code und Daten überstehen; erledigt: stabile Namen mit Namensbuch und Umbenennungen, Migrationen der Chronik, Belegung ohne unbekannte Aktionen
+ Kandidaten: Namensräume für Mods in den Registern (Vorsatz `<mod>.`, Fehler bei doppelter Anmeldung), erst mit dem ersten Mod; ein Katalog der Wächtertests (Ablage, Komponenten, gesteuerte Entität, Würfe, Namensbuch) an einer Stelle; Migrationen auch für Einstellungen und Belegung, sobald sich ihr Format zum ersten Mal ändert; Fix-Versionen mit gleicher Prüfsumme der Daten behalten ihre Plätze (dann ist die Prüfsumme der eigentliche Schutz); eine Prüfsumme des Codes (bisher leistet das die Version); Freischaltungen gegen das Namensbuch prüfen (ein Zähler `besiegt.<typ>` mit unbekanntem Typ)
+ Umbaurisiko: gering
+ Vorkehrung: keine

Umsetzung: teilweise, siehe [Architektur.md](Architektur.md), Speichern; offen: die Kandidaten

## Druck gegen endloses Rasten

+ Wichtigkeit: ungeklärt
+ Vorbilder: Dungeon Crawl Stone Soup (Nahrung galt als schlecht gemachte Uhr und wurde durch die Zot-Uhr ersetzt: sehr locker, sie trifft nur grobes Trödeln, dann schnell); Cogmind (Alarmstufe ruft Trupps, Vernichtungstrupps kommen nach Zeit); Torchbearer (alle vier Runden ein Zustand in fester Folge: hungrig, erschöpft, wütend, krank, verletzt, verängstigt); Blades in the Dark (sichtbare Uhren mit Segmenten für drohendes Unheil)
+ Vorhanden: Bier verdirbt; LP regenerieren immer, Pegelabbau und Psi-Schwund allein sind kein Druck
+ Braucht: Zeit je Ebene im Zustand; Nachrücken der Population verlassener Ebenen (logistisch auf eine Tragfähigkeit, siehe [Systemausbau.md](Systemausbau.md), Punkt 14); sichtbare Uhr in der Anzeige (passt zu "durchschaubar statt geheim")
+ Umbaurisiko: gering, Zeitereignisse und Weltuhr reichen
+ Vorkehrung: keine; das Spieldesign gehört zur Ökonomie der Vorräte in [Systemausbau.md](Systemausbau.md), Punkt 10

Umsetzung: offen

## Gunst der Nebengottheiten

+ Wichtigkeit: ungeklärt
+ Vorbilder: Dungeon Crawl Stone Soup (ein Gott besteht aus Regeln für Gewinn und Verlust der Frömmigkeit, Geboten, Kräften und Zorn bei Abkehr; Gebote sollen reizvoll und ausspielbar sein, aber schwer auszunutzen)
+ Braucht: Gunst als Wert, Gebote und Tabus als Auslöser auf Taten, Kräfte als Fähigkeiten nach Schwellen der Gunst
+ Umbaurisiko: gering, Haken und Register reichen
+ Vorkehrung: keine

Umsetzung: offen

## Filmriss

+ Wichtigkeit: ungeklärt
+ Inhalt: Zeitsprung und verlorene Erinnerung an erkundete Felder bei sehr hohem Pegel
+ Braucht: die Erinnerung der Karte aus "Veränderbares Gelände"; eine Weise, Zeit vergehen zu lassen, in der Ninkasi von der KI geführt wird
+ Umbaurisiko: gering
+ Vorkehrung (erledigt): `vergessen` löscht die Erinnerung an Felder, nicht `erkundet`; ein Wiedersehen bringt keine EP (siehe [Welt.md](Welt.md), Sicht und Erinnerung)

Umsetzung: offen

## Mechaniken aus Pen-and-Paper

Ideen aus Rollenspielen am Tisch; jede passt nach heutigem Stand in Daten, Register und Haken (Umbaurisiko gering), Wichtigkeit noch ungeklärt.

+ Konzentration (D&D 5e): höchstens eine aufrechterhaltene Wirkung je Wirkender, Schaden erzwingt eine Probe; bei uns eine Gruppe am Unterhalt mit Höchstzahl und `unterbrechbar`
+ Reaktion (D&D 5e, Pathfinder 2e): eine Handlung außerhalb des eigenen Zugs auf einen Auslöser, eine je Runde; Gelegenheitsangriffe sind verworfen, Parade oder Gegenzauber wären Auslöser mit Verbrauch je Zug
+ Erfolgsgrade (Pathfinder 2e): um 10 über oder unter der Schwelle ist kritisch, vier Ausgänge statt zwei; bei uns gibt es den Krit, ein kritischer Fehlschlag passt zum Psi-Risiko
+ Fortschrittsuhren (Blades in the Dark): Kreise mit Segmenten für Mühen und drohendes Unheil; Anzeige für Brauvorgang, Alarm, Nachrücken
+ Stress statt Wunde (Blades in the Dark): Stress ausgeben, um eine Wunde zu mildern, voller Stress hinterlässt ein Trauma; denkbar mit PP oder dem Pegel
+ Reaktionswurf und Moral (Old-School-Regelwerke): nicht jede Begegnung ist feindlich, Moral entscheidet über Flucht; passt zu Fraktionen und dem Modul `fliehen`
+ Mühle und Erschöpfung (Torchbearer, D&D 5e): Zustände in Stufen, die mit der Zeit kommen; ein Kandidat für den Druck gegen das Rasten
+ Bindung (D&D 5e): höchstens drei eingestimmte magische Gegenstände, damit sich Kombinationen nicht aufschaukeln; eine Höchstzahl in `daten/regeln.js` und ein Feld am Gegenstand
+ Wilde und quecksilbrige Magie (D&D 5e, Dungeon Crawl Classics): ein Zauber bekommt beim Lernen eine zufällige Eigenart je Lauf; Etiketten je Lauf gibt es schon für Unbekanntes
+ Spellburn (Dungeon Crawl Classics): Eigenschaften opfern für eine stärkere Wirkung, sie kehren langsam zurück; Eigenschaften sind bei uns nur Lerntempo, das wäre ein Bruch mit [Charakter.md](Charakter.md), Eigenschaften
+ Wahnsinn in Stufen (Call of Cthulhu): ein großer Verlust auf einmal löst eine vorübergehende Störung aus, ein großer Verlust an einem Tag eine dauerhafte; nur als Vorbild für die Schwellen des Pegels (entschieden 2026-11-22), keine eigene Stabilität

Umsetzung: offen

## Schatzräume mit Schlüssel

+ Wichtigkeit: hoch (2026-11-22): ein Schatzraum hat garantiert einen Schlüssel auf derselben Ebene oder höchstens zwei Ebenen entfernt
+ Vorbilder: Brogue (Schatzräume hinter Türen, die man nicht untergraben, verbrennen oder umgehen kann; der Schlüssel liegt auf einem Altar, sein Aufheben löst oft eine Gefahr aus wie Flut oder einstürzenden Boden; manchmal trägt ihn ein Wesen, ein Dieb läuft mit ihm davon, oder er liegt hinter einem Rätsel wie einer Druckplatte)
+ Braucht: einen Plan des Laufs: Ebenen entstehen erst beim ersten Betreten (siehe [Welt.md](Welt.md), Ebenen), ein Schlüssel zwei Ebenen tiefer muss aber feststehen, bevor jene erzeugt wird; der Plan folgt beim Start aus dem Startwert (welche Tiefe welchen Schatzraum hat, wo sein Schlüssel liegt) und jede Erzeugung einer Ebene liest ihn; Schlüssel als Gegenstand mit Bezug auf seinen Raum; Türen, die nur dieser Schlüssel öffnet und die gegen Zerstören geschützt sind
+ Berührt: `src/welt/ebene.js` (erzeugt jede Ebene für sich mit eigenem abgeleitetem Zufall), Themenräume, veränderbares Gelände (Schutz der Wände), Verschleiß (ein Schlüssel darf nicht zerfressen werden), Fallenlassen und Sturz in den Abgrund (verlorener Schlüssel)
+ Regelfrage: was mit einem verlorenen Schlüssel geschieht (kehrt zurück, ist unzerstörbar, oder Pech)
+ Umbaurisiko: gering, seit es den Plan des Laufs gibt
+ Vorkehrung: erledigt (Plan des Laufs im Zustand, siehe [Welt.md](Welt.md), Plan des Laufs); weiter gilt: Ebenen nie aus dem Spielverlauf würfeln, nur aus Startwert und Plan

Umsetzung: offen

## Fraktionen: Ruf und Beistand

+ Wichtigkeit: hoch, zumindest das System vorbereiten (2026-11-22)
+ Vorhanden: Beziehungen als Tabelle der Fraktionen; Zorn: greift Ninkasi ein neutrales Wesen an, werden es und alle Wesen seiner Fraktion, die sie sehen, ihr gegenüber feindlich (jedes einzeln, `zornAuf`), siehe [Wesen.md](Wesen.md), Fraktionen; damit ist der Wunsch "Neutrale in Sicht werden aggressiv, wenn man ein Wesen ihrer Fraktion angreift" schon erfüllt
+ Beistand (entschieden): Wesen helfen Ninkasi, wenn sie in ihrer Sicht einen Feind ihrer eigenen Fraktion bekämpft (der Feind meines Feindes)
+ Vorbilder: Caves of Qud (Ruf je Fraktion als Zahl, Schwellen machen eine Fraktion freundlich oder feindlich, Wasserritual und Taten verschieben ihn; Mitglieder kommen einander zu Hilfe)
+ Braucht: Ruf je Fraktion als Zahl im Zustand (Vorgabe 0); Schwellen in `daten/regeln.js`, ab denen die Beziehung kippt; Taten, die den Ruf verschieben (Angriff, Tötung, Hilfe, Gespräch), als Auslöser an der Fraktion; für den Beistand eine Regel in der Zielwahl (`src/ki/ziele.js`): wer ein Mitglied einer verfeindeten Fraktion angreift, wird für Zuschauer zum Verbündeten auf Zeit
+ Berührt: `beziehung` in `src/systeme/fraktionen.js` (liest heute nur Daten und Zorn), die KI, Handel und Gespräch, Anzeige (Ruf im Charakterfenster)
+ Umbaurisiko: gering bis mittel
+ Vorkehrung (erledigt, siehe [Wesen.md](Wesen.md), Fraktionen): `zustand.ruf` mit Vorgabe 0, `beziehung` liest Grundwert plus Ruf über die Schwellen; Beistand gegen Feinde der eigenen Fraktion mit Ende über den Kampfzustand; als erste Tat verschiebt eine Tötung den Ruf, nur mit Zeugen; Baustein `ruf_aendern` für Gespräch und Quests
+ Entschieden: Ruf als Grundwert aus der Tabelle plus Ruf; er gehört der Fraktion `ninkasi`, unter Verkleidung oder Besessenheit gelten die Beziehungen der fremden Fraktion, und Taten ändern Ninkasis Ruf dann nicht; Beistand leisten nur Neutrale; Tötungen zählen nur mit Zeugen

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Fraktionen; offen: weitere Taten (Hilfe, Gespräch, Handel), Ruf im Charakterfenster, ob eine Tat in Verkleidung etwas anderes verschiebt

## Bestiarium, Glossar, Rezeptbuch

+ Wichtigkeit: hoch (2026-11-22); zugleich der dauerhafte Fortschritt als Wissen
+ Vorbilder: Hades (Kodex: Einträge wachsen, je öfter man einem Wesen begegnet, es besiegt oder mit ihm spricht); Hades II (Bestiarium mit allen begegneten Gegnern und der Zahl der Siege); Caves of Qud (Journal mit Orten, Geheimnissen und Kochrezepten, aus der Erinnerung, nicht nachgeprüft)
+ Inhalt: Bestiarium mit Wesen, deren Eintrag mit Begegnungen und Siegen wächst (erst Name und Bild, dann Werte, dann Schwächen); Glossar mit den Begriffen des Spiels (Pegel, Brand, Zorn, Heimlichkeit), auch aus der Hilfe und dem Untersuchen erreichbar; Rezeptbuch mit gefundenen oder erbrauten Rezepten; Tonfall von Bestiarium und Glossar enzyklopädisch, ernsthaft und informativ; das Glossar der Fachbegriffe des Brauens entsteht zweisprachig mit dem Englischen ([Systemausbau.md](Systemausbau.md), Punkt 9)
+ Braucht: Fensterarten; Quellen für die Befehlszeile (das Register der Quellen ist dafür vorbereitet, siehe [Bedienung.md](Bedienung.md), Eingabe); Zähler je Wesensart aus den Meldungen (wie die Chronik); Texte in `sprache/`
+ Berührt: Wiederholbarkeit: liest nur die Anzeige das Wissen, ist nichts zu beachten; ermöglicht ein bekanntes Rezept das Brauen, gilt die Regel für Wissen über Läufe hinweg (Startoption, siehe [Architektur.md](Architektur.md), Speichern)
+ Umbaurisiko: gering
+ Vorkehrung: erledigt mit der Regel für Wissen über Läufe hinweg; Meldungen nennen die Art des Wesens

Umsetzung: offen

## Erfolge

+ Wichtigkeit: hoch, Achievements (2026-11-22)
+ Vorbilder: Hades (Erfolge, auch für vollständige Einträge im Kodex); NetHack (Conducts: freiwillige Einschränkungen wie Pazifist oder Vegetarier, jederzeit abfragbar und am Ende angezeigt; wer eine bricht, verliert sie)
+ Braucht: Erfolge als Daten mit einer Bedingung über die Zähler eines Laufs oder der Chronik; Anzeige im Titel und nach dem Lauf; Einschränkungen nach NetHack als Erfolge, die man während des Laufs verlieren kann
+ Idee: wie der Todesbericht lassen sich Erfolge durch Nachspielen mit Hörern auf die Meldungen prüfen; die Logik weiß von ihnen nichts
+ Berührt: Chronik und Ruhmeshalle ([Titelbildschirm.md](Titelbildschirm.md))
+ Umbaurisiko: gering
+ Vorkehrung: keine

Umsetzung: offen

## Ausrüstung und Effekte am Tile

+ Wichtigkeit: hoch (2026-11-22): angelegte Ausrüstung ist auf Ninkasis Tile zu sehen, Effekte ändern die Darstellung von Tiles
+ Vorbilder: Dungeon Crawl Stone Soup in der Tile-Fassung (die Spielfigur zeigt Waffe, Rüstung, Helm und Umhang als übereinandergelegte Schichten); Brogue (Zustände färben das Zeichen); Caves of Qud (Farbe des Tiles nach Zustand); alle drei aus der Erinnerung, nicht nachgeprüft
+ Braucht: ein Feld fürs Aussehen an Ausrüstung und Zuständen, das nur die Anzeige liest (Schicht mit Pixeldaten und Ankerpunkt je Platz; Tönung, Umriss, Flackern, Durchsichtigkeit); eine Reihenfolge der Schichten; Pixeldaten für Ausrüstung im Raster der Tiles (siehe [Tileset.md](Tileset.md), Pixeldaten)
+ Berührt: Renderer und Tilebilder (`src/anzeige/`), Artstyle-Fibel (Schichten müssen im kleinen Raster lesbar bleiben), Verwandlung (eine Gestalt tauscht das Grundtile, Schichten auf fehlenden Plätzen entfallen), Unsichtbarkeit und Hellsicht (Darstellung des nur Gespürten), Effektschicht ([Animationen.md](Animationen.md))
+ Umbaurisiko: gering, reine Anzeige
+ Vorkehrung: Aussehen als Daten am Gegenstand und am Zustand, nie aus dem Namen abgeleitet; Werte fürs Aussehen gehören nicht in die Logik

Umsetzung: offen

## Wurfweite nach Skill und Gewicht

+ Wichtigkeit: ungeklärt, Prüfung gewünscht (2026-11-22): Reichweite von Tränken und Wurfwaffen, verändert durch Skills und durch das Gewicht
+ Vorhanden: `wurf.reichweite` am Gegenstand, sonst `regeln.werfen.reichweite` (6), fest und ohne Modifikatoren (`src/systeme/werfen.js`, siehe [Wesen.md](Wesen.md), Bewegung); Gewicht in Gramm an jedem Gegenstand (siehe [Gegenstaende.md](Gegenstaende.md), Inventar); Skills wirken über Modifikatoren, die Sichtweite macht es mit dem Ziel `reichweiteSicht` schon vor
+ Braucht: ein Modifikatorziel `reichweiteWurf` an der Werfenden, mit den Tags des Gegenstands (z.B. `trank`, `wurfwaffe`), damit ein Skill nur Tränke weiter werfen lässt; eine Regel für das Gewicht, z.B. Grundweite minus eine Stufe je angefangene Gewichtsklasse aus `daten/regeln.js`, mit Mindestweite 1; die Vorschau im Zielmodus zeigt die Weite schon an
+ Umbaurisiko: gering, eine Stelle in `src/systeme/werfen.js`
+ Vorkehrung: keine; die Systeme bilden es fast ab, es fehlen nur das Modifikatorziel und die Gewichtsregel

Umsetzung: offen

## Krankheiten

+ Wichtigkeit: ungeklärt (2026-11-22): Krankheiten, die nur Rituale heilen, nur bestimmte Orte oder nur bestimmte Gegenstände
+ Vorbilder: Caves of Qud (Glotrot und Ironshank: Ansteckung durch schwarzen Schleim, erst eine Vorstufe wie Halsweh, nach etwa einer Woche die volle Krankheit; die Vorstufe kann von selbst ausheilen; geheilt wird nur mit einem bestimmten Trank, dessen Rezept je Spiel zufällig ist und in einem Buch steht); NetHack (Lykanthropie heilen nur Gebet, Weihwasser oder Wolfseisenhut; aus der Erinnerung, nicht nachgeprüft); Darkest Dungeon (Krankheiten heilt nur das Sanatorium im Weiler; aus der Erinnerung)
+ Vorhanden: Zustände mit Dauer, Verlauf über die Zeit, Stapelregel, Tags und Auslösern (siehe [Wirkungen.md](Wirkungen.md), Zustände); Baustein `zustand_entfernen { zustand | tag }`; Heilung durch einen Gegenstand über `trinkbar` oder Benutzen, an einem Ort über Gelände mit `beimBenutzen` (Altar, Quelle), durch ein Ritual als lange Aktion (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen); zufällige Rezepte je Lauf gehen über Etiketten wie bei Unbekanntem
+ Braucht: Krankheit als Zustand mit Stufen (Vorstufe, Ausbruch), der von selbst weiterschreitet oder ausheilt (ein Wurf je Welttick oder Tag); Ansteckung über Auslöser (Treffer, Trinken) oder Aura; Schutz gegen das falsche Heilmittel: ein Tag am Zustand, den nur das richtige Mittel entfernt (z.B. `krankheit.glotrot`), während allgemeine Heilung nur `krankheit` ohne Unterart trifft
+ Umbaurisiko: gering, fast alles sind Daten
+ Vorkehrung: keine; ob das Weiterschreiten zu einer nächsten Stufe (Zustand A wird zu Zustand B) als `beimEnde` mit `zustand_setzen` reicht, prüft der Probedurchstich ([Systemausbau.md](Systemausbau.md), Punkt 2)

Umsetzung: offen

## Questsystem

+ Wichtigkeit: hoch, "wichtig" (2026-11-22): entworfene Quests und erzeugte, allgemeine Quests
+ Vorbilder: Caves of Qud (feste Quests der Hauptlinie neben erzeugten Quests von Dörfern, die zur Hauptlinie zurückführen; Schreine und gravierte Gegenstände geben erzeugte Quests, Stätten zu besuchen oder Reliquien zu holen; eine Story-Engine legt beim Betreten eines Gebiets Figuren, Gegenstände und Quests fest und gibt sie an die Erzeugung der Karte weiter); Shattered Pixel Dungeon (wenige entworfene Quests mit zufälliger Variante: der Geist will eine getrocknete Rose oder einen Rattenschädel, der Zauberstabmacher eine von drei Zutaten, der Schmied Erz oder eine Spitzhacke; Belohnung zur Wahl); Old-School-Regelwerke (Gerüchtetabellen)
+ Braucht: Quests als Daten (Vorlage mit Rollen wie Auftraggeber, Ziel, Gegenstand, Ort; Bedingungen für das Erscheinen nach Tiefe); erzeugte Quests aus Vorlagen mit Platzhaltern, die die Erzeugung aus dem Inhalt füllt; Ziele als Auslöser auf vorhandene Haken und Meldungen (töten, bringen, erreichen, brauen, sprechen, beschützen); Stand der Quests im Zustand; Belohnungen als Effekte (Gegenstände, EP als Lernanlass, Ruf, Wissen); Fensterart Journal; Annehmen und Abgeben über Gespräch
+ Berührt: Ebenenerzeugung (das Ziel einer Quest kann auf einer noch nicht erzeugten Ebene liegen: derselbe Plan des Laufs wie bei den Schatzräumen), Gespräch, Ruf, Lernen (gebundene EP nur für Bewältigtes, eine Quest ist Bewältigtes), Texte und Grammatik (Platzhalter in Aufträgen), Bestiarium und Rezeptbuch (Wissen als Belohnung)
+ Regelfragen: was geschieht, wenn ein Questziel ohne Ninkasi verschwindet (ein anderer tötet den Gesuchten, Säure zerfrisst den Gegenstand); ob Quests scheitern können oder eine Frist haben (passt zum Druck gegen endloses Rasten)
+ Umbaurisiko: gering bis mittel; der Plan des Laufs steht und nimmt Quests in `inhalte` auf
+ Vorkehrung: der Plan des Laufs ist erledigt (siehe [Welt.md](Welt.md), Plan des Laufs); weiter gilt: Meldungen und Haken tragen weiter Urheber, Art und Ort, damit Questziele nur Auslöser sind; Questgegenstände als Gegenstände mit einem Kennzeichen, das Verschleiß und Zerstören verhindert

Umsetzung: offen

## Nachrückende Gegner

+ Wichtigkeit: ungeklärt; angedacht ist ein fester Pool von Gegnern je Ebene, nachdenken erwünscht (2026-11-22)
+ Stand: [Charakter.md](Charakter.md), Erfahrungspunkte (EP) schließt nachrückende Gegner nicht aus, als eigenes System mit Rate, Obergrenze und EP-Faktor; verlassene Ebenen ruhen bisher, das logistische Nachholen steht in [Systemausbau.md](Systemausbau.md), Punkt 14
+ Vorbilder: Brogue (Horden erscheinen von Zeit zu Zeit, nie in Sicht, nie näher als 15 Felder, nie in Themenräumen, nie unbewegliche Wesen); Cogmind (Trupps nach Alarmstufe und nach Zeit); Dungeon Crawl Stone Soup (langsames Nachrücken, später die Zot-Uhr)
+ Abwägung: ein fester Pool macht jede Ebene berechenbar und das Rasten sicher; Nachrücken ist zugleich der einfachste Druck gegen endloses Rasten; Farmen verhindern schon der EP-Faktor und der Topf je Abstammungslinie
+ Braucht: ein System am Welttick oder als Zeitereignis je Ebene; Regeln für den Ort (außer Sicht, Mindestabstand, nicht in Themenräumen); Werte in `daten/regeln.js` und an der Ebene (Rate, Obergrenze, EP-Faktor, Tabelle der Population); die Obergrenze der Population (500) gilt weiter
+ Berührt: Population nach Tiefe (siehe [Welt.md](Welt.md), Ebenen), Lernen (EP-Faktor), Druck gegen endloses Rasten, Questsystem (nachrückende Gegner als Ziel)
+ Umbaurisiko: gering, Register `welttick` und Zeitereignisse reichen
+ Vorkehrung: keine; die Erzeugung der Population für eine Ebene als Funktion halten, die auch später einzelne Horden setzen kann

Umsetzung: offen

## EP für Erkundung

+ Wichtigkeit: ungeklärt, Frage gestellt am 2026-11-22
+ Inhalt: heute EP je Feld, das Ninkasi zum ersten Mal wirklich sieht (siehe [Charakter.md](Charakter.md), Freie EP); laut Bot kommt fast alles aus der Erkundung (Messwerte in [Entwicklung.md](Entwicklung.md), Messwerte)
+ Wege: a) nur Gesehenes zählt, Kartierung zeigt den Weg und die EP kommen beim Hingehen (gilt); b) jede Erkundung zählt, ein mächtiger Trank der Kartierung brächte alle EP der Ebene auf einmal und wäre die größte EP-Quelle; c) EP je Ort (Raum, Fundort) statt je Feld, das Ablaufen jeder Ecke lohnt dann nicht mehr
+ Berührt: `epFuerErkundung` (`src/systeme/lernen.js`) und das Balancing der EP
+ Umbaurisiko: gering
+ Vorkehrung (erledigt): `erkundet` (einmal gesehen, EP) ist von der Erinnerung (bekannt) getrennt; jeder der drei Wege ist damit eine kleine Änderung, ein Filmriss bringt unter keinem doppelte EP

Umsetzung: teilweise, siehe [Welt.md](Welt.md), Sicht und Erinnerung; offen: ob c) die bessere Form ist

## Recherche

Stand 2026-11-22; die Quellen sind teils Wikis und Foren, die Einzelheiten können sich mit neueren Versionen der Spiele geändert haben.

+ Caves of Qud: Domination (https://wiki.cavesofqud.com/wiki/Domination), Präkognition (https://wiki.cavesofqud.com/wiki/Precognition, https://wiki.cavesofqud.com/wiki/RNG), Hellsicht (https://wiki.cavesofqud.com/wiki/Clairvoyance), Handel und Wasser (https://wiki.cavesofqud.com/wiki/Trade), Wasserritual (https://wiki.cavesofqud.com/wiki/Water_Ritual), Gespräche als Daten (https://wiki.cavesofqud.com/wiki/Modding:Conversation), Befehle an Begleiter (https://freeholdgames.itch.io/cavesofqud/devlog/256042/feature-friday-may-21-2021)
+ Dungeon Crawl Stone Soup: Zot-Uhr statt Nahrung (https://crawl.develz.org/wordpress/?p=4829), Götter (https://sources.debian.org/src/crawl/2%3A0.34.0-1/docs/develop/god_creation.txt), Morgue (https://crawl.develz.org/tavern/viewtopic.php?p=223188)
+ Brogue: Heimlichkeit und Licht (https://brogue.fandom.com/wiki/Stealth?oldid=5117), Folgen über Treppen (https://brogue.fandom.com/wiki/Stairdancing; dazu NetHack https://nethackwiki.com/wiki/Wander, DCSS-Forum https://crawl.develz.org/tavern/viewtopic.php?p=342509), Verbündete (https://www.pcgamer.com/au/why-i-love-drinking-random-potions-and-making-monkey-friends-in-brogue), gBrogue (https://github.com/gbelo/gBrogue), Brogue CE (https://raw.githubusercontent.com/tmewett/BrogueCE/master/CHANGELOG.md)
+ NetHack: Kartierung und Erkennen (https://nethackwiki.com/wiki/Rogue_(game)), Bones (https://nethackwiki.com/wiki/Bones)
+ Cogmind: Alarmstufe (https://www.indiedb.com/games/cogmind/news/adjustable-difficulty), Morgue (https://www.indiedb.com/games/cogmind/news/morgue-files)
+ Into the Breach: Zurücksetzen der Runde (https://kotaku.com/into-the-breach-the-kotaku-review-1823365331), Vorschau auf einer Kopie (https://forum.godotengine.org/t/into-the-breach-style-tactics-in-gdscript-rules-as-events-previews-on-a-cloned-board-and-attacks-that-move-when-pushed/146380)
+ Fortschritt über Läufe: Hades (https://saschb2b.github.io/game-mechanics/games/hades/meta-progression), Game Maker's Toolkit zu Rogue Legacy (https://amara.org/subtitles/7doGHxwrhRpX/en/1/download/Roguelikes%20Persistency%20and%20Progression%20%20Game%20Makers%20Toolkit.en.dfxp), Darkest Dungeon (https://darkestdungeon.wiki.gg/wiki/Expedition)
+ Zerstörbares Gelände: Brigador Killers (https://80.lv/articles/how-brigador-killers-makes-blowing-up-buildings-part-of-the-strategy), Game Maker's Toolkit (https://gmtk.substack.com/p/how-games-do-destruction)
+ Begleiter allgemein: Ancardia (https://ancardia.fandom.com/wiki/Companion)
+ Utility-KI: Infinite Axis Utility System (https://carloslab-ai.github.io/UtilityIntelligence/UtilityIntelligence/considerations/), Folien von Dave Mark und Kevin Dill (https://api.sambuz.com/doc/improving-improving-ai-decision-modeling-ai-decision-ppt-presentation-788939)
+ Brogue, Schatzräume: Schlüsselhalter (https://brogue.fandom.com/wiki/Key_Holder), Altar (https://brogue.fandom.com/wiki/Altar), Schatzraum (https://brogue.fandom.com/wiki/Reward_room)
+ Hades: Kodex (https://breezewiki.discard.no/hades/wiki/Codex), Bestiarium in Hades II (https://vandal.elespanol.com/en/hades-2/hades-2-how-to-unlock-the-book-of-shadows-and-what-it-does.html)
+ NetHack: Conducts (https://steelypips.org/nethack/conduct.html)
+ Caves of Qud, Krankheiten: Illness (https://wiki.cavesofqud.com/wiki/Illness), Glotrot (https://wiki.cavesofqud.com/wiki/Glotrot), Ironshank (https://wiki.cavesofqud.com/wiki/Ironshank)
+ Caves of Qud, Quests: Prozedurale Erzeugung (https://www.gamedeveloper.com/design/tapping-into-the-potential-of-procedural-generation-in-caves-of-qud), Fahrplan (https://cavesofqud.com/roadmap/), Story-Engine (https://ceur-ws.org/Vol-3217/paper12.pdf)
+ Shattered Pixel Dungeon: Quests der Figuren (https://pixeldungeon.fandom.com/wiki/NPC)
+ Brogue: Nachrücken der Horden (https://brogue.fandom.com/wiki/Level_Generation)
+ Automatisches Erkunden: Dijkstra-Karten mit allen unentdeckten Feldern als Ziel (https://groups.google.com/g/rec.games.roguelike.development/c/6yNIuhSerpM, https://drwjf.github.io/roc/notes/dijkstra.html), nächster Rand gegen Kosten und Nutzen (https://arxiv.org/abs/1711.03087v1), Erkunden in Brogue (https://brogue.fandom.com/wiki/Commands, https://raw.githubusercontent.com/tmewett/BrogueCE/master/CHANGELOG.md)
+ Minecraft: Bauwerke aus Vorlagen (https://learn.microsoft.com/en-us/minecraft/creator/documents/structures/introductiontojigsawstructures), Vorlagenpools (https://minecraft.fandom.com/wiki/Custom_world_generation/template_pool)
+ Dungeon Crawl Stone Soup: Vaults (https://sources.debian.org/src/crawl/2%3A0.34.1-1/docs/develop/levels/introduction.txt, https://sources.debian.org/src/crawl/2%3A0.34.1-1/docs/develop/levels/syntax.txt)
+ D&D 5e: Konzentration (https://www.dndbeyond.com/posts/1224-dont-lose-focus-your-guide-to-the-rules-for), Bindung (https://www.dndbeyond.com/sources/basic-rules/magic-items)
+ Pathfinder 2e: drei Aktionen, Erfolgsgrade (https://2e.aonprd.com/Rules.aspx?ID=2263)
+ Blades in the Dark: Uhren, Stress, Rückblende (https://raw.githubusercontent.com/amazingrando/blades-in-the-dark-srd-content/master/Blades-in-the-Dark-SRD.md, https://www.gamedeveloper.com/marketing/five-tabletop-rpg-mechanics-that-video-games-should-definitely-steal)
+ Old-School-Regelwerke: Reaktionswurf und Moral (https://methodsetmadness.blogspot.com/2023/05/reaction-rolls-in-practice-osr.html?m=1)
+ Torchbearer: Mühle und Licht (https://www.worldanvil.com/w/mouse-guard-abroad-sunrunner4kr/a/time-and-light-article)
+ Dungeon Crawl Classics: Spellburn, quecksilbrige Magie, Korruption (https://roll20.net/compendium/dcc/Rules:Magic)
+ Call of Cthulhu: Stabilität und Wahnsinn (https://roll20.net/compendium/coc/Rules:Sanity%20%28SAN%29)
