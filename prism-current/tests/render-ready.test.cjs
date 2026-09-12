/* Renderer lifecycle fixtures. Native suites still verify the actual GPU path. */
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({renderError=false,slow=false}={}){let time=0,allocations=0,freed=0,updates=0,prepares=0,disposed=false;const vector=()=>({set(){},setScalar(){}});
 class Scene{constructor(){this.children=[]}add(o){this.children.push(o)}}
 class Camera{constructor(){this.position=vector()}updateMatrixWorld(){}}
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position=vector();this.scale=vector()}}
 class Geometry{dispose(){freed++}}
 class Target{constructor(){allocations++}dispose(){freed++}}
 const T={Scene,PerspectiveCamera:Camera,Mesh,Points:Mesh,PlaneGeometry:Geometry,WebGLRenderTarget:Target};
 const prior={},r={target:prior,xr:{enabled:true},compileAsync:async()=>{},getRenderTarget(){return this.target},setRenderTarget(t){this.target=t},render(){if(renderError)throw Error('draw failed')}};
 const scene={renderer:r,camera:{},object3D:{updateMatrixWorld(){},traverse(){}}};
 const update=()=>updates++,art={T,graphics:{disposed:false},prepare:async()=>{prepares++},dispose(){disposed=true},update,fx:{trail:[{},{}],blade:[{},{}],crystal:[{},{}]}};
 const c={performance:{now:()=>time},requestAnimationFrame:fn=>queueMicrotask(()=>{time+=slow?250:16;fn(time)}),console};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../render-ready.js','utf8'),c);c.PrismRenderReady.install(art,scene);
 return {art,r,prior,update,get allocations(){return allocations},get freed(){return freed},get prepares(){return prepares},get disposed(){return disposed}};
}
test('Silent warmup restores the render target, XR flag and update callback',async()=>{const f=fixture();await f.art.prepare({song:{},judged:{}});A.equal(f.prepares,1);A.equal(f.r.target,f.prior);A.equal(f.r.xr.enabled,true);A.equal(f.art.update,f.update);});
test('Repeated preparation reuses the tiny offscreen target',async()=>{const f=fixture();await f.art.prepare({});await f.art.prepare({});A.equal(f.allocations,1);f.art.dispose();A.equal(f.disposed,true);A.equal(f.freed,3);});
test('A failed offscreen draw restores renderer and frees temporary geometry',async()=>{const f=fixture({renderError:true});await A.rejects(f.art.prepare({}),/draw failed/);A.equal(f.r.target,f.prior);A.equal(f.r.xr.enabled,true);A.equal(f.art.update,f.update);A.equal(f.freed,1);});
test('Unsteady preparation reports a bounded failure instead of relaxing gameplay limits',async()=>{const f=fixture({slow:true});await A.rejects(f.art.prepare({}),/Choose Light graphics/);A.equal(f.art.update,f.update);A.equal(f.r.target,f.prior);});
test('Disposed art does not allocate a new warmup target',async()=>{const f=fixture();f.art.graphics.disposed=true;await f.art.prepare({});A.equal(f.allocations,0);});
