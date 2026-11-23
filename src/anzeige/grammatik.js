// Grammatik (siehe docs/Texte.md, Grammatik): bildet Hauptwörter mit Artikel, Zahl und Adjektiven aus den Regeln
// einer Sprache (sprache/<code>/grammatik.js). Das Verfahren der Regeln wählt den Code:
//   "faelle"   (Deutsch): Hauptwort { geschlecht, eigenname?, adjektive?, einzahl: { nom, gen, dat, akk }, mehrzahl: { … } },
//              Adjektiv { adjektiv, stamm? }; Artikel und Endungen aus Tabellen
//   "englisch": Hauptwort { einzahl, mehrzahl, eigenname?, adjektive?, artikel? }, Adjektiv { adjektiv, artikel? };
//              ohne Fälle, Genitiv mit 's, a oder an nach dem ersten Wort
// Artikelart: "bestimmt" (Standard), "ein" (unbestimmt; in der Mehrzahl die Zahl), "zahl" (die Zahl nur in der
// Mehrzahl), "ohne". Mehrzahl, wenn die Anzahl größer als 1 ist. Eigennamen stehen ohne Artikel und ohne Adjektive.
// Schnittstelle beider Verfahren: nomen(eintrag, fall, artikel, { anzahl, adjektive }) mit den Einträgen der Adjektive,
// pruefen(eintrag, ort) für Hauptwörter, adjektivPruefen(eintrag, ort), artikelarten.

const ARTIKELARTEN = ["bestimmt", "ein", "zahl", "ohne"];

function erstelleFaelle(regeln) {
  function nomen(eintrag, fall = "nom", artikel = "bestimmt", { anzahl = 1, adjektive = [] } = {}) {
    const mehrzahl = anzahl > 1 && !eintrag.eigenname && Boolean(eintrag.mehrzahl);
    const formen = mehrzahl ? eintrag.mehrzahl : eintrag.einzahl;
    const wort = formen[fall] ?? formen.nom;
    if (eintrag.eigenname) return wort;
    const zahl = mehrzahl ? "p" : eintrag.geschlecht;
    const vorne = [];
    let artDerBeugung = ARTIKELARTEN.includes(artikel) ? artikel : "ohne";
    if (artikel === "bestimmt") {
      vorne.push(regeln.artikel.bestimmt[zahl][fall]);
      if (mehrzahl) vorne.push(String(anzahl));
    } else if (artikel === "ein" && !mehrzahl) {
      vorne.push(regeln.artikel.ein[zahl][fall]);
    } else if ((artikel === "ein" || artikel === "zahl") && mehrzahl) {
      vorne.push(String(anzahl));
      artDerBeugung = "zahl";
    }
    const endung = regeln.adjektivendungen[regeln.deklination[artDerBeugung]]?.[zahl]?.[fall] ?? "";
    for (const adjektiv of adjektive) vorne.push(`${adjektiv.stamm ?? adjektiv.adjektiv}${endung}`);
    return [...vorne, wort].join(" ");
  }

  function pruefen(eintrag, ort) {
    if (!eintrag || typeof eintrag !== "object") return [`${ort}: Text muss ein Hauptwort mit Formen sein`];
    const fehler = [];
    if (!regeln.geschlechter.includes(eintrag.geschlecht)) fehler.push(`${ort}: geschlecht muss eines von ${regeln.geschlechter.join(", ")} sein`);
    const zahlen = eintrag.eigenname ? ["einzahl"] : ["einzahl", "mehrzahl"];
    for (const zahl of zahlen) {
      for (const fall of regeln.faelle) {
        if (typeof eintrag[zahl]?.[fall] !== "string") fehler.push(`${ort}: ${zahl}.${fall} fehlt`);
      }
    }
    return fehler;
  }

  function adjektivPruefen(eintrag, ort) {
    if (typeof eintrag?.adjektiv !== "string") return [`${ort}: Text muss ein Adjektiv { adjektiv } sein`];
    if (eintrag.stamm !== undefined && typeof eintrag.stamm !== "string") return [`${ort}: stamm muss ein Text sein`];
    return [];
  }

  return { nomen, pruefen, adjektivPruefen };
}

function erstelleEnglisch(regeln) {
  // a oder an nach dem ersten Wort; ein Eintrag kann ausdrücklich wählen
  function unbestimmterArtikel(ersterEintrag, erstesWort) {
    if (ersterEintrag.artikel) return ersterEintrag.artikel;
    const anfang = erstesWort.toLowerCase();
    if (regeln.ausnahmenAn.some((ausnahme) => anfang.startsWith(ausnahme))) return "an";
    if (regeln.ausnahmenA.some((ausnahme) => anfang.startsWith(ausnahme))) return "a";
    return regeln.vokale.includes(anfang.charAt(0)) ? "an" : "a";
  }

  function nomen(eintrag, fall = "nom", artikel = "bestimmt", { anzahl = 1, adjektive = [] } = {}) {
    const mehrzahl = anzahl > 1 && !eintrag.eigenname && typeof eintrag.mehrzahl === "string";
    const wort = mehrzahl ? eintrag.mehrzahl : eintrag.einzahl;
    const vorne = eintrag.eigenname ? [] : adjektive;
    let wortgruppe = [...vorne.map((adjektiv) => adjektiv.adjektiv), wort].join(" ");
    if (fall === "gen") wortgruppe += mehrzahl && wortgruppe.endsWith("s") ? "'" : "'s";
    if (eintrag.eigenname || artikel === "ohne") return wortgruppe;
    if (artikel === "bestimmt") return [regeln.bestimmt, ...(mehrzahl ? [String(anzahl)] : []), wortgruppe].join(" ");
    if ((artikel === "ein" || artikel === "zahl") && mehrzahl) return `${anzahl} ${wortgruppe}`;
    if (artikel === "ein") return `${unbestimmterArtikel(vorne[0] ?? eintrag, vorne[0]?.adjektiv ?? wort)} ${wortgruppe}`;
    return wortgruppe;
  }

  function pruefen(eintrag, ort) {
    if (!eintrag || typeof eintrag !== "object") return [`${ort}: Text muss ein Hauptwort mit Formen sein`];
    const fehler = [];
    if (typeof eintrag.einzahl !== "string") fehler.push(`${ort}: einzahl fehlt`);
    if (!eintrag.eigenname && typeof eintrag.mehrzahl !== "string") fehler.push(`${ort}: mehrzahl fehlt`);
    if (eintrag.artikel !== undefined && !["a", "an"].includes(eintrag.artikel)) fehler.push(`${ort}: artikel muss "a" oder "an" sein`);
    return fehler;
  }

  function adjektivPruefen(eintrag, ort) {
    if (typeof eintrag?.adjektiv !== "string") return [`${ort}: Text muss ein Adjektiv { adjektiv } sein`];
    if (eintrag.artikel !== undefined && !["a", "an"].includes(eintrag.artikel)) return [`${ort}: artikel muss "a" oder "an" sein`];
    return [];
  }

  return { nomen, pruefen, adjektivPruefen };
}

const VERFAHREN = { faelle: erstelleFaelle, englisch: erstelleEnglisch };

export function erstelleGrammatik(regeln) {
  const verfahren = VERFAHREN[regeln.verfahren];
  if (!verfahren) throw new Error(`Unbekanntes Verfahren der Grammatik "${regeln.verfahren}"`);
  return { ...verfahren(regeln), artikelarten: ARTIKELARTEN };
}
