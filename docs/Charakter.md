# Battle Ninkasi - Charakter und Lernen

Stand: 2026-11-25

Mitprüfen bei Änderungen: [Wesen.md](Wesen.md), [Bedienung.md](Bedienung.md), [Grundlagen.md](Grundlagen.md), [Entwicklung.md](Entwicklung.md), [Ausblick.md](Ausblick.md), [Spielverlauf.md](Spielverlauf.md), [Skills.md](Skills.md)

Vorbilder: EVE Online als primäres Vorbild (Rang als Kostenfaktor, primäre und sekundäre Eigenschaft, Skillpunkte unabhängig vom späteren Lerntempo, Skills geben keine Fähigkeiten, sondern erlauben und verbessern, was aus Gegenständen kommt), Skyrim (klassenlos, Skills öffnen Perks, der Sprint ist angeboren), D&D und andere Tabletops (Talente und Merkmale), DCSS (EP fließen in die benutzten Skills, Kosten anzeigen statt Formel), Caves of Qud (Eigenschaften dauerhaft und vorübergehend veränderbar), Tales of Maj'Eyal und Path of Exile (Skills wirken über Tags auch auf künftige Fähigkeiten). Die Mechanik ist umgesetzt und mit ihren vorläufigen Zahlen in [Wesen.md](Wesen.md) (Skills und Lernen) beschrieben; offen sind Skillkatalog (Entwurf in [Skills.md](Skills.md), Punkt 20 in [Systemausbau.md](Systemausbau.md)), Makel und Vorzüge (Punkt 14).

## Charaktererstellung

+ Alle sechs Eigenschaften starten gleich, die Spielerin verteilt eine feste Zahl von Punkten, mit einer Obergrenze je Eigenschaft (Werte in [Wesen.md](Wesen.md), Skills und Lernen)
+ Die Charaktererstellung erscheint vor jedem Lauf als Fenster über der Karte, vorbelegt mit der letzten Verteilung (siehe Fenster in [Bedienung.md](Bedienung.md))
+ Keine festen Startskills: Ninkasi beginnt mit einem Startguthaben freier EP und verteilt es selbst
+ Makel gehören zur Charaktererstellung: Nachteil gegen zusätzliche Punkte
+ Idee, noch nicht bestätigt: Vorzüge als Gegenstück, Vorteil gegen Punkte
+ Idee, noch nicht bestätigt: Makel und Vorzüge werden vor der Punkteverteilung gewählt, die zu verteilenden Punkte ergeben sich daraus (Grundpunkte + Makel - Vorzüge); die Oberfläche rechnet sie an einer Stelle (`punkteZuVerteilen` in `src/eingabe/erstellung.js`), der Hilfetext nennt sie über Platzhalter statt einer festen Zahl
+ Beispiele für Makel: Blindheit (Sichtweite stark eingeschränkt), dysfunktionale Alkoholdehydrogenase
+ Weitere Makel, auszuarbeiten: Aldehyd-Dehydrogenase-Mangel (Acetaldehyd, Flush, Katerschaden), Zöliakie (Gerste und Weizen schaden), Gicht (Purine im Bier lösen Anfälle aus)
+ Vorschlag, noch nicht bestätigt: Makel dürfen zweischneidig sein, Nachteil mit verstecktem Vorteil
+ Vorschlag, noch nicht bestätigt: Makel geben wahlweise Eigenschaftspunkte oder EP und dürfen Eigenschaften auch unter 10 senken, für schärfere Profile

Umsetzung: teilweise, siehe [Bedienung.md](Bedienung.md), Fenster; siehe [Wesen.md](Wesen.md), Skills und Lernen; offen: Makel und Vorzüge

## Startwerte

+ LP und MP beginnen voll, mit runden Grundwerten, damit Boni in Prozent vom Grundwert glatte ganze Zahlen ergeben
+ Ninkasi startet nüchtern: LP regenerieren langsam, MP etwas unter ihrem Optimum bei leichtem Pegel, PP schwinden (Verläufe in [Grundlagen.md](Grundlagen.md))
+ Grundausstattung in jedem Lauf gleich (Vorbild Brogue): ein Dolch und ein paar Wurfwaffen, keine Rüstung; sie ist der Bezug der Machtkurve (siehe [Spielverlauf.md](Spielverlauf.md), Offen)
+ PP beginnen leer, Start- und Höchstwert noch offen
+ Der Pegel ist nach oben offen

