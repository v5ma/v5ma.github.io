/* Deterministic cube-sphere city. Six stitched faces avoid empty poles and
   meridian convergence. No engine or browser dependency: simulation tests use
   the same road, building and mission data as the renderer. */
export const CITY_VERSION='0.6.0';
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const mul=(a,t)=>a.map(v=>v*t);
const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const random=i=>{const a=Math.sin(i*127.1+311.7)*43758.5453;return a-Math.floor(a);};
export const FACES=[
 {n:[0,1,0],u:[1,0,0],v:[0,0,-1]},
 {n:[1,0,0],u:[0,-1,0],v:[0,0,-1]},
 {n:[0,-1,0],u:[-1,0,0],v:[0,0,-1]},
 {n:[-1,0,0],u:[0,1,0],v:[0,0,-1]},
 {n:[0,0,-1],u:[1,0,0],v:[0,-1,0]},
 {n:[0,0,1],u:[1,0,0],v:[0,1,0]}
];
export function cubePoint(face,u,v){const f=FACES[face];return norm(add(f.n,add(mul(f.u,u),mul(f.v,v))));}
export function cubePosition(n){let face=0,best=-Infinity;FACES.forEach((f,i)=>{const d=dot(n,f.n);if(d>best){face=i;best=d;}});const f=FACES[face];return {face,u:dot(n,f.u)/best,v:dot(n,f.v)/best};}
const districtNames=[
 'Sunrise Commons','Downtown Heights','Seabreeze Quarter','Bluffside Gardens',
 'Belmont Village','Marina Promenade','Naples Canals','Oceanview Terrace',
 'Harbor Point','Portside Works','Lighthouse Bay','Breakwater Park',
 'Arts Quarter','Retro Row','Eastside Market','Museum District',
 'Bixby Gardens','College Park','Lakewood Commons','Northside Junction',
 'Pacific Heights','Palm Coast','Sunset Esplanade','Westside Greenway'
];
const palette=['#eacb9c','#c1d5c6','#b4cbd9','#e4b9a9','#d5cadc','#eadfbd'];
export function buildCity(radius){
 if(!Number.isFinite(radius)||radius<400)throw Error('The city requires a planet radius of at least 400 metres.');
 const N=12,blocks=[],buildings=[],roads=[],districts=[],trees=[],seen=new Set(),hash=new Map();
 const grid=i=>-1+2*i/N;
 const original=n=>n[1]>.94&&Math.atan2(-n[2],n[1])*radius>-32&&Math.atan2(-n[2],n[1])*radius<150&&Math.asin(n[0])*radius>-44&&Math.asin(n[0])*radius<63;
 const key=n=>n.map(v=>v.toFixed(5)).join(',');
 function road(points,id,width=8){const k=[key(points[0]),key(points.at(-1))].sort().join('|');if(seen.has(k))return;seen.add(k);roads.push({id,points,width});}
 for(let f=0;f<6;f++){
  for(let i=0;i<=N;i++)for(let axis=0;axis<2;axis++){
   const points=Array.from({length:97},(_,j)=>cubePoint(f,axis?grid(i):-1+2*j/96,axis?-1+2*j/96:grid(i)));
   road(points,`city-road-${f}-${axis}-${i}`);
  }
  for(let q=0;q<4;q++){
   const i=q%2?8:3,j=q>=2?8:3,u=grid(i+.5),v=grid(j+.5),n=cubePoint(f,u,v),mail=cubePoint(f,grid(i),v);
   const front=norm(add(mail,mul(n,-dot(mail,n))));
   districts.push({id:`district-${f}-${q}`,name:districtNames[f*4+q],face:f,quadrant:q,block:`block-${f}-${i}-${j}`,n,mail,front,landing:cubePoint(f,grid(i),v-.025),color:palette[(f+q)%6],type:'bonus',bonus:true,city:true,side:1,sign:'MISSIONS',message:'Deliver the neighborhood news, find both postmarks, then ride the local speed gate.'});
  }
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
   const id=`block-${f}-${i}-${j}`,n=cubePoint(f,grid(i+.5),grid(j+.5)),q=(i>=6?1:0)+(j>=6?2:0),district=districts[f*4+q];
   const block={id,face:f,i,j,n,district:district.id,buildings:[],trees:[],park:district.block===id};blocks.push(block);
   const placements=[[.34,.20],[.66,.20],[.80,.34],[.80,.66],[.66,.80],[.34,.80],[.20,.66],[.20,.34]];
   for(let k=0;k<placements.length;k++){
    const [a,b]=placements[k],bn=cubePoint(f,grid(i+a),grid(j+b));if(original(bn))continue;
    const seed=f*10000+i*120+j*8+k;
    if(block.park&&k!==0&&k!==4)continue;
    let du=0,dv=0;if(k<2)dv=-.03;else if(k<4)du=.03;else if(k<6)dv=.03;else du=-.03;
    const fn=cubePoint(f,grid(i+a)+du,grid(j+b)+dv),front=norm(add(fn,mul(bn,-dot(fn,bn)))),right=norm(cross(bn,front));
    const style=block.park?'kiosk':((i+j+f)%7===0?'tower':(i+j)%4===0?'apartment':k%3===0?'shop':'home');
    const w=style==='kiosk'?7:10+random(seed)*2,d=style==='kiosk'?6:7+random(seed+1)*2,h=style==='tower'?18+random(seed+2)*22:style==='apartment'?8+random(seed+2)*7:style==='shop'?4.8:3.3+random(seed+2)*1.1;
    const building={id:`building-${seed}`,n:bn,front,right,w,d,h,style,color:palette[(f+i+j+k)%6],seed,face:f,block:id};
    buildings.push(building);block.buildings.push(building);
    const hk=bn.map(v=>Math.floor(v*radius/32)).join(',');if(!hash.has(hk))hash.set(hk,[]);hash.get(hk).push(building);
   }
   for(let k=0;k<4;k++){
    const a=[.48,.92,.48,.08][k],b=[.08,.48,.92,.48][k],tn=cubePoint(f,grid(i+a),grid(j+b));if(original(tn))continue;
    const t={n:tn,h:4.4+random(f*1000+i*50+j+k)*2.4,face:f,block:id};trees.push(t);block.trees.push(t);
   }
  }
 }
 // Connect the original authored side streets to the globe-spanning grid.
 const street=(t,x)=>{const a=t/radius,b=x/radius;return [Math.sin(b),Math.cos(b)*Math.cos(a),-Math.cos(b)*Math.sin(a)];};
 for(const side of [-1,1]){
  const stops=[street(18,side<0?-20:36),street(18,side*70),street(0,side*95)];
  const points=[];for(let s=0;s<2;s++)for(let k=0;k<16;k++)points.push(norm(add(mul(stops[s],1-k/16),mul(stops[s+1],k/16))));points.push(stops[2]);road(points,`connector-${side}`,5.6);
 }
 function nearby(n){const a=n.map(v=>Math.floor(v*radius/32)),found=[];for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)found.push(...(hash.get([a[0]+x,a[1]+y,a[2]+z].join(','))||[]));return found;}
 function blocked(n,padding=.55){for(const b of nearby(n)){const delta=mul(add(n,mul(b.n,-1)),radius);if(Math.abs(dot(delta,b.right))<b.w/2+padding&&Math.abs(dot(delta,b.front))<b.d/2+padding)return true;}return false;}
 function districtAt(n){const p=cubePosition(n);return districts[p.face*4+(p.u>=0?1:0)+(p.v>=0?2:0)];}
 const stars=districts.flatMap((d,i)=>{const p=cubePosition(d.mail);return[-1,1].map((sign,k)=>({id:`city-stamp-${i}-${k}`,n:cubePoint(p.face,p.u,p.v+sign*.045)}));});
 const gates=districts.map((d,i)=>{const p=cubePosition(d.mail);return {id:`city-gate-${i}`,name:d.name+' sprint',n:cubePoint(p.face,p.u,p.v+.085),minSpeed:14,city:true};});
 return {version:CITY_VERSION,radius,N,blocks,buildings,roads,districts,trees,stars,gates,nearby,blocked,districtAt,original};
}
