const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/ground-art.js','utf8'),ctx);
function draw(cells){const calls=[],batch={box(...a){calls.push(a);},rod(){},ell(){},cone(){}},noop={box(){},rod(){},ell(){},cone(){}};ctx.GroundArt.populate({course:{gp:{style:'village'},name:'Edited draft',ground:2,width:5,height:4,cells},metal:batch,terrain:noop,greenery:noop,far:noop,kit:{tree(){},flowers(){}},sign(){}});return calls.filter(a=>a[5]===82);}
test('Edited ground art follows real occupied tiles rather than drawing an invisible bridge',()=>{
 const a=new Uint8Array(20);a.fill(1,10);assert.equal(draw(a).length,2);
 a[12]=0;a[17]=0;const boxes=draw(a);assert.equal(boxes.length,4);
 for(const b of boxes)assert.ok(!(b[0]-b[3]/2<90&&b[0]+b[3]/2>90),'No solid-looking visual crosses the erased column');
 assert.equal(boxes.reduce((n,b)=>n+b[3]/36,0),8);
});
