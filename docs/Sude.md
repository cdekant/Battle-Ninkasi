# Battle Ninkasi - Sude

Stand: 2026-11-25

Zuständig für: `src/systeme/sud.js`, `src/systeme/brauen.js`, `daten/sude.js`

Mitprüfen bei Änderungen: [Brauen.md](Brauen.md), [Gegenstaende.md](Gegenstaende.md), [Bedienung.md](Bedienung.md)

## Zweck

Das Brausystem in der Logik: wie aus Zutaten, Verfahren und Kultur das Profil eines Suds wird, wann er ein Zielgebiet trifft, wie der Befehl am Kessel abläuft und was das Getränk beim Trinken wirkt. Das Spieldesign steht in [Brauen.md](Brauen.md), das Fenster zum Brauen in [Bedienung.md](Bedienung.md), Fenster. Jeder Abschnitt nennt Daten, Schnittstellen und Regeln.

## Profil

Daten:

+ Achsen in `regeln.brauen.achsen`, ihre Reihenfolge ist fest: die Kennzahlen `stammwuerze` und `alkohol` in Zehnteln (°Plato bzw. Vol.-%), `bittere` in IBU und `farbe` in EBC wie in `daten/bierstile.js`, dazu die Aromen (`malz`, `roest`, `frucht`, `kraeuter`, `saeure`, `suesse`) als Anteile bis 100; je Achse `{ hoechstens, stufe, unschaerfe }`: `hoechstens` begrenzt die Achse und ist der Maßstab der Anzeige, `stufe` rundet das fertige Profil, `unschaerfe` ist die halbe Breite der Vorschau
+ Zutat am Gegenstand: `zutat: { art: "grundstoff" | "gewuerz", extrakt?, farbe?, bitter?, aromen? }`; `extrakt`, `farbe` und `bitter` gelten für einen ganz mit dieser Zutat gefüllten Kessel, `aromen` sind Anteile bis 100
+ Verfahren: `regeln.brauen.maische` (je Art `{ vergaerung, aromen? }`, Punkte der Vergärung und Zuschläge auf Aromen), `regeln.brauen.gewuerz` (je Gabe `{ bitter, aroma }` in Prozent der Beiträge eines Gewürzes), Vorgabe `regeln.brauen.verfahren`
+ Kultur in `kulturen`: `{ text, vergaerung, vertraegt, aromen?, verderben? }`; `vergaerung` in Prozent, `vertraegt` ist der höchste Alkohol in Zehnteln Vol.-%, `aromen` kommen zum Profil dazu, `verderben` sind Punkte auf die Chance des Verderbens; die Kulturen eines Wesens stehen in `kulturen: [name]` (Proben ohne Gewicht, siehe [Brauen.md](Brauen.md), Kulturen)

Schnittstellen (`src/systeme/sud.js`, reine Rechnung ohne Zustand):

+ `profilBerechnen(daten, { zutaten: [{ typ, menge }], verfahren, kultur, fasst })` gibt die Mitte des Profils
+ `unschaerfeBerechnen(daten, prozent)`, `bereichBerechnen(daten, mitte, unschaerfe)` (je Achse `[unten, oben]`), `profilRunden`, `gueteRunden`, `achsenVon`, `aromaachsenVon`, `KENNZAHLEN`

Regeln:

+ Stammwürze, Farbe und Bittere sind die Summe der Beiträge mal Menge, geteilt durch `fasst` des Kessels: ein halb gefüllter Kessel gibt einen halb so starken Sud
+ Ein Gewürz trägt seine Bittere mit `gewuerz.<gabe>.bitter` Prozent bei und seine Aromen mit `aroma` Prozent: früh gekocht bitter, spät gegeben aromatisch
+ Alkohol = Stammwürze x Vergärung x `regeln.brauen.alkoholJeStammwuerze` Prozent, höchstens `vertraegt` der Kultur; die Vergärung ist die der Kultur plus die der Maische (kühl mehr, warm weniger), zwischen 0 und 100; ohne Kultur gärt nichts, der Alkohol bleibt 0
+ Aromen sind das nach Menge gewichtete Mittel der Zutaten, dazu die Aromen der Kultur und der Maische; jede Achse bleibt zwischen 0 und `hoechstens`
+ Alles in ganzen Zahlen, abgerundet; gerundet wird kaufmännisch auf `stufe`

