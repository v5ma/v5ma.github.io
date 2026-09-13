/* Presentation only. Keep dive/surface bindings in input.mjs and app.mjs. */
export function waterPrompt({connected=false,preset='survival',submerged=false,oxygen=100}={}){
 const air=Number.isFinite(oxygen)?Math.max(0,Math.min(100,oxygen)):100;
 const surface=connected?'A SURFACE':'SPACE SURFACE';
 const dive=connected?(preset==='classic'?'B DIVE':'HOLD B DIVE'):'Z DIVE';
 const lowAir=submerged&&air<=25;
 return {air:Math.ceil(air),lowAir,
  state:(submerged?(lowAir?'LOW AIR':'UNDERWATER'):'SWIMMING')+' / AIR '+Math.ceil(air),
  control:(submerged?surface:dive)+' / GEAR STOWED',
  warning:lowAir?'Low air. '+(connected?'Press A':'Press Space')+' to surface and breathe.':'',
  oxygenLabel:'Oxygen remaining: '+Math.ceil(air)+' percent'};
}
