/* Living Stories: authored household cases with alternate physical routes.
 * No ambient prompts, automatic rewards, new combat gates or save resets.
 * A case record is additive inside the existing bounded doors save. */
import {inDoorSpace} from './doors-core.mjs';
export const STORY_IDS=Object.freeze(['lamplighter','ledger']);
const blank=()=>({stage:0,route:null,mask:0,resolution:null});
export function storyState(raw){
 const out={version:1,cases:{lamplighter:blank(),ledger:blank()}};
 if(!raw||raw.version!==1)return out;
 for(const id of STORY_IDS){const r=raw.cases?.[id],q=out.cases[id];if(!r||!Number.isInteger(r.stage)||r.stage<0||r.stage>6)continue;
  q.stage=r.stage;q.route=['roof','cellar'].includes(r.route)?r.route:null;q.mask=Number.isInteger(r.mask)&&r.mask>=0&&r.mask<=7?r.mask:0;
  const resolutions=id==='lamplighter'?['amber','ivory']:['credit','shared'];q.resolution=resolutions.includes(r.resolution)?r.resolution:null;
  if(q.stage>=2&&!q.route)q.stage=1;if(q.stage>=5&&!q.resolution)q.stage=4;
  if(q.stage<2)q.route=null;if(q.stage<5)q.resolution=null;
 }
 return out;
}
export function saveStories(raw){return storyState(raw);}
export function makeStories(w){
 const h=id=>w.doorHomes.find(h=>h.id===id),work=h('workshop'),ada=h('apothecary'),binder=h('residence-home-0');
 const at=(home,level,point='station')=>({...home[point],room:home.id,level});
 const net=(home,level)=>({x:home.x,z:home.z,room:null,level});
 return [
  {id:'lamplighter',name:"The Lamplighter's Promise",resident:'Alessia',xp:170,florins:60,home:work.id,
   intro:'Alessia promised a reading lamp to neighbors who cannot manage the dark stairs. Leonardo can build it, but a bright lamp is not necessarily a useful lamp. Trace the light, tune the shutters, and choose how the room should feel.',
   places:[at(work,0,'desk'),at(work,1),{roof:net(ada,3),cellar:net(ada,-2)},at(work,2),at(work,0,'desk'),at(work,0,'desk')],
   steps:['Meet Alessia at the workshop household desk.','Study the upper-workshop plan and choose a survey route.','Read the route diagram beside Ada\'s house.','Set the three shutters in the workshop attic, then test the lamp.','Install the reading lamp downstairs and choose its color.','Return Alessia\'s signed installation record.'],
   notes:['Alessia: "Light should help people read, not overwhelm them."','Roof survey: the drawing shows LEFT open, CENTER closed, RIGHT open. Cellar survey: LEFT closed, CENTER open, RIGHT closed. Your chosen route determines the shutter pattern.','Both routes use existing walkable networks. No Lantern power or northern charter is needed. Rivals are avoidable; you may retreat.'],
  },
  {id:'ledger',name:'The Ledger With Two Names',resident:'Renata',xp:160,florins:55,home:binder.id,
   intro:'Renata finds two names on a single survey commission. The upper ledger looks incriminating, but the neighbors remember an afternoon of shared work. Follow either the roof delivery record or the cellar archive before judging anyone.',
   places:[at(binder,0,'desk'),at(binder,1),{roof:net(work,3),cellar:at(binder,-1)},at(binder,1),at(binder,2),at(binder,0,'desk')],
   steps:['Meet Renata at the western cartographer household desk.','Examine the upper ledger and choose a corroborating source.','Collect an independent record from the chosen route.','Compare the records upstairs: what actually happened?','Seal the corrected attic record and choose a settlement.','Return to Renata downstairs with the completed record.'],
   notes:['The ledger records ONE parcel and TWO contributors. There is no second payment recorded.','The roof delivery slip and the cellar archive both describe one parcel assembled by Renata and Pietro together. Different handwriting is not proof of theft.','A public credit plaque names both workers. A shared lending shelf makes the work available to neighbors. Both are peaceful endings, with the same one-time reward.'],
  }
 ];
}
export function storyProgress(s,id){return s.doors?.stories?.cases?.[id]||blank();}
export function storyPlace(s,w,q){const r=storyProgress(s,q.id),p=q.places[r.stage];if(!p)return null;return p.roof?p[r.route||'roof']:p;}
export function storyClues(s,q){const r=storyProgress(s,q.id),out=[q.notes[0]];if(r.stage>=1)out.push(q.notes[2]);if(r.stage>=3)out.push(q.id==='lamplighter'?(r.route==='roof'?'Roof diagram: LEFT open / CENTER closed / RIGHT open.':'Cellar diagram: LEFT closed / CENTER open / RIGHT closed.'):q.notes[1]);return out;}
export function storySites(s,w){return (w.stories||[]).flatMap(q=>{const r=storyProgress(s,q.id),p=storyPlace(s,w,q);return p?[{id:'story:'+q.id,quest:q.id,name:q.name,action:'story',detail:q.steps[r.stage],...p}]:[];});}
export function storyOptions(s,w,p){const q=w.stories.find(q=>q.id===p.quest),r=storyProgress(s,p.quest);if(!q||r.stage===6)return [];
 if(r.stage===0)return [{id:'accept',text:'Hear '+q.resident+"'s request and begin this story"}];
 if(r.stage===1)return [{id:'roof',text:q.id==='lamplighter'?'Survey the rooftop reflector at Ada\'s house':'Follow the delivery slip across the rooftops'},{id:'cellar',text:q.id==='lamplighter'?'Survey the underground conduit beneath Ada\'s house':'Consult the quiet archive in this house\'s cellar'}];
 if(r.stage===2)return [{id:'observe',text:'Read and copy the evidence into the case notebook'}];
 if(r.stage===3&&q.id==='lamplighter')return ['Left','Center','Right'].map((v,i)=>({id:'shutter:'+i,text:v+' shutter: '+(r.mask&(1<<i)?'OPEN':'CLOSED')+' / Toggle'})).concat([{id:'test',text:'Test the three shutters against the copied diagram'}]);
 if(r.stage===3)return [{id:'shared-work',text:'One parcel, two contributors: this was shared work'},{id:'theft',text:'Different handwriting proves a theft'},{id:'double-pay',text:'Two names prove a second payment'}];
 if(r.stage===4)return q.id==='lamplighter'?[{id:'amber',text:'Install a warm amber reading lamp'},{id:'ivory',text:'Install a soft ivory reading lamp'}]:[{id:'credit',text:'Record both workers on a public credit plaque'},{id:'shared',text:'Give the corrected volume to a shared lending shelf'}];
 return [{id:'report',text:'Deliver the completed record (+'+q.xp+' XP / +'+q.florins+' florins)'}];
}
export function useStory(s,w,id,action){
 const p=storySites(s,w).find(p=>p.id===id);
 if(!p||s.mode!=='foot'||Math.abs(s.speed)>1.7||!inDoorSpace(s,p,w)||Math.hypot(s.x-p.x,s.z-p.z)>=3.2||!storyOptions(s,w,p).some(o=>o.id===action))return {ok:false,text:'Stop beside this story station on its correct floor.'};
 const q=w.stories.find(q=>q.id===p.quest),r=s.doors.stories.cases[q.id];let text='';
 if(r.stage===0)text=q.intro;
 if(r.stage===1){r.route=action;text=action==='roof'?'Rooftop route chosen. Use an attic ladder and follow the connected walkways.':'Cellar route chosen. Use the marked stairs; the notebook points to the next entrance.';}
 if(r.stage===2)text=q.id==='lamplighter'?(r.route==='roof'?'Copied: LEFT open, CENTER closed, RIGHT open.':'Copied: LEFT closed, CENTER open, RIGHT closed.'):q.notes[1];
 if(r.stage===3){
  if(q.id==='lamplighter'){
   if(action.startsWith('shutter:')){r.mask^=1<<Number(action.slice(8));return {ok:true,text:'Shutter adjusted. Compare all three with your copied diagram; mistakes cost nothing.'};}
   if(r.mask!==(r.route==='roof'?5:2))return {ok:false,text:'The light is uneven. '+(r.route==='roof'?'Open LEFT and RIGHT; close CENTER.':'Open CENTER; close LEFT and RIGHT.')+' Nothing was consumed.'};
   text='The shutters now direct a steady, gentle reading light.';
  }else{if(action!=='shared-work')return {ok:false,text:'The records show one parcel and no second payment. Two contributors are not evidence of theft. Read the copied evidence and try again; nobody is accused.'};text='The independent record confirms shared work. Now seal the correction in the attic.';}
 }
 if(r.stage===4){r.resolution=action;text=q.id==='lamplighter'?'The reading lamp is installed downstairs. Your color choice remains visible.':action==='credit'?'Both workers receive public credit. The plaque and corrected book remain downstairs.':'A shared lending shelf opens downstairs. The corrected books are available to the neighborhood.';}
 r.stage++;s.doors.tracked={kind:'story',id:q.id};
 if(r.stage===6){s.life.xp=Math.min(50000,s.life.xp+q.xp);s.credits+=q.florins;text=q.name+' complete. '+q.resident+' thanks you. +'+q.xp+' XP / +'+q.florins+' florins.';}
 // Silent case updates: existing optional captions/text carry the story. The
 // previous sound-overload feedback is not answered with more reward chimes.
 s.toast=text;s.toastT=6;return {ok:true,text};
}
export function storyTarget(s,w,id){const q=w.stories?.find(q=>q.id===id),p=q&&storyPlace(s,w,q);return p?{...p,name:q.name,hint:q.steps[storyProgress(s,id).stage]}:null;}
export function storyOutcomes(s,w){const lamp=storyProgress(s,'lamplighter'),ledger=storyProgress(s,'ledger');return {lamp:lamp.stage>=5?lamp.resolution:null,ledger:ledger.stage>=5?ledger.resolution:null};}
