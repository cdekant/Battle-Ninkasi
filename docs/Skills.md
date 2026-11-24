# Battle Ninkasi - Skills

Stand: 2026-11-24, Entwurf; entsteht Kategorie für Kategorie ([Systemausbau.md](Systemausbau.md), Punkt 20)

Mitprüfen bei Änderungen: [Charakter.md](Charakter.md), [Wesen.md](Wesen.md), [Welt.md](Welt.md), [Gegenstaende.md](Gegenstaende.md)

Dieses Designdokument ist der Skillkatalog im Entwurf, die Vision eines tiefen Skillsystems für Ninkasi. Die Regeln des Systems (Aufbau, Kosten, Wirkung, Fähigkeiten) stehen in [Charakter.md](Charakter.md), Skills.

Form: Die Kategorien ordnen nach Themen, nicht nach Eigenschaften. Jedes Set nennt seine primäre und sekundäre Eigenschaft, woraus es lernt und was seine Tiers bewirken; ein Set hat einen bis vier Tiers. Die Wirkungen stehen in Worten und Verhältnissen; geratene Zahlen stehen als Probewerte in [Systemausbau.md](Systemausbau.md), Punkt 20, bis der Skill umgesetzt ist, danach im Probeinhalt (siehe [Entwicklung.md](Entwicklung.md), Grundgerüst und Probeinhalt). Alle Wirkungen sind erste Einschätzungen und werden in Arena und Simulation balanciert.

## Vorbilder

+ Die Vorbilder des Skillsystems stehen in [Charakter.md](Charakter.md), vorne; das primäre ist EVE Online

## Körper und Bewegung

### Zähigkeit

+ Eigenschaften: Körperlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: erlittenem Schaden
+ Mehr LP, über alle Tiers bis etwa das Dreifache des Startwerts
+ Die Regeneration der LP gehört zur Rauschheilung (siehe Stoffwechsel und Pegel), als Versuch

### Laufen

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: Entkommen
+ Bewegen wird schneller: Ninkasi beginnt etwa ein Fünftel langsamer als ein normal schnelles Wesen, die unteren Tiers holen das auf, die oberen machen sie schneller als normal schnelle Wesen (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo)

### Sprint

+ Eigenschaften: Gewandtheit, sekundär Trinkfestigkeit
+ Lernt aus: Entkommen
+ Verbessert die angeborene Grundfähigkeit: stärker, länger, kürzere Abklingzeit, weniger Mehrverbrauch des Stoffwechsels; welcher Tier was bewirkt, ist offen

### Tragen

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: nur freien EP
+ Mehr Tragkraft, über alle Tiers etwa das Doppelte; die Last bremst weniger, bei voller Spezialisierung etwa halb so stark

### Leichte Rüstung

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: Rüstung, wenn ein leichtes Stück den Schaden mindert
+ Gefühltes Gewicht und Verlangsamung sinken; bei voller Spezialisierung bremst leichte Rüstung kaum noch
+ Der Abzug aufs Ausweichen sinkt, bei voller Spezialisierung fast auf null

### Schwere Rüstung

+ Eigenschaften: Körperlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Rüstung, wenn ein schweres Stück den Schaden mindert
+ Gefühltes Gewicht und Verlangsamung sinken; bei voller Spezialisierung bremst schwere Rüstung spürbar weniger, aber nie gar nicht
+ Der Abzug aufs Ausweichen sinkt nur etwas; so bleibt die Wahl zwischen Panzern und Ausweichen (Vorbild Caves of Qud)

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Skills und Lernen; offen: Lernanlass Entkommen, Laufen, Sprint, Tragen, Rüstungsskills, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Stoffwechsel und Pegel

Die Kategorie hält alle Skills, die den Stoffwechsel verändern: Abbau des Pegels, Strafen des Rauschs, die Kurven der Regeneration aller drei Vorräte und die Abwehr gegen das, was im Körper wirkt. Magie und Psi verweisen für ihre Vorräte hierher. Wer im Rausch kämpft, lernt daraus (Lernanlass Berauscht).

