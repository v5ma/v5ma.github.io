import {watchState,trackWatch,watchTarget,watchGoal} from './watch.mjs';
import {campaignState,trackCampaign,campaignTarget,campaignGoal} from './campaign.mjs';
/* Additive, validated resident stories. Original 600-credit chapter ledger is untouched. */
export const residents=[
 {id:'ada',name:'Ada / printer',x:-9.5,y:0,z:4.5,color:0x698cb7,tip:'Print is how this neighborhood remembers. Our type case went to the north storehouse.'},
 {id:'bea',name:'Bea / market cook',x:-20.5,y:0,z:0,color:0xb77b59,tip:'The market feeds workers from both banks. The greenhouse grows our kitchen herbs.'},
 {id:'tomas',name:'Tomas / storekeeper',x:-12,y:0,z:-17.5,color:0x8882b7,tip:'We store the parts; Ivo moves them. Those bay signals give riders a predictable crossing.'},
 {id:'lin',name:'Lin / greenhouse keeper',x:18,y:0,z:-17,color:0x699b75,tip:'The canal, kitchen and rooftop gardens are one little ecosystem.'},
 {id:'otis',name:'Otis / water engineer',x:7.1,y:0,z:-10.5,color:0x609eaa,tip:'Drain for inspection; fill for boats. Moor first. The gauge shows the actual waterline.'},
 {id:'sal',name:'Sal / neighborhood radio',x:12,y:4.4,z:0,color:0xb17c99,tip:'From this loft I can see where the goods go. The roof crossing keeps my cables out of the market.'}
];
const point=(label,x,y,z,kind='interact',extra={})=>({label,x,y,z,kind,...extra});
export const stories=[
 {id:'press',title:'Tomorrow\'s Front Page',giver:'ada',reward:90,summary:'Recover type, restart the press, and put the neighborhood news on the depot board.',steps:[point('Collect the replacement type case in the storehouse',-9,0,-17),point('Fit the type into Ada\'s printing press',-9.6,0,1.5),point('Post the first neighborhood edition at the depot',-8.5,0,15.5)],result:'Ada: The press is running. People can see the market hours and canal status on the depot board.'},
 {id:'kitchen',title:'The Shared Table',giver:'bea',reward:80,summary:'Take a recipe to the greenhouse and bring its herbs back for a market meal.',steps:[point('Ask Lin for the kitchen herb basket',18,0,-17),point('Prepare the meal at Bea\'s kitchen counter',-20.5,0,-1.8),point('Bring the meal to Tomas in the storehouse',-12,0,-17.5)],result:'Bea: A hot meal on both banks. The market counter is serving again.'},
 {id:'water',title:'Water Under the Ward',giver:'otis',reward:110,summary:'Drain the channel, inspect the exposed bed, then restore the boating route.',steps:[point('Inspect the exposed channel filter',-.5,-2,-7,'interact',{water:'low'}),point('Restore high water for public skiffs',5.8,0,-13,'water-high'),point('Report the water test to Otis',7.1,0,-10.5)],result:'Otis: Filter checked and boats restored. We can keep the canal open without guessing.'},
 {id:'radio',title:'A Voice Above the Market',giver:'sal',reward:100,summary:'Trace the rooftop relay and return with a clear signal. Use stairs or the repaired hoist.',steps:[point('Tune the relay on the drying terrace',-10,4.4,-4.5),point('Test the receiver beside the loft window',19,4.4,0),point('Confirm the broadcast with Sal',12,4.4,0)],result:'Sal: Both banks can hear the market broadcast. The roof route is our signal line as well as our goods line.'},
 {id:'lamps',title:'After the Last Delivery',giver:'tomas',reward:120,summary:'Bring lamp parts to the workshop, restore a service connection, and light the market.',steps:[point('Collect finished lanterns from the workshop bench',14,0,6),point('Restore either the blue door or goods hoist',6,0,-8,'connection'),point('Hang lanterns at the market entrance',-20.5,0,4)],result:'Tomas: The market can stay open into the evening. That delivery connection has a second purpose now.'},
 {id:'garden',title:'Gardens Between Roofs',giver:'lin',reward:100,summary:'Carry seedlings up to the print terrace, collect compost, and return to the greenhouse.',steps:[point('Plant the roof bed on the print terrace',-14.5,4.4,-4.4),point('Collect the market compost basket',-20.5,0,-1.8),point('Return the soil to Lin\'s greenhouse',18,0,-17)],result:'Lin: A rooftop garden above the press and good soil below. The kitchen will use what grows here.'},
 {id:'letters',title:'Letters Across the Ward',giver:'ada',reward:95,summary:'Deliver a bundle between the loft, greenhouse and storehouse. Choose the connections you know.',steps:[point('Deliver Sal\'s letter in the loading loft',12,4.4,0),point('Deliver Lin\'s letter in the greenhouse',18,0,-17),point('Leave the last letter with Tomas',-12,0,-17.5)],result:'Ada: Three households connected. No deadlines, no lost letters; a route you made your own.'},
 {id:'gathering',title:'The Neighborhood Switches On',giver:'sal',reward:150,summary:'Bring the cook and gardener together, then switch on a courtyard gathering.',requires:3,steps:[point('Invite Bea at the market kitchen',-20.5,0,0),point('Invite Lin at the greenhouse',18,0,-17),point('Switch on the courtyard gathering',6.5,0,8)],result:'Sal: The courtyard is open. The press, kitchen, gardens and workshop finally feel like one neighborhood.'}
];
export const freshCity=()=>({v:1,active:null,progress:{},completed:[],credits:0});
export function parseCity(raw){
 if(raw==null)return freshCity();if(!raw||raw.v!==1||!Array.isArray(raw.completed)||!raw.progress||typeof raw.progress!=='object'||Array.isArray(raw.progress))throw Error('Unsupported resident-story save. Keep the original.');
 const known=id=>stories.some(s=>s.id===id),completed=[...new Set(raw.completed)];
 if(completed.length!==raw.completed.length||completed.some(id=>!known(id))||raw.active!==null&&!known(raw.active))throw Error('Invalid resident-story identity');
 const progress={};for(const [id,n]of Object.entries(raw.progress)){const story=stories.find(s=>s.id===id);if(!story||!Number.isInteger(n)||n<0||n>story.steps.length)throw Error('Invalid story stage');progress[id]=n;}
 for(const story of stories){const n=progress[story.id];if((n===story.steps.length)!==completed.includes(story.id))throw Error('Inconsistent story reward');}
 const credits=completed.reduce((a,id)=>a+stories.find(s=>s.id===id).reward,0);if(raw.credits!==credits||raw.active&&completed.includes(raw.active))throw Error('Invalid resident credit ledger');
 return {v:1,active:raw.active,progress,completed,credits};
}
export const cityState=s=>s.city||(s.city=freshCity());
export function available(s,story){return cityState(s).completed.length>=(story.requires||0);}
export function trackStory(s,id){if(id.startsWith('campaign:'))return trackCampaign(s,id);if(id==='watch'){campaignState(s).active=null;return trackWatch(s);}watchState(s).tracking=false;campaignState(s).active=null;const c=cityState(s),story=stories.find(m=>m.id===id);if(id==='main'){c.active=null;return 'Tracking the original delivery loop.';}if(!story||c.completed.includes(id)||!available(s,story))return 'This story is complete or not yet available.';c.active=id;return c.progress[id]==null?'Meet '+residents.find(r=>r.id===story.giver).name+' to begin '+story.title+'.':'Continuing '+story.title+'.';}
export function mainTarget(s){return s.claimed?null:!s.parcel?point('Collect the workshop parcel / depot',-12,0,15):!s.delivered?point('Deliver the parcel / receiving bench',14,0,6):!s.gate&&!s.hoist?point('Restore a connection / hoist repair or blue door',6,0,-8):point('Return to Mara / depot bench',-12,0,15);}
export function storyTarget(s){if(campaignState(s).active)return campaignTarget(s);if(watchState(s).tracking)return watchTarget(s);const c=cityState(s),story=stories.find(m=>m.id===c.active);if(!story)return mainTarget(s);const n=c.progress[story.id];if(n==null){const r=residents.find(r=>r.id===story.giver);return {...r,id:'meet-'+r.id,label:'Meet '+r.name+' / '+story.title,kind:'meet'};}const step=story.steps[n];if(!step)return null;
 if(step.water&&s.water!==step.water)return point('Drain the canal at the sluice, then inspect the filter',5.8,0,-13,'operate');
 if(step.kind==='connection')return s.gate||s.hoist?point('Confirm the restored connection at the workshop',14,0,6):{...step,kind:'operate'};
 return {...step,id:'story-'+story.id+'-'+n};
}
export function missionGoal(s){if(campaignState(s).active)return campaignGoal(s);if(watchState(s).tracking)return watchGoal(s);const c=cityState(s);if(c.active){const story=stories.find(m=>m.id===c.active);return story.title+': '+storyTarget(s).label;}const t=mainTarget(s);return t?t.label:'Delivery loop complete. Meet residents with ! markers, or choose a story from Missions.';}
export function cityInteract(s,clearLine){if(watchState(s).tracking||campaignState(s).active)return null;
 const c=cityState(s),story=stories.find(m=>m.id===c.active),target=storyTarget(s),close=t=>Math.hypot(s.x-t.x,s.y-t.y,s.z-t.z)<1.9&&clearLine(s,{x:s.x,y:s.y+1,z:s.z},{x:t.x,y:t.y+1,z:t.z});
 if(story&&target&&close(target)){
  if(target.kind==='operate'||target.kind==='water-high'&&s.water!=='high')return null;
  const n=c.progress[story.id];if(n==null){c.progress[story.id]=0;return residents.find(r=>r.id===story.giver).name+': '+story.summary;}
  c.progress[story.id]=n+1;
  if(n+1===story.steps.length){c.completed.push(story.id);c.credits+=story.reward;c.active=null;return story.result+' +'+story.reward+' resident credits.';}
  return 'Done. Next: '+storyTarget(s).label+'.';
 }
 const r=residents.find(r=>close(r));if(!r)return null;
 const next=stories.find(m=>m.giver===r.id&&!c.completed.includes(m.id)&&available(s,m));
 if(next&&!c.active){c.active=next.id;if(c.progress[next.id]==null)c.progress[next.id]=0;return r.name+': '+next.summary;}
 return r.name+': '+r.tip+(next?' Available story: '+next.title+'. Select it in Missions to switch without losing progress.':'');
}
export function cityMarkers(s){const c=cityState(s);return residents.map(r=>({...r,available:stories.some(m=>m.giver===r.id&&!c.completed.includes(m.id)&&available(s,m))}));}
