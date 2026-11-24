# Battle Ninkasi - Grundlagen

Stand: 2026-11-24

Mitprüfen bei Änderungen: [Charakter.md](Charakter.md), [Architektur.md](Architektur.md), [Wesen.md](Wesen.md), [Wirkungen.md](Wirkungen.md), [Welt.md](Welt.md), [Gegenstaende.md](Gegenstaende.md), [Tileset.md](Tileset.md), [Entwicklung.md](Entwicklung.md), [Ausblick.md](Ausblick.md), [Spielverlauf.md](Spielverlauf.md)

## Spiel

+ Dungeon-Crawler/Roguelike, rundenbasiert
+ Permadeath; dauerhafter Fortschritt zwischen den Läufen höchstens als Wissen (Rezepte, Bestiarium, Glossar), nie als stärkere Werte (entschieden 2026-11-22, Ideen in [Ausblick.md](Ausblick.md))
+ Gesteuert wird nur Ninkasi; Begleiter handeln selbst und nehmen von ihr Vorrangbefehle an (entschieden 2026-11-22, siehe Begleiter und Befehle in [Ausblick.md](Ausblick.md))
+ Zufällig erzeugte Dungeons
+ Offene Tiefe in Kapiteln, jedes mit eigenen Ebenenbildern, Gegnern und einem Boss; zwei Läufe unterscheiden sich vor allem durch den klassenlosen Build und die Fundstücke (siehe [Spielverlauf.md](Spielverlauf.md))
+ Hub: fester Ort zwischen den Kapiteln mit Diensten (Händler u.a.), der im Lauf mit jedem Kapitel reicher wird (siehe [Spielverlauf.md](Spielverlauf.md), Hub); ähnliche Dienste unterwegs durch wandernde Händler und Nebengottheiten
+ Zielgruppe: zunächst nur privat, Steam als spätere Option, Steam Deck kein Ziel
+ Open Source: Code unter GPL-3.0-or-later, Texte und Grafik unter CC BY-NC-SA 4.0, siehe [LIZENZEN.md](../LIZENZEN.md)

Umsetzung: teilweise, siehe [Welt.md](Welt.md), Ebenen; offen: Kapitel, Dienste des Hubs, wandernde Händler und Nebengottheiten

## Spielkern

+ Ninkasi ist die Inkarnation der mesopotamischen Göttin des Bieres, alkoholaffin
+ Alkohol ist Ressource: Bier, Wein und Brand
+ Drei Vorräte: Lebenspunkte (LP), Magiepunkte (MP), Psi-Punkte (PP)
+ Dazu der Pegel, gemessen in Promille, nach oben offen; in der Oberfläche als ‰, in Text und Doku "Pegel"
+ Magie und Psi sind getrennte Systeme mit eigenem Vorrat
+ Magie: gebunden an Ritual, Schrift und Alchemie, kostet neben MP auch Zeit und Material; langsamer, wirkt über die Zeit, etwas mehr in Richtung Crowd Control
+ Psi: sofort und rein geistig, hohes Risiko, hoher Ertrag; wirkt auf Einzelziele (Gedanken, Furcht, Kontrolle, Teleport); Wirksamkeit und Risiko steigen mit dem Pegel
+ Jeder Vorrat regeneriert mit eigenem Verlauf über den Pegel:
  + LP regenerieren immer, langsam (Vorbild: Brogue); ohne Pegel etwas langsamer, am schnellsten bei einem optimalen Pegel weit über dem von Normalsterblichen, darüber wieder abnehmend
  + MP regenerieren nüchtern am schnellsten, je höher der Pegel, desto langsamer
  + PP regenerieren nur bei hohem Pegel, je höher, desto schneller; unter einer niedrigen Schwelle schwinden sie
  + Regeneration und Schwund sind für jeden Vorrat möglich; Skills, Schriftrollen, Items und Zustände passen Rate, Schwund und Lage der Verläufe an, siehe Stoffwechsel in [Wesen.md](Wesen.md)
