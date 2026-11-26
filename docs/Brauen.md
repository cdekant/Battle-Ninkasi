# Battle Ninkasi - Brauen

Stand: 2026-11-26

Mitprüfen bei Änderungen: [Grundlagen.md](Grundlagen.md), [Skills.md](Skills.md), [Spielverlauf.md](Spielverlauf.md), [Ausblick.md](Ausblick.md), [Texte.md](Texte.md), [Gegenstaende.md](Gegenstaende.md), [Sude.md](Sude.md), [Bedienung.md](Bedienung.md)

Das Brausystem ist der Kern des Spiels: Es bestimmt Zutaten, Gegenstände, Beute, Orte und Rezepte und ist neben den Skills die zweite Achse eines Builds (siehe [Spielverlauf.md](Spielverlauf.md), Was zwei Läufe unterscheidet). Dieses Dokument sagt, wie Brauen sich anfühlt und wie seine Teile zusammenhängen; die Skills dazu stehen in [Skills.md](Skills.md), Brauen, die Bierstile mit ihren Kennzahlen in [Texte.md](Texte.md), Bierstile.

## Vorbilder

+ Potion Craft: jede Zutat verschiebt den Trank in eine feste Richtung, die Wirkungen sind Orte auf der Karte, wie genau er dort landet, bestimmt seine Stärke; gelungene Wege kommen ins Rezeptbuch; unbekannte Ziele zeigen sich erst beim Erreichen
+ Atelier (Rorona, Ryza): die Güte des Ergebnisses folgt aus der Güte der Zutaten und dem Können der Alchemistin, Eigenschaften der Zutaten gehen ins Ergebnis über
+ Caves of Qud: gekocht wird nur an festen Orten; eine Zutat allein gibt ihre Grundwirkung, mehrere ergeben Verbindungen aus Auslöser und Wirkung; manche Zutaten wirken zufällig
+ Brewmaster: Kennzahlen (Alkohol, Bittere, Farbe) aus den Zutaten; übernommen sind nur die Kennzahlen, nicht die Simulation jedes einzelnen Schritts
+ Die Brauwirklichkeit: Stammwürze aus der Schüttung, Alkohol aus Stammwürze und Vergärungsgrad, Bittere nach Menge und Kochzeit des Gewürzes, Farbe nach den Malzen; vereinfacht übernommen

## Grundsätze

+ Brauen ist ein Rätsel, keine Pflichtarbeit: das Erkunden eines neuen Suds darf Mühe machen, das Wiederholen eines bekannten nicht
+ Ein Sud kostet so viel Zeit wie eine gewöhnliche Aktion; Ninkasi steht nicht wartend am Kessel, eine Gärung über viele Züge gibt es nicht, und so auch keinen Sud, der durch Weggehen oder einen Treffer verdirbt
+ Gebraut wird nur außerhalb des Kampfes; im Kampf wird höchstens Trockenbier angerührt, und das erst mit Skills und Kulturen (siehe Trockenbier und Sud im Kampf)
+ Gebraut wird nur am Kessel (siehe Kessel)
+ Gemischt wird nur beim Brauen: Lachen auf dem Boden mischen sich nicht, auf einem Feld liegt höchstens eine Flüssigkeit (siehe [Ausblick.md](Ausblick.md), Flüssigkeiten und Gase)
+ Durchschaubar: die Vorschau zeigt, wohin ein Sud geht, nicht wie gerechnet wird
+ Geschichte und Brauwirklichkeit sind Vorbild, nicht Vorschrift: das Spiel ist trashig, und längst nicht jedes alte Rezept und jede alte Praktik ist überliefert; Zutaten und Verfahren dürfen frei erfunden oder versetzt werden, wenn es dem Spiel dient

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Befehl; offen: Trockenbier, Sud im Kampf, Flüssigkeiten, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Ablauf

1. Zutaten wählen: am Kessel zuerst, wie viele Flaschen der Sud füllen soll, dann die Rohstoffe aus dem Gepäck, per Klick; was auf wenige Flaschen kommt, gibt einen starken Sud; dazu wenige Hebel: die Menge je Zutat, die Maischtemperatur (kühl gemaischt trocken und stärker, warm gemaischt süß und vollmundig), Gewürz früh (bitter) oder spät (Aroma), die Kultur
2. Vorschau: das Profil des Suds wandert mit jeder Wahl mit, als ungefährer Bereich statt als genauer Punkt
3. Brauen: der Wurf setzt den genauen Punkt im Bereich und entscheidet über Gelingen und Verderben
4. Ergebnis: der Sud wird in leere Gefäße aus dem Gepäck abgefüllt, so viele Portionen, wie Gefäße und Kessel erlauben

