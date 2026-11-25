# Battle Ninkasi - Skills

Stand: 2026-11-25, Entwurf; alle Kategorien entworfen ([Systemausbau.md](Systemausbau.md), Punkt 20)

Mitprüfen bei Änderungen: [Charakter.md](Charakter.md), [Wesen.md](Wesen.md), [Welt.md](Welt.md), [Gegenstaende.md](Gegenstaende.md), [Wirkungen.md](Wirkungen.md), [Texte.md](Texte.md), [Brauen.md](Brauen.md)

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
+ Tiers: Grund, Experte und Meister je mehr LP, göttlich Letzter Stand: ein tödlicher Treffer lässt Ninkasi einmal je Ebene mit 1 LP stehen

### Laufen

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: Entkommen
+ Bewegen wird schneller: Ninkasi beginnt etwa ein Fünftel langsamer als ein normal schnelles Wesen, die unteren Tiers holen das auf, die oberen machen sie schneller als normal schnelle Wesen (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo)
+ Tiers: Grund und Experte holen den Rückstand auf, Meister macht schneller als normal schnelle Wesen, göttlich bremst schwieriges Gelände (Wasser, Schlamm) weniger

### Sprint

+ Eigenschaften: Gewandtheit, sekundär Trinkfestigkeit
+ Lernt aus: Entkommen
+ Verbessert die angeborene Grundfähigkeit: stärker, länger, kürzere Abklingzeit, weniger Mehrverbrauch des Stoffwechsels
+ Tiers: Grund stärker, Experte länger, Meister kürzere Abklingzeit, göttlich beendet der Sprint Festhalten und Verlangsamung

### Tragen

+ Eigenschaften: Körperlichkeit, sekundär Gewandtheit
+ Lernt aus: nur freien EP
+ Mehr Tragkraft, über alle Tiers etwa das Doppelte; die Last bremst weniger, bei voller Spezialisierung etwa halb so stark
+ Tiers: Grund und Experte mehr Tragkraft, Meister die Last bremst halb so stark

### Leichte Rüstung

+ Eigenschaften: Gewandtheit, sekundär Körperlichkeit
+ Lernt aus: Rüstung, wenn ein leichtes Stück den Schaden mindert
+ Gefühltes Gewicht und Verlangsamung sinken; bei voller Spezialisierung bremst leichte Rüstung kaum noch
+ Der Abzug aufs Ausweichen sinkt, bei voller Spezialisierung fast auf null
+ Tiers: Grund weniger Gewicht und Verlangsamung, Experte weniger Abzug aufs Ausweichen, Meister bremst kaum noch

### Schwere Rüstung

+ Eigenschaften: Körperlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Rüstung, wenn ein schweres Stück den Schaden mindert
+ Gefühltes Gewicht und Verlangsamung sinken; bei voller Spezialisierung bremst schwere Rüstung spürbar weniger, aber nie gar nicht
+ Der Abzug aufs Ausweichen sinkt nur etwas; so bleibt die Wahl zwischen Panzern und Ausweichen (Vorbild Caves of Qud)
+ Tiers: Grund weniger Gewicht, Experte weniger Verlangsamung, Meister etwas weniger Abzug aufs Ausweichen, göttlich schützt schwere Rüstung auch gegen Krits

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
+ Die Hebel stehen: die Chancen von Torkeln, Danebenschlagen und Fehlschlägen lassen sich senken (siehe [Wesen.md](Wesen.md), Stoffwechsel, und [Wirkungen.md](Wirkungen.md), Fähigkeiten), die des Filmrisses ebenso
+ Tiers: je eine Strafe des Rauschs, Grund Torkeln milder, Experte seltener Fehlschläge, Meister seltener Filmriss

