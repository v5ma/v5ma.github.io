import * as T from './vendor/three.module.js';
import {RADIUS,at,point,rand,add,mul,norm,cross} from './model.mjs';
export const materials={};
function mat(c){if(!materials[c])materials[c]=new T.MeshStandardMaterial({color:c,roughness:.86,metalness:0});return materials[c];}
const geo={box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,7),cylinder:new T.CylinderGeometry(1,1,1,9),ball:new T.IcosahedronGeometry(1,1),round:new T.SphereGeometry(1,10,8)};
export function mesh(parent,shape,c,p=[0,0,0],s=[1,1,1],r=[0,0,0]){const m=new T.Mesh(geo[shape],mat(c));m.position.set(...p);m.scale.set(...s);m.rotation.set(...r);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
export function anchor(parent,n,lift=0,yaw=0){const g=new T.Group();g.position.set(...point(n,lift));g.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...n));g.rotateY(yaw);parent.add(g);return g;}
export function tree(parent,t){const g=anchor(parent,t.n);const k=t.size;mesh(g,'cylinder','#8b6846',[0,k,0],[.16,2*k,.16]);
 if(t.style==='fir'){for(let i=0;i<3;i++)mesh(g,'cone',['#238d61','#329b68','#4aaf73'][i],[0,(1.25+i*.72)*k,0],[(1.2-i*.23)*k,2.1*k,(1.2-i*.23)*k],[0,i*.52,0]);}
 else{mesh(g,'ball','#74b651',[0,2.35*k,0],[1.22*k,1.45*k,1.2*k]);mesh(g,'ball','#a0c357',[.7*k,2.1*k,.24*k],[.85*k,.92*k,.85*k]);}return g;}
export function building(parent,site){const g=anchor(parent,site.n,0,site.type==='mill'?.3:0),t=site.type;
 if(t==='garden'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;mesh(g,'box','#986b46',[Math.sin(a)*1.1,.2,Math.cos(a)*1.1],[.55,.38,.55]);for(let k=0;k<4;k++)mesh(g,'ball',k%2?'#f2c959':'#e99dba',[Math.sin(a)*1.1+rand(k)*.3,.6+rand(i+k)*.25,Math.cos(a)*1.1],[.14,.14,.14]);}return {g};}
 if(t==='beacon'){mesh(g,'cylinder','#d8d6bd',[0,1.5,0],[.85,3,.85]);mesh(g,'cylinder','#488d8e',[0,2.75,0],[1,1,1]);mesh(g,'cone','#efd494',[0,3.55,0],[1.28,.7,1.28]);for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(g,'box','#b5eadb',[Math.sin(a)*.9,2.8,Math.cos(a)*.9],[.4,.65,.09],[0,a,0]);}const orb=mesh(g,'round','#ffdf88',[0,3.1,0],[.33,.33,.33]);return {g,orb};}
 const roof=t==='post'?'#e6a353':t==='mill'?'#477f86':'#3d8880';
 mesh(g,'box',site.color,[0,1,0],[2.7,2,2.5]);mesh(g,'box','#ae7943',[0,.2,0],[2.9,.35,2.8]);
 for(const x of[-.88,.88]){mesh(g,'box','#ffe5ae',[x,1.25,1.265],[.66,.72,.09]);mesh(g,'box','#355d65',[x,1.25,1.32],[.48,.54,.05]);mesh(g,'box','#f3d6a7',[x,1.25,1.35],[.05,.55,.03]);}
 mesh(g,'box','#496761',[0,.7,1.3],[.6,1.3,.13]);mesh(g,'box','#f3d797',[.18,.74,1.39],[.07,.07,.03]);
 for(const side of[-1,1])mesh(g,'box',roof,[side*.76,2.3,0],[1.92,.22,3.05],[0,0,side*.55]);
 mesh(g,'box','#7b7564',[.8,2.9,-.6],[.44,1.25,.44]);mesh(g,'box','#c7c2a5',[.8,3.54,-.6],[.58,.12,.58]);
 mesh(g,'box','#c39a62',[0,.15,1.85],[1.6,.22,1]);for(const x of[-1.1,1.1])mesh(g,'box','#f0d6aa',[x,1.05,2.05],[.10,2,.10]);mesh(g,'box',roof,[0,1.94,1.85],[2.65,.15,1.2],[.09,0,0]);
 if(t==='post'){const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.fillStyle='#254f51';x.fillRect(0,0,256,96);x.fillStyle='#fff0bc';x.font='bold 49px sans-serif';x.textAlign='center';x.fillText('SVGN',128,67);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(1.75,.65),new T.MeshStandardMaterial({map:tx,roughness:.8}));sign.position.set(0,1.97,2.48);g.add(sign);}
 let wheel=null;if(t==='mill'){wheel=new T.Group();wheel.position.set(1.6,.9,0);g.add(wheel);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;mesh(wheel,'box','#b98151',[0,Math.sin(a),Math.cos(a)],[.45,.22,.5],[a,0,0]);}for(let i=0;i<5;i++)mesh(wheel,'box','#dfb87b',[0,0,0],[.14,.12,2.2],[i*Math.PI/5,0,0]);}
 return {g,wheel};}
