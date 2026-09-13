/* Stillwater Works: reversible hydraulic puzzle, physical wading and a saved
 * one-time contract. Pure state; no renderer, audio, network or hidden rewards. */
export const POOL=Object.freeze({x:236.3,z:30,hx:9.8,hz:10,bottom:-2,high:.04,low:-1.65});
export const WATER_CONTROL=Object.freeze({x:236.3,z:16});
export const WATER_LENS=Object.freeze({x:236.3,z:33});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function cisternState(raw){
 if(raw?.version!==1)raw={};
 const phase=Number.isInteger(raw?.phase)&&raw.phase>=0&&raw.phase<=5?raw.phase:0;
 const mask=Number.isInteger(raw?.mask)&&raw.mask>=0&&raw.mask<=7?raw.mask:1;
 return {version:1,phase,mask:phase===0||phase>=4?1:phase===2?6:mask,surface:phase===2||phase===3?POOL.low:POOL.high};
}
export function saveCistern(c){return {version:1,phase:c.phase,mask:c.mask};}
export function insidePool(x,z,margin=0){return Math.abs(x-POOL.x)<POOL.hx-margin&&Math.abs(z-POOL.z)<POOL.hz-margin;}
export function poolFloor(x,z){
 if(!insidePool(x,z))return null;
 if(Math.abs(x-POOL.x)<1.85&&z<26)return -2*clamp((z-20)/6,0,1);
 return POOL.bottom;
}
export function waterGround(x,z,fallback=0){return poolFloor(x,z)??fallback;}
export function waterDepth(s,x=s.x,z=s.z){const floor=poolFloor(x,z);return floor===null?0:Math.max(0,(s.frontier?.cistern?.surface??POOL.high)-floor);}
export function poolBlocked(x,z,r=.33,s=null){
 // Three solid rims and a southern opening leading to a gentle physical ramp.
 const dx=Math.abs(x-POOL.x),dz=Math.abs(z-POOL.z);
 if(Math.abs(dx-POOL.hx)<r+.2&&dz<POOL.hz+r)return true;
 if(Math.abs(z-40)<r+.2&&dx<POOL.hx+r)return true;
 if(Math.abs(z-20)<r+.2&&dx<POOL.hx+r&&dx>1.65-r)return true;
 return waterDepth(s||{x,z},x,z)>.68;
}
export function cisternStep(s,dt){
 const c=s.frontier?.cistern;if(!c)return;
 const target=c.phase===2||c.phase===3?POOL.low:POOL.high;
 c.surface+=clamp(target-c.surface,-dt*.26,dt*.26);
 if(c.phase===4&&Math.abs(c.surface-POOL.high)<.01)c.phase=5;
}
export function cisternStatus(s){
 const phase=s.frontier.cistern.phase;
 return ['Inspect the slate beside the flooded cistern.','Close INLET; open OUTLET and BYPASS, then apply.','Wait for shallow water, descend the south ramp and recover the lens.','Leave by the ramp. Open INLET; close OUTLET and BYPASS, then refill.','The cistern is refilling. Stay on its dry rim.','Waterworks restored. Report the contract at the town gate.'][phase];
}
export function cisternOptions(s,site){
 const c=s.frontier.cistern;
 if(!s.frontier.accepted.includes('cistern'))return [{id:'accept:cistern',text:'Record The Drowned Workshop contract'}];
 if(site==='water-lens')return c.phase===2?[{id:'water:recover',text:'Recover the waterproof survey lens'}]:[];
 if(c.phase===0)return [{id:'water:read',text:'Read the hydraulic slate'}];
 if(c.phase===1||c.phase===3)return ['INLET','OUTLET','BYPASS'].map((n,i)=>({id:'water:valve:'+i,text:n+': '+(c.mask&(1<<i)?'OPEN':'CLOSED')+' / Turn valve'})).concat([{id:'water:apply',text:c.phase===1?'Apply sluices / lower the water':'Apply sluices / refill safely'}]);
 return [{id:'water:read',text:'Read the current waterworks instructions'}];
}
export function cisternAction(s,action){
 const fail=text=>({ok:false,text}),ok=text=>{s.toast=text;s.toastT=6;return {ok:true,text};};
 if(s.frontier?.zone!=='badlands'||s.mode!=='foot'||Math.abs(s.speed)>1.7)return fail('Stop on foot at the actual cistern station.');
 const c=s.frontier.cistern;if(!s.frontier.accepted.includes('cistern'))return fail('Record The Drowned Workshop in Expedition Contracts first.');
 if(action==='water:recover'){
  if(c.phase!==2||Math.hypot(s.x-WATER_LENS.x,s.z-WATER_LENS.z)>2.4||waterDepth(s)>.44||s.lift>.1)return fail('Lower the water fully, walk down the south ramp and stand beside the lens.');
  c.phase=3;s.frontier.selected='cistern';return ok('The waterproof lens is recovered. Leave by the ramp, then restore INLET open / OUTLET closed / BYPASS closed.');
 }
 if(Math.hypot(s.x-WATER_CONTROL.x,s.z-WATER_CONTROL.z)>3.1)return fail('Operate the sluices beside the dry southern platform.');
 if(action==='water:read'){if(c.phase===0)c.phase=1;return ok(cisternStatus(s));}
 if(action.startsWith('water:valve:')){
  const i=Number(action.slice(12));if(![1,3].includes(c.phase)||!Number.isInteger(i)||i<0||i>2)return fail('Those valves are locked while the water moves.');
  c.mask^=1<<i;return ok('Valve turned. '+cisternStatus(s));
 }
 if(action==='water:apply'){
  if(c.phase===1){if(c.mask!==6)return fail('The slate says INLET closed, OUTLET open, BYPASS open. Nothing was consumed.');c.phase=2;s.frontier.selected='water-lens';return ok('Water is draining. The south ramp becomes passable when the pool is shallow.');}
  if(c.phase===3){if(c.mask!==1)return fail('Restore INLET open, OUTLET closed, BYPASS closed. The lens is safe.');c.phase=4;s.frontier.selected='return';return ok('Water is refilling. The repaired flow remains visible; report to Vinci after it settles.');}
 }
 return fail('That action is not available at this stage.');
}
