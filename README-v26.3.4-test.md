# Rugby Match Manager FIR v26.3.4-test

Pacchetto overlay da applicare ESCLUSIVAMENTE al repository `rugby-manager-v26-test`.

## Procedura semplice
1. Caricare nella radice del repository test tutti i file presenti nello ZIP.
2. Sovrascrivere `index.html`, `manifest.json` e `service-worker.js`.
3. Aggiungere `v2634-camera.js` e `v2634-camera.css`.
4. Fare commit e attendere GitHub Pages.
5. Sul telefono chiudere e riaprire la PWA; se necessario ricaricare due volte.

Non è obbligatorio eseguire lo script Python: il modulo v2634 rimuove la dicitura dal report anche a runtime. Lo script è incluso solo per pulire definitivamente la dicitura anche nei due sorgenti storici e aggiornare la versione scritta nei backup.

## Funzioni
- fotocamera posteriore con cornice guida
- scelta di una foto già salvata
- ripetizione scatto
- regolazione manuale dei quattro angoli
- zoom 100-400% e pan
- rettifica prospettica mediante omografia
- passaggio alla griglia OCR esistente
- rimozione di FAC SIMILE dal report visualizzato, editor, stampa e PDF che usano `generateReport()`
- nuova cache PWA v26.3.4-test

Le immagini FIR restano in memoria e non vengono salvate nel localStorage o nei backup.
