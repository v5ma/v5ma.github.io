/* Currentworks Cloudlets 0.2.0. Original seeded mesh-cloud clusters.
 * These are opaque stylized lobes, NOT VDB, raymarched clouds or Gaussian splats.
 * Geometry and motion are GROUP-LOCAL; viewer observations are WORLD-SPACE.
 * No engine import, camera control, scene background, input or game-state owner.
 */
(function(root){
  'use strict';
  const VERSION='0.2.0',MAX_CLOUDS=8,LOBES=7;
  const LEVELS=Object.freeze([Object.freeze([16,10]),Object.freeze([12,8]),Object.freeze([8,5])]);
  const validVector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  const validId=id=>typeof id==='string'&&id.length>0&&id.length<=96||Number.isSafeInteger(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const numeric=(v,f,a,b)=>Number.isFinite(v)?clamp(v,a,b):f;
  function random(seed){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  function seedFor(id){let h=2166136261;for(const ch of String(id)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function descriptors(input=[]){
    if(!Array.isArray(input)||input.length>MAX_CLOUDS)throw new RangeError('Cloudlets accepts at most eight cloud descriptors.');
    const seen=new Set();return input.map(d=>{
      if(!d||!validId(d.id)||seen.has(d.id)||!validVector(d.position)||d.position.some(n=>Math.abs(n)>10000))
        throw new TypeError('Each cloud needs a unique stable id and finite local position.');
      seen.add(d.id);return {id:d.id,position:d.position.slice(),seed:Number.isSafeInteger(d.seed)?d.seed>>>0:seedFor(d.id),
        radius:numeric(d.radius,.6,.15,2.5),yaw:numeric(d.yaw,0,-Math.PI*2,Math.PI*2),
        drift:numeric(d.drift,.08,0,.15),bob:numeric(d.bob,.035,0,.08)};
    });
  }
  function shape(seed,radius=1){
    radius=numeric(radius,1,.15,2.5);const rand=random(seed);
    const positions=[[0,0,0],[-.62,-.06,.02],[.67,-.06,-.02],[-.23,.38,-.04],[.31,.26,.08],[-.06,-.10,.37],[.12,-.08,-.39]];
    return positions.map((p,i)=>{const r=(i===0?.60:.38+rand()*.12)*radius;
      return {center:p.map((n,k)=>(n+(i?rand()*.12-.06:0)) * radius),scale:[r*(1.12+rand()*.16),r*(.78+rand()*.19),r*(.93+rand()*.20)]};
    });
  }
  function extent(lobes){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const l of lobes)for(let i=0;i<3;i++){min[i]=Math.min(min[i],l.center[i]-l.scale[i]);max[i]=Math.max(max[i],l.center[i]+l.scale[i]);}
    return {min,max,radius:Math.hypot(...min.map((v,i)=>Math.max(Math.abs(v),Math.abs(max[i]))))};
  }
  function level(distance,previous,quality='balanced',xr=false,near=10,far=20){
    let result=previous===null?(distance<near?0:distance<far?1:2):previous;
    if(result===0&&distance>near*1.12)result=1;
    if(result===1&&distance<near*.88)result=0;
    if(result===1&&distance>far*1.12)result=2;
    if(result===2&&distance<far*.88)result=distance<near*.88?0:1;
    return Math.max(result,xr||quality==='light'?2:quality==='balanced'?1:0);
  }
  function offset(time,d,quiet=false){
    if(quiet)return [0,0,0];const phase=(d.seed%997)/997*Math.PI*2;
    return [Math.sin(time*.17+phase)*d.drift,Math.sin(time*.23+phase)*d.bob,Math.cos(time*.13+phase)*d.drift*.35];
  }
  // Directional vertex tint adds shape without transparency, textures or another pass.
  // Input normal is unit local-space; output remains bounded linear RGB.
  function shade(normal,h){
    h=clamp(h,0,1);const key=clamp(normal[0]*-.31+normal[1]*.87+normal[2]*.38,-1,1)*.5+.5;
    const amount=.69+.20*h+.11*key,base=[.60,.69,.82],top=[1,.98,.91];
    return base.map((v,i)=>clamp((v+(top[i]-v)*h)*amount,0,1));
  }
  function create(T,options={}){
    if(!T?.BufferGeometry||!T?.MeshLambertMaterial||!T?.SphereGeometry)throw new TypeError('Supply the existing compatible THREE namespace.');
    if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Cloudlet options must be an object.');
    const desc=descriptors(options.clouds||[]),near=numeric(options.near,10,2,100),far=numeric(options.far,20,near*1.4,250);
    if(options.material!=null&&!options.material.isMaterial)throw new TypeError('Optional material must be a Three.js material.');
    const group=new T.Group();group.name='Currentworks Cloudlets';
    const ownedMaterial=options.material==null,material=options.material||new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,fog:false});
    if(ownedMaterial)material.name='Currentworks / soft cloud lobes';
    const geometry=[],nodes=[];let disposed=false,time=0,quiet=false,visible=true,xr=false,quality='balanced';
    const eye=new T.Vector3(),scale=new T.Vector3(),worldCenter=new T.Vector3();
    const base=LEVELS.map(l=>new T.SphereGeometry(1,l[0],l[1]));
    function meshGeometry(lobes,source){
      const p=[],n=[],colors=[],indices=[],v=new T.Vector3(),normal=new T.Vector3();
      const bounds=extent(lobes);
      for(const l of lobes){const start=p.length/3,pos=source.attributes.position,norm=source.attributes.normal;
        for(let i=0;i<pos.count;i++){
          v.fromBufferAttribute(pos,i);v.set(v.x*l.scale[0]+l.center[0],v.y*l.scale[1]+l.center[1],v.z*l.scale[2]+l.center[2]);p.push(v.x,v.y,v.z);
          normal.fromBufferAttribute(norm,i).set(norm.getX(i)/l.scale[0],norm.getY(i)/l.scale[1],norm.getZ(i)/l.scale[2]).normalize();n.push(normal.x,normal.y,normal.z);
          const h=clamp((v.y-bounds.min[1])/(bounds.max[1]-bounds.min[1]),0,1);
          colors.push(...shade([normal.x,normal.y,normal.z],h));
        }
        for(const index of source.index.array)indices.push(start+index);
      }
      const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(p,3));result.setAttribute('normal',new T.Float32BufferAttribute(n,3));
      result.setAttribute('color',new T.Float32BufferAttribute(colors,3));result.setIndex(indices);result.computeBoundingBox();result.computeBoundingSphere();geometry.push(result);return result;
    }
    try{for(const d of desc){const lobes=shape(d.seed,d.radius),meshes=base.map(b=>meshGeometry(lobes,b));
      const m=new T.Mesh(meshes[1],material);m.name='Cloudlet / '+d.id;m.position.fromArray(d.position);m.rotation.y=d.yaw;
      // Scenery has no interaction ownership. Host raycasters can keep to their explicit button/target sets.
      group.add(m);nodes.push({d,m,meshes,bounds:extent(lobes),level:null,nearHidden:false});}
    }catch(e){for(const g of geometry)g.dispose();if(ownedMaterial)material.dispose();throw e;}
    finally{for(const g of base)g.dispose();}
    function update(frame={}){
      if(disposed||!frame||typeof frame!=='object'||Array.isArray(frame))return false;
      if(frame.viewer!==undefined&&!validVector(frame.viewer))return false;
      time=numeric(frame.time,time,0,1e7);if(typeof frame.quiet==='boolean')quiet=frame.quiet;
      if(typeof frame.visible==='boolean')visible=frame.visible;if(typeof frame.xr==='boolean')xr=frame.xr;
      if(['light','balanced','cinematic'].includes(frame.quality))quality=frame.quality;
      group.visible=visible;group.updateWorldMatrix(true,false);group.getWorldScale(scale);const factor=Math.max(Math.abs(scale.x),Math.abs(scale.y),Math.abs(scale.z),1e-6);
      if(frame.viewer)eye.fromArray(frame.viewer);
      for(const node of nodes){const o=offset(time,node.d,quiet);node.m.position.set(node.d.position[0]+o[0],node.d.position[1]+o[1],node.d.position[2]+o[2]);
        worldCenter.copy(node.m.position).applyMatrix4(group.matrixWorld);const distance=frame.viewer?worldCenter.distanceTo(eye)/factor:0;
        const next=level(distance,node.level,quality,xr,near,far);node.level=next;node.m.geometry=node.meshes[next];
        const boundary=node.bounds.radius+.25;
        node.nearHidden=!!frame.viewer&&options.hideNearViewer!==false&&distance<(node.nearHidden?boundary+.15:boundary);
        node.m.visible=!node.nearHidden;
      }
      return true;
    }
    function reset(at=0){if(disposed)return;for(const node of nodes){node.level=null;node.nearHidden=false;}update({time:at});}
    function describe(){return desc.map(d=>({...d,position:d.position.slice()}));}
    function dispose(){if(disposed)return;disposed=true;group.removeFromParent();for(const g of geometry)g.dispose();if(ownedMaterial)material.dispose();}
    return Object.freeze({group,update,reset,describe,dispose,
      get stats(){return {module:'Currentworks Cloudlets',version:VERSION,time,quality,quiet,xr,visible,disposed,clouds:desc.length,
        visibleClouds:disposed||!visible?0:nodes.filter(n=>n.m.visible).length,geometryCount:disposed?0:geometry.length,
        selectedTriangles:disposed||!visible?0:nodes.reduce((s,n)=>s+(n.m.visible?n.m.geometry.index.count/3:0),0),
        levels:nodes.map(n=>n.level),textures:0,renderTargets:0};}});
  }
  const api=Object.freeze({VERSION,MAX_CLOUDS,LOBES,LEVELS,seedFor,descriptors,shape,extent,level,offset,shade,create});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.SVGNCloudlets=api;
})(globalThis);
