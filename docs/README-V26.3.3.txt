V26.3.3 - DATI SERI TEST/UFFICIALE
Sostituire index.html, manifest.json, service-worker.js.
Aggiungere v2633-storage-bootstrap.js, v2633-data-manager.js, v2633-data.css.
Il bootstrap è caricato prima di app.js e instrada trasparentemente la vecchia chiave rugby-fir-v26:
- /rugby-manager-v26-test/ -> rugby-manager-test-data
- /rugby-manager/ -> rugby-manager-official-data
Alla prima apertura copia i dati storici nel canale corrente senza cancellarli.
Menu Backup: esportazione JSON completa e importazione con backup di sicurezza preventivo.
Schema dati iniziale: 1. Le versioni future potranno migrare automaticamente lo schema.
