/* Separate finite magazines for the two fictional weapons. */
export const WEAPONS=Object.freeze({pistol:{label:'SIDEARM',capacity:6,reserve:36,reload:1.5,cooldown:.38,damage:1},rifle:{label:'BOLT RIFLE',capacity:5,reserve:18,reload:2.3,cooldown:.95,damage:3}});
export function weapon(p){return WEAPONS[p.gun]||WEAPONS.pistol;}
export function arsenal(p){return {...(p.arsenal||{pistol:{mag:6,reserve:12},rifle:{mag:0,reserve:0}}),[p.gun||'pistol']:{mag:p.mag,reserve:p.reserve}};}
export function equip(p,id){if(!['pistol','rifle','medkit','bottle','smoke'].includes(id)||p.reload||p.craft||p.healing||p.melee)return false;if(WEAPONS[id]){p.arsenal=arsenal(p);const next=p.arsenal[id]||{mag:0,reserve:0};p.mag=next.mag;p.reserve=next.reserve;p.gun=id;}p.equipped=id;return true;}
export function addRifleAmmo(p,count){p.arsenal=arsenal(p);const r=p.arsenal.rifle;r.reserve=Math.min(18,r.reserve+count);if(p.gun==='rifle')p.reserve=r.reserve;}
