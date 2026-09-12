/* Distinguishes tap/hold gestures on X/LB/RB without changing fixed menu input. */
export class CombatGestures{
 constructor(){this.reset();}
 reset(){this.prev={reload:false,pulse:false,reverse:false};this.time={reload:0,pulse:0,reverse:0};this.long={reload:false,pulse:false,reverse:false};}
 step(held,dt){const out=[];for(const key of ['reload','pulse','reverse']){const on=!!held[key],was=this.prev[key];if(on){this.time[key]+=dt;if(!this.long[key]&&this.time[key]>=.34){this.long[key]=true;out.push(key==='reload'?'use-hold':key==='pulse'?'power-charge':'power-wheel');}}else if(was){if(!this.long[key])out.push(key==='reload'?'use':key==='pulse'?'power-tap':'power-recent');else if(key==='pulse')out.push('power-trap');this.time[key]=0;this.long[key]=false;}this.prev[key]=on;}return out;}
}
