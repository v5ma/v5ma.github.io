import * as T from '../vendor/three.module.js';
import {residents,storyTarget,cityMarkers,cityState} from './city.mjs';
export function createCityView({world,box,cyl,label}){
 const scene=new T.Group();scene.name='Resident interiors and neighborhood work';world.add(scene);
 // Furniture does not fill the approach lanes. These are ground/loft rooms,
 // not teleported interior scenes or a separate mission simulation.
 const props=new T.Group();scene.add(props);
 box(props,0x555e66,-9.6,.7,1.1,1.7,1.4,1.15);cyl(props,0xb0bac0,-9.6,1.52,1.1,.38,.15);
 box(props,0xb89d71,-9,1,-17.7,1.6,.16,.7);
 for(const x of[-16,-14,-6]){box(props,0x795d45,x,.85,-18.8,1.4,1.7,.65);for(const y of[.5,1.2,1.9])box(props,0xbfa779,x,y,-18.8,1.5,.08,.8);}
 box(props,0x6d5140,-20.5,.9,-2.7,2.45,.2,1.05);cyl(props,0x676e6c,-20.5,1.15,-2.7,.34,.3);
 for(const x of[15.2,20.7])for(const z of[-18,-16]){box(props,0x836b4e,x,.35,z,1.1,.7,.9);cyl(props,0x658d53,x,.9,z,.27,.55);}
 box(props,0x645d73,14.5,5.2,.5,1.6,.24,.8);box(props,0x384d5b,14.5,5.62,.5,.7,.6,.4);
 for(const [text,x,y,z,w]of[['BEA / MARKET KITCHEN',-20.5,2.7,2.6,3.3],['TOMAS / NORTH STOREHOUSE',-10,3.2,-15.38,7],['LIN / COMMUNITY GREENHOUSE',18,2.8,-13.85,7],['ADA / PUBLIC PRINT ROOM',-9.5,2.5,2.5,3.5],['SAL / NEIGHBORHOOD RADIO',14.5,6.2,1,4]])label(text,x,y,z,w,.45,'#203e48','#ffe6ad',scene);
 const people=residents.map(r=>{
  const g=new T.Group();scene.add(g);g.position.set(r.x,r.y,r.z);
  box(g,r.color,0,1.12,0,.45,.65,.27);cyl(g,0xd4a57e,0,1.63,0,.145,.28);box(g,0x433e39,0,1.81,0,.3,.12,.28);
  for(const sign of[-1,1]){box(g,0x3b4c58,sign*.13,.46,0,.18,.7,.2);box(g,0x343b40,sign*.13,.08,-.055,.19,.14,.31);box(g,r.color,sign*.29,1.12,0,.14,.53,.17);box(g,0xd4a57e,sign*.29,.8,-.02,.13,.16,.15);}
  const name=label(r.name,r.x,r.y+2.04,r.z,2.8,.36,'#203e48','#ffedc4',scene);
  const bang=label('!',r.x,r.y+2.55,r.z,.44,.55,'#b78923','#ffffff',scene);
  return {r,g,name,bang};
 });
 const target=new T.Group();target.name='Tracked mission beacon';world.add(target);
 const material=new T.MeshBasicMaterial({color:0xffd34e,depthTest:false,depthWrite:false,transparent:true,opacity:.94});
 const diamond=new T.Mesh(new T.OctahedronGeometry(.48),material);diamond.position.y=2.9;diamond.renderOrder=30;target.add(diamond);
 const ring=new T.Mesh(new T.TorusGeometry(.8,.09,8,32),material);ring.rotation.x=Math.PI/2;ring.position.y=.09;ring.renderOrder=30;target.add(ring);
 const arrow=new T.Mesh(new T.ConeGeometry(.24,.6,8),material);arrow.rotation.z=Math.PI;arrow.position.y=2.05;arrow.renderOrder=30;target.add(arrow);
 const flag=label('NEXT OBJECTIVE',0,3.7,0,3,.48,'#6c5413','#fff4c6',target);flag.material.depthTest=false;flag.renderOrder=31;
 const paper=box(scene,0xffedbd,-9.6,1.65,1.1,.65,.03,.42);
 const dining=new T.Group();scene.add(dining);for(let i=0;i<4;i++)cyl(dining,0xf4c168,-21.1+i*.4,1.07,-2.7,.14,.09);
 const roofPlants=new T.Group();scene.add(roofPlants);for(let i=0;i<4;i++)cyl(roofPlants,0x619c6a,-15+i*.4,4.95,-4.4,.16,.75);
 const gathering=new T.Group();scene.add(gathering);for(let i=0;i<7;i++)cyl(gathering,0xffd162,4.8+i*.55,3.2,8,.15,.3);
 return {update(s,yaw){
  const markers=cityMarkers(s),c=cityState(s);for(const p of people){const near=Math.hypot(s.x-p.r.x,s.z-p.r.z)<4;p.g.rotation.y=near?Math.atan2(s.x-p.r.x,s.z-p.r.z):0;p.name.rotation.y=yaw;p.bang.rotation.y=yaw;p.bang.visible=markers.find(m=>m.id===p.r.id).available;}
  const t=storyTarget(s);target.visible=!!t;if(t){target.position.set(t.x,t.y,t.z);diamond.rotation.y=s.time*.6;flag.rotation.y=yaw;}
  paper.visible=c.completed.includes('press');dining.visible=c.completed.includes('kitchen');roofPlants.visible=c.completed.includes('garden');gathering.visible=c.completed.includes('gathering');
 },target,inspect:()=>({residents:people.length,missionBeacon:target.visible})};
}
