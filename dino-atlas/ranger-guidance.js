// Read-only descriptions of existing controls. Never set actor or mission state.
export function guidanceContext(ctx){
 const travel=ctx.input?.travel,xr=travel?.ctx?.xr,sources=Array.from(xr?.session?.inputSources||[]);
 return {xr:!!xr?.active,hands:!!xr?.active&&sources.length>0&&sources.every(s=>s.hand),mode:ctx.fleet?.mode||'foot',device:ctx.input?.device||'keyboard',active:xr?.active?travel?.activeLayout!==false:travel?.settings?.xboxLayout==='active'};
}
export function controlCard({xr=false,hands=false,mode='foot',active=true,device='gamepad'}={}){
 if(hands)return {interact:'FIELD > Interact',move:'Pinch FIELD, then hold a movement button. Release to stop.',tools:'FIELD: select Water, Pulse, Scan or Recovery; hold Fire to use.',buttons:'MENU: pause/settings. FIELD: hand controls. Map: live location.'};
 if(xr&&active)return {interact:'GRIP (either hand)',move:mode==='helicopter'?'Left stick: fly. Right stick up/down: altitude. A: hover/brake.':mode==='foot'?'Left stick: walk. A: jump. Hold left-stick click: run.':'Left stick: drive/steer. A: brake. Click left stick: Express.',tools:'LT: aim. RT: use selected tool. X: reload. Y: board / exit.',buttons:'B: menu/back. Right-stick click: map. Field tray: choose tools.'};
 if(xr)return {interact:'A',move:mode==='helicopter'?'Legacy: left stick flies; RT/LT raise/lower. Left grip aims tools.':mode==='foot'?'Legacy: left stick walks; right stick turns.':'Legacy: left stick steers; RT drives; LT reverses.',tools:mode==='foot'?'Left grip: aim. Right trigger: fire. Right grip: jump. X: reload. Y: board / exit.':'Left grip: aim tools. Right trigger: fire. X: reload. Y: board / exit.',buttons:'B: menu/back. Right-stick click: cycle tool. Map tab: full map.'};
 if(device==='keyboard')return {interact:'E',move:mode==='helicopter'?'WASD: fly. Z / Space: rise. X: lower.':mode==='foot'?'WASD: walk. Space: jump. Shift: run.':'WASD: drive/steer. Space: brake. T: Express.',tools:'Right mouse: aim. Left mouse: tool. R: reload. F: board / exit.',buttons:'M: map. Esc: menu/back. 1/2: water/pulse. 3/4: mounted tools. N: assignments.'};
 if(device==='touch')return {interact:'Tap Interact',move:'Use the movement buttons. Release a held button to stop.',tools:'Tap a tool, then use the Aim and Fire buttons. Tap Reload or Board / exit.',buttons:'Tap Map, Menu or Assignments. What do I do? opens current instructions.'};
 return {interact:'A / E',move:mode==='helicopter'?(active?'Xbox Active: left stick flies. D-pad up/down: altitude. B: hover/brake.':'Xbox Familiar: left stick flies. RT/LT: rise/lower.'):(active?'Xbox Active: left stick moves/drives. B: brake.':'Xbox Familiar: left stick walks/steers; RT drives; LT reverses.'),tools:active?'LT: aim. RT: tool. X: reload. Y: board / exit.':mode==='foot'?'LT: aim. RT: tool. X: reload. Y: board / exit.':'LB + RT: vehicle tools. X: reload. Y: board / exit.',buttons:'View / M: map. Menu / Esc: settings. D-pad left/right: tools. Y / F: board.'};
}
export function lessonInstructions(id,fallback,context){
 const c=controlCard(context),keyboard=!context.xr&&context.device==='keyboard',hand=context.hands;
 const board=hand?'Choose Board / exit in FIELD.':keyboard?'F: board / exit.':'Y: board / exit.';
 const tools=hand?'Select the attachment in FIELD, then hold Fire.':keyboard?'Right mouse: aim; left mouse: use the tool.':context.xr?(context.active?'LT: aim; RT: use the tool.':'Left grip: aim; RT: use the tool.'):(context.active||context.mode==='foot'?'LT: aim; RT: use the tool.':'LB: aim; RT: use the tool.');
 const drive=hand?'Hold Forward in FIELD; release to stop.':keyboard?'W / S: forward/reverse; A / D: steer; Space: brake.':context.active?'Left stick: drive/steer; '+(context.xr?'A':'B')+': brake.':'Left stick: steer; RT: accelerate; LT: reverse. '+(context.xr?'FIELD > Brake stops the vehicle.':'B: brake.');
 const use='Use '+c.interact+' within reach.';
 switch(id){
  case 'drive':return 'Drive through the gold marker beyond the visitor center. '+(context.mode==='foot'?'Approach a vehicle. '+board+' ':'')+drive;
  case 'horn':return 'Follow the marked road to Crest Meadow. Sound the horn near a dinosaur: '+(context.xr||hand?'FIELD > Horn.':keyboard?'H.':'D-pad down.')+' Orange rings show its 42 m reach.';
  case 'water':return 'Select Water'+(context.xr||hand?' in FIELD':keyboard?' with 1':' with D-pad left')+'. '+tools+' Water pushes dinosaurs away from you; guide rather than chase.';
  case 'zapper':return 'Select Pulse / Zapper'+(context.xr||hand?' in FIELD':keyboard?' with 2':' with D-pad right')+'. '+tools+' Interrupt the charge, then give the animal space. Blue arc and halo confirm a hit.';
  case 'feed':return 'Stop at the Crest Meadow terminal. '+use+' Fill the feeder and open the gate, then guide strays toward the opening from behind.';
  case 'trade':return 'At a visited outpost, open its Supply Exchange and buy one useful item. '+use+' '+(context.xr?'Point and trigger or pinch to select.':keyboard?'Enter selects.':'A selects.')+' Credits and cargo stay saved.';
  case 'boat':return 'Go to Wetland Dock and board the boat. '+board+' '+drive+' Follow the lit west channel to the ocean start buoy.';
  case 'roof':return 'Board the helicopter at the visitor center. '+board+' '+controlCard({...context,mode:'helicopter'}).move+' Land on Northstar roof before exiting.';
  case 'interior':return 'On the Northstar roof, walk to the marked maintenance lift. '+use+' Select ground floor, then follow the corridor to recover the habitat archive.';
  default:return fallback;
 }
}
