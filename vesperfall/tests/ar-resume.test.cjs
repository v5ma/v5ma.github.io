'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
test('AR exit restores the suspended desktop view and matrices before capturing a paused checkpoint',()=>{
 // This is an isolated source-order fixture, not a rendered or device test.
 const source=fs.readFileSync(path.join(__dirname,'../dominion-ar.js'),'utf8');
 const start=source.indexOf('g.exitXR=function(){'),end=source.indexOf('  g.start=',start);
 assert.ok(start>=0&&end>start);
 const recorded=[];let matrices=0;
 const look={yawObject:{rotation:{y:0}},pitchObject:{rotation:{x:0}}};
 const cloneable=value=>({value,copy(o){this.value=o.value;return this;}});
 const expedition={id:'fixture-suspended-world'},temporary={id:'fixture-ar-world'};
 const old={game:expedition,running:true,practice:false,training:null,banked:2,lastPhase:'playing',yaw:.67,pitch:-.21,rig:cloneable('original-position'),rotation:cloneable('original-rotation'),background:'original-sky',fog:'original-fog'};
 const g={game:temporary,arMode:true,arsenal:{},head:{components:{'look-controls':look}},rig:{position:cloneable('ar-position'),rotation:cloneable('ar-rotation')},scene:{object3D:{updateMatrixWorld(){matrices++;}},renderer:{setClearAlpha(){}}},build(){},setPaused(){recorded.push({world:this.game,yaw:look.yawObject.rotation.y,pitch:look.pitchObject.rotation.x,matrices});},toast(){},requestedMode:'ar'};
 const context={g,suspended:old,explore:null,exit(){look.yawObject.rotation.y=0;look.pitchObject.rotation.x=0;g.setPaused(true);}};
 vm.runInNewContext(source.slice(start,end),context);g.exitXR();
 const saved=recorded.at(-1);assert.equal(saved.world,expedition);assert.equal(saved.yaw,old.yaw);assert.equal(saved.pitch,old.pitch);assert.equal(saved.matrices,1);
 assert.equal(g.rig.position.value,'original-position');assert.equal(g.rig.rotation.value,'original-rotation');assert.equal(context.suspended,null);assert.equal(g.arMode,false);
});
