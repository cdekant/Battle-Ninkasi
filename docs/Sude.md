# Battle Ninkasi - Sude

Stand: 2026-11-26

Zuständig für: `src/systeme/sud.js`, `src/systeme/brauen.js`, `src/systeme/kulturen.js`, `src/systeme/absud.js`, `src/systeme/rezepte.js`, `src/systeme/reifen.js`, `src/systeme/flora.js`, `daten/sude.js`

Mitprüfen bei Änderungen: [Brauen.md](Brauen.md), [Gegenstaende.md](Gegenstaende.md), [Bedienung.md](Bedienung.md), [Wesen.md](Wesen.md), [Architektur.md](Architektur.md), [Welt.md](Welt.md)

## Zweck

Das Brausystem in der Logik: wie aus Zutaten, Verfahren und Kultur das Profil eines Suds wird, wann er ein Zielgebiet trifft, wie der Befehl am Kessel abläuft, was das Getränk beim Trinken wirkt, wie es im Gepäck reift und verdirbt, wie die wilde Flora spontan gärt, wie Ninkasi Kulturen und ihre Formen gewinnt, wie Nebel und Rezeptbuch das Wissen Ninkasis halten und wie ein Sud ohne Kultur zum Absud wird. Das Spieldesign steht in [Brauen.md](Brauen.md), das Fenster zum Brauen in [Bedienung.md](Bedienung.md), Fenster. Jeder Abschnitt nennt Daten, Schnittstellen und Regeln.

## Profil

Daten:

+ Achsen in `regeln.brauen.achsen`, ihre Reihenfolge ist fest: die Kennzahlen `stammwuerze` und `alkohol` in Zehnteln (°Plato bzw. Vol.-%), `bittere` in IBU und `farbe` in EBC wie in `daten/bierstile.js`, dazu die Aromen (`malz`, `roest`, `frucht`, `kraeuter`, `saeure`, `suesse`) als Anteile bis 100; je Achse `{ hoechstens, stufe, unschaerfe }`: `hoechstens` begrenzt die Achse und ist der Maßstab der Anzeige, `stufe` rundet das fertige Profil, `unschaerfe` ist die halbe Breite der Vorschau
+ Zutat am Gegenstand: `zutat: { art: "grundstoff" | "gewuerz", extrakt?, farbe?, bitter?, aromen? }`; `extrakt`, `farbe` und `bitter` gelten für ein Stück auf eine Portion, `aromen` sind Anteile bis 100
+ Verfahren: `regeln.brauen.maische` (je Art `{ vergaerung, aromen? }`, Punkte der Vergärung und Zuschläge auf Aromen), `regeln.brauen.gewuerz` (je Gabe `{ bitter, aroma }` in Prozent der Beiträge eines Gewürzes), Vorgabe `regeln.brauen.verfahren`
+ Gärung: `regeln.brauen.alkoholJeStammwuerze` (Prozent der vergorenen Stammwürze, die Alkohol werden), `suesseJeRestzucker` (Punkte der Süße je Zehntel °Plato Restzucker, in Prozent)
+ Kultur in `kulturen`: `{ text, vergaerung, vertraegt, aromen?, verderben? }`; `vergaerung` in Prozent, `vertraegt` ist der höchste Alkohol in Zehnteln Vol.-%, `aromen` kommen zum Profil dazu, `verderben` sind Punkte auf die Chance des Verderbens; die Kulturen eines Wesens stehen in `kulturen: [Schlüssel]` (Proben ohne Gewicht, Schlüssel einer Form, siehe Kulturen)
+ Probe einer Kultur am Gegenstand: `kultur: name`; wer ihn aufhebt, gewinnt die Kultur (siehe Befehl)
+ Die Kultur `spontan` (`SPONTAN` in `src/systeme/sud.js`) ist keine Kultur der Daten, sondern die wilde Flora der Ebene (siehe Spontane Gärung); `kulturdatenVon(daten, kultur, flora)` gibt die Daten der einen (einer Form, siehe Kulturen) oder der anderen; eine Kultur der Daten darf nicht so heißen

Schnittstellen (`src/systeme/sud.js`, reine Rechnung ohne Zustand):

