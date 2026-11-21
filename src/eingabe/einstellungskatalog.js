// Einstellungskatalog (siehe docs/Oberflaeche.md, Einstellungen): jede Einstellung genau einmal, ohne DOM.
// Die Vorgaben stehen in eingabe/einstellungen.js, die Texte in der Sprachdatei (einstellung.<id>, .erklaerung).
//   id: { reiter, art, ... }
//   art "schalter":      wahr oder falsch
//   art "auswahl":       werte: [..] in fester Reihenfolge; Text eines Werts einstellung.<id>.wert.<wert>, sonst die Zahl
//   art "zahl":          min, max, schritt, einheit? (Sprachschlüssel)
//   art "listenschalter": liste, eintrag: an, wenn die Liste der Einstellung liste den Eintrag enthält
//   art "knopf":         aktion für src/main.js (z.B. Vollbild); kein gespeicherter Wert
// Der Reiter "tasten" hat keine Einträge hier, er zeigt die Belegung (eingabe/belegunganpassen.js).

export const REITER = ["anzeige", "spiel", "tasten", "barrierefreiheit"];

export const EINSTELLUNGEN = {
  layout: { reiter: "anzeige", art: "auswahl", werte: ["a", "b", "kompakt"] },
  oberflaecheGroesse: { reiter: "anzeige", art: "zahl", min: 12, max: 22, schritt: 1, einheit: "einheit.px" },
  zoom: { reiter: "anzeige", art: "auswahl", werte: [16, 32, 48, 64] },
  logZeilen: { reiter: "anzeige", art: "zahl", min: 3, max: 14, schritt: 1 },
  minikarte: { reiter: "anzeige", art: "schalter" },
  vollbild: { reiter: "anzeige", art: "knopf", aktion: "vollbild" },
  reisePause: { reiter: "spiel", art: "zahl", min: 0, max: 200, schritt: 10, einheit: "einheit.ms" },
  geschossPause: { reiter: "spiel", art: "zahl", min: 0, max: 100, schritt: 10, einheit: "einheit.ms" },
  reiseTrotzFeinden: { reiter: "spiel", art: "schalter" },
  rastenTrotzFeinden: { reiter: "spiel", art: "schalter" },
  haltBeiGegenstand: { reiter: "spiel", art: "listenschalter", liste: "reiseHalt", eintrag: "gegenstand" },
  sofortAusloesen: { reiter: "spiel", art: "schalter" },
  neustartNachfragen: { reiter: "spiel", art: "schalter" },
  bewegungReduzieren: { reiter: "barrierefreiheit", art: "schalter" },
  hoherKontrast: { reiter: "barrierefreiheit", art: "schalter" },
  farbenblind: { reiter: "barrierefreiheit", art: "schalter" },
};

export const einstellungenImReiter = (reiter) => Object.keys(EINSTELLUNGEN).filter((id) => EINSTELLUNGEN[id].reiter === reiter);

// Wert einer Einstellung aus den Einstellungen (Listenschalter als wahr oder falsch)
export function einstellungLesen(einstellungen, id) {
  const eintrag = EINSTELLUNGEN[id];
  if (eintrag.art === "listenschalter") return (einstellungen[eintrag.liste] || []).includes(eintrag.eintrag);
  if (eintrag.art === "knopf") return null;
  return einstellungen[id];
}

// Neue Einstellungen mit geändertem Wert (das Original bleibt); Zahlen werden auf Grenzen und Schritt gebracht,
// eine Auswahl nur auf einen ihrer Werte
export function einstellungSetzen(einstellungen, id, wert) {
  const eintrag = EINSTELLUNGEN[id];
  const neu = structuredClone(einstellungen);
  if (eintrag.art === "listenschalter") {
    const liste = (neu[eintrag.liste] || []).filter((vorhanden) => vorhanden !== eintrag.eintrag);
    neu[eintrag.liste] = wert ? [...liste, eintrag.eintrag] : liste;
  } else if (eintrag.art === "zahl") {
    const gerundet = eintrag.min + Math.round((Number(wert) - eintrag.min) / eintrag.schritt) * eintrag.schritt;
    neu[id] = Math.min(eintrag.max, Math.max(eintrag.min, gerundet));
  } else if (eintrag.art === "auswahl") {
    if (eintrag.werte.includes(wert)) neu[id] = wert;
  } else if (eintrag.art === "schalter") {
    neu[id] = Boolean(wert);
  }
  return neu;
}

// Einen Schritt ändern: richtung +1 oder -1 (Zahl um den Schritt, Auswahl zum nächsten Wert rundum, Schalter umschalten)
export function einstellungSchritt(einstellungen, id, richtung) {
  const eintrag = EINSTELLUNGEN[id];
  const wert = einstellungLesen(einstellungen, id);
  if (eintrag.art === "zahl") return einstellungSetzen(einstellungen, id, wert + richtung * eintrag.schritt);
  if (eintrag.art === "auswahl") {
    const stelle = eintrag.werte.indexOf(wert);
    return einstellungSetzen(einstellungen, id, eintrag.werte[(stelle + richtung + eintrag.werte.length) % eintrag.werte.length]);
  }
  if (eintrag.art === "schalter" || eintrag.art === "listenschalter") return einstellungSetzen(einstellungen, id, !wert);
  return einstellungen;
}

// Auf die Vorgabe zurück
export function einstellungVorgabe(einstellungen, vorgaben, id) {
  return einstellungSetzen(einstellungen, id, einstellungLesen(vorgaben, id));
}
