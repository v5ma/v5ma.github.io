/* Prism playability profiles. Encounter pressure, not just enemy health.
 * No renderer, storage or input ownership. Tune from physical playtest feedback. */
(function(root){'use strict';
 const ORDER=Object.freeze(['easy','normal','hard','ultra-hard']);
 const PROFILES=Object.freeze({
  easy:Object.freeze({name:'Easy',itemStep:12,enemyStep:24,lifeBeats:28,volleyBeats:6,travelBeats:11,formation:1,bossHP:12,blockDamage:3,bombStep:0,heal:30,healthBeats:Object.freeze([32,64,104,144,172]),directionRequired:false,hitRadius:.31}),
  normal:Object.freeze({name:'Normal',itemStep:8,enemyStep:16,lifeBeats:26,volleyBeats:5,travelBeats:10,formation:1,bossHP:24,blockDamage:5,bombStep:0,heal:25,healthBeats:Object.freeze([56,112,168]),directionRequired:false,hitRadius:.28}),
  hard:Object.freeze({name:'Hard',itemStep:6,enemyStep:12,lifeBeats:24,volleyBeats:4,travelBeats:9,formation:1,bossHP:36,blockDamage:7,bombStep:48,heal:20,healthBeats:Object.freeze([88,164]),directionRequired:true,hitRadius:.26}),
  'ultra-hard':Object.freeze({name:'Ultra Hard',itemStep:4,enemyStep:8,lifeBeats:22,volleyBeats:3,travelBeats:8,formation:2,bossHP:48,blockDamage:10,bombStep:24,heal:15,healthBeats:Object.freeze([148]),directionRequired:true,hitRadius:.24})
 });
 const normalize=value=>ORDER.includes(value)?value:'easy';
 const get=value=>PROFILES[normalize(value)];
 const api=Object.freeze({ORDER,PROFILES,normalize,get,VERSION:'1.0.0'});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.PrismDifficulty=api;
})(globalThis);