+ `profilBerechnen(daten, { zutaten: [{ typ, menge }], verfahren, kultur, portionen, vertraegt?, flora? })` gibt die Mitte des Profils, `sudRechnen` mit denselben Angaben `{ profil, gaerung }`; `vertraegt` ist der höchste Alkohol der Kultur nach Modifikatoren (Vorgabe der Wert der Kultur)
+ `gaerungBerechnen(daten, { stammwuerze, verfahren, kultur, vertraegt?, flora? })` gibt `{ vergaerung, vergoren, restzucker, alkohol }`
+ `unschaerfeBerechnen(daten, prozent)`, `bereichBerechnen(daten, mitte, unschaerfe)` (je Achse `[unten, oben]`), `profilRunden`, `gueteRunden`, `achsenVon`, `aromaachsenVon`, `KENNZAHLEN`

Regeln:

+ Stammwürze, Farbe und Bittere sind die Summe der Beiträge mal Menge, geteilt durch die Portionen: dieselben Zutaten auf halb so viele Portionen geben einen doppelt so starken Sud
+ Ein Gewürz trägt seine Bittere mit `gewuerz.<gabe>.bitter` Prozent bei und seine Aromen mit `aroma` Prozent: früh gekocht bitter, spät gegeben aromatisch
+ Gärung nach Balling, vereinfacht: die Vergärung ist die der Kultur plus die der Maische (kühl mehr, warm weniger), zwischen 0 und 100; vergärbar ist Stammwürze x Vergärung; vergoren wird davon höchstens so viel, wie für `vertraegt` der Kultur nötig ist (`vertraegt` x 100 / `alkoholJeStammwuerze`); Alkohol = vergoren x `alkoholJeStammwuerze` Prozent
+ Restzucker ist, was vergärbar wäre, aber die Kultur nicht mehr verträgt; er hebt die Süße um Restzucker x `suesseJeRestzucker` Prozent; so werden starke Sude mit einer schwachen Kultur süß; ohne Kultur gärt nichts, Alkohol und Restzucker bleiben 0 (der Befehl macht daraus einen Absud, siehe Absud)
+ Aromen sind das nach Menge gewichtete Mittel der Zutaten, dazu die Aromen der Kultur und der Maische und die Süße aus dem Restzucker; jede Achse bleibt zwischen 0 und `hoechstens`
+ Alles in ganzen Zahlen, abgerundet; gerundet wird kaufmännisch auf `stufe`

## Zielgebiete

Daten:

+ `zielgebiete`: `{ text, familie, spannen: { <achse>: [unten, oben] }, bonus?, effekt? }`; `text` ist das Hauptwort des Getränks, nicht genannte Achsen sind frei, `bonus` sind Prozent auf das Budget der Wirkung (Vorgabe 100), `effekt` wirkt beim Trinken zusätzlich
+ `regeln.brauen.gueteAmRand`, `gueteStufe`, `gueteFrei`

Schnittstellen: `imZielgebiet(profil, zielgebiet)`, `zielgebietFinden(daten, profil)` (gibt `{ name, guete }` oder null), `gueteImZielgebiet(daten, profil, zielgebiet)`, `erreichbareZielgebiete(daten, bereich, namen?)` (für die Vorschau, mit `namen` nur unter diesen)

Regeln:

+ Ein Profil trifft ein Zielgebiet, wenn jede genannte Achse in ihrer Spanne liegt, Grenzen eingeschlossen; treffen mehrere, gewinnt das engste (die kleinste Summe der Breiten in Promille ihrer Achse), bei gleicher Enge das erste der Daten
+ Güte eines Treffers: in der Mitte jeder Spanne 100, am Rand `gueteAmRand`, dazwischen linear; es zählt die schlechteste Achse; gespeichert abgerundet auf `gueteStufe`; ein Sud ohne Zielgebiet hat `gueteFrei`
+ Erreichbar ist ein aufgedecktes Zielgebiet, wenn sich der Bereich der Vorschau auf jeder genannten Achse mit seiner Spanne überschneidet (siehe Nebel und Rezepte); auf Unbekanntes weist nichts hin

## Befehl

Daten:

+ Kessel am Gelände: `kessel: { portionen, verderben?, unschaerfe? }`; `portionen` gibt der Kessel höchstens her, `verderben` sind Punkte auf die Chance, `unschaerfe` Prozent der Unschärfe (Vorgabe 100)
+ `regeln.brauen.stueckeJePortion`: so viele Stück Zutaten nimmt der Kessel je Portion höchstens
+ Gefäß am Gegenstand: `gefaess: true` (die leere Flasche)
+ `regeln.brauen.verderben` (Chance vor Kessel und Kultur), `schwach: { chance, plus }`, `verderber: { chance, wesen }` (`wesen` null: keiner; das Grundgerüst hat keine Wesen, der Probeinhalt setzt das Essigbakterium über `ergaenzen`), `regeln.brauen.getraenk` und `regeln.brauen.verdorben: { getraenk, achse, plus, guete, stufe }`, `gewichtJePortion`; Zeitkosten `aktionen.brauen`
+ Kultur mit `verderber: name`: dieses Wesen entsteht statt `regeln.brauen.verderber.wesen`

