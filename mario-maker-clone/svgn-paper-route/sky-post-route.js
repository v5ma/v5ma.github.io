/* A tested optional high-to-high grapple branch. Existing curves and movement
 * rules are unchanged. This geometry is shared by play, maps and the Workshop. */
(function(root){
 'use strict';
 const prior=GroundCampaign,campaign=DeliveryCampaign;
 const peg=Object.freeze({id:'peg-124-18',x:4482,y:666,tx:124,ty:18});
 function build(n,T){
  const d=prior.make(n,T);if(n!==0)return d;
  const pts=SkyNetworkLayout.bez([4740,450],[4970,590],[5930,445],[6150,625],110);
  pts.sky={version:1,kind:'open',optional:true,network:true,begin:0,end:1,
   id:'sky-post',label:'Sky Post airmail balcony',stage:d.ct.length,sector:3,tier:3,
   roadDepth:34,authoredFlow:true,skyPost:true,shape:'grapple-balcony'};
  d.ct.push(pts);d.cells[peg.ty*d.width+peg.tx]=T.PEG;
  const t=GrappleCore.rail(pts,pts.sky);
  for(let s=90;s<t.len-60;s+=105){const q=GrappleCore.sample(t,s);
   for(const off of [48,-82]){const x=Math.round((q.x+q.nx*off-18)/36),y=Math.round((q.y+q.ny*off-18)/36);
    if(x>2&&x<d.width-5&&y>1&&y<d.ground-3&&!d.cells[y*d.width+x])d.cells[y*d.width+x]=T.GEAR;
   }
  }
  d.gp.skyNetwork.pegCount++;
  d.gp.skyNetwork.links.push({from:'m5',to:'sky-post',type:'optional-whip',peg:peg.id},{from:'sky-post',to:'m8',type:'ballistic-return'});
  d.gp.skyNetwork.sectors[3]={...d.gp.skyNetwork.sectors[3],y:320,h:1850};
  d.gp.skyPost={version:1,peg:{...peg},receiver:'sky-post',returnTo:'m8'};
  d.description='Choose the high curl, canal sprint or optional Sky Post whip relay. Every line returns toward the finish; the street stays open.';
  return d;
 }
 const ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
 const buildRoute=(i,T)=>i<4?campaign.build(i,T):build(i-4,T);
 SkyRoutes.build=buildRoute;root.GroundCampaign=Object.freeze({...prior,make:build,build:buildRoute});
 root.DeliveryCampaign=Object.freeze({...campaign,build:buildRoute,routes:campaign.routes.map((v,i)=>i===4?(()=>{const {ct,cells,...info}=build(0,ids);return info;})():v)});
 root.SkyPostRoute=Object.freeze({peg,build,previous:prior.make});
})(globalThis);
