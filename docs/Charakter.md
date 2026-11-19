# Battle Ninkasi - Charakter und Lernen

Stand: 2026-11-18

## Charaktererstellung

+ Spielerin verteilt Punkte auf sechs Eigenschaften
+ Makel gehören zur Charaktererstellung: Nachteil gegen zusätzliche Punkte
+ Beispiele für Makel: Blindheit (Sichtweite stark eingeschränkt), dysfunktionale Alkoholdehydrogenase
+ Weitere Makel, auszuarbeiten: Aldehyd-Dehydrogenase-Mangel (Acetaldehyd, Flush, Katerschaden), Zöliakie (Gerste und Weizen schaden), Gicht (Purine im Bier lösen Anfälle aus)
+ Vorschlag, noch nicht bestätigt: Makel dürfen zweischneidig sein, Nachteil mit verstecktem Vorteil

## Startwerte

+ Vorläufig, Grundlage fürs Balancing: 100 LP, 100 MP, Pegel 0 ‰
+ 100 als Grundwert, damit Boni in Prozent vom Grundwert glatte ganze Zahlen ergeben
+ Mit Pegel 0 startet Ninkasi nüchtern: LP regenerieren langsam, MP am schnellsten, PP schwinden (Verläufe in [Grundlagen.md](Grundlagen.md))
+ PP (Psi-Punkte) vorläufig 0 von 100, Start- und Höchstwert noch offen
+ Der Pegel ist nach oben offen

## Eigenschaften

+ Sechs Eigenschaften: Körperlichkeit, Trinkfestigkeit, Gewandtheit, Sinnlichkeit, Klugheit, Braukunde
+ Eigenschaften sind reine Lernwerte: Sie senken die EP-Kosten von Skills
+ Jeder Skill hat eine primäre und eine sekundäre Eigenschaft (Vorbild: EVE Online)
+ Beispiel: Hohe Körperlichkeit lässt Skills, die LP erhöhen, schneller lernen
+ Vorbild D&D (sechs Eigenschaften), Weisheit und Intelligenz geschärft zu Lebendigem (Braukunde) und Mechanischem (Klugheit)

### Bereiche

+ Körperlichkeit: Kraft, LP, Nahkampf, Tragen, Kopfstoß
+ Trinkfestigkeit: Pegel, Widerstand gegen Gift und Infektion; thematisch verwandt mit den Makeln des Stoffwechsels
+ Gewandtheit: Schnelligkeit, Ausweichen, Schleichen, Fernkampf, Reaktion (z.B. Fallen im letzten Moment bemerken)
+ Sinnlichkeit: bewusst doppeldeutig, die Sinne und das Sinnliche; Wahrnehmung (Nachtsicht, Fernsicht, Fallen entdecken), Ego, Charisma, Gefährten, Handel, Psi
+ Klugheit: Anlagen, Prozesse, Fallen entschärfen, Rätsel, Zauber als erlernte Formel
+ Braukunde: die Weisheit dieser Welt, Brauen ist heiliges Wissen; Brauen, Alchemie, Mikroorganismen, Kreaturen verstehen, göttliche Gaben
+ Sinnlichkeit ist die schwerste Eigenschaft, Ausgleich über das Balancing
+ Vorräte und Eigenschaften: LP zu Körperlichkeit, MP zu Klugheit und Braukunde, PP zu Sinnlichkeit, Pegel zu Trinkfestigkeit, Ausdauer (Option) zu Gewandtheit oder Körperlichkeit
+ Vorschlag, noch nicht bestätigt: Eigenschaften speisen Kampfwerte (siehe [Architektur.md](Architektur.md), Kampfwerte), z.B. Gewandtheit `ausweichen`, Sinnlichkeit oder Klugheit `willenskraft`, Trinkfestigkeit `widerstand` gegen Gift und Alkohol
+ Vorschlag, noch nicht bestätigt: Trinkfestigkeit hebt die Schwellen des Pegels, beschleunigt seinen Abbau und verschiebt das Optimum der LP-Regeneration nach oben (über die Modifikatoren `abbau.pegel` und `kurvenverschiebung.lp`)
+ Skills, Schriftrollen und Items wirken auf Regeneration und Schwund über Modifikatoren, siehe Stoffwechsel in [Architektur.md](Architektur.md)

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
+ Skill-Sets (z.B. LP) mit vier Tiers: Grund-, Experten-, Meister-Skill, göttliches Skill-Niveau
+ Höchststufe pro Skill: 5
+ Voraussetzungen: Experten-Skill verlangt Grundskill 3, Meister-Skill Grundskill 4, göttliches Niveau Grundskill 5
+ Vorgelagerte Tiers: Meister-Skill zusätzlich Experte 3, göttliches Niveau zusätzlich Experte 4 und Meister 3
+ Keine künstliche Begrenzung göttlicher Niveaus: Das Balancing sorgt dafür, dass pro komplettem Lauf implizit nur eine gewisse Anzahl erreichbar ist
+ Kosten steigen innerhalb eines Skills pro Stufe
+ Gleich bleibender Ertrag pro Stufe, Boni in Prozent vom Grundwert
+ Skills geben keine Fähigkeiten direkt: Sie sind Voraussetzung für Fähigkeiten, die Fähigkeit selbst kommt aus dem Dungeon
+ Quellen für Fähigkeiten (auch Psi und Magie): Schriftrollen, HACCP-Aushänge, Loot, Rezepte, Altäre (Braukessel), Händler (wandernd im Dungeon oder im Hub), Nebengottheiten
+ Der Zufall prägt den Build
+ Vorschlag, noch nicht bestätigt: Ausnahmen nur für körpereigene Fähigkeiten ohne mögliches Fundstück (Kopfstoß, Bierfontäne, Rülpser)
+ Höhere Tiers verändern Fähigkeiten qualitativ (z.B. Psi-Teleport nimmt ein Ziel mit)
+ Vorschlag, noch nicht bestätigt: Tag-System, Fähigkeiten tragen Tags, Skills wirken auf Tags; technisch seit 0.9.0 möglich über `tag` am Modifikator, siehe Modifikatoren in [Architektur.md](Architektur.md)
+ Vorschlag, noch nicht bestätigt: Boni innerhalb eines Skill-Sets addieren, zwischen Quellen multiplizieren (Vorbild EVE Online: die Stufen eines Skills addieren sich, verschiedene Skills multiplizieren); technisch: `prozent` addiert sich immer, ein Skill liefert für das Multiplizieren einen einzigen `mal`-Modifikator (z.B. `mal 125` auf Stufe 5), siehe Modifikatoren in [Architektur.md](Architektur.md)
+ Vorschlag, noch nicht bestätigt: Querlernen auf verwandte Skills (Vorbild: Dungeon Crawl Stone Soup)
+ Vorschlag, noch nicht bestätigt: fortgeschrittene Skills über Fundstücke freischalten (Braubücher, Rezepturen)
+ Vorläufige Idee: Nachtsicht (Sehen bei weniger Licht) und Fernsicht (größere Sichtweite) als Skills; Licht und Wahrnehmung siehe [Architektur.md](Architektur.md)

