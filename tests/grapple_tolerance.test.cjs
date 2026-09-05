// Shared math tuning test, not a substitute for native 3D input replays.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path').join(__dirname,'../mario-maker-clone/svgn-paper-route/');
const s={TextEncoder,btoa,atob,escape,unescape};vm.createContext(s);for(const f of['campaign.js','sky-routes.js','grapple-core.js','open-course.js'])vm.runInContext(fs.readFileSync(path+f,'utf8'),s);
const K=s.GrappleCore,d=s.OpenCourse.build(3,{}),rails=d.ct.map(p=>K.rail(p,p.sky));
function run(castFrame,phase,loops){const p={x:0,y:0,w:26,h:30,speed:0,track:rails[0],trackS:1,roll:0,vx:0,vy:0,_airTicks:0};K.pose(p,p.track,1);let from=null,catches=0;
 for(let f=0;f<2500;f++){if(p.trackCD)p.trackCD--;if(f===castFrame)K.cast(p,d.pegs[0]);if(p.peg){const th=(p.peg.th%(2*Math.PI)+2*Math.PI)%(2*Math.PI);if(p.peg.loops>=loops&&th>=phase&&th<=phase+.23)K.release(p);else{K.swing(p,{right:true});continue;}}
  if(p.track){const tr=p.track,exit=K.ride(p,{right:true});if(exit){if(tr.sky.stage===3)return catches===3;from=tr.sky.id;p._airTicks=0;}}
  else{const old={x:p.x,y:p.y};K.flight(p,{right:true});p._airTicks++;if(K.catchRail(p,old,rails,from))catches++;}
  if(p.y>2900||p.x>5500)return false;
 }return false;
}
test('Real receiving geometry tolerates 72 cast, wind-up and release variations',()=>{for(const turns of[1,2,4])for(const phase of[.08,.2,.3,.4])for(const frame of[124,127,129,132,136,140])assert(run(frame,phase,turns),JSON.stringify({frame,phase,turns}));});
