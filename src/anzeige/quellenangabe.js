// Quellenangabe eines Inhalts (siehe docs/Texte.md, Quellenangabe): wer ihn gemacht hat, wonach, wo man nachlesen kann
// und welche KI beteiligt war; gleiches Format für Korpustexte, Titelbilder und später Tiles und Fundtexte. Ohne DOM.
//   { art, nach?, quelle?, beteiligt? }
//   art:       chd (selbst gemacht, auch eine nur digitalisierte eigene Vorlage), generiert (von einer KI erstellt,
//              ausgewählt und abgenommen), nachdichtung, frei (frei nach einer Vorlage), gemeinfrei
//   nach:      die Vorlage kurz, im Dativ mit Artikel, so dass sie hinter "nach" passt
//   quelle:    Schlüssel in sprache/literatur.json
//   beteiligt: [{ wer, anteil? }] beteiligte KI; anteil ist ein Schlüssel unter quellenangabe.anteil. in den Texten

export const QUELLENANGABE_ARTEN = ["chd", "generiert", "nachdichtung", "frei", "gemeinfrei"];

// Quellenangabe aus dem Kopf eines Korpustexts; beteiligt steht dort als Text "Wer (anteil, anteil); Wer"
export function quellenangabeAusKopf(kopf) {
  const { art, nach, quelle } = kopf;
  const beteiligt = kopf.beteiligt ? beteiligtAusText(kopf.beteiligt) : null;
  return { ...(art && { art }), ...(nach && { nach }), ...(quelle && { quelle }), ...(beteiligt && { beteiligt }) };
}

function beteiligtAusText(text) {
  return text.split(";").map((teil) => teil.trim()).filter(Boolean).flatMap((teil) => {
    const treffer = /^(.*?)\s*\((.*)\)$/.exec(teil);
    if (!treffer) return [{ wer: teil }];
    return treffer[2].split(",").map((anteil) => ({ wer: treffer[1], anteil: anteil.trim() }));
  });
}

// Fehler einer Quellenangabe als Texte; literatur und texte (Textobjekt der Sprache) prüfen Quelle und Anteile, wenn
// sie mitkommen
export function quellenangabeFehler(angabe, { literatur = null, texte = null } = {}) {
  const fehler = [];
  if (!QUELLENANGABE_ARTEN.includes(angabe.art)) fehler.push(`art "${angabe.art}" ist keine von ${QUELLENANGABE_ARTEN.join(", ")}`);
  if (angabe.art === "generiert" && !angabe.beteiligt?.length) fehler.push("generiert ohne beteiligt");
  if (literatur && angabe.quelle && !literatur.some((eintrag) => eintrag.id === angabe.quelle)) fehler.push(`Quelle "${angabe.quelle}" fehlt in sprache/literatur.json`);
  for (const { wer, anteil } of angabe.beteiligt ?? []) {
    if (!wer) fehler.push("beteiligt ohne wer");
    if (anteil && texte && !texte[`quellenangabe.anteil.${anteil}`]) fehler.push(`Anteil "${anteil}" ohne Text`);
  }
  return fehler;
}

// Kurzbeleg eines Eintrags aus sprache/literatur.json (CSL-JSON) als "Name Jahr": die Familiennamen der Autorschaft,
// ohne solche die der Herausgeberschaft, sonst der Name einer Körperschaft (literal); ab drei Namen nur der erste mit
// undAndere ("u. a."), zwei mit "/" verbunden
export function kurzbeleg(eintrag, undAndere) {
  const familiennamen = (personen) => (personen ?? []).map((person) => person.family).filter(Boolean);
  const koerperschaften = (eintrag.author ?? []).map((person) => person.literal).filter(Boolean);
  const namen = [familiennamen(eintrag.author), familiennamen(eintrag.editor)].find((liste) => liste.length) ?? koerperschaften;
  const wer = namen.length > 2 ? `${namen[0]} ${undAndere}` : namen.join(" / ");
  const jahr = eintrag.issued?.["date-parts"]?.[0]?.[0];
  return [wer, jahr].filter(Boolean).join(" ");
}

