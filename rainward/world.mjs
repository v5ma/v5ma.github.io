/* Original fictional level and game collision geometry. */
export const VERSION='0.1.0';
export const BOUNDS={x0:-35,x1:35,z0:-49,z1:34};
export const START={x:0,z:27};
const box=(id,x,z,w,d,h,kind='wall',bottom=0)=>({id,x,z,w,d,h,kind,bottom});
export const OBSTACLES=[
 box('west-edge',-35.8,-7,1.6,86,8),box('east-edge',35.8,-7,1.6,86,8),box('south-edge',0,35,72,2,4),box('north-edge',0,-50,72,2,7),
 box('clinic-west',-28,1,1,17,4.8,'brick'),box('clinic-north',-21,-7,14,1,4.8,'brick'),
 box('clinic-east-a',-14,-4.5,1,6,4.8,'brick'),box('clinic-east-b',-14,6.5,1,5,4.8,'brick'),
 box('clinic-front-a',-25,9,7,1,4.8,'brick'),box('clinic-front-b',-15.5,9,3,1,4.8,'brick'),
 box('clinic-counter',-20,2,5,1.2,1,'counter'),box('clinic-shelf',-26,-3,1.2,5,2.8,'shelf'),
 box('depot-east',28,-19,1,22,5.5,'brick'),box('depot-west-a',14,-24,1,12,5.5,'brick'),box('depot-west-b',14,-11,1,4,5.5,'brick'),
 box('depot-top-a',16,-30,5,1,5.5,'brick'),box('depot-top-b',25,-30,6,1,5.5,'brick'),
 box('depot-front-a',16,-8,5,1,5.5,'brick'),box('depot-front-b',25,-8,6,1,5.5,'brick'),
 box('depot-shelves',26,-22,1.4,10,3.4,'shelf'),box('depot-crates',20,-24,3,2,1,'crate'),
 box('bus',7,13,2.7,8,2.3,'bus'),box('car-west',-7,11,4.8,2.2,1.05,'car'),
 box('crawl-slab',-8,19,7,3,0.7,'slab',0.67),box('crawl-pier-a',-11.3,19,.6,3,1.4,'pillar'),box('crawl-pier-b',-4.7,19,.6,3,1.4,'pillar'),
 box('planter-1',-3,1,4,2,1,'planter'),box('planter-2',7,-4,4,2,1,'planter'),box('fountain',0,-15,6,5,.8,'fountain'),
 box('market-low',-7,-17,2,5,.95,'counter'),box('market-long',-22,-19,7,2,1,'counter'),
 box('north-truck',-9,-33,3,7,2.1,'truck'),box('north-planter',8,-34,4,2,1,'planter'),
 box('shelter-wall',-4,29,1,8,3,'brick'),box('shelter-rear',0,32,9,1,3,'brick'),
 box('quay-pier-1',-5,-43,1.2,2,4,'pillar'),box('quay-pier-2',5,-43,1.2,2,4,'pillar'),
 box('west-ruin',-32,-30,5,20,7,'brick'),box('east-ruin',32,12,5,20,8,'brick'),
];
export const GRASS=[{x:-19,z:16,w:11,d:9},{x:-20,z:-12,w:11,d:5},{x:1,z:5,w:6,d:6},{x:9,z:-18,w:5,d:10},{x:-16,z:-27,w:7,d:7},{x:18,z:3,w:8,d:8},{x:16,z:-36,w:10,d:6}];
export const ITEMS=[
 {id:'rations',x:1.3,z:25.5,type:'supplies',label:'Field supplies',cloth:2,canister:2,bottles:2},
 {id:'crawl-cache',x:-8,z:18.8,type:'supplies',label:'Underpass cache',ammo:6,cloth:1},
 {id:'clinic-cell',x:-22,z:-3.5,type:'objective',objective:'cell',label:'Signal battery'},
 {id:'clinic-kit',x:-24,z:5,type:'supplies',label:'Medical drawer',cloth:2,canister:1},
 {id:'market-ammo',x:-22,z:-21.2,type:'supplies',label:'Market toolbag',ammo:6,bottles:1},
 {id:'depot-crank',x:22.3,z:-26.7,type:'objective',objective:'crank',label:'Gate spindle'},
 {id:'depot-scraps',x:23,z:-10,type:'supplies',label:'Freight box',cloth:1,canister:2,ammo:4},
 {id:'park-cache',x:15,z:4,type:'supplies',label:'Gardener\'s bag',bottles:2,cloth:1},
];
export const SHELTERS=[{id:'start',x:0,z:27,name:'South shelter'},{id:'clinic',x:-24,z:-1,name:'Clinic checkpoint'}];
export const EXIT={x:0,z:-43,name:'Floodgate transmitter'};
export const PATROLS=[
 {id:'watch-1',name:'Street lookout',type:'watcher',points:[[12,7],[12,0],[3,-1],[3,8]],yaw:0},
 {id:'watch-2',name:'Market lookout',type:'watcher',points:[[-10,-11],[-25,-11],[-25,-16],[-10,-22]],yaw:-Math.PI/2},
 {id:'watch-3',name:'Freight lookout',type:'watcher',points:[[20,-13],[23,-20],[17,-27],[19,-19]],yaw:0},
 {id:'watch-4',name:'Quay lookout',type:'watcher',points:[[4,-38],[-3,-38],[-3,-31],[4,-31]],yaw:Math.PI/2},
 {id:'drifter',name:'Echo drifter',type:'drifter',points:[[-4,-23],[-4,-27],[6,-26],[6,-22]],yaw:0},
];
export const HEIGHT={stand:1.72,crouch:1.02,prone:.40};
export const RAD=.32;
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function inside(p,r,padding=0){return Math.abs(p.x-r.x)<r.w/2+padding&&Math.abs(p.z-r.z)<r.d/2+padding;}
export function solidAt(x,z,height=1.72,radius=RAD,ignore=null){
 if(x<BOUNDS.x0+radius||x>BOUNDS.x1-radius||z<BOUNDS.z0+radius||z>BOUNDS.z1-radius)return true;
 return OBSTACLES.some(o=>o.id!==ignore&&o.bottom<height-.02&&inside({x,z},o,radius));
}
export function rayBox(origin,dir,box,max=100){
 let enter=0,leave=max;
 for(const [axis,lo,hi]of [['x',box.x-box.w/2,box.x+box.w/2],['y',box.bottom,box.bottom+box.h],['z',box.z-box.d/2,box.z+box.d/2]]){
  if(Math.abs(dir[axis])<1e-8){if(origin[axis]<lo||origin[axis]>hi)return null;continue;}
  let a=(lo-origin[axis])/dir[axis],b=(hi-origin[axis])/dir[axis];if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);if(enter>leave)return null;
 }return enter;
}
export function obstruction(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz);if(len<.001)return null;
 const dir={x:dx/len,y:dy/len,z:dz/len};let result=null;
 for(const o of OBSTACLES){const t=rayBox(a,dir,o,len);if(t!==null&&t<len-.05&&(!result||t<result.t))result={t,o};}return result;
}
export const coverAt=p=>GRASS.some(g=>inside(p,g));
const navWidth=69,navHeight=83,navMinX=-34,navMinZ=-48;
// Reserve clearance for the character radius plus finite-step steering around corners.
const navBlocked=new Uint8Array(navWidth*navHeight);
for(let z=0;z<navHeight;z++)for(let x=0;x<navWidth;x++)navBlocked[z*navWidth+x]=solidAt(x+navMinX,z+navMinZ,1.72,.60)?1:0;
function node(p){let x=clamp(Math.round(p.x-navMinX),0,navWidth-1),z=clamp(Math.round(p.z-navMinZ),0,navHeight-1),id=z*navWidth+x;if(!navBlocked[id])return id;
 for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){let a=x+dx,b=z+dy,j=b*navWidth+a;if(a>=0&&a<navWidth&&b>=0&&b<navHeight&&!navBlocked[j])return j;}return null;
}
export function findPath(a,b){
 const from=node(a),to=node(b);if(from===null||to===null)return [];const parent=new Int32Array(navWidth*navHeight).fill(-1),queue=[from];parent[from]=from;
 for(let at=0;at<queue.length;at++){const id=queue[at];if(id===to)break;const x=id%navWidth,z=Math.floor(id/navWidth);for(const [dx,dz]of[[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,nz=z+dz,j=nz*navWidth+nx;if(nx<0||nx>=navWidth||nz<0||nz>=navHeight||navBlocked[j]||parent[j]>=0)continue;parent[j]=id;queue.push(j);}}
 if(parent[to]<0)return [];const path=[];for(let i=to;i!==from;i=parent[i])path.push({x:i%navWidth+navMinX,z:Math.floor(i/navWidth)+navMinZ});return path.reverse();
}
