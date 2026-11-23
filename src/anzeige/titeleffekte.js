// Ausschnitt und bewegte Effekte des Titelbilds (docs/Titelbildschirm.md). Der Ausschnitt folgt der Fenstergröße: das
// Bild füllt die Höhe des Fensters und die freie Mitte zwischen den Spalten des Titels, ist es schmaler als das
// Fenster, läuft es seitlich weich ins Dunkle aus; was übersteht, wird so beschnitten, dass der Schutzbereich des Bildes
// in der freien Mitte steht. Effekte: Dampf, Blitze auf Ninkasi mit Überschlägen auf die Gegner, Aura entlang ihrer
// Silhouette, Feuerwerk auf ihrem Umriss, pulsierende Augen, Bodennebel. Dampf und Nebel sind gemalte Schwaden
// (Sprites, weiß auf Schwarz, die Helligkeit wird Deckkraft), die aufsteigen, treiben, wachsen und verblassen; dazu
// zischen ab und zu Dampfstöße aus Ventilen. Rein kosmetisch: der Zufall kommt von außen
// (src/main.js), nichts davon berührt den Spielzustand.
// Die Effekte eines Bildes stehen als Daten in anzeige/titelbilder.js (Punkte in Prozent des Bildes, Masken als
// Schwarzweiß-PNG in Bildgröße, weiß ist die Figur). Gezeichnet wird in Bildpixeln mit derselben Abbildung, die auch
// Lage und Größe des Bildes bestimmt, so dass alles an seiner Stelle im Bild bleibt.
// Ebenen von hinten nach vorn: Widerschein auf den Anlagen, Dampf hinten (von den Masken im Vordergrund ausgestanzt,
// steht also hinter den Figuren), Aura, Augen, Lichthöfe der Einschläge, Blitze, Feuerwerk, Dampf vorn, Bodennebel.
// Nur die dünnen Blitze flackern; Aura und Lichthöfe schwellen weich an und ab (Lichtempfindlichkeit). Ohne Bewegung
// (Einstellung bewegungReduzieren oder prefers-reduced-motion des Systems) bleibt nur die ruhende Aura.
// Die reinen Rechnungen (Ausschnitt, Blitzgeometrie, Funkenbahn, Helligkeiten) laufen auch in Node und haben Tests; alles mit DOM
// und Canvas beginnt erst in titeleffekteAnlegen.

// Farben der Effekte: eigene Werte, nicht aus der Pixel-Palette (grafik/palette.js), weil das gemalte Titelbild nicht
// zur Pixelwelt gehört
const FARBEN = {
  blitzAussen: [90, 130, 255],
  blitzMitte: [150, 190, 255],
  blitzKern: [245, 248, 255],
  aura: "rgb(110, 160, 255)",
  lichthof: [130, 170, 255],
  feuerwerk: [[200, 225, 255], [255, 225, 150], [170, 255, 230]],
  dampf: [225, 210, 190],
  augen: { gelb: [255, 215, 60], rot: [255, 45, 25] },
};

// Zeiten in Millisekunden, Größen in Bildpixeln
const BLITZ_DAUER = 320;
const LICHTHOF_DAUER = 600;
const LEUCHTEN_DAUER = 900;
const BLITZ_PAUSE = { kleinste: 1800, groesste: 5200 };
const ERSTER_BLITZ = 900;
const UEBERSCHLAG = { chance: 0.4, verzoegerung: 50 };
const AURA = { grund: 0.32, schwanken: 0.1, periode: 2600, aufBlitz: 0.9, unschaerfe: 9, innen: 0.2 };
// Feuerwerk auf dem Umriss nach dem Einschlag: kleine Kugeln, die aufleuchten und in Funken zerplatzen
const FEUERWERK = { anzahl: 12, zeitraum: 420, radiusAnfang: 60, radiusEnde: 560, aufleuchten: 60, funken: [9, 16], tempo: [90, 180], schweif: 45, dauer: [220, 380], groesse: [2, 3.5] };
// Dampf: Schwaden je Quelle (Höhe in Bildpixeln, wachsen als Anteil je Sekunde, Drehung im Bogenmaß), Nebelbänder im
// Band des Bodennebels, Stöße an den Ventilen
const SCHWADE = { jeSekunde: 0.8, hoechstens: 160, steigen: [12, 30], treiben: 8, hoehe: [300, 620], wachsen: 0.12, drehung: 0.12, drehen: 0.03, leben: [5000, 9000], deckkraft: 0.42 };
const NEBEL = { jeSekunde: 0.6, treiben: [10, 25], breite: [800, 1400], wachsen: 0.04, leben: [9000, 15000], deckkraft: 0.35 };
const STOSS = { pause: [2500, 7000], breite: [380, 620], aufbau: 250, steigen: 10, wachsen: 0.2, leben: [1400, 2200], deckkraft: 0.55 };
const AUGEN = { periode: [2200, 4200], kleinste: 0.12, groesste: 0.85 };
const VORLAUF = 8000; // Millisekunden Dampf vor dem ersten Bild
const MASKEN_AUFLOESUNG = 1000;
const HOECHSTE_PIXELDICHTE = 1.5;

const BLITZ_VORGABEN = { stufen: 6, ausschlag: 0.2, daempfung: 0.55, astChance: 0.45, astTiefe: 2, astLaenge: [0.2, 0.55], astWinkel: [0.3, 0.9] };

