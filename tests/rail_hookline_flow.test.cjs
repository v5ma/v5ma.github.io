/* Carried-state physics samples, not a native-input or whole-course claim. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/../mario-maker-clone/svgn-paper-route/';
const c={console,btoa,atob,DeliveryCampaign:{routes:[]},SkyRoutes:{specs:[],build(){}}};
vm.createContext(c);
for(const file of ['grapple-core.js','rail-grip-core.js','open-course.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),c);
test('35 inherited whip-landing states reconnect when braking ends before the launch ramp',()=>{
 const K=c.GrappleCore,course=c.OpenCourse.build(3,{}),rails=course.ct.map(a=>K.rail(a,a.sky));let trials=0;
 for(let startS=1050;startS<=1450;startS+=100)for(let speed=20;speed<=26;speed++){
  const p={w:26,h:30,x:0,y:0,vx:0,vy:0,speed,track:rails[2],trackS:startS,_railFace:1,trackCD:0,dir:1,roll:0,onGround:true};
  K.pose(p,rails[2],startS);let braking=false,from=null,caught=false,air=0;
  for(let tick=0;tick<200;tick++){
   if(p.track){
    braking=p.track===rails[2]&&p.x<3300&&p.speed>(braking?18:19);
    const previous=p.track;
    if(K.ride(p,braking?{left:true}:{right:true})){from=previous.sky.id;p._airTicks=0;}
   }else{
    const previous={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;p._airTicks++;air++;
    K.flight(p,{right:true});const hit=K.catchRail(p,previous,rails,from);
    if(hit){assert.equal(hit.tr.sky.id,'loop-3');assert.equal(hit.face,1);assert.ok(air>3);caught=true;break;}
   }
   if(p.y>2900)break;
  }
  assert.ok(caught,`startS=${startS}, speed=${speed}`);trials++;
 }
 assert.equal(trials,35);
});
