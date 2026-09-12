import fs from 'node:fs';
import * as T from '../vendor/three.module.js';
import {FBXLoader} from '../vendor/addons/loaders/FBXLoader.js';
import {GLTFExporter} from '../vendor/addons/exporters/GLTFExporter.js';
globalThis.window={URL};
globalThis.FileReader=class {readAsArrayBuffer(b){b.arrayBuffer().then(a=>{this.result=a;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(a=>{this.result=`data:${b.type};base64,${Buffer.from(a).toString('base64')}`;this.onloadend?.();});}};
const load=p=>{const b=fs.readFileSync(new URL('./.crew-input/'+p,import.meta.url));return new FBXLoader().parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const base=load('Model/characterMedium.fbx'),idle=load('Animations/idle.fbx'),run=load('Animations/run.fbx');
const meshes=[];base.traverse(m=>{if(m.isMesh){meshes.push({name:m.name,skin:m.isSkinnedMesh,bones:m.skeleton?.bones.map(b=>b.name),verts:m.geometry.attributes.position.count});m.material=new T.MeshStandardMaterial({color:0xffffff,roughness:.9});}});
const clips=[idle.animations.find(c=>c.name.endsWith('|Idle')),run.animations.find(c=>c.name.endsWith('|Run'))];clips[0].name='Idle';clips[1].name='Run';
clips.forEach(c=>c.optimize());
const mix=new T.AnimationMixer(base);mix.clipAction(clips[0]).play();mix.update(.2);base.updateMatrixWorld(true);console.log('IDLE BOUNDS',new T.Box3().setFromObject(base));mix.stopAllAction();mix.clipAction(clips[1]).play();mix.update(.3);base.updateMatrixWorld(true);console.log('RUN BOUNDS',new T.Box3().setFromObject(base));mix.stopAllAction();base.updateMatrixWorld(true);
const inspection={meshes,bounds:new T.Box3().setFromObject(base),idle:clips[0].duration,run:clips[1].duration,tracks:clips.map(c=>c.tracks.map(t=>t.name))};

const bytes=await new GLTFExporter().parseAsync(base,{binary:true,animations:clips});
fs.mkdirSync(new URL('../assets/crew/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../assets/crew/ranger.glb',import.meta.url),Buffer.from(bytes));
console.log('Exported',bytes.byteLength,JSON.stringify(inspection));
