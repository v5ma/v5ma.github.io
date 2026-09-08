/* Local activity state; all decisions validate location/floor/prerequisites.
 * Rewards are one-time per authored encounter, independent of the old quests. */
import {STREET_SITES,STREET_JOBS,STREET_MAP,JOB_MAP} from './street-data.mjs';
import {roomAt,done,stats,notify} from './life-core.mjs';
export {STREET_SITES,STREET_JOBS,STREET_MAP,JOB_MAP};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),validInt=(v,max)=>Number.isInteger(v)&&v>=0&&v<=max;
export function streetState(raw){
 const s={version:1,progress:{},done:[],discovered:[],choices:{},clock:0,tracked:null,sequence:[],sequenceJob:null,lastPrompt:null};
 if(!raw||raw.version!==1)return s;
 for(const j of STREET_JOBS)if(validInt(raw.progress?.[j.id],j.sites.length))s.progress[j.id]=raw.progress[j.id];
 if(Array.isArray(raw.done))s.done=[...new Set(raw.done.filter(id=>JOB_MAP.has(id)))];
 for(const id of s.done)s.progress[id]=JOB_MAP.get(id).sites.length;
 if(Array.isArray(raw.discovered))s.discovered=[...new Set(raw.discovered.filter(id=>STREET_MAP.has(id)))];
 if(validInt(raw.clock,100000000))s.clock=raw.clock;
 if(JOB_MAP.has(raw.tracked))s.tracked=raw.tracked;
 for(const j of STREET_JOBS)if(j.kind==='palette'&&j.options.includes(raw.choices?.[j.id]))s.choices[j.id]=raw.choices[j.id];
 return s;
}
export function streetSave(s){return {version:1,progress:{...s.progress},done:[...s.done],discovered:[...s.discovered],choices:{...s.choices},clock:Math.floor(s.clock),tracked:s.tracked};}
export function available(s,j){return !j.requires||(j.requires==='lantern'?s.life.flags.lantern:j.requires==='partner'?!!s.life.partner:done(s.life,j.requires));}
export function currentSite(s,j){return STREET_MAP.get(j.sites[Math.min(s.street.progress[j.id]||0,j.sites.length-1)]);}
export function inSpace(s,w,p){return (s.life.inside||null)===(p.inside||null)&&(!p.room||roomAt(s,w)?.id===p.room)&&(!p.garden||s.life.flags.garden);}
export function nearby(s,w){if(Math.abs(s.speed)>1.7)return null;return STREET_SITES.filter(p=>inSpace(s,w,p)&&distance(p,s)<3).sort((a,b)=>distance(a,s)-distance(b,s))[0]||null;}
export function eligibleAt(s,site){return STREET_JOBS.filter(j=>currentSite(s,j).id===site.id&&!s.street.done.includes(j.id));}
export function streetTarget(s){const j=JOB_MAP.get(s.street.tracked);return j&&!s.street.done.includes(j.id)?{...currentSite(s,j),job:j.title}:null;}
export function stepStreet(s,w,dt){
 if(!s.street)s.street=streetState();s.street.clock+=dt;
 for(const p of STREET_SITES)if(inSpace(s,w,p)&&distance(p,s)<14&&!s.street.discovered.includes(p.id))s.street.discovered.push(p.id);
}
function finish(s,j){
 if(s.street.done.includes(j.id))return false;
 s.street.done.push(j.id);s.street.progress[j.id]=j.sites.length;s.street.sequence=[];s.street.sequenceJob=null;
 s.life.xp+=j.xp;s.credits+=j.coins;if(j.id==='tonic')s.health=stats(s).maxHealth;
 notify(s,`${j.title} / +${j.xp} XP / +${j.coins} florins. ${j.result}`,'street-complete',{id:j.id});return true;
}
export function work(s,w,jobId,action){
 const j=JOB_MAP.get(jobId);if(!j)return {ok:false,text:'Unknown neighbourhood activity.'};
 if(s.street.done.includes(j.id))return {ok:false,text:'Already completed. Its reward is not repeatable.'};
 const p=currentSite(s,j);
 if(s.mode!=='foot'||Math.abs(s.speed)>1.7||!inSpace(s,w,p)||distance(s,p)>3.1)return {ok:false,text:'Stop, dismount and approach this activity on its correct floor.'};
 if(!available(s,j))return {ok:false,text:'An earlier artisan commission, Lantern, or an existing relationship is needed. The original story remains available.'};
 const n=s.street.progress[j.id]||0,last=n===j.sites.length-1;
 if(!last){
  if(action!=='continue')return {ok:false,text:'Use the current delivery, collection or observation action.'};
  s.street.progress[j.id]=n+1;s.street.tracked=j.id;
  const next=currentSite(s,j),clue=j.clues?.[p.id];notify(s,(clue?clue+' ':'')+'Next: '+next.name,'street-stage',{id:j.id,stage:n+1});return {ok:true,text:s.toast};
 }
 if(j.kind==='lantern'){
  if(action!=='read'||s.life.aura<=0)return {ok:false,text:'Cast Lantern nearby before reading the invisible ink.'};
 }else if(j.kind==='palette'){
  if(!j.options.includes(action))return {ok:false,text:'Choose one of the three display palettes.'};
  s.street.choices[j.id]=action;
 }else if(j.answer){
  if(action==='reset'){s.street.sequence=[];s.street.sequenceJob=j.id;return {ok:true,text:'Attempt reset. No materials or money lost.'};}
  if(!j.options.includes(action))return {ok:false,text:'Use one of the marked controls.'};
  if(s.street.sequenceJob!==j.id){s.street.sequence=[];s.street.sequenceJob=j.id;}
  s.street.sequence.push(action);
  if(j.answer[s.street.sequence.length-1]!==action){s.street.sequence=[];return {ok:false,text:'That does not match the clue. Try again; nothing was charged.'};}
  if(s.street.sequence.length<j.answer.length)return {ok:true,text:s.street.sequence.join(' / ')+' ...'};
 }else if(action!=='continue')return {ok:false,text:'Confirm the current activity.'};
 finish(s,j);return {ok:true,finished:true,text:s.toast};
}
export function notes(s){return STREET_JOBS.filter(j=>s.street.done.includes(j.id)).map(j=>({title:j.title,text:j.result,choice:s.street.choices[j.id]||null}));}