Schnittstellen (`src/systeme/brauen.js`):

+ Befehl `brauen { kessel?: { x, y }, portionen?, zutaten: [{ gegenstandId, menge }], verfahren?: { maische, gewuerz }, kultur?, absicht? }`; ohne Kultur ein Absud (siehe Absud); ohne `kessel` der erste Kessel neben oder unter der Brauerin (eigenes Feld, dann die Nachbarn zeilenweise); ohne `portionen` so viele, wie Kessel und leere Gefäße erlauben, mindestens 1
+ Ablehnungen: `im_kampf`, `kein_kessel`, `keine_zutaten`, `keine_zutat`, `zu_viel` (mehr, als der Stapel hat), `kessel_voll` (mehr Stück als Portionen x `stueckeJePortion`), `zu_viele_portionen` (mehr, als der Kessel hergibt), `kultur_unbekannt`, `keine_flora` (spontan auf einer Ebene ohne Flora), `keine_gefaesse` (weniger leere Gefäße als Portionen), `ungueltig` (Menge oder Portionen unter 1, dieselbe Zutat zweimal, unbekanntes Verfahren)
+ Meldungen: `gebraut`, `gebraut_getroffen` (mit `zielgebiet`), `gebraut_verdorben`, je mit `wer`, `was` und `anzahl`; `verderber_entsteht` mit `was` und `kessel` (dazu `beschworen` ohne `wer`)
+ `sudVorbereiten(spiel, wesen, befehl)` prüft und rechnet die Vorschau (`{ grund }` oder `{ kessel, eingabe, mitte, gaerung, unschaerfe, bereich, erreichbar, fuellung, fassen, portionen, gefaesse }`), ohne Kampf und Gefäße zu prüfen; `fassen` ist die höchste Füllung für diese Portionen, `erreichbar` nennt nur aufgedeckte Zielgebiete, `rezept` den Schlüssel des Rezepts, nach dem gebraut wird, oder null; `verderbenChance`, `sauerChance`, `kesselBei`, `zutatenIm`, `gefaesseIm`
+ Haken `aufgehoben` (siehe [Gegenstaende.md](Gegenstaende.md), Inventar): beim ersten Aufheben einer Zutatenart Wissens-EP über `src/systeme/wissen.js` (siehe [Wesen.md](Wesen.md), Skills und Lernen); Proben von Kulturen siehe Kulturen

Regeln:

+ Vorschau und Befehl rechnen dasselbe; die Unschärfe ist die der Achsen mal `unschaerfe` des Kessels, nach Rezept mal `regeln.brauen.rezeptUnschaerfe` Prozent, mit Modifikatoren auf `brauen.unschaerfe`; `vertraegt` der Kultur mit Modifikatoren auf `brauen.vertraegt`
+ Der Wurf `brauen` setzt je Achse in fester Reihenfolge den Punkt gleichverteilt im Bereich (ohne Wurf, wenn der Bereich ein Punkt ist); danach würfelt `verderben` 1 bis 100: bis zur Chance des Verderbens (`regeln.brauen.verderben` plus Kessel plus Kultur oder Flora, mit Modifikatoren auf `brauen.verderben`, zwischen 0 und 100) verdirbt der Sud, bis zu ihr plus `schwach.chance` (`sauerChance`, höchstens bis 100) steigt seine Achse `verdorben.achse` um `schwach.plus`, bevor das Zielgebiet gesucht wird, darüber gelingt er
+ Spontan gegoren ist die Unschärfe zusätzlich mal `regeln.brauen.spontan.unschaerfe` Prozent
+ Ein verdorbener Sud wird `verdorben.getraenk`, seine Achse `verdorben.achse` steigt um `plus`, er hat die Güte `verdorben.guete`, kein Zielgebiet und beginnt seine Stufen bei `verdorben.stufe`; mit `verderber.chance` entsteht über den Baustein `beschwoeren` ein Verderber auf einem freien Feld neben dem Kessel (`verderberWuerfeln` in `src/systeme/reifen.js`)
+ Zutaten und je Portion ein Gefäß sind verbraucht, in der Reihenfolge des Gepäcks
+ Jede Portion ist ein Gegenstand aus `regeln.brauen.getraenk` mit dem gerundeten Profil in `sud: { profil, zielgebiet, guete, rezept? }` (`rezept`, wenn ein gefundenes Rezept sein Zielgebiet traf), dem Text des getroffenen Zielgebiets, `wirdZu` ihres Gefäßes und dem Gewicht des Gefäßes plus `gewichtJePortion`; gleiche Portionen stapeln, weil sie in allen Komponenten gleich sind (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)
+ Ein Sud kostet `aktionen.brauen`, gebraut wird nur außerhalb des Kampfes (`imKampf`, siehe [Wesen.md](Wesen.md), Kampfzustand)

