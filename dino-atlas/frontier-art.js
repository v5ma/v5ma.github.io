import * as T from './vendor/three.module.js';
import {box,bone,ellipsoid,label,part,material,makeJeep,makeParkDinosaur} from './ranger-art.js';
import {makeExplorer} from './dino-models.js';
export function makeAnimalModel(d){
 if(d.kind==='anky'){
  const g=new T.Group(),legs=[];ellipsoid(g,d.color,0,1.55,0,1.7,.85,2.6);ellipsoid(g,0x727764,0,2.04,0,1.64,.55,2.35);
  for(const x of [-1,1])for(const z of [-1.4,1.3]){const l=new T.Group();l.position.set(x,1.2,z);ellipsoid(l,d.color,0,-.6,0,.4,.65,.4);g.add(l);legs.push(l);}
  for(let z=-1.8;z<2;z+=.65)for(const x of [-1,0,1]){const spike=part(g,new T.ConeGeometry(.3,.5,5),0xb0a584,x,2.5-Math.abs(x)*.25,z);spike.rotation.z=x*.4;}
  bone(g,d.color,[0,1.55,-2],[0,1,-5],.48,.15);ellipsoid(g,0xb4a68a,0,1,-5.2,.82,.35,.65);ellipsoid(g,d.color,0,1.5,2.8,.6,.42,.83);
  for(const x of [-.52,.52])ellipsoid(g,0x182920,x,1.64,3,.06,.07,.07);
  g.scale.setScalar(d.scale);g.userData={legs,kind:d.kind};return g;
 }
 const remap={brachio:'sauropod',para:'biped',allo:'rex',spino:'rex',raptor:'biped'};
 const g=makeParkDinosaur({...d,kind:remap[d.kind]||d.kind});
 if(d.kind==='brachio'){ellipsoid(g,d.color,0,5,2.4,1.25,1.2,1.2);ellipsoid(g,d.color,0,9.95,9.5,.45,.46,.6);}
 if(d.kind==='para'){bone(g,0xd5b17d,[0,4.9,2.8],[0,5.5,1.25],.24,.12);ellipsoid(g,0xd4b58b,0,4.42,3.3,.48,.22,.43);}
 if(d.kind==='allo'){for(const x of [-.5,.5])bone(g,0xbd885d,[x,4.9,2.65],[x,5.4,3.1],.21,.04);}
 if(d.kind==='spino'){
  const sh=new T.Shape();sh.moveTo(-2,3.7);sh.lineTo(-1.4,5.7);sh.lineTo(-.5,6.4);sh.lineTo(.7,6.2);sh.lineTo(1.5,4.3);sh.closePath();
  const m=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshStandardMaterial({color:0xab8254,side:T.DoubleSide,roughness:1}));m.rotation.y=-Math.PI/2;g.add(m);
  for(let z=-1.5;z<1.3;z+=.42)bone(g,0xc1a576,[0,3.65,z],[0,6-Math.abs(z)*.5,z],.035);
  ellipsoid(g,d.color,0,4.47,4.03,.44,.34,1.12);
 }
 if(d.kind==='raptor'){
  for(const x of [-.7,.7])for(let i=0;i<5;i++)bone(g,0x706952,[x,3,1.4],[x*(1.4+i*.15),2.9-i*.09,1.7+i*.25],.075,.015);
  for(const x of [-.8,.8])bone(g,0x323c31,[x,.1,.35],[x,.4,.8],.11,.01);
 }
 g.userData.kind=d.kind;return g;
}
export function makeVehicleModel(type){
 if(type==='jeep'||type==='rover'){
  const g=makeJeep();if(type==='rover'){box(g,0x6c8974,0,1.6,-.8,2.2,1.2,1.5);box(g,0x394b45,0,2.3,-.65,2.5,.18,2);const tag=label('FIELD SUPPORT',1.3,.35);tag.position.set(0,1.8,-1.57);tag.rotation.y=Math.PI;g.add(tag);}return g;
 }
 const g=new T.Group(),sand=0xcbb88b,red=0xb8563b,dark=0x263c36,glass=new T.MeshStandardMaterial({color:0x63979c,metalness:.2,roughness:.25,transparent:true,opacity:.8});
 if(type==='helicopter'){
  ellipsoid(g,sand,0,.4,.45,1.5,1.05,2.4);ellipsoid(g,glass,0,.55,1.85,1.25,.8,1.18);box(g,red,0,.08,.9,2.9,.2,3.6);
  bone(g,sand,[0,.4,-1],[0,1.25,-7.4],.65,.17);const fin=box(g,red,0,1.95,-7.3,.13,2,1);fin.rotation.x=-.2;box(g,sand,0,1,-6.45,3,.16,1);
  for(const x of [-1.3,1.3]){bone(g,dark,[x,-.75,-1.5],[x,-.75,2.6],.09);for(const z of [-1,1.5])bone(g,dark,[x,-.75,z],[x*.7,0,z],.075);}
  bone(g,dark,[0,1,0],[0,2.45,0],.13);const rotor=new T.Group();rotor.position.y=2.45;box(rotor,dark,0,0,0,12,.085,.32);box(rotor,dark,0,.02,0,.32,.085,12);g.add(rotor);
  const tail=new T.Group();tail.position.set(.28,1.45,-7.2);box(tail,dark,0,0,0,.07,2,.15);box(tail,dark,0,0,0,.07,.15,2);g.add(tail);g.userData={rotor,tail};
  const mark=label('ATLAS AIR',2,.45);mark.position.set(1.43,.5,-.15);mark.rotation.y=Math.PI/2;g.add(mark);
 }else{
  // Tapered raised bow and recessed open deck.
  const shape=new T.Shape();shape.moveTo(-1.3,-2.7);shape.lineTo(1.3,-2.7);shape.lineTo(1.45,1.3);shape.lineTo(0,3.1);shape.lineTo(-1.45,1.3);shape.closePath();
  const hull=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:true,bevelSize:.15,bevelThickness:.15,steps:1,bevelSegments:1}),material(sand));hull.rotation.x=Math.PI/2;hull.position.y=.12;g.add(hull);
  box(g,dark,0,.18,-.35,2.3,.16,3.6);for(const x of [-1.22,1.22]){box(g,red,x,.55,-.2,.18,.55,4.45);bone(g,dark,[x,.95,-1.7],[x,.95,1.5],.045);}
  box(g,sand,0,.6,.8,1.8,1,.7);box(g,glass,0,1.35,.98,1.75,.66,.08);box(g,0x705c42,0,.56,-1.2,2,.35,.8);
  for(const x of [-.96,.96])bone(g,dark,[x,.5,-1.5],[x,2,-1.5],.05);box(g,0x648475,0,2.05,-.7,2.5,.1,2.2);box(g,dark,0,0,-2.8,.68,.9,.75);
  const buoy=part(g,new T.TorusGeometry(.4,.12,7,12),0xe4a34d,1.4,.5,-1.3);buoy.rotation.y=Math.PI/2;g.userData={};
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
export function makeRanger(){const g=makeExplorer(T);g.scale.setScalar(.82);const pack=box(g,0xcab275,0,1.5,-.35,.58,.72,.26);g.userData.pack=pack;return g;}
export function makeToolMount(){
 const g=new T.Group();ellipsoid(g,0x475e55,0,0,0,.25,.23,.25);bone(g,0x6caac0,[0,.08,.1],[0,.1,1.4],.14,.1);box(g,0xf1cf78,0,.1,.5,.35,.21,.35);g.userData.barrel=g.children[1];return g;
}
