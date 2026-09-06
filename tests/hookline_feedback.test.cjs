/* Presentation/diagnostic tests. Physical carried-state tests are separate. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/../mario-maker-clone/svgn-paper-route/';
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(root+'hookline-feedback.js','utf8'),c);const cue=c.HooklineFeedback.cue;
test('A cradle cue explains braking, then stops recommending braking on the exit',()=>{
 const s={course:'hookline-run',stage:2,position:.7,speed:23,peg:false,won:false},before=JSON.stringify(s);
 assert.equal(cue(s).id,'brake');assert.equal(JSON.stringify(s),before);
 assert.equal(cue({...s,position:.9}).id,'release-brake');assert.equal(cue({...s,speed:17}).id,'runup');
});
test('Backtracking, finish, and unrelated/custom worlds are not mislabeled',()=>{
 const s={course:'hookline-run',stage:2,position:.7,speed:-9};assert.equal(cue(s).id,'backtrack');
 assert.equal(cue({...s,stage:3}).id,'finish');
 for(const extra of[{course:'custom'},{peg:true},{won:true},{position:NaN},{speed:Infinity}])assert.equal(cue({...s,...extra}),null);
});
test('Whip render diagnostics are recorded by the actual mesh callback',()=>{
 const text=fs.readFileSync(root+'whip-visual.js','utf8');assert.match(text,/rope\.onAfterRender=function/);assert.match(text,/vertices>0&&player\.peg/);
});