## Zielgebiete

Daten:

+ `zielgebiete`: `{ text, familie, spannen: { <achse>: [unten, oben] }, bonus?, effekt? }`; `text` ist das Hauptwort des Getränks, nicht genannte Achsen sind frei, `bonus` sind Prozent auf das Budget der Wirkung (Vorgabe 100), `effekt` wirkt beim Trinken zusätzlich
+ `regeln.brauen.gueteAmRand`, `gueteStufe`, `gueteFrei`

Schnittstellen: `imZielgebiet(profil, zielgebiet)`, `zielgebietFinden(daten, profil)` (gibt `{ name, guete }` oder null), `erreichbareZielgebiete(daten, bereich)` (für die Vorschau)

Regeln:

+ Ein Profil trifft ein Zielgebiet, wenn jede genannte Achse in ihrer Spanne liegt, Grenzen eingeschlossen; treffen mehrere, gewinnt das engste (die kleinste Summe der Breiten in Promille ihrer Achse), bei gleicher Enge das erste der Daten
+ Güte eines Treffers: in der Mitte jeder Spanne 100, am Rand `gueteAmRand`, dazwischen linear; es zählt die schlechteste Achse; gespeichert abgerundet auf `gueteStufe`; ein Sud ohne Zielgebiet hat `gueteFrei`
+ Erreichbar ist ein Zielgebiet, wenn sich der Bereich der Vorschau auf jeder genannten Achse mit seiner Spanne überschneidet; noch ohne Nebel (siehe [Systemausbau.md](Systemausbau.md), Punkt 23)

## Befehl

Daten:

+ Kessel am Gelände: `kessel: { fasst, portionen, verderben?, unschaerfe? }`; `fasst` Einheiten (eine Einheit ist ein Stück einer Zutat), `portionen` gibt der Kessel höchstens her, `verderben` sind Punkte auf die Chance, `unschaerfe` Prozent der Unschärfe (Vorgabe 100)
+ Gefäß am Gegenstand: `gefaess: true` (die leere Flasche)
+ `regeln.brauen.verderben` (Chance vor Kessel und Kultur), `regeln.brauen.getraenk` und `regeln.brauen.verdorben: { getraenk, achse, plus, guete }`, `gewichtJePortion`; Zeitkosten `aktionen.brauen`

Schnittstellen (`src/systeme/brauen.js`):

+ Befehl `brauen { kessel?: { x, y }, zutaten: [{ gegenstandId, menge }], verfahren?: { maische, gewuerz }, kultur? }`; ohne `kessel` der erste Kessel neben oder unter der Brauerin (eigenes Feld, dann die Nachbarn zeilenweise)
+ Ablehnungen: `im_kampf`, `kein_kessel`, `keine_zutaten`, `keine_zutat`, `zu_viel` (mehr, als der Stapel hat), `kessel_voll`, `kultur_unbekannt`, `keine_gefaesse`, `ungueltig` (Menge unter 1, dieselbe Zutat zweimal, unbekanntes Verfahren)
+ Meldungen: `gebraut`, `gebraut_getroffen` (mit `zielgebiet`), `gebraut_verdorben`, je mit `wer`, `was` und `anzahl`
+ `sudVorbereiten(spiel, wesen, befehl)` prüft und rechnet die Vorschau (`{ grund }` oder `{ kessel, eingabe, mitte, unschaerfe, bereich, erreichbar, fuellung, portionen }`), ohne den Kampf zu prüfen; `verderbenChance`, `kesselBei`, `zutatenIm`, `gefaesseIm`