### Rauschheilung

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: Berauscht
+ Das Optimum der Regeneration der LP wandert zu höherem Pegel, höhere Tiers heben auch die Rate; ein höherer Tier lässt die LP auch im Kampf regenerieren, wo sie sonst ruhen (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Tiers: Grund und Experte verschieben das Optimum, Meister hebt die Rate

### Klarer Kopf

+ Eigenschaften: Klugheit, sekundär Trinkfestigkeit
+ Lernt aus: Berauscht
+ MP regenerieren auch bei mittlerem Pegel noch gut, die Kurve wandert zu höherem Pegel; erleichtert Mischbuilds aus Magie und Rausch
+ Zwei Tiers, jeder verschiebt die Kurve

### Rauschgeist

+ Eigenschaften: Sinnlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Berauscht
+ PP schwinden außerhalb des Kampfes weniger, im Kampf bringt jeder Treffer bei hohem Pegel mehr; ein höherer Tier lässt den Gewinn schon bei niedrigerem Pegel beginnen
+ Tiers: Grund weniger Schwund, Experte mehr Gewinn bei hohem Pegel, Meister der Gewinn beginnt bei niedrigerem Pegel

### Abwehr

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: erlittenem Schaden durch Gift und Alkohol
+ Mehr Widerstand gegen Gift und Alkohol, später gegen Infektion, sobald es sie als Zustand gibt; nie volle Immunität (siehe Kampf, Verteidigung)
+ Widerstand gegen äußere Schadensarten gehört zu Kampf, Verteidigung, gegen Magie und Psi in die eigenen Kategorien; mehr Schaden einer Art gehört zu dem, der ihn austeilt
+ Tiers: Grund und Experte mehr Widerstand, Meister wirkt auch gegen Infektion

### Kampftrinken

+ Eigenschaften: Trinkfestigkeit, sekundär Gewandtheit
+ Lernt aus: Berauscht
+ Das Trinken mitten im Kampf, das Brot der Bier-Göttin: schneller und wirksamer
+ Tiers: Grund Trinken kostet weniger Zeit, Experte aus einem Gefäß in der Hand trinken, ohne es erst aus dem Gepäck zu holen, Meister ein zweiter Schluck in derselben Aktion, Göttlich Getrunkenes wirkt im Kampf stärker

### Kampfrausch

+ Eigenschaften: Trinkfestigkeit, sekundär Sinnlichkeit
+ Lernt aus: Berauscht
+ Die Göttin berauscht sich am Kampf selbst: jeder Treffer, ausgeteilt wie erlitten, hebt den Pegel ein wenig; für Psi-Zauberinnen und Psi-Kämpferinnen, auch wenn Brand vorhanden ist, damit sie ihren Pegel ausschöpfen und seltener in Engpässe geraten (siehe [Brauen.md](Brauen.md), Brauen und Pegel)
+ Tiers: Grund Treffer heben den Pegel, Experte mehr je Treffer, Meister im Kampf baut der Pegel nicht ab

### Rauschkraft

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: Berauscht mit dem Tag `nahkampf`
+ Die körperliche Seite zur Ekstase (siehe Psi), für die Brauserkerin
+ Tiers: Grund Nahkampfschaden steigt mit dem Pegel, Experte auch der Rückstoß, Meister im hohen Rausch spürt Ninkasi Schmerz später und Betäubung hält kürzer

### Fontäne

+ Eigenschaften: Trinkfestigkeit, sekundär Körperlichkeit
+ Lernt aus: Wirkung mit dem Tag `fontaene`
+ Die Bier- und Brandfontäne ist eine Fähigkeit aus der Welt: Getrunkenes im Kegel speien, kostet Pegel; das Set macht sie wirksamer
+ Tiers: Grund größerer Kegel, Experte weniger Pegel als Kosten, Meister das Gebraute wirkt mit, ein Trank wird gespien

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Wahrnehmung

Die Kategorie hält die eigenen Sinne der Göttin: Sehen, Spüren und Hören in der Nähe, nie durch Wände, dazu Fallen entdecken, Unbekanntes erkennen und als Gegenstück das Schleichen. Orten über Entfernung und durch Wände, Hellsicht und Telepathie sind Fähigkeiten aus der Welt und gehören zu Magie und Psi. Wer Gefahr früh wahrnimmt, lernt daraus (Lernanlass Erspäht: ein Wesen wahrgenommen, bevor es Ninkasi bemerkt hat; die Art des Wahrnehmens entscheidet, welcher Skill lernt).

### Fernsicht

+ Eigenschaften: Sinnlichkeit, sekundär Gewandtheit
+ Lernt aus: Erspäht in der Ferne
+ Ninkasi beginnt knapp unter der Sichtweite eines gewöhnlichen Gegners und wird zuerst gesehen; schon wenige Grundstufen drehen das um, mit vertretbarem Aufwand sieht sie etwa doppelt so weit wie ein gewöhnlicher Gegner (siehe [Grundlagen.md](Grundlagen.md), Licht und Wahrnehmung)
+ Darüber bringt mehr Reichweite wenig, weil nur Beleuchtetes zu sehen ist; der göttliche Tier spezialisiert anders: Werte und Ausrüstung eines Wesens auf volle Sichtweite erkennen, weniger Abzug im Fernkampf auf große Entfernung
+ Querlernen zum Fernkampf
+ Tiers: Grund leicht weiter, Experte und Meister bis etwa doppelt so weit wie ein gewöhnlicher Gegner, göttlich wie oben

### Nachtsicht

+ Eigenschaften: Sinnlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Erspäht im Finstern
+ Ninkasi sieht im Finstern weiter, auf dem göttlichen Tier etwa halb so weit wie im Licht, nie ganz; das Licht behält seinen Wert
+ Tiers: stufenweise weiter, Meister bis zur halben Sichtweite

### Dämmersicht

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: Erspäht im Dunkeln
+ Ninkasi sieht auf dämmrigen und dunklen Feldern weiter, bis sie sie wie helle sieht
+ Zwei Tiers: Grund dämmrig wie hell, Experte dunkel wie hell

### Gespür für Wesen

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: Erspäht durch Spüren
+ Ninkasi spürt Wesen in der Nähe ohne Licht und durch Rauch, entlang von allem, was offen ist, wie die Wesen, die schon spüren
+ Zwei Tiers

### Gespür für Schätze

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: nur freien EP, ein gespürter Gegenstand ist nichts Bewältigtes
+ Ninkasi spürt Gegenstände in der Nähe, entlang von allem, was offen ist
+ Zwei Tiers: Grund spürt Gegenstände, Experte erkennt ihre Art (Waffe, Trank)

### Gespür für Magie

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: nur freien EP
+ Ninkasi spürt Gegenstände und Wesen mit magischen Wirkungen in der Nähe, entlang von allem, was offen ist
+ Zwei Tiers: Grund spürt, Experte unterscheidet Segen und Fluch

### Lauschen

+ Eigenschaften: Sinnlichkeit, sekundär Gewandtheit
+ Lernt aus: Erspäht durch Hören
+ Die Richtung eines Geräuschs kennt Ninkasi ohne Skill; die Tiers machen das Hören genauer: weiter hören, die Art erkennen ("ein Ork"), die Anzahl ("zwei Orks"), zuletzt gehörte Wesen kurz auf der Karte
+ Lohnt erst, wenn auch Schritte leisen Lärm machen
+ Tiers: Grund weiter hören, Experte die Art, Meister die Anzahl, göttlich gehörte Wesen kurz auf der Karte

### Fallengespür

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: entdeckten Fallen; das Entdecken bringt einen Teil der EP einer Falle, das Entschärfen den Rest (siehe Anlagen und Fallen)
+ Fallen werden öfter und aus größerer Entfernung entdeckt
+ Tiers: Grund öfter, Experte weiter, Meister eine Warnung, dass in der Nähe eine Falle liegt

### Kennerschaft

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: jedem erkannten Typ, je Typ einmal, auch beim Erkennen durch Trinken und Benutzen
+ Unbekanntes wird schneller erkannt; ein höherer Tier erkennt beim Aufheben schon die Art ("ein Fluch liegt darauf"), bevor der Typ bekannt ist
+ Sehen, was in einem Stück steckt: Verschleiß, Haltbarkeit, verborgene Eigenschaften und Affixe genauer
+ Pflegen: Waffen und Rüstung nutzen sich langsamer ab, Gegenstände verderben langsamer; einer der wirksamen Wege, Ausrüstung in Schuss zu halten (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Die Wirksamkeit im Gebrauch hebt Kennerschaft nicht, sie gehört den Skills der Waffen und Rüstungen; ein höherer Tier darf verborgene Stärken eines Stücks wecken, die erst wirken, wenn es erkannt ist
+ Später auch für Anlagen: unbekannte Anlagen tragen ein Etikett, Kennerschaft senkt das Risiko des ersten Inbetriebnehmens (mit Anlagen und Fallen)
+ Tiers: Grund schneller erkennen, Experte die Art beim Aufheben, Meister die Pflege, göttlich verborgene Stärken wecken

### Schleichen

+ Eigenschaften: Gewandtheit, sekundär Sinnlichkeit
+ Lernt aus: Hinterhalt
+ Ninkasi wird später bemerkt (Heimlichkeit); ein höherer Tier hinterlässt weniger Duft, Jäger verlieren ihre Spur früher
+ Heimlichkeit ist ein Wert jedes Wesens, Gegner tragen ihn fest in ihren Daten; Fähigkeiten wie "im Schatten verstecken" kommen aus der Welt, Schleichen ist ihre Voraussetzung und macht sie wirksamer
+ Tiers: Grund Heimlichkeit, Experte weniger Duft, Meister Jäger verlieren die Spur früher, göttlich bemerken Zeugen Ninkasi nach einem tödlichen Hinterhalt nicht

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Wahrnehmung (Sichtweite, Sicht je Lichtstufe und im Finstern, Spüren, Heimlichkeit als Werte mit Modifikatoren), [Welt.md](Welt.md), Gelände (Entdecken) und [Gegenstaende.md](Gegenstaende.md), Unbekanntes (Kennerschaft); offen: alle Skills, Lernanlässe Erspäht und Hinterhalt, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

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
+ Je drei Tiers: Grund und Experte Widerstand, Meister Folgeschaden wie Brennen oder Verätzen hält kürzer; jedes lernt aus erlittenem Schaden seiner Art

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

+ Eigenschaften: Trinkfestigkeit, sekundär Gewandtheit
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
+ Tiers: Grund Chance des Festhaltens, Experte Dauer, Meister Schaden und Weite der Griffe, göttlich auch große Wesen halten (braucht eine Größe der Wesen)

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
+ Tiers: Grund Genauigkeit, Experte Parieren, Meister die Finte: sie senkt die Verteidigung des Ziels für den nächsten Angriff
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

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Kampfwerte (Profile mit Tags, Kampfwerte, Wehrlos, Bedingungen `gegenueber_ahnungslos`, `gegenueber_wehrlos` und `pegel_ab`) und Skills und Lernen; im Probeinhalt Nahkampf und Ausweichen als Grundskills; offen: alle Sets, Tags der Waffen, Abzug der zweiten Hand, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20, Fernwaffen in Punkt 22

## Brauen

Brauen ist die einzige Herstellung von Getränken, Tränken und Giften: Bier, Wein, Met, Kvas, Kefir, Kombucha, auch Tränke und Gifte entstehen beim Brauen; Magie hat keine eigene Alchemie, die etwas herstellt, sie steigert die Wirkung des Gebrauten (siehe Magie). Bauen und Reparieren gehören zum Handwerk (siehe Anlagen und Fallen). Brauen und Mälzen sind Gaben der Göttin, angeborene Fähigkeiten jeder Ninkasi wie das Werfen (siehe [Charakter.md](Charakter.md), Fähigkeiten); die Skills heben Gelingen, Ausbeute und Güte und erweitern die Fähigkeiten in Ausbaustufen. Die Sets folgen den Schritten des Brauens und dem, was ein Sud ergibt, das Brausystem steht in [Brauen.md](Brauen.md). Vorbilder: EVE Online (Industry macht die Fertigung schneller), RimWorld (die Fertigkeit senkt die Gefahr verdorbener Speisen, die Sauberkeit wirkt daneben), Caves of Qud (Baupläne finden sich unterwegs, die Skills machen sie baubar).

Muster der Tiers: Grund Gelingen, Experte Ausbeute, Meister Güte; einzelne Sets weichen ab. Die Schulen schließen sich so wenig aus wie die Waffengattungen. Die Kessel aufzustellen, zu bauen und zu pflegen gehört zu Anlagen und Fallen.

### Rezepte

+ Was ein Rezept ist, wie Hausrezepte entstehen und was sich stapelt, steht in [Brauen.md](Brauen.md), Rezepte
+ Ein Rezept nennt die Arten seiner Zutaten, seine Kultur und seine Schule als Tags, über die die Sets wirken und lernen
+ Lernanlass ist das erste Gelingen jedes gefundenen Rezepts (siehe [Charakter.md](Charakter.md), Gebundene EP); seine EP teilen sich nach den Tags des Rezepts auf die Sets; Hausrezepte bringen keine gebundenen EP, weil es endlos viele gäbe

### Brauen allgemein

+ Eigenschaften: Braukunde, sekundär Klugheit
+ Lernt aus: jedem Rezept
+ Grund: der Sud gelingt öfter
+ Experte: mehr Ausbeute
+ Meister: höhere Güte
+ Voraussetzung für alle anderen Sets der Kategorie; Querlernen zum Schnellsud

### Schnellsud

+ Eigenschaften: Braukunde, sekundär Gewandtheit
+ Lernt aus: freien EP und quer von Brauen allgemein
+ Gebraut wird sonst nur außerhalb eines Kampfes (siehe [Brauen.md](Brauen.md), Grundsätze); der Schnellsud verschiebt diese Grenze Tier für Tier
+ Grund: Brauen auch, wenn Feinde in der Nähe sind, solange noch kein Kampf läuft
+ Experte: Feldsud, im Kampf Trockenbier anrühren, langsamer als eine gewöhnliche Aktion (siehe [Brauen.md](Brauen.md), Trockenbier und Sud im Kampf)
+ Meister: der Feldsud ist etwa so schnell wie ein Kampfzauber
+ Göttlich: der Feldsud gibt die volle Menge und die volle Güte des Suds
+ Kveik zählt den Schnellsud einen Tier höher, auch über den eigenen hinaus

### Hygiene

+ Eigenschaften: Klugheit, sekundär Braukunde
+ Lernt aus: jedem Rezept
+ Zwei Tiers: Grund seltener verdorbene Sude, Experte ein misslungener Sud bleibt öfter nur minderwertig, statt zu verderben
+ Gilt beim Brauen; was im Gepäck verdirbt, pflegt die Kennerschaft (siehe Wahrnehmung)
+ Querlernen zur Abhärtung gegen Ätzendes (siehe Kampf, Verteidigung)

### Rohstoffe

Ein Set je Art von Rohstoffen mit zwei Tiers: Ohne Skill gibt eine Art weniger Ausbeute und Güte, Grund macht sie konkurrenzfähig, Experte hebt die Güte. Jedes gilt auch für das Ernten seiner Art: Grund mehr Menge, Experte höhere Güte, ein dritter Tier erkennt und erntet Seltenes, das sonst verborgen bleibt. Jedes lernt aus den Rezepten mit seiner Art.

+ Getreide: Gerste, Emmer, Weizen, Brot (Kvas, Bappir); Braukunde, sekundär Klugheit; die Grundlage, schon ohne Skill brauchbar; drei Tiers, Meister macht das Mälzen wirksamer
+ Früchte: Datteln, Feigen, Trauben, Granatäpfel, Äpfel; Braukunde, sekundär Sinnlichkeit
+ Honig und Zucker: Braukunde, sekundär Trinkfestigkeit
+ Kräuter und Würze: Gruit, die Würze vor dem Hopfen, mit Primär- und Sekundärwirkungen (siehe [Brauen.md](Brauen.md), Zutaten); Braukunde, sekundär Sinnlichkeit
+ Milch: Braukunde, sekundär Trinkfestigkeit
+ Tee: Braukunde, sekundär Klugheit
+ Hopfen: Bittere und Haltbarkeit; Braukunde, sekundär Sinnlichkeit; erst mit dem ersten Hopfenfund lernbar (`freischaltung`); das Aroma gehört der Schule Hopfenstopfen

### Hefen und Kulturen

+ Eigenschaften: Braukunde, sekundär Sinnlichkeit
+ Lernt aus: den Rezepten, nach dem Tag ihrer Kultur
+ Kulturen: Bierhefe, Weinhefe, wilde Hefe, Brettanomyces, Kveik, Milchsäure- und Essigbakterien, Koji, Kefirknollen, Teepilz, Sauerteig; wie Ninkasi sie gewinnt und trägt, steht in [Brauen.md](Brauen.md), Kulturen
+ Grund: höherer Vergärungsgrad, mehr Alkohol
+ Experte: Stämme veredeln, eine Kultur verbessert ihre Werte, je öfter sie gebraucht wird
+ Meister: höhere Güte der Gärung
+ Die Hefe als Wesen gehört nicht hierher (siehe Soziales, Wesenskunde)

### Brauschulen

Je Schule ein Set nach dem Muster der Kategorie, wirksam nur für Rezepte mit ihrem Tag, dazu ein Kniff je Schule:

+ Sumerische Tradition: Bappir, Datteln, Honig, Tonkrug, die Brauweise Ninkasis; Braukunde, sekundär Sinnlichkeit
+ Spontane Gärung: wilde Hefen aus der Luft, riskant, mit starken Ausreißern nach oben und unten und seltsamen Wirkungen; Braukunde, sekundär Trinkfestigkeit
+ Reinheitsgebot: nur Wasser, Malz, Hopfen und Hefe, verlässlich und von hoher Güte; Braukunde, sekundär Klugheit; mit dem ersten Hopfen lernbar
+ Hopfenstopfen: Hopfen kalt in den fertigen Sud, Aroma statt Bittere, späte Epoche; Braukunde, sekundär Sinnlichkeit; mit dem ersten Hopfen lernbar
+ Weitere Kandidaten nach Epochen stehen in [Brauen.md](Brauen.md), Brauschulen

### Rezeptur

+ Eigenschaften: Klugheit, sekundär Braukunde
+ Lernt aus: jedem Rezept
+ Grund: die Vorschau des Suds wird enger, er trifft sein Zielgebiet genauer, das gibt Güte
+ Experte: Rezepte abwandeln, eine Zutat gegen eine verwandte tauschen, ohne das Rezept zu verlassen
+ Meister: freie Sude gelingen verlässlicher und werden leichter zum Hausrezept

Umsetzung: offen, braucht das Brausystem (Spieldesign in [Brauen.md](Brauen.md), Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23), Arbeit in Punkt 20

## Anlagen und Fallen

Die Kategorie der Klugheit: Fallen entschärfen und stellen, Schlösser öffnen, Anlagen bedienen, bauen und reparieren. Anlagen sind Kessel (feste Altäre und mobile Kessel, siehe Brauen), Gärbottiche, Pumpen, Ventile, Druckkessel, später Dampfmaschinen. Entdecken gehört zur Wahrnehmung (Fallengespür), Rettungswurf und Ausweichen vor Fallen zur Verteidigung (Reaktion, quer verwandt mit Entschärfen und Fallenstellen). Rätsel bekommen keinen Skill: Sie löst die Spielerin, ein Skill nähme ihnen den Sinn. Vorbilder: Brogue (Fallen treffen Gegner wie die Spielerin), Cataclysm DDA (ein misslungenes Entschärfen löst die Falle aus), Tales of Maj'Eyal (ein ganzer Baum für Fallen, der Köder lockt Wesen und löst zuletzt Fallen in der Nähe aus).

Gegner und Fallen: Ein Wesen kennt die Fallen der Ebene, auf der es erzeugt wurde, und meidet sie; ein Verfolger auf einer fremden Ebene kennt dort keine, Ninkasis eigene Fallen kennt kein Gegner. Unbekannten Fallen entgehen Gegner nach ihren Daten auf verschiedene Weise: sie entdecken sie (Kontrolleure oft), lösen sie nicht aus (Fliegende), weichen aus oder halten die Wirkung aus.

Falle und Wurf: Die Falle bestimmt die Form, das Gebraute die Wirkung. Ein Trank wirkt in der Falle so stark wie geworfen, Güte und Alchemie steigern beides gleich, Fallenstellen steigert die Wirkung nicht. Die Art der Falle gibt die Form (Düse ein Feld, Sprengfalle eine Fläche, Stolperdraht eine Linie). Die Falle trifft genau, ohne Streuung und Ausweichen, solange ihre Tarnung hält, und kostet Zeit vorher statt im Kampf, aber ob ein Gegner hineintritt, ist nicht sicher; der Wurf wirkt sofort, wo es brennt, kann aber streuen und kostet eine Aktion im Kampf. Fallen und Köder sind Gegenstände aus der Welt, gefunden oder geborgen.

### Entschärfen

+ Eigenschaften: Klugheit, sekundär Gewandtheit
+ Lernt aus: jeder entschärften Falle, mit dem Teil ihrer EP, den das Entdecken übrig lässt (siehe Wahrnehmung, Fallengespür)
+ Entschärfen ist eine Grundaktion wie Benutzen, keine Fähigkeit; misslingt es, kann die Falle auslösen
+ Grund: höhere Chance
+ Experte: ein Fehlschlag löst die Falle seltener aus
+ Meister: Bergen, die entschärfte Falle wird ein Gegenstand, den Ninkasi wieder aufstellen kann
+ Göttlich: Umpolen, die Falle bleibt liegen und gehört nun Ninkasi

### Fallenstellen

+ Eigenschaften: Klugheit, sekundär Sinnlichkeit
+ Lernt aus: Wirkung mit dem Tag `falle`, wenn Ninkasi die Falle gestellt hat; sie ist die Urheberin, das Beitragsbuch zählt wie bei einer Waffe
+ Grund: bessere Tarnung
+ Experte: Laden, eine Falle wirkt mit Gebrautem, das Ninkasi in sie füllt (Trank, Gift, Bier), nach dessen Wirkung in der Form der Falle
+ Meister: schneller aufstellen, auch kurz vor einem Kampf
+ Göttlich: Kettenfalle, eine ausgelöste Falle löst Ninkasis Fallen in der Nähe mit aus

### Schlösser

+ Eigenschaften: Klugheit, sekundär Gewandtheit
+ Lernt aus: jedem geöffneten Schloss
+ Grund: höhere Chance
+ Experte: leiser und schneller
+ Meister: Fallen an Schlössern und Truhen fallen beim Öffnen auf
+ Göttlich: Verschließen, Ninkasi schließt Türen hinter sich ab und hält Verfolger auf
+ Die Türen von Schatzräumen öffnet nur ihr Schlüssel (siehe [Ausblick.md](Ausblick.md), Schatzräume mit Schlüssel)

### Anlagenkunde

+ Eigenschaften: Klugheit, sekundär Braukunde
+ Lernt aus: dem ersten Inbetriebnehmen jeder Art von Anlage, je Art einmal wie die Kennerschaft je Typ
+ Grund: weniger Risiko beim Bedienen
+ Experte: eine Anlage wirkt voll; ein Kessel aus edlem Material entfaltet sein Tier erst mit dem Skill, ohne ihn ist er nutzbar, aber riskant (siehe [Charakter.md](Charakter.md), Fähigkeiten, Fundstück ohne passenden Skill)
+ Meister: Überlasten, eine Anlage wird absichtlich zur Falle, etwa ein Druckkessel, der platzt
+ Die Kennerschaft erkennt eine Anlage, die Anlagenkunde bedient sie (siehe Wahrnehmung, Kennerschaft)

### Handwerk

+ Eigenschaften: Klugheit, sekundär Körperlichkeit
+ Lernt aus: freien EP und quer von der Anlagenkunde; Reparieren bringt keine gebundenen EP, sonst ließe es sich endlos wiederholen
+ Grund: Reparieren mit Werkzeug und Material wirkt mehr, an Ausrüstung, Kesseln und Anlagen
+ Experte: mobile Kessel und Fallen schneller aufstellen und abbauen
+ Meister: Bauen, Barrikaden und einfache Anlagen aus Teilen
+ Die Pflege bleibt bei der Kennerschaft, die Reparatur gehört hierher (siehe [Grundlagen.md](Grundlagen.md), Spielkern)

Umsetzung: teilweise, siehe [Welt.md](Welt.md), Gelände (Fallen mit Tarnung und Effekt, Entdecken, Benutzen); offen: alle Sets, Kenntnis der Fallen je Ebene, eigene Fallen, Schlösser, Anlagen, Reparatur, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Soziales

Die Kategorie der Sinnlichkeit im sozialen Sinn: Gespräch, Handel, Ruf, Täuschung, Zechen, dazu Verbündete führen und ausbilden und Wesen zähmen. Gespräch und Täuschung wirken nur auf Wesen, die verstehen (Händler, Kontrolleure, Abstinenzler, Figuren); Tiere und Mikroorganismen gehören der Wesenskunde. Psi wirkt dagegen auf jeden Geist, sofort und riskant; Soziales ist langsamer und ohne Gefahr für Ninkasis Verstand. Die Gunst der Nebengottheiten und die Beschwörung selbst gehören zur Magie. Vorbilder: Caves of Qud (Überreden in Arten mit Ego gegen die geistige Abwehr; Bekehren macht ein Wesen zum Begleiter, ein Fehlschlag macht es nicht feindlich, beim Betören schon; ein eigener Skill für Preise), Brogue (Verbündete lernen Fähigkeiten besiegter Gegner).

Kampflos bewältigt: Ein Wesen, das Ninkasi überredet, einschüchtert, verführt, unter den Tisch trinkt, zähmt oder bekehrt, bringt seine EP wie beim Tod, je Wesen einmal; sie teilen sich über das Beitragsbuch auf die Sets seiner Lernanlässe (siehe [Charakter.md](Charakter.md), Gebundene EP). Stirbt es später, bringt es nichts mehr.

### Gespräch

Das Gespräch ist eine Grundaktion wie das Entschärfen, keine Fähigkeit: Jede Ninkasi kann mit Wesen sprechen, die verstehen, und dabei überreden, einschüchtern oder verführen, als Wahlen im Gespräch. Ohne Skill gelingt das kaum, außer gegen die Schwächsten; die Skills machen die Probe stärker und schalten weitere Wahlen frei (Bedingung Skillstufe). Besondere Fähigkeiten wie Bekehren, Bestechen oder eine Befehlsstimme kommen aus der Welt, die Skills sind ihre Voraussetzung. Aufbau wie im Nahkampf: ein allgemeines Set und drei Arten wie Gattungen, Muster der Arten Grund Probe, Experte Wirkung, Meister stärkste Wirkung.

+ Gespräch allgemein: Sinnlichkeit, sekundär Klugheit; zwei Tiers, Grund Proben im Gespräch, Experte Neutrale umstimmen, das hebt den Ruf; Voraussetzung für die Arten
+ Überreden: Sinnlichkeit, sekundär Klugheit; die Art der Vernunft, zuletzt zieht ein Feind ab; ein Fehlschlag schadet nicht; Voraussetzung für Bekehren
+ Einschüchtern: Sinnlichkeit, sekundär Körperlichkeit; die Art der Drohung, Schwächere fliehen, zuletzt ergibt sich ein Ziel und ist wehrlos oder lässt sich ausplündern
+ Verführen: Sinnlichkeit, sekundär Gewandtheit; die Art des Begehrens, ein Wesen hilft, solange der Reiz hält, zuletzt lässt es sich ausnutzen (Ware, Wissen, Schlüssel); ein Fehlschlag macht wütend
+ Lernt aus: Wirkung im Gespräch mit dem Tag der Art, je Wesen einmal

### Handeln

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: dem ersten Handel mit jedem Händler, ein fester Betrag, je Händler einmal
+ Grund: bessere Preise
+ Experte: Händler zeigen mehr und seltenere Ware
+ Meister: Händler nehmen Gebrautes zu seinem vollen Wert an
+ Göttlich: Händler ziehen leichter in den Hub (siehe [Spielverlauf.md](Spielverlauf.md), Hub)

### Ruf

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: jeder Schwelle, die Ninkasi bei einer Fraktion zum ersten Mal erreicht
+ Grund: gute Taten heben den Ruf stärker, schlechte senken ihn schwächer
+ Experte: Beistand öfter
+ Meister: Zorn verraucht schneller
+ Göttlich: Gesandte, verfeindete Fraktionen hören zuerst zu, bevor sie angreifen

### Täuschung

+ Eigenschaften: Sinnlichkeit, sekundär Gewandtheit
+ Lernt aus: Wirkung unter Verkleidung und Lügen im Gespräch, je Wesen einmal
+ Grund: Verkleidungen halten länger und fliegen später auf
+ Experte: Lügen als Wahl im Gespräch
+ Meister: Zeugen erkennen Ninkasi nicht, ihre Taten verschieben den Ruf nicht
+ Passt zur Meuchelmörderin, quer verwandt mit dem Schleichen (siehe Wahrnehmung)

### Zechen

+ Eigenschaften: Trinkfestigkeit, sekundär Sinnlichkeit
+ Lernt aus: jedem gewonnenen Wettrinken, je Wesen einmal
+ Das Wettrinken ist eine lange Aktion mit dem Pegel, kein eigenes Minispiel: Beide trinken Runde um Runde, wer zuerst über eine Schwelle kommt, verliert; wer Ninkasi unterliegt, wird Freund, verrät etwas oder gibt Rabatt
+ Grund: mehr Pegel im Wettstreit verkraften
+ Experte: die Gegnerin trinkt schneller, Ninkasi schenkt nach
+ Meister: ein unterlegenes Wesen bleibt Ninkasis Freund
+ Die Fähigkeit kommt aus der Welt, etwa von einem Wirt; Orte sind Tavernen als feste Strukturen oder Themenräume (siehe [Ausblick.md](Ausblick.md), Feste Strukturen) und der Wirt im Hub; wie das als Inhalt einzieht, entscheidet sich mit dem Inhalt

### Führung

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: Wirkung mit den Tags `begleiter` und `beschworen`; neben dem Skill der Beschwörung in Magie, die EP teilen sich gleich
+ Gilt für alle unter Ninkasis Befehl: Begleiter, Gezähmte, Bekehrte, Beschworene
+ Grund: mehr Verbündete zugleich
+ Experte: Verbündete werden stärker
+ Meister: Vorrangbefehle wirken auch über Entfernung
+ Göttlich: Verbündete fliehen nie und halten bis zuletzt

### Ausbildung

+ Eigenschaften: Sinnlichkeit, sekundär Braukunde
+ Lernt aus: Wirkung mit dem Tag `begleiter`
+ Grund: Verbündete lernen mit, ein Teil von Ninkasis EP fließt in ihre eigenen Skills (siehe [Systemausbau.md](Systemausbau.md), Punkt 21)
+ Experte: sie lernen Fähigkeiten besiegter Gegner
+ Meister: sie heilen nach dem Kampf schneller

### Wesenskunde

Aufbau wie im Nahkampf: ein allgemeines Set und Gattungen, das "Kreaturen verstehen" der Braukunde. Gezähmte lernen über den Tag `begleiter` mit dem Tag ihrer Gattung; die Gattungen lernen quer zu Führung und Ausbildung, was Gezähmte tun, stärkt so beide Seiten.

+ Wesenskunde allgemein: Braukunde, sekundär Sinnlichkeit; zwei Tiers, Grund Tiere und Kleinstwesen bleiben öfter neutral, Experte Zähmen gelingt öfter (die Fähigkeit kommt aus der Welt, etwa mit Futter oder Würze); Voraussetzung für die Gattungen
+ Muster der Gattungen: Grund Zähmen dieser Gattung, Experte Gezähmte stärker, Meister mehr dieser Gattung zugleich, göttlich je Gattung eigen, an ihrer Mechanik (siehe [Grundlagen.md](Grundlagen.md), Gegner)
+ Hefen: Braukunde, sekundär Sinnlichkeit; göttlich sprosst eine verbündete Hefe für Ninkasi, die Kulturhefe als Verbündete
+ Bakterien: Braukunde, sekundär Klugheit; göttlich teilen sich Gezähmte für Ninkasi, als eigene Abstammungslinie
+ Schimmel: Braukunde, sekundär Körperlichkeit; göttlich wächst ein gezähmtes Myzel zum Schutzwall
+ Tiere: Braukunde, sekundär Gewandtheit; göttlich wächst das Tier der Jägerin mit ihr
+ Automaten aus späteren Epochen: Klugheit, sekundär Braukunde; mit `freischaltung` beim ersten Fund

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Fraktionen (Ruf, Zorn, Beistand) und KI (Vorrangbefehle); offen: alle Sets, Gespräch, Handel, Begleiter, Zähmen, kampflos Bewältigtes, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Magie

Magie ist an Ritual, Schrift und Alchemie gebunden, kostet MP, Zeit und Material und wirkt eher über die Zeit und als Kontrolle (siehe [Grundlagen.md](Grundlagen.md), Spielkern). Zauber sind Fähigkeiten aus der Welt; ohne Skill sind sie nutzbar, aber mit hohem Risiko des Fehlschlags (Risikotabelle nach den fehlenden Stufen, siehe [Charakter.md](Charakter.md), Fähigkeiten). Aufbau wie im Kampf: Magie allgemein, Schulen nach der Wirkung wie die Gattungen, Wege nach der Quelle wie die Handhabung, dazu das Ritual quer zu beiden; ein Zauber trägt die Tags seiner Schule und seines Wegs und lernt beide, wie ein Dolch Gattung und Handhabung lernt. Die Kurve der MP gehört zu Stoffwechsel und Pegel (Klarer Kopf). Vorbilder: DCSS (Schulen nach Wirkung, die Fehlschlagrate folgt dem allgemeinen Skill und den Schulen des Zaubers), Brogue (Stäbe laden sich mit der Zeit wieder auf).

### Magie allgemein

+ Eigenschaften: Klugheit, sekundär Braukunde
+ Lernt aus: Wirkung mit dem Tag `magie`
+ Zwei Tiers: Grund seltener Fehlschläge, Experte geringere Kosten an MP
+ Voraussetzung für Schulen, Wege und Ritual

### Meditation

Meditieren ist die angeborene Fähigkeit des MP-Vorrats (siehe [Charakter.md](Charakter.md), Fähigkeiten). Es beginnt nur außerhalb eines Kampfes und legt eine Sammlung an, die mit der Dauer wächst, bis zu einer Obergrenze; währenddessen kommen MP schneller zurück. Die Sammlung hält, bis Ninkasi zum ersten Mal Schaden nimmt oder austeilt; halten Verbündete die Gegner beschäftigt, meditiert sie weiter, auch wenn um sie gekämpft wird. Dann entlädt sich die Sammlung, je nach Art der Meditation als kurzer Buff (Kraft für Schaden, Klarheit für MP und sichere Zauber, Schutz und weitere) oder als massiver erster Schlag. Die Grundform gibt wenig, die Arten kommen als Fähigkeiten aus der Welt (Lehrer, Schriftrollen). Am besten meditiert Ninkasi bei einem leichten Pegel: je nüchterner, desto besser, aber ganz nüchtern etwas schwächer als im Optimum, darüber immer schwächer.

+ Eigenschaften: Klugheit, sekundär Sinnlichkeit
+ Lernt aus: Wirkung einer entladenen Sammlung (Tag `sammlung`)
+ Grund: die Sammlung wächst schneller
+ Experte: der Buff hält länger, der Schlag trifft härter
+ Meister: Ninkasi gilt früher als außerhalb des Kampfes und kann so zwischen zwei Kämpfen meditieren
+ Göttlich: die Sammlung entlädt sich auch auf Verbündete in der Nähe

### Fokus

+ Eigenschaften: Klugheit, sekundär Sinnlichkeit
+ Lernt aus: jedem Krit mit dem Tag `magie` (Lernanlass Kritisch)
+ Kritchance und Kritfaktor der Magie, das Gegenstück zur Präzision (siehe Kampf, Präzision)
+ Tiers: Grund Kritchance, Experte Kritfaktor, Meister ein Krit verlängert die Zustände des Zaubers, göttlich ein Krit erstattet die MP

### Schulen

Muster: Grund Wirkung, Experte geringere Kosten, Meister Fläche und Reichweite, göttlich je Schule eigen.

+ Zerstörung: Feuer, Säure und Lauge, Strom, reine Magie, Flächen; Klugheit, sekundär Braukunde; göttlich springt die Wirkung auf ein Ziel daneben über
+ Bann: Verwirrung, Schlaf, Verlangsamen, die Kontrolle der Magie; Klugheit, sekundär Sinnlichkeit; göttlich springt ein Bann bei seinem Ende auf einen Nachbarn über; Kontrolle wirkt bei Wiederholung weiter schwächer (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo)
+ Segen und Fluch: Stärkung Ninkasis und ihrer Verbündeten, Schwächung der Gegner; Braukunde, sekundär Sinnlichkeit; göttlich wirkt ein Segen auf alle Verbündeten in Sicht
+ Beschwörung: lernt aus dem Tag `beschworen`, neben der Führung (siehe Soziales); Beschworene werden stärker und bleiben länger, wie viele zugleich, regelt die Führung; Braukunde, sekundär Klugheit; göttlich bringen Beschworene beim Tod einen Nachhall hervor
+ Hellsicht: Orten von Gegenständen und Magie, Kartieren; Klugheit, sekundär Sinnlichkeit; göttlich sieht Ninkasi durch die Augen einer Beschworenen; Telepathie gehört zu Psi

### Wege

+ Formel: Zauber aus Schriftrollen, Keilschrifttafeln und HACCP-Aushängen; Klugheit, sekundär Braukunde; Experte Schriftrollen schreiben gelingt (nur nüchtern), Meister eine gelesene Rolle bleibt mit einer Chance erhalten
+ Alchemie: Braukunde, sekundär Klugheit; lernt aus den Tags `trank` und `gift`; Gebrautes wirkt stärker und länger, getrunken, geworfen und in Fallen gleich (siehe Anlagen und Fallen); sie stellt nichts her, das tut allein das Brauen; Tiers: Grund stärker, Experte länger, Meister größere Fläche des Gebrauten
+ Göttliche Gabe: Gaben von Altären und Nebengottheiten wirken stärker; Braukunde, sekundär Sinnlichkeit; hängt an der Gunst (Idee in [Ausblick.md](Ausblick.md), Gunst der Nebengottheiten); Tiers: Grund stärkere Gaben, Experte die Gunst wächst schneller, Meister der Zorn der Gottheit fällt milder aus
+ Braupaddel: die Zauberstäbe der Welt sind verzauberte Braupaddel, in der Hand eine Wuchtwaffe, als Stab ein Zauber mit eigenen Ladungen; Klugheit, sekundär Gewandtheit; Grund Wirkung, Experte sparsamer mit Ladungen, Meister laden sich schneller wieder auf; schlägt Ninkasi mit dem Paddel, lernt sie Wuchtwaffen und die Spezialisierung Braupaddel (siehe Kampf, Nahkampf mit Waffen), zaubert sie damit, diesen Weg

### Ritual

+ Eigenschaften: Klugheit, sekundär Trinkfestigkeit
+ Lernt aus: Wirkung mit dem Tag `ritual`
+ Die zweite Art zu zaubern neben dem Kampfzauber, quer zu den Schulen: Rituale sind lange Aktionen, die nur außerhalb des Kampfes beginnen und dafür mächtig oder lange wirken (siehe [Grundlagen.md](Grundlagen.md), Zeit und Tempo)
+ Tiers: kürzere Dauer, seltener unterbrochen, länger wirksam; das Gegenstück zum Schnellsud (siehe Brauen)

### Magieabwehr

+ Eigenschaften: Klugheit, sekundär Trinkfestigkeit
+ Lernt aus: erlittenem Schaden und erlittenen Zuständen mit dem Tag `magie`
+ Widerstand gegen die Schadensart `magie` und gegen magische Kontrolle, mit der Obergrenze aller Widerstände (siehe Kampf, Verteidigung)
+ Tiers: Grund Widerstand, Experte magische Kontrolle hält kürzer, Meister Flüche halten kürzer

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Kampfwerte (Schadensart und Tag `magie`) und [Wirkungen.md](Wirkungen.md), Fähigkeiten (Risikotabellen, Unterhalt, lange Aktionen, Lehren); offen: alle Sets, Meditieren und Sammlung, verzauberte Braupaddel, Schriftrollen schreiben, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Psi

Psi wirkt sofort und rein geistig auf Einzelziele, mit hohem Risiko und hohem Ertrag; Wirksamkeit und Risiko steigen mit dem Pegel (siehe [Grundlagen.md](Grundlagen.md), Spielkern). Psi-Fähigkeiten kommen aus der Welt, ohne Skill mit hohem Risiko (Risikotabelle nach den fehlenden Stufen). Aufbau wie bei der Magie: Psi allgemein, Disziplinen nach der Wirkung wie die Gattungen, dazu Sets quer zu ihnen für Risiko, Krits, Glimmer und Abwehr. Muster der Disziplinen: Grund Wirkung, Experte geringere Kosten, Meister qualitativ, göttlich je Disziplin eigen; Tiers für Fläche gibt es nicht. Die Kurve der PP gehört zu Stoffwechsel und Pegel (Rauschgeist). Vorbild Caves of Qud (Glimmer als Summe geistiger Macht, ab einer Schwelle jagen Psi-Jäger die Spielerin, häufiger und stärker mit wachsendem Glimmer; Präkognition als Vision, aus der man zurückkehrt).

Drei Wege zu den Vorräten des Geistes: Die Meditation ist aktiv und bei leichtem Pegel vor dem Kampf (siehe Magie), die Ekstase passiv und im Rausch während des Kampfes, das Zeitblinzeln die Rettung im Moment.

### Psi allgemein

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: Wirkung mit dem Tag `psi`
+ Zwei Tiers: Grund seltener Fehlschläge, Experte geringere Kosten an PP
+ Voraussetzung für Disziplinen und die Sets quer zu ihnen

### Ekstase

+ Eigenschaften: Trinkfestigkeit, sekundär Sinnlichkeit
+ Lernt aus: Wirkung einer entladenen Ekstase (Tag `ekstase`)
+ Passiv, keine Fähigkeit: Ab einem hohen Pegel wächst die Ekstase im Kampf mit jedem Schaden, den Ninkasi nimmt oder austeilt, und entlädt sich als Psi-Stoß oder als Raserei; die Form des Kampfespegels, der die PP im Kampf füllt (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Grund: wächst schneller
+ Experte: hält länger
+ Meister: stärkere Entladung
+ Göttlich: nach der Entladung bleibt die Strafe aus

### Zeitblinzeln

Die angeborene Fähigkeit des PP-Vorrats (siehe [Charakter.md](Charakter.md), Fähigkeiten): Ninkasi geht einen eigenen Zug zurück, für PP, mit einer Abklingzeit in Weltzeit und dem Risiko der Psi über den Pegel. Der Zufall fällt danach nicht neu aus: wer dasselbe tut, bekommt dasselbe, es lohnt nur anderes Handeln, und die Spielerin wird anders entscheiden. Erhalten bleiben Ninkasis Wissen (was sie gesehen hat, bleibt in der Erinnerung der Karte, das ist die Vorahnung), die Kosten und die Abklingzeit des Blinzelns und der gestiegene Glimmer; alles andere wird verworfen, auch EP und Meldungen aus der verworfenen Zeit, das Log vermerkt die Vorahnung. Vorbilder: Into the Breach (Zurücksetzen bei vorhersehbarem Ausgang, darum zählt nur anderes Handeln), Caves of Qud (Präkognition).

### Disziplinen

+ Telepathie: Sinnlichkeit, sekundär Klugheit; Wesen durch Wände spüren, Gedanken lesen (Absichten, Tempo), Gedankenstich als Psi-Schaden; göttlich sieht Ninkasi durch die Sinne eines Ziels
+ Furcht: Sinnlichkeit, sekundär Körperlichkeit; Furcht, Panik, Wahn; göttlich steckt Panik die Nachbarn an
+ Kontrolle: Sinnlichkeit, sekundär Klugheit; ein Wesen kämpft für Ninkasi, Zwietracht; göttlich springt die Kontrolle beim Tod des Ziels über; Voraussetzung, falls die Besessenheit kommt (Idee in [Ausblick.md](Ausblick.md), Steuerung anderer Wesen)
+ Ortswechsel: Sinnlichkeit, sekundär Gewandtheit; Blinzeln, Teleport; Meister nimmt ein Ziel mit, göttlich Platztausch mit einem Gegner
+ Psychokinese: Sinnlichkeit, sekundär Trinkfestigkeit; Stoßen, Geschosse ablenken, Pyrokinese (Getrunkenes oder Alkohol am Boden mit dem Geist entzünden); göttlich ein Kraftfeld
+ Vorahnung: Sinnlichkeit, sekundär Klugheit; verbessert das Zeitblinzeln: Grund geringere Kosten, Experte mehrere Züge zurück, Meister kürzere Abklingzeit, göttlich Vision, Ninkasi spielt einige Züge voraus und entscheidet danach, ob sie gelten, stirbt sie in der Vision, ist sie zurück am Anfang

### Selbstbeherrschung

+ Eigenschaften: Sinnlichkeit, sekundär Trinkfestigkeit
+ Lernt aus: Fehlschlägen und Rückschlägen der Psi, die Ninkasi überlebt
+ Grund: ein Rückschlag wird schwächer
+ Experte: seltener
+ Meister: ein Kontrollverlust dauert kürzer
+ Göttlich: der Rückschlag trifft das Ziel statt Ninkasi

### Schärfe

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: jedem Krit mit dem Tag `psi` (Lernanlass Kritisch)
+ Kritchance und Kritfaktor der Psi, das Gegenstück zu Präzision und Fokus
+ Tiers: Grund Kritchance, Experte Kritfaktor, Meister ein Krit verlängert die Zustände der Fähigkeit, göttlich ein Krit erstattet die PP

### Abschirmen

+ Eigenschaften: Sinnlichkeit, sekundär Klugheit
+ Lernt aus: freien EP und quer von Psi allgemein
+ Der Glimmer wächst langsamer, Psi-Jägerinnen und Geister früherer Läufe finden Ninkasi später (siehe [Ausblick.md](Ausblick.md), Geister früherer Läufe), telepathische Gegner spüren sie schlechter; die Heimlichkeit gegen den Geist
+ Tiers: Grund Glimmer langsamer, Experte Jägerinnen finden Ninkasi später, Meister telepathische Gegner spüren sie schlechter

### Willenskraft

+ Eigenschaften: Klugheit, sekundär Trinkfestigkeit
+ Lernt aus: Psi, das Ninkasi trifft oder das sie abwehrt
+ Hebt die Verteidigung `willenskraft` gegen Psi und den Widerstand gegen die Schadensart `psi`, mit der Obergrenze aller Widerstände (siehe Kampf, Verteidigung)
+ Tiers: Grund Verteidigung, Experte Widerstand gegen Psi, Meister geistige Kontrolle hält kürzer

Umsetzung: teilweise, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten (Risikotabelle `psi` mit Fehlschlag und Rückschlag, Glimmer als vorbereiteter Wert, Kontrolle über die Fraktion, Springen) und [Wesen.md](Wesen.md), Kampfwerte (`willenskraft`, Schadensart `psi`); Glimmer und Psi-Jägerinnen in [Wesen.md](Wesen.md), Glimmer; offen: alle Sets, Ekstase, Zeitblinzeln, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 20

## Offen

+ Verwandlung als mögliche Schule der Magie (Idee in [Ausblick.md](Ausblick.md), Verwandlung)
+ Mehrere Kessel zugleich (Vorbild Mass Production in EVE Online), nur als Konzept: ein späterer Tier von Brauen allgemein, wenn das Brausystem es trägt; nebeneinander stehende Kessel widersprechen dem Bleiben am Kessel nicht
