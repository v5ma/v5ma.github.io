/* Original radial-gravity world. Every position is a unit normal on the same
 * sphere. Movement follows great-circle steps and parallel-transports the
 * camera basis; there is no flat level disguised by a spherical backdrop. */
export const VERSION='0.1.0',RADIUS=22,SAVE_KEY='svgn.little-planet.v1';
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const mul=(a,t)=>a.map(v=>v*t);
export const norm=a=>{const l=Math.hypot(...a);return l>1e-9?mul(a,1/l):[0,1,0];};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const tangent=(v,n)=>norm(add(v,mul(n,-dot(v,n))));
export function rotate(v,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));}
export const at=(x,z)=>{const a=x/RADIUS,b=z/RADIUS;return [Math.sin(a)*Math.cos(b),Math.cos(a)*Math.cos(b),Math.sin(b)];};
export const distance=(a,b)=>Math.acos(clamp(dot(a,b),-1,1))*RADIUS;
export function height(n){const base=.18*Math.sin(n[0]*11+n[2]*6)+.12*Math.cos(n[2]*12-n[1]*3);const river=n[1]>.12&&Math.abs(n[0]-(.24+.055*Math.sin(n[2]*9)))<.052;return river?-.58:base;}
export const point=(n,lift=0)=>mul(n,RADIUS+height(n)+lift);
export const rand=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function world(){
 const sites=[
  {id:'post',name:'The little post office',x:0,z:5,type:'post',color:'#ec9b40',message:'Three parcels. Three neighbors. One entire little planet.'},
  {id:'cabin',name:'Pinewood cabin',x:-9,z:-7,type:'cabin',color:'#df7850',message:'You found the forest path! Your parcel made it around the world.'},
  {id:'mill',name:'Riverwheel cottage',x:11,z:4,type:'mill',color:'#e6b957',message:'The bridge is the quick way across. The river is safe to wade through.'},
  {id:'beacon',name:'The hilltop observatory',x:9,z:-12,type:'beacon',color:'#62ac9d',message:'Look out past the trees. There is more of this world on its far side.'},
  {id:'garden',name:'Copperleaf garden',x:-11,z:11,type:'garden',color:'#e7aebd',message:'Try the unicycle with F. Gaze around with your mouse, or press V to change the view.'},
  {id:'harbor',name:'Moon-side harbor',x:48,z:-3,type:'cabin',color:'#88b8cc',message:'The world really does continue around the back. Welcome to the quiet side.'}
 ].map(s=>({...s,n:at(s.x,s.z),mail:at(s.x,s.z+2.1)}));
 const homes=sites.filter(s=>['cabin','mill','beacon'].includes(s.id));
 const trees=[];for(let i=0;i<230;i++){const lon=rand(i)*Math.PI*2,lat=Math.asin(rand(i+991)*2-1);const n=at(lon*RADIUS,lat*RADIUS);
  if(sites.some(s=>distance(s.n,n)<3.8)||Math.abs(n[2])<.09||height(n)<-.3)continue;
  // Leave generous walkable space around the first delivery road.
  if(n[1]>.55&&Math.abs(n[0])<.14)continue;
  trees.push({id:'tree-'+i,n,size:.75+rand(i+2)*.8,style:i%4===0?'oak':'fir',seed:i});
 }
 const rocks=[[-2,-17,5.4],[2,-18,7],[5,-19,4.8],[-14,-14,3.4],[40,12,4],[47,14,6]].map(([x,z,size],i)=>({n:at(x,z),size,id:'rock-'+i}));
 const stars=[[-4,-4],[-7,-2],[-12,1],[-5,10],[4,10],[8,7],[11,-2],[13,-9],[4,-11],[-11,-11],[-16,8],[17,1],[30,0],[42,0],[52,3],[62,-2]].map(([x,z],i)=>({id:'stamp-'+i,n:at(x,z)}));
 return {sites,homes,trees,rocks,stars};
}
export const WORLD=world();
export function readSave(raw){try{const s=JSON.parse(raw);if(s?.v!==1)return null;return {delivered:Array.isArray(s.delivered)?s.delivered.filter(id=>WORLD.homes.some(h=>h.id===id)):[],stamps:Array.isArray(s.stamps)?s.stamps.filter(id=>WORLD.stars.some(h=>h.id===id)):[],complete:s.complete===true,ride:s.ride===true};}catch{return null;}}
export function initial(saved=null){return {n:at(0,0),north:[0,0,-1],facing:[0,0,-1],speed:0,lift:0,vy:0,energy:1,ride:saved?.ride??false,delivered:new Set(saved?.delivered||[]),stamps:new Set(saved?.stamps||[]),complete:!!saved?.complete,time:0,steps:0,distance:0,toast:'',toastT:0,lastSite:null,events:[]};}
export const saveData=s=>({v:1,delivered:[...s.delivered],stamps:[...s.stamps],complete:s.complete,ride:s.ride});
export function event(s,type,data={}){s.events.push({type,step:s.steps,...data});if(s.events.length>150)s.events.shift();}
function blocked(n){for(const h of WORLD.sites)if(!['garden'].includes(h.type)&&distance(n,h.n)<1.25)return true;for(const r of WORLD.rocks)if(distance(n,r.n)<r.size*.37)return true;for(const t of WORLD.trees)if(distance(n,t.n)<.35)return true;return false;}
export function nearest(s){let best=null;for(const site of WORLD.sites){const d=distance(s.n,site.mail);if(d<2.7&&(!best||d<best.distance))best={...site,distance:d};}return best;}
export function interact(s){const p=nearest(s);if(!p){s.toast='Get closer to a striped mailbox or a neighbor.';s.toastT=2;return false;}
 s.lastSite=p.id;s.toastT=5;s.toast=p.message;
 if(WORLD.homes.some(h=>h.id===p.id)&&!s.delivered.has(p.id)){s.delivered.add(p.id);s.toast='DELIVERED · '+p.name+' · '+s.delivered.size+'/3';event(s,'delivery',{id:p.id});return true;}
 if(p.id==='post'&&s.delivered.size===3&&!s.complete){s.complete=true;s.toast='THE LITTLE WORLD IS CONNECTED. Your first planetary dispatch is complete!';event(s,'complete');return true;}
 event(s,'talk',{id:p.id});return false;
}
export function switchRide(s){s.ride=!s.ride;s.toast=s.ride?'Electric unicycle · hold Shift for a boost':'On foot · take the scenic route';s.toastT=3;event(s,'ride',{ride:s.ride});}
export function target(s){if(s.delivered.size===3)return WORLD.sites[0];const missing=WORLD.homes.filter(h=>!s.delivered.has(h.id));return missing.reduce((a,b)=>!a||distance(s.n,b.mail)<distance(s.n,a.mail)?b:a,null);}
export function step(s,input,dt=1/60){if(!Number.isFinite(dt)||dt<=0||dt>.05)throw Error('Use bounded fixed simulation steps.');s.steps++;s.time+=dt;s.toastT=Math.max(0,s.toastT-dt);
 let dir=input.direction;if(!dir||dir.length!==3||!dir.every(Number.isFinite)||Math.hypot(...dir)<.01)dir=null;
 const boosting=!!input.boost&&!!dir&&s.energy>.03;s.energy=clamp(s.energy+(boosting?-.16:.14)*dt,0,1);
 const desired=dir?(s.ride?boosting?9:6:boosting?5.5:3.8):0;s.speed+=(desired-s.speed)*Math.min(1,dt*(dir?8:13));
 if(input.jump&&s.lift<=.001){s.vy=s.ride?3.4:3.8;event(s,'jump');}s.vy-=10*dt;s.lift=Math.max(0,s.lift+s.vy*dt);if(s.lift===0)s.vy=0;
 if(dir){dir=tangent(dir,s.n);const axis=norm(cross(s.n,dir));let angle=s.speed*dt/RADIUS;if(height(s.n)<-.3&&s.lift===0)angle*=.63;const next=norm(rotate(s.n,axis,angle));
  if(!blocked(next)){s.n=next;s.north=tangent(rotate(s.north,axis,angle),s.n);s.facing=tangent(rotate(dir,axis,angle),s.n);s.distance+=angle*RADIUS;}else{s.speed*=.65;}
 }
 for(const p of WORLD.stars)if(!s.stamps.has(p.id)&&distance(s.n,p.n)<1.1){s.stamps.add(p.id);event(s,'stamp',{id:p.id});s.toast='POSTMARK FOUND · '+s.stamps.size+'/16';s.toastT=2;}
}
