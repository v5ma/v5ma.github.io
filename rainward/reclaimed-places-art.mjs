import * as T from './vendor/three.module.js';
import {PLACES_REVISION} from './reclaimed-places.mjs';
/* Original environmental stories, built into the ordinary level renderer.
 * Static detail is batched before the host kit flush. Solid silhouettes come
 * from the same boxes as movement, sight, shots and camera collision.
 */
export function createReclaimedPlacesArt(scene,A,chapter){
 if(!chapter.placesRevision)return {update(){},stats:()=>null};
 const doors=[],{add,label}=A;
 for(const o of chapter.obstacles.filter(o=>o.placeArt)){
  if(o.openOnTask){
   const door=A.mesh('box',[o.w,o.h,o.d],0x526769,'metal');door.name=o.id;door.position.set(o.x,o.bottom+o.h/2,o.z);scene.add(door);
   const lamp=new T.Mesh(new T.SphereGeometry(.085,8,6),new T.MeshBasicMaterial({color:0xe0a46b}));lamp.position.set(o.x+(o.w<o.d?.72:1.5),2.7,o.z+(o.w<o.d?1.5:.72));scene.add(lamp);
   const face=o.w<o.d?Math.PI/2:0,x=o.x+(o.w<o.d?.64:0),z=o.z+(o.w<o.d?0:.64);
   const closed=label(o.id.startsWith('dispatch')?'EMERGENCY SHUTTER\nRELEASE AT DISPATCH DESK':'GOODS SHUTTER\nRESTORE WORKSHOP RADIO',x,2.7,z,2.8,.65,'#283f45','#e9ce98',face);
   const opened=label('SERVICE EXIT OPEN\nRETURN TO SIGNAL BRIDGE',x,3.5,z,2.8,.55,'#29483d','#d9e7b4',face);opened.visible=false;
   doors.push({o,door,lamp,closed,opened});continue;
  }
  const tint=o.kind==='crate'?0x766b51:o.kind==='metal'?0x506867:o.kind==='counter'?0x8a795f:o.kind==='shelf'?0x636f67:0x747d71;
  add('box',o.x,o.bottom+o.h/2,o.z,o.w,o.h,o.d,tint,['crate','counter','shelf'].includes(o.kind)?'wood':o.kind==='metal'?'metal':'brick');
  // Trim follows the true bottom, never filling a preserved crawling channel.
  if(['crate','shelf','counter'].includes(o.kind)){
   const longX=o.w>o.d;
   for(const side of[-1,1])add('box',o.x+(longX?side*o.w*.42:0),o.bottom+o.h/2,o.z+(longX?0:side*o.d*.42),longX?.07:o.w+.04,o.h,longX?o.d+.04:.07,0xaaa084,'metal');
  }
 }
 if(chapter.id==='district'){
  label('PUMP 03\nQUAY SERVICE',-32,2.65,-24.94,2.7,.65,'#344e4a','#dfd2af');
  label('NORTH QUAY\nTRANSMITTER',-32,2.65,-41.02,2.7,.65,'#344e4a','#dfd2af',Math.PI);
  // Flood stain, disconnected pipe and a dry cabinet tell the building's use.
  for(const z of[-27,-30,-35,-38])add('box',-33.98,1.35,z,.022,.13,2.2,0xaaa78c,'paint');
  add('box',-33.91,2.45,-29.8,.16,.16,4.3,0x557070,'metal');
  add('box',-33.88,1.92,-31.87,.16,1.2,.16,0x557070,'metal');
  for(const z of[-29.35,-30.15]){add('cyl',-33.23,1.20,z,.19,.045,.19,0xd5cbb0,'metal',0,0,Math.PI/2);add('box',-33.20,1.20,z,.03,.18,.026,0x33494a,'metal',.4,0,0);}
  label('HIGH WATER / 1.35\nSUPPLY ISOLATED',-33.97,2.0,-29,2.2,.6,'#40504b','#e8d8ac',Math.PI/2);
  // Packed cots and coat hooks stay on/inside the physical bench and wall.
  for(let i=0;i<3;i++){const z=-36+i*.75;add('box',-33.52,.98,z,.65,.22,.52,0x998866,'cloth');add('box',-33.52,1.10,z,.67,.06,.07,0x485954,'cloth');add('box',-33.96,2.05,z,.08,.04,.12,0x8d8875,'metal');}
  label('EVACUATION WAITING AREA\nSERVICE SUSPENDED',-33.97,2.65,-37,2.3,.65,'#554d42','#e8dcc0',Math.PI/2);
  label('QUAY LOOKOUT\nNORTH TRANSMITTER',-30.04,.70,-37,2.0,.35,'#344e4a','#e3d5ac',-Math.PI/2);
  // Roof ribs stay above the collider canopy, with a large open rain break.
  for(const z of[-26,-28.4,-30.8])add('box',-32.0,3.54,z,4.1,.11,.10,0x706e59,'metal');
  add('box',-33.75,2.82,-26.5,.16,.22,.13,0xe4c58a,'glow');
  for(const [x,z]of[[-32,-23.8],[-32,-42.2],[-27,-44.2],[-18,-46]]){add('box',x,.024,z,.55,.018,.09,0xb8b18b,'paint');}
  label('COASTAL FREIGHT\nNIGHT DISPATCH',11,1.65,-38.57,2.4,.5,'#4b5043','#e4d8b7');
 }else{
  label('DRY RECORDS\nKEEP FLOOR CHANNEL CLEAR',31,2.45,-1.85,3.2,.7,'#37484b','#e4d3ad');
  // Suspended racks keep the same lower clearance in collision and art.
  for(const z of[-2.8,-12.2])add('box',31,3.4,z,.035,2.9,.035,0xa69b78,'metal');
  for(let i=0;i<9;i++){const z=-3-i;add('box',31,2.02,z,.92,.12,.67,i%2?0x917958:0x889382,'cloth');}
  label('COASTAL EVACUATION\nNO MORE DEPARTURES',32,2.1,19.2,3.4,.75,'#394c53','#d9c69c');
  label('EMERGENCY RELEASE\nRECORD THE LAST DISPATCH',32,1.35,19.5,2.6,.5,'#594d3c','#ecd9ad');
  add('box',32.8,.96,19.65,.16,.25,.14,0xa88653,'metal');
  // The visible release cable leads from the existing task to its actual door.
  for(const [a,b]of[[[32.8,2.8,19.65],[20.7,2.8,19.65]],[[20.7,2.8,19.65],[20.7,2.8,-22]],[[-31,2.5,-23],[-31,2.5,-26.3]]]){
   const wire=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(...a),new T.Vector3(...b)]),new T.LineBasicMaterial({color:0xb6a479}));wire.name='Reclaimed service-release cable';scene.add(wire);
  }
  label('WORKSHOP GOODS EXIT\nRADIO + SAFE POWER',-32,2.6,-25.9,3.1,.65,'#34484b','#e7d1a3');
  // Station workbench details imply a repair interrupted, not free weapons.
  for(const z of[.5,2,3.5]){add('box',-36,1.03,z,1.1,.10,.45,0x9a927a,'metal');add('box',-36.25,1.14,z,.20,.12,.25,0x4b5e5c,'metal');}
  for(const [x,z]of[[-32,-29],[18,-22],[0,-30]])add('box',x,.03,z,.8,.024,.13,0xc0ac78,'paint');
 }
 return {update(state){for(const d of doors){const open=!!state.completedTasks?.includes(d.o.openOnTask);d.door.scale.y=open?.10:d.o.h;d.door.position.y=open?d.o.bottom+d.o.h+.06:d.o.bottom+d.o.h/2;d.closed.visible=!open;d.opened.visible=open;d.lamp.material.color.setHex(open?0xb9d89c:0xe0a46b);}},stats:()=>({revision:PLACES_REVISION,chapter:chapter.id,doors:doors.length,sourceBoxes:chapter.obstacles.filter(o=>o.placeArt).length})};
}
