/* Seeded room footprints and optional vertical circulation. Shared physical
 * geometry, not an image overlay or an alternate game controller. */
(function(root){'use strict';
 const FAMILIES=[{id:'nave',label:'The Long Nave',w:16,d:22},{id:'court',label:'Rain Court',w:20,d:18},{id:'transept',label:'Crossing of Ash',w:20,d:20},{id:'archive',label:'Sunken Archive',w:16,d:18},{id:'belfry',label:'The High Belfry',w:18,d:20}];
 function hash(s){let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
 function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function box(min,max,type,room){return {min,max,type,room};}
 function rect(x,z,w,d,y=0,type='stone',id){return {x,z,w,d,y,type,id};}
 function generate(seed,depth,H){
  const rng=H.rng((H.hash(seed)+Math.imul(depth,1013904223))>>>0),shapeRng=random(hash(seed+'-rooms-'+depth));
  const col=[-(24+Math.floor(shapeRng()*5)),0,24+Math.floor(shapeRng()*5)],rows=[0,-(26+Math.floor(shapeRng()*5))];rows.push(rows[1]-26-Math.floor(shapeRng()*5));
  const rooms=[],links=Array.from({length:9},()=>[]),edges=[],floors=[],solids=[],families=H.shuffle(FAMILIES,shapeRng);
  for(let row=0;row<3;row++)for(let c=0;c<3;c++){
   const id=row*3+c,f=id===1?{id:'choir',label:'Choir Court',w:14,d:14}:families[(id-(id>1?1:0))%families.length],r={id,x:col[c],z:rows[row],w:f.w,d:f.d,planFamily:f.id,label:f.label,style:Math.floor(rng()*3)};
   rooms.push(r);
   if(f.id==='transept'){floors.push(rect(r.x,r.z,r.w,12,0,'stone','room-'+id+'-east'),rect(r.x,r.z-8,12,4,0,'stone','room-'+id+'-north'),rect(r.x,r.z+8,12,4,0,'stone','room-'+id+'-south'));r.outline=[[-6,-10],[6,-10],[6,-6],[10,-6],[10,6],[6,6],[6,10],[-6,10],[-6,6],[-10,6],[-10,-6],[-6,-6]];}
   else{floors.push(rect(r.x,r.z,r.w,r.d,0,'stone','room-'+id));const x=r.w/2,z=r.d/2;r.outline=[[-x,-z],[x,-z],[x,z],[-x,z]];}
  }
  const done=new Set([1]),stack=[1];while(stack.length){const a=stack.at(-1),ns=H.shuffle([a%3>0?a-1:-1,a%3<2?a+1:-1,a>2?a-3:-1,a<6?a+3:-1].filter(n=>n>=0&&!done.has(n)),rng);if(!ns.length){stack.pop();continue;}const b=ns[0];edges.push([a,b]);done.add(b);stack.push(b);}
  const options=rooms.flatMap(r=>[r.id%3<2?[r.id,r.id+1]:null,r.id<6?[r.id,r.id+3]:null].filter(Boolean)).filter(([a,b])=>!edges.some(e=>e.includes(a)&&e.includes(b)));edges.push(...H.shuffle(options,rng).slice(0,2));
  for(const [a,b] of edges){links[a].push(b);links[b].push(a);const p=rooms[a],q=rooms[b],vertical=p.x===q.x;
   const near=vertical?[p.z+(q.z<p.z?-p.d/2:p.d/2),q.z+(q.z<p.z?q.d/2:-q.d/2)]:[p.x+(q.x<p.x?-p.w/2:p.w/2),q.x+(q.x<p.x?q.w/2:-q.w/2)];
   const mid=(near[0]+near[1])/2,length=Math.abs(near[1]-near[0])+.32;
   floors.push(rect(vertical?p.x:mid,vertical?mid:p.z,vertical?4:length,vertical?length:4,0,'bridge','bridge-'+a+'-'+b));
  }
  for(const r of rooms){
   const points=r.outline;
   for(let j=0;j<points.length;j++){
    const a=points[j],b=points[(j+1)%points.length],h=a[1]===b[1],lo=Math.min(h?a[0]:a[1],h?b[0]:b[1]),hi=Math.max(h?a[0]:a[1],h?b[0]:b[1]),fixed=h?a[1]:a[0];
    const side=Math.sign(fixed),hasDoor=lo< -2.3&&hi>2.3&&links[r.id].some(n=>{const q=rooms[n];return h?q.x===r.x&&Math.sign(q.z-r.z)===side:q.z===r.z&&Math.sign(q.x-r.x)===side;});
    for(const [l,u]of hasDoor?[[lo,-2.3],[2.3,hi]]:[[lo,hi]])solids.push(box([r.x+(h?l:fixed-.2),0,r.z+(h?fixed-.2:l)],[r.x+(h?u:fixed+.2),r.planFamily==='nave'?10.4:r.planFamily==='court'?3.6:8.4,r.z+(h?fixed+.2:u)],'wall',r.id));
   }
   if(r.id===1)for(const x of[-6,6])for(const z of[-6,6])solids.push(box([r.x+x-.45,0,r.z+z-.45],[r.x+x+.45,7.6,r.z+z+.45],'column',r.id));
   else for(const side of[-1,1])if(rng()>.25){const z=r.z+(rng()>.5?2.4:-2.4);solids.push(box([r.x+side*3.2-.85,0,z-.65],[r.x+side*3.2+.85,1.1,z+.65],'cover',r.id));}
  }
  const world={seed:String(seed).slice(0,32),depth,rooms,links,edges,floors,solids,start:[0,0,3],exit:null,enemies:[],targets:[[-3,1.5,-3],[0,1.5,-4],[3,1.5,-3]],pickups:[]};
  const candidates=rooms.filter(r=>r.id!==1).sort((a,b)=>H.route(world,1,b.id).length-H.route(world,1,a.id).length);world.exit=candidates[0].id;
  const occupied=H.shuffle(rooms.filter(r=>r.id!==1&&r.id!==world.exit),rng).slice(0,4);occupied.push(rooms[world.exit]);
  for(let i=0;i<occupied.length;i++){const r=occupied[i],hp=i===4?110+depth*8:65+depth*5;world.enemies.push({id:i,room:r.id,p:[r.x,1.05,r.z],hp,maxHp:hp,kind:i===4?'warden':i%2?'stalker':'cantor',speed:i===4?.65:i%2?.95:.4,cd:2+i*.4,wind:0,slow:0,dead:false,aware:false});}
  for(const r of rooms.filter(r=>r.id!==1))world.pickups.push({id:r.id,p:[r.x-3.4,.3,r.z],kind:r.id%3===0?'health':r.id%2?'cinder':'frost',taken:false});
  return world;
 }
 function cut(world,axis,fixed,low,high,bottom,top){
  const result=[],cross=axis===0?2:0;
  for(const b of world.solids){if(b.type!=='wall'||fixed<b.min[axis]-.15||fixed>b.max[axis]+.15||b.max[cross]<=low||b.min[cross]>=high||b.max[1]<=bottom||b.min[1]>=top){result.push(b);continue;}
   const emit=(min,max)=>{if(max.every((v,i)=>v-min[i]>.001))result.push({...b,min,max});};
   let lo=[...b.min],hi=[...b.max];hi[cross]=Math.max(lo[cross],low);emit(lo,hi);lo=[...b.min];hi=[...b.max];lo[cross]=Math.min(hi[cross],high);emit(lo,hi);
   lo=[...b.min];hi=[...b.max];lo[cross]=Math.max(lo[cross],low);hi[cross]=Math.min(hi[cross],high);hi[1]=bottom;emit(lo,hi);
   lo=[...b.min];hi=[...b.max];lo[cross]=Math.max(lo[cross],low);hi[cross]=Math.min(hi[cross],high);lo[1]=top;emit(lo,hi);
  }world.solids=result;
 }
 function elevate(world){
  const A=world.architecture;A.routes=[];A.extraLofts=[];const height=3.2;
  function floor(f){world.floors.push(f);if(f.type!=='stair')world.solids.push(box([f.x-f.w/2,f.y-.24,f.z-f.d/2],[f.x+f.w/2,f.y-.012,f.z+f.d/2],'gallery-deck'));}
  function guard(x,z,w,d,y=height){world.solids.push(box([x-w/2,y,z-d/2],[x+w/2,y+.88,z+d/2],'balustrade'));}
  function loft(r){if(r.id===1||A.lofts.some(l=>l.room===r.id)||A.extraLofts.some(l=>l.room===r.id))return;
   for(const side of[-1,1]){floor({id:'loft-new-'+r.id+'-'+side,type:'stair',x:r.x+side*4.85,z:r.z+.2,w:1.6,d:8.8,y:0,slopeZ:-height/8.8,anchorZ:r.z+4.6});floor(rect(r.x+side*4.85,r.z-5.05,1.6,1.7,height,'gallery','landing-new-'+r.id+'-'+side));}
   floor(rect(r.x,r.z-4.85,8.1,2.1,height,'gallery','walk-new-'+r.id));for(const side of[-1,1])guard(r.x+side*2.65,r.z-3.7,2.7,.16);
   A.extraLofts.push({room:r.id,entry:[r.x-4.85,0,r.z+4.75],otherEntry:[r.x+4.85,0,r.z+4.75],pad:[r.x,height,r.z-4.85]});
   world.solids=world.solids.filter(b=>!(b.type==='cover'&&Math.abs((b.min[0]+b.max[0])/2-r.x)<6&&Math.abs((b.min[2]+b.max[2])/2-r.z)<6));
  }
  const pairs=world.edges.filter(([a,b])=>world.rooms[a].z===world.rooms[b].z&&a!==1&&b!==1);
  const ranked=[...pairs].sort((a,b)=>Number(a.includes(world.exit))-Number(b.includes(world.exit))||a[0]-b[0]);
  if(ranked.length){let [a,b]=ranked[(hash(world.seed+'bridge'+world.depth)%Math.min(2,ranked.length))];if(world.rooms[a].x>world.rooms[b].x)[a,b]=[b,a];const r=world.rooms[a],s=world.rooms[b];loft(r);loft(s);const z=r.z-4.85,x1=r.x+3.9,x2=s.x-3.9;
   floor(rect((x1+x2)/2,z,x2-x1,2.4,height,'skybridge','high-bridge'));
   world.solids.pop();for(const [l,u,front] of [[x1,r.x+5.95,z+.45],[r.x+5.95,s.x-5.95,z+1.2],[s.x-5.95,x2,z+.45]])world.solids.push(box([l,height-.24,z-1.2],[u,height-.012,front],'gallery-deck'));
   cut(world,0,r.x+r.w/2,z-1.35,z+1.35,height,5.9);cut(world,0,s.x-s.w/2,z-1.35,z+1.35,height,5.9);
   guard((x1+x2)/2,z-1.22,x2-x1,.16);guard((r.x+s.x)/2,z+1.22,s.x-r.x-11.9,.16);
   A.routes.push({id:'high-bridge',label:'Processional Skywalk',from:a,to:b,y:height,a:[r.x,height,z],b:[s.x,height,z],entry:[r.x-4.85,0,r.z+4.75],exit:[s.x+4.85,0,s.z+4.75]});
   world.pickups.push({id:'relic-skywalk',kind:'relic',p:[(x1+x2)/2,height+.3,z],label:'Skywalk reliquary',taken:false});
  }
  const tower=world.rooms.find(r=>r.planFamily==='belfry'&&r.id!==world.exit)||world.rooms.find(r=>r.id!==1&&r.id!==world.exit&&!ranked[0]?.includes(r.id));
  if(tower){loft(tower);const r=tower,x=r.x+2.55,z=r.z;
   const rails=[];for(const b of world.solids){if(b.type==='balustrade'&&b.min[1]>=3.19&&b.max[1]<4.2&&b.min[2]<z-3.5&&b.max[2]>z-4.1&&b.min[0]<x+1.05&&b.max[0]>x-1.05){if(b.min[0]<x-1.05)rails.push({...b,max:[x-1.05,b.max[1],b.max[2]]});if(b.max[0]>x+1.05)rails.push({...b,min:[x+1.05,b.min[1],b.min[2]]});}else rails.push(b);}world.solids=rails;
   floor({id:'belfry-stair',type:'stair',x,z:z-.25,w:1.9,d:9.2,y:height,slopeZ:height/9.2,anchorZ:z-4.85});
   floor(rect(r.x,z+4.9,8.7,1.8,6.4,'gallery','belfry-crown'));
   world.solids.pop();for(const [x0,x1,z0] of [[r.x-4.35,x-1.05,z+4],[x+1.05,r.x+4.35,z+4],[x-1.05,x+1.05,z+4.65]])world.solids.push(box([x0,6.16,z0],[x1,6.388,z+5.8],'gallery-deck'));
   guard(r.x,z+5.83,8.7,.16,6.4);guard(r.x-2,z+3.98,4.7,.16,6.4);guard(r.x+4.43,z+4.9,.16,1.8,6.4);guard(r.x-4.43,z+4.9,.16,1.8,6.4);
   A.tower={room:r.id,label:'Belfry Crown',entry:[x,height,z-4.85],top:[x,6.4,z+4.9],reward:[r.x-2.5,6.4,z+4.9]};
   world.pickups.push({id:'relic-belfry',kind:'relic',p:[r.x-2.5,6.7,z+4.9],label:'Belfry reliquary',taken:false});
  }
  for(const r of world.rooms.filter(r=>['nave','archive'].includes(r.planFamily))){const half=r.w/2+.4,base=(r.planFamily==='nave'?10.4:8.4)+1.6,N=32;for(let i=0;i<N;i++){const x0=-half+2*half*i/N,x1=-half+2*half*(i+1)/N,y=3*(1-Math.min(Math.abs(x0),Math.abs(x1))/half);world.solids.push(box([r.x+x0,base,r.z-r.d/2-.3],[r.x+x1,base+Math.max(.03,y),r.z+r.d/2+.3],'roof-volume',r.id));}}
  world.decorations=world.rooms.filter(r=>r.id===1||r.planFamily==='archive').slice(0,3).map(r=>({x:r.x+r.w/2-1.25,z:r.z+r.d/2-2.2,yaw:0}));
  for(const p of world.decorations)world.solids.push(box([p.x-.40,0,p.z-.40],[p.x+.40,2.35,p.z+.40],'statue-plinth'));
  A.version=2;return world;
 }
 const api={FAMILIES,generate,elevate};root.CathedralDistricts=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
