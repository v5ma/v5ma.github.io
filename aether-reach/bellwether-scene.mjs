/* Original mission props; rendered state never awards progression. Fixed pools. */
import * as T from './vendor/three.module.js';
import {createFoundryKit} from './foundry-kit.mjs';
import {BELL_POINTS,BELL_TARGETS,BELL_TASK,BELL_COVER,bellGoal} from './bellwether-world.mjs';
export function installBellwetherScene({scene,groundAt,clearLine}){
 const kit=createFoundryKit(scene),{root,add,batch,sign}=kit;root.name='bellwether-blackout';
 const dials=[],lamps=[];let signalLight=null;
 for(const c of BELL_COVER){const m=add('box','timber',[c.x,c.y+c.h/2,c.z],[c.w,c.h,c.d]);m.name=c.id;for(const side of[-1,1])batch('box','metal',[c.x+side*(c.w/2-.05),c.y+c.h/2,c.z],[.1,c.h,c.d]);}
 for(const q of BELL_POINTS){const g=new T.Group();g.name=q.id;g.position.set(q.x,q.y,q.z);root.add(g);add('cylinder','metal',[0,.4,0],[.22,.8,.22],g);add('box','dark',[0,.94,0],[.72,.28,.48],g);
  if(q.kind==='dial'){const ring=add('ring','brass',[0,1.25,.06],[.28,.28,.28],g);const needle=add('box','paper',[0,.12,0],[.035,.24,.035],ring);const lights=[];for(let i=0;i<4;i++){const a=i*Math.PI/2;lights.push(add('sphere','glow',[Math.sin(a)*.34,1.25+Math.cos(a)*.34,.065],[.04,.04,.04],g));}dials.push({ring,lights});sign(['SUPPLY','RETURN','BALANCE'][dials.length-1],q.x,q.y+2.9,q.z+.1,2.6);}
  else if(q.kind==='signal'){add('cylinder','brass',[0,2,0],[.1,2.3,.1],g);const halo=add('ring','brass',[0,3,0],[.7,.7,.7],g);signalLight=add('sphere','glow',[0,3,0],[.19,.19,.19],g);sign('THEATRE RECEIVER',q.x,q.y+4.4,q.z+.1,3);}
  else sign(q.kind==='desk'?'BELLWETHER BLACKOUT / X':'CIRCUIT TESTER / X',q.x,q.y+3.3,q.z+.12,q.kind==='desk'?4:2.8);
 }
 // The repaired public lights provide a persistent, visible ending.
 for(const [x,z] of [[-90,-9],[-98,-16],[-97,-25],[-82,-20]]){batch('cylinder','metal',[x,9,z],[.09,4,.09]);batch('box','brass',[x,11.15,z],[.55,.75,.55]);lamps.push(add('sphere','glow',[x,11.2,z],[.19,.27,.19]));}
 const marker=add('ring','glow',[0,0,0],[.85,.85,.85]);marker.rotation.x=Math.PI/2;marker.visible=false;
 const arrow=new T.Group();arrow.name='blackout-ground-arrow';root.add(arrow);for(const side of[-1,1]){const m=add('box','glow',[side*.14,0,0],[.07,.025,.52],arrow);m.rotation.y=side*.65;}arrow.visible=false;
 kit.flush();let restored=false;
 function update(s,{playing=true,reduced=false}={}){const b=s.bellwether;if(!b)return;restored=b.stage>=5;
  lamps.forEach(m=>m.visible=restored);signalLight.visible=restored||b.encounter==='roof';
  dials.forEach((d,i)=>{d.ring.rotation.z=-b.dials[i]*Math.PI/2;d.lights.forEach((l,j)=>l.visible=j===b.dials[i]);});
  const tracked=playing&&s.expedition.tracked===BELL_TASK.id&&b.stage<6,goal=bellGoal(s);marker.visible=tracked;
  if(tracked){marker.position.set(goal.x,goal.y+.055,goal.z);const pulse=reduced?1:1+Math.sin(s.time*3)*.06;marker.scale.set(.85*pulse,.85*pulse,.85);}
  arrow.visible=false;if(tracked&&s.skirmish.navigateUntil>s.time&&s.p.grounded){const dx=goal.x-s.p.x,dz=goal.z-s.p.z,l=Math.hypot(dx,dz)||1,x=s.p.x+dx/l*1.4,z=s.p.z+dz/l*1.4,y=groundAt(x,z,s.p.y+.4).y;if(Number.isFinite(y)&&Math.abs(y-s.p.y)<.5&&clearLine({...s.p,y:s.p.y+.2},{x,y:y+.2,z},s)){arrow.visible=true;arrow.position.set(x,y+.065,z);arrow.rotation.y=Math.atan2(dx,-dz);}}
 }
 return {update,dispose:kit.dispose,stats:()=>({restored,lamps:lamps.length,dials:dials.length,markerVisible:marker.visible})};
}
