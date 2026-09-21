/* Currentworks Trees 0.1.1. Original seeded geometry and host-clock wind.
 * Supply the existing THREE namespace; no renderer, clock, DOM, input or storage.
 * All roots and geometry are FOREST-GROUP-LOCAL. No collision or gameplay owner.
 * Skeleton is generated once, all three detail meshes are built before playing.
 */
(function(root){
 'use strict';
 const VERSION='0.1.1',SCHEMA=1,MAX_TREES=24,TAU=Math.PI*2;
 const PRESETS=Object.freeze(['palm','alder','willow']);
 const DETAIL=Object.freeze([
  Object.freeze({name:'near',radial:8,pathStride:1,leafStride:1,leafScale:1}),
  Object.freeze({name:'middle',radial:6,pathStride:2,leafStride:2,leafScale:1.25}),
  Object.freeze({name:'far',radial:4,pathStride:3,leafStride:4,leafScale:1.60})
 ]);
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),finite=Number.isFinite;
 const num=(v,d,a,b)=>finite(v)?clamp(v,a,b):d;
 const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k);
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>mul(a,1/(Math.hypot(...a)||1)),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 const vector=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 function random(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
 function hash(id){let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function descriptor(input={},fallbackSeed=173){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Tree descriptor must be an object.');
  const id=input.id??'tree';if(!((typeof id==='string'&&id.length>0&&id.length<=128)||Number.isSafeInteger(id)))throw new TypeError('Tree id must be a nonempty string or safe integer.');
  if(input.position!==undefined&&!vector(input.position))throw new TypeError('Tree position must contain three finite coordinates.');
  const preset=PRESETS.includes(input.preset)?input.preset:'palm';
  return {id,preset,seed:Number.isSafeInteger(input.seed)?input.seed>>>0:(fallbackSeed^hash(id))>>>0,
   position:(input.position||[0,0,0]).map(v=>clamp(v,-10000,10000)),height:num(input.height,4,.5,18),yaw:num(input.yaw,0,-TAU*100,TAU*100)};
 }
 function pathPoint(path,t){const f=clamp(t,0,1)*(path.length-1),i=Math.min(path.length-2,Math.floor(f));return mix(path[i],path[i+1],f-i);}
 function curve(a,b,c,count=9){return Array.from({length:count},(_,i)=>{const t=i/(count-1);return add(add(mul(a,(1-t)*(1-t)),mul(b,2*t*(1-t))),mul(c,t*t));});}
 /** Data-only skeleton independent of THREE. No detail setting changes the seed. */
 function skeleton(input={}){
  const d=descriptor(input),rng=random(d.seed),h=d.height,paths=[],leaves=[];
  const phase=rng()*TAU,bend=[(rng()-.5)*h*.16,0,(rng()-.5)*h*.16];
  const trunk=Array.from({length:11},(_,i)=>{const t=i/10;return [bend[0]*t*t,h*t*(d.preset==='palm'?.87:.94),bend[2]*t*t];});
  paths.push({points:trunk,radius:h*(d.preset==='palm'?.034:.043),tip:h*.007,shade:.92});
  function leaf(base,tip,width,span,shade,sample=leaves.length){leaves.push({base,tip,width,span:norm(span),shade,sample});}
  if(d.preset==='palm'){
   const crown=trunk.at(-1),fronds=12;
   for(let j=0;j<fronds;j++){
    const a=phase+j*TAU/fronds+(rng()-.5)*.17,dir=[Math.cos(a),0,Math.sin(a)],side=[-dir[2],0,dir[0]],reach=h*(.38+rng()*.09);
    const p=Array.from({length:10},(_,i)=>{const t=i/9;return add(crown,[dir[0]*reach*t,h*(.20*Math.sin(t*Math.PI*.90)-(.18+(j%3)*.018)*t*t),dir[2]*reach*t]);});
    paths.push({points:p,radius:h*.006,tip:h*.0012,shade:1.03});
    for(let k=1;k<18;k++)for(const s of[-1,1]){
     const t=k/18,base=pathPoint(p,t),len=h*(.055+.105*Math.sin(Math.PI*t)**.8)*( .86+rng()*.24);
     const tip=add(base,add(mul(side,len*s),add(mul(dir,len*.27),[0,-len*.35,0])));
     leaf(base,tip,len*.12,dir,.83+rng()*.36,k);
    }
    leaf(pathPoint(p,.90),add(p.at(-1),mul(dir,h*.035)),h*.012,side,1.05,0);
   }
  }else{
   const branches=d.preset==='willow'?8:7;
   for(let j=0;j<branches;j++){
    const a=phase+j*2.399963+(rng()-.5)*.26,dir=[Math.cos(a),0,Math.sin(a)],side=[-dir[2],0,dir[0]],t=.43+j/branches*.42;
    const base=pathPoint(trunk,t),reach=h*(.18+rng()*.12)*(1-(t-.4)*.50);
    const end=add(base,add(mul(dir,reach),[0,h*(.20+rng()*.12),0]));
    const p=curve(base,add(mix(base,end,.5),[0,h*.055,0]),end);
    paths.push({points:p,radius:h*.014*(1-t*.4),tip:h*.002,shade:.88+rng()*.22});
    for(let k=0;k<4;k++){
     const b=pathPoint(p,.43+k*.15),sign=k%2?1:-1;
     const e=add(b,add(mul(side,h*(.10+rng()*.05)*sign),add(mul(dir,h*.11),[0,h*(d.preset==='willow'?-.22:.13),0])));
     const twig=curve(b,add(mix(b,e,.4),[0,h*.12,0]),e,7);
     paths.push({points:twig,radius:h*.0038,tip:h*.0006,shade:.91});
     const n=d.preset==='willow'?16:14;
     for(let l=0;l<n;l++){
      const along=.20+.77*l/(n-1),center=pathPoint(twig,along),az=phase+l*2.399963+k*1.7;
      const ld=norm([Math.cos(az),d.preset==='willow'?-.8:.25+rng()*.45,Math.sin(az)]),len=h*(d.preset==='willow'?.085:.078)*( .8+rng()*.5);
      leaf(center,add(center,mul(ld,len)),len*(d.preset==='willow'?.17:.43),cross(ld,[0,1,0]),.77+rng()*.40);
     }
    }
   }
  }
  return {schema:SCHEMA,generator:VERSION,descriptor:d,phase,paths,leaves};
 }
 function packet(){return {position:[],normal:[],color:[],uv:[],cwRoot:[],cwPhase:[],index:[]};}
 const linear=c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
 const RGB={bark:[.47,.35,.23].map(linear),palm:[.31,.52,.18].map(linear),alder:[.28,.47,.20].map(linear),willow:[.41,.54,.27].map(linear)};
 function geometryData(sk,detail=0){
  if(!sk||sk.schema!==SCHEMA||!sk.descriptor||!Array.isArray(sk.paths)||!Array.isArray(sk.leaves))throw new TypeError('Expected a Trees skeleton.');
  detail=Number.isInteger(detail)?clamp(detail,0,2):0;
  const lod=DETAIL[detail],d=sk.descriptor,wood=packet(),foliage=packet(),cy=Math.cos(d.yaw),sy=Math.sin(d.yaw);
  const rotate=p=>[cy*p[0]+sy*p[2],p[1],-sy*p[0]+cy*p[2]];
  function vertex(out,p,col,uv){const q=add(rotate(p),d.position),index=out.position.length/3;out.position.push(...q);out.color.push(...col);out.uv.push(...uv);out.cwRoot.push(...d.position,1/d.height);out.cwPhase.push(sk.phase);return index;}
  for(const [pi,path]of sk.paths.entries()){
   const pts=path.points.filter((p,i)=>i%lod.pathStride===0||i===path.points.length-1),start=wood.position.length/3,r=lod.radial;
   for(let i=0;i<pts.length;i++){
    const t=i/(pts.length-1),tangent=norm(sub(pts[Math.min(i+1,pts.length-1)],pts[Math.max(0,i-1)])),u=norm(cross(tangent,Math.abs(tangent[1])>.92?[1,0,0]:[0,1,0])),v=cross(tangent,u);
    const radius=path.radius*(1-t)+path.tip*t;
    for(let j=0;j<=r;j++){
     const a=j/r*TAU,rad=radius*(1+.04*Math.sin(a*3+pi)),p=add(pts[i],add(mul(u,Math.cos(a)*rad),mul(v,Math.sin(a)*rad)));
     vertex(wood,p,RGB.bark.map(c=>c*path.shade*(.93+.07*Math.cos(a*3))),[j/r,t*d.height]);
    }
   }
   for(let i=0;i<pts.length-1;i++)for(let j=0;j<r;j++){const a=start+i*(r+1)+j,b=a+r+1;wood.index.push(a,a+1,b,a+1,b+1,b);}
  }
  for(let i=0;i<sk.leaves.length;i++){
   if(sk.leaves[i].sample%lod.leafStride!==0)continue;
   const l=sk.leaves[i],axis=sub(l.tip,l.base),mid=add(l.base,mul(axis,.45)),span=mul(l.span,l.width*.5*lod.leafScale),tip=add(l.base,mul(axis,lod.leafScale)),n=norm(cross(axis,l.span)),bend=mul(n,Math.hypot(...axis)*.065),col=RGB[d.preset].map(c=>c*l.shade);
   const points=[l.base,sub(mid,span),add(mid,bend),add(mid,span),tip],uv=[[.5,0],[0,.45],[.5,.45],[1,.45],[.5,1]],start=foliage.position.length/3;
   for(let j=0;j<5;j++)vertex(foliage,points[j],col.map(c=>c*(j===4?1.12:1)),uv[j]);
   foliage.index.push(start,start+1,start+2,start,start+2,start+3,start+1,start+4,start+2,start+2,start+4,start+3);
  }
  function finish(out){
   const n=new Float32Array(out.position.length),p=out.position;
   for(let i=0;i<out.index.length;i+=3){const ids=out.index.slice(i,i+3),ps=ids.map(j=>p.slice(j*3,j*3+3)),v=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));for(const j of ids)for(let k=0;k<3;k++)n[j*3+k]+=v[k];}
   for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2]);if(l>1e-12){n[i]/=l;n[i+1]/=l;n[i+2]/=l;}else n[i+1]=1;}
   out.normal=n;for(const k of ['position','color','uv','cwRoot','cwPhase'])out[k]=new Float32Array(out[k]);out.index=new Uint32Array(out.index);return out;
  }
  return {wood:finish(wood),foliage:finish(foliage)};
 }
 /** Pure wind field and derivative used identically in vertex and normal paths. */
 function wind(y,height,phase,time,strength=0.35){
  const k=clamp(y/height,0,1.4),a=strength*(.065*Math.sin(time*1.07+phase)+.027*Math.sin(time*1.91+phase*.73));
  return {offset:height*k*k*a,gradient:y>0&&y/height<1.4?2*k*a:0};
 }
 function level(distance,previous=-1,minimum=0,near=16,far=30){
  let desired=distance<near?0:distance<far?1:2;
  if(previous>=0){if(desired>previous&&distance<(previous===0?near:far)*1.12)desired=previous;else if(desired<previous&&distance>(previous===2?far:near)*.88)desired=previous;}
  return Math.max(minimum,desired);
 }
 const windGLSL=`
 uniform float cwTime,cwStrength;uniform vec2 cwDirection;
 attribute vec4 cwRoot;attribute float cwPhase;varying vec2 vCWUv;
 vec2 cwBend(){float y=position.y-cwRoot.y,h=1./cwRoot.w,k=clamp(y*cwRoot.w,0.,1.4);
 float a=cwStrength*(.065*sin(cwTime*1.07+cwPhase)+.027*sin(cwTime*1.91+cwPhase*.73));
 return vec2(h*k*k*a,(y>0.&&y*cwRoot.w<1.4)?2.*k*a:0.);}
 `;
 function create(T,input={}){
  if(!T?.BufferGeometry||!T?.MeshStandardMaterial||!T?.Group)throw new TypeError('Pass the existing compatible THREE namespace.');
  if(!input||typeof input!=='object'||Array.isArray(input))input={};
  const list=input.trees===undefined?[{}]:input.trees;if(!Array.isArray(list)||list.length>MAX_TREES)throw new RangeError('Trees expects up to 24 descriptors.');
  const ids=new Set(),desc=list.map((v,i)=>{const d=descriptor(v,Number.isSafeInteger(input.seed)?input.seed>>>0:173);if(ids.has(d.id))throw new TypeError('Duplicate tree id: '+d.id);ids.add(d.id);return d;});
  const group=new T.Group();group.name='Currentworks Trees';
  let disposed=false,time=0,quality='balanced',quiet=false,visible=true,xr=false,ar=false,levelChanges=0,updates=0;
  let strength=num(input.windStrength,.35,0,1.5),direction=[1,.35];const near=num(input.near,16,2,100),far=num(input.far,30,near+2,500);
  const uniforms={cwTime:{value:0},cwStrength:{value:strength},cwDirection:{value:new T.Vector2(...direction).normalize()}};
  const materials=[],geometries=[],records=[],world=new T.Vector3(),viewer=new T.Vector3();
  function material(leaves){
   const m=new T.MeshStandardMaterial({name:'Currentworks '+(leaves?'foliage':'bark')+' '+VERSION,vertexColors:true,roughness:leaves?.83:.96,metalness:0,side:leaves?T.DoubleSide:T.FrontSide});
   m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);shader.vertexShader=windGLSL+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal.y-=cwBend().y*dot(objectNormal.xz,cwDirection);');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.xz+=cwDirection*cwBend().x;vCWUv=uv;');
    shader.fragmentShader='varying vec2 vCWUv;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+(leaves?'float vein=exp(-abs(vCWUv.x-.5)*65.);diffuseColor.rgb*=.90+.10*vCWUv.y;diffuseColor.rgb+=vec3(.025,.033,.009)*vein;':'float ridge=.5+.5*sin(vCWUv.x*88.+sin(vCWUv.y*8.)*.55);diffuseColor.rgb*=.76+.24*ridge;'));
   };
   m.customProgramCacheKey=()=>VERSION+(leaves?'/leaf':'/wood');materials.push(m);return m;
  }
  const woodMat=material(false),leafMat=material(true);
  function geometry(data,d){
   const g=new T.BufferGeometry();for(const [key,size]of [['position',3],['normal',3],['color',3],['uv',2],['cwRoot',4],['cwPhase',1]])g.setAttribute(key,new T.BufferAttribute(data[key],size));g.setIndex(new T.BufferAttribute(data.index,1));g.computeBoundingBox();g.boundingBox.expandByScalar(d.height*.30);g.computeBoundingSphere();g.boundingSphere.radius+=d.height*.30;geometries.push(g);return g;
  }
  try{for(const d of desc){const sk=skeleton(d),node=new T.Group();node.name='Currentworks tree '+d.id;node.userData.treeId=d.id;group.add(node);const lods=[];
   for(let i=0;i<3;i++){const data=geometryData(sk,i),pair=new T.Group();pair.add(new T.Mesh(geometry(data.wood,d),woodMat),new T.Mesh(geometry(data.foliage,d),leafMat));pair.visible=false;node.add(pair);lods.push(pair);}
   records.push({descriptor:d,node,lods,selected:-1});
  }}catch(e){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();throw e;}
  function update(frame={}){
   if(disposed||!frame||typeof frame!=='object'||Array.isArray(frame))return false;
   time=num(frame.time,time,0,1e7);if(['light','balanced','cinematic'].includes(frame.quality))quality=frame.quality;
   if(typeof frame.quiet==='boolean')quiet=frame.quiet;if(typeof frame.visible==='boolean')visible=frame.visible;if(typeof frame.xr==='boolean')xr=frame.xr;if(typeof frame.ar==='boolean')ar=frame.ar;
   strength=num(frame.windStrength,strength,0,1.5);
   if(Array.isArray(frame.windDirection)&&frame.windDirection.length===2&&frame.windDirection.every(finite)&&Math.hypot(...frame.windDirection)>.01)uniforms.cwDirection.value.fromArray(frame.windDirection).normalize();
   uniforms.cwTime.value=quiet?0:time;uniforms.cwStrength.value=quiet?0:strength;group.visible=visible&&!(ar&&input.hideInAR!==false);
   group.updateWorldMatrix(true,false);const scale=Math.max(1e-6,group.matrixWorld.getMaxScaleOnAxis()),haveView=vector(frame.viewer);
   if(haveView)viewer.fromArray(frame.viewer);
   const minimum=quality==='light'||xr?1:0;
   for(const r of records){world.fromArray(r.descriptor.position).applyMatrix4(group.matrixWorld);const distance=haveView?world.distanceTo(viewer)/scale:0,l=level(distance,r.selected,minimum,near,far);
    if(l!==r.selected){r.selected=l;levelChanges++;for(let i=0;i<3;i++)r.lods[i].visible=i===l;}
   }updates++;return true;
  }
  function reset(){if(disposed)return;time=0;uniforms.cwTime.value=0;for(const r of records)r.selected=-1;update({time:0});}
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
  update({quality:input.quality||'balanced',quiet:input.quiet===true});
  return Object.freeze({group,uniforms,update,reset,dispose,
   describe:()=>desc.map(d=>({...d,position:d.position.slice(),schema:SCHEMA,generator:VERSION})),
   get stats(){let triangles=0,vertices=0;const lod=[0,0,0];if(!disposed&&group.visible)for(const r of records){lod[r.selected]++;for(const m of r.lods[r.selected].children){triangles+=m.geometry.index.count/3;vertices+=m.geometry.attributes.position.count;}}
    return {module:'Currentworks Trees',version:VERSION,trees:records.length,visible:!disposed&&group.visible,time,quiet,quality,xr,ar,lod,triangles,vertices,drawCalls:!disposed&&group.visible?records.length*2:0,geometries:disposed?0:geometries.length,materials:disposed?0:materials.length,textures:0,renderTargets:0,levelChanges,updates,disposed};}
  });
 }
 const api=Object.freeze({VERSION,SCHEMA,MAX_TREES,PRESETS,DETAIL,random,descriptor,skeleton,geometryData,wind,level,create});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNTrees=api;
})(globalThis);
