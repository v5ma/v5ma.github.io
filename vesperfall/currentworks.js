/* Living Lanterns: pinned Currentworks Water/Fire/Trees in the existing r184
 * renderer. Cosmetic observations only; no controls, damage or saved state. */
(function(root){'use strict';
 function install(g){if(g.currentworks)return g.currentworks;
  const T=g.T,M=VesperCurrentworksModel,scene=new T.Group();scene.name='Living Lanterns / Currentworks';scene.visible=false;g.scene.object3D.add(scene);
  const state={ready:false,loading:false,error:null,world:null,plan:null,generation:0,disposed:false,contextLost:false,restored:[],waterEvents:0};
  const cursor=new M.Cursor(),eye=new T.Vector3(),resources=[];let water=[],forests=[],fire=null,markers=[],canvas=null,waterOwner=null,oldWaterTick=null;
  function release(){for(const w of water)w.dispose();for(const f of forests)f.dispose();fire?.dispose();for(const r of resources)r.dispose();resources.length=0;water=[];forests=[];markers=[];fire=null;scene.clear();state.ready=false;}
  function mark(){const mat=new T.MeshStandardMaterial({color:'#5c5547',metalness:.55,roughness:.4,emissive:'#efae58',emissiveIntensity:0});
   const geo=new T.TorusGeometry(.23,.035,5,18),ring=new T.Mesh(geo,mat);ring.rotation.x=-Math.PI/2;scene.add(ring);resources.push(geo,mat);
   // A glowing lens remains readable when motion is reduced; it is not a light.
   const coreGeo=new T.OctahedronGeometry(.095),core=new T.Mesh(coreGeo,mat);scene.add(core);resources.push(coreGeo);
   return {ring,core,mat};
  }
  function prepare(){if(state.disposed||state.contextLost||state.loading||state.ready||state.error||!g.scene.renderer||!g.scene.camera)return;
   if(canvas!==g.scene.renderer.domElement){detach();canvas=g.scene.renderer.domElement;canvas.addEventListener("webglcontextlost",lost);canvas.addEventListener("webglcontextrestored",restoredContext);}
   state.loading=true;const token=++state.generation;
   try{
    for(let i=0;i<2;i++){
     const w=SVGNWater.create(T,{preset:'lagoon',width:12,length:18,centerZ:0,level:.065,depth:.1,shoreDepth:.025,quality:'light',opacity:.6,seed:902+i});
     // Prebuild supported detail levels outside normal frame updates.
     w.setQuality('balanced');w.setQuality('light');w.mesh.visible=false;scene.add(w.mesh);water.push(w);
     const f=SVGNTrees.create(T,{trees:M.forest(i),windStrength:.18,near:16,far:32,hideInAR:true});scene.add(f.group);forests.push(f);
     markers.push(mark());
    }
    fire=SVGNFire.create(T,{quality:'light',lights:false,seed:1991});scene.add(fire.group);
    const warm=new T.Scene();for(const w of water){const m=new T.Mesh(w.mesh.geometry,w.material);m.frustumCulled=false;warm.add(m);}
    const renderer=g.scene.renderer,camera=g.scene.camera;
    Promise.resolve(renderer.compileAsync?renderer.compileAsync(warm,camera,g.scene.object3D):renderer.compile(warm,camera,g.scene.object3D))
     .then(async()=>{for(const effect of[fire,...forests]){if(token!==state.generation||state.disposed)return;await effect.prepare(renderer,camera,g.scene.object3D);}})
     .then(()=>{if(token!==state.generation||state.disposed)return;state.ready=true;state.world=null;})
     .catch(e=>{if(token!==state.generation||state.disposed)return;state.error=String(e?.message||e);release();console.warn('Living Lanterns graphics unavailable; original game retained:',state.error);})
     .finally(()=>{warm.clear();if(token===state.generation)state.loading=false;});
   }catch(e){state.loading=false;state.error=String(e?.message||e);release();console.warn('Living Lanterns setup unavailable:',state.error);}
  }
  function reset(){state.generation++;state.loading=false;release();state.error=null;state.world=null;state.plan=null;scene.visible=false;}
  function tick(){if(state.disposed)return;attachWater();if(!state.ready){restoreWater();prepare();return;}const s=g.game,p=M.policy(g),events=cursor.read(s);
   if(state.world!==s.world){state.world=s.world;state.plan=M.plan(s.world);fire.reset();water.forEach(w=>w.reset(s.time));forests.forEach(f=>f.reset());state.waterEvents=0;}
   scene.visible=p.visible;state.restored=M.restored(s);const modules=state.plan?.modules||[];g.head.object3D.getWorldPosition(eye);
   fire.update({time:s.time,quality:p.quality,xr:p.xr,quiet:p.quiet,visible:p.visible});
   for(let i=0;i<2;i++){
    const m=modules[i],w=water[i],f=forests[i],marker=markers[i],near=m&&Math.hypot(eye.x-m.x,eye.z-m.z)<44,show=!!(p.visible&&near);
    if(m){w.mesh.position.set(m.x,0,m.z);f.group.position.set(m.x,0,m.z);marker.ring.position.set(...m.refuge);marker.core.position.set(m.refuge[0],m.refuge[1]+.1,m.refuge[2]);}
    marker.ring.visible=marker.core.visible=show;marker.mat.emissiveIntensity=state.restored[i]?.85:0;marker.mat.color.set(state.restored[i]?'#edc681':'#514d45');
    // The forest grows from existing enclosing wall crowns, not walkable routes.
    f.update({time:s.time,quality:p.quality,quiet:p.quiet,viewer:eye.toArray(),xr:p.xr,ar:!!(g.arMode||g.arExpedition),visible:show&&state.plan?.chapter===0});
    const bodies=m&&M.inWater(m,s.p)&&p.ripples?[{id:'pilgrim',x:s.p[0]-m.x,z:s.p[2]-m.z,radius:.32}]:[];
    w.update({time:s.time,quality:p.quality,xr:p.xr,quiet:p.quiet,visible:show&&p.water,bodies,opacity:p.xr?.48:.62});
    // Honor the retained caustic preference, including the in-headset setting.
    w.uniforms.detail.value=g.tidelight?.options?.caustics===false?0:(p.quality==='balanced'?1:0);
    if(show&&state.restored[i])fire.emitter('refuge-'+i,{position:m.refuge,direction:[0,1,0],length:.55,radius:.16,power:.6});else fire.stop('refuge-'+i);
   }
   for(const e of events){if(!p.visible)continue;
    if(e.p&&p.ripples&&['impact','blink','shard','kit-splash'].includes(e.type))for(let i=0;i<modules.length;i++)if(M.inWater(modules[i],e.p)&&water[i].mesh.visible){water[i].splash(e.p[0]-modules[i].x,e.p[2]-modules[i].z,.6,.25);state.waterEvents++;}
    // Only a real cinder explosion may emit fire. Frost and plain impacts do not.
    if(e.type==='explosion'&&e.p&&!p.quiet)fire.emit({id:e.seq,position:[...e.p],mode:'impact',radius:.45,life:.5,power:.55});
   }
   // Retain every old water option and restore legacy rendering outside this pass.
   restoreWater();
  }
  const api={state,scene,tick,prepare,reset,get water(){return water;},get forests(){return forests;},get fire(){return fire;},get ownsWater(){return state.ready&&M.supported(g.game.world);},diagnostics(){return {ready:state.ready,loading:state.loading,error:state.error,visible:scene.visible,restored:[...state.restored],waterEvents:state.waterEvents,water:water.map(w=>({...w.stats})),trees:forests.map(f=>({...f.stats})),fire:fire?{...fire.stats}:null};}};
  g.currentworks=api;
  const oldTick=g.tick.bind(g);g.tick=function(...args){const out=oldTick(...args);tick();return out;};
  // The separate A-Frame water component may initialize after vesper-game.
  function restoreWater(){if(waterOwner?.root)waterOwner.root.visible=api.ownsWater?false:!!waterOwner.current?.enabled;}
  function attachWater(){const t=g.scene.components.tidelight;if(!t||waterOwner===t)return;if(waterOwner&&oldWaterTick)waterOwner.tick=oldWaterTick;waterOwner=t;oldWaterTick=t.tick;const original=oldWaterTick;t.tick=function(...args){const out=original.apply(this,args);restoreWater();return out;};}
  function detach(){if(canvas){canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restoredContext);}canvas=null;}
  function lost(){state.contextLost=true;reset();restoreWater();}
  function restoredContext(){state.contextLost=false;reset();}
  const oldRemove=g.remove.bind(g);g.remove=function(){state.disposed=true;state.generation++;detach();release();if(waterOwner&&oldWaterTick){waterOwner.tick=oldWaterTick;if(waterOwner.root)waterOwner.root.visible=!!waterOwner.current?.enabled;}scene.removeFromParent();return oldRemove();};
  return api;
 }
 function connect(){const s=document.querySelector('a-scene');if(!s)return;const ready=e=>{if(!e||e.detail?.name==='vesper-game'){const g=s.components?.['vesper-game'];if(g?.threshold)install(g);}};s.addEventListener('componentinitialized',ready);ready();}
 if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});else connect();}
 const api=Object.freeze({install});root.VesperCurrentworks=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
