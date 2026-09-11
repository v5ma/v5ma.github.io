/* Freeze only an unchanged, paused scene. Input and DOM navigation keep polling.
 * Any real state, viewport, settings or art-load change requests a normal frame.
 * Active simulation is never skipped, rescaled, seeded or accelerated. */
export function createFrameGate(){
 let last=null;
 return function shouldDraw(dt,state,configuration,snap=false){
  if(dt>0||snap){last=null;return true;}
  const signature=JSON.stringify([state,configuration],(_key,value)=>value instanceof Set?[...value]:value);
  if(signature===last)return false;
  last=signature;return true;
 };
}
