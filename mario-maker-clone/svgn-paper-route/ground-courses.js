/* Ground-first campaign. Existing advanced routes retain their IDs and rules.
 * Every early course has a continuous, collision-backed lower route.
 * Upper rails, envelopes and peg transfers are optional score opportunities. */
(function(root){
 'use strict';
 const old=DeliveryCampaign,buildOld=SkyRoutes.build;
 const specs=[
  {id:'first-neighborhood',name:'Your First Route',district:'01 / NEIGHBORHOOD',theme:'dawn',difficulty:'EASY / NO PITS OR ENEMIES',par:99999,quota:1,width:76,style:'village',
   description:'An easy ride along a safe street. Learn to stop, jump and deliver. Try the low park ramp when you feel ready.',
   tip:'A/D or arrows move. Space jumps. C throws. Stay on the street or jump onto the optional gold ramp.'},
  {id:'canal-choices',name:'Canal Choices',district:'02 / CANAL PROMENADE',theme:'hills',difficulty:'EASY+ / OPTIONAL HIGH ROUTE',par:99999,quota:2,width:98,style:'canal',
   description:'A longer promenade with low rollers and a raised shortcut. Miss the upper path and land safely back on the road.',
   tip:'The lower promenade always reaches the depot. Jump onto the gold rise to try an optional curved transfer.'},
  {id:'peg-garden',name:'Peg Garden',district:'03 / PRACTICE ABOVE THE ROAD',theme:'dawn',difficulty:'MODERATE / OPTIONAL GRAPPLE',par:99999,quota:2,width:112,style:'garden',
   description:'Explore a garden of higher ramps and practice the whip above a safe road. Grappling and upper parcels are bonuses, never entry requirements.',
   tip:'Hold Z near a peg, steer to swing, release Z to fling. No grapple is needed to finish by road.'}
 ];
 function bez(a,b,c,d,n=30){const r=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;r.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return r;}
 function open(points,i,label){points.sky={version:1,kind:'open',optional:true,id:'loop-'+i,stage:i,begin:0,end:1,label};return points;}
 function make(n,T){
  if(!specs[n])throw new RangeError('Unknown learning course');
  const s=specs[n],height=68,ground=60,y=ground*36,w=s.width,cells=new Uint8Array(w*height);
  const put=(x,ty,id)=>{if(x>=0&&x<w&&ty>=0&&ty<height)cells[ty*w+x]=id;};
  for(let x=0;x<w;x++)for(let ty=ground;ty<height;ty++)put(x,ty,T.STEEL);
  put(3,ground-1,T.START);put(w-5,ground-1,T.GOAL);
  const roadBoxes=n===0?[11,32,60]:n===1?[11,38,76,88]:[11,38,80,98];
  roadBoxes.forEach(x=>put(x,ground-1,T.MAILBOX));
  for(const x of n===0?[27,52]:n===1?[31,61]:[33,70])put(x,ground-1,T.CHECK);
  // Raised entrances are intentionally above the road. Walking right never
  // captures the upper rail; Space is the player's choice of a higher route.
  const a=bez([650,y-90],[760,y-95],[845,y-140],[930,y-100]);
  const ct=[open(a,0,'Optional park ramp')];
  if(n>=1){
   const b=bez([1180,y-100],[1250,y-210],[1320,y-210],[1410,y-155]);
   const c=bez([1770,y-310],[1790,y-130],[1910,y-145],[2110,y-95]);
   ct.push(open(b,1,'Raised launch'),open(c,2,'Suspended catcher'));
  }
  if(n===2){
   ct[1]=open(bez([1190,y-90],[1390,y-60],[1420,y-190],[1510,y-225]),1,'Whip practice launch');
   ct[2]=open(bez([2040,y-300],[2080,y-155],[2250,y-100],[2460,y-90]),2,'Garden receiver');
   const arc=[];for(let i=0;i<=48;i++){const a=(160-i/48*140)*Math.PI/180;arc.push([2900+160*Math.cos(a),y-300+160*Math.sin(a)]);}ct.push(open(arc,3,'Hanging partial curve'));
   put(46,ground-10,T.PEG);put(52,ground-9,T.PEG);put(78,ground-13,T.PEG);
  }
  // Collectible parcels sit above the rails; no bonus item blocks ground travel.
  for(const p of ct)for(let k=5;k<p.length-2;k+=7){const [x,yy]=p[k];put(Math.round(x/36),Math.round((yy-55)/36),T.GEAR);}
  const bonusBoxes=n===0?[]:n===1?[{x:53,y:ground-7}]:[{x:59,y:ground-8},{x:83,y:ground-12}];
  for(const b of bonusBoxes)put(b.x,b.y,T.MAILBOX);
  const boxes=roadBoxes.map(x=>({x,y:ground-1})).concat(bonusBoxes);
  const gp={version:1,index:n,style:s.style,ground,groundStart:true,quota:s.quota,stages:0,minTransfers:0,requiredGrapples:0,bonusPerRail:100};
  return {...s,height,ground,cells,ct,boxes,mail:boxes.map(p=>p.x),goal:{x:w-5,y:ground},kind:'ground',stages:0,minTransfers:0,requiredGrapples:0,gp,roadBoxes};
 }
 function build(i,T){return i<4?buildOld(i,T):make(i-4,T);}
 function encode(r){const code=old.encode(r);if(!r.gp)return code;const [a,b]=code.split('.'),m=JSON.parse(decodeURIComponent(escape(atob(a))));m.gp=r.gp;m.p='platform';return btoa(unescape(encodeURIComponent(JSON.stringify(m))))+'.'+b;}
 SkyRoutes.specs.push(...specs);SkyRoutes.build=build;
 const routes=[...old.routes,...specs.map((s,n)=>{const d=make(n,{STEEL:1,START:15,GOAL:8,CHECK:13,MAILBOX:63,PEG:60,GEAR:5});const {cells,ct,...info}=d;return info;})];
 root.DeliveryCampaign=Object.freeze({...old,routes,build,encode});
 root.GroundCampaign=Object.freeze({specs,make,build,encode,order:[4,5,6,3,0,1,2]});
 // Capture the original platform movement before the sky adapters wrap it.
 root.GroundNative={step:stepPlayer};
})(globalThis);
