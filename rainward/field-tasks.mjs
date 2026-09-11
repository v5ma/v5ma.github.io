/* Task logic contains no DOM or timers. Rewards are granted once and recorded
 * with the existing shelter save, including dependency validation on restore. */
import {LEVELS,dist,obstruction,heightAt} from './world.mjs';
export const tasksFor=s=>LEVELS[s.level]?.tasks||[];
export const taskDone=(s,id)=>(s.completedTasks||[]).includes(id);
export function taskReady(s,t){return (t.requires||[]).every(r=>r==='puzzle'?!!s.puzzle?.solved:r.startsWith('task:')?taskDone(s,r.slice(5)):s.objectives[r]===true);}
export const requiredTasksDone=s=>tasksFor(s).filter(t=>t.required).every(t=>taskDone(s,t.id));
export function taskTarget(s){return tasksFor(s).filter(t=>!taskDone(s,t.id)&&dist(t,s.player)<1.9&&!obstruction({x:t.x,y:heightAt(t.x,t.z)+.9,z:t.z},{x:s.player.x,y:heightAt(s.player.x,s.player.z)+.9,z:s.player.z})).sort((a,b)=>dist(a,s.player)-dist(b,s.player))[0]||null;}
export function taskBlockReason(s,t){return (t.requires||[]).filter(r=>r==='puzzle'?!s.puzzle?.solved:r.startsWith('task:')?!taskDone(s,r.slice(5)):!s.objectives[r]).map(r=>r==='puzzle'?'open the puzzle gate':r.startsWith('task:')?'complete '+tasksFor(s).find(v=>v.id===r.slice(5))?.title:'recover '+LEVELS[s.level].objectiveNames[r]).join('; ');}
export function completeTask(s,id){const t=tasksFor(s).find(t=>t.id===id);if(!t||s.status!=='playing'||s.player.craft||taskDone(s,id)||!taskReady(s,t)||taskTarget(s)?.id!==id)return false;s.completedTasks.push(id);
 for(const [key,amount]of Object.entries(t.reward||{})){const k=key==='ammo'?'reserve':key==='health'?'hp':key,cap=k==='reserve'?36:k==='hp'?100:12;s.player[k]=Math.min(cap,s.player[k]+amount);}if(s.trackedTask===id)s.trackedTask=null;return true;}
export function trackedTask(s){const available=tasksFor(s).filter(t=>!taskDone(s,t.id));return available.find(t=>t.id===s.trackedTask)||available.find(t=>t.required&&taskReady(s,t))||null;}
export function validTaskSave(def,ids,objectives,puzzle){if(!Array.isArray(ids)||ids.length>(def.tasks||[]).length||new Set(ids).size!==ids.length||ids.some(id=>!def.tasks?.some(t=>t.id===id)))return false;
 return ids.every(id=>def.tasks.find(t=>t.id===id).requires?.every(r=>r==='puzzle'?!!puzzle?.solved:r.startsWith('task:')?ids.includes(r.slice(5)):objectives[r]===true)??true);}
