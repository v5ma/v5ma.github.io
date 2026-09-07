// Dependencies are installed only in the isolated import job, not in the game.
import {createRequire} from 'node:module';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const require=createRequire('/tmp/rainward-art-tools/package.json');
const {NodeIO}=require('@gltf-transform/core');const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {dedup,prune,weld,simplify,textureCompress}=require('@gltf-transform/functions');
const {MeshoptSimplifier}=require('meshoptimizer');const sharp=require('sharp');
await MeshoptSimplifier.ready;
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),out=path.join(root,'assets/scanned');
const m=JSON.parse(fs.readFileSync(path.join(out,'import-plan.json')));const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
for(const [id,def]of Object.entries(m.models)){
 const doc=await io.read(def.input);
 const count=()=>doc.getRoot().listMeshes().reduce((n,mesh)=>n+mesh.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
 const before=count();
 await doc.transform(dedup(),weld());
 if(id!=='fern_02')await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:id==='boulder_01'?.09:.35,error:.006}));
 await doc.transform(prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:93}));
 // Do not drop UVs, normal textures, alpha cutouts or material texture bindings.
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(!p.getAttribute('TEXCOORD_0'))throw Error('Lost authored UVs');
 await io.write(path.join(out,def.path),doc);
 def.triangles=count();def.beforeTriangles=before;def.meshes=doc.getRoot().listMeshes().map(mesh=>({name:mesh.getName(),triangles:mesh.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0)}));
 def.textureCount=doc.getRoot().listTextures().length;delete def.input;
 console.log(id,before,'->',def.triangles,'triangles');
}
m.tools={'gltf-transform':'4.2.1','meshoptimizer':'0.23.0','sharp':'0.34.3','Pillow':'11.3.0','Three.js':'r177'};
m.transformations=['Source glTF UVs, materials, normal textures and alpha cutouts retained.','Rock meshes simplified with meshoptimizer (bounded error); fern geometry retained.','Surface color 2048px WebP; normal 1024px lossless WebP; packed AO/roughness/metalness 512px lossless WebP.','Model textures resized to at most 1024px and WebP encoded.','Real 1k HDR capture retained as HDR; no screenshot backdrop.'];
m.files={};let bytes=0;
const visit=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())visit(p);else if(/\.(webp|glb|hdr)$/.test(e.name)){const buf=fs.readFileSync(p),rel=path.relative(out,p);bytes+=buf.length;m.files[rel]={bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')};}}};visit(out);
if(bytes>14000000)throw Error('Asset pack exceeds 14 MB budget');m.totalBytes=bytes;
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(m,null,2)+'\n');fs.unlinkSync(path.join(out,'import-plan.json'));
console.log('SHIPPED ASSETS:',bytes,'bytes');
