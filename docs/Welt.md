# Battle Ninkasi - Welt

Stand: 2026-11-22

Zuständig für: `src/welt/ebene.js`, `src/welt/karte.js`, `src/welt/schichten.js`, `src/welt/wege.js`, `src/systeme/gelaende.js`, `src/systeme/fallen.js`, `src/systeme/schichten.js`, `src/systeme/ebenen.js`, `src/systeme/sicht.js`, `src/systeme/gefahr.js`, `daten/gelaende.js`, `daten/fallen.js`, `daten/schichten.js`, `daten/ebenen.js`, `daten/populationen.js`

Mitprüfen bei Änderungen: [Wesen.md](Wesen.md), [Anzeige.md](Anzeige.md), [Grundlagen.md](Grundlagen.md)

## Zweck

Die Karte und was auf ihr liegt: Gelände mit Türen und Fallen, Feldschichten (Oberfläche, Gas, Feuer), Ebenen und Treppen, Wegfindung, Sichtweite, Licht und die Gefahrenprüfung. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Gelände

Vorbild Brogue: Türen öffnen sich beim Hindurchgehen und schließen sich von selbst, Fallen sind verborgen, bis man sie entdeckt; Wesen der Ebene kennen ihre Fallen.

Daten:

+ Gelände (`daten/gelaende.js`): `kennung` (ein Zeichen, so steht das Feld in `zustand.ebene.felder`, einer Liste von Zeichenketten), `text` (Name für Untersuchen und Tooltip, Pflicht), `passierbar`, `passierbarFuer`, `undurchdringlich`, `durchsichtig`, `geschossdurchlaessig` (Vorgabe wie `durchsichtig`), `gasdurchlaessig` (Vorgabe wie passierbar), `laermdaempfung`, `treppe` ("ab" oder "auf"), `tuer` (`{ offen }` an der geschlossenen, `{ zu }` an der offenen Tür), `zerstoerbar: { wird }`, `beimBenutzen` (Effekt), `beimFestsitzen` (Effekt), `brennbar`, `brenndauer`, `verbrenntZu`, `quelle: { gas, menge }`; jede Art braucht ein Zeichen in `daten/zeichen.js`
+ Am Wesen `tueren`: `"oeffnen"` (Vorgabe) oder `"nicht"`
+ Fallen (`daten/fallen.js`): Entitäten auf einem Feld mit `falle: { tarnung, effekt, ausloesenFuer? }` und `verborgen` (Vorgabe ja), nach dem Auslösen oder Entdecken `entdeckt`; die Ebene legt sie nach `fallen: [{ typ, anzahl }]`
+ Regelwerte `regeln.fallen`: `entdeckenVorgabe` 30, `reichweite` 5; an der Ebene `tuerChance`

Schnittstellen:

+ Karte (`src/welt/karte.js`): `feldIndex`, `aufDerKarte`, `gelaendeAuf`, `gelaendeName`, `passierbar`, `betretbar`, `betretbarFuer`, `oeffnetTueren`, `fest`, `durchsichtig`, `geschossdurchlaessig`, `abstand`, `BEWEGUNGSARTEN`
+ `gelaendeSetzen(spiel, feld, name)` (`src/systeme/gelaende.js`): ändert ein Feld, meldet `gelaende_geaendert`, berechnet Ninkasis Sichtfeld neu, wenn das Feld in ihrer Sichtweite liegt, und merkt Wesen darauf für die Lageprüfung vor (eine Wand auf ihrem Feld klemmt sie ein, siehe [Wesen.md](Wesen.md), Bewegung)
+ Bausteine `gelaende_setzen { gelaende, muster? }` (Zielfeld oder Felder des Musters) und `gelaende_zerstoeren { muster? }` (Gelände mit `zerstoerbar` wird zu `wird`, z.B. eine Tür zu Boden); Parameterart `gelaende` in der Datenprüfung
+ Befehl `benutzen { dx, dy }` auf ein Nachbarfeld oder das eigene: Gelände mit `beimBenutzen` (Hebel, Schalter), Ziel des Effekts ist das Feld, Ursache `benutzen`, Meldung `benutzt`, Zeitkosten `aktionen.benutzen`; Ablehnung `nichts_zu_benutzen`
+ Fallen (`src/systeme/fallen.js`): `istBekannt`, `fallenMeiden` (für die Wegfindung), `entdeckenVon`, `entdeckenChance`; Meldungen `falle_ausgeloest`, `falle_entdeckt`

