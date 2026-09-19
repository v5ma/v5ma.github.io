// Isolated execution of actual selectStart; not a native route or hardware test.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const text=readFileSync(new URL('../xr-play.js',import.meta.url),'utf8');
const fn=text.slice(text.indexOf('function selectStart(e){'),text.indexOf('function selectEnd(e)'));
function fixture({ui=false,editor=false,visible=true}={}){
 const source={handedness:'right',gamepad:{mapping:'xr-standard'}},suppressed=new Set(),calls=[];
 const c=vm.createContext({presenting:true,session:{visibilityState:visible?'visible':'visible-blurred'},trackedController:()=>true,panel:()=>null,typing:null,neutral:false,suppressed,hit:()=>ui?{action:()=>calls.push('ui')}:null,canvasHit:()=>editor?{x:.3,y:.4}:null,lastFrame:{},screenMode:editor?'workshop':'diorama',screenPointer:null,screenSource:{id:'maker-canvas'},pointerEvent:t=>calls.push(t),lastUI:0});
 vm.runInContext(fn,c);c.selectStart({inputSource:source,frame:{}});return {calls,suppressed:suppressed.has(source),c};
}
test('A trigger with no UI hit remains available to the existing gameplay input',()=>{const f=fixture();assert.equal(f.suppressed,false);assert.deepEqual(f.calls,[]);});
test('A captured UI action suppresses that press from gameplay',()=>{const f=fixture({ui:true});assert(f.suppressed);assert.deepEqual(f.calls,['ui']);});
test('Editor canvas capture still owns its trigger gesture',()=>{const f=fixture({editor:true});assert(f.suppressed);assert.deepEqual(f.calls,['pointerdown']);assert.equal(f.c.screenPointer.target.id,'maker-canvas');});
test('System-blurred input cannot invoke controls or start an editor capture',()=>{const f=fixture({ui:true,editor:true,visible:false});assert.deepEqual(f.calls,[]);assert.equal(f.c.screenPointer,null);});
