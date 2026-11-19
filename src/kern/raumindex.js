// Räumlicher Index (siehe docs/Architektur.md, Leistung): wer wo steht, ohne alle Entitäten zu durchsuchen.
// Der Index ist aus dem Zustand ableitbar und gehört nicht hinein: er hängt in einer WeakMap am Zustandsobjekt,
// kommt so weder in Spielstände noch in Vergleiche und wird beim ersten Zugriff (neu) aufgebaut, z.B. nach dem Laden.
// Inhalt, alle Listen aufsteigend nach Entitäts-ID (die feste Reihenfolge der Entitäten, kern/zustand.js):
//   felder:        Feldschlüssel -> IDs der Entitäten mit dieser Position
//   zellen:        Zellschlüssel -> IDs, grobe Zellen von ZELLE x ZELLE Feldern für die Suche im Umkreis
//   mitPosition:   IDs aller Entitäten mit Position
//   traegerinnen:  IDs der Entitäten mit Position und eigenen Auren oder Zuständen (Kandidaten für Auren)
//   fallen:        IDs der Entitäten mit Position und Komponente falle (systeme/fallen.js)
// Vormerkungen für die Zustandsprüfungen nach einem Vorgang (kern/vorgang.js), ebenfalls neben dem Zustand:
//   lageOffen:     IDs, deren Lage zu prüfen ist (versetzt, Zustände geändert; systeme/verschieben.js)
//   todOffen:      IDs, bei denen ein Wert auf 0 gefallen ist (kern/werte.js; systeme/tod.js)
//   kaputtOffen:   IDs von Gegenständen, deren Haltbarkeit auf 0 gefallen ist (systeme/verschleiss.js)
// Jede Änderung einer Position läuft über positionSetzen; Erzeugen und Entfernen tragen selbst ein und aus.
// indexPruefen vergleicht mit einem frisch aufgebauten Index (Bot, Tests).

const INDEXE = new WeakMap();

// Zahl statt Text als Schlüssel; Karten bis 65536 Felder breit
const feldSchluessel = (x, y) => y * 65536 + x;

// Seitenlänge einer Zelle: bei Sichtweiten um 7 deckt eine Suche höchstens drei mal drei Zellen ab
const ZELLE = 8;
const zellSchluessel = (x, y) => Math.floor(y / ZELLE) * 65536 + Math.floor(x / ZELLE);

// Binäre Suche: Stelle, an der id steht oder eingefügt würde
function stelleVon(liste, id) {
  let unten = 0, oben = liste.length;
  while (unten < oben) {
    const mitte = (unten + oben) >> 1;
    if (liste[mitte] < id) unten = mitte + 1;
    else oben = mitte;
  }
  return unten;
}

function einfuegen(liste, id) {
  const stelle = stelleVon(liste, id);
  if (liste[stelle] !== id) liste.splice(stelle, 0, id);
}

function herausnehmen(liste, id) {
  const stelle = stelleVon(liste, id);
  if (liste[stelle] === id) liste.splice(stelle, 1);
}

const istTraegerin = (entitaet) => Boolean(entitaet.position && (entitaet.auren?.length || entitaet.zustaende?.length));

// Fügt eine ID in die Liste einer Tabelle ein, legt die Liste bei Bedarf an
function inTabelle(tabelle, schluessel, id) {
  if (!tabelle.has(schluessel)) tabelle.set(schluessel, []);
  einfuegen(tabelle.get(schluessel), id);
}

// Nimmt eine ID aus der Liste einer Tabelle, löscht leere Listen
function ausTabelle(tabelle, schluessel, id) {
  const liste = tabelle.get(schluessel);
  if (!liste) return;
  herausnehmen(liste, id);
  if (!liste.length) tabelle.delete(schluessel);
}

function eintragen(index, entitaet) {
  if (!entitaet.position) return;
  const { x, y } = entitaet.position;
  inTabelle(index.felder, feldSchluessel(x, y), entitaet.id);
  inTabelle(index.zellen, zellSchluessel(x, y), entitaet.id);
  einfuegen(index.mitPosition, entitaet.id);
  if (istTraegerin(entitaet)) einfuegen(index.traegerinnen, entitaet.id);
  if (entitaet.falle) einfuegen(index.fallen, entitaet.id);
}

