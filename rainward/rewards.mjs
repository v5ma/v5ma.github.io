/* Deterministic one-time drops. Remaining quantities survive checkpoints;
 * downed enemies cannot be farmed again by reloading a saved chapter. */
import {dist,obstruction,heightAt,CURRENT} from './world.mjs';
export const CAPS={ammo:36,cloth:12,canister:12,bottles:12};
export const dropTable=type=>type==='brute'?{ammo:5,canister:2}:type==='prowler'?{cloth:1,canister:1}:type==='drifter'?{canister:1,bottles:1}:{ammo:3,cloth:1};
export function syncDrops(s){s.drops||=[];for(const e of s.enemies)if(e.hp<=0&&!e.dropMade){e.dropMade=true;s.drops.push({id:e.id,x:e.x,z:e.z,items:dropTable(e.type)});}}
export function lootTarget(s){syncDrops(s);const p=s.player;return s.drops.find(d=>Object.values(d.items).some(v=>v>0)&&dist(d,p)<1.9&&!obstruction({x:p.x,y:heightAt(p.x,p.z)+.4,z:p.z},{x:d.x,y:heightAt(d.x,d.z)+.4,z:d.z}));}
export function collectDrop(s,id){const d=s.drops?.find(x=>x.id===id);if(!d||lootTarget(s)?.id!==id)return null;const got={};for(const [kind,max]of Object.entries(CAPS)){const key=kind==='ammo'?'reserve':kind,n=Math.min(d.items[kind]||0,max-s.player[key]);if(n>0){s.player[key]+=n;d.items[kind]-=n;got[kind]=n;}}return got;}
export function puzzleTarget(s){const p=CURRENT.puzzle;if(!p)return null;const clear=q=>dist(q,s.player)<2&&!obstruction({x:q.x,y:1,z:q.z},{x:s.player.x,y:1,z:s.player.z});if(clear(p.clue))return {kind:'clue',label:p.clue.label};const i=p.wheels.findIndex(clear);if(i>=0)return {kind:'wheel',index:i,label:s.puzzle.solved?'Waterway open':p.wheels[i].label+' · '+p.symbols[s.puzzle.wheels[i]]+' → turn'};return null;}
