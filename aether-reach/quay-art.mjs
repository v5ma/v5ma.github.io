/* Real CC0 artwork on the existing map, not a replacement level or backdrop.
 * Network requests are same-origin static assets. No player/save writes.
 * Geometry and material assets are shared/instanced; low profile has separate
 * lower-detail model and texture files. Missing art leaves the old view usable. */
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {RGBELoader} from './vendor/loaders/RGBELoader.js';
import {QUAY_BUILDINGS,QUAY_LAMPS,QUAY_PLANTERS,facadePlan} from './quay-layout.mjs';
export function installQuayArt({scene,renderer,quality,sky,hemi,sun,decks,fallbacks}){
 const profile=quality==='low'||/OculusBrowser|Quest/i.test(navigator.userAgent)?'mobile':'desktop',state={revision:'quay-art-1',profile,loaded:[],errors:[],settled:false,models:0,instances:0};
 const loader=new GLTFLoader(),textures=new T.TextureLoader(),root=new T.Group();root.name='Arrival Quay finished-art pass';scene.add(root);
 const materials=new Map();
 const url=file=>'./art/'+file;
 const mat=(color,metalness=0,roughness=.85)=>{const key=[color,metalness,roughness].join('|');if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return materials.get(key);};
 const boxGeo=new T.BoxGeometry(1,1,1);
 function box(parent,x,y,z,w,h,d,material){const mesh=new T.Mesh(boxGeo,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 const loaded=(label)=>state.loaded.push(label);
 const attempt=async(label,fn)=>{try{await fn();loaded(label);}catch(e){state.errors.push(label+': '+String(e.message||e).slice(0,140));console.warn('Quay artwork fallback:',label,e);}};
 function batch(group){group.updateMatrixWorld(true);const batches=new Map();group.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+':'+o.material.uuid;let entry=batches.get(key);if(!entry){entry={geometry:o.geometry,material:o.material,matrices:[],shadow:o.castShadow};batches.set(key,entry);}entry.matrices.push(o.matrixWorld.clone());});
  const output=new T.Group();output.name=group.name;for(const b of batches.values()){
   const m=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((value,i)=>m.setMatrixAt(i,value));m.castShadow=b.shadow;m.receiveShadow=true;m.computeBoundingSphere();output.add(m);state.instances+=b.matrices.length;
  }root.add(output);return output;
 }
 function prepare(gltf,kind){gltf.scene.traverse(o=>{if(!o.isMesh)return;state.models++;o.castShadow=o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m.envMapIntensity=.6;if(/FakeInterior/i.test(m.name)){m.color.set('#29363a');m.emissive?.set('#a55f20');m.emissiveIntensity=.32;m.roughness=1;}if(/Glass/i.test(m.name)){m.color.set('#84aaac');m.metalness=.28;m.roughness=.15;m.opacity=.5;m.depthWrite=false;}
   for(const field of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(m[field])m[field].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  }});return gltf.scene;
 }
 const jobs=[];
 jobs.push(attempt('modular architecture',async()=>{
  const library=prepare(await loader.loadAsync(url('architecture-'+profile+'.glb')),'architecture');
  const templates=new Map(library.children.map(o=>[o.name,o]));
  function piece(group,name,x,y,z,sx=1,sy=1,sz=1,yaw=0){const original=templates.get(name);if(!original)throw Error('Missing architecture module: '+name);const copy=original.clone(true);copy.position.set(x,y,z);copy.scale.set(sx,sy,sz);copy.rotation.y=yaw;group.add(copy);return copy;}
  const group=new T.Group();group.name='Licensed modular Quay facades';
  for(const b of QUAY_BUILDINGS){
   // The opaque core is behind the module faces; the existing game still owns
   // the unchanged solid footprint. These doors are closed, not fake new rooms.
   box(group,b.x,4.4,b.z,b.w-.58,8.8,b.d-.58,mat(b.theme==='brick'?'#815b44':'#d7ccb3'));
   for(const slot of facadePlan(b)){
    piece(group,slot.module,slot.x,slot.y,slot.z,slot.sx,1,1,slot.yaw);
    if(slot.door){const door=piece(group,'Door_1',slot.x,0,slot.z,.95,1,1,slot.yaw);door.translateX(.48);}
   }
   // Four full-width molded cornices and slate roof strips with actual dormers.
   for(const face of ['north','east','south','west']){
    const horizontal=face==='north'||face==='south',width=horizontal?b.w:b.d,n=Math.round(width/2),span=width/n,yaw={north:0,east:-Math.PI/2,south:Math.PI,west:Math.PI/2}[face];
    for(let i=0;i<n;i++){
     const along=-width/2+span*(i+.5),x=horizontal?b.x+along:b.x+(face==='east'?b.w/2:-b.w/2),z=horizontal?b.z+(face==='north'?-b.d/2:b.d/2):b.z+along;
     const nx=-Math.sin(yaw),nz=-Math.cos(yaw);
     piece(group,'Cornice_Trim_Center',x-nx*.42,9,z-nz*.42,span/2,.7,1,yaw);
     // Roof assets extend -2 m forward; place their origin 2 m inside the facade.
     piece(group,i%2?'Roof_SlateCornice_Center':'Roof_Slate_Window_1',x-nx*2.02,9.7,z-nz*2.02,span/2,1,1,yaw);
    }
   }
   box(group,b.x,12.6,b.z,Math.max(.5,b.w-4),.18,Math.max(.5,b.d-4),mat('#506967',.45,.6));
   // Chimneys and copper flashing complete the silhouette.
   for(const dx of [-b.w*.25,b.w*.25]){box(group,b.x+dx,13.15,b.z+.1,.5,1.2,.55,mat('#ad8a65'));box(group,b.x+dx,13.83,b.z+.1,.7,.16,.74,mat('#3d514f',.45));}
  }
  batch(group);fallbacks.buildings.visible=false;
 }));
 jobs.push(attempt('photographed paving',async()=>{
  const [color,normal,arm]=await Promise.all(['diff','nor_gl','arm'].map(c=>textures.loadAsync(url('pavement_03-'+c+'-'+profile+'.webp'))));
  color.colorSpace=T.SRGBColorSpace;for(const t of[color,normal,arm]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(17,17);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  const m=new T.MeshStandardMaterial({map:color,normalMap:normal,normalScale:new T.Vector2(.6,.6),roughnessMap:arm,aoMap:arm,aoMapIntensity:.55,roughness:.93,metalness:0,color:'#e9debf'});decks[0].material=m;
  // Thin flush inlays mark the existing unobstructed north/south pedestrian way.
  const stripe=mat('#e8d9b4',.1,.82);for(const x of[-2.7,2.7])box(root,x,.018,0,.11,.02,33,stripe);
 }));
 jobs.push(attempt('cut stone materials',async()=>{
  const [color,normal,rough]=await Promise.all(['diff','nor_gl','rough'].map(c=>textures.loadAsync(url('sandstone_blocks_04-'+c+'-'+profile+'.webp'))));color.colorSpace=T.SRGBColorSpace;
  for(const t of[color,normal,rough]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,1);t.anisotropy=4;}
  const stone=new T.MeshStandardMaterial({map:color,normalMap:normal,normalScale:new T.Vector2(.35,.35),roughnessMap:rough,color:'#e3d1aa'});
  // Foundation band remains entirely below the unchanged walk surface.
  box(root,0,-1.95,0,33.7,1.15,33.7,stone);
 }));
 jobs.push(attempt('cast-iron lamp models',async()=>{
  const model=prepare(await loader.loadAsync(url('lamp-'+profile+'.glb')),'lamp'),group=new T.Group();group.name='Poly Haven ornate lamps';
  for(const [x,y,z] of QUAY_LAMPS){const copy=model.clone(true);copy.position.set(x,y,z);group.add(copy);}batch(group);fallbacks.lamps.visible=false;
 }));
 jobs.push(attempt('modeled foliage',async()=>{
  const model=prepare(await loader.loadAsync(url('planter-'+profile+'.glb')),'planter'),group=new T.Group();group.name='Poly Haven terracotta foliage';
  for(const [x,y,z,scale]of QUAY_PLANTERS){const copy=model.clone(true);copy.position.set(x,y+.02,z);copy.scale.setScalar(scale);copy.rotation.y=x*.2;group.add(copy);}batch(group);fallbacks.foliage.visible=false;
 }));
 jobs.push(attempt('HDR lighting and sky',async()=>{
  const hdr=await new RGBELoader().loadAsync(url('sky.hdr'));hdr.mapping=T.EquirectangularReflectionMapping;
  const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();const env=pmrem.fromEquirectangular(hdr);scene.environment=env.texture;scene.environmentIntensity=.55;scene.background=hdr;scene.backgroundIntensity=.8;scene.backgroundRotation.set(0,1.5,0);scene.environmentRotation.set(0,1.5,0);sky.visible=false;pmrem.dispose();
  hemi.intensity=.85;sun.intensity=2.4;renderer.toneMappingExposure=1.04;scene.fog.color.set('#c6dbe4');
 }));
 // Individual asset failures keep their corresponding original mesh.
 const ready=Promise.all(jobs).then(()=>{state.settled=true;});
 return {ready,stats:()=>({...state,loaded:[...state.loaded],errors:[...state.errors]})};
}
