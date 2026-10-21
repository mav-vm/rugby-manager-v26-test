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

// v26.1.6: parser OCR Modello B, separa ruolo FIR dal nominativo.
v261ParseOcr=function(text,source='OCR PDF'){
 const roleCodes=['PS','PD','T','2S','2D','3S','3C','3D','MM','MA','AS','CS','CD','AD','E','RI'];
 const roleRe=roleCodes.join('|'),rows=[],seen=new Map();
 const add=(number,role,full,birth='')=>{
  number=String(number||'').replace(/\D/g,'');role=String(role||'').toUpperCase();
  if(!number||+number<1||+number>23||!roleCodes.includes(role))return;
  full=String(full||'').toUpperCase().replace(/\s*\((?:C|V|1L)\)\s*/g,' ').replace(/[^A-ZÀ-Ž' ,.-]/g,' ').replace(/\s+/g,' ').trim();
  full=full.replace(new RegExp(`^(?:${roleRe})\\s+`),'').trim();
  if(full.length<4)return;
  let surname='',name='';
  if(full.includes(',')){let a=full.split(',');surname=a.shift().trim();name=a.join(' ').trim()}
  else{let a=full.split(' ');surname=a.shift()||'';name=a.join(' ')}
  const p=v261Player({number,role,surname,name,birth:String(birth||'').replace(/[.-]/g,'/'),status:+number<=15?'FIELD':'BENCH',source});
  const old=seen.get(number);if(!old||v261FullName(p).length>v261FullName(old).length)seen.set(number,p)
 };
 const raw=String(text||'').replace(/\r/g,'\n');
 // Prima lettura: righe OCR ricomposte, numero + ruolo + nominativo.
 for(let line of raw.split(/\n+/)){
  line=line.replace(/[|]/g,' ').replace(/\s+/g,' ').trim();if(!line)continue;
  let m=line.match(new RegExp(`^\\s*(\\d{1,2})\\s+(${roleRe})\\s+(.+)$`,'i'));
  if(!m)continue;
  let tail=m[3],birth=(tail.match(/\b\d{2}[/.\-]\d{2}[/.\-]\d{4}\b/)||[])[0]||'';
  tail=tail.replace(/\b\d{5,8}\b.*$/,'').replace(/\b\d{2}[/.\-]\d{2}[/.\-]\d{4}\b.*$/,'').trim();add(m[1],m[2],tail,birth)
 }
 // Seconda lettura sul testo continuo, utile quando Tesseract unisce due righe.
 const flat=raw.replace(/[|\n]/g,' ').replace(/\s+/g,' ');
 const re=new RegExp(`(?:^|\\s)(\\d{1,2})\\s+(${roleRe})\\s+(.+?)(?=\\s+\\d{5,8}(?:\\s|$)|\\s+\\d{2}[/.\-]\\d{2}[/.\-]\\d{4}|\\s+\\d{1,2}\\s+(?:${roleRe})\\s+|$)`,'gi');let m;
 while((m=re.exec(flat)))add(m[1],m[2],m[3]);
 let out=[...seen.values()];
 // Se 22 viene letto 2, conserva entrambe le righe e assegna la maglia mancante coerente con RI.
 const all=[];for(let line of raw.split(/\n+/)){let m=line.replace(/\s+/g,' ').trim().match(new RegExp(`^(\\d{1,2})\\s+(${roleRe})\\s+(.+)$`,'i'));if(m){let n=m[1],role=m[2].toUpperCase();if(seen.has(n)&&role==='RI'&&+n<=15)all.push({line,m})}}
 const used=new Set(out.map(p=>+p.number)),missing=[];for(let n=1;n<=23;n++)if(!used.has(n))missing.push(n);
 if(out.length===22&&missing.length===1&&missing[0]>=16&&all.length){let m=all.at(-1).m,tail=m[3].replace(/\b\d{5,8}\b.*$/,'').trim(),a=tail.split(/\s+/);out.push(v261Player({number:String(missing[0]),role:'RI',surname:a.shift()||'',name:a.join(' '),status:'BENCH',source}))}
 return v261Sort(out)
};

// v26.1.7: secondo passaggio OCR sulla fascia completa della tabella e fusione per maglia.
async function v2617FullTableCanvas(input){
 let src;if(input instanceof HTMLCanvasElement)src=input;else{const bmp=await createImageBitmap(input);src=document.createElement('canvas');src.width=bmp.width;src.height=bmp.height;src.getContext('2d').drawImage(bmp,0,0);bmp.close?.()}
 const out=document.createElement('canvas'),sx=Math.floor(src.width*.01),sy=Math.floor(src.height*.075),sw=Math.floor(src.width*.68),sh=Math.floor(src.height*.57);
 out.width=Math.max(1700,Math.floor(sw*1.45));out.height=Math.floor(sh*1.45);const c=out.getContext('2d',{willReadFrequently:true});c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);c.filter='grayscale(1) contrast(1.45)';c.drawImage(src,sx,sy,sw,sh,0,0,out.width,out.height);return out
}
function v2617Quality(p){const role=p.role&&p.role!=='Non specificato'?30:0,name=v261FullName(p),letters=(name.match(/[A-ZÀ-Ž]/gi)||[]).length,bad=(name.match(/[^A-ZÀ-Ž' .,-]/gi)||[]).length;return role+letters-bad*3}
function v2617MergePlayers(first,second){
 const map=new Map();for(const p of [...first,...second]){const n=+p.number;if(n<1||n>23)continue;const old=map.get(n);if(!old||v2617Quality(p)>v2617Quality(old))map.set(n,p)}
 return v261Sort([...map.values()])
}
const v2617RunOcrBase=v261RunOcr;
v261RunOcr=async function(file,source){
 if(v261Busy)return;v261Busy=true;v261Progress('Riconoscimento lista avversaria','Primo passaggio: lettura per righe…',5);
 try{
  let firstText='',secondInput;
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
   const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,allFirst=[],allSecond=[];
   for(let i=1;i<=pdf.numPages;i++){
    const pg=await pdf.getPage(i),vp=pg.getViewport({scale:2.5}),full=document.createElement('canvas');full.width=vp.width;full.height=vp.height;await pg.render({canvasContext:full.getContext('2d',{willReadFrequently:true}),viewport:vp}).promise;
    v261ProgressUpdate(`Pagina ${i}: primo passaggio per righe…`,15);allFirst.push(await v261OcrImage(await v264PrepareTable(full),`Pagina ${i} · righe`));
    v261ProgressUpdate(`Pagina ${i}: secondo passaggio tabella completa…`,55);allSecond.push(await v261OcrImage(await v2617FullTableCanvas(full),`Pagina ${i} · tabella`));
   }
   firstText=allFirst.join('\n');secondInput=allSecond.join('\n')
  }else{
   v261ProgressUpdate('Primo passaggio per righe…',15);firstText=await v261OcrImage(await v264PrepareTable(file),'Immagine · righe');
   v261ProgressUpdate('Secondo passaggio tabella completa…',55);secondInput=await v261OcrImage(await v2617FullTableCanvas(file),'Immagine · tabella')
  }
  const first=v261ParseOcr(firstText,source),second=v261ParseOcr(secondInput,source),players=v2615RepairNumbers(v2617MergePlayers(first,second));
  v261ProgressClose();editAway(players,{source:`${source} · ${players.length} righe unite (${first.length}+${second.length})`});toast(`${players.length} righe OCR da controllare`)
 }catch(err){console.error(err);v261ProgressClose();toast('OCR non riuscito: usa inserimento manuale');editAway([],{source:'Manuale'})}
};
