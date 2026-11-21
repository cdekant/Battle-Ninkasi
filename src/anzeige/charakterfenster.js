// Inhalte der Fenster Charakter (Skillfenster, eingabe/charakter.js) und Charaktererstellung (eingabe/erstellung.js),
// angemeldet bei anzeige/fenster.js. Liest den Zustand nur; Zahlen aus systeme/skills.js (skillUebersicht, lernvorschau).
// Kosten erscheinen in EP ("noch 120 EP bis Stufe 3"), nie als Formel (docs/Charakter.md, Kosten).

import { spielerin } from "../kern/zustand.js";
import { skillUebersicht, lernvorschau, ermoeglicht, skillVon, eigenschaftGrundwert, eigenschaftWirksam, HOECHSTE_STUFE } from "../systeme/skills.js";
import { SEITENLAENGE, geplanteEp } from "../eingabe/charakter.js";
import { namenDerEigenschaften, restpunkte, erstellungHilfewerte } from "../eingabe/erstellung.js";
import { fensterinhaltAnmelden, buchstabeHtml, zielAttribut } from "./fenster.js";

const stufenpunkte = (stufe) => `<span class="stufe">${"●".repeat(stufe)}${"○".repeat(HOECHSTE_STUFE - stufe)}</span>`;

function textOder(texte, schluessel, ersatz) {
  return texte.hatSchluessel(schluessel) ? texte.text(schluessel) : ersatz;
}

const skillName = (spiel, texte, name) => {
  const definition = skillVon(spiel, name);
  return definition ? texte.text(definition.text) : name;
};

// Ein Modifikator je Stufe als Text: "Höchst-LP: +5 % je Stufe (jetzt +10 %)"
function jeStufeText(texte, modifikator, stufe) {
  const einheit = modifikator.art === "prozent" ? " %" : "";
  const zeichen = (betrag) => (betrag >= 0 ? `+${betrag}` : `${betrag}`);
  const ziel = textOder(texte, `ui.wert.${modifikator.ziel}`, modifikator.ziel);
  const tag = modifikator.tag ? ` (${textOder(texte, `tag.${modifikator.tag}`, modifikator.tag)})` : "";
  const jetzt = stufe > 0 ? ` <span class="leise">${texte.text("ui.skill_jetzt", { wert: `${zeichen(modifikator.betrag * stufe)}${einheit}` })}</span>` : "";
  return `${ziel}${tag}: ${texte.text("ui.skill_je_stufe", { wert: `${zeichen(modifikator.betrag)}${einheit}` })}${jetzt}`;
}

// Was Enter (und Umschalt+Enter) täte
function vorschauText(spiel, texte, ninkasi, eintrag, eingabe) {
  const { text } = texte;
  if (eintrag.gesperrt) return `<li class="schlimm">${textOder(texte, `log.abgelehnt.${eintrag.gesperrt}`, eintrag.gesperrt)}</li>`;
  const zeile = (schluessel, ep) => {
    const vorschau = lernvorschau(spiel, ninkasi, eintrag.name, ep);
    if (!vorschau.ok) return `<li class="leise">${text(schluessel)}: ${textOder(texte, `log.abgelehnt.${vorschau.grund}`, vorschau.grund)}</li>`;
    return `<li>${text(schluessel)}: ${text("ui.skill_vorschau", { ep: vorschau.ep, stufe: vorschau.stufe, frei: vorschau.freieEpDanach })}</li>`;
  };
  if (eingabe) return zeile("ui.skill_eingabe", geplanteEp(ninkasi, eintrag, eingabe, false));
  return zeile("ui.skill_enter", geplanteEp(ninkasi, eintrag, "", false)) + zeile("ui.skill_umschalt_enter", geplanteEp(ninkasi, eintrag, "", true));
}

