/* Authored story levels: a readable ground route plus optional higher lines.
 * Reaching the finish wins. Deliveries and exploration only affect score.
 * Prior expert course identifiers remain stable at indices 0 through 3. */
(function(root){'use strict';
 const old=DeliveryCampaign,buildOld=SkyRoutes.build;
 const specs=[
  {id:'first-neighborhood',name:'Sunrise Borough',district:'01 / THE FIRST ADVENTURE',theme:'dawn',music:'morning',difficulty:'BEGINNER / SIX NEIGHBORHOODS',par:210,quota:0,width:224,style:'village',description:'A full ride from the post office through the market, loop park, orchard and canal to the festival finish. Meet neighbors and collect power-ups. The high routes are optional.',tip:'A/D: ride. Space: jump. C: optional deliveries. Reach the striped finish to continue.'},
  {id:'canal-choices',name:'Waterwheel Boulevard',district:'02 / BRIDGES AND BALCONIES',theme:'hills',music:'canal',difficulty:'EASY+ / TWO LOOP LINES',par:250,quota:0,width:256,style:'canal',description:'Ride a longer canal district with bridges, platforms, loop routes and patrol bots. Explore upper balconies or stay on the promenade.',tip:'Keep moving toward the finish. Shields protect you; deliveries and high routes are bonuses.'},
  {id:'peg-garden',name:'Copperleaf Gardens',district:'03 / RAMPS AND PEGS',theme:'dawn',music:'garden',difficulty:'MODERATE / SWING AND EXPLORE',par:290,quota:0,width:288,style:'garden',description:'A sprawling garden route with suspended curves, connected park loops, peg crossings and a safe lower return. Finish without collecting everything.',tip:'Hold Z near pegs, steer, release to fling. The lower route still leads to the finish.'}
 ];
 function bez(a,b,c,d,n=28){const r=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;r.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]);}return r;}
 function open(p,i,label,extra={}){p.sky={version:1,kind:'open',optional:true,id:'loop-'+i,stage:i,begin:0,end:1,label,...extra};return p;}
 function loop(x,y,r=108){const p=[[x,y-10],[x+150,y]];for(let i=0;i<=96;i++){const a=Math.PI/2-i/96*2*Math.PI;p.push([x+270+r*Math.cos(a),y-r+r*Math.sin(a)]);}p.push([x+440,y]);p.push(...bez([x+440,y],[x+500,y],[x+510,y-40],[x+560,y-60],15).slice(1));return p;}
 function make(n,T){
  if(!specs[n])throw new RangeError('Unknown story level');const s=specs[n],height=70,ground=60,y=ground*36,w=s.width,cells=new Uint8Array(w*height);
  const put=(x,ty,id)=>{if(x>=0&&x<w&&ty>=0&&ty<height)cells[ty*w+x]=id;};
  for(let x=0;x<w;x++)for(let ty=ground;ty<height;ty++)put(x,ty,T.STEEL);
  put(3,ground-1,T.START);put(w-5,ground-1,T.GOAL);
  const roadBoxes=[12,31,58,84,118,149,179,w-16];roadBoxes.forEach(x=>put(x,ground-1,T.MAILBOX));
  for(const x of[43,78,116,156,193,235].filter(x=>x<w-12))put(x,ground-1,T.CHECK);
  const ct=[];const add=(p,label,extra)=>ct.push(open(p,ct.length,label,extra));
  add(bez([650,y-85],[745,y-80],[860,y-155],[965,y-80]),'Post office practice ramp');
  add(bez([1620,y-110],[1760,y-95],[1860,y-200],[1990,y-175]),'Market roof run');
  add(bez([2210,y-300],[2250,y-160],[2340,y-125],[2510,y-90]),'Market catcher');
  add(loop(2990,y-105),'Park loop',{fullLoop:true});
  add(bez([4090,y-90],[4290,y-140],[4210,y-340],[4520,y-300]),'Orchard launch');
  add(bez([4870,y-320],[4810,y-70],[5190,y-90],[5290,y-120]),'Orchard bowl');
  add(bez([5840,y-95],[5900,y-200],[6170,y-210],[6330,y-100]),'Canal balcony');
  add(bez([7020,y-100],[7170,y-95],[7250,y-240],[7410,y-140]),'Festival swoop');
  if(n>0){add(loop(7800,y-120,125),'Waterwheel loop',{fullLoop:true});add(bez([8440,y-340],[8500,y-100],[8660,y-130],[8830,y-90]),'East bank receiver');}
  if(n===2){add(bez([9120,y-90],[9240,y-125],[9180,y-370],[9400,y-330]),'Peg summit');add(bez([9740,y-340],[9710,y-50],[10050,y-100],[10110,y-120]),'Copperleaf return');}
  // The first encounter comes after a shield and a long danger-free learning run.
  const foeTiles=[54,109,147,181,204,231,265].slice(0,4+n);
  foeTiles.forEach((x,i)=>put(x,ground-1,i%3===2?T.SHELL:T.BLOOP));
  for(const x of[91,166,218,251].slice(0,2+n))put(x,ground-6,T.HOVER);
  // Low blocks can be jumped, stepped up or taken from an upper route.
  for(const start of[39,65,127,172,210,245].filter(x=>x<w-14)){
   put(start,ground-1,T.CRATE);put(start+1,ground-1,T.BRICK);
   for(let k=0;k<4;k++)put(start+k,ground-4,T.PLAT);
   put(start+1,ground-6,T.QBLOCK);for(let k=0;k<4;k++)put(start+k,ground-5,T.GEAR);
  }
  for(const x of[23,75,136,188,229,269].filter(x=>x<w-8))put(x,ground-1,T.SHIELD);
  for(const x of[98,159,224,260].filter(x=>x<w-8))put(x,ground-1,T.STAR);
  for(const x of[70,141,200,250].filter(x=>x<w-8))put(x,ground-1,T.NITRO);
  for(const x of[74,145,203,254].filter(x=>x<w-8))put(x,ground-3,T.SPRING);
  for(const x of[62,120,182,240].filter(x=>x<w-8))put(x,ground-1,T.BIKEDOCK);
  for(const x of[18,88,153,219].filter(x=>x<w-8))put(x,ground-4,T.BCRATE);
  for(let x=8;x<w-8;x+=4)if(cells[(ground-1)*w+x]===0)put(x,ground-1,T.GEAR);
  for(const p of ct)for(let k=7;k<p.length-4;k+=Math.max(10,Math.floor(p.length/5))){const [xx,yy]=p[k];const tx=Math.round(xx/36),ty=Math.round((yy-40)/36);if(!cells[ty*w+tx])put(tx,ty,T.GEAR);}
  const pegTiles=n===0?[123,135]:n===1?[123,135,237]:[123,135,217,232,261,272];for(const x of pegTiles)put(x,ground-(x>250?13:10),T.PEG);
  const bonusBoxes=[{x:51,y:ground-7},{x:142,y:ground-7},...(n>0?[{x:235,y:ground-9}]:[])];bonusBoxes.forEach(b=>put(b.x,b.y,T.MAILBOX));
  // Regions have gameplay and local visual identities, not just new colors.
  const sections=[{x:0,name:'Post Office Green',scene:'village'},{x:34,name:'Market Lanes',scene:'market'},{x:76,name:'Loopside Park',scene:'park'},{x:109,name:'Copper Orchard',scene:'garden'},{x:151,name:'Canal Steps',scene:'canal'},{x:188,name:n===0?'Festival Finish':'East Bank',scene:'festival'}];
  if(n>0)sections.push({x:216,name:'Waterwheel Rise',scene:'canal'});if(n===2)sections.push({x:252,name:'Peg Conservatory',scene:'garden'});
  const cast=[{id:'penny',name:'Penny',x:6,y:ground,text:'Take the road or the gold tracks. Reach the finish to win!'},{id:'otto',name:'Otto',x:28,y:ground,text:'Blue shields absorb a hit. Keep an eye out for patrol bots.'},{id:'milo',name:'Milo',x:79,y:ground,text:'The big loop is optional. Get some speed and jump onto its entry.'},{id:'fern',name:'Fern',x:139,y:ground,text:'Hold Z near a peg and release to swing away.'},{id:'pip',name:'Pip',x:w-11,y:ground,text:'See the finish flags? Cross them for the next adventure!'}];
  const boxes=[];for(let ty=0;ty<height;ty++)for(let tx=0;tx<w;tx++)if(cells[ty*w+tx]===T.MAILBOX)boxes.push({x:tx,y:ty});
  const gp={version:1,adventure:2,index:n,style:s.style,ground,groundStart:true,quota:0,stages:0,minTransfers:0,requiredGrapples:0,bonusPerRail:100,sections,cast,finishOnly:true};
  return {...s,height,ground,cells,ct,boxes,mail:boxes.map(p=>p.x),goal:{x:w-5,y:ground},kind:'ground',stages:0,minTransfers:0,requiredGrapples:0,gp,roadBoxes};
 }
 function build(i,T){return i<4?buildOld(i,T):make(i-4,T);}
 function encode(r){const code=old.encode(r);if(!r.gp)return code;const [a,b]=code.split('.'),m=JSON.parse(decodeURIComponent(escape(atob(a))));m.gp=r.gp;m.p='platform';m.m=r.music||'morning';return btoa(unescape(encodeURIComponent(JSON.stringify(m))))+'.'+b;}
 SkyRoutes.specs.push(...specs);SkyRoutes.build=build;
 const ids={STEEL:1,BRICK:2,CRATE:3,GEAR:5,SPRING:6,PLAT:7,GOAL:8,BCRATE:9,CHECK:13,START:15,BLOOP:16,SHELL:17,HOVER:18,NITRO:27,BIKEDOCK:36,SHIELD:43,STAR:44,PEG:60,MAILBOX:63,QBLOCK:84};
 const routes=[...old.routes,...specs.map((s,n)=>{const {cells,ct,...info}=make(n,ids);return info;})];
 root.DeliveryCampaign=Object.freeze({...old,routes,build,encode});root.GroundCampaign=Object.freeze({specs,make,build,encode,order:[4,5,6,3,0,1,2]});root.GroundNative={step:stepPlayer};
})(globalThis);