Regeln:

+ Vorschau und Befehl rechnen dasselbe; die Unschärfe ist die der Achsen mal `unschaerfe` des Kessels, mit Modifikatoren auf `brauen.unschaerfe`
+ Der Wurf `brauen` setzt je Achse in fester Reihenfolge den Punkt gleichverteilt im Bereich (ohne Wurf, wenn der Bereich ein Punkt ist); danach entscheidet der Wurf `verderben` mit `regeln.brauen.verderben` plus Kessel plus Kultur, mit Modifikatoren auf `brauen.verderben`, zwischen 0 und 100
+ Ein verdorbener Sud wird `verdorben.getraenk`, seine Achse `verdorben.achse` steigt um `plus`, er hat die Güte `verdorben.guete` und kein Zielgebiet
+ Zutaten und je Portion ein Gefäß sind verbraucht, in der Reihenfolge des Gepäcks; Portionen sind `portionen` des Kessels, höchstens so viele wie leere Gefäße; ohne Gefäß wird nicht gebraut
+ Jede Portion ist ein Gegenstand aus `regeln.brauen.getraenk` mit dem gerundeten Profil in `sud: { profil, zielgebiet, guete }`, dem Text des getroffenen Zielgebiets, `wirdZu` ihres Gefäßes und dem Gewicht des Gefäßes plus `gewichtJePortion`; gleiche Portionen stapeln, weil sie in allen Komponenten gleich sind (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)
+ Ein Sud kostet `aktionen.brauen`, gebraut wird nur außerhalb des Kampfes (`imKampf`, siehe [Wesen.md](Wesen.md), Kampfzustand)

## Wirkung

Daten: `daten/sude.js` mit `sud` und `sud_verdorben` (trinkbar mit dem Effekt `sud_trinken` aus `daten/effekte.js`), `regeln.brauen.budgetProzent`, `wirkungen` (Aromaachse zu Wert), `wirkungOhneAroma`, `pegelProzent`

Schnittstellen: `wirkungBerechnen(daten, sud)` gibt `{ mengen: { <wert>: menge }, pegel, effekt }`; Baustein `sud_wirken` (ohne Parameter) liest den Sud aus der Ablage des Effekts, `kontext.werte.sud`, die das Trinken setzt (siehe [Gegenstaende.md](Gegenstaende.md), Inventar)

Regeln:

+ Budget = Stammwürze x `budgetProzent` x Güte x `bonus` des Zielgebiets, abgerundet
+ Das Budget verteilt sich anteilig nach den Aromen auf die Werte aus `wirkungen` (Malz und Süße heilen LP, Frucht und Säure füllen MP, Kräuter PP); Aromen ohne Eintrag (Röst) wirken noch nichts; ein Sud ohne Aroma gibt alles an `wirkungOhneAroma`
+ Geheilt wird über den Baustein `heilen`, der Pegel steigt über `wert_aendern` um Alkohol x `pegelProzent`; danach wirkt der Effekt des Zielgebiets mit demselben Kontext

## Tests

+ `tests/brauen.test.js` (Profil, Zielgebiete, Güte, Runden, Wirkung, Befehl, Wurf und Verderben, Ablehnungen, Braufenster und Klickregel, Datenprüfung)

## Verweise

+ Spieldesign: [Brauen.md](Brauen.md); Skills des Brauens: [Skills.md](Skills.md), Brauen
+ Probeinhalt (Zutaten, Kulturen, Zielgebiete, Tonkessel): [Entwicklung.md](Entwicklung.md), Probeinhalt
+ Offene Reste in [Systemausbau.md](Systemausbau.md), Punkt 23

Pflege: Dieses Dokument folgt [Dokumentation.md](Dokumentation.md), Pflichten bei jeder Änderung.