Regeln:

+ Ein Gitter ist undurchsichtig, lässt aber Geschosse durch, Glas umgekehrt; die Sichtlinie bleibt von `geschossdurchlaessig` unberührt
+ Türen: betritt ein Wesen, das Türen öffnet, die geschlossene, geht sie auf (Haken `betritt_feld`), verlässt das letzte Wesen die offene und liegt nichts darin, geht sie zu (`verlaesst_feld`); geschlossen versperrt sie die Sicht und dämpft Lärm (`laermdaempfung` 3)
+ Bakterien öffnen keine Türen, eine geschlossene Tür hält sie auf; für sie ist die Tür wie eine Wand, auch in der Wegfindung (Option `oeffnetTueren`)
+ Die Ebene setzt Türen an die Zugänge der Räume, die rot.js meldet, mit `tuerChance` Prozent und eigenem abgeleitetem Zufall; in Türöffnungen entsteht nichts
+ Fallen lösen am Haken `betritt_feld` aus, nur für die Bewegungsarten in `ausloesenFuer` (Vorgabe `laufend`), Quelle die Falle, Ursache `falle`, eine Kettenstufe tiefer; danach gilt sie als entdeckt; Fallen wecken nicht und ziehen keinen Zorn auf sich (das gilt nur für Wesen als Urheberin)
+ Entdecken am Haken `zug_ende`, nur für Ninkasi: für jede verborgene Falle, die sie sieht und die höchstens `reichweite` entfernt ist, ein Wurf mit E / (E + Tarnung), E = Entdecken × 2 / (1 + Abstand); Entdecken ist ein Kampfwert (Vorgabe `entdeckenVorgabe`), Skills ändern ihn über Modifikatoren; Beispiel Entdecken 30 gegen Tarnung 30: daneben 50 %, auf 3 Felder 33 % je Zug
+ Die Anzeige zeigt Fallen erst, wenn sie bekannt sind; Wesen mit KI meiden alle Fallen, Reise und Erkunden die entdeckten (Option `meiden` der Wegfindung); liegt eine entdeckte Falle in einem Gang ohne Umweg, hält die Reise mit `kein_weg`
+ Hebel mit Wirkung in der Ferne brauchen Themenräume (Idee in [Ausblick.md](Ausblick.md))
+ Im Spielinhalt (Zahlen vorläufig): Säuredüse (Tarnung 40, 2W4 Säure) und Klappergeschirr (Tarnung 20, Lärm 14, weckt die Nachbarschaft); Türen und Fallen haben noch keine Tiles, nur Zeichen

## Feldschichten

Vorbild Brogue: je Feld höchstens eine Gasart, die sich auf die Nachbarn verteilt und je Art verfliegt; dichter Rauch versperrt die Sicht; Feuer springt nach der Brennbarkeit der Nachbarn über, verbrennt Brennbares und erzeugt Rauch; Monster meiden Feuer und schädliches Gas.

Daten:

+ Drei Schichten (`SCHICHTEN`) neben der Karte in `zustand.ebene.schichten`, nur belegte Felder: `oberflaeche` und `gas` mit `{ art, menge }`, `feuer` mit `{ menge }` (Brenndauer in Weltticks)
+ Arten (`daten/schichten.js`): `oberflaechen` mit `hoechstens?`, `schwund`, `beimBetreten`, `jeTick`, `ausloesenFuer` (Vorgabe `laufend`, `unbeweglich`), `brennbar`, `brenndauer`, `verbrenntZu`, `ausbreitung: { chance }`, `gefaehrlich`; `gase` mit `hoechstens?`, `abbau` (Prozent je Tick), `stufen: [{ ab, effekt, wenn? }]`, `undurchsichtigAb`, `brennbar`
+ Regelwerte: `regeln.feuer` (`brennen`, `rauch`, `rauchMenge`), `regeln.schichten` (`hoechstOberflaeche` 10, `hoechstGas` 1000)