### Leber

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: nur freien EP, Trinken ist nichts Bewältigtes
+ Der Pegel baut schneller ab, über alle Tiers etwa doppelt so schnell; zweischneidig und bewusst einfach: hilft Magie, schadet Psi, ob man sie lernt, entscheidet der Build
+ Zwei Tiers

### Standfestigkeit

+ Eigenschaften: Trinkfestigkeit, sekundär Gewandtheit
+ Lernt aus: Berauscht
+ Mildert die Strafen des Rauschs (Torkeln, Fehlschläge, Filmriss), ohne die Schwellen zu verschieben; so bleibt, was an den Schwellen hängt (Mindestpegel, Regeneration der PP), wo es ist, und der Rausch wird nur weniger gefährlich
+ Wirkung hängt an den Pegelschwellen mit Wirkung ([Systemausbau.md](Systemausbau.md), Punkt 10)

### Rauschheilung

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: Berauscht
+ Das Optimum der Regeneration der LP wandert zu höherem Pegel, höhere Tiers heben auch die Rate; ob hier auch die Regeneration im Kampf hingehört, klärt die Sitzung über Regeneration ([Systemausbau.md](Systemausbau.md), Punkt 10)

### Klarer Kopf

+ Eigenschaften: Klugheit, sekundär Trinkfestigkeit
+ Lernt aus: Berauscht
+ MP regenerieren auch bei mittlerem Pegel noch gut, die Kurve wandert zu höherem Pegel; erleichtert Mischbuilds aus Magie und Rausch

### Rauschgeist

+ Eigenschaften: Sinnlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Berauscht
+ PP schwinden bei niedrigem Pegel weniger, bei hohem regenerieren sie schneller; ein höherer Tier lässt die Regeneration schon bei niedrigerem Pegel beginnen

### Abwehr

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: erlittenem Schaden durch Gift und Alkohol
+ Mehr Widerstand gegen Gift und Alkohol, später gegen Infektion, sobald es sie als Zustand gibt; nie volle Immunität (siehe Kampf, Verteidigung)
+ Widerstand gegen äußere Schadensarten gehört zu Kampf, Verteidigung, gegen Magie und Psi in die eigenen Kategorien; mehr Schaden einer Art gehört zu dem, der ihn austeilt

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Wahrnehmung

Die Kategorie hält die eigenen Sinne der Göttin: Sehen, Spüren und Hören in der Nähe, nie durch Wände, dazu Fallen entdecken, Unbekanntes erkennen und als Gegenstück das Schleichen. Orten über Entfernung und durch Wände, Hellsicht und Telepathie sind Fähigkeiten aus der Welt und gehören zu Magie und Psi. Wer Gefahr früh wahrnimmt, lernt daraus (Lernanlass Erspäht: ein Wesen wahrgenommen, bevor es Ninkasi bemerkt hat; die Art des Wahrnehmens entscheidet, welcher Skill lernt).

### Fernsicht

+ Eigenschaften: Sinnlichkeit, sekundär Gewandtheit
+ Lernt aus: Erspäht in der Ferne
+ Ninkasi beginnt knapp unter der Sichtweite eines gewöhnlichen Gegners und wird zuerst gesehen; schon wenige Grundstufen drehen das um, mit vertretbarem Aufwand sieht sie etwa doppelt so weit wie ein gewöhnlicher Gegner (siehe [Grundlagen.md](Grundlagen.md), Licht und Wahrnehmung)
+ Darüber bringt mehr Reichweite wenig, weil nur Beleuchtetes zu sehen ist; der göttliche Tier spezialisiert anders: Werte und Ausrüstung eines Wesens auf volle Sichtweite erkennen, weniger Abzug im Fernkampf auf große Entfernung
+ Querlernen zum Fernkampf

### Nachtsicht

+ Eigenschaften: Sinnlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Erspäht im Finstern
+ Ninkasi sieht im Finstern weiter, auf dem göttlichen Tier etwa halb so weit wie im Licht, nie ganz; das Licht behält seinen Wert

### Dämmersicht

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: Erspäht im Dunkeln
+ Ninkasi sieht auf dämmrigen und dunklen Feldern weiter, bis sie sie wie helle sieht
+ Setzt voraus, dass auch diese Lichtstufen die Sichtweite begrenzen; heute verbirgt nur die finstere (offen in [Systemausbau.md](Systemausbau.md), Punkt 20)

