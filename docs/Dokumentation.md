# Battle Ninkasi - Dokumentation

Stand: 2026-11-25

Zuständig für: `CLAUDE.md`

Mitprüfen bei Änderungen: [Entwicklung.md](Entwicklung.md), [Ausblick.md](Ausblick.md)

## Zweck

Wie die Dokumentation aufgebaut ist und gepflegt wird, damit sie ohne wiederkehrendes Aufräumen auf einem Stand bleibt: welche Arten von Dokumenten es gibt, wohin eine Aussage gehört, welchen Weg sie von der Idee bis zur Umsetzung nimmt und was bei jeder Änderung zu tun ist. CLAUDE.md nennt davon nur die Grundsätze und verweist hierher.

## Kaskade

Die Dokumente bilden eine Kaskade von allgemein nach speziell; jede Stufe verweist hinauf, statt zu wiederholen, und darf der höheren nicht widersprechen.

1. CLAUDE.md: Axiome, Designprinzipien, Ordner, Grundbegriffe als Wegweiser, Liste der Dokumente
2. Dokumentation.md: Regeln für alle Dokumente (dieses Dokument)
3. Grundlagen.md: das Spiel im Ganzen, Spielkern, offene Fragen des Spieldesigns
4. Design-Dokumente je Thema: Charakter, Skills, Brauen, Spielverlauf, Oberflaeche, Titelbildschirm, Animationen, Fundus (Stoff aus dem Korpus), Ausblick (Ideen)
5. Technische Dokumente je System: Architektur (Kern), dann Wirkungen, Wesen, Welt, Gegenstaende, Anzeige, Bedienung, Texte, Tileset, Entwicklung
6. Kommentare im Code: was die Datei tut, mit Verweis auf ihren Abschnitt im technischen Dokument

Regeln:

+ Was mehrere Themen betrifft, steht eine Stufe höher; was nur ein System betrifft, steht in dessen Dokument
+ Eine Aussage steht an genau einer Stelle; andere verweisen darauf, in Markdown als Link auf das Dokument mit dem Abschnitt dahinter ("siehe [Wesen.md](Wesen.md), KI"), im Code als `siehe docs/<Dokument>.md, <Abschnitt>`
+ Widersprechen sich Doku und Code oder zwei Dokumente, wird das gemeldet und nicht still einseitig angepasst

## Arten der Dokumente

+ Design-Dokument (ohne "Zuständig für"): sagt was und warum; keine Zahlen, Formeln, Dateien oder Schnittstellen, sondern Absichten und Verhältnisse ("etwa doppelt so schnell"); jeder Abschnitt endet mit genau einer Zeile "Umsetzung: siehe …", "Umsetzung: teilweise, siehe …; offen: …", "Umsetzung: offen" oder "Umsetzung: keine", deren Dokumente unter "Mitprüfen" stehen (ausgenommen Abschnitte wie Offen, Quellen, Recherche, Vorbilder, Entscheidungen)
+ Technisches Dokument (mit "Zuständig für"): sagt wie; Abschnitte mit Daten (Formate), Schnittstellen (Funktionen, Register, Haken, Meldungen) und Regeln (was immer gilt), am Ende Tests und Verweise; Zahlen stehen hier oder in `daten/regeln.js`; Maße der Oberfläche dürfen im Schema der Oberfläche stehen, weil sie Skizzen erklären
+ Arbeitsliste ([Systemausbau.md](Systemausbau.md)): nur offene, beschlossene Arbeit mit Status offen oder in Arbeit, eine Reihenfolge und die bekannten Fehler; nichts Erledigtes
+ Ausblick ([Ausblick.md](Ausblick.md)): Ideen ohne Entscheidung, je Eintrag Wichtigkeit (Einschätzung mit Datum), Vorbilder, Braucht, Berührt, Umbaurisiko (hoch, mittel, gering) und Vorkehrung, dazu eine Übersicht als Tabelle
+ Sammelstellen in [Entwicklung.md](Entwicklung.md): Messwerte (gemessene Zahlen mit Stand), Grundgerüst und Probeinhalt (was in den Daten steht); andere Dokumente nennen keine Messwerte und keinen Probeinhalt, sondern verweisen dorthin

## Wohin eine Aussage gehört

| Aussage | Ort |
|:--|:--|
| Axiom, Prinzip, Ordner, neuer Begriff | CLAUDE.md |
| Regel für die Doku | dieses Dokument |
| Idee ohne Entscheidung | Ausblick |
| Offene Frage des Spieldesigns | Abschnitt Offen in Grundlagen, Charakter oder Spielverlauf |
| Entscheidung des Spieldesigns, auch ein Verwerfen | Design-Dokument des Themas, als heute geltende Regel ("keine Gelegenheitsangriffe") |
| Beschlossene, noch offene Arbeit | Arbeitsliste |
| Umsetzung: Daten, Schnittstellen, Regeln, Zahlen | technisches Dokument des Systems |
| Gemessene Zahl | Entwicklung, Messwerte |
| Was der Probeinhalt oder das Grundgerüst enthält | Entwicklung, Probeinhalt bzw. Grundgerüst |
| Vorbild, Quelle | Abschnitt Vorbilder, Quellen oder Recherche des Themas |
| Bekannter Fehler | Arbeitsliste, Bekannte Fehler |
| Wie es zu etwas kam, alte Fassungen | Git-Historie, nicht die Doku |

