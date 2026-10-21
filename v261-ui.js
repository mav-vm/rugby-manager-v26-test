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
 const out=[],seen=new Set();
 for(let raw of String(text||'').split(/\r?\n/)){
  let line=raw.replace(/[|]/g,' ').replace(/\s+/g,' ').trim(); if(line.length<4)continue;
  let number=(line.match(/(?:^|\s)(\d{1,2})(?=\s|[.):-])/ )||[])[1]||'';
  if(!number){let m=line.match(/^\s*(\d{1,2})\b/);number=m?.[1]||''}
  if(!number||+number>99)continue;
  line=line.replace(new RegExp(`^\\s*(?:n[.°]?\\s*)?${number}\\s*[-.:)]?\\s*`,'i'),'');
  let birth=(line.match(/\b\d{2}[\/.\-]\d{2}[\/.\-]\d{4}\b/)||[])[0]||''; if(birth)line=line.replace(birth,' ');
  line=line.replace(/\b(?:titolare|panchina|riserva|capitano|vice|1l)\b/ig,' ').replace(/\b\d{5,8}\b/g,' ').replace(/[^A-Za-zÀ-ž' ,.-]/g,' ').replace(/\s+/g,' ').trim();
  if(line.length<2)continue;let n=v261SplitName(line),key=`${number}|${norm(n.surname)}|${norm(n.name)}`;if(seen.has(key))continue;seen.add(key);
  out.push(v261Player({number,...n,birth:birth.replace(/[.\-]/g,'/'),source,confidence:null}));
 }
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
async function v261ImportAwayFirPdf(e){
 const f=e.target.files?.[0];e.target.value='';if(!f||v261Busy)return;
 v261Busy=true;v261Progress('Lettura PDF FIR avversari','Estrazione del testo dal PDF originale…',15);
 try{
  const text=await pdfText(f);
  if(!text||text.replace(/\s/g,'').length<80){v261ProgressClose();return v261AskOcrPdf(f,'Il PDF non contiene testo selezionabile e sembra una scansione. Vuoi provare con OCR?')}
  const r=parseFir(text);
  if(r.players?.length){
   const players=r.players.map(p=>v261Player({...p,role:p.role||'Non specificato',firCard:undefined,flags:p.flags||[],source:'PDF FIR'}));
   v261ProgressClose();editAway(players,{source:`PDF FIR · ${players.length} giocatori`});toast(`${players.length} giocatori avversari letti dal PDF FIR`);return;
  }
  v261ProgressClose();v261AskOcrPdf(f,'Il PDF contiene testo, ma la lista FIR non è stata riconosciuta. Vuoi tentare l’OCR oppure inserirla manualmente?');
 }catch(err){console.error(err);v261ProgressClose();v261AskOcrPdf(f,'Non è stato possibile leggere il PDF come lista FIR. Vuoi tentare l’OCR?')}
}
function v261AskOcrPdf(file,message){
 document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modalbox decisionbox"><h2>PDF FIR non riconosciuto</h2><p>${esc(message)}</p><div class="decision-actions"><button id="ocrPdfNow" class="btn">Avvia OCR</button><button id="manualPdfNow" class="outline">Inserimento manuale</button><button id="cancelPdfNow" class="outline">Annulla</button></div></div></div>`);
 const m=document.querySelector('.modal');m.querySelector('#ocrPdfNow').onclick=()=>{m.remove();v261RunOcr(file,'OCR PDF')};m.querySelector('#manualPdfNow').onclick=()=>{m.remove();editAway([],{source:'Manuale'})};m.querySelector('#cancelPdfNow').onclick=()=>m.remove();
}
async function v261ImportAwayImage(e){const f=e.target.files?.[0];e.target.value='';if(f)await v261RunOcr(f,'OCR immagine')}
async function v261RunOcr(file,source){
 if(v261Busy)return;v261Busy=true;v261Progress('Riconoscimento lista avversaria','Avvio OCR…',5);
 try{
  let text='';
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))text=await v261PdfToOcr(file);else text=await v261OcrImage(file,'Immagine');
  const players=v261ParseOcr(text,source);v261ProgressClose();editAway(players,{source:`${source} · ${players.length} righe proposte`});
  toast(players.length?`${players.length} righe OCR da controllare`:'OCR senza risultati: inserisci la lista manualmente');
 }catch(err){console.error(err);v261ProgressClose();toast('OCR non riuscito: usa inserimento manuale');editAway([],{source:'Manuale'})}
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
 <section class="card import-card"><div class="section-head"><div><small>PASSO 3</small><h2>Lista squadra avversaria</h2></div><span class="status ${awayOk?'ok':''}">${awayOk?`✓ ${S.awayRoster.length} giocatori`:'Facoltativa'}</span></div><p class="help"><b>Prima scelta:</b> chiedi il PDF FIR originale, che viene letto con lo stesso sistema della nostra lista. Usa OCR solo per scansioni o fotografie.</p><div class="away-paths"><label class="btn upload path-main"><span>1</span><b>Importa PDF FIR originale</b><small>Lettura diretta, senza OCR</small><input id="awayFirPdf" type="file" accept="application/pdf,.pdf" hidden></label><label class="outline upload"><span>2</span><b>Scansiona o fotografa</b><small>OCR con revisione obbligatoria</small><input id="awayScan" type="file" accept="image/*" capture="environment" hidden></label><label class="outline upload"><span>2</span><b>Importa immagine</b><small>JPG o PNG già salvato</small><input id="awayImage" type="file" accept="image/*" hidden></label><button id="manualAway" class="outline path-manual"><span>3</span><b>Inserimento manuale</b><small>Ruolo, maglia, nome e cognome</small></button></div></section>
 <section class="card final-step"><div><small>PASSO 4</small><h2>Apri il tabellone</h2><p>La lista avversaria è facoltativa. Senza nominativo userai “NN - Giocatore non definito”.</p></div><button id="start" class="btn start-btn">APRI TABELLONE</button></section>`;
 document.querySelector('#homePdf').onchange=importHomePdf;document.querySelector('#awayFirPdf').onchange=v261ImportAwayFirPdf;document.querySelector('#awayScan').onchange=v261ImportAwayImage;document.querySelector('#awayImage').onchange=v261ImportAwayImage;document.querySelector('#manualAway').onclick=()=>editAway([],{source:'Manuale'});
 ['date','category','home','away','venue'].forEach(k=>document.querySelector('#'+k).onchange=e=>{S.setup[k]=e.target.value;save()});document.querySelector('#half').onchange=e=>{S.setup.minutesPerHalf=+e.target.value||40;save()};document.querySelector('#start').onclick=()=>{startMatch();go('match')}
}
const v261ChoosePlayer=choosePlayer;
choosePlayer=function(side,title,filter,cb,allowNone=true){let out=v261ChoosePlayer(side,title,filter,p=>cb(p),allowNone);let b=document.querySelector('#nonePlayer');if(b)b.textContent='NN - Giocatore non definito';return out};
const v261DisplayName=displayName;displayName=function(p,roster){if(!p)return'NN';let n=v261DisplayName(p,roster);return n||'NN'};
render();
