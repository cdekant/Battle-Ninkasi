@echo off
rem Startet Battle Ninkasi per Doppelklick, Einzelheiten in starten.py
rem Eigenes Fenster per start: Die Batch-Datei endet sofort, Strg+C trifft dann
rem keinen laufenden Batch-Vorgang mehr und cmd fragt nicht nach dem Abbrechen.
rem Bei einem Fehler bleibt das Fenster mit pause offen.
cd /d "%~dp0"
start "Battle Ninkasi" cmd /c "python starten.py || pause"
