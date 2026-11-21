# Battle Ninkasi - Welt

Stand: 2026-11-21

Zuständig für: `src/welt/ebene.js`, `src/welt/karte.js`, `src/welt/schichten.js`, `src/welt/wege.js`, `src/systeme/gelaende.js`, `src/systeme/fallen.js`, `src/systeme/schichten.js`, `src/systeme/ebenen.js`, `src/systeme/sicht.js`, `src/systeme/gefahr.js`, `daten/gelaende.js`, `daten/fallen.js`, `daten/schichten.js`, `daten/ebenen.js`, `daten/populationen.js`

Mitprüfen bei Änderungen: [Wesen.md](Wesen.md), [Anzeige.md](Anzeige.md), [Grundlagen.md](Grundlagen.md)

Die Karte und was auf ihr liegt: Gelände, Feldschichten, Ebenen, Wegfindung, Sichtweite, Licht, Gefahrenprüfung.

## Gelände

+ Vorbild Brogue: Türen öffnen sich beim Hindurchgehen und schließen sich von selbst, Fallen sind verborgen, bis man sie entdeckt; Wesen der Ebene kennen ihre Fallen
+ Jede Geländeart hat einen Namen (`text`) für Untersuchen und Tooltip
+ Veränderliches Gelände (`src/systeme/gelaende.js`): `gelaendeSetzen(spiel, feld, name)` ändert ein Feld der Karte (sie bleibt eine Liste von Zeichenketten), meldet `gelaende_geaendert`, berechnet Ninkasis Sichtfeld neu, wenn das Feld in ihrer Sichtweite liegt, und merkt Wesen darauf für die Lageprüfung vor (eine Wand auf ihrem Feld klemmt sie ein, siehe [Wesen.md](Wesen.md), Bewegung)
+ Bausteine `gelaende_setzen { gelaende, muster? }` (Zielfeld oder Felder des Musters) und `gelaende_zerstoeren { muster? }` (Gelände mit `zerstoerbar: { wird }` wird zu `wird`, z.B. eine Tür zu Boden); Parameterart `gelaende` in der Datenprüfung
+ `geschossdurchlaessig` am Gelände: Vorgabe wie `durchsichtig`; ein Gitter ist undurchsichtig, lässt aber Geschosse durch, Glas umgekehrt; die Sichtlinie bleibt davon unberührt
+ Befehl `benutzen { dx, dy }` auf ein Nachbarfeld oder das eigene: Gelände mit `beimBenutzen: effekt` (Hebel, Schalter), Ziel des Effekts ist das Feld, Ursache `benutzen`, Meldung `benutzt`, Zeitkosten `aktionen.benutzen`; Ablehnung `nichts_zu_benutzen`; Hebel mit Wirkung in der Ferne brauchen Themenräume (Punkt 10)
+ Türen: zwei Geländearten, die geschlossene mit `tuer: { offen }`, die offene mit `tuer: { zu }`; betritt ein Wesen, das Türen öffnet, die geschlossene, geht sie auf (Haken `betritt_feld`), verlässt das letzte Wesen die offene und liegt nichts darin, geht sie zu (`verlaesst_feld`); geschlossen versperrt sie die Sicht und dämpft Lärm (`laermdaempfung` 3)
+ Wer Türen öffnet, steht am Wesen: `tueren: "oeffnen"` (Vorgabe) oder `"nicht"`; Bakterien öffnen keine, eine geschlossene Tür hält sie auf; für sie ist die Tür wie eine Wand, auch in der Wegfindung (Option `oeffnetTueren`)
+ Die Ebene setzt Türen an die Zugänge der Räume, die rot.js meldet, mit `tuerChance` Prozent und eigenem abgeleitetem Zufall; in Türöffnungen entsteht nichts
+ Fallen (`src/systeme/fallen.js`, Daten in `daten/fallen.js`): Entitäten auf einem Feld mit `falle: { tarnung, effekt, ausloesenFuer? }` und `verborgen` (Vorgabe ja); die Ebene legt sie nach `fallen: [{ typ, anzahl }]`
+ Auslösen am Haken `betritt_feld`, nur für die Bewegungsarten in `ausloesenFuer` (Vorgabe `laufend`), Quelle die Falle, Ursache `falle`, eine Kettenstufe tiefer; danach gilt sie als entdeckt (`entdeckt`), Meldung `falle_ausgeloest`; Fallen wecken nicht und ziehen keinen Zorn auf sich (das gilt nur für Wesen als Urheberin)
+ Entdecken am Haken `zug_ende`, nur für Ninkasi: für jede verborgene Falle, die sie sieht und die höchstens `regeln.fallen.reichweite` (5) entfernt ist, ein Wurf mit E / (E + Tarnung), E = Entdecken × 2 / (1 + Abstand); Entdecken ist ein Kampfwert (Vorgabe `regeln.fallen.entdeckenVorgabe` 30), Skills ändern ihn über Modifikatoren; Beispiel Entdecken 30 gegen Tarnung 30: daneben 50 %, auf 3 Felder 33 % je Zug; Meldung `falle_entdeckt`
+ Die Anzeige zeigt Fallen erst, wenn sie bekannt sind (`istBekannt`); Wesen mit KI meiden alle Fallen, Reise und Erkunden die entdeckten (Option `meiden` der Wegfindung); liegt eine entdeckte Falle in einem Gang ohne Umweg, hält die Reise mit `kein_weg`
+ Im Spielinhalt (Zahlen vorläufig): Säuredüse (Tarnung 40, 2W4 Säure) und Klappergeschirr (Tarnung 20, Lärm 14, weckt die Nachbarschaft); Türen und Fallen haben noch keine Tiles, nur Zeichen

