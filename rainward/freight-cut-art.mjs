/* Representative functional graybox art. The collision gate changes atomically
 * with its visible rolled state; no tween leaves a closed-looking open barrier. */
import * as T from './vendor/three.module.js';
import {freightCutState,FREIGHT_CUT_REVISION} from './freight-cut.mjs';
export function createFreightCutArt(scene,A,chapter){
 if(chapter.id!=='district')return {update(){},stats:()=>null};
 const door=A.mesh('box',[.6,3.4,3],0x596c69,'metal');door.name='Freight loading shutter';door.position.set(14,1.7,-24);scene.add(door);
 const lamp=new T.Mesh(new T.SphereGeometry(.07,8,6),new T.MeshBasicMaterial({color:0xefba70}));lamp.position.set(14.6,2.3,-22.1);scene.add(lamp);
 const labels=[];
 for(const [x,yaw]of [[13.46,-Math.PI/2],[14.54,Math.PI/2]]){
  const closed=A.label('WEST LOADING SEALED\nPOWER AT SOUTH RECEIVER',x,2.8,-24,2.5,.65,'#334e49','#f0dab1');closed.rotation.y=yaw;
  const open=A.label('WEST LOADING OPEN\nMARKET / CLINIC RETURN',x,3.05,-24,2.5,.5,'#334e49','#f0dab1');open.rotation.y=yaw;open.visible=false;labels.push({closed,open});
 }
 A.label('RECEIVER + LOADING CIRCUIT\nCLINIC BATTERY REQUIRED',18,1.9,-10.45,2.4,.55,'#334e49','#f0dab1');
 const cable=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(18,1.0,-11),new T.Vector3(14.65,1.0,-11),new T.Vector3(14.65,2.7,-11),new T.Vector3(14.65,2.7,-24)]),new T.LineBasicMaterial({color:0xb99d69}));cable.name='Receiver loading circuit';scene.add(cable);
 // Faded freight-lane ticks point toward cover that already existed in the
 // district. They are render-only: no collision, hidden route or HUD arrow.
 const marks=[[-7.1,.045,-12.2,-.35],[-4.8,.045,-15.5,-.75],[1.9,.045,-16.5,-1.35],[7.6,.045,-17,-1.50]];
 for(const [x,y,z,yaw]of marks){const mark=A.mesh('box',[.85,.025,.13],0xb7a36c,'stone');mark.name='Faded freight approach mark';mark.position.set(x,y,z);mark.rotation.y=yaw;scene.add(mark);}
 let open=false;
 return {update(state){open=freightCutState(state).open;door.scale.y=open?.065:1;door.position.y=open?3.52:1.7;labels.forEach(pair=>{pair.open.visible=open;pair.closed.visible=!open;});lamp.material.color.setHex(open?0xb7ddb7:0xefba70);},stats:()=>({revision:FREIGHT_CUT_REVISION,open,approachMarks:marks.length,phase:'functional-graybox',humanApproved:false})};
}
