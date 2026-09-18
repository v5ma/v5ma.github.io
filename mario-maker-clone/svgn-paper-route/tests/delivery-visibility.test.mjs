import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../delivery-upgrade.js',import.meta.url),'utf8');
const handler=source.match(/document.addEventListener\('visibilitychange',\(\)=>\{([^\n]+?)\}\);/)[1];
function run(paused,menu=false,won=false,mode='play',hidden=true,xrVisible=false){const state={paused,menu};let toggles=0;vm.runInNewContext('(function(){'+handler+'})()',{window:{SkyCycleXR:{inputVisible:xrVisible}},document:{hidden},clearKeys(){},state,mode,won,act(){state.paused=!state.paused;toggles++;}});return{paused:state.paused,toggles};}
test('Hidden active desktop route pauses once',()=>assert.deepEqual(run(false),{paused:true,toggles:1}));
test('Blur pause followed by hidden event never unpauses',()=>assert.deepEqual(run(true),{paused:true,toggles:0}));
test('Visible return and inactive screens never toggle pause',()=>{for(const args of [[true,false,false,'play',false],[false,true],[false,false,true],[false,false,false,'edit']])assert.equal(run(...args).toggles,0);});
test('A hidden HTML document does not pause a visible immersive session',()=>assert.deepEqual(run(false,false,false,'play',true,true),{paused:false,toggles:0}));
