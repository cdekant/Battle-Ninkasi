# Battle Ninkasi - Charakter und Lernen

Stand: 2026-11-20

Mitprüfen bei Änderungen: [Wesen.md](Wesen.md), [Bedienung.md](Bedienung.md)

Vorbilder: EVE Online (Rang als Kostenfaktor, primäre und sekundäre Eigenschaft, Skillpunkte unabhängig vom späteren Lerntempo), DCSS (EP fließen in die benutzten Skills, Kosten anzeigen statt Formel), Caves of Qud (Eigenschaften dauerhaft und vorübergehend veränderbar), Tales of Maj'Eyal und Path of Exile (Skills wirken über Tags auch auf künftige Fähigkeiten). Die Mechanik ist seit 0.26.0 umgesetzt, mit den hier genannten vorläufigen Zahlen, beschrieben in [Wesen.md](Wesen.md) (Skills und Lernen); offen sind Skillfenster, Charaktererstellung und Skillkatalog (Punkt 13 in [Systemausbau.md](Systemausbau.md)).

## Charaktererstellung

+ Alle sechs Eigenschaften starten bei 10, die Spielerin verteilt 20 Punkte, höchstens 20 je Eigenschaft (vorläufig, Regelwerte in `regeln.lernen`)
+ Die Charaktererstellung erscheint vor jedem Lauf als Fenster über der Karte, vorbelegt mit der letzten Verteilung (seit 0.27.0, siehe Fenster in [Bedienung.md](Bedienung.md))
+ Keine festen Startskills: Ninkasi beginnt mit einem Startguthaben freier EP (vorläufig 300) und verteilt es selbst
+ Makel gehören zur Charaktererstellung: Nachteil gegen zusätzliche Punkte
+ Idee, noch nicht bestätigt: Vorzüge als Gegenstück, Vorteil gegen Punkte
+ Idee, noch nicht bestätigt: Makel und Vorzüge werden vor der Punkteverteilung gewählt, die zu verteilenden Punkte ergeben sich daraus (Grundpunkte + Makel - Vorzüge); die Oberfläche rechnet sie an einer Stelle (`punkteZuVerteilen` in `src/eingabe/erstellung.js`), der Hilfetext nennt sie über Platzhalter statt einer festen Zahl
+ Beispiele für Makel: Blindheit (Sichtweite stark eingeschränkt), dysfunktionale Alkoholdehydrogenase
+ Weitere Makel, auszuarbeiten: Aldehyd-Dehydrogenase-Mangel (Acetaldehyd, Flush, Katerschaden), Zöliakie (Gerste und Weizen schaden), Gicht (Purine im Bier lösen Anfälle aus)
+ Vorschlag, noch nicht bestätigt: Makel dürfen zweischneidig sein, Nachteil mit verstecktem Vorteil
+ Vorschlag, noch nicht bestätigt: Makel geben wahlweise Eigenschaftspunkte oder EP und dürfen Eigenschaften auch unter 10 senken, für schärfere Profile

## Startwerte

+ Vorläufig, Grundlage fürs Balancing: 100 LP, 100 MP, Pegel 0 ‰
+ 100 als Grundwert, damit Boni in Prozent vom Grundwert glatte ganze Zahlen ergeben
+ Mit Pegel 0 startet Ninkasi nüchtern: LP regenerieren langsam, MP am schnellsten, PP schwinden (Verläufe in [Grundlagen.md](Grundlagen.md))
+ PP (Psi-Punkte) vorläufig 0 von 100, Start- und Höchstwert noch offen
+ Der Pegel ist nach oben offen

## Eigenschaften

+ Sechs Eigenschaften: Körperlichkeit, Trinkfestigkeit, Gewandtheit, Sinnlichkeit, Klugheit, Braukunde
+ Vorbild D&D (sechs Eigenschaften), Weisheit und Intelligenz geschärft zu Lebendigem (Braukunde) und Mechanischem (Klugheit)
+ Eigenschaften haben zwei Aufgaben: Sie bestimmen das Lerntempo der Skills und sind weiche Anforderungen an Gegenstände und Fähigkeiten
+ Eigenschaften speisen keine Kampfwerte direkt; Kampfwerte, Vorräte und Stoffwechsel ändern sich über Skills aus dem Bereich der Eigenschaft (z.B. ein Skill der Trinkfestigkeit hebt die Schwellen des Pegels über `abbau.pegel` und `kurvenverschiebung.lp`)
+ Jeder Skill hat eine primäre und eine sekundäre Eigenschaft (Vorbild: EVE Online)
+ Beispiel: Hohe Körperlichkeit lässt Skills, die LP erhöhen, schneller lernen

