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
  const c=[[1800,1830]];bez(c,c[0],[1880,1920],[1920,2060],[2070,2060]);c.push([2400,2060]);bez(c,c.at(-1),[2500,2060],[2530,2000],[2595,1935]);
  const d=[[3080,1830]];bez(d,d[0],[3200,1940],[3240,2088],[3380,2088]);d.push([3600,2088]);
  const ct=[a,b,c,d];ct.forEach((p,i)=>p.sky={version:1,kind:'open',id:'loop-'+i,stage:i,begin:0,end:1,checkpoint:i>0,label:['Kickoff ramp','Hanging half-pipe','Return catcher','Depot skyway'][i]});
  const width=113,height=83,cells=new Uint8Array(width*height),put=(x,y,t)=>{if(x>=0&&x<width&&y>=0&&y<height)cells[y*width+x]=t||0;};
  for(let x=1;x<5;x++)put(x,59,T.STEEL);put(3,58,T.START);put(2,58,T.WHIP);
  for(let x=98;x<111;x++){put(x,58,T.STEEL);put(x,59,T.STEEL);}put(107,57,T.GOAL);
  const pegs=[{id:'peg-main',x:36*36+18,y:47*36+18},{id:'peg-recovery',x:41*36+18,y:51*36+18}];
  pegs.forEach(p=>put(Math.floor(p.x/36),Math.floor(p.y/36),T.PEG));
  const boxes=[{x:18,y:50},{x:45,y:46},{x:79,y:48}];boxes.forEach(p=>put(p.x,p.y,T.MAILBOX));
  for(const path of ct)for(let i=5;i<path.length-3;i+=9){const [x,y]=path[i];put(Math.round(x/36),Math.round((y-40)/36),T.GEAR);}
  // Explicit static terrain is just the launch pad and final depot.
  return {...spec,width,height,ground:58,mail:boxes.map(p=>p.x),cells,ct,boxes,pegs,minTransfers:3,requiredGrapples:1,goal:{x:107,y:58}};
 }
 root.SkyRoutes.specs.push(spec);root.SkyRoutes.build=build;
 root.DeliveryCampaign=Object.freeze({...base,routes:[...base.routes,{...spec,mail:[18,45,79]}],build});
 root.OpenCourse={build,spec};
})(globalThis);
