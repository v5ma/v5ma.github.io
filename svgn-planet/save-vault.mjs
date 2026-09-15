/* Recoverable transactions over the original v1 slot. No other game's keys. */
import {readSave,SAVE_KEY,LEGACY_SAVE_KEY} from './model.mjs';
export const VAULT_KEYS=Object.freeze({main:SAVE_KEY,backup:SAVE_KEY+'.backup',pending:SAVE_KEY+'.pending',quarantine:SAVE_KEY+'.unreadable'});
export function validSave(raw){return typeof raw==='string'&&raw.length<=64000&&!!readSave(raw);}
export function createSaveVault(getStorage){
 let status='Not saved yet.',blocked=false,quarantine=null;
 const storage=()=>typeof getStorage==='function'?getStorage():getStorage;
 const get=k=>storage().getItem(k),put=(k,v)=>{storage().setItem(k,v);if(get(k)!==v)throw new Error('The browser did not retain the write.');};
 function load(){
  try{
   const main=get(VAULT_KEYS.main);
   if(validSave(main)){status='Progress loaded on this device.';return readSave(main);}
   if(main){quarantine=main;let future=false;try{future=JSON.parse(main)?.v>1;}catch{}if(future){blocked=true;status='This save uses a newer format. Automatic saving is disabled; export it before changing anything.';return null;}}
   for(const [key,label]of [[VAULT_KEYS.pending,'interrupted save'],[VAULT_KEYS.backup,'last good backup'],[LEGACY_SAVE_KEY,'original save']]){const raw=get(key);if(validSave(raw)){status='Recovered your '+label+'.';return readSave(raw);}}
   blocked=!!main||!!get(VAULT_KEYS.pending)||!!get(VAULT_KEYS.backup);
   status=blocked?'Unreadable progress was retained. Automatic saving is disabled. Use Save recovery to import a valid save or explicitly start fresh.':'New route. Saving is available.';
  }catch{blocked=true;status='Storage is unavailable. Automatic saving is disabled. Keep this page open and export your progress.';}
  return null;
 }
 function commit(raw,{explicit=false}={}){
  if(!validSave(raw)){status='Save rejected: invalid or unsupported v1 data.';return false;}
  if(blocked&&!explicit)return false;
  try{
   if(quarantine!==null){put(VAULT_KEYS.quarantine,quarantine);quarantine=null;}
   const old=get(VAULT_KEYS.main);
   if(old===raw){status='Progress saved on this device.';blocked=false;return true;}
   if(validSave(old))put(VAULT_KEYS.backup,old);
   put(VAULT_KEYS.pending,raw);
   put(VAULT_KEYS.main,raw);
   // A cleanup failure does not invalidate the verified primary write.
   try{storage().removeItem(VAULT_KEYS.pending);}catch{}
   blocked=false;status='Progress saved on this device; recovery copy retained.';return true;
  }catch{status='Save could not finish. Previous data was retained; export your current progress before closing.';return false;}
 }
 return {load,commit,backup(){try{const raw=get(VAULT_KEYS.backup);return validSave(raw)?raw:null;}catch{return null;}},original(){try{return get(VAULT_KEYS.main)||get(VAULT_KEYS.quarantine)||'';}catch{return '';}},inspect:()=>({status,blocked})};
}
export function mountSaveRecovery({vault,state,serialize,restore,open,resume,persist}){
 const button=document.createElement('button');button.id='open-save-recovery';button.textContent='Save recovery and export';document.querySelector('#reset').before(button);
 const dialog=document.createElement('dialog');dialog.id='save-dialog';dialog.setAttribute('aria-labelledby','save-title');
 dialog.innerHTML='<h2 id="save-title">Keep your neighborhood safe</h2><p id="vault-status" role="status"></p><button id="save-close" data-pad-default data-pad-back>Return to game</button><button id="save-now">Save now</button><button id="save-export">Export current progress</button><button id="save-original">Export stored original</button><button id="save-backup">Restore last good backup...</button><label for="save-text">Paste a v1 save to import. File selection and text entry use your browser.</label><textarea id="save-text" maxlength="64000" rows="4"></textarea><button id="save-import">Review imported save...</button><div id="save-confirm" hidden><p>Replace this route with the reviewed save? The current valid save becomes the recovery copy.</p><button id="save-cancel">Keep current progress</button><button id="save-accept">Replace with reviewed save</button></div>';
 document.body.append(dialog);const $=id=>document.getElementById(id);let pending=null;
 const message=text=>{$('vault-status').textContent=text||vault.inspect().status;};
 function reset(){pending=null;$('save-confirm').hidden=true;}
 function review(raw){reset();if(!validSave(raw)){message('No valid v1 save found. Nothing was replaced.');return;}pending=raw;const s=readSave(raw);message('Review: '+s.delivered.length+' deliveries and '+(s.jobs?.completed?.length||0)+' completed city jobs.');$('save-confirm').hidden=false;$('save-cancel').focus();}
 function download(raw,name){if(!raw){message('No stored data is available to export.');return;}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message('Export requested. Check your browser downloads.');}
 button.onclick=()=>{reset();$('save-text').value='';message();open('save-dialog');};$('save-close').onclick=resume;
 $('save-now').onclick=()=>{persist();message();};$('save-export').onclick=()=>download(JSON.stringify(serialize(state())),'neighborhood-progress.json');$('save-original').onclick=()=>download(vault.original(),'neighborhood-stored-original.json');
 $('save-backup').onclick=()=>review(vault.backup());$('save-import').onclick=()=>review($('save-text').value);$('save-cancel').onclick=()=>{reset();message('Current progress kept.');$('save-close').focus();};
 $('save-accept').onclick=()=>{if(!pending)return;if(vault.commit(pending,{explicit:true})){restore(readSave(pending));reset();resume();}else message();};
 dialog.addEventListener('close',reset);return {message};
}
