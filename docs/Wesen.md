# Battle Ninkasi - Wesen

Stand: 2026-11-24

Zuständig für: `src/systeme/kampf.js`, `src/systeme/kampfzustand.js`, `src/systeme/fraktionen.js`, `src/systeme/wahrnehmung.js`, `src/systeme/sinne.js`, `src/systeme/bewegung.js`, `src/systeme/verschieben.js`, `src/systeme/werfen.js`, `src/systeme/skills.js`, `src/systeme/lernen.js`, `src/systeme/stoffwechsel.js`, `src/ki/*`, `daten/ninkasi.js`, `daten/fraktionen.js`, `daten/schadensarten.js`, `daten/eigenschaften.js`, `daten/taktiken.js`

Mitprüfen bei Änderungen: [Wirkungen.md](Wirkungen.md), [Welt.md](Welt.md), [Charakter.md](Charakter.md), [Grundlagen.md](Grundlagen.md), [Ausblick.md](Ausblick.md), [Gegenstaende.md](Gegenstaende.md)

## Zweck

Was Wesen können und wie sie entscheiden: Kampfwerte und Schadensrechnung, Kampfzustand, Fraktionen mit Ruf und Beistand, Wahrnehmung, KI, Bewegung samt Verschieben und Werfen, Stoffwechsel, Skills und Lernen. Jeder Abschnitt nennt, soweit vorhanden, Daten, Schnittstellen und Regeln.

## Kampfwerte

Vorbilder: Caves of Qud (erst Ausweichen gegen den Treffer, dann Rüstung gegen den Schaden; schwere Rüstung kostet Ausweichen), Brogue (Trefferchance aus Genauigkeit und Verteidigung ohne harte Grenzen), DCSS (Willenskraft gegen geistige Angriffe, Waffen mit eigener Geschwindigkeit), Path of Exile (Widerstände brauchen eine Grenze, weil sich Prozente addieren).

Daten:

+ Schadensarten (`daten/schadensarten.js`): `stumpf`, `schnitt` (beide mit `ruestung: true`), `saeure`, `lauge`, `feuer`, `elektrisch`, `alkohol`, `gift`, `psi`, `magie` (reine Magie, z.B. Energieball)
+ Angriffsprofile am Wesen: `angriffe: [{ name, genauigkeit, effekt, kosten?, chance?, tags?, kritchance?, muster?, trifft? }]`; `name` ist je Wesen eindeutig und steht als `mittel.name` in Todesursache und Haken; `kosten` Vorgabe `aktionen.nahkampf` (z.B. Dolch 70, Fasshammer 150)
+ Kampfwerte am Wesen (`KAMPFWERTE`): `kampfwerte: { ausweichen, willenskraft, blocken, ruestung, kritchance, heimlichkeit, entdecken, kennerschaft }`, Vorgabe je 0 (Heimlichkeit siehe Wahrnehmung, Entdecken siehe [Welt.md](Welt.md), Gelände, Kennerschaft siehe [Gegenstaende.md](Gegenstaende.md), Unbekanntes)
  + `ausweichen`: Verteidigung gegen körperliche Angriffe und Geschosse; `willenskraft`: Verteidigung gegen Psi (und Magie, wo die Daten es sagen) (`VERTEIDIGUNGEN`)
  + `blocken`: fängt einen schon gelungenen Treffer ganz ab (Schild, Schleimhülle); `ruestung`: fester Abzug je Treffer; `kritchance`: Chance der Angreiferin auf einen Krit
+ Dazu `widerstaende: { saeure: 100, feuer: -50 }` und `immun: ["psi"]` am Wesen
+ Marker als Tags an Angriff oder Effekt (`MARKER`): `verfehlt_nie` (kein Trefferwurf), `unblockbar` (kein Blocken und keine Ersatzwirkung, die den Treffer abfängt, siehe [Wirkungen.md](Wirkungen.md), Ersatzwirkungen), `ignoriert_ruestung`
+ Regelwerte `regeln.kampf`: `grundverteidigung` 20, `halbwertWiderstand` 100, `halbwertBlocken` 50, `halbwertKritchance` 50, `kritfaktor` 150 (x1,5), `mindestschadenNachRuestung` 1; alle Zahlen vorläufig

Schnittstellen (`src/systeme/kampf.js`):

+ `angriffeVon(spiel, wesen)`: einziger Zugriff auf die Profile; angelegte Waffen ersetzen die eigenen (siehe [Gegenstaende.md](Gegenstaende.md), Ausrüstung), die eigenen kommen aus `eigeneAngriffeVon` (siehe [Architektur.md](Architektur.md), Entitäten und Komponenten)
+ `kampfwert(spiel, wesen, name)`: über Modifikatoren mit gleichnamigem Ziel, nie unter 0
+ `trefferanteil(spiel, { quelle, ziel, genauigkeit, gegen, tags })` liefert die Trefferchance als Bruch ohne zu würfeln, Grundlage für Vorschau, Tooltip und KI; `anteilInProzent` nur für die Anzeige
+ Baustein `trefferwurf { genauigkeit, effekt, gegen?, sonst?, kritchance? }` für Fernkampf, Magie, Psi und Flächen; `gegen` Vorgabe `ausweichen`, Psi z.B. `willenskraft`; `sonst` wirkt bei einem Fehlschlag, z.B. halber Schaden einer Explosion, der man ausweicht (Vorbild Rettungswurf); wo kein Wurf passt, lassen die Daten ihn weg
+ Baustein `angreifen { profil? }` siehe [Wirkungen.md](Wirkungen.md), Effektsystem
+ Haken: `vor_angriff` vor jedem einzelnen Angriff mit dem Namen des Profils (`angriff`), ein Abbruch lässt diesen Angriff aus (Furcht, Ladehemmung); `verfehlt` (mit `grund` `ausgewichen` oder `geblockt`), `nach_treffer` (mit `kritisch`), `vor_schaden` mit den Rängen der Schadensrechnung (`RANG_ANGREIFER` 50, `RANG_RUESTUNG` 200, `RANG_WIDERSTAND` 300, `RANG_ERSATZ` 400 in `src/kern/hakenkatalog.js`)
+ Meldungen: `verfehlt` (mit `grund` und `trefferchance`), `hinterhalt`, `schaden` mit `schadensart`, `kritisch`, `kritfaktor` (Prozent, ohne Krit `null`), `ruestungAbzug`, `widerstanden`, `immun` und `trefferchance` (aus dem Trefferwurf davor, im Effektkontext weitergereicht, ohne Trefferwurf `null`); das Log zeigt die Art, eigene Zeilen für Krit, Immunität und Blocken und die Zahlen in der Kampfspalte (siehe [Anzeige.md](Anzeige.md), Log)

Regeln:

+ Grundsatz: Kampfwerte sind Punkte, die sich addieren (wie alle Modifikatoren); erst am Ende werden sie über einen Halbwert zu einem Anteil `punkte / (punkte + halbwert)`, der sich 100 % nur annähert; jede weitere Quelle hilft, aber immer weniger
+ Gerechnet wird nur mit ganzen Zahlen und Brüchen, nicht mit `Math.exp` oder `Math.pow`, die nicht in jedem Browser bit-genau gleich sind; gewürfelt wird der Bruch exakt (`wurfAnteil` in `src/kern/wurf.js` mit den Würfen `treffer`, `blocken`, `kritisch`, siehe [Architektur.md](Architektur.md), Zufall und Wiederholbarkeit), sichere Fälle würfeln nicht
+ Jeder Schritt `schaden` nennt Pflicht seine `art`; das Mittel ist davon getrennt ein Tag am Effekt: ein magischer Feuerball macht `feuer` mit dem Tag `magie`
+ Eine Angriffsaktion führt alle Profile nacheinander in der Reihenfolge der Daten aus, jedes mit eigenem Trefferwurf und, mit `muster`, eigener Zielauswahl; ein Profil mit `chance` (Prozent) wird nur so oft mitgenommen, kommt keines zum Zug, greift das erste; wessen Lebenswert schon bei 0 liegt, wird von weiteren Profilen derselben Aktion nicht mehr angegriffen (Vorbild sind Monster mit mehreren Angriffen in DCSS)
+ Die Aktion kostet so viel wie ihr langsamstes Profil, Modifikatoren auf `kosten.nahkampf` und `kosten.alle` wirken darauf; ein schnelles Wesen greift so gegen ein langsames öfter an (Vorbild Waffenverzögerung in DCSS)
+ Ablauf eines Angriffs: Trefferwurf, Blocken, Krit-Wurf; das Ergebnis nennt `trefferchance` (Prozent vor dem Blocken, gegen Ahnungslose 100, nur für das Log); Treffer wirken den Effekt mit `kritisch` im Kontext
+ Trefferchance: `genauigkeit / (genauigkeit + verteidigung + grundverteidigung)`; die Genauigkeit über Modifikatoren der Quelle (ohne Quelle, z.B. bei einer Falle, unverändert), die Verteidigung nach `gegen`; die Grundverteidigung sorgt dafür, dass auch ein Ziel ohne eigene Verteidigung nicht sicher getroffen wird; Genauigkeit 80 gegen Ausweichen 0 trifft so zu 80 %, gegen 80 zu 44 %
+ Blocken: `blocken / (blocken + halbwertBlocken)`; Kritchance ebenso mit `halbwertKritchance`, die `kritchance` des Angriffs kommt zu der des Wesens
+ Schadensrechnung am Haken `vor_schaden`, feste Ränge: Angreiferin (50: Modifikator `schaden` mit den Tags und der Schadensart, danach Krit mit `kritfaktor`), Handler ohne Rang (100, z.B. Abfangen), Rüstung (200), Widerstand und Immunität (300), Ersatzwirkungen (400, eine Barriere fängt nur, was danach noch Schaden ist)
+ Krit: Modifikatoren auf `kritfaktor` heben ihn nach oben offen; er wirkt vor der Rüstung, Krits schlagen sich also besser durch Panzer
+ Rüstung: fester Abzug, ein Treffer mit Schaden behält mindestens `mindestschadenNachRuestung`; `ruestung` wirkt nur gegen Arten mit `ruestung: true`, `ruestung.<art>` aus Modifikatoren gegen genau diese Art, z.B. eine säurefeste Schürze mit `ruestung.saeure`; den Abzug auf das Ausweichen nennt jede Rüstung selbst als Modifikator auf `ausweichen` in ihren Daten
+ Widerstand R in Punkten aus `widerstaende` und Modifikatoren auf `widerstand` mit der Art als Tag (ohne Tag gegen alles): Schaden × H / (H + R); mit dem Halbwert H 100 halbieren 100 Punkte, 300 Punkte lassen ein Viertel; negative Punkte machen verwundbar, Schaden × (H − 2R) / (H − R), das nähert sich dem Doppelten (−100 Punkte: x1,5); einmal gerundet
+ Immunität als Sonderfall: `immun` am Wesen oder ein Modifikator auf `immunitaet` mit der Art als Tag (Betrag über 0), Schaden genau 0
+ Hinterhalt: Ein Angriff mit Quelle auf ein ahnungsloses Ziel (siehe Wahrnehmung) trifft sicher, wird nicht geblockt und ist kritisch; mehr Schaden im Hinterhalt geben Modifikatoren mit der Bedingung `gegenueber_ahnungslos`, z.B. auf `kritfaktor` für einen Dolch-Skill
+ Keine Gelegenheitsangriffe: wer sich von einem Gegner wegbewegt, wird dafür nicht angegriffen

## Kampfzustand

Ein Wesen ist im Kampf, solange sein letzter Angriff, eigener oder erlittener, kurz zurückliegt. Bisher fragt nur der Beistand danach; Rasten, Erholung und Abläufe können es später tun.

+ Am Wesen `kampfZuletzt`: Zeitpunkt des letzten Treffers, Fehlschlags oder Schadens zwischen zwei Wesen, gesetzt an beiden (Haken `nach_treffer`, `verfehlt`, `nach_schaden`); Fallen und Fässer bringen niemanden in den Kampf
+ `imKampf(spiel, wesen)` (`src/systeme/kampfzustand.js`): wahr, solange seit `kampfZuletzt` weniger als `regeln.kampf.nachwirkung` vergangen ist (500); ein Zeitstempel statt eines Zeitereignisses, nichts muss ablaufen

## Fraktionen

Vorbild Caves of Qud: Feindliche greifen an, Neutrale tun nichts, werden aber feindlich, wenn man sie absichtlich trifft; der Ruf je Fraktion ist eine Zahl, Schwellen machen eine Fraktion freundlich oder feindlich, Mitglieder kommen einander zu Hilfe.

Daten:

+ Fraktion (`daten/fraktionen.js`): `{ text, beziehungen?: { andereFraktion: "feind" | "neutral" | "verbuendet" }, rufFest? }` (`BEZIEHUNGEN`); die Tabelle nennt nur Abweichungen von `regeln.fraktionen.beziehungVorgabe` (Vorgabe `feind`); `rufFest: true` lässt sich durch keinen Ruf umstimmen
+ Am Wesen `fraktion`, überlagerbar durch Zustände (siehe [Wirkungen.md](Wirkungen.md), Zustände); `zornAuf: [IDs]` für einzelnen Zorn; `beistandFuer: { angreiferinId: [Gegner-IDs] }` für Beistand
+ Im Zustand `ruf: { fraktion: Zahl }`, ein fehlender Eintrag heißt 0
+ Regeln in `regeln.fraktionen`: `rufTraeger` (`ninkasi`), `rufGrundwert` (feind -100, neutral 0, verbündet 100), `rufSchwellen` (feind -50, verbündet 50), `rufToetungFeind` (10), `rufToetungEigene` (-25), `rufNurMitZeugen` (true); die Datenprüfung verlangt, dass jeder Grundwert in der Zone seiner Beziehung liegt

Schnittstellen (`src/systeme/fraktionen.js`):

+ `beziehungZwischen(spiel, urheber, entitaet)` mit `urheber = { id, fraktion }` (`urheberVon`) ist die eine Quelle für `feindlich`, `trifft` (Zielauswahl, Auren, KI) und die Anzeige "In Sicht"; `beziehung` zwischen zwei Fraktionen, mit Ruf
+ `rufBei(spiel, fraktion)`, `rufAendern(spiel, fraktion, menge)`; Baustein `ruf_aendern { fraktion, wuerfel | menge }` (auch negativ) für Gespräche, Quests und Opfer
+ Meldungen `zorn`, `beistand` (`wer`, `fuer`), `ruf` (`fraktion`, `menge`, `ruf`)

