'use strict';
// v26.2.3: numero maglia letto dalla colonna; ruolo preassegnato dalla posizione FIR.
const V2623_ROLES=['E','AD','CS','CD','AS','MA','MM','3C','3S','3D','2S','2D','PD','T','PS','RI','RI','RI','RI','RI','RI','RI','RI'];
function v2623Crop(src,x,y,w,h,outW=900,outH=150,contrast=1.75){const out=document.createElement('canvas');out.width=outW;out.height=outH;const c=out.getContext('2d',{willReadFrequently:true});c.fillStyle='#fff';c.fillRect(0,0,outW,outH);c.filter=`grayscale(1) contrast(${contrast})`;c.drawImage(src,Math.round(src.width*x),Math.round(src.height*y),Math.round(src.width*w),Math.round(src.height*h),8,8,outW-16,outH-16);return out}
async function v2623Pages(file){if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,pages=[];for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i),vp=pg.getViewport({scale:3.2}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;await pg.render({canvasContext:c.getContext('2d',{willReadFrequently:true}),viewport:vp}).promise;pages.push(c)}return pages}return[await v264SourceCanvas(file)]}
function v2623Bands(src){
 // Coordinate del Modello B FIR: 15 righe titolari, separatore panchina, 8 riserve.
 const out=[],top=.104,starterEnd=.356,benchTop=.399,benchEnd=.535,s=(starterEnd-top)/15,b=(benchEnd-benchTop)/8;
 for(let i=0;i<15;i++)out.push([top+i*s,top+(i+1)*s]);
 for(let i=0;i<8;i++)out.push([benchTop+i*b,benchTop+(i+1)*b]);
 return out
}
async function v2623Recognize(canvas,mode='text'){const opts=mode==='number'?{tessedit_char_whitelist:'0123456789',tessedit_pageseg_mode:'7'}:{tessedit_pageseg_mode:'7'};const r=await Tesseract.recognize(canvas,'ita',opts);return String(r.data.text||'').replace(/\s+/g,' ').trim()}
function v2623Number(text){const m=String(text||'').match(/\d{1,3}/);return m?m[0]:''}
function v2623Name(text){let raw=String(text||'').toUpperCase(),flags=[...raw.matchAll(/\((C|V|1L)\)/g)].map(x=>x[1]);raw=raw.replace(/\s*\((?:C|V|1L)\)\s*/g,' ').replace(/\b\d{5,8}\b.*$/,'').replace(/[^A-ZÀ-Ž' ,.-]/g,' ').replace(/\s+/g,' ').trim();let surname='',name='';if(raw.includes(',')){let a=raw.split(',');surname=a.shift().trim();name=a.join(' ').trim()}else{let a=raw.split(' ');surname=a.shift()||'';name=a.join(' ')}return{surname,name,flags}}
async function v2623ReadModelB(file,source){const pages=await v2623Pages(file),src=pages[0],bands=v2623Bands(src),players=[];
 for(let i=0;i<23;i++){const [a,b]=bands[i],h=b-a,pct=Math.round(i/23*100);v261ProgressUpdate(`Riga ${i+1}/23: leggo il numero di maglia…`,pct);
  // Numero: prima colonna. Il valore viene davvero letto e puo essere 27, 33, ecc.
  const numText=await v2623Recognize(v2623Crop(src,.025,a+.06*h,.075,.88*h,520,150,2),'number');
  v261ProgressUpdate(`Riga ${i+1}/23: leggo il nominativo…`,pct);
  // Nominativo: sola colonna Cognome e Nome, senza ruolo/tessera/data/documento.
  const nameText=await v2623Recognize(v2623Crop(src,.145,a+.06*h,.455,.88*h,1900,150,1.65),'text');
  const n=v2623Name(nameText),number=v2623Number(numText);
  players.push(v261Player({number,role:V2623_ROLES[i],surname:n.surname,name:n.name,flags:n.flags,status:i<15?'FIELD':'BENCH',source}))
 }
 return players}
// Sostituisce il fallback OCR sia per PDF scansione sia per foto. Non modifica il PDF FIR testuale.
v261RunOcr=async function(file,source){if(v261Busy)return;v261Busy=true;v261Progress('Riconoscimento lista avversaria','Lettura separata di maglia e nominativo…',2);try{const players=await v2623ReadModelB(file,source);v261ProgressClose();editAway(players,{source:`${source} · 23 posizioni FIR da verificare`});toast('Controlla numeri di maglia e nominativi prima di confermare')}catch(err){console.error(err);v261ProgressClose();toast('OCR non riuscito: usa inserimento manuale');editAway([],{source:'Manuale'})}};
