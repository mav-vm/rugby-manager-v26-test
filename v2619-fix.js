'use strict';
// v26.1.9: normalizza il numero dei 15 titolari FIR dal ruolo ufficiale.
const V2619_STARTER_NUMBER={E:'15',AD:'14',CS:'13',CD:'12',AS:'11',MA:'10',MM:'9','3C':'8','3S':'7','3D':'6','2S':'5','2D':'4',PD:'3',T:'2',PS:'1'};
function v2619NormalizeFirPlayers(players){return (players||[]).map(p=>{const role=String(p.role||'').toUpperCase(),expected=V2619_STARTER_NUMBER[role];if(p.status==='FIELD'&&expected)return{...p,number:expected};return p})}
const v2619ParseFirBase=parseFir;
parseFir=function(text){const result=v2619ParseFirBase(text);result.players=v2619NormalizeFirPlayers(result.players);return result};
// Corregge anche una rosa gia caricata in memoria; il salvataggio avviene senza toccare storico o partita in corso.
if(S?.homeRoster?.length){S.homeRoster=v2619NormalizeFirPlayers(S.homeRoster);save()}