### Gespür für Wesen

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: Erspäht durch Spüren
+ Ninkasi spürt Wesen in der Nähe ohne Licht und durch Rauch, entlang von allem, was offen ist, wie die Wesen, die schon spüren
+ Zwei Tiers

### Gespür für Schätze

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: nur freien EP, ein gespürter Gegenstand ist nichts Bewältigtes
+ Ninkasi spürt Gegenstände in der Nähe, entlang von allem, was offen ist
+ Ein oder zwei Tiers

### Gespür für Magie

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: nur freien EP
+ Ninkasi spürt Gegenstände und Wesen mit magischen Wirkungen in der Nähe, entlang von allem, was offen ist
+ Ein oder zwei Tiers

### Lauschen

+ Eigenschaften: Sinnlichkeit, sekundär Gewandtheit
+ Lernt aus: Erspäht durch Hören
+ Die Richtung eines Geräuschs kennt Ninkasi ohne Skill; die Tiers machen das Hören genauer: weiter hören, die Art erkennen ("ein Ork"), die Anzahl ("zwei Orks"), zuletzt gehörte Wesen kurz auf der Karte
+ Lohnt erst, wenn auch Schritte leisen Lärm machen

### Fallengespür

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: entdeckten Fallen; das Entdecken bringt einen Teil der EP einer Falle, das Entschärfen den Rest (siehe Anlagen und Fallen)
+ Fallen werden öfter und aus größerer Entfernung entdeckt

