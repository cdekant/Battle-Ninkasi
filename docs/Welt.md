# Battle Ninkasi - Welt

Stand: 2026-11-25

Zuständig für: `src/welt/ebene.js`, `src/welt/ebenenschritte.js`, `src/welt/plan.js`, `src/welt/population.js`, `src/welt/karte.js`, `src/welt/schichten.js`, `src/welt/wege.js`, `src/systeme/gelaende.js`, `src/systeme/fallen.js`, `src/systeme/schichten.js`, `src/systeme/ebenen.js`, `src/systeme/sicht.js`, `src/systeme/licht.js`, `src/systeme/duft.js`, `src/systeme/erinnerung.js`, `src/systeme/gefahr.js`, `daten/gelaende.js`, `daten/schichten.js`, `daten/ebenen.js`

Mitprüfen bei Änderungen: [Wesen.md](Wesen.md), [Anzeige.md](Anzeige.md), [Grundlagen.md](Grundlagen.md), [Bedienung.md](Bedienung.md), [Ausblick.md](Ausblick.md), [Architektur.md](Architektur.md), [Skills.md](Skills.md)

## Zweck

Die Karte und was auf ihr liegt: Gelände mit Türen und Fallen, Feldschichten (Oberfläche, Gas, Feuer), der Plan des Laufs, Ebenen und Treppen, Wegfindung, Sichtweite, Licht und die Gefahrenprüfung. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Gelände

Vorbild Brogue: Türen öffnen sich beim Hindurchgehen und schließen sich von selbst, Fallen sind verborgen, bis man sie entdeckt; Wesen der Ebene kennen ihre Fallen.

Daten:

+ Gelände (`daten/gelaende.js`): `kennung` (ein Zeichen, so steht das Feld in `zustand.ebene.felder`, einer Liste von Zeichenketten), `text` (Name für Untersuchen und Tooltip, Pflicht), `passierbar`, `passierbarFuer`, `undurchdringlich`, `durchsichtig`, `geschossdurchlaessig` (Vorgabe wie `durchsichtig`), `gasdurchlaessig` (Vorgabe wie passierbar), `laermdaempfung`, `treppe` ("ab" oder "auf"), `tuer` (`{ offen, aufschlag? }` an der geschlossenen, `{ zu }` an der offenen Tür; `aufschlag` in Prozent, `tuer_zu` 50), `zerstoerbar: { wird }`, `beimBenutzen` (Effekt), `beimFestsitzen` (Effekt), `brennbar`, `brenndauer`, `verbrenntZu`, `quelle: { gas, menge }`; jede Art braucht ein Zeichen in `daten/zeichen.js`
+ Am Wesen `tueren`: `"oeffnen"` (Vorgabe) oder `"nicht"`
+ Fallen (`datenproben/fallen.js`): Entitäten auf einem Feld mit `falle: { tarnung, effekt, ausloesenFuer? }` und `verborgen` (Vorgabe ja), nach dem Auslösen oder Entdecken `entdeckt`; die Ebene legt sie nach `fallen: [{ typ, anzahl }]`
+ Regelwerte `regeln.fallen`: `entdeckenVorgabe` 30, `reichweite` 5; an der Ebene `tuerChance`

Schnittstellen:

+ Karte (`src/welt/karte.js`): `feldIndex`, `aufDerKarte`, `gelaendeAuf`, `gelaendeName`, `passierbar`, `betretbar`, `betretbarFuer`, `oeffnetTueren`, `fest`, `durchsichtig`, `geschossdurchlaessig`, `abstand`, `BEWEGUNGSARTEN`
+ `gelaendeSetzen(spiel, feld, name)` (`src/systeme/gelaende.js`): ändert ein Feld, meldet `gelaende_geaendert`, berechnet Ninkasis Sichtfeld neu, wenn das Feld in ihrer Sichtweite liegt, und merkt Wesen darauf für die Lageprüfung vor (eine Wand auf ihrem Feld klemmt sie ein, siehe [Wesen.md](Wesen.md), Bewegung)
+ Bausteine `gelaende_setzen { gelaende, muster? }` (Zielfeld oder Felder des Musters) und `gelaende_zerstoeren { muster? }` (Gelände mit `zerstoerbar` wird zu `wird`, z.B. eine Tür zu Boden); Parameterart `gelaende` in der Datenprüfung
+ Befehl `benutzen { dx, dy }` auf ein Nachbarfeld oder das eigene: Gelände mit `beimBenutzen` (Hebel, Schalter, Aushang), Ziel des Effekts ist die Benutzerin (`zielId`) und das Feld (`zielfeld`), Ursache `benutzen`, Meldung `benutzt`, Zeitkosten `aktionen.benutzen`; Ablehnung `nichts_zu_benutzen`
+ Fallen (`src/systeme/fallen.js`): `istBekannt`, `fallenMeiden` (für die Wegfindung), `entdeckenVon`, `entdeckenChance`; Meldungen `falle_ausgeloest`, `falle_entdeckt`

Regeln:

