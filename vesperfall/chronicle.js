/* Local-only, bounded progression. Bank deltas once per run; practice is never
 * eligible. Existing v1 renown, heart/power purchases and records are retained.
 * Client records are editable and are not a secure leaderboard. */
(function(root){'use strict';
 const FIELDS=['kills','headshots','blocks','blinks','sectors'];
 const TASKS=[
  {id:'volley',field:'kills',goal:5,label:'Choirbreaker',reward:'Start future runs with four three-arrow volleys.'},
  {id:'quickwind',field:'headshots',goal:3,label:'Steady Hand',reward:'Crossbow reload becomes 1.05 s instead of 1.55 s.'},
  {id:'wardglass',field:'blocks',goal:5,label:'Unbroken',reward:'Start with 120 guard instead of 100.'},
  {id:'wayfarer',field:'blinks',goal:5,label:'Wayfarer',reward:'Carry three shard-step charges instead of two.'},
  {id:'nightfall',field:'sectors',goal:1,label:'Beyond the Bell',reward:'Unlock optional Nightfall runs: tougher, faster wardens.'}
 ];
 const bounded=(n,max=1000000)=>Math.max(0,Math.min(max,Math.floor(Number(n)||0)));
 function clean(p={}){p=p&&typeof p==='object'?p:{};const stats=Object.fromEntries(FIELDS.map(k=>[k,bounded(p.stats?.[k])])),out={version:2,shards:bounded(p.shards,100000),best:bounded(p.best),depth:bounded(p.depth,99),heart:p.heart===true,power:p.power===true,stats};for(const t of TASKS)out[t.id]=stats[t.field]>=t.goal;return out;}
 function bank(profile,run,receipt={},practice=false){const p=clean(profile);if(practice||!run)return {profile:p,receipt:{...receipt},unlocked:[]};const next={...receipt};for(const f of FIELDS){const now=bounded(run[f]),before=bounded(receipt[f]);p.stats[f]=bounded(p.stats[f]+Math.max(0,now-before));next[f]=Math.max(before,now);}const out=clean(p);return {profile:out,receipt:next,unlocked:TASKS.filter(t=>out[t.id]&&!p[t.id]).map(t=>t.id)};}
 const api={FIELDS,TASKS,clean,bank};root.VesperChronicle=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
