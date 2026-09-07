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
 root.GroundCampaign=Object.freeze({...previous,make,build});root.DeliveryCampaign=Object.freeze({...campaign,build});SkyRoutes.build=build;
 const state={awarded:false,reached:false,release:null,events:[]};
 function active(){return !!root.__ground?.active()&&root.__ground.meta?.skyRelay?.version===1;}
 function releaseWindow(p){if(!p?.peg||p.peg.id!==PEG.id)return false;const a=((p.peg.th%(Math.PI*2))+Math.PI*2)%(Math.PI*2);return p.peg.loops>=1&&a>=.80&&a<=1.14&&p.vx>0&&p.vy<0;}
 root.SkyRelay=Object.freeze({version:1,ID,PEG,points,make,previous:previous.make,state,active,releaseWindow});
 if(!root.document)return;
 const spawn=root.spawnWorld;root.spawnWorld=function(...args){const keep=routeKeep;const value=spawn(...args);if(!keep){state.awarded=false;state.reached=false;state.release=null;state.events=[];}return value;};
 let releaseCount=0;
 const step=root.stepPlayer;root.stepPlayer=function(){const value=step();if(!active())return value;
  if(__grapple.state.releases!==releaseCount){releaseCount=__grapple.state.releases;const e=__grapple.state.events.findLast(e=>e.type==='release');if(e?.id===PEG.id){state.release={step:__ground.state.steps,vx:e.vx,vy:e.vy,loops:e.loops};state.events.push({type:'release',...state.release});}}
  const p=player;if(p.track?.sky.id===ID){state.reached=true;if(!state.awarded&&state.release&&__ground.state.steps-state.release.step<300){state.awarded=true;state.events.push({type:'relay',step:__ground.state.steps,face:p._railFace});addScore(400,p.x,p.y-25,'AIRMAIL RELAY +400');}}
  return value;
 };
 // Postal markers are scene geometry/signs, not collision objects or guidance.
 const populate=SkyNetworkArt.populate;
 root.SkyNetworkArt=Object.freeze({...SkyNetworkArt,populate(args){populate(args);if(!args.course.gp?.skyRelay)return;
  const {metal,sign}=args;metal.ell(PEG.x,-PEG.y,-12,29,29,4,'#287e8e');metal.ell(PEG.x,-PEG.y,-6,23,23,3,'#8bf2d4');metal.ell(PEG.x,-PEG.y,-1,15,15,2,'#164756');
  sign('CLOUDPOST RELAY\nZ: SWING / RELEASE UP-RIGHT',PEG.x,-PEG.y+60,-30,200,52);
  sign('AIRMAIL BALCONY\nOPTIONAL EXPLORATION',5710,-630,-72,180,48);
 }});
 const render=root.render;root.render=function(){render();if(!active()||won||__delivery.state.menu||RouteWorkshop.active)return;
  const p=player;if(p.peg?.id===PEG.id){document.getElementById('cloud-flight-label').textContent=releaseWindow(p)?'RELAY WINDOW: RELEASE Z UP AND RIGHT':'MINT PEG: WIND UP WITH D; RELEASE UP-RIGHT FOR CLOUDPOST';}
  else if(p.track?.sky.id==='m5')document.getElementById('cloud-flight-label').textContent='HIGH GARDEN: D CONTINUES TO THE HOOK / HOLD Z IN FLIGHT FOR THE MINT RELAY';
  else if(p.track?.sky.id===ID)document.getElementById('cloud-flight-label').textContent='CLOUDPOST BALCONY: FOLLOW THE CURVE TO THE FESTIVAL GLIDE';
 };
 root.SkyRelayReady=true;
})(globalThis);