+ Ein Gitter ist undurchsichtig, lässt aber Geschosse durch, Glas umgekehrt; die Sichtlinie bleibt von `geschossdurchlaessig` unberührt
+ Türen: betritt ein Wesen, das Türen öffnet, die geschlossene, geht sie auf (Haken `betritt_feld`), verlässt das letzte Wesen die offene und liegt nichts darin, geht sie zu (`verlaesst_feld`); geschlossen versperrt sie die Sicht und dämpft Lärm (`laermdaempfung` 3); der Schritt auf die geschlossene kostet `aufschlag` Prozent mehr als die eigenen Grundkosten fürs Bewegen (vor den Modifikatoren, `src/systeme/bewegung.js`), aus der offenen heraus nicht
+ Bakterien öffnen keine Türen, eine geschlossene Tür hält sie auf; für sie ist die Tür wie eine Wand, auch in der Wegfindung (Option `oeffnetTueren`)
+ Die Ebene setzt Türen an die Zugänge der Räume, die rot.js meldet, mit `tuerChance` Prozent und eigenem abgeleitetem Zufall; in Türöffnungen entsteht nichts
+ Fallen lösen am Haken `betritt_feld` aus, nur für die Bewegungsarten in `ausloesenFuer` (Vorgabe `laufend`), Quelle die Falle, Ursache `falle`, eine Kettenstufe tiefer; danach gilt sie als entdeckt; Fallen wecken nicht und ziehen keinen Zorn auf sich (das gilt nur für Wesen als Urheberin)
+ Entdecken am Haken `zug_ende`, nur für Ninkasi: für jede verborgene Falle, die sie sieht und die höchstens `reichweite` entfernt ist, ein Wurf mit E / (E + Tarnung), E = Entdecken × 2 / (1 + Abstand); Entdecken ist ein Kampfwert (Vorgabe `entdeckenVorgabe`), Skills ändern ihn über Modifikatoren; Beispiel Entdecken 30 gegen Tarnung 30: daneben 50 %, auf 3 Felder 33 % je Zug
+ Die Anzeige zeigt Fallen erst, wenn sie bekannt sind; Wesen mit KI meiden alle Fallen, Reise und Erkunden die entdeckten (Option `meiden` der Wegfindung); liegt eine entdeckte Falle in einem Gang ohne Umweg, hält die Reise mit `kein_weg`, das Erkunden mit `gefahr_im_weg` (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden); `naechstesFeldMit` in `src/welt/wege.js` kennt dasselbe `meiden` wie der Weg und sucht weder über gemiedene Felder noch zu ihnen
+ Hebel mit Wirkung in der Ferne brauchen Themenräume (Idee in [Ausblick.md](Ausblick.md))

## Feldschichten

Vorbild Brogue: je Feld höchstens eine Gasart, die sich auf die Nachbarn verteilt und je Art verfliegt; dichter Rauch versperrt die Sicht; Feuer springt nach der Brennbarkeit der Nachbarn über, verbrennt Brennbares und erzeugt Rauch; Monster meiden Feuer und schädliches Gas.

Daten:

+ Drei Schichten (`SCHICHTEN`) neben der Karte in `zustand.ebene.schichten`, nur belegte Felder: `oberflaeche` und `gas` mit `{ art, menge }`, `feuer` mit `{ menge }` (Brenndauer in Weltticks); dazu `urheberId` und `urheberFraktion`, wenn der Eintrag eine Urheberin hat
+ Arten (`daten/schichten.js`): `oberflaechen` mit `hoechstens?`, `schwund`, `beimBetreten`, `jeTick`, `ausloesenFuer` (Vorgabe `laufend`, `unbeweglich`), `brennbar`, `brenndauer`, `verbrenntZu`, `ausbreitung: { chance }`, `gefaehrlich`; `gase` mit `hoechstens?`, `abbau` (Prozent je Tick), `stufen: [{ ab, effekt, wenn? }]`, `undurchsichtigAb`, `brennbar`; beide Arten wahlweise mit `licht` (siehe Licht)
+ Regelwerte: `regeln.feuer` (`brennen`, `rauch`, `rauchMenge`, `licht`, siehe Licht), `regeln.schichten` (`hoechstOberflaeche` 10, `hoechstGas` 1000)

Schnittstellen:

+ Datenzugriff (`src/welt/schichten.js`, ändert nichts): `schichtenVon`, `schichtAuf`, `belegteFelder`, `feldVonIndex`, `gasdurchlaessig`, `sichtdurchlaessig`
+ `src/systeme/schichten.js`: `oberflaecheSetzen`, `gasSetzen`, `entzuenden` (je mit einer freiwilligen Urheberin `{ id, fraktion }` als letztem Parameter), `brennbarkeit`, `gefahrenMeiden` (für die Wegfindung, zusammen mit den Fallen über `meidenZusammen`); Handler der Weltuhr für Quellen, Ausgleich, Abbau, Wirkung und Feuer
+ Bausteine `oberflaeche_setzen { art, menge, muster? }`, `gas_setzen { art, menge, muster? }`, `entzuenden { muster? }` (nur wo etwas brennt), mit der Urheberin des Effekts; Parameterarten `oberflaeche` und `gas` in der Datenprüfung

Regeln:

+ Je Feld und Schicht höchstens eine Art: gleiche Art addiert bis `hoechstens` (Vorgabe aus den Regeln), auf der Oberfläche verdrängt eine andere Art die alte, beim Gas behauptet sich die größere Menge
+ Oberfläche nur auf passierbarem Gelände: `schwund` je Welttick (ruht, solange das Feld brennt), `beimBetreten` (Haken `betritt_feld`) und `jeTick` auf Wesen darin für `ausloesenFuer`, `ausbreitung` auf ein Nachbarfeld ohne Oberfläche (Myzel), `gefaehrlich` meiden die Wege
+ Gas nur auf gasdurchlässigen Feldern (Wände und geschlossene Türen halten es auf): je Welttick Quellen am Gelände (ein undurchlässiges Gelände wie der Gärbottich gibt sein Gas gleichmäßig an die durchlässigen Nachbarn ab), Ausgleich, Abbau, Wirkung
+ Ausgleich: je Paar aus Gasfeld und Nachbar fließt ein Neuntel des Unterschieds vom volleren ins leerere Feld, abgerundet, alles aus dem alten Stand berechnet; die Gesamtmenge bleibt genau erhalten, verschiedene Gase vermischen sich nicht
+ Abbau: der Bruchteil wird gewürfelt (1 % von 50 ist mit 50 % Chance 1), so bleiben auch kleine Mengen nicht ewig und große bauen sich im Mittel genau ab
+ Wirkung: je Welttick die höchste erreichte Stufe, deren `wenn` am Wesen gilt, z.B. CO2 ab 30 benommen, ab 70 Ersticken, beides nur ohne den Tag `anaerob`; ab `undurchsichtigAb` versperrt dichtes Gas die Sicht (Ninkasis Sichtfeld wird dann je Welttick neu berechnet), Geschosse fliegen hindurch
+ Feuer je Welttick und brennendem Feld: `brennen` auf Wesen darin (auch beim Betreten), Rauch, Übergreifen auf jedes nicht brennende Nachbarfeld mit der Chance seiner Brennbarkeit (die höchste aus Gelände, Oberfläche und Gas); dann sinkt die Menge um 1, erlischt das Feuer, verbrennen Oberfläche und Gelände zu `verbrenntZu` (eine Holztür zu Boden), neu entzündete Felder brennen ab dem nächsten Tick
+ Brennbares Gas fängt auf einmal Feuer, verschwindet und wirkt `explodiert` am Feld (Verpuffung)
+ Urheberin (Vorbild DCSS, Wolken tragen ihre Verursacherin): eine Schicht wirkt ohne Quelle (`quelleId: null`), aber zugerechnet ihrer Urheberin, so zählen gebundene EP, Zorn, Ruf und Todesursache wie bei einem unmittelbaren Treffer; eine Zugabe mit Urheberin übernimmt das Feld, eine ohne (Gasquelle am Gelände) lässt die vorhandene stehen; Ausbreitung, Ausgleich in ein leeres Feld, Übergreifen des Feuers (vom ersten brennenden Nachbarn nach Feldindex), Rauch und `verbrenntZu` erben sie; ein Feuer ohne Urheberin übernimmt beim Verpuffen die des Gases
+ Bewusst ohne: Schwerkraft, Druck und Temperatur beim Gas, Fließen von Flüssigkeiten (sie sind Oberfläche mit Menge)
+ Wiederholbar: alle Würfe über den Spiel-Zufall, immer nach Feldindex aufsteigend; die Weltuhr bearbeitet nur belegte Felder; die Liste der Gasquellen hält der `zwischenspeicher`, `gelaendeSetzen` verwirft sie (wie die Abstandskarten, siehe Wegfindung)
+ Wege: die KI meidet Feuer und Gefährliches, Reise und Erkunden ebenso
+ Anzeige: farbige Überlagerung auf sichtbaren Feldern, Oberfläche und Feuer unter den Entitäten, Gas darüber mit der Menge zunehmend deckend; Farben in `zeichen.schichten`; Tiles folgen

## Plan des Laufs

Vorbilder: Brogue (Schatzräume über die Tiefen verteilt und ausgeglichen), DCSS (Vaults und Zweige mit Bedingungen nach Tiefe); Ideen, die darauf bauen (Schatzräume mit Schlüssel, Questsystem, feste Strukturen): [Ausblick.md](Ausblick.md).

Daten:

+ Im Zustand: `plan = { starttiefe, tiefen: [{ vorlage, inhalte: [] }] }`; `starttiefe` ist die Tiefe, in der der Lauf beginnt (`neuesSpiel` liest sie); `vorlage` ist der Name einer Ebene aus `daten/ebenen.js`, `inhalte` sind Datenobjekte mit `art`, die Schritte des Plans für die Tiefe vorsehen (bisher keine)

Schnittstellen (`src/welt/plan.js`):

+ `laufPlanen(spiel)` in `neuesSpiel` nach den Etiketten und vor der ersten Ebene; `ebenennameFuer(zustand, tiefe)` (null, wenn es die Tiefe nicht gibt), `planEintragFuer(zustand, tiefe)`
+ Register `planschritte`: `(spiel, plan, zufall) => void`, in Anmeldereihenfolge mit einem gemeinsamen Zufall `"plan"`; bisher `abfolge`, der `daten.abfolge` und `daten.starttiefe` überträgt, `testkammer`, der im allmächtigen Lauf die Vorlage einer Tiefe ersetzt und dort beginnen lässt, und `arena`, der in der Arena nur die Tiefe 0 mit ihrer Karte plant (beide siehe [Architektur.md](Architektur.md), Spielarten)

Regeln:

+ Der Plan steht fest, bevor die erste Ebene entsteht, und folgt allein aus Startwert und Daten; eine Ebene, die erst beim ersten Betreten entsteht, liest ihren Eintrag (`bau.planEintrag`), so kann etwas auf einer Tiefe feststehen, die noch nicht erzeugt ist (z.B. ein Schlüssel zwei Tiefen tiefer)
+ Der Plan gehört zum Zustand und nicht nur zu den Daten, damit ihn spätere Ereignisse im Lauf ändern können (z.B. eine Quest, die im Hub vergeben wird); weil sie aus Befehlen folgen, bleibt der Lauf wiederholbar
+ Treppen und der Befehl `treppe` fragen den Plan, ob es eine Tiefe gibt, nicht `daten.abfolge`

## Ebenen

Vorbilder: Brogue und DCSS (Ebenen bleiben erhalten, Treppen verbinden sie), Grundlagen (Hub zwischen den Ebenen).

Daten:

+ Abfolge der Tiefen in `daten/index.js`: `abfolge`, im Probeinhalt `["hub", "keller", "keller_dunkel", "keller"]` (Tiefe 0 ist der Hub), `starttiefe: 1`; mehrere Tiefen dürfen dieselbe Vorlage aus `daten/ebenen.js` nutzen; der Plan des Laufs übernimmt sie
+ Ebene (`daten/ebenen.js`): feste `karte` (Zeilen aus Geländekennungen, z.B. der Hub) oder `breite`, `hoehe` und Parameter für den Digger von rot.js (`digger`), dazu `gelaende` (Rollen `wand`, `boden`, `tuer`, `treppeAuf`, `treppeAb`; Vorgaben `wand`, `boden`, `tuer_zu`, `treppe_auf`, `treppe_ab`), `gelaendeObjekte` (z.B. Gärbottiche), `wandObjekte` (z.B. Wandfackeln), `licht: { grundhelligkeit }` (siehe Licht), `tuerChance`, `fallen`, `gegenstaende` und `population: { tabelle, anzahl: [min, max] }` oder eine feste Liste `gegner`; wahlweise `schritte`, die Folge der Ebenenschritte
+ Vorgaben der Schritte in `regeln.ebenen`: `schritteErzeugt` (`karte_digger`, `tueren`, `treppen`, `gelaende_objekte`, `wand_objekte`, `erreichbarkeit`, `ebene_anlegen`, `wegpunkte`, `freie_felder`, `population`, `gegenstaende`, `fallen`), `schritteFest` für Ebenen mit `karte` (`karte_fest`, `erreichbarkeit`, `ebene_anlegen`), `versuche` 10, `folgen.abstand` 1 (siehe Verfolger unter Regeln)
+ Population (`datenproben/populationen.js`): Einträge `{ typ, gewicht, tiefe: [von, bis], rudel?: [min, max], affixe?: [{ zustand, chance }] }`; Regelwerte `regeln.population` (`tieferChance` 10, `tieferBis` 2, `hoechstWesen` 500, `schlafChance` 50)
+ Wegpunkte: `ebene.wegpunkte: [{ x, y }]`, Ziele umherziehender Wesen (siehe [Wesen.md](Wesen.md), KI); Regelwert `regeln.ki.wegpunktSicht` (7)
+ Im Zustand: `ebene` (die aktuelle), `tiefe`, `abgelegteEbenen[tiefe]` (verlassene Ebenen mit ihren Entitäten und Einträgen der Warteschlange samt Zeitpunkt)
+ Baukontext (`src/welt/ebene.js`), den die Schritte nacheinander füllen: `{ tiefe, name, ebenendaten, planEintrag, versuch, schluessel, zufall(name), zeilen, raeume, tuerFelder, treppen, freieFelder }`; er lebt nur während der Erzeugung und gehört nicht zum Zustand

Schnittstellen:

+ `ebeneErzeugen(spiel, tiefe)` (`src/welt/ebene.js`) gibt die Treppen zurück (`{ treppeAuf, treppeAb }`); `schritteDerEbene(daten, ebenendaten)`
+ Register `ebenenschritte` (`src/welt/ebenenschritte.js`): `{ braucht: [teil], liefert: [teil], verwirft?, ausfuehren(spiel, bau) }`, Teile sind `karte`, `raeume`, `treppen`, `ebene`, `freie_felder`; ein Schritt mit `verwirft` darf `NEUER_VERSUCH` zurückgeben; `unerreichbareFelder(spiel, zeilen, start)`, `kennungFuer(spiel, bau, rolle)`
+ `eintraegeFuerTiefe`, `populationSetzen`, `freiesFeldZiehen` (`src/welt/population.js`)
+ Befehl `{ art: "treppe" }` (Taste `<` oder `>`), nur für Ninkasi, Ablehnung `keine_treppe`, Zeitkosten `aktionen.treppe`; Meldung `ebene_gewechselt` mit `tiefe` und `richtung`
+ `ebeneWechseln` (`src/systeme/ebenen.js`)
+ Register `mitnehmen`: `(spiel, ninkasi, wechsel) => [id]` mit `wechsel = { von, nach, richtung }`; angemeldet sind `getragenes` (Ninkasi) und `verfolger` (`verfolgt(spiel, wesen, ninkasi)`); was ein Mitgenommener trägt, kommt immer mit; Begleiter melden später einen eigenen Eintrag an
+ Meldung `gefolgt` mit `wer` und `wem` je angekommenem Verfolger

Regeln:

+ Jede Tiefe bekommt ihren eigenen abgeleiteten Zufall (`ebene.<tiefe>.<name>` für den Digger, `bau.zufall(name)` dahinter, z.B. `.tueren`, `.objekte`, `.inhalt`, siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), ist je Startwert also wiederholbar und doch verschieden; nie aus dem Spielverlauf
+ Erzeugung in Schritten: die Folge aus `schritte` der Ebene, sonst die Vorgabe; die Datenprüfung verlangt, dass jeder Schritt angemeldet ist, ein früherer liefert, was er braucht, ein verwerfender Schritt vor `ebene_anlegen` steht (dann steht noch nichts im Zustand) und am Ende eine Ebene angelegt ist
+ Schritte: `karte_digger` gräbt mit dem Digger; `karte_fest` übernimmt die feste Karte samt Treppen; `tueren` setzt an Raumzugängen mit `tuerChance` Prozent Türen; `treppen` setzt die Treppe hinauf in die Mitte des ersten Raums und die Treppe hinab in die Mitte des Raums, der davon am weitesten entfernt ist, jeweils nur, wenn es die Tiefe im Plan gibt; `gelaende_objekte` setzt Objekte nur ins Innere der Räume außer dem ersten, so sperren sie keinen Durchgang; `wand_objekte` setzt Objekte auf Wandfelder, die waagrecht oder senkrecht an den Boden eines Raums grenzen (Zufall `.wandobjekte`); `erreichbarkeit` verlangt, dass jedes Feld, das ein laufendes Wesen betreten kann (Türen zählen als offen), von der Treppe hinauf (sonst hinab, sonst der Mitte des ersten Raums) in acht Richtungen erreichbar ist; `ebene_anlegen` setzt `zustand.ebene` samt `licht` aus der Vorlage; `wegpunkte` legt die Wegpunkte (Vorbild Brogue): die begehbaren Felder (Türen zählen als offen) in einer Reihenfolge aus dem Zufall `.wegpunkte`, ein Feld wird Wegpunkt, wenn es noch kein Wegpunkt innerhalb von `wegpunktSicht` sieht (Schattenwurf durch das Gelände), so liegt jedes begehbare Feld in Sicht eines Wegpunkts; `freie_felder` sammelt Bodenfelder außerhalb des ersten Raums und seines Rands ohne Zugänge; `population`, `gegenstaende` und `fallen` setzen darauf mit dem gemeinsamen Zufall `.inhalt`
+ Verwirft ein Schritt den Versuch, beginnt der Bau neu mit dem Schlüssel `ebene.<tiefe>.<name>.versuch<n>`, höchstens `regeln.ebenen.versuche` Mal, danach wirft die Erzeugung; der erste Versuch behält den Schlüssel ohne Zusatz
+ Ninkasi legt die Erzeugung nicht an; zu Beginn steht Ninkasi auf der Treppe hinauf der Starttiefe (oder in der Mitte des ersten Raums)
+ Wechsel: die alte Ebene kommt mit allen Entitäten außer den Mitgenommenen und deren Einträgen der Warteschlange (Akteure, gebundene Zeitereignisse) samt Zeitpunkt nach `abgelegteEbenen`; die Weltuhr gehört keiner Ebene und läuft weiter
+ Verlassene Ebenen ruhen: bei der Rückkehr rücken alle Zeitangaben dort (Einträge, Beginn und Ende der Zustände) um die vergangene Zeit nach; noch nie besuchte Tiefen werden erzeugt und ihre Wesen eingereiht; Ninkasi kommt an der Gegentreppe an (wer hinabsteigt, an der Treppe hinauf), ist sie besetzt, am nächsten freien Feld
+ Der Wechsel verwirft den räumlichen Index (siehe [Architektur.md](Architektur.md), Leistung); nur hier wird Ninkasis Position deshalb direkt gesetzt, der Index entsteht danach neu; Gasquellen und andere Vorräte im `zwischenspeicher` hängen an der Ebene und entstehen ebenso neu
+ Verfolger (Vorbilder Brogue und NetHack): ein Wesen folgt, wenn es höchstens `regeln.ebenen.folgen.abstand` (1) Felder entfernt steht, handeln und sich bewegen kann, nicht `folgt: false` trägt (Daten des Wesens) und Ninkasi jagt (KI `jagen` im Wachzustand `jagt`, sie ist sein Ziel nach `trifft`; ein Fliehender hat eine andere KI) oder von ihr beschworen ist; Helfer aus dem Beistand folgen nicht, ihr Beistand endet mit dem Kampf
+ Mitgenommene Wesen verlassen ihr Feld bis zur Ankunft, behalten ihren Platz in der Warteschlange (kein Freizug, ihr nächster Zug kommt wie geplant) und stehen nach ID geordnet auf dem nächsten freien, für sie betretbaren Feld bei Ninkasi; die KI kennt danach Ninkasis neue Position; ohne freies Feld bleiben sie samt Gepäck und Einträgen auf der alten Ebene an ihrem Platz
+ Population: je Wurf gewichtet unter den Einträgen der Tiefe, mit `tieferChance` aus einer bis zu `tieferBis` Tiefen tieferen; ein Rudel steht beieinander (jedes weitere Mitglied auf dem freien Feld, das dem ersten am nächsten liegt), Affixe sind Zustände beim Erzeugen; ein Rudel (ein fester Gegner ist ein Rudel für sich) schläft mit `schlafChance` Prozent, sonst ist es wach, einmal je Rudel gewürfelt mit dem eigenen Zufall `.schlaf`, nur für Wesen mit KI ohne eigenen `wachzustand` in den Daten; jedes weitere Mitglied trägt `ki.anfuehrerinId`, die ID des ersten; findet ein Wurf nichts, fällt er aus; bestellt eine Ebene mit Ninkasi mehr als `hoechstWesen`, ist das ein Datenfehler