+ Folge: Auf Magie bereitet man sich nüchtern vor, Psi braucht für Regeneration und Wirksamkeit einen möglichst hohen Pegel, bei dem das Risiko steigt; Mischbuilds müssen ihren Rausch planen
+ Meditieren und Schriftrollen schreiben nur nüchtern
+ Waffen und Rüstung können verschleißen und kaputtgehen, auch durch Gebrauch; damit das kein Ärgernis wird, gibt es wirksame Wege, sie sehr gut in Schuss zu halten (Pflege über Kennerschaft, siehe [Skills.md](Skills.md), Wahrnehmung, und Reparatur)
+ Gegenstände wirken nur angelegt, das Gepäck ist Vorrat: Waffen, Rüstung, Schmuck und Zauberstäbe geben ihre Werte und Fähigkeiten erst in der Hand oder am Körper, ein Wechsel kostet Zeit; aus dem Gepäck wird nur getrunken, gelesen, geworfen und verbraucht; Ausnahmen sind passive Wirkungen wie ein Bier, das einmal vor dem Tod bewahrt
+ Ein Zauberstab bezahlt seine Fähigkeit mit eigenen Ladungen statt mit den Vorräten der Trägerin; trägt sie zwei gleiche, wird zuerst der zuerst angelegte geleert
+ Fähigkeiten aus Fundstücken: ein angelegter Gegenstand gewährt sie, solange er angelegt ist; ein Lehrstück (Schriftrolle, HACCP-Aushang) lehrt sie dauerhaft, gelernt ist gelernt; daneben gibt es Verbrauchsgegenstände, die einmal wirken
+ Vorschlag, noch nicht bestätigt: Bier füllt LP, Wein füllt MP, Brand füllt PP oder wirkt nur über den Pegel; jedes Getränk hebt den Pegel nach seinem Alkoholgehalt
+ Brand hebt den Pegel schneller als Wein und Bier
+ Wein füllt MP sofort, bremst über den Pegel aber die MP-Regeneration
+ Pegel klingt über die Zeit ab
+ Vorschlag, noch nicht bestätigt: linearer Abbau mit dem Tempo der Wirklichkeit, Trinkfestigkeit beschleunigt ihn; ein hoher Pegel hält so lange an
+ Option, zurückgestellt (2026-11-24): Ausdauer als vierter Vorrat; der Sprint kommt ohne sie aus (siehe Zeit und Tempo)
  + Kosten nur für körperliche Sonderaktionen (Kopfstoß, Bierfontäne, Ringen, Werfen), nie für Bewegen und normales Angreifen
  + Regeneriert schnell und unabhängig vom Pegel, der einzige Vorrat, der auch nüchtern verlässlich zurückkommt
  + Name vielleicht "Puste"
  + Kater: Sinkt der Pegel nach einem Rausch, sinkt vorübergehend die höchste Ausdauer; Ansatzpunkt für den Makel Aldehyd-Dehydrogenase-Mangel
+ Bestimmte Aktionen sind nur mit einem bestimmten Pegel durchführbar
+ Pegel bringt Risiko
+ Brausystem mit Zutaten und Rezepten
+ Brauen ist die einzige Herstellung: Getränke, Tränke und Gifte entstehen beim Brauen, Magie steigert nur ihre Wirkung; Brauen und Mälzen kann jede Ninkasi von Anfang an (siehe [Skills.md](Skills.md), Brauen)
+ Gebraut wird an festen Altären (Braukessel) oder in mobilen Kesseln
+ Ninkasi muss beim Brauen am Kessel bleiben, damit das Bier gut wird; eine Gärung, die ohne sie weiterläuft, gibt es nicht
+ Kessel in Tiers nach Material: Kupfer, Eisen, Edelstahl, Silber, Gold
+ Vorschlag, noch nicht bestätigt: weitere Materialien wie Ton (sumerische Brautradition), Holz (Fass), Bronze
+ Idee, noch nicht bestätigt: häufige Anwendung von Psi lässt Gegner erscheinen (Vorbild: Glimmer in Caves of Qud)
+ Vorschlag, noch nicht bestätigt: über einer Schwelle drohen Torkeln, Fehlschläge, Filmriss

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Stoffwechsel; siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten; siehe [Gegenstaende.md](Gegenstaende.md), Inventar; offen: Brausystem, Ausdauer, Schwellen und Risiken des Pegels, Ladungen der Zauberstäbe, Lesen mit Ziel, Verschleiß durch Gebrauch, Reparatur

