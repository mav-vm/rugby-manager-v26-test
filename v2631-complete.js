'use strict';
/* v26.3.1 rigenerata dalla base v26.2.9. Non richiede v2630.js o il vecchio v2631-report.js. */

/* ---------- PREPARAZIONE: ARBITRO ---------- */
const V2631_SETUP_BASE=setup;
setup=function(){
  V2631_SETUP_BASE();
  if(document.querySelector('#refereeSetup'))return;
  const half=document.querySelector('#half')?.closest('label');
  if(!half)return;
  half.insertAdjacentHTML('afterend',`<label>Nome arbitro<input id="refereeSetup" value="${esc(S.setup.referee||'')}" placeholder="Cognome e nome"></label>`);
  document.querySelector('#refereeSetup').oninput=e=>{S.setup.referee=e.target.value.trim();save()};
};

/* ---------- GIALLO: VIBRAZIONE + POPUP DOPO 10 MINUTI DI GIOCO ---------- */
let V2631_YELLOW_TIMER=null;
function v2631AbsoluteSecond(period,second,half){return Math.max(0,(period-1)*half+second)}
function v2631YellowDue(){
  const d=S.draft;if(!d)return null;
  d.yellowAcknowledged=d.yellowAcknowledged||{};
  const half=(d.setup.minutesPerHalf||40)*60;
  const now=v2631AbsoluteSecond(d.period,elapsed(),half);
  return d.events.slice().reverse().find(e=>e.type==='Giallo'&&!d.yellowAcknowledged[e.id]&&now-v2631AbsoluteSecond(e.time.period,e.time.second,half)>=600);
}
function v2631CheckYellow(){
  if(document.querySelector('#yellowReminder'))return;
  const e=v2631YellowDue();if(!e)return;
  try{navigator.vibrate?.([350,150,350,150,800])}catch{}
  document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="yellowReminder"><div class="modalbox yellow-reminder"><div class="yellow-symbol">🟨</div><h2>Ammonito 10'</h2><p><b>${esc(e.player||'NN - Giocatore non definito')}</b><br>${esc(e.team||'')} · ammonito al ${esc(e.time.label)}</p><button id="yellowRead" class="btn full">OK, LETTO</button></div></div>`);
  document.querySelector('#yellowRead').onclick=()=>{S.draft.yellowAcknowledged[e.id]=true;save();document.querySelector('#yellowReminder').remove();setTimeout(v2631CheckYellow,120)};
}
function v2631StartYellowTimer(){clearInterval(V2631_YELLOW_TIMER);V2631_YELLOW_TIMER=setInterval(v2631CheckYellow,1000);setTimeout(v2631CheckYellow,100)}
const V2631_MATCH_BASE=match;
match=function(){V2631_MATCH_BASE();v2631StartYellowTimer()};

