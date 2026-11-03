/* Rugby Match Manager FIR v16 - correzione squadre e categoria Seniores */
(function(){
  function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}
  window.firCat=function(value,fallback){
    const v=clean(value).toUpperCase();
    if(/\bSERIE\s*(A1|A2|B|C)\b/.test(v)||v.includes('SENIORES'))return 'Seniores';
    const under=v.match(/\bUNDER\s*[- ]?\s*(\d{1,2})\b/)||v.match(/\bU\s*[- ]?\s*(\d{1,2})\b/);
    return under?'Under '+under[1]:fallback;
  };
  window.parseFir=function(t,file){
    t=clean(t);
    const gara=clean((t.match(/Alla Gara\s+(.+?)\s+del Campionato/i)||[])[1]);
    const date=clean((t.match(/si gioca il\s+(\d{2}\/\d{2}\/\d{4})/i)||[])[1]);
    const category=clean((t.match(/del Campionato\s+(.+?)\s+che si gioca/i)||[])[1]);
    const society=clean((t.match(/Società\s+\d+\s+-\s+(.+?)\s+-\s+Sq/i)||[])[1]);
    let home=society,away=gara;
    if(home&&away.toUpperCase().startsWith(home.toUpperCase()))away=away.slice(home.length);
    else if(gara.includes('-')){const parts=gara.split(/\s*-\s*/);home=home||parts.shift();away=parts.join('-')}
    away=clean(away.replace(/^[\s.\-–—]+/,''))||'Ospiti';
    const start=t.indexOf('N. Maglia'),end=t.indexOf('Sostituzioni');
    const block=t.slice(start,end>start?end:undefined),benchAt=block.indexOf('Giocatori in panchina');
    const re=/(\d{1,2})\s+([A-Z0-9]{1,3})\s+([A-ZÀ-Ž' ]+,[A-ZÀ-Ž' ]+(?:\s+\((?:C|V|1L)\))*)\s+(\d{5,7})\s+(\d{2}\/\d{2}\/\d{4})\s+((?:C\.I\.|PAT\.|PASS\.|[A-Z]+)?\s*[A-Z0-9]+)/g;
    const players=[];let m;
    while((m=re.exec(block))){
      let raw=m[3].trim(),flags=[...raw.matchAll(/\((C|V|1L)\)/g)].map(x=>x[1]);
      raw=raw.replace(/\s*\((?:C|V|1L)\)/g,'').trim();
      const names=raw.split(',');
      players.push({id:id(),number:m[1],role:m[2],surname:names.shift().trim(),name:names.join(',').trim(),firCard:m[4],birth:m[5],document:clean(m[6]),status:m.index>benchAt&&benchAt>=0?'Panchina':'Titolare',flags});
    }
    return{file,gara,date,category,home,away,players};
  };
})();

/* v16.1: conferma lista -> precompila campi modificabili -> tabellone solo dopo Apri tabellone */
window.confirmFir=function(){
  const f=S.fir;
  if(!f)return;
  const category=firCat(f.category,S.setup.category);
  const date=String(f.date||'').split('/').reverse().join('-');
  S.setup={...S.setup,date,category,home:f.home||S.setup.home,away:f.away||S.setup.away};
  S.rosters[category]=S.rosters[category]||[];
  f.players.forEach(p=>{
    const found=S.rosters[category].find(x=>String(x.firCard)===String(p.firCard));
    if(found)Object.assign(found,{number:p.number||found.number,role:p.role||found.role,birth:p.birth||found.birth,document:p.document||found.document,status:p.status,flags:p.flags,present:true});
    else S.rosters[category].push({...p,present:true});
  });
  S.draft=null;
  save();
  toast('Dati gara compilati: puoi modificarli prima di aprire il tabellone');
  setup();
};

const newMatchOriginal=window.newMatch;
window.newMatch=function(lineup){
  const selected=Array.isArray(lineup)?lineup:(S.fir&&Array.isArray(S.fir.players)?S.fir.players:[]);
  S.draft={id:id(),setup:{...S.setup},lineup:selected,score:{home:0,away:0},period:1,seconds:0,running:false,started:0,events:[]};
  save();
};
