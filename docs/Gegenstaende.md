# Battle Ninkasi - Gegenstände

Stand: 2026-11-22

Zuständig für: `src/systeme/inventar.js`, `src/systeme/ausruestung.js`, `src/systeme/verschleiss.js`, `src/systeme/kennen.js`, `daten/ausruestung.js`, `daten/getraenke.js`, `daten/etiketten.js`

Mitprüfen bei Änderungen: [Wirkungen.md](Wirkungen.md), [Bedienung.md](Bedienung.md), [Grundlagen.md](Grundlagen.md)

## Zweck

Gegenstände: Inventar mit Stapeln, Ladungen, Behältern und Last, Ausrüstung mit Plätzen, Waffen und Flüchen, Verschleiß durch Verderben und Haltbarkeit, Unbekanntes mit Etiketten. Die Bedienung des Inventarfensters steht in [Bedienung.md](Bedienung.md), Fenster. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Inventar

Vorbilder: NetHack (Last in Stufen, jede bremst mehr), Brogue und DCSS (Stapel gleicher Gegenstände).

Daten:

+ Am Gegenstand: `stapelbar: true`, `ladungen: { hoechstens, gewichtJe? }` (Stand in `ladungen.aktuell`, Vorgabe `hoechstens`), `wirdZu: Typ` (Behälter nach dem letzten Gebrauch), `gewicht` in Gramm; an der Entität `anzahl` (Vorgabe 1) und `getragenVon`
+ Am Wesen: `inventar: [IDs]`, `tragkraft` (sonst `regeln.tragen.tragkraft`, 20000 g)
+ Ausstattung in den Daten eines Wesens: `ausstattung: [{ typ, anzahl? }]` (Vorgabe `anzahl` 1), keine Komponente; beim Erzeugen aus Daten liegt sie im Gepäck
+ Zweck für die KI: `zweck: [name]` an `trinkbar` (und an `wurf`, siehe [Wesen.md](Wesen.md), KI)
+ Regelwert `regeln.tragen.stufen`: ab 100 % der Tragkraft kostet Bewegen 25 % mehr, ab 150 % 100 % mehr
+ Getränke in `daten/getraenke.js`, Wurfgegenstände in `daten/wurfgegenstaende.js`

Schnittstellen (`src/systeme/inventar.js`):

+ Befehle `aufheben`, `trinken { gegenstandId }`, `fallenlassen { gegenstandId }` (der ganze Stapel aufs eigene Feld, Angelegtes wird dabei abgelegt, Meldung `fallengelassen`, Zeitkosten `aktionen.fallenlassen`)
+ `insInventar` (fließt in einen gleichen Stapel), `einenAbnehmen` (spaltet einen ab), `anzahlVon`, `ladungenVon`, `einzelgewicht`, `lastVon`, `tragkraftVon`, `lastZuschlag` (wirkt in `zeitkosten`, siehe [Architektur.md](Architektur.md), Befehle), `erstesGetraenk`, `verderbenEinplanen`
+ `ausDemInventarNehmen` in `src/kern/zustand.js` nimmt einen Gegenstand aus Inventar und Ausrüstung
+ Handler `ausstattung` im Register `ausDaten` (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten); Nutzung `trinken` im Register `nutzungen` (siehe [Wesen.md](Wesen.md), KI)

Regeln:

+ Beim Aufheben fließt ein Gegenstand in einen Stapel, der in allen übrigen Komponenten gleich ist, so stapeln sich z.B. Sauerbier und Bier nicht; nur der Zeitpunkt des Verderbens zählt nicht, er wird gemittelt (siehe Verschleiß); auf dem Boden fließt nichts zusammen
+ Trinken, Werfen und Material für Fähigkeiten nehmen ein Stück, Fallenlassen den ganzen Stapel; Trinken nimmt bei Ladungen eine Ladung; ein Gegenstand mit Ladungen stapelt sich nicht
+ Ausstattung geht über `insInventar`, stapelbare fließen also zu einem Stapel zusammen; ein Wesen lässt sie beim Tod fallen wie alles im Gepäck (siehe [Wirkungen.md](Wirkungen.md), Tod und Zustandsprüfung)
+ Nach dem letzten Gebrauch kommt `wirdZu` ins Gepäck (Bier zu leerer Flasche, Bierfass zu Fass), Grundlage für das Brauen
+ Gewicht mit Ladungen zuzüglich `gewichtJe` je Ladung; die Last ist die Summe über das Gepäck, Angelegtes eingeschlossen
+ Tragkraft mit Modifikatoren auf `tragkraft` (Skills folgen); verboten ist nichts, Überladung verteuert nur das Bewegen, nach allen Modifikatoren
+ Anzeige: das Inventarfenster zeigt Stapel (x 3), Ladungen (19/20), Angelegtes und die Last (Last 3,2 / 20 kg, rot "überladen"), die Seitenleiste nur die Last
+ Im Spielinhalt (Zahlen vorläufig): Bier 900 g, stapelbar, wird zur leeren Flasche (400 g, stapelbar) und verdirbt zu Sauerbier; Bierfass mit 20 Schlucken zu einer Halben, 2 kg Holz und 500 g je Schluck, voll 12 kg, wird zum Fass; Brandflasche 900 g, stapelbar; Bier und Bierfass dienen dem Zweck `heilen`, die Brandflasche `angriff`; der Fernkämpfer-Test trägt ein Bier; Ausrüstung von 20 g (Kupferring) bis 6 kg (Fasshammer)

## Ausrüstung

Vorbilder: Brogue (wenige Plätze), DCSS (Tauschen in einem Befehl), NetHack (Flüche, unbekannt bis zum Anlegen), Caves of Qud (Ereignisse laufen auch durch die Ausrüstung der Trägerin).

Daten:

+ Plätze am Wesen: `plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 }` (Ninkasi); die Namen stehen in `regeln.ausruestung.plaetze`
+ Gegenstand (`daten/ausruestung.js`): `ausruestung: { platz, belegt?, angriffe?, modifikatoren?, ausloeser?, anforderung?, abzugJePunkt? }` und `tags`; `belegt` (Vorgabe 1) zählt die Stellen, ein Zweihänder belegt beide Hände; Anforderungen siehe [Wesen.md](Wesen.md), Skills und Lernen
+ `verflucht: true` am Gegenstand, `fluchBekannt` nach dem Anlegen
+ Angelegt ist, was in `ausgeruestet: [IDs]` am Wesen steht; der Gegenstand bleibt im Inventar

Schnittstellen (`src/systeme/ausruestung.js`):

+ Befehle `anlegen { gegenstandId }` und `ablegen { gegenstandId }`; Ablehnungen `nicht_im_gepaeck`, `nicht_anlegbar`, `schon_angelegt`, `kein_platz`, `nicht_angelegt`, `verflucht`; Meldungen `angelegt`, `abgelegt`, `fluch_entdeckt`, `fluch_aufgehoben`
+ `ausgeruestete`, `istAngelegt`, `zuTauschen` (Plätze aus `plaetzeVon`, siehe [Architektur.md](Architektur.md), Entitäten und Komponenten), `fluchHindert`, `waffenprofile` (für `angriffeVon` in `src/systeme/kampf.js`), `haltbarkeitProzent`
+ Modifikatorquelle `ausruestung` (Quelle `ausruestung:<id>`); Auslöser der Ausrüstung in der Kaskade (siehe [Wirkungen.md](Wirkungen.md), Auslöser); Baustein `fluch_aufheben`
+ Haken `gegenstand_benutzt` mit `gegenstandId` und `art` (`trinken`, `werfen`, `anlegen`, `ablegen`)

Regeln:

+ Waffen in den Händen, Rüstung und Schmuck an Kopf, Brust, Beinen, Hals und zwei Fingern
+ Ist der Platz voll, legt derselbe Befehl `anlegen` die ältesten Gegenstände dort ab, bis genug frei ist, und kostet beides (`aktionen.anlegen` plus je `aktionen.ablegen`)
+ Angelegte Gegenstände stapeln sich nicht und sind kein Material; beim Tod fällt alles mit dem Inventar zu Boden
+ Modifikatoren wirken z.B. als Rüstung und als Abzug aufs Ausweichen bei schwerer Rüstung; Sets über die Bedingung `traegt_tag { tag, anzahl }` an einem gewöhnlichen Modifikator
+ Waffen: angelegte Gegenstände mit `angriffe` ersetzen die eigenen Profile des Wesens (die Faust), zwei Waffen sind zwei Profile, die Aktion kostet so viel wie das langsamste
+ Auslöser an der Ausrüstung gelten für die Trägerin, nach ihren eigenen und denen ihrer Zustände
+ Fluch: angelegt lässt sich ein verfluchter Gegenstand weder ablegen noch fallen lassen, werfen oder beim Anlegen eines anderen wegtauschen; bekannt wird der Fluch erst beim Anlegen (im Gepäck dann "verflucht"); beim Tod fällt er mit allem anderen; `fluch_aufheben` nimmt die Flüche aller angelegten Gegenstände des Ziels, einen Gegenstand dafür gibt es noch nicht
+ Angefressene Ausrüstung wirkt schwächer: die Vorteile ihrer Modifikatoren (`plus` und `prozent` über 0, `mal` über 100) sinken im Verhältnis der Haltbarkeit (`haltbarkeitProzent`, skaliert wie bei den Zuständen), Nachteile bleiben voll; eine zerfressene Platte schützt kaum noch und bleibt doch schwer
+ Im Spielinhalt (Zahlen vorläufig): Schöpfkelle (Hand, flink), Fasshammer (beide Hände, langsam, Ausweichen -5), Lederschürze (Brust, Rüstung 2, Ausweichen -5), Kupferhelm (Kopf), Lederhose (Beine), Hopfenkette (Hals, LP-Regeneration +20 %), zwei Kupferringe (Finger); Kupferhelm und Kupferringe bilden ein Set (Willenskraft); Lederschürze und Lederhose (Haltbarkeit 20, werden zu Lederfetzen) und Kupferhelm (30, wird zu Kupferschrott) nutzen sich unter Säure ab

## Verschleiß

Vorbilder: NetHack (Säure frisst in Stufen, angefressen schützt weniger), Brogue (Säure greift Rüstung an).

Daten:

+ Verderben: `verdirbt: { nach, wird }` am Gegenstand; an der Entität `verdirbtUm`
+ Haltbarkeit: `haltbarkeit: { hoechstens, wirdZu }` an Ausrüstung (beides Pflicht, nicht stapelbar), der Stand in `haltbarkeit.aktuell` (Vorgabe `hoechstens`)

Schnittstellen (`src/systeme/verschleiss.js`):

+ Zeitereignis `verderben`, gebunden an den Gegenstand, eingeplant über das Register `beimErzeugen` (`verderbenEinplanen` in `src/systeme/inventar.js`); `gegenstandErsetzen` macht den Gegenstand zum neuen Typ; Meldung `verdorben`
+ Baustein `abnutzen { platz?, wuerfel | menge }`: trifft einen angelegten Gegenstand des Ziels mit Haltbarkeit, mit `platz` nur dort, sonst zufällig einen davon; Meldung `abgenutzt`; `haltbarkeitVon`
+ Zustandsprüfung `kaputt` (Register `zustandspruefungen`, nach Tod und Lage, siehe [Wirkungen.md](Wirkungen.md), Tod und Zustandsprüfung); Meldung `kaputt`

Regeln:

+ Zur Zeit `verdirbtUm` wird der Gegenstand zum Typ `wird`, am selben Ort oder im selben Gepäck, mit derselben Anzahl
+ Stapel: fließen zwei zusammen, gilt der nach Anzahl gewichtete Durchschnitt beider Zeitpunkte, abgerundet; die Restzeit aller Stücke bleibt so in Summe gleich, dafür verdirbt der Stapel auf einmal; ein abgespaltenes Stück behält den Zeitpunkt und bekommt sein eigenes Zeitereignis; die Datenprüfung verlangt, dass ein stapelbarer Gegenstand zu einem stapelbaren verdirbt
+ Auf verlassenen Ebenen ruht das Verderben mit (`verdirbtUm` rückt wie die Zeitereignisse nach), was Ninkasi trägt, verdirbt weiter
+ Abgenutzt wird nur über den Baustein `abnutzen`, nicht durch Gebrauch (Zuschlagen, Getroffenwerden)
+ Bei 0 ist der Gegenstand kaputt: er wird zu `wirdZu`, abgelegt und ins Gepäck der Trägerin; er verschwindet also nie ganz
+ Anzeige im Gepäck: unter 75 % "angefressen", unter 50 % "stark angefressen", unter 25 % "zerfressen", jeweils mit dem Prozentwert
+ Im Spielinhalt (Zahlen vorläufig): Bier verdirbt nach 50000 Zeiteinheiten (500 Weltticks) zu Sauerbier (LP +5, Pegel +0,3 ‰ statt +20 und +0,5 ‰); das Bierfass verdirbt nicht; Biss der Essigbakterien und Säurespritzer nutzen 1 ab, Säureschwall und Säuredüse 2

