V26.2.7 - MIGLIORAMENTO AUTOMATICO OCR
Sostituire index.html, manifest.json, service-worker.js. Aggiungere v2627-enhance.js.
Mantenere v2626-grid.js e v2626-grid.css e tutti gli altri file.
Dopo la griglia e l'anteprima, ogni ritaglio viene letto in 4 varianti: originale, contrasto, bianco/nero, nitidezza. Viene scelto il risultato migliore.
Normalizzazioni prudenti: IL/I L/1I/LL -> 1L; C e V isolati; O finale dopo nominativo con virgola -> C.
Il processo e piu lento: fino a 184 OCR (23 righe x 2 campi x 4 varianti).