/* ---------- CALIBRAZIONE MOBILE: ZOOM, PAN, PINCH, LINEA ATTIVA ---------- */
const V2631_CAL={zoom:1,mode:'grid',active:'x1',scrollLeft:0,scrollTop:0,pinch:null,pan:null};
const V2631_OPEN_BASE=v2626Open;
v2626Open=function(file,source){
  V2631_OPEN_BASE(file,source);
  let tries=0;
  const timer=setInterval(()=>{
    const modal=document.querySelector('#gridModal'),wrap=modal?.querySelector('.grid-canvas-wrap'),canvas=modal?.querySelector('#gridCanvas');
    if(!modal||!wrap||!canvas){if(++tries>60)clearInterval(timer);return}
    clearInterval(timer);if(modal.querySelector('#v2631CalControls'))return;
    const controls=document.createElement('div');controls.id='v2631CalControls';controls.className='v2631-cal-controls';
    const lines=[['x0','Sinistra'],['x1','Fine maglia'],['x2','Inizio nome'],['x3','Fine nome'],['y0','Prima titolare'],['y1','Ultima titolare'],['y2','Prima riserva'],['y3','Ultima riserva']];
    controls.innerHTML=`<div class="cal-mode"><button data-mode="pan" class="outline">SPOSTA IMMAGINE</button><button data-mode="grid" class="btn">MODIFICA GRIGLIA</button></div><div class="cal-zoom"><button id="calMinus" class="outline">−</button><b id="calZoomLabel">100%</b><button id="calPlus" class="outline">+</button><button id="calFit" class="outline">ADATTA</button></div><div class="cal-fine"><select id="calActiveLine">${lines.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><button id="calFineMinus" class="outline">− PRECISIONE</button><button id="calFinePlus" class="outline">+ PRECISIONE</button></div>`;
    wrap.before(controls);
    const apply=()=>{canvas.style.width=`${V2631_CAL.zoom*100}%`;canvas.style.maxWidth='none';controls.querySelector('#calZoomLabel').textContent=`${Math.round(V2631_CAL.zoom*100)}%`;controls.querySelector('#calActiveLine').value=V2631_CAL.active;requestAnimationFrame(()=>{wrap.scrollLeft=V2631_CAL.scrollLeft;wrap.scrollTop=V2631_CAL.scrollTop})};
    const setMode=mode=>{V2631_CAL.mode=mode;controls.querySelectorAll('[data-mode]').forEach(b=>b.className=b.dataset.mode===mode?'btn':'outline');canvas.style.touchAction=mode==='grid'?'none':'none'};
    controls.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
    controls.querySelector('#calPlus').onclick=()=>{V2631_CAL.zoom=Math.min(4,V2631_CAL.zoom+.25);apply()};
    controls.querySelector('#calMinus').onclick=()=>{V2631_CAL.zoom=Math.max(1,V2631_CAL.zoom-.25);apply()};
    controls.querySelector('#calFit').onclick=()=>{V2631_CAL.zoom=1;V2631_CAL.scrollLeft=V2631_CAL.scrollTop=0;apply()};
    controls.querySelector('#calActiveLine').onchange=e=>V2631_CAL.active=e.target.value;
    const fine=dir=>{V2626.g[V2631_CAL.active]=Math.max(.001,Math.min(.999,V2626.g[V2631_CAL.active]+dir*.0007));v2626Draw()};
    controls.querySelector('#calFineMinus').onclick=()=>fine(-1);controls.querySelector('#calFinePlus').onclick=()=>fine(1);
    wrap.addEventListener('scroll',()=>{V2631_CAL.scrollLeft=wrap.scrollLeft;V2631_CAL.scrollTop=wrap.scrollTop},{passive:true});
    const oldDown=canvas.onpointerdown,oldMove=canvas.onpointermove,oldUp=canvas.onpointerup;
    const pointers=new Map();
    canvas.onpointerdown=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);if(pointers.size===2){const a=[...pointers.values()];V2631_CAL.pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom:V2631_CAL.zoom};return}if(V2631_CAL.mode==='pan'){V2631_CAL.pan={x:e.clientX,y:e.clientY,left:wrap.scrollLeft,top:wrap.scrollTop};return}const p=v2626Pos(e),keys=['x0','x1','x2','x3','y0','y1','y2','y3'];V2631_CAL.active=keys.sort((a,b)=>{const da=a[0]==='x'?Math.abs(V2626.g[a]-p.x):Math.abs(V2626.g[a]-p.y),db=b[0]==='x'?Math.abs(V2626.g[b]-p.x):Math.abs(V2626.g[b]-p.y);return da-db})[0];controls.querySelector('#calActiveLine').value=V2631_CAL.active;oldDown?.(e)};
    canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&V2631_CAL.pinch){const a=[...pointers.values()],distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);V2631_CAL.zoom=Math.max(1,Math.min(4,V2631_CAL.pinch.zoom*distance/V2631_CAL.pinch.distance));apply();return}if(V2631_CAL.mode==='pan'&&V2631_CAL.pan){wrap.scrollLeft=V2631_CAL.pan.left-(e.clientX-V2631_CAL.pan.x);wrap.scrollTop=V2631_CAL.pan.top-(e.clientY-V2631_CAL.pan.y);return}oldMove?.(e)};
    const end=e=>{pointers.delete(e.pointerId);if(pointers.size<2)V2631_CAL.pinch=null;if(!pointers.size)V2631_CAL.pan=null;oldUp?.(e)};canvas.onpointerup=end;canvas.onpointercancel=end;
    setMode(V2631_CAL.mode);apply();
  },50);
};

