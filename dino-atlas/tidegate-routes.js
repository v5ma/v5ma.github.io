// Field routes are usable polylines, not straight links between objective icons.
// Movement remains in game units in every presentation. No route visitation gates.
import {POINTS,herdClear} from './tidegate-core.js';
export const MAINTENANCE_DOOR=Object.freeze({x:32,z:-2,width:1.8,height:2.8});
export const FIELD_ROUTES=Object.freeze([
 {id:'outpost',kind:'foot',points:[[-37,29],[-28,27],[-25,24],[-25,15],[-25,43],[-34,43],[-35,39]]},
 {id:'high',kind:'foot',points:[[-25,15],[-48,-12],[-35,-22],[-35,-26],[-35,-30],[-35,-38],[-12,-36],[12,-36],[17,-36],[37,-36],[57,-36],[58,-18],[51,-18]]},
 {id:'east-service',kind:'foot',points:[[51,-18],[58,-18],[58,20],[48,21],[44,10],[39,10],[30,10],[30,8]]},
 {id:'west-harbor',kind:'foot',points:[[-25,43],[-14,38],[-12,38]]},
 // Mooring transfers are identified separately: walk to a landing, board with Y.
 {id:'harbor-crossing',kind:'boat',points:[[-7,38],[7,38]]},
 {id:'east-harbor',kind:'foot',points:[[14,38],[15,31],[15,20],[33,20],[33,10],[30,10],[30,8]]},
 {id:'north-maintenance',kind:'foot',points:[[17,-36],[17,-20],[15,-8],[32,-8],[32,-4],[32,0],[32,8],[30,8]]},
 {id:'field-cabinet',kind:'foot',points:[[32,-8],[32,-4.5],[36,-4.5]]},
 {id:'lock-return',kind:'foot',condition:'drained',points:[[15,-8],[0,-8],[-12,-8],[-25,-8],[-25,24],[-28,27],[-37,29]]},
 {id:'bridge-return',kind:'foot',condition:'bridge',points:[[18,26],[14,24],[0,24],[-17,24],[-28,27],[-37,29]]}
]);
export function routeOpen(route,state){return !route.condition||state[route.condition]===true;}
// Same actual state/clearance used by applyDistrict; no hidden timer prediction.
export function bridgeReadout(state,animals,boat){
 if(state.bridge)return {id:'open',text:'BRIDGE OPEN',color:0x95d8bb,description:'The supply bridge is open. The orange crane marks the direct return.'};
 if(!state.gearbox)return {id:'gearbox',text:'GEARBOX OFFLINE',color:0xe6b75f,description:'Pump-house gearbox offline. North maintenance door: on foot. Front and east entries remain available.'};
 if(!herdClear(animals))return {id:'herd',text:'WAIT / HERD ON APRON',color:0xe6b75f,description:'Apron occupied. Wait for the herd to leave, or use the shelter feeder. You do not need to repeat the observation.'};
 if(boat&&Math.abs(boat.z-24)<7)return {id:'boat',text:'WAIT / BOAT IN CHANNEL',color:0xe6b75f,description:'The boat is under the service crossing. Move it to the lower harbor before lowering the bridge.'};
 return {id:'clear',text:'APRON CLEAR / READY',color:0x95d8bb,description:'Apron clear now. Use A at the bridge control while the herd is away.'};
}
export function drawDistrictMap(canvas,state,player,animals){
 const c=canvas.getContext('2d'),k=4.7;
 const at=([x,z])=>[canvas.width/2+x*k,canvas.height/2+(z-3)*k];
 const rect=(x,z,w,d)=>c.fillRect(...at([x,z]),w*k,d*k);
 c.fillStyle='#274c46';c.fillRect(0,0,canvas.width,canvas.height);
 c.fillStyle='#4c9298';rect(-9,-46,18,98);
 // Show the working footprint so the north opening and internal aisle can be read.
 c.fillStyle='#6c8074';rect(22,-2,20,18);
 c.strokeStyle='#dfd3b2';c.lineWidth=2;c.strokeRect(...at([22,-2]),20*k,18*k);
 c.fillStyle='#274c46';rect(31.1,-2.5,1.8,1);
 for(const route of FIELD_ROUTES){
  const open=routeOpen(route,state);c.strokeStyle=!open?'#77978d':route.kind==='boat'?'#aadcea':route.condition?'#f4deb0':'#e6cc8b';
  c.setLineDash(!open?[4,5]:route.kind==='boat'?[2,3]:[]);c.lineWidth=open?3:2;c.beginPath();route.points.forEach((p,i)=>i?c.lineTo(...at(p)):c.moveTo(...at(p)));c.stroke();
 }
 c.setLineDash([]);
 for(const [id,title] of [['report','HOME'],['overlook','LOOKOUT'],['feeder','FEEDER'],['sluice','LOCK'],['gearbox','GEAR'],['supply','SUPPLY']]){
  const p=POINTS[id],[x,z]=at([p.x,p.z]);c.fillStyle='#eed6a0';c.beginPath();c.arc(x,z,4,0,Math.PI*2);c.fill();c.font='12px sans-serif';c.fillStyle='#f1f3df';c.fillText(title,x+6,z-6);
 }
 for(const [x,z,title] of [[-14,38,'Y: BOARD'],[14,38,'Y: LAND']]){const p=at([x,z]);c.font='11px sans-serif';c.fillStyle='#aadcea';c.fillText(title,p[0]-20,p[1]+18);}
 for(const a of animals){c.fillStyle='#d8ab7b';c.beginPath();c.arc(...at([a.x,a.z]),3,0,Math.PI*2);c.fill();}
 c.fillStyle='#ffffff';c.beginPath();c.arc(...at([player.x,player.z]),5,0,Math.PI*2);c.fill();
 c.fillStyle='#f1f3df';c.font='14px sans-serif';c.fillText('Solid: open foot route. Dotted blue: boat. Dashed: closed crossing.',12,21);
 c.fillText('Lock: '+(state.drained?'walking crossing open':'flooded')+' / Supply bridge: '+(state.bridge?'open':'raised'),12,canvas.height-18);
}
