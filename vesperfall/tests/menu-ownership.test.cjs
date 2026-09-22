/* Execute the production draw wrappers against the older two-row fallback.
 * This reproduces render-time focus loss, not a rendered/device playthrough. */
'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const E=require('../pilgrim-echoes-model');
function owner(){
 const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const g={menuSelection:0,xrMenuRows:[],xrPanel:{ctx,texture:{}},threshold:{state:{phase:'game'}},questHands:{state:{active:false}}};
 // The canonical renderer's actual fallback has two rows and this clamp.
 g.drawMenu=()=>{g.xrMenuRows=[['Back to menu',()=>{}],['Exit immersive mode',()=>{}]];g.menuSelection=Math.min(g.menuSelection,g.xrMenuRows.length-1);};
 return g;
}
function threshold(g,list){
 const s=fs.readFileSync(path.join(__dirname,'../threshold.js'),'utf8');
 const body=s.slice(s.indexOf('  const oldDraw=g.drawMenu.bind(g);'),s.indexOf('  const oldPause=g.setPaused.bind(g);'));
 a.ok(body.includes('oldDraw()'),'Production wrapper found');
 vm.runInNewContext(body,{g,customRows:()=>list,state:{phase:'game'},exit(){}});
}
function story(g,found){
 const s=fs.readFileSync(path.join(__dirname,'../pilgrim-echoes.js'),'utf8');
 const body=s.slice(s.indexOf('  const drawMenu=g.drawMenu.bind(g);'),s.indexOf('  const visuals=g.visuals.bind(g);'));
 a.ok(body.includes('drawMenu()'),'Production story wrapper found');
 vm.runInNewContext(body,{g,ui:{state:{xrScreen:'stories'},setScreen(){},notice(){}},state:{found,page:0},M:E});
}
test('Spatial desk preserves all six observed input selections through repeated rendering',()=>{
 const g=owner();threshold(g,Array.from({length:6},(_,i)=>['button '+i,()=>{}]));
 for(let i=0;i<6;i++){g.menuSelection=i;g.drawMenu();g.drawMenu();a.equal(g.menuSelection,i,'row '+i);a.equal(g.xrMenuRows.length,6);}
});
test('Spatial desk still clamps out-of-bounds selection against its own rows',()=>{
 const g=owner();threshold(g,Array.from({length:6},()=>['button',()=>{}]));g.menuSelection=99;g.drawMenu();a.equal(g.menuSelection,5);g.menuSelection=-4;g.drawMenu();a.equal(g.menuSelection,0);
});
test('Ordinary two-row screens retain their own focus and exit behavior',()=>{
 const g=owner();threshold(g,null);g.menuSelection=5;g.drawMenu();a.equal(g.menuSelection,1);a.equal(g.xrMenuRows.length,2);
});
test('Story journal preserves selection of later notes, manual and return',()=>{
 const g=owner();story(g,E.NOTES.slice(0,3).map(n=>n.id));
 for(let i=0;i<6;i++){g.menuSelection=i;g.drawMenu();g.drawMenu();a.equal(g.menuSelection,i,'story row '+i);a.equal(g.xrMenuRows.length,6);}
});
test('Empty story journal keeps all four navigation choices reachable',()=>{
 const g=owner();story(g,[]);g.menuSelection=3;g.drawMenu();a.equal(g.menuSelection,3);a.equal(g.xrMenuRows.length,4);
});
