'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(supported=true){
 let now=0,deleted=0,active=null,calls=0,disjoint=false;const qs=[];
 const ext={TIME_ELAPSED_EXT:7,GPU_DISJOINT_EXT:8};
 const gl={drawingBufferWidth:240,drawingBufferHeight:160,CURRENT_QUERY:1,QUERY_RESULT_AVAILABLE:2,QUERY_RESULT:3,
  getExtension:n=>n==='EXT_disjoint_timer_query_webgl2'&&supported?ext:null,getQuery:()=>active,getParameter:()=>disjoint,
  createQuery(){const q={ready:false};qs.push(q);return q;},beginQuery(t,q){A.equal(active,null);active=q;},endQuery(){active=null;},deleteQuery(){deleted++;},
  getQueryParameter(q,key){return key===2?q.ready:12e6;},finish(){now+=2;}
 };
 const water={visible:true},scenery={visible:true},object3D={getObjectByName:n=>n.startsWith('Currentworks Water')?water:scenery};
 const scene={object3D,camera:{},renderer:{getContext:()=>gl,info:{render:{calls:10,triangles:100}},render(){calls++;now+=3;}}};
 const state={phase:'paused',time:7,result:{health:92,score:80}};
 const context={River:{snapshot:()=>structuredClone(state)},performance:{now:()=>++now}};vm.createContext(context);
 vm.runInContext(fs.readFileSync(__dirname+'/render-completion-probe.js','utf8'),context);
 return {api:context.RenderCompletionProbe,scene,water,scenery,qs,disjoint:()=>{disjoint=true},deleted:()=>deleted,calls:()=>calls};
}
test('Unavailable GPU queries are reported unavailable without fabricating timing',()=>{
 const f=fixture(false),original=f.scene.renderer.render,p=f.api.install(f.scene);f.scene.renderer.render(f.scene.object3D,{});const report=p.snapshot();
 A.equal(report.timerQueryAvailable,false);A.equal(report.gpuSamples.length,0);A.equal(f.calls(),1);p.dispose();A.equal(f.scene.renderer.render,original);
});
test('Completion probe observes only ready GPU queries and deletes ownership',()=>{
 const f=fixture(),p=f.api.install(f.scene);f.scene.renderer.render(f.scene.object3D,{});A.equal(p.snapshot().gpuSamples.length,0);
 f.qs[0].ready=true;const report=p.snapshot();A.equal(report.gpuSamples.length,1);A.equal(report.gpuSamples[0].gpuElapsedMs,12);A.equal(f.deleted(),1);
 f.scene.renderer.render(f.scene.object3D,{});p.dispose();A.equal(f.deleted(),2);
});
test('Disjoint results are discarded, never presented as reliable GPU measurements',()=>{
 const f=fixture(),p=f.api.install(f.scene);f.scene.renderer.render(f.scene.object3D,{});f.disjoint();const report=p.snapshot();A.equal(report.disjoint,1);A.equal(report.gpuSamples.length,0);A.equal(f.deleted(),1);p.dispose();
});
test('Paused comparison restores graphics and preserves host state even when a draw fails',()=>{
 const f=fixture(false),r=f.api.pausedVariants(f.scene);A.equal(r.samples.length,15);A.equal(r.statePreserved,true);A.equal(f.water.visible,true);A.equal(f.scenery.visible,true);
 let n=0;f.scene.renderer.render=()=>{if(++n===6)throw Error('test draw failure')};A.throws(()=>f.api.pausedVariants(f.scene),/test draw failure/);A.equal(f.water.visible,true);A.equal(f.scenery.visible,true);
});
