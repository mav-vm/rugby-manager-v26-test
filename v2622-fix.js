'use strict';
// v26.2.2: OCR fotografie/immagini Modello B con ordine FIR reale.
const V2622_NUMBERS=[15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,16,17,18,19,20,21,22,23];
const V2622_ROLES=['PS','PD','T','2S','2D','3S','3C','3D','MM','MA','AS','CS','CD','AD','E','RI'];
function v2622Canvas(src,sx,sy,sw,sh,w=1700,h=150){const out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.fillStyle='#fff';c.fillRect(0,0,w,h);c.filter='grayscale(1) contrast(1.7)';c.drawImage(src,sx,sy,sw,sh,8,8,w-16,h-16);return out}
function v2622UniformBands(src){
 // Modello B fotografato: 15 titolari, riga separatore panchina, 8 riserve.
 const top=Math.round(src.height*.102),starterBottom=Math.round(src.height*.354),benchTop=Math.round(src.height*.397),benchBottom=Math.round(src.height*.535),out=[];
 const sStep=(starterBottom-top)/15,bStep=(benchBottom-benchTop)/8;
 for(let i=0;i<15;i++)out.push([Math.round(top+i*sStep),Math.round(top+(i+1)*sStep)]);
 for(let i=0;i<8;i++)out.push([Math.round(benchTop+i*bStep),Math.round(benchTop+(i+1)*bStep)]);
 return out
}
function v2622DetectedBands(src){
 const bands=v264FindTableRows(src).filter(([a,b])=>b-a>10),clean=bands.filter(([a,b])=>{const mid=(a+b)/2;return mid<src.height*.37||mid>src.height*.39});
 return clean.length>=23?clean.slice(0,23):v2622UniformBands(src)
}
async function v2622OcrCell(canvas,whitelist){const r=await Tesseract.recognize(canvas,'ita',{tessedit_char_whitelist:whitelist||undefined});return String(r.data.text||'').replace(/\s+/g,' ').trim()}
function v2622Role(text,number){let x=String(text||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(number>=16)return'RI';if(V2622_ROLES.includes(x))return x;for(const r of V2622_ROLES)if(x.includes(r))return r;return'Non specificato'}
function v2622Name(text){let x=String(text||'').toUpperCase().replace(/\b\d{5,8}\b.*$/,'').replace(/\s*\((?:C|V|1L)\)\s*/g,' ').replace(/[^A-ZÀ-Ž' ,.-]/g,' ').replace(/\s+/g,' ').trim();let surname='',name='';if(x.includes(',')){let a=x.split(',');surname=a.shift().trim();name=a.join(' ').trim()}else{let a=x.split(' ');surname=a.shift()||'';name=a.join(' ')}return{surname,name}}
async function v2622OcrImageRows(file,source){
 const src=await v264SourceCanvas(file),bands=v2622DetectedBands(src),players=[];
 // Colonne del Mod. B: ruolo circa 7.5%-13.5%, nominativo circa 13.5%-59.5%.
 for(let i=0;i<23;i++){
  const number=V2622_NUMBERS[i],[a,b]=bands[i]||v2622UniformBands(src)[i],pad=Math.max(1,Math.round((b-a)*.08)),rh=Math.max(2,b-a-pad*2),pct=Math.round(i/23*100);
  v261ProgressUpdate(`Riga ${i+1} di 23 · maglia ${number}: ruolo…`,pct);
  const roleText=await v2622OcrCell(v2622Canvas(src,Math.round(src.width*.075),a+pad,Math.round(src.width*.065),rh,520,150),'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
  v261ProgressUpdate(`Riga ${i+1} di 23 · maglia ${number}: nominativo…`,pct);
  const nameText=await v2622OcrCell(v2622Canvas(src,Math.round(src.width*.135),a+pad,Math.round(src.width*.46),rh,1900,150));
  const n=v2622Name(nameText);if(n.surname||n.name)players.push(v261Player({number:String(number),role:v2622Role(roleText,number),...n,status:number<=15?'FIELD':'BENCH',source}))
 }
 return players
}
const v2622OcrRowsBase=v2618OcrRows;
v2618OcrRows=async function(file,source){
 // Le immagini WhatsApp/fotografie usano geometria e colonne dedicate. I PDF scannerizzati mantengono il percorso gia collaudato.
 if(!(file.type==='application/pdf'||/\.pdf$/i.test(file.name)))return v2622OcrImageRows(file,source);
 return v2622OcrRowsBase(file,source)
};
