'use strict';
/* v26.3.2 - live compatta, temporanee per entrambe le squadre, meta tecnica. */
function v2632TechnicalTry(){
 const d=S.draft;if(!d)return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="technicalTryModal"><div class="modalbox technical-try-box"><h2>Meta tecnica</h2><p>Assegna 7 punti e una meta alla squadra scelta.</p><button class="btn full" data-tech-side="home">+7 ${esc(d.setup.home)}</button><button class="tech-away full" data-tech-side="away">+7 ${esc(d.setup.away)}</button><button id="technicalCancel" class="outline full">Annulla</button></div></div>`);
 const m=document.querySelector('#technicalTryModal');m.querySelectorAll('[data-tech-side]').forEach(b=>b.onclick=()=>{const side=b.dataset.techSide,time=stamp();d.score[side]+=7;d.events.unshift({id:uid(),side,team:side==='home'?d.setup.home:d.setup.away,type:'Meta tecnica',player:'',playerId:null,detail:'Meta tecnica',time,points:7,outcome:'RIUSCITO'});save();m.remove();match()});m.querySelector('#technicalCancel').onclick=()=>m.remove()
}
function v2632TemporaryMenu(){
 const d=S.draft,open=d.temporary.filter(x=>!x.end);
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="temporaryBothModal"><div class="modalbox"><h2>Sostituzione temporanea</h2>${open.length?`<h3>Temporanee aperte</h3>${open.map(x=>`<button class="outline full" data-v2632-close="${x.id}">${esc(x.team||'')} · ${esc(x.outName)} → ${esc(x.inName)}<small>dal ${x.start.label}</small></button>`).join('')}`:''}<h3>Nuova temporanea</h3><button class="btn full" data-v2632-new="home">${esc(d.setup.home)}</button><button class="tech-away full" data-v2632-new="away">${esc(d.setup.away)}</button><button id="v2632TempCancel" class="outline full">Annulla</button></div></div>`);
 const m=document.querySelector('#temporaryBothModal');m.querySelectorAll('[data-v2632-new]').forEach(b=>b.onclick=()=>{m.remove();changeFlow(b.dataset.v2632New,true)});
 m.querySelectorAll('[data-v2632-close]').forEach(b=>b.onclick=()=>{const x=open.find(y=>y.id===b.dataset.v2632Close),r=rosterSide(x.side),out=r.find(p=>p.id===x.outId),inp=r.find(p=>p.id===x.inId),time=stamp();if(inp?.intervals?.at(-1))inp.intervals.at(-1).out=time.second;if(out){out.intervals.push({in:time.second,out:null});out.status='FIELD'}if(inp)inp.status='BENCH';x.end=time;d.events.unshift({id:uid(),side:x.side,team:x.side==='home'?d.setup.home:d.setup.away,type:'Fine temporanea',detail:`${x.outName} rientra · ${x.inName} esce`,time,points:0});save();m.remove();match()});m.querySelector('#v2632TempCancel').onclick=()=>m.remove()
}
function v2632DecorateLive(){
 const tools=document.querySelector('.match-tools');if(!tools||tools.dataset.v2632)return;tools.dataset.v2632='1';
 const changes=[...tools.querySelectorAll('[data-change]')];changes.forEach(b=>{b.innerHTML='CAMBIO';b.classList.add('compact-tool')});
 const temp=document.querySelector('#temporary'),nc=document.querySelector('#noContest');if(temp){temp.textContent='TEMPORANEA';temp.onclick=v2632TemporaryMenu;temp.classList.add('compact-tool')}if(nc){nc.textContent='NO CONTEST';nc.classList.add('compact-tool')}
 const tech=document.createElement('button');tech.id='technicalTry';tech.className='compact-tool technical-tool';tech.textContent='META TECNICA';tech.onclick=v2632TechnicalTry;tools.appendChild(tech)
}
const V2632_MATCH_BASE=match;match=function(){V2632_MATCH_BASE();v2632DecorateLive()};
// Conteggio mete e marcatori: la meta tecnica vale una meta e 7 punti, senza trasformazione separata.
const V2632_TRY_COUNT_BASE=v2631TryCount;v2631TryCount=function(m,displaySide){const side=v2631OfficialSide(m,displaySide);return m.events.filter(e=>(e.type==='Meta'||e.type==='Meta tecnica')&&e.side===side).length};
const V2632_SCORERS_BASE=v2631Scorers;v2631Scorers=function(m){const ev=m.events.slice().reverse().filter(e=>['Meta','Meta tecnica','Trasformazione','Punizione','Drop'].includes(e.type)&&e.outcome!=='SBAGLIATO'),code={Meta:'m.','Meta tecnica':'m. tecnica',Trasformazione:'tr.',Punizione:'cp',Drop:'drop'},pt=[],st=[];for(const e of ev)(e.time.period===2?st:pt).push(`${e.time.minute}’ ${code[e.type]} ${e.player||e.team}`);return[pt.join(', '),st.length?'st: '+st.join(', '):''].filter(Boolean).join('; ')};
const V2632_AUDIT_BASE=v2631Audit;v2631Audit=function(m){const calc={home:0,away:0};for(const e of m.events){if(['Meta','Meta tecnica','Trasformazione','Punizione','Drop'].includes(e.type)&&e.outcome!=='SBAGLIATO')calc[e.side]+=e.points||0}return calc.home===m.score.home&&calc.away===m.score.away?'':`ATTENZIONE: somma marcatori ${calc.home}-${calc.away}, risultato salvato ${m.score.home}-${m.score.away}.`};
match();
