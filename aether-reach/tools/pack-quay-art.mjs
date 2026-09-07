/* Build-time artwork conversion. Pinned inputs are fetched separately;
 * the published game never calls an asset API. glTF Transform 4.2.1. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Document,NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments,weld,simplify,dedup,prune,textureCompress,getBounds} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
const [source,out]=process.argv.slice(2);if(!source||!out)throw Error('Usage: pack-quay-art.mjs <prepared input> <output art directory>');
fs.mkdirSync(out,{recursive:true});await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const names=['Trim_FirstFloor_Window_001','Trim_Window','DoorFrame_Trim','Door_1','Brick_Window_CurvedDouble','Brick_Window_Square_Single','Brick_Plain_3','Cornice_Trim_Center','Roof_SlateCornice_Center','Roof_Slate_Window_1','Roof_Slate_Center','Roof_Slate_Corner','Prop_Bollard'];
const count=d=>d.getRoot().listMeshes().reduce((s,m)=>s+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
const report=[];
for(const profile of ['desktop','mobile']){
 const lib=new Document(),scene=lib.createScene('Quay CC0 architectural library');
 for(const name of names){
  const file=path.join(source,'downtown/Exports/glTF (Godot)',name+'.gltf'),d=await io.read(file);
  const map=mergeDocuments(lib,d),container=lib.createNode(name);
  for(const src of d.getRoot().listScenes()){
   const copied=map.get(src);for(const node of [...copied.listChildren()]){copied.removeChild(node);container.addChild(node);}copied.dispose();
  }
  scene.addChild(container);
 }
 await lib.transform(dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:profile==='desktop'?[1024,1024]:[512,512],quality:88}));
 const name='architecture-'+profile+'.glb';await io.write(path.join(out,name),lib);
 report.push({file:name,source:'Quaternius Downtown City MegaKit Standard',templates:names,triangles:count(lib),textures:lib.getRoot().listTextures().length});
 for(const id of ['street_lamp_01','potted_plant_01']){
  const input=path.join(source,id+'-'+profile+'.glb'),d=await io.read(input),original=count(d);
  if(id==='potted_plant_01'){
   for(const node of d.getRoot().listNodes())if(/pebbles/i.test(node.getName()))node.dispose();
   await d.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:profile==='desktop'?.5:.38,error:.009}),dedup(),prune());
  }
  const file=(id==='street_lamp_01'?'lamp':'planter')+'-'+profile+'.glb';await io.write(path.join(out,file),d);
  report.push({file,source:id,trianglesBefore:original,triangles:count(d),bounds:getBounds(d.getRoot().listScenes()[0])});
 }
 for(const base of ['pavement_03-diff','pavement_03-nor_gl','pavement_03-arm','sandstone_blocks_04-diff','sandstone_blocks_04-nor_gl','sandstone_blocks_04-rough']){
  const file=base+'-'+profile+'.webp';await sharp(path.join(source,base+'.webp')).resize(profile==='desktop'?1024:512,profile==='desktop'?1024:512,{fit:'inside',withoutEnlargement:true}).webp({quality:88}).toFile(path.join(out,file));
 }
}
fs.copyFileSync(path.join(source,'sky.hdr'),path.join(out,'sky.hdr'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=fs.readdirSync(out).filter(n=>/\.(glb|webp|hdr)$/.test(n)).map(file=>({file,bytes:fs.statSync(path.join(out,file)).size,sha256:hash(path.join(out,file))}));
const sources=[
 {id:'quaternius-downtown-standard',creator:'Quaternius',url:'https://quaternius.itch.io/downtown-city-megakit',license:'CC0-1.0',edition:'Standard, free',archiveSha256:'5b1a945576d54cdbb4ccc9c3d52711e6d530da74c74c586407ecc28b165335da',modifications:'13 selected modules merged; textures resized and converted to WebP. No paid shaders or engine projects used.'},
 ...['street_lamp_01','potted_plant_01','pavement_03','sandstone_blocks_04','kloofendal_48d_partly_cloudy'].map(id=>{const meta=JSON.parse(fs.readFileSync(path.join(source,id+'-metadata.json'),'utf8'));return {id,creator:Object.keys(meta.info.authors).join(', '),url:'https://polyhaven.com/a/'+id,license:'CC0-1.0',licenseUrl:'https://polyhaven.com/license',modifications:'Selected 1K download; browser-size texture variants. Model simplification and removal of hidden pot pebbles where applicable.'};})
];
const manifest={version:1,revision:'quay-art-1',sources,models:report,files,totalBytes:files.reduce((n,f)=>n+f.bytes,0),scope:'Only runtime art payload. Source-reference renders, creator logos, paid assets and private narrative are excluded.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({bytes:manifest.totalBytes,models:report},null,2));
