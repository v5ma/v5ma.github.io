import * as T from './vendor/three.module.js';
import {predictThrow,throwReadiness,throwPosition} from './throw-path.mjs';
/* Aim-only world geometry. No DOM, new buttons, head attachment or render target. */
export function createThrowGuide(scene){
 const root=new T.Group();root.name='Rainward tactical throw guide';root.visible=false;scene.add(root);
 const positions=new Float32Array(81*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));const distances=new Float32Array(81);geometry.setAttribute('lineDistance',new T.BufferAttribute(distances,1));
 const material=new T.LineDashedMaterial({color:0xebdba9,dashSize:.16,gapSize:.12,transparent:true,opacity:.85,depthWrite:false});
 const line=new T.Line(geometry,material);line.frustumCulled=false;root.add(line);
 const landing=new T.Mesh(new T.RingGeometry(.24,.32,24),new T.MeshBasicMaterial({color:0xebdba9,side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));landing.rotation.x=-Math.PI/2;root.add(landing);
 const cross=new T.LineSegments(new T.BufferGeometry().setFromPoints([new T.Vector3(-.19,0,-.19),new T.Vector3(.19,0,.19),new T.Vector3(-.19,0,.19),new T.Vector3(.19,0,-.19)]),new T.LineBasicMaterial({color:0xf0a48b,depthWrite:false}));root.add(cross);
 let last=null,plans=0;
 function update(state,aiming,yaw){
  const p=state.player,kind=p.equipped;
  root.visible=!!aiming&&!!p.survival&&state.status==='playing'&&['bottle','smoke'].includes(kind)&&p.waterMode!=='swim';
  if(!root.visible){last=null;return;}
  const reason=throwReadiness(state,kind),plan=predictThrow(p,yaw,kind);plans++;
  const valid=!reason&&plan.valid;last={valid,kind,reason:reason||plan.reason,range:plan.range,shortened:plan.shortened,landing:plan.path?{...plan.path.to}:null};
  line.visible=!!plan.path;landing.visible=!!plan.path;cross.visible=!valid;
  const tint=valid?(kind==='smoke'?0xa5d9c4:0xebdba9):0xf0a48b;material.color.setHex(tint);landing.material.color.setHex(tint);
  if(plan.path){for(let i=0;i<=80;i++){const q=throwPosition(plan.path,i/80);positions.set([q.x,q.y,q.z],i*3);distances[i]=i?distances[i-1]+Math.hypot(q.x-positions[(i-1)*3],q.y-positions[(i-1)*3+1],q.z-positions[(i-1)*3+2]):0;}geometry.attributes.position.needsUpdate=true;geometry.attributes.lineDistance.needsUpdate=true;landing.position.set(plan.path.to.x,plan.path.to.y+.025,plan.path.to.z);cross.position.copy(landing.position);}
  else{cross.position.set(p.x-.5*Math.sin(yaw),p.y+.15,p.z-.5*Math.cos(yaw));}
 }
 return {root,update,stats:()=>({visible:root.visible,plans,...(last||{}),extraRenderTargets:0}),dispose(){root.removeFromParent();root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
