/* Standard mapping only; physical-device acceptance is a separate gate. */
export const deadzone=(x,y,d=.18)=>{const r=Math.hypot(x,y);if(!Number.isFinite(r)||r<=d)return [0,0];const s=Math.min(1,(r-d)/(1-d))/r;return [x*s,y*s];};
export class GamepadInput{
 constructor(){this.id=null;this.previous=[];this.armed=false;this.menuAxis=0;}
 reset(){this.previous=[];this.armed=false;}
 sample(pads){const pad=Array.from(pads||[]).find(p=>p?.connected&&p.mapping==='standard');if(!pad){const disconnected=this.id!==null;this.id=null;this.reset();return {connected:false,disconnected,actions:[],move:[0,0],look:[0,0]};}
 if(this.id!==pad.index){this.id=pad.index;this.reset();}
 const held=i=>!!pad.buttons[i]?.pressed||pad.buttons[i]?.value>.55,down=pad.buttons.map((_,i)=>held(i));const move=deadzone(pad.axes[0]||0,pad.axes[1]||0),look=deadzone(pad.axes[2]||0,pad.axes[3]||0);
 if(!this.armed){this.previous=down;if(!down.some(Boolean)&&Math.hypot(...move)<.1&&Math.hypot(...look)<.1)this.armed=true;return {connected:true,actions:[],move:[0,0],look:[0,0]};}
 const bindings={0:'dodge',1:'crouch',2:'reload',3:'interact',5:'bottle',8:'map',9:'pause',11:'prone',12:'heal',13:'pack',14:'smoke',15:'shoulder'};const actions=Object.entries(bindings).filter(([i])=>down[i]&&!this.previous[i]).map(([,a])=>a);this.previous=down;
 return {connected:true,actions,move,look,aim:held(6),fire:held(7),listen:held(4),sprint:held(10),confirm:actions.includes('dodge'),back:actions.includes('crouch'),nav:held(12)?-1:held(13)?1:move[1]};
 }
}