Umsetzung: teilweise, siehe [Entwicklung.md](Entwicklung.md), Grundgerüst und Probeinhalt (Grundausstattung als Probeinhalt, bis der Inhalt entsteht)

## Eigenschaften

+ Sechs Eigenschaften: Körperlichkeit, Trinkfestigkeit, Gewandtheit, Sinnlichkeit, Klugheit, Braukunde
+ Vorbild D&D (sechs Eigenschaften), Weisheit und Intelligenz geschärft zu Lebendigem (Braukunde) und Mechanischem (Klugheit)
+ Eigenschaften haben zwei Aufgaben: Sie bestimmen das Lerntempo der Skills und sind weiche Anforderungen an Gegenstände und Fähigkeiten
+ Eigenschaften speisen keine Kampfwerte direkt; Kampfwerte, Vorräte und Stoffwechsel ändern sich über Skills aus dem Bereich der Eigenschaft (z.B. ein Skill der Trinkfestigkeit baut den Pegel schneller ab über `abbau.pegel` oder verschiebt das Optimum der LP über `kurvenverschiebung.lp`)
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
+ Skills, Schriftrollen und Items wirken auf Regeneration und Schwund über Modifikatoren, siehe Stoffwechsel in [Wesen.md](Wesen.md)

### Magie und Psi

+ Getrennte Systeme, siehe [Grundlagen.md](Grundlagen.md): Magie gebunden an Ritual, Schrift und Alchemie (MP), Psi sofort und rein geistig (PP)
+ Alchemie stellt nichts her: Getränke, Tränke und Gifte entstehen allein beim Brauen, die Alchemie steigert ihre Wirkung (siehe [Skills.md](Skills.md), Brauen)
+ Psi: primär Sinnlichkeit, sekundär meist Klugheit; die Paarungen je Set stehen in [Skills.md](Skills.md), Psi
+ Magie gehört keiner einzelnen Eigenschaft, die Paarung prägt ihren Charakter: Klugheit für Formel und Zerstörung, Braukunde für Alchemie, Gabe und Segen; die Paarungen je Set stehen in [Skills.md](Skills.md), Magie

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Skills und Lernen; offen: Neuverteilung im Lauf

## Skills

+ Skills sind keine Fähigkeiten: Zauber, Psi und Waffen profitieren in unterschiedlicher Weise von ihnen
+ So viele Skills wie möglich, Vielfalt durch qualitativ verschiedene Skills

### Aufbau

+ Skill-Sets (z.B. Zähigkeit für LP) mit bis zu vier Tiers: Grund-, Experten-, Meister-Skill, göttliches Skill-Niveau; jeder Tier ist ein eigener Skill mit eigener Wirkung; ein Set darf schon nach drei, zwei oder einem Tier enden
+ Stufen 0 bis 5 je Skill
+ Voraussetzungen innerhalb eines Sets ergeben sich aus der Regel: Experten-Skill verlangt Grundskill 3, Meister-Skill Grundskill 4 und Experte 3, göttliches Niveau Grundskill 5, Experte 4 und Meister 3
+ Darüber hinaus kann jeder Skill beliebige andere Skills voraussetzen, auch aus anderen Sets, z.B. Zweihandspezialisierung die allgemeine Waffenfertigkeit, Anstürmen die körperliche Grundfertigkeit, Schildschlag-Schaden die Schildgrundfertigkeit; alle Voraussetzungen müssen erfüllt sein (eine Oder-Gruppe ist später möglich)
+ Die Skills bilden so einen Graphen; die Datenprüfung erkennt Kreise und unbekannte Namen, das Skillfenster zeigt die Abhängigkeiten
+ Optional `freischaltung`: Ein besonderer Skill, den man unterwegs findet, wird erst durch das Fundstück lernbar; bis dahin zeigt ihn das Skillfenster nicht. Braubücher und Rezepturen lehren eher Rezepte und Fähigkeiten als Skills
+ Alle gewöhnlichen Skills sind im Skillfenster immer sichtbar, solche mit fehlenden Voraussetzungen ausgegraut: Der Katalog ist die Grundlage zum Planen von Builds
+ Für Anfänger lässt sich das Skillfenster umschalten, etwa auf das, was gerade lernbar ist; Skills späterer Epochen sind erst mit dem ersten Fund freigeschaltet (siehe [Skills.md](Skills.md), Kampf)
+ Keine künstliche Begrenzung göttlicher Niveaus: Weil die Tiefe offen ist (siehe [Spielverlauf.md](Spielverlauf.md), Kapitel), begrenzt das Balancing nicht, was ein Lauf erreicht, sondern was je Kapitel zu erwarten ist (siehe Anfangsbalance)