### Grundwert und Veränderung

+ Grundwert: Wert aus der Erstellung plus dauerhafte Änderungen, z.B. durch ein seltenes Bier oder die Gabe einer Nebengottheit (Baustein `eigenschaft_aendern`)
+ Vorübergehend ändern Ausrüstung, Zustände und Verbrauchsgüter die Eigenschaften über Modifikatoren (Vorbild Caves of Qud), z.B. ein Kraftbier für einige Zeit
+ Das Lerntempo richtet sich nur nach dem Grundwert, ohne Ausrüstung, Zustände und Verbrauchsgüter; sonst lohnte es, vor dem Verteilen freier EP ein Klugheitsbier zu trinken
+ Anforderungen rechnen mit dem vollen Wert samt vorübergehender Boni: Das Kraftbier macht den Zweihänder für eine Weile ohne Abzug nutzbar
+ Eingeschränkte Neuverteilung im Lauf (Vorbild: Remap in EVE) später; sie ändert nur das künftige Lerntempo, siehe Lernpunkte

### Anforderungen

+ Gegenstände und Fähigkeiten können eine Anforderung nennen, z.B. Körperlichkeit 15 für einen Zweihänder
+ Weich: Unter der Anforderung bleibt alles nutzbar, mit Abzug je fehlendem Punkt; bei Gegenständen auf Werte wie Genauigkeit oder Schaden, bei Fähigkeiten über die Risikotabelle
+ Hart nur in seltenen Fällen, z.B. göttliche Gaben
+ Grund: Die Eigenschaften stehen nach der Erstellung weitgehend fest; harte Anforderungen sperrten Fundstücke dauerhaft, das verträgt sich nicht mit "der Zufall prägt den Build"

### Bereiche

+ Körperlichkeit: Kraft, LP, Nahkampf, Tragen, Kopfstoß
+ Trinkfestigkeit: Pegel, Widerstand gegen Gift und Infektion; thematisch verwandt mit den Makeln des Stoffwechsels
+ Gewandtheit: Schnelligkeit, Ausweichen, Schleichen, Fernkampf, Reaktion (z.B. Fallen im letzten Moment bemerken)
+ Sinnlichkeit: bewusst doppeldeutig, die Sinne und das Sinnliche; Wahrnehmung (Nachtsicht, Fernsicht, Fallen entdecken), Ego, Charisma, Gefährten, Handel, Psi
+ Klugheit: Anlagen, Prozesse, Fallen entschärfen, Rätsel, Zauber als erlernte Formel
+ Braukunde: die Weisheit dieser Welt, Brauen ist heiliges Wissen; Brauen, Alchemie, Mikroorganismen, Kreaturen verstehen, göttliche Gaben
+ Sinnlichkeit ist die schwerste Eigenschaft, Ausgleich über das Balancing
+ Vorräte und Eigenschaften: LP zu Körperlichkeit, MP zu Klugheit und Braukunde, PP zu Sinnlichkeit, Pegel zu Trinkfestigkeit, Ausdauer (Option) zu Gewandtheit oder Körperlichkeit
+ Kennerschaft (Unbekanntes erkennen) als Skill mit Sinnlichkeit und Braukunde
+ Skills, Schriftrollen und Items wirken auf Regeneration und Schwund über Modifikatoren, siehe Stoffwechsel unter Entitäten und Komponenten in [Architektur.md](Architektur.md)

### Magie und Psi

+ Getrennte Systeme, siehe [Grundlagen.md](Grundlagen.md): Magie gebunden an Ritual, Schrift und Alchemie (MP), Psi sofort und rein geistig (PP)
+ Psi: primär Sinnlichkeit
+ Vorschlag, noch nicht bestätigt: Magie gehört keiner einzelnen Eigenschaft, die Paarung prägt ihren Charakter
  + Zauber als Formel (Schriftrollen, HACCP-Aushänge): primär Klugheit, sekundär Braukunde
  + Alchemie (Tränke, Gärung, Gifte): primär Braukunde, sekundär Klugheit
  + Göttliche Gabe (Altäre, Nebengottheiten): primär Braukunde, sekundär Sinnlichkeit
+ Vorschlag, noch nicht bestätigt: Psi sekundär Klugheit

## Skills

