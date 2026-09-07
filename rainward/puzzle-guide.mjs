/* Pure presentation and puzzle rules. Asking for help never turns a wheel,
 * grants an objective, advances time or changes the gate. */
export function puzzleSolved(def,values){return !!def&&Array.isArray(values)&&values.length===def.targets.length&&values.every((v,i)=>v===def.targets[i]);}
export function turnPuzzle(def,values,index){
 if(!Number.isInteger(index)||index<0||index>=def.wheels.length)throw Error('Unknown puzzle control');
 const next=[...values];
 if(def.mode==='linked'){for(const j of def.links[index])next[j]=(next[j]+1)%def.symbols.length;}
 else next[index]=(next[index]+1)%def.symbols.length;
 return next;
}
export function puzzleHint(def,state,level){
 if(!def||!state)return '';
 if(state.solved)return 'Route open. Recover both expedition objects and follow the exit marker.';
 if(def.mode==='linked'&&level>=3){const todo=[{v:[...state.wheels],path:[]}],seen=new Set();while(todo.length){const q=todo.shift(),k=q.v.join();if(seen.has(k))continue;seen.add(k);if(puzzleSolved(def,q.v))return 'From the CURRENT displayed circuits, use '+q.path.map(i=>def.wheels[i].label).join(' → ')+'. The target is SIGNALS ON / FLOODED PUMP OFF / PLATFORM ON. This hint does not operate any breaker.';for(let i=0;i<def.wheels.length;i++)todo.push({v:turnPuzzle(def,q.v,i),path:[...q.path,i]});}}
 if(def.hints)return def.hints[Math.max(0,Math.min(2,level-1))];
 const hints=[
  'Find the western archive entrance beside the garden. The illuminated inscription is just inside the entrance. Press E / Y to read it.',
  'Read the inscription from the garden toward the north. First means Garden wheel, second means Archive wheel, last means Deep wheel. Each press changes ONE wheel.',
  'Set 1 · Garden to SUN, 2 · Archive to LEAF, and 3 · Deep to WAVE. Press E / Y beside each wheel until its displayed symbol matches. The gate opens automatically.'
 ];return hints[Math.max(0,Math.min(2,level-1))];
}
export function puzzleRows(def,state){return def.wheels.map((w,i)=>({number:i+1,label:def.circuitNames?.[i]||w.label,value:def.symbols[state.wheels[i]],matched:state.wheels[i]===def.targets[i]}));}
export function guideTarget(def,state){if(!def||!state||state.solved)return null;return state.clueRead?def.wheels[0]:def.clue;}
