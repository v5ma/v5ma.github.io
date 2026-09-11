/* Fictional game archetypes. Distinct silhouettes have corresponding rules;
 * no difficulty, visibility or damage changes are applied to legacy patrols. */
const base={hp:2,sight:18,range:11,windup:.85,cooldown:1.7,damage:17,chaseSpeed:3,patrolSpeed:1.05,attackKind:'ranged',label:'Lookout'};
export const ENEMY_TYPES=Object.freeze({
 watcher:base,
 drifter:{...base,hp:3,sight:0,range:1.55,windup:.55,cooldown:1.1,label:'Echo drifter'},
 raider:{...base,hp:3,sight:16,range:1.65,windup:.72,cooldown:1.1,damage:19,chaseSpeed:3.65,patrolSpeed:1.2,attackKind:'melee',label:'Raider'},
 marksman:{...base,sight:28,range:23,windup:1.65,cooldown:2.8,damage:24,chaseSpeed:2.2,patrolSpeed:.8,label:'Marksman'},
 sentinel:{...base,hp:4,sight:19,range:10,windup:1.15,cooldown:2,damage:18,chaseSpeed:2.35,patrolSpeed:.9,label:'Armored sentinel'},
 prowler:{...base,hp:3,attackKind:'monster',label:'Mire hound'},
 brute:{...base,hp:7,attackKind:'monster',label:'Rootback'},
 shrieker:{...base,hp:4,attackKind:'monster',label:'Shrieker'}
});
export const enemyProfile=type=>ENEMY_TYPES[type]||base;