+ Skills sind keine Fähigkeiten: Zauber, Psi und Waffen profitieren in unterschiedlicher Weise von ihnen
+ So viele Skills wie möglich, Vielfalt durch qualitativ verschiedene Skills

### Aufbau

+ Skill-Sets (z.B. Zähigkeit für LP) mit vier Tiers: Grund-, Experten-, Meister-Skill, göttliches Skill-Niveau; jeder Tier ist ein eigener Skill mit eigener Wirkung
+ Stufen 0 bis 5 je Skill
+ Voraussetzungen innerhalb eines Sets ergeben sich aus der Regel: Experten-Skill verlangt Grundskill 3, Meister-Skill Grundskill 4 und Experte 3, göttliches Niveau Grundskill 5, Experte 4 und Meister 3
+ Darüber hinaus kann jeder Skill beliebige andere Skills voraussetzen, auch aus anderen Sets, z.B. Zweihandspezialisierung die allgemeine Waffenfertigkeit, Anstürmen die körperliche Grundfertigkeit, Schildschlag-Schaden die Schildgrundfertigkeit; alle Voraussetzungen müssen erfüllt sein (eine Oder-Gruppe ist später möglich)
+ Die Skills bilden so einen Graphen; die Datenprüfung erkennt Kreise und unbekannte Namen, das Skillfenster zeigt die Abhängigkeiten
+ Optional `freischaltung`: Ein besonderer Skill, den man unterwegs findet, wird erst durch das Fundstück lernbar; bis dahin zeigt ihn das Skillfenster nicht. Braubücher und Rezepturen lehren eher Rezepte und Fähigkeiten als Skills
+ Alle gewöhnlichen Skills sind im Skillfenster immer sichtbar, solche mit fehlenden Voraussetzungen ausgegraut: Der Katalog ist die Grundlage zum Planen von Builds
+ Keine künstliche Begrenzung göttlicher Niveaus: Das Balancing sorgt dafür, dass pro komplettem Lauf implizit nur eine gewisse Anzahl erreichbar ist

### Kosten

+ Kosten einer Stufe in Lernpunkten: Stufentabelle × Rang, vorläufig 50, 100, 200, 350, 550 für die Stufen 1 bis 5 (1250 je Skill bei Rang 1)
+ Rang nach Tier: Grund 1, Experte 2, Meister 4, göttlich 8; einzelne Skills dürfen abweichen; ein komplettes Set kostet so rund 19 000 Lernpunkte
+ EP werden beim Eingang in Lernpunkte umgerechnet: Lernpunkte = EP × (2 × primär + sekundär) / 40, mit den Grundwerten der Eigenschaften in diesem Moment; Bruchteile bleiben stehen wie im Zeitmodell
+ Bezug ist die durchschnittliche Ninkasi (Summe 80, im Schnitt 13,3): Sie lernt zum Normalpreis; 10 und 10 lernt 25 % langsamer (Preis 133 %), 20 und 20 um die Hälfte schneller (Preis 67 %), die Spreizung zwischen bestem und schlechtestem Fall ist also etwa 2
+ Weil die Schwellen in Lernpunkten fest stehen, wirkt eine Änderung der Eigenschaften nur auf das, was danach gelernt wird: Stufen gehen nie verloren, auch nicht durch Flüche oder eine Neuverteilung
+ Die Oberfläche zeigt die Kosten in EP ("noch 120 EP bis Stufe 3"), nicht die Formel

### Anfangsbalance

+ Ziel festlegen: was eine ausgewogene Ninkasi am Ende eines Laufs erreicht haben soll, z.B. zwei Sets bis Meister und ein göttliches Niveau
+ EP-Budget messen: Der Bot zählt die EP je Ebene aus Erkundung und Bewältigtem; erste Messung mit 0.26.0 (zufällige Befehle, vorläufige Zahlen): rund 1200 EP aus Erkundung gegen rund 55 aus Gegnern in Tiefe 1, das Verhältnis ist noch festzulegen
+ Die Stufentabelle danach ausrichten, dass Budget und Ziel zusammenpassen
+ Die Spreizung der Eigenschaften (etwa 2) bleibt dabei fest
+ Alle Stellschrauben sind Regelwerte in `regeln.lernen`: Startwert, Punkte, Höchstwert, Bezugswert, Stufentabelle, Ränge, Startguthaben, Topf der Abstammungslinie

### Wirkung

