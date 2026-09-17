/* Read-only orientation. This bearing is not a fabricated obstacle-free path. */
import * as T from './vendor/three.module.js';
import {expeditionGoal} from './expedition-core.mjs';
export function goalGuide(s){
 const g=expeditionGoal(s);if(!g||!['x','y','z'].every(k=>Number.isFinite(g[k])))return null;
 const height=g.y-s.p.y,distance=Math.hypot(g.x-s.p.x,height,g.z-s.p.z);
 return {id:g.id||s.expedition.tracked,name:g.name||'Tracked destination',x:g.x,y:g.y,z:g.z,distance:Math.round(distance),height:Math.round(height),level:Math.abs(height)<2?'same level':height>0?'above you':'below you',bearing:Math.atan2(g.x-s.p.x,s.p.z-g.z)};
}
export function drawGoalGuide(g,s,X,Z,w,h){
 const goal=goalGuide(s);if(!goal)return null;
 const x=X(goal.x),z=Z(goal.z);g.save();g.lineWidth=2;g.strokeStyle='#ffe595';g.setLineDash([7,6]);g.beginPath();g.moveTo(X(s.p.x),Z(s.p.z));g.lineTo(x,z);g.stroke();g.setLineDash([]);
 g.fillStyle='#102633';g.strokeStyle='#ffe595';g.lineWidth=3;g.beginPath();g.arc(x,z,16,0,Math.PI*2);g.fill();g.stroke();g.translate(x,z);g.rotate(Math.PI/4);g.fillStyle='#ffe595';g.fillRect(-6,-6,12,12);g.restore();
 g.save();g.fillStyle='#102633';g.fillRect(65,7,w-78,45);g.fillStyle='#ffe595';g.font='bold 16px Arial';g.textAlign='left';g.fillText('NEXT: '+goal.name,76,27,w-98);g.font='12px Arial';g.fillStyle='#e2eee5';g.fillText(goal.distance+' m / '+goal.level+(Math.abs(goal.height)>=2?' ('+Math.abs(goal.height)+' m)':'')+' / dashed line = direction, not a walkable route',76,44,w-98);g.restore();return goal;
}
export function createGoalBeacon(scene){
 const root=new T.Group();root.name='Tracked goal beacon / read only';scene.add(root);
 const mat=new T.MeshBasicMaterial({color:0xffdf88,transparent:true,opacity:.9,depthWrite:false});
 const ring=new T.Mesh(new T.TorusGeometry(1.1,.09,6,24),mat);ring.rotation.x=Math.PI/2;ring.position.y=.15;root.add(ring);
 const arrow=new T.Mesh(new T.ConeGeometry(.35,.9,4),mat);arrow.rotation.z=Math.PI;arrow.position.y=3;root.add(arrow);
 let current=null;return {update(s,playing){current=goalGuide(s);root.visible=!!playing&&!!current;if(current)root.position.set(current.x,current.y,current.z);},stats:()=>current?{...current}:null};
}
