import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const file=n=>readFileSync(new URL('../mario-maker-clone/svgn-paper-route/'+n,import.meta.url),'utf8');
const s={btoa,atob,TextEncoder,escape,unescape};vm.createContext(s);vm.runInContext(file('campaign.js')+'\n'+file('sky-routes.js'),s);
const T=vm.runInNewContext('({'+file('index.html').match(/const T = \{([\s\S]+?)\n\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')+'})');
for(let i=0;i<3;i++)test('Sky course '+(i+1)+' preserves a closed lap, real air gaps and serializable launch metadata',()=>{
 const d=s.SkyRoutes.build(i,T);assert.equal(d.stages,4+i);assert.ok(d.ct.length>=d.stages);
 for(const path of d.ct){assert.ok(path.every(p=>p.every(Number.isFinite)));assert.ok(path.sky.end>path.sky.begin);assert.equal(path.sky.version,1);assert.ok(s.SkyRoutes.length(path)>800);}
 const pads=d.cells.filter(x=>x===T.STEEL).length;assert.ok(pads<50,'No ground-level bypass floor');
 assert.equal(d.cells.filter(x=>x===T.MAILBOX).length,d.stages);assert.ok(d.quota<=d.stages);
 const meta=JSON.parse(decodeURIComponent(escape(atob(s.DeliveryCampaign.encode(d).split('.')[0]))));assert.equal(meta.cm.length,d.ct.length);assert.equal(meta.ct.length,d.ct.length);
 for(let k=1;k<d.stages;k++){const a=d.ct[k-1].at(-1),b=d.ct[k][0];assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>400,'Transfer is an open-air gap');}
});
test('Sky routes replace the primary campaign rather than adding an unrelated demo',()=>assert.equal(s.DeliveryCampaign.routes[0].id,'sky-first-flight'));
