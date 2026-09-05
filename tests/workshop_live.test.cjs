'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../mario-maker-clone/svgn-paper-route/');
const W=require(root+'workshop-core.js');
const T=vm.runInNewContext('({'+fs.readFileSync(root+'index.html','utf8').match(/const T = \{([\s\S]+?)\n\};/)[1]+'})');
const s={btoa,atob,escape,unescape,TextEncoder,stepPlayer(){}};vm.createContext(s);
for(const file of ['campaign.js','sky-routes.js','grapple-core.js','open-course.js','ground-courses.js','sky-network-layout.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),s);
const decodeMeta=c=>JSON.parse(decodeURIComponent(escape(atob(c.split('.')[0]))));
for(let i=4;i<=6;i++)test('Featured world '+i+' retains every curve, terrain tile, peg, neighbor and original soundtrack',()=>{
 const d=s.DeliveryCampaign.build(i,T),original=s.DeliveryCampaign.encode(d),doc=W.decode(original),out=W.encode(doc),a=decodeMeta(original),b=decodeMeta(out);
 assert.deepEqual(a,b);assert.deepEqual(Array.from(W.decode(out).cells),Array.from(d.cells));assert.ok(doc.paths.length>=40);assert.deepEqual(a.gp.skyNetwork,b.gp.skyNetwork);assert.deepEqual(a.gp.cast,b.gp.cast);assert.equal(a.m,b.m);
});
test('Native original expert blueprints remain representable without conversion to ground levels',()=>{for(let i=0;i<4;i++){const original=s.DeliveryCampaign.encode(s.DeliveryCampaign.build(i,T)),doc=W.decode(original);assert.deepEqual(decodeMeta(W.encode(doc)),decodeMeta(original));assert.equal(doc.extra.gp,undefined);}});
test('Grounded starter has optional rails, a finish, working music metadata and no forced sky goal',()=>{const d=W.starter(),checks=W.check(d);assert.equal(checks.errors.length,0);assert.equal(d.extra.gp.quota,0);assert.equal(d.extra.gp.stages,0);assert.equal(d.music,'morning');assert.ok(d.cells.includes(60));assert.equal(d.paths.length,2);for(let x=0;x<d.w;x++)assert.equal(d.cells[60*d.w+x],1);W.decode(W.encode(d));});
test('Transforms, reshape, duplicate and delete retain stable route IDs and prune only invalid links',()=>{
 const d=W.decode(s.DeliveryCampaign.encode(s.DeliveryCampaign.build(4,T))),id=d.paths[0].meta.id,other=d.paths[1].meta.id;
 const metadata=JSON.stringify(d.paths[0].meta);W.transform(d.paths[0],{dx:18,angle:.2});W.deform(d.paths[0],20,5,10);assert.equal(JSON.stringify(d.paths[0].meta),metadata);
 const copy=W.clone(d.paths[0]);W.tagNew(d,copy);d.paths.push(copy);assert.notEqual(copy.meta.id,id);assert.equal(d.paths[1].meta.id,other);W.syncNetwork(d);
 d.paths=d.paths.filter(p=>p.meta.id!==other);W.syncNetwork(d);assert.ok(d.extra.gp.skyNetwork.links.every(l=>l.from!==other&&l.to!==other));assert.ok(d.paths.some(p=>p.meta.id===id));
});
test('Rapid terrain brushes interpolate across skipped pointer positions and Start stays unique',()=>{const d=W.starter();W.paintLine(d,[40,400],[800,400],2);for(let x=1;x<=22;x++)assert.equal(d.cells[11*d.w+x],2);W.paintLine(d,[36,500],[300,500],15);assert.equal(d.cells.filter(t=>t===15).length,1);});
test('Joining a reversed multiselection never removes the wrong piece',()=>{const d=W.starter();d.paths.push(W.tagNew(d,W.piece('shelf',1700,1900)));const untouched=d.paths[1].meta.id;W.join(d,[2,0]);assert.equal(d.paths.length,2);assert.ok(d.paths.some(p=>p.meta.id===untouched));assert.equal(d.paths[0].meta.kind,'open');W.validate(d);});
test('Every listed piece yields finite actual geometry and can be edited and exported',()=>{const d=W.starter();for(const {id}of W.PARTS){const p=W.tagNew(d,W.piece(id,600,1500));W.transform(p,{dx:18,dy:18,sx:1.1,sy:.9,angle:.2});d.paths.push(p);}W.decode(W.encode(d));});
test('History covers tiles and curve/metadata changes together, and editing after undo removes redo',()=>{const d=W.starter(),initial=W.encode(d),h=new W.History(initial);d.cells[42]=60;W.transform(d.paths[0],{dx:40});h.push(W.encode(d));const changed=h.items[1];assert.equal(h.undo(),initial);assert.equal(h.redo(),changed);h.undo();d.name='Alternate';h.push(W.encode(d));assert.equal(h.redo(),W.encode(d));});
test('Resizing retains occupied terrain and refuses to crop real geometry',()=>{const d=W.starter(),old=Array.from(d.cells);W.resize(d,112,75);for(let y=0;y<68;y++)for(let x=0;x<96;x++)assert.equal(d.cells[y*112+x],old[y*96+x]);assert.throws(()=>W.resize(d,20,68));assert.throws(()=>W.resize(d,10000,10000));});
test('Invalid imports are bounded and rejected before touching the live engine',()=>{
 for(const c of ['', 'x.y.z', 'aaaa.aaaa', 'a'.repeat(4000001)])assert.throws(()=>W.decode(c));
 const mk=(m,raw)=>btoa(JSON.stringify(m))+'.'+btoa(raw);
 assert.throws(()=>W.decode(mk({w:999999999,h:999999999},'\x00\x01')));
 assert.throws(()=>W.decode(mk(JSON.parse('{"w":16,"h":12,"__proto__":{"poison":true}}'),'\0\xC0')));
 assert.throws(()=>W.decode(mk({w:16,h:12,ct:[[[0,'string'],[1,2]]]},'\0\xC0')));
 const d=W.starter();d.extra.gp.cast=[{id:'x',name:'Unsafe',text:'x',x:NaN,y:40}];assert.throws(()=>W.encode(d));
});
test('Unexposed ordinary extension fields and Bezier handles survive a no-op round trip',()=>{const d=W.starter();d.extra.customSource={title:'Original project',version:2};d.paths[0].anchors=[[20,30,40,50],[60,70,20,-30]];const code=W.encode(d);assert.equal(W.encode(W.decode(code)),code);});

// Run the real native serializer from the shipped HTML, not a reimplementation.
function nativeLevelEncoderFixture(w,h,tiles,name){
 const fs=require('node:fs'),vm=require('node:vm');
 const html=fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/index.html','utf8');
 const a=html.indexOf('function levelCode(){'),b=html.indexOf('\nfunction loadCode(',a);
 if(a<0||b<a)throw Error('Native encoder was not found');
 const ctx={grid:tiles,LW:w,LH:h,nameEl:{value:name},physName:'platform',themeName:'dawn',musicName:'morning',customTracks:[],btoa,b64e:s=>btoa(unescape(encodeURIComponent(s)))};
 vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);
 const [meta,body]=ctx.levelCode().split('.'),raw=atob(body),out=[];
 for(let i=0;i<raw.length;i+=2)for(let j=0;j<raw.charCodeAt(i+1);j++)out.push(raw.charCodeAt(i));
 return {meta:JSON.parse(decodeURIComponent(escape(atob(meta)))),tiles:out};
}
test('Native levelCode handles a maximal high-entropy Workshop map',()=>{
 const tiles=Uint8Array.from({length:640*280},(_,i)=>i%2?2:1);
 const out=nativeLevelEncoderFixture(640,280,tiles,'Large map');
 assert.deepEqual(out.tiles,Array.from(tiles));assert.equal(out.meta.w,640);assert.equal(out.meta.h,280);
});
test('Native save chunking retains RLE boundaries and UTF-8 metadata',()=>{
 const tiles=new Uint8Array(96*68);tiles.fill(1,255,512);tiles[89]=15;tiles[900]=8;
 const out=nativeLevelEncoderFixture(96,68,tiles,'Route \u00e9tendue');
 assert.deepEqual(out.tiles,Array.from(tiles));assert.equal(out.meta.n,'Route \u00e9tendue');
});
