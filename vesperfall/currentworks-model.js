/* Living Lanterns. Read-only placement/policy for the two immutable Pilgrimage
 * layouts. Coordinates are metres. No collision, progression or save ownership. */
(function(root){'use strict';
 const supported=w=>!!w?.pilgrimage&&['lantern-causeway-1','ashen-archive-1'].includes(w.generator);
 function plan(w){if(!supported(w))return null;return {chapter:w.pipeline.chapter??w.pipeline.stage??(w.generator==='ashen-archive-1'?1:0),modules:w.pipeline.modules.map(m=>({slot:m.slot,x:m.x,z:m.z,target:m.target,signal:[...m.targetPoint],refuge:[m.x-m.side*11.8,2.24,m.z+11.4],water:{x:m.x,z:m.z,width:12,length:18}}))};}
 function policy(g){const quiet=g.jewelglass?.options?.reduced===true||g.jewelglass?.options?.effects===false;
  const visible=supported(g.game?.world)&&!g.arMode&&!g.arExpedition&&!g.practice&&!g.returningBell?.state.table&&(!g.threshold||g.threshold.state.phase==='game');
  return {visible,quiet,xr:!!g.xr,water:visible&&g.tidelight?.options?.mode!=='off',ripples:g.tidelight?.options?.ripples!==false&&!quiet,quality:g.xr?'light':g.tidelight?.options?.mode==='cinematic'?'balanced':'light'};
 }
 function restored(s){return supported(s.world)?s.world.pipeline.modules.map(m=>s.targets.has(m.target)):[];}
 function inWater(m,p){return Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)&&Math.abs(p[0]-m.x)<5.8&&Math.abs(p[2]-m.z)<8.8&&p[1]>-.1&&p[1]<.22;}
 function forest(slot){return [-1,1].map((side,i)=>({id:'wall-garden-'+slot+'-'+i,seed:431+slot*71+i*13,preset:i?'willow':'alder',height:3.6,position:[side*14.2,5.4,slot?1:-1],yaw:side*.4}));}
 // Event cursors are monotonic within one expedition, never replayed on reload.
 class Cursor{constructor(){this.game=null;this.seq=0;}read(s){if(s!==this.game){this.game=s;this.seq=s.eventSeq||0;return [];}const out=(s.events||[]).filter(e=>e.seq>this.seq);this.seq=Math.max(this.seq,s.eventSeq||0);return out;}}
 const api=Object.freeze({supported,plan,policy,restored,inWater,forest,Cursor});root.VesperCurrentworksModel=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