Schnittstellen:

+ Datenzugriff (`src/welt/schichten.js`, ändert nichts): `schichtenVon`, `schichtAuf`, `belegteFelder`, `feldVonIndex`, `gasdurchlaessig`, `sichtdurchlaessig`
+ `src/systeme/schichten.js`: `oberflaecheSetzen`, `gasSetzen`, `entzuenden`, `brennbarkeit`, `gefahrenMeiden` (für die Wegfindung, zusammen mit den Fallen über `meidenZusammen`); Handler der Weltuhr für Quellen, Ausgleich, Abbau, Wirkung und Feuer
+ Bausteine `oberflaeche_setzen { art, menge, muster? }`, `gas_setzen { art, menge, muster? }`, `entzuenden { muster? }` (nur wo etwas brennt); Parameterarten `oberflaeche` und `gas` in der Datenprüfung

Regeln:

+ Je Feld und Schicht höchstens eine Art: gleiche Art addiert bis `hoechstens` (Vorgabe aus den Regeln), auf der Oberfläche verdrängt eine andere Art die alte, beim Gas behauptet sich die größere Menge
+ Oberfläche nur auf passierbarem Gelände: `schwund` je Welttick (ruht, solange das Feld brennt), `beimBetreten` (Haken `betritt_feld`) und `jeTick` auf Wesen darin für `ausloesenFuer`, `ausbreitung` auf ein Nachbarfeld ohne Oberfläche (Myzel), `gefaehrlich` meiden die Wege
+ Gas nur auf gasdurchlässigen Feldern (Wände und geschlossene Türen halten es auf): je Welttick Quellen am Gelände (ein undurchlässiges Gelände wie der Gärbottich gibt sein Gas gleichmäßig an die durchlässigen Nachbarn ab), Ausgleich, Abbau, Wirkung
+ Ausgleich: je Paar aus Gasfeld und Nachbar fließt ein Neuntel des Unterschieds vom volleren ins leerere Feld, abgerundet, alles aus dem alten Stand berechnet; die Gesamtmenge bleibt genau erhalten, verschiedene Gase vermischen sich nicht
+ Abbau: der Bruchteil wird gewürfelt (1 % von 50 ist mit 50 % Chance 1), so bleiben auch kleine Mengen nicht ewig und große bauen sich im Mittel genau ab
+ Wirkung: je Welttick die höchste erreichte Stufe, deren `wenn` am Wesen gilt, z.B. CO2 ab 30 benommen, ab 70 Ersticken, beides nur ohne den Tag `anaerob`; ab `undurchsichtigAb` versperrt dichtes Gas die Sicht (Ninkasis Sichtfeld wird dann je Welttick neu berechnet), Geschosse fliegen hindurch
+ Feuer je Welttick und brennendem Feld: `brennen` auf Wesen darin (auch beim Betreten), Rauch, Übergreifen auf jedes nicht brennende Nachbarfeld mit der Chance seiner Brennbarkeit (die höchste aus Gelände, Oberfläche und Gas); dann sinkt die Menge um 1, erlischt das Feuer, verbrennen Oberfläche und Gelände zu `verbrenntZu` (eine Holztür zu Boden), neu entzündete Felder brennen ab dem nächsten Tick
+ Brennbares Gas fängt auf einmal Feuer, verschwindet und wirkt `explodiert` am Feld (Verpuffung)
+ Wiederholbar: alle Würfe über den Spiel-Zufall, immer nach Feldindex aufsteigend; die Weltuhr bearbeitet nur belegte Felder; die Liste der Gasquellen hält der `zwischenspeicher`, `gelaendeSetzen` verwirft sie
+ Wege: die KI meidet Feuer und Gefährliches, Reise und Erkunden ebenso
+ Anzeige: farbige Überlagerung auf sichtbaren Feldern, Oberfläche und Feuer unter den Entitäten, Gas darüber mit der Menge zunehmend deckend; Farben in `zeichen.schichten`; Tiles folgen
+ Im Spielinhalt (Zahlen vorläufig): die Säuredüse hinterlässt Säure (verätzt 1W3 je Tick, trocknet); drei Gärbottiche je Ebene im Inneren der Räume (Gelände-Objekte, sperren keinen Durchgang) geben CO2 ab, das sich hinter geschlossenen Türen sammelt; drei Brandflaschen je Ebene zerspringen beim Wurf zu Hochprozentigem und entzünden es; Feuer 1W6, Rauch ab 40 undurchsichtig, ab 60 Husten; Benommenheit und Ersticken sind vorläufig Giftschaden, bis es Zustände im Spielinhalt gibt

