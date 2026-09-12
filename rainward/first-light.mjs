import {FLOODGATE_NOTES,FLOODGATE_ROUTES} from './floodgate-content.mjs';
import {dist,heightAt,obstruction,ITEMS,EXIT,findPath} from './world.mjs';
import {emit,hint} from './state.mjs';
export function noteTarget(s){if(s.level!=='district')return null;return FLOODGATE_NOTES.filter(n=>!(s.fieldNotes||[]).includes(n.id)&&dist(n,s.player)<1.6&&!obstruction({x:n.x,y:heightAt(n.x,n.z)+.85,z:n.z},{x:s.player.x,y:heightAt(s.player.x,s.player.z)+.85,z:s.player.z})).sort((a,b)=>dist(a,s.player)-dist(b,s.player))[0]||null;}
export function readFieldNote(s,id){if(s.status!=='playing'||s.player.craft||s.player.healing||s.player.melee||noteTarget(s)?.id!==id)return false;const note=FLOODGATE_NOTES.find(n=>n.id===id);s.fieldNotes??=[];s.fieldNotes.push(id);emit(s,'field-note',{id,x:note.x,z:note.z});hint(s,'Recorded: '+note.title+'. Read it in the map journal.');s.hintTime=6;return true;}
export function chooseRoute(s,id){if(s.level!=='district'||s.status!=='playing'||id!==null&&!Object.hasOwn(FLOODGATE_ROUTES,id))return false;s.guideRoute=id;return true;}
export function guideObjective(s){if(s.level!=='district'||!s.guideRoute)return null;const route=FLOODGATE_ROUTES[s.guideRoute];if(!route)return null;const missing=route.order.find(key=>!s.objectives[key]);const target=missing?ITEMS.find(item=>item.objective===missing):EXIT;return target?{...target,key:missing||'exit',label:target.label||'Floodgate extraction'}:null;}
// Routing is navigation help, not a safe-path oracle. It never samples enemies,
// changes objectives, awards supplies, or moves the character.
export function guidePath(s){const target=guideObjective(s);if(!target)return [];const route=FLOODGATE_ROUTES[s.guideRoute],p=s.player;const initial=route.order.every(key=>!s.objectives[key]);let via=[];
 if(initial&&p.z>10){const authored=route.points.map(([x,z])=>({x,z}));let nearest=0;for(let i=1;i<authored.length;i++)if(dist(p,authored[i])<dist(p,authored[nearest]))nearest=i;via=authored.slice(nearest+1);}
 via.push(target);let origin=p,path=[];for(const stop of via){const leg=findPath(origin,stop);if(!leg.length&&dist(origin,stop)>1.5)return [];path.push(...leg);origin=stop;}return path;
}
export function openingAdvice(s,preset='survival',controller=false){if(s.level!=='district')return null;const p=s.player;if(s.status!=='playing')return null;
 if(s.enemies.some(e=>e.hp>0&&e.seen&&e.awareness>.9))return {key:'break-sight',title:'BREAK THEIR SIGHTLINE',body:'Put a wall between you and the lookout. A pause in shooting is your chance to move.'};
 if(!s.taken.has('rations')&&p.z>20)return {key:'supplies',title:'PACK BEFORE YOU GO',body:controller?'Approach the marked supply bag. Y scavenges it; D-pad down opens the satchel.':'Approach the marked supply bag. E scavenges it; Tab opens the satchel.'};
 if(p.z>10&&!s.objectives.cell&&!s.objectives.crank)return {key:'cover',title:'CHOOSE YOUR APPROACH',body:controller?(preset==='survival'?'Tap B to crouch; hold B to crawl. Hold RB to listen. View opens the route journal.':'B crouches; right-stick click goes prone. Hold LB to listen. View opens the route journal.'):'C crouches; Z crawls; Q listens. M opens the route journal. Grass reduces visibility; it never guarantees safety.'};
 if(s.objectives.cell&&!s.objectives.crank)return {key:'shelter',title:'KEEP WHAT YOU FOUND',body:'The clinic shelter records supplies and discoveries. Freight Hall holds the gate spindle.'};
 if(s.objectives.crank&&!s.objectives.cell)return {key:'clinic',title:'THE CLINIC STILL HAS A LIGHT',body:'The signal battery is in the clinic back room. Its shelter can preserve your expedition.'};
 if(s.objectives.cell&&s.objectives.crank)return {key:'exit',title:'LEAVE A WAY THROUGH',body:'Both components are recovered. Reach the floodgate and interact to extract. Fighting is optional.'};
 return {key:'look',title:'LISTEN BEFORE CROSSING',body:'Watch movement from cover. Noise invites investigation; changing position breaks a search.'};
}
