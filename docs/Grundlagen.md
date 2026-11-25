# Battle Ninkasi - Grundlagen

Stand: 2026-11-25

Mitprüfen bei Änderungen: [Charakter.md](Charakter.md), [Architektur.md](Architektur.md), [Wesen.md](Wesen.md), [Wirkungen.md](Wirkungen.md), [Welt.md](Welt.md), [Gegenstaende.md](Gegenstaende.md), [Tileset.md](Tileset.md), [Entwicklung.md](Entwicklung.md), [Ausblick.md](Ausblick.md), [Spielverlauf.md](Spielverlauf.md), [Fundus.md](Fundus.md), [Brauen.md](Brauen.md)

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
+ Psi: sofort und rein geistig, hohes Risiko, hoher Ertrag; wirkt auf Einzelziele (Gedanken, Furcht, Kontrolle, Teleport, Vorahnung); Wirksamkeit und Risiko steigen mit dem Pegel; jede Ninkasi kann durch Zeitblinzeln einen Zug zurückgehen, der Zufall fällt dabei nicht neu aus (siehe [Skills.md](Skills.md), Psi)
+ Jeder Vorrat regeneriert mit eigenem Verlauf über den Pegel, LP und MP außerhalb des Kampfes, die PP im Kampf:
  + LP regenerieren außerhalb des Kampfes langsam; ohne Pegel etwas langsamer, am schnellsten bei einem optimalen Pegel weit über dem von Normalsterblichen, darüber wieder abnehmend; im Kampf ruhen sie, ein Skill lässt sie später auch dort fließen (siehe [Skills.md](Skills.md), Rauschheilung); im Kampf heilt das Bier, außerhalb die Zeit
  + MP regenerieren außerhalb des Kampfes, am schnellsten bei leichtem Pegel, nüchtern etwas langsamer, darüber immer langsamer; im Kampf ruhen sie
  + PP sind der Kampfespegel (Vorbild: die Wut des Kriegers in World of Warcraft): Ninkasi gewinnt sie im Kampf mit jedem Treffer, ausgeteilt wie erlitten, je höher der Pegel, desto mehr, unter einer niedrigen Schwelle gar nicht; außerhalb des Kampfes schwinden sie langsam, bei hohem Pegel kaum; je Treffer statt nach der Höhe des Schadens, damit der Gewinn nicht mit der Tiefe wächst; schnelle Waffen treffen öfter und gewinnen so mehr
  + Regeneration und Schwund sind für jeden Vorrat möglich; Skills, Schriftrollen, Items und Zustände passen Rate, Schwund, Gewinn im Kampf und Lage der Verläufe an, siehe Stoffwechsel in [Wesen.md](Wesen.md)
  + Wie lange die Leisten bis voll brauchen, gibt eine Norm vor (nüchtern, im Optimum, im Rausch), siehe [Wesen.md](Wesen.md), Normierung
