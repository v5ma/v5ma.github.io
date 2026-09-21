/* Runtime/lifecycle tests with a mocked, translation-only scene and device API.
 * Not rendering, general 3D transform, live gameplay, or hardware acceptance.
 * Production threshold.js is installed unchanged inside this isolated fixture. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../threshold-model.js'),Surestep=require('../surestep-model.js');
class V {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} set(x,y,z){Object.assign(this,{x,y,z});return this;} setScalar(v){return this.set(v,v,v);} copy(v){return this.set(v.x,v.y,v.z);} clone(){return new V(this.x,this.y,this.z);} add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;} lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;} length(){return Math.sqrt(this.lengthSq());} normalize(){return this.multiplyScalar(1/(this.length()||1));} applyQuaternion(){return this;} applyAxisAngle(_,a){const x=this.x,z=this.z;this.x=x*Math.cos(a)+z*Math.sin(a);this.z=z*Math.cos(a)-x*Math.sin(a);return this;} toArray(){return [this.x,this.y,this.z];}
}
class Q {copy(){return this;}clone(){return new Q();}}
class Group {
 constructor(){this.children=[];this.position=new V();this.scale=new V(1,1,1);this.quaternion=new Q();this.rotation={set(){}};this.visible=true;}
 add(...xs){for(const x of xs){x.removeFromParent?.();x.parent=this;this.children.push(x);}return this;}
 removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
 updateMatrixWorld(){} getWorldQuaternion(q){return q;}getWorldPosition(v){v.copy(this.position);let p=this.parent;while(p){v.add(p.position);p=p.parent;}return v;}
 worldToLocal(v){const p=this.getWorldPosition(new V());v.x-=p.x;v.y-=p.y;v.z-=p.z;return v;}
}
class Geometry {constructor(w=1,h=1){this.parameters={width:w,height:h};}dispose(){}}
class Material {constructor(p={}){Object.assign(this,p);this.color={set(){}};}dispose(){}}
class Mesh extends Group {constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
function fixture(ar=false){
 const T={Group,Mesh,Vector3:V,Quaternion:Q,Color:class{},MeshBasicMaterial:Material,CylinderGeometry:Geometry,BoxGeometry:Geometry,TorusGeometry:Geometry,PlaneGeometry:Geometry,DoubleSide:2};
 const elements={'handedness':{value:'left'},'controls-button':{after(){}}},writes=new Map(),labels=[];
 const ctx=new Proxy({}, {get(_,k){if(k==='fillText')return text=>labels.push(text);return ()=>{};},set(){return true;}});
 const ref={addEventListener(){},removeEventListener(){}},session={visibilityState:'visible',inputSources:[],end:null};
 const scene=new Group(),rig=new Group(),head=new Group();head.position.y=1.65;scene.add(rig);rig.add(head);
 let joints=.05,validViewer=true,flush=true,notice='',exits=0,resolveEnd=null;
 const g={T,scene:{object3D:scene,renderer:{xr:{getSession:()=>session,getReferenceSpace:()=>ref}},frame:{getViewerPose:()=>validViewer?{}:null,getJointPose:s=>({transform:{position:{x:s==='thumb-tip'?0:joints,y:0,z:0}}})}},rig,head:{object3D:head},game:{phase:'playing',p:[0,0,0],health:83,ammo:{plain:Infinity},score:90},running:true,paused:true,xr:true,arExpedition:ar,menuSelection:0,xrMenuRows:[],hands:{},prevButtons:{},returningBell:{state:{table:false}},goldwind:{reset(){}},questHands:{state:{active:false,sources:new Map()},rays:{},dots:{}},blackout:{material:{opacity:0}},checkpoint:{eligible:true,flush:()=>flush},cancel(){},remove(){},visuals(){},tracked(){},processXR(){},toast(){},makePanel(w=1024,h=768,width=1.55,height=1.16){return {ctx,texture:{dispose(){}},mesh:new Mesh(new Geometry(width,height),new Material())};}};
 g.xrPanel=g.makePanel();scene.add(g.xrPanel.mesh);
 g.dominionControls={state:{xrScreen:'main',xrNeutral:false},rays:{},setScreen(name){this.state.xrScreen=name;g.menuSelection=0;g.drawMenu();},notice(text){notice=text;this.setScreen('notice');}};
 g.drawMenu=()=>{g.xrMenuRows=[['Resume',()=>{}],['Exit VR',()=>{}]];};
 g.placePanel=()=>{g.xrPanel.mesh.visible=true;};g.setPaused=x=>{g.paused=!!x;};
 g.exitXR=()=>{g.xr=false;head.position.set(0,1.65,0);g.xrPanel.mesh.visible=false;exits++;};
 session.end=()=>new Promise(r=>{resolveEnd=()=>{g.exitXR();r();};});
 const box={VesperThresholdModel:M,VesperSurestep:Surestep,document:{getElementById:id=>elements[id],createElement:()=>({remove(){}})},localStorage:{getItem:k=>writes.get(k)||null,setItem:(k,v)=>writes.set(k,v)}};
 vm.createContext(box);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../threshold.js'),'utf8'),box);g.threshold=box.VesperThreshold.install(g);
 function step(){g.processXR(.03,head.getWorldPosition(new V()));g.visuals();}
 function optical(){session.inputSources=[{handedness:'right',hand:{get:name=>name}}];g.hands={};}
 return {g,labels,writes,session,step,optical,begin:()=>g.threshold.begin(),setJoints:x=>joints=x,setVisible:x=>session.visibilityState=x?'visible':'hidden',setViewer:x=>validViewer=x,setSave:x=>flush=x,notice:()=>notice,finish:()=>resolveEnd(),exits:()=>exits,floor:()=>g.threshold.stage.children[1]};
}
test('Failed checkpoint keeps the expedition available and the doorway closed',()=>{const h=fixture();h.setSave(false);h.begin();assert.equal(h.g.threshold.state.phase,'game');assert.match(h.notice(),/could not be saved/);});
test('AR foyer floor is translucent without depth writes; VR retains opaque flooring',()=>{for(const ar of [true,false]){const h=fixture(ar);h.begin();assert.equal(!!h.floor().material.transparent,ar);assert.equal(h.floor().material.opacity,ar?.15:1);assert.equal(h.floor().material.depthWrite,!ar);}});
test('Optical hands may remain in walking mode rather than immediately cancelling it',()=>{const h=fixture();h.optical();h.begin();h.step();assert.equal(h.g.threshold.state.walking,true);});
test('Only an open-then-fresh pinch opens the travel menu',()=>{const h=fixture();h.optical();h.setJoints(.015);h.begin();h.step();assert.equal(h.g.threshold.state.walking,true);h.setJoints(.05);h.step();h.setJoints(.015);h.step();assert.equal(h.g.threshold.state.walking,false);assert.equal(h.g.dominionControls.state.xrScreen,'foyer');});
test('Tracking/visibility loss disarms a previously open travel pinch',()=>{const h=fixture();h.optical();h.begin();h.step();h.setVisible(false);h.step();h.setJoints(.015);h.setVisible(true);h.step();assert.equal(h.g.threshold.state.walking,true);h.setJoints(.05);h.step();h.setJoints(.015);h.step();assert.equal(h.g.threshold.state.walking,false);});
test('Movement stick instructions follow saved handedness',()=>{const h=fixture();h.begin();assert.ok(h.labels.some(s=>s.includes('left stick')));});
test('XR shutdown restores the desktop camera after continuous tracked displacement',async()=>{const h=fixture();h.begin();h.g.head.object3D.position.z=-1.7;const p=h.g.threshold.exit();assert.notEqual(h.g.threshold.state.phase,'game');h.finish();await p;assert.equal(h.exits(),1);assert.deepEqual(h.g.rig.position.toArray(),[0,0,0]);assert.equal(h.g.threshold.state.phase,'game');});
test('Seated return preserves the complete expedition object and values',()=>{const h=fixture();const game=h.g.game,before=JSON.stringify(game);h.begin();h.g.head.object3D.position.z=-.7;h.g.threshold.returnNow();assert.equal(h.g.game,game);assert.equal(JSON.stringify(game),before);assert.equal(h.g.paused,true);assert.equal(h.g.threshold.stage.visible,false);});
test('Desk size/height changes use their displayed actions and only their own storage key',()=>{const h=fixture();h.g.placePanel();h.g.threshold.screen('spatial');const game=JSON.stringify(h.g.game);h.g.xrMenuRows.find(x=>x[0].startsWith('Panel size'))[1]();assert.equal(h.g.xrPanel.mesh.scale.x,1.1);assert.deepEqual([...h.writes.keys()],['vesperfall-spatial-desk-v1']);assert.equal(JSON.stringify(h.g.game),game);});
