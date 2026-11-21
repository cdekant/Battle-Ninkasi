# Battle Ninkasi - Wirkungen

Stand: 2026-11-21

Zuständig für: `src/kern/effekte.js`, `src/kern/bausteine.js`, `src/kern/ausloeser.js`, `src/kern/vorgang.js`, `src/kern/werte.js`, `src/systeme/modifikatoren.js`, `src/systeme/zustaende.js`, `src/systeme/befehlsveraenderer.js`, `src/systeme/beschwoerung.js`, `src/systeme/zielauswahl.js`, `src/systeme/zielbausteine.js`, `src/systeme/faehigkeiten.js`, `src/systeme/laufendeAktionen.js`, `src/systeme/tod.js`, `src/welt/geometrie.js`, `daten/effekte.js`, `daten/zustaende.js`, `daten/faehigkeiten.js`, `daten/risiken.js`

Mitprüfen bei Änderungen: [Architektur.md](Architektur.md), [Wesen.md](Wesen.md), [Gegenstaende.md](Gegenstaende.md)

Wie Skills, Gegenstände, Zustände und Fähigkeiten wirken: Wirkungsarten, Effektsystem, Modifikatoren, Auslöser, Zustände, Zielauswahl, Fähigkeiten, lange Aktionen, Tod.

## Wirkungsarten

Skills, Items, Zustände und Fähigkeiten wirken über sechs Arten, die frei kombinierbar sind:

1. Modifikatoren ändern Zahlen, z.B. "Braupaddel der Geschwindigkeit: Angriff kostet 33% weniger Zeit", "Skill: Bewegung 5% schneller"
2. Auslöser-Effekte reagieren auf Ereignisse, z.B. "bei Angriff, 15% Chance, weiterer Angriff", "beim Tod Sporen freisetzen"
3. Aktionsveränderer ändern, wie eine Aktion abläuft: Zielmuster, Reichweite, Fläche; z.B. "Braupaddel des Rundumschlags trifft alle angrenzenden Felder", "Speer trifft zwei Felder in Linie"; Zielmuster sind Daten (`muster: { art: "angrenzend" }`, `muster: { art: "linie", laenge: 2 }`), siehe Zielauswahl
4. Zustände sind zeitlich begrenzt, mit Verlauf (gleichbleibend, abklingend, ansteigend) und Stapelregel (erneuern, aufaddieren, nur der stärkste, einzeln); sie bündeln selbst Modifikatoren und Auslöser; z.B. Schaden über Zeit, abklingender Segen, sich steigernde Vergiftung; siehe Zustände
5. Auren wirken auf andere im Umkreis der Trägerin, z.B. "Gegner in der Nähe langsamer", "Hefen in der Nähe sprossen schneller"
6. Gewährte Aktionen schalten eine neue Aktion frei, z.B. "Braupaddel erlaubt Ansturm"

Jede Wirkungsart kann zusätzlich tragen:

+ Bedingungen: nur ab Pegel X, nur gegen Bakterien, nur unter 30% LP, nur mit zwei Kupfer-Items (Sets, Synergien)
+ Nachteile: negative Werte, z.B. für verfluchte Items

Jeder Modifikator kennt seine Quelle (Skill, Item, Zustand, Pegel); entfällt die Quelle, entfallen genau ihre Modifikatoren. Werte werden bei Bedarf aus Grundwert und Modifikatoren berechnet, siehe Modifikatoren.

## Effektsystem

