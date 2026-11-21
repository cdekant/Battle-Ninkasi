# Battle Ninkasi - Gegenstände

Stand: 2026-11-21

Zuständig für: `src/systeme/inventar.js`, `src/systeme/ausruestung.js`, `src/systeme/verschleiss.js`, `src/systeme/kennen.js`, `daten/ausruestung.js`, `daten/getraenke.js`, `daten/etiketten.js`

Mitprüfen bei Änderungen: [Wirkungen.md](Wirkungen.md), [Bedienung.md](Bedienung.md), [Grundlagen.md](Grundlagen.md)

Gegenstände: Inventar, Ausrüstung, Verschleiß und Unbekanntes.

## Inventar

+ Vorbilder: NetHack (Last in Stufen, jede bremst mehr), Brogue und DCSS (Stapel gleicher Gegenstände)
+ Code in `src/systeme/inventar.js`: Befehle `aufheben`, `trinken`, `fallenlassen { gegenstandId }` (der ganze Stapel aufs eigene Feld, Angelegtes wird dabei abgelegt, Meldung `fallengelassen`, Zeitkosten `aktionen.fallenlassen`)
+ Stapel: `stapelbar: true` am Gegenstand, `anzahl` an der Entität (Vorgabe 1); beim Aufheben fließt ein Gegenstand in einen Stapel, der in allen übrigen Komponenten gleich ist (`insInventar`), so stapeln sich z.B. Sauerbier und Bier nicht; nur der Zeitpunkt des Verderbens zählt nicht, er wird gemittelt (siehe Verschleiß); Trinken, Werfen und Material für Fähigkeiten nehmen einen (`einenAbnehmen` spaltet dafür einen ab), Fallenlassen den ganzen Stapel; auf dem Boden fließt nichts zusammen
+ Ladungen: `ladungen: { hoechstens, gewichtJe? }`, der Stand in `ladungen.aktuell` (Vorgabe `hoechstens`); Trinken nimmt eine Ladung; ein Gegenstand mit Ladungen stapelt sich nicht
+ Behälter: `wirdZu: Typ` kommt nach dem letzten Gebrauch ins Gepäck (Bier zu leerer Flasche, Bierfass zu Fass), Grundlage für das Brauen
+ Gewicht `gewicht` in Gramm, mit Ladungen zuzüglich `gewichtJe` je Ladung; die Last ist die Summe über das Gepäck, Angelegtes eingeschlossen (`lastVon`)
+ Tragkraft `tragkraft` am Wesen, sonst `regeln.tragen.tragkraft` (20 kg), mit Modifikatoren auf `tragkraft` (Skills folgen mit dem Skillsystem); Überladung nach `regeln.tragen.stufen` (ab 100 % Bewegen +25 %, ab 150 % +100 %), verboten ist nichts; der Zuschlag wirkt in `zeitkosten` (`src/kern/spiel.js`) nur aufs Bewegen und nach allen Modifikatoren
+ Anzeige: das Inventarfenster zeigt Stapel (x 3), Ladungen (19/20), Angelegtes und die Last (Last 3,2 / 20 kg, rot "überladen"), die Seitenleiste nur die Last; im Inventarfenster F fallen lassen
+ Im Spielinhalt (Zahlen vorläufig): Bier 900 g, stapelbar, wird zur leeren Flasche (400 g, stapelbar) und verdirbt zu Sauerbier; Bierfass mit 20 Schlucken zu einer Halben, 2 kg Holz und 500 g je Schluck, voll 12 kg, wird zum Fass; Brandflasche 900 g, stapelbar; Ausrüstung von 20 g (Kupferring) bis 6 kg (Fasshammer)

## Ausrüstung