Regeln:

+ Die Datenprüfung verlangt, dass jedes Wesen eine bekannte Fraktion trägt
+ Eine Beziehung gilt in beide Richtungen; sagen beide Seiten etwas anderes, gewinnt die strengere (feind vor neutral vor verbuendet); gleiche Fraktion ist verbündet, `eigene:<nummer>` (Zwietracht) mit allen verfeindet
+ Neutrale greift man nicht durch Hineinlaufen an, nur ausdrücklich (`angreifen: true`)
+ Zorn: Trifft oder verfehlt eine Urheberin ein neutrales Wesen oder schadet ihm, werden es und alle Wesen seiner Fraktion, die die Urheberin gerade sehen, ihr gegenüber feindlich; jedes merkt sich das einzeln (`zornAuf`, gilt in beide Richtungen und vor Tabelle, Ruf und Beistand); wer nichts mitbekommt, bleibt neutral; das gilt auch für ein Wesen, das ihr beisteht, sein Beistand endet damit
+ Ruf: gehört der Fraktion `rufTraeger` und gilt für jedes Wesen, dessen wirksame Fraktion sie gerade ist (Ninkasi, später Begleiter); Ansehen = Grundwert der Beziehung aus der Tabelle + Ruf bei der anderen Fraktion, bis zur Schwelle feind feind, ab der Schwelle verbündet verbündet, dazwischen neutral; bei Ruf 0 gilt die Tabelle; zwischen zwei anderen Fraktionen zählt kein Ruf; trägt Ninkasi eine fremde Fraktion (Verkleidung, Besessenheit), gelten deren Beziehungen
+ Ruf durch Tötung: tötet ein Wesen der Fraktion `rufTraeger` (bei Beschworenen zählt die Beschwörerin) ein Wesen einer anderen Fraktion, ändert sich der Ruf bei jeder Fraktion, die das Opfer ausdrücklich in der Tabelle als Feind führt, um `rufToetungFeind` (die Vorgabe feind zählt nicht, sonst stiege er bei allen), und bei der Fraktion des Opfers um `rufToetungEigene`; mit `rufNurMitZeugen` nur, wenn ein Wesen der jeweiligen Fraktion Täterin oder Opfer sieht (ein Zeuge reicht); unter fremder Fraktion ändert sich nichts
+ Beistand: greift eine Urheberin ein Wesen an, stehen ihr Zuschauerinnen bei, die ihr neutral gegenüberstehen, deren Fraktion mit der des Opfers verfeindet ist und die sie sehen; sie merken sich das Opfer in `beistandFuer`, sind ihr gegenüber verbündet (in beide Richtungen, nur statt neutral), wachen auf und jagen das Opfer (`wachzustand: "jagt"`, `letzteBekanntePosition`); weitere Gegner kommen dazu; der Beistand gilt, solange einer dieser Gegner noch da ist (nicht tot, auf derselben Ebene) und Helferin oder Urheberin im Kampf sind (siehe Kampfzustand); Feindliche leisten keinen Beistand

## Wahrnehmung

