/* Representative art and causal feedback; final-art/hardware approval is separate. */
import * as T from './vendor/three.module.js';
import {FIREBREAK_SCREEN as S,FIREBREAK_DOOR as D,firebreakState,FIREBREAK_REVISION} from './freight-firebreak.mjs';
export function createFirebreakArt(scene,A,chapter){
 if(chapter.id!=='district')return {update(){},stats:()=>null};
 const root=new T.Group();root.name='Freight linked firebreak';scene.add(root);
 function mesh(name,w,h,d,x,y,z,color=0x626e68){const m=A.mesh('box',[w,h,d],color,'metal');m.name=name;m.position.set(x,y,z);root.add(m);return m;}
 const screen=mesh('Freight firebreak partition',S.w,S.h,S.d,S.x,4.0,S.z);
 const door=mesh('East yard shutter',D.w,D.h,D.d,D.x,D.h/2,D.z);
 // No interpolation that could disagree with an instantly switched collider.
 mesh('Firebreak header',S.w+.5,.22,.65,S.x,5.3,S.z,0x8c8c75);
 mesh('Firebreak lever',.14,.48,.14,27.2,1.05,-14.5,0xb5a168);
 mesh('Firebreak cable',6.8,.045,.045,23.6,3.5,-15.1,0xc0ad7e);
 for(let x=18.6;x<22.5;x+=.5)mesh('Partition floor boundary',.22,.018,.6,x,.035,S.z,0xb5a168);
 const closed=A.label('EAST YARD / LOCKED\nLINKED TO AISLE PARTITION',29.05,2.5,-15,2.9,.6,'#334b48','#f0dfaf');closed.rotation.y=Math.PI/2;
 const sign=A.label('PULL: PARTITION DOWN / YARD OPEN\nNOISY / KEEP THE MARKED FLOOR CLEAR',26.1,1.9,-14.9,3.0,.5,'#334b48','#f0dfaf');
 const open=A.label('EAST YARD OPEN\nNEXT CORNER / NORTH LOADING DOOR',29.05,2.5,-15,2.9,.6,'#334b48','#f0dfaf');open.rotation.y=Math.PI/2;open.visible=false;
 A.label('FREIGHT / FIREBREAK RETURN',30.7,2.0,-29.6,3,.5,'#334b48','#f0dfaf');
 let deployed=false;
 return {update(state){deployed=firebreakState(state).deployed;screen.position.y=deployed?S.h/2:4.0;door.scale.y=deployed?.05:1;door.position.y=deployed?3.45:D.h/2;closed.visible=!deployed;open.visible=deployed;sign.visible=true;},stats:()=>({revision:FIREBREAK_REVISION,deployed,partition:'linked-physical-collider',yardOpen:deployed,phase:'playable-graybox'})};
}
