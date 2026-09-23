'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {C,P,S,walk,path,resume}=require('./pilgrimage-driver.cjs'),R=require('../returning-bell-model.js'),W=require('../wayfinder-model.js'),K=require('../field-kit-model.js'),L=require('../courier-lantern-model.js');
const create=()=>C.create('BELL-01',1,{pilgrimage:{stage:0,tier:0}});
test('Lantern holster is mirrored and separated from both existing flask grips at every heading',()=>{
 for(const bowLeft of[true,false])for(let i=0;i<16;i++){const angle=i*Math.PI/8,f=[Math.sin(angle),0,-Math.cos(angle)],right=[-f[2],0,f[0]],head=[2,4.85,1],p=L.holster(head,f,3.2,bowLeft),sign=bowLeft?1:-1;
  a.equal(p[1],4.21);for(const x of[.24,.49]){const vial=[head[0]+right[0]*sign*x+f[0]*.12,p[1],head[2]+right[2]*sign*x+f[2]*.12];a.ok(C.len(C.sub(p,vial))>.33);}
 }
 a.equal(L.holster([NaN,0,0],[0,0,-1],0),null);a.ok(L.holster([0,.5,0],[0,-1,0],0)[1]>=.38);
});
test('Read-only bearing distinguishes ahead, right, left, behind and upper levels',()=>{
 const s=create(),head=s.head,basis=[0,0,-1];for(const [delta,word]of[[[0,4,-5],'ahead'],[[5,4,0],'right'],[[-5,4,0],'left'],[[0,4,5],'behind']]){
  const w={goal:()=>({text:'Relay',point:C.add(head,delta)})},g=L.guide(s,head,basis,w,P,R);a.match(g.detail,new RegExp(word));a.match(g.detail,/upper/);a.equal(g.distance,5);
 }
 const g=L.guide(s,head,basis,{goal:()=>({text:'Complete',detail:'Choose blessing',point:null})},P,R);a.equal(g.detail,'Choose blessing');a.equal(g.point,null);
});
test('Guidance neither discovers rooms nor changes enemies, inventory, targets, clocks or saved data',()=>{
 const s=create(),before=JSON.stringify(s);for(let n=0;n<100;n++)L.guide(s,s.head,[0,0,-1],W,P,R);a.equal(JSON.stringify(s),before);
 a.deepEqual(resume(s).fieldkit,s.fieldkit);a.equal(S.capture(s,{id:'lantern-read-only',banked:0,receipt:{},yaw:0,pitch:0,focus:1}).state.courierLantern,undefined);
});
test('The lantern cannot operate a remote, lower-floor or unseen mechanism',()=>{
 const s=create(),m=s.world.pipeline.modules[0];a.equal(W.current(s,C,P,R),null);a.equal(L.canOperate(s,null,s.head,[0,0,-1],C,W,K),false);
 const control={p:[...m.winch],point:C.add(m.winch,[0,1.08,0])};a.equal(L.canOperate(s,control,s.head,C.unit(C.sub(control.point,s.head)),C,W,K),false);
 a.equal(L.canOperate(s,control,[Infinity,0,0],[0,0,-1],C,W,K),false);
});
test('A real gallery walk permits an aimed nearby operation, with original one-time relay/save behavior',()=>{
 const s=create(),m=s.world.pipeline.modules[0];path(s,[m.front,...m.paths.gallery.slice(1,5)]);const c=W.current(s,C,P,R);a.equal(c.kind,'lens');
 const direction=C.unit(C.sub(c.point,s.head));a.equal(L.canOperate(s,c,s.head,direction,C,W,K),true);a.equal(L.canOperate(s,c,C.add(s.head,[3,0,0]),direction,C,W,K),false);
 a.equal(L.canOperate(s,c,s.head,[0,0,1],C,W,K),true); // Close reach tolerates orientation, as the existing interaction does.
 const before=JSON.stringify(s);L.guide(s,s.head,[0,0,-1],W,P,R);a.equal(JSON.stringify(s),before);
 a.equal(C.interact(s),true);a.equal(s.targets.size,1);a.equal(W.current(s,C,P,R),null);a.deepEqual([...resume(s).targets],[...s.targets]);
});
test('Hand and floor occlusion reject an otherwise aimed nearby lantern operation',()=>{
 const s=create(),control={point:C.add(s.head,[0,0,-1])};const aim={aimed:()=>true};
 a.equal(L.canOperate(s,control,s.head,[0,0,-1],C,aim,{visible:()=>false}),false);
 a.equal(L.canOperate({...s,phase:'reward'},control,s.head,[0,0,-1],C,aim,K),false);
});
test('Aimed flask throw is finite and follows the original swept physics without shooting an arrow',()=>{
 const s=create(),origin=C.add(s.head,[0,0,-.18]);a.equal(K.aimedLaunch(s,'frost',origin,[0,0,-1],C),true);a.equal(s.fieldkit.stock.frost,1);a.equal(s.fieldkit.throws,1);a.deepEqual(s.fieldkit.flights[0].v,[0,1.2,-8]);
 for(let n=0;n<180&&s.fieldkit.flights.length;n++)C.step(s,1/90,s.head);a.equal(s.fieldkit.flights.length,0);a.ok(s.events.some(e=>e.type==='kit-splash'));a.equal(s.shots,0);a.equal(s.blinks,0);
});
test('Invalid, through-wall, empty or out-of-reach aimed throws spend nothing',()=>{
 const s=create(),before=JSON.stringify(s.fieldkit);
 for(const [origin,d]of[[s.head,[0,0,0]],[s.head,[NaN,0,1]],[C.add(s.head,[0,0,-3]),[0,0,-1]],[C.add(s.head,[0,0,4]),[0,0,-1]]]){a.equal(K.aimedLaunch(s,'frost',origin,d,C),false);a.equal(JSON.stringify(s.fieldkit),before);}
 a.equal(K.aimedLaunch(s,'other',s.head,[0,0,-1],C),false);a.equal(JSON.stringify(s.fieldkit),before);
 for(let n=0;n<2;n++)a.equal(K.aimedLaunch(s,'frost',s.head,[0,0,-1],C),true);
 const spent=JSON.stringify(s.fieldkit);a.equal(K.aimedLaunch(s,'frost',s.head,[0,0,-1],C),false);a.equal(JSON.stringify(s.fieldkit),spent);
});
