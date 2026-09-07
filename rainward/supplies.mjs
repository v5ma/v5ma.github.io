import {START,BOUNDS,OBSTACLES,ITEMS,SHELTERS,EXIT,PATROLS,HEIGHT,RAD,clamp,dist,inside,solidAt,rayBox,obstruction,coverAt,findPath} from './world.mjs';
import {forward,emit,hint,noise,RECIPES} from './state.mjs';
export function interactable(s){const p=s.player;const item=ITEMS.find(i=>!s.taken.has(i.id)&&dist(i,p)<1.8&&!obstruction({x:p.x,y:.4,z:p.z},{x:i.x,y:.4,z:i.z}));if(item)return {kind:'item',id:item.id,label:item.label};
 if(dist(EXIT,p)<2.7)return {kind:'exit',label:s.objectives.cell&&s.objectives.crank?'Open the floodgate / extract':'Floodgate: battery + spindle required'};
 const save=SHELTERS.find(c=>dist(c,p)<1.7);if(save)return {kind:'shelter',id:save.id,label:'Save at '+save.name};
 const enemy=s.enemies.find(e=>e.hp>0&&e.state!=='chase'&&dist(e,p)<1.75&&((p.x-e.x)*forward(e.yaw).x+(p.z-e.z)*forward(e.yaw).z)<-.15&&!obstruction({x:p.x,y:1,z:p.z},{x:e.x,y:1,z:e.z}));if(enemy)return {kind:'takedown',id:enemy.id,label:'Silent takedown'};return null;
}
export function interact(s){if(s.status!=='playing'||s.player.craft)return false;const target=interactable(s);if(!target){hint(s,'Move closer to a supply, shelter or unaware lookout.');return false;}
 if(target.kind==='item'){const i=ITEMS.find(i=>i.id===target.id);s.taken.add(i.id);if(i.objective)s.objectives[i.objective]=true;for(const k of ['cloth','canister','bottles'])s.player[k]=Math.min(12,s.player[k]+(i[k]||0));s.player.reserve=Math.min(36,s.player.reserve+(i.ammo||0));emit(s,'pickup',{id:i.id});hint(s,'Recovered: '+i.label);}
 if(target.kind==='shelter'){s.checkpoint=target.id;emit(s,'checkpoint',{id:target.id});hint(s,'Checkpoint saved. Supplies and objectives are recorded.');}
 if(target.kind==='takedown'){const e=s.enemies.find(e=>e.id===target.id);e.hp=0;e.state='down';s.stats.takedowns++;emit(s,'takedown',{id:e.id});noise(s,e.x,e.z,2,'scuffle');hint(s,'Lookout subdued. No ammunition spent.');}
 if(target.kind==='exit'){if(!s.objectives.cell||!s.objectives.crank){hint(s,'Recover both marked components first.');return false;}s.status='won';emit(s,'complete');}
 return true;
}
export function craft(s,item){const p=s.player,r=RECIPES[item];if(s.status!=='playing'||!r||p.craft||p[item]>=3||p.cloth<r.cloth||p.canister<r.canister){hint(s,'Need 1 fabric and 1 salvage. You can carry 3 of each crafted item.');return false;}p.cloth-=r.cloth;p.canister-=r.canister;p.craft={item,left:r.time};emit(s,'craft-start',{item});return true;}
export function heal(s){const p=s.player;if(s.status!=='playing'||!p.medkit||p.hp>=100||p.craft)return false;p.medkit--;p.hp=Math.min(100,p.hp+55);emit(s,'heal');hint(s,'Health restored.');return true;}
export function smoke(s){const p=s.player;if(s.status!=='playing'||!p.smoke||p.craft)return false;p.smoke--;s.smokes.push({x:p.x,z:p.z,radius:4,life:10});emit(s,'smoke');return true;}
export function reload(s){const p=s.player;if(s.status!=='playing'||p.reload||p.mag>=6||p.reserve<=0||p.craft)return false;p.reload=1.5;emit(s,'reload');return true;}
