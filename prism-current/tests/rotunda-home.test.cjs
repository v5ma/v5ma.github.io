/* Exercise the actual production keyboard handler with controlled collaborators.
 * This is a model/lifecycle fixture, not a rendered UI or hardware test. */
const {test}=require('node:test');
const A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../river/rotunda');
const source=fs.readFileSync(__dirname+'/../river/rotunda.js','utf8');
const handler=source.slice(source.indexOf('  function key(e){'),source.indexOf("  for(const type of ['pointermove','pointerdown','pointerup'])"));
function fixture(phase='menu',immersive=false,textControls=false){
 const calls=[];let prefs={...R.preferences(null),height:.3,distance:2.2,size:1.2,yaw:.8,hud:'floor',opacity:.22};
 const context={g:{phase,immersive},textControls,reset(){prefs={...R.preferences(null),hud:prefs.hud,opacity:prefs.opacity};calls.push('reset');},anchor(){calls.push('anchor');},draw(){calls.push('draw');}};
 vm.createContext(context);vm.runInContext(handler+';globalThis.handle=key;',context);
 return {calls,get prefs(){return prefs;},press(){context.handle({code:'Home',preventDefault(){calls.push('prevent');},stopImmediatePropagation(){calls.push('consume');}});}};
}
test('Actual Home handler immediately resets layout, preserves HUD/opacity, and consumes the input',()=>{const f=fixture();f.press();A.deepEqual(f.calls,['prevent','consume','reset','anchor','draw']);A.equal(f.prefs.height,-.27);A.equal(f.prefs.distance,1.55);A.equal(f.prefs.size,.86);A.equal(f.prefs.yaw,0);A.equal(f.prefs.hud,'floor');A.equal(f.prefs.opacity,.22);});
test('Home never repositions the scene during combat, XR, or text-control editing',()=>{for(const args of [['playing',false,false],['menu',true,false],['menu',false,true]]){const f=fixture(...args);f.press();A.deepEqual(f.calls,[]);A.equal(f.prefs.height,.3);}});