## Zeit und Tempo

+ Ein Tick der Weltuhr ist die Norm: So lange dauert ein Schritt oder ein Angriff eines normal schnellen Wesens
+ Jedes Wesen hat ein eigenes Tempo für Bewegen und für Kampfaktionen; daran hängt, wer wem davonlaufen kann
+ Ninkasi ist zu Beginn zu Fuß etwa ein Fünftel langsamer als ein normal schnelles Wesen und im Kampf gleich schnell: Einem normal schnellen Gegner kann sie anfangs nicht davonlaufen, einem sehr langsamen schon; Skills machen sie schneller, bis sie spät auch normal schnellen Wesen davonläuft
+ Die Waffe bestimmt das Tempo des Angriffs: schnelle wie die Fäuste brauchen etwa die halbe Zeit, Zweihänder die Norm; mehr Schläge heißt mehr Würfe und mehr Wirkungen beim Treffer, ein einzelner Schlag wiegt dafür weniger
+ Sprint: Jede Ninkasi hat ihn von Anfang an als angeborene Fähigkeit (siehe [Charakter.md](Charakter.md), Skills); er beginnt ohne Zeit, macht für eine Weile das Bewegen schneller und hat eine Abklingzeit; solange er wirkt, steigt der Stoffwechsel, eine Ausdauer braucht er nicht; er hilft gegen viele Gegner, nicht gegen alle
+ Der Sprint ist vorerst die einzige Aktion ohne Zeit; zwischen zwei Aktionen mit Zeit gibt es höchstens eine ohne
+ Alle anderen Aktionen kosten Zeit: Trinken und Werfen etwa die Norm, der Waffenwechsel nach den Stücken, die ab- und angelegt werden (vom Tausch zweier Dolche bis zum Wechsel vom Zweihänder auf Schwert und Schild), eine Tür etwas mehr als der Schritt; diagonale Schritte kosten so viel wie gerade, das ist taktisch nutzbar
+ Manche Aktionen beginnen nur außerhalb eines Kampfes
+ Abklingzeiten laufen in Weltzeit, nicht in eigenen Aktionen: Schnelle Waffen beschleunigen nicht nebenbei alle Fähigkeiten
+ Betäubung schiebt die nächste Aktion des Ziels hinaus; Kontrollwirkungen wirken bei Wiederholung schwächer, bis eine Weile ohne sie vergangen ist, damit niemand dauerhaft festgehalten wird
+ Rüstung bremst doppelt: Ihr Gewicht zählt zur Last, und sie verlangsamt alle Aktionen gleichmäßig; Skills für leichte und schwere Rüstung mindern beides, das Gewicht fühlt sich leichter an, und bei voller Spezialisierung bremst leichte Rüstung kaum noch, schwere spürbar weniger, aber nie gar nicht
+ Magie in zwei Arten: Kampfzauber etwa so schnell wie ein Wurf; Rituale sind lange Aktionen, die nur außerhalb des Kampfes beginnen und dafür mächtig oder lange wirken
+ Fernkämpfer bewegen sich oder schießen, nie beides zugleich; ihr Fernangriff hat eine Abklingzeit oder begrenzte Munition, bei Schützen beides; so wechseln sie zwischen Schießen und Ausweichen und halten Ninkasi nicht dauerhaft auf Abstand
+ Wesen fliehen nur vor Langsameren
+ Durchschaubar: Ninkasis eigene Kosten, Restdauern und Abklingzeiten zeigt die Oberfläche auf eine Zeiteinheit genau, ebenso Zustände, die sie anderen zugefügt hat; das Tempo anderer Wesen steht in Worten in ihrer Beschreibung (siehe [Oberflaeche.md](Oberflaeche.md), Seitenleiste)
+ Handeln mehrere Wesen dicht hintereinander, zeigt die Animation sie nacheinander (siehe [Animationen.md](Animationen.md), Entschieden)

Umsetzung: teilweise, siehe [Architektur.md](Architektur.md), Zeitmodell; offen: Tempo je Wesen, Sprint, Abklingzeit in Weltzeit, Betäubung und abnehmende Kontrolle, Verlangsamung durch Rüstung, Anzeige auf eine Zeiteinheit genau, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 10

