/* The outer ring is added to the maintained Living Cathedral, not substituted
 * for it. Every bridge, doorway, stair, landing and rail has shared geometry. */
(function(root){'use strict';
 const bestiary=root.VesperBestiary||(typeof require!=='undefined'?require('./bestiary.js'):null);
 const districts=[['procession','Ivory Procession'],['cloister','Sable Cloister'],['rosehall','Roseglass Nave'],['sepulchre','Winged Sepulchre'],['orchard','Lantern Orchard'],['crucible','Ember Crucible'],['ossuary','Ossuary Cells'],['foundry','Chain Foundry'],['observatory','Hollow Observatory'],['chapel','Tide Chapel'],['apse','Shattered Apse'],['sacristy','Veiled Sacristy'],['roost','Gargoyle Roost'],['vault','Reliquary Vault'],['choir-garden','Drowned Choir'],['eclipse','Eclipse Gate']];
 function expand(world,H){
  const random=H.rng(H.hash(world.seed+'-dominions-'+world.depth)),cols=[world.rooms[0].x-32,world.rooms[0].x,0,world.rooms[2].x,world.rooms[2].x+32],rows=[32,0,world.rooms[3].z,world.rooms[6].z,world.rooms[6].z-32];
  const positions=[];for(let c=0;c<5;c++)positions.push([c,0]);for(let r=1;r<5;r++)positions.push([4,r]);for(let c=3;c>=0;c--)positions.push([c,4]);for(let r=3;r>0;r--)positions.push([0,r]);
  const coord=new Map();for(let r=0;r<3;r++)for(let c=0;c<3;c++)coord.set((c+1)+','+(r+1),r*3+c);
  const rect=(id,x,z,w,d,y=0,type='stone')=>({id,x,z,w,d,y,type});
  function box(min,max,type,room){world.solids.push({min,max,type,room});}
  function rail(x,z,w,d,y=0){box([x-w/2,y,z-d/2],[x+w/2,y+.9,z+d/2],'balustrade');}
  function cut(axis,fixed,lo,hi,y0=0,y1=3.05){const cross=axis===0?2:0,solids=[];for(const b of world.solids){if(b.type!=='wall'||fixed<b.min[axis]-.1||fixed>b.max[axis]+.1||b.min[cross]>=hi||b.max[cross]<=lo||b.min[1]>=y1||b.max[1]<=y0){solids.push(b);continue;}const emit=(min,max)=>{if(max.every((v,i)=>v>min[i]+.001))solids.push({...b,min,max});};let mn=[...b.min],mx=[...b.max];mx[cross]=lo;emit(mn,mx);mn=[...b.min];mx=[...b.max];mn[cross]=hi;emit(mn,mx);mn=[...b.min];mx=[...b.max];mn[cross]=Math.max(lo,mn[cross]);mx[cross]=Math.min(hi,mx[cross]);mx[1]=y0;emit(mn,mx);mn=[...b.min];mx=[...b.max];mn[cross]=Math.max(lo,mn[cross]);mx[cross]=Math.min(hi,mx[cross]);mn[1]=y1;emit(mn,mx);}world.solids=solids;}
  for(let i=0;i<positions.length;i++){
   const [c,row]=positions[i],id=world.rooms.length,[planFamily,label]=districts[i],w=20+(random()>.55?2:0),d=20+(random()>.6?2:0),x=cols[c],z=rows[row],r={id,x,z,w,d,planFamily,label,style:i%3,outer:true,wallHeight:[0,4,8,12].includes(i)?4.8:8.4,outline:[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]};
   world.rooms.push(r);world.links.push([]);coord.set(c+','+row,id);world.floors.push(rect('dominion-room-'+id,x,z,w,d));
   box([x-w/2-.2,0,z-d/2],[x-w/2+.2,r.wallHeight,z+d/2],'wall',id);box([x+w/2-.2,0,z-d/2],[x+w/2+.2,r.wallHeight,z+d/2],'wall',id);
   box([x-w/2,0,z-d/2-.2],[x+w/2,r.wallHeight,z-d/2+.2],'wall',id);box([x-w/2,0,z+d/2-.2],[x+w/2,r.wallHeight,z+d/2+.2],'wall',id);
   for(const side of[-1,1])box([x+side*3.5-.65,0,z+2.8],[x+side*3.5+.65,1.15,z+4.1],'cover',id);
   world.pickups.push({id:'outer-supply-'+id,kind:i%3===0?'health':i%3===1?'cinder':'frost',p:[x+3.5,.3,z-1.4],taken:false});
  }
  function connect(a,b){if(world.links[a].includes(b))return;world.links[a].push(b);world.links[b].push(a);world.edges.push([a,b]);const p=world.rooms[a],q=world.rooms[b],vertical=p.x===q.x,sign=Math.sign(vertical?q.z-p.z:q.x-p.x),v1=(vertical?p.z:p.x)+sign*(vertical?p.d:p.w)/2,v2=(vertical?q.z:q.x)-sign*(vertical?q.d:q.w)/2,mid=(v1+v2)/2,length=Math.abs(v2-v1)+.4;
   world.floors.push(rect('dominion-link-'+a+'-'+b,vertical?p.x:mid,vertical?mid:p.z,vertical?4.6:length,vertical?length:4.6,0,'bridge'));
   for(const r of[p,q]){const fixed=vertical?r.z+Math.sign((r===p?q:p).z-r.z)*r.d/2:r.x+Math.sign((r===p?q:p).x-r.x)*r.w/2,center=vertical?r.x:r.z;cut(vertical?2:0,fixed,center-2.5,center+2.5,0,3.05);}
   for(const side of[-1,1])rail(vertical?p.x+side*2.15:mid,vertical?mid:p.z+side*2.15,vertical?.15:length,vertical?length:.15);
  }
  for(let i=0;i<positions.length;i++){const p=positions[i],q=positions[(i+1)%positions.length];connect(coord.get(p+''),coord.get(q+''));}
  // All twelve radial approaches stay open. The pre-existing interior still
  // varies by seed, while the new perimeter provides useful return loops.
  for(let c=1;c<=3;c++){connect(coord.get(c+',0'),coord.get(c+',1'));connect(coord.get(c+',4'),coord.get(c+',3'));}
  for(let row=1;row<=3;row++){connect(coord.get('0,'+row),coord.get('1,'+row));connect(coord.get('4,'+row),coord.get('3,'+row));}
  const paths=[];
  function deck(id,x,z,w,d,y,joinXs=[]){world.floors.push(rect(id,x,z,w,d,y,'gallery'));const boundaries=[x-w/2,...joinXs.flatMap(v=>[v-1.4,v+1.4]),x+w/2].filter(v=>v>=x-w/2&&v<=x+w/2).sort((a,b)=>a-b);for(let i=1;i<boundaries.length;i++){const a=boundaries[i-1],b=boundaries[i],join=joinXs.some(v=>(a+b)/2>v-1.4&&(a+b)/2<v+1.4);box([a,y-.24,z-d/2],[b,y-.012,z+d/2-(join?.65:0)],'gallery-deck');}}
  function stair(id,x,z0,z1,y0,y1){world.floors.push({id,type:'stair',x,z:(z0+z1)/2,w:2.2,d:Math.abs(z1-z0),y:y0,slopeZ:(y1-y0)/(z1-z0),anchorZ:z0});for(const side of[-1,1])for(let n=0;n<16;n++){if(y0>0&&n<2)continue;const t=(n+.5)/16,z=z0+(z1-z0)*t,y=y0+(y1-y0)*t;rail(x+side*1.25,z,.14,Math.abs(z1-z0)/16,y);}}
  const lofts=[];for(const r of world.rooms.filter(r=>r.outer)){
   const y=3.2,z=r.z-3.7;for(const side of[-1,1])stair('outer-stair-'+r.id+'-'+side,r.x+side*6.5,r.z+6.1,r.z-2.7,0,y);
   deck('outer-gallery-'+r.id,r.x,z,15.6,2.6,y,[r.x-6.5,r.x+6.5]);rail(r.x,z-1.35,15.6,.16,y);
   for(const side of[-1,1])rail(r.x+side*3.5,z+1.35,3,.16,y);
   const entry=[r.x-6.5,0,r.z+6.3],pad=[r.x,y,z],otherEntry=[r.x+6.5,0,r.z+6.3];lofts.push({room:r.id,label:r.label+' gallery',entry,otherEntry,pad});paths.push({label:r.label+' ascent',points:[entry,[r.x-6.5,0,r.z-3.7],pad,[r.x+6.5,0,r.z-3.7],otherEntry]});
   if((r.id-9)%2===0)world.pickups.push({id:'outer-relic-'+r.id,kind:'relic',p:[r.x,y+.3,z],label:r.label+' seal',taken:false});
  }
  const skyways=[];for(const row of[0,4])for(let c=0;c<4;c++){
   const p=world.rooms[coord.get(c+','+row)],q=world.rooms[coord.get((c+1)+','+row)],z=p.z-3.7,x1=p.x+7.6,x2=q.x-7.6,y=3.2,id='outer-skyway-'+p.id+'-'+q.id;
   deck(id,(x1+x2)/2,z,x2-x1,2.6,y);for(const side of[-1,1])rail((x1+x2)/2,z+side*1.35,x2-x1,.16,y);
   cut(0,p.x+p.w/2,z-1.5,z+1.5,y,6.1);cut(0,q.x-q.w/2,z-1.5,z+1.5,y,6.1);
   const path={id,label:(row===0?'Ivory':'Ember')+' high walk '+(c+1),from:p.id,to:q.id,y,a:[p.x,y,z],b:[q.x,y,z],entry:[p.x-6.5,0,p.z+6.3],exit:[q.x+6.5,0,q.z+6.3]};skyways.push(path);world.architecture.routes.push(path);paths.push({label:path.label,points:[path.a,path.b]});
  }
  const towers=[];for(const id of[9,17]){const r=world.rooms[id],x=r.x,z=r.z;stair('outer-crown-stair-'+id,x,z-3.7,z+6.3,3.2,6.4);
   // The upper stair joins from the north, so reverse the slab clearance.
   world.floors.push(rect('outer-crown-'+id,x,z+6.9,13.4,2,6.4,'gallery'));
   box([x-6.7,6.16,z+5.9],[x-1.4,6.388,z+7.9],'gallery-deck');box([x+1.4,6.16,z+5.9],[x+6.7,6.388,z+7.9],'gallery-deck');box([x-1.4,6.16,z+6.55],[x+1.4,6.388,z+7.9],'gallery-deck');
   rail(x,z+7.95,13.4,.16,6.4);for(const side of[-1,1])rail(x+side*4,z+5.85,5.3,.16,6.4);
   const t={room:id,label:id===9?'Ivory Crown':'Ember Crown',entry:[x,3.2,z-3.7],top:[x,6.4,z+6.9],reward:[x-4.5,6.4,z+6.9]};towers.push(t);paths.push({label:t.label,points:[t.entry,t.top,t.reward]});world.pickups.push({id:'crown-'+id,kind:'relic',p:[...t.reward].map((v,i)=>i===1?v+.3:v),label:t.label+' reliquary',taken:false});
  }
  const types=H.shuffle(bestiary.kinds,random);for(let i=0;i<16;i++){const r=world.rooms[9+i],e=bestiary.make(types[i%12],world.enemies.length,r,world.depth);e.p[2]-=.4;world.enemies.push(e);}
  world.architecture.outerLofts=lofts;world.dominions={version:1,lofts,skyways,towers,paths,outerRooms:16,primaryWardens:5,enemyTypes:12};return world;
 }
 const api=Object.freeze({expand,bestiary,districts});root.HollowDominions=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