+ Gleich bleibender Ertrag pro Stufe, Boni in Prozent vom Grundwert; innerhalb eines Skills addieren sich die Stufen (fünfmal 5 % sind 25 %)
+ Zwischen verschiedenen Skills multiplizieren sich die Prozente (Vorbild EVE Online): Jeder Skill liefert für seine Prozente einen einzigen `mal`-Modifikator, z.B. `mal 125` auf Stufe 5; feste Beträge (`plus`) bleiben Summen
+ Umstellbar über den Regelwert `regeln.lernen.verrechnung` (`multiplizieren` als Vorgabe, `addieren`), die Daten bleiben gleich; ein später Wechsel verlangt, die bis dahin balancierten Zahlen neu einzustellen
+ Bei Abzügen ist das Multiplizieren milder (zweimal −25 % Zeit ergibt ×0,56), exponentiell wachsen nur steigende Werte wie Schaden und Vorräte; Kampfwerte bleiben über ihren Halbwert unter 100 %
+ Ausrüstung und Zustände addieren sich weiter, `mal` nur, wo ihre Daten es ausdrücklich sagen
+ Tag-System: Fähigkeiten, Angriffe und Effekte tragen Tags, Skills wirken über Modifikatoren mit `tag` auch auf künftige Fähigkeiten, siehe Modifikatoren in [Wirkungen.md](Wirkungen.md)
+ Höhere Tiers und Stufen verändern Fähigkeiten qualitativ (z.B. Psi-Teleport nimmt ab Meister ein Ziel mit); die Fähigkeit nennt das selbst in ihrem Ausbau mit der Bedingung Skillstufe
+ Skills können auch Auslöser tragen (z.B. "bei Hinterhalt Blutung")
+ Vorläufige Idee: Nachtsicht (Sehen bei weniger Licht) und Fernsicht (größere Sichtweite) als Skills; Licht siehe [Welt.md](Welt.md), Wahrnehmung siehe [Wesen.md](Wesen.md)

### Fähigkeiten

+ Skills geben keine Fähigkeiten direkt: Sie sind Voraussetzung für Fähigkeiten, die Fähigkeit selbst kommt aus dem Dungeon
+ Quellen für Fähigkeiten (auch Psi und Magie): Schriftrollen, HACCP-Aushänge, Loot, Rezepte, Altäre (Braukessel), Händler (wandernd im Dungeon oder im Hub), Nebengottheiten
+ Der Zufall prägt den Build
+ Fundstück ohne passenden Skill: nutzbar, aber mit hohem Fehlschlagrisiko über eine Risikotabelle nach dem fehlenden Skill (Vorbild DCSS)
+ Vorschlag, noch nicht bestätigt: Ausnahmen nur für körpereigene Fähigkeiten ohne mögliches Fundstück (Kopfstoß, Bierfontäne, Rülpser)

## Erfahrungspunkte (EP)

### Freie EP

+ Freie EP aus Erkundung und Rätseln, die Spielerin verteilt sie selbst
+ Erkundung: 1 EP pro Feld, das zum ersten Mal wirklich gesehen wird
+ Magisch kartierte Felder gelten als bekannt, bringen EP aber erst beim wirklichen Sehen
+ Jedes Rätsel bringt seine EP nur einmal
+ Freie EP lassen sich sparen, etwa bis entscheidende Fundstücke auftauchen
+ Freie EP lassen sich jederzeit verteilen, das Lernen kostet keine Spielzeit; Orte, an die das Verteilen gebunden ist (Altar, Hub), kommen vielleicht später, ein Schalter in den Regeln hält das offen

### Gebundene EP