function skillDetails(spiel, texte, ninkasi, eintrag, eingabe) {
  const { text } = texte;
  const { definition, stufe } = eintrag;
  const eigenschaft = (name) => text(spiel.daten.eigenschaften[name].text);
  const zeilen = [];
  zeilen.push(`<li>${text(`ui.tier.${eintrag.tier}`)} · ${text("ui.skill_stufe", { stufe, hoechste: HOECHSTE_STUFE })} ${stufenpunkte(stufe)}</li>`);
  if (stufe < HOECHSTE_STUFE) {
    zeilen.push(`<li>${text("ui.skill_bis_stufe", { ep: eintrag.epBisNaechste, stufe: stufe + 1 })}</li>`);
    if (stufe + 1 < HOECHSTE_STUFE) zeilen.push(`<li class="leise">${text("ui.skill_bis_stufe", { ep: eintrag.epBisHoechste, stufe: HOECHSTE_STUFE })}</li>`);
  } else {
    zeilen.push(`<li class="gut">${text("ui.skill_vollendet")}</li>`);
  }
  zeilen.push(`<li>${text("ui.lerntempo", { prozent: eintrag.lerntempo, primaer: eigenschaft(definition.primaer), sekundaer: eigenschaft(definition.sekundaer) })}</li>`);
  const wirkung = (definition.jeStufe || []).map((modifikator) => `<li>${jeStufeText(texte, modifikator, stufe)}</li>`);
  for (const ab of Object.keys(definition.abStufe || {}).sort((links, rechts) => links - rechts)) {
    wirkung.push(`<li${stufe >= Number(ab) ? "" : ' class="leise"'}>${text("ui.skill_ab_stufe", { stufe: ab })}</li>`);
  }
  const voraussetzungen = eintrag.voraussetzungen.map(({ skill, stufe: noetig, erfuellt }) =>
    `<li class="${erfuellt ? "gut" : "schlimm"}">${erfuellt ? "✓" : "✗"} ${skillName(spiel, texte, skill)} ${noetig}</li>`);
  const folgende = ermoeglicht(spiel, eintrag.name)
    .filter((name) => !skillVon(spiel, name).freischaltung || (ninkasi.freigeschaltet || []).includes(name))
    .map((name) => `<li>${skillName(spiel, texte, name)}</li>`);
  const lernt = (definition.lernt || []).map(({ anlass, tags }) => {
    const tagText = tags?.length ? ` (${tags.map((tag) => textOder(texte, `tag.${tag}`, tag)).join(", ")})` : "";
    return `<li>${textOder(texte, `lernanlass.${anlass}`, anlass)}${tagText}</li>`;
  });
  const verwandt = (definition.verwandt || []).map(({ skill, anteil }) => `<li>${text("ui.querlernen", { anteil, skill: skillName(spiel, texte, skill) })}</li>`);
  const abschnitt = (schluessel, liste) => (liste.length ? `<h3>${text(schluessel)}</h3><ul>${liste.join("")}</ul>` : "");
  return `<h2>${text(definition.text)}</h2><ul>${zeilen.join("")}</ul>
    ${abschnitt("ui.skill_wirkung", wirkung)}
    ${abschnitt("ui.skill_voraussetzungen", voraussetzungen)}
    ${abschnitt("ui.skill_ermoeglicht", folgende)}
    ${abschnitt("ui.skill_lernt", [...lernt, ...verwandt])}
    <h3>${text("ui.skill_verteilen")}</h3><ul>${vorschauText(spiel, texte, ninkasi, eintrag, eingabe)}</ul>`;
}

