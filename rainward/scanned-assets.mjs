/* Self-hosted CC0 assets. Cache compressed bytes, not GPU objects, across scene
 * changes. Async results have an ownership boundary and a bounded timeout. */
import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {RGBELoader} from './vendor/RGBELoader.js';
import {worldTexturing} from './surface-work.mjs';
import {fernPlacements,planterRockPlacements,scanStatus,MODEL_IDS,SCAN_KEYS} from './scan-plan.mjs';
const byteCache=new Map(),MAX_FILE_BYTES=6500000;
function bytes(relative){
 if(!/^(manifest\.json|daylight\.hdr|[a-z0-9_]+\.glb|(stone|brick|paving|ground)\/(color|normal|orm)\.webp)$/.test(relative))return Promise.reject(Error('Unknown asset path'));
 if(!byteCache.has(relative)){
  const url=new URL('./assets/scanned/'+relative,import.meta.url),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  const promise=fetch(url,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Asset HTTP '+r.status);const b=await r.arrayBuffer();if(b.byteLength>MAX_FILE_BYTES)throw Error('Asset size budget exceeded');return b;}).finally(()=>clearTimeout(timer));
  byteCache.set(relative,promise);promise.catch(()=>byteCache.delete(relative));
 }return byteCache.get(relative);
}
const disposeModel=root=>{const gs=new Set(),ms=new Set(),ts=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){ms.add(m);for(const t of Object.values(m))if(t?.isTexture)ts.add(t);}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>{t.dispose();t.image?.close?.();});};
const fields=['map','normalMap','bumpMap','roughnessMap','metalnessMap','aoMap','roughness','metalness','bumpScale','aoMapIntensity'];
export function createScannedAssets(scene,renderer,chapter,{heightAt,onEnvironment=()=>{}}){
 let disposed=false,enabled=true,started=false,environment=null;const bindings=[],surfaces=new Map(),roots=[],textures=new Set(),bitmaps=new Set(),clonedGeometries=new Set(),groups=[],replacements=[];
 const originalEnvironment=scene.environment,originalBackground=scene.background,originalIntensity=scene.environmentIntensity;
 const status={enabled:true,pending:true,total:8,done:0,errors:[],surfaces:0,modelVariants:0,instances:0,texturedMeshes:0};
 function report(){return {...status,errors:[...status.errors],message:scanStatus(status)};}
 function apply(binding){const m=binding.material,source=surfaces.get(binding.key);if(!source)return;
  if(enabled){m.map=source.color;m.normalMap=source.normal;m.bumpMap=null;m.roughnessMap=m.aoMap=m.metalnessMap=source.orm;m.roughness=1;m.metalness=0;m.aoMapIntensity=.72;m.normalScale.set(.85,.85);m.color.setRGB(.88,.88,.88);m.userData.scannedAsset=source.asset;}
  else{for(const k of fields)m[k]=binding.old[k];m.color.copy(binding.color);m.normalScale.copy(binding.normalScale);delete m.userData.scannedAsset;}
  m.needsUpdate=true;
 }
 function bind(material,key){if(!SCAN_KEYS.includes(key))return;const binding={material,key,old:Object.fromEntries(fields.map(k=>[k,material[k]])),color:material.color.clone(),normalScale:material.normalScale.clone()};bindings.push(binding);if(surfaces.has(key))apply(binding);}
 async function image(relative,color){const buffer=await bytes(relative),bitmap=await createImageBitmap(new Blob([buffer],{type:'image/webp'}),{imageOrientation:'flipY',premultiplyAlpha:'none'});if(disposed){bitmap.close();throw Error('Scene disposed');}
  const t=new T.Texture(bitmap);t.flipY=false;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());t.needsUpdate=true;textures.add(t);bitmaps.add(bitmap);return t;
 }
 async function surface(key,def){const maps=await Promise.all([image(def.color.path,true),image(def.normal.path,false),image(def.orm.path,false)]);if(disposed)return;surfaces.set(key,{color:maps[0],normal:maps[1],orm:maps[2],asset:def.asset});bindings.filter(b=>b.key===key).forEach(apply);status.surfaces++;}
 function variants(root){root.updateMatrixWorld(true);const result=[];root.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone();clonedGeometries.add(geometry);geometry.computeBoundingBox();const box=geometry.boundingBox,center=new T.Vector3();box.getCenter(center);geometry.translate(-center.x,-box.min.y,-center.z);geometry.computeBoundingBox();const size=new T.Vector3();geometry.boundingBox.getSize(size);result.push({geometry,material:o.material,size,name:o.name});});return result;}
 function instances(variant,placements,label,normalize=false){if(!placements.length)return null;const mesh=new T.InstancedMesh(variant.geometry,variant.material,placements.length);mesh.name=label;mesh.userData.scannedVisual=true;mesh.userData.authoredUV=true;mesh.castShadow=!['Scanned fern clumps','Scanned edge boulder','Scanned canyon rock'].includes(label);mesh.receiveShadow=true;
  const temp=new T.Object3D();for(const [i,p]of placements.entries()){temp.position.set(p.x,p.y??heightAt(p.x,p.z),p.z);temp.rotation.set(0,p.yaw||0,0);const s=p.scale||1;if(p.axes)temp.scale.set(p.axes.x/variant.size.x,p.axes.y/variant.size.y,p.axes.z/variant.size.z);else temp.scale.setScalar(s*(normalize?1/Math.max(variant.size.x,variant.size.z):1));temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.visible=enabled;scene.add(mesh);groups.push(mesh);status.instances+=placements.length;status.texturedMeshes++;return mesh;
 }
 async function model(id){const data=await bytes(id+'.glb'),root=(await new GLTFLoader().parseAsync(data.slice(0),'' )).scene;if(disposed){disposeModel(root);return;}roots.push(root);const choices=variants(root);status.modelVariants+=choices.length;
  for(const v of choices){if(!v.geometry.getAttribute('uv')||!v.material.map)throw Error('Model lost authored UVs or texture');v.material.envMapIntensity=.65;v.material.needsUpdate=true;}
  if(id==='fern_02'){const poses=fernPlacements(chapter);for(let i=0;i<choices.length;i++)instances(choices[i],poses.filter(p=>p.variant===i),'Scanned fern clumps');}
  if(id==='rock_moss_set_01'){
   const poses=planterRockPlacements(chapter);for(let i=0;i<choices.length;i++)instances(choices[i],poses.filter(p=>p.variant===i),'Scanned mossy planter stone',true);
   const backdrops=[];scene.traverse(o=>{if(o.userData.scanBackdrop)backdrops.push(o);});
   for(const backdrop of backdrops){const batches=choices.map(()=>[]),matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();for(let i=0;i<backdrop.count;i++){backdrop.getMatrixAt(i,matrix);matrix.decompose(p,q,s);batches[i%choices.length].push({x:p.x,y:p.y-s.y,z:p.z,yaw:i*1.4,axes:{x:s.x*2,y:s.y*2,z:s.z*2}});}batches.forEach((p,i)=>instances(choices[i],p,'Scanned canyon rock'));replacements.push(backdrop);backdrop.visible=!enabled;}
  }
  if(id==='boulder_01'&&choices.length){const bounds=chapter.bounds,span=Math.min(6,(bounds.x1-bounds.x0)*.05);instances(choices[0],[{x:bounds.x0-4,y:heightAt(bounds.x0,chapter.start.z)-.3,z:chapter.start.z-13,scale:span,yaw:.8},{x:bounds.x1+4,y:heightAt(bounds.x1,-22)-.3,z:-22,scale:span,yaw:2.4}],'Scanned edge boulder',true);}
 }
 async function sky(){const data=await bytes('daylight.hdr');if(disposed)return;const parsed=new RGBELoader().parse(data.slice(0)),t=new T.DataTexture(parsed.data,parsed.width,parsed.height,T.RGBAFormat,parsed.type);t.colorSpace=T.LinearSRGBColorSpace;t.mapping=T.EquirectangularReflectionMapping;t.flipY=true;t.minFilter=t.magFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;const pm=new T.PMREMGenerator(renderer),env=pm.fromEquirectangular(t);pm.dispose();textures.add(t);environment={texture:t,target:env};if(enabled){scene.background=t;scene.environmentIntensity=.45;onEnvironment(env.texture);}}
 async function task(name,work){try{await work();}catch(e){if(!disposed)status.errors.push(name+': '+String(e.message||e));}finally{if(!disposed)status.done++;}}
 function start(){if(started)return;started=true;void (async()=>{let manifest;try{manifest=JSON.parse(new TextDecoder().decode(await bytes('manifest.json')));if(manifest.license!=='CC0-1.0')throw Error('Asset manifest license mismatch');}catch(e){if(!disposed){status.errors.push(String(e.message));status.pending=false;}return;}
  await Promise.all([...SCAN_KEYS.map(k=>task(k,()=>surface(k,manifest.surfaces[k]))),...MODEL_IDS.map(id=>task(id,()=>model(id))),task('environment',sky)]);if(!disposed)status.pending=false;
 })();}
 function set(value){enabled=!!value;status.enabled=enabled;bindings.forEach(apply);groups.forEach(m=>m.visible=enabled);replacements.forEach(m=>m.visible=!enabled);if(environment){scene.background=enabled?environment.texture:originalBackground;scene.environmentIntensity=enabled?.45:originalIntensity;onEnvironment(enabled?environment.target.texture:originalEnvironment);}}
 function dispose(){disposed=true;roots.forEach(disposeModel);for(const m of groups){scene.remove(m);m.geometry.dispose();}clonedGeometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());bitmaps.forEach(b=>b.close());environment?.target.dispose();bindings.length=0;groups.length=0;}
 return {bind,start,set,report,dispose};
}
