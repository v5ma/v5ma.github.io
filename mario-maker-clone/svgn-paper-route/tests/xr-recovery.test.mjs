import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as T from '../vendor/three.webgpu.js';
import {mappedPad,sourcesNeutral} from '../xr-input-core.mjs';
import {samplePad,repeatDirection} from '../flight-deck-core.mjs';
import {apertureBounds,insideAperture,createWorldAperture} from '../xr-world-aperture.mjs';
const source=readFileSync(new URL('../flight-deck.js',import.meta.url),'utf8');
const poll=source.slice(source.indexOf('function poll() {'),source.indexOf('// The original engine'));
function ctl(hand){return {handedness:hand,gamepad:{mapping:'xr-standard',buttons:Array.from({length:6},()=>({pressed:false,value:0})),axes:[0,0,0,0]}};}
test('Gripping either controller does not lock a menu neutral handshake',()=>{const a=ctl('left'),b=ctl('right');a.gamepad.buttons[1]={pressed:true,value:1};b.gamepad.buttons[1]={pressed:true,value:1};assert(sourcesNeutral([a,b],{panel:true}));assert(!sourcesNeutral([a,b]));});
test('Back is available during neutral gating but never during a blurred session',()=>{const a=ctl('right');a.gamepad.buttons[5]={pressed:true,value:1};assert(mappedPad([a],{enabled:false,panel:true,allowRecovery:true}).buttons[9].pressed);assert(mappedPad([a],{enabled:false,allowRecovery:true}).buttons[9].pressed);assert(!mappedPad([a],{enabled:false,allowRecovery:false}).buttons.some(b=>b.pressed));});
test('Either controller stick navigates menus; riding remains left-stick only',()=>{const a=ctl('right');a.gamepad.axes[3]=.8;assert.equal(mappedPad([a],{panel:true}).axes[1],.8);assert.equal(mappedPad([a]).axes[1],0);});
function run({visible=true,hidden=true,waiting=false,button=null,y=0}={}){
 let backs=0,moves=0,clicks=0;const panel={},el={focus(){},click(){clicks++;}};
 const pad={index:1000,connected:true,mapping:'standard',axes:[0,y,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===button,value:i===button?1:0}))};
 const c=vm.createContext({window:{SkyCycleXR:{presenting:true,inputVisible:visible,getGamepad:()=>pad,activate:()=>false}},navigator:{getGamepads:()=>[]},document:{hidden,hasFocus:()=>false,activeElement:el},lastPad:1000,lastPanel:panel,waitNeutral:waiting,previous:Array(17).fill(false),repeat:{direction:0,next:0},connected:false,mode:'play',won:false,keys:{},padOwned:new Set(),physical:new Set(),HTMLDialogElement:class{},HTMLSelectElement:class{},HTMLInputElement:class{},samplePad,repeatDirection,performance:{now:()=>1000},topPanel:()=>panel,resetInput(){},active:()=>false,releasePad(){},back(){backs++;},controls:()=>[el],focusStep(){moves++;},adjust:()=>false,showDeck(){}});
 vm.runInContext(poll+'\npoll();',c);return {backs,moves,clicks};
}
test('Actual menu poll accepts A while HTML is hidden but XR is visible',()=>assert.equal(run({button:0}).clicks,1));
test('Actual menu poll navigates without desktop focus',()=>assert.equal(run({y:.8}).moves,1));
test('Actual menu poll lets B escape a pending neutral state',()=>assert.equal(run({button:1,waiting:true}).backs,1));
test('Actual menu poll blocks input while XR is hidden or blurred',()=>assert.deepEqual(run({button:1,visible:false}),{backs:0,moves:0,clicks:0}));
for(const s of [.6,1,1.8])test('Exhibit-space bounds retain the center and reject every outside face '+s,()=>{const b=apertureBounds({scale:s,height:.3,distance:2.8});assert(insideAperture([0,.3,-2.8],b));for(let i=0;i<3;i++)for(const side of ['min','max']){const p=[0,.3,-2.8];p[i]=b[side][i]+(side==='min'?-.01:.01);assert(!insideAperture(p,b));}});
test('Mask uses exhibit transform, preserves old masks and restores material ownership',()=>{const s=new T.Scene(),m=new T.MeshBasicNodeMaterial(),old=T.TSL.bool(true);m.maskNode=old;s.add(new T.Mesh(new T.BoxGeometry(),m));const a=createWorldAperture(T),matrix=new T.Matrix4().makeRotationY(.4);matrix.setPosition(.2,1.6,-.1);a.update(matrix,{},true);a.sync(s);const mask=m.maskNode;assert.notEqual(mask,old);a.sync(s);assert.equal(m.maskNode,mask);assert.equal(a.diagnostics.materials,1);assert.deepEqual(a.diagnostics.inverse,matrix.clone().invert().elements);a.dispose();assert.equal(m.maskNode,old);assert.equal(a.diagnostics.materials,0);});
test('VR leaves materials unchanged and aperture construction adds no visible plane',()=>{const s=new T.Scene(),m=new T.MeshBasicNodeMaterial();s.add(new T.Mesh(new T.BoxGeometry(),m));const a=createWorldAperture(T);a.update(new T.Matrix4(),{},false);a.sync(s);assert.equal(m.maskNode,null);assert.equal(s.children.length,1);assert.equal(a.diagnostics.space,'exhibit-world');a.dispose();});
test('A later legitimate material mask replacement is not clobbered at exit',()=>{const s=new T.Scene(),m=new T.MeshBasicNodeMaterial();s.add(new T.Mesh(new T.BoxGeometry(),m));const a=createWorldAperture(T);a.update(new T.Matrix4(),{},true);a.sync(s);const later=T.TSL.bool(false);m.maskNode=later;a.dispose();assert.equal(m.maskNode,later);});

test('Holding Back retains one button identity across a menu close',()=>{const a=ctl('right');a.gamepad.buttons[5]={pressed:true,value:1};const menu=mappedPad([a],{panel:true,allowRecovery:true}),play=mappedPad([a],{allowRecovery:true});assert(menu.buttons[9].pressed&&play.buttons[9].pressed);assert.deepEqual(menu.buttons,play.buttons);});
test('Right-stick menu input does not depend on source ordering',()=>{const a=ctl('right'),b=ctl('left');a.gamepad.axes[3]=.8;for(const sources of [[a,b],[b,a]])assert.equal(mappedPad(sources,{panel:true}).axes[1],.8);});
