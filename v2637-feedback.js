'use strict';
(function(){
 let busy=0;
 function box(){let e=document.querySelector('#v2637Busy');if(e)return e;document.body.insertAdjacentHTML('beforeend','<div id="v2637Busy" class="v2637-busy" hidden role="status"><div class="v2637-busy-card"><span class="v2637-spinner"></span><strong id="v2637BusyText">Elaborazione in corso...</strong><small>Attendi, non premere nuovamente.</small></div></div>');return document.querySelector('#v2637Busy')}
 function show(t){busy++;const e=box();e.querySelector('strong').textContent=t;e.hidden=false}
 function hide(){busy=Math.max(0,busy-1);if(!busy)box().hidden=true}
 const paint=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 async function run(t,fn){show(t);await paint();try{return await fn()}finally{hide()}}
 const h=window.importHomePdf;if(typeof h==='function')window.importHomePdf=e=>run('Lettura lista FIR della squadra...',()=>h(e));
 const a=window.importAwayPdf;if(typeof a==='function')window.importAwayPdf=e=>run('Lettura lista FIR avversaria...',()=>a(e));
 const o=window.ocrAway;if(typeof o==='function')window.ocrAway=e=>run('Analisi immagine e riconoscimento giocatori...',()=>o(e));
 window.RUGBY_BUSY={show,hide,run};
 try{page='setup';setup();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.p==='setup'))}catch(e){}
})();
