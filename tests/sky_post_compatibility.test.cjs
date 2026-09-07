/* Run the retained route fixtures against the additive relay builder too. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const F=require('./helpers/flow-fixture.cjs');const c=F.context();
if(!c.SkyPostRoute)vm.runInContext(fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/sky-post-route.js','utf8'),c);
for(const route of c.FlowRouteData.routes)test('Sky Post leaves '+route.id+' continuously rideable in both catch settings',()=>{
 for(const mode of ['precision','forgiving']){
  const result=F.replay(c,route,{mode});assert.equal(result.exit,'road');assert.deepEqual(result.visits,Array.from(route.expected));assert.deepEqual(result.warnings,[]);
 }
});
test('All three full featured documents retain every source field through portable export',()=>{
 const W=c.WorkshopCore;
 for(let i=4;i<=6;i++){
  const d=c.DeliveryCampaign.build(i,F.T),code=c.DeliveryCampaign.encode(d),doc=W.decode(code),out=W.encode(doc);
  const meta=x=>JSON.parse(decodeURIComponent(escape(atob(x.split('.')[0]))));
  assert.deepEqual(meta(out),meta(code));assert.deepEqual(Array.from(doc.cells),Array.from(d.cells));assert.equal(doc.paths.length,i===4?16:i===5?54:62);
  if(i===4)assert.equal(doc.extra.gp.skyPost.receiver,'sky-post');
 }
});
