/* Deterministic model harness, not a rendered playthrough. Uses live combat,
 * real collision, finite supplies and real swept projectiles. Never assigns
 * actor coordinates, health, equipment, timers, or mission progress. */
const C=require('../core.js'),L=require('../returning-bell-lanes.js');
const DT=1/90;
function walk(s,x,z){let frames=0,distance=0,stalled=0;
 while(Math.hypot(x-s.p[0],z-s.p[2])>.02&&frames++<4000&&s.phase==='playing'){
  const old=[...s.p],d=Math.hypot(x-old[0],z-old[2]),v=Math.min(3.6*DT,d);
  C.move(s,(x-old[0])/d*v,(z-old[2])/d*v);C.step(s,DT,C.add(s.p,[0,1.65,0]));
  const moved=C.len(C.sub(s.p,old));distance+=moved;stalled=moved<1e-7?stalled+1:0;
  if(stalled>8)throw Error('Blocked at '+JSON.stringify(s.p)+' toward '+[x,z]);
 }
 if(frames>=4000||s.phase!=='playing')throw Error('Route failed: '+s.phase+' at '+s.p);
 return distance;
}
function path(s,points){return points.reduce((d,p)=>d+walk(s,...p),0);}
function shoot(s,p,type='plain',charge=1){const d=C.sub(p,s.head),h=Math.hypot(d[0],d[2]),v=12+24*charge,disc=v**4-9.8*(9.8*h*h+2*d[1]*v*v);
 if(disc<0)throw Error('No ballistic arc');const pitch=Math.atan((v*v-Math.sqrt(disc))/(9.8*h)),u=C.unit([d[0],0,d[2]]);
 if(!C.fire(s,s.head,[u[0]*Math.cos(pitch),Math.sin(pitch),u[2]*Math.cos(pitch)],charge,type))throw Error('Shot rejected');
 for(let i=0;i<95&&s.phase==='playing';i++)C.step(s,DT,C.add(s.p,[0,1.65,0]));
}
const approach=[[0,2],[-5.5,0],[-5.5,-7.5]],central=[[0,-9],[0,-12],[0,-16],[0,-21],[0,-24]],gallery=[[-4,8.5],[-14,8.5],[-14,0],[-14,-11.5],[-14,-21],[0,-21],[0,-24]],east=[[0,2],[7.8,1],[12,1],[13.8,-14],[12,-16],[12,-28],[0,-28],[0,-24]],service=[[0,-28],[20,-28],[20,-16],[20,8],[7.3,8]];
function sample(name,layout=L.ID){const s=C.create('BELL-01',1,{returningBell:layout});let distance=0;
 if(name==='central'){distance+=path(s,approach);shoot(s,L.RELEASE.p);distance+=path(s,central);}else distance+=path(s,name==='gallery'?gallery:east);
 return {route:name,layout,distanceMetres:distance,simulationSeconds:s.time,health:s.health,damageTaken:s.damageTaken,shots:s.shots,kills:s.kills,enemyShots:s.events.filter(e=>e.type==='enemy-shot').length,finalPosition:[...s.p],phase:s.phase};
}
module.exports={C,L,DT,walk,path,shoot,approach,central,gallery,east,service,sample};
