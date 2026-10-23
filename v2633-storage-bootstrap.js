'use strict';
/* Deve essere caricato PRIMA di app.js. Separa TEST e UFFICIALE senza modificare app.js. */
(function(){
 const LEGACY='rugby-fir-v26',isTest=/rugby-manager-v26-test/i.test(location.pathname);
 const CHANNEL=isTest?'rugby-manager-test-data':'rugby-manager-official-data';
 const SCHEMA=1,rawGet=Storage.prototype.getItem,rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
 const read=k=>rawGet.call(localStorage,k),write=(k,v)=>rawSet.call(localStorage,k,v);
 function normalize(raw){let d={};try{d=raw?JSON.parse(raw):{}}catch{};d.dataSchema=Number(d.dataSchema||SCHEMA);d.dataChannel=isTest?'test':'official';d.lastDataUpdate=d.lastDataUpdate||new Date().toISOString();d.setup=d.setup||{};d.homeRoster=Array.isArray(d.homeRoster)?d.homeRoster:[];d.awayRoster=Array.isArray(d.awayRoster)?d.awayRoster:[];d.matches=Array.isArray(d.matches)?d.matches:[];if(!('draft'in d))d.draft=null;return JSON.stringify(d)}
 // Prima apertura: copia prudente della chiave storica nel canale corrente. Non elimina mai l'originale.
 if(!read(CHANNEL)){const legacy=read(LEGACY);write(CHANNEL,normalize(legacy));write(CHANNEL+'-migration',JSON.stringify({from:LEGACY,at:new Date().toISOString(),hadLegacy:!!legacy}))}
 // L'app continua a chiedere LEGACY, ma riceve/salva il canale corretto in base al repository.
 Storage.prototype.getItem=function(k){return rawGet.call(this,k===LEGACY?CHANNEL:k)};
 Storage.prototype.setItem=function(k,v){if(k===LEGACY){let d;try{d=JSON.parse(v)}catch{d={}}d.dataSchema=SCHEMA;d.dataChannel=isTest?'test':'official';d.lastDataUpdate=new Date().toISOString();return rawSet.call(this,CHANNEL,JSON.stringify(d))}return rawSet.call(this,k,v)};
 Storage.prototype.removeItem=function(k){return rawRemove.call(this,k===LEGACY?CHANNEL:k)};
 window.RUGBY_DATA={legacyKey:LEGACY,key:CHANNEL,schema:SCHEMA,channel:isTest?'test':'official',rawGet:k=>rawGet.call(localStorage,k),rawSet:(k,v)=>rawSet.call(localStorage,k,v),normalize};
})();