// Abbildung des Bildes auf die Fläche: schirmX = versatzX + bildX * massstab. Das Bild füllt die Höhe der Fläche und
// die freie Mitte { links, rechts } (Pixel der Fläche, z.B. zwischen den Spalten des Titels), nicht mehr; je Achse gilt:
// passt das Bild hinein, steht es mittig (waagerecht in der freien Mitte); steht es über, rückt der Schutzbereich
// { links, oben, rechts, unten } (Prozent des Bildes) in die Mitte, aber nur so weit, dass keine Lücke entsteht; ist
// der Schutzbereich höher als die Fläche, bleibt sein oberer Rand sichtbar.
export function ausschnittWaehlen(flaecheBreite, flaecheHoehe, bildBreite, bildHoehe, schutzbereich, freieMitte = { links: 0, rechts: flaecheBreite }) {
  const massstab = Math.max(flaecheHoehe / bildHoehe, (freieMitte.rechts - freieMitte.links) / bildBreite);
  const versatzAchse = (flaeche, bildlaenge, anfang, ende, mitteAnfang, mitteEnde, obenZuerst) => {
    const laenge = bildlaenge * massstab;
    const mitte = (mitteAnfang + mitteEnde) / 2;
    if (laenge <= flaeche) return mitte - laenge / 2;
    const bereichAnfang = (anfang * laenge) / 100;
    const bereichEnde = (ende * laenge) / 100;
    const versatz = obenZuerst && bereichEnde - bereichAnfang > flaeche ? -bereichAnfang : mitte - (bereichAnfang + bereichEnde) / 2;
    return Math.min(0, Math.max(flaeche - laenge, versatz)) + 0; // + 0 macht aus -0 eine 0
  };
  return {
    massstab,
    versatzX: versatzAchse(flaecheBreite, bildBreite, schutzbereich.links, schutzbereich.rechts, freieMitte.links, freieMitte.rechts, false),
    versatzY: versatzAchse(flaecheHoehe, bildHoehe, schutzbereich.oben, schutzbereich.unten, 0, flaecheHoehe, true),
  };
}

// Ort eines Feuerwerksfunkens nach alter Millisekunden: geradeaus nach außen mit tempo (Bildpixel je Sekunde) im winkel
export function funkenBahn(start, winkel, tempo, alter) {
  const sekunden = alter / 1000;
  return { x: start.x + Math.cos(winkel) * tempo * sekunden, y: start.y + Math.sin(winkel) * tempo * sekunden };
}

// Helligkeit eines Augenpaars: schwillt zwischen kleinste und groesste sinusförmig an und ab
export function augenLeuchten(zeit, periode, phase) {
  return AUGEN.kleinste + (AUGEN.groesste - AUGEN.kleinste) * (0.5 + 0.5 * Math.sin((zeit / periode) * 2 * Math.PI + phase));
}

const zwischen = (zufall, [kleinste, groesste]) => kleinste + zufall() * (groesste - kleinste);
const waehlen = (zufall, liste) => liste[Math.floor(zufall() * liste.length)];

// Ein verästelter Blitz von "von" nach "nach": Liste von Strängen { punkte, staerke, tiefe }, der erste ist der
// Hauptpfad. Jeder Strang entsteht durch fortgesetztes Halbieren mit seitlichem Versatz (je Stufe gedämpft); Äste
// zweigen an Knicken ab, kürzer, schwächer und mit einer Stufe weniger, bis zur Tiefe astTiefe.
export function blitzErzeugen(von, nach, zufall, optionen = {}) {
  const einstellungen = { ...BLITZ_VORGABEN, ...optionen };
  const straenge = [];
  strangErzeugen(von, nach, 1, 0, einstellungen.stufen);
  return straenge;

  function strangErzeugen(anfang, ende, staerke, tiefe, stufen) {
    let punkte = [anfang, ende];
    let ausschlag = Math.hypot(ende.x - anfang.x, ende.y - anfang.y) * einstellungen.ausschlag;
    for (let stufe = 0; stufe < stufen; stufe++) {
      const verfeinert = [punkte[0]];
      for (let i = 1; i < punkte.length; i++) {
        const vorher = punkte[i - 1];
        const nachher = punkte[i];
        const dx = nachher.x - vorher.x;
        const dy = nachher.y - vorher.y;
        const laenge = Math.hypot(dx, dy) || 1;
        const versatz = (zufall() * 2 - 1) * ausschlag;
        verfeinert.push({ x: (vorher.x + nachher.x) / 2 - (dy / laenge) * versatz, y: (vorher.y + nachher.y) / 2 + (dx / laenge) * versatz }, nachher);
      }
      punkte = verfeinert;
      ausschlag *= einstellungen.daempfung;
    }
    straenge.push({ punkte, staerke, tiefe });
    if (tiefe >= einstellungen.astTiefe || stufen <= 2) return;
    const astWahrscheinlichkeit = (einstellungen.astChance * 4) / punkte.length;
    for (let i = 1; i < punkte.length - 1; i++) {
      if (zufall() >= astWahrscheinlichkeit) continue;
      const vorher = punkte[i - 1];
      const nachher = punkte[i + 1];
      const richtung = Math.atan2(nachher.y - vorher.y, nachher.x - vorher.x) + (zufall() < 0.5 ? -1 : 1) * zwischen(zufall, einstellungen.astWinkel);
      const rest = Math.hypot(ende.x - punkte[i].x, ende.y - punkte[i].y);
      const astLaenge = Math.max(rest, Math.hypot(ende.x - anfang.x, ende.y - anfang.y) * 0.3) * zwischen(zufall, einstellungen.astLaenge);
      const astEnde = { x: punkte[i].x + Math.cos(richtung) * astLaenge, y: punkte[i].y + Math.sin(richtung) * astLaenge };
      strangErzeugen(punkte[i], astEnde, staerke * 0.5, tiefe + 1, stufen - 1);
    }
  }
}

// Helligkeit der Blitzlinie nach alter Millisekunden: Einschlag, kurzes Dunkel, ein Nachschlag auf demselben Pfad,
// Abklingen; außerhalb der Dauer 0
export function blitzHelligkeit(alter) {
  if (alter < 0 || alter >= BLITZ_DAUER) return 0;
  if (alter < 60) return 1 - (alter / 60) * 0.6;
  if (alter < 90) return 0.15;
  if (alter < 140) return 0.9 - ((alter - 90) / 50) * 0.4;
  return 0.5 * (1 - (alter - 140) / (BLITZ_DAUER - 140));
}

// Weiches An- und Abschwellen für Lichthöfe und Aura, ohne Flackern: schnell an (60 ms), dann quadratisch ab
export function weichesLeuchten(alter, dauer) {
  if (alter < 0 || alter >= dauer) return 0;
  if (alter < 60) return alter / 60;
  const rest = 1 - (alter - 60) / (dauer - 60);
  return rest * rest;
}

