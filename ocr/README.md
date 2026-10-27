# ocr/ – Texterkennung lokal hosten (optional)

Kairos liest Dokumente mit Tesseract (deutsch) und pdf.js. Standardmäßig werden die Dateien beim ersten Mal von einem CDN geladen und danach im Gerät zwischengespeichert.

**Besser: aus dem eigenen Repo.** Dann geht es schneller, funktioniert auch hinter Inhaltsblockern und komplett offline.

1. Auf GitHub: **Actions → „OCR-Dateien ins Repo laden (einmalig)“ → Run workflow**.
2. Nach ca. einer Minute liegen hier die Ordner `core/`, `lang/` und `pdf/` plus `tesseract.min.js` und `worker.min.js`.
3. Fertig – Kairos nimmt automatisch diese lokalen Dateien. Fehlen sie, nimmt es das CDN.

Größe: ca. 25–30 MB. Beim ersten Einlesen auf dem iPhone werden sie einmal geladen und dann offline gecacht.
