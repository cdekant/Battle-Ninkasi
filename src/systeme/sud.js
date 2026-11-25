// Rechnung des Suds (siehe docs/Sude.md, Profil, Zielgebiete und Wirkung): reine Logik ohne Zustand, liest nur die
// Daten; Vorschau und Befehl (systeme/brauen.js) rechnen hiermit dasselbe. Nur ganze Zahlen, abgerundet.
// Eingabe: { zutaten: [{ typ, menge }], verfahren: { maische, gewuerz }, kultur: name | null, portionen, vertraegt? }
//   typ:       Gegenstand mit zutat: { art: "grundstoff" | "gewuerz", extrakt?, farbe?, bitter?, aromen? }; extrakt,
//              farbe und bitter gelten für ein Stück auf eine Portion
//   portionen: das Volumen des Suds; dieselben Zutaten auf weniger Portionen geben einen stärkeren Sud
//   vertraegt: höchster Alkohol der Kultur nach Modifikatoren (Vorgabe vertraegt der Kultur)
// Profil: { <achse>: wert } in der Reihenfolge von regeln.brauen.achsen, je Achse zwischen 0 und ihrem hoechstens

const begrenzt = (wert, unten, oben) => Math.max(unten, Math.min(oben, wert));

export const brauregeln = (daten) => daten.regeln.brauen;
export const achsenVon = (daten) => Object.keys(brauregeln(daten).achsen);
export const KENNZAHLEN = ["stammwuerze", "alkohol", "bittere", "farbe"];
export const aromaachsenVon = (daten) => achsenVon(daten).filter((achse) => !KENNZAHLEN.includes(achse));

// Gärung nach Balling, vereinfacht: die Kultur vergärt ihren Anteil der Stammwürze, höchstens bis sie vertraegt; was
// sie vergären könnte, aber nicht mehr verträgt, bleibt als Restzucker (Zehntel °Plato). Ohne Kultur gärt nichts.
// Gibt { vergaerung, vergoren, restzucker, alkohol }
export function gaerungBerechnen(daten, { stammwuerze, verfahren, kultur, vertraegt }) {
  const regeln = brauregeln(daten);
  const kulturdaten = kultur ? daten.kulturen[kultur] : null;
  if (!kulturdaten) return { vergaerung: 0, vergoren: 0, restzucker: 0, alkohol: 0 };
  const vergaerung = begrenzt(kulturdaten.vergaerung + regeln.maische[verfahren.maische].vergaerung, 0, 100);
  const vergaerbar = Math.floor((stammwuerze * vergaerung) / 100);
  const hoechstensVergoren = regeln.alkoholJeStammwuerze > 0 ? Math.floor(((vertraegt ?? kulturdaten.vertraegt) * 100) / regeln.alkoholJeStammwuerze) : Infinity;
  const vergoren = Math.min(vergaerbar, hoechstensVergoren);
  return { vergaerung, vergoren, restzucker: vergaerbar - vergoren, alkohol: Math.floor((vergoren * regeln.alkoholJeStammwuerze) / 100) };
}

// Mitte des Profils aus Zutaten, Verfahren und Kultur, ohne Wurf
export const profilBerechnen = (daten, eingabe) => sudRechnen(daten, eingabe).profil;