// Punkte eines Effekts von Prozent in Bildpixel
const inBildpixel = (punkt, breite, hoehe) => ({ x: (punkt.x * breite) / 100, y: (punkt.y * hoehe) / 100 });

// Ausschnitt und Effekte im Browser: liefert { einhaengen(hintergrundElement, titelbild) }. einhaengen setzt den
// Ausschnitt des Bildes (object-position) und hängt das Canvas der Effekte an; das Canvas bleibt dasselbe Objekt und
// wird nach jedem Neuzeichnen des Titels (innerHTML in src/main.js) wieder eingehängt. Die Schleife hält an, sobald es
// nicht mehr im Dokument hängt oder der Tab verborgen ist; eine Größenänderung des Fensters setzt den Ausschnitt neu.
//   zufall: Funktion mit Werten in [0, 1)
//   bewegungReduziert: Funktion, true schaltet alles Bewegte ab
export function titeleffekteAnlegen({ zufall, bewegungReduziert }) {
  const leinwand = neueLeinwand(1, 1);
  leinwand.className = "titel-effekte";
  const flaeche = leinwand.getContext("2d");
  const dampfLeinwand = neueLeinwand(1, 1);
  const dampfFlaeche = dampfLeinwand.getContext("2d");
  const hilfsLeinwand = neueLeinwand(1, 1);
  const hilfsFlaeche = hilfsLeinwand.getContext("2d");

  let geladen = null; // { titelbild, bereit, breite, hoehe, masken, aura, kontur, augen, effekte }
  let laeuft = false;
  let letzteZeit = null;
  let zustand = neuerZustand();
  let hintergrund = null;
  let titelbild = null;
  let ausschnitt = null; // { massstab, versatzX, versatzY } in CSS-Pixeln der Fläche
  const bildMasse = new WeakMap(); // Titelbild → { breite, hoehe } des geladenen Bildes

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && leinwand.isConnected) starten();
  });
  window.addEventListener("resize", () => {
    if (!hintergrund?.isConnected) return;
    ausschnittAnwenden();
    if (!laeuft) ruhendZeichnen();
  });

  function neuerZustand() {
    return { dampf: [], nebel: [], blitze: [], lichthoefe: [], funken: [], leuchtenBeginn: null, naechsterBlitz: null, dampfRest: 0, nebelRest: 0, stossIn: null };
  }

  function einhaengen(neuerHintergrund, neuesTitelbild) {
    if (!neuerHintergrund || !neuesTitelbild) return;
    hintergrund = neuerHintergrund;
    titelbild = neuesTitelbild;
    const bildElement = hintergrund.querySelector(".titel-bild");
    ausschnittAnwenden();
    if (bildElement && !bildElement.complete) bildElement.addEventListener("load", ausschnittAnwenden, { once: true });
    if (!titelbild.effekte) return;
    hintergrund.appendChild(leinwand);
    if (geladen?.titelbild !== titelbild) laden(titelbild);
    starten();
  }

  // Freie Mitte zwischen den Spalten des Titels; liegen sie übereinander (schmale Fenster), die ganze Breite
  function freieMitte(breite) {
    const titel = hintergrund.parentElement;
    const rahmen = titel.getBoundingClientRect();
    const links = titel.querySelector(".titel-links")?.getBoundingClientRect();
    const rechts = titel.querySelector(".titel-rechts")?.getBoundingClientRect();
    if (!links || !rechts || links.right >= rechts.left) return { links: 0, rechts: breite };
    return { links: links.right - rahmen.left, rechts: rechts.left - rahmen.left };
  }

  // Der Titel baut das Bild bei jedem Neuzeichnen neu; ein frisches Element kennt seine Größe erst nach dem Laden. Die
  // einmal bekannte Größe je Titelbild setzt den Ausschnitt deshalb sofort, sonst stünde das Bild kurz auf 50 % und
  // die Effekte daneben.
  function ausschnittAnwenden() {
    const bildElement = hintergrund?.querySelector(".titel-bild");
    if (!bildElement) return;
    if (bildElement.naturalWidth) bildMasse.set(titelbild, { breite: bildElement.naturalWidth, hoehe: bildElement.naturalHeight });
    const masse = bildMasse.get(titelbild);
    if (!masse) return;
    const { width: breite, height: hoehe } = hintergrund.getBoundingClientRect();
    const schutzbereich = titelbild.schutzbereich ?? { links: 0, oben: 0, rechts: 100, unten: 100 };
    ausschnitt = ausschnittWaehlen(breite, hoehe, masse.breite, masse.hoehe, schutzbereich, freieMitte(breite));
    const { massstab, versatzX, versatzY } = ausschnitt;
    const bildbreite = masse.breite * massstab;
    Object.assign(bildElement.style, {
      position: "absolute",
      left: `${versatzX}px`,
      top: `${versatzY}px`,
      width: `${bildbreite}px`,
      height: `${masse.hoehe * massstab}px`,
      // schmaler als das Fenster: seitlich weich ins Dunkle
      maskImage: bildbreite < breite - 1 ? "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)" : "",
    });
    // die Effekte enden an denselben Rändern wie das Bild, statt ins Dunkle daneben zu ragen
    const rand = bildbreite * 0.07;
    const links = Math.max(0, versatzX);
    const rechts = Math.min(breite, versatzX + bildbreite);
    leinwand.style.maskImage = bildbreite < breite - 1
      ? `linear-gradient(to right, transparent ${links}px, #000 ${links + rand}px, #000 ${rechts - rand}px, transparent ${rechts}px)`
      : "";
  }

  async function laden(titelbild) {
    const eintrag = { titelbild, bereit: false };
    geladen = eintrag;
    zustand = neuerZustand();
    try {
      const { effekte } = titelbild;
      const maskenNamen = Object.keys(effekte.masken ?? {});
      const spriteListen = effekte.sprites ?? {};
      const [grundbild, maskenBilder, sprites] = await Promise.all([
        bildLaden(titelbild.datei),
        Promise.all(maskenNamen.map((name) => bildLaden(effekte.masken[name]))),
        spritesLaden(spriteListen),
      ]);
      const breite = grundbild.naturalWidth;
      const hoehe = grundbild.naturalHeight;
      bildMasse.set(titelbild, { breite, hoehe });
      if (hintergrund?.isConnected) ausschnittAnwenden();
      const masken = Object.fromEntries(maskenNamen.map((name, stelle) => [name, maskeAufbereiten(maskenBilder[stelle])]));
      const punkte = (liste = []) => liste.map((punkt) => inBildpixel(punkt, breite, hoehe));
      Object.assign(eintrag, {
        breite,
        hoehe,
        masken,
        sprites,
        aura: effekte.aura ? auraAufbereiten(masken[effekte.aura]) : null,
        kontur: effekte.blitze?.kontur ? konturPunkte(masken[effekte.blitze.kontur], breite, hoehe) : [],
        // je Wesen ein Augenpaar mit eigenem Takt, damit nicht alle zugleich aufleuchten
        augen: (effekte.augen ?? []).map((wesen) => ({
          farbe: FARBEN.augen[wesen.farbe],
          punkte: punkte(wesen.punkte),
          radius: (wesen.groesse * breite) / 100,
          periode: zwischen(zufall, AUGEN.periode),
          phase: zufall() * 2 * Math.PI,
        })),
        effekte: {
          vordergrund: effekte.vordergrund ?? [],
          dampf: (effekte.dampf ?? []).map((quelle) => ({ ...inBildpixel(quelle, breite, hoehe), breite: (quelle.breite * breite) / 100, vorn: Boolean(quelle.vorn) })),
          bodennebel: effekte.bodennebel ? { y: (effekte.bodennebel.y * hoehe) / 100, hoehe: (effekte.bodennebel.hoehe * hoehe) / 100 } : null,
          dampfstoesse: (effekte.dampfstoesse ?? []).map((ventil) => ({ ...inBildpixel(ventil, breite, hoehe), richtung: ventil.richtung })),
          blitze: effekte.blitze ? { ...effekte.blitze, quellen: punkte(effekte.blitze.quellen), ziele: punkte(effekte.blitze.ziele), ueberschlaege: punkte(effekte.blitze.ueberschlaege) } : null,
        },
        bereit: true,
      });
    } catch (fehler) {
      console.warn("Titeleffekte nicht geladen:", fehler);
      return;
    }
    if (geladen === eintrag) {
      for (let vorlauf = 0; vorlauf < VORLAUF; vorlauf += 100) teilchenFortschreiben(100);
      laeuft = false;
      starten();
    }
  }

  function starten() {
    if (laeuft || !leinwand.isConnected) return;
    if (bewegungReduziert()) return ruhendZeichnen();
    laeuft = true;
    letzteZeit = null;
    requestAnimationFrame(takt);
  }

  function takt(zeit) {
    if (!leinwand.isConnected || document.hidden) {
      laeuft = false;
      return;
    }
    if (bewegungReduziert()) {
      laeuft = false;
      zustand = neuerZustand();
      return ruhendZeichnen();
    }
    const schritt = letzteZeit === null ? 0 : Math.min(zeit - letzteZeit, 100);
    letzteZeit = zeit;
    if (geladen?.bereit) {
      fortschreiben(zeit, schritt);
      allesZeichnen(zeit);
    }
    requestAnimationFrame(takt);
  }

  // Simulation: Teilchen bewegen, neue erzeugen, Blitze auslösen und Abgelaufenes entfernen
  function fortschreiben(jetzt, schritt) {
    teilchenFortschreiben(schritt);
    blitzeFortschreiben(jetzt);
  }

  // Dampf und Nebel; beim Laden läuft das einige Sekunden vor, damit der Dampf vom ersten Bild an steht
  function teilchenFortschreiben(schritt) {
    const { effekte, sprites } = geladen;
    const sekunden = schritt / 1000;
    for (const teilchen of [...zustand.dampf, ...zustand.nebel]) {
      teilchen.alter += schritt;
      teilchen.x += teilchen.vx * sekunden;
      teilchen.y += teilchen.vy * sekunden;
      teilchen.groesse *= 1 + teilchen.wachsen * sekunden;
      teilchen.drehung += teilchen.drehen * sekunden;
    }
    zustand.dampf = zustand.dampf.filter((teilchen) => teilchen.alter < teilchen.leben);
    zustand.nebel = zustand.nebel.filter((teilchen) => teilchen.alter < teilchen.leben);

    if (sprites.schwaden.length) {
      zustand.dampfRest += SCHWADE.jeSekunde * effekte.dampf.length * sekunden;
      while (zustand.dampfRest >= 1) {
        zustand.dampfRest -= 1;
        if (zustand.dampf.length >= SCHWADE.hoechstens) continue;
        const quelle = waehlen(zufall, effekte.dampf);
        zustand.dampf.push({
          art: "schwade",
          vorn: quelle.vorn,
          bild: waehlen(zufall, sprites.schwaden),
          x: quelle.x + (zufall() - 0.5) * quelle.breite,
          y: quelle.y,
          vx: (zufall() - 0.5) * 2 * SCHWADE.treiben,
          vy: -zwischen(zufall, SCHWADE.steigen),
          groesse: zwischen(zufall, SCHWADE.hoehe),
          wachsen: SCHWADE.wachsen * (0.6 + zufall() * 0.8),
          drehung: (zufall() - 0.5) * 2 * SCHWADE.drehung,
          drehen: (zufall() - 0.5) * 2 * SCHWADE.drehen,
          spiegeln: zufall() < 0.5,
          alter: 0,
          leben: zwischen(zufall, SCHWADE.leben),
        });
      }
    }
    if (effekte.bodennebel && sprites.nebel.length) {
      zustand.nebelRest += NEBEL.jeSekunde * sekunden;
      while (zustand.nebelRest >= 1) {
        zustand.nebelRest -= 1;
        zustand.nebel.push({
          art: "nebel",
          bild: waehlen(zufall, sprites.nebel),
          x: zufall() * geladen.breite,
          y: effekte.bodennebel.y + (zufall() - 0.5) * effekte.bodennebel.hoehe,
          vx: (zufall() < 0.5 ? -1 : 1) * zwischen(zufall, NEBEL.treiben),
          vy: -2,
          groesse: zwischen(zufall, NEBEL.breite),
          wachsen: NEBEL.wachsen,
          drehung: 0,
          drehen: 0,
          spiegeln: zufall() < 0.5,
          alter: 0,
          leben: zwischen(zufall, NEBEL.leben),
        });
      }
    }
    // Dampfstöße: in unregelmäßigen Pausen zischt eines der Ventile
    if (effekte.dampfstoesse.length && sprites.stoesse.length) {
      if (zustand.stossIn === null) zustand.stossIn = zwischen(zufall, STOSS.pause);
      zustand.stossIn -= schritt;
      if (zustand.stossIn <= 0) {
        zustand.stossIn = zwischen(zufall, STOSS.pause);
        const ventil = waehlen(zufall, effekte.dampfstoesse);
        zustand.dampf.push({
          art: "stoss",
          vorn: false,
          bild: waehlen(zufall, sprites.stoesse),
          x: ventil.x,
          y: ventil.y,
          vx: 0,
          vy: -STOSS.steigen,
          groesse: zwischen(zufall, STOSS.breite),
          wachsen: STOSS.wachsen,
          drehung: (zufall() - 0.5) * 0.2,
          drehen: 0,
          spiegeln: ventil.richtung === "links",
          alter: 0,
          leben: zwischen(zufall, STOSS.leben),
        });
      }
    }
  }

  function blitzeFortschreiben(jetzt) {
    const { effekte } = geladen;
    if (effekte.blitze) {
      if (zustand.naechsterBlitz === null) zustand.naechsterBlitz = jetzt + ERSTER_BLITZ;
      if (jetzt >= zustand.naechsterBlitz) einschlagAusloesen(jetzt);
    }
    zustand.blitze = zustand.blitze.filter((blitz) => jetzt - blitz.beginn < BLITZ_DAUER);
    zustand.lichthoefe = zustand.lichthoefe.filter((lichthof) => jetzt - lichthof.beginn < LICHTHOF_DAUER);
    zustand.funken = zustand.funken.filter((feuerwerk) => jetzt - feuerwerk.beginn < FEUERWERK.aufleuchten + feuerwerk.dauer);
  }

  function einschlagAusloesen(jetzt) {
    const { blitze } = geladen.effekte;
    const quelle = waehlen(zufall, blitze.quellen);
    const ziel = waehlen(zufall, blitze.ziele);
    zustand.blitze.push({ straenge: blitzErzeugen(quelle, ziel, zufall), beginn: jetzt, staerke: 1 });
    if (blitze.widerschein) zustand.lichthoefe.push({ ...quelle, radius: 280, staerke: 0.7, maske: blitze.widerschein, beginn: jetzt });
    zustand.lichthoefe.push({ ...ziel, radius: 150, staerke: 0.8, maske: null, beginn: jetzt });
    zustand.leuchtenBeginn = jetzt;
    funkenAusloesen(ziel, jetzt);
    if (blitze.ueberschlaege.length && zufall() < UEBERSCHLAG.chance) {
      const weiter = waehlen(zufall, blitze.ueberschlaege);
      const beginn = jetzt + UEBERSCHLAG.verzoegerung;
      zustand.blitze.push({ straenge: blitzErzeugen(ziel, weiter, zufall, { stufen: 5, astTiefe: 1 }), beginn, staerke: 0.6 });
      zustand.lichthoefe.push({ ...weiter, radius: 200, staerke: 0.8, maske: blitze.ueberschlagMaske ?? null, beginn });
    }
    zustand.naechsterBlitz = jetzt + zwischen(zufall, [BLITZ_PAUSE.kleinste, BLITZ_PAUSE.groesste]);
  }

  // Feuerwerk kriecht vom Einschlag aus über den Umriss: je später, desto weiter entfernt; jede Kugel leuchtet kurz
  // auf und zerplatzt dann in Funken, die nach außen fliegen, absinken und verglühen
  function funkenAusloesen(ziel, jetzt) {
    if (!geladen.kontur.length) return;
    for (let i = 0; i < FEUERWERK.anzahl; i++) {
      const verzoegerung = (i / FEUERWERK.anzahl) * FEUERWERK.zeitraum;
      const radius = FEUERWERK.radiusAnfang + (FEUERWERK.radiusEnde - FEUERWERK.radiusAnfang) * (verzoegerung / FEUERWERK.zeitraum);
      for (let versuch = 0; versuch < 12; versuch++) {
        const punkt = waehlen(zufall, geladen.kontur);
        if (Math.hypot(punkt.x - ziel.x, punkt.y - ziel.y) > radius) continue;
        const anzahl = Math.round(zwischen(zufall, FEUERWERK.funken));
        const drehung = zufall() * 2 * Math.PI;
        zustand.funken.push({
          ...punkt,
          beginn: jetzt + verzoegerung,
          dauer: zwischen(zufall, FEUERWERK.dauer),
          farbe: waehlen(zufall, FARBEN.feuerwerk),
          funken: Array.from({ length: anzahl }, (_, stelle) => ({
            winkel: drehung + (stelle / anzahl) * 2 * Math.PI + (zufall() - 0.5) * 0.4,
            tempo: zwischen(zufall, FEUERWERK.tempo),
            groesse: zwischen(zufall, FEUERWERK.groesse),
          })),
        });
        break;
      }
    }
  }

  // Leinwände auf die angezeigte Größe bringen und die Abbildung Bild zu Schirm liefern
  function groesseAnpassen() {
    const dichte = Math.min(window.devicePixelRatio || 1, HOECHSTE_PIXELDICHTE);
    const breite = Math.max(1, Math.round(leinwand.clientWidth * dichte));
    const hoehe = Math.max(1, Math.round(leinwand.clientHeight * dichte));
    for (const ziel of [leinwand, dampfLeinwand, hilfsLeinwand]) {
      if (ziel.width !== breite || ziel.height !== hoehe) {
        ziel.width = breite;
        ziel.height = hoehe;
      }
    }
    if (!ausschnitt) ausschnittAnwenden();
    const { massstab, versatzX, versatzY } = ausschnitt ?? { massstab: 1, versatzX: 0, versatzY: 0 };
    return { massstab: massstab * dichte, versatzX: versatzX * dichte, versatzY: versatzY * dichte };
  }

  const aufBild = (ziel, { massstab, versatzX, versatzY }) => ziel.setTransform(massstab, 0, 0, massstab, versatzX, versatzY);

  function leeren(ziel, quelle) {
    ziel.setTransform(1, 0, 0, 1, 0, 0);
    ziel.globalCompositeOperation = "source-over";
    ziel.globalAlpha = 1;
    ziel.clearRect(0, 0, quelle.width, quelle.height);
  }

  function ruhendZeichnen() {
    if (!geladen?.bereit) return;
    const abbildung = groesseAnpassen();
    leeren(flaeche, leinwand);
    if (!geladen.aura) return;
    aufBild(flaeche, abbildung);
    flaeche.globalCompositeOperation = "lighter";
    flaeche.globalAlpha = AURA.grund;
    flaeche.drawImage(geladen.aura, 0, 0, geladen.breite, geladen.hoehe);
    flaeche.setTransform(1, 0, 0, 1, 0, 0);
    flaeche.globalAlpha = 1;
  }

  function allesZeichnen(jetzt) {
    const abbildung = groesseAnpassen();
    const { masken, effekte, breite, hoehe } = geladen;
    leeren(flaeche, leinwand);

    // Widerschein auf den Anlagen hinter allem
    for (const lichthof of zustand.lichthoefe) if (lichthof.maske && lichthof.maske === effekte.blitze?.widerschein) lichthofZeichnen(lichthof, jetzt, abbildung);

    // Dampf auf eigener Leinwand, die Figuren im Vordergrund stanzen ihn aus
    leeren(dampfFlaeche, dampfLeinwand);
    aufBild(dampfFlaeche, abbildung);
    teilchenZeichnen(dampfFlaeche, zustand.dampf.filter((teilchen) => !teilchen.vorn));
    dampfFlaeche.globalAlpha = 1;
    dampfFlaeche.globalCompositeOperation = "destination-out";
    for (const name of effekte.vordergrund) if (masken[name]) dampfFlaeche.drawImage(masken[name].leinwand, 0, 0, breite, hoehe);
    flaeche.setTransform(1, 0, 0, 1, 0, 0);
    flaeche.drawImage(dampfLeinwand, 0, 0);

    // Aura: ruhiges Pulsieren, nach einem Einschlag weich heller
    if (geladen.aura) {
      const leuchten = zustand.leuchtenBeginn === null ? 0 : weichesLeuchten(jetzt - zustand.leuchtenBeginn, LEUCHTEN_DAUER);
      aufBild(flaeche, abbildung);
      flaeche.globalCompositeOperation = "lighter";
      flaeche.globalAlpha = Math.min(1, AURA.grund + AURA.schwanken * Math.sin((jetzt / AURA.periode) * 2 * Math.PI) + AURA.aufBlitz * leuchten);
      flaeche.drawImage(geladen.aura, 0, 0, breite, hoehe);
    }

    augenZeichnen(jetzt, abbildung);

    // Lichthöfe an Ninkasi und auf den Gegnern
    for (const lichthof of zustand.lichthoefe) if (!lichthof.maske || lichthof.maske !== effekte.blitze?.widerschein) lichthofZeichnen(lichthof, jetzt, abbildung);

    for (const blitz of zustand.blitze) blitzZeichnen(blitz, jetzt, abbildung);
    funkenZeichnen(jetzt, abbildung);

    // Dampf vorn und Bodennebel, ohne Ausstanzen
    aufBild(flaeche, abbildung);
    flaeche.globalCompositeOperation = "source-over";
    teilchenZeichnen(flaeche, zustand.dampf.filter((teilchen) => teilchen.vorn));
    teilchenZeichnen(flaeche, zustand.nebel);
    flaeche.globalAlpha = 1;
  }

  // Dampf und Nebel als Sprites: eine Schwade steht mit dem Fuß an ihrem Ort und wächst nach oben, ein Nebelband liegt
  // mittig, ein Stoß beginnt an der Düse und wird von dort aus aufgedeckt; die Deckkraft schwillt über das Leben an
  // und ab, beim Stoß schnell an und langsam aus
  function teilchenZeichnen(ziel, teilchenListe) {
    ziel.globalCompositeOperation = "source-over";
    for (const teilchen of teilchenListe) {
      const anteil = teilchen.alter / teilchen.leben;
      const { bild } = teilchen;
      const seitenverhaeltnis = bild.height / bild.width;
      ziel.save();
      ziel.translate(teilchen.x, teilchen.y);
      ziel.rotate(teilchen.drehung);
      ziel.scale(teilchen.spiegeln ? -1 : 1, 1);
      if (teilchen.art === "schwade") {
        ziel.globalAlpha = SCHWADE.deckkraft * Math.sin(anteil * Math.PI);
        const hoehe = teilchen.groesse;
        const breite = hoehe / seitenverhaeltnis;
        ziel.drawImage(bild, -breite / 2, -hoehe, breite, hoehe);
      } else if (teilchen.art === "nebel") {
        ziel.globalAlpha = NEBEL.deckkraft * Math.sin(anteil * Math.PI);
        const breite = teilchen.groesse;
        const hoehe = breite * seitenverhaeltnis;
        ziel.drawImage(bild, -breite / 2, -hoehe / 2, breite, hoehe);
      } else {
        ziel.globalAlpha = STOSS.deckkraft * (anteil < 0.1 ? anteil / 0.1 : (1 - anteil) / 0.9);
        const sichtbar = Math.min(1, teilchen.alter / STOSS.aufbau);
        const breite = teilchen.groesse;
        const hoehe = breite * seitenverhaeltnis;
        ziel.drawImage(bild, 0, 0, bild.width * sichtbar, bild.height, 0, -hoehe / 2, breite * sichtbar, hoehe);
      }
      ziel.restore();
    }
  }

  // Leuchtende Augen: heller Kern, weicher Schein, je Wesen im eigenen Takt
  function augenZeichnen(jetzt, abbildung) {
    aufBild(flaeche, abbildung);
    flaeche.globalCompositeOperation = "lighter";
    flaeche.globalAlpha = 1;
    for (const wesen of geladen.augen) {
      const staerke = augenLeuchten(jetzt, wesen.periode, wesen.phase);
      const [rot, gruen, blau] = wesen.farbe;
      for (const auge of wesen.punkte) {
        const verlauf = flaeche.createRadialGradient(auge.x, auge.y, 0, auge.x, auge.y, wesen.radius);
        verlauf.addColorStop(0, `rgba(${rot}, ${gruen}, ${blau}, ${staerke})`);
        verlauf.addColorStop(0.25, `rgba(${rot}, ${gruen}, ${blau}, ${staerke * 0.55})`);
        verlauf.addColorStop(1, `rgba(${rot}, ${gruen}, ${blau}, 0)`);
        flaeche.fillStyle = verlauf;
        flaeche.fillRect(auge.x - wesen.radius, auge.y - wesen.radius, wesen.radius * 2, wesen.radius * 2);
      }
    }
  }

  // Runder Lichthof; mit Maske nur auf deren Fläche (Kupfer der Anlagen, Leib der Gegner)
  function lichthofZeichnen(lichthof, jetzt, abbildung) {
    const staerke = lichthof.staerke * weichesLeuchten(jetzt - lichthof.beginn, LICHTHOF_DAUER);
    if (staerke <= 0) return;
    const maske = lichthof.maske ? geladen.masken[lichthof.maske] : null;
    const ziel = maske ? hilfsFlaeche : flaeche;
    if (maske) leeren(hilfsFlaeche, hilfsLeinwand);
    aufBild(ziel, abbildung);
    const verlauf = ziel.createRadialGradient(lichthof.x, lichthof.y, 0, lichthof.x, lichthof.y, lichthof.radius);
    const [rot, gruen, blau] = FARBEN.lichthof;
    verlauf.addColorStop(0, `rgba(${rot}, ${gruen}, ${blau}, ${staerke})`);
    verlauf.addColorStop(1, `rgba(${rot}, ${gruen}, ${blau}, 0)`);
    ziel.globalCompositeOperation = maske ? "source-over" : "lighter";
    ziel.globalAlpha = 1;
    ziel.fillStyle = verlauf;
    ziel.fillRect(lichthof.x - lichthof.radius, lichthof.y - lichthof.radius, lichthof.radius * 2, lichthof.radius * 2);
    if (!maske) return;
    hilfsFlaeche.globalCompositeOperation = "destination-in";
    hilfsFlaeche.drawImage(maske.leinwand, 0, 0, geladen.breite, geladen.hoehe);
    flaeche.setTransform(1, 0, 0, 1, 0, 0);
    flaeche.globalCompositeOperation = "lighter";
    flaeche.globalAlpha = 1;
    flaeche.drawImage(hilfsLeinwand, 0, 0);
  }

  // Blitz in drei Lagen übereinander: breiter weicher Schein, mittlerer Strang, dünner weißer Kern
  function blitzZeichnen(blitz, jetzt, abbildung) {
    const helligkeit = blitzHelligkeit(jetzt - blitz.beginn) * blitz.staerke;
    if (helligkeit <= 0) return;
    aufBild(flaeche, abbildung);
    flaeche.globalCompositeOperation = "lighter";
    flaeche.globalAlpha = 1;
    flaeche.lineJoin = "round";
    flaeche.lineCap = "round";
    const lagen = [
      { farbe: FARBEN.blitzAussen, deckkraft: 0.28, breite: 16, schein: 28 },
      { farbe: FARBEN.blitzMitte, deckkraft: 0.6, breite: 5, schein: 10 },
      { farbe: FARBEN.blitzKern, deckkraft: 1, breite: 1.8, schein: 0 },
    ];
    for (const lage of lagen) {
      const [rot, gruen, blau] = lage.farbe;
      flaeche.shadowColor = `rgba(${rot}, ${gruen}, ${blau}, ${helligkeit})`;
      flaeche.shadowBlur = lage.schein * abbildung.massstab;
      for (const strang of blitz.straenge) {
        flaeche.strokeStyle = `rgba(${rot}, ${gruen}, ${blau}, ${lage.deckkraft * helligkeit * (0.5 + strang.staerke / 2)})`;
        flaeche.lineWidth = Math.max(0.8 / abbildung.massstab, lage.breite * strang.staerke);
        flaeche.beginPath();
        flaeche.moveTo(strang.punkte[0].x, strang.punkte[0].y);
        for (let i = 1; i < strang.punkte.length; i++) flaeche.lineTo(strang.punkte[i].x, strang.punkte[i].y);
        flaeche.stroke();
      }
    }
    flaeche.shadowBlur = 0;
  }

  // Feuerwerk: erst die aufleuchtende Kugel, dann die Funken als kurze Striche mit hellem Kopf entlang ihrer Bahn
  function funkenZeichnen(jetzt, abbildung) {
    aufBild(flaeche, abbildung);
    flaeche.globalCompositeOperation = "lighter";
    flaeche.globalAlpha = 1;
    flaeche.lineCap = "round";
    for (const feuerwerk of zustand.funken) {
      const alter = jetzt - feuerwerk.beginn;
      if (alter < 0) continue;
      const [rot, gruen, blau] = feuerwerk.farbe;
      if (alter < FEUERWERK.aufleuchten) {
        const staerke = alter / FEUERWERK.aufleuchten;
        lichtpunkt(feuerwerk.x, feuerwerk.y, 4 + 6 * staerke, staerke, feuerwerk.farbe);
        continue;
      }
      const flug = alter - FEUERWERK.aufleuchten;
      const staerke = Math.max(0, 1 - flug / feuerwerk.dauer);
      if (flug < 80) lichtpunkt(feuerwerk.x, feuerwerk.y, 14, 1 - flug / 80, feuerwerk.farbe);
      for (const funke of feuerwerk.funken) {
        const kopf = funkenBahn(feuerwerk, funke.winkel, funke.tempo, flug);
        const schweif = funkenBahn(feuerwerk, funke.winkel, funke.tempo, Math.max(0, flug - FEUERWERK.schweif));
        flaeche.strokeStyle = `rgba(${rot}, ${gruen}, ${blau}, ${staerke * 0.7})`;
        flaeche.lineWidth = funke.groesse;
        flaeche.beginPath();
        flaeche.moveTo(schweif.x, schweif.y);
        flaeche.lineTo(kopf.x, kopf.y);
        flaeche.stroke();
        // Funken flimmern zum Ende hin, wie beim Feuerwerk
        const flimmern = staerke < 0.4 && zufall() < 0.35 ? 0.3 : 1;
        lichtpunkt(kopf.x, kopf.y, funke.groesse * 1.8, staerke * flimmern, feuerwerk.farbe);
      }
    }
  }

  function lichtpunkt(x, y, radius, staerke, [rot, gruen, blau]) {
    const verlauf = flaeche.createRadialGradient(x, y, 0, x, y, radius);
    verlauf.addColorStop(0, `rgba(255, 255, 255, ${staerke})`);
    verlauf.addColorStop(0.35, `rgba(${rot}, ${gruen}, ${blau}, ${staerke * 0.8})`);
    verlauf.addColorStop(1, `rgba(${rot}, ${gruen}, ${blau}, 0)`);
    flaeche.fillStyle = verlauf;
    flaeche.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  return { einhaengen };
}

