/* Original prototype equipment; all prices are earned in-game credits, never
 * real currency. These tables also drive the shop, HUD, tests and roadmap. */
export const WEAPONS=Object.freeze({
 arc:{id:'arc',slot:1,name:'Arc Caster',role:'Reliable rechargeable sidearm',cost:0,mag:8,reserve:0,damage:34,delay:.23,reload:1.05,range:85,pellets:1,spread:0,zoom:1.6,color:'#70dfc5'},
 carbine:{id:'carbine',slot:2,name:'Tempest Carbine',role:'Fast automatic fire; control the spread',cost:180,mag:24,reserve:120,damage:19,delay:.095,reload:1.65,range:90,pellets:1,spread:.018,zoom:1.8,color:'#edb866'},
 sniper:{id:'sniper',slot:3,name:'Horizon Longglass',role:'4× optic, heavy hit, deliberate follow-up',cost:300,mag:4,reserve:24,damage:112,delay:1.1,reload:2.15,range:220,pellets:1,spread:.012,zoom:4,color:'#b3b8f4'},
 scatter:{id:'scatter',slot:4,name:'Foundry Scattergun',role:'Six-pellet close-range cone',cost:220,mag:6,reserve:36,damage:17,delay:.7,reload:1.8,range:32,pellets:6,spread:.08,zoom:1.35,color:'#f69570'}
});
export const DEPOTS=Object.freeze([
 {id:'quay-depot',x:3,y:0,z:7,name:'Quay Outfitters'},
 {id:'garden-depot',x:61,y:6,z:-24,name:'Glasshouse Supply'},
 {id:'works-depot',x:-25,y:12,z:-75,name:'Copperlight Exchange'}
]);
export const CACHES=Object.freeze([
 {id:'quay-cache',x:-13,y:0,z:-5,credits:60,label:'Quay reserve',weapon:null},
 {id:'garden-cache',x:78,y:6,z:-25,credits:65,label:'Glasshouse field kit',weapon:'carbine'},
 {id:'foundry-cache',x:-39,y:12,z:-72,credits:80,label:'Foundry rare crate',weapon:'scatter'},
 {id:'spire-cache',x:33,y:20,z:-128,credits:100,label:'Surveyor reserve',weapon:'sniper'}
]);
export const ENEMIES=Object.freeze([
 {id:'g1',kind:'scout',home:'garden',x:66,y:9,z:-22,hp:85,reward:65},
 {id:'f1',kind:'heavy',home:'foundry',x:-24,y:14,z:-83,hp:180,reward:120},
 {id:'s1',kind:'sentry',home:'spire',x:44,y:23,z:-119,hp:120,reward:95},
 {id:'range',kind:'target',home:'harbor',x:14,y:1.6,z:-4,hp:112,reward:30}
]);
export const upgradePrice=(level)=>120+level*100;
export function cleanKit(value){
 const v=value&&typeof value==='object'?value:{};
 const count=(x,max,fallback=0)=>Number.isFinite(x)?Math.max(0,Math.min(max,Math.floor(x))):fallback;
 const owns=['arc',...new Set(Array.isArray(v.owns)?v.owns.filter(k=>k!=='arc'&&Object.hasOwn(WEAPONS,k)):[])];
 const tune={};for(const id of owns)tune[id]={damage:count(v.tune?.[id]?.damage,2),reload:count(v.tune?.[id]?.reload,2)};
 const mags={},reserve={};for(const id of owns){const w=WEAPONS[id];mags[id]=count(v.mags?.[id],w.mag,w.mag);reserve[id]=count(v.reserve?.[id],w.reserve*3,w.reserve);}
 const dead=[...new Set(Array.isArray(v.dead)?v.dead.filter(id=>ENEMIES.some(e=>e.id===id)):[])];
 const taken=[...new Set(Array.isArray(v.taken)?v.taken.filter(id=>CACHES.some(c=>c.id===id)||dead.some(d=>'drop-'+d===id)):[])];
 return {credits:count(v.credits,99999,400),owns,selected:owns.includes(v.selected)?v.selected:'arc',mags,reserve,tune,shield:count(v.shield,2),dead,taken};
}
export function weaponStats(s){const w=WEAPONS[s.p.weapon]||WEAPONS.arc,t=s.kit.tune[w.id]||{damage:0,reload:0};return {...w,damage:Math.round(w.damage*(1+t.damage*.18)),reload:w.reload*(1-t.reload*.18)};}
