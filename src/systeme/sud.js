// Rechnung des Suds (siehe docs/Sude.md, Profil, Zielgebiete und Wirkung): reine Logik ohne Zustand, liest nur die
// Daten; Vorschau und Befehl (systeme/brauen.js) rechnen hiermit dasselbe. Nur ganze Zahlen, abgerundet.
// Eingabe: { zutaten: [{ typ, menge }], verfahren: { maische, gewuerz }, kultur: name | null, fasst }
//   typ:   Gegenstand mit zutat: { art: "grundstoff" | "gewuerz", extrakt?, farbe?, bitter?, aromen? }
//   fasst: Einheiten des Kessels; die Kennzahlen gelten für einen vollen Kessel, ein halb gefüllter gibt halb so viel
// Profil: { <achse>: wert } in der Reihenfolge von regeln.brauen.achsen, je Achse zwischen 0 und ihrem hoechstens

const begrenzt = (wert, unten, oben) => Math.max(unten, Math.min(oben, wert));

export const brauregeln = (daten) => daten.regeln.brauen;
export const achsenVon = (daten) => Object.keys(brauregeln(daten).achsen);
export const KENNZAHLEN = ["stammwuerze", "alkohol", "bittere", "farbe"];
export const aromaachsenVon = (daten) => achsenVon(daten).filter((achse) => !KENNZAHLEN.includes(achse));

// Mitte des Profils aus Zutaten, Verfahren und Kultur, ohne Wurf
export function profilBerechnen(daten, { zutaten, verfahren, kultur, fasst }) {
  const regeln = brauregeln(daten);
  const maische = regeln.maische[verfahren.maische], gewuerz = regeln.gewuerz[verfahren.gewuerz];
  const kulturdaten = kultur ? daten.kulturen[kultur] : null;
  const summen = { stammwuerze: 0, bittere: 0, farbe: 0 };
  const aromasummen = Object.fromEntries(aromaachsenVon(daten).map((achse) => [achse, 0]));
  let einheiten = 0;
  for (const { typ, menge } of zutaten) {
    const zutat = daten.gegenstaende[typ].zutat;
    const istGewuerz = zutat.art === "gewuerz";
    summen.stammwuerze += (zutat.extrakt ?? 0) * menge;
    summen.farbe += (zutat.farbe ?? 0) * menge;
    summen.bittere += Math.floor(((zutat.bitter ?? 0) * menge * (istGewuerz ? gewuerz.bitter : 100)) / 100);
    for (const [achse, anteil] of Object.entries(zutat.aromen ?? {})) {
      aromasummen[achse] += Math.floor((anteil * menge * (istGewuerz ? gewuerz.aroma : 100)) / 100);
    }
    einheiten += menge;
  }
  const profil = {};
  const stammwuerze = Math.floor(summen.stammwuerze / fasst);
  const vergaerung = kulturdaten ? begrenzt(kulturdaten.vergaerung + maische.vergaerung, 0, 100) : 0;
  const alkohol = kulturdaten ? Math.min(kulturdaten.vertraegt, Math.floor((stammwuerze * vergaerung * regeln.alkoholJeStammwuerze) / 10000)) : 0;
  const kennzahlen = { stammwuerze, alkohol, bittere: Math.floor(summen.bittere / fasst), farbe: Math.floor(summen.farbe / fasst) };
  for (const [achse, beschreibung] of Object.entries(regeln.achsen)) {
    if (KENNZAHLEN.includes(achse)) profil[achse] = begrenzt(kennzahlen[achse], 0, beschreibung.hoechstens);
    else {
      const mittel = einheiten ? Math.floor(aromasummen[achse] / einheiten) : 0;
      const zusatz = (kulturdaten?.aromen?.[achse] ?? 0) + (maische.aromen?.[achse] ?? 0);
      profil[achse] = begrenzt(mittel + zusatz, 0, beschreibung.hoechstens);
    }
  }
  return profil;
}

// Halbe Breite des Bereichs je Achse: regeln.brauen.achsen.<achse>.unschaerfe mal prozent (Skills, Rezept, Kessel)
export function unschaerfeBerechnen(daten, prozent) {
  const unschaerfe = {};
  for (const [achse, beschreibung] of Object.entries(brauregeln(daten).achsen)) unschaerfe[achse] = Math.max(0, Math.floor((beschreibung.unschaerfe * prozent) / 100));
  return unschaerfe;
}

// Bereich der Vorschau je Achse: [unten, oben], begrenzt auf die Achse
export function bereichBerechnen(daten, mitte, unschaerfe) {
  const bereich = {};
  for (const [achse, beschreibung] of Object.entries(brauregeln(daten).achsen)) {
    bereich[achse] = [begrenzt(mitte[achse] - unschaerfe[achse], 0, beschreibung.hoechstens), begrenzt(mitte[achse] + unschaerfe[achse], 0, beschreibung.hoechstens)];
  }
  return bereich;
}

