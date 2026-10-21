'use strict';
// v26.2.0: corregge sia la rosa preparata sia la copia usata dalla partita in corso.
const V2620_STARTER_NUMBER={E:'15',AD:'14',CS:'13',CD:'12',AS:'11',MA:'10',MM:'9','3C':'8','3S':'7','3D':'6','2S':'5','2D':'4',PD:'3',T:'2',PS:'1'};
function v2620Normalize(list){
 return (list||[]).map(p=>{
  const role=String(p.role||'').trim().toUpperCase(),expected=V2620_STARTER_NUMBER[role];
  if(expected&&(p.status==='FIELD'||p.status==='TEMP_IN'))return{...p,number:expected};
  return p
 })
}
// Corregge la rosa della preparazione.
if(S?.homeRoster?.length)S.homeRoster=v2620Normalize(S.homeRoster);
// Corregge soprattutto la copia gia presente nel tabellone aperto.
if(S?.draft?.homePlayers?.length)S.draft.homePlayers=v2620Normalize(S.draft.homePlayers);
// Corregge anche eventuali partite salvate solo nella formazione, senza modificare eventi e punteggi.
if(S?.matches?.length)S.matches=S.matches.map(m=>({...m,homePlayers:v2620Normalize(m.homePlayers)}));
save();
// Ogni nuova importazione FIR viene normalizzata prima del salvataggio.
const v2620ParseFirBase=parseFir;
parseFir=function(text){const r=v2620ParseFirBase(text);r.players=v2620Normalize(r.players);return r};
