'use strict';
/* v26.3.9-test r4: guida contestuale, nomi tabellino ed elenco Formazioni con ruolo abbreviato. */
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
  setup:{title:'Guida - Preparazione partita',html:'<h3>Dati gara</h3><p>Controlla data, categoria, squadre, sede, durata e arbitro.</p><h3>Liste</h3><p>Importa e revisiona le liste FIR. Verifica nominativi, ruoli, qualifiche 1L e maglie.</p><h3>Maglie</h3><p>Il valore e libero, ma deve essere univoco nella squadra per identificare gli eventi Live.</p>'},
  match:{title:'Guida - Live',html:'<h3>Eventi</h3><p>Usa soprattutto la maglia per scegliere il giocatore. Registra punti, cartellini, cambi e temporanee.</p><h3>Cambi</h3><p>Assegna il ruolo assunto dal giocatore entrato. Il ruolo resta negli Eventi e nella formazione, ma non alimenta le statistiche societarie.</p>'},
  rosters:{title:'Guida - Rose',html:'<h3>Rose</h3><p>Controlla maglia, nominativo, ruolo abbreviato e qualifica 1L.</p>'},
  history:{title:'Guida - Storico',html:'<h3>Storico</h3><p>Apri una gara per Eventi, Formazioni e Tabellino. Le Formazioni mostrano il ruolo abbreviato, non FIELD, OUT o BENCH.</p><h3>Esportazioni</h3><p>Puoi esportare TXT, Excel partita e statistiche.</p>'},
  report:{title:'Guida - Tabellino',html:'<h3>Tabellino</h3><p>Il nome e mostrato come iniziale puntata e cognome. Se il cognome e ripetuto nella rosa, viene mostrato il nome completo. Il ruolo abbreviato resta tra parentesi quadre.</p>'}
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
