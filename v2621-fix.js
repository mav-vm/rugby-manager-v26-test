'use strict';
// v26.2.1: parser FIR rigoroso. Un ruolo e valido solo se appartiene ai codici ufficiali del Modello B.
const V2621_ROLE='PS|PD|T|2S|2D|3S|3C|3D|MM|MA|AS|CS|CD|AD|E|RI';
const v2621ParseFirBase=parseFir;
parseFir=function(text){
 const base=v2621ParseFirBase(text),t=String(text||'').replace(/\s+/g,' '),start=t.indexOf('N. Maglia'),end=t.indexOf('Sostituzioni'),block=t.slice(start>=0?start:0,end>start?end:t.length),benchAt=block.indexOf('Giocatori in panchina');
 const players=[],seen=new Set();
 // Il lookahead consente di saltare eventuali cifre spurie prima della vera coppia MAGLIA + RUOLO.
 const re=new RegExp(`(?:^|\\s)(\\d{1,2})\\s+(${V2621_ROLE})\\s+([A-ZÀ-Ž' -]+\\s*,\\s*[A-ZÀ-Ž' -]+(?:\\s+\\((?:C|V|1L)\\))*)\\s+(\\d{5,7})\\s+(\\d{2}\\/\\d{2}\\/\\d{4})(?=\\s|$)`,'g');
 let m;while((m=re.exec(block))){
  const number=m[1],role=m[2],raw=m[3].trim(),key=`${number}|${m[4]}`;if(seen.has(key))continue;seen.add(key);
  const fl=flags(raw),parts=raw.replace(/\s*\((?:C|V|1L)\)/g,'').split(','),surname=(parts.shift()||'').trim(),name=parts.join(',').trim();
  players.push({id:uid(),number,role,surname,name,birth:m[5],firCard:m[4],flags:fl,status:benchAt>=0&&m.index>benchAt?'BENCH':'FIELD'})
 }
 // Usa il nuovo risultato solo se coerente; altrimenti conserva il comportamento precedente.
 if(players.length>=15)base.players=players;
 return base
};
// Ripara i record gia importati con lo schema osservato: number=21, role=2, surname='T BERTINI'.
function v2621Repair(list){return(list||[]).map(p=>{const m=String(p.surname||'').match(new RegExp(`^(${V2621_ROLE})\\s+(.+)$`));if(/^\d{1,2}$/.test(String(p.role||''))&&m){return{...p,number:String(p.role),role:m[1],surname:m[2].trim()}}return p})}
S.homeRoster=v2621Repair(S.homeRoster);
if(S.draft?.homePlayers)S.draft.homePlayers=v2621Repair(S.draft.homePlayers);
if(S.matches?.length)S.matches=S.matches.map(x=>({...x,homePlayers:v2621Repair(x.homePlayers)}));
save();