## Wegfindung

Schnittstellen (`src/welt/wege.js`, ein gemeinsames Modul für KI und Reise, AStar aus rot.js mit acht Richtungen):

+ `weg(spiel, start, ziel, optionen)` gibt die Felder des Weges ohne Startfeld zurück, `[]` wenn Start und Ziel gleich sind, `null`, wenn es keinen Weg gibt; `naechstesWegfeld`
+ Optionen: `nurBekannt` (nur Felder, deren Gelände Ninkasi kennt, und betretbar nach dem bekannten statt dem echten Gelände, siehe Sicht und Erinnerung; keine Hellseherei bei Reise, Erkunden und Wegvorschau; die KI plant mit dem echten Gelände), `wesenMeiden` (Felder mit Wesen gelten als versperrt, außer Start und Ziel), `bewegung` (Bewegungsart, Vorgabe `laufend`), `oeffnetTueren` (geschlossene Türen zählen als begehbar, Vorgabe ja), `meiden` (`(x, y) => true` für gemiedene Felder, außer Start und Ziel, z.B. bekannte Fallen und Gefahren)
+ `naechstesFeldMit` (Breitensuche, z.B. für das Erkunden), `amRandDesErkundeten` (ein Nachbar wurde nie gesehen, auch wenn er kartiert ist)
+ `abstandskarte(spiel, ziel, { bewegung, oeffnetTueren })` (Dijkstra-Karte, Vorbild Brogue): je Feldindex die Zahl der Schritte in acht Richtungen bis zum Ziel, `-1` für Unerreichbares, über betretbare Felder ohne Rücksicht auf Wesen; für Ziele, zu denen viele Wesen oft gehen (Wegpunkte)

Regeln:

+ Abstandskarten hält der `zwischenspeicher` je Ebene und Ziel, Bewegungsart und Türen; `gelaendeSetzen` verwirft sie
+ Später: Kosten je Gelände statt nur Meiden, dann für KI und Spielerin zugleich

## Sichtweite

+ Die Sichtweite (`reichweiteSicht` in `src/systeme/sicht.js`, Modifikatoren auf `reichweiteSicht`) ergibt sich aus Grundwert (`sicht.reichweite` über `sichtVon`), Skills und Zuständen; Hindernisse begrenzt der Schattenwurf des Sichtfelds
+ Die Sicht im Finstern (`sichtImFinstern`, Modifikatoren auf `sichtImFinstern`, die Nachtsicht) aus `sicht.imFinstern`, Vorgabe `regeln.licht.imFinstern` (1), Ninkasi 2: so weit sieht ein Wesen auf finstere Felder, und nie weniger auf Felder jeder Stufe (siehe Licht)
+ Die Sicht je Lichtstufe (`sichtAufStufe`, `sichtJeStufe`): der Anteil `sichtAnteil` der Stufe an der Sichtweite, mit Modifikatoren auf `sichtAnteil.<stufe>` (die Dämmersicht) höchstens 100 %, abgerundet; Ninkasi zu Beginn (6) dämmrig 4, dunkel 3, finster 2, ein gewöhnliches Wesen (7) 5, 3 und 1
+ Ist sie größer als der Ausschnitt, wird nicht herausgezoomt; die Liste "In Sicht" der Seitenleiste nennt alle sichtbaren Wesen; Markierungen am Kartenrand siehe [Anzeige.md](Anzeige.md), Kamera

## Sicht und Erinnerung

Daten (an der Ebene):

+ `erkundet`: je Feld 1, wenn Ninkasi es einmal wirklich gesehen hat; das Auto-Erkunden sucht seinen Rand (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden), EP bringt es keine; wird nie zurückgesetzt
+ `erinnerung`: je Feld die Kennung des zuletzt gesehenen oder kartierten Geländes, `null` für unbekannt; ein Feld ist bekannt, wenn hier etwas steht
+ `erinnerteDinge`: `{ <feldindex>: { oberflaeche?: art, gegenstaende?: [{ typ, text, anzahl }], fallen?: [{ typ, text }] } }`, nur Felder mit etwas darauf; gespeichert wird das Aussehen, nie eine ID, damit nichts über die Erinnerung den heutigen Zustand nachschlägt; Wesen, Gas und Feuer sind flüchtig und werden nicht erinnert
+ Verlassene Ebenen tragen ihre Erinnerung in `abgelegteEbenen` mit; am Spielstand ändert sich nichts (er ist die Liste der Befehle)

Schnittstellen:

+ `sichtfeldAktualisieren` (`src/systeme/sicht.js`) schreibt bei jeder Neuberechnung die bis dahin sichtbaren und die jetzt sichtbaren Felder in die Erinnerung; so bleibt der letzte gesehene Stand stehen, und für sichtbare Felder ist die Erinnerung immer das echte Gelände; beim Ebenenwechsel hält `ebeneWechseln` vor dem Ablegen noch einmal fest, was Ninkasi zuletzt sah
+ `src/systeme/erinnerung.js`: `erinnerungAuffrischen(spiel, feldIndizes)`, `kartieren(spiel, feldIndizes, { mitDingen })` (bekannt, aber nicht erkundet: die EP kommen erst beim Sehen), `vergessen(spiel, feldIndizes)` (nur die Erinnerung, `erkundet` bleibt: Wiedersehen bringt keine EP), `erinnerteDingeAuf(ebene, index)`; Baustein `vergessen {}` für den Filmriss (siehe [Wesen.md](Wesen.md), Stoffwechsel): die gesteuerte Entität vergisst die ganze Karte der Ebene bis auf die gerade sichtbaren Felder, bei jedem anderen Ziel geschieht nichts; der Baustein zum Kartieren kommt mit der Hellsicht
+ `src/welt/karte.js`: `feldBekannt(ebene, x, y)`, `bekanntesGelaendeAuf(spiel, x, y)`, `bekannterGelaendeName(spiel, x, y)`
+ Leser: Renderer, Minikarte und Untersuchen zeigen außer Sicht das Erinnerte (siehe [Anzeige.md](Anzeige.md), Oberfläche und [Bedienung.md](Bedienung.md), Untersuchen), Reise, Erkunden, Laufen und Wegvorschau planen nach dem bekannten Gelände (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden)

## Licht

Vorbilder: Brogue (im Dunkeln halbiert sich die Heimlichkeitsweite), Sil und NetHack (Lichtquellen mit Radius, finstere Felder sieht man nur aus der Nähe), Torchbearer (Licht als Ausrüstung mit Preis). Licht ist Spielmechanik, Stimmung ein Nebeneffekt.

Daten:

+ Grundhelligkeit je Ebene: `ebene.licht: { grundhelligkeit }` (0 bis 100) aus der Vorlage in `daten/ebenen.js`, Vorgabe 100; im Probeinhalt `keller_dunkel` mit 0 und 14 Wandfackeln
+ Lichtquelle: `licht: { reichweite, staerke, farbe? }` (Stärke 0 bis 100, Farbe nur für die Anzeige) an einer Entität (Wesen, Gegenstand), am Gelände (`daten/gelaende.js`, Probe: `wandfackel` mit Reichweite 5 und Stärke 80), an einer Art der Feldschichten (`daten/schichten.js`) und am Feuer (`regeln.feuer.licht`: Reichweite 4, Stärke 70)
+ Stufen `regeln.licht.stufen` aufsteigend `{ name, ab, heimlichkeit, sichtAnteil }` mit Text `licht.<name>`: `finster` ab 0 (Heimlichkeit 50 %, Sicht 0 %), `dunkel` ab 20 (50 %, 50 %), `daemmrig` ab 40 (70 %, 75 %), `hell` ab 60 (85 %, 100 %), `taghell` ab 80 (100 %, 100 %); `regeln.licht.imFinstern` 1; die Datenprüfung verlangt einen Anteil, der mit der Stufe nicht fällt, und für die oberste Stufe Heimlichkeit und Sicht 100 %; das alte `verbirgt` weist sie mit dem Ersatz ab
+ Nichts davon steht im Zustand außer der Grundhelligkeit; die Helligkeit wird bei jeder Frage aus den Quellen berechnet

Schnittstellen (`src/systeme/licht.js`, reine Lesefunktionen):

+ `helligkeitAuf(spiel, x, y)`, `lichtstufeAuf`, `stufeVonHelligkeit`, `lichtWirkt` (nur, wenn die Grundhelligkeit unter der obersten Stufe liegt), `heimlichkeitImLicht(spiel, feld)` (Prozent), `lichtbeitrag(licht, entfernung)`, `lichtquellenNahe`, `lichtVon`, `grundhelligkeit`; für die Anzeige `lichtAufFeld` mit den Beiträgen und ihren Farben
+ `src/systeme/sicht.js`: `hellGenug(spiel, betrachter, feld, weiten?)`, `sichtImFinstern`, `sichtAufStufe`, `sichtJeStufe`, `traegtLicht`
+ Handler der Weltuhr `licht` (`src/systeme/schichten.js`, nach dem Feuer): wo Licht wirkt, berechnet er Ninkasis Sichtfeld neu; `versetzen` (`src/systeme/bewegung.js`) tut es gleich, wenn sich ein anderes Wesen mit Licht bewegt; die Lichter des Geländes hält der `zwischenspeicher`, `gelaendeSetzen` verwirft sie

Regeln:

+ Helligkeit eines Felds: Grundhelligkeit plus die Beiträge aller Quellen, höchstens 100; liegt schon die Grundhelligkeit in der obersten Stufe, wirkt Licht gar nicht und das Spiel verhält sich wie ohne Licht
+ Beitrag einer Quelle im Schachbrett-Abstand d bis zur Reichweite r: `staerke * (2r - d) / (2r)`, abgerundet, am Rand also die halbe Stärke (eine Lampe mit Stärke 80 und Reichweite 3: 80, 66, 53, 40); nur auf Felder mit freier Sichtlinie von der Quelle (siehe [Wirkungen.md](Wirkungen.md), Zielauswahl), eine Wand als Quelle leuchtet in den Raum davor
+ Wo eine Quelle leuchtet: eine Entität mit Position (Wesen, Gegenstand am Boden), ein angelegter Gegenstand vom Feld der Trägerin aus, im Gepäck nichts; dazu Gelände, Schichten und Feuer
+ Sehen braucht Licht: ein Feld sieht ein Wesen nur bis zu seiner Sicht auf der Stufe dieses Felds (`sichtAufStufe`), ein finsteres nur bis `sichtImFinstern`; das gilt für Ninkasis Sichtfeld und für `sieht` aller anderen (siehe [Wesen.md](Wesen.md), Wahrnehmung)
+ Heimlichkeit: die Heimlichkeitsweite eines Wesens skaliert mit der Stufe seines eigenen Felds; wer Licht trägt, macht sein Feld hell und wird weit gesehen
+ Wiederholbar: die Abfrage liest nur den Zustand und rechnet ganzzahlig; die Summe hängt nicht von der Reihenfolge der Quellen ab
+ Anzeige: Lichtkarte über der Karte nach den Stufen, getönt nach den Farben der Quellen (siehe [Anzeige.md](Anzeige.md), Anzeige)

