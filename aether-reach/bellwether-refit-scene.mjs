/* Visible cause/effect and route landmarks. No mission or save writes. */
import * as T from './vendor/three.module.js';
import {createFoundryKit} from './foundry-kit.mjs';
import {BELL_DECKS,BELL_STREET_SOLIDS,BELL_SHORTCUT,BELL_DEMO,bellCircuitFeedback} from './bellwether-layout.mjs';
export function installBellwetherRefit(scene){
 const k=createFoundryKit(scene),{root,add,batch,sign}=k;root.name='Bellwether Rewired / authored chapter';
 for(const p of BELL_DECKS){batch('box','stone',[p.x,p.y-.17,p.z],[p.w,.34,p.d]);batch('box','brass',[p.x,p.y-.38,p.z],[p.w+.08,.12,p.d+.08]);}
 for(const b of BELL_STREET_SOLIDS){const x=(b.x1+b.x2)/2,z=(b.z1+b.z2)/2,h=b.y2-b.y1,w=b.x2-b.x1,d=b.z2-b.z1;batch('box',h>2?'stone':'timber',[x,b.y1+h/2,z],[w,h,d]);batch('box','brass',[x,b.y2+.025,z],[w+.08,.05,d+.08]);}
 const gate=add('box','metal',[(BELL_SHORTCUT.x1+BELL_SHORTCUT.x2)/2,8.6,-28],[.22,3.2,3.35]);gate.name='Arcade service shutter';
 // A grounded, repeatable test bench. Its separate crank is accessible without buying a power.
 const q=BELL_DEMO;batch('box','timber',[q.x,q.y+.45,q.z],[1.5,.9,.65]);
 const crank=add('ring','brass',[q.x,q.y+1.05,q.z+.4],[.32,.32,.32]);
 add('box','paper',[0,.22,0],[.075,.23,.075],crank);
 const demoLamp=add('sphere','glow',[-85,9,-11],[.2,.3,.2]);
 sign('CRANK OR CURRENT / COIL -> LAMP',-86,10,-9,4.4);
 sign('MARKED WATER CONDUCTS / STAY ON STONE',-85,7.5,-12.4,3.8);
 const conduits=[],gauges=[];
 function pipe(a,b,lit=false){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=add('cylinder',lit?'glow':'metal',av.clone().add(bv).multiplyScalar(.5).toArray(),[lit?.045:.1,d.length(),lit?.045:.1]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 // Three independent gauge tracks identify the first broken link, not just a pass/fail light.
 for(let i=0;i<3;i++){const x=-106.5+i*3.5;batch('box','dark',[x,9.9,-33.8],[2.6,1.05,.18]);
  const needle=add('box','paper',[x,9.9,-33.65],[.065,.74,.03]);gauges.push(needle);
  for(let j=0;j<4;j++){const m=add('sphere','glow',[x+(j-1.5)*.45,9.48,-33.65],[.05,.05,.05]);conduits.push({m,stage:i,step:j});}
  sign(['SUPPLY 2 / WORKSHOP','RETURN 1 / MARKET','BALANCE 3 / THEATRE'][i],x,10.7,-33.65,3.2);
 }
 const network=[[-99,10,-26],[-95.8,10,-26],[-95.8,10,-18],[-100.5,16,-18],[-100.5,25,-8],[-111.6,30.5,-6.7]];
 const links=[];for(let i=1;i<network.length;i++){pipe(network[i-1],network[i]);links.push(pipe(network[i-1].map((n,k)=>n+(k===0?.13:0)),network[i].map((n,k)=>n+(k===0?.13:0)),true));}
 // The public warning wheel stays stopped until the receiver is actually synchronized.
 const wheel=new T.Group();wheel.position.set(-100.8,19,-7);wheel.rotation.y=Math.PI/2;root.add(wheel);
 add('ring','brass',[0,0,0],[2.1,2.1,2.1],wheel);for(let i=0;i<8;i++){const a=i*Math.PI/4,m=add('box','paper',[0,0,0],[.09,3.8,.09],wheel);m.rotation.z=a;}
 sign('THEATRE / PUBLIC WARNING RECEIVER',-107,20.5,-.68,10);
 for(const [text,x,y,z,w] of [
  ['ARCADE -> CIRCUITS / WEST SERVICE SHUTTER',-103,10.8,-22.3,10],
  ['MAINTENANCE GALLERIES / WALK TO THE RECEIVER',-95.8,10,-20,5],
  ['LOOK BACK / MARKET BELOW',-103,14,-35.8,6],
  ['THEATRE SERVICE / REJOIN THE MARKET',-114.5,9.6,-25,4.6],
  ['RECEIVER ARRIVAL / COVER TO YOUR LEFT',-99,30.2,-5,4.4]
 ])sign(text,x,y,z,w);
 // An unfinished workbench visually explains the redirected civic power.
 batch('box','timber',[-107.5,12.6,-34.8],[2.2,1.2,.8]);batch('box','dark',[-107.5,13.4,-34.8],[1,.5,.5]);
 pipe([-107.5,13.4,-34.8],[-106.5,13.4,-33.2]);sign('PRIVATE BENCH -> PUBLIC WARNING LINE',-107,14.25,-34.5,4.7);
 k.flush();let feedback=bellCircuitFeedback({});
 function update(s,dt,reduced=false){feedback=bellCircuitFeedback(s);gate.visible=!feedback.shortcutOpen;
  const powered=(s.bellwether?.demoUntil||0)>s.time||(s.tactics?.hazards?.['bell-training-water']||0)>0||feedback.restored;
  demoLamp.visible=powered;crank.rotation.z=powered&&!reduced?s.time*2:0;
  gauges.forEach((g,i)=>g.rotation.z=-(s.bellwether?.dials?.[i]||0)*Math.PI/2);
  conduits.forEach(({m,stage,step})=>{m.visible=step===(s.bellwether?.dials?.[stage]||0);});
  links.forEach((m,i)=>m.visible=feedback.shortcutOpen&&(i<links.length-1||feedback.restored||feedback.signal>i/links.length));
  if(feedback.restored&&!reduced)wheel.rotation.z+=Math.min(dt,.1)*.35;
 }
 return {update,dispose:k.dispose,stats:()=>({...feedback,decks:BELL_DECKS.length,routeVariants:3})};
}
