'use strict';
/* v26.3.9-test r5: guida contestuale, nomi tabellino ed elenco Formazioni con ruolo abbreviato. */
(function(){
 const ROLE_MAP={
  'PILONE SINISTRO':'PS','PILONE DESTRO':'PD','PILONE':'P','TALLONATORE':'T',
  'SECONDA LINEA':'2L','FLANKER':'FL','NUMERO 8':'N8','MEDIANO DI MISCHIA':'MM',
  'MEDIANO DI APERTURA':'MA','CENTRO':'C','ALA':'A','ESTREMO':'E','NON SPECIFICATO':''
 };
 const roleRaw=p=>String(p?.currentRole||p?.initialRole||p?.role||'').trim();
 function shortRole(p){const raw=roleRaw(p);if(!raw)return'';return ROLE_MAP[raw.toUpperCase()]||raw.toUpperCase()}
 function uniqueSurnameName(p,r){
  if(!p)return'NN';
  const same=(r||[]).filter(x=>norm(x.surname)===norm(p.surname));
  if(same.length>1)return [p.name,p.surname].filter(Boolean).join(' ');
  const initial=String(p.name||'').trim().charAt(0);
  return `${initial?initial+'. ':''}${p.surname||''}`.trim();
 }
 displayName=uniqueSurnameName;
 reportName=uniqueSurnameName;
 if(typeof v2631PlayerName==='function')v2631PlayerName=uniqueSurnameName;

 formationText=function(m,side){
  const r=side==='home'?m.homePlayers:m.awayPlayers;
  const initial=r.filter(p=>p.intervals?.some(i=>i.in===0)).sort((a,b)=>(a.firOrder??999)-(b.firOrder??999));
  const used=new Set(initial.map(p=>p.id)),parts=[];
  for(const p of initial){
   const changes=m.events.filter(x=>['Cambio','Cambio temporaneo'].includes(x.type)&&x.side===side&&x.outId===p.id).slice().reverse();
   changes.forEach(x=>used.add(x.inId));
   parts.push(uniqueSurnameName(p,r)+(changes.length?' ('+changes.map(x=>{const q=r.find(y=>y.id===x.inId);return `${x.time.label} ${uniqueSurnameName(q,r)}`}).join(', ')+')':''));
  }
  const rest=r.filter(p=>!used.has(p.id)).sort((a,b)=>(a.firOrder??999)-(b.firOrder??999));
  if(rest.length)parts.push('Panchina: '+rest.map(p=>`${uniqueSurnameName(p,r)}${p.flags?.includes('1L')?' (1L)':''}`).join(', '));
  return parts.join('; ');
 };
 if(typeof v2631Roster==='function')v2631Roster=formationText;

 lineupHtml=function(m){
  const part=(title,r)=>`<h3>${esc(title)}</h3>${r.map(p=>{const role=shortRole(p),flags=(p.flags||[]).filter(x=>x!=='C'&&x!=='V');const detail=[role,...flags].filter(Boolean).join(' · ')||'Ruolo non indicato';return `<div class="roster-row"><b>#${esc(p.number??'-')} ${esc(uniqueSurnameName(p,r))}</b><small>${esc(detail)}</small></div>`}).join('')}`;
  return part(m.setup.home,m.homePlayers)+part(m.setup.away,m.awayPlayers);
 };

 const HELP={
  setup:{title:'Manuale - Preparazione partita',html:`
   <h3>Inizio rapido</h3><ol><li>Completa i dati della gara.</li><li>Importa e controlla la lista FIR della tua squadra.</li><li>Importa la lista avversaria oppure inseriscila manualmente.</li><li>Premi <b>Apri tabellone</b>.</li></ol>
   <h3>1. Dati della partita</h3><p>Controlla data, categoria, squadra, sede, avversaria, minuti per tempo e arbitro. Esempio: <b>Rugby Leoni Brescia</b> contro <b>Rugby Valle Oglio</b>, arbitro <b>Roberto Ferrante</b>.</p>
   <h3>2. Lista della mia squadra</h3><p>Usa <b>Importa PDF FIR</b>. Attendi l'elaborazione e controlla la rosa prima di confermare.</p>
   <h3>Revisione della rosa</h3><p>Ogni riga contiene numero, ruolo, cognome, nome, nascita, tessera FIR e stato Titolare/Panchina.</p><ul><li>Correggi direttamente i campi errati.</li><li>Usa la X rossa per eliminare un convocato.</li><li>Usa <b>Aggiungi convocato</b> per il 24° o 25° giocatore.</li><li>Controlla con attenzione la tessera FIR.</li></ul>
   <h3>Numeri di maglia</h3><p>Il numero di maglia può contenere numeri, lettere o sigle. Deve essere univoco nella squadra, perché nel Live è il riferimento più rapido per identificare il giocatore. In presenza di duplicati la conferma e l'apertura del tabellone restano bloccate fino alla correzione.</p>
   <h3>Cognomi uguali</h3><p>Con cognomi uguali l'app mostra il nome completo, ad esempio <b>Marco Cogoli</b> e <b>Mario Cogoli</b>.</p>
   <h3>3. Lista avversaria</h3><p>Scegli PDF FIR originale, fotocamera, immagine oppure inserimento manuale. Se la lista non viene riconosciuta, usa il percorso corrispondente al documento disponibile: PDF originale, scansione, foto o inserimento manuale.</p>
   <h3>Apertura del tabellone</h3><p>Prima di proseguire controlla squadra, avversaria, rosa, ruoli, prime linee e maglie. Premi una sola volta <b>Apri tabellone</b> e attendi il completamento.</p>
   <h3>Problemi frequenti</h3><p><b>Il pulsante sembra inattivo:</b> attendi l'indicatore di elaborazione e non toccare ripetutamente.</p><p><b>Compare una versione precedente:</b> chiudi completamente la PWA, apri il sito dal browser, aggiorna e riapri.</p>`},
  match:{title:'Manuale - Live',html:`
   <h3>Tabellone Live</h3><p>Il Live contiene cronometro, punteggi, eventi delle due squadre, cambi, temporanee, no contest e meta tecnica.</p><ul><li><b>T1/T2</b>: periodo di gioco.</li><li><b>▶/pausa</b>: avvio e arresto del cronometro.</li><li><b>Meta +5</b>, <b>Trasformazione +2</b>, <b>Punizione +3</b>, <b>Drop +3</b>.</li><li><b>Giallo/Rosso</b>: provvedimenti disciplinari.</li><li><b>Annulla ultimo</b>: corregge l'ultimo evento registrato.</li></ul>
   <h3>Scelta del giocatore</h3><p>Durante la gara usa soprattutto il numero di maglia per individuare rapidamente il giocatore. Con cognomi uguali viene mostrato il nome completo.</p>
   <h3>Meta</h3><p>Premi Meta e seleziona il marcatore. Se non è identificabile usa <b>NN - Giocatore non definito</b>.</p>
   <h3>Trasformazione, punizione e drop</h3><p>Seleziona il calciatore e indica <b>Riuscito</b> oppure <b>Sbagliato</b>. Il tentativo viene registrato in entrambi i casi e alimenta tentativi, riusciti e percentuali.</p>
   <h3>Avviso trasformazione</h3><p>Se registri una trasformazione senza una meta precedente, verifica che l'evento sia corretto prima di confermare.</p>
   <h3>Cambio</h3><ol><li>Premi Cambio della squadra corretta.</li><li>Seleziona chi esce.</li><li>Seleziona chi entra.</li><li>Conferma il ruolo assunto in campo dal giocatore entrato.</li></ol><p>Il minuto e i giocatori vengono registrati automaticamente. Il ruolo resta negli Eventi e nella scheda Formazioni, ma non viene riportato nel testo del Tabellino e non genera statistiche societarie.</p>
   <h3>Sostituzione temporanea</h3><p>Registra uscita e ingresso. Alla conclusione seleziona la temporanea aperta per registrare il rientro.</p>
   <h3>No contest</h3><p>Premi <b>No contest</b> per registrare l'inizio delle mischie no contest; premi nuovamente per registrarne la fine.</p>
   <h3>Cartellini</h3><p>Per Giallo o Rosso seleziona il giocatore interessato. Controlla temporanee, cartellini e no contest prima della chiusura.</p>
   <h3>Conclusione gara</h3><p>Premi <b>Salva partita</b> e scegli lo stato corretto:</p><ul><li><b>Terminata regolarmente</b></li><li><b>Terminata prima del tempo</b></li><li><b>Sospesa, da riprendere</b></li><li><b>Interrotta/abbandonata</b></li></ul><p>Attendi il completamento senza premere nuovamente. Questa parte del manuale potrà essere perfezionata dopo ulteriori verifiche sul campo.</p>`},
  rosters:{title:'Manuale - Rose e formazioni',html:`
   <h3>Consultazione della rosa</h3><p>La rosa permette di controllare numero di maglia, nominativo, ruolo e qualifiche FIR.</p>
   <h3>Nomi visualizzati</h3><p>Se il cognome è unico viene mostrata l'iniziale puntata seguita dal cognome. Se due giocatori hanno lo stesso cognome viene mostrato il nome completo per evitare ambiguità.</p>
   <h3>Ruoli</h3><p>Il ruolo è indipendente dal numero di maglia. Nella scheda Formazioni viene mostrato in forma abbreviata, ad esempio <b>E</b>, <b>AD</b>, <b>CS</b>, <b>MM</b>, <b>PS</b>, <b>T</b> o <b>PD</b>.</p>
   <h3>Qualifica 1L</h3><p>La sigla <b>1L</b> indica l'idoneità alla prima linea. Può comparire accanto al ruolo del giocatore.</p>
   <h3>Stato del giocatore</h3><p>Gli stati tecnici FIELD, OUT, BENCH, TEMP_IN e TEMP_OUT restano utilizzati internamente per Live, cambi e minutaggi, ma nella scheda Formazioni viene mostrato il ruolo abbreviato al loro posto.</p>
   <h3>Ruolo assunto durante un cambio</h3><p>Quando una riserva entra, il ruolo scelto viene conservato negli Eventi e visualizzato nella Formazione. Il dato non entra nelle statistiche societarie.</p>`},
  history:{title:'Manuale - Storico',html:`
   <h3>Partite salvate</h3><p>In Storico apri una partita per consultare <b>Eventi</b>, <b>Formazioni</b> e <b>Tabellino</b>.</p>
   <h3>Controlli prima della distribuzione</h3><p>Controlla risultato, ordine degli eventi, marcatori, cambi, cartellini e note prima di distribuire il tabellino.</p>
   <h3>Esportazioni</h3><p>Sono disponibili esportazioni TXT ed Excel e statistiche aggregate. Il file Excel della partita contiene i dati utili alla verifica e all'archiviazione.</p>
   <h3>Backup e ripristino</h3><p>Esegui un backup prima degli aggiornamenti importanti e periodicamente durante la stagione. Conserva il file in un luogo protetto.</p><p>Prima di un ripristino crea sempre un backup di sicurezza. Non pubblicare backup con dati anagrafici nel repository pubblico.</p>
   <h3>Versione non aggiornata</h3><p>Se compare una versione precedente, chiudi completamente la PWA, apri il sito dal browser, aggiorna e riapri.</p>`},
  report:{title:'Manuale - Tabellino',html:`
   <h3>Contenuto</h3><p>Il Tabellino riporta risultato, parziale, titolari, cambi, panchina, arbitro, marcatori, temporanee, cartellini e no contest.</p>
   <h3>Nomi dei giocatori</h3><p>Se il cognome è unico viene mostrata l'iniziale puntata seguita dal cognome, per esempio <b>P. Baiguera</b>. Se il cognome compare più volte nella stessa rosa viene mostrato il nome completo, per esempio <b>Pedro Alejandro Costantino</b> e <b>Tomas Antonio Costantino</b>.</p>
   <h3>Formazione e cambi</h3><p>Nel testo del Tabellino i ruoli non vengono mostrati. Per un cambio vengono indicati il giocatore iniziale, il minuto e il giocatore entrato, per esempio <b>V. Mavilla (1’ st D. Pitossi)</b>. Il ruolo assunto resta consultabile negli Eventi e nella scheda Formazioni.</p>
   <h3>Panchina</h3><p>Le riserve non utilizzate sono elencate dopo la formazione. La qualifica <b>1L</b> resta visibile quando presente.</p>
   <h3>Marcatori</h3><p>Le abbreviazioni principali sono: <b>m.</b> meta, <b>tr.</b> trasformazione, <b>cp</b> calcio di punizione e <b>drop</b> drop. Se il marcatore non è identificato viene registrato come giocatore non definito.</p>
   <h3>Temporanee, cartellini e no contest</h3><p>Le sostituzioni temporanee, i cartellini gialli e rossi e gli intervalli di no contest vengono riepilogati nelle note finali.</p>
   <h3>Esportazione</h3><p>Usa <b>Esporta TXT</b> per il testo del Tabellino oppure <b>Excel partita</b> per i dati dettagliati della gara.</p>
   <p class="v2639-manual-note">Gli esempi e i nomi presenti nel manuale sono fittizi.</p>`}
 };
 function closeGuide(){document.querySelector('#v2639Guide')?.remove()}
 function openGuide(kind){const h=HELP[kind]||HELP.setup;closeGuide();document.body.insertAdjacentHTML('beforeend',`<div class="modal v2639-guide" id="v2639Guide"><div class="modalbox"><button class="close" data-guide-close>X</button><h2>${esc(h.title)}</h2>${h.html}<button class="btn full" data-guide-close>CHIUDI</button></div></div>`);document.querySelectorAll('[data-guide-close]').forEach(b=>b.onclick=closeGuide)}
 function addGuide(root=app,kind=page){if(!root||root.querySelector('.v2639-guide-button'))return;const h=root.querySelector('h1,h2');if(!h)return;const wrap=document.createElement('div');wrap.className='v2639-page-head';h.parentNode.insertBefore(wrap,h);wrap.appendChild(h);const b=document.createElement('button');b.className='v2639-guide-button';b.textContent='? Guida';b.onclick=()=>openGuide(kind);wrap.appendChild(b)}
 new MutationObserver(()=>addGuide()).observe(app,{childList:true});addGuide();
 const oldDetail=matchDetail;
 matchDetail=function(id){oldDetail(id);const modal=[...document.querySelectorAll('.modal')].at(-1);if(modal)addGuide(modal.querySelector('.modalbox'),'report')};

 function startDuplicates(){const checks=[[S.setup.home,S.homeRoster],[S.setup.away,S.awayRoster]].map(([label,r])=>[label,window.RUGBY_JERSEY?.duplicates(r||[])||[]]).filter(x=>x[1].length);return checks}
 document.addEventListener('click',e=>{if(!e.target.closest?.('#start'))return;const bad=startDuplicates();if(!bad.length)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();document.querySelector('#v2639StartBlock')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="v2639StartBlock"><div class="modalbox"><h2>Maglie duplicate</h2><p>Correggi i duplicati prima di aprire il tabellone.</p>${bad.map(([team,groups])=>`<h3>${esc(team)}</h3>${groups.map(([n,players])=>`<div class="v2639-error"><b>Maglia #${esc(n)}</b>${players.map(p=>`<small>${esc(shortRole(p)||'Ruolo non indicato')} - ${esc([p.name,p.surname].filter(Boolean).join(' '))}</small>`).join('')}</div>`).join('')}`).join('')}<button class="btn full" id="v2639StartClose">TORNA ALLA ROSA</button></div></div>`);document.querySelector('#v2639StartClose').onclick=()=>document.querySelector('#v2639StartBlock').remove()},true);
 window.V2639_FORMAT={name:uniqueSurnameName,role:shortRole};
})();
