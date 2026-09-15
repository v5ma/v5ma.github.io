import {buildCourierBody} from './courier-body.mjs';
import * as T from './vendor/three.module.js';
import {mesh} from './art.mjs';
function rod(g,a,b,color,r=.035){const p=new T.Vector3(...a),q=new T.Vector3(...b),d=q.clone().sub(p),m=mesh(g,'cylinder',color,p.add(q).multiplyScalar(.5).toArray(),[r,d.length(),r]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
export function createCourier(parent,shirt='#287f98'){
 const g=new T.Group();parent.add(g);const {body,arms,legs,legChains,armChains}=buildCourierBody(g,shirt);
 const unicycle=new T.Group();g.add(unicycle);mesh(unicycle,'cylinder','#29424a',[0,.37,0],[.36,.18,.36],[0,0,Math.PI/2]);mesh(unicycle,'box','#365b6a',[0,.55,0],[.23,.37,.46]);mesh(unicycle,'box','#b8d7d6',[0,.69,-.244],[.11,.07,.014]);for(const side of[-1,1])mesh(unicycle,'box','#495d63',[side*.25,.36,0],[.31,.07,.29]);
 const bicycle=new T.Group();g.add(bicycle);const wheels=[];
 for(const z of[-.65,.65]){const wheel=new T.Group();wheel.position.set(0,.38,z);bicycle.add(wheel);const tire=new T.Mesh(new T.TorusGeometry(.34,.053,8,24),new T.MeshStandardMaterial({color:'#263b40',roughness:.8}));tire.rotation.y=Math.PI/2;wheel.add(tire);for(let j=0;j<6;j++){const a=j*Math.PI/6;rod(wheel,[0,Math.sin(a)*.3,Math.cos(a)*.3],[0,-Math.sin(a)*.3,-Math.cos(a)*.3],'#b0c5c5',.009);}wheels.push(wheel);}
 const col='#d3824f',hub=[0,.38,.65],pedal=[0,.4,0],seat=[0,.91,.25],fork=[0,.95,-.48];for(const [a,b] of[[hub,pedal],[hub,seat],[seat,pedal],[seat,fork],[pedal,fork],[fork,[0,.38,-.65]]])rod(bicycle,a,b,col,.037);rod(bicycle,seat,[0,1.06,.25],'#344951',.035);mesh(bicycle,'box','#354951',[0,1.07,.24],[.32,.09,.38]);rod(bicycle,fork,[0,1.21,-.48],'#b8d0cb');rod(bicycle,[-.37,1.21,-.48],[.37,1.21,-.48],'#b8d0cb');
 const pedals=[];for(const side of[-1,1])pedals.push(mesh(bicycle,'box','#344951',[side*.22,.40,0],[.22,.045,.20]));
 return {g,body,arms,legs,legChains,armChains,unicycle,bicycle,wheels,pedals};
}
export function createCar(parent,color){const g=new T.Group();parent.add(g);mesh(g,'box',color,[0,.62,0],[1.65,.6,3.2]);mesh(g,'box',color,[0,1.12,.12],[1.47,.58,1.8]);mesh(g,'box','#7aa3af',[0,1.16,-.81],[1.22,.39,.035]);mesh(g,'box','#405e69',[0,1.16,1.03],[1.22,.39,.025]);for(const x of[-.57,.57])mesh(g,'box','#f4e6ae',[x,.64,-1.62],[.38,.22,.04]);for(const x of[-.8,.8])for(const z of[-1,1])mesh(g,'cylinder','#283940',[x,.33,z],[.3,.19,.3],[0,0,Math.PI/2]);mesh(g,'box','#c7c9b6',[0,.36,-1.66],[1.59,.12,.1]);return g;}
