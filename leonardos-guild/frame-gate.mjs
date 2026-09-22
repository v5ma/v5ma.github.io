/* Freeze only an unchanged, paused scene. Input and DOM navigation keep polling.
 * Any real state, viewport, settings or art-load change requests a normal frame.
 * Active simulation is never skipped, rescaled, seeded or accelerated. */
export function createFrameGate(){
 let last=null,updates=0,skipped=0;
 const shouldDraw=function(dt,state,configuration,snap=false){
  if(dt>0||snap){last=null;updates++;return true;}
  const signature=JSON.stringify([state,configuration],(_key,value)=>value instanceof Set?[...value]:value);
  if(signature===last){skipped++;return false;}
  last=signature;updates++;return true;
 };
 shouldDraw.inspect=()=>({updates,skipped});return shouldDraw;
}
