import {emptyXR,deadAxis} from './xr-input.mjs';
import {normalizeRemaps} from './freefield-remap.mjs';
const fields={0:'trigger',1:'grip',3:'stick',4:'primary',5:'secondary'};
export function createDirectXRInput(){
 let old={},armed=false,neutral=0,signature='',snap=false,flick=false,held={};
 const reset=()=>{old={};armed=false;neutral=0;snap=false;flick=false;held={};};
 function sample(list,dt,{mode='play',key=mode,handFire=false,handBlink=false,water=false,mapping}={}){
  const out=emptyXR(),stamp=list.map(s=>s.id).sort().join('|')+':'+key+':'+JSON.stringify(mapping||{});if(stamp!==signature){signature=stamp;reset();}
  const left=list.find(s=>s.side==='left'),right=list.find(s=>s.side==='right'),data={};
  for(const s of list)for(const [index,name]of Object.entries(fields))data[s.side+name]=name==='trigger'&&s.hand?!!s.pinch:!!(s.buttons?.[index]?.pressed||s.buttons?.[index]?.value>.65);
  const axes=s=>s?.hand?(s.move||[0,0]):[deadAxis(s?.axes?.[2]),deadAxis(s?.axes?.[3])],lm=axes(left),rm=axes(right);
  if(!armed){neutral=Object.values(data).some(Boolean)||Math.hypot(...lm,...rm)>.1?0:neutral+1;if(neutral>=2&&list.length)armed=true;old={...data};return out;}
  const edge=k=>data[k]&&!old[k],release=k=>!data[k]&&old[k];out.select={left:edge('lefttrigger'),right:edge('righttrigger')};out.confirmHeld=!!data.rightprimary;
  out.nav=lm[1];out.navX=lm[0];out.scroll=rm[1];
  if(mode!=='play'){out.confirm=edge('rightprimary');out.back=edge('rightsecondary');old={...data};return out;}
  out.move=lm;
  for(const [button,action]of Object.entries(normalizeRemaps({xr:mapping}).xr)){
   const side=button.startsWith('left')?left:right;if(side?.hand)continue;
   if(['aim','fire','listen','sprint'].includes(action)){out[action]||=!!data[button];if(action==='sprint'&&edge(button))out.sprintToggle=true;}
   else if(action==='blink'){out.blinkHeld||=!!data[button];if(release(button))out.actions.push('blink');}
   else if(action==='traverse'&&water){out.swimBoost||=!!data[button];}
   else if(action==='crouch'){
    if(edge(button))held[button]=0;if(data[button])held[button]=(held[button]||0)+Math.min(.1,Math.max(0,dt));
    if(data[button]&&held[button]>=.5&&!old[button+'long']){out.actions.push('prone');data[button+'long']=true;}else data[button+'long']=!!old[button+'long']&&data[button];
    if(release(button)&&!old[button+'long'])out.actions.push('crouch');
   }else if(action!=='none'&&edge(button))out.actions.push(action);
  }
  if(right?.hand){out.aim=out.fire=handFire&&!!data.righttrigger;out.blinkHeld=handBlink&&!!data.righttrigger;if(handBlink&&release('righttrigger'))out.actions.push('blink');if(!handFire&&!handBlink&&edge('righttrigger'))out.actions.push('interact');}
  if(edge('rightstick'))out.actions=['pause'];
  if(Math.abs(rm[0])<.3)snap=false;if(Math.abs(rm[0])>.65&&!snap){snap=true;out.turn=-Math.sign(rm[0])*Math.PI/6;out.fire=false;}
  if(Math.abs(rm[1])<.3)flick=false;if(Math.abs(rm[1])>.75&&Math.abs(rm[0])<.3&&!flick){flick=true;out.actions.push(rm[1]<0?'swapGun':'selectTool');}
  if(out.blinkHeld){out.fire=false;out.move=[0,0];}
  out.actions=[...new Set(out.actions)];old={...data};return out;
 }
 return {sample,reset,isArmed:()=>armed};
}