/* ---------- TABELLINO ---------- */
function v2631CleanTeam(x){return String(x||'').replace(/\.+$/,'').trim()}
function v2631Date(v){if(!v)return'';const [y,m,d]=v.split('-').map(Number),M=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];return`${d} ${M[m-1]||''} ${y}`}
function v2631OfficialSide(m,displaySide){return m.setup.venue==='TRASFERTA'?(displaySide==='home'?'away':'home'):displaySide}
function v2631TryCount(m,displaySide){const side=v2631OfficialSide(m,displaySide);return m.events.filter(e=>e.type==='Meta'&&e.side===side).length}
function v2631PlayerName(p,r){if(!p)return'NN';const same=r.filter(x=>norm(x.surname)===norm(p.surname));return same.length>1?`${(p.name||'').charAt(0)}. ${p.surname}`:p.surname}
function v2631Roster(m,side){const r=side==='home'?m.homePlayers:m.awayPlayers,initial=r.filter(p=>p.intervals?.some(i=>i.in===0)).sort((a,b)=>(+b.number||0)-(+a.number||0)),used=new Set(initial.map(p=>p.id)),parts=[];for(const p of initial){const changes=m.events.filter(e=>e.type==='Cambio'&&e.side===side&&e.outId===p.id).slice().reverse();changes.forEach(e=>used.add(e.inId));parts.push(v2631PlayerName(p,r)+(changes.length?' ('+changes.map(e=>`${e.time.label} ${v2631PlayerName(r.find(q=>q.id===e.inId),r)}`).join(', ')+')':''))}const rest=r.filter(p=>!used.has(p.id)).sort((a,b)=>(+a.number||999)-(+b.number||999));if(rest.length)parts.push('Panchina: '+rest.map(p=>v2631PlayerName(p,r)).join(', '));return parts.join('; ')}
function v2631Scorers(m){const ev=m.events.slice().reverse().filter(e=>['Meta','Trasformazione','Punizione','Drop'].includes(e.type)&&e.outcome!=='SBAGLIATO'),code={Meta:'m.',Trasformazione:'tr.',Punizione:'cp',Drop:'drop'},pt=[],st=[];for(const e of ev)(e.time.period===2?st:pt).push(`${e.time.minute}’ ${code[e.type]} ${e.player||e.team}`);return[pt.join(', '),st.length?'st: '+st.join(', '):''].filter(Boolean).join('; ')}
function v2631Cards(m){const y=m.events.filter(e=>e.type==='Giallo').slice().reverse(),r=m.events.filter(e=>e.type==='Rosso').slice().reverse(),a=[];if(y.length)a.push('gialli a '+y.map(e=>`${e.player||e.team} (${e.time.label})`).join(', '));if(r.length)a.push('rossi a '+r.map(e=>`${e.player||e.team} (${e.time.label})`).join(', '));return a.length?a.join('. ')+'.':'Nessun cartellino registrato.'}
function v2631Temps(m){const a=m.temporary||[];return a.length?a.map(t=>`${t.outName} → ${t.inName} (${t.start.label}${t.end?' - '+t.end.label:' - ancora aperta'})`).join('; ')+'.':'Nessuna sostituzione temporanea registrata.'}
function v2631NoContest(m){return m.noContest?`dal ${m.noContest.start.label}${m.noContest.end?' al '+m.noContest.end.label:' fino al termine'}.`:'Nessuna mischia no contest registrata.'}
function v2631Audit(m){const calc={home:0,away:0};for(const e of m.events){if(['Meta','Trasformazione','Punizione','Drop'].includes(e.type)&&e.outcome!=='SBAGLIATO')calc[e.side]+=e.points||0}return calc.home===m.score.home&&calc.away===m.score.away?'':`ATTENZIONE: somma marcatori ${calc.home}-${calc.away}, risultato salvato ${m.score.home}-${m.score.away}.`}
generateReport=function(m){const o=official(m),hs=v2631OfficialSide(m,'home'),as=v2631OfficialSide(m,'away'),ht=hs==='home'?m.setup.home:m.setup.away,at=as==='home'?m.setup.home:m.setup.away,hc=hs==='home'?(m.editorial?.coachHome||m.setup.coachHome):(m.editorial?.coachAway||m.setup.coachAway),ac=as==='home'?(m.editorial?.coachHome||m.setup.coachHome):(m.editorial?.coachAway||m.setup.coachAway),ref=(m.editorial?.referee||m.setup.referee||'').trim(),audit=v2631Audit(m);return`FAC SIMILE TABELLINO\n\n${v2631Date(m.setup.date)}\n\n${v2631CleanTeam(o.home).toUpperCase()} - ${v2631CleanTeam(o.away).toUpperCase()} ${o.hs}-${o.as} (${v2631TryCount(m,'home')}-${v2631TryCount(m,'away')})\n\n${v2631CleanTeam(ht).toUpperCase()}: ${v2631Roster(m,hs)}.${hc?' All. '+hc+'.':''}\n\n${v2631CleanTeam(at).toUpperCase()}: ${v2631Roster(m,as)}.${ac?' All. '+ac+'.':''}\n\nArbitro: ${ref||'non indicato'}\n\nMarcatori: ${v2631Scorers(m)||'nessun marcatore registrato'}.\n\nNote: ${v2631Cards(m)}\n\nSostituzioni temporanee: ${v2631Temps(m)}\n\nCartellini rossi e gialli: ${v2631Cards(m)}\n\nMischie no contest: ${v2631NoContest(m)}${audit?'\n\n'+audit:''}`};

setup();
