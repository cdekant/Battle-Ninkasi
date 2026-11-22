// Titelbildschirm, Wahl der Läufe und der Arena (eingabe/titel.js, eingabe/arenawahl.js, docs/Titelbildschirm.md). Liest nur.
// Der Titel ist eine eigene Ebene (#titel in index.html) über der ganzen Seite: das Bild füllt das Fenster und darf
// seitlich und in der Höhe beschnitten werden (object-fit: cover, Fokuspunkt je Bild aus anzeige/titelbilder.js);
// links Name und Menü, rechts die Speicherplätze und ein Spruch aus dem Korpus, beide Spalten nur als weicher Verlauf
// ins Dunkle. Der Hintergrund ist ein eigenes Element, das später statt des Bildes auch eine laufende Karte zeigen kann
// (Vorführmodus). Fenster wie Einstellungen und Hilfe legen sich darüber (#fenster).
// umgebung zusätzlich: { plaetze, titelbild, spruch, version } (src/main.js)

import { fensterinhaltAnmelden, buchstabeHtml, buchstabeAttribut, zielAttribut } from "./fenster.js";
import { titelEintraege } from "../eingabe/titel.js";
import { ANZAHL_PLAETZE } from "../eingabe/speicherstand.js";
import { arenenListe, taktikDerWahl } from "../eingabe/arenawahl.js";

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (zeichen) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[zeichen]);

// Eine Zeile über einen Speicherplatz: leer, veraltet, unlesbar oder Tiefe, Zug und Datum, dahinter eine andere
// Spielart als "normal"
export function speicherplatzText(texte, platz, stelle) {
  const { text } = texte;
  const nummer = stelle + 1;
  if (!platz) return text("laeufe.leer", { platz: nummer });
  if (platz.grund === "version") return text("laeufe.veraltet", { platz: nummer, version: platz.version });
  if (platz.grund) return text("laeufe.kaputt", { platz: nummer });
  const { tiefe, zuege, gespeichertAm, spielart = "normal" } = platz.vorschau;
  const datum = gespeichertAm ? new Date(gespeichertAm).toLocaleDateString(text("sprache.code")) : "?";
  const zeile = text("laeufe.lauf", { platz: nummer, tiefe: tiefe ?? "?", zuege: zuege ?? "?", datum });
  return spielart === "normal" ? zeile : `${zeile} (${text(`ui.spielart.${spielart}`)})`;
}

function menueHtml(texte, plaetze, zustand) {
  const eintraege = titelEintraege(plaetze);
  const gewaehlt = Math.min(zustand.gewaehlt, eintraege.length - 1);
  return `<ul class="titel-menue">${eintraege.map((eintrag, stelle) => `<li${stelle === gewaehlt ? ' class="gewaehlt"' : ""}${buchstabeAttribut(stelle)}>${buchstabeHtml(stelle)}${texte.text(`titel.${eintrag}`)}</li>`).join("")}</ul>`;
}

function plaetzeHtml(texte, plaetze) {
  return Array.from({ length: ANZAHL_PLAETZE }, (_, stelle) => {
    const platz = plaetze[stelle] ?? null;
    const klasse = !platz ? "leer" : platz.grund ? "veraltet" : "";
    return `<li class="${klasse}"${zielAttribut({ stelle })}>${escapeHtml(speicherplatzText(texte, platz, stelle))}</li>`;
  }).join("");
}

function spruchHtml(spruch) {
  if (!spruch) return "";
  return `<blockquote class="titel-spruch">${spruch.verse.map(escapeHtml).join("<br>")}<cite>${escapeHtml(spruch.titel)}</cite></blockquote>`;
}

// Als Fensterinhalt nur für den Stapel (Hilfe darüber nennt die Tasten); gezeichnet wird er von titelHtml
fensterinhaltAnmelden("titel", ({ texte }) => ({ ebene: true, titel: texte.text("titel.name"), liste: "", fuss: texte.text("titel.fuss") }));