## Wirkung

Daten: `daten/sude.js` mit `sud` und `sud_verdorben` (trinkbar mit dem Effekt `sud_trinken` aus `daten/effekte.js`) und `essig` (eine Zutat mit Säure 100), `regeln.brauen.budgetProzent`, `wirkungen` (Aromaachse zu einem Wertnamen, sofort, oder zu `{ zustand, prozent }`, über die Zeit), `wirkungOhneAroma`, `pegelProzent`; der Zustand `gestaerkt` (`daten/zustaende.js`, je Welttick 1 LP über den Effekt `gestaerkt_heilen`, jeder Schluck eine eigene Instanz, höchstens 10)

Schnittstellen: `wirkungBerechnen(daten, sud)` gibt `{ mengen: { <wert>: menge }, zustaende: [{ zustand, menge }], pegel, effekte }`; Baustein `sud_wirken` (ohne Parameter) liest den Sud aus der Ablage des Effekts, `kontext.werte.sud`, die das Trinken setzt (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)

Regeln:

+ Budget = Stammwürze x `budgetProzent` x Güte x (`bonus` des Zielgebiets plus `kniff.bonus` des Rezepts in `sud.rezept`) x `wirkung` der Stufe in `sud.stufe`, abgerundet
+ Das Budget verteilt sich anteilig nach den Aromen auf die Wirkungen aus `wirkungen` (Malz heilt LP sofort, Frucht und Säure füllen MP, Kräuter PP); Aromen ohne Eintrag (Röst) wirken noch nichts; ein Sud ohne Aroma gibt alles an `wirkungOhneAroma`
+ Eine Wirkung über die Zeit: der Anteil mal `prozent` ist die Menge (Süße: 150 %); beim Trinken setzt `sud_wirken` den Zustand für genau so viele Weltticks (Dauer Menge x 100 + 1, damit auch der letzte Takt wirkt, wann immer getrunken wird)
+ Geheilt wird über den Baustein `heilen`, Zustände über `zustand_setzen`, der Pegel steigt über `wert_aendern` um Alkohol x `pegelProzent`; danach wirken der Effekt des Zielgebiets und der des Kniffs mit demselben Kontext

## Reifen und Verderben

Daten:

+ `regeln.brauen.stufen`: `[{ name, wirkung, abStammwuerze?, saeure?, adjektiv? }]` in ihrer Reihenfolge (Probe: frisch 100, reif 110 ab 16 °P, schal 80, sauer 60 mit +20 Säure); `wirkung` in Prozent des Budgets, `adjektiv` steht am Getränk
+ `regeln.brauen.essig`: der Gegenstand nach der letzten Stufe
+ `regeln.brauen.reifen: { grund, gewichte: { <achse>: gewicht }, guete, hoechstens }`
+ Am Getränk: `sud.stufe`, `verdirbt: { nach }` (Dauer jeder Stufe), `verdirbtUm` und die Komponente `adjektive` (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß)

Schnittstellen (`src/systeme/reifen.js`): `dauerDerStufen(spiel, wesen, sud)`, `stufenBeginnen(spiel, wesen, getraenk, verdorben)`, `stufeVon(daten, name)`, `verderberWuerfeln(spiel, kessel, kultur)`; Eintrag `sud` im Register `verderben`; Meldung `verdorben` mit `was` (vorher) und `wird` (nachher)

Regeln:

+ Dauer jeder Stufe = `grund` x (100 + Zuschlag) Prozent, höchstens `hoechstens` Prozent; Zuschlag = Summe über `gewichte` von Wert der Achse x Gewicht / 100, dazu Güte x `guete` / 100; Modifikatoren auf `brauen.haltbarkeit` an der Brauerin; einmal beim Brauen gerechnet
+ Ein gelungener Sud beginnt bei der ersten Stufe, ein verdorbener bei `verdorben.stufe`; zur Zeit `verdirbtUm` rückt er zur nächsten Stufe, die er erreicht (eine Stufe mit `abStammwuerze` überspringt ein schwächerer Sud), bekommt deren Säure und Adjektiv und eine neue Dauer; im Gepäck wird er neu einsortiert und fließt in einen gleichen Stapel
+ Nach der letzten Stufe wird er zu `essig`, mit derselben Anzahl
+ Stapeln, Abspalten und das Ruhen auf verlassenen Ebenen folgen dem Verderben der Gegenstände; Portionen stapeln nur in derselben Stufe

## Kulturen

Daten:

+ Quelle: ein Wesen mit `kultur: name` (eine Kultur der Daten); seine Form folgt aus seinen Merkmalen
+ Merkmal: ein Zustand mit `kulturmerkmal: [{ art, ... }]` (siehe [Wirkungen.md](Wirkungen.md), Zustände), meist als Affix der Population (siehe [Welt.md](Welt.md), Ebenen); er verändert das Wesen mit seinen Modifikatoren wie jeder Zustand und die Kultur mit seinen Änderungen, sein Adjektiv steht vor ihrem Namen
+ Änderungsarten im Register `kulturaenderungen` als `{ anwenden(kultur, aenderung), pruefen(aenderung, { aromaachsen }) }`: `plus` (`{ feld: "vergaerung" | "vertraegt" | "verderben", wert }`, `vergaerung` bleibt 0 bis 100, `vertraegt` ab 0) und `aroma` (`{ achse, wert }` auf eine Aromaachse, ab 0)
+ `regeln.brauen.rest`: der Gegenstand, den eine gestorbene Quelle hinterlässt, oder null (Grundgerüst); er bekommt beim Tod `kultur` mit ihrer Form
+ Sammlerin: ein Wesen mit `kulturen: [Schlüssel]`; Ninkasi beginnt mit `kulturen: []` (`daten/ninkasi.js`)
+ Texte der Kulturen sind Hauptwörter, damit die Adjektive der Merkmale davor stehen (siehe [Texte.md](Texte.md), Grammatik)

Schnittstellen:

+ In `src/systeme/sud.js` (reine Rechnung): `FORMTRENNER` (`~`), `formSchluessel(kultur, merkmale)`, `formTeile(schluessel)`, `kulturdatenAufloesen(daten, schluessel)`, `kulturBezug(daten, schluessel)` (`{ name, text, adjektive? }` für Meldungen und Anzeige)
+ In `src/systeme/kulturen.js`: `kulturformVon(spiel, wesen)` (Form einer Quelle oder null), `kulturGewinnen(spiel, wesen, schluessel, { still })` (true, wenn neu); Haken `zug_ende`, `nach_tod` und `aufgehoben`
+ Meldungen `kultur_gewonnen` und `kultur_bekannt` mit `wer` und `kultur` (Bezug); Wissens-EP über `kulturGebucht` in `src/systeme/wissen.js`

Regeln:

+ Schlüssel einer Form: die Kultur, dann ihre Merkmale sortiert und ohne doppelte, mit `~` verbunden (`wilde_hefe~sauer~uebervergaerend`); ohne Merkmale nur der Name der Kultur; Namen von Kulturen und Merkmalen dürfen `~` nicht enthalten
+ Die Daten einer Form sind die der Kultur mit den Änderungen aller Merkmale in der Reihenfolge des Schlüssels; jede Form ist eine eigene Kultur, im Befehl, in Rezepten und im Wissen
+ Neben dem Wesen: am Ende jedes Zugs der Sammlerin gewinnt sie die Formen aller Quellen auf den acht Nachbarfeldern, am Ende jedes Zugs einer Quelle gewinnt jede Sammlerin daneben ihre Form; ohne Wahrnehmung; eine schon bekannte Form bleibt still
+ Rest: stirbt eine Quelle und gibt es `regeln.brauen.rest`, entsteht auf ihrem letzten Feld der Rest mit ihrer Form
+ Probe aufheben: ein Gegenstand mit `kultur` gibt sie jedem Wesen, das ihn aufhebt, und vergeht; eine bekannte gibt `kultur_bekannt`
+ Wissens-EP: je Form einmal im Lauf (siehe [Wesen.md](Wesen.md), Skills und Lernen)

## Spontane Gärung

