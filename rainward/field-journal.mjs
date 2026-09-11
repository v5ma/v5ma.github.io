import {LEVELS,dist} from './world.mjs';
import {tasksFor,taskDone,taskReady,taskBlockReason,trackedTask} from './field-tasks.mjs';
export function createFieldJournal(getState){
 const host=document.getElementById('map-panel'),panel=document.createElement('section');panel.id='field-tasks';panel.setAttribute('aria-label','Field tasks');
 const heading=document.createElement('h3'),intro=document.createElement('p'),list=document.createElement('div');heading.textContent='PEOPLE, PLACES, AND A WAY THROUGH';intro.textContent='Required tasks open the way out. Optional tasks reveal the district and award supplies. Select a task to mark it in the world. Progress is recorded at shelters.';panel.append(heading,intro,list);host.insertBefore(panel,document.getElementById('map'));let signature='';
 function update(){const s=getState(),key=s.level+'/'+s.completedTasks.join()+'/'+s.trackedTask+'/'+JSON.stringify(s.objectives)+'/'+s.puzzle?.solved;if(key===signature)return;signature=key;const focusId=list.contains(document.activeElement)?document.activeElement.id:null;list.replaceChildren();
  heading.textContent='FIELD TASKS / '+s.completedTasks.length+' OF '+tasksFor(s).length+' COMPLETE';
  for(const t of tasksFor(s)){const done=taskDone(s,t.id),ready=taskReady(s,t),row=document.createElement('article');row.className='field-task'+(done?' complete':'')+(s.trackedTask===t.id?' tracked':'');row.dataset.task=t.id;
   const title=document.createElement('strong');title.textContent=(done?'COMPLETE / ':t.required?'REQUIRED / ':'OPTIONAL / ')+t.title;const text=document.createElement('p');text.textContent=t.description;const detail=document.createElement('small');detail.textContent=done?'Recorded at the next shelter.':ready?'Ready to complete. Approach the station and press E / Y.':'First: '+taskBlockReason(s,t)+'.';row.append(title,text,detail);
   const button=document.createElement('button');button.id='track-'+t.id;button.textContent=done?'COMPLETED':s.trackedTask===t.id?'STOP TRACKING':'TRACK THIS TASK';button.disabled=done;button.onclick=()=>{s.trackedTask=s.trackedTask===t.id?null:t.id;signature='';update();};row.append(button);list.append(row);
  }
  if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
 }
 return {update};
}