+ Zwei Schichten, wie Lego: Der Code liefert die Steine, die Daten bauen daraus
+ Grundbausteine sind Code: wenige Dutzend kleine, stabile Funktionen, z.B. Schaden, Heilen, Pegel ändern, Zustand setzen, Beschwören, Versetzen, Fraktion ändern, Feld verändern
+ Zusammengesetzte Effekte sind Daten, benannt und wiederverwendbar, z.B. "Feuerbier-Explosion": Fläche 3x3, Feuerschaden 2W6, Zustand "brennend" für 300 Einheiten
+ Ein neuer Grundbaustein ist nur für eine wirklich neue Mechanik nötig
+ Benannte Verhaltensmodule (Code) für alles, was sich nicht aus Bausteinen zusammensetzen lässt: KI-Muster wie Zweiteilung, Sprossung, Myzelwachstum, Phagen-Befall, Bossphasen; die Daten verweisen nur darauf, z.B. `ki: "sprossung"` mit Parametern
+ Grundbausteine, Verhaltensmodule und Zielmuster werden in Registern angemeldet; auch Mods können dort eigene anmelden
+ Erweiterbar ist grundsätzlich alles über Register (`src/kern/register.js`): Befehlsarten, Grundbausteine, Verhaltensmodule, Modifikatorquellen, Befehlsveränderer, Zielmuster, Handler der Weltuhr, Zeitereignisse, interne Haken, Gefahrenprüfungen, Zustandsprüfungen, Arten langer Aktionen und Handler beim Erzeugen von Entitäten; Systeme und Verhaltensmodule melden sich beim Import an, die Reihenfolge der Anmeldung ist fest; `abmelden` entfernt einen Eintrag wieder (Tests, Mods)
+ Kontext eines Effekts: `{ quelleId, urheberId, urheberFraktion, zielId, ursprung, zielfeld, ursache, kettentiefe, mittel, tags, kritisch, werte }` (`src/kern/effekte.js`); die Quelle wirkt unmittelbar (Wesen, Fass, Geschoss, Falle), der Urheberin wird die Wirkung zugerechnet (EP, Zorn, Todesursache), Vorgabe ist die Quelle, bei Beschworenen deren Beschwörerin (`beschworenVon`); ihre Fraktion bleibt erhalten, auch wenn sie schon entfernt ist
+ `ursprung` ist das Feld, von dem Muster ausgehen (Vorgabe Position der Quelle), `zielfeld` das anvisierte Feld (Vorgabe Position des Ziels); `zielId` kann null sein, dann wirkt der Effekt auf ein Feld
+ `mittel`: `{ art: "angriff" | "faehigkeit" | "gegenstand" | "zustand" | "falle" | "gelaende", name }`; `tags` z.B. `["feuer", "magie"]` für Modifikatoren und gebundene EP, die Tags eines Effekts (`tags` in den Daten) kommen dazu
+ `werte` ist eine Ablage zwischen Schritten, über alle Verschachtelungen eines Effekts geteilt: `schaden` zählt den tatsächlichen Verlust in `summeSchaden`, `fuer_jedes_ziel` schreibt `anzahlZiele`, `springen` schreibt `getroffeneIds` und `sprungnummer`
+ `kritisch` setzt ein kritischer Trefferwurf, verschachtelte Effekte erben es (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Mengen der Bausteine `schaden` (mit Pflichtfeld `art`), `heilen`, `wert_aendern`: `wuerfel`, feste `menge` oder `menge: { aus: "summeSchaden", prozent: 50 }` aus der Ablage (Lebensraub); mit `auf: "quelle"` wirkt ein Schritt auf die Quelle statt auf das Ziel (Vampirbiss: Schaden am Ziel, Heilung an der Angreiferin); dazu `teilen: "anzahlZiele"` (verteilter Schaden) und `prozentJeSprung` (Abschwächung je Sprung einer Kette)
+ Bausteine erklären, ob sie ein Wesen brauchen (`brauchtZiel`); ein Schritt ohne Ziel wird übersprungen, der Effekt läuft weiter
+ Bausteine beschreiben ihre Parameter für die Datenprüfung: `text`, `ganzzahl`, `wahrheitswert`, `effekt`, `muster`, mit `?` freiwillig, eine Liste nennt die erlaubten Werte; benannte Effekte dürfen sich nicht im Kreis aufrufen
+ Eine Befehlsart besteht aus `pruefen` (Grund der Ablehnung oder nichts) und `ausfuehren` (gibt die Aktionsart für die Zeitkosten zurück, oder `{ aktion, grundkosten?, umstaende? }`, wenn die Grundkosten abweichen, z.B. beim Nahkampf aus den Angriffsprofilen, oder Tags für die Modifikatoren der Zeit mitkommen, z.B. bei Fähigkeiten); Gegner benutzen dieselben Befehlsarten, ihre Befehle werden aber nicht aufgezeichnet
+ Vor dem Ausführen läuft jeder Befehl, von Ninkasi wie von der KI, durch den Haken `vor_befehl`; Zustände verändern ihn dort (Torkeln, Verwirrung), ein abgebrochener oder ungültig gewordener Befehl wird zu warten; aufgezeichnet wird der ursprüngliche Befehl
+ `bewegen` greift durch Hineinlaufen Feinde an, mit `angreifen: true` jedes Wesen (gezielter Angriff, Rausch, Verwirrung); Bewegungsarten, Verschieben und Werfen siehe [Wesen.md](Wesen.md), Bewegung
+ Baustein `angreifen { profil? }` (`src/systeme/kampf.js`): die Quelle greift das Ziel mit ihren Angriffsprofilen an wie bei einer Angriffsaktion, ohne Zeitkosten, mit `profil` nur dieses eine; nur gegen ein Ziel daneben; für Konter aus Auslösern, z.B. `{ bei: "verfehlt", rolle: "ziel", ziel: "quelle", effekt: "konter" }`; die Angriffe laufen auf der Kettentiefe des Effekts, gegenseitige Konter enden so an der Kettengrenze

## Modifikatoren

+ Modifikator: `{ ziel, art, betrag, quelle, tag?, wenn? }`, z.B. `{ ziel: "kosten.bewegen", art: "prozent", betrag: -5 }`; Ziele sind Namen wie `lp`, `genauigkeit`, `ausweichen`, `ruestung`, `ruestung.<art>`, `widerstand`, `schaden`, `kritfaktor` (siehe [Wesen.md](Wesen.md), Kampfwerte), `reichweiteSicht`, `kosten.<aktion>`, `kosten.alle`, `verbrauch.<wert>`, `verbrauch.alle`, `abklingzeit`, `unterhalt.<wert>` (siehe Fähigkeiten), `regeneration.<wert>`, `schwund.<wert>`, `kurvenverschiebung.<wert>`, `abbau.pegel`, `eigenschaft.<name>` (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Arten: `plus`, `prozent`, `mal` (Betrag in Prozent, `150` heißt x1,5), `mindestens`, `hoechstens`, `setzen` (zählt als `mindestens` und `hoechstens` mit demselben Betrag); alle Beträge ganzzahlig
+ Verrechnung (`verrechnet` in `src/kern/werte.js`, Vorbild "increased" und "more" in Path of Exile): (Basiswert + Summe aller `plus`) x (100 + Summe aller `prozent`) / 100 x jedes `mal` / 100, ganzzahlig gerechnet und einmal am Ende gerundet, die Reihenfolge der Modifikatoren spielt also keine Rolle; danach hebt `mindestens` (der höchste) und senkt `hoechstens` (der niedrigste), bei Widerspruch gewinnt `hoechstens` (Blindheit schlägt Fernsicht)
+ Prozente addieren sich, zehnmal +5 % sind +50 %; nur `mal` multipliziert, und nur dort, wo die Daten es ausdrücklich sagen; so wachsen Werte nicht unbemerkt exponentiell; Skills multiplizieren sich untereinander, indem die Quelle `skills` je Skill einen `mal`-Modifikator liefert (entschieden in [Charakter.md](Charakter.md), umstellbar über `regeln.lernen.verrechnung`, siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Kein Wert baut auf seinem letzten Ergebnis auf, jede Abfrage rechnet vom Grundwert; Untergrenzen wie "Kosten mindestens 1" setzen die Aufrufer
+ Quellen sind ein Register (`modifikatorquellen`), Signatur `(spiel, entitaet) => [modifikator]`; `modifiziert(spiel, entitaet, ziele, basiswert)` sammelt bei jeder Abfrage aus allen Quellen in der Reihenfolge der Anmeldung, gespeichert oder nachgeführt wird nichts; mitgeliefert `eigene`, `auren`, `zustaende`, `ausruestung` (siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung), `skills` und `anforderungen` (siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Mitgelieferte Quellen: `eigene` (die Liste `entitaet.modifikatoren`, mit `modifikatorHinzufuegen` und `modifikatorenEntfernen` je Quelle), `zustaende` (siehe Zustände), `auren`, `ausruestung`, `skills` (Quelle `skill:<name>`) und `anforderungen` (Abzüge für nicht erfüllte Anforderungen angelegter Gegenstände, Quelle `anforderung:<id>`)
+ `modifikatorenAufgeschluesselt(spiel, entitaet, ziele, umstaende?)` liefert die wirksamen Modifikatoren mit ihrer Quelle, als Grundlage für Erklärungen in der Oberfläche
+ `hoechstwert(spiel, entitaet, wertName)` und alle Begrenzungen von Werten rechnen über `modifiziert`; nach oben offene Werte (Pegel) haben keinen Höchstwert
+ Umstände einer Abfrage: `modifiziert(spiel, entitaet, ziele, basiswert, { gegenueberId?, tags? })`; der Trefferwurf gibt für Genauigkeit und Verteidigung das Gegenüber und die Tags von Angriff und Effekt mit, die Schadensrechnung dazu die Schadensart, `zeitkosten` reicht Umstände durch
+ Tags: ein Modifikator mit `tag` wirkt nur, wenn die Abfrage den Tag in `umstaende.tags` mitbringt, z.B. `{ ziel: "kosten", tag: "psi", art: "prozent", betrag: -10 }` für alle Psi-Fähigkeiten, auch künftige; Wesen tragen `tags` (z.B. `["bakterium", "essig"]`), Schadensarten gehen als Tag in die Abfragen der Schadensrechnung (siehe [Wesen.md](Wesen.md), Kampfwerte)
+ Bedingungen: `wenn: [{ bedingung, ...parameter }]`, alle müssen gelten; Register `modifikatorbedingungen`, Signatur `(spiel, entitaet, parameter, umstaende) => boolean`, Parameter für die Datenprüfung wie bei den Bausteinen (`src/systeme/modifikatoren.js`)
+ Mitgelieferte Bedingungen: `pegel_ab { wert }`, `pegel_unter { wert }` (z.B. nüchtern), `wert_unter_prozent { wert, prozent }` (gemessen am Grundwert ohne Modifikatoren), `gegenueber_tag { tag }`, `gegenueber_ahnungslos` (Hinterhalt, siehe [Wesen.md](Wesen.md), Wahrnehmung), `hat_zustand { zustand }`, `ohne_zustand { zustand }`, `hat_tag { tag }`, `ohne_tag { tag }`, `traegt_tag { tag, anzahl? }` (Sets aus angelegten Gegenständen), `skill_ab { skill, stufe }`, `eigenschaft_ab { eigenschaft, wert }`, `eigenschaft_unter { eigenschaft, wert }` (siehe [Wesen.md](Wesen.md), Skills und Lernen); dieselben Bedingungen gelten für `voraussetzungen` an Fähigkeiten, `wenn` an Auslösern und an Einträgen der KI (`bedingungenErfuellt` in `src/kern/werte.js`); Schwellen des Pegels sind damit gewöhnliche Modifikatoren mit `pegel_ab`
+ Bedingungen lesen nur Rohwerte und rufen `modifiziert` nicht auf; fragen sich Modifikatoren doch im Kreis ab, bricht ein Schutz nach acht Ebenen mit einer Fehlermeldung ab
+ Ausnahme: `eigenschaft_ab` und `eigenschaft_unter` lesen den wirksamen Wert samt Modifikatoren, damit ein Kraftbier eine Anforderung erfüllt; die Datenprüfung verbietet sie an Modifikatoren auf `eigenschaft.*` (direkter Kreis), indirekte fängt der Schutz
+ Auren (Modifikatorquelle `auren`): `auren: [{ reichweite, trifft, selbst?, sichtlinie?, modifikatoren }]` an Wesen und Zuständen; Reichweite als Kreis wie in der Zielauswahl, `trifft` aus Sicht der Trägerin mit den Werten der Zielauswahl (`feinde`, `verbuendete`, `wesen`, `alle`); standardmäßig nicht auf die Trägerin selbst und durch Wände (Gerüche, Dunst, Sporen), mit `sichtlinie: true` nur bei freier Sicht; Auren in Zuständen skalieren mit Stärke und Verlauf; Quelle `aura:<id>` bzw. `aura:zustand:<nummer>`
+ Auren werden bei jeder Abfrage gesucht, aber nur unter den möglichen Trägerinnen aus dem räumlichen Index (siehe [Architektur.md](Architektur.md), Leistung)

## Auslöser

+ Auslöser sind Daten an einer Entität: `ausloeser: [{ bei, rolle?, ziel?, effekt, chance?, daempfung?, wenn? }]`, z.B. Dornen `{ bei: "nach_schaden", rolle: "ziel", ziel: "quelle", effekt: "dornen" }`
+ `wenn`: Bedingungen wie an Modifikatoren, geprüft an der Trägerin beim Ausführen und vor dem Wurf, Gegenüber ist die andere Partei des Ereignisses; Bossphase: `{ bei: "nach_schaden", rolle: "ziel", wenn: [{ bedingung: "wert_unter_prozent", wert: "lp", prozent: 50 }, { bedingung: "ohne_zustand", zustand: "raserei" }], effekt: "raserei_setzen" }` beginnt genau einmal
+ `bei`: Haken aus dem Katalog mit `ausloeserErlaubt` und `inBetrieb`; `rolle`: Rolle der Trägerin im Ereignis (`quelle` oder `ziel`, ohne Angabe jede); `ziel`: worauf der Effekt wirkt (`selbst` als Vorgabe, `quelle`, `ziel` oder `feld`: die Position im Ereignis, bei `nach_tod` die letzte Position des Opfers, sonst die der Trägerin; der Effekt läuft dann ohne Wesen als Ziel mit Ursprung und Zielfeld dort, z.B. Sporen im Kreis); `chance` in Prozent, Vorgabe 100
+ Haken und Auslöser sind getrennt: Haken sind Code, wirken sofort und dürfen den Kontext ändern; Auslöser merkt ein Verteiler (Rang 1000, nach allen Code-Handlern) nur vor, abgearbeitet werden sie nach dem laufenden Schritt nacheinander in der Reihenfolge des Vormerkens (`src/kern/ausloeser.js`); kein Auslöser greift so mitten in eine Schadensrechnung ein
+ Die Warteschlange der Auslöser liegt im Spiel, nicht im Zustand; sie ist nach jedem Vorgang leer
+ Gefragt werden die beteiligten Entitäten, zuerst die Quelle, dann das Ziel; je Entität zuerst ihre eigenen Auslöser, dann die ihrer Zustände (z.B. Dornenhaut), dann die ihrer angelegten Gegenstände (Kaskade nach Caves of Qud, z.B. Dornenpanzer), dann die weiterer Quellen aus dem Register `ausloeserquellen` (`(spiel, entitaet) => [{ ausloeser, schluessel }]`), bisher die der Skills (`abStufe`, siehe [Wesen.md](Wesen.md), Skills und Lernen)
+ Ketten: Befehle und Welt wirken auf Kettenstufe 0, der Effekt eines Auslösers eine Stufe tiefer als sein Ereignis; die Chance sinkt je Stufe auf `daempfung` Prozent (einheitlich gerundet: 100, 50, 25, 13, 7 ...), ab der höchsten Kettentiefe wird nichts mehr vorgemerkt
+ Regelwerte in `daten/regeln.js`: `daempfungProStufe` 50, `hoechsteKettentiefe` 5; `daempfung` am Auslöser überschreibt die Regel (100 heißt ungedämpft)
+ Sichere Chancen (0 und 100) würfeln nicht, damit die Zahlenfolge des Zufalls ungestört bleibt
+ Kettenreaktionen der Welt (Feuer greift auf Gas über, Fässer explodieren nacheinander) laufen nicht über Auslöser, sondern über die Zeit (Weltuhr, Zeitereignisse); sie sind von der Kettengrenze nicht betroffen und für die Spielerin sichtbar
+ Ersatzwirkungen aus Daten ("Phönixbier verhindert einmal den Tod") sind ein eigener Typ, da sie sofort wirken müssen; Entwurf in [Systemausbau.md](Systemausbau.md)

## Zustände

+ Zustände sind Daten (`daten/zustaende.js`, mit Vorlagen), umgesetzt in `src/systeme/zustaende.js`: `{ text, tags, dauer, stapel, hoechstStapel, verlauf, modifikatoren, auren, jeTick, beimBeginn, beimEnde, ausloeser, gebundenAnQuelle }`
+ An der Entität als Liste von Instanzen: `zustaende: [{ nummer, name, quelleId, urheberId, urheberFraktion, beginn, ende, staerke, stapel }]`; die Nummer zählt der Zustand des Spiels hoch
+ `dauer` in Zeiteinheiten, ohne Angabe unbegrenzt bis zum Entfernen; `staerke` Vorgabe 1
+ Takt ist die Weltuhr: je Welttick wirkt `jeTick`, solange das Ende nicht erreicht ist; Hast und Verlangsamung der Trägerin ändern daran nichts (Vorbild DCSS: Hast hilft, Verlangsamung schadet)
+ Ende über das Zeitereignis `zustand_ende`, gebunden an die Trägerin; wurde der Zustand inzwischen verlängert, reiht es sich zum neuen Ende wieder ein
+ Stapelregel je Zustand, Vorgabe `erneuern` (eine Instanz, höhere Stärke, längere Dauer); `aufaddieren` (Stärken addiert bis `hoechstStapel` Anwendungen, Dauer erneuert), `staerkster` (nur eine mindestens gleich starke Anwendung ersetzt, sonst nichts), `einzeln` (eigene Instanzen mit eigenem Ende, höchstens `hoechstStapel`); verschiedene Zustände bestehen immer nebeneinander
+ Verlauf `gleichbleibend` (Vorgabe), `abklingend`, `ansteigend` oder eine eigene Kurve `[[anteilProzent, staerkeProzent], ...]` über den Anteil der verstrichenen Dauer; wird die Dauer verlängert, beginnt der Verlauf neu
+ Modifikatoren gelten je Stärke 1 und skalieren mit Stärke und Verlauf zur Zeit der Abfrage (`modifikatorSkaliert`): `plus` und `prozent` im Betrag, `mal` im Anteil über 100 (`mal 150` bei Stärke 50 % wird `mal 125`), Grenzen gar nicht; die Modifikatorquelle `zustaende` liefert sie mit der Quelle `zustand:<nummer>`, endet der Zustand, entfallen sie ohne Nachführen
+ `jeTick`, `beimBeginn`, `beimEnde` wirken auf die Trägerin mit Ursprung an ihrer Position, zugerechnet der Urheberin, Ursache `zustand`, Mittel `{ art: "zustand", name }`, Tags des Zustands; Mengen mit `mitStaerke: true` skalieren mit der Stärke (`werte.staerkeProzent`, 100 = Stärke 1)
+ Bausteine `zustand_setzen { zustand, dauer?, staerke? }` und `zustand_entfernen { zustand? , tag? }` auf das Ziel
+ Haken `zustand_beginnt` und `zustand_endet` (mit `grund`: `abgelaufen`, `entfernt`, `quelle_tot`, `unterhalt`), Meldungen gleichen Namens
+ `unterhalt: { mp: 2 }` kostet die Trägerin je Welttick, vor `jeTick`; Modifikatoren auf `unterhalt.<wert>` mit den Tags des Zustands; reicht ein Vorrat nicht, endet der Zustand mit dem Grund `unterhalt` (aufrechterhaltene Zauber)
+ `gebundenAnQuelle: true`: der Zustand endet mit dem Tod oder Verschwinden der Quelle (aufrechterhaltener Zauber, Beschworene)
+ `handlungsunfaehig: true` (Betäubung, Lähmung, Filmriss): die Trägerin muss warten; bei Ninkasi wird jede Eingabe angenommen, aufgezeichnet, mit der Meldung `handlungsunfaehig` ("Leider nicht möglich") beantwortet und als warten ausgeführt, je Eingabe vergeht eine Aktion; eine Reise hält an
+ `befehl: { veraenderer, ...parameter }` verändert jeden Befehl der Trägerin über das Register `befehlsveraenderer` (`src/systeme/befehlsveraenderer.js`); mitgeliefert sind `ziel_verfehlen { chance }` für Verwirrung beim Befehl `faehigkeit` (das Ziel rutscht auf ein anderes Wesen daneben, ein Feld auf ein Nachbarfeld, eine Richtung um 45°, nur auf Ziele, die der Befehl zulässt) und `abweichen { chance, freundeAngreifen? }` für Torkeln und Verwirrung: ein Schritt geht mit der Chance, skaliert mit der Stärke, auf ein zufälliges anderes freies Nachbarfeld (im Gang also zurück), gibt es keins, wie gewollt; ein Feind dort wird angegriffen, ein Verbündeter nur mit `freundeAngreifen`, sonst zählt sein Feld nicht als frei
+ `ki: { modul, ...parameter }` überlagert die KI (Furcht mit `fliehen`, Rausch mit `jagen` und `trifft: "wesen"`); bei Ninkasi übernimmt die KI für die Dauer, das Spiel wartet dann nicht auf Eingaben
+ `fraktion` überlagert die Fraktion: `"urheber"` (Psi-Kontrolle), `"eigene"` (Zwietracht, mit allen verfeindet) oder ein Fraktionsname
+ Fraktion und KI werden beim Beginn in die Instanz geschrieben; `fraktionVon` und `kiVon` (`src/kern/zustand.js`) liefern die des jüngsten überlagernden Zustands, sonst die eigene; nach dem Ende gilt von selbst wieder der ursprüngliche Stand, die eigene KI behält ihr Gedächtnis
+ Beschwören und Verschwinden (`src/systeme/beschwoerung.js`): `beschwoeren { wesen, anzahl?, muster?, zustand?, dauer?, abstammung? }` erzeugt Wesen auf freien Feldern des Musters (Vorgabe angrenzend), mit der Fraktion der Urheberin und `beschworenVon`, eingereiht nach einer Aktion Wartezeit, mit dem Zustand (Quelle die Beschwörerin); `abstammung: true` teilt den EP-Topf der Quelle (siehe [Wesen.md](Wesen.md), Skills und Lernen); `verschwinden` entfernt das Ziel ohne Tod, ohne `nach_tod` und ohne Hinterlassenschaft, nicht bei Ninkasi
+ Beispiel ganz als Daten: `beschworen: { gebundenAnQuelle: true, beimEnde: "verschwinden" }`, mit `dauer` auch eine Beschwörung auf Zeit (Vorbild Brogue: Geisterklingen verschwinden mit dem Goblin-Beschwörer)
+ Die Datenprüfung verfolgt Kreise auch über Zustände: ein Effekt, der einen Zustand setzt, dessen `beimBeginn` ihn wieder aufruft, ist ein Fehler
+ Im Spielinhalt bisher nur der vorläufige `testzustand` (Ausweichen -2 für 5 Züge), den Ninkasis `testfaehigkeit` bei einem Treffer setzt, damit die Anzeige der Zustände etwas zeigt

## Zielauswahl

+ Vorbilder: Dungeon Crawl Stone Soup (Zielarten smite, bolt, beam, cone, explosion; Vorschau getrennt von der Wirkung), Tales of Maj'Eyal (Ziel als Tabelle mit Radius, Eigen- und Freundbeschuss als Datenfeld), Red Blob Games (Linien auf Gittern, Symmetrie, diagonale Wandecken)
+ Geometrie (`src/welt/geometrie.js`), rein und ganzzahlig, ohne Winkelfunktionen: `linie` symmetrisch (gerechnet vom kleineren Endpunkt aus), `sichtlinieFrei` (kein undurchsichtiges Feld zwischen den Endpunkten), `flugbahn` (bis zum Ziel oder mit `ueberZielHinaus` bis zur Reichweite, endet an Feldern, die Geschosse nicht durchlassen (`geschossdurchlaessig`, siehe [Welt.md](Welt.md), Gelände), oder am ersten Wesen, außer `durchdringend`; Wesen, für die `ueberspringen(wesen)` wahr ist, werden überflogen), `kreis`, `kegel`
+ Diagonale Wandecken großzügig: ein Diagonalschritt ist frei, wenn eine der beiden Seiten frei ist
+ Kreis: ein Feld gehört dazu, wenn `dx² + dy² <= r·(r+1)`; Radius 1 ist das volle 3x3, Radius 2 ein 5x5 ohne Ecken; Reichweiten werden ebenso gemessen
+ Kegel: Öffnung in Grad (30, 45, 60, 90 als Vorgabe, 120), geprüft über Skalar- und Kreuzprodukt mit einer Tabelle des Tangens in Tausendsteln; in allen acht Richtungen gespiegelt gleich
+ Zielmuster sind Daten mit einem Muster aus dem Register `zielmuster`, Signatur `(spiel, auswahl, parameter) => [{x, y}]` mit `auswahl = { ursprung, zielpunkt, quelleId }` (`src/systeme/zielauswahl.js`)
+ Mitgeliefert: `selbst` (Ursprung), `feld` (Zielpunkt), `angrenzend`, `linie` (`laenge`), `strahl` (bis zum Hindernis, `laenge` freiwillig), `kreis` (`radius`), `kegel` (`laenge`, `oeffnung`); Linie und Strahl laufen vom Ursprung in Richtung Zielpunkt und enden an undurchsichtigen Feldern
+ Kreis, Kegel und angrenzend nur mit Sichtlinie vom Ursprung (keine Explosion um die Ecke), abschaltbar mit `durchWaende: true`; dichter Rauch hält die Sichtlinie auf (siehe [Welt.md](Welt.md), Feldschichten), also auch solche Muster
+ Feste Reihenfolge der Felder: nach Abstand zum Ursprung (`dx² + dy²`), dann nach Feldindex; je Feld die Entitäten nach ID
+ Wer getroffen wird, sagt `trifft` aus Sicht der Urheberin: `alle` (auch Gegenstände, Vorgabe), `wesen`, `feinde`, `verbuendete` (nach der Beziehung der Fraktionen, Neutrale sind keins von beiden, siehe [Wesen.md](Wesen.md), Fraktionen); `ohneUrheber: true` nimmt die Urheberin aus; Eigenbeschuss ist also möglich, solange die Daten nichts anderes sagen
+ Zielarten: `selbst`, `wesen` (per ID), `feld` (smite), `richtung` (`dx`, `dy`), `geschoss`; dazu `reichweite`, `brauchtSichtlinie` (Vorgabe ja), `muster`, `trifft`, `ohneUrheber`, `durchdringend`, `ueberZielHinaus`, `ueberVerbuendete` (das Geschoss fliegt über Verbündete der Akteurin hinweg)
+ Ursprung und Zielpunkt je Zielart: bei `selbst` die Akteurin, bei `wesen` und `feld` das Ziel selbst, bei `richtung` die Akteurin und das Feld daneben, bei `geschoss` der Aufschlag; Format der Zielangabe `{ x, y }`, `{ id }` oder `{ dx, dy }`
+ `zielAufloesen(spiel, akteur, zielart, zielangabe)` gibt Ursprung, Zielpunkt, Ziel, Bahn, Felder und Betroffene zurück oder den Grund der Ablehnung (`ungueltig`, `kein_ziel`, `nicht_sichtbar`, `zu_weit`, `keine_sichtlinie`); ändert nichts, würfelt nicht und ist zugleich Vorschau für Zielmodus, Tooltip und KI; für Ninkasi zählen nur Felder, die sie sieht
+ Gesehen, aber nicht zu treffen: eine symmetrische Linie für Sicht und Wurf, der Schattenwurf des Sichtfelds kann davon abweichen; nach dem Anspielen prüfen, ob Ersatzlinien (Brogue, DCSS) oder symmetrischer Schattenwurf nötig sind
+ Bausteine mit Zielauswahl (`src/systeme/zielbausteine.js`), der innere Effekt teilt die Ablage:
  + `fuer_jedes_ziel`: `{ muster, effekt, trifft, ohneUrheber }` auf jede getroffene Entität im Muster
  + `auf_feld`: `{ muster, effekt }` auf jedes Feld, auch leere (Ziel null); Grundlage für Feldschichten
  + `geschoss`: `{ reichweite, effekt, durchdringend, ueberZielHinaus, ueberVerbuendete }` vom Ursprung zum Zielfeld, der Effekt wirkt am ersten Wesen oder am Aufschlag, dort liegen dann Ursprung und Zielfeld (z.B. Explosion mit `fuer_jedes_ziel`); durchdringend auf jedes Wesen der Bahn
  + `springen` (Kettenblitz): `{ anzahl, reichweite, effekt, trifft, ohneUrheber, wahl }` wirkt auf das Ziel und springt bis zu `anzahl` Mal zum nächsten noch nicht getroffenen lebenden Wesen im Kreis mit Sichtlinie (`wahl`: `naechstes` als Vorgabe oder `zufaellig`), `trifft` hier Vorgabe `wesen`; auch für springende Krankheit oder übergreifende Psi-Kontrolle
+ Nahkampf mit Muster: `muster` am Angriffsprofil vom Angreifer in Richtung des Ziels, z.B. Rundumschlag `{ art: "angrenzend" }`, Speer `{ art: "linie", laenge: 2 }`; jedes getroffene Wesen bekommt einen eigenen Trefferwurf (siehe [Wesen.md](Wesen.md), Kampfwerte), `trifft` am Profil Vorgabe `wesen`, der Angreifer nie selbst

## Fähigkeiten

+ Vorbilder: Tales of Maj'Eyal (aktive Talente mit Kosten und Abklingzeit, aufrechterhaltene mit gebundenem Vorrat), DCSS (Fehlschlag und Folgen eines Zaubers), Caves of Qud (Glimmer: geistige Macht lockt Jäger an)
+ Fähigkeiten sind Daten (`daten/faehigkeiten.js`), umgesetzt in `src/systeme/faehigkeiten.js`; Wesen kennen sie als Liste `faehigkeiten: ["name"]`; im Spielinhalt gibt es bisher die beiden des Testgegners `fernkaempfer_test` (Säurespucke, Säureschwall) und die vorläufige `testfaehigkeit` Ninkasis (Kreis mit Radius 1 auf ein Feld bis 6 weit, 10 MP, Trefferwurf je Wesen, sie selbst bleibt verschont), damit sich der Zielmodus ausprobieren lässt; eigentliche Fähigkeiten für Ninkasi folgen nach dem Systemausbau; wann Gegner sie einsetzen, steht an ihrer KI (siehe [Wesen.md](Wesen.md), KI)
+ Aufbau: `{ text, art?, tags?, verbrauch?, material?, zeit?, abklingzeit?, voraussetzungen?, ziel?, wirkung?, zustand?, risiko?, skill?, anforderung?, ausbau?, dauer?, beimAbbruch?, ankuendigung?, unterbrechbar? }`
  + `art`: `aktiv` (Vorgabe) wirkt einmal; `aufrecht` setzt `zustand` an der Wirkenden, erneutes Benutzen beendet ihn ohne Kosten; den laufenden Preis trägt der Zustand als `unterhalt` (siehe Zustände)
  + `verbrauch: { mp, pp, pegel, ... }` aus den Vorräten, Modifikatoren auf `verbrauch.<wert>` und `verbrauch.alle` mit den Tags der Fähigkeit (`kosten.*` bleibt der Zeit vorbehalten)
  + `material: [{ typ, anzahl }]` aus dem Inventar, wird verbraucht
  + `zeit`: Grundkosten, Vorgabe `aktionen.faehigkeit`; Modifikatoren auf `kosten.faehigkeit` und `kosten.alle` mit den Tags
  + `abklingzeit`: eigene Züge der Wirkenden (Zugzähler, siehe [Architektur.md](Architektur.md), Zeitmodell), Modifikatoren auf `abklingzeit`; am Wesen `abklingendBis: { name: zugnummer }`
  + `voraussetzungen`: Bedingungen aus dem Register `modifikatorbedingungen`, z.B. `pegel_unter` (nüchtern), `pegel_ab`, `skill_ab`, `eigenschaft_ab`
  + `skill: { name, stufe, risiko }`: die Fähigkeit verlangt einen Skill; fehlen Stufen, wird die Tabelle `risiko` über die fehlenden Stufen gewürfelt (Fundstück ohne passenden Skill, Vorbild DCSS)
  + `anforderung: { eigenschaften: { klugheit: 12 }, risiko }`: weiche Anforderung, die Tabelle wird über die Summe der fehlenden Punkte (wirksame Werte) gewürfelt
  + `ausbau: [{ wenn, aendert }]`: Ausbau durch Skills; zutreffende Einträge (Bedingungen an der Wirkenden, meist `skill_ab`) legen `aendert` in Datenreihenfolge flach über die Definition; `faehigkeitFuer(spiel, wesen, name)` liefert die so geltende Definition und wird überall benutzt, wo die Wirkende bekannt ist (Prüfen, Wirken, lange Aktion, Vorschau, KI, Anzeige); `ausbau` und `art` lassen sich nicht ändern
  + `ziel`: Zielart wie in `zielAufloesen` (siehe Zielauswahl); die Wirkung trifft mit `muster` jede betroffene Entität, bei durchdringendem Geschoss jedes Wesen der Bahn, sonst einmal das Ziel oder das Feld; Meldungen `geschoss` bzw. `flaeche`
  + `wirkung`: benannter Effekt mit Ursache `faehigkeit` und Mittel `{ art: "faehigkeit", name }`
  + `dauer: { schritte }`: lange Aktion (Ritual, Kanalisieren), bezahlt wird am Anfang, jeder Schritt kostet `zeit`, Risiko und Wirkung kommen nach dem letzten Schritt; das Ziel wird dann neu aufgelöst, passt es nicht mehr, verpufft die Wirkung (Meldung `verpufft`); `beimAbbruch`: Effekt auf die Wirkende beim Abbruch (siehe Lange Aktionen)
  + Angekündigte Angriffe sind lange Aktionen mit `ankuendigung` (Textschlüssel für das Log) und meist der Zielart `feld`: das Ziel ist das Feld beim Beginn, wer bis zum letzten Schritt das Muster verlässt, weicht aus; die Meldung `aktion_beginnt` nennt `faehigkeit`, `ankuendigung` und die Zielfelder (`felder`), die Anzeige markiert die Felder, solange die Aktion läuft; der erste Schritt läuft sofort, `schritte: 3` lässt dem Ziel also zwei Züge
  + `unterbrechbar`: Liste der Gründe, die die lange Aktion abbrechen, `schaden` und `versetzt`; `true` heißt `["schaden"]` (siehe Lange Aktionen)
+ Befehl `{ art: "faehigkeit", faehigkeit, ziel?: { x, y } | { id } | { dx, dy } }`; Gründe der Ablehnung: `nicht_gelernt`, `abklingend`, `voraussetzung`, `zu_wenig_<wert>`, `material_fehlt` und die der Zielauswahl; Ablauf: Verbrauch und Material bezahlen, Abklingzeit setzen, Meldung `faehigkeit`, Risiko würfeln, wirken
+ Risikotabellen (`daten/risiken.js`): `[{ name, chance, wirkt, effekt? }]`, die Chance jedes Ausgangs ist eine Kurve über x: bei `risiko` der Pegel der Wirkenden, bei `skill.risiko` die fehlenden Stufen, bei `anforderung.risiko` die fehlenden Punkte; gewürfelt wird in der Reihenfolge Skill, Anforderung, Risiko, der erste Ausgang mit `wirkt: false` beendet (Meldung `risiko` mit `wegen`); je Tabelle ein Wurf von 1 bis 100, die Ausgänge liegen hintereinander, sind alle Chancen 0, wird nicht gewürfelt; `wirkt: false` heißt, die Fähigkeit selbst wirkt nicht, der Verbrauch ist in jedem Fall bezahlt; `effekt` trifft die Wirkende (Ursache `risiko`); Meldung `risiko`
+ Vorläufige Tabelle `psi`: Fehlschlag nüchtern 30 %, bei 1,5 ‰ am seltensten (5 %), darüber wieder steigend; Rückschlag ab 3 ‰ bis 20 % bei 8 ‰ (Effekt `psi_rueckschlag`); dass Psi mit dem Pegel stärker wirkt, geht über Modifikatoren mit `pegel_ab` und dem Tag `psi`; dazu `ohne_skill` (1 fehlende Stufe 25 %, 3: 60 %, 5: 85 %) und `anforderung` (1 fehlender Punkt 5 %, 10: 50 %), beide vorläufig
+ Glimmer (Psi lockt Gegner an) wäre ein Wert `glimmer`, den Psi-Fähigkeiten über `wert_aendern` erhöhen; seine Folgen sind Spieldesign ([Grundlagen.md](Grundlagen.md))

## Lange Aktionen

+ Vorbild: die "Delays" in DCSS, mehrschrittige Aktionen mit festen Gründen zur Unterbrechung
+ Rituale, Kanalisieren und später das Brauen laufen in der Logik (`src/systeme/laufendeAktionen.js`), weil sie einen Fortschritt und Folgen beim Abbruch haben; Rasten und Auto-Erkunden sind dagegen Abläufe der Eingabe aus gewöhnlichen Befehlen (siehe [Bedienung.md](Bedienung.md), Maus, Reise, Laufen, Rasten und Erkunden)
+ Komponente an der Akteurin: `laufendeAktion: { art, schritteGesamt, schritteErledigt, unterbrochen, lage, unterbrechbar?, ...Daten der Art }`; Arten im Register `laufendeaktionen` mit `schrittkosten`, `abschliessen` und `abbrechen`; mitgeliefert ist `faehigkeit` (Fähigkeiten mit `dauer`)
+ Der startende Befehl führt den ersten Schritt aus; ist die Akteurin wieder dran, führt die Logik den nächsten Schritt selbst aus (Befehl `fortsetzen`, nicht aufgezeichnet, das Nachspielen ergibt ihn wieder); aufgezeichnet wird nur, was die Spielerin eingibt
+ Vor jedem automatischen Schritt Ninkasis laufen die Gefahrenprüfungen aus `regeln.laufendeAktionen.unterbrechen` (Vorgabe `gegner_in_sicht`, `schaden`) gegen die Lage beim letzten Schritt; trifft eine zu, pausiert die Aktion (`unterbrochen`, Meldung `aktion_unterbrochen`) und Ninkasi wird gefragt; die Liste steht in den Regeln, nicht in den Einstellungen, weil sie das Nachspielen bestimmt
+ Befehl `fortsetzen` (Leertaste) macht weiter, jeder andere Befehl bricht ab (Meldung `aktion_abgebrochen` mit Grund `befehl`); bezahlte Kosten bleiben bezahlt, `abbrechen` der Art wirkt (bei Fähigkeiten `beimAbbruch`); Handlungsunfähigkeit bricht ebenfalls ab
+ Gegner mit langer Aktion führen ihre Schritte ohne Gefahrenprüfung aus
+ `unterbrechbar` nennt die Gründe, die die lange Aktion jedes Wesens sofort abbrechen, auch die Ninkasis: `schaden` (Haken `nach_schaden`) und `versetzt` (von einer anderen Urheberin gestoßen, gezogen, getauscht oder teleportiert, siehe [Wesen.md](Wesen.md), Bewegung); bei Fähigkeiten kommt die Liste aus deren Daten, so legt jede Fähigkeit und später jedes Rezept selbst fest, wie störanfällig es ist

## Tod und Zustandsprüfung

+ Vorbild sind die "state-based actions" von Magic: The Gathering: Getötet wird nicht mitten in einer Wirkung, sondern an festen Punkten
+ Ein Vorgang ist ein ausgeführter Befehl, ein Handler der Weltuhr oder ein Zeitereignis; danach läuft `vorgangAbschliessen` (`src/kern/vorgang.js`): abwechselnd alle Zustandsprüfungen und der nächste vorgemerkte Auslöser, bis nichts mehr ansteht
+ Zustandsprüfungen sind ein Register (`zustandspruefungen`), die erste ist der Tod (`src/systeme/tod.js`), dann die Lage (siehe [Wesen.md](Wesen.md), Bewegung), dann kaputte Gegenstände (siehe [Gegenstaende.md](Gegenstaende.md), Verschleiß); später z.B. der Filmriss
+ Geprüft wird nur, was vorgemerkt ist (siehe [Architektur.md](Architektur.md), Leistung): beim Tod Entitäten, bei denen ein Wert über `wertAendern` auf 0 gefallen ist, bei der Lage versetzte Wesen und solche mit geänderten Zuständen, bei kaputt Gegenstände, deren Haltbarkeit auf 0 gefallen ist; im Spiel läuft jede Änderung eines Werts über `wertAendern`, auch in Tests
+ Folge: Eine Flächenwirkung trifft alle Ziele, auch wenn das erste schon tot ist; mehrere Tode im selben Vorgang laufen nach Entitäts-ID
+ Es stirbt, wessen Lebenswert bei 0 liegt; der Lebenswert ist ein Datenfeld (`lebenswert`, Vorgabe `lp`), z.B. der Zusammenhalt eines Biofilms
+ Ablauf je Wesen: Haken `vor_tod` (Abbruch verhindert den Tod, aber nur, wenn der Lebenswert danach über 0 liegt, sonst stirbt es trotzdem), Meldung `tod` mit Urheberin, Ursache und Mittel aus `letzterVerlust`, Haken `nach_tod` mit der letzten Position, Hinterlassenschaft, Entfernen
+ Hinterlassenschaft nach Daten: `beimTod: { inventar: "fallen_lassen" }` (Vorgabe, aufs Feld des Wesens) oder `"vernichten"`
+ Entfernen nimmt den Akteur, gebundene Zeitereignisse und alles Getragene mit; Getragenes verschwindet aus dem Inventar der Trägerin
+ Stirbt Ninkasi, ist das Spiel vorbei; sie bleibt im Zustand (Anzeige, später Todesbericht), noch vorgemerkte Auslöser verfallen
+ Ursachen bisher: `nahkampf`, `trinken`, `ausloeser`, `zustand`, `schwund.<wert>` (Stoffwechsel)

Pflege: Dieses Dokument folgt den Pflichten unter "Dokumentation" in [CLAUDE.md](../CLAUDE.md).