## Erfahrungspunkte (EP)

+ Freie EP aus Erkundung und Rätseln, die Spielerin verteilt sie selbst
+ Freie EP lassen sich sparen, etwa bis entscheidende Fundstücke auftauchen
+ Gebundene EP aus Anwenden und Besiegen, sie fließen direkt in die beteiligten Skills
+ Erkundung: 1 EP pro Feld, das zum ersten Mal wirklich gesehen wird
+ Magisch kartierte Felder gelten als bekannt, bringen EP aber erst beim wirklichen Sehen
+ Anwenden bringt nur EP bei Wirkung (Treffer, Schaden, Effekt am echten Ziel)
+ Jedes Rätsel bringt seine EP nur einmal
+ Warten und Regenerieren bringen keine EP
+ Der Pegel beeinflusst das Lernen nicht
+ EP pro Ebene weitgehend begrenzt, Ausnahme: Gegner, die durch Psi erscheinen, bringen EP
+ Teilende Mikroorganismen: Tochterzellen derselben Mutterzelle bringen stark abfallende EP, entweder als Gefälle nach Generation oder als gemeinsamer Topf pro Abstammungslinie (beide gleichwertig)
+ Nachrückende Gegner nicht ausgeschlossen, als eigenes, per Parameter einstellbares System (Rate, Obergrenze, EP-Faktor)
+ Schwache Gegner bringen verminderte EP, Mechanismus noch offen
+ Vorschlag, noch nicht bestätigt: Varianten durch Affixe vervielfachen die Gegnertypen

## Offen

+ Ausnahmen von der Regel "keine Fähigkeiten direkt durch Skills"
+ Übersicht der Skills in der Oberfläche (Filter, Suche, Gruppierung nach Skill-Set)
+ Ob Fähigkeitsquellen verbraucht werden oder dauerhaft lehren, flexibel pro Quelle regelbar, später entscheiden
+ Fundstück ohne passenden Skill: nur mittragen, bis der Skill reicht, oder vorzeitig nutzbar mit hohem Fehlschlagrisiko
+ Währung bei Händlern (Gold, Alkohol, Tausch)
+ Mutterzelle: Gefälle nach Generation oder gemeinsamer Topf
+ Nachrückende Gegner: ob, wie oft, mit welchem EP-Faktor
+ Mechanismus für verminderte EP: Abstand Gegnerstufe zu Skillstufe oder Sättigung pro Gegnertyp
+ Wo freie EP verteilt werden (sofort oder an bestimmten Orten), zunächst per Schalter
+ Zuordnung aller Skills zu primärer und sekundärer Eigenschaft, später als eigener Skillkatalog
+ Katalog der Makel und ihr Punktwert
+ Ob passive Skills auch gebundene EP bekommen
+ Verteilung gebundener EP, wenn mehrere Skills beteiligt sind
+ Startskills bei der Charaktererstellung
+ Neuverteilung der Eigenschaften im Lauf (Vorbild: Remap in EVE)
+ Affixe im Detail
+ Bestiarium und Glossar (Bierbrauen, Mikroorganismen), Tonfall enzyklopädisch-ernsthaft-informativ, eigene Sitzung
