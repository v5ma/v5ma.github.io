/* CC0 source meshes, authored at the existing gameplay scale. No state writes. */
import * as T from './vendor/three.module.js';
import {WORLD,point,street,add,mul,norm,rand} from './world.mjs';
import {mesh,batchStatic,anchor} from './art.mjs';
import {faceSurface} from './neighborhood.mjs';

export function createStreetSet(library,renderer){
 const root=new T.Group();root.name='CC0 coastal neighborhood';
 const prototypes=new Map(library.children.map(g=>[g.name.replace(/^asset_/,''),g]));
 const paints=new Map(),counts={buildings:0,trees:0,plants:0,parts:0};
 const used=new Set();
 const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 library.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(m.name.startsWith('MI_'))m.vertexColors=false; // source color channels are custom wear masks
  if(m.name.includes('Leaves')){m.alphaTest=.38;m.side=T.DoubleSide;}
  for(const value of Object.values(m))if(value?.isTexture)value.anisotropy=anisotropy;
  m.needsUpdate=true;
 }});
 const plain=prototypes.get('Brick_Plain_3');let wallMaterial;
 plain.traverse(o=>{if(o.isMesh&&!wallMaterial)wallMaterial=o.material;});
 function part(parent,name,p=[0,0,0],size=[1,1,1],yaw=0,tone=null){
  const source=prototypes.get(name);if(!source)throw Error('Missing licensed mesh: '+name);
  const g=source.clone(true);g.position.set(...p);g.scale.set(...size);g.rotation.y=yaw;parent.add(g);counts.parts++;used.add(name);
  g.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
   if(tone&&o.material.name.includes('Brick')){const key=o.material.uuid+tone;if(!paints.has(key)){const m=o.material.clone();m.color.multiply(new T.Color(tone));paints.set(key,m);}o.material=paints.get(key);}
  });return g;
 }
 const patches=new Map();
 const sector=n=>{const key=n.map(v=>Math.floor(v*110/28)).join('/');
  if(!patches.has(key)){const g=new T.Group();g.name='Street art patch '+key;g.userData.center=new T.Vector3();g.userData.count=0;root.add(g);patches.set(key,g);}
  const g=patches.get(key);g.userData.center.add(new T.Vector3(...n));g.userData.count++;return g;
 };
 function sign(g,text){const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');x.fillStyle='#244d55';x.fillRect(0,0,256,96);x.strokeStyle='#e8c68c';x.lineWidth=5;x.strokeRect(6,6,244,84);x.fillStyle='#fff3d1';x.font='bold 43px serif';x.textAlign='center';x.fillText(text,128,64,235);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(1.7,.64),new T.MeshStandardMaterial({map:tx,roughness:.8}));m.position.set(0,2.53,2.06);g.add(m);}
 for(const [i,s] of WORLD.buildings.entries()){
  if(s.type==='garden')continue;counts.buildings++;
  const g=new T.Group();sector(s.n).add(g);faceSurface(g,s.n,norm(add(s.mail,mul(s.n,-1))));
  const floors=i%4===1?2:1,top=.18+floors*3;
  const tone=['#ffefcb','#d6e4d2','#d3dee0','#edd1b6'][i%4];
  mesh(g,'box','#75817d',[0,.12,0],[4.48,.24,4.08]);
  mesh(g,'box','#344c51',[0,top/2,0],[3.96,top,3.35]); // dark interior backing, never an enterable room
  for(const x of[-1.42,1.42])part(g,'Brick_Window_Trim',[x,.18,1.95],[.66,1,1],0,tone);
  part(g,'DoorFrame_Wooden',[0,.18,1.94],[.64,1,.75]);
  part(g,'Door_1',[.51,.2,1.79],[1.02,1.06,.65]);
  part(g,'Brick_Plain_1',[0,2.56,1.91],[.74,.62,1],0,tone);
  for(let level=0;level<floors;level++){
   const y=.18+level*3;
   if(level)part(g,'Brick_Window_CurvedDouble',[0,y,1.95],[1.04,1,1],0,tone);
   for(const side of [-1,1])for(const z of[-.975,.975])part(g,level?'Brick_Window_Trim':'Brick_Plain_3',[side*2.08,y,z],[.975,1,1],side*Math.PI/2,tone);
   for(const x of [-1.04,1.04])part(g,'Brick_Window_Trim',[x,y,-1.95],[1.04,1,1],Math.PI,tone);
  }
  for(const x of[-1.04,1.04]){part(g,'Brick_BottomTrim',[x,.19,1.99],[1.04,.32,1]);part(g,'Cornice_Brick_Center',[x,top-.15,2.03],[1.04,.36,1]);
   part(g,(i%3===0&&x<0)?'Roof_Slate_Window_1':'Roof_Slate_Center',[x,top+.12,1.98],[1.1,.45,1]);
   part(g,'Roof_Slate_Center',[x,top+.12,-1.98],[1.1,.45,1],Math.PI);
  }
  // Close the two gables at the exact modular roof edges, not floating boxes.
  const positions=[],uv=[];
  for(const side of[-1,1]){positions.push(side*2.12,top,1.98,side*2.12,top,-1.98,side*2.12,top+1.42,0);uv.push(0,0,1,0,.5,1);}
  const roofGeo=new T.BufferGeometry();roofGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));roofGeo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roofGeo.computeVertexNormals();const rm=wallMaterial.clone();rm.side=T.DoubleSide;const sides=new T.Mesh(roofGeo,rm);sides.castShadow=sides.receiveShadow=true;g.add(sides);
  // The existing shallow porch and fence footprint remains decoration only.
  mesh(g,'box','#b6b5a3',[0,.21,2.62],[3.4,.24,1.25]);mesh(g,'box','#d2cbb5',[0,.1,3.32],[1.24,.18,.44]);
  for(const side of [-1,1]){for(const z of[2.12,3.08])mesh(g,'cylinder','#e9e1c9',[side*1.57,1.51,z],[.065,2.6,.065]);mesh(g,'box','#e7ddc4',[side*1.15,.93,3.13],[.85,.08,.09]);for(let k=0;k<5;k++)mesh(g,'box','#e9e3cf',[side*(.81+k*.17),.60,3.13],[.045,.60,.045]);}
  if(i%2===0){mesh(g,'box','#546b65',[0,2.72,2.58],[3.55,.12,1.48],[.07,0,0]);mesh(g,'box','#e9dfc7',[0,2.64,3.26],[3.6,.14,.08]);}
  for(const side of [-1,1]){
   part(g,'Prop_Planter_Single',[side*3.05,.03,1.65],[.44,.7,.44]);
   part(g,i%2?'Bush_Common_Flowers':'Bush_Common',[side*3.05,.4,1.65],[.52,.60,.52]);counts.plants++;
   for(let k=0;k<7;k++){mesh(g,'box','#e9e4d1',[side*(1.1+k*.37),.57,3.85],[.12,1.14,.07]);mesh(g,'cone','#e9e4d1',[side*(1.1+k*.37),1.18,3.85],[.09,.17,.065]);}
   for(const y of[.35,.82])mesh(g,'box','#d5d9c4',[side*2.22,y,3.82],[2.7,.085,.06]);
  }
  for(let k=0;k<4;k++){const x=(k-1.5)*.55;part(g,'Flower_3_Group',[x,.03,-2.6],[.24,.32,.24],i*.7+k);counts.plants++;}
  if(s.type==='post')sign(g,'SVGN');
 }
 for(const [i,t] of WORLD.trees.entries()){
  const parent=sector(t.n),g=anchor(parent,t.n);const name=['CommonTree_1','CommonTree_3','CommonTree_4'][i%3];
  const size=(t.id.startsWith('avenue-')?.51:.49)*t.size;
  part(g,name,[0,0,0],[size,size,size],rand(t.seed)*6.28);counts.trees++;
  if(t.id.startsWith('avenue-')){part(g,'Grass_Common_Short',[.22,.01,.15],[.55,.45,.55],i);part(g,'Fern_1',[-.27,.01,.3],[.4,.5,.4],i*.3);counts.plants+=2;}
 }
 // Flat street details stay away from mailbox approaches and add no collider.
 for(let i=0;i<10;i++){
  const n=street(8+i*12,i%2?2.85:-2.85),g=anchor(sector(n),n,.19);part(g,'Prop_Drain',[0,0,0],[.46,.46,.46],i);
 }
 const sectors=[...patches.values()];for(const g of sectors){g.userData.center.normalize().multiplyScalar(110);batchStatic(g);}
 root.updateMatrixWorld(true);
 return {root,inspect:()=>({...counts,uniqueModels:used.size,models:[...used]}),
 update(n,overview=false,low=false){const here=new T.Vector3(...n).multiplyScalar(110);for(const g of sectors)g.visible=overview||g.userData.center.distanceTo(here)<(low?96:135);}};
}
