# Battle Ninkasi - Wirkungen

Stand: 2026-11-21

Zuständig für: `src/kern/effekte.js`, `src/kern/bausteine.js`, `src/kern/ausloeser.js`, `src/kern/vorgang.js`, `src/kern/werte.js`, `src/systeme/modifikatoren.js`, `src/systeme/zustaende.js`, `src/systeme/befehlsveraenderer.js`, `src/systeme/beschwoerung.js`, `src/systeme/zielauswahl.js`, `src/systeme/zielbausteine.js`, `src/systeme/faehigkeiten.js`, `src/systeme/laufendeAktionen.js`, `src/systeme/tod.js`, `src/welt/geometrie.js`, `daten/effekte.js`, `daten/zustaende.js`, `daten/faehigkeiten.js`, `daten/risiken.js`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md), [Wesen.md](Wesen.md), [Gegenstaende.md](Gegenstaende.md), [Grundlagen.md](Grundlagen.md)

## Zweck

Wie Skills, Gegenstände, Zustände und Fähigkeiten wirken: die sechs Wirkungsarten, das Effektsystem aus Bausteinen, Modifikatoren, Auslöser, Zustände, Zielauswahl, Fähigkeiten, lange Aktionen und der Tod als Zustandsprüfung. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Wirkungsarten

Skills, Items, Zustände und Fähigkeiten wirken über sechs Arten, die frei kombinierbar sind:

1. Modifikatoren ändern Zahlen, z.B. "Braupaddel der Geschwindigkeit: Angriff kostet 33% weniger Zeit", "Skill: Bewegung 5% schneller"; siehe Modifikatoren
2. Auslöser-Effekte reagieren auf Ereignisse, z.B. "bei Angriff, 15% Chance, weiterer Angriff", "beim Tod Sporen freisetzen"; siehe Auslöser
3. Aktionsveränderer ändern, wie eine Aktion abläuft: Zielmuster, Reichweite, Fläche; z.B. "Braupaddel des Rundumschlags trifft alle angrenzenden Felder", "Speer trifft zwei Felder in Linie"; Zielmuster sind Daten (`muster: { art: "angrenzend" }`, `muster: { art: "linie", laenge: 2 }`), siehe Zielauswahl
4. Zustände sind zeitlich begrenzt, mit Verlauf (gleichbleibend, abklingend, ansteigend) und Stapelregel (erneuern, aufaddieren, nur der stärkste, einzeln); sie bündeln selbst Modifikatoren und Auslöser; z.B. Schaden über Zeit, abklingender Segen, sich steigernde Vergiftung; siehe Zustände
5. Auren wirken auf andere im Umkreis der Trägerin, z.B. "Gegner in der Nähe langsamer", "Hefen in der Nähe sprossen schneller"; siehe Modifikatoren
6. Gewährte Aktionen schalten eine neue Aktion frei, z.B. "Braupaddel erlaubt Ansturm"; siehe Fähigkeiten

Jede Wirkungsart kann zusätzlich Bedingungen tragen (nur ab Pegel X, nur gegen Bakterien, nur unter 30 % LP, nur mit zwei Kupfer-Items: Sets, Synergien) und Nachteile (negative Werte, z.B. für verfluchte Items). Jeder Modifikator kennt seine Quelle (Skill, Item, Zustand, Pegel); entfällt die Quelle, entfallen genau ihre Modifikatoren.

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
+ `bausteinAnmelden(name, parameterBeschreibung, funktion, { brauchtZiel })`: Funktion `(spiel, kontext, parameter) => void` im Register `bausteine`
+ Grundbausteine, nach Datei (beschrieben im jeweiligen Dokument):
  + `src/kern/bausteine.js`: `schaden`, `heilen`, `wert_aendern`
  + `src/systeme/zielbausteine.js`: `fuer_jedes_ziel`, `auf_feld`, `geschoss`, `springen` (siehe Zielauswahl)
  + `src/systeme/zustaende.js`: `zustand_setzen`, `zustand_entfernen`; `src/systeme/beschwoerung.js`: `beschwoeren`, `verschwinden` (siehe Zustände)
  + `src/systeme/kampf.js`: `trefferwurf`, `angreifen` (siehe [Wesen.md](Wesen.md), Kampfwerte); `src/systeme/verschieben.js`: `stossen`, `ziehen`, `tauschen`, `teleportieren` (siehe [Wesen.md](Wesen.md), Bewegung); `src/systeme/wahrnehmung.js`: `laerm`; `src/systeme/fraktionen.js`: `ruf_aendern` (siehe [Wesen.md](Wesen.md), Fraktionen); `src/systeme/skills.js`: `eigenschaft_aendern`, `skill_freischalten`
  + `src/systeme/gelaende.js`: `gelaende_setzen`, `gelaende_zerstoeren`; `src/systeme/schichten.js`: `oberflaeche_setzen`, `gas_setzen`, `entzuenden` (siehe [Welt.md](Welt.md))
  + `src/systeme/verschleiss.js`: `abnutzen`; `src/systeme/ausruestung.js`: `fluch_aufheben` (siehe [Gegenstaende.md](Gegenstaende.md))
