/* Diorama combat uses the same aim as ordinary gamepad play. A pointing ray is
 * only a menu pointer: missing the aperture must never disable the weapon. */
import {forward,traceWeaponRay,weaponStats} from './model.mjs';
import {eyeHeight} from './skirmish-core.mjs';
export const WINDOW_CONTROLS='Left stick: move | Right stick: aim | Right trigger: fire | Left trigger: fine aim | B: reload | Right grip: use | A: jump | X: weapon | Left grip: power | Y: pause';
export function windowControls(sampler,sources){
 const hands={};const present=new Set();
 for(const source of sources||[]){
  const side=source.handedness;if(source.hand||!['left','right'].includes(side)||source.gamepad?.mapping!=='xr-standard')continue;
  const key='window:'+side;present.add(key);hands[side]=sampler.read(source.gamepad,key,true);
 }
 for(const side of ['left','right']){const key='window:'+side;if(!present.has(key)){sampler.previous.delete(key);sampler.blocked.delete(key);}}
 const l=hands.left,r=hands.right;
 return {window:true,move:l?.move||[0,0],look:r?.move||[0,0],turn:r?.move?.[0]||0,held:{fire:!!r?.held.fire,aim:!!l?.held.fire,boost:!!l?.held.boost},
  edges:{jump:!!r?.edges.jump,reload:!!r?.edges.reload,interact:!!r?.edges.interact,pulse:!!l?.edges.interact,next:!!l?.edges.jump,stance:!!r?.edges.boost,pause:!!l?.edges.reload}};
}
export function stepWindowLook(player,look,dt,{fine=false,speed=1,invertY=false}={}){
 const t=Math.max(0,Math.min(.12,Number.isFinite(dt)?dt:0)),k=(fine?.35:1)*Math.max(.5,Math.min(2.5,Number.isFinite(speed)?speed:1));
 const x=Number.isFinite(look?.[0])?Math.max(-1,Math.min(1,look[0])):0,y=Number.isFinite(look?.[1])?Math.max(-1,Math.min(1,look[1])):0;
 player.yaw+=x*t*2.2*k;player.pitch=Math.max(-1.35,Math.min(1.35,player.pitch-y*t*1.6*k*(invertY?-1:1)));
}
export function windowAim(state){const p=state.p,k=state.skirmish?.recoil||{x:0,y:0};return {origin:{x:p.x,y:p.y+eyeHeight(p),z:p.z},direction:forward(p.yaw+k.x,p.pitch+k.y)};}

/* Centerline only: real weapon spread is not an aim-assist or a guaranteed hit. */
export function windowAimPreview(state){
 const {origin,direction}=windowAim(state),range=weaponStats(state).range;
 const trace=traceWeaponRay(state,origin,direction,range);
 return {origin,direction,range,distance:trace.distance,
  end:{x:origin.x+direction.x*trace.distance,y:origin.y+direction.y*trace.distance,z:origin.z+direction.z*trace.distance},
  kind:trace.hit?'target':trace.blocked?'blocked':'range',targetId:trace.hit?.id||null,critical:trace.critical};
}

// Preserve tracking loss and life-size VR; only avatar-window aim is refreshed.
export function currentWindowAim(state,value,active){return value&&active?windowAim(state):value;}