// HTML der Titelebene, wenn der Titel unten im Stapel liegt, sonst ""
export function titelHtml(umgebung, stapel) {
  const unten = stapel[0];
  if (unten?.art !== "titel") return "";
  const { texte, plaetze = [], titelbild, spruch, version } = umgebung;
  const { text } = texte;
  const bild = titelbild ? `<img class="titel-bild" src="${escapeHtml(titelbild.datei)}" alt="" style="object-position: ${titelbild.fokus.x}% ${titelbild.fokus.y}%">` : "";
  const hinweis = unten.zustand.hinweis ? `<p class="titel-hinweis">${text(unten.zustand.hinweis)}</p>` : "";
  return `<div class="titel-hintergrund">${bild}</div>
    <div class="titel-spalte titel-links">
      <h1 class="titel-name">${text("titel.name")}</h1>
      <div class="titel-untertitel">${text("titel.untertitel")}</div>
      ${menueHtml(texte, plaetze, unten.zustand)}
      ${hinweis}
      <div class="titel-fuss">${text("titel.fuss")}<br>${text("ui.version")}: ${escapeHtml(version)}</div>
    </div>
    <div class="titel-spalte titel-rechts">
      <h2>${text("titel.plaetze")}</h2>
      <ul class="titel-plaetze">${plaetzeHtml(texte, plaetze)}</ul>
      ${spruchHtml(spruch)}
    </div>`;
}

fensterinhaltAnmelden("laeufe", ({ texte, plaetze = [] }, zustand) => {
  const { text } = texte;
  const zeilen = Array.from({ length: ANZAHL_PLAETZE }, (_, stelle) => `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${escapeHtml(speicherplatzText(texte, plaetze[stelle] ?? null, stelle))}</li>`);
  const knoepfe = plaetze[zustand.gewaehlt] ? [{ taste: { code: "Delete" }, text: text("ui.knopf.loeschen") }] : [];
  return {
    titel: text(zustand.zweck === "ersetzen" ? "laeufe.titel_ersetzen" : "laeufe.titel"),
    liste: `${zustand.zweck === "ersetzen" ? `<p>${text("laeufe.alle_belegt")}</p>` : ""}<ul>${zeilen.join("")}</ul>`,
    fuss: text("laeufe.fuss"),
    knoepfe,
  };
});

// Wahl der Arena (eingabe/arenawahl.js): die Arenen mit ihren Wellen, darunter von Hand oder automatisch und die Taktik
function wellenText(texte, arena) {
  const { text } = texte;
  const teile = [];
  if (arena.wellen?.length) teile.push(text("arenawahl.wellen", { anzahl: arena.wellen.length }));
  if (arena.population) teile.push(text(arena.population.alle ? "arenawahl.population_alle" : "arenawahl.population", { tiefe: arena.population.tiefe, anzahl: arena.population.wellen ?? 0 }));
  return teile.join(", ");
}

fensterinhaltAnmelden("arenawahl", ({ texte, daten }, zustand) => {
  const { text } = texte;
  const arenen = arenenListe(daten);
  const zeilen = arenen.map((name, stelle) => `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}${zielAttribut({ stelle })}>${buchstabeHtml(stelle)}${escapeHtml(text(daten.arenen[name].text))} <span class="leise">${escapeHtml(wellenText(texte, daten.arenen[name]))}</span></li>`);
  const gewaehlteArena = arenen[zustand.gewaehlt];
  const taktik = gewaehlteArena ? taktikDerWahl(daten, zustand, gewaehlteArena) : null;
  const modus = zustand.automatisch ? text("arenawahl.automatisch", { taktik: taktik ? text(daten.taktiken[taktik].text) : "-" }) : text("arenawahl.von_hand");
  return {
    titel: text("arenawahl.titel"),
    liste: `<ul>${zeilen.join("") || `<li class="leise">${text("ui.leer")}</li>`}</ul><p>${escapeHtml(modus)}</p>`,
    fuss: text("arenawahl.fuss"),
    knoepfe: [
      { taste: { code: "Space" }, text: text(zustand.automatisch ? "arenawahl.knopf_hand" : "arenawahl.knopf_automatisch") },
      ...(zustand.automatisch ? [{ taste: { code: "Tab" }, text: text("arenawahl.knopf_taktik") }] : []),
    ],
  };
});