Daten: `regeln.brauen.spontan: { vergaerung, vertraegt, verderben, aromen: { <achse>: spanne }, unschaerfe }`, je Wert eine Spanne `[unten, oben]`; an der Ebene `ebene.flora: { vergaerung, vertraegt, verderben, aromen }`, aufgebaut wie eine Kultur

Schnittstellen (`src/systeme/flora.js`): Ebenenschritt `flora` (in `regeln.ebenen.schritteErzeugt`, siehe [Welt.md](Welt.md), Ebenen), `floraWuerfeln(spontan, zufall)`

Regeln:

+ Jede erzeugte Ebene würfelt ihre Flora aus den Spannen, mit dem Zufall `flora` des Baus, wiederholbar je Startwert und Tiefe; Ebenen mit fester Karte (Hub, Testkammer, Arenen) haben keine
+ Mit der Kultur `spontan` gärt der Sud mit der Flora wie mit einer Kultur (Vergärung, Verträglichkeit, Aromen, Punkte auf das Verderben); die Vorschau ist um `unschaerfe` Prozent breiter

## Nebel und Rezepte

Daten:

+ `rezepte` (gefundene Rezepte): `{ text, zielgebiet, portionen, zutaten: [{ typ, menge }], verfahren: { maische, gewuerz }, kultur, kniff?: { bonus?, effekt? }, ep }`; die Mengen gelten für `portionen` Portionen, `bonus` sind Prozentpunkte auf das Budget, `ep` freie EP beim ersten Gelingen
+ `regeln.brauen.rezeptUnschaerfe` (Prozent der Unschärfe nach Rezept)
+ Im Zustand: `zustand.wissen.zielgebiete: [name]` (aufgedeckt, in der Reihenfolge des Findens) und das Rezeptbuch `zustand.rezepte: { <schluessel>: { art: "gefunden" | "haus", zielgebiet, portionen, zutaten, verfahren, kultur, punkt, guete, gelungen } }`, Schlüssel der Name des gefundenen Rezepts oder `haus:<zielgebiet>`; `punkt` ist die gerundete Mitte des Profils, `guete` ihre Güte im Zielgebiet (0 außerhalb)
+ Startoption `optionen.vorwissen.zielgebiete` (siehe [Architektur.md](Architektur.md), Speichern)

Schnittstellen (`src/systeme/rezepte.js`):

+ `aufgedeckteZielgebiete(spiel)`, `zielgebietAufdecken(spiel, wesen, name, wie)` (`wie` "getroffen" oder "rezept"; Meldung `zielgebiet_entdeckt` mit `wer`, `zielgebiet`, `wie`, nur beim ersten Mal)
+ `nachRezept(rezept, eingabe)`, `rezeptFinden(spiel, eingabe)` (Schlüssel oder null), `zutatenNachArt(zutaten)`
+ `rezeptLernen(spiel, wesen, name)` und der Baustein `rezept_lernen { rezept }` (Parameterart `rezept`); Meldungen `rezept_gelernt` (mit `rezept` und `zielgebiet`) und `rezept_bekannt`
+ `nachDemSud(spiel, wesen, vorbereitet, zielgebiet)`, aufgerufen vom Befehl `brauen` nach jedem Treffer; Meldungen `hausrezept` und `hausrezept_besser` (mit `zielgebiet`); freie EP mit der Quelle `rezept`
+ Register `laufbeginn`: das Vorwissen

Regeln:

+ Zu Beginn sind die Zielgebiete aus dem Vorwissen aufgedeckt, nur solche, die es gibt, jedes einmal; in der Spielart "allmaechtig" alle
+ Ein Treffer beim Brauen deckt sein Zielgebiet auf, ein gelerntes Rezept das seine; nur für Ninkasi
+ Nach Rezept ist ein Sud, wenn Kultur, Maische und Gewürzgabe gleich sind, dieselben Zutatenarten drin sind (Stapel derselben Art zählen zusammen) und für jede Zutat Menge x Rezeptportionen = Rezeptmenge x Portionen gilt; das gefundene Rezept geht dem Hausrezept vor
+ Der Kniff eines gefundenen Rezepts wirkt nur, wenn der Sud dessen Zielgebiet trifft; dann trägt jede Portion `sud.rezept` und stapelt nur mit Portionen desselben Rezepts
+ Das erste Gelingen eines gefundenen Rezepts (Treffer seines Zielgebiets nach Rezept) gibt einmal `ep` als freie EP; gebunden erst mit den Brauskills (siehe [Systemausbau.md](Systemausbau.md), Punkt 23)
+ Hausrezept: ein Treffer ohne Rezept, nicht verdorben, dessen Mitte im Zielgebiet liegt, wird Hausrezept seines Zielgebiets, wenn es dort keines gibt oder die Güte seiner Mitte höher ist; verglichen wird die Mitte, nicht der Wurf; Hausrezepte haben keinen Kniff und bringen keine EP
+ Das Rezeptbuch gilt nur im Lauf; über Läufe hinweg bleiben nur die aufgedeckten Zielgebiete (Zähler `entdeckt.<name>` der Chronik, siehe [Architektur.md](Architektur.md), Speichern)

