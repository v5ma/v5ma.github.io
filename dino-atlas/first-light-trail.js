// A single bounded ground-mark draw inside the existing game/portal root.
import * as T from './vendor/three.module.js';
import {trailMarks,TRAIL_BUILD} from './first-light-route.js';
export class FirstLightTrail{
 constructor(root){
  this.root=new T.Group();this.root.name='First Light / optional foot trail';root.add(this.root);this.root.visible=false;this.route=null;this.disposed=false;
  this.geometry=new T.BufferGeometry();this.geometry.setAttribute('position',new T.Float32BufferAttribute([-.4,0,-.3,0,0,.4,0,0,.05,0,0,.4,.4,0,-.3,0,0,.05],3));this.geometry.computeVertexNormals();
  this.material=new T.MeshBasicMaterial({color:0xe9b962,side:T.DoubleSide,depthTest:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  this.mesh=new T.InstancedMesh(this.geometry,this.material,24);this.mesh.name='Amber route chevrons / not interaction targets';this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.count=0;this.mesh.frustumCulled=false;this.root.add(this.mesh);this.pose=new T.Object3D();
 }
 update(route,enabled){
  if(this.disposed)return;this.route=enabled?route:null;const marks=enabled?trailMarks(route):[];this.mesh.count=marks.length;this.root.visible=marks.length>0;
  for(let i=0;i<marks.length;i++){const m=marks[i];this.pose.position.set(m.x,m.y,m.z);this.pose.rotation.set(0,m.yaw,0);this.pose.updateMatrix();this.mesh.setMatrixAt(i,this.pose.matrix);}this.mesh.instanceMatrix.needsUpdate=true;
 }
 paint(canvas,to,small=false){
  const route=this.route;if(!route||!['trail','off-route'].includes(route.mode)||route.points.length<2)return;
  const c=canvas.getContext('2d');c.save();c.strokeStyle='#edbb68';c.lineWidth=small?3:2;c.setLineDash(small?[5,4]:[4,3]);c.beginPath();route.points.forEach((p,i)=>{const a=to(p.x,p.z);if(i)c.lineTo(...a);else c.moveTo(...a);});c.stroke();
  if(route.next){const [x,y]=to(route.next.x,route.next.z);c.setLineDash([]);c.strokeStyle='#f8ecd0';c.lineWidth=2;c.beginPath();c.arc(x,y,small?4:3,0,Math.PI*2);c.stroke();}c.restore();
 }
 snapshot(){return {build:TRAIL_BUILD,visible:this.root.visible,marks:this.mesh.count,mode:this.route?.mode||'inactive',next:this.route?.next?.name||null,points:this.route?.points?.map(p=>({...p}))||[],distance:this.route?.distance||0,optional:true,physicsChanged:false};}
 dispose(){if(this.disposed)return;this.disposed=true;this.root.removeFromParent();this.root.visible=false;this.mesh.count=0;this.mesh.dispose();this.geometry.dispose();this.material.dispose();this.route=null;}
}
