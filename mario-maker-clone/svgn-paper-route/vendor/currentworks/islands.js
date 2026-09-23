/* Currentworks Islands 0.1.0. Original compact terrain; no renderer or game owner.
 * Descriptors, geometry and planting sockets are GROUP-LOCAL. No collision implied.
 */
(function(root){'use strict';
 const VERSION='0.1.0',MAX_ISLANDS=8;
 const finite=Number.isFinite,vector=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 const idOK=id=>Number.isSafeInteger(id)||typeof id==='string'&&id.length>0&&id.length<=96;
 const number=(v,d,a,b)=>finite(v)?Math.max(a,Math.min(b,v)):d;
 function random(seed){let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
 function descriptors(input=[]){
  if(!Array.isArray(input)||input.length>MAX_ISLANDS)throw new RangeError('At most eight island descriptors.');
  const ids=new Set();return input.map(d=>{
   if(!d||!idOK(d.id)||ids.has(d.id)||!vector(d.position))throw new TypeError('Unique id and finite local position required.');
   ids.add(d.id);return {id:d.id,seed:Number.isSafeInteger(d.seed)?d.seed>>>0:313,position:d.position.slice(),radius:number(d.radius,.85,.3,2),depth:number(d.depth,.65,.15,1.5),yaw:number(d.yaw,0,-6.29,6.29)};
  });
 }
 function data(d){
  const count=20,rand=random(d.seed),edge=Array.from({length:count},()=>.86+rand()*.14),positions=[],colors=[],indices=[];
  // Five rings: softly domed grass, sandy rim, two rock strata, tapered underside.
  const radii=[.38,.78,1,.85,.30],heights=[.08,.055,0,-d.depth*.48,-d.depth];
  for(let j=0;j<5;j++)for(let i=0;i<count;i++){
   const angle=i/count*Math.PI*2,wobble=j>2?(rand()-.5)*d.depth*.16:0;
   positions.push(Math.cos(angle)*d.radius*radii[j]*edge[i],heights[j]+wobble,Math.sin(angle)*d.radius*radii[j]*edge[i]);
   const tint=.94+rand()*.12,base=j===0?[.20,.40,.22]:j===1?[.32,.50,.26]:j===2?[.69,.56,.34]:j===3?[.27,.32,.32]:[.12,.18,.21];
   colors.push(...base.map(v=>v*tint));
  }
  const top=positions.length/3;positions.push(0,.08,0);colors.push(.23,.43,.25);
  const bottom=positions.length/3;positions.push(0,-d.depth*1.08,0);colors.push(.12,.17,.19);
  for(let i=0;i<count;i++){
   const next=(i+1)%count;indices.push(top,next,i);
   for(let j=0;j<4;j++){const a=j*count+i,b=j*count+next,c=(j+1)*count+i,e=(j+1)*count+next;indices.push(a,b,e,a,e,c);}
   indices.push(bottom,4*count+i,4*count+next);
  }
  return {positions,colors,indices,socket:[0,.08,0]};
 }
 function create(T,options={}){
  if(!T?.BufferGeometry||!T?.MeshStandardMaterial)throw new TypeError('Supply an existing THREE namespace.');
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Island options must be an object.');
  const desc=descriptors(options.islands||[]),group=new T.Group(),geometries=[],owned=!options.material;
  if(options.material&&!options.material.isMaterial)throw new TypeError('Borrowed material must be a THREE material.');
  const material=options.material||new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:0,flatShading:true});
  let disposed=false;group.name='Currentworks Islands';
  try{for(const d of desc){const a=data(d),g=new T.BufferGeometry();geometries.push(g);
   g.setAttribute('position',new T.Float32BufferAttribute(a.positions,3));g.setAttribute('color',new T.Float32BufferAttribute(a.colors,3));g.setIndex(a.indices);g.computeVertexNormals();g.computeBoundingSphere();
   const m=new T.Mesh(g,material);m.name='Island / '+d.id;m.position.fromArray(d.position);m.rotation.y=d.yaw;group.add(m);
  }}catch(e){for(const g of geometries)g.dispose();if(owned)material.dispose();throw e;}
  function socket(id){const d=desc.find(d=>d.id===id);return disposed||!d?null:[d.position[0],d.position[1]+.08,d.position[2]];}
  function update(frame={}){if(disposed||!frame||typeof frame!=='object')return false;if(typeof frame.visible==='boolean')group.visible=frame.visible;return true;}
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of geometries)g.dispose();if(owned)material.dispose();}
  return Object.freeze({group,update,socket,dispose,describe:()=>desc.map(d=>({...d,position:d.position.slice()})),
   get stats(){return {module:'Currentworks Islands',version:VERSION,islands:desc.length,triangles:disposed?0:geometries.reduce((sum,g)=>sum+g.index.count/3,0),geometries:disposed?0:geometries.length,visible:group.visible,disposed,textures:0,renderTargets:0};}});
 }
 const api=Object.freeze({VERSION,MAX_ISLANDS,descriptors,data,create});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNIslands=api;
})(globalThis);
