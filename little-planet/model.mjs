/* Spherical coordinates are the world, not a curved camera effect over a plane.
   Pure deterministic gameplay; all rendering and browser storage live elsewhere. */
export const VERSION='0.1.0', R=32, SAVE_KEY='svgn.little-planet.v1';
export const add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const unit=a=>{const m=Math.hypot(...a);return m>1e-10?scale(a,1/m):[0,1,0];};
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const ring=(lon,lat=0)=>[Math.sin(lon)*Math.cos(lat),Math.cos(lon)*Math.cos(lat),Math.sin(lat)];
export function rotate(v,axis,a){const c=Math.cos(a),s=Math.sin(a);return add(add(scale(v,c),scale(cross(axis,v),s)),scale(axis,dot(axis,v)*(1-c)));}
export const distance=(a,b)=>Math.acos(clamp(dot(a,b),-1,1))*R;
export const rand=n=>{const x=Math.sin(n*19.731+12.479)*18274.153;return x-Math.floor(x);};
export const riverAxis=ring(1.3+Math.PI/2);
export function water(n){return Math.abs(dot(n,riverAxis))<.046&&Math.abs(n[2])>.065;}
export function height(n){
 const road=Math.abs(n[2])<.075;
 if(road)return .1;
 if(water(n))return -.38;
 return .18+.48*Math.sin(n[0]*8+n[1]*2)*Math.sin(n[2]*7)+.25*Math.cos(n[1]*13-n[2]*5);
}
export const tangent=(n,dir)=>unit(add(dir,scale(n,-dot(n,dir))));
export function travel(n,f,d){const axis=unit(cross(n,f)),a=d/R;return {n:unit(rotate(n,axis,a)),f:unit(rotate(f,axis,a))};}
export function makeWorld(){
 const labels=['Post Office Green','Applewood Orchard','Windmill Crossing','Lantern Forest','Farshore Lighthouse','Copperleaf Market','Millpond Meadow','Starfall Lookout'];
 const kinds=['post','orchard','mill','forest','lighthouse','market','pond','tower'];
 const stops=labels.map((name,i)=>({id:'stop-'+i,name,kind:kinds[i],lon:i*Math.PI/4,n:ring(i*Math.PI/4,-.065),house:ring(i*Math.PI/4,-.18),person:['Mira','Oren','Pip','Rowan','Ada','Nia','Finn','Sol'][i],delivery:[1,2,4,6].includes(i),message:['There is no edge here. Follow the gold path and you will come home again.','The apples grow on every side of our world. Take a basket for the road.','Our bridge crosses the same river you can see on the other side of the planet.','Try a path off the main ring. The forest hides some of our old survey markers.','You made it to the far side. Look back toward the little world you came from.','The market is small, but all roads bring someone new.','Stop for a moment. The wind sounds different by the water.','Those lights are old survey beacons. Three still need a courier to wake them.'][i]}));
 const beacons=[{id:'beacon-0',n:ring(.35,-.70),name:'Pinecrest beacon'},{id:'beacon-1',n:ring(2.4,.68),name:'Cloudbank beacon'},{id:'beacon-2',n:ring(4.6,-.62),name:'Millpond beacon'}];
 const paths=[{id:'round-world',nodes:Array.from({length:193},(_,i)=>ring(i/192*Math.PI*2)),width:2.7}];
 for(const s of stops)paths.push({id:s.id,nodes:[ring(s.lon),s.n,s.house],width:1.4});
 for(const [i,b]of beacons.entries())paths.push({id:b.id,nodes:[ring([.35,2.4,4.6][i]),b.n],width:1.45});
 const mountains=[[.78,-.97,7.8],[.98,-.80,5.6],[3.48,.91,6.2],[5.5,-.87,5.4]].map(([lon,lat,size])=>({n:ring(lon,lat),size}));
 const trees=[],rocks=[],coins=[],colliders=mountains.map((m,i)=>({n:m.n,radius:m.size*.30,id:'mountain-'+i}));
 // Uniform spherical sampling, kept away from primary trail and door approaches.
 for(let i=0;i<210;i++){
  const n=unit([Math.cos(i*2.39996)*Math.sqrt(1-Math.pow(1-2*(i+.5)/210,2)),1-2*(i+.5)/210,Math.sin(i*2.39996)*Math.sqrt(1-Math.pow(1-2*(i+.5)/210,2))]);
  if(Math.abs(n[2])<.16||water(n)||stops.some(s=>distance(n,s.house)<4.1)||beacons.some(b=>distance(n,b.n)<3))continue;
  const tree={n,seed:i,size:2.0+rand(i)*2.6,pine:i%4!==0};trees.push(tree);colliders.push({n,radius:.47,id:'tree-'+i});
 }
 for(let i=0;i<28;i++){const n=ring(i*2.399,-.36-rand(i+12)*.9);if(water(n)||stops.some(s=>distance(n,s.house)<4)||beacons.some(b=>distance(n,b.n)<3))continue;rocks.push({n,seed:i,size:.5+rand(i+74)});colliders.push({n,radius:.6,id:'rock-'+i});}
 for(const s of stops)colliders.push({n:s.house,radius:s.kind==='lighthouse'?1.6:2.0,id:s.id});
 for(let i=0;i<32;i++)coins.push({id:'stamp-'+i,n:ring((i+.5)/32*Math.PI*2,i%4===0?.09:0)});
 for(const [j,b]of beacons.entries())for(let i=1;i<5;i++){const lon=[.35,2.4,4.6][j],lat=Math.asin(b.n[2])*i/5;coins.push({id:'branch-'+j+'-'+i,n:ring(lon,lat)});}
 return {stops,beacons,paths,trees,rocks,colliders,coins,mountains};
}
export function newState(saved=null){return {n:[0,1,0],f:[1,0,0],speed:0,lift:0,vy:0,mode:'foot',distance:0,steps:0,time:0,delivered:new Set(saved?.delivered||[]),visited:new Set(saved?.visited||['stop-0']),collected:new Set(saved?.collected||[]),lit:new Set(saved?.lit||[]),completed:!!saved?.completed,toast:'Walk the round-world path. Four neighbors are waiting for their parcels.',toastT:6,events:[],laps:0,journey:0};}
export function notice(s,text){s.toast=text;s.toastT=4.5;}
export function event(s,type,info={}){s.events.push({type,step:s.steps,...info});if(s.events.length>120)s.events.shift();}
export function toggleRide(s){if(s.lift>.15)return false;s.mode=s.mode==='foot'?'bike':'foot';s.speed=clamp(s.speed,-3,5);notice(s,s.mode==='bike'?'Courier cycle unfolded. Shift pedals faster; Space hops.':'Back on foot. Explore the trails and talk to your neighbors.');event(s,'mode',{mode:s.mode});return true;}
export function nearest(s,w){
 const places=[...w.stops.map(p=>({...p,type:'stop'})),...w.beacons.map(p=>({...p,type:'beacon'}))];places.sort((a,b)=>distance(s.n,a.n)-distance(s.n,b.n));return distance(s.n,places[0].n)<3.1?places[0]:null;
}
export function interact(s,w){const p=nearest(s,w);if(!p){notice(s,'Get closer to a neighbor or a survey beacon.');return false;}
 if(p.type==='beacon'){if(!s.lit.has(p.id)){s.lit.add(p.id);event(s,'beacon',{id:p.id});notice(s,p.name+' is shining again. '+s.lit.size+' / 3 restored.');}else notice(s,p.name+' is already shining.');return true;}
 if(p.delivery&&!s.delivered.has(p.id)){s.delivered.add(p.id);event(s,'delivery',{id:p.id});notice(s,p.person+': Parcel received! '+s.delivered.size+' / 4 delivered.');return true;}
 if(p.id==='stop-0'&&s.delivered.size===4&&!s.completed){s.completed=true;event(s,'complete');notice(s,'A world of good news. First delivery round complete — keep exploring!');return true;}
 notice(s,p.person+': '+p.message);event(s,'talk',{id:p.id});return true;
}
export function step(s,w,input,dt){
 if(!Number.isFinite(dt)||dt<=0||dt>.051)return;
 s.steps++;s.time+=dt;s.toastT=Math.max(0,s.toastT-dt);
 const steer=clamp(Number(input.steer)||0,-1,1),throttle=clamp(Number(input.throttle)||0,-1,1);
 s.f=tangent(s.n,rotate(s.f,s.n,steer*dt*(s.mode==='bike'?1.9:2.6)));
 const top=(s.mode==='bike'?(input.boost?12:8):(input.boost?7:4.3))*(water(s.n)?.45:1),target=throttle*top;
 s.speed+=(target-s.speed)*Math.min(1,dt*(s.mode==='bike'?3.2:9));
 if(input.jump&&s.lift===0){s.vy=s.mode==='bike'?5.5:6.7;s.lift=.001;event(s,'jump');}
 if(s.lift>0){s.vy-=17*dt;s.lift=Math.max(0,s.lift+s.vy*dt);if(s.lift===0)s.vy=0;}
 const dist=s.speed*dt,moved=travel(s.n,s.f,dist);
 const blocked=s.lift<1.8&&w.colliders.some(c=>distance(moved.n,c.n)<c.radius+.26);
 if(!blocked){s.n=moved.n;s.f=moved.f;s.distance+=Math.abs(dist);s.journey+=dist;}
 else s.speed*=.65;
 s.laps=Math.floor(s.distance/(2*Math.PI*R));
 for(const p of w.stops)if(distance(s.n,p.n)<5&&!s.visited.has(p.id)){s.visited.add(p.id);event(s,'discover',{id:p.id});notice(s,'Discovered '+p.name);}
 for(const c of w.coins)if(!s.collected.has(c.id)&&distance(s.n,c.n)<1.25){s.collected.add(c.id);event(s,'stamp',{id:c.id});}
}
export function target(s,w){if(s.delivered.size===4)return w.stops[0];return w.stops.filter(p=>p.delivery&&!s.delivered.has(p.id)).sort((a,b)=>distance(s.n,a.n)-distance(s.n,b.n))[0];}
export function saveData(s){return {version:1,delivered:[...s.delivered],visited:[...s.visited],collected:[...s.collected],lit:[...s.lit],completed:s.completed};}
export function readSave(raw,w){try{if(!raw||raw.length>12000)return null;const a=JSON.parse(raw);if(a.version!==1)return null;const ids=(v,allowed)=>Array.isArray(v)?[...new Set(v.filter(x=>allowed.has(x)))]:[];
 const delivered=ids(a.delivered,new Set(w.stops.filter(s=>s.delivery).map(s=>s.id)));return {delivered,visited:ids(a.visited,new Set(w.stops.map(s=>s.id))),collected:ids(a.collected,new Set(w.coins.map(s=>s.id))),lit:ids(a.lit,new Set(w.beacons.map(s=>s.id))),completed:!!a.completed&&delivered.length===4};}catch{return null;}}