function austragen(index, entitaet) {
  herausnehmen(index.traegerinnen, entitaet.id);
  herausnehmen(index.fallen, entitaet.id);
  if (!entitaet.position) return;
  herausnehmen(index.mitPosition, entitaet.id);
  const { x, y } = entitaet.position;
  ausTabelle(index.felder, feldSchluessel(x, y), entitaet.id);
  ausTabelle(index.zellen, zellSchluessel(x, y), entitaet.id);
}

function aufbauen(zustand) {
  const index = { felder: new Map(), zellen: new Map(), mitPosition: [], traegerinnen: [], fallen: [], lageOffen: [], todOffen: [], kaputtOffen: [] };
  // Object.values liefert ganzzahlige Schlüssel aufsteigend, die Listen entstehen also schon sortiert
  for (const entitaet of Object.values(zustand.entitaeten)) eintragen(index, entitaet);
  return index;
}

function indexVon(zustand) {
  let index = INDEXE.get(zustand);
  if (!index) {
    index = aufbauen(zustand);
    INDEXE.set(zustand, index);
  }
  return index;
}

// Nach dem Erzeugen einer Entität (kern/zustand.js)
export function entitaetIndexieren(zustand, entitaet) {
  eintragen(indexVon(zustand), entitaet);
}

// Vor dem Entfernen einer Entität (kern/zustand.js)
export function entitaetAusIndexNehmen(zustand, entitaet) {
  const index = indexVon(zustand);
  austragen(index, entitaet);
  herausnehmen(index.lageOffen, entitaet.id);
  herausnehmen(index.todOffen, entitaet.id);
  herausnehmen(index.kaputtOffen, entitaet.id);
}

// Setzt die Position einer Entität (feld null: keine Position mehr, z.B. aufgehoben); merkt die Lage zur Prüfung vor
export function positionSetzen(zustand, entitaet, feld) {
  const index = indexVon(zustand);
  austragen(index, entitaet);
  if (feld) entitaet.position = { x: feld.x, y: feld.y };
  else delete entitaet.position;
  eintragen(index, entitaet);
  if (feld) einfuegen(index.lageOffen, entitaet.id);
}

// Nach einer Änderung an Auren oder Zuständen einer Entität (systeme/zustaende.js): Trägerin neu einordnen
// und die Lage vormerken, weil ein Zustand die Bewegungsart ändern kann
export function zustaendeGeaendert(zustand, entitaet) {
  const index = indexVon(zustand);
  herausnehmen(index.traegerinnen, entitaet.id);
  if (istTraegerin(entitaet)) einfuegen(index.traegerinnen, entitaet.id);
  if (entitaet.position) einfuegen(index.lageOffen, entitaet.id);
}

// IDs auf einem Feld (Kopie, aufsteigend)
export function idsAufFeld(zustand, x, y) {
  return [...(indexVon(zustand).felder.get(feldSchluessel(x, y)) || [])];
}

// IDs aller Entitäten mit Position (Kopie, aufsteigend)
export function idsMitPosition(zustand) {
  return [...indexVon(zustand).mitPosition];
}

// IDs der Entitäten mit Position im Quadrat um die Mitte (Schachbrett-Abstand höchstens radius), aufsteigend.
// Über die Zellen, die das Quadrat berührt; bei sehr großem Radius über die Liste mitPosition.
export function idsImUmkreis(zustand, mitte, radius) {
  const index = indexVon(zustand);
  const entitaeten = zustand.entitaeten;
  const imQuadrat = (id) => {
    const position = entitaeten[id].position;
    return Math.abs(position.x - mitte.x) <= radius && Math.abs(position.y - mitte.y) <= radius;
  };
  const zellenJeSeite = Math.floor((mitte.x + radius) / ZELLE) - Math.floor((mitte.x - radius) / ZELLE) + 1;
  if (!Number.isFinite(radius) || zellenJeSeite * zellenJeSeite > index.zellen.size) return index.mitPosition.filter(imQuadrat);
  const ergebnis = [];
  const links = mitte.x - radius, rechts = mitte.x + radius, oben = mitte.y - radius, unten = mitte.y + radius;
  let zellenMitTreffern = 0;
  for (let zellY = Math.floor(oben / ZELLE); zellY <= Math.floor(unten / ZELLE); zellY++) {
    for (let zellX = Math.floor(links / ZELLE); zellX <= Math.floor(rechts / ZELLE); zellX++) {
      const inDerZelle = index.zellen.get(zellY * 65536 + zellX);
      if (!inDerZelle) continue;
      zellenMitTreffern++;
      // liegt die Zelle ganz im Quadrat, gehören alle dazu
      const ganzDrin = zellX * ZELLE >= links && (zellX + 1) * ZELLE - 1 <= rechts && zellY * ZELLE >= oben && (zellY + 1) * ZELLE - 1 <= unten;
      if (ganzDrin) for (const id of inDerZelle) ergebnis.push(id);
      else for (const id of inDerZelle) if (imQuadrat(id)) ergebnis.push(id);
    }
  }
  // die Listen der Zellen sind schon aufsteigend; nur aus mehreren Zellen muss sortiert werden
  return zellenMitTreffern > 1 ? ergebnis.sort((erste, zweite) => erste - zweite) : ergebnis;
}

