/* Currentworks FlexSurface 0.1.0. Original bounded deformable geometry.
 * Caller supplies THREE and any material/texture. No DOM, input capture, clock,
 * renderer, GSAP, cloth solver or game-state ownership. Coordinates are LOCAL.
 * Both the rendered triangles and raycast UVs use the same updated CPU buffer.
 */
(function(root){
 'use strict';
 const VERSION='0.1.0',MAX_BEND=2.4;
 const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function number(v,f,a,b,name){if(v===undefined)return f;if(!Number.isFinite(v)||v<a||v>b)throw new RangeError(name+' is outside its finite range.');return v;}
 function options(v={}){
  if(!object(v))throw new TypeError('FlexSurface options must be an object.');
  const width=number(v.width,1.2,.05,6,'width'),height=number(v.height,.8,.05,6,'height');
  const columns=number(v.columns,32,2,64,'columns'),rows=number(v.rows,8,1,32,'rows');
  if(!Number.isInteger(columns)||!Number.isInteger(rows))throw new TypeError('Grid dimensions must be integers.');
  return {width,height,columns,rows,readableBack:v.readableBack!==false};
 }
 function shape(v={},cfg=options()){
  if(!object(v))throw new TypeError('Shape must be an object.');
  const bend=number(v.bend,0,-MAX_BEND,MAX_BEND,'bend');
  let pull=null;
  if(v.pull!==undefined&&v.pull!==null){
   if(!object(v.pull))throw new TypeError('Pull must be an object or null.');
   const min=Math.min(cfg.width,cfg.height),max=Math.max(cfg.width,cfg.height),p=v.pull;
   pull={u:number(p.u,.5,0,1,'pull.u'),v:number(p.v,.5,0,1,'pull.v'),
    strength:number(p.strength,0,-.1*min,.1*min,'pull.strength'),radius:number(p.radius,.3*min,.15*min,2*max,'pull.radius')};
   if(pull.strength===0)pull=null;
  }
  return {bend,pull};
 }
 const sinc=x=>Math.abs(x)<1e-4?1-x*x/6+x*x*x*x/120:Math.sin(x)/x;
 /** Pure analytic surface. x-derivative and y-derivative are local length derivatives.
  * The mesh is a tessellated approximation; pick() intersects actual triangles.
  */
 function evaluateInto(u,v,state,cfg,out){
  if(!Number.isFinite(u)||!Number.isFinite(v)||u<0||u>1||v<0||v>1)throw new RangeError('Surface coordinates must be in [0,1].');
  const w=cfg.width,h=cfg.height,a=state.bend,phi=a*u,q=w*u;
  const x=-w/2+q*sinc(phi),y=(v-.5)*h;
  // Stable 1-cos(phi), including arbitrarily small positive/negative bends.
  let z=q*.5*phi*sinc(phi*.5)**2,fx=0,fy=0;
  if(state.pull){
   const p=state.pull,dx=(u-p.u)*w,dy=(v-p.v)*h,r2=p.radius*p.radius;
   const e=p.strength*Math.exp(-.5*(dx*dx+dy*dy)/r2),d=e*u*u;
   z+=d;fx=e*(2*u/w-u*u*dx/r2);fy=-d*dy/r2;
  }
  const c=Math.cos(phi),s=Math.sin(phi)+fx;
  const nx=-s,ny=-c*fy,nz=c,length=Math.hypot(nx,ny,nz);
  out.position[0]=x;out.position[1]=y;out.position[2]=z;
  out.normal[0]=nx/length;out.normal[1]=ny/length;out.normal[2]=nz/length;
  out.dx[0]=c;out.dx[1]=0;out.dx[2]=s;out.dy[0]=0;out.dy[1]=1;out.dy[2]=fy;return out;
 }
 function evaluate(u,v,state,cfg){return evaluateInto(u,v,state,cfg,{position:[],normal:[],dx:[],dy:[]});}
 function equal(a,b){return a.bend===b.bend&&(!a.pull&&!b.pull||!!a.pull&&!!b.pull&&['u','v','strength','radius'].every(k=>a.pull[k]===b.pull[k]));}
 function create(T,input={}){
  if(!T?.PlaneGeometry||!T?.BufferAttribute||!T?.MeshStandardMaterial)throw new TypeError('Supply an existing compatible THREE namespace.');
  const cfg=options(input);
  if(input.material!=null&&(!input.material.isMaterial||input.material.side!==T.FrontSide))throw new TypeError('Borrowed material must be a FrontSide Three.js material.');
  const ownsMaterial=input.material==null,material=input.material||new T.MeshStandardMaterial({color:0xd1eae4,roughness:.7,metalness:0,side:T.FrontSide});
  const group=new T.Group();group.name='Currentworks FlexSurface';
  const frontGeometry=new T.PlaneGeometry(cfg.width,cfg.height,cfg.columns,cfg.rows);
  const coordinates=frontGeometry.attributes.uv.array.slice();
  const positions=frontGeometry.attributes.position,normals=frontGeometry.attributes.normal;
  positions.setUsage(T.DynamicDrawUsage);normals.setUsage(T.DynamicDrawUsage);
  const front=new T.Mesh(frontGeometry,material);front.name='FlexSurface / front';group.add(front);
  let back=null,backGeometry=null,backNormals=null;
  if(cfg.readableBack){
   backGeometry=new T.BufferGeometry();backGeometry.setAttribute('position',positions);
   backNormals=new T.BufferAttribute(new Float32Array(normals.array.length),3).setUsage(T.DynamicDrawUsage);
   backGeometry.setAttribute('normal',backNormals);
   const uv=coordinates.slice();for(let i=0;i<uv.length;i+=2)uv[i]=1-uv[i];
   backGeometry.setAttribute('uv',new T.BufferAttribute(uv,2));
   const ix=frontGeometry.index.array.slice();for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t;}
   backGeometry.setIndex(new T.BufferAttribute(ix,1));
   back=new T.Mesh(backGeometry,material);back.name='FlexSurface / readable back';group.add(back);
  }
  const scratch={position:[0,0,0],normal:[0,0,1],dx:[1,0,0],dy:[0,1,0]};
  let current=null,updates=0,disposed=false;
  function update(value={}){
   if(disposed)return false;
   const next=shape(value,cfg); // Validate fully before touching existing buffers.
   if(current&&equal(current,next))return false;
   for(let i=0;i<positions.count;i++){
    const p=evaluateInto(coordinates[i*2],coordinates[i*2+1],next,cfg,scratch);
    positions.setXYZ(i,...p.position);normals.setXYZ(i,...p.normal);
    if(backNormals)backNormals.setXYZ(i,-p.normal[0],-p.normal[1],-p.normal[2]);
   }
   positions.needsUpdate=normals.needsUpdate=true;if(backNormals)backNormals.needsUpdate=true;
   frontGeometry.computeBoundingBox();frontGeometry.computeBoundingSphere();
   if(backGeometry){
    if(!backGeometry.boundingBox)backGeometry.boundingBox=new T.Box3();
    if(!backGeometry.boundingSphere)backGeometry.boundingSphere=new T.Sphere();
    backGeometry.boundingBox.copy(frontGeometry.boundingBox);backGeometry.boundingSphere.copy(frontGeometry.boundingSphere);
   }
   current=next;updates++;return true;
  }
  function pick(raycaster){
   if(disposed)return null;
   if(!raycaster?.intersectObjects)throw new TypeError('Supply the host raycaster.');
   for(let node=group;node;node=node.parent)if(!node.visible)return null;
   group.updateWorldMatrix(true,true);
   // The UV on the back comes from its own mirrored attribute, not a separate
   // invisible hit rectangle. Material/texture transforms remain host-owned.
   const hits=raycaster.intersectObjects(group.children.filter(m=>m.visible),false);
   return hits.length?hits[0]:null;
  }
  function reset(){if(disposed)return false;return update({bend:0,pull:null});}
  function describe(){return {options:{...cfg},shape:{bend:current.bend,pull:current.pull?{...current.pull}:null}};}
  function dispose(){if(disposed)return;disposed=true;group.removeFromParent();frontGeometry.dispose();backGeometry?.dispose();if(ownsMaterial)material.dispose();}
  update();
  return Object.freeze({group,front,back,material,update,pick,reset,describe,dispose,
   get stats(){return {module:'Currentworks FlexSurface',version:VERSION,disposed,updates,
    vertices:disposed?0:positions.count,triangles:disposed?0:frontGeometry.index.count/3*(back?2:1),
    meshes:disposed?0:group.children.length,ownsMaterial,textures:0,renderTargets:0};}});
 }
 const api=Object.freeze({VERSION,MAX_BEND,options,shape,evaluate,create});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNFlexSurface=api;
})(globalThis);
