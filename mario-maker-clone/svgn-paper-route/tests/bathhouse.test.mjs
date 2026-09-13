import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {SPEC,ID,RAIL,VALVE,DRAIN_TICKS,make,fresh,operate,observe,sanitize,settle,waterline,status} from '../bathhouse-core.mjs';
const require=createRequire(import.meta.url),{context,T}=require('../../../tests/helpers/flow-fixture.cjs');
const c=context(),d=make(T);
test('deterministic new destination has its own stable identity',()=>{assert.equal(d.id,ID);assert.equal(d.kind,'ground');assert.deepEqual(make(T),d);});
test('dry promenade is continuous underneath every route column',()=>{for(let x=0;x<d.width;x++)assert.equal(d.cells[60*d.width+x],T.STEEL);});
test('spawn, return portal, five mailboxes and four checkpoints exist',()=>{const a=[...d.cells];assert.equal(a.filter(v=>v===T.START).length,1);assert.equal(a.filter(v=>v===T.GOAL).length,1);assert.equal(a.filter(v=>v===T.MAILBOX).length,5);assert.equal(a.filter(v=>v===T.CHECK).length,4);assert.equal(d.quota,0);});
test('new authoring metadata is serializable and preserves the sluice identity',()=>{const code=c.GroundCampaign.encode(d),copy=c.WorkshopCore.decode(c.WorkshopCore.encode(c.WorkshopCore.decode(code)));assert.equal(copy.extra.gp.bathhouse.id,ID);assert.equal(copy.paths[0].meta.id,RAIL);assert.equal(copy.cells.length,d.cells.length);});
test('constructing Tideglass leaves all existing authored routes unchanged',()=>{const before=[0,1,2,3,4,5,6].map(i=>c.DeliveryCampaign.encode(c.DeliveryCampaign.build(i,T)));make(T);assert.deepEqual(before,[0,1,2,3,4,5,6].map(i=>c.DeliveryCampaign.encode(c.DeliveryCampaign.build(i,T))));});
test('waterline geometry is finite and clear of the dry road',()=>{const p=waterline();assert.equal(p.length,73);assert(p.every(q=>q.every(Number.isFinite)&&q[1]+34<=2110));});
test('the valve rejects distant interaction and dead riders',()=>{const s=fresh();assert(!operate(s,{x:0,y:2130}));assert(!operate(s,{x:VALVE,y:1800}));assert(!operate(s,{x:VALVE,y:2130,dead:1}));assert(!s.opened);});
test('a nearby explicit interaction opens the sluice only once',()=>{const s=fresh();assert(operate(s,{x:VALVE,y:2130}));assert(!operate(s,{x:VALVE,y:2130}));assert.equal(s.drain,0);});
test('drain is bounded and advances only with observed simulation ticks',()=>{const s=fresh();operate(s,{x:VALVE,y:2130});for(let i=0;i<1000;i++)observe(s,{});assert.equal(s.drain,DRAIN_TICKS);});
test('closed sluice cannot award a waterline discovery',()=>{const s=fresh();for(let i=0;i<30;i++)observe(s,{rail:RAIL,s:i*10});assert.equal(s.rode,false);});
function opened(){const s=fresh();operate(s,{x:VALVE,y:2130});for(let i=0;i<DRAIN_TICKS;i++)observe(s,{});return s;}
test('brief contact does not satisfy the sustained riding challenge',()=>{const s=opened();observe(s,{rail:RAIL,s:20});observe(s,{rail:RAIL,s:30});assert(!s.rode);});
test('observed forward riding satisfies the optional discovery',()=>{const s=opened();for(let i=0;i<20;i++)observe(s,{rail:RAIL,s:i*10});assert(s.rode);});
test('fake and backward track travel do not satisfy discovery',()=>{const s=opened();for(let i=0;i<20;i++)observe(s,{rail:'unknown',s:i*20});for(let i=0;i<20;i++)observe(s,{rail:RAIL,s:600-i*20});assert(!s.rode);});
test('accepted road-only finish saves visit without granting keeper seal',()=>{const s=fresh();observe(s,{});const r=settle({},s,true);assert(r.banked);assert.equal(r.record.visits,1);assert.equal(r.record.keeper,false);});
test('keeper reward requires actual discovery plus accepted finish',()=>{const s=opened();for(let i=0;i<20;i++)observe(s,{rail:RAIL,s:i*10});assert(!settle({},s,false).banked);const r=settle({},s,true);assert(r.fresh&&r.record.keeper);assert(!settle(r.record,s,true).banked);});
test('bad persisted values never confer a seal or unbounded visits',()=>{assert.deepEqual(sanitize({keeper:'yes',visits:-50}),{keeper:false,visits:0});assert.equal(sanitize({visits:Infinity}).visits,0);});
test('unobserved finish cannot bank progress',()=>assert(!settle({},fresh(),true).banked));
test('status text distinguishes sluice, draining and open rail',()=>{const s=fresh();assert(status(s).includes('brass'));operate(s,{x:VALVE,y:2130});assert(status(s).includes('draining'));for(let i=0;i<DRAIN_TICKS;i++)observe(s,{});assert(status(s).includes('Jump'));});
for(const speed of [5,7.5,10])for(const offset of [90,120,150])test(`carried-state branch model: speed ${speed}, takeoff ${offset}`,()=>{const K=c.RailGripCore.create().physics,rail=K.rail(d.ct[0],d.ct[0].sky),p={x:2260-offset,y:2130,w:26,h:30,vx:speed,vy:-13,trackCD:0,_airTicks:0,onGround:false,roll:0},s=opened();let hit=false,landing=null;
for(let tick=0;tick<400;tick++){const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;if(p.track){K.ride(p,{right:true});}else{if(!hit){p.vy=Math.min(13,p.vy+.55);p.x+=p.vx;p.y+=p.vy;}else K.flight(p,{right:true});p._airTicks++;if(K.catchRail(p,old,[rail],hit?RAIL:null))hit=true;}observe(s,{rail:p.track?.sky.id,s:p.trackS});if(!p.track&&p.y+p.h>=2160){landing=p.x;break;}}
assert(hit&&s.rode);assert(landing>2690&&landing<3100);});
