import {articulateResident} from './herd-rig.js?v=herds1';
import * as T from './vendor/three.module.js';
import {makeParkDinosaur,makeJeep,part,box,bone,ellipsoid,material,label} from './ranger-art.js';
// Merge static parts by material; articulated legs remain separate. This keeps a herd affordable.
export function bakeStatics(root,exclude=[]){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),remove=[];
 root.traverse(m=>{if(!m.isMesh||Array.isArray(m.material)||m.material.map)return;for(let p=m;p&&p!==root;p=p.parent)if(exclude.includes(p))return;const geo=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone()).applyMatrix4(inverse.clone().multiply(m.matrixWorld));if(!geo.attributes.normal)geo.computeVertexNormals();const a=groups.get(m.material)||{p:[],n:[]};a.p.push(...geo.attributes.position.array);a.n.push(...geo.attributes.normal.array);groups.set(m.material,a);remove.push(m);geo.dispose();});
 for(const m of remove)m.removeFromParent();for(const [mat,a] of groups){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(a.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(a.n,3));part(root,geo,mat,0,0,0);}return root;
}
export function makeResident(d){
 const equivalents={brachio:'sauropod',crested:'biped',iguanodon:'biped',raptor:'biped',allosaur:'rex',spinosaur:'rex',dome:'biped'};
 let g;
 if(d.kind==='ankylosaur'){
  g=new T.Group();const legs=[];ellipsoid(g,d.color,0,1.5,0,1.5,.95,2.4);ellipsoid(g,d.color,0,.9,2.5,.62,.5,1.05);
  for(const x of [-1,1])for(const z of [-1.3,1.3]){const l=new T.Group();l.position.set(x,1.2,z);ellipsoid(l,d.color,0,-.45,0,.4,.75,.45);ellipsoid(l,0x4f5744,0,-1,.15,.4,.15,.5);g.add(l);legs.push(l);}
  for(let z=-1.8;z<2;z+=.7)for(let x=-.8;x<=.8;x+=.8){const a=part(g,new T.ConeGeometry(.4,.38,5),0x6e7057,x,2.4-Math.abs(x)*.2,z);}
  for(const x of [-1.4,1.4])for(const z of [-1.5,-.4,.7])bone(g,0xd5c29a,[x,1.6,z],[x*1.43,1.7,z-.2],.21,.01);
  bone(g,d.color,[0,1.5,-2],[.2,1,-4.3],.5,.2);ellipsoid(g,0x6f7157,.2,1,-4.4,1,.48,.65);
  for(const x of [-.52,.52])ellipsoid(g,0xefc885,x,1.03,2.9,.08,.09,.07);
  g.userData={legs};g.scale.setScalar(d.scale);
 }else g=makeParkDinosaur({...d,kind:equivalents[d.kind]||d.kind});
 const c=d.color,accent=new T.Color(c).lerp(new T.Color(0xe7c483),.5).getHex();
 if(d.kind==='crested')bone(g,accent,[0,4.85,2.85],[0,5.75,1.1],.24,.12);
 if(d.kind==='iguanodon'){ellipsoid(g,c,0,3.2,.15,.86,1.12,1.68);for(const x of [-.8,.8])bone(g,accent,[x,2.9,1.7],[x*1.25,3.35,1.7],.14,.01);}
 if(d.kind==='dome'){ellipsoid(g,0xd6c69b,0,4.85,2.8,.43,.36,.52);for(const x of [-.38,.38])for(const z of [2.5,2.7])bone(g,accent,[x,4.6,z],[x*1.5,4.9,z-.1],.09,.01);}
 if(d.kind==='brachio'){ellipsoid(g,accent,0,4.8,1.4,1.45,.7,1.4);ellipsoid(g,c,0,9.88,9.3,.43,.44,.5);}
 if(d.kind==='allosaur')for(const x of [-.73,.73])bone(g,accent,[x,4.99,2.5],[x*1.13,5.46,2.72],.21,.02);
 if(d.kind==='spinosaur'){
  // A conspicuous dorsal sail and elongated snout distinguish the marsh resident.
  const shape=new T.Shape();shape.moveTo(-1.7,3.2);shape.lineTo(-1.4,4.3);shape.lineTo(-.7,5.4);shape.lineTo(.1,5.8);shape.lineTo(1,5.25);shape.lineTo(1.8,4.2);shape.lineTo(1.8,3.2);shape.closePath();
  const sail=part(g,new T.ShapeGeometry(shape),new T.MeshStandardMaterial({color:0xb8795d,side:T.DoubleSide,roughness:1}),0,0,0);sail.rotation.y=Math.PI/2;
  ellipsoid(g,c,0,4.52,3.9,.44,.35,1.4);for(const x of [-.41,.41])for(let z=3.8;z<5;z+=.3)bone(g,0xe6d5ac,[x,4.34,z],[x,4.08,z],.06,.01);
 }
 if(d.kind==='raptor'){
  for(const x of [-1,1])for(let i=0;i<6;i++)bone(g,0x6c8183,[x*.74,3.2,1.2],[x*(1.35+i*.07),2.8,1.65-i*.24],.09,.015);
  for(let i=0;i<7;i++)bone(g,0x6c8183,[0,2.1,-4.3-i*.25],[.35,2.45,-5.1-i*.25],.09,.01);
 }
 g.userData.kind=d.kind;return articulateResident(g,d.kind,bakeStatics);
}
export function makeHelicopter(){
 const g=new T.Group(),olive=0x617568,cream=0xe0c9a0,red=0xae4b35,steel=0x394d48;
 ellipsoid(g,olive,0,.28,0,1.5,1.25,2.7);ellipsoid(g,0xabc9c4,0,.65,1.57,1.2,.95,1.35);box(g,steel,0,.6,2.71,.1,1.4,.1);box(g,cream,0,.08,1.9,2.3,.15,1.65);
 bone(g,olive,[0,.6,-2.05],[0,1.5,-7.4],.68,.17);box(g,red,0,2,-6.75,.16,2.1,1.5);box(g,cream,0,1.15,-5.5,4,.12,.9);
 for(const x of [-1.25,1.25]){bone(g,steel,[x,-.6,1.1],[x,-1.05,1.1],.075);bone(g,steel,[x,-.6,-1.1],[x,-1.05,-1.1],.075);bone(g,steel,[x,-1.05,-2],[x,-1.05,2.6],.085);const l=label('ATLAS / AIR',2.5,.65,'#617568','#f4dfb3');l.position.set(x,.3,-.3);l.rotation.y=x<0?-Math.PI/2:Math.PI/2;g.add(l);}
 box(g,red,0,1.5,-.5,1.5,.6,1.4);bone(g,steel,[0,1.6,0],[0,2.4,0],.15);
 const rotor=new T.Group();rotor.position.y=2.42;box(rotor,steel,0,0,0,.32,.09,12.5);box(rotor,steel,0,0,0,12.5,.09,.32);for(const a of [-1,1]){box(rotor,cream,0,0,a*5.8,.34,.11,.8);box(rotor,cream,a*5.8,0,0,.8,.11,.34);}g.add(rotor);
 const tailRotor=new T.Group();tailRotor.position.set(.28,1.9,-7);box(tailRotor,cream,0,0,0,.1,2,.12);box(tailRotor,steel,0,0,0,.1,.12,2);g.add(tailRotor);
 g.userData={rotor,tailRotor};return bakeStatics(g,[rotor,tailRotor]);
}
export function makeBoat(){
 const g=new T.Group(),cream=0xc8bd9c,olive=0x365b53,steel=0x34433e;
 ellipsoid(g,olive,0,-.05,0,1.45,.63,3.35);box(g,cream,0,.32,-.1,2.25,.24,4.9);ellipsoid(g,olive,0,.15,2.3,1.05,.45,1.3);
 for(const x of [-1.18,1.18]){bone(g,steel,[x,.5,-1.8],[x,1.02,-1.8],.04);bone(g,steel,[x,1.02,-1.8],[x,1.02,1.8],.04);}
 box(g,cream,0,.68,.52,1.2,.58,.78);const glass=box(g,0x93bdb7,0,1.17,.72,1.35,.57,.05);glass.rotation.x=-.3;
 box(g,0x816e4e,0,.85,-.72,1.45,.28,.68);box(g,steel,0,.7,-2.55,.8,1.1,.52);box(g,0xb85837,0,1.28,-2.55,.8,.14,.52);
 const lifebuoy=part(g,new T.TorusGeometry(.35,.13,7,16),0xe0a853,1.12,.82,-.42);lifebuoy.rotation.y=Math.PI/2;
 const l=label('ATLAS / WETLAND PATROL',3.2,.48,'#365b53','#f5dfa7');l.position.set(1.36,.17,-.4);l.rotation.y=Math.PI/2;g.add(l);
 return bakeStatics(g);
}
export function makeBuggy(){const g=makeJeep();g.traverse(m=>{if(m.isMesh&&m.material?.color?.getHex()===0xd7c09b){m.material=m.material.clone();m.material.color.setHex(0xa5b889);}});box(g,0x4f6855,0,1.03,-1.42,1.5,.45,.6);return g;}
export function makePerson(){
 const g=new T.Group(),legs=[];ellipsoid(g,0x536454,0,1.08,0,.34,.43,.23);box(g,0xd4a947,0,1.16,.16,.46,.5,.1);ellipsoid(g,0xbe9877,0,1.69,0,.21,.24,.2);box(g,0xb9ad81,0,1.9,0,.52,.1,.47);ellipsoid(g,0xb9ad81,0,1.96,0,.24,.11,.21);
 for(const x of [-.17,.17]){const l=new T.Group();l.position.set(x,.83,0);bone(l,0x4d6355,[0,0,0],[0,-.68,0],.13,.1);box(l,0x2a4038,0,-.74,.1,.24,.18,.38);g.add(l);legs.push(l);}
 for(const x of [-.38,.38]){bone(g,0x536454,[x,1.4,0],[x,1.1,.25],.11,.1);bone(g,0xbe9877,[x,1.1,.25],[x*.7,1.23,.6],.085,.075);}
 box(g,0x7b9278,0,1.15,-.32,.5,.6,.26);part(g,new T.CylinderGeometry(.13,.13,.56,10),0x8dd9e3,.16,1.12,-.47);g.userData={legs};return bakeStatics(g,legs);
}
export function makeTool(){const g=new T.Group();box(g,0x334b44,0,0,0,.25,.2,.6);box(g,0x7cc9db,0,.06,.08,.17,.18,.34);bone(g,0x9bbaae,[0,0,.2],[0,0,.75],.065,.04);box(g,0xd1b57c,0,-.18,-.16,.12,.28,.15);g.userData.nozzle=new T.Vector3(0,0,.8);return g;}
