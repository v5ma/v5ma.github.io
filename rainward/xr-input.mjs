/* WebXR xr-standard is NOT the Xbox Gamepad API layout. No system buttons. */
export const QUEST_BUTTONS=Object.freeze({trigger:0,grip:1,stick:3,primary:4,secondary:5});
export const emptyXR=()=>({connected:true,actions:[],move:[0,0],look:[0,0],aim:false,fire:false,listen:false,sprint:false,confirm:false,confirmHeld:false,back:false,nav:0,navX:0,scroll:0,turn:0,select:{left:false,right:false}});
const n=x=>Number.isFinite(x)?x:0;
export function deadAxis(x,dead=.22){x=Math.max(-1,Math.min(1,n(x)));return Math.abs(x)<=dead?0:Math.sign(x)*(Math.abs(x)-dead)/(1-dead);}
export function pinchDown(distance,previous=false){return Number.isFinite(distance)&&distance>=0&&distance<(previous?.038:.024);}
export function handStick(origin,point,yaw){if(!origin||!point)return [0,0];const x=point.x-origin.x,z=point.z-origin.z,c=Math.cos(yaw),s=Math.sin(yaw);return [deadAxis((c*x-s*z)/.13,.15),deadAxis((s*x+c*z)/.13,.15)];}
export function createXRInput(){
 let armed=false,neutral=0,previous={},held={},sources='',modeKey='',turnLatch=false,verticalLatch=false;
 const reset=()=>{armed=false;neutral=0;previous={};held={};turnLatch=false;verticalLatch=false;};
 function sample(list,dt,{mode='play',key=mode,handFire=false}={}){
  const out=emptyXR();dt=Math.max(0,Math.min(.1,n(dt)));const nextSources=list.map(s=>s.id).sort().join('|');
  if(nextSources!==sources||key!==modeKey){sources=nextSources;modeKey=key;reset();}
  const L=list.find(s=>s.side==='left'),R=list.find(s=>s.side==='right');
  const data={};for(const [side,src]of [['left',L],['right',R]]){
   const b=src?.buttons||[];for(const [name,index]of Object.entries(QUEST_BUTTONS))data[side+name]=!!(b[index]?.pressed||n(b[index]?.value)>.65);
   if(src?.hand)data[side+'trigger']=!!src.pinch;
  }
  const busy=Object.values(data).some(Boolean)||list.some(s=>(s.axes||[]).some(x=>Math.abs(n(x))>.22));
  if(!armed){previous={...data};neutral=busy?0:neutral+1;if(neutral>=2&&list.length)armed=true;return out;}
  const edge=k=>data[k]&&!previous[k],release=k=>!data[k]&&previous[k];
  for(const k of Object.keys(data)){if(data[k])held[k]=(held[k]||0)+dt;}
  out.select.left=edge('lefttrigger');out.select.right=edge('righttrigger');
  // Native A crafting has its own owner; ray holds are owned by the spatial panel.
  out.confirmHeld=!!data.rightprimary;
  const axes=(src)=>src?.hand?(src.move||[0,0]):[deadAxis(src?.axes?.[2]),deadAxis(src?.axes?.[3])];
  const lm=axes(L),rm=axes(R);out.nav=lm[1];out.navX=lm[0];out.scroll=rm[1];
  if(mode!=='play'){
   out.confirm=edge('rightprimary');out.back=edge('rightsecondary');
   if(edge('leftprimary'))out.actions.push('map');
   if(edge('leftsecondary'))out.actions.push('pause');
  }else{
   // A movement pinch is not a left-controller aiming trigger. Fire mode only
   // aims while the right pinch is held, so released hands retain normal walking.
   out.move=lm;out.aim=!!(!L?.hand&&data.lefttrigger)||!!(R?.hand&&handFire&&data.righttrigger);out.fire=!!data.righttrigger&&(!R?.hand||handFire);
   out.listen=!!data.leftgrip;out.sprint=!!data.leftstick;
   if(edge('leftstick'))out.sprintToggle=true;
   if(edge('rightgrip')||R?.hand&&!handFire&&edge('righttrigger'))out.actions.push('interact');
   if(edge('leftprimary'))out.actions.push('reload');
   if(edge('rightprimary'))out.actions.push(data.leftgrip?'evade':'traverse');
   if(edge('rightstick'))out.actions.push('melee');
   if(data.rightsecondary&&held.rightsecondary>=.45&&!previous.bLong){out.actions.push('prone');data.bLong=true;}else data.bLong=!!previous.bLong&&data.rightsecondary;
   if(release('rightsecondary')&&!previous.bLong)out.actions.push('crouch');
   if(data.leftsecondary&&held.leftsecondary>=.55&&!previous.yLong){out.actions.push('pause');data.yLong=true;}else data.yLong=!!previous.yLong&&data.leftsecondary;
   if(release('leftsecondary')&&!previous.yLong)out.actions.push('pack');
   if(Math.abs(rm[0])<.3)turnLatch=false;
   if(Math.abs(rm[0])>.65&&!turnLatch){turnLatch=true;out.turn=-Math.sign(rm[0])*Math.PI/6;}
   if(Math.abs(rm[1])<.3)verticalLatch=false;
   if(Math.abs(rm[1])>.75&&Math.abs(rm[0])<.3&&!verticalLatch){verticalLatch=true;out.actions.push(rm[1]<0?'swapGun':'selectTool');}
  }
  for(const k of Object.keys(held))if(!data[k])held[k]=0;
  previous={...data};return out;
 }
 return {sample,reset,isArmed:()=>armed};
}
