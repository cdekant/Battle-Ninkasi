// Inhalte der Fenster Einstellungen und Befehlszeile (eingabe/einstellungsfenster.js, eingabe/befehlszeile.js) nach der
// Grammatik aus anzeige/fenster.js. Liest nur. Die Kopfzeile des Einstellungsfensters nennt alle Reiter (Prinzip 7).
// umgebung zusätzlich: { einstellungen, vorgaben, belegung, belegungsVorgabe } (src/main.js)

import { fensterinhaltAnmelden, buchstabeHtml, tastenname } from "./fenster.js";
import { REITER, EINSTELLUNGEN, einstellungenImReiter, einstellungLesen } from "../eingabe/einstellungskatalog.js";
import { tastenZeilen, ALLE_AUF_VORGABE } from "../eingabe/einstellungsfenster.js";
import { aenderbareTasten } from "../eingabe/belegunganpassen.js";
import { AKTIONEN, tastenDerAktion } from "../eingabe/aktionskatalog.js";
import { befehlstreffer, befehlseintraege } from "../eingabe/befehlszeile.js";
import "../eingabe/einstellungsfenster.js"; // meldet die Fensterart an
import "../eingabe/befehlszeile.js";

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (zeichen) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[zeichen]);

// Anzeige eines Werts: Schalter an oder aus, Auswahl mit eigenem Text, Zahl mit Einheit
export function wertText(texte, id, wert) {
  const { text, hatSchluessel } = texte;
  const eintrag = EINSTELLUNGEN[id];
  if (eintrag.art === "knopf") return text("einstellung.knopf");
  if (eintrag.art === "schalter" || eintrag.art === "listenschalter") return text(wert ? "einstellung.an" : "einstellung.aus");
  if (eintrag.art === "auswahl" && hatSchluessel(`einstellung.${id}.wert.${wert}`)) return text(`einstellung.${id}.wert.${wert}`);
  if (eintrag.art === "zahl" && wert === 0 && hatSchluessel(`einstellung.${id}.null`)) return text(`einstellung.${id}.null`);
  return eintrag.einheit ? `${wert} ${text(eintrag.einheit)}` : String(wert);
}

function reiterKopf(texte, aktiv) {
  return REITER.map((reiter) => `<span class="reiter${reiter === aktiv ? " gewaehlt" : ""}">${texte.text(`einstellung.reiter.${reiter}`)}</span>`).join("");
}

function einstellungenListe(umgebung, zustand) {
  const { texte, einstellungen, vorgaben } = umgebung;
  const { text } = texte;
  const ids = einstellungenImReiter(zustand.reiter);
  const zeilen = ids.map((id, stelle) => {
    const klasse = stelle === zustand.gewaehlt ? ' class="gewaehlt"' : "";
    const wert = einstellungLesen(einstellungen, id);
    return `<li${klasse}>${buchstabeHtml(stelle)}${text(`einstellung.${id}`)} <span class="wert-rechts">${escapeHtml(wertText(texte, id, wert))}</span></li>`;
  });
  const id = ids[zustand.gewaehlt];
  const details = id ? `<h2>${text(`einstellung.${id}`)}</h2><p>${text(`einstellung.${id}.erklaerung`)}</p>
    ${EINSTELLUNGEN[id].art === "knopf" ? "" : `<p class="leise">${text("einstellung.vorgabe")}: ${escapeHtml(wertText(texte, id, einstellungLesen(vorgaben, id)))}</p>`}` : "";
  return { liste: `<ul class="einstellungen">${zeilen.join("")}</ul>`, details, fuss: text("einstellung.fuss") };
}

function tastenListe(umgebung, zustand) {
  const { texte, belegung, belegungsVorgabe } = umgebung;
  const { text } = texte;
  const zeilen = tastenZeilen();
  // ein Ausschnitt um die gewählte Zeile, damit die Liste nicht über das Fenster wächst
  const von = Math.max(0, Math.min(zustand.gewaehlt - 8, zeilen.length - 18));
  const html = zeilen.slice(von, von + 18).map((aktion, versatz) => {
    const stelle = von + versatz;
    const gewaehlt = stelle === zustand.gewaehlt;
    if (aktion === ALLE_AUF_VORGABE) return `<li${gewaehlt ? ' class="gewaehlt"' : ""}>${text("einstellung.tasten.alle_vorgabe")}</li>`;
    const tasten = aenderbareTasten(belegung, aktion);
    const zellen = tasten.map((taste, nummer) => `<span class="taste${gewaehlt && nummer === zustand.tastenStelle ? " gewaehlt" : ""}">${escapeHtml(tastenname(texte, taste))}</span>`);
    zellen.push(`<span class="taste frei${gewaehlt && zustand.tastenStelle === tasten.length ? " gewaehlt" : ""}">+</span>`);
    const geaendert = JSON.stringify(tasten) !== JSON.stringify(aenderbareTasten(belegungsVorgabe, aktion)) ? ` <span class="leise">${text("einstellung.tasten.geaendert")}</span>` : "";
    return `<li${gewaehlt ? ' class="gewaehlt"' : ""}><span class="aktion">${text(AKTIONEN[aktion].text)}${geaendert}</span> ${zellen.join(" ")}</li>`;
  }).join("");
  let zeile = text("einstellung.tasten.fuss");
  if (zustand.aufnahme) zeile = text("einstellung.tasten.aufnahme");
  if (zustand.hinweis === "gesperrt") zeile = text("einstellung.tasten.gesperrt");
  if (zustand.konflikt) zeile = text("einstellung.tasten.konflikt", { andere: text(AKTIONEN[zustand.konflikt.verdraengt].text), taste: tastenname(texte, zustand.konflikt.neueTaste.code ? { code: zustand.konflikt.neueTaste.code } : zustand.konflikt.neueTaste) });
  const fest = `<p class="leise">${text("einstellung.tasten.fest")}</p>`;
  return { liste: `<ul class="tastenbelegung">${html}</ul>${fest}`, fuss: escapeHtml(zeile) };
}

fensterinhaltAnmelden("einstellungen", (umgebung, zustand) => {
  const inhalt = zustand.reiter === "tasten" ? tastenListe(umgebung, zustand) : einstellungenListe(umgebung, zustand);
  return { titel: umgebung.texte.text("aktion.einstellungen"), kopf: `<div class="reiterleiste">${reiterKopf(umgebung.texte, zustand.reiter)}</div>`, breit: true, ...inhalt };
});

fensterinhaltAnmelden("befehlszeile", (umgebung, zustand) => {
  const { texte, belegung } = umgebung;
  const { text } = texte;
  const treffer = befehlstreffer(befehlseintraege(umgebung), zustand.eingabe);
  const zeilen = treffer.map((eintrag, stelle) => {
    const tasten = eintrag.ziel.aktion ? tastenDerAktion(belegung, eintrag.ziel.aktion).map((taste) => tastenname(texte, taste)).join(", ") : "";
    return `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}>${escapeHtml(eintrag.text)}${tasten ? ` <span class="leise">${escapeHtml(tasten)}</span>` : ""}</li>`;
  });
  return {
    titel: text("aktion.befehlszeile"),
    kopf: `<div class="eingabezeile">:${escapeHtml(zustand.eingabe)}<span class="schreibmarke">▏</span></div>`,
    liste: `<ul>${zeilen.join("") || `<li class="leise">${text("befehlszeile.nichts")}</li>`}</ul>`,
    fuss: text("befehlszeile.fuss"),
  };
});
