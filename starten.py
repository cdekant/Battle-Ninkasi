#!/usr/bin/env python3
"""Startet Battle Ninkasi zum Entwickeln.

Startet einen lokalen Webserver für das Stammverzeichnis und öffnet das Spiel in
einer eigenen Firefox-Instanz mit eigenem Profil (.firefox-profil/, nicht im Repo).
Wird dieses Firefox-Fenster geschlossen, endet auch der Server. Strg+C im Terminal
beendet den Server sofort.

Das Fenster zeigt nur die Seite, ohne Tabs, Adressleiste und Titelleiste (über
userChrome.css im Profil). F5 lädt neu, F12 öffnet die Entwicklerwerkzeuge, Alt+F4
schließt. Mit --mit-leisten erscheint die gewohnte Firefox-Oberfläche.

Aufruf: python starten.py [--mit-leisten] (Windows, auch per Doppelklick auf starten.bat)
        python3 starten.py oder ./starten.py [--mit-leisten] (Debian)
Firefox an anderem Ort: Umgebungsvariable FIREFOX auf den Programmpfad setzen.
"""

import functools
import http.server
import os
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

stammverzeichnis = Path(__file__).resolve().parent
profilverzeichnis = stammverzeichnis / ".firefox-profil"
wunschPort = 8000
# Endet Firefox schneller, gilt der Browser als an einen fremden Prozess übergeben.
sekundenBisUebergabeVermutet = 5

# Einstellungen für das Entwicklungsprofil: keine Begrüßungsseiten, keine Nachfragen.
# Firefox liest user.js bei jedem Start, sie wird daher jedes Mal neu geschrieben.
firefoxEinstellungen = {
    "browser.shell.checkDefaultBrowser": False,
    "browser.aboutwelcome.enabled": False,
    "browser.startup.homepage_override.mstone": "ignore",
    "startup.homepage_welcome_url": "",
    "datareporting.policy.dataSubmissionEnabled": False,
    "toolkit.telemetry.reportingpolicy.firstRun": False,
    "browser.sessionstore.resume_from_crash": False,
    "browser.tabs.warnOnClose": False,
    # Lässt Firefox userChrome.css aus dem Profil lesen (Fenster ohne Leisten).
    "toolkit.legacyUserProfileCustomizations.stylesheets": True,
    # Firefox zeichnet die Titelleiste selbst, sie verschwindet daher mit den Leisten.
    "browser.tabs.inTitlebar": 1,
    # "Beenden" im Spielmenü schließt das Fenster per window.close() und beendet so auch den Server.
    "dom.allow_scripts_to_close_windows": True,
}

# Blendet Tabs, Adressleiste, Lesezeichen und Titelleiste aus, übrig bleibt die Seite.
fensterOhneLeisten = """\
/* Geschrieben von starten.py, Änderungen gehen beim nächsten Start verloren. */
#navigator-toolbox { visibility: collapse !important; }
"""


class EntwicklungsAnfragen(http.server.SimpleHTTPRequestHandler):
    """Liefert Dateien ohne Zwischenspeicher aus, damit Änderungen sofort ankommen."""

    # Die Windows-Registry kann .js falsch zuordnen; ES-Module brauchen den richtigen Typ.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".html": "text/html",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_request(self, code="-", size="-"):
        # Erfolgreiche Anfragen nicht protokollieren, Fehler meldet log_error weiter.
        pass


class EntwicklungsServer(http.server.ThreadingHTTPServer):
    # Unter Windows erlaubt SO_REUSEADDR, einen belegten Port doppelt zu belegen.
    allow_reuse_address = os.name != "nt"
    daemon_threads = True


