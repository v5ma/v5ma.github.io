import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,saveState,readSave,step,nearby,interact,chooseCity,groundAt,clearLine,SOLIDS,DISTRICTS,RAILS,BUILDINGS} from '../model.mjs';
import {PEOPLE,THINGS,ROOMS,CITY_GATES,STAIR,catPosition,CATS} from '../city-world.mjs';
import {conversation,cityChoice,cleanCity,levelInfo,trainAttribute,castMend,cityInteract,cityNearby,skiffDock} from '../city-state.mjs';
import {boardSkiff,parkSkiff} from '../skiff.mjs';
const place=(s,p)=>Object.assign(s.p,{...p,vx:0,vy:0,vz:0,grounded:true});
function atPerson(s,id){const n=PEOPLE.find(n=>n.id===id);place(s,{x:n.x,y:n.y,z:n.z-.65});return n;}
function atThing(s,id){const n=THINGS.find(n=>n.id===id);place(s,{x:n.x,y:n.y,z:n.z-.65});return n;}
function choose(s,id,c){atPerson(s,id);assert.equal(chooseCity(s,id,c),true,id+'/'+c);}
function touch(s,id){atThing(s,id);const n=THINGS.find(n=>n.id===id);const actual=cityNearby(s,(a,b)=>clearLine(a,b,s));assert.equal(actual?.id,id);assert.ok(cityInteract(s,actual));}
function walk(s,points){
 for(const [x,z] of points){let ticks=0;while(Math.hypot(s.p.x-x,s.p.z-z)>.11&&ticks++<2600){s.p.yaw=Math.atan2(x-s.p.x,-(z-s.p.z));step(s,{forward:true,explorer:true},1/120);}assert.ok(ticks<2600,`stuck ${s.p.x},${s.p.y},${s.p.z} towards ${x},${z}`);s.p.vx=s.p.vz=0;}
}
test('The old city remains and two connected populated districts extend it',()=>{
 assert.ok(['harbor','atrium','garden','foundry','spire','commons','skyyard'].every(id=>DISTRICTS.some(d=>d.id===id)));assert.equal(RAILS.length,8);assert.ok(ROOMS.length>=7);assert.ok(BUILDINGS.some(b=>b.id==='arrival'));
});
test('Cafe door is an aperture, its surrounding wall and upstairs mass remain solid',()=>{
 const s=createState();s.city.flags.push('cellar-key');
 assert.ok(clearLine({x:-10,y:1.4,z:3},{x:-10,y:1.4,z:7},s));
 assert.equal(clearLine({x:-14,y:1.4,z:3},{x:-14,y:1.4,z:7},s),false);
 assert.equal(clearLine({x:-10,y:5,z:3},{x:-10,y:5,z:7},s),false);
});
test('Walking through the cafe and down its real stairs reaches the same-map basement',()=>{
 const s=createState();place(s,{x:-10,y:0,z:2});walk(s,[[-10,6],[-9.5,7]]);
 choose(s,'nora','start-pumps');place(s,{x:-10,y:0,z:6.6});walk(s,[[-10,5.4],[-12.15,5.4],[-12.15,11.6],[-10,11.6]]);
 assert.ok(Math.abs(s.p.y+4.2)<.05);assert.equal(s.stats.rescues,0);
 walk(s,[[-12.15,11.3],[-12.15,5.4],[-10,5.4],[-10,2]]);
 assert.ok(Math.abs(s.p.y)<.05);assert.equal(s.stats.rescues,0);
});
test('The closed service gate and hangar reject passage until their own permits are set',()=>{
 const s=createState();for(const g of CITY_GATES){const a={x:(g.x1+g.x2)/2,y:g.y1+1.3,z:g.z1-.2},b={...a,z:g.z2+.2};assert.equal(clearLine(a,b,s),false);s.city.flags.push(g.requires);assert.ok(clearLine(a,b,s));}
});
test('One repaired pump rewards once, with actual fuse and console steps',()=>{
 const s=createState();choose(s,'nora','start-pumps');touch(s,'pump-valve');assert.ok(!s.city.flags.includes('pump-fixed'));touch(s,'pump-fuse');touch(s,'pump-valve');choose(s,'nora','finish-pumps');
 const old=s.kit.credits;atPerson(s,'nora');assert.equal(chooseCity(s,'nora','finish-pumps'),false);assert.equal(s.kit.credits,old);assert.equal(s.city.xp,100);
});
test('Cargo case requires evidence before an unarmed resolution; the permit opens the hangar',()=>{
 const s=createState();choose(s,'ada','start-cargo');atPerson(s,'rook');assert.ok(!conversation(s,'rook').choices.some(c=>c.id==='recover-coil'));choose(s,'nora','start-pumps');touch(s,'pump-fuse');touch(s,'pump-valve');choose(s,'nora','finish-pumps');touch(s,'cargo-ledger');choose(s,'rook','recover-coil');choose(s,'ada','finish-cargo');choose(s,'mayor','finish-permit');
 assert.ok(s.city.flags.includes('permit'));assert.deepEqual(s.city.done.sort(),['cargo','permit','pumps']);assert.equal(s.stats.shots,0);
});
test('NPC choices cannot be activated remotely or from outside an intact wall',()=>{
 const s=createState();assert.equal(chooseCity(s,'nora','start-pumps'),false);place(s,{x:-5.25,y:0,z:7});assert.equal(chooseCity(s,'nora','start-pumps'),false);assert.ok(!s.city.active.length);
});
test('Glyph puzzle order matters and learning the spell is a separate conversation',()=>{
 const s=createState();choose(s,'sel','start-resonance');touch(s,'glyph-star');assert.equal(s.city.glyphStep,0);touch(s,'glyph-root');touch(s,'glyph-tide');touch(s,'glyph-star');assert.ok(s.city.flags.includes('glyph-solved'));assert.ok(!s.city.flags.includes('mend'));choose(s,'sel','finish-resonance');s.p.health=20;const energy=s.p.energy;assert.ok(castMend(s));assert.equal(s.p.energy,energy-30);assert.ok(s.p.health>20);assert.equal(castMend(s),false);
});
test('Attribute points come from levels, spend once, and survive v1 save migration',()=>{
 const s=createState();assert.equal(trainAttribute(s,'vigor'),false);s.city.xp=220;assert.ok(trainAttribute(s,'vigor'));assert.ok(trainAttribute(s,'aviation'));assert.equal(trainAttribute(s,'resonance'),false);const r=createState(saveState(s));assert.equal(r.city.skills.vigor,1);assert.equal(r.city.skills.aviation,1);assert.equal(r.p.health,110);assert.equal(r.city.xp,220);
 const old=createState(JSON.stringify({version:1,relays:['garden'],checkpoint:'garden',kit:s.kit}));assert.equal(old.city.xp,0);assert.equal(old.checkpoint,'garden');assert.ok(old.relays.has('garden'));
});
test('Malformed saved city data cannot introduce arbitrary tasks or overspend points',()=>{
 const c=cleanCity({xp:100,skills:{vigor:3,aviation:3,resonance:3},flags:['script','permit','permit'],done:['anything','pumps','pumps']});assert.deepEqual(c.skills,{vigor:1,aviation:0,resonance:0});assert.deepEqual(c.flags,['permit']);assert.deepEqual(c.done,['pumps']);assert.equal(cleanCity({xp:NaN}).xp,0);
});
test('Adult companionship is optional and has no paid or mandatory romance path',()=>{
 const s=createState();s.city.done.push('cat','pumps');atPerson(s,'mara');const c=conversation(s,'mara');assert.ok(c.choices.some(c=>c.id==='friends'));assert.ok(c.choices.some(c=>c.id==='date'));const credits=s.kit.credits;choose(s,'mara','friends');assert.ok(s.city.flags.includes('friends'));assert.ok(!s.city.flags.includes('dating'));assert.equal(s.kit.credits,credits);assert.equal(s.city.xp,0);
});
test('Skiff needs its permit, moves continuously, and only disembarks at a real pad',()=>{
 const s=createState();place(s,s.skiff);assert.equal(boardSkiff(s),false);s.city.flags.push('permit');assert.ok(boardSkiff(s));const z=s.p.z;
 for(let i=0;i<240;i++)step(s,{rise:true},1/120);assert.ok(s.p.y>6);for(let i=0;i<120;i++)step(s,{forward:true},1/120);assert.ok(s.p.z<z-5);const p={x:s.p.x,y:s.p.y,z:s.p.z};parkSkiff(s);assert.equal(s.p.vehicle,'kestrel');assert.deepEqual({x:s.p.x,y:s.p.y,z:s.p.z},p);
});
test('Air mail cannot be turned in on foot without an actual vehicle arrival',()=>{
 const s=createState();s.city.flags.push('permit');choose(s,'ivo','start-airmail');touch(s,'mailbox-garden');assert.ok(!s.city.flags.includes('delivered'));place(s,{x:79,y:6,z:-12});s.p.vehicle='kestrel';parkSkiff(s);touch(s,'mailbox-garden');assert.ok(s.city.flags.includes('delivered'));choose(s,'ivo','finish-airmail');assert.ok(s.city.done.includes('airmail'));
});
test('The basement hole does not remove unrelated harbor floors or fill the sky gaps',()=>{
 assert.equal(groundAt(10,8).y,0);assert.ok(groundAt(-12.15,8).y< -1);assert.equal(groundAt(-8,8,-2).y,-4.2);assert.equal(groundAt(35,20).y,-Infinity);
});
