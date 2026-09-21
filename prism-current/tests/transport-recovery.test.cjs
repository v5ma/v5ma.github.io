/* Deterministic interruptions of the actual component methods. Audio/session are
 * controlled collaborators here; production-browser journeys are separate. */
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../river/core');
function fixture(immersive=true){let def,resolve,reject,plays=0,pauses=0,syncs=0;
 const document={hidden:false,getElementById:()=>({focus(){}})};
 const scope={RiverCore:C,document,AFRAME:{registerComponent:(_,v)=>def=v}};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(__dirname+'/../river/app.js','utf8'),scope);
 const session={visibilityState:'visible'},state=C.create('duck-armada');state.mode='paused';state.time=12;state.score=480;
 const g={...def,phase:'paused',state,serial:8,busy:false,immersive,runMode:immersive?'ar':'desktop',chapter:'duck-armada',xr:{calibrated:true,session:immersive?session:null},audio:{offset:12,play(){plays++;return new Promise((a,b)=>{resolve=a;reject=b;});},pause(){pauses++;},stop(){}},sync(){syncs++;},notice(text){this.message=text;},focus(){},clearInputs(){this.previous=[null,null];}};
 return {g,session,document,state,resolve(v=true){resolve(v);},reject(){reject(Error('Late audio rejection'));},get plays(){return plays;},get pauses(){return pauses;},get syncs(){return syncs;}};
}
test('Headset hidden during pending Resume remains paused after audio resolves',async()=>{const f=fixture(),p=f.g.resume();f.session.visibilityState='hidden';f.g.pauseRun('Headset hidden');f.resolve();await p;A.equal(f.g.phase,'paused');A.equal(f.state.mode,'paused');A.equal(f.state.time,12);A.equal(f.state.score,480);A.equal(f.pauses,1);A.equal(f.g.busy,false);});
test('Hidden then visible never revives an interrupted Resume without another press',async()=>{const f=fixture(),p=f.g.resume();f.g.pauseRun('Headset hidden');f.session.visibilityState='visible';f.resolve();await p;A.equal(f.g.phase,'paused');A.equal(f.state.mode,'paused');});
test('XR exit interrupts pending audio without discarding the current battle',async()=>{const f=fixture(),p=f.g.resume();f.g.immersive=false;f.g.xr.session=null;f.g.pauseRun('Headset ended');f.resolve();await p;A.equal(f.g.phase,'paused');A.equal(f.g.state,f.state);A.equal(f.g.runMode,'ar');A.equal(f.pauses,1);});
test('Resuming while already hidden never starts an audio request',async()=>{const f=fixture();f.session.visibilityState='hidden';const p=f.g.resume();if(f.plays)f.resolve();await p;A.equal(f.plays,0);A.equal(f.g.phase,'paused');});
test('Session identity change is rejected even without a delivered visibility event',async()=>{const f=fixture(),p=f.g.resume();f.g.xr.session={visibilityState:'visible'};f.resolve();await p;A.equal(f.g.phase,'paused');A.equal(f.pauses,1);});
test('Late completion cannot unlock or overwrite a newer loading operation',async()=>{const f=fixture(),p=f.g.resume();f.g.serial++;f.g.state=null;f.g.phase='loading';f.g.busy=true;const before=f.syncs;f.resolve();await p;A.equal(f.g.busy,true);A.equal(f.g.phase,'loading');A.equal(f.syncs,before);});
test('Late rejected audio cannot replace the newer operation message or lock state',async()=>{const f=fixture(),p=f.g.resume();f.g.serial++;f.g.busy=true;f.g.message='New request';f.reject();await p;A.equal(f.g.busy,true);A.equal(f.g.message,'New request');});
test('Visible calibrated session can deliberately resume the same scored battle',async()=>{const f=fixture(),p=f.g.resume();f.resolve();await p;A.equal(f.g.phase,'playing');A.equal(f.g.state,f.state);A.equal(f.state.time,12);A.equal(f.state.score,480);A.equal(f.pauses,0);});
test('Browser hidden during pending Resume also cancels without altering progress',async()=>{const f=fixture(false),p=f.g.resume();f.document.hidden=true;f.g.pauseRun('Window hidden');f.resolve();await p;A.equal(f.g.phase,'paused');A.equal(f.state.time,12);A.equal(f.state.score,480);});
test('Missing calibration prevents Resume but retains its battle',async()=>{const f=fixture();f.g.xr.calibrated=false;await f.g.resume();A.equal(f.plays,0);A.equal(f.g.state,f.state);A.equal(f.g.phase,'paused');});
