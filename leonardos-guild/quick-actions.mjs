/* Tap/hold decisions and tool history are session-local, not a save migration. */
export const TOOL_HOLD_MS=220;
export function createTapHold(delay=TOOL_HOLD_MS){
 let started=null,used=false;
 return {reset(){started=null;used=false;},update({down,pressed,released,now,blocked=false}){
  if(blocked){started=null;used=true;return null;}
  if(pressed){started=now;used=false;}
  if(down&&started!==null&&!used&&now-started>=delay){used=true;return 'hold';}
  if(released){const tap=started!==null&&!used;started=null;used=false;return tap?'tap':null;}
  return null;
 }};
}
export function createQuickTools(initial='staff'){
 let current=initial,previous=initial==='staff'?'sling':'staff';
 return {observe(tool){if(['staff','sling','letters','lantern'].includes(tool)&&tool!==current){previous=current;current=tool;}},target(){return previous;},inspect(){return {current,previous};}};
}