+ Baustein `angreifen { profil? }`: die Quelle greift das Ziel mit ihren Angriffsprofilen an wie bei einer Angriffsaktion, ohne Zeitkosten, mit `profil` nur dieses eine; nur gegen ein Ziel daneben; für Konter aus Auslösern, z.B. `{ bei: "verfehlt", rolle: "ziel", ziel: "quelle", effekt: "konter" }`; die Angriffe laufen auf der Kettentiefe des Effekts, gegenseitige Konter enden so an der Kettengrenze

Regeln:

+ Grundbausteine sind wenige Dutzend kleine, stabile Funktionen; ein neuer ist nur für eine wirklich neue Mechanik nötig
+ Was sich nicht aus Bausteinen zusammensetzen lässt (KI-Muster wie Zweiteilung, Sprossung, Myzelwachstum, Phagen-Befall, Bossphasen), wird ein benanntes Verhaltensmodul; die Daten verweisen nur darauf, z.B. `ki: "sprossung"` mit Parametern; Bausteine, Verhaltensmodule und Zielmuster stehen in Registern, auch für Mods (siehe [Architektur.md](Architektur.md), Register)
+ Bausteine erklären, ob sie ein Wesen brauchen (`brauchtZiel`); ein Schritt ohne Ziel (bei `auf: "quelle"` ohne Quelle) wird übersprungen, der Effekt läuft weiter
+ Bausteine beschreiben ihre Parameter für die Datenprüfung: `text`, `ganzzahl`, `wahrheitswert`, `effekt`, `muster` und weitere, mit `?` freiwillig, eine Liste nennt die erlaubten Werte; benannte Effekte dürfen sich nicht im Kreis aufrufen, auch nicht über Zustände
+ Getötet wird im Effekt nie: fällt der Lebenswert auf 0, stirbt das Wesen in der Zustandsprüfung nach dem Vorgang (siehe Tod und Zustandsprüfung)

## Modifikatoren

Daten:

+ Modifikator: `{ ziel, art, betrag, quelle, tag?, wenn? }`, z.B. `{ ziel: "kosten.bewegen", art: "prozent", betrag: -5 }`
+ Ziele sind Namen wie `lp`, `genauigkeit`, `ausweichen`, `ruestung`, `ruestung.<art>`, `widerstand`, `schaden`, `kritfaktor` (siehe [Wesen.md](Wesen.md), Kampfwerte), `reichweiteSicht`, `kosten.<aktion>`, `kosten.alle`, `verbrauch.<wert>`, `verbrauch.alle`, `abklingzeit`, `unterhalt.<wert>` (siehe Fähigkeiten), `regeneration.<wert>`, `schwund.<wert>`, `kurvenverschiebung.<wert>`, `abbau.pegel` (siehe [Wesen.md](Wesen.md), Stoffwechsel), `eigenschaft.<name>` (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Arten (`MODIFIKATORARTEN` in `src/kern/werte.js`): `plus`, `prozent`, `mal` (Betrag in Prozent, `150` heißt x1,5), `mindestens`, `hoechstens`, `setzen` (zählt als `mindestens` und `hoechstens` mit demselben Betrag); alle Beträge ganzzahlig
+ Bedingungen: `wenn: [{ bedingung, ...parameter }]`, alle müssen gelten
+ Auren: `auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen

Schnittstellen:

+ `modifiziert(spiel, entitaet, ziele, basiswert, umstaende?)` sammelt bei jeder Abfrage aus allen Quellen in der Reihenfolge der Anmeldung; `verrechnet(basiswert, modifikatoren)`; `modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende?)` liefert die wirksamen Modifikatoren mit ihrer Quelle für Erklärungen in der Oberfläche; `hoechstwert(spiel, entitaet, wertName)`
+ Umstände: `{ gegenueberId?, tags? }`; der Trefferwurf gibt für Genauigkeit und Verteidigung das Gegenüber und die Tags von Angriff und Effekt mit, die Schadensrechnung dazu die Schadensart, `zeitkosten` reicht Umstände durch
+ Register `modifikatorquellen` (`(spiel, entitaet) => [modifikator]`), mitgeliefert: `eigene` (die Liste `entitaet.modifikatoren`, gepflegt mit `modifikatorHinzufuegen` und `modifikatorenEntfernen` je Quelle), `auren` (Quelle `aura:<id>` bzw. `aura:zustand:<nummer>`), `zustaende` (Quelle `zustand:<nummer>`, siehe Zustände), `ausruestung` (siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung), `skills` (Quelle `skill:<name>`) und `anforderungen` (Abzüge für nicht erfüllte Anforderungen angelegter Gegenstände, Quelle `anforderung:<id>`, beide siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Register `modifikatorbedingungen` (`(spiel, entitaet, parameter, umstaende) => boolean`, Parameter für die Datenprüfung wie bei den Bausteinen, `src/systeme/modifikatoren.js`), mitgeliefert: `pegel_ab { wert }`, `pegel_unter { wert }` (z.B. nüchtern), `wert_unter_prozent { wert, prozent }` (gemessen am Grundwert ohne Modifikatoren), `gegenueber_tag { tag }`, `gegenueber_ahnungslos` (Hinterhalt, siehe [Wesen.md](Wesen.md), Wahrnehmung), `hat_zustand { zustand }`, `ohne_zustand { zustand }`, `hat_tag { tag }`, `ohne_tag { tag }`, `traegt_tag { tag, anzahl? }` (Sets aus angelegten Gegenständen), `skill_ab { skill, stufe }`, `eigenschaft_ab { eigenschaft, wert }`, `eigenschaft_unter { eigenschaft, wert }`
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
+ Ersatzwirkungen aus Daten ("Phönixbier verhindert einmal den Tod") sind ein eigener Typ, da sie sofort wirken müssen; Entwurf in [Systemausbau.md](Systemausbau.md)

## Zustände

Daten:

+ Zustand (`daten/zustaende.js`, mit Vorlagen): `{ text, tags, dauer, stapel, hoechstStapel, verlauf, modifikatoren, auren, jeTick, beimBeginn, beimEnde, ausloeser, gebundenAnQuelle, unterhalt, handlungsunfaehig, befehl, ki, fraktion }`
  + `dauer` in Zeiteinheiten, ohne Angabe unbegrenzt bis zum Entfernen
  + `stapel`: `erneuern` (Vorgabe: eine Instanz, höhere Stärke, längere Dauer), `aufaddieren` (Stärken addiert bis `hoechstStapel` Anwendungen, Dauer erneuert), `staerkster` (nur eine mindestens gleich starke Anwendung ersetzt, sonst nichts), `einzeln` (eigene Instanzen mit eigenem Ende, höchstens `hoechstStapel`)
  + `verlauf`: `gleichbleibend` (Vorgabe), `abklingend`, `ansteigend` oder eine eigene Kurve `[[anteilProzent, staerkeProzent], ...]` über den Anteil der verstrichenen Dauer
  + `unterhalt: { mp: 2 }` kostet die Trägerin je Welttick (aufrechterhaltene Zauber); `gebundenAnQuelle: true` endet mit dem Tod oder Verschwinden der Quelle
  + `handlungsunfaehig: true` (Betäubung, Lähmung, Filmriss); `befehl: { veraenderer, ...parameter }`; `ki: { modul, ...parameter }`; `fraktion`: `"urheber"` (Psi-Kontrolle), `"eigene"` (Zwietracht, mit allen verfeindet) oder ein Fraktionsname
+ Instanzen an der Entität: `zustaende: [{ nummer, name, quelleId, urheberId, urheberFraktion, beginn, ende, staerke, stapel }]`; die Nummer zählt `naechsteZustandsnummer` im Zustand des Spiels hoch; `staerke` Vorgabe 1; Fraktion und KI werden beim Beginn in die Instanz geschrieben

Schnittstellen:

+ Bausteine `zustand_setzen { zustand, dauer?, staerke? }` und `zustand_entfernen { zustand?, tag? }` auf das Ziel
+ Haken `zustand_beginnt` und `zustand_endet` (mit `grund`: `abgelaufen`, `entfernt`, `quelle_tot`, `unterhalt`), Meldungen gleichen Namens
+ Zeitereignis `zustand_ende`, gebunden an die Trägerin; Modifikatorquelle `zustaende`; `modifikatorSkaliert` in `src/kern/werte.js`
+ Register `befehlsveraenderer` (`src/systeme/befehlsveraenderer.js`, aufgerufen am Haken `vor_befehl`), mitgeliefert: `ziel_verfehlen { chance }` für Verwirrung beim Befehl `faehigkeit` (das Ziel rutscht auf ein anderes Wesen daneben, ein Feld auf ein Nachbarfeld, eine Richtung um 45°, nur auf Ziele, die der Befehl zulässt) und `abweichen { chance, freundeAngreifen? }` für Torkeln und Verwirrung: ein Schritt geht mit der Chance, skaliert mit der Stärke, auf ein zufälliges anderes freies Nachbarfeld (im Gang also zurück), gibt es keins, wie gewollt; ein Feind dort wird angegriffen, ein Verbündeter nur mit `freundeAngreifen`, sonst zählt sein Feld nicht als frei
+ `fraktionVon` und `kiVon` (`src/kern/zustand.js`) liefern die des jüngsten überlagernden Zustands, sonst die eigene
+ Beschwören und Verschwinden (`src/systeme/beschwoerung.js`): `beschwoeren { wesen, anzahl?, muster?, zustand?, dauer?, abstammung? }` erzeugt Wesen auf freien Feldern des Musters (Vorgabe angrenzend), mit der Fraktion der Urheberin und `beschworenVon`, eingereiht nach einer Aktion Wartezeit, mit dem Zustand (Quelle die Beschwörerin); `abstammung: true` teilt den EP-Topf der Quelle (siehe [Wesen.md](Wesen.md), Skills und Lernen); `verschwinden` entfernt das Ziel ohne Tod, ohne `nach_tod` und ohne Hinterlassenschaft, nicht bei Ninkasi

Regeln:

+ Takt ist die Weltuhr: je Welttick wirkt `jeTick`, solange das Ende nicht erreicht ist; Hast und Verlangsamung der Trägerin ändern daran nichts (Vorbild DCSS: Hast hilft, Verlangsamung schadet)
+ Wurde der Zustand verlängert, reiht sich das Zeitereignis zum neuen Ende wieder ein, und der Verlauf beginnt neu
+ Verschiedene Zustände bestehen immer nebeneinander; die Stapelregel gilt nur für Anwendungen desselben Zustands
+ Modifikatoren gelten je Stärke 1 und skalieren mit Stärke und Verlauf zur Zeit der Abfrage: `plus` und `prozent` im Betrag, `mal` im Anteil über 100 (`mal 150` bei Stärke 50 % wird `mal 125`), Grenzen gar nicht; endet der Zustand, entfallen sie ohne Nachführen
+ `jeTick`, `beimBeginn`, `beimEnde` wirken auf die Trägerin mit Ursprung an ihrer Position, zugerechnet der Urheberin, Ursache `zustand`, Mittel `{ art: "zustand", name }`, Tags des Zustands; Mengen mit `mitStaerke: true` skalieren mit der Stärke (`werte.staerkeProzent`, 100 = Stärke 1)
+ `unterhalt` wird vor `jeTick` bezahlt, mit Modifikatoren auf `unterhalt.<wert>` und den Tags des Zustands; reicht ein Vorrat nicht, endet der Zustand mit dem Grund `unterhalt`
+ Handlungsunfähig: die Trägerin muss warten; bei Ninkasi wird jede Eingabe angenommen, aufgezeichnet, mit der Meldung `handlungsunfaehig` ("Leider nicht möglich") beantwortet und als warten ausgeführt, je Eingabe vergeht eine Aktion; eine Reise hält an
+ Befehlsveränderer wirken auf jeden Befehl der Trägerin, von Ninkasi wie von der KI; ein abgebrochener oder ungültig gewordener Befehl wird zu warten; aufgezeichnet wird der ursprüngliche Befehl
+ `ki` überlagert die KI (Furcht mit `fliehen`, Rausch mit `jagen` und `trifft: "wesen"`); bei Ninkasi übernimmt die KI für die Dauer, das Spiel wartet dann nicht auf Eingaben; nach dem Ende gilt von selbst wieder der ursprüngliche Stand, die eigene KI behält ihr Gedächtnis
+ Beispiel ganz als Daten: `beschworen: { gebundenAnQuelle: true, beimEnde: "verschwinden" }`, mit `dauer` auch eine Beschwörung auf Zeit (Vorbild Brogue: Geisterklingen verschwinden mit dem Goblin-Beschwörer)
+ Die Datenprüfung verfolgt Kreise auch über Zustände: ein Effekt, der einen Zustand setzt, dessen `beimBeginn` ihn wieder aufruft, ist ein Fehler
+ Im Spielinhalt bisher nur der vorläufige `testzustand` (Ausweichen -2 für 5 Züge), den Ninkasis `testfaehigkeit` bei einem Treffer setzt, damit die Anzeige der Zustände etwas zeigt

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

+ Fähigkeit (`daten/faehigkeiten.js`, umgesetzt in `src/systeme/faehigkeiten.js`): `{ text, art?, tags?, zweck?, verbrauch?, material?, zeit?, abklingzeit?, voraussetzungen?, ziel?, zielvorgabe?, wirkung?, zustand?, risiko?, skill?, anforderung?, ausbau?, dauer?, beimAbbruch?, ankuendigung?, unterbrechbar? }`; Wesen kennen sie als Liste `faehigkeiten: ["name"]`
  + `art`: `aktiv` (Vorgabe) wirkt einmal; `aufrecht` setzt `zustand` an der Wirkenden, erneutes Benutzen beendet ihn ohne Kosten; den laufenden Preis trägt der Zustand als `unterhalt` (siehe Zustände)
  + `verbrauch: { mp, pp, pegel, ... }` aus den Vorräten; `material: [{ typ, anzahl }]` aus dem Inventar, wird verbraucht
  + `zeit`: Grundkosten, Vorgabe `aktionen.faehigkeit`
  + `zweck: [name]`: wozu die KI sie mit der Handlung `nutzen` wählt (siehe [Wesen.md](Wesen.md), KI)
  + `abklingzeit`: eigene Züge der Wirkenden (Zugzähler, siehe [Architektur.md](Architektur.md), Zeitmodell); am Wesen `abklingendBis: { name: zugnummer }`
  + `voraussetzungen`: Bedingungen aus dem Register `modifikatorbedingungen`, z.B. `pegel_unter` (nüchtern), `pegel_ab`, `skill_ab`, `eigenschaft_ab`
  + `ziel`: Zielart wie in `zielAufloesen` (siehe Zielauswahl); `zielvorgabe` ("feind", "gefaehrte", "selbst") belegt den Cursor im Zielmodus vor (siehe [Bedienung.md](Bedienung.md), Zielmodus)
  + `wirkung`: benannter Effekt mit Ursache `faehigkeit` und Mittel `{ art: "faehigkeit", name }`
  + `skill: { name, stufe, risiko }`: verlangt einen Skill; fehlen Stufen, wird die Tabelle `risiko` über die fehlenden Stufen gewürfelt (Fundstück ohne passenden Skill, Vorbild DCSS)
  + `anforderung: { eigenschaften: { klugheit: 12 }, risiko }`: weiche Anforderung, die Tabelle wird über die Summe der fehlenden Punkte (wirksame Werte) gewürfelt
  + `ausbau: [{ wenn, aendert }]`: Ausbau durch Skills; zutreffende Einträge (Bedingungen an der Wirkenden, meist `skill_ab`) legen `aendert` in Datenreihenfolge flach über die Definition; `ausbau` und `art` lassen sich nicht ändern
  + `dauer: { schritte }`: lange Aktion (Ritual, Kanalisieren); `beimAbbruch`: Effekt auf die Wirkende beim Abbruch; `ankuendigung`: Textschlüssel für das Log; `unterbrechbar`: Liste aus `schaden` und `versetzt`, `true` heißt `["schaden"]` (siehe Lange Aktionen)
+ Risikotabellen (`daten/risiken.js`): `[{ name, chance, wirkt, effekt? }]`, die Chance jedes Ausgangs ist eine Kurve über x: bei `risiko` der Pegel der Wirkenden, bei `skill.risiko` die fehlenden Stufen, bei `anforderung.risiko` die fehlenden Punkte
+ Befehl `{ art: "faehigkeit", faehigkeit, ziel?: { x, y } | { id } | { dx, dy } }`

Schnittstellen:

+ `faehigkeitFuer(spiel, wesen, name)` liefert die nach `ausbau` geltende Definition und wird überall benutzt, wo die Wirkende bekannt ist (Prüfen, Wirken, lange Aktion, Vorschau, KI, Anzeige)
+ Gründe der Ablehnung: `ungueltig`, `nicht_gelernt`, `abklingend`, `voraussetzung`, `zu_wenig_<wert>`, `material_fehlt` und die der Zielauswahl
+ Modifikatoren mit den Tags der Fähigkeit: `verbrauch.<wert>` und `verbrauch.alle` auf den Verbrauch, `kosten.faehigkeit` und `kosten.alle` auf die Zeit (`kosten.*` bleibt der Zeit vorbehalten), `abklingzeit`
+ Meldungen: `faehigkeit`, `risiko` (mit `wegen`), `geschoss` bzw. `flaeche`, `verpufft`, bei langen Aktionen `aktion_beginnt` (mit `faehigkeit`, `ankuendigung` und den Zielfeldern `felder`)
+ Lange Aktion der Art `faehigkeit` im Register `laufendeaktionen`; wann Gegner Fähigkeiten einsetzen, steht an ihrer KI (siehe [Wesen.md](Wesen.md), KI)

Regeln:

+ Ablauf: Verbrauch und Material bezahlen, Abklingzeit setzen, Meldung `faehigkeit`, Risiko würfeln, wirken; die Wirkung trifft mit `muster` jede betroffene Entität, bei durchdringendem Geschoss jedes Wesen der Bahn, sonst einmal das Ziel oder das Feld
+ Risiko: gewürfelt wird in der Reihenfolge Skill, Anforderung, Risiko, der erste Ausgang mit `wirkt: false` beendet; je Tabelle ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander, sind alle Chancen 0, wird nicht gewürfelt; `wirkt: false` heißt, die Fähigkeit selbst wirkt nicht, der Verbrauch ist in jedem Fall bezahlt; `effekt` trifft die Wirkende (Ursache `risiko`)
+ Mit `dauer` wird am Anfang bezahlt, jeder Schritt kostet `zeit`, Risiko und Wirkung kommen nach dem letzten Schritt; das Ziel wird dann neu aufgelöst, passt es nicht mehr, verpufft die Wirkung
+ Angekündigte Angriffe sind lange Aktionen mit `ankuendigung` und meist der Zielart `feld`: das Ziel ist das Feld beim Beginn, wer bis zum letzten Schritt das Muster verlässt, weicht aus; die Anzeige markiert die Felder, solange die Aktion läuft; der erste Schritt läuft sofort, `schritte: 3` lässt dem Ziel also zwei Züge
+ Vorläufige Tabelle `psi`: Fehlschlag nüchtern 30 %, bei 1,5 ‰ am seltensten (5 %), darüber wieder steigend; Rückschlag ab 3 ‰ bis 20 % bei 8 ‰ (Effekt `psi_rueckschlag`); dass Psi mit dem Pegel stärker wirkt, geht über Modifikatoren mit `pegel_ab` und dem Tag `psi`; dazu `ohne_skill` (1 fehlende Stufe 25 %, 3: 60 %, 5: 85 %) und `anforderung` (1 fehlender Punkt 5 %, 10: 50 %), beide vorläufig
+ Glimmer (Psi lockt Gegner an) wäre ein Wert `glimmer`, den Psi-Fähigkeiten über `wert_aendern` erhöhen; seine Folgen sind Spieldesign ([Grundlagen.md](Grundlagen.md))
+ Im Spielinhalt bisher die beiden Fähigkeiten des Testgegners `fernkaempfer_test` (Säurespucke, Säureschwall) und die vorläufige `testfaehigkeit` Ninkasis (Kreis mit Radius 1 auf ein Feld bis 6 weit, 10 MP, Trefferwurf je Wesen, sie selbst bleibt verschont), damit sich der Zielmodus ausprobieren lässt; eigentliche Fähigkeiten für Ninkasi folgen nach dem Systemausbau

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
+ `fortsetzen` macht weiter, jeder andere Befehl bricht ab; bezahlte Kosten bleiben bezahlt, `abbrechen` der Art wirkt (bei Fähigkeiten `beimAbbruch`); Handlungsunfähigkeit bricht ebenfalls ab
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
+ Register `zustandspruefungen` (`(spiel) => true`, wenn etwas verändert wurde), in dieser Reihenfolge: `tod` (`src/systeme/tod.js`), `lage` (siehe [Wesen.md](Wesen.md), Bewegung), `kaputt` (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß); später z.B. der Filmriss
+ Haken `vor_tod` und `nach_tod` (mit der letzten Position), Meldung `tod` mit Urheberin, Ursache und Mittel aus `letzterVerlust`; am `vor_tod` hängt als letzte die Allmacht, die Ninkasi im allmächtigen Lauf bewahrt (siehe [Architektur.md](Architektur.md), Spielarten)

Regeln:

+ Geprüft wird nur, was vorgemerkt ist (siehe [Architektur.md](Architektur.md), Leistung): beim Tod Entitäten, bei denen ein Wert über `wertAendern` auf 0 gefallen ist, bei der Lage versetzte Wesen und solche mit geänderten Zuständen, bei kaputt Gegenstände, deren Haltbarkeit auf 0 gefallen ist; im Spiel läuft jede Änderung eines Werts über `wertAendern`, auch in Tests
+ Folge: Eine Flächenwirkung trifft alle Ziele, auch wenn das erste schon tot ist; mehrere Tode im selben Vorgang laufen nach Entitäts-ID
+ Es stirbt, wessen Lebenswert bei 0 liegt
+ Ablauf je Wesen: `vor_tod` (Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt, sonst stirbt es trotzdem), Meldung `tod`, `nach_tod`, Hinterlassenschaft, Entfernen
+ Entfernen nimmt den Akteur, gebundene Zeitereignisse und alles Getragene mit; Getragenes verschwindet aus dem Inventar der Trägerin
+ Stirbt Ninkasi, ist das Spiel vorbei (`vorbei`); sie bleibt im Zustand (Anzeige, später Todesbericht), noch vorgemerkte Auslöser verfallen

## Tests

+ `tests/werte.test.js` und `tests/modifikatoren.test.js` (Verrechnung, Quellen, Bedingungen, Auren), `tests/ausloeser.test.js` (Kaskade, Ketten, Dämpfung), `tests/zustaende.test.js` (Stapelregeln, Verlauf, Unterhalt, Überlagerung), `tests/beschwoerung.test.js`, `tests/zielauswahl.test.js`, `tests/zielbausteine.test.js` und `tests/geometrie.test.js` (Muster, Linien, Kreis, Kegel), `tests/faehigkeiten.test.js` (Verbrauch, Risiko, Ausbau), `tests/laufendeAktionen.test.js`, `tests/tod.test.js`, `tests/verhalten.test.js` (Befehlsveränderer)

## Verweise

+ Spieldesign der Fähigkeiten, des Pegels und des Brauens: [Grundlagen.md](Grundlagen.md); Skills, die Fähigkeiten ausbauen: [Charakter.md](Charakter.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkte 1 bis 6, u.a. Ersatzwirkungen, Auslöser am nicht angelegten Inventar, erster Auslöser im Spielinhalt

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