+ Vorbilder: Brogue (wenige Plätze), DCSS (Tauschen in einem Befehl), NetHack (Flüche, unbekannt bis zum Anlegen), Caves of Qud (Ereignisse laufen auch durch die Ausrüstung der Trägerin)
+ Plätze am Wesen: `plaetze: { hand: 2, kopf: 1, brust: 1, beine: 1, hals: 1, finger: 2 }` (Ninkasi); die Namen stehen in `regeln.ausruestung.plaetze`; Waffen in den Händen, Rüstung und Schmuck an Kopf, Brust, Beinen, Hals und zwei Fingern
+ Gegenstand: `ausruestung: { platz, belegt?, angriffe?, modifikatoren?, ausloeser?, anforderung?, abzugJePunkt? }` und `tags` am Gegenstand (Anforderungen siehe [Wesen.md](Wesen.md), Skills und Lernen); `belegt` (Vorgabe 1) zählt die Stellen, ein Zweihänder belegt beide Hände (`src/systeme/ausruestung.js`)
+ Angelegt ist, was in `ausgeruestet: [IDs]` steht; der Gegenstand bleibt im Inventar; `ausDemInventarNehmen` (`src/kern/zustand.js`) nimmt ihn aus beidem (Trinken, Werfen, Fallenlassen, Entfernen), beim Tod fällt alles mit dem Inventar zu Boden; angelegte Gegenstände stapeln sich nicht und sind kein Material
+ Befehle `anlegen { gegenstandId }` und `ablegen { gegenstandId }`; ist der Platz voll, legt derselbe Befehl die ältesten Gegenstände dort ab, bis genug frei ist, und kostet beides (`aktionen.anlegen` plus je `aktionen.ablegen`); Ablehnungen `nicht_im_gepaeck`, `nicht_anlegbar`, `schon_angelegt`, `kein_platz`, `nicht_angelegt`, `verflucht`; Meldungen `angelegt`, `abgelegt`
+ Modifikatoren angelegter Gegenstände wirken über die Modifikatorquelle `ausruestung` (Quelle `ausruestung:<id>`), z.B. Rüstung und der Abzug aufs Ausweichen bei schwerer Rüstung; Sets über die Bedingung `traegt_tag { tag, anzahl }` an einem gewöhnlichen Modifikator
+ Waffen: angelegte Gegenstände mit `angriffe` ersetzen die eigenen Profile des Wesens (die Faust), zwei Waffen sind zwei Profile, die Aktion kostet so viel wie das langsamste (`angriffeVon` in `src/systeme/kampf.js`)
+ Auslöser an der Ausrüstung gelten für die Trägerin, nach ihren eigenen und denen ihrer Zustände (siehe [Wirkungen.md](Wirkungen.md), Auslöser)
+ Fluch: `verflucht: true` am Gegenstand; angelegt lässt er sich weder ablegen noch fallen lassen, werfen oder beim Anlegen eines anderen wegtauschen (Ablehnung `verflucht`); bekannt wird der Fluch erst beim Anlegen (`fluchBekannt`, Meldung `fluch_entdeckt`, im Gepäck "verflucht"); beim Tod fällt er mit allem anderen; der Baustein `fluch_aufheben` nimmt die Flüche aller angelegten Gegenstände des Ziels (Meldung `fluch_aufgehoben`), einen Gegenstand dafür gibt es noch nicht
+ Angefressene Ausrüstung wirkt schwächer (siehe Verschleiß): die Vorteile ihrer Modifikatoren (`plus` und `prozent` über 0, `mal` über 100) sinken im Verhältnis der Haltbarkeit (`haltbarkeitProzent`, skaliert wie bei den Zuständen), Nachteile bleiben voll; eine zerfressene Platte schützt kaum noch und bleibt doch schwer
+ Haken `gegenstand_benutzt` mit `gegenstandId` und `art` (`trinken`, `werfen`, `anlegen`, `ablegen`)
+ Inventarfenster über der Karte (`src/eingabe/inventar.js`, Fensterart `inventar`, reine Tastenlogik, Zustand nur in der Anzeige): I öffnet, A bis Z wählt, dann T trinken, A anlegen oder ablegen, W werfen (weiter im Zielmodus), F fallen lassen, Esc zurück oder zu; Angelegtes ist im Gepäck markiert
+ Im Spielinhalt (Zahlen vorläufig, `daten/ausruestung.js`): Schöpfkelle (Hand, flink), Fasshammer (beide Hände, langsam, Ausweichen -5), Lederschürze (Brust, Rüstung 2, Ausweichen -5), Kupferhelm (Kopf), Lederhose (Beine), Hopfenkette (Hals, LP-Regeneration +20 %), zwei Kupferringe (Finger); Kupferhelm und Kupferringe bilden ein Set (Willenskraft); Lederschürze und Lederhose (Haltbarkeit 20, werden zu Lederfetzen) und Kupferhelm (30, wird zu Kupferschrott) nutzen sich unter Säure ab

## Verschleiß