export function mailbox(parent,site){const g=anchor(parent,site.mail);mesh(g,'cylinder','#8f7658',[0,.45,0],[.06,.9,.06]);mesh(g,'box','#e8c389',[0,.88,0],[.55,.42,.42]);mesh(g,'box','#2a5763',[0,.9,.23],[.4,.1,.025]);const flag=mesh(g,'box','#f0a454',[.34,1.03,0],[.2,.3,.04]);return {g,flag};}
export function bridge(parent){const g=anchor(parent,at(5.55,1),.30,-.05);for(let i=-6;i<=6;i++){const y=.15+.20*Math.cos(i/6*Math.PI/2);mesh(g,'box','#c18e59',[i*.28,y,0],[.26,.18,1.6]);}
 for(const z of[-.77,.77]){for(const x of[-1.7,-.85,0,.85,1.7])mesh(g,'box','#91673f',[x,.55,z],[.1,1,.1]);mesh(g,'box','#dfb779',[0,.88,z],[3.7,.09,.09]);}return g;}
export function avatar(parent){const g=new T.Group();parent.add(g);const body=new T.Group();g.add(body);
 mesh(body,'box','#eca348',[0,1.08,0],[.52,.56,.32]);mesh(body,'round','#f0c49b',[0,1.58,0],[.22,.26,.22]);mesh(body,'round','#345e68',[0,1.74,0],[.25,.14,.25]);mesh(body,'box','#345e68',[0,1.7,-.2],[.37,.06,.34]);mesh(body,'box','#774f33',[0,1.15,.24],[.41,.44,.18]);mesh(body,'box','#f5d39a',[0,1.2,.35],[.27,.16,.035]);
 for(const x of[-.33,.33])mesh(body,'box','#dca576',[x,.97,0],[.14,.48,.17],[0,0,-x*.35]);const legs=[];
 for(const x of[-.14,.14]){const l=new T.Group();l.position.set(x,.86,0);body.add(l);mesh(l,'box','#385e6c',[0,-.23,0],[.18,.5,.18]);mesh(l,'box','#f0d5a6',[0,-.51,-.07],[.21,.14,.32]);legs.push(l);}
 const unicycle=new T.Group();g.add(unicycle);const wheel=mesh(unicycle,'cylinder','#294a52',[0,.38,0],[.38,.19,.38],[0,0,Math.PI/2]);mesh(unicycle,'cylinder','#c7d9ca',[.11,.38,0],[.24,.025,.24],[0,0,Math.PI/2]);mesh(unicycle,'box','#d79542',[0,.62,0],[.28,.24,.45]);for(const x of[-.27,.27])mesh(unicycle,'box','#576f74',[x,.42,0],[.35,.08,.23]);return {g,body,legs,wheel,unicycle};}
export function road(parent,points,width,color,raise=.045){const pos=[],normal=[],verts=[];for(let i=0;i<points.length;i++){const n=points[i],next=points[Math.min(points.length-1,i+1)],prev=points[Math.max(0,i-1)],t=norm(add(next,mul(prev,-1))),side=norm(cross(n,t));for(const k of[-1,1]){const v=norm(add(n,mul(side,k*width/RADIUS/2)));verts.push(point(v,raise));}}
 for(let i=1;i<points.length;i++){for(const idx of[(i-1)*2,(i-1)*2+1,i*2,i*2,(i-1)*2+1,i*2+1]){pos.push(...verts[idx]);normal.push(...norm(verts[idx]));}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normal,3));const material=new T.MeshStandardMaterial({color,roughness:.98,side:T.DoubleSide});const m=new T.Mesh(geo,material);m.receiveShadow=true;parent.add(m);return m;}
