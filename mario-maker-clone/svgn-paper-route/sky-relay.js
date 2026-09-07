/* A physical upper-to-upper whip route. The original four lines and all of
 * their points stay intact. No auto-cast, release, steering or snap changes. */
(function(root){
 'use strict';
 const PEG=Object.freeze({id:'peg-124-18',x:4482,y:666}),ID='cloudpost-relay';
 const controlPoints=[[5250,650],[5450,780],[6180,670],[6400,850]];
 const previous=GroundCampaign,campaign=DeliveryCampaign;
 function points(){return SkyNetworkLayout.bez(...controlPoints,96);}
 function make(n,T){
  const d=previous.make(n,T);if(n!==0||d.gp?.flowRoutes?.version!==3)return d;
  const path=points();path.sky={version:1,kind:'open',optional:true,network:true,authoredFlow:true,id:ID,stage:d.ct.length,begin:0,end:1,sector:3,tier:3,roadDepth:34,label:'Cloudpost relay balcony',shape:'relay-crescent'};
  d.ct.push(path);d.cells[18*d.width+124]=T.PEG;
  const rail=GrappleCore.rail(path,path.sky);
  for(let s=100;s<rail.len-60;s+=90){const q=GrappleCore.sample(rail,s),x=Math.round((q.x+q.nx*48-18)/36),y=Math.round((q.y+q.ny*48-18)/36);if(!d.cells[y*d.width+x])d.cells[y*d.width+x]=T.GEAR;}
  d.gp.skyNetwork.pegCount++;d.gp.skyNetwork.links.push({from:'m5',to:ID,type:'optional-whip'},{from:ID,to:'m8',type:'free-flight'});
  d.gp.skyRelay={version:1,id:ID,peg:{...PEG},bonus:400,returnRail:'m8',controls:'Hold Z after High Garden, wind around the mint peg, release while travelling up and right.'};
  d.gp.flowRoutes.routes.push({id:'relay',name:'Cloudpost airmail relay',entry:'m0',expected:['m0','m1','m2','m3','m4','m5',ID,'m8'],hint:d.gp.skyRelay.controls,brake:null});
  d.description+=' An optional whip relay reaches a parcel balcony above the hook.';
  return d;
 }
 const build=(i,T)=>i<4?campaign.build(i,T):make(i-4,T);
 root.GroundCampaign=Object.freeze({...previous,make,build});root.DeliveryCampaign=Object.freeze({...campaign,build,routes:campaign.routes.map((r,i)=>i===4?{...r,description:r.description+' Discover the optional Cloudpost whip relay.'}:r)});SkyRoutes.build=build;
 // Only uninterrupted releases earn a relay award. This small state machine
 // is also exercised independently from renderer and campaign save systems.
 function createProgress(){
  const state={awarded:false,reached:false,release:null,events:[]};
  const log=e=>{state.events.push(e);if(state.events.length>128)state.events.shift();};
  function reset(keep=false){state.release=null;if(!keep){state.awarded=false;state.reached=false;state.events=[];}}
  function release(event,step){state.release=null;if(event?.id!==PEG.id||![step,event.vx,event.vy,event.loops].every(Number.isFinite))return;
   state.release={step,vx:event.vx,vy:event.vy,loops:event.loops};log({type:'release',...state.release});
  }
  function contact({step,id=null,face=1,ground=false,dead=false}){
   const r=state.release;if(r&&(dead||ground||step<r.step||step-r.step>=300||id&&id!==ID))state.release=null;
   if(id!==ID||dead)return 0;state.reached=true;
   if(state.awarded||!state.release)return 0;state.awarded=true;log({type:'relay',step,face});return 400;
  }
  return Object.freeze({state,reset,release,contact});
 }
 const progress=createProgress(),state=progress.state;
 function active(){return !!root.__ground?.active()&&root.__ground.meta?.skyRelay?.version===1;}
 function releaseWindow(p){if(!p?.peg||p.peg.id!==PEG.id)return false;const a=((p.peg.th%(Math.PI*2))+Math.PI*2)%(Math.PI*2);return p.peg.loops>=1&&a>=.65&&a<=1.30&&p.vx>0&&p.vy<0;}
 root.SkyRelay=Object.freeze({version:1,ID,PEG,points,make,previous:previous.make,state,active,releaseWindow,createProgress});
 if(!root.document)return;
 let releaseCount=0;
 const spawn=root.spawnWorld;root.spawnWorld=function(...args){const keep=routeKeep;const value=spawn(...args);progress.reset(keep);releaseCount=__grapple.state.releases;return value;};
 const step=root.stepPlayer;root.stepPlayer=function(){const value=step();if(!active())return value;
  if(__grapple.state.releases!==releaseCount){releaseCount=__grapple.state.releases;progress.release(__grapple.state.events.findLast(e=>e.type==='release'),__ground.state.steps);}
  const p=player,bonus=progress.contact({step:__ground.state.steps,id:p.track?.sky.id,face:p._railFace,ground:p.onGround&&!p.track&&!p.peg,dead:p.dead>0});
  if(bonus)addScore(bonus,p.x,p.y-25,'AIRMAIL RELAY +400');
  return value;
 };
 // Postal markers are scene geometry/signs, not collision objects or guidance.
 const populate=SkyNetworkArt.populate;
 root.SkyNetworkArt=Object.freeze({...SkyNetworkArt,populate(args){populate(args);if(!args.course.gp?.skyRelay)return;
  const {metal,sign,greenery,kit}=args;if(args.course.cells[18*args.course.width+124]===60){metal.ell(PEG.x,-PEG.y,-12,29,29,4,'#287e8e');metal.ell(PEG.x,-PEG.y,-6,23,23,3,'#8bf2d4');metal.ell(PEG.x,-PEG.y,-1,15,15,2,'#164756');
  sign('CLOUDPOST RELAY\nZ: SWING / RELEASE UP-RIGHT',PEG.x,-PEG.y+60,-30,200,52);
  }
  const track=args.paths.find(p=>p.sky?.id===ID);if(track){const t=GrappleCore.rail(track.pts),p=GrappleCore.sample(t,t.len*.45);const x=p.x,y=-p.y;
   metal.box(x,y+29,-122,84,58,52,'#e9dcaf');metal.cone(x,y+69,-122,62,35,'#388b9f',0,4);
   metal.box(x,y+25,-94,20,42,3,'#285971');for(const dx of[-27,27])metal.box(x+dx,y+34,-94,15,19,3,'#8bebd2');
   metal.rod([x+47,y+4,-105],[x+47,y+85,-105],2,'#d5b769');metal.tri([x+47,y+85,-105],[x+79,y+77,-105],[x+47,y+67,-105],'#8bebd2');
   kit.flowers(greenery,x-58,y+3,-128,.75);sign('CLOUDPOST / AIRMAIL',x,y+112,-120,172,36);}
 }});
 const render=root.render;root.render=function(){render();if(!active()||won||__delivery.state.menu||RouteWorkshop.active)return;
  const p=player;if(p.peg?.id===PEG.id){document.getElementById('cloud-flight-label').textContent=releaseWindow(p)?'RELAY WINDOW: RELEASE Z UP AND RIGHT':'MINT PEG: WIND UP WITH D; RELEASE UP-RIGHT FOR CLOUDPOST';}
  else if(p.track?.sky.id==='m5')document.getElementById('cloud-flight-label').textContent='HIGH GARDEN: D CONTINUES TO THE HOOK / HOLD Z IN FLIGHT FOR THE MINT RELAY';
  else if(p.track?.sky.id===ID)document.getElementById('cloud-flight-label').textContent='CLOUDPOST BALCONY: FOLLOW THE CURVE TO THE FESTIVAL GLIDE';
 };
 root.SkyRelayReady=true;
})(globalThis);
