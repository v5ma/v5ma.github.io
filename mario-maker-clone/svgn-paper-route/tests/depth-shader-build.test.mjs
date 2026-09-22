// Actual pinned GLSL node builder, with an uninitialized renderer and only the
// browser image type represented. This checks generated code, not GPU execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.webgpu.js';
import {createDepthWarp} from '../depth-path.mjs';
function mixArguments(shader){
 const calls=[];
 for(const match of shader.matchAll(/\bmix\( /g)){
  let level=1,from=match.index+5,args=[];
  for(let i=from;i<shader.length;i++){
   if(shader[i]==='(')level++;
   if(shader[i]===')')level--;
   if((shader[i]===','&&level===1)||level===0){args.push(shader.slice(from,i).trim());from=i+1;}
   if(!level){calls.push(args);break;}
  }
 }
 return calls;
}
for(const kind of ['node','classic-instance'])test('Generated '+kind+' shader uses interpolation factor last, matching the CPU distance table',()=>{
 const prior=globalThis.ImageBitmap;globalThis.ImageBitmap=class{};
 try{
  const renderer=new T.WebGPURenderer({canvas:{width:32,height:32},forceWebGL:true});
  const scene=new T.Scene(),geometry=new T.BoxGeometry(),material=kind==='node'?new T.MeshBasicNodeMaterial():new T.MeshBasicMaterial();
  const object=kind==='node'?new T.Mesh(geometry,material):new T.InstancedMesh(geometry,material,1);scene.add(object);
  const warp=createDepthWarp(scene);warp.update(true);
  const builder=renderer.backend.createNodeBuilder(object,renderer);builder.scene=scene;builder.camera=new T.PerspectiveCamera();builder.build();
  const calls=mixArguments(builder.vertexShader);assert(calls.length>=2);
  const table=calls.filter(args=>/^nodeVar\d+$/.test(args[0]));
  assert(table.length>0);for(const args of table){assert.equal(args.length,3);assert.match(args[1],/^nodeVar\d+$/);assert.match(args[2],/^fract\( nodeVar\d+ \)$/);}
  const actor=calls.filter(args=>!table.includes(args));assert(actor.length>0);
  for(const args of actor)assert.match(args[2],/^v_nodeUniform\d+\.z$/);
  assert(builder.vertexShader.includes('texelFetch('));
  if(kind==='classic-instance'){
   const code=builder.vertexShader;
   const placed=code.indexOf('gl_InstanceID');
   assert(placed>=0&&placed<code.indexOf('texelFetch('),'Instance placement must feed the curve lookup, not follow it only');
   assert(code.includes('cross(')&&code.includes('1e-8'),'The result must return through a bounded inverse instance frame before native placement');
   assert(code.lastIndexOf('positionLocal =')>code.indexOf('texelFetch('),'Native instance placement remains intact after compensation');
  }
  warp.dispose();geometry.dispose();material.dispose();
 }finally{if(prior===undefined)delete globalThis.ImageBitmap;else globalThis.ImageBitmap=prior;}
});
