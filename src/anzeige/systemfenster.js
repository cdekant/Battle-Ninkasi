// Inhalte der Fenster Spielmenü, Bestätigung, Verlauf und Übersichtskarte (eingabe/menue.js, eingabe/verlauf.js,
// eingabe/karte.js) nach der Grammatik aus anzeige/fenster.js. Liest den Zustand nur.
// umgebung zusätzlich: { logzeilen, einstellungen, version } (src/main.js)

import { fensterinhaltAnmelden, buchstabeHtml, buchstabeAttribut } from "./fenster.js";
import { logzeileHtml } from "./log.js";
import { MENUE_EINTRAEGE, ENDE_EINTRAEGE } from "../eingabe/menue.js";
import { spielerin } from "../kern/zustand.js";
import { VERLAUF_FILTER, VERLAUF_SEITE, passtZumFilter } from "../eingabe/verlauf.js";
import { PUNKTFARBEN } from "./minikarte.js";

const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (zeichen) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[zeichen]);
import "../eingabe/karte.js"; // meldet die Fensterart "karte" an

fensterinhaltAnmelden("menue", ({ spiel, texte, version }, zustand) => {
  const { text } = texte;
  const zeilen = MENUE_EINTRAEGE.map((eintrag, stelle) => `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}${buchstabeAttribut(stelle)}>${buchstabeHtml(stelle)}${text(`menue.${eintrag}`)}</li>`);
  return {
    titel: text("menue.titel"),
    liste: `<ul>${zeilen.join("")}</ul>`,
    fuss: `${text("menue.fuss")}<div class="leise">${text("ui.startwert")}: ${spiel.zustand.startwert} · ${text("ui.version")}: ${version}</div>`,
  };
});

fensterinhaltAnmelden("bestaetigung", ({ texte }, zustand) => ({
  titel: texte.text("bestaetigung.titel"),
  liste: `<p>${texte.text(zustand.frage, zustand.werte ?? {})}</p>`,
  fuss: texte.text("bestaetigung.fuss"),
  knoepfe: [{ taste: { code: "KeyJ", zeichen: "j" }, text: texte.text("ui.knopf.ja") }, { taste: { code: "KeyN", zeichen: "n" }, text: texte.text("ui.knopf.nein") }],
}));

// Nach dem Tod Ninkasis (eingabe/menue.js endeTaste); später kommen Laufbericht, Abspielen und Ruhmeshalle dazu
fensterinhaltAnmelden("ende", ({ spiel, texte }, zustand) => {
  const { text } = texte;
  const zeilen = ENDE_EINTRAEGE.map((eintrag, stelle) => `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}${buchstabeAttribut(stelle)}>${buchstabeHtml(stelle)}${text(`ende.${eintrag}`)}</li>`);
  return {
    titel: text("ende.titel"),
    liste: `<p>${text("ende.bilanz", { tiefe: spiel.zustand.tiefe, zuege: spielerin(spiel.zustand)?.zuege ?? 0 })}</p><ul>${zeilen.join("")}</ul>`,
    fuss: text("ende.fuss"),
  };
});

fensterinhaltAnmelden("verlauf", ({ texte, logzeilen }, zustand) => {
  const { text } = texte;
  const passend = logzeilen.filter((zeile) => passtZumFilter(zeile, zustand.filter, zustand.suche ?? ""));
  const versatz = Math.min(zustand.versatz, Math.max(0, passend.length - VERLAUF_SEITE));
  const ende = passend.length - versatz;
  const sichtbar = passend.slice(Math.max(0, ende - VERLAUF_SEITE), ende);
  const filter = VERLAUF_FILTER.map((name, stelle) => `<span${name === zustand.filter ? ' class="gewaehlt"' : ""}${buchstabeAttribut(stelle)}>${buchstabeHtml(stelle)}${text(`verlauf.filter.${name}`)}</span>`).join(" ");
  const zeilenHtml = sichtbar.map((zeile, stelle) => logzeileHtml(zeile, sichtbar[stelle - 1])).join("");
  return {
    titel: text("aktion.verlauf"),
    breit: true,
    kopf: `<div class="verlauf-filter">${filter}</div>${zustand.sucheAktiv || zustand.suche
      ? `<div class="eingabezeile">/${escapeHtml(zustand.suche ?? "")}${zustand.sucheAktiv ? '<span class="schreibmarke">▏</span>' : ""}</div>` : ""}`,
    liste: `<div class="verlauf">${zeilenHtml || `<div class="leise">${text("ui.leer")}</div>`}</div>`,
    fuss: text("verlauf.fuss", { von: Math.max(0, ende - sichtbar.length) + (sichtbar.length ? 1 : 0), bis: ende, alle: passend.length }),
    knoepfe: zustand.sucheAktiv ? [] : [{ taste: { code: "Slash", zeichen: "/" }, text: text("ui.knopf.suchen") }],
  };
});

// Übersichtskarte: das Canvas füllt src/main.js nach dem Einsetzen (anzeige/minikarte.js zeichnen)
fensterinhaltAnmelden("karte", ({ texte }) => {
  const { text } = texte;
  const legende = Object.entries(PUNKTFARBEN).map(([art, farbe]) => `<span><i style="background:${farbe}"></i>${text(`karte.legende.${art}`)}</span>`).join("");
  return {
    titel: text("aktion.karte"),
    breit: true,
    liste: `<canvas class="uebersichtskarte"></canvas><div class="legende leise">${legende}</div>`,
    fuss: text("karte.fuss"),
  };
});