## Ebenen

Vorbilder: Brogue und DCSS (Ebenen bleiben erhalten, Treppen verbinden sie), Grundlagen (Hub zwischen den Ebenen).

Daten:

+ Abfolge der Tiefen in `daten/index.js`: `abfolge: ["hub", "keller", "keller", "keller"]` (Tiefe 0 ist der Hub), `starttiefe: 1`; mehrere Tiefen dürfen dieselbe Vorlage aus `daten/ebenen.js` nutzen
+ Ebene (`daten/ebenen.js`): feste `karte` (Zeilen aus Geländekennungen, z.B. der Hub) oder `breite`, `hoehe` und Parameter für den Digger von rot.js (`digger`), dazu `gelaende`, `gelaendeObjekte` (z.B. Gärbottiche), `tuerChance`, `fallen`, `gegenstaende` und `population: { tabelle, anzahl: [min, max] }` oder eine feste Liste `gegner`
+ Population (`daten/populationen.js`): Einträge `{ typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }`; Regelwerte `regeln.population` (`tieferChance` 10, `tieferBis` 2, `hoechstWesen` 500)
+ Im Zustand: `ebene` (die aktuelle), `tiefe`, `abgelegteEbenen[tiefe]` (verlassene Ebenen mit ihren Entitäten und Einträgen der Warteschlange samt Zeitpunkt)

Schnittstellen:

+ `ebeneErzeugen(spiel, tiefe)` (`src/welt/ebene.js`) gibt die Treppen zurück (`{ treppeAuf, treppeAb }`); `ebenennameFuer`, `eintraegeFuerTiefe`
+ Befehl `{ art: "treppe" }` (Taste `<` oder `>`), nur für Ninkasi, Ablehnung `keine_treppe`, Zeitkosten `aktionen.treppe`; Meldung `ebene_gewechselt` mit `tiefe` und `richtung`
+ `ebeneWechseln` (`src/systeme/ebenen.js`)

Regeln:

+ Jede Tiefe bekommt ihren eigenen abgeleiteten Zufall (`ebene.<tiefe>.<name>`, dazu `.tueren`, `.objekte`, `.inhalt`, siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), ist je Startwert also wiederholbar und doch verschieden
+ Erzeugung: eine feste Karte wird übernommen; sonst Digger mit Treppe hinauf in der Mitte des ersten Raums und Treppe hinab in der Mitte des Raums, der davon am weitesten entfernt ist, jeweils nur, wenn es die Tiefe gibt; Ninkasi legt die Erzeugung nicht an; zu Beginn steht Ninkasi auf der Treppe hinauf der Starttiefe (oder in der Mitte des ersten Raums)
+ Wechsel: die alte Ebene kommt mit allen Entitäten außer Ninkasi und dem, was sie trägt, und deren Einträgen der Warteschlange (Akteure, gebundene Zeitereignisse) samt Zeitpunkt nach `abgelegteEbenen`; die Weltuhr gehört keiner Ebene und läuft weiter
+ Verlassene Ebenen ruhen: bei der Rückkehr rücken alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände) um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt und ihre Wesen eingereiht; Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien Feld
+ Der Wechsel verwirft den räumlichen Index (siehe [Architektur.md](Architektur.md), Leistung); nur hier wird Ninkasis Position deshalb direkt gesetzt, der Index entsteht danach neu; Gasquellen und andere Vorräte im `zwischenspeicher` hängen an der Ebene und entstehen ebenso neu
+ Wesen folgen Ninkasi nicht über Treppen
+ Population: je Wurf gewichtet unter den Einträgen der Tiefe, mit `tieferChance` aus einer bis zu `tieferBis` Tiefen tieferen; ein Rudel steht beieinander (jedes weitere Mitglied auf dem freien Feld, das dem ersten am nächsten liegt), Affixe sind Zustände beim Erzeugen; findet ein Wurf nichts, fällt er aus; bestellt eine Ebene mit Ninkasi mehr als `hoechstWesen`, ist das ein Datenfehler
+ Im Spielinhalt (Zahlen vorläufig): der Hub ist ein leerer Raum mit Treppe hinab (Dienste folgen), drei Kellertiefen mit 16 bis 20 Wesen, Essigbakterien in Rudeln von 1 bis 3, Fernkämpfer ab Tiefe 2 häufiger; Treppen haben noch keine Tiles

