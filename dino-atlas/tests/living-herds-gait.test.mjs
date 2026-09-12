import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../frontier-data-expanded.js';
import {makeResident} from '../frontier-art.js';
test('two-legged residents alternate their stance by half a gait cycle',()=>{
 let bipeds=0;
 for(const species of SPECIES){const limbs=makeResident(species).userData.rig.limbs;if(limbs.length===2){bipeds++;assert.equal(Math.abs(limbs[0].phase-limbs[1].phase),.5,species.id);}}
 assert.ok(bipeds>0);
});

test('four strays can return through the actual park gate with Living Herds steering',async()=>{
 const T=await import('../vendor/three.module.js');
 const R=(await import('../vendor/rapier.mjs')).default;
 const {initPhysics,ParkPhysics}=await import('../ranger-physics.js');
 const {buildPark}=await import('../ranger-world.js');
 const {buildFrontier}=await import('../frontier-world.js');
 const {emptyFrontier,PENS,ALL_ANIMALS,createResident,stepResident,penState,insidePen,deterAnimal}=await import('../frontier-data.js');
 const {calibrateResident}=await import('../ranch-game.js');
 const {LivingHerds}=await import('../living-herds.js');
 const {buildHerdGrid}=await import('../herd-behavior.js');
 await initPhysics();const original=globalThis.document;
 globalThis.document={createElement:()=>({width:1024,height:100,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 const physics=new ParkPhysics();
 try{
  const scene=new T.Scene(),state=emptyFrontier();buildPark(scene,physics);const front=buildFrontier(scene,physics,state);
  const pen=PENS.find(p=>p.id==='crest-meadow'),ps=penState(state,pen);ps.open=true;ps.fed=true;
  const animals=ALL_ANIMALS.filter(a=>a.pen===pen.id).map((a,i)=>{const r=createResident(a,i);r.model=makeResident(r);calibrateResident(r);r.x=pen.x+(i%2?3:-3);r.z=pen.z+pen.hz+7+i*4;r.origin={x:r.x,z:r.z};r.collider=physics.animal(r.radius,r.x,r.z,r.collisionHeight);return r;});
  const h=Object.create(LivingHerds.prototype);h.ctx={physics,R};
  const ctx={canStep:(...a)=>h.canStep(...a),visible:(...a)=>h.visible(...a),atGate:a=>Math.abs(a.x-pen.x)<9&&a.z>pen.z+pen.hz-9,grid:null};
  const player={x:-44,y:1,z:203};animals.forEach(a=>deterAnimal(a,player,'horn'));let home=false;
  for(let i=0;i<3600;i++){ctx.grid=buildHerdGrid(animals);for(const a of animals){stepResident(a,player,1/60,i/60,state,100,ctx);a.collider.setNextKinematicTranslation({x:a.x,y:a.collisionHeight/2,z:a.z});}front.update(1/60,i/60,player,true);physics.world.step();if(animals.every(a=>insidePen(a,pen,2))){home=true;break;}}
  assert.ok(home,'all four cross the physical gateway using ordinary movement, rather than teleporting');
 }finally{physics.world.free();globalThis.document=original;}
});