function neueLeinwand(breite, hoehe) {
  const leinwand = document.createElement("canvas");
  leinwand.width = breite;
  leinwand.height = hoehe;
  return leinwand;
}

function bildLaden(datei) {
  return new Promise((erfolg, misserfolg) => {
    const bild = new Image();
    bild.onload = () => erfolg(bild);
    bild.onerror = () => misserfolg(new Error(`Bild fehlt: ${datei}`));
    bild.src = datei;
  });
}

// Schwarzweiß-Maske als Alphamaske (weiß wird deckend), verkleinert auf MASKEN_AUFLOESUNG; die Deckung bleibt für
// die Kontur lesbar
function maskeAufbereiten(maskenBild) {
  const verkleinerung = Math.min(1, MASKEN_AUFLOESUNG / Math.max(maskenBild.naturalWidth, maskenBild.naturalHeight));
  const breite = Math.round(maskenBild.naturalWidth * verkleinerung);
  const hoehe = Math.round(maskenBild.naturalHeight * verkleinerung);
  const leinwand = neueLeinwand(breite, hoehe);
  const flaeche = leinwand.getContext("2d", { willReadFrequently: true });
  flaeche.drawImage(maskenBild, 0, 0, breite, hoehe);
  const bilddaten = flaeche.getImageData(0, 0, breite, hoehe);
  const pixel = bilddaten.data;
  const deckung = new Uint8Array(breite * hoehe);
  for (let i = 0; i < deckung.length; i++) {
    deckung[i] = pixel[i * 4];
    pixel[i * 4 + 3] = pixel[i * 4];
    pixel[i * 4] = pixel[i * 4 + 1] = pixel[i * 4 + 2] = 255;
  }
  flaeche.putImageData(bilddaten, 0, 0);
  return { leinwand, breite, hoehe, deckung };
}