Vorbilder: Brogue (Heimlichkeitsweite, Chance je Zug, Spur verlieren, Angriffe auf Ahnungslose), Pathfinder (der Sinn Scent: Ort ja, Art nicht, https://www.aonprd.com/Rules.aspx?ID=434).

Daten:

+ Wachzustand in der KI-Komponente (`WACHZUSTAENDE`): `ki.wachzustand` `schlaeft`, `wach` oder `jagt` (Vorgabe `jagt`); in den Daten z.B. `ki: { modul: "jagen", wachzustand: "schlaeft" }`; dazu `letzteBekanntePosition`
+ Am Akteur `letzteAktion` (gesetzt in `befehlAusfuehren`, siehe [Architektur.md](Architektur.md), Befehle)
+ Spüren: Komponente `spueren: { reichweite }` am Wesen (Lesefunktion `spuerenVon`), Modifikatorziel `reichweiteSpueren`, ohne Komponente 0 (auch Ninkasi)
+ Regelwerte `regeln.wahrnehmung`: `heimlichkeitVorgabe` 7, `heimlichkeitMindestens` 2, `heimlichkeitNachAktion` (Nahkampf und Fähigkeit 200 %, Warten 50 %), `bemerkenChance` 25, `spurFaktor` 3, `laermNahkampf` 6, `laermWurf` 4; Lärmdämpfung des Geländes `laermdaempfung` (Wand 8) in `daten/gelaende.js`

Schnittstellen:

+ `src/systeme/sicht.js`: `sieht` (Ninkasi sieht, was in ihrem Sichtfeld liegt; alle anderen sehen ein Ziel mit freier Sichtlinie innerhalb ihrer Sichtweite, auch Ninkasi, wenn genug Licht auf seinem Feld liegt, siehe [Welt.md](Welt.md), Licht), `reichweiteSicht`, `sichtImDunkeln`, `hellGenug`, `sichtfeldAktualisieren` (PreciseShadowcasting aus rot.js), `istSichtbar`, `kandidatenInSicht`
+ `src/systeme/sinne.js`: Register `sinne` (`{ art, reichweite(spiel, betrachter), nimmtWahr(spiel, betrachter, ziel) }`, die Anmeldereihenfolge ist der Vorrang): `sehen` (Art `gesehen`, über `sieht`), `spueren` (Art `gespuert`, über `spuert`); `wahrnehmungsart(spiel, betrachter, ziel)` (die Art des ersten Sinns, der wahrnimmt, sonst `null`; Arten in `WAHRNEHMUNGSARTEN`), `nimmtWahr`, `kandidatenWahrnehmbar` (für die gesteuerte Entität alle mit Position, sonst der Umkreis der größten Reichweite ihrer Sinne), `wesenMitWahrnehmungsart`, `reichweiteSpueren`, `offenFuerSpueren`
+ `src/systeme/wahrnehmung.js`: `wahrnehmen` (vor dem Zug eines Wesens mit KI, aus `warteschlangeAbarbeiten`), `wachzustandVon`, `istAhnungslos`, `heimlichkeitsweite`, `spurweite`, `laermMachen`, `laermFelder`; Baustein `laerm { lautstaerke }`
+ Meldungen `bemerkt`, `aufgewacht`, `laerm` (mit `geraeusch` aus `GERAEUSCHE`: `nahkampf`, `aufschlag`, `sonstiges`, und `gesteuerteHoert`, nicht bei eigenem Lärm; siehe [Anzeige.md](Anzeige.md), Anzeige)

Regeln:

+ `schlaeft`: tut nichts, bis es jemanden bemerkt (dann `jagt`) oder Lärm hört (dann `wach`); `wach`: hat noch niemanden bemerkt, geht Lärm nach, sonst zieht es umher (siehe KI); `jagt`: verfolgt das nächste wahrgenommene Ziel innerhalb der Spurweite (`spurFaktor` mal die Heimlichkeitsweite des Ziels), nimmt es keins wahr, folgt es dem Duft der gesteuerten Entität (siehe [Welt.md](Welt.md), Duft); findet es an der letzten bekannten Position niemanden mehr und führt kein frischer Duft weiter, wird die eigene KI wieder `wach` (eine überlagerte KI wie Rausch bleibt, wie sie ist)
+ Heimlichkeitsweite eines Ziels: Kampfwert `heimlichkeit` (Vorgabe `heimlichkeitVorgabe`) mit Modifikatoren auf `heimlichkeit` (Skills), dann nach der letzten eigenen Aktion und nach der Lichtstufe des eigenen Felds skaliert (siehe [Welt.md](Welt.md), Licht), gerundet, nie unter `heimlichkeitMindestens`
+ Bemerken: Vor dem Zug eines Wesens mit eigener KI, das nicht jagt, würfelt es für jedes wahrgenommene (gesehene oder gespürte) feindliche Ziel innerhalb von dessen Heimlichkeitsweite mit `bemerkenChance`, nach Abstand und ID
+ Wer getroffen, verfehlt oder geschädigt wird, jagt sofort und kennt die Position der Urheberin
+ Ahnungslos ist ein Wesen mit KI, das nicht jagt; Angriffe darauf sind ein Hinterhalt (siehe Kampfwerte)
+ Lärm breitet sich aus wie eine Wegsuche mit Kosten: ein passierbares Feld kostet 1, anderes Gelände seine `laermdaempfung`, ohne Angabe dringt nichts durch; wer innerhalb der Lautstärke liegt, hört ihn: Schlafende werden wach, Wache gehen der Quelle nach, wer jagt, bleibt dabei; jeder Nahkampf macht Lärm
+ Dichter Rauch versperrt Ninkasis Sichtfeld und die Sichtlinie aller anderen (siehe [Welt.md](Welt.md), Feldschichten)
+ Sehen braucht Licht: auf einem finsteren Feld sieht ein Wesen ein Ziel nur bis `sichtImDunkeln`; Nachtsicht und Fernsicht wirken als Modifikatoren auf `sichtImDunkeln` und `reichweiteSicht` (siehe [Welt.md](Welt.md), Licht und Sichtweite)
+ Arten der Wahrnehmung: ein Ziel ist gesehen, gespürt oder gar nicht wahrgenommen; die KI jagt, bemerkt und flieht nach allem, was sie auf irgendeine Art wahrnimmt; Ninkasis Sehen ist ihr Sichtfeld, ihr Spüren dasselbe wie bei allen anderen
+ Spüren: ein Ziel innerhalb von `reichweiteSpueren` Schritten, ohne Licht und ohne Rücksicht auf Rauch, entlang dessen, was offen ist: jeder Schritt auf ein Nachbarfeld (auch schräg) kostet 1, offen ist ein Feld, das Gas durchlässt oder für irgendeine Bewegungsart passierbar ist (Wasser, Abgrund); Wände und geschlossene Türen halten es auf; das Feld des Ziels selbst muss nicht offen sein
+ Durch Wände spüren nur künftige Sinne wie Telepathie (siehe [Ausblick.md](Ausblick.md), Hellsicht, Spüren, Unsichtbarkeit)

## KI

Vorbilder: Brogue (Monster mit Abstand, `MONST_MAINTAINS_DISTANCE`; kein Bolt durch Verbündete; Umherziehen über Wegpunkte und Rudel mit Anführerin, `Monsters.c`), DCSS (Häufigkeit je Monsterzauber), Hoplite und Into the Breach (angekündigte Angriffe mit sichtbarem Zielfeld), Utility-KI nach Dave Mark (Infinite Axis Utility System: Bewertung je Handlung über Eingaben und Kurven, Quellen in [Ausblick.md](Ausblick.md), Recherche).

Daten:

+ KI-Komponente: `ki: { modul, trifft?, wachzustand?, umherziehen? (Vorgabe true), duftFolgen? (Vorgabe true, siehe [Welt.md](Welt.md), Duft), handlungen?, wahl?, vorrang?, ...Parameter des Moduls }`; zur Laufzeit dazu `anfuehrerinId` (Mitglied eines Rudels, gesetzt von der Population, siehe [Welt.md](Welt.md), Ebenen) und `wanderung: { tiefe, ziel, besucht: [Nummer] }` (Wegpunkte der Ebene in Tiefe `tiefe`) (die alten Felder `faehigkeiten` und `abstandHalten` an der KI weist die Datenprüfung mit ihrem Ersatz ab)
+ Handlungen: `handlungen: [{ handlung, gewicht? (Vorgabe 100), chance? (Prozent), abstandAb?, abstandBis?, wenn?, bewertung?: [{ eingabe, kurve }], ...Parameter der Handlung }]`; Grundhandlungen `faehigkeit { name }` (die Datenprüfung verlangt sie in der eigenen Liste `faehigkeiten` am Wesen), `nutzen { zweck }` (eine eigene oder gewährte Fähigkeit oder einen Gegenstand im Gepäck, der dem Zweck dient), `abstand_halten { abstand }`, `fliehen`, `warten`, `verfolgen`
+ Wahl: `wahl: "erste"` (Vorgabe) | `"beste"` | `"gewichtet"` | `{ gewichtetUnterBesten: n }`
+ Eingaben der Bewertung: `abstand` (Schachbrett zur Beute), `eigeneLpProzent`, `beuteLpProzent`, `zielLpProzent` (LP des Ziels der Handlung), `feindeInSicht`, `verbuendeteInSicht`; Kurven wie überall (`src/kern/kurven.js`), Werte in Promille von 0 bis 1000; statt der Stützpunkte kann `kurve` den Namen einer Kurve aus `regeln.ki.kurven` tragen, die alle Wesen teilen (vorläufig `heilenNachLp`: dringend bis 20 % LP, ab 80 % gar nicht); Regelwerte `regeln.ki.wegpunktSicht` (7, siehe [Welt.md](Welt.md), Ebenen) und `regeln.ki.rudelAbstand` (5)
+ Zwecke: `regeln.ki.zwecke` (vorläufig `heilen`, `angriff`); `zweck: [name]` an einer Fähigkeit und an den Nutzungen eines Gegenstands (`trinkbar.zweck`, `wurf.zweck`) sagt, wozu die KI sie mit `nutzen` wählt; die Datenprüfung kennt nur Zwecke aus der Liste
+ Ausstattung: `ausstattung: [{ typ, anzahl? }]` am Wesen legt beim Erzeugen Gegenstände ins Gepäck (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)
+ Beispiel: `{ handlung: "fliehen", bewertung: [{ eingabe: "eigeneLpProzent", kurve: [[0, 1000], [30, 1000], [31, 0]] }] }` vor den Angriffen: unter 31 % LP flieht das Wesen
+ Beispiel: `{ handlung: "nutzen", zweck: "heilen", chance: 50, bewertung: [{ eingabe: "eigeneLpProzent", kurve: "heilenNachLp" }] }` (mit einem Bier in der Ausstattung): unter 80 % LP trinkt es in der Hälfte der Fälle
+ Beispiel Heiler: `{ handlung: "nutzen", zweck: "heilen", bewertung: [{ eingabe: "zielLpProzent", kurve: "heilenNachLp" }] }` mit einer Fähigkeit mit Zielart `{ art: "wesen", trifft: "verbuendete" }`: heilt den bedürftigsten Verbündeten in Sicht, auch sich selbst, keinen über 80 % LP
+ Vorrangbefehl (Laufzeit, für Begleiter): `vorrang: { anweisung: "angreifen" | "warten" | "folgen", zielId?, bis? }`; gesetzt wird er später über einen Befehl Ninkasis, die KI liest ihn schon
+ Regelwert `regeln.bewegung.umwegHoechstens` (4)

Schnittstellen:

+ Verhaltensmodule im Register `ki` (`(spiel, akteur, ki) => befehl`, `src/ki/`, geladen über `src/ki/index.js`): `abwarten`, `jagen` (siehe Wahrnehmung), `fliehen` (weg von der Bedrohung, ist kein Feld weiter weg, wartet es)
+ Zielwahl `naechstesWahrgenommenesZiel`, `istZielFuer` (`src/ki/ziele.js`); Schrittwahl `schrittWeg` (`src/ki/schritte.js`) für Flucht und Abstand
+ `src/ki/handlungen.js`: `handlungWaehlen(spiel, wesen, ki, beute)` (Befehl, `VERFOLGEN` oder `null`), `wertung(spiel, wesen, beute, eintrag, ziel?)`; Register `kihandlungen` (`{ parameter, zielwahl?, befehl(spiel, wesen, beute, eintrag, ziel) }`, ohne Nebenwirkungen, weil die Wahl alle Einträge und Ziele fragt; `zielwahl` tragen `faehigkeit` und `nutzen`) und `kieingaben` (`(spiel, wesen, beute, ziel) => ganze Zahl`)
+ `faehigkeitsbefehl(spiel, wesen, name, ziel, beute?)` (`src/ki/faehigkeitenwahl.js`): der Befehl einer Fähigkeit gegen das Ziel oder `null`
+ `umherziehbefehl(spiel, wesen, ki)` (`src/ki/umherziehen.js`): der Befehl eines wachen Wesens ohne Spur; verändert `ki`, darum nur für den gewählten Befehl
+ `taktikbefehl(spiel, taktik)` (`src/ki/taktik.js`): der Befehl, mit dem die gesteuerte Entität nach einer Taktik aus `daten/taktiken.js` kämpft (`{ text, handlungen, wahl? }` im Format der Handlungen, geprüft wie die KI eines jagenden Wesens); Beute ist der nächste wahrgenommene Feind, die Wahl läuft über `handlungWaehlen`, kommt keine Handlung in Frage oder heißt sie `verfolgen`, setzt sie nach und greift an (`verfolgungsbefehl` mit einer Wegwerf-KI, der Zustand bleibt unberührt); nimmt sie keinen Feind wahr, geht sie zum nächsten, den es gibt, sonst wartet sie; genutzt vom automatischen Kampf in der Arena, vom Werkzeug `werkzeuge/arena.js` und vom Bot (siehe [Architektur.md](Architektur.md), Spielarten); Taktiken vorläufig `nahkampf` (trinkt unter 40 % LP, sonst Nahkampf) und `fernkampf` (dazu ab Abstand 2 `nutzen` mit Zweck `angriff`: Fähigkeiten, dann Würfe; dafür trägt die `testfaehigkeit` den Zweck `angriff`)
+ `nutzbefehl(spiel, wesen, zweck, ziel, beute?)` (`src/ki/nutzen.js`): der Befehl für `nutzen` gegen das Ziel oder `null`; Register `nutzungen` (`{ feld, ziel: "selbst" | "beute", befehl(spiel, wesen, ziel, gegenstand) }`, ohne Nebenwirkungen): ein Gegenstand dient einem Zweck über eine Nutzung, wenn `gegenstand[feld].zweck` ihn enthält, und nur für das Ziel nach `ziel`; angemeldet von den Systemen, die den Befehl kennen: `trinken` (Feld `trinkbar`, Ziel `selbst`, `src/systeme/inventar.js`), `werfen` (Feld `wurf`, Ziel `beute`, `src/systeme/werfen.js`)
+ `verfolgungsbefehl`, `angriffDaneben`, `duftfolgebefehl` (siehe [Welt.md](Welt.md), Duft) (`src/ki/verfolgen.js`); `geltenderVorrang`, `vorrangBefehl` (`src/ki/vorrang.js`)
+ `kiVon` (`src/kern/zustand.js`) liefert die wirksame KI, auch eine überlagerte

Regeln:

+ Nimmt das jagende Wesen seine Beute wahr (gesehen oder gespürt, siehe Wahrnehmung), wählt es eine Handlung, vor Nahkampf und Bewegung; ein Eintrag kommt in Frage, wenn `gewicht` und `chance` nicht 0 sind, der Abstand (Schachbrett) zur Beute im Bereich liegt und es ein Ziel gibt, für das `wenn` am Wesen gilt (Gegenüber ist das Ziel), die Wertung über 0 liegt und die Handlung einen Befehl liefert (bei `faehigkeit`: `faehigkeitPruefen` wendet nichts ein, auch nicht die Vorabprüfung der Wirkung, an der Obergrenze teilt sich also keine Zelle, und kein Verbündeter wäre betroffen); erst dann wird `chance` gewürfelt (sichere Fälle würfeln nicht)
+ Ziele: `faehigkeit` und `nutzen` prüfen die Beute, das Wesen selbst und die lebenden sichtbaren Verbündeten nach Abstand (Schachbrett) und ID; der Eintrag zählt mit seinem besten Ziel, bei Gleichstand dem früheren; alle anderen Handlungen haben die Beute als Ziel; das Ziel passt zu einer Fähigkeit nach ihrer Zielart: `selbst` nur das Wesen selbst, mit `trifft: "verbuendete"` jedes verbündete Wesen (auch es selbst), sonst nur die Beute; zu einem Gegenstand nach dem `ziel` der Nutzung; ob sich das Ziel lohnt, sagt die Bewertung (`zielLpProzent`), ohne sie wäre das Wesen selbst als nächstes Ziel vorn
+ Wertung: `gewicht` mal je Bewertung den Wert der Kurve an der Stelle der Eingabe in Promille (abgeschnitten auf 0 bis 1000), nach jedem Faktor abgerundet; ohne Ausgleichsfaktor für viele Bewertungen (er bräuchte eine Potenz), das Gewicht gleicht aus
+ Wahl: `erste` nimmt den ersten Eintrag, der in Frage kommt (die Reihenfolge ist der Vorrang); `beste` den mit der höchsten Wertung, bei Gleichstand den früheren; `gewichtet` würfelt nach Wertung (`wurfGanzzahl`, Wurf `ki_wahl`), `gewichtetUnterBesten` nur unter den n besten; ein einziger Kandidat würfelt nicht
+ Kommt keine Handlung in Frage oder fällt die Wahl auf `verfolgen`, setzt das Wesen der Beute nach (Weg zur letzten bekannten Position, Angriff auf ein Ziel im Weg)
+ Nimmt ein jagendes Wesen ohne Vorrang keine Beute wahr, folgt es zuerst dem Duft der gesteuerten Entität (siehe [Welt.md](Welt.md), Duft), sonst geht es zur letzten bekannten Position
+ Vorrang: gilt vor der eigenen Wahl, außer im Schlaf; `angreifen` macht `zielId` zur Beute (die Position ist bekannt, gesehen wird es nur in Sicht), auch wenn es nach `trifft` keins wäre, und endet, wenn das Ziel fort oder tot ist; `warten` bleibt stehen und wehrt sich nur gegen ein Ziel daneben; `folgen` geht zu `zielId` (Vorgabe Ninkasi), bis es daneben steht, dort wie `warten`; ab `bis` gilt der Vorrang nicht mehr und wird gelöscht
+ Verbündete schonen: zählt unter den Betroffenen aus `zielAufloesen` ein anderes Wesen als verbündet, unterbleibt die Fähigkeit, außer die Zielart trifft ausdrücklich `verbuendete`; mit `ueberVerbuendete` an der Zielart fliegen Geschosse darüber
+ Zielangabe nach Zielart: `wesen` und `geschoss` das Ziel, `feld` sein Feld (angekündigte Angriffe zielen so auf das Feld beim Beginn), `selbst` keine, `richtung` zum Ziel, nur wenn es daneben steht
+ Umweg: steht auf dem nächsten Feld des Weges ein Wesen, das kein Ziel ist (ein Verbündeter im Gang), sucht der Jäger einen Weg um alle Wesen herum (`wesenMeiden`) und nimmt ihn, wenn er höchstens `umwegHoechstens` Felder länger ist; sonst wartet er (Vorbild Brogue); so gehen Rudel um den Vordermann herum, ohne sich in langen Gängen zu verlaufen
+ `nutzen { zweck }`: erst die Fähigkeiten mit dem Zweck in der Reihenfolge von `faehigkeitenVon` (eigene, dann gewährte, siehe [Wirkungen.md](Wirkungen.md), Fähigkeiten) (wie die Handlung `faehigkeit`, also mit derselben Zielwahl und Zielangabe), dann die Gegenstände im Gepäck in dessen Reihenfolge; das erste, das einen Befehl liefert, gilt; trinken geht immer, geworfen wird auf die Beute nur, wenn die Bahn sie als erstes Wesen trifft (kein Verbündeter davor, kein Fluch); ob sich das Nutzen lohnt, sagt die Bewertung, nicht die Handlung
+ Unterstützung gibt es nur im Kampf: ohne Wahrnehmung der Beute wählt die KI keine Handlung, auch kein Heilen (Heilen nach dem Kampf kommt mit den Befehlen an Begleiter)
+ Umherziehen (Vorbild Brogue): ein waches Wesen ohne Vorrang, das keinem Lärm nachgeht, zieht von Wegpunkt zu Wegpunkt (`ebene.wegpunkte`); der erste wird gewürfelt (Wurf `umherziehen`), erreicht ist einer auf höchstens einem Feld Abstand oder wenn er von hier nicht erreichbar ist, dann kommt er zu `besucht` und es geht zum nächsten unbesuchten (Schachbrett, bei Gleichstand der frühere); sind alle besucht, beginnt die Liste neu ohne den gerade erreichten; auf einer anderen Ebene beginnt die Wanderung neu; mit `umherziehen: false` oder unbeweglich wartet es wie ein Wächter
+ Schritt beim Umherziehen: über die Abstandskarte des Wegpunkts (siehe [Welt.md](Welt.md), Wegfindung) auf das freie Nachbarfeld, das ihm am nächsten ist, in fester Richtungsfolge, ohne gefährliche Felder und Fallen; ist keins frei, wartet es
+ Rudel: ein Mitglied mit `anfuehrerinId` zieht nicht selbst, sondern geht zur Anführerin (Weg um Wesen herum), wenn sie mehr als `rudelAbstand` Felder entfernt ist, sonst wartet es; ist sie fort oder tot, vergisst es sie und zieht allein weiter
+ `abstand_halten { abstand: n }`: steht die Beute näher als n, weicht das Wesen zurück (in die Ecke gedrängt kein Befehl, dann greift es normal an), auf genau n Feldern wartet es, bei mehr kommt die Handlung nicht in Frage
+ Ungültige Befehle der KI werden zu `warten`; handlungsunfähige Wesen warten (siehe [Architektur.md](Architektur.md), Zeitmodell)

## Bewegung

Vorbilder: Brogue (fliegende Wesen über Abgrund und Wasser, unbewegliche Totems, zerplatzende Würfe, Lärm des Aufschlags als Ablenkung), DCSS (Aufprall beim Stoß für beide, Teleport auf das nächste freie Feld), Into the Breach (vorhersagbarer Aufprall).

Daten:

+ Befehle (`src/systeme/bewegung.js`): `{ art: "bewegen", dx: -1..1, dy: -1..1, angreifen? }`, `{ art: "warten" }`; Werfen: `{ art: "werfen", gegenstandId, ziel: { x, y } | { id } }`
+ Bewegungsarten am Wesen: `bewegung`, Vorgabe `laufend`, sonst `fliegend`, `schwebend`, `phasend`, `unbeweglich`; ein Zustand überlagert sie mit `bewegung` (Levitation, Phasen)
+ Gelände: `passierbar: true` gilt für alle, `passierbarFuer: [Arten]` für einzelne (Abgrund für `fliegend`, Wasser für `fliegend` und `schwebend`), `undurchdringlich: true` hält auch `phasend` auf, `beimFestsitzen` (Effekt)
+ Arten des Versetzens (`VERSETZARTEN`): `schritt`, `stoss`, `zug`, `tausch`, `teleport`, `herausgedrueckt`
+ Werfen: am Gegenstand `wurf: { reichweite?, effekt? }`; Regelwerte `regeln.werfen.reichweite` (6), `regeln.bewegung.beimFestsitzen` (`eingeklemmt`, 2W6 stumpf, vorläufig), Zeitkosten `aktionen.werfen`

Schnittstellen:

+ `versetzen(spiel, wesen, feld, art, { urheberId, kettentiefe })` (`src/systeme/bewegung.js`) für alles, was Wesen bewegt, mit den Haken `verlaesst_feld` und `betritt_feld` (Ziel das bewegte Wesen, Quelle wer es bewegt, `position` das Feld, `art`); `istUnbeweglich`
+ `betretbar(spiel, wesen, feld)` (`src/welt/karte.js`) gilt für Schritte, Wege (Option `bewegung` in `src/welt/wege.js`), Schrittwahl der KI, Beschwören, Reise und Erkunden; `bewegungVon` (`src/kern/zustand.js`) liefert die wirksame Bewegungsart wie bei Fraktion und KI, `oeffnetTueren` (`src/welt/karte.js`) fragt `tuerenVon`
+ Bausteine (`src/systeme/verschieben.js`):
  + `stossen { weite, wuerfel|menge, art? }`: weg vom Ursprung entlang der verlängerten Linie durch das Ziel (Schlag: die Angreiferin, Explosion: die Mitte; liegt der Ursprung auf dem Ziel, zählt die Quelle); Meldung `gestossen`
  + `ziehen { weite }`: zum Ursprung hin, höchstens bis daneben, Hindernisse halten ohne Schaden auf; Meldung `gezogen`
  + `tauschen`: Quelle und Ziel tauschen die Plätze, wenn jedes das Feld des anderen betreten kann; Meldung `getauscht`
  + `teleportieren { wer?, muster?, zufaellig? }`: das Ziel (mit `wer: "quelle"` die Quelle, z.B. Blinzeln) aufs Zielfeld, mit `muster` auf ein zufälliges freies Feld des Musters, mit `zufaellig` auf ein zufälliges freies Feld der Ebene; Meldung `teleportiert`
+ Zustandsprüfung `lage` (Register `zustandspruefungen`, nach dem Tod), Meldungen `festgesessen` und `herausgedrueckt`
+ Werfen (`src/systeme/werfen.js`): Meldungen `geworfen`, `geschoss`, `zerbrochen` bzw. `gelandet`; Gründe der Ablehnung `nichts_zu_werfen` und die der Zielauswahl

Regeln:

+ `bewegen` greift durch Hineinlaufen Feinde an, mit `angreifen: true` jedes Wesen (gezielter Angriff, Rausch, Verwirrung); `warten` wartet eine Aktion
+ Jedes Wesen belegt genau ein Feld, auch ein Boss; Bossphasen laufen über Auslöser mit Bedingungen (siehe [Wirkungen.md](Wirkungen.md), Auslöser)
+ Was eine Bewegungsart kann, sagen die Daten des Geländes; `phasend` betritt jedes Gelände außer `undurchdringlich`; `unbeweglich` steht, wo `laufend` steht; Sicht und Lärm hängen weiter am Gelände selbst
+ Unbeweglich: der Schritt auf ein freies Feld wird mit `unbeweglich` abgelehnt, Angreifen durch Hineinlaufen geht; `jagen` setzt Fähigkeiten ein, greift an, was daneben steht, und wartet sonst; Stoßen, Ziehen, Tauschen und Teleportieren wirken nicht
+ Stoßen geht Feld für Feld, bis ein Hindernis aufhält: festes Gelände, das das Ziel nicht betreten kann, ein Wesen, der Kartenrand; dann Aufprall mit der Menge je verbliebenem Feld als Schaden (`art` Vorgabe `stumpf`, Tag `aufprall`), ein Wesen als Hindernis bekommt denselben Schaden; die Menge läuft durch die gewöhnliche Schadensrechnung, so skaliert sie über die Daten, Modifikatoren der Urheberin und Rüstung des Ziels
+ Gelände, das das Ziel nicht betreten kann, aber nicht fest ist (Abgrund, Wasser), hält beim Stoßen nicht auf: das Ziel landet darin, die Lageprüfung folgt
+ Teleportieren: ist das Zielfeld besetzt oder nicht betretbar, aufs nächste freie (Breitensuche); gezogen wird aus einer festen Reihenfolge
+ Lage: steht ein lebendes Wesen auf einem Feld, das es mit seiner wirksamen Bewegungsart nicht betreten kann (Phasen endet in der Wand, Levitation über dem Abgrund, hineingestoßen), wirkt `beimFestsitzen` des Geländes, sonst `regeln.bewegung.beimFestsitzen`; lebt es danach, wird es aufs nächste freie Feld gedrückt; ein Sturz in einen Abgrund auf die Ebene darunter ist noch nicht umgesetzt
+ Werfen entlang der Bahn eines Geschosses (bis zum ersten Wesen oder vor die Wand), Reichweite `wurf.reichweite` am Gegenstand, sonst `regeln.werfen.reichweite`; mit `wurf.effekt` zerbricht der Gegenstand am Aufschlag und der Effekt wirkt dort (Ziel das getroffene Wesen, Ursache `wurf`), sonst landet er auf dem Feld; am Aufschlag entsteht Lärm (`laermWurf`), dem Wache nachgehen; im Browser über das Inventarfenster (w) und den Zielmodus (siehe [Bedienung.md](Bedienung.md), Zielmodus)

## Stoffwechsel

Daten:

+ Der Pegel ist ein Wert in Hundertsteln Promille (100 entsprechen 1 ‰), ohne Grundwert und damit nach oben offen
+ Komponente `stoffwechsel` (`src/systeme/stoffwechsel.js`, Werte für Ninkasi in `daten/ninkasi.js`): Abbau des Pegels, Schwellen und je Wert eine Kurve der Regeneration über dem Pegel (Hundertstel je Welttick, Kurven siehe [Architektur.md](Architektur.md), Entitäten und Komponenten)

Schnittstellen:

+ Handler der Weltuhr (Register `welttick`): je Welttick Regeneration oder Schwund nach den Kurven, danach Abbau des Pegels
+ Modifikatoren: `regeneration.<wert>` auf positive Raten, `schwund.<wert>` auf den Betrag negativer Raten, `kurvenverschiebung.<wert>` verschiebt die Kurve nach rechts (z.B. Optimum der LP nach oben), `abbau.pegel` auf den Abbau; Quellen sind Skills, Schriftrollen, Items und Zustände

Regeln:

+ Negative Kurvenwerte sind Schwund, für jeden Wert möglich; Schwund der LP kann töten (Ursache `schwund.<wert>`)
+ Bruchteile laufen über Speicher in Hundertsteln (siehe [Architektur.md](Architektur.md), Zeitmodell)

## Skills und Lernen

Spieldesign in [Charakter.md](Charakter.md); hier die Umsetzung. Alle Zahlen vorläufig.

Daten:

+ Eigenschaften (`daten/eigenschaften.js`): Körperlichkeit, Trinkfestigkeit, Gewandtheit, Sinnlichkeit, Klugheit, Braukunde; Grundwerte an Ninkasi als `eigenschaften: { koerperlichkeit: 14, ... }`, vorläufig 14, 14, 13, 13, 13, 13 als ausgewogene Vorgabe der Charaktererstellung
+ Skills (`datenproben/skills.js`): `{ text, set, tier, rang?, primaer, sekundaer, voraussetzungen?, freischaltung?, jeStufe?, abStufe?, lernt?, verwandt? }`; Tier 1 bis 4 (Grund, Experte, Meister, göttlich), je Set jeder Tier einmal; `rang` ohne Angabe aus `raengeNachTier`; `voraussetzungen: [{ skill, stufe }]`; `jeStufe` (nur `plus` und `prozent`); `abStufe: { 3: { modifikatoren?, ausloeser? } }`; `lernt: [{ anlass, tags? }]`; `verwandt: [{ skill, anteil }]`
+ Lernstand an Ninkasi: `skills: { name: { lernpunkte, rest } }`, `freieEp`, `freigeschaltet: [name]`, `erkundet`; gebundene EP an Wesen: `ep` in den Daten, Beitragsbuch `beitraege: [{ anlass, tags }]`, `topfId`; Töpfe in `zustand.toepfe`
+ Anforderungen an Ausrüstung: `ausruestung.anforderung: { koerperlichkeit: 15 }`, wahlweise `abzugJePunkt`
+ Regelwerte `regeln.lernen`: `eigenschaftStart` 10, `eigenschaftPunkte` 20, `eigenschaftHoechstens` 20, `bezugswert` 40, `stufen` (50, 100, 200, 350, 550), `raengeNachTier` (1, 2, 4, 8), `tierVoraussetzungen` (Experte: Grund 3; Meister: 4, 3; göttlich: 5, 4, 3), `startEp` 300, `epJeFeld` 1, `verrechnung` ("multiplizieren" oder "addieren"), `gewichtung` ("erste"), `topfFaktor` 3, `ort` ("jederzeit"), `anforderungAbzug` (Genauigkeit und Schaden je -5 %)

Schnittstellen:

+ `src/systeme/skills.js`: Eigenschaften (`eigenschaftWirksam`), Stufen, Modifikatorquellen `skills` und `anforderungen`, Auslöserquelle `skills`, Bedingungen `skill_ab`, `eigenschaft_ab`, `eigenschaft_unter`, Befehl `lernen`, Bausteine `eigenschaft_aendern { eigenschaft, wuerfel|menge }` und `skill_freischalten { skill }`; Lesefunktionen für das Charakterfenster siehe [Bedienung.md](Bedienung.md), Fenster
+ `src/systeme/lernen.js`: `lernenEinrichten` (beim Spielbeginn, prüft die Eigenschaften der Startoption), `epFuerErkundung`, `beitragEintragen`, `epAufteilen`, `topfVon`; Lernanlässe im Register `lernanlaesse` (`LERNANLAESSE`: `wirkung`, `ausgewichen`, `geblockt`, `ruestung`, `schaden_erlitten`)
+ Startoption: `neuesSpiel(daten, startwert, { eigenschaften })` ersetzt die Vorgabe; die Optionen gehören zum Spielstand
+ Befehl `lernen { skill, ep }` ohne Zeitkosten (`ohneZeit`); Ablehnungen `ungueltig`, `unbekannter_skill`, `nicht_freigeschaltet`, `skill_voraussetzung`, `hoechststufe`, `zu_wenig_ep`
+ Meldungen `gelernt`, `skillstufe`, `skill_freigeschaltet`, `eigenschaft_geaendert`, `ep_erhalten { wer, opfer, ep, skills: [{ skill, ep }], frei }`; das Log zeigt nur, was Ninkasi lernt

Regeln:

+ Vorübergehende Änderungen der Eigenschaften sind Modifikatoren auf `eigenschaft.<name>`; das Lerntempo rechnet mit dem Grundwert, Anforderungen und Bedingungen mit dem wirksamen Wert; `eigenschaft_aendern` ändert den Grundwert dauerhaft (mindestens 1, nach oben offen)
+ Die Startoption wird gegen `eigenschaftStart`, `eigenschaftPunkte` und `eigenschaftHoechstens` geprüft
+ Ohne Lernkomponenten (Unittests mit eigener Ninkasi) bleibt das Lernen still
+ Umrechnung beim Eingang: Lernpunkte = EP x (2 x primär + sekundär) / `bezugswert`, ganzzahlig mit `rest`; Stufen 1 bis 5 bei den aufsummierten Schwellen aus `stufen` x Rang; Stufen gehen nie verloren
+ Voraussetzungen: die der Tiers aus `tierVoraussetzungen` im selben Set und die eigenen; die Datenprüfung verbietet Kreise; ein gesperrter, nicht freigeschalteter oder vollendeter Skill nimmt keine EP auf, auch keine gebundenen
+ `freischaltung: true`: lernbar erst nach dem Baustein `skill_freischalten` (Braubücher, Rezepturen)
+ Wirkung: `jeStufe` wächst mit der Stufe, ein Prozent wird bei `verrechnung: "multiplizieren"` zu einem `mal` (100 + Prozent x Stufe), bei `"addieren"` bleibt es `prozent`; `abStufe` gilt ab der Stufe unverändert; Auslöser der Skills über das Register `ausloeserquellen` (siehe [Wirkungen.md](Wirkungen.md), Auslöser)
+ `lernen` verteilt freie EP; mehr EP als bis Stufe 5 nötig werden nicht abgebucht; `regeln.lernen.ort` hält eine spätere Ortsbindung offen (nur `jederzeit` umgesetzt)
+ Freie EP: Startguthaben `startEp`, dazu `epJeFeld` je Feld, das Ninkasi zum ersten Mal sieht (`sichtfeldAktualisieren`, gezählt über `erkundet`); ein kartiertes Feld ist nur erinnert und bringt erst beim Sehen EP, ein vergessenes beim Wiedersehen keine mehr (siehe [Welt.md](Welt.md), Sicht und Erinnerung)
+ Gebundene EP: je Anlass und Tags ein Eintrag im Beitragsbuch (Gewichtung `erste`):
  + `wirkung`: Ninkasi ist Urheberin eines Treffers, eines Schadens (mit der Schadensart als Tag) oder eines Zustands (dessen Tags) am Wesen; Tags von Angriff, Fähigkeit und Effekt; wirkt eine Beschworene Ninkasis, zählt es für Ninkasi mit dem Tag `beschworen`
  + `ausgewichen`, `geblockt`: das Wesen verfehlt Ninkasi
  + `ruestung`: Ninkasis Rüstung fängt Schaden des Wesens ab (Haken `vor_schaden` nach dem Rang der Rüstung)
  + `schaden_erlitten`: das Wesen fügt Ninkasi Schaden zu
+ Verteilung beim Tod (Haken `nach_tod`), gleich wer tötet, sobald das Buch einen Eintrag hat: die EP zu gleichen Teilen je Bucheintrag, je Eintrag zu gleichen Teilen auf die Skills, deren `lernt` passt (gleicher Anlass, Tags des Skills im Eintrag enthalten); `verwandt` gibt zusätzlich Anteile an verwandte Skills (Querlernen); Rundungsreste, Einträge ohne passenden Skill und was ein Skill nicht aufnimmt, werden freie EP
+ Topf je Abstammungslinie: `beschwoeren` mit `abstammung: true` (Zellteilung) gibt dem neuen Wesen die `topfId` der Quelle; hat sie keine, eröffnet sie einen Topf mit ep x `topfFaktor`; wer zu einem Topf gehört, bringt höchstens den Rest darin
+ Anforderungen an Ausrüstung: je fehlendem Punkt (wirksamer Wert) gilt der Abzug einmal, für die Trägerin insgesamt (Quelle `anforderungen`), ein Prozentabzug sinkt nicht unter -100; feiner über Tags der Angriffsprofile später
+ Der Bot gibt zufällige Lernbefehle, verteilt jede zweite Partie die Eigenschaften neu, prüft den Lernstand (ganzzahlig, höchstens Stufe 5, keine freien EP verloren, jede Verteilung geht auf) und gibt das EP-Budget je Tiefe aus (Erkundung, gebunden, frei aus Beute)

## Tests

+ `tests/kampf.test.js` (Trefferwurf, Blocken, Krit, Schadensrechnung, Profile), `tests/fraktionen.test.js` (Beziehungen, Zorn, Ruf, Kampfzustand, Beistand), `tests/wahrnehmung.test.js` (Wachzustand, Bemerken, Lärm, Hinterhalt), `tests/sinne.test.js` (Arten der Wahrnehmung, Spüren entlang offener Felder, Bemerken und Jagen nach Gespürtem), `tests/faehigkeitenwahl.test.js`, `tests/verhalten.test.js`, `tests/handlungen.test.js` (auch Ziele unter Verbündeten), `tests/nutzen.test.js` und `tests/arena.test.js` (KI, Taktik), `tests/umherziehen.test.js` (Wegpunkte, Wachzustand der Population, Umherziehen, Rudel, Abstandskarte), `tests/verschieben.test.js` (Bewegungsarten, Stoßen, Ziehen, Tauschen, Teleportieren, Lage, Werfen), `tests/wege.test.js`, `tests/stoffwechsel.test.js`, `tests/skills.test.js` und `tests/lernen.test.js`

## Verweise

+ Spieldesign: Gegner und Pegel in [Grundlagen.md](Grundlagen.md), Eigenschaften, Skills und EP in [Charakter.md](Charakter.md)
+ Offene Reste in [Systemausbau.md](Systemausbau.md): Punkt 10 (Zeitskala, Machtkurve, Anfangsbalance), Punkt 14 (Makel und Vorzüge, Kampfwerte aus Skills), Punkt 20 (Skillkatalog), Punkt 21 (Skills für Anhänger)

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
