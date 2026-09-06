/* Pure carried-state timing samples, separate from ordinary-input 3D replays. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=__dirname+'/../mario-maker-clone/svgn-paper-route/';
const c={console,btoa,atob,T:{STEEL:1,START:15,NITRO:27,GOAL:8},document:{readyState:'loading',addEventListener(){}}};c.window=c;vm.createContext(c);
for(const f of ['workshop-core.js','bezier-core.js','grapple-core.js','rail-grip-core.js','rail-training.js']){
 let text=fs.readFileSync(root+f,'utf8');if(f==='rail-training.js')text=text.replace("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();",'window.RailTraining={document:makeDocument};');vm.runInContext(text,c);
}
test('The lesson tolerates 66 incoming-speed and boost-timing variations without resetting landing states',()=>{
 const K=c.GrappleCore,d=c.RailTraining.document(),rails=d.paths.map(p=>K.rail(p.points,p.meta));let tested=0;
 for(let speed=4.5;speed<=7;speed+=.5)for(let delay=0;delay<=20;delay+=2){
  const p={x:0,y:0,vx:0,vy:0,w:26,h:30,track:rails[0],trackS:154,speed,roll:0,nitroT:0};K.pose(p,p.track,p.trackS);const catches=[];let from=null;
  for(let tick=0;tick<400;tick++){
   if(tick===delay)p.nitroT=55;
   if(p.nitroT>0){p.nitroT--;if(p.track)p.speed=Math.min(28,p.speed+.4);else{const v=Math.hypot(p.vx,p.vy)||1,f=Math.min(28,v+.24)/v;p.vx*=f;p.vy*=f;}}
   if(p.track){const t=p.track;if(K.ride(p,{right:true})){from=t.sky.id;p._airTicks=0;}}
   else{const old={x:p.x,y:p.y};if(p.trackCD>0)p.trackCD--;p._airTicks=(p._airTicks||0)+1;K.flight(p,{right:true});const hit=K.catchRail(p,old,rails,from);if(hit){catches.push([hit.tr.sky.id,hit.face]);from=null;}}
   if(p.y>2130)break;
  }
  assert.deepEqual(catches,[['grip-1',-1],['grip-2',1]],'speed='+speed+', delay='+delay);tested++;
 }
 assert.equal(tested,66);
});