// Beteiligte KI als Text, je Werkzeug einmal mit seinen Anteilen: "ChatGPT (Motiv), Grok (Dampf, Masken)"
function beteiligteText(texte, beteiligt) {
  const anteileJeWer = new Map();
  for (const { wer, anteil } of beteiligt) {
    if (!anteileJeWer.has(wer)) anteileJeWer.set(wer, []);
    if (anteil) anteileJeWer.get(wer).push(texte.text(`quellenangabe.anteil.${anteil}`));
  }
  return [...anteileJeWer].map(([wer, anteile]) => (anteile.length ? `${wer} (${anteile.join(", ")})` : wer)).join(", ");
}

// Quellenangabe als eine Zeile: "frei nach … · vgl. Name Jahr · mit KI erstellt: …"; was fehlt, fällt weg, auch das
// "vgl.", wenn das Literaturverzeichnis die Quelle nicht kennt; was (wahlweise) benennt den Inhalt vor der KI-Angabe,
// z.B. "Titelbild mit KI erstellt: …", wo die Zeile ohne Zusammenhang steht. Selbst Gemachtes beginnt mit "chd"; ist
// dabei eine KI beteiligt, heißt es "mit KI:" statt "mit KI erstellt:", denn gemacht hat es dann chd
export function quellenangabeText(texte, angabe, literatur = [], { was = null } = {}) {
  if (!angabe) return "";
  const teile = [];
  if (angabe.art === "chd") teile.push("chd");
  if (angabe.nach && angabe.art) teile.push(texte.text(`quellenangabe.nach.${angabe.art}`, { nach: angabe.nach }));
  const eintrag = angabe.quelle ? literatur.find((kandidat) => kandidat.id === angabe.quelle) : null;
  if (eintrag) teile.push(texte.text("quellenangabe.vgl", { beleg: kurzbeleg(eintrag, texte.text("quellenangabe.und_andere")) }));
  const beteiligte = angabe.beteiligt?.length ? beteiligteText(texte, angabe.beteiligt) : null;
  if (beteiligte && angabe.art === "chd") teile.push(texte.text("quellenangabe.mit_ki_beteiligt", { beteiligte }));
  else if (beteiligte) teile.push(was ? texte.text("quellenangabe.mit_ki_was", { was, beteiligte }) : texte.text("quellenangabe.mit_ki", { beteiligte }));
  return teile.join(" · ");
}

// Volle Angabe eines Eintrags aus sprache/literatur.json für das Verzeichnis:
// "Familienname, Vorname; … (Jahr): Titel. In: Herausgeber (Hrsg.): Sammelwerk. Ort: Verlag."
// Ohne Autorschaft stehen die Herausgeber vorn; was fehlt, fällt weg
export function literaturangabe(texte, eintrag) {
  const personen = (liste) => (liste ?? []).map((person) => person.literal ?? [person.family, person.given].filter(Boolean).join(", ")).join("; ");
  const hrsg = texte.text("literatur.hrsg");
  const autoren = personen(eintrag.author);
  const herausgeber = personen(eintrag.editor);
  const wer = autoren || (herausgeber && `${herausgeber} (${hrsg})`);
  const jahr = eintrag.issued?.["date-parts"]?.[0]?.[0];
  const kopf = [wer, jahr && `(${jahr})`].filter(Boolean).join(" ");
  const teile = [[kopf, eintrag.title].filter(Boolean).join(": ")];
  if (eintrag["container-title"]) {
    const imWerk = autoren && herausgeber ? `${herausgeber} (${hrsg}): ${eintrag["container-title"]}` : eintrag["container-title"];
    teile.push(texte.text("literatur.in", { werk: imWerk }));
  }
  const verlag = [eintrag["publisher-place"], eintrag.publisher].filter(Boolean).join(": ");
  if (verlag) teile.push(verlag);
  return `${teile.join(". ")}.`;
}
