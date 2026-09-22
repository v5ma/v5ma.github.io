/* Actual bundled-Three construction and lifecycle checks; no headset claim. */
(()=>{'use strict';
 const T=AFRAME.THREE,checks=[],check=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const style=SVGNToon.create(T,{bands:[.25,.55,.8,1]}),own=style.material({color:0xeef7ff,vertexColors:true});
 check(own.isMeshToonMaterial&&own.gradientMap===style.gradient,'Factory creates a real MeshToonMaterial with its own shared ramp');
 check(style.gradient.minFilter===T.NearestFilter&&style.gradient.magFilter===T.NearestFilter&&!style.gradient.generateMipmaps&&style.gradient.colorSpace===T.NoColorSpace,'Discrete light ramp has the official non-color nearest-filtered texture settings');
 let textureFree=0,materialFree=0;style.gradient.addEventListener('dispose',()=>textureFree++);own.addEventListener('dispose',()=>materialFree++);
 const external=new T.MeshBasicMaterial();let externalFree=0;external.addEventListener('dispose',()=>externalFree++);
 check(!style.release(external)&&externalFree===0,'Style release never disposes an unrelated material');
 const input=Object.freeze({id:'cumulus',seed:33,position:Object.freeze([-3,2,-5]),radius:.6});
 const clouds=SVGNCloudlets.create(T,{clouds:[input,{id:'other',position:[4,2,-6]}],material:own});
 const host=new T.Scene(),sibling=new T.Group();host.add(sibling,clouds.group);
 check(clouds.stats.clouds===2&&clouds.stats.geometryCount===6,'Cloudlets constructs three prebuilt detail meshes per cloud');
 check(clouds.group.children.every(m=>m.isMesh&&m.material===own),'Cloudlets borrows one caller-supplied material without cloning it');
 let buffers=[];for(const q of ['cinematic','balanced','light']){clouds.update({time:0,quality:q,viewer:[0,1.6,0]});buffers.push(clouds.group.children[0].geometry);}
 check(new Set(buffers).size===3,'Detail choices use actual distinct prebuilt buffers');
 for(const q of ['light','balanced','cinematic'])clouds.update({time:1,quality:q,viewer:[0,1.6,0]});
 check(buffers[0]===clouds.group.children[0].geometry&&clouds.stats.geometryCount===6,'Returning to a detail level reuses its original geometry');
 check(clouds.group.children.every(m=>m.material.transparent===false&&m.material.depthWrite),'Default borrowing example is bounded opaque geometry, not full-frame fog');
 for(const g of buffers){
  const p=g.attributes.position,n=g.attributes.normal;let finite=true,unit=true;
  for(let i=0;i<p.count;i++){finite&&=Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i));unit&&=Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<1e-5;}
  check(finite&&unit,'Generated positions and normals are finite and normalized for each detail level');
 }
 clouds.update({time:4,xr:true,quality:'cinematic',viewer:[0,1.6,0]});
 check(clouds.stats.levels.every(i=>i===2),'XR applies the same conservative detail choice to both eyes');
 const before=clouds.group.children.map(m=>m.position.toArray());clouds.update({time:4,xr:true,viewer:[0,1.6,0]});
 check(JSON.stringify(before)===JSON.stringify(clouds.group.children.map(m=>m.position.toArray())),'Repeating paused host time freezes all cloud positions');
 clouds.update({time:8,quiet:true});check(clouds.group.children[0].position.toArray().join(',')===input.position.join(','),'Quiet returns clouds to authored local positions');
 const copy=clouds.describe();copy[0].position[0]=999;check(clouds.describe()[0].position[0]===-3,'Description cannot mutate placement or input descriptors');
 clouds.group.position.set(3,0,2);clouds.group.rotation.y=.6;clouds.group.scale.set(1.5,1,2);host.updateMatrixWorld(true);
 const center=clouds.group.children[0].getWorldPosition(new T.Vector3());clouds.update({time:8,quiet:true,viewer:center.toArray()});
 check(!clouds.group.children[0].visible,'World-space viewer near a transformed cloud hides that scenery, not the camera or gameplay');
 clouds.update({time:8,viewer:[50,1.6,50]});check(clouds.group.children[0].visible,'Leaving the near-viewer margin restores the anchored cloud');
 const matrix=clouds.group.matrixWorld.clone();clouds.update({time:8,viewer:[52,2,50]});clouds.group.updateWorldMatrix(true,false);
 check(clouds.group.matrixWorld.equals(matrix),'Changing viewer observations never moves or turns the placed cloud group');
 clouds.update({visible:false});check(!clouds.group.visible&&clouds.stats.visibleClouds===0,'Explicit visibility hides the effect only');
 const snapshot=JSON.stringify(clouds.stats);check(!clouds.update({viewer:[NaN,0,0]})&&snapshot===JSON.stringify(clouds.stats),'Invalid viewer data cannot corrupt prior state');
 let geometryFree=0;const all=new Set();
 clouds.group.position.set(0,0,0);clouds.group.rotation.set(0,0,0);clouds.group.scale.setScalar(1);
 for(const q of ['cinematic','balanced','light']){clouds.update({xr:false,quality:q,viewer:[0,1.6,0],visible:true});for(const m of clouds.group.children)all.add(m.geometry);}
 for(const g of all)g.addEventListener('dispose',()=>geometryFree++);
 clouds.dispose();clouds.dispose();check(geometryFree===6&&host.children.length===1&&host.children[0]===sibling,'Disposal frees every cloud geometry once and preserves other scene content');
 check(materialFree===0&&textureFree===0,'Cloud disposal does not own or destroy the borrowed toon material');
 check(!clouds.update({time:20})&&clouds.stats.disposed,'Disposed cloudlets cannot resurrect');
 style.dispose();style.dispose();check(materialFree===1&&textureFree===1,'Toon factory disposes its material and shared gradient once');
 let thrown=false;try{style.material({});}catch{thrown=true;}check(thrown,'Disposed style factory rejects new allocations');
 const ownedClouds=SVGNCloudlets.create(T,{clouds:[{id:'own',position:[2,2,-5]}]});let ownFree=0;
 ownedClouds.group.children[0].material.addEventListener('dispose',()=>ownFree++);ownedClouds.dispose();ownedClouds.dispose();
 check(ownFree===1,'Cloudlets frees its internally created default material once');
 const capped=SVGNToon.create(T);for(let i=0;i<64;i++)capped.material({});let full=false;try{capped.material({});}catch{full=true;}
 check(full&&capped.stats.materials===64,'Style factory prevents unbounded material allocation');capped.dispose();external.dispose();
 window.arLibraryReport={passed:checks.length,checks,threeRevision:T.REVISION,scope:'Actual bundled-Three resource, data, and lifecycle checks. Not a GPU drawing, headset, live-game integration, or frame-rate measurement.'};
})();
