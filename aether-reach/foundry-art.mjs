import {makeRiftVeil,castBudget} from './aurora-shaders.mjs';
/* Foundry Finish: art for the actual collision and tactical state, not mock props. */
import * as T from './vendor/three.module.js';
import {createFoundryKit,exposedDeck} from './foundry-kit.mjs';
import {COMBAT_DECKS,ARENA_CONSOLES,RIFTS} from './skirmish-world.mjs';
export function installFoundryArt({scene,cover,districts}){
 const kit=createFoundryKit(scene),{root,add,batch,sign}=kit;let dynamicCount=0;
 for(const d of COMBAT_DECKS){
  for(const p of exposedDeck(d,districts))batch('box','stone',[(p.x1+p.x2)/2,d.y-.28,(p.z1+p.z2)/2],[p.x2-p.x1,.56,p.z2-p.z1]);
  batch('box','metal',[d.x,d.y-.8,d.z],[d.w,.45,d.d]);batch('box','brass',[d.x,d.y-1.15,d.z],[d.w+.1,.13,d.d+.1]);
  // All structural detail remains below the walkable surface.
  for(const side of[-1,1])for(let i=0;i<8;i++)batch('box','metal',[d.x+side*(d.w/2-.6),d.y-2,d.z+(i-3.5)*d.d/8],[.5,2.3,1]);
 }
 for(const c of cover){
  const m=add('box',c.kind==='wall'?'stone':'timber',[c.x,c.y+c.h/2,c.z],[c.w,c.h,c.d]);m.name=c.id;m.userData.collider=true;
  for(const side of[-1,1]){
   batch('box','metal',[c.x+side*(c.w/2-.065),c.y+c.h/2,c.z],[.13,c.h,c.d]);
   batch('box','brass',[c.x,c.y+c.h-.055,c.z+side*(c.d/2-.04)],[c.w,.11,.08]);
   for(let i=1;i<4;i++)batch('box','dark',[c.x+(i/4-.5)*c.w,c.y+c.h/2,c.z+side*(c.d/2-.022)],[.035,c.h-.15,.04]);
  }
  if(c.kind!=='wall')for(const side of[-1,1])batch('box','metal',[c.x,c.y+.13,c.z+side*(c.d/2-.04)],[c.w,.16,.08]);
 }
 const consoleLights=[];
 for(const c of ARENA_CONSOLES){const g=new T.Group();g.name=c.id;g.position.set(c.x,c.y,c.z);root.add(g);add('cylinder','metal',[0,.43,0],[.35,.86,.35],g);const panel=add('box','dark',[0,1,0],[1.1,.45,.55],g);panel.rotation.x=-.18;const lamp=add('sphere','glow',[0,1.2,0],[.11,.11,.11],g);consoleLights.push({id:c.id,mesh:lamp});sign(c.name.replace(' combat trial','').toUpperCase(),c.x,c.y+3.6,c.z+.12,4.6);}
 const veil=makeRiftVeil();
 const rifts=RIFTS.map(r=>{const g=new T.Group();g.name=r.id;g.position.set(r.x,r.y,r.z);root.add(g);const ghost=add('box','ghost',[0,r.h/2,0],[r.w,r.h,r.d],g);const solid=new T.Group();g.add(solid);solid.visible=false;
  if(r.type==='cover'){add('box','metal',[0,r.h/2,0],[r.w,r.h,r.d],solid);for(const x of[-1,0,1])add('box','brass',[x*(r.w/2-.13),r.h/2,0],[.16,r.h,r.d],solid);add('box','glow',[0,r.h-.17,-r.d/2-.006],[r.w-.3,.07,.015],solid);}
  else{add('cylinder','metal',[0,.45,0],[.52,.9,.52],solid);add('sphere','glow',[0,1.25,0],[.32,.32,.32],solid);if(r.type==='turret'){add('box','dark',[0,1.6,-.2],[.8,.3,1.3],solid);add('cylinder','brass',[0,1.6,-.92],[.09,.6,.09],solid).rotation.x=Math.PI/2;}else{add('box','paper',[0,1.2,-.36],[.5,.65,.035],solid);add('box','cloth',[0,1.2,-.39],[.31,.10,.025],solid);add('box','cloth',[0,1.2,-.39],[.10,.35,.025],solid);}}
  sign(r.type.toUpperCase()+' RIFT / HOLD X',r.x,r.y+r.h+.55,r.z+.08,3.7);return{r,ghost,solid};});
 // One original courier companion: coat, boots, scarf, satchel and articulated limbs.
 const tavi=new T.Group();tavi.name='Tavi';root.add(tavi);add('box','cloth',[0,1.03,0],[.47,.63,.27],tavi);add('cylinder','cloth',[0,.68,0],[.3,.4,.3],tavi);add('sphere','skin',[0,1.55,-.025],[.16,.21,.16],tavi);add('sphere','hair',[0,1.66,.04],[.18,.15,.18],tavi);add('box','brass',[0,1.30,-.17],[.50,.08,.045],tavi);add('box','leather',[.31,.84,.035],[.23,.32,.24],tavi);
 const limbs=[];for(const side of[-1,1]){const leg=new T.Group();leg.position.set(side*.13,.65,0);tavi.add(leg);add('box','dark',[0,-.25,0],[.17,.5,.19],leg);add('box','leather',[0,-.55,-.06],[.19,.16,.32],leg);const arm=new T.Group();arm.position.set(side*.30,1.27,0);tavi.add(arm);add('box','cloth',[0,-.22,0],[.16,.44,.18],arm);add('sphere','skin',[0,-.49,0],[.085,.12,.085],arm);limbs.push({leg,arm,side});}
 const flightRing=add('ring','glow',[0,.25,0],[.6,.6,.6],tavi);flightRing.rotation.x=Math.PI/2;
 const traps=Array.from({length:3},()=>{const g=new T.Group();root.add(g);const ring=add('ring','glow',[0,.035,0],[.42,.42,.42],g);ring.rotation.x=Math.PI/2;add('cylinder','brass',[0,.08,0],[.13,.12,.13],g);g.visible=false;return g;});
 const drops=Array.from({length:24},()=>{const g=new T.Group();root.add(g);add('box','dark',[0,.12,0],[.16,.16,.85],g);add('box','timber',[0,.12,.37],[.19,.18,.28],g);add('box','brass',[0,.12,-.6],[.06,.06,.4],g);const ring=add('ring','glow',[0,.025,0],[.55,.55,.55],g);ring.rotation.x=Math.PI/2;g.visible=false;return g;});
 kit.flush();let last=null;const stats={decks:COMBAT_DECKS.length,cover:cover.length,consoles:ARENA_CONSOLES.length,rifts:RIFTS.length,trapCapacity:traps.length,dropCapacity:drops.length,companionVisible:false};
 function update(s,{menu=false,reduced=false}={}){const k=s.skirmish;if(!k)return;dynamicCount=0;const c=k.companion;tavi.visible=!menu&&Math.hypot(c.x-s.p.x,c.y-s.p.y,c.z-s.p.z)<100;tavi.position.set(c.x,c.y,c.z);tavi.rotation.y=c.heading||0;flightRing.visible=!!c.flying;const moving=last&&Math.hypot(c.x-last.x,c.z-last.z)>.005,phase=reduced?0:Math.sin(s.time*9)*(moving?.38:.025);for(const{leg,arm,side}of limbs){leg.rotation.x=side*phase;arm.rotation.x=k.offer?-.95:-side*phase*.65;}last={x:c.x,z:c.z};stats.companionVisible=tavi.visible;
  veil.uniforms.time.value=reduced?0:s.time;
  for(const v of rifts){v.ghost.material=scene.userData.auroraEffects!==false&&scene.userData.auroraRich?veil:kit.materials.ghost;const active=k.rift?.id===v.r.id&&k.rift.life>0;v.solid.visible=active;v.ghost.visible=!active;if(active)dynamicCount++;}
  traps.forEach((g,i)=>{const t=k.traps[i];g.visible=!!t&&!menu;if(t){g.position.set(t.x,t.y,t.z);g.rotation.y=reduced?0:s.time*.5;dynamicCount++;}});
  drops.forEach((g,i)=>{const d=k.gunDrops[i];g.visible=!!d&&!menu;if(d){g.position.set(d.x,d.y,d.z);dynamicCount++;}});
  for(const v of consoleLights)v.mesh.visible=!menu;
 }
 return{update,dispose(){rifts.forEach(v=>v.ghost.material=kit.materials.ghost);veil.dispose();kit.dispose();},stats:()=>({...stats,dynamicVisible:dynamicCount})};
}
