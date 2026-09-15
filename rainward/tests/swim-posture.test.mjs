import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {actor,pose} from '../actors.mjs';
function swim(check){const a=actor(new T.Scene(),null,0);for(let i=0;i<180;i++){pose(a,{x:0,z:-i/60*2,yaw:0,hp:100,stance:'stand',waterMode:'swim',swimDepth:.64,speed:2},i/60);if(i>60)check(a);}return a;}
test('Forward swimming alternates flutter kicks instead of moving both legs in phase',()=>{let samples=0;swim(a=>{const left=a.bones[11].rotation.x,right=a.bones[14].rotation.x;assert.ok(Math.abs(left+right)<.002);if(Math.abs(left)>.08){assert.ok(left*right<0);samples++;}});assert.ok(samples>30);});
test('Extended swimming ankles point the toes along the trailing body line',()=>{swim(a=>{for(const j of [13,16]){const toe=new T.Vector3(0,0,-1).applyQuaternion(a.bones[j].getWorldQuaternion(new T.Quaternion()));assert.ok(toe.z>.3,'Swimming boot points behind the moving body');}assert.equal(a.motion.stats.locked,0);});});