### Kosten

+ Kosten einer Stufe in Lernpunkten: eine Stufentabelle mal dem Rang des Skills, jede Stufe teurer als die vorige
+ Der Rang wächst mit dem Tier, jeder Tier etwa doppelt so teuer wie der vorige; einzelne Skills dürfen abweichen
+ EP werden beim Eingang in Lernpunkte umgerechnet, nach der primären Eigenschaft doppelt so stark wie nach der sekundären, mit den Grundwerten in diesem Moment; Bruchteile bleiben stehen wie im Zeitmodell
+ Bezug ist die durchschnittliche Ninkasi aus der Charaktererstellung, sie lernt zum Normalpreis; zwischen der schwächsten und der stärksten Paarung liegt etwa der Faktor zwei
+ Zahlen und Formel in [Wesen.md](Wesen.md), Skills und Lernen
+ Weil die Schwellen in Lernpunkten fest stehen, wirkt eine Änderung der Eigenschaften nur auf das, was danach gelernt wird: Stufen gehen nie verloren, auch nicht durch Flüche oder eine Neuverteilung
+ Die Oberfläche zeigt die Kosten in EP ("noch 120 EP bis Stufe 3"), nicht die Formel

### Breite und Spezialisierung

+ Spezialisierung ist merklich stärker als Breite (Vorbild EVE Online): In ihrem Feld schlägt eine spezialisierte Ninkasi eine breit gelernte klar
+ Breite heißt mehrere Spezialisierungen nebeneinander, nicht Alleskönnerin: Wer viele Skills hat, ist vielseitiger und kann zwischen seinen Spezialisierungen wählen
+ Spezialisierung lohnt am Anfang: Erst ein paar günstige Grundskills, dann früh eine Richtung, oft angestoßen durch ein Fundstück
+ Mit der Tiefe wird eine zweite Spezialisierung nebenbei leichter, weil die unteren Tiers im Verhältnis zu den EP der Tiefe billig werden: Das gute Schwert, das auf einer frühen Ebene neben dem Dolch nicht lohnte, ist später schnell gelernt, und es muss dann sofort nützlich sein
+ Eine Spezialisierung bis ins göttliche Niveau ist die stärkste in ihrem Feld, engt aber Flexibilität ein
+ Zeigen Simulation und Arena, dass es stärker ist, die EP immer in den gerade billigsten Skill zu stecken, als sich zu spezialisieren, wird zugunsten der Spezialisierung nachgeregelt

### Anfangsbalance

+ Ziel der ersten Ebene: Startguthaben, Bewältigtes, Wissen und die Tiefen-EP beim Abstieg in die zweite Tiefe reichen zusammen für zwei Grundskills auf Stufe 5; etwa drei Viertel davon sind frei verteilbar
+ Ziel festlegen: was eine ausgewogene und eine spezialisierte Ninkasi am Ende des ersten Kapitels erreicht haben sollen (siehe [Spielverlauf.md](Spielverlauf.md), Erstes Kapitel), z.B. zwei Sets bis Meister und ein göttliches Niveau; danach je weiteres Kapitel
+ EP-Budget messen: Der Bot zählt die EP je Ebene aus Erkundung und Bewältigtem (Messwerte in [Entwicklung.md](Entwicklung.md), Messwerte); das Verhältnis ist noch festzulegen; der räumende Bot misst das gründliche Spiel (alles erkundet, alle Gegner besiegt) als Obergrenze; vorgesehen ist dazu eine eilige Strategie (zielstrebig zur Treppe) als Untergrenze, damit die Spanne zwischen gründlichem und eiligem Spiel sichtbar wird
+ Die Stufentabelle danach ausrichten, dass Budget und Ziel zusammenpassen
+ Die Spreizung der Eigenschaften (siehe Kosten) bleibt dabei fest
+ Alle Stellschrauben sind Regelwerte in `regeln.lernen`: Startwert, Punkte, Höchstwert, Bezugswert, Stufentabelle, Ränge, Startguthaben, Topf der Abstammungslinie

