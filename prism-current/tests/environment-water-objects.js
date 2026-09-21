/* Actual Three.js object contracts in an otherwise empty browser document.
 * No WebGL context, gameplay playthrough or hardware-performance claim.
 */
(() => {
 'use strict';
 const T=AFRAME.THREE,W=SVGNWater,checks=[];
 const check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const near=(a,b)=>Math.abs(a-b)<1e-7;
 const parent=new T.Group(),unrelated=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());parent.add(unrelated);
 const w=W.create(T,{quality:'light'});parent.add(w.mesh);
 check(w.mesh.isMesh&&w.material.isShaderMaterial,'Builds real Three.js mesh/material objects without making a renderer');
 check(w.stats.vertices===25*97&&w.stats.triangles===24*96*2,'Light geometry uses its declared bounded budget');
 check(w.material.transparent&&!w.material.depthWrite&&w.material.depthTest&&w.material.forceSinglePass,'Transparent material preserves depth testing and avoids doubled transparent draws');
 check(w.uniforms.waterNoise.value.colorSpace===T.NoColorSpace&&w.uniforms.waterNoise.value.generateMipmaps,'Generated normals are linear data with mip filtering');
 const opts=Object.freeze({time:.1,level:.64,opacity:.28,quality:'balanced',xr:true,bodies:Object.freeze([Object.freeze({id:1,x:1,z:-8,radius:.5})])});
 w.update(opts);check(w.stats.opacity===.28&&w.stats.level===.64,'Host AR opacity and tide are applied without changing the input');
 check(w.stats.geometries===2&&w.stats.vertices===49*193,'First quality switch allocates only one additional reusable geometry');
 const beds0=w.mesh.geometry.attributes.bedHeight.array;check(near(beds0[Math.floor(beds0.length/2)],-.18-2.6),'Changing tide before a quality switch does not move the physical bed');
 const kept=w.mesh.geometry;w.setQuality('cinematic',true);check(w.stats.quality==='balanced'&&w.mesh.geometry===kept,'XR caps the unmeasured cinematic mesh to balanced');
 w.setQuality('cinematic');w.setQuality('light');w.setQuality('balanced');check(w.stats.geometries===3&&w.mesh.geometry===kept,'Revisited quality levels reuse cached geometry');
 w.update({time:1,bodies:[{id:'boat',x:1,z:-7}]});check(w.stats.emitted===0,'Initial body observation is not a travelled wake');
 for(let i=1;i<25;i++)w.update({time:1+i*.02,bodies:[{id:'boat',x:1+.01*i,z:-7+.04*i}]});
 check(w.stats.emitted>0&&w.stats.liveDisturbances>0,'Continuous host body observations emit finite wakes');
 check(w.stats.liveDisturbances<=12,'Moving bodies stay within the fixed disturbance pool');
 const state=JSON.stringify(w.uniforms.disturbances.value);w.update({time:1.48,bodies:[{id:'boat',x:1.24,z:-6.04}]});
 check(JSON.stringify(w.uniforms.disturbances.value)===state,'Repeating the paused host time does not emit or age effects');
 w.reset();w.update({time:0,bodies:[{id:1,x:0,z:-9}]});w.update({time:.3,bodies:[{id:1,x:20,z:-9}]});
 check(w.stats.emitted===0,'A large position discontinuity does not draw a teleport wake');
 w.update({time:.4,quiet:true});check(!w.splash(0,-8)&&w.stats.liveDisturbances===0&&w.uniforms.time.value===0,'Quiet motion clears wakes and disables new splash emissions');
 check(same(w.sample(1,-5).normal,[0,1,0])&&near(w.sample(1,-5).height,.64),'Quiet sampling matches the flat shader surface');
 w.update({time:1,quiet:false});check(w.splash(0,-7,.8,.4),'An explicit host impact emits a splash');
 w.update({time:1.2,visible:false});check(w.stats.liveDisturbances===0&&!w.mesh.visible,'Hiding the surface clears stale visual event history');
 w.update({time:1.3,visible:true});check(w.stats.liveDisturbances===0,'Returning to the river does not replay old splashes');
 w.splash(1,-3);w.update({time:.1});check(w.stats.liveDisturbances===0,'A restarted host clock clears its previous effects');
 w.update({time:5,quiet:false});let maxQueryError=0;for(let i=0;i<120;i++){const x=Math.sin(i)*4,z=-2-i*.2,p=w.sample(x,z);maxQueryError=Math.max(maxQueryError,Math.hypot(p.x-x,p.z-z));}
 check(maxQueryError<1e-7,'Height queries invert the same horizontal wave displacement at 120 points');
 w.update({time:6, bodies:Array.from({length:50},(_,i)=>({id:i,x:0,z:-8}))});check(w.stats.bodies===8,'Observation list is capped at eight tracked bodies');
 check(w.update(null)===false&&w.update(4)===false&&w.update({time:NaN,bodies:42}), 'Malformed frame/body containers cannot crash the module');
 const resourceEvents={geometry:0,material:0,texture:0};
 for(const q of ['light','balanced','cinematic']){w.setQuality(q);w.mesh.geometry.addEventListener('dispose',()=>resourceEvents.geometry++);}
 w.material.addEventListener('dispose',()=>resourceEvents.material++);w.uniforms.waterNoise.value.addEventListener('dispose',()=>resourceEvents.texture++);
 w.dispose();w.dispose();check(same(resourceEvents,{geometry:3,material:1,texture:1}),'Disposal frees each owned geometry/material/texture exactly once');
 check(parent.children.length===1&&parent.children[0]===unrelated,'Disposal preserves the parent and unrelated scene objects');
 check(w.update({time:7})===false&&w.sample(0,0)===null&&w.splash(0,0)===false,'Post-disposal methods are harmless and cannot resurrect effects');
 let invalid=false;try{W.create(T,{bedHeight:()=>NaN});}catch(e){invalid=/finite/.test(e.message);}check(invalid,'Invalid authored bed samples fail visibly rather than uploading NaNs');
 const lagoon=W.create(T,{preset:'lagoon',bedHeight:(x,z)=>-.4+Math.sin(z)*.02});
 check(lagoon.mesh.geometry.attributes.bedHeight.array.every(Number.isFinite),'Custom authored bed function generates finite geometry attributes');lagoon.dispose();
 // Actual integrated art, with a small host collaborator instead of an XR session.
 let xr=false;const host={object3D:new T.Scene(),components:{'river-game':{quality:'cinematic',dock:{prefs:{opacity:.23}}}},is:()=>xr};
 const art=RiverArt.build(T,host),s=RiverCore.create('duck-armada',true);s.mode='playing';
 for(let t=0;t<18;t+=.05){RiverCore.advance(s,t);const before=JSON.stringify(s);art.update(s,t,.05,false,false,true);if(before!==JSON.stringify(s))throw Error('Art mutated gameplay');}
 check(art.stats.water.emitted>0,'Integrated river obtains wakes from real core-spawned catapult movement');
 check(art.stats.active<=80&&s.score===0,'Art updates do not award scores or grow the game actor cap');
 xr=true;art.update(s,s.time,0,true,false,true);check(art.stats.water.opacity===.23&&art.stats.water.quality==='balanced','Integrated AR uses the existing saved opacity and stereo quality cap');
 const f=host.object3D.getObjectByName('Currentworks Water / local-space surface');
 for(let i=1;i<=14;i++){RiverCore.advance(s,s.time+.02);art.update(s,s.time,.02,true,false,true);}
 const lastWake=f.material.uniforms.disturbances.value[0];
 check(lastWake.w>0&&s.entities.filter(n=>['boat','catapult','boss'].includes(n.type)).some(n=>{const p=RiverCore.position(s,n,lastWake.z);return Math.abs(lastWake.x*f.scale.x-p[0])<1e-7&&Math.abs(lastWake.y-p[2])<1e-7;}),'AR width scaling keeps the wake origin under the actual source boat');
 const beforeMaterial=f.material,viewA=f.matrixWorld.clone();art.stage.position.set(2.7,-.4,-1.6);art.stage.rotation.y=.8;art.stage.updateMatrixWorld(true);
 check(f.parent.parent===art.stage&&f.matrixWorld.equals(viewA)===false&&f.material===beforeMaterial,'Water follows the existing recentered stage, not a new camera-attached plane');
 art.update(s,s.time,0,true,true,false);check(art.stats.water.quiet&&art.stats.water.liveDisturbances===0,'Integrated quiet mode suppresses the same actual water system');
 art.reset();check(art.stats.water.liveDisturbances===0,'Battle reset clears the module effect history');
 const space=RiverCore.create('mothership',true);art.update(space,0,0,false,false,false);check(!art.stats.water.visible,'Mothership keeps the existing no-river presentation');
 art.dispose();check(art.stats.water.disposed&&host.object3D.children.length===0,'Prism teardown disposes the module with the existing art');
 unrelated.geometry.dispose();unrelated.material.dispose();
 window.waterObjectReport={passed:checks.length,checks,threeRevision:T.REVISION,scope:'Actual Three.js object construction, pure host-state and resource lifecycle checks in Chromium without WebGL. Not rendered gameplay, native XR, or physical hardware.'};
})();
