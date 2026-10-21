'use strict';
const V261_ROLES=['Non specificato','Pilone','Tallonatore','Seconda linea','Flanker','Numero 8','Mediano di mischia','Mediano di apertura','Centro','Ala','Estremo'];
let v261Busy=false;
function v261FullName(p){return [p.surname,p.name].filter(Boolean).join(' ').trim()}
function v261SplitName(value){let x=String(value||'').trim().replace(/\s+/g,' ');if(!x)return{surname:'',name:''};if(x.includes(',')){let a=x.split(',');return{surname:a.shift().trim().toUpperCase(),name:a.join(' ').trim().toUpperCase()}}let a=x.split(' ');return{surname:(a.shift()||'').toUpperCase(),name:a.join(' ').toUpperCase()}}
function v261RoleOptions(value=''){return V261_ROLES.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('')}
function v261Progress(title,text,percent=0){document.querySelector('#v261Progress')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="v261Progress"><div class="modalbox progressbox"><h2>${esc(title)}</h2><p id="v261ProgressText">${esc(text)}</p><div class="progress"><i style="width:${Math.max(0,Math.min(100,percent))}%"></i></div><small>Non chiudere l'app durante l'elaborazione.</small></div></div>`)}
function v261ProgressUpdate(text,percent){let m=document.querySelector('#v261Progress');if(!m)return;m.querySelector('#v261ProgressText').textContent=text;m.querySelector('.progress i').style.width=`${Math.max(0,Math.min(100,percent))}%`}
function v261ProgressClose(){document.querySelector('#v261Progress')?.remove();v261Busy=false}
function v261Player(p={}){return{id:p.id||uid(),role:p.role||'Non specificato',number:String(p.number||''),surname:String(p.surname||'').trim().toUpperCase(),name:String(p.name||'').trim().toUpperCase(),birth:p.birth||'',status:p.status||((+p.number>0&&+p.number<=15)?'FIELD':'BENCH'),flags:p.flags||[],source:p.source||'MANUAL',confidence:p.confidence??null}}
function v261Sort(xs){return xs.sort((a,b)=>(+a.number||999)-(+b.number||999)||v261FullName(a).localeCompare(v261FullName(b),'it'))}
function v261ParseOcr(text,source='OCR'){
 const raw=String(text||'').replace(/\r/g,'\n'),out=[],seen=new Set();
 const add=(number,role,full,birth='')=>{number=String(number||'').replace(/\D/g,'');if(!number||+number<1||+number>40)return;full=String(full||'').replace(/\s*\((?:C|V|1L)\)\s*/gi,' ').replace(/\s+/g,' ').trim();if(full.length<3)return;let n=v261SplitName(full),key=`${number}|${norm(n.surname)}|${norm(n.name)}`;if(seen.has(key))return;seen.add(key);out.push(v261Player({number,role:role||'Non specificato',...n,birth:String(birth||'').replace(/[.\-]/g,'/'),source}))};
 let flat=raw.replace(/[|]/g,' ').replace(/[—–]/g,'-').replace(/\s+/g,' '),m;
 let fir=/(?:^|\s)(\d{1,2})\s+([A-Z0-9]{1,3})\s+([A-ZÀ-Ž' -]{2,}\s*,\s*[A-ZÀ-Ž' -]{2,}(?:\s+\((?:C|V|1L)\))*)\s+\d{5,7}\s+(\d{2}[\/.\-]\d{2}[\/.\-]\d{4})/gi;
 while((m=fir.exec(flat)))add(m[1],m[2],m[3],m[4]);
 if(out.length<5)for(let line of raw.split(/\n+/)){line=line.replace(/[|]/g,' ').replace(/\s+/g,' ').trim();let x=line.match(/^\s*(\d{1,2})\s+([A-Z0-9]{1,3})\s+(.+?)(?=\s+\d{5,7}(?:\s|$)|\s+\d{2}[\/.\-]\d{2}[\/.\-]\d{4}|$)/i);if(x){let birth=(line.match(/\b\d{2}[\/.\-]\d{2}[\/.\-]\d{4}\b/)||[])[0]||'';add(x[1],x[2],x[3],birth)}}
 return v261Sort(out)
}
async function v261OcrImage(input,label='Immagine'){
 let result=await Tesseract.recognize(input,'ita',{logger:m=>{if(m.status==='recognizing text')v261ProgressUpdate(`${label}: riconoscimento OCR ${Math.round((m.progress||0)*100)}%`,Math.round((m.progress||0)*100))}});
 return result.data.text||''
}
async function v261PdfToOcr(file){
 let pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,all='';
 for(let i=1;i<=pdf.numPages;i++){
  v261ProgressUpdate(`Pagina ${i} di ${pdf.numPages}: preparazione immagine`,Math.round((i-1)/pdf.numPages*100));
  let pg=await pdf.getPage(i),vp=pg.getViewport({scale:2}),canvas=document.createElement('canvas');canvas.width=vp.width;canvas.height=vp.height;
  await pg.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport:vp}).promise;
  all+='\n'+await v261OcrImage(canvas,`Pagina ${i} di ${pdf.numPages}`);
 }
 return all
}
async function v261ImportAway(e){
 let f=e.target.files?.[0];e.target.value='';if(!f||v261Busy)return;v261Busy=true;v261Progress('Analisi lista avversaria','Controllo del file…',5);
 try{
  let players=[],source='';
  if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
   v261ProgressUpdate('Lettura del testo PDF…',12);let text=await pdfText(f),r=parseFir(text);
   if(r.players?.length){players=r.players.map(p=>v261Player({...p,role:p.role||'Non specificato',firCard:undefined,flags:[],source:'PDF'}));source='PDF testuale'}
   else{v261ProgressUpdate('PDF scannerizzato: avvio OCR…',20);players=v261ParseOcr(await v261PdfToOcr(f),'OCR PDF');source='OCR PDF'}
  }else{v261ProgressUpdate('Avvio OCR immagine…',10);players=v261ParseOcr(await v261OcrImage(f,'Immagine'),'OCR immagine');source='OCR immagine'}
  v261ProgressClose();editAway(players,{source});if(!players.length)toast('Nessuna riga trovata: completa la lista manualmente');
 }catch(err){console.error(err);v261ProgressClose();toast('Importazione non riuscita: usa inserimento manuale');editAway([],{source:'Manuale'})}
}
function v261EditorRow(p){p=v261Player(p);return`<article class="player-edit" data-id="${p.id}"><div class="player-edit-head"><b>#${esc(p.number||'-')} ${esc(v261FullName(p)||'Nuovo giocatore')}</b><button type="button" class="icon danger-soft del-away" aria-label="Elimina">✕</button></div><div class="editor-grid"><label>Ruolo<select class="role">${v261RoleOptions(p.role)}</select></label><label>N. maglia<input class="num" inputmode="numeric" value="${esc(p.number)}"></label><label class="wide">Nome e cognome<input class="fullname" value="${esc(v261FullName(p))}"></label><label>Posizione<select class="st"><option value="FIELD" ${p.status==='FIELD'?'selected':''}>Titolare</option><option value="BENCH" ${p.status!=='FIELD'?'selected':''}>Panchina</option></select></label></div><small class="source">Origine: ${esc(p.source||'MANUAL')}</small></article>`}
function editAway(list=[],meta={}){
 document.querySelectorAll('.modal').forEach(x=>x.remove());let rows=(list.length?list:S.awayRoster).map(v261Player);
 document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modalbox roster-editor"><div class="modal-title"><div><small>V26.1 · ${esc(meta.source||'Inserimento manuale')}</small><h2>Lista squadra avversaria</h2></div><button id="cancelAwayTop" class="close">✕</button></div><section class="insert-player"><h3>Inserisci giocatore</h3><form id="awayInsert"><div class="insert-grid"><label>Ruolo<select id="newRole">${v261RoleOptions()}</select></label><label>N. maglia<input id="newNumber" inputmode="numeric" maxlength="2" placeholder="Es. 12"></label><label class="wide">Nome e cognome<input id="newFullName" autocomplete="off" placeholder="Es. ROSSI MARCO"></label><button class="btn" type="submit">INSERISCI</button></div></form></section><div class="editor-summary"><b><span id="awayCount">${rows.length}</span> giocatori</b><span>Controlla i dati prima di confermare</span></div><div id="awayRows">${rows.map(v261EditorRow).join('')}</div><div class="sticky-actions"><button id="cancelAway" class="outline">Annulla</button><button id="saveAway" class="btn">Conferma lista avversari</button></div></div></div>`);
 const modal=document.querySelector('.modal'),box=modal.querySelector('#awayRows');
 function bind(){box.querySelectorAll('.del-away').forEach(b=>b.onclick=()=>{b.closest('.player-edit').remove();modal.querySelector('#awayCount').textContent=box.children.length})}bind();
 modal.querySelector('#awayInsert').onsubmit=e=>{e.preventDefault();let number=modal.querySelector('#newNumber').value.trim(),full=modal.querySelector('#newFullName').value.trim();if(!full)return toast('Inserisci nome e cognome');if(number&&(!/^\d{1,2}$/.test(number)||+number<1))return toast('Numero di maglia non valido');let n=v261SplitName(full),dup=[...box.querySelectorAll('.num')].some(x=>number&&x.value.trim()===number);if(dup&&!confirm(`Il numero ${number} è già presente. Inserire comunque?`))return;box.insertAdjacentHTML('beforeend',v261EditorRow(v261Player({number,...n,role:modal.querySelector('#newRole').value,status:+number<=15?'FIELD':'BENCH'})));bind();modal.querySelector('#awayCount').textContent=box.children.length;modal.querySelector('#newNumber').value='';modal.querySelector('#newFullName').value='';modal.querySelector('#newNumber').focus()};
 const close=()=>modal.remove();modal.querySelector('#cancelAway').onclick=close;modal.querySelector('#cancelAwayTop').onclick=close;
 modal.querySelector('#saveAway').onclick=()=>{let xs=[...box.querySelectorAll('.player-edit')].map(r=>{let n=v261SplitName(r.querySelector('.fullname').value);return v261Player({id:r.dataset.id,number:r.querySelector('.num').value.trim(),...n,role:r.querySelector('.role').value,status:r.querySelector('.st').value,source:r.querySelector('.source').textContent.replace('Origine: ','')})}).filter(x=>x.surname||x.name||x.number);if(!xs.length&&!confirm('Confermare una lista avversari vuota?'))return;S.awayRoster=v261Sort(xs);save();close();setup();toast(`${xs.length} avversari salvati`)};
 setTimeout(()=>modal.querySelector('#newNumber').focus(),50)
}
function setup(){
 let s=S.setup,awayOk=S.awayRoster.length,homeOk=S.homeRoster.length;
 app.innerHTML=`<div class="page-title"><div><small>V26.1 · Preparazione guidata</small><h1>Prepara la partita</h1></div><span class="step-pill">${homeOk&&awayOk?'Pronta':'Da completare'}</span></div>
 <section class="hero card"><div><small>PASSO 1</small><h2>Dati della partita</h2><p>Puoi correggere i dati estratti dalla lista FIR prima di aprire il tabellone.</p></div></section>
 <section class="card grid setup-grid"><label>Data<input id="date" type="date" value="${esc(s.date)}"></label><label>Categoria<select id="category">${['Seniores','Under 18','Under 16','Under 14'].map(x=>`<option ${x===s.category?'selected':''}>${x}</option>`).join('')}</select></label><label>Squadra mia<input id="home" value="${esc(s.home)}"></label><label>Sede<select id="venue"><option ${s.venue==='CASA'?'selected':''}>CASA</option><option ${s.venue==='TRASFERTA'?'selected':''}>TRASFERTA</option></select></label><label>Squadra avversaria<input id="away" value="${esc(s.away)}"></label><label>Minuti per tempo<input id="half" type="number" min="1" value="${s.minutesPerHalf}"></label></section>
 <section class="card import-card"><div class="section-head"><div><small>PASSO 2</small><h2>Lista gara della mia squadra</h2></div><span class="status ${homeOk?'ok':''}">${homeOk?`✓ ${S.homeRoster.length} giocatori`:'Non importata'}</span></div><label class="btn upload">Importa PDF FIR<input id="homePdf" type="file" accept="application/pdf" hidden></label></section>
 <section class="card import-card"><div class="section-head"><div><small>PASSO 3</small><h2>Lista squadra avversaria</h2></div><span class="status ${awayOk?'ok':''}">${awayOk?`✓ ${S.awayRoster.length} giocatori`:'Facoltativa'}</span></div><p class="help">Accetta PDF testuali, PDF scannerizzati, JPG e PNG. I risultati OCR si controllano prima del salvataggio.</p><div class="import-actions"><label class="btn upload">Importa PDF o immagine<input id="awayFile" type="file" accept=".pdf,application/pdf,image/*" hidden></label><label class="outline upload">Scatta foto<input id="awayCamera" type="file" accept="image/*" capture="environment" hidden></label><button id="manualAway" class="outline">Inserimento manuale</button></div></section>
 <section class="card final-step"><div><small>PASSO 4</small><h2>Apri il tabellone</h2><p>La lista avversaria è facoltativa. Senza nominativo userai “NN - Giocatore non definito”.</p></div><button id="start" class="btn start-btn">APRI TABELLONE</button></section>`;
 document.querySelector('#homePdf').onchange=importHomePdf;document.querySelector('#awayFile').onchange=v261ImportAway;document.querySelector('#awayCamera').onchange=v261ImportAway;document.querySelector('#manualAway').onclick=()=>editAway([],{source:'Manuale'});
 ['date','category','home','away','venue'].forEach(k=>document.querySelector('#'+k).onchange=e=>{S.setup[k]=e.target.value;save()});document.querySelector('#half').onchange=e=>{S.setup.minutesPerHalf=+e.target.value||40;save()};document.querySelector('#start').onclick=()=>{startMatch();go('match')}
}
const v261ChoosePlayer=choosePlayer;
choosePlayer=function(side,title,filter,cb,allowNone=true){let out=v261ChoosePlayer(side,title,filter,p=>cb(p),allowNone);let b=document.querySelector('#nonePlayer');if(b)b.textContent='NN - Giocatore non definito';return out};
const v261DisplayName=displayName;displayName=function(p,roster){if(!p)return'NN';let n=v261DisplayName(p,roster);return n||'NN'};
render();
