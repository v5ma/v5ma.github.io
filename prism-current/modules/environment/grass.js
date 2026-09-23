/* Currentworks Grass 0.1.0. Original low-cost geometric patches for Three r184.
 * No renderer/input/storage/clock ownership, textures, alpha cards or collision.
 * Patch descriptors and bend are GROUP-LOCAL. Viewer observations are WORLD-SPACE.
 */
(function(root){'use strict';
 const VERSION='0.1.0',MAX_PATCHES=8,MAX_BLADES=64;
 const finite=Number.isFinite,vector=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 const bounded=(v,d,a,b)=>finite(v)?Math.max(a,Math.min(b,v)):d;
 const validId=id=>Number.isSafeInteger(id)||typeof id==='string'&&id.length>0&&id.length<=96;
 function random(seed){let s=seed>>>0;return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);}
 function descriptors(input=[]){
  if(!Array.isArray(input)||input.length>MAX_PATCHES)throw new RangeError('At most eight grass patches.');
  const ids=new Set();return input.map(d=>{
   if(!d||!validId(d.id)||ids.has(d.id)||!vector(d.position))throw new TypeError('Grass requires unique ids and finite local positions.');ids.add(d.id);
   return {id:d.id,position:d.position.slice(),seed:Number.isSafeInteger(d.seed)?d.seed>>>0:137,
    radius:bounded(d.radius,.45,.1,2),height:bounded(d.height,.18,.05,.6),blades:Math.floor(bounded(d.blades,36,4,MAX_BLADES))};
  });
 }
 function data(d,stride=1){
  if(![1,2].includes(stride))throw new RangeError('Grass detail stride is 1 or 2.');
  const rand=random(d.seed),positions=[],normals=[],colors=[],bend=[],slope=[],indices=[];let blades=0;
  for(let i=0;i<d.blades;i++){
   const angle=rand()*Math.PI*2,r=Math.sqrt(.12+rand()*.88)*d.radius,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
   const yaw=rand()*Math.PI*2,height=d.height*(.7+rand()*.5),width=height*(.13+rand()*.07),lean=height*(.15+rand()*.2),tint=.9+rand()*.16;
   if(i%stride)continue;
   const ux=Math.cos(yaw),uz=Math.sin(yaw),vx=-uz,vz=ux,start=positions.length/3;blades++;
   for(let j=0;j<4;j++){
    const f=j/3,w=width*(1-.94*f),nx=vx,ny=-2*lean*f/height,nz=vz,n=Math.hypot(nx,ny,nz);
    for(const side of [-1,1]){
     positions.push(x+vx*lean*f*f+ux*w*side,height*f,z+vz*lean*f*f+uz*w*side);
     normals.push(nx/n,ny/n,nz/n);colors.push((.14+.16*f)*tint,(.29+.19*f)*tint,(.085+.055*f)*tint);
     bend.push(f*f);slope.push(2*f/height);
    }
    if(j<3){const a=start+j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
   }
  }
  return {positions,normals,colors,bend,slope,indices,blades};
 }
 function wind(time,quiet=false,strength=.035){
  if(!finite(time))throw new TypeError('Grass time must be finite.');
  const a=quiet?0:bounded(strength,.035,0,.06);
  if(a===0)return [0,0];
  return [a*(.72*Math.sin(time*1.3)+.28*Math.sin(time*2.11+1.7)),a*.45*Math.sin(time*.83+.4)];
 }
 function create(T,options={}){
  if(!T?.MeshLambertMaterial||!T?.BufferGeometry)throw new TypeError('Supply the existing THREE namespace.');
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Grass options must be an object.');
  const desc=descriptors(options.patches||[]),group=new T.Group(),geometry=[],nodes=[];
  const gust={value:new T.Vector2()},material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,fog:false});
  group.name='Currentworks Grass';material.name='Currentworks Grass '+VERSION;
  material.customProgramCacheKey=()=> 'currentworks-grass-0.1.0';
  material.onBeforeCompile=shader=>{
   const n='#include <beginnormal_vertex>',p='#include <begin_vertex>';
   if(!shader.vertexShader.includes(n)||!shader.vertexShader.includes(p))throw new Error('Unsupported Three.js grass shader chunks.');
   shader.uniforms.grassGust=gust;
   shader.vertexShader='uniform vec2 grassGust; attribute float grassBend; attribute float grassSlope;\n'+shader.vertexShader
    .replace(n,n+'\nobjectNormal.y -= grassSlope * dot(grassGust,objectNormal.xz);')
    .replace(p,p+'\ntransformed.xz += grassGust * grassBend;');
  };
  let disposed=false,time=0,quiet=false,visible=true,xr=false,quality='balanced',strength=bounded(options.windStrength,.035,0,.06);
  const eye=new T.Vector3(),world=new T.Vector3(),scale=new T.Vector3();
  function build(d,stride){const a=data(d,stride),g=new T.BufferGeometry();geometry.push(g);
   for(const [name,values,size] of [['position',a.positions,3],['normal',a.normals,3],['color',a.colors,3],['grassBend',a.bend,1],['grassSlope',a.slope,1]])g.setAttribute(name,new T.Float32BufferAttribute(values,size));
   g.setIndex(a.indices);g.computeBoundingBox();g.boundingBox.expandByScalar(.07);g.computeBoundingSphere();g.boundingSphere.radius+=.07;return g;
  }
  try{for(const d of desc){const levels=[build(d,1),build(d,2)],mesh=new T.Mesh(levels[0],material);mesh.position.fromArray(d.position);mesh.name='Grass / '+d.id;group.add(mesh);nodes.push({d,mesh,levels,lod:0});}}
  catch(e){for(const g of geometry)g.dispose();material.dispose();throw e;}
  function update(frame={}){
   if(disposed||!frame||typeof frame!=='object'||Array.isArray(frame)||frame.viewer!==undefined&&!vector(frame.viewer))return false;
   time=bounded(frame.time,time,0,1e7);if(typeof frame.quiet==='boolean')quiet=frame.quiet;if(typeof frame.visible==='boolean')visible=frame.visible;
   if(typeof frame.xr==='boolean')xr=frame.xr;if(['light','balanced','cinematic'].includes(frame.quality))quality=frame.quality;
   strength=bounded(frame.windStrength,strength,0,.06);gust.value.fromArray(wind(time,quiet,strength));group.visible=visible;
   if(frame.viewer){eye.fromArray(frame.viewer);group.updateWorldMatrix(true,false);group.getWorldScale(scale);}
   for(const n of nodes){let low=xr||quality==='light';if(frame.viewer){world.copy(n.mesh.position).applyMatrix4(group.matrixWorld);const distance=world.distanceTo(eye)/Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z),1e-6);low ||=distance>(n.lod?7:9);}
    n.lod=low?1:0;n.mesh.geometry=n.levels[n.lod];}
   return true;
  }
  function reset(at=0){if(disposed)return;update({time:at});}
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of geometry)g.dispose();material.dispose();}
  return Object.freeze({group,update,reset,dispose,describe:()=>desc.map(d=>({...d,position:d.position.slice()})),
   get stats(){return {module:'Currentworks Grass',version:VERSION,time,quiet,xr,quality,visible:visible&&!disposed,disposed,patches:desc.length,
    geometries:disposed?0:geometry.length,materials:disposed?0:1,selectedBlades:disposed||!visible?0:nodes.reduce((s,n)=>s+Math.ceil(n.d.blades/(n.lod+1)),0),
    triangles:disposed||!visible?0:nodes.reduce((s,n)=>s+n.mesh.geometry.index.count/3,0),gust:gust.value.toArray(),textures:0,renderTargets:0};}});
 }
 const api=Object.freeze({VERSION,MAX_PATCHES,MAX_BLADES,descriptors,data,wind,create});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNGrass=api;
})(globalThis);
