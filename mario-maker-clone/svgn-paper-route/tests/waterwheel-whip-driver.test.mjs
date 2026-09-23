// Isolated harness contract, not game physics or a native/device playthrough.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./waterwheel-whip-browser.py',import.meta.url),'utf8');
const driver=source.split("DRIVER=r'''")[1].split("'''\nwith sync_playwright")[0];
function setup(){
 const pad={axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 const delivery={paused:false,state:{menu:false}},samples=[];
 const window={pollGamepad(){samples.push({axis:pad.axes[0],buttons:pad.buttons.some(b=>b.pressed)});}};
 const player=Object.freeze({x:120,y:2100,onGround:true,track:null,peg:null,w:26,h:30});
 const ctx=vm.createContext({window,testPad:pad,RouteWorkshop:{testing:true},__delivery:delivery,won:false,player});
 vm.runInContext(driver,ctx)(['standard','screen']);
 return {pad,delivery,window,samples,player,poll:()=>window.pollGamepad()};
}
test('Driver offers eight released samples before riding so native neutral rearming remains effective',()=>{
 const f=setup();for(let i=0;i<8;i++)f.poll();
 assert(f.samples.every(s=>s.axis===0&&!s.buttons));f.poll();assert.equal(f.samples.at(-1).axis,1);
 assert.equal(f.player.x,120);assert.equal(f.window.bellDriver.ticks,1);
});
test('Pause and resume require a new neutral interval rather than holding movement through the menu',()=>{
 const f=setup();for(let i=0;i<9;i++)f.poll();f.delivery.paused=true;f.poll();
 f.delivery.paused=false;const start=f.samples.length;for(let i=0;i<8;i++)f.poll();
 assert(f.samples.slice(start).every(s=>s.axis===0&&!s.buttons));f.poll();assert.equal(f.samples.at(-1).axis,1);assert.equal(f.player.x,120);
});