+ Freies Brauen: ohne Rezept, die Vorschau ist ungefähr, dafür kann der Sud in Unbekanntes führen und dort ein Zielgebiet entdecken
+ Brauen nach Rezept: ein Klick auf ein bekanntes Rezept verteilt die vorhandenen Rohstoffe von selbst, die Vorschau ist eng
+ Ohne Kultur wird der Sud ein Absud mit eigener Vorschau (siehe Absud)
+ Gemälzt wird nicht: Malz und anderes Zuckerhaltiges kommt als Beute (siehe Zutaten)

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Befehl, Nebel und Rezepte und Absud, und [Bedienung.md](Bedienung.md), Fenster; offen: Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Profil des Suds

Ein Sud hat ein Profil wie ein Aromaprofil der Verkostung, als Spinnennetz dargestellt: auf jeder Achse ein Wert, das Ziel als Spanne je Achse. Das gilt für Bier und alles, was eine Kultur oder die wilde Flora vergärt; der Absud zeigt sich anders (siehe Absud).

+ Kennzahlen: Stärke (Stammwürze), Alkohol, Bittere, Farbe; berechnet nach vereinfachten Formeln der Brauwirklichkeit aus Schüttung je Volumen, Maischtemperatur, Gewürzgabe und Kultur
+ Jede Kultur verträgt nur so viel Alkohol; was sie darüber hinaus vergären könnte, bleibt als Zucker im Sud und macht ihn süß; so entstehen konzentrierte, süße Starkbiere, und Skills heben die Grenze der Kulturen später darüber hinaus
+ Aromen: etwa Malz, Röst, Frucht, Kräuter, Säure, Rauch, Süße, Holz; jede Zutat trägt feste Anteile bei; welche Achsen es gibt, legen die Daten fest
+ Die Unschärfe der Vorschau ist der Spielraum des Wurfs; Rezeptur verkleinert sie, ein Rezept noch mehr
+ Unbekannte Zutaten zeigen eine Vermutung, bis Ninkasi mit ihnen braut (siehe Absud, unbekannte Kräuter)
+ Die Werte werden für die Wirkung auf wenige Stufen gerundet; so ergeben gleiche Rezepte meist gleiche Sude

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Profil, und [Bedienung.md](Bedienung.md), Fenster (Spinnennetz); offen: Rauch und Holz, unbekannte Zutaten im Bier (im Absud umgesetzt, siehe [Sude.md](Sude.md), Absud), Rezeptur verkleinert die Unschärfe (ein Rezept tut es schon), Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Zielgebiete

+ Ein Zielgebiet ist ein Stil oder ein Rezept: eine Spanne je Achse, ein Name und eine eigene Wirkung
+ Die modernen Bierstile bringen ihre Spannen aus den Kennzahlen mit (siehe [Texte.md](Texte.md), Bierstile); sie liegen fast alle zwischen Malz, Röst und Bitter
+ Darüber hinaus gibt es historische und erfundene Zielgebiete, vor allem auf den Achsen der Aromen: sumerische Biere, Kräuterbiere, Fruchtbiere, Sauerbiere
+ Alle Getränke teilen sich dieses eine Schema: Wein liegt bei Frucht und Säure, Met bei Süße, Kombucha und Kefir bei Säure mit wenig Alkohol
+ Die Epoche begrenzt sich über die Zutaten, nicht über Regeln: ohne Hopfen bleiben viele moderne Stile außer Reichweite
+ Freie Sude bleiben etwas hinter gefundenen Rezepten zurück, die einen Kniff mitbringen (eine besondere Zutat, ein Verfahren)
+ Nebel: zu Beginn sind die Zielgebiete verborgen, ein Sud deckt eines auf, wenn er es trifft oder ein Rezept es zeigt; über Läufe hinweg bleibt nur, wo ein aufgedecktes Zielgebiet liegt und wie es heißt, als Umriss im Spinnennetz (Wissen, nicht Stärke, siehe [Grundlagen.md](Grundlagen.md), Spiel); den Weg dorthin findet Ninkasi in jedem Lauf mit dessen Zutaten neu
+ Die erste Familie sind die antiken Biere: ein Grundstoff (Malz, Bierbrot, Emmer, Datteln) mit spontaner Gärung oder einer Kultur, die Stellschraube ist vor allem die Säure; süß und malzig heilt schwach LP, sauer füllt schwach MP, dazwischen etwas von beidem; Gewürze geben hier keine Bierwirkung, sondern führen in den Absud
+ Die Namen der antiken Zielgebiete kommen von den sumerischen Biersorten: dunkles Bier, süßes dunkles Bier, rötliches Bier, gefiltertes Bier, starkes Bier (nach Powell 1994 bei `sallaberger2012bierbrauen`); ihre Profile sind Erfindung des Spiels

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Zielgebiete und Nebel und Rezepte; offen: moderne Stile, eigene Zielgebiete der Rezepte, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Wirkung

