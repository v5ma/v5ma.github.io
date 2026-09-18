import {LEVELS,findPath,dist} from './world.mjs';
import {tasksFor,taskReady,taskDone} from './field-tasks.mjs';
/* Recommendation follows prerequisites. It never changes quest state. */
export function nextGoal(state){
 const d=LEVELS[state.level];if(!d)return null;
 const objective=kind=>{const item=d.items.find(i=>i.objective===kind);return item?{...item,title:item.label,reason:'Required component'}:null;};
 if(!state.objectives.cell)return objective('cell');
 const task=tasksFor(state).find(t=>t.required&&!taskDone(state,t.id)&&taskReady(state,t));if(task)return {...task,reason:'Required field work'};
 if(state.puzzle&&!state.puzzle.solved){if(!state.puzzle.clueRead)return {...d.puzzle.clue,title:d.puzzle.clue.label,reason:'Learn the mechanism before changing it'};const i=state.puzzle.wheels.findIndex((v,i)=>v!==d.puzzle.targets[i]);if(i>=0)return {...d.puzzle.wheels[i],title:d.puzzle.wheels[i].label,reason:'Set the control using the recorded diagram'};}
 if(!state.objectives.crank)return objective('crank');return {...d.exit,id:'exit',title:d.exit.name,reason:'Extraction'};
}
export function goalRoute(state){const goal=nextGoal(state);return {goal,path:goal?findPath(state.player,goal):[]};}
export function drawGoal(g,state,projection){const {goal,path}=goalRoute(state);if(!goal)return;g.save();g.strokeStyle='#ffe29b';g.lineWidth=2.5;g.setLineDash([7,5]);g.beginPath();g.moveTo(projection.x(state.player.x),projection.z(state.player.z));for(const p of path)g.lineTo(projection.x(p.x),projection.z(p.z));g.stroke();g.setLineDash([]);g.fillStyle='#ffe29b';g.beginPath();g.arc(projection.x(goal.x),projection.z(goal.z),7,0,Math.PI*2);g.fill();g.strokeStyle='#172c26';g.lineWidth=2;g.stroke();g.font='bold 12px Arial';g.textAlign='center';g.fillText('NEXT',projection.x(goal.x),projection.z(goal.z)-12);g.restore();}
export function goalText(state){const goal=nextGoal(state);return goal?'NEXT: '+goal.title+' / '+Math.round(dist(state.player,goal))+' m / '+goal.reason:'Explore the expedition.';}
