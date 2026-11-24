# Battle Ninkasi - Wirkungen

Stand: 2026-11-24

Zuständig für: `src/kern/effekte.js`, `src/kern/bausteine.js`, `src/kern/ausloeser.js`, `src/kern/vorgang.js`, `src/kern/werte.js`, `src/systeme/modifikatoren.js`, `src/systeme/zustaende.js`, `src/systeme/betaeubung.js`, `src/systeme/befehlsveraenderer.js`, `src/systeme/beschwoerung.js`, `src/systeme/zielauswahl.js`, `src/systeme/zielbausteine.js`, `src/systeme/faehigkeiten.js`, `src/systeme/laufendeAktionen.js`, `src/systeme/tod.js`, `src/systeme/ersatz.js`, `src/welt/geometrie.js`, `daten/effekte.js`, `daten/zustaende.js`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md), [Wesen.md](Wesen.md), [Gegenstaende.md](Gegenstaende.md), [Grundlagen.md](Grundlagen.md), [Skills.md](Skills.md)

## Zweck

Wie Skills, Gegenstände, Zustände und Fähigkeiten wirken: die sechs Wirkungsarten, das Effektsystem aus Bausteinen, Modifikatoren, Auslöser, Zustände, Kontrolle, Zielauswahl, Fähigkeiten, lange Aktionen und der Tod als Zustandsprüfung. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Wirkungsarten

Skills, Items, Zustände und Fähigkeiten wirken über sechs Arten, die frei kombinierbar sind:

1. Modifikatoren ändern Zahlen, z.B. "Braupaddel der Geschwindigkeit: Angriff kostet 33% weniger Zeit", "Skill: Bewegung 5% schneller"; siehe Modifikatoren
2. Auslöser-Effekte reagieren auf Ereignisse, z.B. "bei Angriff, 15% Chance, weiterer Angriff", "beim Tod Sporen freisetzen"; siehe Auslöser
3. Aktionsveränderer ändern, wie eine Aktion abläuft: Zielmuster, Reichweite, Fläche; z.B. "Braupaddel des Rundumschlags trifft alle angrenzenden Felder", "Speer trifft zwei Felder in Linie"; Zielmuster sind Daten (`muster: { art: "angrenzend" }`, `muster: { art: "linie", laenge: 2 }`), siehe Zielauswahl
4. Zustände sind zeitlich begrenzt, mit Verlauf (gleichbleibend, abklingend, ansteigend) und Stapelregel (erneuern, aufaddieren, nur der stärkste, einzeln); sie bündeln selbst Modifikatoren und Auslöser; z.B. Schaden über Zeit, abklingender Segen, sich steigernde Vergiftung; siehe Zustände
5. Auren wirken auf andere im Umkreis der Trägerin, z.B. "Gegner in der Nähe langsamer", "Hefen in der Nähe sprossen schneller"; siehe Modifikatoren
6. Gewährte Aktionen schalten eine Fähigkeit frei, solange ein angelegter Gegenstand oder ein Zustand sie gewährt, z.B. "Braupaddel erlaubt Ansturm"; siehe Fähigkeiten

Jede Wirkungsart kann zusätzlich Bedingungen tragen (nur ab Pegel X, nur gegen Bakterien, nur unter 30 % LP, nur mit zwei Kupfer-Items: Sets, Synergien) und Nachteile (negative Werte, z.B. für verfluchte Items). Jeder Modifikator kennt seine Quelle (Skill, Item, Zustand, Aura); Schwellen des Pegels sind Bedingungen; entfällt die Quelle, entfallen genau ihre Modifikatoren.

## Effektsystem

Zwei Schichten, wie Lego: Der Code liefert die Steine (Grundbausteine), die Daten bauen daraus benannte, wiederverwendbare Effekte, z.B. "Feuerbier-Explosion": Fläche 3x3, Feuerschaden 2W6, Zustand "brennend" für 300 Einheiten.

Daten:

+ Effekt (`daten/effekte.js`): `{ schritte: [{ baustein, ...parameter }], tags? }`; die Tags des Effekts kommen zu denen des Kontexts
+ Kontext eines Effekts (`kontextVervollstaendigen` in `src/kern/effekte.js`): `{ quelleId, urheberId, urheberFraktion, zielId, ursprung, zielfeld, ursache, kettentiefe, mittel, tags, kritisch, trefferchance?, werte }`
  + `quelleId` wirkt unmittelbar (Wesen, Fass, Geschoss, Falle); `urheberId` wird die Wirkung zugerechnet (EP, Zorn, Todesursache), Vorgabe die Quelle, bei Beschworenen deren Beschwörerin (`beschworenVon`); `urheberFraktion` bleibt erhalten, auch wenn die Urheberin schon entfernt ist
  + `zielId` das Wesen, auf das ein Schritt wirkt, oder null (Wirkung auf ein Feld); `ursprung` das Feld, von dem Muster ausgehen (Vorgabe Position der Quelle), `zielfeld` das anvisierte Feld (Vorgabe Position des Ziels)
  + `ursache`: bisher `nahkampf`, `wurf`, `trinken`, `faehigkeit`, `risiko`, `abbruch`, `ausloeser`, `zustand`, `falle`, `feuer`, `bewegung`, `festsitzen`, `benutzen`, `schwund.<wert>` (Stoffwechsel)
  + `mittel`: `{ art: "angriff" | "faehigkeit" | "gegenstand" | "zustand" | "falle" | "gelaende", name }` oder null; `tags` z.B. `["feuer", "magie"]` für Modifikatoren und gebundene EP
  + `kritisch` setzt ein kritischer Trefferwurf, verschachtelte Effekte erben es (siehe [Wesen.md](Wesen.md), Kampfwerte); `trefferchance` nur für die Meldung `schaden`
  + `werte` ist eine Ablage zwischen Schritten, über alle Verschachtelungen eines Effekts geteilt: `schaden` zählt den tatsächlichen Verlust in `summeSchaden`, `fuer_jedes_ziel` schreibt `anzahlZiele`, `springen` schreibt `getroffeneIds` und `sprungnummer`, Zustände `staerkeProzent`
+ Mengen der Bausteine `schaden` (mit Pflichtfeld `art`), `heilen`, `wert_aendern` (`mengeBestimmen` in `src/kern/bausteine.js`): `wuerfel`, feste `menge` oder `menge: { aus: "summeSchaden", prozent: 50 }` aus der Ablage (Lebensraub); `auf: "quelle"` wirkt auf die Quelle statt auf das Ziel (Vampirbiss: Schaden am Ziel, Heilung an der Angreiferin); `teilen: "anzahlZiele"` (verteilter Schaden), `prozentJeSprung` (Abschwächung je Sprung einer Kette), `mitStaerke: true` (skaliert mit der Stärke eines Zustands); der Würfelwurf heißt `schaden`, `heilen` oder sonst `menge` (siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit)

Schnittstellen:

+ `effektAnwenden(spiel, effektName, kontext)`; `wertAendern` und `wertAendernInHundertsteln` für jede Änderung eines Werts (siehe [Architektur.md](Architektur.md), Ereignisse); `beteiligteAus`, `ursprungAus`
+ `bausteinAnmelden(name, parameterBeschreibung, funktion, { brauchtZiel, vorab })`: Funktion `(spiel, kontext, parameter) => void` im Register `bausteine`; `vorab` (freiwillig) `(spiel, kontext, parameter) => Grund | null` sagt, dass der Schritt jetzt nichts bewirken würde
+ `wirkungVorab(spiel, effektName, kontext)` (`src/kern/bausteine.js`): ein Grund nur, wenn jeder Schritt auf oberster Ebene eine Vorabprüfung hat und sie einen Grund nennt (der erste zählt); Schritte ohne Vorabprüfung gelten als wirksam
+ Grundbausteine, nach Datei (beschrieben im jeweiligen Dokument):
  + `src/kern/bausteine.js`: `schaden`, `heilen`, `wert_aendern`, `zufall`
  + `src/systeme/zielbausteine.js`: `fuer_jedes_ziel`, `auf_feld`, `geschoss`, `springen` (siehe Zielauswahl)
  + `src/systeme/zustaende.js`: `zustand_setzen`, `zustand_entfernen`; `src/systeme/beschwoerung.js`: `beschwoeren`, `verschwinden` (siehe Zustände); `src/systeme/betaeubung.js`: `betaeuben` (siehe Kontrolle)
  + `src/systeme/kampf.js`: `trefferwurf`, `angreifen` (siehe [Wesen.md](Wesen.md), Kampfwerte); `src/systeme/verschieben.js`: `stossen`, `ziehen`, `tauschen`, `teleportieren` (siehe [Wesen.md](Wesen.md), Bewegung); `src/systeme/wahrnehmung.js`: `laerm`; `src/systeme/fraktionen.js`: `ruf_aendern` (siehe [Wesen.md](Wesen.md), Fraktionen); `src/systeme/skills.js`: `eigenschaft_aendern`, `skill_freischalten`
  + `src/systeme/gelaende.js`: `gelaende_setzen`, `gelaende_zerstoeren`; `src/systeme/schichten.js`: `oberflaeche_setzen`, `gas_setzen`, `entzuenden` (siehe [Welt.md](Welt.md))
  + `src/systeme/verschleiss.js`: `abnutzen`; `src/systeme/ausruestung.js`: `fluch_aufheben` (siehe [Gegenstaende.md](Gegenstaende.md))
  + `src/systeme/faehigkeiten.js`: `faehigkeit_lehren` (siehe Fähigkeiten)