## Wegfindung

Schnittstellen (`src/welt/wege.js`, ein gemeinsames Modul für KI und Reise, AStar aus rot.js mit acht Richtungen):

+ `weg(spiel, start, ziel, optionen)` gibt die Felder des Weges ohne Startfeld zurück, `[]` wenn Start und Ziel gleich sind, `null`, wenn es keinen Weg gibt; `naechstesWegfeld`
+ Optionen: `nurErkundet` (nur Felder, die Ninkasi schon gesehen hat, keine Hellseherei bei der Reise), `wesenMeiden` (Felder mit Wesen gelten als versperrt, außer Start und Ziel), `bewegung` (Bewegungsart, Vorgabe `laufend`), `oeffnetTueren` (geschlossene Türen zählen als begehbar, Vorgabe ja), `meiden` (`(x, y) => true` für gemiedene Felder, außer Start und Ziel, z.B. bekannte Fallen und Gefahren)
+ `naechstesFeldMit` (Breitensuche, z.B. für das Erkunden), `amRandDesErkundeten`

Regeln:

+ Später: Kosten je Gelände statt nur Meiden, dann für KI und Spielerin zugleich

## Sichtweite

+ Die Sichtweite (`reichweiteSicht` in `src/systeme/sicht.js`, Modifikatoren auf `reichweiteSicht`) ergibt sich aus Grundwert, Skills und Zuständen; Hindernisse begrenzt der Schattenwurf des Sichtfelds
+ Ist sie größer als der Ausschnitt, wird nicht herausgezoomt; die Liste "In Sicht" der Seitenleiste nennt alle sichtbaren Wesen; Markierungen am Kartenrand für Gegner außerhalb des Ausschnitts sind vorgesehen, noch nicht umgesetzt

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

Schnittstellen (`src/systeme/gefahr.js`, reine Lesefunktionen, verändern nichts und benutzen keinen Zufall):

+ `lageErfassen`: eine Lage ist ein Schnappschuss (sichtbare Feinde, LP); `sichtbareFeinde`; `gefahrPruefen` vergleicht zwei Lagen
+ Register `gefahren` (`(vorher, nachher) => true` bei neuer Gefahr): `gegner_in_sicht`, `schaden`

Regeln:

+ Reise, Laufen, Rasten und Erkunden nutzen die Prüfungen mit den Listen aus den Einstellungen (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden), lange Aktionen mit der Liste aus den Regeln (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen)

## Tests

+ `tests/gelaende.test.js` (Türen, Benutzen, Fallen, Entdecken), `tests/schichten.test.js` (Oberfläche, Gas, Feuer), `tests/ebenen.test.js` (Erzeugung, Treppen, Ruhen, Population), `tests/wege.test.js`, `tests/gefahr.test.js`, `tests/geometrie.test.js`

## Verweise

+ Spieldesign der Welt und des Hubs: [Grundlagen.md](Grundlagen.md); Darstellung von Karte und Schichten: [Anzeige.md](Anzeige.md); Tiles: [Tileset.md](Tileset.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 8 (u.a. Nachholen der Zeit verlassener Ebenen, Wesen folgen über Treppen, Dienste des Hubs, Tiles); Themenräume als Idee in [Ausblick.md](Ausblick.md)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
