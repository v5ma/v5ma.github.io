/* Mocked UI/worker protocol tests only. Native rendering has its own suite. */
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/ride-guide.js','utf8');
function harness(){
 const elements=new Map(),workers=[],arcs=[];let strokes=0;
 const pen=new Proxy({arc(...v){arcs.push(v);},stroke(){strokes++;}},{get(t,p){return t[p]??(()=>{});},set(t,p,v){t[p]=v;return true;}});
 const el=()=>({hidden:false,textContent:'',clientWidth:800,clientHeight:600,setAttribute(){},append(...a){for(const o of a)elements.set(o.id,o);},getContext(){return pen;}});
 const stage=el(),actions=el();
 class Worker{constructor(){workers.push(this);}postMessage(m){this.sent=m;}terminate(){this.terminated=true;}}
 class Vector3{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}project(){this.x/=100;this.y/=100;this.z=0;return this;}}
 const rail={pts:[[0,0],[10,0]],sky:{id:'one',kind:'open'}};
 const c={window:null,document:{getElementById(id){return id==='stagewrap'?stage:elements.get(id);},createElement:el,querySelector(){return actions;}},Worker,performance:{now:()=>0},setTimeout(){return 1;},clearTimeout(){},mode:'play',won:false,keys:{KeyD:true},devicePixelRatio:1,cv:{focus(){}},tracks:[rail],LW:1,LH:1,pg:()=>0,levelCode:()=>'',SOLID:new Set([1]),RailGripCore:{mode:'forgiving'},WorkshopCore:{decode(){return {cells:[0],paths:[]};},encode:()=> 'copied'},RouteWorkshop:{active:false},__sky:{active:()=>true,state:{steps:100}},__delivery:{state:{menu:false},paused:false},__merged:{THREE:{Vector3},camera:{isPerspectiveCamera:true}},player:{x:0,y:0,w:26,h:30,vx:7,vy:0,track:rail,speed:7,onGround:true,_railFace:1},render(){},addEventListener(){}};
 c.window=c;vm.createContext(c);vm.runInContext(code,c);
 function reply(worker=workers.at(-1)){
  worker.onmessage({data:{id:worker.sent.id,traces:[{status:'horizon',frames:[{tick:0,x:0,y:0},{tick:1,x:1000,y:10}],events:[{type:'catch',tick:1,face:1}]}]}});
 }
 return {c,elements,workers,arcs,reply,strokes:()=>strokes};
}
test('The live guide is opt-in and sends copied state without altering the actor',()=>{
 const h=harness(),before=JSON.stringify(h.c.player);h.c.render();assert.equal(h.workers.length,0);h.c.RideGuide.toggle();h.c.render();assert.equal(h.workers.length,1);assert.notEqual(h.workers[0].sent.liveSeed,h.c.player);h.reply();h.c.render();assert.equal(JSON.stringify(h.c.player),before);assert.ok(h.strokes()>0);
});
test('A control or precision-mode change hides stale estimates instead of relabeling them',()=>{
 const h=harness();h.c.RideGuide.toggle();h.c.render();h.reply();h.c.render();const n=h.strokes();h.c.keys.KeyD=false;h.c.keys.KeyA=true;h.c.render();assert.equal(h.strokes(),n);assert.match(h.elements.get('ride-guide-note').textContent,/Updating/);h.c.keys.KeyA=false;h.c.keys.KeyD=true;h.c.RailGripCore.mode='precision';h.c.render();assert.equal(h.strokes(),n);
});
test('Offscreen receiving contacts get a bounded on-screen cue',()=>{
 const h=harness();h.c.RideGuide.toggle();h.c.render();h.reply();h.c.render();const [x,y]=h.arcs.at(-1);assert.ok(x>=24&&x<=776);assert.ok(y>=45&&y<=490);assert.match(h.elements.get('ride-guide-note').textContent,/beyond view/);
});
test('Turning the guide off terminates work and ignores a late reply',()=>{
 const h=harness();h.c.RideGuide.toggle();h.c.render();const w=h.workers[0];h.c.RideGuide.toggle();assert.equal(w.terminated,true);h.reply(w);assert.equal(h.c.RideGuide.result,null);assert.equal(h.elements.get('ride-guide').hidden,true);
});