+ Gebundene EP gibt nur Bewältigtes, das es je Ebene endlich oft gibt: besiegte Gegner, entschärfte Fallen, geöffnete Schlösser, ein Rezept beim ersten Gelingen, ein Hinterhalt; jedes davon trägt in den Daten einen festen Wert `ep`
+ Die Anwendung selbst bringt keine EP, sie bestimmt, wohin die EP fließen; so bleibt die Menge je Ebene begrenzt und Farmen an harmlosen Zielen bringt nichts
+ Jedes Wesen führt ein Beitragsbuch: welche Lernanlässe Ninkasi an ihm hatte (Wirkung mit den Tags von Angriff, Fähigkeit und Effekt, dazu Ausweichen, Blocken, Rüstung und erlittener Schaden für passive Skills)
+ Gewichtung vorerst nach der ersten erfolgreichen Anwendung: Jeder Lernanlass zählt je Gegner einmal; als Regelwert `regeln.lernen.gewichtung` (`erste`, später zum Vergleich `anteil` nach Schadensanteil)
+ Beim Tod des Gegners teilen sich seine EP auf die Skills auf, deren Lernanlässe im Buch stehen; passen mehrere Skills zum selben Anlass, wird gleich geteilt
+ Stirbt der Gegner durch eine Falle oder eine Verbündete, zählt das Buch trotzdem, sobald Ninkasi beigetragen hat
+ Beschworene Ninkasis lernen für sie: Ihre Wirkung zählt wie Ninkasis eigene, mit dem Tag `beschworen`, über den ein Skill der Beschwörung lernt
+ Die EP teilen sich zu gleichen Teilen auf die Einträge im Buch, je Eintrag zu gleichen Teilen auf die passenden Skills; so verdrängen viele passive Anlässe einen Angriff nicht und umgekehrt
+ Was kein Skill aufnehmen kann (gesperrt, noch nicht freigeschaltet, auf Stufe 5), wird zu freien EP; verloren geht nichts
+ Querlernen auf verwandte Skills (Vorbild: Dungeon Crawl Stone Soup): ein Skill nennt verwandte Skills und den Anteil, der ihnen zusätzlich zufließt
+ Skills ohne Bezug zu Gegnern lernen über ihre eigenen bewältigbaren Anlässe (Brauen über das erste Gelingen eines Rezepts) oder nur über freie EP
+ Ein Skill hat einen einzigen Zähler in Lernpunkten, gebundene und verteilte freie EP fließen hinein, die Stufe ergibt sich aus den Schwellen

### Begrenzung

+ Warten und Regenerieren bringen keine EP
+ Der Pegel beeinflusst das Lernen nicht
+ EP pro Ebene weitgehend begrenzt, Ausnahme: Gegner, die durch Psi erscheinen, bringen EP
+ Keine verminderten EP für schwache oder wiederholte Gegner: Weil nur Bewältigtes EP bringt, ist Farmen ohnehin eingeschränkt; jeder Gegner bringt seinen festen Wert
+ Teilende Mikroorganismen: Die Mutterzelle eröffnet einen gemeinsamen Topf für ihre ganze Abstammungslinie (vorläufig dreimal ihre EP); jede getötete Zelle bringt ihre EP, höchstens was noch im Topf ist; ist er leer, lohnt das Farmen des Essigbakterien-Pools nicht mehr
+ Nachrückende Gegner nicht ausgeschlossen, als eigenes, per Parameter einstellbares System (Rate, Obergrenze, EP-Faktor)
+ Vorschlag, noch nicht bestätigt: Varianten durch Affixe vervielfachen die Gegnertypen

## Offen

+ Ausnahmen von der Regel "keine Fähigkeiten direkt durch Skills"
+ Übersicht der Skills in der Oberfläche: Liste nach Set und Tier mit Voraussetzungen und "ermöglicht" seit 0.27.0 (siehe Fenster in [Bedienung.md](Bedienung.md)); offen sind Filter, Suche und ein Graph der Abhängigkeiten, wenn der Katalog groß ist
+ Idee, noch nicht bestätigt: zufällige besondere Skills mit zufälligen Kombinationen, als Fundstück freigeschaltet
+ Idee, noch nicht bestätigt: Zielstufe je Skill wie in DCSS, eingehende freie EP fließen von selbst dorthin (Mechanik, nicht Oberfläche)
+ Ob Fähigkeitsquellen verbraucht werden oder dauerhaft lehren, flexibel pro Quelle regelbar, später entscheiden
+ Währung bei Händlern (Gold, Alkohol, Tausch)
+ Nachrückende Gegner: ob, wie oft, mit welchem EP-Faktor
+ Skillkatalog: alle Skills mit Set, Tier, Rang, primärer und sekundärer Eigenschaft, Wirkung, Lernanlässen und Abhängigkeiten, als eigene Sitzung
+ Höhe des Abzugs je fehlendem Punkt einer Anforderung (vorläufig je 5 % auf Genauigkeit und Schaden, für die Trägerin insgesamt)
+ Katalog der Makel und ihr Punktwert
+ Eingeschränkte Neuverteilung der Eigenschaften im Lauf
+ Affixe im Detail
+ Bestiarium und Glossar (Bierbrauen, Mikroorganismen), Tonfall enzyklopädisch-ernsthaft-informativ, eigene Sitzung
