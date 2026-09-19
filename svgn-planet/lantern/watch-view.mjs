/* Same scene, same portal shader collection: no overlays or independent world. */
import * as T from '../vendor/three.module.js';
import {WATCH_POINTS,GRAPPLE_ANCHORS,watchState,watchRuntime,validGrapple} from './watch.mjs';
import {blocked,lineClear,support,floorHeight,surfaces} from './core.mjs';
export function createWatchView({world,box,cyl,label}){
 const group=new T.Group();group.name='Night Watch case';world.add(group);
 const desk=WATCH_POINTS.desk;box(group,0x455c71,desk.x,.65,desk.z,1.2,.15,.6);
 label('MARA / NIGHT WATCH',desk.x,1.8,desk.z,2.5,.33,'#17384a','#ffdc8a',group);
 const devices=['trace','meter','roof','ground'].map(id=>{const p=WATCH_POINTS[id],g=new T.Group();g.position.set(p.x,p.y,p.z);group.add(g);box(g,0x2b454a,0,.8,0,.45,.9,.28);const lamp=box(g,0xffad54,0,1.05,.17,.28,.18,.03);const text=id==='roof'?'ROOF OVERRIDE':id==='ground'?'GROUND RESET':'SCAN RECEIVER';label(text,0,1.7,0,1.9,.28,'#17384a','#ffdc8a',g);return {g,lamp};});
 const rings=GRAPPLE_ANCHORS.map(a=>{const mesh=new T.Mesh(new T.TorusGeometry(.38,.065,6,16),new T.MeshStandardMaterial({color:0x4da393,emissive:0x123f34,roughness:.8}));mesh.position.set(a.x,a.y+1.3,a.z);group.add(mesh);const text=label('GRAPPLE / '+a.label,a.x,a.y+2.1,a.z,2.2,.28,'#17384a','#a6ffdb',group);return {a,mesh,text};});
 const bots=[0,1].map(i=>{const g=new T.Group();group.add(g);cyl(g,0x405c6c,0,.75,0,.23,1);box(g,0x82979e,0,1.3,0,.4,.25,.35);const light=box(g,0xffbd60,0,1.3,-.2,.2,.09,.04);light.material=light.material.clone();for(const x of[-.27,.27]){box(g,0x506b78,x,.75,0,.13,.65,.16);cyl(g,0x263d49,x/2,.2,0,.075,.4);}if(i)box(g,0x406684,0,.9,-.28,.65,.6,.09);
  const cue=new T.Mesh(new T.TorusGeometry(.46,.07,6,18),new T.MeshBasicMaterial({color:0x60d9ff}));cue.position.y=2;g.add(cue);const text=label(i?'SHIELD / COUNTER OR PULSE':'SCOUT / COUNTER BLUE',0,2.5,0,2.3,.32,'#17384a','#ffdfad',g);return {g,cue,light,text};});
 const trace=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(12,5.4,-2.2),new T.Vector3(7,5.4,-3.5),new T.Vector3(6.5,1.1,-9.8)]),new T.LineDashedMaterial({color:0x83eeeb,dashSize:.4,gapSize:.25}));trace.computeLineDistances();group.add(trace);
 const smoke=new T.Mesh(new T.SphereGeometry(1.5,12,8),new T.MeshBasicMaterial({color:0xa8c6ca,wireframe:true,transparent:true,opacity:.18,depthWrite:false}));group.add(smoke);
 let active=false;
 return {update(s){const w=watchState(s),r=watchRuntime(s);active=w.tracking&&w.stage>0&&w.stage<3;
  bots.forEach((b,i)=>{const e=r.sentries[i];b.g.visible=active||w.stage>=3;b.g.position.set(e.x,e.y,e.z);b.g.rotation.y=Math.atan2(s.x-e.x,s.z-e.z);b.g.scale.y=e.hp>0?1:.35;b.light.material.color.setHex(e.hp===0?0x65c69c:e.stun?0xeeee88:0xffbd60);b.cue.visible=active&&e.phase==='windup';b.cue.scale.setScalar(1+(e.timer||0)*.2);b.text.visible=active;});
  rings.forEach(b=>{b.mesh.visible=b.text.visible=w.stage>=1;const safe=w.stage>=1&&validGrapple(s,b.a,{blocked,lineClear,support,floorHeight,surfaces});b.mesh.material.color.setHex(safe?0x8bf4c8:0x466875);b.mesh.rotation.y=-s.yaw;b.text.visible=w.stage>=1&&r.scan;});
  devices.forEach((d,i)=>{d.g.visible=w.tracking||w.stage>=3;d.lamp.material.color.setHex(w.stage>=3?0x79d6ac:r.scan?0x83eeeb:0xffad54);});trace.visible=active&&r.scan;
  smoke.visible=r.smoke>0;smoke.position.set(s.x,s.y+1,s.z);},inspect:()=>({caseActive:active,sentries:2,grappleAnchors:rings.length,worldSpace:true,screenOverlayPlanes:0})};
}