+ Folge: Magie wirkt und regeneriert am besten bei leichtem Pegel, ein schmales Fenster, das saure Getränke halten (siehe [Brauen.md](Brauen.md), Brauen und Pegel); Psi braucht für Gewinn und Wirksamkeit einen möglichst hohen Pegel und den Nahkampf, bei dem das Risiko steigt; daraus Berserker-Builds aus Psi und Nahkampf, deren Form die Ekstase ist (siehe [Skills.md](Skills.md), Psi); Mischbuilds müssen ihren Rausch planen
+ Schriftrollen schreiben nur nüchtern; Meditieren am besten bei leichtem Pegel, nüchtern etwas schwächer, darüber immer schwächer (siehe [Skills.md](Skills.md), Magie)
+ Waffen und Rüstung können verschleißen und kaputtgehen, auch durch Gebrauch, aber nicht einfach so: Säure trifft sie nur mäßig, Leder ist gegen sie unempfindlich, und Säureschutz ist leicht zu bekommen (siehe [Brauen.md](Brauen.md), Absud); ein Stück kann mehrere Verzauberungen und Anstriche zugleich tragen; damit Verschleiß kein Ärgernis wird, gibt es wirksame Wege, sie sehr gut in Schuss zu halten (Pflege über Kennerschaft, siehe [Skills.md](Skills.md), Wahrnehmung, und Reparatur über das Handwerk, siehe [Skills.md](Skills.md), Anlagen und Fallen)
+ Gegenstände wirken nur angelegt, das Gepäck ist Vorrat: Waffen, Rüstung, Schmuck und Zauberstäbe geben ihre Werte und Fähigkeiten erst in der Hand oder am Körper, ein Wechsel kostet Zeit; aus dem Gepäck wird nur getrunken, gelesen, geworfen und verbraucht; Ausnahmen sind passive Wirkungen wie ein Bier, das einmal vor dem Tod bewahrt
+ Rüstung gehört immer zu einer von zwei Familien, leicht oder schwer; das Gewicht ist davon unabhängig ein eigener Wert des Stücks
+ Ein Zauberstab, in der Spielwelt ein verzaubertes Braupaddel, bezahlt seine Fähigkeit mit eigenen Ladungen statt mit den Vorräten der Trägerin; trägt sie zwei gleiche, wird zuerst der zuerst angelegte geleert
+ Fähigkeiten aus Fundstücken: ein angelegter Gegenstand gewährt sie, solange er angelegt ist; ein Lehrstück (Schriftrolle, HACCP-Aushang) lehrt sie dauerhaft, gelernt ist gelernt; daneben gibt es Verbrauchsgegenstände, die einmal wirken
+ Brand füllt PP direkt; so geht Ninkasi mit PP in einen Kampf, die sie sonst erst darin gewinnt
+ Vorschlag, noch nicht bestätigt: Bier füllt LP, Wein füllt MP; jedes Getränk hebt den Pegel nach seinem Alkoholgehalt
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
+ Brausystem mit Zutaten, Kulturen und Rezepten, im Einzelnen in [Brauen.md](Brauen.md)
+ Brauen ist die einzige Herstellung von Getränken, Tränken und Giften, Magie steigert nur ihre Wirkung; Bauen und Reparieren gehören zum Handwerk; Brauen und Mälzen kann jede Ninkasi von Anfang an (siehe [Skills.md](Skills.md), Brauen)
+ Gebraut wird an festen Altären (Braukessel) oder in mobilen Kesseln
+ Brauen ist ein Rätsel ohne Pflichtarbeit: ein Sud kostet so viel Zeit wie eine gewöhnliche Aktion und beginnt nur außerhalb des Kampfes, Ninkasi steht nicht wartend am Kessel
+ Kessel in Tiers nach Material, von Holz mit heißen Steinen bis Edelstahl (siehe [Brauen.md](Brauen.md), Kessel)
+ Ninkasis Pegel misst sich nicht an Sterblichen: wo Sterbliche längst tot wären, dreht sie erst richtig auf, und bis zu einem Pegel, der Sterbliche schwer berauscht, ist sie nüchtern; Getränke wirken nach ihrem Alkoholgehalt wie bei Sterblichen, ein gewöhnliches Bier bringt ihr wenig, stärkere Gebräue aus dem Brausystem bringen sie schneller voran
+ Stufen des Rauschs mit Namen: nüchtern, angeheitert, beschwipst, berauscht, im Rausch, sturzbetrunken, Vollrausch; das Optimum der LP-Regeneration und das sicherste Psi liegen in den Stufen ohne Strafen
+ Strafen des Rauschs, mit jeder Stufe stärker: ab berauscht Fehlschläge (Nah- und Fernkampf treffen schlechter, Magie und feine Arbeit misslingen öfter); im Rausch Torkeln (ein Schritt geht auf ein anderes Feld) und Danebenschlagen (der Schlag trifft ein Feld daneben, leer, mit einem Verbündeten oder einem anderen Feind); im Vollrausch der Filmriss: nur außerhalb des Kampfes ein Zeitsprung, in dem Ninkasi nicht handelt, danach ist die Karte der Ebene vergessen bis auf das, was sie gerade sieht
+ Risiko der Psi über den Pegel: nüchtern Fehlschläge, im Rausch der Rückschlag (Psi-Schaden an Ninkasi), sturzbetrunken dazu der Kontrollverlust (für eine Weile verwirrt, auch gegen Verbündete)
+ Glimmer (Vorbild: Caves of Qud): jede Psi-Fähigkeit hebt ihn, umso mehr, je höher der Pegel; er bleibt für den ganzen Lauf, die Gefahr steigt also mit der Zeit; über Schwellen des Glimmers erscheinen Psi-Jägerinnen, gewürfelt beim Betreten einer Ebene (sie trifft zu einer zufälligen Zeit ein) und bei jeder Psi-Fähigkeit (dann meist mitten im Kampf); sie wissen, wo Ninkasi ist; ihr Auftreten senkt den Glimmer wieder ein Stück, ohne dass er von selbst schwindet; sie geben EP wie andere Gegner; wer die Mechaniken kennt, besiegt sie irgendwann verlässlich; später werden die Geister früherer Läufe zu den Jägerinnen (siehe [Ausblick.md](Ausblick.md), Geister früherer Läufe)
+ Skills mildern die Strafen, ohne die Schwellen zu verschieben (Standfestigkeit, Selbstbeherrschung, Abschirmen, siehe [Skills.md](Skills.md))