## Duft

Vorbild Brogue (Duft auf dem Sichtfeld, ein globaler Zähler statt Abklingen je Feld, Jäger gehen zum stärksten Duft daneben).

Daten:

+ `zustand.duftZaehler` (über den ganzen Lauf) und `ebene.duft`: je Feld eine ganze Zahl, angelegt beim ersten Zug auf der Ebene, 0 heißt nie Duft; verlassene Ebenen tragen ihren Duft mit
+ Regelwerte `regeln.duft`: `jeZug` 3, `reichweite` 8, `haltbarkeitZuege` 20

Schnittstellen (`src/systeme/duft.js`):

+ `duftLegen(spiel)` am Haken `zug_ende` der gesteuerten Entität, also auch bei jedem Schritt einer langen Aktion; `duftAuf`, `duftFrisch`, `duftabstand`, `duftfeld(spiel, wesen, meiden?)`
+ `duftfolgebefehl` in `src/ki/verfolgen.js` (siehe [Wesen.md](Wesen.md), KI)

Regeln:

+ Nach jedem Zug der gesteuerten Entität steigt der Zähler um `jeZug`; jedes Feld in ihrer Sichtlinie bis `reichweite` (Schattenwurf nur nach dem Gelände, ohne Licht und Rauch) bekommt den Zähler minus den Duftabstand (die längere Achse doppelt, die kürzere einfach: gerade 2, schräg 3), wenn das mehr ist als sein bisheriger Duft
+ Frisch ist Duft, der höchstens `haltbarkeitZuege * jeZug` unter dem Zähler liegt
+ Jedes Feld ihres Weges hat einen Nachbarn mit mindestens `jeZug` mehr Duft (ihren nächsten Schritt), darum führt der Duft bis zu ihr; Teleport und Ebenenwechsel reißen die Spur ab
+ Folgen: ein jagendes Wesen ohne Vorrang, das keine Beute wahrnimmt, mit `ki.duftFolgen` (Vorgabe true), für das die gesteuerte Entität ein Ziel ist und das innerhalb ihrer Spurweite steht (siehe [Wesen.md](Wesen.md), Wahrnehmung), geht auf das Nachbarfeld mit dem stärksten frischen Duft, der stärker ist als auf seinem eigenen, das es betreten kann und das weder gefährlich noch eine Falle ist (bei Gleichstand in fester Richtungsfolge); steht dort ein Ziel, greift es an, ein anderes Wesen versperrt den Duft; das Feld wird seine letzte bekannte Position, so wird es dort wach, wenn die Spur endet
+ Wiederholbar: nur ganze Zahlen im Zustand, kein Zufall

## Gefahrenprüfung

Schnittstellen (`src/systeme/gefahr.js`, reine Lesefunktionen, verändern nichts und benutzen keinen Zufall):

+ `lageErfassen`: eine Lage ist ein Schnappschuss (wahrgenommene Feinde, LP); `wahrgenommeneFeinde` (gesehen oder gespürt, siehe [Wesen.md](Wesen.md), Wahrnehmung); `gefahrPruefen` vergleicht zwei Lagen
+ Register `gefahren` (`(vorher, nachher) => true` bei neuer Gefahr): `gegner_in_sicht`, `schaden`

Regeln:

+ Reise, Laufen, Rasten und Erkunden nutzen die Prüfungen mit den Listen aus den Einstellungen (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden), lange Aktionen mit der Liste aus den Regeln (siehe [Wirkungen.md](Wirkungen.md), Lange Aktionen)

## Tests

+ `tests/gelaende.test.js` (Türen, Benutzen, Fallen, Entdecken), `tests/schichten.test.js` (Oberfläche, Gas, Feuer), `tests/licht.test.js` (Quellen, Stufen, Sehen im Dunkeln, Heimlichkeit, dunkler Keller), `tests/duft.test.js` (Legen, Abstand, Folgen um die Ecke, Haltbarkeit, Spurweite), `tests/ebenen.test.js` (Plan des Laufs, Erzeugung in Schritten samt Vergleich mit den Ebenen vor dem Umbau, Erreichbarkeit, Treppen, Ruhen, Population), `tests/wege.test.js`, `tests/gefahr.test.js`, `tests/geometrie.test.js`

## Verweise

+ Spieldesign der Welt und des Hubs: [Grundlagen.md](Grundlagen.md); Darstellung von Karte und Schichten: [Anzeige.md](Anzeige.md); Tiles: [Tileset.md](Tileset.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 8 (Licht schalten, Sturz in den Abgrund, Suchen nach Fallen), Punkt 14 (Nachholen verlassener Ebenen, Dienste des Hubs, Ebenenarten); Themenräume, Schatzräume, Quests und feste Strukturen als Ideen in [Ausblick.md](Ausblick.md), sie bauen auf den Plan des Laufs und die Schritte

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
