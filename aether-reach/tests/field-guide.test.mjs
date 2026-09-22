import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createState,saveState,nearby,interact,presentationSolids} from '../model.mjs';
import {NOTICE_MS,noticeAlpha,createNoticeFeed,readingPages,fieldGuidance,localMapPoint} from '../field-guide-core.mjs';
import {drawLiveMap} from '../field-guide.mjs';
import {cleanDiorama,dioramaHeight,openingState} from '../diorama-core.mjs';
import {cleanWorkspace,resetWorkspacePlacement} from '../rotunda-core.mjs';
import {FirstPersonWindow} from '../first-person-window.mjs';
import {eyeHeight} from '../skirmish-core.mjs';
import {readFileSync} from 'node:fs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('Interaction messages fully disappear at 2 seconds, even while simulation is paused',()=>{
 const feed=createNoticeFeed();feed.push('A real interaction',1000);const n=feed.current();assert.equal(NOTICE_MS,2000);
 assert.equal(noticeAlpha(n,1000),1);assert.equal(noticeAlpha(n,2499),1);near(noticeAlpha(n,2750),.5);near(noticeAlpha(n,2999),.002);assert.equal(noticeAlpha(n,3000),0);assert.equal(noticeAlpha(n,9000),0);
 for(let i=0;i<20;i++)assert.deepEqual(feed.current(),n);assert.equal(noticeAlpha(feed.current(),5000),0);
});
test('Reading current feedback never renews its lifetime; explicit new event does',()=>{
 const f=createNoticeFeed();f.push('Dial set',0);const old=f.current();assert.equal(noticeAlpha(f.current(),2000),0);f.push('Dial set',3000);assert(f.current().id>old.id);assert.equal(noticeAlpha(f.current(),3000),1);
});
test('Dismissed and expired messages remain in copied bounded history without storage or player writes',()=>{
 const f=createNoticeFeed();for(let i=0;i<50;i++)f.push('Event '+i,i*100);assert.equal(f.history().length,40);assert.equal(f.history()[0].text,'Event 10');const h=f.history();h[0].text='external mutation';assert.equal(f.history()[0].text,'Event 10');f.dismiss();assert.equal(f.current(),null);assert.equal(f.history().length,40);
});
test('Invalid messages and invalid clocks cannot create immortal notices',()=>{
 const f=createNoticeFeed();f.push('',0);f.push('   ',0);f.push('Bad time',NaN);assert.equal(f.current(),null);assert.equal(noticeAlpha({started:NaN},20),0);assert.equal(noticeAlpha({started:10},Infinity),0);
});
test('History pagination preserves every word of long interaction text',()=>{
 const s=Array.from({length:150},(_,i)=>'word'+i).join(' '),pages=readingPages(s);assert(pages.length>2);assert(pages.every(p=>p.length<=260));assert.equal(pages.join(' '),s);
});
test('Initial guidance identifies an actual nearby destination and does not require a purchase',()=>{
 const s=createState(),saved=saveState(s),raw=JSON.stringify(s),g=fieldGuidance(s,nearby(s));assert.equal(g.goal.id,'dispatch-board');assert.match(g.step,/Iona/);assert.match(g.step,/No weapon purchase/);assert.equal(g.goal.x,5);assert.equal(g.goal.z,-1);assert.equal(saveState(s),saved);assert.equal(JSON.stringify(s),raw);
});
test('Model fixture: real noticeboard interaction changes the guide from pickup to delivery',()=>{
 const s=createState();Object.assign(s.p,{x:5,z:0,y:.02});const n=nearby(s);assert.equal(n.id,'dispatch-board');const before=fieldGuidance(s,n,'X');assert.match(before.interaction,/^X \/ /);assert(interact(s));const g=fieldGuidance(s,nearby(s));assert.equal(g.goal.id,'market-board');assert.match(g.step,/west across the long stair/);assert(s.events.some(e=>e.type==='expedition-message'&&e.text.includes('dispatch')));
});
test('Nearby mechanism text is translated to the current interaction binding, not an invisible desktop key',()=>{
 const s=createState(),g=fieldGuidance(s,{id:'valve-0',label:'X / E - Turn supply dial'},'Right grip');assert.equal(g.interaction,'Right grip / Turn supply dial');assert.equal(g.interactionId,'valve-0');assert(g.canInteract);
});
test('Local map clamps a distant goal onto its edge without inventing a route',()=>{
 const p={x:0,z:0};assert.deepEqual(localMapPoint(p,{x:0,z:0}),{x:0,z:0,offMap:false});const m=localMapPoint(p,{x:200,z:-100});near(m.x,.88);near(m.z,-.44);assert(m.offMap);assert.equal(localMapPoint({x:190,z:-95},{x:200,z:-100}).offMap,false);
});
test('Live map reads current actor motion and true bounding-box solids without mutating state',()=>{
 const s=createState(),original=JSON.stringify(s),calls=[];const c=new Proxy({}, {get(o,k){if(k in o)return o[k];return(...args)=>{for(const n of args)if(typeof n==='number')assert(Number.isFinite(n));calls.push({op:k,args,fill:o.fillStyle});};}});
 const a=drawLiveMap(c,s,fieldGuidance(s,null).goal);assert(a);assert(calls.some(v=>v.op==='fillRect'&&v.fill==='#172f35'),'Actual solids must appear, not silently disappear from a mismatched shape schema');assert.equal(JSON.stringify(s),original);assert(presentationSolids(s).some(b=>Number.isFinite(b.x1)));
 s.p.x+=5;s.p.z+=2;const b=drawLiveMap(c,s,fieldGuidance(s,null).goal);assert.notDeepEqual(a,b);
});
test('Old diorama preferences retain placement and receive a 2.5-times-taller window',()=>{
 const c=cleanDiorama({mode:'diorama-ar',scale:.03,height:.7,yaw:.5,opening:'top'});near(c.scale,.03);near(c.height,.7);near(c.yaw,.5);near(dioramaHeight(c),87.5);near(dioramaHeight(c)*c.scale,2.625);assert.equal(c.opening,'top');assert(openingState(c.opening).topOpen);
});
test('Diorama size and height are bounded independently of menu and floor-map sizes',()=>{
 const c=cleanDiorama({scale:100,boxHeight:100});near(c.scale,.08);near(c.boxHeight,4);near(cleanDiorama({scale:-1,boxHeight:-1}).scale,.015);near(cleanDiorama({boxHeight:NaN}).boxHeight,2.5);assert.equal(cleanWorkspace({mapScale:8,scale:8}).mapScale,1.8);assert.equal(cleanWorkspace({scale:8}).scale,1.6);
});
test('Menu sizing migration preserves user status side, reduced motion, aim and map preferences',()=>{
 const old={height:.7,distance:1.4,scale:1.1,yaw:.2,hud:'right',motion:false,guidedAim:false};const c=cleanWorkspace(old);for(const[k,v]of Object.entries(old))assert.equal(c[k],v);assert(c.map);const reset=resetWorkspacePlacement({...c,map:false,mapScale:1.7});assert.equal(reset.map,false);assert.equal(reset.mapScale,1.7);assert.equal(reset.hud,'right');assert.equal(reset.guidedAim,false);
});
test('Taller first-person windows retain player-eye mapping and aim at the actual aperture center',()=>{
 for(const h of[35,87.5,140])for(const scale of[.015,.03,.08]){
  const s=createState(),before=saveState(s),head={x:.2,y:1.65,z:0},a={x:.2,y:.5,z:-1.45},w=new FirstPersonWindow(),rig=new T.Group();w.center(head,a,scale,h);w.sync(rig,s.p);
  const eye=new T.Vector3(head.x,head.y,head.z).applyMatrix4(rig.matrixWorld);near(eye.distanceTo(new T.Vector3(s.p.x,s.p.y+eyeHeight(s.p),s.p.z)),0);
  const center=new T.Vector3(0,h/2,0).applyMatrix4(w.boxMatrix(rig,a,scale));const d=center.sub(eye).normalize();near(d.distanceTo(new T.Vector3(0,0,-1)),0);assert.equal(saveState(s),before);
 }
});
test('Floor help is rendered, room-owned, absent from input hit tests, and read-only',()=>{
 const s=readFileSync(new URL('../field-guide.mjs',import.meta.url),'utf8');assert(s.includes('rig.add(root)'));assert(!s.includes('camera.add(')&&!s.includes('diorama.add('));assert(s.includes('map.tex.needsUpdate=true'));assert(s.includes('notice.tex.needsUpdate=true'));assert(s.includes('noticeAlpha(source,now)'));assert(s.includes('interactive:false'));assert(!s.includes('localStorage')&&!s.includes('raycaster'));
 const xr=readFileSync(new URL('../xr-session.mjs',import.meta.url),'utf8');assert(xr.includes('fieldGuide.update('));assert(xr.includes('now:performance.now()'));assert(xr.includes('fieldGuide:fieldGuide.stats()'));
});
