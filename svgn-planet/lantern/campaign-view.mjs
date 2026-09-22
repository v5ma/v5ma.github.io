import * as T from '../vendor/three.module.js';
import {CAMPAIGN_CASES,CAMPAIGN_SYSTEMS,campaignState,campaignRuntime,campaignTarget,campaignCanGlide} from './campaign.mjs';
export function createCampaignView({world,box,cyl,label}){
 const g=new T.Group();g.name='Night Watch campaign interiors and encounters';world.add(g);
 const roomProps=new T.Group();g.add(roomProps);
 // Every named building gets a readable work function, not an empty shell.
 const stations=[
  ['DEPOT OPS',-14.8,.8,15.7,0x5d6f7a],['PRESS ARCHIVE',-14.9,.7,1.2,0x7a6656],['MARKET PANTRY',-20.5,.65,-2.5,0x765845],['STOREHOUSE SORT',-10,.65,-17.6,0x5e657b],['GREENHOUSE SERVICE',18,.65,-16.5,0x53755d],['WORKSHOP FOUNDRY',17,.7,5.3,0x7b5b50],['PUMP UNDERCROFT',-.5,-1.55,-7,0x4c6e78],['RADIO BENCH',12,5.15,0,0x65536d]
 ];
 for(const [text,x,y,z,color] of stations){box(roomProps,color,x,y,z,1.8,.8,.8);label(text,x,y+1.25,z,2.6,.34,'#152d36','#ffe6ad',g);}
 // Low service vents and overhead perches support the predator chapter.
 for(const [x,z,r] of[[-20.4,-3.9,0],[-7.8,-16.8,Math.PI/2],[8.8,-4.2,Math.PI/2]]){const vent=box(g,0x263f49,x,.45,z,1.15,.72,.12,r);vent.material=vent.material.clone();}
 const perches=[[-10,5.35,-4.2],[2,5.35,-3.5],[15,5.35,-1]];for(const [x,y,z]of perches){const ring=new T.Mesh(new T.TorusGeometry(.32,.05,6,16),new T.MeshBasicMaterial({color:0x69d8c7}));ring.position.set(x,y,z);ring.rotation.x=Math.PI/2;g.add(ring);}
 const systems=CAMPAIGN_SYSTEMS.map(node=>{const marker=new T.Mesh(new T.TorusGeometry(.3,.055,6,18),new T.MeshBasicMaterial({color:0xffd27a}));marker.position.set(node.x,node.y+1.15,node.z);marker.rotation.x=Math.PI/2;g.add(marker);const text=label('FOCUS / '+node.label.toUpperCase(),node.x,node.y+1.75,node.z,2.6,.28,'#152d36','#ffe6ad',g);return {node,marker,text};});
 const enemies=[];for(let i=0;i<5;i++){const e=new T.Group();g.add(e);box(e,0x354b58,0,.7,0,.42,.8,.3);cyl(e,0xa3b0b5,0,1.35,0,.18,.32);const cue=new T.Mesh(new T.TorusGeometry(.48,.055,6,18),new T.MeshBasicMaterial({color:0x5bdcff}));cue.position.y=2;g.add(cue);const cone=new T.Mesh(new T.ConeGeometry(2.8,6,20,1,true),new T.MeshBasicMaterial({color:0x7dd9e8,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide}));cone.rotation.x=-Math.PI/2;cone.position.z=-3; e.add(cone);enemies.push({g:e,cue,cone});}
 const cape=new T.Mesh(new T.PlaneGeometry(2.2,1.3),new T.MeshStandardMaterial({color:0x1d2936,side:T.DoubleSide,roughness:.9}));cape.rotation.x=-.35;world.add(cape);
 return {update(s){const c=campaignState(s),r=campaignRuntime(s),active=!!c.active;for(const item of systems){const visible=active&&r.focus&&item.node.cases.includes(c.active);item.marker.visible=item.text.visible=visible;item.marker.material.color.setHex(r.systemsUsed.includes(item.node.id)?0x61747b:0xffd27a);}for(let i=0;i<enemies.length;i++){const v=enemies[i],e=r.enemies[i];v.g.visible=!!e&&e.hp>0;v.cue.visible=!!e&&e.hp>0&&e.phase==='windup';if(e){v.g.position.set(e.x,e.y,e.z);v.g.rotation.y=e.yaw;v.cone.visible=c.active==='predator'&&e.awareness<1;v.cone.material.opacity=.04+.08*Math.min(1,e.awareness);v.cue.position.set(e.x,e.y+2,e.z);}}
  cape.visible=campaignCanGlide(s)&&s.ride==='foot';cape.position.set(s.x,s.y+1.1,s.z+.25);cape.rotation.y=s.yaw;const gliding=r.glideSeconds>0&&s.y>1;cape.scale.set(gliding?1.8:1,gliding?1.2:1,1);
 },inspect:()=>({rooms:stations.length,perches:perches.length,systemNodes:systems.length,enemySlots:enemies.length,capeRig:true,target:campaignTarget?true:false})};
}
