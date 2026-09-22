/* Execute the production status painter against controlled canvas collaborators.
 * These are state/ownership fixtures, not GPU or physical-device tests. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Core=require('../river/core');
const source=fs.readFileSync(__dirname+'/../river/rotunda.js','utf8');
function fixture(){
 const calls=[];
 const panel=()=>({canvas:{width:1200,height:290},context:{clearRect(){calls.push('paint');},fillRect(){},strokeRect(){},fillText(text){calls.push(text);}},texture:{uploads:0,set needsUpdate(v){if(v)this.uploads++;}}});
 const hud=panel(),healthPanel=panel(),g={difficulty:'easy',state:null},scope={g,hud,healthPanel,RiverCore:Core,performance:{now:()=>10},calls};
 vm.createContext(scope);
 const start=source.indexOf('  function paintHealth('),end=source.indexOf('  function update(input,viewer)',start);
 vm.runInContext("let lastHudKey='',lastHud=0,hudPaints=0,hudPrepared=false,disposed=false,notice='',noticeAt=-2000;\n"+source.slice(start,end)+";globalThis.testAPI={paintHealth,prepare,setNotice(text,at){notice=text;noticeAt=at;},stats:()=>({hudPaints,hudPrepared,lastHud}),dispose(){disposed=true;}};",scope);
 return {api:scope.testAPI,hud,healthPanel,g,calls};
}
test('Identical HUD content is drawn once, not reuploaded on every time interval',()=>{
 const f=fixture(),s=Core.create();
 for(let i=0;i<100;i++){s.time=i*.2;f.api.paintHealth(s,2000+i*200);}
 A.equal(f.api.stats().hudPaints,1);A.equal(f.hud.texture.uploads,1);A.equal(f.healthPanel.texture.uploads,1);
});
test('Health, score and healing notice changes redraw; repeated paused state stays frozen',()=>{
 const f=fixture(),s=Core.create();f.api.paintHealth(s,10000);s.health=37;f.api.paintHealth(s,10010);
 A.ok(f.calls.includes('HEALTH 37 / 100'));A.equal(f.api.stats().hudPaints,2);
 for(let i=0;i<40;i++)f.api.paintHealth(s,10011+i);A.equal(f.api.stats().hudPaints,2);
 s.score=120;f.api.paintHealth(s,10100);A.equal(f.api.stats().hudPaints,3);
 f.api.setNotice('+30 HEALTH / supply box',10100);f.api.paintHealth(s,10110);A.equal(f.api.stats().hudPaints,4);
 f.api.paintHealth(s,11901);A.equal(f.api.stats().hudPaints,5);
});
test('Finale health hint updates on the real boss phase boundary',()=>{
 const f=fixture(),s=Core.create();s.time=Core.BOSS_BEAT*Core.BEAT-.01;f.api.paintHealth(s,10000);
 s.time+=.02;f.api.paintHealth(s,10010);A.equal(f.api.stats().hudPaints,2);
 A.ok(f.calls.some(x=>x.includes('FINALE: SHOOT THE BOSS')));
});
test('HUD preparation uploads only the existing status textures and does not advance the encounter',()=>{
 const f=fixture();f.g.state=Core.create();const before=JSON.stringify(f.g.state),seen=[];
 A.equal(f.api.prepare({initTexture:t=>seen.push(t)}),true);A.deepEqual(seen,[f.hud.texture,f.healthPanel.texture]);
 A.equal(f.api.stats().hudPrepared,true);A.equal(JSON.stringify(f.g.state),before);A.equal(f.api.stats().hudPaints,1);
});
test('Failed or disposed preparation cannot report new readiness',()=>{
 const f=fixture();A.throws(()=>f.api.prepare({initTexture(){throw Error('upload failed');}}),/upload failed/);
 A.equal(f.api.stats().hudPrepared,false);f.api.dispose();A.equal(f.api.prepare({initTexture(){throw Error('unreachable');}}),false);
});
test('The actual startup orders health upload before audio and keeps cancellation checks',()=>{
 const app=fs.readFileSync(__dirname+'/../river/app.js','utf8'),start=app.slice(app.indexOf('  async start(){'),app.indexOf('  pauseRun('));
 A.ok(start.indexOf('this.dock.prepare(this.el.renderer)')<start.indexOf("this.audio.play('undertow',0)"));
 A.match(start,/this\.dock\.prepare\(this\.el\.renderer\);if\(serial!==this.serial\)return;/);
});