## Feldschichten

+ Vorbild Brogue: je Feld höchstens eine Gasart, die sich auf die Nachbarn verteilt und je Art verfliegt; dichter Rauch versperrt die Sicht; Feuer springt nach der Brennbarkeit der Nachbarn über, verbrennt Brennbares und erzeugt Rauch; Monster meiden Feuer und schädliches Gas
+ Drei Schichten neben der Karte in `zustand.ebene.schichten`, nur belegte Felder: `oberflaeche` und `gas` mit `{ art, menge }`, `feuer` mit `{ menge }` (Brenndauer in Weltticks); Datenzugriff in `src/welt/schichten.js`, alles Weitere in `src/systeme/schichten.js`, Arten in `daten/schichten.js` (`oberflaechen`, `gase`), Feuer in `regeln.feuer`, Obergrenzen in `regeln.schichten`
+ Je Feld und Schicht höchstens eine Art: gleiche Art addiert bis `hoechstens` (Vorgabe aus den Regeln), auf der Oberfläche verdrängt eine andere Art die alte, beim Gas behauptet sich die größere Menge
+ Oberfläche (nur auf passierbarem Gelände): `schwund` je Welttick (ruht, solange das Feld brennt), `beimBetreten` (Haken `betritt_feld`), `jeTick` auf Wesen darin, beides für `ausloesenFuer` (Vorgabe `laufend`, `unbeweglich`), `brennbar`, `brenndauer`, `verbrenntZu`, `ausbreitung: { chance }` auf ein Nachbarfeld ohne Oberfläche (Myzel), `gefaehrlich` (Wege meiden sie)
+ Gas (nur auf gasdurchlässigen Feldern: `gasdurchlaessig` am Gelände, Vorgabe wie passierbar; Wände und geschlossene Türen halten es auf): je Welttick Quellen am Gelände (`quelle: { gas, menge }`, ein undurchlässiges Gelände wie der Gärbottich gibt sein Gas gleichmäßig an die durchlässigen Nachbarn ab), Ausgleich, Abbau, Wirkung
+ Ausgleich: je Paar aus Gasfeld und Nachbar fließt ein Neuntel des Unterschieds vom volleren ins leerere Feld, abgerundet, alles aus dem alten Stand berechnet; die Gesamtmenge bleibt genau erhalten, verschiedene Gase vermischen sich nicht
+ Abbau `abbau` in Prozent je Tick; der Bruchteil wird gewürfelt (1 % von 50 ist mit 50 % Chance 1), so bleiben auch kleine Mengen nicht ewig und große bauen sich im Mittel genau ab
+ Wirkung über `stufen: [{ ab, effekt, wenn? }]`: je Welttick die höchste erreichte Stufe, deren `wenn` am Wesen gilt, z.B. CO2 ab 30 benommen, ab 70 Ersticken, beides nur ohne den Tag `anaerob`; `undurchsichtigAb` lässt dichtes Gas die Sicht versperren (Ninkasis Sichtfeld wird dann je Welttick neu berechnet), Geschosse fliegen hindurch
+ Feuer je Welttick und brennendem Feld: `regeln.feuer.brennen` auf Wesen darin (auch beim Betreten), Rauch (`regeln.feuer.rauch`, `rauchMenge`), Übergreifen auf jedes nicht brennende Nachbarfeld mit der Chance seiner Brennbarkeit (die höchste aus Gelände, Oberfläche und Gas); dann sinkt die Menge um 1, erlischt das Feuer, verbrennen Oberfläche und Gelände zu `verbrenntZu` (eine Holztür zu Boden), neu entzündete Felder brennen ab dem nächsten Tick
+ Brennbares Gas fängt auf einmal Feuer, verschwindet und wirkt `explodiert` am Feld (Verpuffung)
+ Bausteine: `oberflaeche_setzen { art, menge, muster? }`, `gas_setzen { art, menge, muster? }`, `entzuenden { muster? }` (nur wo etwas brennt); Parameterarten `oberflaeche` und `gas` in der Datenprüfung
+ Wiederholbar: alle Würfe über den Spiel-Zufall, immer nach Feldindex aufsteigend; die Weltuhr bearbeitet nur belegte Felder; die Liste der Gasquellen hält der `zwischenspeicher`, `gelaendeSetzen` verwirft sie
+ Wege: die KI meidet Feuer und Gefährliches (`gefahrenMeiden`, zusammen mit den Fallen über `meidenZusammen`), Reise und Erkunden ebenso
+ Anzeige: farbige Überlagerung auf sichtbaren Feldern, Oberfläche und Feuer unter den Entitäten, Gas darüber mit der Menge zunehmend deckend; Farben in `zeichen.schichten`; Tiles folgen
+ Im Spielinhalt (Zahlen vorläufig): die Säuredüse hinterlässt Säure (verätzt 1W3 je Tick, trocknet); drei Gärbottiche je Ebene im Inneren der Räume (Gelände-Objekte, sperren keinen Durchgang) geben CO2 ab, das sich hinter geschlossenen Türen sammelt; drei Brandflaschen je Ebene zerspringen beim Wurf zu Hochprozentigem und entzünden es; Feuer 1W6, Rauch ab 40 undurchsichtig, ab 60 Husten; Benommenheit und Ersticken sind vorläufig Giftschaden, bis es Zustände im Spielinhalt gibt