### Wirkung

+ Gleich bleibender Ertrag pro Stufe, Boni in Prozent vom Grundwert; innerhalb eines Skills addieren sich die Stufen
+ Zwischen verschiedenen Skills multiplizieren sich die Prozente (Vorbild EVE Online): Jeder Skill liefert für seine Prozente einen einzigen `mal`-Modifikator; feste Beträge (`plus`) bleiben Summen
+ Umstellbar über den Regelwert `regeln.lernen.verrechnung` (`multiplizieren` als Vorgabe, `addieren`), die Daten bleiben gleich; ein später Wechsel verlangt, die bis dahin balancierten Zahlen neu einzustellen
+ Bei Abzügen ist das Multiplizieren milder als das Addieren, exponentiell wachsen nur steigende Werte wie Schaden und Vorräte; Kampfwerte bleiben über ihren Halbwert unter 100 %
+ Ausrüstung und Zustände addieren sich weiter, `mal` nur, wo ihre Daten es ausdrücklich sagen
+ Tag-System: Fähigkeiten, Angriffe und Effekte tragen Tags, Skills wirken über Modifikatoren mit `tag` auch auf künftige Fähigkeiten, siehe Modifikatoren in [Wirkungen.md](Wirkungen.md)
+ Höhere Tiers und Stufen verändern Fähigkeiten qualitativ (z.B. Psi-Teleport nimmt ab Meister ein Ziel mit); die Fähigkeit nennt das selbst in ihrem Ausbau mit der Bedingung Skillstufe
+ Skills können auch Auslöser tragen (z.B. "bei Hinterhalt Blutung")
+ Nachtsicht (weiter sehen im Finstern) und Fernsicht (größere Sichtweite) als Skills; die Mechanik dafür steht, siehe Licht in [Welt.md](Welt.md) und Wahrnehmung in [Wesen.md](Wesen.md)

### Fähigkeiten

