import {restore,checkpoint} from './state.mjs';
import {LEVELS} from './world.mjs';
export const CHAPTER_SAVE='svgn.rainward.v2.chapter-checkpoints';
export const BACKUP_SAVE='svgn.rainward.v2.chapter-checkpoints.backup';
export const LEGACY_SAVE='svgn.rainward.v1.checkpoint';
const names=Object.keys(LEVELS);
const empty=()=>({version:1,active:null,slots:{}});
function decode(raw){
 if(typeof raw!=='string'||raw.length>200000)return null;
 try{const d=JSON.parse(raw);if(d.version!==1||!d.slots||typeof d.slots!=='object'||Array.isArray(d.slots))return null;const bank=empty();
  for(const id of names){if(!Object.hasOwn(d.slots,id))continue;const entry=d.slots[id],state=restore(entry?.checkpoint,false);if(!state||state.level!==id)return null;bank.slots[id]={checkpoint:entry.checkpoint,savedAt:Number.isFinite(entry.savedAt)&&entry.savedAt>=0?entry.savedAt:0};}
  bank.active=Object.hasOwn(bank.slots,d.active)?d.active:Object.keys(bank.slots)[0]||null;return bank;
 }catch{return null;}
}
export function createCheckpointStore(read,write,now=Date.now){
 let bank=empty(),recovered=false,notice='';
 function refresh(){const raw=read(CHAPTER_SAVE),primary=decode(raw),backup=decode(read(BACKUP_SAVE));recovered=!!raw&&!primary&&!!backup;bank=primary||backup||empty();notice=recovered?'Recovered the previous chapter save bank.':raw&&!primary?'Chapter save data could not be read. Valid legacy data remains available.':'';
  const legacy=read(LEGACY_SAVE),state=restore(legacy,false);if(state&&!Object.hasOwn(bank.slots,state.level)){bank.slots[state.level]={checkpoint:legacy,savedAt:0};if(!bank.active)bank.active=state.level;}return entries();
 }
 function get(id){return Object.hasOwn(bank.slots,id)?bank.slots[id].checkpoint:null;}
 function latest(){return bank.active?get(bank.active):null;}
 function entries(){return names.map(id=>{const entry=bank.slots[id],s=entry&&restore(entry.checkpoint,false);return {id,title:LEVELS[id].title,occupied:!!s,savedAt:entry?.savedAt||0,health:s?.player.hp||0,shelter:s?LEVELS[id].shelters.find(x=>x.id===s.checkpoint)?.name:'No shelter recorded',tasks:s?.completedTasks.length||0,seconds:s?.stats.seconds||0,active:id===bank.active};});}
 function save(state){const raw=checkpoint(state),valid=restore(raw,false);if(!valid)return {ok:false,message:'This checkpoint is not valid. Previous saves are unchanged.'};refresh();const candidate={...bank,active:state.level,slots:{...bank.slots,[state.level]:{checkpoint:raw,savedAt:now()}}};const before=JSON.stringify(bank),serialized=JSON.stringify(candidate);
  // A primary write is atomic for one localStorage key. The backup is best effort.
  const backed=write(BACKUP_SAVE,before);if(!write(CHAPTER_SAVE,serialized))return {ok:false,message:'Storage is full or unavailable. Previous shelter saves remain unchanged; keep this tab open.'};bank=candidate;recovered=false;const mirrored=write(LEGACY_SAVE,raw);notice=!backed?'Chapter saved; backup could not be refreshed.':!mirrored?'Chapter saved; the legacy mirror could not be refreshed.':'';return {ok:true,message:notice||'Shelter saved for '+LEVELS[state.level].title+'. Other chapter saves are safe.'};
 }
 refresh();return {get,latest,entries,save,refresh,get notice(){return notice;},get recovered(){return recovered;}};
}