## Ebenen

+ Vorbilder: Brogue und DCSS (Ebenen bleiben erhalten, Treppen verbinden sie), Grundlagen (Hub zwischen den Ebenen)
+ Abfolge der Tiefen in `daten/index.js`: `abfolge: ["hub", "keller", "keller", "keller"]` (Tiefe 0 ist der Hub), `starttiefe: 1`; mehrere Tiefen dürfen dieselbe Vorlage aus `daten/ebenen.js` nutzen, jede bekommt ihren eigenen abgeleiteten Zufall (`ebene.<tiefe>.<name>`), ist je Startwert also wiederholbar und doch verschieden
+ Erzeugung (`src/welt/ebene.js`, `ebeneErzeugen(spiel, tiefe)`): eine feste Karte (`karte`: Zeilen aus Geländekennungen, z.B. der Hub) wird übernommen; sonst Digger von rot.js mit Treppe hinauf in der Mitte des ersten Raums und Treppe hinab in der Mitte des Raums, der davon am weitesten entfernt ist, jeweils nur, wenn es die Tiefe gibt; Ninkasi legt die Erzeugung nicht an, sie gibt die Treppen zurück; zu Beginn steht Ninkasi auf der Treppe hinauf der Starttiefe
+ Treppen sind Gelände mit `treppe: "ab"` oder `"auf"`; Befehl `{ art: "treppe" }` (Taste <> auf deutscher Tastatur), nur für Ninkasi, Ablehnung `keine_treppe`, Zeitkosten `aktionen.treppe`; Meldung `ebene_gewechselt` mit `tiefe` und `richtung`
+ Wechsel (`src/systeme/ebenen.js`): die alte Ebene kommt mit allen Entitäten außer Ninkasi und dem, was sie trägt, und deren Einträgen der Warteschlange (Akteure, gebundene Zeitereignisse) samt Zeitpunkt nach `zustand.abgelegteEbenen[tiefe]`; die Weltuhr gehört keiner Ebene und läuft weiter
+ Verlassene Ebenen ruhen: bei der Rückkehr rücken alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände) um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt und ihre Wesen eingereiht; Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien Feld
+ Der Wechsel verwirft den räumlichen Index (siehe [Architektur.md](Architektur.md), Leistung); nur hier wird Ninkasis Position deshalb direkt gesetzt, der Index entsteht danach neu; Gasquellen und andere Vorräte im `zwischenspeicher` hängen an der Ebene und entstehen ebenso neu
+ Wesen folgen Ninkasi nicht über Treppen; Nachholen der Zeit verlassener Ebenen (Population wächst auf eine Tragfähigkeit zu) kommt mit Punkt 10 der Arbeitsliste
+ Population nach Tiefe (`population: { tabelle, anzahl: [min, max] }` an der Ebene, Tabellen in `daten/populationen.js`): Einträge `{ typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }`; je Wurf gewichtet unter den Einträgen der Tiefe, mit `regeln.population.tieferChance` (10 %) aus einer bis zu `tieferBis` (2) Tiefen tieferen; ein Rudel steht beieinander (jedes weitere Mitglied auf dem freien Feld, das dem ersten am nächsten liegt), Affixe sind Zustände beim Erzeugen; findet ein Wurf nichts, fällt er aus; eine feste Liste `gegner` geht weiterhin
+ Im Spielinhalt (Zahlen vorläufig): der Hub ist ein leerer Raum mit Treppe hinab (Dienste folgen), drei Kellertiefen mit 16 bis 20 Wesen, Essigbakterien in Rudeln von 1 bis 3, Fernkämpfer ab Tiefe 2 häufiger; Treppen haben noch keine Tiles