## Charakter

+ Charaktererstellung, Eigenschaften, Skills und EP: siehe [Charakter.md](Charakter.md)

Umsetzung: siehe [Wesen.md](Wesen.md), Skills und Lernen

## Gegner

+ Mikroorganismen verschiedener Art
+ Betriebskontrolleure
+ Abstinenzler
+ Bosse am Ende jedes Kapitels, Sobrietas am Ende größerer Bögen: siehe [Spielverlauf.md](Spielverlauf.md), Bosse
+ Vorschlag, noch nicht bestätigt: Hefen ambivalent, Milchsäurebakterien, Essigbakterien und Schimmel als Verderber
+ Idee, noch nicht bestätigt: Mikroorganismen teilen sich, ausgehend von einer Mutterzelle
+ Ideen, auszuarbeiten: jede Gruppe der Mikroorganismen mit eigener Mechanik
+ Bakterien: Zweiteilung in zwei gleiche Zellen, schnelles Wachstum (Milchsäure, Essig, Fäulnis)
+ Hefen: Sprossung, die Mutterzelle bleibt und sprosst weiter; Kulturhefe als möglicher Verbündeter, wilde Hefe (Brettanomyces) als Verderber
+ Schimmel: kaum beweglich, Myzel wächst Feld für Feld, setzt beim Tod Sporen frei (Vorbild: Flechte in Brogue)
+ Zerfall: aus den Resten besiegter Mikroorganismen entstehen neue, lästige Wesen (zweite Phase eines Kampfes)
+ Biofilm: Kolonie, die sich gemeinsam panzert, einzeln schwach, im Verbund zäh
+ Endosporen: ruhende Bakterien, erwachen später (Wärme, Feuer)
+ Protozoen und Amöben: einzelne Jäger, die andere Mikroorganismen fressen

Umsetzung: teilweise, siehe [Entwicklung.md](Entwicklung.md), Probeinhalt; siehe [Wesen.md](Wesen.md), KI; Teilung, Sprossung, Myzel, Zerfall und Bossphasen gehen aus Daten, siehe [Wirkungen.md](Wirkungen.md), Effektsystem; offen: die Mikroorganismen und Bosse als Inhalt

## Licht und Wahrnehmung

+ Licht ist Spielmechanik, Stimmung ein Nebeneffekt
+ Ebenen sind je nach Plan des Laufs hell oder dunkel; kein Wechsel von Tag und Nacht, weil Warten auf Dunkelheit das Rasten belohnte; später vielleicht helle Räume und dunkle Gänge auf derselben Ebene
+ Lichtquellen leuchten in einem Umkreis und werden zum Rand hin schwächer: Wandfackeln, Feuer, getragene Laternen; Kontrolleure tragen Taschenlampen
+ Helligkeit in fünf Stufen, so fein, dass mehr als hell, mittel und dunkel entsteht, und so grob, dass man jeden Unterschied bemerkt; nur die finsterste verbirgt ganz, die übrigen machen das Schleichen stufenweise leichter
+ Ninkasi sieht zu Beginn knapp weniger weit als ein gewöhnlicher Gegner und wird zuerst gesehen; schon wenige Stufen Fernsicht drehen das um
+ Im Finstern sieht man nur aus nächster Nähe, Ninkasi als Göttin etwas weiter als Sterbliche; Nachtsicht und Fernsicht kommen als Skills
+ Wer Licht trägt, sieht weiter und wird selbst von weitem gesehen
+ Manche Wesen spüren ihre Beute ohne Licht aus der Nähe, wie einen Geruch: entlang von allem, was offen ist, nie durch Wände oder geschlossene Türen; durch Wände reichen erst eigene Sinne wie Telepathie
+ Wer Ninkasi aus den Augen verliert, folgt ihrer Spur, bis sie zu alt oder Ninkasi zu weit fort ist; Heimlichkeit hilft auch dagegen

Umsetzung: teilweise, siehe [Welt.md](Welt.md), Licht, [Welt.md](Welt.md), Duft und [Wesen.md](Wesen.md), Wahrnehmung; offen: Licht ein- und ausschalten, Telepathie und andere Sinne

## Technik