// IDs der Fallen mit Position (Kopie, aufsteigend)
export function fallenIds(zustand) {
  return [...indexVon(zustand).fallen];
}

// Merkt Entitäten zur Prüfung der Lage vor, z.B. nach einer Änderung des Geländes unter ihnen (systeme/gelaende.js)
export function lageVormerken(zustand, entitaet) {
  if (entitaet.position) einfuegen(indexVon(zustand).lageOffen, entitaet.id);
}

// IDs möglicher Trägerinnen von Auren (Kopie, aufsteigend)
export function traegerinnenIds(zustand) {
  return [...indexVon(zustand).traegerinnen];
}

// Nimmt die zur Prüfung der Lage vorgemerkten IDs heraus (aufsteigend)
export function lageOffenEntnehmen(zustand) {
  const index = indexVon(zustand);
  const offen = index.lageOffen;
  index.lageOffen = [];
  return offen;
}

// Merkt eine Entität für die Prüfung des Todes vor (ein Wert ist auf 0 gefallen)
export function todVormerken(zustand, entitaet) {
  einfuegen(indexVon(zustand).todOffen, entitaet.id);
}

// Nimmt die zur Prüfung des Todes vorgemerkten IDs heraus (aufsteigend)
export function todOffenEntnehmen(zustand) {
  const index = indexVon(zustand);
  const offen = index.todOffen;
  index.todOffen = [];
  return offen;
}

// Merkt einen Gegenstand für die Prüfung auf kaputt vor (seine Haltbarkeit ist auf 0 gefallen)
export function kaputtVormerken(zustand, gegenstand) {
  einfuegen(indexVon(zustand).kaputtOffen, gegenstand.id);
}

// Nimmt die zur Prüfung auf kaputt vorgemerkten IDs heraus (aufsteigend)
export function kaputtOffenEntnehmen(zustand) {
  const index = indexVon(zustand);
  const offen = index.kaputtOffen;
  index.kaputtOffen = [];
  return offen;
}

// Verwirft den Index (z.B. beim Wechsel der Ebene); der nächste Zugriff baut ihn neu auf
export function indexVerwerfen(zustand) {
  INDEXE.delete(zustand);
}

// Vergleicht den Index mit einem frisch aufgebauten; gibt eine Liste von Abweichungen zurück (leer, wenn alles stimmt)
export function indexPruefen(zustand) {
  const index = indexVon(zustand), frisch = aufbauen(zustand);
  const abweichungen = [];
  const gleich = (erste, zweite) => erste.length === zweite.length && erste.every((id, stelle) => id === zweite[stelle]);
  if (!gleich(index.mitPosition, frisch.mitPosition)) abweichungen.push("mitPosition weicht ab");
  if (!gleich(index.traegerinnen, frisch.traegerinnen)) abweichungen.push("traegerinnen weicht ab");
  if (!gleich(index.fallen, frisch.fallen)) abweichungen.push("fallen weicht ab");
  if (index.zellen.size !== frisch.zellen.size) abweichungen.push("Zahl der belegten Zellen weicht ab");
  for (const [schluessel, ids] of frisch.zellen) if (!gleich(index.zellen.get(schluessel) || [], ids)) abweichungen.push(`Zelle ${schluessel} weicht ab`);
  if (index.felder.size !== frisch.felder.size) abweichungen.push("Zahl der belegten Felder weicht ab");
  for (const [schluessel, ids] of frisch.felder) {
    if (!gleich(index.felder.get(schluessel) || [], ids)) abweichungen.push(`Feld ${schluessel % 65536},${Math.floor(schluessel / 65536)} weicht ab`);
  }
  return abweichungen;
}