## Wegfindung

+ Ein gemeinsames Modul `src/welt/wege.js` für KI und Reise, AStar aus rot.js mit acht Richtungen, je Bewegungsart (Option `bewegung`), mit oder ohne Türen (`oeffnetTueren`) und mit Feldern, die gemieden werden (`meiden`, z.B. Fallen)
+ Optionen: nur erkundete Felder (Spielerin, keine Hellseherei), Wesen meiden
+ Später: Kosten je Gelände (Fallen meiden), dann für KI und Spielerin zugleich

## Sichtweite

+ Die Sichtweite von Ninkasi ergibt sich aus Skills und Hindernissen
+ Ist sie größer als der Ausschnitt, wird nicht herausgezoomt; stattdessen zeigen Markierungen am Kartenrand Gegner außerhalb des Ausschnitts, die Gegnerliste der Seitenleiste nennt alle sichtbaren Gegner

## Licht

Vorläufige Ideen, noch nicht umgesetzt. Licht ist hauptsächlich Spielmechanik, Stimmung ein Nebeneffekt.

+ Die Logik rechnet je Feld eine Helligkeit als ganze Zahl (z. B. 0 bis 100); sie ist Teil des Zustands oder wird daraus deterministisch berechnet
+ Lichtquellen sind eine Komponente mit Reichweite und Stärke, die Farbe ist nur für die Anzeige; Beispiele: Fackel an der Wand mit Reichweite 10, glühender Kessel, getragene Laterne
+ Ausbreitung je Quelle über dasselbe Verfahren wie das Sichtfeld (rot.js PreciseShadowcasting), Stärke nimmt mit der Entfernung ganzzahlig ab; mehrere Quellen addieren sich bis zu einer Obergrenze
+ Feste Quellen werden nur neu berechnet, wenn sich etwas ändert (Tür, gelöschte Fackel, bewegte Quelle)
+ Anzeige: Eine Lichtkarte mit einem Pixel je Feld wird geglättet auf Kartengröße skaliert und per Mischmodus "multiply" über die Karte gelegt; Schwarz ist dunkel, Weiß unverändert, Farben tönen (Fackel warm, Psi cyan); so entstehen weiche Übergänge statt Stufen
+ Leuchtende Pixel (Augen, Leuchtfarben, Glut) zeichnet der Renderer nach der Abdunklung erneut, sie bleiben im Dunkeln sichtbar; dafür trägt ein Tile eine Maske seiner leuchtenden Pixel
+ Flackern ist reine Anzeige über den kosmetischen Zufall, die Logik rechnet mit festen Werten
+ Dieselbe Abdunklung kann auch erkundete, aber gerade nicht sichtbare Felder darstellen

## Gefahrenprüfung

+ Reine Lesefunktionen in `src/systeme/gefahr.js`: Eine Lage ist ein Schnappschuss (sichtbare Feinde, LP), zwei Lagen werden verglichen
+ Prüfungen sind im Register "gefahren" angemeldet (`gegner_in_sicht`, `schaden`); Reise, Laufen, Rasten und Erkunden nutzen sie mit den Listen aus den Einstellungen, lange Aktionen mit der Liste aus den Regeln

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