+ Baustein `zufall { chance, effekt, sonst? }`: mit `chance` Prozent wirkt `effekt`, sonst `sonst` (oder nichts), mit demselben Kontext und derselben Ablage; Wurf `zufall`, für eine Chance innerhalb eines Effekts (die Vorstufe einer Krankheit heilt von selbst aus, ein Treffer betäubt manchmal); Chancen an Ereignissen haben schon die Auslöser, Chancen über den Pegel die Risikotabellen
+ Baustein `angreifen { profil? }`: die Quelle greift das Ziel mit ihren Angriffsprofilen an wie bei einer Angriffsaktion, ohne Zeitkosten, mit `profil` nur dieses eine; nur gegen ein Ziel daneben; für Konter aus Auslösern, z.B. `{ bei: "verfehlt", rolle: "ziel", ziel: "quelle", effekt: "konter" }`; die Angriffe laufen auf der Kettentiefe des Effekts, gegenseitige Konter enden so an der Kettengrenze

Regeln:

+ Grundbausteine sind wenige Dutzend kleine, stabile Funktionen; ein neuer ist nur für eine wirklich neue Mechanik nötig
+ Was sich nicht aus Bausteinen zusammensetzen lässt (Muster des Verhaltens), wird ein benanntes Verhaltensmodul; die Daten verweisen nur darauf, z.B. `ki: { modul: "fliehen" }`; Teilung und Wachstum sind kein Verhaltensmodul, sondern setzen sich aus Bausteinen zusammen: Zweiteilung und Sprossung als Fähigkeit oder Auslöser mit `beschwoeren` und `abstammung` (eine Teilung ergibt zwei Wesen mit vollen Werten), begrenzt über `anzahl_unter`; Myzel als Oberfläche mit `ausbreitung` (siehe [Welt.md](Welt.md), Feldschichten); Sporen und Zerfall (aus den Resten entstehen neue Wesen) als Auslöser an `nach_tod`; Bossphasen über Auslöser mit Bedingungen; Beispiele in `tests/probedurchstich.test.js`; Bausteine, Verhaltensmodule und Zielmuster stehen in Registern, auch für Mods (siehe [Architektur.md](Architektur.md), Register)
+ Bausteine erklären, ob sie ein Wesen brauchen (`brauchtZiel`); ein Schritt ohne Ziel (bei `auf: "quelle"` ohne Quelle) wird übersprungen, der Effekt läuft weiter
+ Bausteine beschreiben ihre Parameter für die Datenprüfung: `text`, `ganzzahl`, `wahrheitswert`, `effekt`, `muster` und weitere, mit `?` freiwillig, eine Liste nennt die erlaubten Werte; benannte Effekte dürfen sich nicht im Kreis aufrufen, auch nicht über Zustände
+ Getötet wird im Effekt nie: fällt der Lebenswert auf 0, stirbt das Wesen in der Zustandsprüfung nach dem Vorgang (siehe Tod und Zustandsprüfung)

## Modifikatoren

Daten:

+ Modifikator: `{ ziel, art, betrag, quelle, tag?, wenn? }`, z.B. `{ ziel: "kosten.bewegen", art: "prozent", betrag: -5 }`
+ Ziele sind Namen wie `lp`, `genauigkeit`, `ausweichen`, `ruestung`, `ruestung.<art>`, `widerstand`, `schaden`, `kritfaktor`, `immunitaet` und jeder Kampfwert unter seinem Namen (siehe [Wesen.md](Wesen.md), Kampfwerte), `tragkraft` (siehe [Gegenstaende.md](Gegenstaende.md), Inventar), `reichweiteSicht`, `sichtImFinstern`, `sichtAnteil.<stufe>` (siehe [Welt.md](Welt.md), Sichtweite), `reichweiteSpueren` (siehe [Wesen.md](Wesen.md), Wahrnehmung), `kosten.<aktion>`, `kosten.alle`, `verlangsamung.<tag>`, `gewicht.<tag>` (siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung), `verbrauch.<wert>`, `verbrauch.alle`, `abklingzeit`, `unterhalt.<wert>` (siehe Fähigkeiten), `regeneration.<wert>`, `schwund.<wert>`, `kurvenverschiebung.<wert>`, `abbau.pegel`, `imKampf.<wert>`, `kampfgewinn.<wert>` (siehe [Wesen.md](Wesen.md), Stoffwechsel), `eigenschaft.<name>` (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Arten (`MODIFIKATORARTEN` in `src/kern/werte.js`): `plus`, `prozent`, `mal` (Betrag in Prozent, `150` heißt x1,5), `mindestens`, `hoechstens`, `setzen` (zählt als `mindestens` und `hoechstens` mit demselben Betrag); alle Beträge ganzzahlig
+ Bedingungen: `wenn: [{ bedingung, ...parameter }]`, alle müssen gelten
+ Auren: `auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen

Schnittstellen:

+ `modifiziert(spiel, entitaet, ziele, basiswert, umstaende?)` sammelt bei jeder Abfrage aus allen Quellen in der Reihenfolge der Anmeldung; `verrechnet(basiswert, modifikatoren)`; `modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende?)` liefert die wirksamen Modifikatoren mit ihrer Quelle für Erklärungen in der Oberfläche; `hoechstwert(spiel, entitaet, wertName)`
+ Umstände: `{ gegenueberId?, tags? }`; der Trefferwurf gibt für Genauigkeit und Verteidigung das Gegenüber und die Tags von Angriff und Effekt mit, die Schadensrechnung dazu die Schadensart, `zeitkosten` reicht Umstände durch
+ Register `modifikatorquellen` (`(spiel, entitaet) => [modifikator]`), mitgeliefert: `eigene` (die Liste `entitaet.modifikatoren`, gepflegt mit `modifikatorHinzufuegen` und `modifikatorenEntfernen` je Quelle), `auren` (Quelle `aura:<id>` bzw. `aura:zustand:<nummer>`), `zustaende` (Quelle `zustand:<nummer>`, siehe Zustände), `ausruestung` (siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung), `skills` (Quelle `skill:<name>`) und `anforderungen` (Abzüge für nicht erfüllte Anforderungen angelegter Gegenstände, Quelle `anforderung:<id>`, beide siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Register `modifikatorbedingungen` (`(spiel, entitaet, parameter, umstaende) => boolean`, Parameter für die Datenprüfung wie bei den Bausteinen, `src/systeme/modifikatoren.js`), mitgeliefert: `pegel_ab { wert }`, `pegel_unter { wert }` (z.B. nüchtern), `wert_unter_prozent { wert, prozent }` (gemessen am Grundwert ohne Modifikatoren), `gegenueber_tag { tag }`, `gegenueber_ahnungslos` (Hinterhalt, siehe [Wesen.md](Wesen.md), Wahrnehmung), `gegenueber_wehrlos` (siehe Kontrolle), `im_kampf` und `ausser_kampf` (siehe [Wesen.md](Wesen.md), Kampfzustand), `hat_zustand { zustand }`, `ohne_zustand { zustand }`, `hat_tag { tag }`, `ohne_tag { tag }`, `traegt_tag { tag, anzahl? }` (Sets aus angelegten Gegenständen), `anzahl_unter { anzahl, wesen?, linie? }` (weniger als `anzahl` Wesen vom Typ `wesen`, Vorgabe der eigene, auf der Ebene; mit `linie: true` nur die eigene Abstammungslinie, also gleiche `topfId`, wer keine hat, beginnt seine eigene), `skill_ab { skill, stufe }`, `eigenschaft_ab { eigenschaft, wert }`, `eigenschaft_unter { eigenschaft, wert }`
+ `bedingungenErfuellt(spiel, entitaet, liste, umstaende)` in `src/kern/werte.js` prüft dieselben Bedingungen für `voraussetzungen` an Fähigkeiten, `wenn` an Auslösern und an Einträgen der KI; Schwellen des Pegels sind damit gewöhnliche Modifikatoren mit `pegel_ab`

Regeln:

+ Verrechnung (Vorbild "increased" und "more" in Path of Exile): (Basiswert + Summe aller `plus`) x (100 + Summe aller `prozent`) / 100 x jedes `mal` / 100, ganzzahlig gerechnet und einmal am Ende gerundet, die Reihenfolge der Modifikatoren spielt also keine Rolle; danach hebt `mindestens` (der höchste) und senkt `hoechstens` (der niedrigste), bei Widerspruch gewinnt `hoechstens` (Blindheit schlägt Fernsicht)
+ Prozente addieren sich, zehnmal +5 % sind +50 %; nur `mal` multipliziert, und nur dort, wo die Daten es ausdrücklich sagen; so wachsen Werte nicht unbemerkt exponentiell; Skills multiplizieren sich untereinander, indem die Quelle `skills` je Skill einen `mal`-Modifikator liefert (entschieden in [Charakter.md](Charakter.md), umstellbar über `regeln.lernen.verrechnung`)
+ Gespeichert oder nachgeführt wird nichts: kein Wert baut auf seinem letzten Ergebnis auf, jede Abfrage rechnet vom Grundwert; Untergrenzen wie "Kosten mindestens 1" setzen die Aufrufer
+ `hoechstwert` und alle Begrenzungen von Werten rechnen über `modifiziert`; nach oben offene Werte (Pegel) haben keinen Höchstwert
+ Tags: ein Modifikator mit `tag` wirkt nur, wenn die Abfrage den Tag in `umstaende.tags` mitbringt, z.B. `{ ziel: "kosten", tag: "psi", art: "prozent", betrag: -10 }` für alle Psi-Fähigkeiten, auch künftige; Wesen tragen `tags` (z.B. `["bakterium", "essig"]`), Schadensarten gehen als Tag in die Abfragen der Schadensrechnung
+ Bedingungen lesen nur Rohwerte und rufen `modifiziert` nicht auf; fragen sich Modifikatoren doch im Kreis ab, bricht ein Schutz nach acht Ebenen mit einer Fehlermeldung ab
+ Ausnahme: `eigenschaft_ab` und `eigenschaft_unter` lesen den wirksamen Wert samt Modifikatoren, damit ein Kraftbier eine Anforderung erfüllt; die Datenprüfung verbietet sie an Modifikatoren auf `eigenschaft.*` (direkter Kreis), indirekte fängt der Schutz
+ Auren: Reichweite als Kreis wie in der Zielauswahl, `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl (`feinde`, `verbuendete`, `wesen`, `alle`); standardmäßig nicht auf die Trägerin selbst und durch Wände (Gerüche, Dunst, Sporen), mit `sichtlinie: true` nur bei freier Sicht; Auren in Zuständen skalieren mit Stärke und Verlauf
+ Auren werden bei jeder Abfrage gesucht, aber nur unter den möglichen Trägerinnen aus dem räumlichen Index (siehe [Architektur.md](Architektur.md), Leistung)