+ Code in `src/systeme/verschleiss.js`; Vorbilder NetHack (Säure frisst in Stufen, angefressen schützt weniger) und Brogue (Säure greift Rüstung an)
+ Verderben: `verdirbt: { nach, wird }` am Gegenstand; beim Erzeugen bekommt er den Zeitpunkt `verdirbtUm` und ein gebundenes Zeitereignis `verderben` (`verderbenEinplanen` in `src/systeme/inventar.js`); zur Zeit wird er zum Typ `wird`, am selben Ort oder im selben Gepäck, mit derselben Anzahl (`gegenstandErsetzen`, Meldung `verdorben`)
+ Stapel: fließen zwei zusammen, gilt der nach Anzahl gewichtete Durchschnitt beider Zeitpunkte, abgerundet; die Restzeit aller Stücke bleibt so in Summe gleich, dafür verdirbt der Stapel auf einmal; ein abgespaltenes Stück behält den Zeitpunkt und bekommt sein eigenes Zeitereignis; die Datenprüfung verlangt, dass ein stapelbarer Gegenstand zu einem stapelbaren verdirbt
+ Auf verlassenen Ebenen ruht das Verderben mit (`verdirbtUm` rückt wie die Zeitereignisse nach), was Ninkasi trägt, verdirbt weiter
+ Haltbarkeit: `haltbarkeit: { hoechstens, wirdZu }` an Ausrüstung (beides Pflicht, nicht stapelbar), der Stand in `haltbarkeit.aktuell` (Vorgabe `hoechstens`)
+ Abgenutzt wird nur über den Baustein `abnutzen { platz?, wuerfel | menge }`, nicht durch Gebrauch (Zuschlagen, Getroffenwerden): er trifft einen angelegten Gegenstand des Ziels mit Haltbarkeit, mit `platz` nur dort, sonst zufällig einen davon (Meldung `abgenutzt`)
+ Bei 0 ist der Gegenstand kaputt: die Zustandsprüfung `kaputt` nach Tod und Lage macht ihn zu `wirdZu`, abgelegt und ins Gepäck der Trägerin (Meldung `kaputt`); er verschwindet also nie ganz
+ Anzeige im Gepäck: unter 75 % "angefressen", unter 50 % "stark angefressen", unter 25 % "zerfressen", jeweils mit dem Prozentwert
+ Im Spielinhalt (Zahlen vorläufig): Bier verdirbt nach 50000 Zeiteinheiten (500 Weltticks) zu Sauerbier (LP +5, Pegel +0,3 ‰ statt +20 und +0,5 ‰); das Bierfass verdirbt nicht; Biss der Essigbakterien und Säurespritzer nutzen 1 ab, Säureschwall und Säuredüse 2

## Unbekanntes

+ Code in `src/systeme/kennen.js`; Vorbild Brogue: je Lauf zufällig zugeordnete Etiketten, erkannt wird immer die ganze Art, das Wissen gilt für den Lauf
+ Am Typ: `unbekannt: { gruppe, schwierigkeit }`; Etiketten je Gruppe in `daten/etiketten.js` (Textschlüssel mit Hauptwort, je Gruppe mindestens so viele wie Typen)
+ Beim Spielstart, vor der ersten Ebene, ordnet `etikettenZuordnen` jedem unbekannten Typ ein Etikett seiner Gruppe zu, mit dem abgeleiteten Zufall `"etiketten"`; das Wissen steht im Zustand: `wissen: { etiketten: { typ: etikett }, erkannt: [typ], vertrautheit: { typ: Zahl } }`
+ Ein Gegenstand eines noch nicht erkannten Typs bekommt beim Erzeugen `etikett`; Bezüge und Anzeige nennen dann das Etikett (siehe [Architektur.md](Architektur.md), Ereignisse); beim Erkennen verlieren alle Gegenstände dieses Typs ihr Etikett, auch auf verlassenen Ebenen (Meldung `erkannt`)
+ Nur Ninkasi erkennt; Gegner verraten nichts
+ Trinken erkennt sofort, die Wirkung spürt man
+ Benutzen erhöht die Vertrautheit der Art: je Welttick, in dem Rüstung oder Schmuck angelegt ist, und je Angriff mit einem Profil einer Waffe (Haken `vor_angriff`); mit jeder Erhöhung ein Wurf `(vertrautheit + kennerschaft) / (vertrautheit + kennerschaft + schwierigkeit)`, dieselbe Form wie die Kampfwerte, die Chance nähert sich mit der Zeit 100 %; Schwierigkeit 0 erkennt beim ersten Mal
+ Aufheben: ein Wurf `kennerschaft / (kennerschaft + schwierigkeit)`, ohne Kennerschaft keiner
+ `kennerschaft` ist ein Kampfwert (Vorgabe 0, Modifikatoren mit gleichnamigem Ziel); später hebt ihn ein Skill mit Sinnlichkeit und Braukunde ([Charakter.md](Charakter.md))
+ Fluch und Art sind getrennt: der Fluch zeigt sich beim Anlegen (siehe Ausrüstung), die Art erst durch Vertrautheit
+ Im Spielinhalt noch ohne unbekannte Gegenstände; die Gruppe `biere` (Tonkrug, Steinkrug, Bügelflasche, Henkelflasche, Bocksbeutel) wartet auf die Biersorten

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