Umsetzung: teilweise, siehe [Wesen.md](Wesen.md), Stoffwechsel und Glimmer; siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten; siehe [Gegenstaende.md](Gegenstaende.md), Inventar; offen: Brausystem, Ausdauer, Fehlschläge der feinen Arbeit außer Magie (mit Lesen, Fallen und Brauen), Brand füllt PP (mit dem Brausystem), Regeneration im Kampf über einen Skill, Ladungen der Zauberstäbe, Lesen mit Ziel, Verschleiß durch Gebrauch, Reparatur

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

Umsetzung: teilweise, siehe [Architektur.md](Architektur.md), Zeitmodell; siehe [Wirkungen.md](Wirkungen.md), Kontrolle; siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung; Sprint, Rüstung, Türen und Waffenwechsel mit Probewerten, Fernkämpfer wechseln im Probeinhalt zwischen Schießen und Ausweichen, Rituale nur außerhalb des Kampfes über die Bedingung `ausser_kampf`; offen: der Sprint als angeborene Fähigkeit und die Zahlen mit dem Inhalt, Normierung in [Systemausbau.md](Systemausbau.md), Punkt 10

## Charakter

+ Charaktererstellung, Eigenschaften, Skills und EP: siehe [Charakter.md](Charakter.md)

Umsetzung: siehe [Wesen.md](Wesen.md), Skills und Lernen

## Gegner

+ Mikroorganismen verschiedener Art
+ Betriebskontrolleure
+ Abstinenzler
+ Bosse am Ende jedes Kapitels, Sobrietas am Ende größerer Bögen: siehe [Spielverlauf.md](Spielverlauf.md), Bosse
+ Stoff für Bosse, Figuren und lästige Kleingegner aus der babylonischen Literatur (Ḫumbaba, Skorpionmenschen, Dämonen, Ungeziefer im Keller): siehe [Fundus.md](Fundus.md)
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
+ Gegner haben eine Stärke auf einer festen Skala von Futter bis Elite, gemessen an der Ninkasi zu Beginn; ein gewöhnlicher Gegner ist allein nie ebenbürtig, gefährlich wird die Menge, und selbst eine Elite bleibt allein knapp schlagbar
+ Mit jeder Stärke wächst die Gefahr ungefähr auf das Doppelte, die EP wachsen mit; Stärke kommt aus Leben und Schaden, nicht aus der Trefferchance, die bleibt den Skills

Umsetzung: teilweise, siehe [Entwicklung.md](Entwicklung.md), Probeinhalt; siehe [Wesen.md](Wesen.md), KI; Stärke siehe [Wesen.md](Wesen.md), Normierung; Teilung, Sprossung, Myzel, Zerfall und Bossphasen gehen aus Daten, siehe [Wirkungen.md](Wirkungen.md), Effektsystem; offen: die Mikroorganismen und Bosse als Inhalt

## Licht und Wahrnehmung

+ Licht ist Spielmechanik, Stimmung ein Nebeneffekt
+ Ebenen sind je nach Plan des Laufs hell oder dunkel; kein Wechsel von Tag und Nacht, weil Warten auf Dunkelheit das Rasten belohnte; später vielleicht helle Räume und dunkle Gänge auf derselben Ebene
+ Lichtquellen leuchten in einem Umkreis und werden zum Rand hin schwächer: Wandfackeln, Feuer, getragene Laternen; Kontrolleure tragen Taschenlampen
+ Helligkeit in fünf Stufen, so fein, dass mehr als hell, mittel und dunkel entsteht, und so grob, dass man jeden Unterschied bemerkt; nur die finsterste verbirgt ganz, die übrigen begrenzen die Sicht und machen das Schleichen stufenweise leichter
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
+ Ab welcher Schwelle "nüchtern" für Schriftrollen gilt und wo das Optimum des Meditierens liegt
+ Magie im Detail: welche Wirkungen über die Zeit (Schaden, Flächen, Segen und Fluch, Beschwörung)
+ Aktionen mit Mindestpegel
+ Ausdauer: ob überhaupt, Zuordnung zu Gewandtheit oder Körperlichkeit, Verhältnis zu einer Nahrungsuhr
+ Unterschiede der Mikroorganismen ausarbeiten (Hefen, Bakterien, Schimmel, weitere Gruppen)
+ Dienste des Hubs im Detail
+ Ob der Pegel beeinflusst, wie weit Ninkasi im Dunkeln sieht
