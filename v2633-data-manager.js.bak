'use strict';
(function(){
 const D=window.RUGBY_DATA,uuid=()=>crypto.randomUUID?crypto.randomUUID():`rmm-${Date.now()}-${Math.random().toString(16).slice(2)}`,fileDate=()=>new Date().toISOString().replace(/[:.]/g,'-');
 function snapshot(){let state={};try{state=JSON.parse(D.rawGet(D.key)||'{}')}catch{}return{format:'rugby-match-manager-backup',backupVersion:2,dataSchema:D.schema,channel:D.channel,appVersion:'26.3.9',exportId:uuid(),installationId:D.installationId,profile:D.getProfile(),exportedAt:new Date().toISOString(),origin:location.origin,path:location.pathname,data:state}}
 function downloadBackup(){const b=snapshot(),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(b,null,2)],{type:'application/json'}));a.download=`rugby-manager-${D.channel}-backup-${fileDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast(`Backup ${D.channel} esportato`)}
 function validate(b){if(!b||b.format!=='rugby-match-manager-backup')throw Error('File non riconosciuto');if(!b.data||typeof b.data!=='object')throw Error('Dati mancanti');for(const k of ['matches','homeRoster','awayRoster'])if(k in b.data&&!Array.isArray(b.data[k]))throw Error(`Campo ${k} non valido`);return b}
 function importBackup(file){const r=new FileReader();r.onload=()=>{try{const b=validate(JSON.parse(r.result)),current=snapshot();if(!confirm(`Importare il backup del ${new Date(b.exportedAt).toLocaleString('it-IT')}?\n\nPartite nel backup: ${(b.data.matches||[]).length}\nPartite attuali: ${(current.data.matches||[]).length}\n\nVerrà creato prima un backup di sicurezza.`))return;downloadBackup();D.rawSet(D.key,D.normalize(JSON.stringify(b.data)));alert('Ripristino completato. L’app verrà ricaricata.');location.reload()}catch(e){alert(`Importazione non riuscita: ${e.message}`)}};r.readAsText(file)}
 function openManager(){const p=D.getProfile();document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="dataManager"><div class="modalbox data-manager"><button id="dataClose" class="close">✕</button><h2>Backup e dati societari</h2><p><b>Ambiente:</b> ${D.channel==='official'?'UFFICIALE':'TEST'}<br><b>Schema dati:</b> ${D.schema}<br><b>Partite salvate:</b> ${(S.matches||[]).length}${S.draft?'<br><b>Partita in corso:</b> sì':''}</p><h3>Profilo societario</h3><label>Società<input id="clubName" value="${esc(p.clubName)}"></label><label>Codice società<input id="clubId" value="${esc(p.clubId)}"></label><label>Squadra<input id="teamName" value="${esc(p.teamName)}"></label><label>Categoria predefinita<input id="defaultCategory" value="${esc(p.defaultCategory)}"></label><label>Stagione<input id="season" placeholder="2026/2027" value="${esc(p.season)}"></label><button id="saveProfile" class="outline full">SALVA PROFILO</button><hr><button id="dataExport" class="btn full">ESPORTA BACKUP COMPLETO</button><label class="outline full data-import">IMPORTA BACKUP<input id="dataImport" type="file" accept="application/json,.json" hidden></label><button id="companyExport" class="btn full">ESPORTA DATI PER LA SOCIETÀ</button><p class="help">Il ripristino sostituisce i dati locali. L’esportazione societaria serve alla futura fusione e non modifica l’app.</p></div></div>`);const m=document.querySelector('#dataManager');m.querySelector('#dataClose').onclick=()=>m.remove();m.querySelector('#saveProfile').onclick=()=>{D.saveProfile({clubName:m.querySelector('#clubName').value.trim(),clubId:m.querySelector('#clubId').value.trim(),teamName:m.querySelector('#teamName').value.trim(),defaultCategory:m.querySelector('#defaultCategory').value.trim(),season:m.querySelector('#season').value.trim()});toast('Profilo societario salvato')};m.querySelector('#dataExport').onclick=downloadBackup;m.querySelector('#companyExport').onclick=()=>window.RUGBY_COMPANY?.export();
m.querySelector('#privacyInfo').onclick=()=>{
 document.body.insertAdjacentHTML('beforeend',`
 <div class="modal" id="privacyModal">
  <div class="modalbox data-manager">

   <button id="privacyClose" class="close">✕</button>

   <h2>Privacy e Note Legali</h2>

   <p>
    <b>Rugby Match Manager</b><br>
    Versione applicazione: v26.3.9<br>
    Versione documento: 1.0<br>
    Ultimo aggiornamento: 03/11/2026
   </p>

   <h3>Applicazione indipendente</h3>

   <p>
    Rugby Match Manager è un'applicazione indipendente
    sviluppata da Vittorio Mavilla.
   </p>

   <p>
    L'applicazione non è affiliata, approvata,
    certificata, sponsorizzata o distribuita dalla
    Federazione Italiana Rugby (FIR).
   </p>

   <h3>Dati e privacy</h3>

   <p>
    I dati vengono memorizzati localmente sul dispositivo.
   </p>

   <ul>
    <li>Nessun dato viene inviato a server dello sviluppatore.</li>
    <li>Nessun dato viene ceduto a terzi.</li>
    <li>Nessun dato viene utilizzato per profilazione.</li>
   </ul>

   <h3>Backup</h3>

   <p>
    L’utilizzatore è responsabile della conservazione
    dei backup esportati.
   </p>

   <h3>Limitazione di responsabilità</h3>

   <p>
    L'applicazione è fornita così com'è.
    Si raccomanda di verificare sempre i dati prodotti.
   </p>

   <h3>Contatti</h3>

   <p>
    Sviluppatore:<br>
    Vittorio Mavilla
   </p>

  </div>
 </div>`);

 document.querySelector('#privacyClose').onclick=()=>{
   document.querySelector('#privacyModal').remove();
 };
};	
 	m.querySelector('#dataImport').onchange=e=>{const f=e.target.files?.[0];if(f)importBackup(f)}}
 function addButton(){if(document.querySelector('#dataManagerBtn'))return;const nav=document.querySelector('nav');if(!nav)return;const b=document.createElement('button');b.id='dataManagerBtn';b.innerHTML='💾<small>Backup</small>';b.onclick=openManager;nav.style.gridTemplateColumns='repeat(5,1fr)';nav.appendChild(b)}
 addEventListener('load',addButton);setTimeout(addButton,200);window.RUGBY_BACKUP={open:openManager,export:downloadBackup};
})();
