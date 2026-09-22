/* Read-only help and real-time notices. No progression or expedition storage. */
import {goalGuide} from './goal-guide.mjs';
import {BELL_TASK,bellProgress} from './bellwether-world.mjs';
export const NOTICE_MS=2000;
export function noticeAlpha(notice,now){
 if(!notice||!Number.isFinite(now)||!Number.isFinite(notice.started))return 0;
 const age=Math.max(0,now-notice.started);return age<1500?1:Math.max(0,1-(age-1500)/500);
}
export function createNoticeFeed(){
 let serial=0,current=null;const entries=[];
 return {push(text,now){if(!String(text||'').trim()||!Number.isFinite(now))return;current={id:++serial,text:String(text),started:now};entries.push({...current});if(entries.length>40)entries.shift();},dismiss(){current=null;},current:()=>current?{...current}:null,history:()=>entries.map(e=>({...e}))};
}
export function readingPages(text,limit=260){
 const pages=[];let line='';for(const word of String(text||'').trim().split(/\s+/)){if(line&&(line+' '+word).length>limit){pages.push(line);line='';}line+=(line?' ':'')+word;}if(line)pages.push(line);return pages.length?pages:['No messages yet.'];
}
export function fieldGuidance(s,near,use='Right grip'){
 const goal=goalGuide(s),p=s.p;let step='Follow the gold diamond. It marks a destination, not a route through walls.';
 if(goal?.id==='dispatch-board')step="Walk to Iona's noticeboard on Arrival Quay. When its name appears below, press "+use+" to take the dispatch. No weapon purchase is needed.";
 if(s.expedition.tracked==='dispatch'&&s.expedition.flags.includes('dispatch-started'))step='Take the dispatch west across the long stair to Bellwether Market. Use its notice office to deliver it.';
 if(s.expedition.tracked===BELL_TASK.id)step=bellProgress(s)+'. '+(s.bellwether.stage===2?'Turn the three Arcade dials to 2, 1, 3, then use Test.':s.bellwether.stage===3?'The service ascent is a walking route; rails are optional.':s.bellwether.stage===4?'Use the windbreak for shelter. The east gallery is a retreat, not a reset.':'Follow the gold destination; use the named desk or mechanism when close.');
 if(p.climb)step='Left stick up/down climbs. A jumps clear. Continue to the landing before stepping away.';
 else if(p.rail)step='Left stick controls speed and braking. A releases the rail. The map still follows your real position.';
 else if(p.ride)step='Stay aboard to reach the landing. A jumps clear; the map follows this crossing.';
 else if(p.gliding)step='Left stick steers and brakes the Foldwing. Look for a landing or rail. Touch A folds it; Xbox B folds it.';
 let interaction=String(near?.label||'').replace(/^(?:X\s*\/\s*)?E\s*(?:[.:\-]|\u00b7)?\s*/i,'').replace(/^X\s*\/\s*E\s*-?\s*/i,'');
 if(near?.type==='rail'||near?.type==='exp-ride')interaction='';
 return {goal,step,interaction:interaction?use+' / '+interaction:'Move closer to a named object to interact.',interactionId:near?.id||null,canInteract:!!interaction,use};
}
/* Goal stays on the local map edge when beyond its range. Not pathfinding. */
export function localMapPoint(p,target,range=45,edge=.88){
 const x=(target.x-p.x)/range,z=(target.z-p.z)/range,k=Math.max(1,Math.abs(x)/edge,Math.abs(z)/edge);
 return {x:x/k,z:z/k,offMap:k>1};
}
