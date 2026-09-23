import {focusedTask} from './objective-focus.mjs';
import {goalGuide} from './goal-guide.mjs';
import {storyPurpose} from './story-core.mjs';
import {BELL_TASK,bellProgress} from './bellwether-world.mjs';
import {ROOFS,BEACON_TARGETS} from './rooftop-world.mjs';
import {TASKS,EXP_DISTRICTS,TRANSIT} from './expedition-world.mjs';
export function installExpeditionUI(api){
 const $=id=>document.getElementById(id),dialog=$('expedition-dialog'),body=$('expedition-tasks'),button=$('expedition-button'),hud=$('skyward-hud');
 function progress(s,t){const e=s.expedition,has=id=>e.flags.includes(id);if(has(t.flag))return 'Completed';if(t.id===BELL_TASK.id)return bellProgress(s);
  if(t.id==='roof-surveys')return ROOFS.filter(r=>has('survey-'+r.id)).length+' / 6 rooftop instruments';
  if(t.id==='roof-courier')return ['roof-parcel-gannet','roof-parcel-academy','roof-parcel-dawn'].filter(has).length+' / 3 parcels';
  if(t.id==='roof-beacons')return 'Theatre / Stormglass / Solstice: '+e.beaconDials.join(', ')+' / required '+BEACON_TARGETS.join(', ');
  if(t.id==='charter')return ['charter-market','charter-academy','charter-dawn'].filter(has).length+' / 3 leaves'+(has('archive-open')?' - archive open':'');
  if(t.id==='districts')return e.visited.length+' / 7 streets visited';
  if(t.id==='summits')return ['survey-archive','survey-dawn','survey-solstice'].filter(has).length+' / 3 upper galleries';
  if(t.id==='routes')return e.routes.length+' / 3 travel modes: '+(e.routes.join(', ')||'none yet');
  if(t.id==='weather')return 'Valve dials: '+e.valves.join(', ')+' / required 1, 3, 2';
  if(t.id==='defense'&&e.defense.active)return 'Wave '+Math.max(1,e.defense.wave+1)+' / 3 - '+Math.floor(e.defense.time)+' seconds';
  if(t.id==='rescue'&&e.escort.active)return 'Lio follows within 13 m; nearby hostiles stop the escort.';
  return 'Open adventure';
 }
 function stock(){const s=api.state(),e=s.expedition;body.replaceChildren();let done=0;
  for(const t of TASKS){const complete=e.flags.includes(t.flag);if(complete)done++;const a=document.createElement('article');a.className=complete?'complete':focusedTask(s)?.id===t.id?'tracked':'';const title=document.createElement('h3');title.textContent=t.name;const p=document.createElement('p');p.textContent=t.description;const status=document.createElement('div');status.className='task-progress';status.textContent=progress(s,t);const b=document.createElement('button');b.dataset.track=t.id;b.textContent=complete?'COMPLETED - '+t.reward+' CREDITS':focusedTask(s)?.id===t.id?(e.tracked===t.id?'TRACKING - ':'NEXT SUGGESTED - ')+t.reward+' CREDITS':'Track adventure - '+t.reward+' credits';b.disabled=complete;b.onclick=()=>{e.tracked=t.id;api.persist();stock();};const why=document.createElement('p');why.className='task-story';why.textContent='Why it matters: '+storyPurpose(t.id);a.append(title,p,why,status,b);body.append(a);}
  $('expedition-summary').textContent=(api.notice?.()?.text?api.notice().text+' ':'')+done+' / '+TASKS.length+' adventures complete. '+e.visited.length+' / '+EXP_DISTRICTS.length+' new districts explored. Rewards are earned once and saved on this device.';
  const goal=goalGuide(s);$('expedition-route').textContent=goal?'Next tracked destination: '+goal.name+' / '+goal.direction+' / '+goal.level+'. The map marks it with a gold diamond.':'';
 }
 function open(fromPause=false){if(!api.playing()||(api.paused()&&!fromPause))return;stock();api.show('expedition-dialog');}
 button.onclick=open;
 function action(name){if(name!=='journal')return false;open();return true;}
 function effect(e){if(e.type==='expedition-open'){stock();api.show('expedition-dialog');}if(e.type==='expedition-message')api.toast(e.text,7);if(e.type==='expedition-complete')api.toast('ADVENTURE COMPLETE: '+e.name+' - '+e.credits+' earned credits.',7);if(e.type==='expedition-arrive')api.toast(e.name+' has arrived. Your crossing is recorded in the traveler\'s passport.',5);if(e.type==='expedition-board')api.toast('Passenger transit underway. Look around freely. Space jumps clear; stay aboard for a complete journey.',5);}
 let last='';function update(){button.hidden=!api.playing();hud.hidden=!api.playing()||api.paused();if(hud.hidden)return;const s=api.state(),e=s.expedition,t=focusedTask(s),goal=goalGuide(s),completed=TASKS.filter(t=>e.flags.includes(t.flag)).length;
  let title=t?.name||'Skyward Dispatch',detail=goal?(goal.direction+' / '+goal.distance+' m / '+goal.level+' - '+goal.name):'Explore the open city';
  if(s.p.ride){const r=TRANSIT.find(r=>r.id===s.p.ride.id),c=e.transits.find(c=>c.id===r.id);title=r.name;detail='In transit - '+Math.ceil(Math.abs(c.target-c.t)*r.seconds)+' seconds to landing';}
  else if(e.defense.active){title='SOLSTICE WAVE '+Math.max(1,e.defense.wave+1)+' / 3';detail=s.drones.filter(b=>b.wave===e.defense.wave&&b.hp>0).length+' boarding troops remain - hold the observatory';}
  else if(e.escort.active){detail='Lio '+(e.escort.walking?'is following':'is waiting for a clear route')+' - '+Math.round(Math.hypot(s.p.x-e.escort.x,s.p.z-e.escort.z))+' m away';}
  if(t?.id===BELL_TASK.id&&!s.p.ride)detail=bellProgress(s)+' / '+detail;
  const key=title+'|'+detail+'|'+completed;if(key===last)return;last=key;$('skyward-title').textContent=title;$('skyward-detail').textContent=detail;$('skyward-count').textContent=completed+' / '+TASKS.length+' adventures';
 }
 return {action,effect,update,open};
}
