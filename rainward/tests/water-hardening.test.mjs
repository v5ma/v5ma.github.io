import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../world.mjs';
import * as M from '../model.mjs';
import {deepWater,updateAquatic,toggleSubmerge,surfaceWater} from '../aquatic.mjs';
import {basinLayout,poolCameraFloor,dryDeckRectangles,poolContains} from '../pool-layout.mjs';
import {clipBoom,followCamera} from '../camera-core.mjs';
import {beginHealing,beginCrafting} from '../survival.mjs';
import {taskTarget} from '../field-tasks.mjs';
const at=(s,q)=>{Object.assign(s.player,{x:q.x,z:q.z,vx:0,vz:0});updateAquatic(s,{},1/60);};
function game(){const s=M.createGame('natatorium');s.enemies=[];return s;}
test('The water camera stays above the real basin floor and maintains an underwater boom',()=>{
 game();const floor=(x,z)=>poolCameraFloor(W.CURRENT.water,x,z,W.heightAt(x,z));
 const target={x:15,y:-1.35,z:10},desired={x:15.7,y:-1.10,z:14};
 const c=clipBoom(target,desired,.20,[],floor);
 assert.ok(c.y<-.2);assert.ok(Math.hypot(c.x-target.x,c.z-target.z)>3.9);
 const low=clipBoom(target,{x:15,y:-8,z:11},.20,[],floor);
 assert.ok(low.y>=-2.55+.20-.01);
 const smooth=followCamera(target,desired,{x:15,y:-.1,z:13},1/60,false,floor);
 assert.ok(Object.values(smooth).every(Number.isFinite));assert.ok(smooth.y<0);
});
test('Underwater camera cannot pass below the dry deck across any competition-pool edge',()=>{
 game();const floor=(x,z)=>poolCameraFloor(W.CURRENT.water,x,z);
 for(const [target,desired] of [[{x:15,y:-1,z:20},{x:15,y:-1,z:26}], [{x:7,y:-1,z:1},{x:2,y:-1,z:1}],[{x:23,y:-1,z:1},{x:29,y:-1,z:1}],[{x:15,y:-1,z:-18},{x:15,y:-1,z:-24}]]){
  const c=clipBoom(target,desired,.20,[],floor);assert.ok(poolContains(W.CURRENT.water[1],c.x,c.z,.20));assert.ok(c.y>=floor(c.x,c.z)+.20);
 }
});
test('Every pool slab has visible lanes and caustics above its actual upper face',()=>{
 for(const p of W.LEVELS.natatorium.water){const g=basinLayout(p);assert.ok(Math.abs(g.slabCenterY+g.slabHeight/2-g.floorY)<1e-10);assert.ok(g.laneY>g.floorY);assert.ok(g.causticY>g.laneY+.0125);assert.ok(g.causticY<g.surfaceY);assert.ok(g.surfaceY<0);}
});
test('Tiled deck panels cover every dry area exactly, without sealing the pools',()=>{
 const {bounds,water}=W.LEVELS.natatorium,rects=dryDeckRectangles(bounds,water);
 const area=rects.reduce((a,r)=>a+r.w*r.d,0),expected=(bounds.x1-bounds.x0)*(bounds.z1-bounds.z0)-water.reduce((a,p)=>a+p.w*p.d,0);
 assert.equal(area,expected);assert.ok(rects.length<100);
 for(const r of rects)assert.ok(!water.some(p=>Math.abs(r.x-p.x)<(r.w+p.w)/2-1e-8&&Math.abs(r.z-p.z)<(r.d+p.d)/2-1e-8));
});
test('Nearby dry shelters and deck actions cannot be activated from either swim state',()=>{
 const s=game();at(s,{x:15,z:21.95});assert.ok(W.dist(s.player,W.SHELTERS.find(q=>q.id==='natatorium-deck'))<1.7);
 assert.equal(M.interactable(s),null);assert.equal(M.interact(s),false);
 toggleSubmerge(s);assert.equal(M.interactable(s),null);assert.equal(M.interact(s),false);
 at(s,{x:15,z:23.5});assert.equal(M.interactable(s)?.kind,'shelter');assert.ok(M.interact(s));
});
test('Water entry cancels and refunds unfinished crafting/healing once; reload spends no ammo',()=>{
 for(const action of ['craft','heal','reload']){
  const s=game(),p=s.player;p.hp=45;p.mag=1;p.cloth=2;p.canister=2;p.medkit=1;
  const before={cloth:p.cloth,canister:p.canister,medkit:p.medkit,mag:p.mag,reserve:p.reserve};
  if(action==='craft')assert.ok(beginCrafting(s,'medkit'));
  if(action==='heal')assert.ok(beginHealing(s));
  if(action==='reload')assert.ok(M.reload(s));
  at(s,{x:15,z:18});for(let i=0;i<120;i++)M.update(s,{},1/60);
  for(const k of Object.keys(before))assert.equal(p[k],before[k],action+'/'+k);
  assert.equal(p.craft,null);assert.equal(p.healing,null);assert.equal(p.reload,0);
 }
});
test('Ended expeditions cannot toggle underwater posture or surface through model actions',()=>{
 const s=game();at(s,{x:15,z:10});toggleSubmerge(s);s.status='dead';assert.equal(surfaceWater(s),false);assert.equal(toggleSubmerge(s),false);assert.equal(s.player.submerged,true);
});
test('All six Natatorium tasks have clear dry interaction points and each can be completed',()=>{
 const s=game(),d=W.CURRENT;
 const fuse=d.items.find(i=>i.objective==='cell');at(s,fuse);assert.equal(M.interact(s),false);toggleSubmerge(s);assert.ok(M.interact(s));
 at(s,d.items.find(i=>i.objective==='crank'));assert.ok(M.interact(s));
 for(const [i,q] of d.puzzle.wheels.entries()){at(s,q);let n=0;while(s.puzzle.wheels[i]!==d.puzzle.targets[i]&&n++<4)assert.ok(M.interact(s));}
 for(const t of d.tasks){at(s,t);assert.ok(!deepWater(s.player));assert.equal(W.solidAt(t.x,t.z),false,t.id+' embedded in geometry');assert.equal(taskTarget(s)?.id,t.id);assert.ok(M.interact(s),t.id);}
 assert.equal(s.completedTasks.length,6);at(s,d.exit);assert.ok(M.interact(s));assert.equal(s.status,'won');
});