## Auslöser

Daten:

+ An einer Entität: `ausloeser: [{ bei, rolle?, ziel?, effekt, chance?, daempfung?, wenn? }]`, z.B. Dornen `{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }`
  + `bei`: Haken aus dem Katalog mit `ausloeserErlaubt` und `inBetrieb` (siehe [Architektur.md](Architektur.md), Ereignisse)
  + `rolle`: Rolle der Trägerin im Ereignis (`quelle` oder `ziel`, ohne Angabe jede; `AUSLOESER_ROLLEN`)
  + `ziel`: worauf der Effekt wirkt (`AUSLOESER_ZIELE`): `selbst` (Vorgabe), `quelle`, `ziel` oder `feld`, die Position im Ereignis, bei `nach_tod` die letzte Position des Opfers, sonst die der Trägerin; der Effekt läuft dann ohne Wesen als Ziel mit Ursprung und Zielfeld dort, z.B. Sporen im Kreis
  + `chance` in Prozent, Vorgabe 100; `daempfung` überschreibt die Regel (100 heißt ungedämpft)
  + `wenn`: Bedingungen wie an Modifikatoren, geprüft an der Trägerin beim Ausführen und vor dem Wurf, Gegenüber ist die andere Partei des Ereignisses; Bossphase: `{ bei: "nach_schaden", rolle: "ziel", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }, { bedingung: "ohne_zustand", zustand: "raserei" }], effekt: "raserei_setzen" }` beginnt genau einmal
+ Regelwerte in `daten/regeln.js`: `daempfungProStufe` 50, `hoechsteKettentiefe` 5

Schnittstellen (`src/kern/ausloeser.js`):

+ Ein Verteiler hängt mit Rang 1000 (nach allen Code-Handlern) an jedem Haken mit `ausloeserErlaubt` und merkt passende Auslöser nur vor; `naechstenAusloeserAusfuehren` und `anstehendeAusloeser` nutzt `vorgangAbschliessen`
+ Register `ausloeserquellen` (`(spiel, entitaet) => [{ ausloeser, schluessel }]`), bisher die der Skills (`abStufe`, siehe [Wesen.md](Wesen.md), Skills und Lernen)

Regeln:

+ Haken und Auslöser sind getrennt: Haken sind Code, wirken sofort und dürfen den Kontext ändern; Auslöser werden nach dem laufenden Schritt nacheinander in der Reihenfolge des Vormerkens abgearbeitet; kein Auslöser greift so mitten in eine Schadensrechnung ein
+ Die Warteschlange der Auslöser liegt im Spiel, nicht im Zustand; sie ist nach jedem Vorgang leer
+ Gefragt werden die beteiligten Entitäten, zuerst die Quelle, dann das Ziel; je Entität zuerst ihre eigenen Auslöser, dann die ihrer Zustände (z.B. Dornenhaut), dann die ihrer angelegten Gegenstände (Kaskade nach Caves of Qud, z.B. Dornenpanzer), dann die weiterer Quellen aus `ausloeserquellen`
+ Ketten: Befehle und Welt wirken auf Kettenstufe 0, der Effekt eines Auslösers eine Stufe tiefer als sein Ereignis; die Chance sinkt je Stufe auf `daempfung` Prozent (einheitlich gerundet: 100, 50, 25, 13, 7 ...), ab der höchsten Kettentiefe wird nichts mehr vorgemerkt
+ Sichere Chancen (0 und 100) würfeln nicht, damit die Zahlenfolge des Zufalls ungestört bleibt
+ Kettenreaktionen der Welt (Feuer greift auf Gas über, Fässer explodieren nacheinander) laufen nicht über Auslöser, sondern über die Zeit (Weltuhr, Zeitereignisse); sie sind von der Kettengrenze nicht betroffen und für die Spielerin sichtbar
+ An Haken "davor" greifen statt Auslösern die Ersatzwirkungen ein, weil sie sofort wirken müssen (siehe Ersatzwirkungen)

## Ersatzwirkungen

Vorbilder: NetHack (das Amulett des Lebens rettet angelegt einmal und zerfällt), Slay the Spire (die Fee in der Flasche wirkt aus dem Vorrat, ohne Heilung rettet nichts), Caves of Qud (`BeforeDieEvent` an Teilen eines Objekts).

Daten:

+ `ersatz: [{ bei, effekt?, ziel?, tag?, wenn?, chance?, verbrauchen?, text? }]` am Wesen, an einem Zustand, an Ausrüstung (`ausruestung.ersatz`, wirkt nur angelegt) und am Gegenstand selbst (wirkt aus dem Gepäck, siehe [Gegenstaende.md](Gegenstaende.md), Inventar), z.B. Phönixbier `{ bei: "vor_tod", effekt: "phoenix", verbrauchen: true }`, Barriere als Zustand mit `stapel: "aufaddieren"` und `{ bei: "vor_schaden", verbrauchen: true }`
  + `bei`: Haken aus dem Katalog mit `ersatzErlaubt` (heute `vor_tod` und `vor_schaden`, siehe [Architektur.md](Architektur.md), Ereignisse)
  + `effekt` (freiwillig) wirkt sofort, eine Kettenstufe tiefer, Quelle die Trägerin, Ursache `ersatz`; `ziel` (`ERSATZ_ZIELE`): `selbst` (Vorgabe) oder `quelle`, wer den Schaden bringt (Gegenschlag)
  + `tag`: nur, wenn das Ereignis dieses Tag oder diese Schadensart trägt (ein Feuerschild); an `vor_tod` gibt es keine Tags
  + `wenn` wie an Auslösern, Gegenüber ist die Quelle des Ereignisses; `chance` in Prozent, Vorgabe 100, ohne Dämpfung, Wurf `ersatz` nur zwischen 0 und 100
  + `verbrauchen` (Vorgabe `false`); `text`: eigener Schlüssel der Meldung

Schnittstellen (`src/systeme/ersatz.js`):

+ Je Haken mit `ersatzErlaubt` ein Handler mit Rang `RANG_ERSATZ` 400 (`src/kern/hakenkatalog.js`), die Regel je Haken in `JE_HAKEN`; fehlt sie, bricht schon das Laden ab
+ Register `ersatzquellen` (`(spiel, entitaet) => [{ eintrag, schluessel, gegenstandId? | zustand?, verbrauchen(kettentiefe) }]`), bisher ohne Eintrag
+ Meldung `ersatz_gewirkt { wer, quelle, haken, was | zustand, text }`; `einStueckVerbrauchen` in `src/systeme/inventar.js`

Regeln:

+ Gefragt wird nur das Ziel des Ereignisses, in der Kaskade der Auslöser: eigene, die der Zustände, der angelegten Gegenstände, der Gegenstände im Gepäck, dann `ersatzquellen`; je Ereignis wirkt höchstens eine, und keine wirkt wieder, solange ihr eigener Effekt läuft
+ `vor_tod`: nach dem Effekt wird der Tod abgebrochen; gewirkt hat die Ersatzwirkung nur, wenn der Lebenswert danach über 0 liegt, sonst wird sie nicht verbraucht und die nächste gefragt; sie läuft vor der Allmacht
+ `vor_schaden`: fängt den Treffer ganz ab, nach dem Widerstand und nur bei Schaden über 0, was Rüstung oder Immunität auf 0 bringen, verbraucht sie also nicht; den Marker `unblockbar` achtet sie (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Verbrauchen: am Wesen fällt der Eintrag weg; ein Zustand verliert einen Stapel (mit seinem Anteil der Stärke), der letzte endet mit dem Grund `verbraucht`; ein Gegenstand gibt ein Stück oder eine Ladung ab, danach `wirdZu`, ein angelegter wird dabei abgelegt
+ Ein unbekannter Gegenstand wird erkannt, sobald seine Ersatzwirkung wirkt; die Meldung nennt dann seinen Namen

## Zustände

Daten:

+ Zustand (`datenproben/zustaende.js`, mit Vorlagen): `{ text, adjektiv, tags, dauer, stapel, hoechstStapel, verlauf, modifikatoren, auren, jeTick, beimBeginn, beimEnde, beimAblauf, ausloeser, ersatz, gebundenAnQuelle, unterhalt, handlungsunfaehig, befehl, ki, fraktion, faehigkeiten }`
  + `dauer` in Zeiteinheiten, ohne Angabe unbegrenzt bis zum Entfernen
  + `stapel`: `erneuern` (Vorgabe: eine Instanz, höhere Stärke, längere Dauer), `aufaddieren` (Stärken addiert bis `hoechstStapel` Anwendungen, Dauer erneuert), `staerkster` (nur eine mindestens gleich starke Anwendung ersetzt, sonst nichts), `einzeln` (eigene Instanzen mit eigenem Ende, höchstens `hoechstStapel`)
  + `verlauf`: `gleichbleibend` (Vorgabe), `abklingend`, `ansteigend` oder eine eigene Kurve `[[anteilProzent, staerkeProzent], ...]` über den Anteil der verstrichenen Dauer
  + `unterhalt: { mp: 2 }` kostet die Trägerin je Welttick (aufrechterhaltene Zauber); `gebundenAnQuelle: true` endet mit dem Tod oder Verschwinden der Quelle
  + `faehigkeiten: [name]` gewährt der Trägerin diese Fähigkeiten, solange der Zustand wirkt (siehe Fähigkeiten)
  + `adjektiv`: Textschlüssel eines Adjektivs, das vor dem Namen der Trägerin steht, solange der Zustand wirkt (Affix, siehe [Texte.md](Texte.md), Grammatik); die Instanz trägt es mit, wie Fraktion und KI
  + `tags` mit Mechanik: `kontrolle` (abnehmende Kontrolle) und `wehrlos` (sicher getroffen), siehe Kontrolle
  + `handlungsunfaehig: true` (Lähmung, Filmriss; die Betäubung schiebt stattdessen den Zug hinaus, siehe Kontrolle); `befehl: { veraenderer, ...parameter }`; `ki: { modul, ...parameter }`; `fraktion`: `"urheber"` (Psi-Kontrolle), `"eigene"` (Zwietracht, mit allen verfeindet) oder ein Fraktionsname
+ Instanzen an der Entität: `zustaende: [{ nummer, name, quelleId, urheberId, urheberFraktion, beginn, ende, staerke, stapel, ausFaehigkeit? }]` (`ausFaehigkeit`: gesetzt von einer aufrechten Fähigkeit); die Nummer zählt `naechsteZustandsnummer` im Zustand des Spiels hoch; `staerke` Vorgabe 1; Fraktion und KI werden beim Beginn in die Instanz geschrieben

Schnittstellen:

+ Bausteine `zustand_setzen { zustand, dauer?, staerke? }` und `zustand_entfernen { zustand?, tag? }` auf das Ziel; `zustandSetzen(spiel, traegerin, name, angaben)` mit `angaben.kontrolleGeprueft`, wenn die Dauer schon durch die abnehmende Kontrolle lief
+ Haken `zustand_beginnt` und `zustand_endet` (mit `grund`: `abgelaufen`, `entfernt`, `quelle_tot`, `unterhalt`, `verbraucht`), Meldungen gleichen Namens
+ Zeitereignis `zustand_ende`, gebunden an die Trägerin; Modifikatorquelle `zustaende`; `modifikatorSkaliert` in `src/kern/werte.js`
+ Register `befehlsveraenderer` (`src/systeme/befehlsveraenderer.js`, aufgerufen am Haken `vor_befehl`), mitgeliefert: `ziel_verfehlen { chance }` für Verwirrung beim Befehl `faehigkeit` (das Ziel rutscht auf ein anderes Wesen daneben, ein Feld auf ein Nachbarfeld, eine Richtung um 45°, nur auf Ziele, die der Befehl zulässt) und `daneben_schlagen { chance }` für den Fehlschlag im Rausch beim Angriff durch Hineinlaufen (der Schlag trifft ein Nachbarfeld um 45° daneben, ein Wesen dort, Feind wie Verbündeter, oder ins Leere mit `insLeere`, siehe [Wesen.md](Wesen.md), Bewegung; Meldung `daneben_geschlagen`) und `abweichen { chance, freundeAngreifen? }` für Torkeln und Verwirrung: ein Schritt geht mit der Chance, skaliert mit der Stärke, auf ein zufälliges anderes freies Nachbarfeld (im Gang also zurück), gibt es keins, wie gewollt; ein Feind dort wird angegriffen, ein Verbündeter nur mit `freundeAngreifen`, sonst zählt sein Feld nicht als frei
+ `fraktionVon` und `kiVon` (`src/kern/zustand.js`) liefern die des jüngsten überlagernden Zustands, sonst die eigene
+ Beschwören und Verschwinden (`src/systeme/beschwoerung.js`): `beschwoeren { wesen, anzahl?, muster?, zustand?, dauer?, abstammung? }` erzeugt Wesen auf freien Feldern des Musters (Vorgabe angrenzend), mit der Fraktion der Urheberin und `beschworenVon`, eingereiht nach einer Aktion Wartezeit, mit dem Zustand (Quelle die Beschwörerin); `abstammung: true` teilt den EP-Topf der Quelle (siehe [Wesen.md](Wesen.md), Skills und Lernen); lebt die Urheberin nicht mehr (Auslöser an `nach_tod`), bekommen die Wesen ihre Fraktion, aber kein `beschworenVon`; Vorabprüfung `population_voll` an der Obergrenze, sonst `kein_freies_feld`, wenn kein Feld des Musters frei ist; `verschwinden` entfernt das Ziel ohne Tod, ohne `nach_tod` und ohne Hinterlassenschaft, nicht bei Ninkasi

Regeln:

+ Takt ist die Weltuhr: je Welttick wirkt `jeTick`, solange das Ende nicht erreicht ist; Hast und Verlangsamung der Trägerin ändern daran nichts (Vorbild DCSS: Hast hilft, Verlangsamung schadet)
+ Wurde der Zustand verlängert, reiht sich das Zeitereignis zum neuen Ende wieder ein, und der Verlauf beginnt neu
+ Verschiedene Zustände bestehen immer nebeneinander; die Stapelregel gilt nur für Anwendungen desselben Zustands
+ Modifikatoren gelten je Stärke 1 und skalieren mit Stärke und Verlauf zur Zeit der Abfrage: `plus` und `prozent` im Betrag, `mal` im Anteil über 100 (`mal 150` bei Stärke 50 % wird `mal 125`), Grenzen gar nicht; endet der Zustand, entfallen sie ohne Nachführen
+ `beimEnde` wirkt bei jedem Grund des Endes (aufräumen, z.B. `verschwinden`), `beimAblauf` nur beim Grund `abgelaufen`, nach `beimEnde`: die nächste Stufe einer Krankheit beginnt so nur nach Ablauf, wer die Vorstufe heilt, verhindert den Ausbruch
+ `jeTick`, `beimBeginn`, `beimEnde`, `beimAblauf` wirken auf die Trägerin mit Ursprung an ihrer Position, zugerechnet der Urheberin, Ursache `zustand`, Mittel `{ art: "zustand", name }`, Tags des Zustands; Mengen mit `mitStaerke: true` skalieren mit der Stärke (`werte.staerkeProzent`, 100 = Stärke 1)
+ `unterhalt` wird vor `jeTick` bezahlt, mit Modifikatoren auf `unterhalt.<wert>` und den Tags des Zustands; reicht ein Vorrat nicht, endet der Zustand mit dem Grund `unterhalt`
+ Handlungsunfähig: die Trägerin muss warten; bei Ninkasi wird jede Eingabe angenommen, aufgezeichnet, mit der Meldung `handlungsunfaehig` ("Leider nicht möglich") beantwortet und als warten ausgeführt, je Eingabe vergeht eine Aktion; eine Reise hält an
+ Befehlsveränderer wirken auf jeden Befehl der Trägerin, von Ninkasi wie von der KI; ein abgebrochener oder ungültig gewordener Befehl wird zu warten; aufgezeichnet wird der ursprüngliche Befehl
+ `ki` überlagert die KI (Furcht mit `fliehen`, Rausch mit `jagen` und `trifft: "wesen"`); bei Ninkasi übernimmt die KI für die Dauer, das Spiel wartet dann nicht auf Eingaben; nach dem Ende gilt von selbst wieder der ursprüngliche Stand, die eigene KI behält ihr Gedächtnis
+ Beispiel ganz als Daten: `beschworen: { gebundenAnQuelle: true, beimEnde: "verschwinden" }`, mit `dauer` auch eine Beschwörung auf Zeit (Vorbild Brogue: Geisterklingen verschwinden mit dem Goblin-Beschwörer)
+ Die Datenprüfung verfolgt Kreise auch über Zustände: ein Effekt, der einen Zustand setzt, dessen `beimBeginn` ihn wieder aufruft, ist ein Fehler; `jeTick` und `beimAblauf` wirken erst später und zählen nicht

## Kontrolle

Vorbilder: die abnehmende Wirkung wiederholter Kontrolle ("diminishing returns") in World of Warcraft, Betäubung als Aufschub der nächsten Aktion wie die Verzögerung in DCSS.

Daten:

+ Regelwerte `regeln.kontrolle: { stufen: [100, 50, 25], erholung: 1000 }`, vorläufig
+ Am Ziel: `kontrolle: { anzahl, ende }` zählt die Kontrollwirkungen in Folge, `ende` ist das späteste Ende der bisherigen; `aufschub` hält eine Betäubung fest, die das Ziel traf, während es selbst handelte
+ Zustände mit dem Tag `kontrolle` (Probeinhalt: `betaeubt`) laufen durch die abnehmende Kontrolle; der Tag `wehrlos` (`betaeubt`, später gefesselt und umgeworfen, nicht festgehalten) macht wehrlos

Schnittstellen:

+ `kontrollDauer(spiel, ziel, dauer)` (`src/systeme/zustaende.js`): die wirksame Dauer, 0 heißt immun (Meldung `kontrolle_immun`); `istWehrlos(spiel, wesen)`
+ Baustein `betaeuben { dauer, zustand }` (`src/systeme/betaeubung.js`) auf das Ziel; `akteurVerschieben(zustand, akteurId, verzoegerung)` in `src/kern/zeit.js`
+ Bedingung `gegenueber_wehrlos`

Regeln:

+ Die n-te Kontrollwirkung in Folge wirkt mit `stufen[n]` Prozent ihrer Dauer, jenseits der Liste gar nicht; ist nach `ende` die Zeit `erholung` ohne neue Kontrolle vergangen, beginnt die Folge neu; so hält niemand ein Wesen dauerhaft fest
+ Das gilt für jeden Zustand mit dem Tag `kontrolle` und einer Dauer, gleich ob ihn `zustand_setzen`, ein Auslöser oder die Betäubung setzt; eine Betäubung zählt einmal, nicht noch einmal über ihren Zustand
+ Betäubung: die wirksame Dauer schiebt den Eintrag des Ziels in der Warteschlange nach hinten, eine laufende lange Aktion bricht ab (Grund `betaeubt`); hat das Ziel gerade keinen Eintrag, weil es selbst handelt, kommt der Aufschub beim Wiedereinreihen dazu; der Zustand hält bis zu seinem nächsten Zug und zeigt die Restzeit an
+ Wehrlos: der Trefferwurf trifft sicher und wird nicht geblockt, aber ohne Krit, auch ohne Quelle (Falle); ein ahnungsloses Ziel bleibt beim Hinterhalt mit Krit (siehe [Wesen.md](Wesen.md), Kampfwerte); die Vorschau zeigt 100 %

## Zielauswahl

Vorbilder: Dungeon Crawl Stone Soup (Zielarten smite, bolt, beam, cone, explosion; Vorschau getrennt von der Wirkung), Tales of Maj'Eyal (Ziel als Tabelle mit Radius, Eigen- und Freundbeschuss als Datenfeld), Red Blob Games (Linien auf Gittern, Symmetrie, diagonale Wandecken).

Daten:

+ Zielmuster: `{ art, ...parameter }` aus dem Register `zielmuster`; mitgeliefert `selbst` (Ursprung), `feld` (Zielpunkt), `angrenzend`, `linie` (`laenge`), `strahl` (bis zum Hindernis, `laenge` freiwillig), `kreis` (`radius`), `kegel` (`laenge`, `oeffnung`); dazu `durchWaende: true`
+ Zielarten: `selbst`, `wesen` (per ID), `feld` (smite), `richtung` (`dx`, `dy`), `geschoss`; dazu `reichweite`, `brauchtSichtlinie` (Vorgabe ja), `muster`, `trifft`, `ohneUrheber`, `durchdringend`, `ueberZielHinaus`, `ueberVerbuendete` (das Geschoss fliegt über Verbündete der Akteurin hinweg)
+ `trifft` aus Sicht der Urheberin: `alle` (auch Gegenstände, Vorgabe), `wesen`, `feinde`, `verbuendete` (nach der Beziehung der Fraktionen, Neutrale sind keins von beiden, siehe [Wesen.md](Wesen.md), Fraktionen); `ohneUrheber: true` nimmt die Urheberin aus
+ Zielangabe `{ x, y }`, `{ id }` oder `{ dx, dy }`; Ursprung und Zielpunkt je Zielart: bei `selbst` die Akteurin, bei `wesen` und `feld` das Ziel selbst, bei `richtung` die Akteurin und das Feld daneben, bei `geschoss` der Aufschlag

Schnittstellen:

+ Geometrie (`src/welt/geometrie.js`), rein und ganzzahlig, ohne Winkelfunktionen: `linie` symmetrisch (gerechnet vom kleineren Endpunkt aus), `sichtlinieFrei` (kein undurchsichtiges Feld zwischen den Endpunkten), `flugbahn` (bis zum Ziel oder mit `ueberZielHinaus` bis zur Reichweite, endet an Feldern, die Geschosse nicht durchlassen (`geschossdurchlaessig`, siehe [Welt.md](Welt.md), Gelände), oder am ersten Wesen, außer `durchdringend`; Wesen, für die `ueberspringen(wesen)` wahr ist, werden überflogen), `kreis`, `kegel`
+ Register `zielmuster` (`(spiel, auswahl, parameter) => [{x, y}]` mit `auswahl = { ursprung, zielpunkt, quelleId }`, `src/systeme/zielauswahl.js`)
+ `zielAufloesen(spiel, akteur, zielart, zielangabe)` gibt Ursprung, Zielpunkt, Ziel, Bahn, Felder und Betroffene zurück oder den Grund der Ablehnung (`ungueltig`, `kein_ziel`, `nicht_sichtbar`, `zu_weit`, `keine_sichtlinie`); zugleich Vorschau für Zielmodus, Tooltip und KI
+ Bausteine mit Zielauswahl (`src/systeme/zielbausteine.js`), der innere Effekt teilt die Ablage:
  + `fuer_jedes_ziel`: `{ muster, effekt, trifft, ohneUrheber }` auf jede getroffene Entität im Muster
  + `auf_feld`: `{ muster, effekt }` auf jedes Feld, auch leere (Ziel null); Grundlage für Feldschichten
  + `geschoss`: `{ reichweite, effekt, durchdringend, ueberZielHinaus, ueberVerbuendete }` vom Ursprung zum Zielfeld, der Effekt wirkt am ersten Wesen oder am Aufschlag, dort liegen dann Ursprung und Zielfeld (z.B. Explosion mit `fuer_jedes_ziel`); durchdringend auf jedes Wesen der Bahn
  + `springen` (Kettenblitz): `{ anzahl, reichweite, effekt, trifft, ohneUrheber, wahl }` wirkt auf das Ziel und springt bis zu `anzahl` Mal zum nächsten noch nicht getroffenen lebenden Wesen im Kreis mit Sichtlinie (`wahl`: `naechstes` als Vorgabe oder `zufaellig`), `trifft` hier Vorgabe `wesen`; auch für springende Krankheit oder übergreifende Psi-Kontrolle
+ Nahkampf mit Muster: `muster` am Angriffsprofil vom Angreifer in Richtung des Ziels, z.B. Rundumschlag `{ art: "angrenzend" }`, Speer `{ art: "linie", laenge: 2 }`; jedes getroffene Wesen bekommt einen eigenen Trefferwurf (siehe [Wesen.md](Wesen.md), Kampfwerte), `trifft` am Profil Vorgabe `wesen`, der Angreifer nie selbst

Regeln:

+ Diagonale Wandecken großzügig: ein Diagonalschritt ist frei, wenn eine der beiden Seiten frei ist
+ Kreis: ein Feld gehört dazu, wenn `dx² + dy² <= r·(r+1)`; Radius 1 ist das volle 3x3, Radius 2 ein 5x5 ohne Ecken; Reichweiten werden ebenso gemessen
+ Kegel: Öffnung in Grad (30, 45, 60, 90 als Vorgabe, 120), geprüft über Skalar- und Kreuzprodukt mit einer Tabelle des Tangens in Tausendsteln; in allen acht Richtungen gespiegelt gleich
+ Linie und Strahl laufen vom Ursprung in Richtung Zielpunkt und enden an undurchsichtigen Feldern; Kreis, Kegel und angrenzend nur mit Sichtlinie vom Ursprung (keine Explosion um die Ecke), abschaltbar mit `durchWaende: true`; dichter Rauch hält die Sichtlinie auf (siehe [Welt.md](Welt.md), Feldschichten), also auch solche Muster
+ Feste Reihenfolge der Felder: nach Abstand zum Ursprung (`dx² + dy²`), dann nach Feldindex; je Feld die Entitäten nach ID
+ Eigenbeschuss ist möglich, solange die Daten nichts anderes sagen
+ `zielAufloesen` ändert nichts und würfelt nicht; für Ninkasi zählen nur Felder, die sie sieht
+ Gesehen, aber nicht zu treffen: eine symmetrische Linie für Sicht und Wurf, der Schattenwurf des Sichtfelds kann davon abweichen; nach dem Anspielen prüfen, ob Ersatzlinien (Brogue, DCSS) oder symmetrischer Schattenwurf nötig sind

## Fähigkeiten

Vorbilder: Tales of Maj'Eyal (aktive Talente mit Kosten und Abklingzeit, aufrechterhaltene mit gebundenem Vorrat), DCSS (Fehlschlag und Folgen eines Zaubers), Caves of Qud (Glimmer: geistige Macht lockt Jäger an).

Daten:

+ Fähigkeit (`datenproben/faehigkeiten.js`, umgesetzt in `src/systeme/faehigkeiten.js`): `{ text, art?, tags?, zweck?, verbrauch?, material?, zeit?, abklingzeit?, voraussetzungen?, ziel?, zielvorgabe?, wirkung?, zustand?, risiko?, skill?, anforderung?, ausbau?, dauer?, beimAbbruch?, ankuendigung?, unterbrechbar? }`; Wesen kennen eigene als Liste `faehigkeiten: ["name"]`, dazu gewährte aus angelegten Gegenständen (`ausruestung.faehigkeiten`, siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung) und Zuständen (`faehigkeiten`, siehe Zustände)
  + `art`: `aktiv` (Vorgabe) wirkt einmal; `aufrecht` setzt `zustand` an der Wirkenden, erneutes Benutzen beendet ihn ohne Kosten; den laufenden Preis trägt der Zustand als `unterhalt` (siehe Zustände)
  + `verbrauch: { mp, pp, pegel, ... }` aus den Vorräten; `material: [{ typ, anzahl }]` aus dem Inventar, wird verbraucht
  + `zeit`: Grundkosten, Vorgabe `aktionen.faehigkeit`; `ohneZeit: true` kostet keine Zeit (Sprint), nicht mit `dauer`
  + `zweck: [name]`: wozu die KI sie mit der Handlung `nutzen` wählt (siehe [Wesen.md](Wesen.md), KI)
  + `abklingzeit`: Zeiteinheiten Weltzeit ab dem Wirken (siehe [Architektur.md](Architektur.md), Zeitmodell); schnelles Handeln beschleunigt sie nicht; am Wesen `abklingendBis: { name: zeitpunkt }`, `zeitBisBereit(spiel, wesen, name)` sagt, wie lange noch
  + `voraussetzungen`: Bedingungen aus dem Register `modifikatorbedingungen`, z.B. `pegel_unter` (nüchtern), `pegel_ab`, `skill_ab`, `eigenschaft_ab`
  + `ziel`: Zielart wie in `zielAufloesen` (siehe Zielauswahl); `zielvorgabe` ("feind", "gefaehrte", "selbst") belegt den Cursor im Zielmodus vor (siehe [Bedienung.md](Bedienung.md), Zielmodus)
  + `wirkung`: benannter Effekt mit Ursache `faehigkeit` und Mittel `{ art: "faehigkeit", name }`
  + `skill: { name, stufe, risiko }`: verlangt einen Skill; fehlen Stufen, wird die Tabelle `risiko` über die fehlenden Stufen gewürfelt (Fundstück ohne passenden Skill, Vorbild DCSS)
  + `anforderung: { eigenschaften: { klugheit: 12 }, risiko }`: weiche Anforderung, die Tabelle wird über die Summe der fehlenden Punkte (wirksame Werte) gewürfelt
  + `ausbau: [{ wenn, aendert }]`: Ausbau durch Skills; zutreffende Einträge (Bedingungen an der Wirkenden, meist `skill_ab`) legen `aendert` in Datenreihenfolge flach über die Definition; `ausbau` und `art` lassen sich nicht ändern
  + `dauer: { schritte }`: lange Aktion (Ritual, Kanalisieren); `beimAbbruch`: Effekt auf die Wirkende beim Abbruch; `ankuendigung`: Textschlüssel für das Log; `unterbrechbar`: Liste aus `schaden` und `versetzt`, `true` heißt `["schaden"]` (siehe Lange Aktionen)
+ Risikotabellen (`datenproben/risiken.js`): `[{ name, chance, wirkt, effekt? }]`, die Chance jedes Ausgangs ist eine Kurve über x: bei `risiko` der Pegel der Wirkenden, bei `skill.risiko` die fehlenden Stufen, bei `anforderung.risiko` die fehlenden Punkte
+ Befehl `{ art: "faehigkeit", faehigkeit, ziel?: { x, y } | { id } | { dx, dy } }`
+ Baustein `faehigkeit_lehren { faehigkeit }`: nimmt die Fähigkeit dauerhaft in die eigene Liste des Ziels auf (Schriftrolle, HACCP-Aushang); nur an Wesen mit einer Liste `faehigkeiten`

Schnittstellen:

+ `faehigkeitenVon(spiel, wesen)`: alle Fähigkeiten, die das Wesen jetzt kennt, zuerst die eigenen, dann die gewährten, jede einmal; nie `wesen.faehigkeiten` direkt lesen, außer für die eigenen; `kenntFaehigkeit(spiel, wesen, name)`, `gewaehrteFaehigkeiten`, `herkunftDer(spiel, wesen, name)` (`{ eigen, quellen }` für die Anzeige)
+ Register `faehigkeitsquellen` (`(spiel, wesen) => [{ faehigkeit, quelle, gegenstandId? | zustand? }]`), angemeldet: `ausruestung` (Quelle `ausruestung:<id>`, `src/systeme/ausruestung.js`), `zustaende` (Quelle `zustand:<nummer>`, `src/systeme/zustaende.js`)

+ `faehigkeitFuer(spiel, wesen, name)` liefert die nach `ausbau` geltende Definition und wird überall benutzt, wo die Wirkende bekannt ist (Prüfen, Wirken, lange Aktion, Vorschau, KI, Anzeige)
+ Gründe der Ablehnung: `ungueltig`, `nicht_gelernt`, `abklingend`, `schon_ohne_zeit`, `voraussetzung`, `zu_wenig_<wert>`, `material_fehlt`, die der Zielauswahl und die der Vorabprüfung der Wirkung (`wirkungVorab` mit dem aufgelösten Ziel, z.B. `kein_freies_feld`); so verliert niemand einen Zug an eine Wirkung ohne Folge, auch die KI nicht
+ Modifikatoren mit den Tags der Fähigkeit: `verbrauch.<wert>` und `verbrauch.alle` auf den Verbrauch, `kosten.faehigkeit` und `kosten.alle` auf die Zeit (`kosten.*` bleibt der Zeit vorbehalten), `abklingzeit`
+ Meldungen: `faehigkeit`, `risiko` (mit `wegen`), `geschoss` bzw. `flaeche`, `verpufft`, `faehigkeit_gelernt`, `faehigkeit_schon_bekannt`, bei langen Aktionen `aktion_beginnt` (mit `faehigkeit`, `ankuendigung` und den Zielfeldern `felder`)
+ Lange Aktion der Art `faehigkeit` im Register `laufendeaktionen`; wann Gegner Fähigkeiten einsetzen, steht an ihrer KI (siehe [Wesen.md](Wesen.md), KI)

Regeln:

+ Ablauf: Verbrauch und Material bezahlen, Abklingzeit setzen, Meldung `faehigkeit`, Risiko würfeln, wirken; die Wirkung trifft mit `muster` jede betroffene Entität, bei durchdringendem Geschoss jedes Wesen der Bahn, sonst einmal das Ziel oder das Feld
+ Risiko: gewürfelt wird in der Reihenfolge Skill, Anforderung, Risiko, der erste Ausgang mit `wirkt: false` beendet; je Tabelle ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander, sind alle Chancen 0, wird nicht gewürfelt; der Modifikator `risiko.<ausgang>` verändert die Chance eines Ausgangs (Plus oder Prozent, nie unter 0, eine Chance 0 bleibt 0; `risikochance`), Hebel für Standfestigkeit und Selbstbeherrschung (siehe [Skills.md](Skills.md)); `wirkt: false` heißt, die Fähigkeit selbst wirkt nicht, der Verbrauch ist in jedem Fall bezahlt; `effekt` trifft die Wirkende (Ursache `risiko`)
+ Mit `dauer` wird am Anfang bezahlt, jeder Schritt kostet `zeit`, Risiko und Wirkung kommen nach dem letzten Schritt; das Ziel wird dann neu aufgelöst, passt es nicht mehr, verpufft die Wirkung; ist die Fähigkeit dann nicht mehr da (Quelle weggefallen), verpufft sie mit dem Grund `nicht_gelernt`
+ Gewährt: eine Fähigkeit gilt, solange ihre Quelle besteht; nur angelegte Gegenstände gewähren, aus dem Gepäck wirkt nichts; die Abklingzeit hängt an der Fähigkeit, Ablegen und Anlegen setzt sie nicht zurück; eine aufrechte Fähigkeit endet, sobald sie wegfällt (Zustandsprüfung `aufrecht_ohne_quelle`, Grund `entfernt`)
+ Gelehrt ist gelernt: `faehigkeit_lehren` nimmt eine Fähigkeit auch dann in die eigene Liste, wenn sie gerade gewährt ist, und sie bleibt nach dem Ablegen; nur eine schon eigene meldet `faehigkeit_schon_bekannt`, die Quelle ist dann verschwendet
+ Angekündigte Angriffe sind lange Aktionen mit `ankuendigung` und meist der Zielart `feld`: das Ziel ist das Feld beim Beginn, wer bis zum letzten Schritt das Muster verlässt, weicht aus; die Anzeige markiert die Felder, solange die Aktion läuft; der erste Schritt läuft sofort, `schritte: 3` lässt dem Ziel also zwei Züge
+ Vorläufige Tabelle `psi` über Ninkasis Skala: Fehlschlag nüchtern 30 %, bei 6 ‰ am seltensten (5 %), darüber wieder steigend; Rückschlag ab 12 ‰ bis 20 % bei 32 ‰ (Effekt `psi_rueckschlag`), Kontrollverlust ab 20 ‰ bis 10 % bei 32 ‰ (Effekt `psi_kontrollverlust`: Psi-Schaden und der Zustand `verwirrt`); dass Psi mit dem Pegel stärker wirkt, geht über Modifikatoren mit `pegel_ab` und dem Tag `psi`; Tabelle `magie`: verpatzt ab 8 ‰, 10 % bei 12 ‰, 25 % bei 20 ‰, 50 % bei 32 ‰, an Fähigkeiten der Magie mit `risiko: "magie"`; dazu `ohne_skill` (1 fehlende Stufe 25 %, 3: 60 %, 5: 85 %) und `anforderung` (1 fehlender Punkt 5 %, 10: 50 %), beide vorläufig
+ Der Rückschlag ist Psi-Schaden: Modifikatoren auf Schaden mit dem Tag `psi` (z.B. mit `pegel_ab`) verstärken auch ihn, gewollt; ein Skill kann ihn gezielt dämpfen (Selbstbeherrschung, siehe [Skills.md](Skills.md), Psi)
+ Ohne Zeit: die Wirkende kommt sofort wieder an die Reihe, ohne Zug und ohne neue letzte Aktion; zwischen zwei Aktionen mit Zeit ist höchstens eine ohne erlaubt (Merker `ohneZeitGenutzt`, siehe [Architektur.md](Architektur.md), Befehle); die Abklingzeit begrenzt sie zusätzlich
+ Nach dem Bezahlen und vor Risiko und Wirkung löst jede Fähigkeit den Haken `faehigkeit_gewirkt` aus (mit `faehigkeit`, den Tags und dem bezahlten `verbrauch`), auch wenn sie danach fehlschlägt: gewirkt ist, was bezahlt ist; daran hängt der Glimmer (siehe [Wesen.md](Wesen.md), Glimmer)

## Lange Aktionen

Vorbild: die "Delays" in DCSS, mehrschrittige Aktionen mit festen Gründen zur Unterbrechung.

Daten:

+ Komponente an der Akteurin: `laufendeAktion: { art, schritteGesamt, schritteErledigt, unterbrochen, lage, unterbrechbar?, ...Daten der Art }`; `unterbrochen` ist null oder der Grund
+ Regelwert `regeln.laufendeAktionen.unterbrechen` (Vorgabe `gegner_in_sicht`, `schaden`): Gefahrenprüfungen vor jedem automatischen Schritt Ninkasis
+ `unterbrechbar`: Gründe, die die Aktion jedes Wesens sofort abbrechen (`UNTERBRECHUNGSGRUENDE`): `schaden` (Haken `nach_schaden`) und `versetzt` (von einer anderen Urheberin gestoßen, gezogen, getauscht oder teleportiert, siehe [Wesen.md](Wesen.md), Bewegung)

Schnittstellen (`src/systeme/laufendeAktionen.js`):

+ Register `laufendeaktionen`: Art → `{ schrittkosten(spiel, akteur, aktion), abschliessen(spiel, akteur, aktion), abbrechen(spiel, akteur, aktion, grund) }`; mitgeliefert ist `faehigkeit` (Fähigkeiten mit `dauer`)
+ Befehl `fortsetzen` (Leertaste); Meldungen `aktion_beginnt`, `aktion_unterbrochen`, `aktion_abgebrochen` (mit Grund, z.B. `befehl`)
+ `laufendeAktionVorDemZug` und `aktionAbbrechen`, aufgerufen aus `src/kern/spiel.js`

Regeln:

+ Rituale, Kanalisieren und später das Brauen laufen in der Logik, weil sie einen Fortschritt und Folgen beim Abbruch haben; Rasten und Auto-Erkunden sind dagegen Abläufe der Eingabe aus gewöhnlichen Befehlen (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden)
+ Der startende Befehl führt den ersten Schritt aus; ist die Akteurin wieder dran, führt die Logik den nächsten Schritt selbst aus (Befehl `fortsetzen`, nicht aufgezeichnet, das Nachspielen ergibt ihn wieder); aufgezeichnet wird nur, was die Spielerin eingibt
+ Trifft vor einem automatischen Schritt Ninkasis eine Gefahrenprüfung gegen die Lage beim letzten Schritt zu, pausiert die Aktion und Ninkasi wird gefragt; die Liste steht in den Regeln, nicht in den Einstellungen, weil sie das Nachspielen bestimmt
+ `fortsetzen` macht weiter, jeder andere Befehl bricht ab; bezahlte Kosten bleiben bezahlt, `abbrechen` der Art wirkt (bei Fähigkeiten `beimAbbruch`); Handlungsunfähigkeit und Betäubung (Grund `betaeubt`, siehe Kontrolle) brechen ebenfalls ab
+ Gegner mit langer Aktion führen ihre Schritte ohne Gefahrenprüfung aus
+ Bei Fähigkeiten kommt `unterbrechbar` aus deren Daten, so legt jede Fähigkeit und später jedes Rezept selbst fest, wie störanfällig es ist

## Tod und Zustandsprüfung

Vorbild sind die "state-based actions" von Magic: The Gathering: Getötet wird nicht mitten in einer Wirkung, sondern an festen Punkten.

Daten:

+ Lebenswert als Datenfeld am Wesen (`lebenswert`, Vorgabe `lp`, `lebenswertName` in `src/kern/werte.js`), z.B. der Zusammenhalt eines Biofilms
+ Hinterlassenschaft: `beimTod: { inventar: "fallen_lassen" }` (Vorgabe, aufs Feld des Wesens) oder `"vernichten"` (`HINTERLASSENSCHAFT_REGELN`)
+ `letzterVerlust` am Wesen: Ursprung des letzten Verlusts am Lebenswert (`urheberId`, `ursache`, `mittel`)

Schnittstellen:

+ `vorgangAbschliessen(spiel)` (`src/kern/vorgang.js`) nach jedem Vorgang (ausgeführter Befehl, Handler der Weltuhr, Zeitereignis): abwechselnd alle Zustandsprüfungen und der nächste vorgemerkte Auslöser, bis nichts mehr ansteht; mehr als 100000 Durchläufe werfen
+ Register `zustandspruefungen` (`(spiel) => true`, wenn etwas verändert wurde), in dieser Reihenfolge: `tod` (`src/systeme/tod.js`), `lage` (siehe [Wesen.md](Wesen.md), Bewegung), `aufrecht_ohne_quelle` (siehe Fähigkeiten), `kaputt` (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß); später z.B. der Filmriss
+ Haken `vor_tod` und `nach_tod` (mit der letzten Position), Meldung `tod` mit Urheberin, Ursache und Mittel aus `letzterVerlust`; am `vor_tod` hängen die Ersatzwirkungen (siehe dort) und als letzte die Allmacht, die Ninkasi im allmächtigen Lauf bewahrt (siehe [Architektur.md](Architektur.md), Spielarten)

Regeln:

+ Geprüft wird nur, was vorgemerkt ist (siehe [Architektur.md](Architektur.md), Leistung): beim Tod Entitäten, bei denen ein Wert über `wertAendern` auf 0 gefallen ist, bei der Lage versetzte Wesen und solche mit geänderten Zuständen, bei kaputt Gegenstände, deren Haltbarkeit auf 0 gefallen ist; im Spiel läuft jede Änderung eines Werts über `wertAendern`, auch in Tests
+ Folge: Eine Flächenwirkung trifft alle Ziele, auch wenn das erste schon tot ist; mehrere Tode im selben Vorgang laufen nach Entitäts-ID
+ Es stirbt, wessen Lebenswert bei 0 liegt
+ Ablauf je Wesen: `vor_tod` (Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt, sonst stirbt es trotzdem), Meldung `tod`, `nach_tod`, Hinterlassenschaft, Entfernen
+ Entfernen nimmt den Akteur, gebundene Zeitereignisse und alles Getragene mit; Getragenes verschwindet aus dem Inventar der Trägerin
+ Stirbt Ninkasi, ist das Spiel vorbei (`vorbei`); sie bleibt im Zustand (Anzeige, später Todesbericht), noch vorgemerkte Auslöser verfallen

## Tests

+ `tests/werte.test.js` und `tests/modifikatoren.test.js` (Verrechnung, Quellen, Bedingungen, Auren), `tests/ausloeser.test.js` (Kaskade, Ketten, Dämpfung), `tests/zustaende.test.js` (Stapelregeln, Verlauf, Unterhalt, Überlagerung), `tests/beschwoerung.test.js`, `tests/zielauswahl.test.js`, `tests/zielbausteine.test.js` und `tests/geometrie.test.js` (Muster, Linien, Kreis, Kegel), `tests/faehigkeiten.test.js` (Verbrauch, Risiko, Ausbau, gewährte und gelehrte Fähigkeiten), `tests/laufendeAktionen.test.js`, `tests/tod.test.js`, `tests/ersatz.test.js` (Barriere, Phönix, Kaskade, Verbrauch), `tests/verhalten.test.js` (Befehlsveränderer), `tests/zeitskala.test.js` (ohne Zeit, Kontrolle, Betäubung, wehrlos)

## Verweise

+ Spieldesign der Fähigkeiten, des Pegels und des Brauens: [Grundlagen.md](Grundlagen.md); Skills, die Fähigkeiten ausbauen: [Charakter.md](Charakter.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 8 (u.a. `zug_beginn`, Ladungen als Verbrauch, Lesen mit Ziel); erster Auslöser im Inhalt in Punkt 14

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
