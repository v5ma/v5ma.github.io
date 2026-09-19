/* Presentation of actual game output only; never reveals an unread clue. */
import {LEVELS} from './world.mjs';
import {FLOODGATE_NOTES} from './floodgate-content.mjs';
export function readingPages(text,width=46,linesPerPage=13){
 const lines=[];
 for(const paragraph of String(text||'').replace(/\r/g,'').split('\n')){
  if(!paragraph.trim()){lines.push('');continue;}let line='';
  for(let word of paragraph.trim().split(/\s+/)){
   if(line&&(line+' '+word).length>width){lines.push(line);line='';}
   while(word.length>width){if(line){lines.push(line);line='';}lines.push(word.slice(0,width));word=word.slice(width);}
   if(word)line+=(line?' ':'')+word;
  }if(line)lines.push(line);
 }
 const pages=[];for(let i=0;i<lines.length;i+=linesPerPage)pages.push(lines.slice(i,i+linesPerPage));return pages.length?pages:[['']];
}
export function interactionReading(state,target,accepted){
 const text=String(state.hint||'').trim();if(!text)return null;
 const clue=accepted&&target?.kind==='clue'&&state.puzzle?.clueRead;
 const note=accepted&&target?.kind==='field-note'&&state.fieldNotes?.includes(target.id)?FLOODGATE_NOTES.find(n=>n.id===target.id):null;
 return {title:note?.title||target?.label||'Field message',text:clue?LEVELS[state.level].puzzle.clue.text:note?note.author+'\n\n'+note.text:text,
  persistent:!!clue||!!note,chapter:state.level};
}
