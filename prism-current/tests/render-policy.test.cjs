/* Actual production sync method, inert DOM and a renderer with observable resets.
 * No GPU timing claim: native tests separately count real renderer/canvas writes. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/../river/app.js','utf8');
function fixture(dpr=1){
 let definition,ratio=1,resizes=0;const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{setAttribute(){}});return elements.get(id);};
 const scope={RiverCore:{},devicePixelRatio:dpr,document:{body:{dataset:{}},getElementById:get},localStorage:{setItem(){}},AFRAME:{registerComponent(n,v){definition=v;}}};
 vm.createContext(scope);vm.runInContext(source,scope);
 const renderer={xr:{isPresenting:false},getPixelRatio:()=>ratio,setPixelRatio(v){ratio=v;resizes++;}};
 const g={...definition,el:{renderer,is:()=>false},phase:'menu',chapter:'duck-armada',quality:'balanced',audio:{volume:.5,effectsVolume:.2},records:{},activeHand:0,padId:null,quiet:false,cruise:false,immersive:false};
 return {g,renderer,scope,get resizes(){return resizes;},get ratio(){return ratio;}};
}
test('Repeated menu sync and blade swaps never reset an unchanged drawing buffer',()=>{const f=fixture();for(let i=0;i<80;i++){f.g.activeHand=i%2;f.g.sync();}A.equal(f.resizes,0);A.equal(f.ratio,1);});
test('Real quality changes keep the existing exact pixel ratios and resize once',()=>{const f=fixture(2);for(const [quality,ratio,count]of [['light',.7,1],['balanced',1,2],['cinematic',1.5,3]]){f.g.quality=quality;f.g.sync();f.g.sync();A.equal(f.ratio,ratio);A.equal(f.resizes,count);}});
test('Device-scale changes still apply without substituting a cheaper test resolution',()=>{const f=fixture(.25);f.g.sync();A.equal(f.ratio,.25);A.equal(f.resizes,1);f.g.phase='playing';f.g.sync();A.equal(f.resizes,1);f.scope.devicePixelRatio=1.25;f.g.sync();A.equal(f.ratio,1);A.equal(f.resizes,2);});
test('Loading completion, pause and volume synchronization retain graphics allocation',()=>{const f=fixture();for(const phase of ['loading','playing','paused','playing','complete']){f.g.phase=phase;f.g.audio.volume-=.03;f.g.sync();}A.equal(f.resizes,0);});
test('An active XR framebuffer is never resized by a screen preference update',()=>{const f=fixture(2);f.g.quality='light';f.g.immersive=true;f.g.sync();f.g.immersive=false;f.renderer.xr.isPresenting=true;f.g.sync();A.equal(f.resizes,0);f.renderer.xr.isPresenting=false;f.g.sync();A.equal(f.resizes,1);A.equal(f.ratio,.7);});
test('A replaced renderer is queried, not mistaken for an already-sized old one',()=>{const f=fixture(2);f.g.quality='cinematic';f.g.sync();let n=0,v=1;f.g.el.renderer={getPixelRatio:()=>v,setPixelRatio(x){v=x;n++;}};f.g.sync();A.equal(n,1);A.equal(v,1.5);});
test('Runtime retains the interruption threshold, physical-input slice path and record identity',()=>{A.match(source,/t-this.lastTime>\.35/);A.match(source,/C\.slice\(this.state,h,this.previous\[h\].pose,hand.pose/);A.match(source,/this.state.chapter,this.runMode,this.state.cruise/);});
