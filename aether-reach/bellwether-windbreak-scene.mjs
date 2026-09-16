/* Graybox-quality functional cues; solids are imported from the model contract. */
import {createFoundryKit} from './foundry-kit.mjs';
import {WINDBREAK_CONTROLS,WINDBREAK_SCREENS,windbreakSnapshot} from './bellwether-windbreak.mjs';
export function installWindbreak(scene,clearLine){
 const k=createFoundryKit(scene),{root,add,batch,sign}=k;root.name='Receiver Crosswind / reversible storm screens';
 const screens=WINDBREAK_SCREENS.map((b,i)=>{
  const w=b.x2-b.x1,d=b.z2-b.z1,h=b.y2-b.y1,x=(b.x1+b.x2)/2,z=(b.z1+b.z2)/2;
  const screen=add('box','metal',[x,b.y1+h/2,z],[w,h,d]);screen.name='windbreak-'+i;
  // Recessed tracks show where the other panel can rise without blocking feet.
  batch('box','brass',[x,b.y1+.025,z],[w+.16,.05,d+.16]);
  const stripe=add('box','paper',[0,.32,0],[1.03,.06,1.03],screen);
  stripe.name='windbreak-warning-stripe';
  return screen;
 });
 const handles=[],signals=[];
 for(const q of WINDBREAK_CONTROLS){
  batch('cylinder','metal',[q.x,q.y+.5,q.z-.45],[.12,1,.12]);
  const lever=add('box','brass',[q.x,q.y+1.05,q.z-.45],[.12,.5,.12]);handles.push(lever);
  signals.push([add('sphere','glow',[q.x-.22,q.y+1.5,q.z-.45],[.07,.07,.07]),add('sphere','glow',[q.x+.22,q.y+1.5,q.z-.45],[.07,.07,.07])]);
  sign('WINDBREAK / GALLERY < > RECEIVER',q.x,q.y+2.3,q.z-.5,4.6);
 }
 // Arrow rails and a fixed landmark establish both exits before combat starts.
 sign('GALLERY / RETREAT AND RETURN',-100.5,29.8,-5.1,3.8);
 sign('SOUTH LADDER / MARKET',-107,29.9,-1.85,4);
 sign('STORM SCREENS / COVER ALSO BLOCKS YOUR SHOTS',-109.8,31,-16.3,7);
 k.flush();let status=windbreakSnapshot(null);
 function update(s){status=windbreakSnapshot(s);status.sightlines=s.drones.filter(e=>e.bellwetherEnemy&&e.hp>0).map(e=>({id:e.id,clear:clearLine({...s.p,y:s.p.y+1.35},e,s)}));screens.forEach((m,i)=>m.visible=i===status.mode);handles.forEach(m=>m.rotation.z=status.mode?-.55:.55);signals.forEach(l=>l.forEach((m,i)=>m.visible=status.powered&&i===status.mode));}
 return {update,stats:()=>status,dispose:k.dispose};
}
