/* Open lips, separate catchers and an anchor crossing; no invisible loop closure. */
(function(root){
 'use strict';
 const base=root.DeliveryCampaign,oldBuild=root.SkyRoutes.build;
 const spec={id:'hookline-run',name:'Hookline Run',district:'OPEN RAMPS / WHIP GRAPPLE',theme:'dawn',difficulty:'NEW MECHANICS',kind:'open',stages:4,quota:2,par:150,mail:[17,43,69],description:'Ramp into a hanging partial loop. Catch a peg with your whip, wind up, then fling into the next open skyway.',tip:'D accelerates. Open lips launch automatically. Hold Z to catch a peg; release Z to fling. Up/down reels the rope. C delivers.'};
 function bez(pts,a,b,c,d,n=28){for(let i=1;i<=n;i++){const t=i/n,u=1-t;pts.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}}
 function arc(cx,cy,r,a,b,n=64){const pts=[];for(let i=0;i<=n;i++){const t=(a+(b-a)*i/n)*Math.PI/180;pts.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}return pts;}
 function build(index,T){if(index<3)return oldBuild(index,T);if(index!==3)throw new RangeError('Unknown route');
  const a=[[100,2100],[310,2100]];bez(a,a.at(-1),[410,2100],[440,2040],[505,1975]);
  const b=arc(1110,1840,185,162,18);
  // A low curved mouth catches late/near-vertical whip releases without
  // changing the established cradle or its downstream launch tangent.
  const c=[[1460,2050]];bez(c,c[0],[1500,1820],[1720,1768],[1760,1840],48);
  bez(c,c.at(-1),[1860,2020],[1900,2190],[2100,2190]);c.push([3400,2190]);bez(c,c.at(-1),[3500,2190],[3530,2130],[3595,2065]);
  const d=[[4140,1990]];bez(d,d[0],[4260,2100],[4300,2304],[4460,2304]);
  // Raised rolling catchers receive faster whip arrivals without hidden snaps.
  bez(d,d.at(-1),[4540,2304],[4650,2140],[4800,2140],24);d.push([4960,2140]);
  bez(d,d.at(-1),[5020,2140],[5040,2304],[5140,2304],24);d.push([5190,2304]);
  const ct=[a,b,c,d];ct.forEach((p,i)=>p.sky={version:1,kind:'open',id:'loop-'+i,stage:i,begin:0,end:1,checkpoint:i>0,label:['Kickoff ramp','Hanging half-pipe','Return catcher','Depot skyway'][i]});
  const width=148,height=83,cells=new Uint8Array(width*height),put=(x,y,t)=>{if(x>=0&&x<width&&y>=0&&y<height)cells[y*width+x]=t||0;};
  for(let x=1;x<5;x++)put(x,59,T.STEEL);put(3,58,T.START);put(2,58,T.WHIP);
  // Finish AFTER the final lip. The sky rules count a section when its rider
  // exits; a goal earlier on that same section produces a false dead end.
  for(let x=130;x<148;x++){put(x,64,T.STEEL);put(x,65,T.STEEL);}put(145,63,T.GOAL);
  const pegs=[{id:'peg-main',x:36*36+18,y:47*36+18},{id:'peg-recovery',x:41*36+18,y:51*36+18}];
  pegs.forEach(p=>put(Math.floor(p.x/36),Math.floor(p.y/36),T.PEG));
  const boxes=[{x:18,y:50},{x:45,y:46},{x:106,y:52}];boxes.forEach(p=>put(p.x,p.y,T.MAILBOX));
  for(const path of ct)for(let i=5;i<path.length-3;i+=9){const [x,y]=path[i];put(Math.round(x/36),Math.round((y-40)/36),T.GEAR);}
  return {...spec,width,height,ground:64,mail:boxes.map(p=>p.x),cells,ct,boxes,pegs,minTransfers:3,requiredGrapples:1,goal:{x:145,y:64}};
 }
 root.SkyRoutes.specs.push(spec);root.SkyRoutes.build=build;
 root.DeliveryCampaign=Object.freeze({...base,routes:[...base.routes,{...spec,mail:[18,45,106]}],build});
 root.OpenCourse={build,spec};
})(globalThis);
