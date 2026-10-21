RUGBY MATCH MANAGER FIR V26.1 - AGGIORNAMENTO

Contenuto del pacchetto:
- index.html (sostituisce quello v26)
- manifest.json (sostituisce quello v26)
- service-worker.js (sostituisce quello v26)
- v261-ui.js (nuovo)
- v261.css (nuovo)

NON eliminare i file esistenti app.js, style.css, librerie, icone e firma.
Caricare i 5 file del pacchetto nella radice del repository e fare commit.

Novita principali:
- UI preparazione partita rigenerata
- import unificato PDF/immagine avversari
- fallback OCR per PDF scannerizzati
- editor stile Modello B: ruolo, numero, nome e cognome
- pulsante Inserisci e tasto Invio
- revisione e cancellazione righe
- cache PWA v26.1 separata

Nota OCR: tesseract.min.js puo richiedere connessione per worker/core/modello lingua se tali risorse non sono nel repository.