fensterinhaltAnmelden("charakter", ({ spiel, texte }, zustand) => {
  const { text } = texte;
  const ninkasi = spielerin(spiel.zustand);
  const eigenschaften = Object.entries(spiel.daten.eigenschaften).map(([name, eigenschaft]) => {
    const grundwert = eigenschaftGrundwert(ninkasi, name);
    const wirksam = eigenschaftWirksam(spiel, ninkasi, name);
    const abweichung = wirksam !== grundwert ? ` <span class="${wirksam > grundwert ? "gut" : "schlimm"}">(${wirksam})</span>` : "";
    return `<li>${text(eigenschaft.text)} <span class="wert-zahl">${grundwert}${abweichung}</span></li>`;
  });
  const uebersicht = skillUebersicht(spiel, ninkasi);
  const seite = Math.floor(zustand.gewaehlt / SEITENLAENGE);
  const zeilen = [];
  let letztesSet = null;
  uebersicht.slice(seite * SEITENLAENGE, (seite + 1) * SEITENLAENGE).forEach((eintrag, stelle) => {
    if (eintrag.set !== letztesSet) {
      zeilen.push(`<li class="set">${textOder(texte, `skillset.${eintrag.set}`, eintrag.set)}</li>`);
      letztesSet = eintrag.set;
    }
    const klassen = [eintrag.gesperrt && eintrag.gesperrt !== "hoechststufe" ? "gesperrt" : "", seite * SEITENLAENGE + stelle === zustand.gewaehlt ? "gewaehlt" : ""].filter(Boolean).join(" ");
    const rest = eintrag.stufe >= HOECHSTE_STUFE ? "" : eintrag.gesperrt ? "" : ` <span class="leise">${text("ui.skill_ep_kurz", { ep: eintrag.epBisNaechste })}</span>`;
    zeilen.push(`<li${klassen ? ` class="${klassen}"` : ""}${zielAttribut({ stelle: seite * SEITENLAENGE + stelle })}>${buchstabeHtml(stelle)}${text(eintrag.definition.text)} ${stufenpunkte(eintrag.stufe)}${rest}</li>`);
  });
  const seiten = Math.max(1, Math.ceil(uebersicht.length / SEITENLAENGE));
  const seitenText = seiten > 1 ? ` <span class="leise">${text("ui.seite", { seite: seite + 1, seiten })}</span>` : "";
  const eingabe = zustand.eingabe ? ` <span class="eingabe">${text("ui.skill_eingabe")}: ${zustand.eingabe}</span>` : "";
  const gewaehlt = uebersicht[zustand.gewaehlt];
  return {
    titel: text("ui.charakter"),
    kopf: `<ul class="eigenschaften">${eigenschaften.join("")}</ul>
      <div class="freie-ep">${text("ui.freie_ep")}: <b>${ninkasi.freieEp ?? 0}</b>${eingabe}${seitenText}</div>`,
    liste: `<ul class="skills">${zeilen.length ? zeilen.join("") : `<li class="leise">${text("ui.skills_keine")}</li>`}</ul>`,
    details: gewaehlt ? skillDetails(spiel, texte, ninkasi, gewaehlt, zustand.eingabe) : "",
    fuss: text("ui.charakter_hinweis"),
    knoepfe: [
      { taste: { code: "Enter" }, text: text("ui.knopf.naechste_stufe") },
      { taste: { code: "Enter", umschalt: true }, text: text("ui.knopf.hoechste_stufe") },
      ...(seiten > 1 ? [{ taste: { code: "PageUp" }, text: text("ui.knopf.seite_zurueck") }, { taste: { code: "PageDown" }, text: text("ui.knopf.seite_vor") }] : []),
    ],
  };
});

fensterinhaltAnmelden("erstellung", ({ daten, texte }, zustand) => {
  const { text } = texte;
  const { eigenschaftStart, eigenschaftHoechstens } = daten.regeln.lernen;
  const zeilen = namenDerEigenschaften(daten).map((name, stelle) => {
    const wert = zustand.eigenschaften[name];
    const anteil = Math.round(((wert - eigenschaftStart) / (eigenschaftHoechstens - eigenschaftStart)) * 100);
    return `<li${stelle === zustand.gewaehlt ? ' class="gewaehlt"' : ""}${zielAttribut({ stelle })}>
      <span class="name">${text(daten.eigenschaften[name].text)}</span>
      <span class="balken klein"><span class="fuellung" style="width:${anteil}%"></span></span>
      <span class="wert-zahl"><button class="schritt" tabindex="-1"${zielAttribut({ stelle, aendern: -1 })}>−</button> ${wert} <button class="schritt" tabindex="-1"${zielAttribut({ stelle, aendern: 1 })}>+</button></span></li>`;
  });
  const rest = restpunkte(daten, zustand.eigenschaften);
  return {
    titel: text("ui.erstellung"),
    kopf: `<div class="freie-ep">${text("ui.restpunkte")}: <b class="${rest === 0 ? "gut" : "schlimm"}">${rest}</b></div>`,
    liste: `<ul class="erstellung">${zeilen.join("")}</ul>`,
    hilfewerte: erstellungHilfewerte(daten),
    fuss: text("ui.erstellung_hinweis"),
    ohneSchliessen: true,
    knoepfe: [{ taste: { code: "KeyA", zeichen: "a" }, text: text("ui.knopf.vorgabe") }, { taste: { code: "Enter" }, text: text("ui.knopf.start") }],
  };
});
