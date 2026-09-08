import * as T from './vendor/three.module.js';
import {WORLD,point,street,add,mul,norm,tangent,localPosition} from './world.mjs';
import {road,mesh,anchor,batchStatic} from './art.mjs';
import {faceSurface} from './neighborhood.mjs';
const frontAt=(t,x)=>tangent(add(street(t+1,x),mul(street(t,x),-1)),street(t,x));
function textSign(parent,label,t,x,yaw=0){const g=new T.Group();parent.add(g);faceSurface(g,street(t,x),frontAt(t,x));g.rotateY(yaw);mesh(g,'cylinder','#35555d',[0,1.15,0],[.045,2.3,.045]);const c=document.createElement('canvas');c.width=256;c.height=80;const q=c.getContext('2d');q.fillStyle='#244b55';q.fillRect(0,0,256,80);q.strokeStyle='#efd497';q.lineWidth=5;q.strokeRect(5,5,246,70);q.fillStyle='#fff1ca';q.font='bold 33px system-ui';q.textAlign='center';q.fillText(label,128,53,235);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const s=new T.Mesh(new T.PlaneGeometry(1.8,.58),new T.MeshStandardMaterial({map:tx,roughness:.82,side:T.DoubleSide}));s.position.set(0,2.35,0);g.add(s);}
function crosswalk(parent,t,x,acrossT=false){const g=new T.Group();parent.add(g);faceSurface(g,street(t,x),frontAt(t,x));if(acrossT)g.rotateY(Math.PI/2);for(let i=-4;i<=4;i++)mesh(g,'box','#efe4c8',[i*.52,.23,0],[.28,.025,2.9]);}
function stuntGate(parent,gate){const g=anchor(parent,gate.n,.25),ring=new T.Mesh(new T.TorusGeometry(1.45,.11,10,42,Math.PI),new T.MeshStandardMaterial({color:'#f0c55f',emissive:'#7b5011',emissiveIntensity:.6,metalness:.3,roughness:.38}));ring.rotation.z=Math.PI;ring.position.y=1.45;g.add(ring);for(const x of[-1.45,1.45])mesh(g,'cylinder','#826b4c',[x,.7,0],[.09,1.4,.09]);return {gate,g,ring};}
export function createNeighborhoodNetwork(root){const roads=[],sidewalks=[],decor=new T.Group();root.add(decor);
 for(const r of WORLD.roads.slice(1)){const asphalt=road(root,r.points,r.width,'#5f6e70',.16);roads.push({mesh:asphalt,points:r.points,width:r.width});for(const p of r.sidewalks){const sw=road(root,p,1.55,'#d2c8b3',.2);sidewalks.push([sw,p]);}road(root,r.points,.09,'#dfc77d',.22);}
 for(const t of[18,42,66,90,114]){crosswalk(decor,t,0,false);crosswalk(decor,t,-20,true);crosswalk(decor,t,20,true);crosswalk(decor,t,36,true);}
 for(const s of WORLD.roadLabels)textSign(decor,s.name,s.t,s.x,s.x===36?Math.PI/2:0);
 for(const [i,r] of WORLD.roads.slice(1).entries())for(let k=0;k<5;k++){const p=r.coords[Math.floor((k+.5)/5*(r.coords.length-1))];const g=new T.Group();decor.add(g);faceSurface(g,p.n,frontAt(p.t,p.x));const side=k%2?1:-1;mesh(g,'cylinder','#45636c',[side*(r.width/2+1.7),2.3,0],[.055,4.6,.055]);mesh(g,'box','#eedfad',[side*(r.width/2+1.7),4.52,-.3],[.32,.16,.58]);}
 batchStatic(decor);const stunts=WORLD.stuntGates.map(g=>stuntGate(root,g));
 return {roads,sidewalks,update(s){for(const x of stunts){x.ring.rotation.y+=.015;x.g.visible=!s.stunts.has(x.gate.id);}},inspect:()=>({roadSegments:WORLD.roads.length,branchRoads:WORLD.roads.length-1,bonusStops:WORLD.bonusStops.length,stuntGates:WORLD.stuntGates.length})};}
