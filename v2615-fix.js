'use strict';
// v26.1.5: correzioni isolate, senza modificare parser PDF FIR, partita, storico o statistiche.
const V2615_ROLE_LABELS={PS:'Pilone sinistro',PD:'Pilone destro',T:'Tallonatore','2S':'Seconda linea sinistra','2D':'Seconda linea destra','3S':'Terza linea sinistra','3C':'Terza linea centro','3D':'Terza linea destra',MM:'Mediano di mischia',MA:'Mediano di apertura',AS:'Ala sinistra',CS:'Centro sinistro',CD:'Centro destro',AD:'Ala destra',E:'Estremo',RI:'Riserva'};
const V2615_ROLES=['Non specificato',...Object.keys(V2615_ROLE_LABELS)];
v261RoleOptions=function(value=''){value=String(value||'').toUpperCase();return V2615_ROLES.map(x=>`<option value="${x}" ${x===value?'selected':''}>${x==='Non specificato'?x:`${x} · ${V2615_ROLE_LABELS[x]}`}</option>`).join('')};
function v2615RepairNumbers(players){
 const xs=players.map(v261Player),used=new Set(),duplicates=[];
 for(const p of xs){const n=+p.number;if(n>=1&&n<=23&&!used.has(n))used.add(n);else duplicates.push(p)}
 const missing=[];for(let n=1;n<=23;n++)if(!used.has(n))missing.push(n);
 if(xs.length===23&&duplicates.length===1&&missing.length===1){const p=duplicates[0],n=missing[0];if((p.role==='RI'&&n>=16)||(p.role!=='RI'&&n<=15))p.number=String(n)}
 return xs
}
const v2615EditAway=editAway;
editAway=function(list=[],meta={}){return v2615EditAway(v2615RepairNumbers(list),meta)};
function v2615LiveName(p){return [p.name,p.surname].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()||p.surname||p.name||'NN'}
function v2615Status(status){return{FIELD:'Titolare',BENCH:'Panchina',TEMP_IN:'Temporaneo in campo',TEMP_OUT:'Temporaneo fuori',OUT:'Uscito',RED:'Espulso'}[status]||''}
choosePlayer=function(side,title,filter,cb,allowNone=true){
 const r=rosterSide(side),list=r.filter(filter).slice().sort((a,b)=>{const af=a.status==='FIELD'||a.status==='TEMP_IN',bf=b.status==='FIELD'||b.status==='TEMP_IN';if(af!==bf)return af?-1:1;return af?(+b.number||0)-(+a.number||0):(+a.number||999)-(+b.number||999)});
 document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modalbox player-picker"><h2>${esc(title)}</h2><input id="searchPlayer" placeholder="Cerca numero, nome o cognome"><div class="players">${list.map(p=>`<button data-player="${p.id}"><b>#${esc(p.number||'-')} ${esc(v2615LiveName(p))}</b><small>${esc(v2615Status(p.status))}${p.flags?.length?' · '+esc(p.flags.join('/')):''}</small></button>`).join('')}</div>${allowNone?'<button id="nonePlayer" class="btn full none-player">NN - Giocatore non definito</button>':''}<button id="cancelPlayer" class="outline full">Annulla</button></div></div>`);
 const modal=document.querySelector('.modal');modal.querySelector('#searchPlayer').oninput=e=>modal.querySelectorAll('[data-player]').forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(e.target.value.toLowerCase()));modal.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{const p=r.find(x=>x.id===b.dataset.player);modal.remove();cb(p)});if(allowNone)modal.querySelector('#nonePlayer').onclick=()=>{modal.remove();cb(null)};modal.querySelector('#cancelPlayer').onclick=()=>modal.remove()
};