## Unbekanntes

Vorbild Brogue: je Lauf zufällig zugeordnete Etiketten, erkannt wird immer die ganze Art, das Wissen gilt für den Lauf.

Daten:

+ Am Typ: `unbekannt: { gruppe, schwierigkeit }`; Etiketten je Gruppe in `daten/etiketten.js` (Textschlüssel mit Hauptwort, je Gruppe mindestens so viele wie Typen)
+ Wissen im Zustand: `wissen: { etiketten: { typ: etikett }, erkannt: [typ], vertrautheit: { typ: Zahl } }`; am Gegenstand eines noch nicht erkannten Typs `etikett`
+ `kennerschaft` ist ein Kampfwert (Vorgabe 0, Modifikatoren mit gleichnamigem Ziel, siehe [Wesen.md](Wesen.md), Kampfwerte)

Schnittstellen (`src/systeme/kennen.js`):

+ `etikettenZuordnen` beim Spielstart, vor der ersten Ebene, mit dem abgeleiteten Zufall `"etiketten"`; `istUnbekannt`, `erkennen` (Meldung `erkannt`), `beimAufhebenErkennen`, `erkennenChance`
+ Etikett beim Erzeugen über das Register `beimErzeugen`; Bezüge in Meldungen tragen das Etikett mit (siehe [Architektur.md](Architektur.md), Ereignisse)

Regeln:

+ Nur Ninkasi erkennt; Gegner verraten nichts
+ Beim Erkennen verlieren alle Gegenstände dieses Typs ihr Etikett, auch auf verlassenen Ebenen
+ Trinken erkennt sofort, die Wirkung spürt man
+ Benutzen erhöht die Vertrautheit der Art: je Welttick, in dem Rüstung oder Schmuck angelegt ist, und je Angriff mit einem Profil einer Waffe (Haken `vor_angriff`); mit jeder Erhöhung ein Wurf `(vertrautheit + kennerschaft) / (vertrautheit + kennerschaft + schwierigkeit)`, dieselbe Form wie die Kampfwerte, die Chance nähert sich mit der Zeit 100 %; Schwierigkeit 0 erkennt beim ersten Mal
+ Aufheben: ein Wurf `kennerschaft / (kennerschaft + schwierigkeit)`, ohne Kennerschaft keiner
+ Später hebt ein Skill mit Sinnlichkeit und Braukunde die Kennerschaft ([Charakter.md](Charakter.md))
+ Fluch und Art sind getrennt: der Fluch zeigt sich beim Anlegen, die Art erst durch Vertrautheit
+ Im Spielinhalt noch ohne unbekannte Gegenstände; die Gruppe `biere` (Tonkrug, Steinkrug, Bügelflasche, Henkelflasche, Bocksbeutel) wartet auf die Biersorten

## Tests

+ `tests/inventar.test.js` (Stapel, Ladungen, Behälter, Last), `tests/nutzen.test.js` (Ausstattung, Zwecke), `tests/ausruestung.test.js` (Plätze, Tauschen, Waffen, Sets, Flüche), `tests/verschleiss.test.js` (Verderben, Haltbarkeit, kaputt), `tests/kennen.test.js` (Etiketten, Vertrautheit, Erkennen)

## Verweise

+ Spieldesign der Getränke, Biersorten und des Brauens: [Grundlagen.md](Grundlagen.md); Inventarfenster: [Bedienung.md](Bedienung.md), Fenster
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 9

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