// Aura aus einer Maske: weichgezeichnete Silhouette in der Farbe der Aura, innen größtenteils ausgespart, so dass sie
// als Saum um die Figur liegt
function auraAufbereiten(maske) {
  if (!maske) return null;
  const leinwand = neueLeinwand(maske.breite, maske.hoehe);
  const flaeche = leinwand.getContext("2d");
  flaeche.filter = `blur(${AURA.unschaerfe}px)`;
  flaeche.drawImage(maske.leinwand, 0, 0);
  flaeche.drawImage(maske.leinwand, 0, 0);
  flaeche.filter = "none";
  flaeche.globalCompositeOperation = "source-in";
  flaeche.fillStyle = FARBEN.aura;
  flaeche.fillRect(0, 0, maske.breite, maske.hoehe);
  flaeche.globalCompositeOperation = "destination-out";
  flaeche.globalAlpha = 1 - AURA.innen;
  flaeche.drawImage(maske.leinwand, 0, 0);
  return leinwand;
}

// Randpunkte einer Maske in Bildpixeln: gedeckt, aber mit ungedecktem Nachbarn
function konturPunkte(maske, bildBreite, bildHoehe) {
  if (!maske) return [];
  const { breite, hoehe, deckung } = maske;
  const gedeckt = (x, y) => x >= 0 && y >= 0 && x < breite && y < hoehe && deckung[y * breite + x] > 127;
  const punkte = [];
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      if (gedeckt(x, y) && (!gedeckt(x - 1, y) || !gedeckt(x + 1, y) || !gedeckt(x, y - 1) || !gedeckt(x, y + 1))) {
        punkte.push({ x: ((x + 0.5) * bildBreite) / breite, y: ((y + 0.5) * bildHoehe) / hoehe });
      }
    }
  }
  return punkte;
}

