/* Execute the actual input-owner functions with isolated input/context fixtures. */
'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../field-kit-model.js');
const source=fs.readFileSync(require.resolve('../field-kit.js'),'utf8');
const live=source.match(/function live\(\)\{[^\n]+/)[0],pad=source.match(/function padInput\(b,edge\)\{[^\n]+/)[0];
function fixture(){const calls=[],g={running:true,paused:false,game:{phase:'playing',world:{}},practice:false,firstBell:{state:{coach:false}},returningBell:{state:{table:false}},threshold:{state:{phase:'game'}},ritual:{focus:{open:false}}},scope={g,M:K,drink:()=>calls.push('drink'),flatThrow:type=>calls.push(type)};vm.createContext(scope);vm.runInContext(live+'\n'+pad+'\nthis.testInput=padInput;',scope);return {g,calls,run:(key,modifier=true)=>scope.testInput(Object.assign(Array(17).fill(false),{4:modifier}),i=>i===key)};}
test('Field-kit Xbox chords leave the already-open tactical quiver in control',()=>{for(const key of[2,5]){const f=fixture();f.g.ritual.focus.open=true;a.equal(f.run(key),false);a.deepEqual(f.calls,[]);}});
test('Field-kit Xbox chords retain their ordinary heal/frost actions during play',()=>{for(const [key,want]of[[2,'drink'],[5,'frost']]){const f=fixture();a.equal(f.run(key),true);a.deepEqual(f.calls,[want]);}});
test('Spatial menus, inspection and an interrupted expedition never spend field supplies',()=>{for(const change of[g=>g.paused=true,g=>g.running=false,g=>g.threshold.state.phase='foyer',g=>g.returningBell.state.table=true,g=>g.game.phase='reward',g=>g.game.unscored=true]){const f=fixture();change(f.g);a.equal(f.run(5),false);a.deepEqual(f.calls,[]);}});
test('Neither a lone LB press nor a plain X press is a field-kit use',()=>{const f=fixture();a.equal(f.run(4),false);a.equal(f.run(2,false),false);a.deepEqual(f.calls,[]);});
