// Pure mission rules shared by the scene and regression tests. No browser required.
import {BUILDINGS,HARBORS,distance} from './ranch-data.js';
export const STORM_ID='storm-response';
export const STORM_KEY='dino-atlas.aaa-director.v1';
export const STORM_BUILD='aaa-vslice-storm-20260911.2';
export const EAST=BUILDINGS.find(b=>b.id==='east-hub');
export const NORTH=BUILDINGS.find(b=>b.id==='north-lab');
export const SOUTH=BUILDINGS.find(b=>b.id==='south-lab');
export const EAST_PIER=HARBORS.find(h=>h.id==='east');
export const SOUTH_PIER=HARBORS.find(h=>h.id==='south');
export const MERIDIAN_APPROACH={x:EAST.x,z:EAST.z+EAST.hz+12};
export const AIR_DESK={x:EAST.x+29,z:EAST.z+29};
export const AIR_PAD={x:EAST.x+35,y:1.05,z:EAST.z+27};
export const BOAT_DESK={x:SOUTH_PIER.land.x,z:SOUTH_PIER.land.z-8};
export const STORM_COAST=[{x:115,z:449},{x:238,z:399},{x:345,z:312},{x:422,z:197},{x:456,z:70}];
export const STORM_STAGES=[
 {name:'Mobilize at Meridian',detail:'Drive the jeep or buggy to the marked parking bay OUTSIDE Meridian. RT drives, LT brakes; use the left stick to steer.',target:MERIDIAN_APPROACH},
 {name:'Restore backup power',detail:'Park outside. Y / F exits. Walk through the narrow doorway and follow the corridor to the emergency panel. A / E restores power.',target:{x:EAST.x+13,z:EAST.z-10}},
 {name:'Transfer to air operations',detail:'Walk to the AIR TRANSFER terminal beside Meridian and press A / E. It brings your unoccupied helicopter to the pad. Y boards, RT rises, LT lands. Fly to Northstar.',target:AIR_DESK},
 {name:'Calibrate the storm beacon',detail:'Cross the Northstar roof on foot and press A / E at the lit storm beacon. Your helicopter remains on this roof.',target:{x:NORTH.x+10,z:NORTH.z+8}},
 {name:'Cross-island flight',detail:'Reboard the helicopter with Y / F. Fly to South Coast Biosecurity, land on the marked roof, then exit. The mission advances when you are on the roof.',target:SOUTH},
 {name:'Recover marine telemetry',detail:'Walk to the roof lift and press A / E. Choose Ground floor. Follow the corridor behind the partitions to the telemetry case.',target:{x:SOUTH.x+13,z:SOUTH.z-10}},
 {name:'Launch coastal response',detail:'Go to South Rescue Pier. On foot, press A / E at BOAT TRANSFER to bring your patrol boat here; Y / F boards it. You can fly to the pier or walk from the building.',target:BOAT_DESK},
 {name:'Deliver storm telemetry',detail:'Follow the gold offshore buoys around the EAST coast. RT sails; the left stick steers. Stop beside East Freight Pier and press A / E to deliver.',target:EAST_PIER}
];
export function emptyDirector(){return {version:1,active:null,suspended:false,stage:0,completed:[],checkpoint:0,storm:false,finishedAt:0,elapsed:0,coastIndex:0,flashes:false};}
export function sanitizeDirector(v){
 const s=emptyDirector();if(!v||v.version!==1)return s;
 if(v.active===STORM_ID)s.active=STORM_ID;
 for(const k of ['stage','checkpoint'])if(Number.isInteger(v[k]))s[k]=Math.max(0,Math.min(7,v[k]));
 if(Array.isArray(v.completed))s.completed=[...new Set(v.completed.filter(x=>x===STORM_ID))];
 // Old abandoned runs were recorded as active:null with a nonzero stage.
 s.suspended=v.suspended===true||!s.active&&!s.completed.length&&s.stage>0;
 s.storm=!!s.active&&v.storm!==false;
 for(const k of ['elapsed','finishedAt'])if(Number.isFinite(v[k]))s[k]=Math.max(0,Math.min(1e9,v[k]));
 if(Number.isInteger(v.coastIndex))s.coastIndex=Math.max(0,Math.min(STORM_COAST.length,v.coastIndex));
 s.flashes=v.flashes===true;return s;
}
export function readDirector(storage){try{return sanitizeDirector(JSON.parse(storage?.getItem(STORM_KEY)));}catch{return emptyDirector();}}
export function saveDirector(storage,s){try{if(!storage)return false;storage.setItem(STORM_KEY,JSON.stringify(sanitizeDirector(s)));return true;}catch{return false;}}
export function canResume(s){return s.active===STORM_ID||s.suspended;}
export function suspendDirector(s){if(s.active===STORM_ID){s.active=null;s.suspended=true;s.storm=false;}return s;}
export function startDirector(s,fresh=false){if(fresh||!canResume(s))return {...emptyDirector(),completed:[...s.completed],flashes:s.flashes,active:STORM_ID,storm:true};return {...s,active:STORM_ID,suspended:false,storm:true};}
export function roofReached(p,b){return Math.abs(p.x-b.x)<b.hx-1&&Math.abs(p.z-b.z)<b.hz-1&&Math.abs(p.y-(b.h+1))<1.8;}
export function automaticStage(s,p,mode,speed=0){if(s.active!==STORM_ID)return false;
 if(s.stage===0)return ['jeep','buggy'].includes(mode)&&Math.abs(speed)<4&&p.y<3&&distance(p,MERIDIAN_APPROACH)<10;
 if(s.stage===2)return mode==='foot'&&roofReached(p,NORTH);
 if(s.stage===4)return mode==='foot'&&roofReached(p,SOUTH);
 if(s.stage===6)return mode==='boat'&&p.y<3&&distance(p,SOUTH_PIER)<36;
 return false;
}
export function actionAt(s,p,mode,speed=0){if(s.active!==STORM_ID||Math.abs(speed)>3)return null;
 const a=[null,{type:'generator',mode:'foot',p:{x:EAST.x+13,z:EAST.z-10},y:1},null,{type:'beacon',mode:'foot',p:{x:NORTH.x+10,z:NORTH.z+8},y:NORTH.h+1},null,{type:'telemetry',mode:'foot',p:{x:SOUTH.x+13,z:SOUTH.z-10},y:1},null,{type:'delivery',mode:'boat',p:EAST_PIER,y:1}][s.stage];
 return a&&mode===a.mode&&Math.abs(p.y-a.y)<2&&distance(p,a.p)<(a.type==='delivery'?34:4.5)?a.type:null;
}
export function advanceDirector(s){if(s.active!==STORM_ID)return null;if(s.stage<7){s.stage++;s.checkpoint=s.stage;return {complete:false,stage:s.stage};}
 const first=!s.completed.includes(STORM_ID);s.active=null;s.suspended=false;s.storm=false;s.checkpoint=7;s.finishedAt=s.elapsed;
 if(first)s.completed.push(STORM_ID);return {complete:true,first,reward:first?1800:0};
}
export function checkpointSpawn(stage){
 return [{mode:'jeep',p:{x:0,y:1.5,z:51}},
 {mode:'foot',p:{...MERIDIAN_APPROACH,y:1.1}},
 {mode:'foot',p:{...AIR_DESK,y:1.1}},
 {mode:'foot',p:{x:NORTH.x-8,y:NORTH.h+1.1,z:NORTH.z+2},air:{x:NORTH.x+2,y:NORTH.h+1.1,z:NORTH.z+1}},
 {mode:'foot',p:{x:NORTH.x-8,y:NORTH.h+1.1,z:NORTH.z+2},air:{x:NORTH.x+2,y:NORTH.h+1.1,z:NORTH.z+1}},
 {mode:'foot',p:{x:SOUTH.x-12,y:SOUTH.h+1.1,z:SOUTH.z-9},air:{x:SOUTH.x+2,y:SOUTH.h+1.1,z:SOUTH.z+1}},
 {mode:'foot',p:{...BOAT_DESK,y:1.1}},
 {mode:'boat',p:{...SOUTH_PIER.boat,y:.78}}][Math.max(0,Math.min(7,Number(stage)||0))];
}
