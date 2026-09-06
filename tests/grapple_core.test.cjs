const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const path=require('node:path').join(__dirname,'../mario-maker-clone/svgn-paper-route/');
const K=require(path+'grapple-core.js');
function rider(o={}){return {x:0,y:0,w:26,h:30,vx:8,vy:0,speed:0,roll:0,...o};}
test('Whip acquisition has finite reach and does not teleport on attach',()=>{const p=rider(),peg={id:'A',x:75,y:-45};const original={x:p.x,y:p.y};assert(K.cast(p,peg));assert.equal(p.x,original.x);assert.equal(p.y,original.y);assert(Math.abs(p.peg.r-Math.hypot(13-75,15+45))<1e-10);assert(!K.cast(rider(),{x:800,y:0}));});
test('A wall blocks the whip and a miss cannot latch',()=>{assert.equal(K.target(rider(),[{x:130,y:0}],x=>x>50&&x<60),null);assert.equal(K.cast(rider(),null),false);assert.equal(K.target(rider(),[{x:2000,y:0}]),null);});
test('Swing updates actual velocity and stays on the rope circle',()=>{const p=rider();K.cast(p,{x:70,y:-90});for(let i=0;i<300;i++){K.swing(p,{right:true});assert(Math.abs(Math.hypot(p.x+13-p.peg.x,p.y+15-p.peg.y)-p.peg.r)<1e-8);assert(Math.abs(p.vx-Math.cos(p.peg.th)*p.peg.om*p.peg.r)<1e-10);}assert(p.peg.loops>=1);assert(Number.isFinite(p.vx)&&Number.isFinite(p.vy));});
test('Release is tangential and capped; repeated release gives no boost',()=>{const p=rider();K.cast(p,{x:60,y:-90});for(let i=0;i<240;i++)K.swing(p,{right:true});const a={...p.peg},r=K.release(p);assert(r.speed<=26);assert(Math.abs(p.vx*Math.sin(a.th)+p.vy*Math.cos(a.th))<1e-8);const v=p.vx;assert.equal(K.release(p),null);assert.equal(p.vx,v);});
test('Reel in and out are bounded',()=>{const p=rider();K.cast(p,{x:0,y:-170});for(let i=0;i<500;i++)K.swing(p,{up:true});assert.equal(p.peg.r,48);for(let i=0;i<500;i++)K.swing(p,{down:true});assert.equal(p.peg.r,K.REACH);});
test('A swinging rider cannot pass through solid terrain',()=>{const p=rider();K.cast(p,{x:0,y:-80});const x=p.x,y=p.y;K.swing(p,{right:true},()=>true);assert.equal(p.peg,null);assert.equal(p.x,x);assert.equal(p.y,y);});
test('Open ramp leaves its real endpoint rather than wrapping',()=>{const t=K.rail([[0,0],[100,0],[140,-40]],{kind:'open'}),p=rider({track:t,trackS:t.len-2,speed:16});const r=K.ride(p,{right:true});assert.equal(r.type,'lip');assert.equal(p.track,null);assert(p.vx>0&&p.vy<0);assert(p.x>100);});
test('Swept one-sided rail catch works at high speed and rejects the underside',()=>{const t=K.rail([[0,100],[200,100]],{kind:'open',id:'A'}),p=rider({x:60,y:100,vx:15,vy:100,trackCD:0});assert(K.catchRail(p,{x:45,y:0},[t]));assert.equal(p.track,t);const u=rider({x:60,y:0,vx:15,vy:-100,trackCD:0});assert.equal(K.catchRail(u,{x:45,y:100},[t]),null);});
test('A short back-and-forth pump is not falsely counted as a revolution',()=>{const p=rider();K.cast(p,{x:13,y:-60});p.peg.th=p.peg.start+.3;for(let i=0;i<12;i++)K.swing(p,{left:true});assert.equal(p.peg.loops,0);});
const sandbox={TextEncoder,btoa,atob,escape,unescape};vm.createContext(sandbox);for(const file of ['campaign.js','sky-routes.js','open-course.js'])vm.runInContext(fs.readFileSync(path+file,'utf8'),sandbox);
const source=fs.readFileSync(path+'index.html','utf8');const T=vm.runInNewContext('({'+source.match(/const T = \{([\s\S]+?)\n\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')+'})');
test('New featured route has four genuinely open surfaces, pegs, and no bypass floor',()=>{
 const r=sandbox.OpenCourse.build(3,T);assert.equal(r.ct.length,4);
 assert(r.ct.every(p=>p.sky.kind==='open'&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])>200));assert.equal(r.cells.filter(t=>t===T.PEG).length,2);
 // Check WHERE solid floor exists, not a brittle count that forbids extending
 // the final landing pad while saying nothing about a mid-course bypass.
 const floor=[];r.cells.forEach((t,i)=>{if(t===T.STEEL)floor.push({x:i%r.width,y:Math.floor(i/r.width)});});
 assert.equal(floor.length,40);
 assert(floor.every(p=>(p.x>=1&&p.x<5&&p.y===59)||(p.x>=130&&p.x<148&&(p.y===64||p.y===65))));
 assert(!floor.some(p=>p.x>=5&&p.x<130));assert.equal(sandbox.DeliveryCampaign.routes.length,4);
});
test('Saved blueprints retain open-ramp metadata without changing original routes',()=>{const r=sandbox.OpenCourse.build(3,T),meta=JSON.parse(Buffer.from(sandbox.DeliveryCampaign.encode(r).split('.')[0],'base64'));assert(meta.cm.every(t=>t.kind==='open'));assert.equal(sandbox.DeliveryCampaign.build(0,T).stages,4);assert.equal(sandbox.DeliveryCampaign.build(2,T).stages,6);});