// Liegt ein Profil in einem Zielgebiet: jede Achse, die es nennt, in ihrer Spanne (Grenzen eingeschlossen)
export const imZielgebiet = (profil, zielgebiet) => Object.entries(zielgebiet.spannen).every(([achse, [unten, oben]]) => profil[achse] >= unten && profil[achse] <= oben);

// Enge eines Zielgebiets: Summe der Breiten seiner Spannen in Promille ihrer Achse; das engere gewinnt
function engeVon(daten, zielgebiet) {
  const achsen = brauregeln(daten).achsen;
  return Object.entries(zielgebiet.spannen).reduce((summe, [achse, [unten, oben]]) => summe + Math.floor(((oben - unten) * 1000) / achsen[achse].hoechstens), 0);
}

// Güte eines Treffers: in der Mitte jeder Spanne 100, am Rand regeln.brauen.gueteAmRand; die schlechteste Achse zählt
function gueteImZielgebiet(daten, profil, zielgebiet) {
  const amRand = brauregeln(daten).gueteAmRand;
  let guete = 100;
  for (const [achse, [unten, oben]] of Object.entries(zielgebiet.spannen)) {
    const halbeBreite = Math.max(1, Math.floor((oben - unten) / 2));
    const abstandZurMitte = Math.min(halbeBreite, Math.floor(Math.abs(profil[achse] * 2 - (unten + oben)) / 2));
    guete = Math.min(guete, 100 - Math.floor((abstandZurMitte * (100 - amRand)) / halbeBreite));
  }
  return guete;
}

// Das getroffene Zielgebiet { name, guete } oder null; bei mehreren das engste, bei gleicher Enge das erste der Daten
export function zielgebietFinden(daten, profil) {
  let bestes = null;
  for (const [name, zielgebiet] of Object.entries(daten.zielgebiete ?? {})) {
    if (!imZielgebiet(profil, zielgebiet)) continue;
    const enge = engeVon(daten, zielgebiet);
    if (!bestes || enge < bestes.enge) bestes = { name, enge };
  }
  return bestes ? { name: bestes.name, guete: gueteImZielgebiet(daten, profil, daten.zielgebiete[bestes.name]) } : null;
}

// Zielgebiete, die ein Bereich der Vorschau erreichen kann (jede genannte Achse überlappt), in der Reihenfolge der Daten
export function erreichbareZielgebiete(daten, bereich) {
  return Object.entries(daten.zielgebiete ?? {})
    .filter(([, zielgebiet]) => Object.entries(zielgebiet.spannen).every(([achse, [unten, oben]]) => bereich[achse][1] >= unten && bereich[achse][0] <= oben))
    .map(([name]) => name);
}

// Rundet ein Profil auf die Stufen der Achsen (regeln.brauen.achsen.<achse>.stufe), kaufmännisch; so stapeln gleiche Sude
export function profilRunden(daten, profil) {
  const gerundet = {};
  for (const [achse, { stufe }] of Object.entries(brauregeln(daten).achsen)) gerundet[achse] = Math.floor((profil[achse] + Math.floor(stufe / 2)) / stufe) * stufe;
  return gerundet;
}

export const gueteRunden = (daten, guete) => Math.floor(guete / brauregeln(daten).gueteStufe) * brauregeln(daten).gueteStufe;

// Wirkung eines Suds { sud: { profil, zielgebiet, guete } } beim Trinken: Mengen je Wert in der Reihenfolge der Achsen,
// dazu der Pegel aus dem Alkohol und der Effekt des Zielgebiets.
//   Budget = Stammwürze x budgetProzent x Güte (x Bonus des Zielgebiets), verteilt anteilig auf die Aromaachsen mit einer
//   Wirkung in regeln.brauen.wirkungen; ohne Aroma geht es ganz an regeln.brauen.wirkungOhneAroma
export function wirkungBerechnen(daten, sud) {
  const regeln = brauregeln(daten);
  const zielgebiet = sud.zielgebiet ? daten.zielgebiete[sud.zielgebiet] : null;
  const bonus = zielgebiet?.bonus ?? 100;
  const budget = Math.floor((((sud.profil.stammwuerze * regeln.budgetProzent) / 100) * sud.guete * bonus) / 10000);
  const mengen = {};
  const hinzu = (wertName, menge) => { if (menge > 0) mengen[wertName] = (mengen[wertName] ?? 0) + menge; };
  const aromen = aromaachsenVon(daten);
  const aromasumme = aromen.reduce((summe, achse) => summe + sud.profil[achse], 0);
  if (aromasumme === 0) hinzu(regeln.wirkungOhneAroma, budget);
  else for (const achse of aromen) {
    const wertName = regeln.wirkungen[achse];
    if (wertName) hinzu(wertName, Math.floor((budget * sud.profil[achse]) / aromasumme));
  }
  return { mengen, pegel: Math.floor((sud.profil.alkohol * regeln.pegelProzent) / 100), effekt: zielgebiet?.effekt ?? null };
}
