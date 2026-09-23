import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createChannelView} from './open-channel-view.mjs';
import {fresh} from './core.mjs';
import {PortalMaterials} from './portal.mjs';
function fixture(){
 const world=new T.Group(),texts=[],canvas={width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(t){texts.push(t);}})};
 const box=(g,c,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c}));m.position.set(x,y,z);g.add(m);return m;};
 const label=(t,x,y,z,w,h,bg,c,g)=>box(g,0xffffff,x,y,z,w,h,.01);
 const view=createChannelView({world,box,label,createCanvas:()=>canvas});return {world,texts,view};
}
test('Actual Three circuit objects are world-space, portal-compatible and dormant outside the case',()=>{
 const f=fixture(),s=fresh();f.view.update(s);assert.equal(f.view.inspect().visible,false);assert.equal(f.view.inspect().controlCount,3);const portal=new PortalMaterials();portal.collect(f.world);assert.ok(portal.entries.size>=7);
 s.campaign.active='channel';s.campaign.progress.channel=1;const before=JSON.stringify(s);f.view.update(s,1.1);assert.equal(f.view.inspect().visible,true);assert.equal(JSON.stringify(s),before);assert.ok(f.texts.includes('2 FREE / 3 REQUIRED'));assert.ok(f.texts.some(t=>/BOTH ROUTES WORK/.test(t)));
});
test('Power diagram redraws only on circuit changes and reports restoration without color dependence',()=>{
 const f=fixture(),s=fresh();s.campaign.active='channel';s.campaign.progress.channel=1;f.view.update(s);for(let i=0;i<60;i++){s.time+=1/60;f.view.update(s,i*.1);}assert.equal(f.view.inspect().diagramDraws,1);
 s.campaign.routing.street=false;f.view.update(s);assert.equal(f.view.inspect().diagramDraws,2);assert.ok(f.texts.includes('4 FREE / 3 REQUIRED'));assert.ok(f.texts.includes('PUBLIC LIGHTS 0 UNITS / DIVERTED'));
 s.campaign.progress.channel=3;s.campaign.routing.street=true;s.campaign.routing.outcome='transfer';f.view.update(s);assert.ok(f.texts.includes('PUBLIC SERVICE RESTORED'));f.view.dispose();assert.equal(f.world.children.length,0);
});
