'use strict';
/* v26.3.5-test - caricare prima di app.js. Separa TEST/UFFICIALE e gestisce schema 2. */
(function(){
 const LEGACY='rugby-fir-v26';
 const explicit=String(window.RUGBY_CHANNEL||'').toLowerCase();
 const isTest=explicit?explicit==='test':/rugby-manager-v26-test/i.test(location.pathname);
 const CHANNEL=isTest?'rugby-manager-test-data':'rugby-manager-official-data';
 const SCHEMA=2,INSTALL_KEY=CHANNEL+'-installation-id',PROFILE_KEY=CHANNEL+'-club-profile';
 const rawGet=Storage.prototype.getItem,rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
 const read=k=>rawGet.call(localStorage,k),write=(k,v)=>rawSet.call(localStorage,k,v);
 const uuid=()=>crypto.randomUUID?crypto.randomUUID():`rmm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
 let installationId=read(INSTALL_KEY);if(!installationId){installationId=uuid();write(INSTALL_KEY,installationId)}
 function getProfile(){try{return Object.assign({clubId:'',clubName:'BRIXIA',teamId:'',teamName:'',defaultCategory:'',season:''},JSON.parse(read(PROFILE_KEY)||'{}'))}catch{return{clubId:'',clubName:'BRIXIA',teamId:'',teamName:'',defaultCategory:'',season:''}}}
 function saveProfile(v){write(PROFILE_KEY,JSON.stringify(Object.assign(getProfile(),v||{})));return getProfile()}
 function migrate(d){d=d&&typeof d==='object'?d:{};d.dataSchema=SCHEMA;d.dataChannel=isTest?'test':'official';d.lastDataUpdate=d.lastDataUpdate||new Date().toISOString();d.setup=d.setup||{};d.homeRoster=Array.isArray(d.homeRoster)?d.homeRoster:[];d.awayRoster=Array.isArray(d.awayRoster)?d.awayRoster:[];d.matches=Array.isArray(d.matches)?d.matches:[];if(!('draft'in d))d.draft=null;return d}
 function normalize(raw){let d={};try{d=raw?JSON.parse(raw):{}}catch{}return JSON.stringify(migrate(d))}
 if(!read(CHANNEL)){const legacy=read(LEGACY);write(CHANNEL,normalize(legacy));write(CHANNEL+'-migration',JSON.stringify({from:LEGACY,at:new Date().toISOString(),hadLegacy:!!legacy}))}else write(CHANNEL,normalize(read(CHANNEL)));
 Storage.prototype.getItem=function(k){return rawGet.call(this,k===LEGACY?CHANNEL:k)};
 Storage.prototype.setItem=function(k,v){if(k===LEGACY)return rawSet.call(this,CHANNEL,normalize(v));return rawSet.call(this,k,v)};
 Storage.prototype.removeItem=function(k){return rawRemove.call(this,k===LEGACY?CHANNEL:k)};
 window.RUGBY_DATA={legacyKey:LEGACY,key:CHANNEL,schema:SCHEMA,channel:isTest?'test':'official',installationId,profileKey:PROFILE_KEY,getProfile,saveProfile,rawGet:k=>rawGet.call(localStorage,k),rawSet:(k,v)=>rawSet.call(localStorage,k,v),normalize};
})();
