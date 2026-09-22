/* Actual action dispatcher with controlled time/session collaborators.
 * The independent native XR suite exercises the physical-button path. */
'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const XR=require('../river/xr');
const source=fs.readFileSync(__dirname+'/../river/xr.js','utf8');
const action=source.slice(source.indexOf('  function action('),source.indexOf('  function panel(){'));
function fixture(config={}){
 const calls=[],g={phase:'paused',busy:false,resume(){calls.push('resume');},start(){calls.push('start');},notice(v){calls.push(v);}};
 Object.assign(g,config.g);const session={visibilityState:config.hidden?'hidden':'visible',inputSources:[{handedness:'left',gripSpace:{}},{handedness:'right',gripSpace:{}}]};
 const context={g,session,performance:{now:()=>150},dock:{action(){return false;}},controllerHands:XR.controllerHands,tracked:new Set(config.missing?['left']:['left','right']),calibrated:true,recenter(){calls.push('recenter');}};
 vm.createContext(context);vm.runInContext("let lastAction=100,actions=0,lastText='';\n"+action+";globalThis.invoke=action;globalThis.count=()=>actions;",context);
 return {calls,invoke:context.invoke,count:context.count};
}
test('A direct B/Y resume works 50ms after a pointer menu action',()=>{const f=fixture();f.invoke(0,true);A.deepEqual(f.calls,['resume']);A.equal(f.count(),1);});
test('Pointer duplicate suppression retains its existing 120ms interval',()=>{const f=fixture();f.invoke(0);A.deepEqual(f.calls,[]);A.equal(f.count(),0);});
test('The direct button still checks session visibility, loading and controller presence',()=>{
 for(const config of [{hidden:true},{g:{busy:true}},{g:{phase:'loading'}},{missing:true}]){const f=fixture(config);f.invoke(0,true);A.ok(!f.calls.includes('resume'));A.ok(!f.calls.includes('start'));}
});
test('The direct path starts an idle chapter through the existing Start handler',()=>{const f=fixture({g:{phase:'menu'}});f.invoke(0,true);A.deepEqual(f.calls,['start']);});
test('The actual collect path recognizes only a new B/Y edge and dispatches once per frame',()=>{
 A.match(source,/if\(btn\[5\]&&!was\[5\]\)\{if\(dock\) dock.action\(8\);requested=0;directAction=true;/);
 A.match(source,/else if\(requested>=0\)action\(requested,directAction\)/);
 A.match(source,/clicked=\(event\|\|!!old&&!old.primary&&down\)&&!latched.has\(src\)/);
});
