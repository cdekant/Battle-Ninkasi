// Texteingabe in Fenstern (Befehlszeile, Suche im Verlauf): reine Tastenlogik ohne Eingabefeld im Browser.
// Ein druckbares Zeichen (KeyboardEvent.key mit genau einem Zeichen) hängt an, die Rücktaste löscht das letzte.
// Gibt den neuen Text zurück, oder null, wenn die Taste kein Teil der Eingabe ist (dann wertet das Fenster sie aus).

export const HOECHSTE_LAENGE = 60;

export function texteingabeTaste(text, taste) {
  if (taste.code === "Backspace") return text.slice(0, -1);
  if (typeof taste.zeichen === "string" && taste.zeichen.length === 1 && taste.zeichen >= " ") {
    return text.length < HOECHSTE_LAENGE ? text + taste.zeichen : text;
  }
  return null;
}

// Vergleichsform: klein, Umlaute als ae, oe, ue, ß als ss, ohne Akzente; so findet "ae" auch "ä"
export function suchform(text) {
  return String(text).toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
}
