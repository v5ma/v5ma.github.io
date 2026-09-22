import {LEVELS} from './world.mjs';
import {taskReady} from './field-tasks.mjs';

// Read-only presentation of the real chapter and its existing optional tasks.
// No new waypoints, gameplay hooks, storage keys, reward grants or menu actions.
const featured=Object.freeze({
 district:{label:'01 / The Floodgate - RECLAIMED QUAY',text:'UPDATED / THE FLOODGATE. Explore connected pump and evacuation rooms on the western quay. Observe the transmitter from cover, choose a sheltered return or an exposed crossing, and recover after detection. The clinic and Freight Hall remain part of the same expedition.'},
 terminus:{label:'03 / Bellweather Terminus - ESCAPE ROUTES',text:'UPDATED / BELLWEATHER TERMINUS. Search the dry-record gallery and restore station services. The existing dispatch and workshop-radio tasks now open real escape routes. The signal puzzle and both mission components still matter; enemies can follow through opened doors.'}
});
export function expeditionBrief(id){
 if(!Object.hasOwn(LEVELS,id))return null;
 return featured[id]?.text||LEVELS[id].title+'. Explore the existing expedition, follow its field notebook, and save at a shelter. The current level redesign focuses on The Floodgate and Bellweather Terminus.';
}
export function routeOpportunities(state){
 const d=state&&LEVELS[state.level];if(!d?.placesRevision)return [];
 const completed=new Set(state.completedTasks||[]);
 const connection=(taskId,title,closed,open)=>{
  const t=d.tasks.find(t=>t.id===taskId);
  if(!t||!d.obstacles.some(o=>o.openOnTask===taskId))return null;
  const done=completed.has(taskId);
  return {id:taskId,title,state:done?'OPEN':taskReady(state,t)?'AVAILABLE TO OPEN':'CLOSED',text:done?open:closed};
 };
 if(state.level==='district')return [
  {id:'quay-service',title:'Western quay service rooms',state:'OPEN',text:'The pump and evacuation rooms connect the western approach to the northern quay. The low sill offers observation and cover. The verge and Freight Hall approach are more exposed alternatives. Pursuers can enter the rooms; keep another exit in mind.'},
  connection('ward-radio','Freight Hall loading passage','The optional freight receiver repair can open a return to the market. It needs the clinic battery. Both original Freight Hall entrances remain usable.','The receiver has opened the west loading passage back to the market. It changes sightlines and pursuit routes too; an open passage is not a safe zone.')
 ].filter(Boolean);
 if(state.level==='terminus')return [
  connection('last-dispatch','Dispatch emergency shutter','Record the last dispatch at the desk to open the north-west gallery exit. The outer dry-record aisle provides another approach to the prism room.','The north-west dispatch shutter is open. Leave the prism room laterally onto the track crossing, rather than retracing the whole gallery. Creatures can use this route too.'),
  connection('station-radio','Workshop goods exit','Restore the workshop radio after making the original power circuit safe. This optional repair opens the northern goods exit; the original workshop entrance remains usable.','The northern workshop goods exit is open. It reconnects the key room to the signal-bridge approach. Opening it does not replace the bridge puzzle or either mission component.')
 ].filter(Boolean);
 return [];
}
export function createPlaceBriefing(getState,host,doc=document){
 const select=doc.getElementById('chapter-select'),title=doc.getElementById('title');
 let preview=doc.getElementById('expedition-briefing');
 if(select&&title&&!preview){
  preview=doc.createElement('p');preview.id='expedition-briefing';preview.className='small';preview.setAttribute('role','status');
  const anchor=title.querySelector('.intro');if(anchor)anchor.after(preview);else title.append(preview);
  const described=new Set((select.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));described.add(preview.id);select.setAttribute('aria-describedby',[...described].join(' '));
 }
 if(select){for(const option of select.options||[])if(featured[option.value])option.textContent=featured[option.value].label;}
 function selected(){if(preview){preview.textContent=expeditionBrief(select?.value)||'';preview.hidden=!preview.textContent;}}
 select?.addEventListener('change',selected);selected();
 const section=doc.createElement('section');section.id='route-opportunities';section.setAttribute('aria-label','Route opportunities');
 const heading=doc.createElement('h3'),body=doc.createElement('div');heading.textContent='ROUTE OPPORTUNITIES / OPTIONAL';section.append(heading,body);host.append(section);let signature='';
 function update(){const routes=routeOpportunities(getState()),next=JSON.stringify(routes);if(next===signature)return;signature=next;section.hidden=routes.length===0;body.replaceChildren();
  for(const r of routes){const p=doc.createElement('p');p.dataset.route=r.id;p.textContent=r.title+' / '+r.state+'. '+r.text;body.append(p);}
 }
 update();return {update,dispose(){select?.removeEventListener('change',selected);section.remove();}};
}