+ Läuft im Browser (HTML, CSS, JavaScript)
+ Spätere Steam-Fassung durch Verpacken mit Electron oder Tauri
+ Karte auf Canvas, Oberfläche und Effekte als HTML/CSS darüber
+ Effekte wie schwebende Krit-Zahlen (größer, anders gefärbt) per CSS-Animation
+ rot.js für Dungeon-Erzeugung, Sichtfeld, Wegfindung, Zufall mit Startwert, Zugreihenfolge
+ Keine Spiele-Engine, kein Build-Schritt
+ Spiellogik getrennt von der Anzeige
+ Modularität, Flexibilität und Erweiterbarkeit gehen vor einfachem Code; lesbar bleibt er durch ausdrückliche Namen und Kommentare (siehe CLAUDE.md)
+ Läufe aus Startwert und Befehlsliste reproduzierbar, Inhalte als Daten, Zeitmodell mit Aktionskosten
+ Kamera mit Scrollen, Tile-Größe einstellbar
+ Texte zweisprachig über Sprachdateien, Textkorpus für erzeugte Texte
+ Details: [Architektur.md](Architektur.md) und die übrigen technischen Dokumente (Übersicht in CLAUDE.md), [Texte.md](Texte.md)

Umsetzung: siehe [Architektur.md](Architektur.md), Grundsätze

## Tileset

+ Pixelart in Draufsicht, in mehreren Größen; Claude zeichnet die Tiles
+ Echter Inhalt kommt gleich als Tile ins Spiel, nicht als Zeichen
+ Stil, Palette, Regel für Tiles, Pixeldaten und Ablauf verbindlich in [Tileset.md](Tileset.md)

Umsetzung: siehe [Tileset.md](Tileset.md), Pixeldaten

## Design

+ Tonfall: bis ins Mark sarkastisch, schwarzer Humor, düster, blutig, mit einer guten Portion Sex/Pornographie
+ Farbwelt: Biertöne, Edelstahl, Kupfer, Stein
+ Dazu eine eigene Palette Signalfarben
+ Palette der Tiles festgelegt: `grafik/palette.js`, siehe [Tileset.md](Tileset.md)

Umsetzung: teilweise, siehe [Tileset.md](Tileset.md), Artstyle-Fibel; offen: Signalfarben

## Offen

+ Regeneration im Detail: Raten und Form der Verläufe
+ Wo das Optimum der LP-Regeneration liegt und ob Trinkfestigkeit es nach oben verschiebt
+ Ob die LP-Regeneration bei sehr hohem Pegel negativ wird (Alkoholvergiftung), als natürliche Grenze des offenen Pegels
+ Ob die MP-Regeneration bei hohem Pegel auf null sinkt oder nur immer langsamer wird
+ Wofür der Brand gut ist: PP direkt füllen oder nur über den Pegel wirken
+ Ab welcher Schwelle "nüchtern" für Meditieren und Schriftrollen gilt
+ Worin das Risiko von Psi besteht (Fehlschlag, Kontrollverlust, Rückschlag); der Mechanismus (Risikotabellen über den Pegel) steht, siehe Fähigkeiten in [Wirkungen.md](Wirkungen.md)
+ Magie im Detail: welche Wirkungen über die Zeit (Schaden, Flächen, Segen und Fluch, Beschwörung)
+ Pegel im Detail: Schwellen, Risiken, Aktionen mit Mindestpegel
+ Ausdauer: ob überhaupt, Zuordnung zu Gewandtheit oder Körperlichkeit, Verhältnis zu einer Nahrungsuhr
+ Unterschiede der Mikroorganismen ausarbeiten (Hefen, Bakterien, Schimmel, weitere Gruppen)
+ Brausystem im Detail: Zutaten, Rezepte, Wirkung der Kessel-Tiers, Reihenfolge der Materialien
+ Folgen eines abgebrochenen Brauvorgangs: verdorben, minderwertig oder wieder aufnehmbar (Unterbrechung und Entscheidung per Befehl regelt [Wirkungen.md](Wirkungen.md), Lange Aktionen)
+ Dienste des Hubs im Detail
+ Ob der Pegel beeinflusst, wie weit Ninkasi im Dunkeln sieht
