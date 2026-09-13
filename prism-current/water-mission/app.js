/* Standalone expedition route inside Prism Current; its save is strictly isolated. */
(function(){'use strict';
 const $=id=>document.getElementById(id),C=PrismWaterCore,T=AFRAME.THREE;
 let saved=null;try{saved=localStorage.getItem(C.KEY);}catch{}
 const state=C.create(saved),keys=new Set(),touch={forward:0,side:0,up:0,down:0};let quality='balanced',quiet=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let renderer,art,started=false,clock=0,last=0,toastUntil=0,padId=null,padOld=[],padDirection=0,nextRepeat=0,drag=null,stickId=null,stopped=false;
 const PREF='prism-current.water-settings.v1';let audio=null;
 try{const p=JSON.parse(localStorage.getItem(PREF)||'{}');if(['light','balanced','cinematic'].includes(p.quality))quality=p.quality;if(typeof p.quiet==='boolean')quiet=p.quiet;if(Number.isFinite(p.volume))$('volume').value=Math.max(0,Math.min(100,p.volume));}catch{}
 $('quality').value=quality;$('quiet').checked=quiet;
 function message(text){$('toast').textContent=text;toastUntil=clock+6;}
 function persist(){try{localStorage.setItem(C.KEY,C.serial(state));$('save-status').textContent='Checkpoint saved on this device.';}catch{$('save-status').textContent='Storage unavailable. This session still works, but progress is not saved.';}}
 function soundStart(){try{if(!audio){const a=new (window.AudioContext||window.webkitAudioContext)(),gain=a.createGain(),filter=a.createBiquadFilter(),osc=[];filter.type='lowpass';filter.frequency.value=480;filter.connect(gain);gain.connect(a.destination);
   for(const hz of [73.42,110,146.84]){const o=a.createOscillator(),v=a.createGain();o.type='sine';o.frequency.value=hz;v.gain.value=.038;o.connect(v);v.connect(filter);o.start();osc.push(o);}
   audio={a,gain,filter,osc};}audio.a.resume().catch(()=>{});}catch{}}
 function cue(){if(!audio)return;const a=audio.a,o=a.createOscillator(),v=a.createGain();o.frequency.setValueAtTime(440,a.currentTime);o.frequency.exponentialRampToValueAtTime(880,a.currentTime+.16);v.gain.setValueAtTime(.12,a.currentTime);v.gain.exponentialRampToValueAtTime(.001,a.currentTime+.4);o.connect(v);v.connect(audio.gain);o.start();o.stop(a.currentTime+.4);o.onended=()=>{o.disconnect();v.disconnect();};}
 function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='cinematic'?1.5:quality==='balanced'?1: .65));renderer.setSize(innerWidth,innerHeight,false);art.camera.aspect=innerWidth/innerHeight;art.camera.updateProjectionMatrix();}
 function focus(el){if(!el)return;document.querySelectorAll('.pad-focus').forEach(e=>e.classList.remove('pad-focus'));el.classList.add('pad-focus');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'});}
 function items(){return [...$('panel').querySelectorAll('button,a,select,input,summary')].filter(el=>!el.disabled&&el.getClientRects().length&&(!el.closest('details')||el.closest('details').open||el.tagName==='SUMMARY'));}
 function panel(mode){state.mode=mode;keys.clear();drag=null;touch.forward=touch.side=touch.up=touch.down=0;document.body.dataset.mode=mode;$('panel').hidden=mode==='playing';$('interaction').hidden=true;
  if(mode!=='playing'){if(document.pointerLockElement)document.exitPointerLock();$('checkpoint').hidden=mode==='complete'||mode==='briefing';$('start').hidden=false;
   $('start').textContent=mode==='complete'?'Explore again':started?'Resume mission':state.stage>0&&state.stage<4?'Continue from checkpoint':'Enter the facility';
   $('panel-title').textContent=mode==='complete'?'The current is restored.':mode==='paused'?'Take a breath.':'The water is the way in.';
   $('panel-copy').textContent=mode==='complete'?'Prism recovered and installed. Auxiliary power and the intake floodgate are restored. Your completed mission is saved separately from rhythm scores.':state.stage<4?C.objectives[state.stage].hint:'Mission complete. Explore again or return to the rhythm game.';
   focus($('start'));
  }else{$('world').focus();}
 }
 function begin(){if(state.stage===4){state.stage=0;state.player=C.checkpoint(0);state.water=state.targetWater=-.1;state.elapsed=0;state.oxygen=32;state.diving=false;}started=true;panel('playing');soundStart();}
 function interact(){if(C.interact(state)){cue();persist();const id=state.events.at(-1);message({power:'Auxiliary power restored. Find the red pump valve.',drain:'Pump online. The basin is draining and the floodgate is open.',core:'Prism secured. Return to the arrival deck.',extract:'Mission complete. The current is restored.',ladder:'Back on the arrival deck.'}[id]||'Checkpoint reached.');if(state.stage===4)panel('complete');}}
 function menuMove(dir){const list=items(),n=list.indexOf(document.activeElement);focus(list[(n+dir+list.length)%list.length]);}
 function adjust(dir){const el=document.activeElement;if(el?.tagName==='SELECT'){el.selectedIndex=Math.max(0,Math.min(el.options.length-1,el.selectedIndex+dir));el.dispatchEvent(new Event('change'));}else if(el?.type==='range'){el.value=Math.max(0,Math.min(100,+el.value+dir*5));el.dispatchEvent(new Event('input'));}else menuMove(dir);}
 function back(){if(state.mode==='playing')panel('paused');else if(started&&state.mode!=='complete')begin();else focus($('return'));}
 function poll(dt){let pad;try{const pads=Array.from(navigator.getGamepads?.()||[]);pad=pads.find(p=>p?.connected&&p.mapping==='standard'&&(padId===null||p.index===padId));}catch{}
  if(!pad){if(padId!==null){padId=null;padOld=[];if(state.mode==='playing'){panel('paused');message('Controller disconnected. Reconnect, then press Menu to resume.');}}return {};}
  const down=Array.from({length:17},(_,i)=>!!pad.buttons[i]?.pressed||pad.buttons[i]?.value>.55);
  if(padId===null){padId=pad.index;padOld=down;return {};}
  const edge=down.map((v,i)=>v&&!padOld[i]);padOld=down;
  if(edge[9]||edge[8]){if(state.mode==='playing')panel('paused');else begin();return {};}
  const axis=i=>{const a=pad.axes[i]||0;return Math.abs(a)<.16?0:Math.sign(a)*(Math.abs(a)-.16)/.84;};
  if(state.mode!=='playing'){
   const dir=down[12]?-1:down[13]?1:down[14]?-2:down[15]?2:Math.abs(axis(1))>.6?(axis(1)>0?1:-1):0;
   if(dir&&(dir!==padDirection||clock>nextRepeat)){Math.abs(dir)===1?menuMove(dir):adjust(dir/2);nextRepeat=clock+(dir!==padDirection?.38:.17);}padDirection=dir;
   if(edge[0]){const el=document.activeElement;if(el?.tagName==='SELECT')adjust(1);else if(items().includes(el))el.click();else focus($('start'));}if(edge[1])back();return {};
  }
  C.look(state,-axis(2)*1.9*dt,-axis(3)*1.6*dt);if(edge[2])interact();if(edge[3])state.torch=!state.torch;
  return {forward:-axis(1),side:axis(0),up:down[7]||down[0]?1:0,down:down[6]||down[1]?1:0,sprint:down[5]};
 }
 function inputs(p){return {forward:(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)+(p.forward||0)+touch.forward,side:(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+(p.side||0)+touch.side,up:keys.has('Space')||p.up||touch.up?1:0,down:keys.has('KeyC')||p.down||touch.down?1:0,sprint:keys.has('ShiftLeft')||p.sprint};}
 function tick(now){if(stopped)return;requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000||0);last=now;clock+=dt;const p=poll(dt);if(state.mode==='playing'){
   C.look(state,((keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0))*dt*1.5,((keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0))*dt*1.2);
   const rescued=state.rescues;C.move(state,inputs(p),dt);if(state.rescues!==rescued)message('Air depleted. Returned to a safe checkpoint; mission objectives kept.');
  }
  const underwater=state.player.y<state.water-.08;$('submerged').style.opacity=underwater?'1':'0';$('oxygen').value=state.oxygen;$('air').textContent='AIR / '+Math.ceil(state.oxygen)+'s';$('depth').textContent=underwater?'DEPTH / '+(state.water-state.player.y).toFixed(1)+'m':'SURFACE / AIR REFILLS';$('zone').textContent=state.player.z< -31?'SUBMERGED MAINTENANCE':state.player.z< -19?'DEEP RESERVOIR':'NEXUS INTAKE';
  $('objective').textContent=state.stage<4?(state.stage+1)+'/4 / '+C.objectives[state.stage].name:'4/4 / Mission complete';const target=C.near(state);$('interaction').hidden=state.mode!=='playing'||!target;if(target)$('interact').textContent='E / X: '+target.label;
  if(clock>toastUntil)$('toast').textContent='';
  if(audio){audio.gain.gain.setTargetAtTime(state.mode==='playing'?+$('volume').value/100:0,audio.a.currentTime,.1);audio.filter.frequency.setTargetAtTime(underwater?240:650,audio.a.currentTime,.15);}
  art.update(state,state.mode==='playing'?state.elapsed:state.elapsed,quality,quiet);
 }
 $('start').onclick=begin;$('pause').onclick=()=>panel('paused');$('interact').onclick=interact;$('touch-action').onclick=interact;$('touch-torch').onclick=()=>state.torch=!state.torch;
 $('checkpoint').onclick=()=>{C.rescue(state);begin();message('Returned to a safe checkpoint. Recovered objectives kept.');};
 $('restart').onclick=()=>{if($('restart').dataset.confirm!=='yes'){$('restart').dataset.confirm='yes';$('restart').textContent='Confirm restart from the arrival deck';return;}state.stage=0;state.player=C.checkpoint(0);state.water=state.targetWater=-.1;state.oxygen=32;state.elapsed=0;state.diving=false;persist();$('restart').dataset.confirm='';$('restart').textContent='Restart mission';begin();};
 function savePrefs(){quality=$('quality').value;quiet=$('quiet').checked;try{localStorage.setItem(PREF,JSON.stringify({quality,quiet,volume:+$('volume').value}));}catch{}resize();}
 $('quality').onchange=savePrefs;$('quiet').onchange=savePrefs;$('volume').oninput=savePrefs;
 $('capture').onclick=()=>{begin();try{const p=$('world').requestPointerLock?.();p?.catch?.(()=>message('Mouse capture unavailable. Hold and drag to look instead.'));}catch{message('Hold and drag to look instead.');}};
 document.addEventListener('keydown',e=>{soundStart();if(e.code==='Tab'&&state.mode!=='playing'){e.preventDefault();menuMove(e.shiftKey?-1:1);return;}if(['Escape','KeyP'].includes(e.code)){e.preventDefault();if(!e.repeat)back();return;}if(state.mode!=='playing')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyE')interact();if(e.code==='KeyF')state.torch=!state.torch;});
 document.addEventListener('keyup',e=>keys.delete(e.code));
 $('world').addEventListener('pointerdown',e=>{if(state.mode!=='playing')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('world').setPointerCapture(e.pointerId);});
 $('world').addEventListener('pointermove',e=>{if(state.mode!=='playing')return;if(document.pointerLockElement){C.look(state,-e.movementX*.0026,-e.movementY*.0026);}else if(drag?.id===e.pointerId){C.look(state,-(e.clientX-drag.x)*.004,-(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(type,()=>drag=null);
 document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state.mode==='playing')panel('paused');});
 for(const [id,field]of [['touch-up','up'],['touch-down','down']]){const el=$(id);el.onpointerdown=e=>{e.preventDefault();touch[field]=1;el.setPointerCapture(e.pointerId);};el.onpointerup=el.onpointercancel=()=>touch[field]=0;}
 const stick=$('stick');stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);};stick.onpointermove=e=>{if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/45)),y=Math.max(-1,Math.min(1,(e.clientY-r.y-r.height/2)/45));touch.side=x;touch.forward=-y;stick.firstElementChild.style.transform=`translate(${x*30}px,${y*30}px)`;};stick.onpointerup=stick.onpointercancel=()=>{stickId=null;touch.side=touch.forward=0;stick.firstElementChild.style.transform='';};
 window.addEventListener('blur',()=>{if(state.mode==='playing')panel('paused');keys.clear();padOld=[];});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')panel('paused');});window.addEventListener('resize',resize);
 try{renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;art=PrismWaterScene.build(T,renderer);resize();panel('briefing');$('save-status').textContent=state.stage>0?'Saved checkpoint found. Rhythm progress is untouched.':'Mission progress saves locally after each objective.';requestAnimationFrame(tick);
  $('world').addEventListener('webglcontextlost',e=>{e.preventDefault();panel('paused');message('Graphics interrupted. Reload to resume your saved checkpoint.');});
  window.PrismWater={snapshot:()=>({version:'0.8.0',mode:state.mode,stage:state.stage,player:{...state.player},water:state.water,oxygen:state.oxygen,elapsed:state.elapsed,rescues:state.rescues,torch:state.torch,near:C.near(state)?.id||null,quality,quiet,graphics:art.stats}),renderer};
 }catch(e){$('panel-title').textContent='This browser could not start WebGL.';$('panel-copy').textContent=e.message+' Your rhythm scores are unchanged. Try another browser or return to the rhythm game.';$('start').disabled=true;}
 window.addEventListener('pagehide',()=>{stopped=true;audio?.a.close().catch(()=>{});art?.dispose();renderer?.dispose();});
})();
