import {BELL_ROUTES} from './bellwether-layout.mjs';
/* Public side-adventure, independent of the unpublished narrative. Stable IDs. */
export const BELL_TASK=Object.freeze({id:'bellwether-blackout',name:'Bellwether Blackout',flag:'bellwether-restored',reward:300,description:'A connected district adventure: stop the street disruptors, balance three circuits inside the Clockmaker\'s Arcade, climb the Theatre roof, defeat the signal guard and bring the market lights back. Begin at the brass dispatch desk in eastern Bellwether.'});
export const BELL_POINTS=Object.freeze([
 {id:'bell-dispatch',name:'Blackout dispatch desk',x:-84,y:7,z:-4,kind:'desk'},
 {id:'bell-dial-0',name:'Arcade supply circuit',x:-106.5,y:7,z:-32,kind:'dial'},
 {id:'bell-dial-1',name:'Arcade return circuit',x:-103,y:7,z:-32,kind:'dial'},
 {id:'bell-dial-2',name:'Arcade balancing circuit',x:-99.5,y:7,z:-32,kind:'dial'},
 {id:'bell-test',name:'Arcade circuit tester',x:-99,y:7,z:-26,kind:'tester'},
 {id:'bell-signal',name:'Theatre signal receiver',x:-111,y:27.5,z:-6,kind:'signal'}
]);
export const BELL_NOTE=Object.freeze({id:'bell-maintenance',x:-106.5,y:7,z:-26,title:'Three hands on the clock',text:'Supply needs TWO quarter-turns, return needs ONE, and balance needs THREE. Set the three Arcade dials to 2, 1, 3 from west to east, then use the tester at the east wall. When the circuit holds, climb the Theatre service ladder from the south street. Reconnect the rooftop receiver, hold its signal against the Registry guard, then report to the dispatch desk. The market lamps are public equipment. - Bellwether maintenance card'});
export const BELL_TARGETS=Object.freeze([2,1,3]);
export const BELL_COVER=Object.freeze([
 {id:'bell-roof-cover-west',x:-112,y:27.5,z:-10,w:2.1,h:.95,d:1},
 {id:'bell-roof-cover-east',x:-102,y:27.5,z:-11,w:1.5,h:1.05,d:1.2}
]);
export const BELL_WAVES=Object.freeze({
 street:[{x:-84,y:7,z:-22,kind:'warden',hp:75},{x:-90,y:7,z:-32,kind:'skirmisher',hp:85}],
 roof:[{x:-103,y:27.5,z:-15,kind:'warden',hp:80},{x:-110,y:27.5,z:-15,kind:'longshot',hp:65}],
 guardian:[{x:-103,y:27.5,z:-8,kind:'breacher',hp:160}]
});
export const BELL_STAGES=Object.freeze(['Find the dispatch desk','Stop the street disruptors','Repair the Arcade circuits','Climb to the Theatre receiver','Defend and synchronize the receiver','Report to the dispatch desk','Bellwether restored']);
/* Follow the existing walking gallery once the player has reached it. These
 * are authored route points, not a navmesh or a claim of obstacle-free travel. */
export function bellGalleryGoal(p){
 if(p.y<11||p.y>28||(p.y>=27.4&&p.x<=-102))return null;
 const points=BELL_ROUTES.find(r=>r.id==='upper').points;
 let best=null;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],v=b.map((n,k)=>n-a[k]),q=[p.x,p.y,p.z];
  const t=Math.max(0,Math.min(1,v.reduce((sum,n,k)=>sum+(q[k]-a[k])*n,0)/v.reduce((sum,n)=>sum+n*n,0)));
  const distance=Math.hypot(...q.map((n,k)=>n-a[k]-v[k]*t));
  if(!best||distance<best.distance-1e-6||Math.abs(distance-best.distance)<1e-6&&i+t>best.progress)best={distance,index:i+1,progress:i+t};
 }
 if(!best||best.distance>4)return null;
 let i=best.index;
 if(i<points.length-1&&Math.hypot(p.x-points[i][0],p.y-points[i][1],p.z-points[i][2])<.7)i++;
 const [x,y,z]=points[i],name=i<=4?'Arcade rooftop walkway':i<=7?'West maintenance gallery':i<=9?'East gallery / receiver stair':'Receiver terrace';
 return {id:'bell-gallery-'+i,x,y,z,name,route:'Maintenance galleries'};
}
export function bellGoal(s){const b=s.bellwether||{stage:0,dials:[0,0,0]};const find=id=>BELL_POINTS.find(p=>p.id===id);
 if(b.stage===2){if(s.p.z>-22)return {x:-103,y:7,z:-21,name:'Clockmaker\'s Arcade entrance'};const i=BELL_TARGETS.findIndex((v,i)=>b.dials[i]!==v);return find(i<0?'bell-test':'bell-dial-'+i);}
 if(b.stage===3||b.stage===4){const gallery=bellGalleryGoal(s.p);if(gallery)return gallery;if(s.p.y<26)return {id:'roof-bell-ladder',x:-107,y:7,z:.1,name:'Theatre service ladder'};return find('bell-signal');}
 return find('bell-dispatch');
}
export function bellProgress(s){const b=s.bellwether||{stage:0,dials:[0,0,0]};if(b.stage===2)return 'Arcade circuits: '+b.dials.join(', ')+' / target 2, 1, 3';if(b.encounter){const left=s.drones.filter(e=>e.bellwetherEnemy&&e.hp>0).length;return left?left+' hostiles remain / '+b.encounter:(b.stage===4?'Hold receiver: '+Math.floor(b.hold||0)+' / 6 seconds':'Street secured');}if(b.stage===1||b.stage===4)return 'Interrupted attempt: use the marked desk or receiver to restart safely';return BELL_STAGES[b.stage];}