// Sprites des Dampfs: { schwaden, stoesse, nebel } als Listen von Dateien; jedes wird in der Farbe des Dampfs
// eingefärbt, seine Helligkeit wird zur Deckkraft
async function spritesLaden(listen) {
  const laden = (dateien = []) => Promise.all(dateien.map(async (datei) => spriteAufbereiten(await bildLaden(datei))));
  const [schwaden, stoesse, nebel] = await Promise.all([laden(listen.schwaden), laden(listen.stoesse), laden(listen.nebel)]);
  return { schwaden, stoesse, nebel };
}

function spriteAufbereiten(spriteBild) {
  const leinwand = neueLeinwand(spriteBild.naturalWidth, spriteBild.naturalHeight);
  const flaeche = leinwand.getContext("2d", { willReadFrequently: true });
  flaeche.drawImage(spriteBild, 0, 0);
  const bilddaten = flaeche.getImageData(0, 0, leinwand.width, leinwand.height);
  const pixel = bilddaten.data;
  const [rot, gruen, blau] = FARBEN.dampf;
  for (let i = 0; i < pixel.length; i += 4) {
    pixel[i + 3] = pixel[i];
    pixel[i] = rot;
    pixel[i + 1] = gruen;
    pixel[i + 2] = blau;
  }
  flaeche.putImageData(bilddaten, 0, 0);
  return leinwand;
}
