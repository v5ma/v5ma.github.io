/* Continuous city terrain and six distinct usable architectural footprints.
 * Stable chapter, mechanism, task, item and shelter identities are unchanged. */
const sat=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const t=sat(x);return t*t*(3-2*t);};
const shelf=(v,a,b,pad)=>smooth((v-a+pad)/pad)*smooth((b+pad-v)/pad);
export function meridianHeight(x,z){
 const clinic=2.4*smooth((-x-12)/14)*shelf(z,10,44,12);
 const library=6*smooth((x-12)/14)*shelf(z,-40,3,14);
 const canal=-2.4*(1-smooth((Math.abs(x)-6)/8))*shelf(z,-54,25,12);
 const north=3*smooth((-z-64)/14);return clinic+library+canal+north;
}
export const MERIDIAN_PLANS=Object.freeze([
 {id:'clinic',label:'MERIDIAN FIELD CLINIC',form:'courtyard',height:5.8,polygon:[[-51,14],[-34,14],[-34,21],[-27,21],[-27,40],[-51,40]],doors:[{edge:3,at:11,width:6},{edge:4,at:12,width:7},{edge:5,at:13,width:6}]},
 {id:'market',label:'ORCHARD ARCADE',form:'arcade',height:6.3,polygon:[[29,16],[50,16],[50,46],[40,46],[40,40],[29,40]],doors:[{edge:0,at:11,width:6},{edge:1,at:13,width:6},{edge:2,at:5,width:7},{edge:5,at:12,width:6}]},
 {id:'works',label:'MUNICIPAL WORKS',form:'sawtooth',height:7.4,polygon:[[-53,-34],[-32,-34],[-32,-27],[-26,-27],[-26,-3],[-53,-3]],doors:[{edge:3,at:13,width:7},{edge:4,at:10,width:7},{edge:5,at:15,width:6}]},
 {id:'library',label:'MERIDIAN READING HALL',form:'dome',height:8,polygon:[[27,-35],[53,-35],[53,-5],[43,-5],[43,1],[27,1]],doors:[{edge:0,at:13,width:6},{edge:1,at:18,width:6},{edge:4,at:8,width:7},{edge:5,at:24,width:7}]},
 {id:'kitchen',label:'COMMUNITY KITCHEN',form:'garden',height:4.4,polygon:[[-50,-60],[-26,-60],[-26,-43],[-37,-43],[-37,-47],[-50,-47]],doors:[{edge:2,at:6,width:6},{edge:3,at:2,width:3},{edge:5,at:7,width:6}]},
 {id:'watch',label:'NORTH WATCH',form:'tower',height:15,polygon:[[30,-61],[47,-61],[47,-57],[51,-57],[51,-45],[47,-45],[47,-41],[30,-41],[30,-45],[26,-45],[26,-57],[30,-57]],doors:[{edge:6,at:9,width:7},{edge:9,at:6,width:6}]}
]);
const oldIds=['back','front-l','front-r','west-a','west-b','east-a','east-b'];
function planWalls(plan){const walls=[];
 for(let edge=0;edge<plan.polygon.length;edge++){
  const a=plan.polygon[edge],b=plan.polygon[(edge+1)%plan.polygon.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),door=plan.doors.find(d=>d.edge===edge);
  const ranges=door?[[0,Math.max(0,door.at-door.width/2)],[Math.min(length,door.at+door.width/2),length]]:[[0,length]];
  for(const [start,end]of ranges){if(end-start<.2)continue;const mid=(start+end)/2,x=a[0]+dx/length*mid,z=a[1]+dz/length*mid,ys=[start,mid,end].map(t=>meridianHeight(a[0]+dx/length*t,a[1]+dz/length*t)),bottom=Math.min(...ys);
   walls.push({id:plan.id+'-'+(oldIds[walls.length]||'wing-'+walls.length),x,z,w:dx?end-start:.8,d:dz?end-start:.8,h:plan.height+Math.max(...ys)-bottom,bottom,kind:'brick',reliefWall:true});
  }
 }return walls;
}
export function applyMeridianRelief(data){
 if(data.layoutRevision==='meridian-relief-1')return data;
 const replaced=new Set(MERIDIAN_PLANS.flatMap(p=>oldIds.map(id=>p.id+'-'+id)));
 data.obstacles=data.obstacles.filter(o=>!replaced.has(o.id)).map(o=>({...o,bottom:o.bottom+meridianHeight(o.x,o.z)}));
 data.obstacles.push(...MERIDIAN_PLANS.flatMap(planWalls));data.obstacles.push({id:'meridian-pressure-tower',x:-6,z:-66,w:2,d:2,h:19,bottom:meridianHeight(-6,-66),kind:'lighthouse'});
 data.buildings=MERIDIAN_PLANS.map(p=>{const xs=p.polygon.map(v=>v[0]),zs=p.polygon.map(v=>v[1]);return {...p,x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...zs)-Math.min(...zs),h:p.height};});
 data.intro='The pressure beacon marks the northern exit. The raised west clinic holds the filter; the domed reading hall stands above the eastern ridge. The sunken drain connects them, but leaves few long views. Restore the original water circuit to open the gate.';
 data.zones=[{name:'Arrival / pressure-beacon view',x:0,z:53},{name:'Raised clinic courtyard',x:-39,z:28},{name:'Orchard arcade',x:39,z:30},{name:'Reading ridge',x:39,z:-18},{name:'Sunken drainage spine',x:0,z:-23},{name:'Pressure beacon / north gate',x:0,z:-63}];
 data.layoutRevision='meridian-relief-1';return data;
}
/* Pure nearest-clear placement keeps old loot from being buried in a new wall.
 * IDs and finite quantities remain unchanged, including preview restores. */
export function accessibleMeridianDrops(data,drops,puzzle){
 const clear=(x,z)=>x>data.bounds.x0+.2&&x<data.bounds.x1-.2&&z>data.bounds.z0+.2&&z<data.bounds.z1-.2&&!data.obstacles.some(o=>!(o.openWhen&&puzzle?.solved)&&!o.disabled&&Math.abs(x-o.x)<o.w/2+.1&&Math.abs(z-o.z)<o.d/2+.1&&o.bottom<meridianHeight(x,z)+.4&&o.bottom+o.h>meridianHeight(x,z)+.05);
 return drops.map(drop=>{if(clear(drop.x,drop.z))return drop;for(let r=.25;r<=3;r+=.25)for(let i=0;i<32;i++){const x=drop.x+Math.cos(i*Math.PI/16)*r,z=drop.z+Math.sin(i*Math.PI/16)*r;if(clear(x,z))return {...drop,x,z,items:{...drop.items}};}return drop;});
}
