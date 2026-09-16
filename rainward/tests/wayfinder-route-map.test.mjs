import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,checkpoint} from '../model.mjs';import {solidAt} from '../world.mjs';import {clinicMapSegments} from '../clinic-wayfinding.mjs';
test('Map routes use real navigation around the garden obstacles instead of straight lines through walls',()=>{
 const state=createGame(),before=checkpoint(state);
 for(const id of ['garden','marketTerrace','westRamp']){
  const paths=clinicMapSegments(state,id);assert.ok(paths.length);
  for(const path of paths)for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*4));
   for(let j=0;j<=steps;j++){const x=a[0]+(b[0]-a[0])*j/steps,z=a[1]+(b[1]-a[1])*j/steps;assert.equal(solidAt(x,z),false,JSON.stringify({id,x,z}));}
  }
 }
 assert.equal(checkpoint(state),before);
 assert.deepEqual(clinicMapSegments(state,'not-a-route'),[]);
 assert.deepEqual(clinicMapSegments({level:'natatorium'},'garden'),[]);
});

import {nativeLabel} from '../xr-panel.mjs';
test('The immersive reload control never advertises the incompatible desktop LT plus X chord',()=>{assert.equal(nativeLabel({id:'pack-reload',tagName:'BUTTON',textContent:'RELOAD / LT + X'}),'RELOAD WEAPON');});