def serverStarten():
    anfragenBearbeiter = functools.partial(EntwicklungsAnfragen, directory=str(stammverzeichnis))
    try:
        server = EntwicklungsServer(("127.0.0.1", wunschPort), anfragenBearbeiter)
    except OSError:
        server = EntwicklungsServer(("127.0.0.1", 0), anfragenBearbeiter)
        print(f"Port {wunschPort} ist belegt, weiche auf Port {server.server_address[1]} aus.")
        print("Hinweis: Gespeicherte Einstellungen (Tastenbelegung, Zoom) gelten je Port.")
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


def firefoxFinden():
    vorgabe = os.environ.get("FIREFOX")
    if vorgabe:
        return vorgabe
    for programmname in ("firefox", "firefox-esr"):
        gefunden = shutil.which(programmname)
        if gefunden:
            return gefunden
    moeglicheOrte = [
        Path(os.environ.get(variable, "")) / "Mozilla Firefox" / "firefox.exe"
        for variable in ("ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA")
        if os.environ.get(variable)
    ]
    moeglicheOrte.append(Path("/Applications/Firefox.app/Contents/MacOS/firefox"))
    for ort in moeglicheOrte:
        if ort.is_file():
            return str(ort)
    return None


def profilVorbereiten(mitLeisten):
    profilverzeichnis.mkdir(exist_ok=True)
    # Mit Leisten bleibt die Datei leer, damit ein früherer Lauf ohne Leisten nicht nachwirkt.
    chromeVerzeichnis = profilverzeichnis / "chrome"
    chromeVerzeichnis.mkdir(exist_ok=True)
    stylesheet = "" if mitLeisten else fensterOhneLeisten
    (chromeVerzeichnis / "userChrome.css").write_text(stylesheet, encoding="utf-8")
    zeilen = [f'user_pref("{name}", {wertAlsJs(wert)});' for name, wert in firefoxEinstellungen.items()]
    (profilverzeichnis / "user.js").write_text("\n".join(zeilen) + "\n", encoding="utf-8")


def wertAlsJs(wert):
    if isinstance(wert, bool):
        return "true" if wert else "false"
    if isinstance(wert, str):
        return '"' + wert.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return str(wert)


def main():
    mitLeisten = "--mit-leisten" in sys.argv[1:]
    server = serverStarten()
    adresse = f"http://127.0.0.1:{server.server_address[1]}/"
    print(f"Battle Ninkasi läuft unter {adresse}")

    firefoxPfad = firefoxFinden()
    try:
        if firefoxPfad is None:
            print("Firefox nicht gefunden (Pfad notfalls über FIREFOX setzen).")
            print("Adresse im Browser öffnen, Strg+C beendet den Server.")
            while True:
                time.sleep(1)
        profilVorbereiten(mitLeisten)
        firefoxAufruf = [firefoxPfad, "-no-remote", "-profile", str(profilverzeichnis)]
        if os.name == "nt":
            # Unter Windows startet firefox.exe nur einen Startprozess, der den Browser
            # übergibt und sofort endet; mit diesem Schalter wartet er auf den Browser.
            firefoxAufruf.append("-wait-for-browser")
        firefoxAufruf.append(adresse)
        startzeit = time.monotonic()
        firefox = subprocess.Popen(firefoxAufruf)
        print("Fenster schließen oder Strg+C beendet den Server.")
        # Abfragen statt wait(), damit Strg+C auch unter Windows sofort greift.
        while firefox.poll() is None:
            time.sleep(0.5)
        if firefox.returncode != 0:
            print(f"Firefox endete mit Code {firefox.returncode} "
                  "(läuft das Entwicklungsprofil schon in einem anderen Fenster?).")
        elif time.monotonic() - startzeit < sekundenBisUebergabeVermutet:
            # So schnell schließt niemand das Fenster: Firefox hat den Browser vermutlich
            # an einen eigenen Prozess übergeben, auf den das Skript nicht warten kann.
            print("Firefox läuft unabhängig vom Skript weiter, Strg+C beendet den Server.")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
        server.server_close()
        print("Server beendet.")


if __name__ == "__main__":
    sys.exit(main())