### Kennerschaft

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: jedem erkannten Typ, je Typ einmal, auch beim Erkennen durch Trinken und Benutzen
+ Unbekanntes wird schneller erkannt; ein höherer Tier erkennt beim Aufheben schon die Art ("ein Fluch liegt darauf"), bevor der Typ bekannt ist
+ Sehen, was in einem Stück steckt: Verschleiß, Haltbarkeit, verborgene Eigenschaften und Affixe genauer
+ Pflegen: Waffen und Rüstung nutzen sich langsamer ab, Gegenstände verderben langsamer; einer der wirksamen Wege, Ausrüstung in Schuss zu halten (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Die Wirksamkeit im Gebrauch hebt Kennerschaft nicht, sie gehört den Skills der Waffen und Rüstungen; ein höherer Tier darf verborgene Stärken eines Stücks wecken, die erst wirken, wenn es erkannt ist
+ Später auch für Anlagen: unbekannte Anlagen tragen ein Etikett, Kennerschaft senkt das Risiko des ersten Inbetriebnehmens (mit Anlagen und Fallen)

### Schleichen

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: Hinterhalt
+ Ninkasi wird später bemerkt (Heimlichkeit); ein höherer Tier hinterlässt weniger Duft, Jäger verlieren ihre Spur früher
+ Heimlichkeit ist ein Wert jedes Wesens, Gegner tragen ihn fest in ihren Daten; Fähigkeiten wie "im Schatten verstecken" kommen aus der Welt, Schleichen ist ihre Voraussetzung und macht sie wirksamer

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Wahrnehmung (Sichtweite, Sicht im Finstern, Spüren, Heimlichkeit als Werte mit Modifikatoren), [Welt.md](Welt.md), Gelände (Entdecken) und [Gegenstaende.md](Gegenstaende.md), Unbekanntes (Kennerschaft); offen: alle Skills, Lernanlässe Erspäht und Hinterhalt, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Kampf

Die breiteste Kategorie, in sechs Unterkategorien: Verteidigung, waffenloser Kampf, Nahkampf mit Waffen, Handhabung, Fernkampf, Schilde, dazu Präzision für alles, was trifft. Vorbilder: DCSS (ein Skill je Waffengattung), EVE Online (Grundskill, Waffensystem, Spezialisierung je Typ), Tales of Maj'Eyal (Kampfstile wie Zweihand oder Schild). Rüstung gehört zu Körper und Bewegung, Willenskraft zu Psi.

Gattungen ordnen nach ihrem Prinzip, nicht nach der Epoche: Spätere Waffen (Steampunk, Motoren, Schusswaffen, Science-Fiction, siehe [Spielverlauf.md](Spielverlauf.md), Epochen und Wertschöpfungskette) passen im Nahkampf in dieselben Gattungen und zeigen ihre Epoche über Schadensart und Spezialisierung; im Fernkampf ändert die Epoche die Mechanik und bekommt eigene Gattungen. Gattungen späterer Epochen werden erst mit dem ersten Fund einer solchen Waffe lernbar, damit ein Lauf in Sumer keine Laser-Skills zeigt.

Muster der Tiers einer Gattung, einzelne Sets weichen ab: Grund Genauigkeit, Experte Schaden, Meister Tempo (geringere Kosten des Angriffs), göttlich qualitativ und je Gattung eigen. Waffen tragen Tags für Gattung und Handhabung, über die sie wirken und lernen. Fähigkeiten wie Kopfstoß, Festhalten, Anstürmen, Rundumschlag oder Schildschlag kommen aus der Welt; die Skills sind ihre Voraussetzung und machen sie wirksamer.

Wehrlos: Ein Gegner, der betäubt, gefesselt oder umgeworfen ist, wird sicher und ohne Blocken getroffen, aber nicht von selbst kritisch; der Hinterhalt gegen Ahnungslose bleibt wehrlos und kritisch. Skills dürfen gegen Wehrlose stärker machen. Wer festgehalten wird, ist nicht wehrlos: Er kann sich nicht bewegen und weicht schlechter aus, wehrt sich aber noch (siehe Waffenloser Kampf, Ringen).

### Verteidigung

Jede Schadensart hat ihre Abwehr an genau einer Stelle: Stumpf und Schnitt Rüstung und Zähigkeit (Körper und Bewegung), Gift und Alkohol Abwehr (Stoffwechsel und Pegel), Feuer, Säure, Lauge und Elektrisch die Abhärtung hier, Magie und Psi in ihren Kategorien; neue Schadensarten späterer Epochen (etwa Kälte, Strahlung) bringen ihr eigenes Set mit. Skills geben nie volle Immunität: Spezialisierung, Gegenstände, Buffs und Fähigkeiten nähern den Widerstand zusammen einer Obergrenze, die nur sehr schwer zu erreichen ist; Skills allein tragen etwa die Hälfte. Angeborene Immunität von Gegnern ist Gegnerdesign und bleibt.

#### Ausweichen

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: jedem Angriff, dem Ninkasi ausweicht
+ Grund: mehr Ausweichen
+ Experte: gegen Flächen und Explosionen bleibt Ninkasi bei gelungenem Rettungswurf ganz ohne Schaden statt mit halbem (Vorbild Evasion in D&D)
+ Meister: mehr Ausweichen gegen Geschosse
+ Göttlich: Ausweichschritt, nach einem Ausweichen im Nahkampf tritt Ninkasi ohne Zeit auf ein freies Feld vom Angreifer weg; bricht Umzingelungen
+ Der Abzug der Rüstung aufs Ausweichen gehört den Rüstungsskills (siehe Körper und Bewegung)

#### Reaktion

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: erlittenem Schaden durch Fallen
+ Grund: Rettungswurf gegen ausgelöste Fallen
+ Experte: weniger Schaden durch Fallen
+ Meister: Rettungswurf auch gegen andere Überraschungen, etwa herabfallende Steine oder einen Angriff aus dem Verborgenen
+ Göttlich: beim Auslösen springt Ninkasi auf ein Nachbarfeld, die Falle verpufft
+ Querlernen zu Fallenstellen und Entschärfen (siehe Anlagen und Fallen)

#### Parieren

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: jedem Blocken mit einer Waffe
+ Mit einer Nahkampfwaffe in der Hand blockt Ninkasi manchmal einen Nahkampfangriff, nie ein Geschoss; Klingen und Stangen bekommen so eine Rolle in der Verteidigung, auch ohne Schild
+ Meister: Riposte, nach einem Parieren schlägt Ninkasi mit einer Chance zurück, die mit jeder Stufe steigt; sie kostet keine Zeit, auf eine Riposte folgt keine weitere
+ Göttlich: höhere Chance der Riposte
+ Die Riposte ist ein Auslöser am Skill, eine passive Reaktion ohne eigenen Befehl; eine Fähigkeit aus der Welt wie eine Konterhaltung (für einige Züge kontert jedes Parieren) ist die aktive Fassung, Parieren ihre Voraussetzung

#### Abhärtung

+ Hitze: Feuer; Körperlichkeit, sekundär Trinkfestigkeit
+ Ätzendes: Säure und Lauge, das Brauereithema Reinigungsmittel; Körperlichkeit, sekundär Braukunde
+ Strom: Elektrisch; Körperlichkeit, sekundär Gewandtheit
+ Je zwei bis drei Tiers, jedes lernt aus erlittenem Schaden seiner Art

### Waffenloser Kampf

Die Faust ist, was bleibt, wenn die Waffe bricht, und sie soll bis in die Tiefe mithalten: Fäuste wachsen nicht mit der Tiefe wie Fundstücke, das gleichen kräftige Skills und Waffen für die Faust aus (Vorbild der waffenlose Kampf in DCSS, der spät mit Waffen mithält). Waffen für die Faust tragen den Tag `waffenlos` und bleiben so Faustkampf, durch die Epochen: Cestus, Schlagring, Krallenhandschuh, Dampffaust, Energiehandschuh; manche sind extrem schnell und schlagen viel öfter als jede Waffe.

#### Faustkampf

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: Wirkung mit dem Tag `waffenlos`
+ Die nüchterne Technik, das Boxen
+ Grund: Genauigkeit
+ Experte: Schaden, kräftig steigend
+ Meister: Kombination, mit einer Chance folgt ein zweiter Schlag; der Skill baut den angeborenen Angriff aus, er gibt keine Fähigkeit
+ Göttlich: die Faust der Göttin ignoriert einen Teil der Rüstung
+ Voraussetzung für den Kopfstoß, eine Fähigkeit aus der Welt (kurz betäubend, mit einer Chance auf Rückschlag gegen Ninkasi selbst)

#### Trunkene Faust

+ Eigenschaften: Gewandtheit, sekundär Trinkfestigkeit
+ Lernt aus: Berauscht mit dem Tag `waffenlos`
+ Was der Pegel sonst bestraft, wird im waffenlosen Kampf zum Vorteil, Gegenstück zur Standfestigkeit; der Faustkampf schlägt öfter, die Trunkene Faust weicht aus und wirft
+ Grund: Torkeln gibt Ausweichen, je höher der Pegel, desto mehr
+ Experte: Tritt, der waffenlose Angriff bekommt mit einer Chance einen zweiten, der zurückstößt; der Skill baut den angeborenen Angriff aus, er gibt keine Fähigkeit
+ Meister: Gegenwurf, weicht Ninkasi einem Nahkampfangriff aus, wirft sie den Angreifer mit einer Chance um, er ist dann wehrlos
+ Göttlich: im Rausch wird die Strafe des Pegels für waffenlose Angriffe zum Bonus

#### Ringen

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: Wirkung mit dem Tag `ringen`
+ Voraussetzung für Fähigkeiten aus der Welt: Festhalten (das Ziel kann sich nicht bewegen und weicht schlechter aus) und Griffe, die nur gegen ein festgehaltenes Ziel gehen und es danach wieder freigeben: Gegner werfen (ein Feld weit, danach umgeworfen und damit wehrlos), Würgen, ein Kopfstoß mit mehr Wirkung
+ Tiers: Chance und Dauer des Festhaltens, Schaden und Weite der Griffe, zuletzt auch große Wesen halten (braucht eine Größe der Wesen)

### Nahkampf mit Waffen

Drei Schichten: Nahkampf allgemein, vier Gattungen, Spezialisierungen je Waffentyp. Was eine einzelne Waffe besonders macht (schnell oder langsam, Reichweite, Rüstung durchschlagen, schwer zu blocken, trifft alle Nachbarn), tragen ihre Daten; eine Axt ist so eine Klinge mit dem Zielmuster angrenzend, ein Flegel eine Wuchtwaffe, die sich nicht blocken lässt. Zweihändig ist keine Gattung, sondern Handhabung. Ein Stich mit dem Dolch lernt Nahkampf, kurze Klingen, Dolch und die Handhabung, die EP teilen sich gleich.

#### Nahkampf allgemein

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: Wirkung mit dem Tag `nahkampf`
+ Zwei Tiers: Grund Genauigkeit, Experte etwas Schaden für alles im Nahkampf
+ Voraussetzung für jede Gattung; die Tiefe liegt in den Gattungen, die allgemeine Fertigkeit bleibt billig

#### Gattungen

Muster: Grund Genauigkeit, Experte Schaden, Meister Tempo, göttlich wie bei der Gattung.

+ Kurze Klingen: Gewandtheit, sekundär Sinnlichkeit; schnell, Krit, Hinterhalt, die Meuchelmörderin; Hopfenmesser, Dolch, Sichel, später Vibromesser; göttlich mehr Krit gegen Wehrlose und Ahnungslose, zusammen mit Wurf und Betäubung eine eigene Kette
+ Lange Klingen: Gewandtheit, sekundär Körperlichkeit; Schaden, Parieren, die Fechterin; Schwert, Säbel, Zweihänder (mit Zweihand), später Kettensäge; göttlich lässt ein Krit bluten; Querlernen zum Parieren
+ Wuchtwaffen: Körperlichkeit, sekundär Trinkfestigkeit; stumpf, langsam, viel Schaden, die Brauserkerin; Schöpfkelle, Fasshammer, Streitkolben, Braupaddel, später Dampfhammer und Elektroschlagstock; göttlich betäubt ein Krit kurz, betäubt ist wehrlos
+ Stangenwaffen: Gewandtheit, sekundär Klugheit; Reichweite und Abstand halten als Taktik; Maischegabel, Speer, Hellebarde, später Bajonett und Energielanze; göttlich wird zuerst getroffen, wer in die Reichweite tritt

#### Spezialisierungen

+ Je Waffentyp ein oder zwei Tiers, wirksam nur für Waffen mit dem Tag ihres Typs
+ Voraussetzungen: der erste Tier die Gattung im Experten-Tier auf Stufe 3, der zweite die Gattung im Meister-Tier auf Stufe 3; so kommt sie früh genug, um einen Fund zu nutzen, ist aber nicht der erste Kauf
+ Jede bringt mehr Schaden und einen eigenen Kniff, etwa Dolch (mehr Kritfaktor im Hinterhalt), Braupaddel (Rundumschlag und Anstürmen stärker), Schöpfkelle (schöpft Flüssigkeit vom Boden und schleudert sie)
+ Sie entstehen mit den Waffen des Inhalts, der Katalog legt nur das Muster fest
+ Hinterhalt: Schleichen bringt Ninkasi ungesehen heran (siehe Wahrnehmung), die Waffe bestimmt, was er anrichtet (kurze Klingen, Spezialisierung Dolch); kein eigenes Set

### Handhabung

Quer zu den Gattungen: Eine Waffe lernt beide Seiten, das Braupaddel als Wuchtwaffe und als Zweihand. Die Handhabung hat ihr eigenes Muster, damit Gattung und Handhabung nicht beide Genauigkeit und Schaden geben. Vier Wahlen für die Hände: Zweihänder, zwei Waffen, Waffe und freie Hand (Fechten), Waffe und Schild (siehe Schilde). Die zweite Hand trifft schlechter, schwächer und langsamer; Zwei Waffen baut diesen Abzug ab, damit zwei Waffen eine Wahl sind und nicht einfach mehr.

#### Zweihand

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: Wirkung mit dem Tag `zweihand`
+ Grund: der Abzug fehlender Körperlichkeit sinkt, schwere Waffen werden früher führbar
+ Experte: mehr Kritfaktor, wuchtige Hiebe
+ Meister: Rundumschlag und Anstürmen werden stärker, mit kürzerer Abklingzeit
+ Göttlich: Durchschlag, was ein tödlicher Hieb an Schaden übrig hat, trifft einen Feind daneben
+ Voraussetzung für Rundumschlag und Anstürmen, Fähigkeiten aus der Welt

#### Zwei Waffen

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: Wirkung mit zwei angelegten Waffen
+ Grund: der Abzug der zweiten Hand auf die Genauigkeit sinkt
+ Experte: der Abzug auf den Schaden sinkt
+ Meister: der Abzug auf das Tempo sinkt, die Aktion kostet nicht mehr als die langsamere Waffe
+ Göttlich: nach einem Krit der einen Waffe schlägt die andere sofort noch einmal

#### Fechten

+ Eigenschaften: Gewandtheit, sekundär Klugheit
+ Lernt aus: Wirkung mit einer einzelnen Waffe in einer Hand, die andere frei
+ Mehr Genauigkeit und Parieren, solange die zweite Hand frei ist; ohne diesen Stil hätte die freie Hand keinen Wert
+ Ein höherer Tier gibt die Finte: sie senkt die Verteidigung des Ziels für den nächsten Angriff
+ Passt zu langen Klingen und Parieren, die Fechterin

### Fernkampf

Werfen ist eine angeborene Grundfähigkeit wie der Sprint: Jede Ninkasi wirft, der Skill macht es besser. Was ein Wurf oder Schuss trifft, sagt seine Zielart: ein Geschoss das erste Wesen auf der Bahn, ein Strahl alles in einer Linie, Zerplatzendes (Tränke, Flaschen) eine Fläche um den Aufschlag. Bei Flächen kommt es auf genaues Zielen weniger an: Ein Fehlwurf landet ein, zwei Felder daneben und trifft trotzdem das meiste; das Werfen macht die Streuung kleiner. Die Reichweite eines Wurfs folgt dem Gewicht des Gegenstands und wächst mit dem Skill. Jede Gattung braucht ihre Munition anders, das macht sie auch im Gebrauch verschieden. Das System der Fernwaffen entsteht von Grund auf ([Systemausbau.md](Systemausbau.md), Punkt 22).

#### Fernkampf allgemein

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: Wirkung mit dem Tag `fernkampf`
+ Zwei Tiers wie Nahkampf allgemein: Genauigkeit auf Entfernung, dann etwas Schaden
+ Voraussetzung für die Schusswaffen, nicht für das Werfen

#### Werfen

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: Wirkung mit dem Tag `wurf`
+ Steht allein: auch die Brau-Magierin ohne Fernkampf wirft ihre Tränke, ein wenig Werfen reicht ihr, weil Flächen verzeihen
+ Grund: Genauigkeit und weniger Streuung
+ Experte: Reichweite
+ Meister: Tempo
+ Göttlich: Zerspringendes wirkt in größerem Umkreis
+ Wurfwaffen: Wurfmesser, Speer, Bumerang, später Granaten

#### Spannwaffen

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Schleuder, Bogen, Armbrust; die Jägerin
+ Munition: Pfeile und Bolzen landen und lassen sich aufheben, mit einer Chance zu brechen (Vorbild Brogue)
+ Grund Genauigkeit, Experte Schaden, Meister Tempo des Spannens, göttlich Durchschuss (der Pfeil fliegt durch das erste Ziel weiter)

#### Feuerwaffen

+ Eigenschaften: Gewandtheit, sekundär Klugheit
+ Von der Muskete bis zum Maschinengewehr
+ Munition: Kugeln sind verbraucht; Nachladen kostet Zeit
+ Laut: Ein Schuss ist weit zu hören, viel weiter als ein Nahkampf, aber nicht auf der ganzen Ebene; Wände dämpfen ihn, ein Schalldämpfer ist ein Gegenstand
+ Grund Genauigkeit, Experte schneller nachladen, Meister Schaden, göttlich Salve (mehrere Schüsse in einer Aktion, wo die Waffe es kann)

#### Druckwaffen

+ Eigenschaften: Klugheit, sekundär Braukunde
+ Steampunk: Dampf, Druckluft, die CO2-Kanone aus dem Gärkessel; Ninkasis Brücke zwischen Brauen und Kampf
+ Munition: Der Druck baut sich mit der Zeit in der Waffe auf, ein Schuss leert ihn; vielleicht tankt die Waffe CO2 aus der Luft über Gärbottichen
+ Tiers: schnellerer Druckaufbau, höherer Höchstdruck, Rückstoß stößt das Ziel, göttlich Überdruck, der am Ziel platzt

#### Energiewaffen

+ Eigenschaften: Klugheit, sekundär Sinnlichkeit
+ Laser und Plasma
+ Munition: Ladungen wie beim Zauberstab, dazu Hitze je Schuss, die über die Zeit abklingt; zu heiß, und die Waffe schießt nicht
+ Tiers: Überhitzen langsamer, Ladung sparsamer, Schaden, göttlich ein Strahl durch alle Ziele in einer Linie

#### Spezialisierungen im Fernkampf

+ Je Waffentyp nach dem Muster des Nahkampfs: Bogen, Schleuder, Muskete und weitere mit dem Inhalt
+ Fernsicht lernt quer zum Fernkampf (siehe Wahrnehmung)

### Schilde

#### Schildkampf

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: Blocken mit dem Schild (Tag `schild`)
+ Ein Schild blockt Angriffe im Nahkampf und Geschosse; besondere, magische Schilde auch Magie, Psi und Strahlen, wenn ihre Daten es sagen
+ Jeder Tier senkt nebenbei Gewicht und Verlangsamung des Schilds: Wer mit dem Schild blockt, lernt ihn auch zu tragen; Schilde brauchen so keine Rüstungsskills
+ Grund: mehr Blocken
+ Experte: Deckung, hinter dem Schild trifft Ninkasi von Flächen und Explosionen nur ein Teil
+ Meister: der Schildschlag wird stärker, eine Fähigkeit aus der Welt, die stößt oder kurz betäubt; Schildkampf ist ihre Voraussetzung
+ Göttlich: Zurückwerfen, ein geblocktes Geschoss oder ein geblockter Strahl prallt mit einer Chance auf die Schützin zurück; nur, was der Schild blocken kann
+ Schildarten in den Daten: Buckler (leicht, schnell, passt zum Fechten), Schild, Turmschild (schwer, viel Deckung, bremst), später etwa ein Energieschild

### Präzision

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: jedem Krit (Lernanlass Kritisch)
+ Nur für körperliche Angriffe (Nahkampf, Fernkampf, Wurf); Magie und Psi haben eigene Skills für Krits, sonst würde Präzision zum Pflichtskill jedes Builds
+ Grund: Kritchance
+ Experte: Kritfaktor
+ Meister: gezielter Treffer, ein Teil des Ausweichens des Ziels zählt nicht
+ Göttlich: Schwachstelle, ein Krit macht das Ziel für kurze Zeit verwundbar (weniger Rüstung), auch für Verbündete

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Kampfwerte (Profile mit Tags, Kampfwerte, Bedingungen `gegenueber_ahnungslos` und `pegel_ab`) und Skills und Lernen; im Probeinhalt Nahkampf und Ausweichen als Grundskills; offen: alle Sets, Tags der Waffen, Wehrlos, Abzug der zweiten Hand, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20, Fernwaffen in Punkt 22

## Brauen

### Bierbrauen

+ Grundfähigkeiten: Brauen, Wissen Rohstoffe (Effizienz beim Brauen)
+ Expertenfähigkeiten: Hygiene, Extrakt, Fehlschläge minimieren, Rezepte

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Anlagen und Fallen

+ Fallenstellen und Entschärfen als eigene Sets, quer verwandt mit der Reaktion (siehe Kampf, Verteidigung); erweist sich das Thema als ergiebig, gern mehr Sets rund um Fallen

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Soziales

+ handeln
+ interagieren mit Wesen, beschwören, befreunden, verhandeln, Fraktionen

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Magie

+ Buffs, Schaden, Effekte von Tränken werden gesteigert
+ Abwehr gegen Magie; die Kurve der MP gehört zu Stoffwechsel und Pegel (Klarer Kopf)

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Psi

+ Abwehr gegen Psi; die Kurve der PP gehört zu Stoffwechsel und Pegel (Rauschgeist)

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Offen

+ Bier- und Brandfontäne (Getrunkenes im Kegel speien, kostet Pegel): eher Fähigkeit als Skill, vielleicht zu Stoffwechsel und Pegel oder zu Magie, wo die Fontäne beschworen wird
