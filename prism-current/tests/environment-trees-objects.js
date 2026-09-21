/* Real bundled-Three objects. No WebGL context or physical-device claim. */
(()=>{
 const T=AFRAME.THREE,M=SVGNTrees,checks=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 const descriptors=[{id:'one',seed:14,preset:'palm',height:4,position:[6,.3,-6]},{id:'two',seed:19,preset:'willow',height:3,position:[-7,.3,-22]}];
 const before=JSON.stringify(descriptors),f=M.create(T,{trees:descriptors});
 check(f.group.isGroup&&f.stats.trees===2,'Builds actual scene geometry without creating an engine');
 check(f.stats.geometries===12&&f.stats.materials===2&&f.stats.textures===0&&f.stats.renderTargets===0,'All detail geometry is bounded, prebuilt and shares only two materials');
 check(JSON.stringify(descriptors)===before,'Construction does not modify the host descriptors');
 const a=f.describe();a[0].position[0]=99;check(f.describe()[0].position[0]===6,'Returned descriptors cannot mutate the live geometry');
 let good=true,matSet=new Set(),geoSet=new Set(),maxTris=0;
 f.group.traverse(o=>{if(o.isMesh){matSet.add(o.material);geoSet.add(o.geometry);good&&=Number.isFinite(o.geometry.boundingSphere.radius)&&o.geometry.boundingSphere.radius>0;}});
 check(good&&matSet.size===2&&geoSet.size===12,'Real meshes have finite wind-expanded bounds and shared material ownership');
 for(const m of matSet){const s={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(s);check(s.uniforms.cwTime===f.uniforms.cwTime&&s.vertexShader.includes('transformed.xz+=cwDirection'),'Each standard material gets the actual shared wind uniform and displacement');check(s.vertexShader.includes('objectNormal.y-=cwBend().y'),'Normal path is deformed along with tree positions');check(!m.transparent&&m.depthWrite,'Actual leaf/wood geometry avoids transparent sorting layers');}
 for(const time of [0,.2,3,89]){f.update({time});for(let i=0;i<descriptors.length;i++){const sk=M.skeleton(descriptors[i]),expected=M.wind(descriptors[i].height,descriptors[i].height,sk.phase,time,.35).offset/descriptors[i].height;check(Math.abs(f.uniforms.cwAmplitude.value[i]-expected)<1e-7,'Shared wind amplitude matches the original field at '+time+' / '+i);}}
 f.update({time:3,viewer:[0,1.65,0]});const gCount=f.stats.geometries,near=f.stats.lod.slice();check(near[0]===1&&near[1]===1,'Host viewer position selects detail once for both eyes');
 const root=new T.Group();root.add(f.group);root.position.set(2,0,-1);root.rotation.y=.7;root.scale.setScalar(2);root.updateMatrixWorld(true);
 const view=new T.Vector3(0,1.65,0).applyMatrix4(f.group.matrixWorld).toArray();f.update({time:3,viewer:view});check(JSON.stringify(f.stats.lod)===JSON.stringify(near),'Translated rotated scaled parent keeps the same relative detail selection');
 f.update({time:3,quality:'light',viewer:view});check(f.stats.lod[0]===0&&f.stats.geometries===gCount,'Light reduces selected geometry without rebuilding it');
 f.update({time:3,quality:'cinematic',xr:true,viewer:view});check(f.stats.lod[0]===0,'Stereo caps the highest detail while keeping one shared selection');
 const t=f.uniforms.cwTime.value;for(let i=0;i<50;i++)f.update({time:3,viewer:view});check(f.uniforms.cwTime.value===t&&f.stats.geometries===gCount,'Paused host time cannot advance wind or allocate meshes');
 f.update({time:4,quiet:true});check(f.uniforms.cwTime.value===0&&f.uniforms.cwStrength.value===0,'Quiet control stops actual shader wind');
 f.update({time:4,ar:true});check(!f.group.visible&&f.stats.drawCalls===0,'Background foliage is hidden by default in passthrough AR');
 f.update({time:4,ar:false,xr:false,quiet:false});check(f.group.visible&&f.uniforms.cwStrength.value>0,'Leaving AR or quiet mode recovers the same module');
 for(let i=0;i<300;i++){f.update({time:i*.016,viewer:[i%2?0:200,2,0],quality:['light','balanced','cinematic'][i%3]});maxTris=Math.max(maxTris,f.stats.triangles);}check(f.stats.geometries===gCount&&maxTris<15000,'Repeated distance/quality changes remain bounded and allocate no new geometry');
 const unrelated=new T.Group();root.add(unrelated);let freedG=0,freedM=0;for(const g of geoSet)g.addEventListener('dispose',()=>freedG++);for(const m of matSet)m.addEventListener('dispose',()=>freedM++);
 f.reset();check(f.stats.time===0,'Reset returns the decorative host time to zero without touching game data');
 check(f.update(null)===false&&f.update([])===false,'Malformed frames return safely');
 f.dispose();f.dispose();check(freedG===12&&freedM===2,'Disposal frees each owned geometry and material exactly once');check(root.children.length===1&&root.children[0]===unrelated,'Disposal leaves unrelated scene objects intact');check(f.stats.disposed&&f.stats.geometries===0&&f.update({time:99})===false,'Late updates cannot revive a disposed module');
 for(const input of [{trees:Array.from({length:25},(_,i)=>({id:i}))},{trees:[{id:'a'},{id:'a'}]},{trees:[{position:[NaN,0,0]}]}]){let caught=false;try{M.create(T,input)}catch{caught=true}check(caught,'Invalid forest input rejected before GPU resource creation');}
 const empty=M.create(T,{trees:[]});check(empty.stats.trees===0&&empty.stats.triangles===0,'An intentionally empty forest is supported');empty.dispose();
 const ar=M.create(T,{hideInAR:false});ar.update({ar:true});check(ar.group.visible,'Explicit host opt-in can keep trees in an AR scene');ar.dispose();
 const host={object3D:new T.Scene(),camera:new T.PerspectiveCamera(),components:{'river-game':{quality:'balanced',dock:{prefs:{opacity:.23}}}},is:()=>false};host.camera.position.set(0,1.65,0);
 const art=RiverArt.build(T,host),battle=RiverCore.create('duck-armada',true);battle.mode='playing';
 for(let time=0;time<20;time+=.05){RiverCore.advance(battle,time);const before=JSON.stringify(battle);art.update(battle,time,.05,false,false,true);if(JSON.stringify(battle)!==before)throw Error('Trees adapter changed combat');}
 check(art.stats.trees.trees===8&&art.stats.trees.visible&&art.stats.trees.geometries===48,'Actual River art includes only the eight authored bank trees');
 check(battle.score===0&&art.stats.water.emitted>0,'Tree scenery does not create scores or disconnect the working water events');
 art.update(battle,battle.time,0,true,false,false);check(!art.stats.trees.visible&&art.stats.trees.drawCalls===0,'Actual AR art hides opaque scenery, not the interface or water');
 const forest=host.object3D.getObjectByName('Currentworks Trees');art.stage.position.set(2,-.4,1);art.stage.rotation.y=.8;art.stage.updateMatrixWorld(true);check(forest.parent===art.stage,'Trees inherit the existing recentered world frame');
 art.update(battle,battle.time,0,false,true,false);check(art.stats.trees.quiet,'Actual quiet preference freezes the tree animation');
 art.update(RiverCore.create('mothership'),0,0,false,false,false);check(!art.stats.trees.visible,'Actual Mothership chapter does not inherit riverbank trees');
 art.reset();check(art.stats.trees.time===0,'Actual battle reset clears decorative time');art.dispose();check(art.stats.trees.disposed&&host.object3D.children.length===0,'Actual art teardown frees the forest with the existing effects');
 window.treesObjectReport={passed:checks.length,checks,threeRevision:T.REVISION,scope:'Actual Three geometry and materials with controlled host transforms. No native WebGL, real XR or hardware-performance claim.'};
})();
