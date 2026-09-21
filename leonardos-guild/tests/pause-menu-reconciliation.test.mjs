/* Isolated unit fixtures over the actual menu-entry functions. These do not
 * simulate a browser, device, renderer, or a complete gameplay journey. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
for(const filename of ['doors-ui.mjs','life-ui.mjs','frontier-ui.mjs']){
 test(filename+': an explicit paused-menu permission opens a child without resuming play',()=>{
  const source=readFileSync(new URL('../'+filename,import.meta.url),'utf8');
  const declaration=source.split('\n').find(line=>/^\s*function open\(/.test(line));
  assert.ok(declaration,'The real menu-entry function must be present');
  const calls=[];
  const context={active:()=>false,canOpen:()=>true,setPause:value=>calls.push(['pause',value]),render:()=>calls.push(['render']),dialog:{showModal:()=>calls.push(['show'])},$:()=>({textContent:''})};
  vm.runInNewContext('let tab,message,page,target,wasActive;('+declaration.trim()+')();',context);
  assert.equal(calls.filter(([name])=>name==='show').length,1,'Pause must not silently reject this menu');
  assert.deepEqual(calls.filter(([name])=>name==='pause'),[['pause',true]],'No unpause or simulation step is needed to open a menu');
 });
}

import {canOpenMenu} from '../menu-access.mjs';
import {frontierDetail} from '../frontier-ui.mjs';
const pause={tagName:'DIALOG',id:'pause-dialog',open:true};
test('Notebook access works in ordinary play and from the actual open pause parent',()=>{
 assert.equal(canOpenMenu(true,false,null),true);
 assert.equal(canOpenMenu(true,true,pause),true);
});
test('The pause allowance cannot open a title, hidden parent, unrelated dialog or inactive session',()=>{
 for(const [playing,paused,root]of [[false,false,null],[false,true,pause],[true,true,null],[true,true,{...pause,open:false}],[true,true,{...pause,id:'shop-dialog'}],[true,true,{...pause,tagName:'SECTION'}],[true,false,pause]])assert.equal(canOpenMenu(playing,paused,root),false);
});
test('Returning from a child restores menu access, not gameplay permission',()=>{
 let root=pause;const playing=true,paused=true;
 assert.equal(canOpenMenu(playing,paused,root),true);
 root={tagName:'DIALOG',id:'life-dialog',open:true};assert.equal(canOpenMenu(playing,paused,root),false);
 root=pause;assert.equal(canOpenMenu(playing,paused,root),true);
 assert.equal(playing&&!paused,false);
});
test('Only notebook open functions use the allowance; physical interactions retain the active guard',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(app,/canOpenMenu\(playing,paused,pad\?\.ui\.root\(\)\)/);
 for(const factory of ['createLifeUI','createDoorsUI','createFrontierUI'])assert.match(app,new RegExp(factory+'\\(\\{canOpen:canOpenNotebook,'));
 const doors=readFileSync(new URL('../doors-ui.mjs',import.meta.url),'utf8');assert.match(doors,/function interact\(\)\{\s*if\(!active\(\)\)return/);
 assert.match(app,/pad=createGamepad\(\{[^\n]*active:\(\)=>playing&&!paused/);
});
test('Recovered peaceful explanations preserve original prerequisites and one-time-reward meaning',()=>{
 assert.match(frontierDetail({id:'parley-folio',kind:'parley'}),/deliveries and waterwheel/);
 assert.match(frontierDetail({id:'parley:attic',kind:'parley'}),/actual floor/);
 assert.match(frontierDetail({id:'parley:attic',kind:'parley'}),/paid once/);
});
test('Specific station descriptions win; reading a description cannot mutate its source',()=>{
 const station=Object.freeze({id:'cistern',kind:'water',detail:'Read this actual slate.'});
 assert.equal(frontierDetail(station),station.detail);
 assert.equal(frontierDetail({kind:'gate'}),'This action must be performed here, not remotely from the map.');
});
