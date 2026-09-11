/* W3C standard mapping. A neutral poll is required after focus/mode/device changes. */
export const GAMEPAD_BINDINGS=Object.freeze({0:'dodge',1:'crouch',2:'reload',3:'interact',5:'bottle',8:'map',9:'pause',11:'prone',12:'heal',13:'pack',14:'smoke',15:'shoulder'});
export const deadzone=(x,y,d=.18)=>{x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;d=Number.isFinite(d)?Math.max(.05,Math.min(.45,d)):.18;const r=Math.hypot(x,y);if(r<=d)return [0,0];const s=Math.min(1,(r-d)/(1-d))/r;return [x*s,y*s];};
const idle=(connected=false)=>({connected,actions:[],move:[0,0],look:[0,0],nav:0,navX:0,scroll:0,aim:false,fire:false,listen:false,sprint:false,confirm:false,back:false});
export class GamepadInput{
 constructor(){this.id=null;this.device=null;this.raw=null;this.reset();}
 reset(){this.previous=[];this.armed=false;}
 sample(pads,zone=.18){const available=Array.from(pads||[]).filter(p=>p?.connected&&p.mapping==='standard');const pad=available.find(p=>p.index===this.id&&p.id===this.device)||available[0];
  if(!pad){const disconnected=this.id!==null;this.id=null;this.device=null;this.raw=null;this.reset();return {...idle(),disconnected};}
  const changed=this.id!==null&&(this.id!==pad.index||this.device!==pad.id);
  if(this.id!==pad.index||this.device!==pad.id){this.id=pad.index;this.device=pad.id;this.reset();}this.raw=pad;
  const held=i=>!!pad.buttons?.[i]?.pressed||pad.buttons?.[i]?.value>.55,down=Array.from({length:17},(_,i)=>held(i));
  const move=deadzone(pad.axes?.[0],pad.axes?.[1],zone),look=deadzone(pad.axes?.[2],pad.axes?.[3],zone);
  if(!this.armed){this.previous=down;if(!down.some(Boolean)&&Math.hypot(...move)<.1&&Math.hypot(...look)<.1)this.armed=true;return {...idle(true),disconnected:changed};}
  const edge=i=>down[i]&&!this.previous[i];const actions=Object.entries(GAMEPAD_BINDINGS).filter(([i])=>edge(i)).map(([,a])=>a);
  const out={connected:true,actions,move,look,aim:held(6),fire:held(7),listen:held(4),sprint:held(10),sprintToggle:edge(10),confirm:edge(0),back:edge(1),prevTab:edge(4),nextTab:edge(5),nav:held(12)?-1:held(13)?1:move[1],navX:held(14)?-1:held(15)?1:move[0],scroll:look[1]};this.previous=down;return out;
 }
}
