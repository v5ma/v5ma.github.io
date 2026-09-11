import {TOOLS} from './frontier-data.js?v=ops1';
import {clamp} from './ranger-data.js';
// Ammo/reload is simulation-time based and therefore pauses with the game.
export class RangerTools{
 constructor(state){this.state=state;this.reloadLeft=0;this.reloadTool=null;this.cooldown=0;this.lastShot=null;}
 get tool(){return TOOLS[this.state.tool];}
 switch(dir=1){this.state.tool=(this.state.tool+dir+TOOLS.length)%TOOLS.length;this.reloadLeft=0;this.reloadTool=null;}
 reload(){const i=this.state.tool;if(this.reloadLeft>0||this.state.ammo[i]>=this.tool.capacity||this.state.reserve[i]<=0)return false;this.reloadLeft=this.tool.reload;this.reloadTool=i;return true;}
 refill(){this.state.ammo=TOOLS.map(t=>t.capacity);this.state.reserve=TOOLS.map(t=>t.reserve);this.reloadLeft=0;this.reloadTool=null;}
 tick(dt){dt=clamp(dt,0,.05);this.cooldown=Math.max(0,this.cooldown-dt);if(this.reloadLeft>0){this.reloadLeft=Math.max(0,this.reloadLeft-dt);if(this.reloadLeft===0&&this.reloadTool!==null){const i=this.reloadTool,n=Math.min(TOOLS[i].capacity-this.state.ammo[i],this.state.reserve[i]);this.state.ammo[i]+=n;this.state.reserve[i]-=n;this.reloadTool=null;return true;}}return false;}
 fire(){const i=this.state.tool;if(this.reloadLeft>0||this.cooldown>0||this.state.ammo[i]<1)return null;this.state.ammo[i]-=1;this.cooldown=i===0?.05:.38;return this.tool;}
}
