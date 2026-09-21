import {LEVELS} from './world.mjs';
import {FLOODGATE_NOTES} from './floodgate-content.mjs';
/* Session-local, acquired text only. Hints cannot overwrite the latest clue.
 * This is not a new save schema, unearned codex or persistent mission reward. */
export function createReadingLog(limit=12){
 let entries=[];
 return {
  add(value){if(!value?.text)return;const item={title:String(value.title||'Field message'),text:String(value.text),persistent:!!value.persistent,chapter:value.chapter||null};entries=entries.filter(e=>e.text!==item.text||e.chapter!==item.chapter);entries.push(item);while(entries.length>limit){const disposable=entries.findIndex(e=>!e.persistent);entries.splice(disposable<0?0:disposable,1);}},
  latest(){const item=entries.at(-1);return item?{...item}:null;},
  clue(){const item=entries.findLast(e=>e.persistent);return item?{...item}:null;},
  clear(){entries=[];},size:()=>entries.length
 };
}

export function restoredReading(state){
 const note=state.level==='district'?FLOODGATE_NOTES.find(n=>n.id===state.fieldNotes?.at(-1)):null;
 if(note)return {title:note.title,text:note.author+'\n\n'+note.text,persistent:true,chapter:state.level};
 const clue=state.puzzle?.clueRead?LEVELS[state.level]?.puzzle?.clue:null;
 return clue?{title:clue.label,text:clue.text,persistent:true,chapter:state.level}:null;
}
