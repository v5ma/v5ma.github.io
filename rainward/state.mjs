import {syncDrops} from './rewards.mjs';
import {levelHeight,CURRENT,LEVELS,useLevel,syncGates,heightAt,START,BOUNDS,OBSTACLES,ITEMS,SHELTERS,EXIT,PATROLS,HEIGHT,RAD,clamp,dist,inside,solidAt,rayBox,obstruction,coverAt,findPath} from './world.mjs';
export {HEIGHT,EXIT,ITEMS,SHELTERS};
export const forward=yaw=>({x:-Math.sin(yaw),z:-Math.cos(yaw)});
const numeric=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export const RECIPES={medkit:{cloth:1,canister:1,time:2.1},smoke:{cloth:1,canister:1,time:2.4}};
export function createGame(level='district',activate=true){const data=LEVELS[level];if(!data)throw Error('Unknown chapter');if(activate)useLevel(level);return {level,drops:[],puzzle:data.puzzle?{wheels:[...data.puzzle.initial],solved:false,clueRead:false}:null,t:0,status:'playing',player:{...data.start,y:levelHeight(level,data.start.x,data.start.z),hp:100,stamina:100,stance:'stand',yaw:0,speed:0,aim:false,listen:false,noise:0,vx:0,vz:0,exhausted:false,invulnerable:0,dodge:0,vault:null,mag:6,reserve:12,reload:0,shotCD:0,cloth:0,canister:0,bottles:0,medkit:0,smoke:0,craft:null},enemies:data.patrols.map(e=>({...e,x:e.points[0][0],z:e.points[0][1],hp:e.type==='brute'?7:e.type==='prowler'||e.type==='drifter'?3:2,index:1,state:'patrol',awareness:0,target:null,path:[],repath:0,timer:0,attack:0,seen:false,lastNoise:0})),taken:new Set(),objectives:{cell:false,crank:false},smokes:[],projectiles:[],sounds:[],events:[],serial:0,stats:{shots:0,alerts:0,takedowns:0,hits:0,bottles:0,escapes:0,seconds:0},checkpoint:data.shelters[0].id,hint:level==='district'?'Find the signal battery and gate spindle. The wet grass is your cover.':'Explore the archive and glasshouse. Read the inscription and open the north waterway.',hintTime:5};}
export function emit(s,type,data={}){s.events.push({type,t:s.t,seq:++s.serial,...data});if(s.events.length>180)s.events.shift();}
export function hint(s,text){s.hint=text;s.hintTime=3.5;}
export function noise(s,x,z,radius,type='sound'){s.sounds.push({id:++s.serial,x,z,radius,type,life:.25});emit(s,'sound',{x,z,radius,kind:type});}
export function checkpoint(s){syncDrops(s);return JSON.stringify({version:2,level:s.level||'district',puzzle:s.puzzle,drops:s.drops||[],defeated:s.enemies.filter(e=>e.hp<=0).map(e=>({id:e.id,x:e.x,z:e.z})),checkpoint:s.checkpoint,taken:[...s.taken],player:Object.fromEntries(['hp','mag','reserve','cloth','canister','bottles','medkit','smoke'].map(k=>[k,s.player[k]])),objectives:{...s.objectives},stats:{...s.stats}});}
export function restore(raw,activate=true){

 try{
  if(typeof raw!=='string'||raw.length>24000)return null;const d=JSON.parse(raw),level=d.version===1?'district':d.level,def=LEVELS[level];if(!def||![1,2].includes(d.version))return null;
  const c=def.shelters.find(c=>c.id===d.checkpoint);if(!c||!Array.isArray(d.taken)||d.taken.length>def.items.length||new Set(d.taken).size!==d.taken.length||d.taken.some(id=>!def.items.some(i=>i.id===id)))return null;
  const limits={hp:100,mag:6,reserve:36,cloth:12,canister:12,bottles:12,medkit:3,smoke:3};for(const [k,max]of Object.entries(limits))if(!numeric(d.player?.[k],k==='hp'?1:0,max))return null;
  if(def.puzzle&&(!d.puzzle||!Array.isArray(d.puzzle.wheels)||d.puzzle.wheels.length!==3||d.puzzle.wheels.some(v=>!Number.isInteger(v)||v<0||v>3)))return null;
  const defeated=d.defeated||[],drops=d.drops||[];if(!Array.isArray(defeated)||defeated.length>def.patrols.length||!Array.isArray(drops)||drops.length>def.patrols.length)return null;
  for(const a of [...defeated,...drops])if(!def.patrols.some(e=>e.id===a.id)||!numeric(a.x,def.bounds.x0,def.bounds.x1)||!numeric(a.z,def.bounds.z0,def.bounds.z1))return null;
  if(new Set(defeated.map(a=>a.id)).size!==defeated.length||new Set(drops.map(a=>a.id)).size!==drops.length)return null;
  for(const a of drops){if(!defeated.some(e=>e.id===a.id)||!a.items||Object.entries(a.items).some(([k,v])=>!['ammo','cloth','canister','bottles'].includes(k)||!Number.isInteger(v)||v<0||v>5))return null;}
  const s=createGame(level,activate);s.checkpoint=c.id;s.taken=new Set(d.taken);for(const k of Object.keys(limits))s.player[k]=d.player[k];Object.assign(s.player,{x:c.x,z:c.z,y:levelHeight(level,c.x,c.z)});
  s.objectives={cell:def.items.some(i=>i.objective==='cell'&&s.taken.has(i.id)),crank:def.items.some(i=>i.objective==='crank'&&s.taken.has(i.id))};
  if(def.puzzle){s.puzzle={wheels:[...d.puzzle.wheels],solved:d.puzzle.wheels.every((v,i)=>v===def.puzzle.targets[i]),clueRead:!!d.puzzle.clueRead};if(activate)syncGates(s.puzzle);}
  for(const a of defeated){const e=s.enemies.find(e=>e.id===a.id);Object.assign(e,{hp:0,state:'down',dropMade:true,x:a.x,z:a.z});}s.drops=drops.map(a=>({id:a.id,x:a.x,z:a.z,items:{...a.items}}));
  for(const k of Object.keys(s.stats))if(numeric(d.stats?.[k],0,1e8))s.stats[k]=d.stats[k];s.t=s.stats.seconds;return s;
 }catch{return null;}
}