+ Bier füllt vor allem die Vorräte (LP, MP, PP), mit wenigen Schutzwirkungen seiner Aromen; Zustände, also Stärkungen und Schwächungen, kommen aus dem Absud (siehe Absud)
+ Die Achsen tragen Bedeutung, damit Wirkungen vorhersehbar bleiben: Stärke und Malz heilen LP, Frucht füllt MP, Kräuter stärken Psi und Rausch, Säure füllt MP, reinigt und schützt vor Gift und Krankheit, Röst härtet ab, Rauch schützt vor Feuer, Süße heilt über die Zeit; die Zuordnung ist ein erster Entwurf
+ Säure ist zweischneidig: als gewollte Richtung füllt sie MP bei wenig Alkohol und ist so das Steuer der Magierin (siehe Brauen und Pegel), als Fehler eines schwachen Wurfs führt sie zu Schal und Essig (siehe Gelingen und Verderben); ein Gift der Säure ätzt als Wurf oder Bestreichen Rüstung und Panzer
+ Budget statt Summe: die Stärke des Suds ist das Budget seiner Wirkung, es verteilt sich anteilig auf die Achsen; ein Sud aus wenigen Zutaten wirkt gebündelt und stark, ein vielschichtiger breit und je Achse schwächer
+ Die Wirkung des Zielgebiets gibt es nur, wenn das ganze Profil getroffen ist; das lohnt die Vielschichtigkeit
+ Der Alkohol hebt den Pegel, wie jedes Getränk (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Weitere Wirkungen kommen von Zusätzen (Kräuter und andere Zutaten mit eigenem Effekt), Kulturen, gefundenen Rezepten und Fähigkeiten, die einem Sud Wirkungen geben oder Zielgebiete verstärken; Skills verstärken das Ganze (siehe [Skills.md](Skills.md), Brauen)
+ Spezialbiere wie das Phönixbier sind Sude mit einem besonderen Zusatz

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Wirkung (Süße über die Zeit); offen: Röst, Rauch, Schutz durch Säure, Zusätze, Kulturen und Fähigkeiten als Quellen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Zutaten

+ Grundstoffe liefern die Stärke: Malz, Brot (Bappir, Kwass), Reis und Mais, Honig, Frucht, Pflanzensaft, Milch, Tee mit Zucker; jeder bringt seine Aromen mit
+ Mälzen kommt nicht als eigenes System: Stärke liefern vermälzte Rohstoffe (Malzsorten, Bierbrot) und Zuckerhaltiges (Honig, Datteln, Frucht, Pflanzensaft), die Ninkasi findet, erbeutet oder kauft; den Röstgrad bringt die Malzsorte mit; unvermälztes Getreide gibt wenig Stärke und bleibt Beigabe, Koji verzuckert es als Kultur
+ Gewürze geben Bittere und Aroma, Hopfen ist eines unter vielen
+ Kräuter haben eine Primärwirkung, die immer gilt (ihre Beiträge zu den Achsen und eine feste Wirkung), und eine Sekundärwirkung, die erst mit einem passenden Partner im selben Sud oder mit der Schule Gruit erwacht; die Kennerschaft zeigt sie vorher
+ Im Absud geben Kräuter und andere Zutaten die Richtung und die Neigung zu Elixier oder Gift (siehe Absud)
+ Kräuter dienen auch dem Kampf, etwa Schafgarbe gegen Blutung, Gagel für die Wut im Nahkampf, Augentrost für Sicht und Fernkampf, Baldrian für die Selbstbeherrschung bei Psi
+ Umfang: eine Handvoll Kräuter im ersten Kapitel, über alle Epochen zwei bis drei Dutzend
+ Rohstoffe werden in der Welt geerntet (Felder, Haine, Pflanzen, siehe [Spielverlauf.md](Spielverlauf.md), Erstes Kapitel); die Sets der Rohstoffe heben Menge und Güte der Ernte (siehe [Skills.md](Skills.md), Brauen)

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Profil und Absud; offen: Primär- und Sekundärwirkung, Kräuter für den Kampf, Ernten, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Kulturen

+ Mikroorganismen bestimmen die Gärung: wie viel der Stärke zu Alkohol wird, wie viel Alkohol sie verträgt, welche Aromen und Säure sie beitragen und welche Achse sie verstärken
+ Ninkasi beginnt ohne Kultur und braut zuerst spontan; die wilde Hefe trifft sie schon in der ersten Ebene: sie vergärt schwach, verträgt wenig Alkohol und bringt etwas Frucht und Säure
+ Ninkasi gewinnt eine Kultur, wenn sie neben einem Wesen dieser Art steht; Sehen allein bringt nur das Wissen über die Wesenart; töten muss sie es nicht, so bleibt Freundschaft mit Mikroorganismen möglich, und die frühen Mikroorganismen sind langsam genug, dass Ninkasi ihnen davongehen kann; ein getötetes hinterlässt einen Rest, der die Kultur ebenso gibt
+ Alle paar Ebenen treten neue Arten auf, tiefer auch mutierte Formen mit einem oder mehreren Merkmalen (etwa alkoholtolerant, übervergärend, fruchtig, phenolisch, sauer), die die Werte der Kultur verschieben und ihr den Namen geben; jede Form ist eine eigene Kultur, so lohnt die Suche nach seltenen Formen
+ Fundorte sind der zweite Weg, vor allem zu seltenen Kulturen: ein alter Kessel mit Gärrest in der ersten Ebene, alte Flaschen in Schatzkammern
+ Ninkasi trägt von jeder gewonnenen Kultur eine Probe ohne Gewicht; sie verbraucht sich nicht
+ Spontane Gärung braucht keine Probe: sie nimmt die wilde Flora der Ebene, die an jedem Ort anders ist
+ Kulturen verbessern sich durch Gebrauch (siehe [Skills.md](Skills.md), Brauen)
+ Ideen für die Rollen: übervergärende Hefe (trocken, viel Alkohol, für den Pegel), Brettanomyces (weniger Alkohol, verstärkt die MP), untergärige Hefe (sauber, enge Vorschau), Kveik (gärt heiß und schnell, der Weg zum Sud im Kampf), Milchsäurebakterien (Säure ohne Alkohol), Essigbakterien (Essig), Koji (verzuckert Reis ohne Mälzen), Kefirknollen und Teepilz (Säure, wenig Alkohol, Kombucha senkt den Pegel), wilde Hefe

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Kulturen (Gewinn neben dem Wesen und am Rest, Formen mit Merkmalen, Proben zum Aufheben) und Spontane Gärung; offen: Fundorte (Punkt 16), Verbessern durch Gebrauch (Punkt 20), Arbeit in [Systemausbau.md](Systemausbau.md)

## Absud

+ Ein Sud ohne Kultur ist ein Absud: die Magie Ninkasis lenkt seine spontane Gärung, statt Alkohol entsteht Wirkung; kein Alkohol, kein Pegel
+ Bier füllt die Vorräte, der Absud gibt Zustände: Elixiere stärken, Gifte schwächen und schaden über die Zeit, oft geworfen als Fläche; beide lassen sich auch auftragen (siehe Bestreichen)
+ Richtung: jede Zutat des Absuds trägt zu Richtungen bei; eine Richtung ist eine Schadensart (Feuer, Säure, Gift) oder ein anderes Feld der Wirkung (Sicht, Geist), alle gleich behandelt und gleich angezeigt; die am stärksten vertretene gibt die eine Wirkung des Absuds, bei Gleichstand die in den Daten zuerst stehende; mehr als eine Wirkung hat ein Absud nicht
+ Jede Richtung hat zwei Pole, Elixier und Gift: Feuer schützt als Elixier vor Brand und stärkt den eigenen Feuerschaden und brennt als Gift über die Zeit; Sicht gibt als Elixier Hellsicht und Fernsicht und als Gift Halluzination und Blindheit; ein Elixier einer Schadensart stärkt auch Zauber dieser Art
+ Mächtigkeit: Nahrung je Fläschchen (Zucker und Stärke gären stark), Güte der Zutaten und Magie; wenige Fläschchen geben einen mächtigen Absud, wie beim Bier
+ Anspruchsvolle Wirkungen: ein mächtiger Absud erreicht eine stärkere Stufe seines Pols (Immunität statt eines Viertels Widerstand), misslingt aber leichter
+ Absicht: am Kessel wählt Ninkasi Elixier oder Gift; Zutaten neigen zu einem Pol (ein berauschendes Kraut zum Gift), gegen die Neigung ist die Chance schlechter, aber nicht null; Skills verschieben sie
+ Der Wurf hat drei Ausgänge: die Absicht gelingt; sie schlägt um ins Gegenteil mit derselben Richtung und Mächtigkeit; oder der Absud misslingt ganz zu einer trüben Brühe, die eine milde Krankheit setzt, getrunken auf Ninkasi, geworfen auf den Gegner; die Chance des Misslingens ist klein, manche Kräuter und die anspruchsvollen Stufen heben sie
+ Absude verderben nicht, weder am Kessel noch im Gepäck; ihr Wagnis ist allein der Wurf
+ Anzeige: kein Spinnennetz, weil keine Mischung zählt, sondern Balken je Richtung mit der führenden hervorgehoben, die Mächtigkeit als Balken mit Zahl und die Chancen der drei Ausgänge
+ Unbekannte Kräuter: Grundstoffe kennt Ninkasi als Göttin des Biers, viele Kräuter nicht; ein unbekanntes Kraut zeigt eine Vermutung, Balken in Richtungen, die auf seine wahre Wirkung hindeuten können oder nicht; mit der Kräuterkunde wird die Vermutung genauer, je nach Schwierigkeit des Krauts; braut Ninkasi mit dem Kraut, kennt sie es; was sie selbst braut, kennt sie immer, das Erkennen des eigenen Gebräus soll keine Pflichtarbeit sein
+ Gefundene Elixiere und Gifte sind unbekannt (siehe [Gegenstaende.md](Gegenstaende.md), Unbekanntes), bis Ninkasi die Sorte selbst gebraut oder benutzt hat
+ Was Ninkasi über Kräuter weiß, bleibt über Läufe hinweg (Wissen, nicht Stärke, siehe [Grundlagen.md](Grundlagen.md), Spiel); die Richtungen der Kräuter stehen fest und werden nicht je Lauf gewürfelt; vorläufig, das Wissen lässt sich noch auf den Lauf beschränken
+ Elixiere und Gifte heben den Pegel nicht; so stützt der Absud die Magierin, die bei leichtem Pegel am besten wirkt
+ Rezepte braucht der Absud nicht: frei gebraut ist jede Richtung erreichbar; gefundene Rezepte bringen wie beim Bier einen Kniff (bessere Chance, mehr Stärke, besondere Wirkungen wie den Säureschutz zum Auftragen)

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Bestreichen

+ Ein Elixier oder Gift lässt sich auf eine Waffe streichen: es wirkt bei jedem Treffer und reicht für einige Treffer (Vorbilder die Öle in The Witcher 3 und die Gifte in Skyrim)
+ Auf Munition reicht ein Fläschchen für einen Teil eines Stapels; die bestrichenen Stücke bilden einen eigenen Stapel
+ Anstriche für Rüstung (der Säureschutz) wirken wie eine Verzauberung; ein Stück trägt mehrere zugleich (siehe [Grundlagen.md](Grundlagen.md), Spielkern)
+ Gezählt wird nach Treffern, nicht nach Zeit; eine Buchhaltung über einzelne Stücke soll es nicht geben

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 8

## Trockenbier und Sud im Kampf

Vorbild ist das sumerische Trockenbier (dida): ein krümeliger Extrakt aus dem Treber einer ersten Gärung, der gelagert und auf Reisen mitgenommen wurde und sich jederzeit zu frischem Bier anrühren ließ (nach `sallaberger2012bierbrauen`).

+ Ein Sud lässt sich statt in Gefäße als Trockenbier abfüllen: leicht, ohne Gefäß, verdirbt langsam, aber noch nicht trinkbar
+ Anrühren macht daraus ein Getränk mit dem Profil seines Suds: Wasser, ein leeres Gefäß und eine Kultur, kein Kessel
+ Außerhalb des Kampfes kostet das Anrühren eine gewöhnliche Aktion, im Kampf erst mit dem Schnellsud (siehe [Skills.md](Skills.md), Brauen); das Rätsel des Suds bleibt so außerhalb des Kampfes, im Kampf fällt nur die Wahl, welches Trockenbier mit welcher Kultur
+ Kveik gärt heiß und schnell: mit Kveik zählt der Schnellsud einen Tier höher; Hitze in der Nähe (Feuer, Glut, Fackel) beschleunigt das Anrühren
+ Idee, noch nicht bestätigt: ein frisch angerührtes Trockenbier geworfen schäumt auf dem Feld, verlangsamt, berauscht oder lockt Mikroorganismen an

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Gelingen und Verderben

+ Misslingt das Rätsel, trifft der Sud kein Zielgebiet und wird ein schwaches freies Bier
+ Ein Wurf entscheidet, ob der Sud verdirbt; Hygiene, Kessel und Kultur verschieben ihn, spontane Gärung ist riskanter; ein schwacher Wurf schiebt den Sud Richtung Säure, ein verdorbener wird Essig
+ Aus einem verdorbenen Sud kann mit einer Chance ein Gegner hervorgehen, ein Verderber aus dem eigenen Kessel
+ Im Gepäck verdirbt Gebrautes in Stufen: frisch, bei starken Suden vorher reif (die Güte steigt), dann schal, sauer und Essig; jede Stufe wirkt schwächer als die vorige
+ Alkohol, Gewürze, Säure, Güte und Skills verlängern jede Stufe; ein Stapel kippt als Ganzes in die nächste
+ Essig ist kein Abfall, sondern Zutat (Posca, Oxymel)
+ Für den Absud gilt das nicht, er verdirbt nicht (siehe Absud)

Umsetzung: teilweise, siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß, und [Sude.md](Sude.md), Befehl und Reifen und Verderben; offen: Hygiene, Skills verlängern die Stufen, Essig als Zutat für Posca und Oxymel

## Rezepte

+ Zu Beginn kennt Ninkasi kein Rezept; sie findet sie unterwegs
+ Ein gefundenes Rezept zeigt sein Zielgebiet und einen bewährten Weg dorthin und bringt einen Kniff mit; beim ersten Gelingen gibt es gebundene EP (siehe [Skills.md](Skills.md), Brauen)
+ Ein Rezept ist ein Punkt im Zielgebiet mit einer Güte nach seinem Abstand zur Mitte, kein eigenes Gebiet; nach Rezept gebraut liegt der Sud eng um diesen Punkt
+ Ein Rezept hält seine Zutaten im Verhältnis zur Zahl der Flaschen; nach Rezept braut, wer für die gewählten Flaschen dasselbe Verhältnis trifft
+ Ein gelungener freier Sud wird zum Hausrezept: danach so verlässlich wie ein gefundenes Rezept, aber nicht stärker; je Zielgebiet gibt es ein Hausrezept, ein späterer Treffer mit höherer Güte ersetzt es, so werden die Rezepte im Lauf besser
+ Gefundene Rezepte bleiben wertvoll, auch wenn alle Zielgebiete aufgedeckt sind: sie bringen ihren Kniff, die EP beim ersten Gelingen und manche ein eigenes kleines Zielgebiet, das nur mit ihrem Kniff erreichbar ist
+ Das Rezeptbuch hält beide, nur für den Lauf; über Läufe hinweg bleiben allein die aufgedeckten Zielgebiete (siehe Zielgebiete, Nebel)

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Nebel und Rezepte; offen: gebundene EP beim ersten Gelingen (heute frei), eigene Zielgebiete der Rezepte, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Kessel

+ Kessel sind Orte und Gegenstände: im Hub steht immer einer, auf den Ebenen häufig feste Kessel (etwa in Brauräumen), aber nicht garantiert; ein mobiler Kessel ist früh verlässlich zu finden, aber schwer, das ist eine Abwägung zwischen Last und Freiheit
+ Tiers nach Material: Holz mit heißen Steinen (Steinbier), Ton (sumerische Tradition, kalt gemaischt und im offenen Gefäß vergoren, ohne Feuer), Kupfer, Bronze, Eisen, Edelstahl; darüber offen
+ Ein besserer Kessel fasst mehr Zutaten und gibt mehr Portionen, verdirbt seltener und erreicht so fernere Zielgebiete
+ Brand entsteht nicht im Kessel, sondern aus einem fertigen Getränk an der Brennblase, einem eigenen Gegenstand

Umsetzung: teilweise, siehe [Sude.md](Sude.md), Befehl; offen: Kessel als Gegenstand, Tiers nach Material, Kessel im Hub, Brennblase, Arbeit in [Systemausbau.md](Systemausbau.md), Punkt 23

## Getränke

Gebräue der Welt und wie sie sich einordnen; Stoff für Zielgebiete und Rezepte, die Wirkungen sind Ideen des Spiels, keine Aussagen über echte Heilkraft:

| Gebräu | Grundstoff und Kultur | Profil | Idee für die Wirkung |
|:---|:---|:---|:---|
| Kwass, Bappir-Bier | Brot, Hefe | wenig Alkohol, Malz, Säure | Sättigung, LP |
| Trockenbier (dida) | getrockneter Treber einer ersten Gärung | wie der Sud, aus dem es stammt | Vorrat für die Reise, im Kampf angerührt |
| Chicha, Makgeolli, Sake | Mais oder Reis, Hefe oder Koji | Stärke ohne Malz | LP, Widerstand |
| Gruit-Ale | Malz, Kräuter | Kräuter statt Bitter | Rausch und Psi |
| Sahti | Roggen, Wacholder | Kräuter, Rauch | Wärme, Schutz vor Feuer |
| Met, Tej | Honig, Hefe; Tej mit Gesho | Süße, viel Alkohol | Heilung über die Zeit |
| Wein, Cider | Frucht, Weinhefe | Frucht, Säure | MP |
| Pulque, Palmwein | Pflanzensaft, wild | spontan, Säure | MP, unberechenbar |
| Kefir, Kumys | Milch, Knollen | Säure, wenig Alkohol | Regeneration, gegen Krankheit |
| Kombucha | Tee, Zucker, Teepilz | Säure, kaum Alkohol | senkt den Pegel |
| Posca | Essig, Wasser | Säure | gegen Gift, Ausdauer |
| Oxymel | Essig, Honig, Absud | Säure, Süße | Heilung, endet Zustände |
| Aufguss, Absud | Nahrung und Kräuter, ohne Kultur | eine Richtung | Elixiere und Gifte |
| Brand | ein Getränk an der Brennblase | viel Alkohol | PP (siehe [Grundlagen.md](Grundlagen.md), Spielkern) |

Umsetzung: offen

## Inventar

+ Getränke und Kulturen haben eigene Reiter im Inventar, sortier- und filterbar nach Wirkung; die Schnellleiste nimmt die wichtigsten Getränke auf
+ Getränke wiegen, Kulturen nicht
+ Gestapelt wird nur Gleiches: die Portionen eines Suds, Sude mit gleichem Rezept, gleichen gerundeten Stufen, gleicher Güte und gleicher Stufe des Verderbens; freie Sude ohne Rezept sind Einzelstücke, bis sie Hausrezept werden
+ Ein Fass hält viele Portionen eines Suds als Ladungen

Umsetzung: teilweise, siehe [Gegenstaende.md](Gegenstaende.md), Inventar, und [Sude.md](Sude.md), Befehl (gleiche Sude stapeln nach gerundetem Profil und gefundenem Rezept); offen: Reiter für Getränke und Kulturen, freie Sude als Einzelstücke, Stufe des Verderbens

## Brauschulen

Die Schulen in [Skills.md](Skills.md), Brauen, Brauschulen sind Sumerische Tradition, Spontane Gärung, Reinheitsgebot und Hopfenstopfen. Weitere Kandidaten, je mit Grundstoff, Kultur und einem Kniff; eine Schule lohnt nur, wo ein eigener Kniff entsteht, was die Sets der Rohstoffe und Kulturen nicht schon leisten:

+ Antike: Steinbier (Holzkessel mit heißen Steinen, Röst und Karamell ohne Darre), ägyptisch (Brot und Datteln), Weinbau, Essig und Arznei (Posca, Oxymel, Absude)
+ Mittelalter: Klosterbrauerei (starke Ales, Reifung besser und schneller), Gruit (Kräuterwirkungen stärker, Sekundärwirkungen), Zeidlerei (Met und Braggot)
+ Neuzeit: Brennerei (Brennblase, Brand, Kräuterbitter), Lagerbier (Kälte, verdirbt langsamer), Reinzucht (Kulturen veredeln), Fassreifung (Holz als Aroma)
+ Außerhalb Europas: Koji (Sake, Makgeolli), Andenraum (Chicha), Steppe (Kumys), äthiopisches Hochland (Tej), Hirsebier

Umsetzung: offen, Auswahl in [Skills.md](Skills.md), Brauen, Umsetzung in [Systemausbau.md](Systemausbau.md), Punkt 20

## Brauen und Pegel

+ Wer auf hohen Pegel baut, findet ihn im Brauen: starke Sude aus übervergärenden Hefen, Met, Barley Wine, Eisbock (durch Ausfrieren, ohne Brennblase); Brand ist der schnellste Weg
+ Kampftrinken macht das Trinken im Kampf schneller und wirksamer, Rauschkraft und Ekstase nutzen den Pegel, Kampfrausch hebt ihn im Kampf selbst (siehe [Skills.md](Skills.md), Stoffwechsel und Pegel); so schöpft eine Psi-Kämpferin ihren Pegel auch dann aus, wenn Brand vorhanden ist
+ Im ersten Kapitel gibt es noch keinen Brand: eine Psi-Berserkerin muss dort mit ihrem Pegel besser haushalten
+ Die Magierin fährt im Gegensatz dazu ein schmales Fenster bei leichtem Pegel (siehe [Grundlagen.md](Grundlagen.md), Spielkern): saure Getränke füllen MP mit wenig Alkohol und halten sie darin, Elixiere aus dem Absud stärken ohne Pegel, Kombucha senkt den Pegel und ist der Schritt zurück

Umsetzung: offen, Arbeit in [Systemausbau.md](Systemausbau.md), Punkte 20 und 23

## Offen

+ Kessel als Gegenstände: Aufstellen, Tragen, Bauen und Pflege (Anlagen und Fallen), Tiers über Edelstahl hinaus
+ Ob der Absud MP kostet und wie die Magie seine Mächtigkeit hebt
+ Welche Richtungen der Absud kennt und welche Zustände ihre Pole und Stufen ergeben
+ Ob Ninkasi eine Kultur von selbst neben dem Wesen gewinnt oder über einen Befehl "Probe nehmen" mit Zeitkosten, was spannender ist; im Spiel zu prüfen
+ Flüssigkeiten und Lachen in einer eigenen Sitzung (siehe [Systemausbau.md](Systemausbau.md), Punkt 10)
+ Weitere Familien von Zielgebieten nach den antiken: ägyptisch, mittelalterlich, und ihre Zuordnung zu den Epochen
+ Die Zuordnung der Achsen zu Wirkungen und die Achsen selbst, mit dem Inhalt
+ Kumys braucht noch eine Quelle

## Recherche

+ Potion Craft: [Steam](https://store.steampowered.com/app/1210320/Potion_Craft/), [Gamezebo](https://www.gamezebo.com/walkthroughs/potion-craft-maps/)
+ Atelier: [moegamer zu Rorona](https://moegamer.net/2020/08/28/atelier-rorona-the-alchemist-of-arland-a-new-generation-of-alchemy/), [Prima zu Ryza 2](https://primagames.com/gaming/atelier-ryza-2-crafting-guide)
+ Caves of Qud: [Cooking](https://wiki.cavesofqud.com/wiki/Cooking), [Random cooking effects](https://wiki.cavesofqud.com/wiki/Random_cooking_effects)
+ Brewmaster: [Steam](https://store.steampowered.com/app/1569200/Brewmaster_Beer_Brewing_Simulator/)
+ Altern des Biers: [Review Beer Ageing](https://talcottlab.tamu.edu/wp-content/uploads/sites/108/2020/03/Review-Beer-Ageing.pdf) (vor allem Oxidation, schneller in der Wärme, die Bitterstoffe bauen ab), [All About Beer](https://allaboutbeer.com/article/beer-time/)
+ Sumerisches Bier: [Sallaberger 2012](https://www.assyriologie.uni-muenchen.de/personen/professoren/sallaberger/publ_sallaberger/wasa_2012_bierbrauen.pdf) (nur Gerste und Emmer in den Urkunden, Kaltmaischen ohne Kessel, Trockenbier dida, Sorten nach Powell 1994)
+ Gruit: [Wikipedia](https://en.wikipedia.org/wiki/Gruit), [Honest Food](https://honest-food.net/gruit-herbal-beer) (die Mischung ist umstritten, berauschende Wirkungen nur anekdotisch), [Zythophile](https://zythophile.co.uk/2014/02/28/was-it-ever-gruit-britain-the-herb-ale-tradition) (viel mittelalterliches Ale ohne Kräuter)
+ Absud, Unbekanntes und Bestreichen: [Skyrim Alchemy](https://en.uesp.net/wiki/Skyrim:Alchemy) (Essen und Brauen zeigen die Wirkungen einer Zutat), [Witcher-Substanzen](https://breezewiki.discard.no/witcher/wiki/Substances) (Formeln verlangen Substanzen statt Zutaten), [Zelda Elixir](https://zelda.fandom.com/wiki/Elixir) (Tiere geben die Wirkung, Monsterteile die Dauer), [KCD Autobrew](https://kingdomcomedeliverance.wiki.gg/wiki/Autobrew) (Einmal Gelungenes braut sich von selbst, das Fehlen in KCD2 gilt als Pflichtarbeit), [Skyrim Poison](https://en.uesp.net/wiki/Skyrim:Poison) und [BG3 Coatings](https://bg3.wiki/wiki/Coatings) (Gift nach Treffern bzw. nach Runden), [DCSS zum Identifizieren](https://crawl.develz.org/tavern/viewtopic.php?p=343587), [Subnautica Scanner](https://wikily.gg/subnautica/items/scanner/) (Wissen aus der Nähe, im Spiel statt im Wiki)
+ Essig: [Oxymel](https://en.wikipedia.org/wiki/Oxymel) (Arznei schon im hippokratischen Korpus), [Posca](https://en.wikipedia.org/wiki/Posca) (Getränk der Soldaten)
+ Weitere Gebräue: [Pulque (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4928461/), [Mead](https://en.wikipedia.org/wiki/Mead) (Tej), [Fermented Beverages other than Wine and Beer](https://encyclopedia.com/food/encyclopedias-almanacs-transcripts-and-maps/fermented-beverages-other-wine-and-beer) (Sahti, Kwass), [Wine Folly](https://winefolly.com/lifestyle/7-fermented-drinks-from-around-the-world/) und [Tasting Table](https://www.tastingtable.com/1410588/fermented-drinks-need-know/) (Überblick, populär)
