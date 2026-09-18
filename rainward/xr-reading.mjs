/* Presentation of actual game output only; never reveals an unread clue. */
import {LEVELS} from './world.mjs';
export function readingPages(text,width=58,linesPerPage=16){
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
 return {title:target?.label||'Field message',text:clue?LEVELS[state.level].puzzle.clue.text:text,
  persistent:!!clue||accepted&&['field-note','note'].includes(target?.kind),chapter:state.level};
}