## Lebenslauf einer Aussage

1. Idee: ein Eintrag im Ausblick
2. Entscheidung: das Spieldesign kommt ins Design-Dokument, die Arbeit als Punkt in die Arbeitsliste, der Eintrag im Ausblick wird gestrichen; eine verworfene Idee wird ebenso gestrichen, das Verwerfen steht als Regel im Design-Dokument
3. Umsetzung: das technische Dokument beschreibt sie, die Zeile "Umsetzung" im Design-Dokument zeigt darauf, der Punkt der Arbeitsliste wird gestrichen; bleibt ein Rest, steht nur der Rest dort
4. Änderung: die Aussage wird an ihrer Stelle neu gefasst, nicht ergänzt um "früher" oder "seit"; die alte Fassung steht in der Git-Historie

## Form

+ Kopf: "# Battle Ninkasi - <Thema>", "Stand: <Datum>", bei technischen Dokumenten "Zuständig für: …", dann "Mitprüfen bei Änderungen: …" (Nachbardokumente, gegenseitig; die Arbeitsliste nennt sie nicht)
+ Jede Datei in `src/`, `daten/`, `datenproben/`, `sprache/`, `grafik/`, `lib/`, `werkzeuge/`, `tests/`, jedes Startskript und CLAUDE.md hat genau ein zuständiges Dokument; neue Dateien bekommen es sofort, neue Dokumente einen Eintrag in CLAUDE.md
+ Listen mit `+`, keine Trennlinien, gerade Anführungszeichen; Namen im Code und in Daten in Backticks
+ Keine Versionsmarken ("seit 0.x"), keine Rückblicke, keine überholten Entscheidungen; Daten nur dort, wo eine Einschätzung ihren Zeitpunkt braucht (Wichtigkeit im Ausblick, Stand der Messwerte und der Arbeitsliste)
+ Überschriften sind Anker für Verweise: wer eine umbenennt, führt alle Verweise nach, auch in Code-Kommentaren
+ CLAUDE.md bleibt unter 12000 Zeichen, Ziel 10500; wird sie länger, wandert Einzelnes in ein Dokument

## Pflichten bei jeder Änderung

1. Das zuständige Dokument jeder geänderten Datei nachführen und die Dokumente aus seinem "Mitprüfen" prüfen
2. Die Kaskade hinauf prüfen: ändern sich Prinzipien, Ordner oder Begriffe, auch CLAUDE.md; ändert sich das Spiel im Ganzen, auch Grundlagen.md
3. Die Zeilen "Umsetzung" der betroffenen Design-Abschnitte nachführen
4. In der Arbeitsliste Umgesetztes streichen, neue Reste und Funde eintragen; im Ausblick Beschlossenes streichen
5. Messwerte ersetzen statt anhängen, Probeinhalt an seiner Sammelstelle beschreiben
6. "Stand" im Kopf jedes geänderten Dokuments setzen
7. Vor jedem Commit laufen `node --test` (darin die Prüfung der Doku) und `node werkzeuge/bot.js` fehlerfrei

## Prüfung

+ Automatisch (`tests/doku.test.js`, siehe [Entwicklung.md](Entwicklung.md), Tests und Balancing): Links und Verweise mit Abschnitt, genau ein zuständiges Dokument je Datei, jedes Dokument in CLAUDE.md, Länge von CLAUDE.md, Kopf mit "Mitprüfen" und gegenseitig, die Zeilen "Umsetzung"
+ Von Hand, weil kein Test es findet: Doppeltes, inhaltliche Widersprüche, Zahlen in Design-Dokumenten, Versionsmarken, Aussagen am falschen Ort; bei jeder Version für die berührten Dokumente und ihr "Mitprüfen"
+ Gründlich vor jedem neuen Abschnitt der Reihenfolge in der Arbeitsliste, spätestens alle zehn Feature-Versionen: alle Dokumente in Gruppen (Kern: Architektur, Wirkungen, Wesen; Welt: Welt, Gegenstaende; Oberfläche: Oberflaeche, Bedienung, Anzeige, Titelbildschirm; Design: Grundlagen, Charakter, Ausblick, Texte, Tileset, Animationen, Entwicklung), je Gruppe eine Fundliste zur Entscheidung

## Verweise

+ Prüfung der Doku im Einzelnen: [Entwicklung.md](Entwicklung.md), Tests und Balancing; Ablauf einer Version: [Entwicklung.md](Entwicklung.md), Ablauf einer Version