+ Skills geben nie Fähigkeiten (entschieden 2026-11-24): Sie sind Voraussetzung für Fähigkeiten, machen sie wirksamer und erweitern sie in Ausbaustufen; die Fähigkeit selbst kommt aus der Welt
+ Quellen für Fähigkeiten (auch Psi und Magie): Lehrer, Schriftrollen, Keilschrifttafeln, HACCP-Aushänge, Loot, Rezepte, Altäre (Braukessel), Händler (wandernd im Dungeon oder im Hub), Nebengottheiten
+ Je Quelle festgelegt, ob sie lehrt oder nur gewährt: ein Lehrstück lehrt dauerhaft und ist meist verbraucht, ein Braubuch bleibt; angelegte Ausrüstung gewährt, solange sie angelegt ist (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Der Zufall prägt den Build
+ Fundstück ohne passenden Skill: nutzbar, aber mit hohem Fehlschlagrisiko über eine Risikotabelle nach dem fehlenden Skill (Vorbild DCSS)
+ Angeboren sind nur wenige Grundfähigkeiten, mit Vorsicht gewählt: körperliche, die jede Ninkasi kann (Faustschlag, Werfen, siehe [Skills.md](Skills.md), Kampf), die Gaben der Göttin, die Zeit und Material statt eines Vorrats kosten (Brauen und Mälzen, siehe [Skills.md](Skills.md), Brauen), und höchstens eine je Vorrat; die erste solche ist der Sprint, den jede Ninkasi hat, wie wirksam und sparsam sie ihn einsetzt, bestimmen ihre Skills (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo); eine spätere Fähigkeit aus der Welt kann ihn erweitern, etwa aus einer Betäubung heraus loszusprinten; die zweite ist das Meditieren für die MP (siehe [Skills.md](Skills.md), Magie), die dritte das Zeitblinzeln für die PP (siehe [Skills.md](Skills.md), Psi)

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Skills und Lernen; offen: Skillkatalog, siehe [Systemausbau.md](Systemausbau.md), Punkt 20

## Erfahrungspunkte (EP)

### Freie EP

+ Freie EP aus Fortschritt und Wissen, die Spielerin verteilt sie selbst; dazu der freie Anteil der EP aus Bewältigtem (siehe Gebundene EP); Vorbilder Sil (Erfahrung für den Abstieg, die erste Begegnung mit einer Gegnerart und das Erkennen von Gegenständen) und Caves of Qud (Erfahrung für entdeckte Orte)
+ Tiefe: das erste Betreten einer neuen Tiefe bringt einen festen Betrag, der mit der Tiefe wächst; es zählt das Betreten, nicht der Weg dorthin, auch ein Sturz
+ Wissen: das erste Mal im Lauf bringt EP, wenn Ninkasi eine Wesenart sieht, einen Gegenstand erkennt, eine Zutat oder Kultur kennt oder einen besonderen Ort findet (Brauraum, Schrein, Geheimtür); jede Sache einmal
+ Rätsel: jedes Rätsel bringt seine EP nur einmal; Rätsel löst die Spielerin, kein Skill löst sie für sie (siehe [Skills.md](Skills.md), Anlagen und Fallen)
+ Das Erkunden selbst bringt keine EP: mit dem Auto-Erkunden wäre das Ablaufen jeder Ecke Pflicht statt Entscheidung, und die Menge hinge an der Größe der Karte; so lohnt das gründliche Spiel über Gegner, Wissen und Funde, das eilige über die Tiefe
+ Freie EP lassen sich sparen, etwa bis entscheidende Fundstücke auftauchen
+ Freie EP lassen sich jederzeit verteilen, das Lernen kostet keine Spielzeit; Orte, an die das Verteilen gebunden ist (Altar, Hub), kommen vielleicht später, ein Schalter in den Regeln hält das offen

### Gebundene EP

+ Gebundene EP gibt nur Bewältigtes, das es je Ebene endlich oft gibt: besiegte Gegner, kampflos bewältigte Wesen (überredet, eingeschüchtert, verführt, unter den Tisch getrunken, gezähmt, bekehrt; je Wesen einmal, siehe [Skills.md](Skills.md), Soziales), entschärfte Fallen, geöffnete Schlösser, ein gefundenes Rezept beim ersten Gelingen (Hausrezepte nicht, siehe [Skills.md](Skills.md), Brauen), ein Hinterhalt; jedes davon trägt in den Daten einen festen Wert `ep`
+ Die Anwendung selbst bringt keine EP, sie bestimmt, wohin die EP fließen; so bleibt die Menge je Ebene begrenzt und Farmen an harmlosen Zielen bringt nichts
+ Nur ein Anteil der EP eines Bewältigten ist gebunden, der Rest kommt sofort als freie EP: die Anwendung lenkt, aber eine neue Richtung des Builds bleibt machbar; der Anteil ist ein Regelwert (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Jedes Wesen führt ein Beitragsbuch: welche Lernanlässe Ninkasi an ihm hatte (Wirkung mit den Tags von Angriff, Fähigkeit und Effekt, dazu Ausweichen, Blocken, Rüstung nach ihrer Art und erlittener Schaden für passive Skills, Entkommen für die Skills der Bewegung, Berauscht für die Skills des Stoffwechsels, Erspäht nach der Art des Wahrnehmens und Hinterhalt für die Skills der Wahrnehmung, Kritisch für die Präzision)
+ Gewichtung vorerst nach der ersten erfolgreichen Anwendung: Jeder Lernanlass zählt je Gegner einmal; als Regelwert `regeln.lernen.gewichtung` (`erste`, später zum Vergleich `anteil` nach Schadensanteil)
+ Beim Tod des Gegners oder wenn Ninkasi ihn kampflos bewältigt, teilen sich seine EP auf die Skills auf, deren Lernanlässe im Buch stehen; passen mehrere Skills zum selben Anlass, wird gleich geteilt
+ Stirbt der Gegner durch eine Falle oder eine Verbündete, zählt das Buch trotzdem, sobald Ninkasi beigetragen hat
+ Beschworene Ninkasis lernen für sie: Ihre Wirkung zählt wie Ninkasis eigene, mit dem Tag `beschworen`, über den ein Skill der Beschwörung lernt
+ Die EP teilen sich zu gleichen Teilen auf die Einträge im Buch, je Eintrag zu gleichen Teilen auf die passenden Skills; so verdrängen viele passive Anlässe einen Angriff nicht und umgekehrt
+ Was kein Skill aufnehmen kann (gesperrt, noch nicht freigeschaltet, auf Stufe 5), wird zu freien EP; verloren geht nichts
+ Querlernen auf verwandte Skills (Vorbild: Dungeon Crawl Stone Soup): ein Skill nennt verwandte Skills und den Anteil, der ihnen zusätzlich zufließt
+ Skills ohne Bezug zu Gegnern lernen über ihre eigenen bewältigbaren Anlässe (Brauen über das erste Gelingen eines Rezepts, Kennerschaft über jeden erkannten Typ, Fallengespür über einen Teil der EP jeder entdeckten Falle) oder nur über freie EP
+ Ein Skill hat einen einzigen Zähler in Lernpunkten, gebundene und verteilte freie EP fließen hinein, die Stufe ergibt sich aus den Schwellen

### Begrenzung

+ Warten und Regenerieren bringen keine EP
+ Der Pegel beeinflusst das Lernen nicht
+ EP pro Ebene weitgehend begrenzt, Ausnahme: Gegner, die durch Psi erscheinen, bringen EP
+ Keine verminderten EP für schwache oder wiederholte Gegner: Weil nur Bewältigtes EP bringt, ist Farmen ohnehin eingeschränkt; jeder Gegner bringt seinen festen Wert
+ Teilende Mikroorganismen: die ganze Abstammungslinie einer Mutterzelle teilt einen begrenzten Topf an EP; ist er leer, lohnt das Farmen nicht mehr (siehe [Wesen.md](Wesen.md), Skills und Lernen; die Teilung selbst siehe [Wirkungen.md](Wirkungen.md), Effektsystem)
+ Nachrückende Gegner sind nicht ausgeschlossen, mit eigenem EP-Faktor (Idee in [Ausblick.md](Ausblick.md), Nachrückende Gegner)
+ Vorschlag, noch nicht bestätigt: Varianten durch Affixe vervielfachen die Gegnertypen

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Skills und Lernen; offen: Wissens-EP für besondere Orte (mit dem Ebenenbau), Entkommen, Berauscht, Erspäht, Hinterhalt, Kritisch, erkannte Typen, entdeckte Fallen, nachrückende Gegner, Rätsel

## Offen

+ Übersicht der Skills in der Oberfläche: Liste nach Set und Tier mit Voraussetzungen und "ermöglicht" (siehe Fenster in [Bedienung.md](Bedienung.md)); offen sind Filter, Suche und ein Graph der Abhängigkeiten, wenn der Katalog groß ist
+ Idee, noch nicht bestätigt: zufällige besondere Skills mit zufälligen Kombinationen, als Fundstück freigeschaltet
+ Idee, noch nicht bestätigt: Zielstufe je Skill wie in DCSS, eingehende freie EP fließen von selbst dorthin (Mechanik, nicht Oberfläche)
+ Skillkatalog: alle Skills mit Set, Tier, Rang, primärer und sekundärer Eigenschaft, Wirkung, Lernanlässen und Abhängigkeiten, als eigene Sitzung; Entwurf in [Skills.md](Skills.md)
+ Höhe des Abzugs je fehlendem Punkt einer Anforderung (vorläufiger Wert in [Wesen.md](Wesen.md), Skills und Lernen)
+ Katalog der Makel und ihr Punktwert
+ Eingeschränkte Neuverteilung der Eigenschaften im Lauf
+ Affixe im Detail
