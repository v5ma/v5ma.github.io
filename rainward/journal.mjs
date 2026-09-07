import {CURRENT,LEVELS,dist} from './world.mjs';
import {puzzleHint,puzzleRows} from './puzzle-guide.mjs';
/* Native DOM, keyboard and gamepad buttons; no dynamic HTML from saved data. */
export function createJournal(getState){
 const host=document.getElementById('map-panel'),old=document.getElementById('puzzle-journal');
 const panel=document.createElement('section');panel.id='puzzle-assistance';panel.setAttribute('aria-label','Puzzle notebook');
 panel.innerHTML='<div class="journal-heading"><strong>FIELD NOTEBOOK</strong><span id="clue-status"></span></div><div id="journal-controls"></div><p id="puzzle-hint-text" role="status"></p><div class="journal-buttons"><button id="puzzle-hint">Hint 1 · Find the clue</button><button id="puzzle-reset-hints">Hide hints</button></div><small>Hints explain the puzzle. They do not turn controls or solve it for you.</small>';
 old.after(panel);let tier=0,lastState=null;
 const button=panel.querySelector('#puzzle-hint'),text=panel.querySelector('#puzzle-hint-text'),rows=panel.querySelector('#journal-controls');
 function update(){const s=getState(),def=LEVELS[s.level]?.puzzle;if(lastState!==s){tier=0;lastState=s;}panel.hidden=!def;old.hidden=!def;if(!def)return;
  const status=document.getElementById('clue-status');status.textContent=s.puzzle.solved?'ROUTE OPEN':s.puzzle.clueRead?'INSCRIPTION RECORDED':'CLUE NOT READ';
  old.textContent=s.puzzle.clueRead?def.clue.text:'Clue location: '+(def.clueLocation||'Western archive entrance, near the garden. Approach the lit plaque and press E / Y.');
  rows.replaceChildren();for(const r of puzzleRows(def,s.puzzle)){const item=document.createElement('div');item.className='journal-control';const title=document.createElement('span'),value=document.createElement('b');title.textContent=r.number+' · '+r.label;value.textContent=r.value;item.append(title,value);rows.append(item);}
  text.textContent=tier?puzzleHint(def,s.puzzle,tier):'Stuck? Reveal hints one at a time, or explore without them.';
  button.disabled=s.puzzle.solved||tier>=3;button.textContent=tier===0?'Hint 1 · Find the clue':tier===1?'Hint 2 · Understand it':tier===2?'Hint 3 · Show the solution':'Solution shown';
 }
 button.onclick=()=>{tier=Math.min(3,tier+1);update();};panel.querySelector('#puzzle-reset-hints').onclick=()=>{tier=0;update();};
 return {update};
}
