// Bedienzeile am unteren Rand (docs/Oberflaeche.md, Bedienzeile): links die Schnellleiste, rechts die Knöpfe aus dem
// Aktionskatalog (KNOEPFE). Liest den Zustand nur; Klicks wertet src/main.js über data-platz und data-aktion aus.
// Je Platz: Taste, Name, Anzahl (Gegenstände) bzw. Abklingzeit in Zügen mit abgedunkeltem Platz, grau mit dem Grund
// im Tooltip, wenn er gerade nicht geht; davor die Nummer der aktiven Leiste. Plätze sind ziehbar (data-platz):
// auf einen anderen Platz tauscht, aus der Leiste heraus leert (src/main.js). Der Mindestpegel als eigene Kante folgt
// mit den Fähigkeiten Ninkasis.

import { faehigkeitFuer } from "../systeme/faehigkeiten.js";
import { spielerin } from "../kern/zustand.js";
import { KNOEPFE, AKTIONEN, tastenDerAktion } from "../eingabe/aktionskatalog.js";
import { aktivePlaetze, platzZustand, erstesStueck, platzSchluessel } from "../eingabe/schnellleiste.js";
import { tastenname } from "./fenster.js";
import { istUnbekannt } from "../systeme/kennen.js";

const escapeAttribut = (text) => String(text).replace(/[&"<>]/g, (zeichen) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[zeichen]);

export class Bedienzeile {
  constructor(element, texte, belegung) {
    this.element = element;
    this.texte = texte;
    this.belegung = belegung;
  }

  ersteTaste(aktion) {
    const taste = tastenDerAktion(this.belegung, aktion)[0];
    return taste ? tastenname(this.texte, taste) : "";
  }

  platzName(spiel, platz) {
    const { text, nomenForm } = this.texte;
    if (platz.art === "faehigkeit") return text(faehigkeitFuer(spiel, spielerin(spiel.zustand), platz.faehigkeit)?.text ?? platz.faehigkeit);
    const stueck = erstesStueck(spiel, platz.typ);
    if (stueck) return nomenForm(stueck, "nom", "ohne");
    // aufgebraucht: der Name aus den Daten, eine unbekannte Art mit ihrem Etikett (verrät nicht mehr als das Inventar)
    const vorlage = spiel.daten.gegenstaende?.[platz.typ];
    if (!vorlage?.text) return "?";
    const etikett = istUnbekannt(spiel.zustand, platz.typ) ? spiel.zustand.wissen.etiketten[platz.typ] : undefined;
    return nomenForm({ text: vorlage.text, ...(etikett && { etikett }) }, "nom", "ohne");
  }

  platzHtml(spiel, platz, stelle) {
    const { text, hatSchluessel } = this.texte;
    const aktion = Object.keys(AKTIONEN).find((name) => AKTIONEN[name].platz === stelle);
    const taste = `<span class="platz-taste">${this.ersteTaste(aktion)}</span>`;
    if (!platz) return `<button class="platz leer" data-platz="${stelle}" tabindex="-1">${taste}</button>`;
    const ziehen = ` draggable="true" data-ziehen="${escapeAttribut(platzSchluessel(platz))}"`;
    const zustand = platzZustand(spiel, platz);
    const klassen = ["platz", platz.art];
    if (zustand.grund) klassen.push("grau");
    if (zustand.abklingend > 0) klassen.push("abklingend");
    const zahl = zustand.abklingend > 0 ? `<span class="platz-zahl abklingzeit">${zustand.abklingend}</span>`
      : zustand.anzahl !== undefined ? `<span class="platz-zahl">${zustand.anzahl}</span>` : "";
    const name = this.platzName(spiel, platz);
    const grund = zustand.grund && hatSchluessel(`log.abgelehnt.${zustand.grund}`) ? ` · ${text(`log.abgelehnt.${zustand.grund}`)}` : "";
    return `<button class="${klassen.join(" ")}" data-platz="${stelle}"${ziehen} tabindex="-1" title="${escapeAttribut(name + grund)}">${taste}<span class="platz-name">${name}</span>${zahl}</button>`;
  }

  // leisten: Stand der Schnellleiste (eingabe/schnellleiste.js)
  anzeigen(spiel, leisten) {
    const { text } = this.texte;
    const nummer = `<span class="leiste-nummer" title="${escapeAttribut(text("ui.leiste_hinweis"))}">${leisten.aktiveLeiste + 1}</span>`;
    const plaetze = nummer + aktivePlaetze(leisten).map((platz, stelle) => this.platzHtml(spiel, platz, stelle)).join("");
    const knoepfe = KNOEPFE.map((aktion) => `<button class="knopf" data-aktion="${aktion}" tabindex="-1" title="${escapeAttribut(text(AKTIONEN[aktion].text))}">`
      + `<span class="knopf-taste">${this.ersteTaste(aktion)}</span> ${text(AKTIONEN[aktion].knopf)}</button>`).join("");
    this.element.innerHTML = `<div class="schnellleiste">${plaetze}</div><div class="knoepfe">${knoepfe}</div>`;
  }
}