// Profil und Gärung { profil, gaerung } (die Gärung für die Anzeige des Restzuckers)
export function sudRechnen(daten, eingabe) {
  const { zutaten, verfahren, kultur, portionen } = eingabe;
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
  const stammwuerze = Math.floor(summen.stammwuerze / portionen);
  const gaerung = gaerungBerechnen(daten, { stammwuerze, verfahren, kultur, vertraegt: eingabe.vertraegt });
  const kennzahlen = { stammwuerze, alkohol: gaerung.alkohol, bittere: Math.floor(summen.bittere / portionen), farbe: Math.floor(summen.farbe / portionen) };
  // der Restzucker macht den Sud süß (regeln.brauen.suesseJeRestzucker Prozent: Punkte der Süße je Zehntel °Plato)
  const ausRestzucker = { suesse: Math.floor((gaerung.restzucker * regeln.suesseJeRestzucker) / 100) };
  for (const [achse, beschreibung] of Object.entries(regeln.achsen)) {
    if (KENNZAHLEN.includes(achse)) profil[achse] = begrenzt(kennzahlen[achse], 0, beschreibung.hoechstens);
    else {
      const mittel = einheiten ? Math.floor(aromasummen[achse] / einheiten) : 0;
      const zusatz = (kulturdaten?.aromen?.[achse] ?? 0) + (maische.aromen?.[achse] ?? 0) + (ausRestzucker[achse] ?? 0);
      profil[achse] = begrenzt(mittel + zusatz, 0, beschreibung.hoechstens);
    }
  }
  return { profil, gaerung };
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
export function gueteImZielgebiet(daten, profil, zielgebiet) {
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

// Zielgebiete, die ein Bereich der Vorschau erreichen kann (jede genannte Achse überlappt), in der Reihenfolge der Daten;
// mit namen nur unter diesen (die aufgedeckten, systeme/rezepte.js)
export function erreichbareZielgebiete(daten, bereich, namen = null) {
  return Object.entries(daten.zielgebiete ?? {})
    .filter(([name]) => !namen || namen.includes(name))
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

// Wirkung eines Suds { sud: { profil, zielgebiet, guete, rezept? } } beim Trinken: Mengen je Wert in der Reihenfolge der
// Achsen, Zustände über die Zeit, dazu der Pegel aus dem Alkohol und die Effekte von Zielgebiet und Kniff.
//   rezept: ein gefundenes Rezept (daten.rezepte), nach dem der Sud gelang; sein kniff { bonus?, effekt? } kommt dazu
//   Budget = Stammwürze x budgetProzent x Güte (x Bonus des Zielgebiets plus Bonus des Kniffs), verteilt anteilig auf die Aromaachsen mit einer
//   Wirkung in regeln.brauen.wirkungen; ohne Aroma geht es ganz an regeln.brauen.wirkungOhneAroma
//   Eine Wirkung ist ein Wertname (sofort) oder { zustand, prozent }: der Anteil mal prozent wird die Menge des Zustands
//   (zustaende: [{ zustand, menge }], je Zustand zusammengezählt, beim Trinken eine Welttick je Menge)
export function wirkungBerechnen(daten, sud) {
  const regeln = brauregeln(daten);
  const zielgebiet = sud.zielgebiet ? daten.zielgebiete[sud.zielgebiet] : null;
  const kniff = sud.rezept ? daten.rezepte?.[sud.rezept]?.kniff ?? {} : {};
  const bonus = (zielgebiet?.bonus ?? 100) + (kniff.bonus ?? 0);
  const budget = Math.floor((((sud.profil.stammwuerze * regeln.budgetProzent) / 100) * sud.guete * bonus) / 10000);
  const mengen = {}, ueberZeit = {};
  const hinzu = (wirkung, menge) => {
    if (typeof wirkung === "string") { if (menge > 0) mengen[wirkung] = (mengen[wirkung] ?? 0) + menge; return; }
    const anteil = Math.floor((menge * wirkung.prozent) / 100);
    if (anteil > 0) ueberZeit[wirkung.zustand] = (ueberZeit[wirkung.zustand] ?? 0) + anteil;
  };
  const aromen = aromaachsenVon(daten);
  const aromasumme = aromen.reduce((summe, achse) => summe + sud.profil[achse], 0);
  if (aromasumme === 0) hinzu(regeln.wirkungOhneAroma, budget);
  else for (const achse of aromen) {
    const wirkung = regeln.wirkungen[achse];
    if (wirkung) hinzu(wirkung, Math.floor((budget * sud.profil[achse]) / aromasumme));
  }
  const zustaende = Object.entries(ueberZeit).map(([zustand, menge]) => ({ zustand, menge }));
  const effekte = [zielgebiet?.effekt, kniff.effekt].filter(Boolean);
  return { mengen, zustaende, pegel: Math.floor((sud.profil.alkohol * regeln.pegelProzent) / 100), effekte };
}