## Absud

Daten:

+ `absudrichtungen`: `{ text, elixier: { stufen }, gift: { stufen } }`, `stufen: [{ ab, zustand, misslingen? }]` mit steigendem `ab`, die erste ab 1; die Reihenfolge der Daten entscheidet bei Gleichstand; alle Richtungen gleich, ob Schadensart oder anderes Feld der Wirkung (Spieldesign in [Brauen.md](Brauen.md), Absud)
+ Zutat: `zutat.richtungen: { <richtung>: punkte }` je Stück, `neigung` (Punkte je Stück, plus zum Elixier, minus zum Gift), `misslingen` (Punkte, je Zutatenart einmal), `schwierigkeit` (das Kraut ist zu Beginn unbekannt)
+ Getränk: `absud: { richtung, pol, staerke }` am Gegenstand, je Richtung und Pol genau ein Typ (gefundene mit Stärke 1), trinkbar mit dem Effekt `absud_trinken`, geworfen `absud_zerspringt` (Kreis mit Radius 1, `daten/effekte.js`); die trübe Brühe `bruehe` (`regeln.brauen.absud.misslungen`, `daten/sude.js`) setzt getrunken oder geworfen den Zustand `unwohl`
+ `regeln.brauen.absud: { maechtigkeitProzent, staerkeJe, hoechstStaerke, dauer, absicht: { grund, mindestens, hoechstens }, misslingen, misslungen, adjektive: { <stärke>: adjektiv }, vermutung: { grund } }`
+ Kampfwert `kraeuterkunde` (siehe [Wesen.md](Wesen.md), Kampfwerte); im Zustand `zustand.wissen.kraeuter: [typ]`; Startoption `optionen.vorwissen.kraeuter` (siehe [Architektur.md](Architektur.md), Speichern)

Schnittstellen (`src/systeme/absud.js`):

+ `absudVorbereiten(spiel, wesen, { zutaten, portionen, absicht })` gibt `{ wahr, vermutet, unbekannt }`, je Rechnung (`absudRechnen`) `{ punkte, fuehrend, maechtigkeit, staerke, absicht, stufe, chancen: { gelungen, umgeschlagen, misslungen } }`; `sudVorbereiten` gibt ohne Kultur `{ art: "absud", kessel, eingabe, wahr, vermutet, unbekannt, fuellung, fassen, portionen, gefaesse, rezept: null }` (siehe Befehl)
+ `zutatImAbsud(spiel, wesen, typ)` (die Beiträge, wie Ninkasi sie sieht, mit `vermutet`), `krautUnbekannt`, `krautKennenlernen` (Meldung `kraut_erkannt` mit `wer` und `was`), `stufeDesPols`, `getraenkFuer`, `ausgangWuerfeln`, `POLE`, `gegenpol`, `kraeuterkundeVon`
+ Befehl `brauen` mit `kultur: null` und `absicht` (`"elixier"`, Vorgabe, oder `"gift"`, sonst `ungueltig`); Meldungen `absud_gelungen`, `absud_umgeschlagen`, `absud_misslungen` mit `wer`, `was` und `anzahl`
+ Baustein `absud_wirken` (ohne Parameter) liest `kontext.werte.absud`, die Trinken und Werfen setzen (siehe [Gegenstaende.md](Gegenstaende.md), Inventar); Haken `gegenstand_benutzt`: wer einen Absud wirft, erkennt die Sorte; Register `laufbeginn`: das Vorwissen der Kräuter

Regeln:

+ Punkte je Richtung = Punkte der Zutat mal Menge, zusammengezählt; es führt die Richtung mit den meisten, bei Gleichstand die erste der Daten
+ Mächtigkeit = Extrakt aller Zutaten durch die Portionen mal `maechtigkeitProzent`, mit Modifikatoren auf `brauen.maechtigkeit`; Stärke = Mächtigkeit durch `staerkeJe`, zwischen 1 und `hoechstStaerke`
+ Chance der Absicht = `absicht.grund` plus die mittlere Neigung je Stück (beim Gift minus), mit Modifikatoren auf `brauen.absicht`, zwischen `mindestens` und `hoechstens`
+ Misslingen = `misslingen` plus `misslingen` jeder Zutatenart plus das der erreichten Stufe des gewählten Pols, mit Modifikatoren auf `brauen.misslingen`, zwischen 0 und 100; ohne Richtung 100
+ Der Wurf `absud` (1 bis 100): bis zum Misslingen misslungen, bis dazu plus (100 - Misslingen) x Absicht / 100 gelungen, sonst umgeschlagen ins Gegenteil derselben Richtung und Stärke
+ Kein Wurf auf Verderben, kein Reifen, kein Verderber; Zutaten und je Portion ein Gefäß sind verbraucht wie beim Sud; die Portionen tragen `absud` und das Adjektiv ihrer Stärke aus `adjektive`
+ Wirkung: der Zustand der höchsten Stufe des Pols, deren `ab` die Stärke erreicht, mit der Stärke als Stärke des Zustands und `dauer` als Dauer; geworfen auf jedes Wesen im Kreis um den Aufschlag, auch auf die Werferin; kein Pegel
+ Wissen: eine Zutat mit `schwierigkeit` ist unbekannt, bis Ninkasi mit ihr einen Absud braut; zu Beginn das Vorwissen, in der Spielart "allmaechtig" alle; die Chronik zählt `kraut.<typ>`
+ Vermutung: für ein unbekanntes Kraut ein fester Wurf von 1 bis 100 je Lauf und Kraut (Zufall `vermutung:<typ>` aus dem Startwert, nicht der Spielzufall); ist er höchstens 100 x (`vermutung.grund` + Kräuterkunde) / (`vermutung.grund` + Kräuterkunde + Schwierigkeit), zeigt die Vorschau die wahren Beiträge, sonst liegen die Punkte auf je einer anderen Richtung (ebenso fest gewürfelt), die Neigung ist umgekehrt und das Misslingen 0; die Vorschau rechnet mit der Vermutung, der Befehl mit der Wahrheit
+ Ninkasi erkennt die gebraute Sorte vor dem Abfüllen; gefundene Absude sind unbekannt mit einem Etikett der Gruppe `absude`, bis sie die Sorte braut, trinkt oder wirft (siehe [Gegenstaende.md](Gegenstaende.md), Unbekanntes)

## Tests

+ `tests/brauen.test.js` (Profil je Portion, Gärung und Restzucker, Zielgebiete, Güte, Runden, Wirkung sofort und über die Zeit, Befehl, Wurf und Verderben, Ablehnungen, Kulturen und Zutaten aufheben, Braufenster mit Portionen und Klickregel, Spinnennetz, Datenprüfung)
+ `tests/reifen.test.js` (Dauer der Stufen, Stufen bis zum Essig, Reife nur für starke Sude, Stapeln je Stufe, Wirkung je Stufe, die drei Ausgänge des Wurfs, Verderber neben dem Kessel, Flora je Ebene, spontane Gärung im Befehl und im Fenster, Datenprüfung)
+ `tests/absud.test.js` (Richtung, Mächtigkeit, Absicht und Misslingen, die drei Ausgänge, Trinken und Werfen, Stufen, Vermutung und Wissen über Kräuter samt Vorwissen, Braufenster mit Balken, Datenprüfung)
+ `tests/kulturen.test.js` (Formen mit Merkmalen, Gewinnen neben dem Wesen in beide Richtungen, Rest nach dem Tod und sein Vergehen, Platztausch und Vorsatz angreifen, Datenprüfung, Start ohne Kultur)
+ `tests/rezepte.test.js` (Vorwissen und Nebel, Zählregel, Rezept lernen über die Tontafel, Erkennen nach dem Verhältnis, enge Vorschau, Kniff nur beim Treffer, EP beim ersten Gelingen, Hausrezepte, Rezeptliste im Braufenster, Datenprüfung)

## Verweise

+ Spieldesign: [Brauen.md](Brauen.md); Skills des Brauens: [Skills.md](Skills.md), Brauen
+ Probeinhalt (Zutaten, Kulturen, Zielgebiete, Tonkessel): [Entwicklung.md](Entwicklung.md), Probeinhalt
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 23

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
