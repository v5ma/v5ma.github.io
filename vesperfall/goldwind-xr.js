/* Goldwind is an explicit bow preset. Classic, Xbox and crossbow paths remain.
 * This owner runs only during tracked-controller bow play, never hand menus. */
(function(root){'use strict';
 function install(g){
  const T=g.T,C=VesperCore,M=GoldwindModel,$=id=>document.getElementById(id);
  const state={frames:0,selectReady:false,ready:false,owner:false,sources:null,quiver:false,hover:-1,flight:null,clock:0,lastDamage:'plain',drawType:null,prev:{},game:null};
  const draw=new M.Draw(g.latch),gesture=new M.Throw();
  const controls=document.createElement('fieldset');controls.className='resonance-settings';controls.id='goldwind-settings';
  controls.innerHTML='<legend>Goldwind / physical bow</legend><button id="goldwind-enable">Use Goldwind physical bow controls</button><label>Quest bow controls <select id="xr-bow-controls"><option value="classic">Classic / preserve existing bindings</option><option value="goldwind">Goldwind / golden arrow, thrown disk, reach quiver</option></select></label><label>Goldwind shield <select id="goldwind-shield"><option value="trigger">Bow-hand trigger / grip interacts</option><option value="grip">Bow-hand grip / trigger interacts</option></select></label><label>Goldwind teleport aiming aid <select id="goldwind-assist"><option value="off">Off / golden arrow only</option><option value="draw">Optional gold path while drawing</option></select></label><p>Goldwind bow: draw trigger shoots the selected combat arrow. Hold either draw-hand face button near the string, pull and release for a golden teleport arrow. Draw-hand grip holds a disk; throw and release for a short supported-ground relocation. Hold either bow-hand face button to reveal arrows, then reach with the other controller and squeeze its trigger to select. Click the draw stick to pause; click the bow stick to switch weapon. Crossbow uses its preserved Classic controls. Xbox is unchanged.</p>';
  document.querySelector('.settings').append(controls);
  const keys=['xr-bow-controls','goldwind-shield','goldwind-assist'];let prefs={};try{prefs=JSON.parse(localStorage.getItem('vesperfall-goldwind-v1')||'{}');}catch{}
  for(const id of keys){const el=$(id);if([...el.options].some(o=>o.value===prefs[id]))el.value=prefs[id];el.addEventListener('change',()=>{g.cancel();for(const key of keys)prefs[key]=$(key).value;try{localStorage.setItem('vesperfall-goldwind-v1',JSON.stringify(prefs));}catch{g.toast('Controls changed for this session; storage is unavailable.');}if(g.xr)g.drawMenu();});}
  $('goldwind-enable').onclick=()=>{$('xr-bow-controls').value='goldwind';$('xr-bow-controls').dispatchEvent(new Event('change',{bubbles:true}));g.toast('Goldwind bow enabled. Draw-stick click pauses. Classic crossbow and Xbox controls are unchanged.');};
  const enabled=()=> $('xr-bow-controls').value==='goldwind';
  const active=()=>g.xr&&enabled()&&g.game.weapon==='bow'&&g.running&&!g.paused&&g.game.phase==='playing';
  const quiver=new T.Group();quiver.name='Goldwind / bow-mounted physical quiver';g.scene.object3D.add(quiver);quiver.visible=false;
  const slots=M.DAMAGE.map((type,i)=>{
   const angle=(i-2)*.48,p=new T.Vector3(Math.sin(angle)*.31,.14+Math.cos(angle)*.22,.08),arrow=g.art.arrow(type);arrow.position.copy(p);arrow.scale.setScalar(.3);quiver.add(arrow);
   const ring=new T.Mesh(new T.TorusGeometry(.043,.005,4,16),new T.MeshBasicMaterial({color:'#e8c06d'}));ring.position.copy(p);quiver.add(ring);
   const label=g.art.label(quiver,type.toUpperCase(),p.x,p.y+.055,p.z,.14,.035,'#182d35','#efd69c');
   return {type,p,arrow,ring,label};
  });
  const disk=new T.Group();disk.name='Goldwind / physically thrown short-range disk';
  const rim=new T.Mesh(new T.TorusGeometry(.075,.01,6,24),new T.MeshStandardMaterial({color:'#ffd166',emissive:'#a87719',emissiveIntensity:.35,metalness:.5,roughness:.32}));
  const face=new T.Mesh(new T.CircleGeometry(.069,24),new T.MeshStandardMaterial({color:'#bde1d6',metalness:.3,roughness:.4,side:T.DoubleSide}));disk.add(rim,face);disk.visible=false;g.scene.object3D.add(disk);
  const gold=g.art.mat('#ffd166',.18,true),palette={plain:'#edd6ab',cinder:'#ffb573',frost:'#96e7ff',volley:'#de9fe0',ricochet:'#d2e0fa'};
  function reset(){draw.reset();gesture.reset();state.ready=false;state.quiver=false;state.hover=-1;state.drawType=null;state.flight=null;state.sources=null;state.prev={};quiver.visible=disk.visible=false;}
  const cancel=g.cancel.bind(g);g.cancel=function(){reset();cancel();};
  const setType=g.setType.bind(g);g.setType=function(type){setType(type);if(M.available(g.game,g.game.type))state.lastDamage=g.game.type;};
  const pause=g.setPaused.bind(g);g.setPaused=function(value){reset();pause(value);};
  function syncRig(){const offset=g.head.object3D.position.clone().applyQuaternion(g.rig.quaternion);g.rig.position.set(g.game.p[0]-offset.x,g.game.p[1],g.game.p[2]-offset.z);g.rig.updateMatrixWorld(true);}
  function placeQuiver(bow){quiver.position.set(...bow.p);quiver.quaternion.copy(bow.q);quiver.updateMatrixWorld(true);}
  function emitShot(shot){if(!shot)return;g.game.head=g.head.object3D.getWorldPosition(new T.Vector3()).toArray();if(C.fire(g.game,shot.origin,shot.direction,shot.charge,shot.type))g.sound(shot.type==='blink'?470:260,.12,.03);else g.toast('No shot: check ammunition, cover or cooldown.');}
  const oldXR=g.processXR.bind(g);
  g.processXR=function(dt,head){
   state.frames++;
   const session=g.scene.renderer.xr.getSession(),bare=[...(session?.inputSources||[])].some(s=>s.hand);
   if(!active()||bare){if(state.owner){reset();state.owner=false;}oldXR(dt,head);return;}
   for(const ray of Object.values(g.dominionControls.rays))ray.visible=false;
   g.tracked(g.scene.frame);g.xrPanel.mesh.visible=false;
   const bowName=$('handedness').value,drawName=bowName==='left'?'right':'left',bow=g.hands[bowName],hand=g.hands[drawName];
   if(!bow||!hand||session?.visibilityState!=='visible'||g.headBlocked){reset();state.owner=true;g.arsenal.loseTracking();C.shield(g.game,null);g.charge=0;g.drawHeld=false;g.xrNotice='Both controllers need clear tracking. Release controls before drawing.';return;}
   if(!state.owner||state.game!==g.game||state.sources?.[0]!==bow.source||state.sources?.[1]!==hand.source){reset();state.owner=true;state.sources=[bow.source,hand.source];state.game=g.game;}
   if(![...bow.p,...hand.p].every(Number.isFinite)||C.len(C.sub(bow.p,head.toArray()))>1.6||C.len(C.sub(hand.p,head.toArray()))>1.6){reset();return;}
   state.clock=performance.now()/1000;
   const buttons={bow:[...bow.buttons],draw:[...hand.buttons]},edge=(name,i)=>!!buttons[name][i]&&!state.prev[name]?.[i],neutral=!bow.buttons.some(Boolean)&&!hand.buttons.some(Boolean);
   if(!state.ready){state.prev=buttons;g.charge=0;g.drawHeld=false;C.shield(g.game,null);if(neutral){state.ready=true;draw.update([0,0,0],[0,0,0],false,false,true,'plain');gesture.update(hand.object.position.toArray(),false,state.clock);}return;}
   if(edge('draw',3)){g.setPaused(true);return;}
   if(edge('bow',3)){g.arsenal.equip();return;}
   const shieldIndex=$('goldwind-shield').value==='grip'?1:0,interactIndex=1-shieldIndex,shield=!!bow.buttons[shieldIndex];
   const was=!!g.game.shield;g.arsenal.ward(shield,bow);if(!was&&g.game.shield)C.emit(g.game,'ward');
   const focus=!!(bow.buttons[4]||bow.buttons[5]);
   if(!state.quiver&&(edge('bow',4)||edge('bow',5))){g.ritual.begin('goldwind');state.quiver=true;state.selectReady=!hand.buttons[0];state.ready=true;state.sources=[bow.source,hand.source];state.owner=true;state.game=g.game;}
   if(state.quiver){
    g.latch.reset();g.drawHeld=false;g.charge=0;C.shield(g.game,null);placeQuiver(bow);state.hover=-1;
    if(!focus){g.cancel();return;}
    let best=.10;
    for(let i=0;i<slots.length;i++){const p=quiver.localToWorld(slots[i].p.clone()),d=p.distanceTo(new T.Vector3(...hand.p));if(d<best&&!C.segmentBlocked(g.game.world,hand.p,p.toArray(),.01)){best=d;state.hover=i;}}
    if(!hand.buttons[0])state.selectReady=true;
    if(state.selectReady&&edge('draw',0)&&state.hover>=0){const type=slots[state.hover].type;if(M.available(g.game,type)){g.setType(type);C.emit(g.game,'focus-select',{arrow:type,physical:true});}else{g.toast('That arrow is empty or locked. Release and try another.');}state.prev=buttons;return;}
    state.prev=buttons;return;
   }
   if(edge('bow',interactIndex)&&!g.latch.drawing){g.interact();if(g.paused){state.prev=buttons;return;}}
   const ax=hand.axes.length>=4?hand.axes[2]:hand.axes[0]||0;
   if(Math.abs(ax)<.25)g.snapArmed=true;else if(Math.abs(ax)>.7&&g.snapArmed){g.turn(ax>0?-Math.PI/6:Math.PI/6);g.snapArmed=false;g.cancel();return;}
   if($('locomotion').value==='smooth'&&!g.latch.drawing&&!gesture.held&&!state.flight){const x=VesperInput.deadzone(bow.axes.length>=4?bow.axes[2]:bow.axes[0]),z=VesperInput.deadzone(bow.axes.at(-1));g.walkInput(x,z,dt,head,1.7);}
   const travel=!!(hand.buttons[4]||hand.buttons[5]),grip=!!hand.buttons[1];
   const thrown=gesture.update(hand.object.position.toArray(),grip,state.clock,!g.arMode&&!state.flight&&!travel&&!hand.buttons[0]);
   if(thrown){const velocity=new T.Vector3(...thrown.velocity).applyQuaternion(g.rig.quaternion).toArray();g.game.head=head.toArray();state.flight=M.launchDisc(g.game,hand.p,velocity);if(state.flight){C.emit(g.game,'shard-throw',{p:[...hand.p],speed:thrown.speed});}else g.toast('Disk needs a ready charge and clear space.');}
   if(state.flight){M.stepDisc(g.game,state.flight,dt*g.ritual.timeScale());if(state.flight.done){if(state.flight.ok)syncRig();else{C.emit(g.game,'shard-denied');g.toast('Disk: '+state.flight.reason+'. No charge spent.');}state.flight=null;}}
   const nock=new T.Vector3(0,0,.09).applyQuaternion(bow.q).add(new T.Vector3(...bow.p)).toArray();
   if(M.available(g.game,g.game.type))state.lastDamage=g.game.type;
   const type=M.available(g.game,state.lastDamage)?state.lastDamage:'plain';
   // Pickup pulls keep their original trigger and never steal a near-nock draw.
   const busy=!travel&&!grip&&!g.game.shield&&g.ritual.interactXR(dt,bow,hand,(name,i)=>edge(name===bowName?'bow':'draw',i),bowName,drawName);
   const r=draw.update(nock,hand.p,!!hand.buttons[0],travel,!g.game.shield&&!grip&&!busy&&!(g.arMode&&travel),type,Number($('draw-length').value));
   g.charge=r.charge||0;g.drawHeld=!!r.drawing;state.drawType=r.type;emitShot(r.shot);
   g.xrNotice=gesture.held?'Throw the disk and release grip.':r.drawing?(r.type==='blink'?'Release face button: golden teleport arrow.':'Release trigger: combat arrow.'):'Trigger: combat draw. A/B: golden draw. X/Y: reach quiver. Draw-stick click: pause.';
   state.prev=buttons;g.prevButtons=Object.fromEntries(Object.entries(g.hands).map(([k,v])=>[k,[...v.buttons]]));
  };
  const preview=g.teleportPreview.bind(g);g.teleportPreview=function(){
   if(!active()){preview();return;}
   g.teleLine.visible=g.teleRing.visible=false;$('blink-status').hidden=true;
   if(state.drawType!=='blink'||!g.latch.sample||g.charge<.08||g.arMode)return;
   const a=g.latch.sample,trace=C.predictBlink(g.game,a.origin,a.direction,g.charge);g.blinkTrace=trace;
   if($('goldwind-assist').value!=='draw')return;
   const b=g.teleLine.geometry.attributes.position;let count=0;for(let i=0;i<trace.points.length;i+=Math.max(1,Math.ceil(trace.points.length/47)))b.setXYZ(count++,...trace.points[i]);b.needsUpdate=true;g.teleLine.geometry.setDrawRange(0,count);g.teleLine.material.color.set(trace.ok?'#ffd166':'#ef9071');g.teleLine.visible=count>1;
  };
  const visuals=g.visuals.bind(g);g.visuals=function(){
   visuals();quiver.visible=active()&&state.quiver;
   if(quiver.visible){g.ritual.quiver.mesh.visible=false;const bow=g.hands[$('handedness').value];if(bow)placeQuiver(bow);for(let i=0;i<slots.length;i++){const slot=slots[i],ok=M.available(g.game,slot.type);slot.ring.material.color.set(i===state.hover?(ok?'#fff4cd':'#ed8b71'):ok?'#c6a564':'#4e555b');slot.arrow.scale.setScalar(i===state.hover?.38:.3);}}
   disk.visible=active()&&(gesture.held||!!state.flight);
   if(disk.visible){if(state.flight){disk.position.set(...state.flight.p);disk.rotation.set(Math.PI/2,0,g.game.time*16);}else{const hand=g.hands[$('handedness').value==='left'?'right':'left'];if(hand){disk.position.set(...hand.p);disk.quaternion.copy(hand.q);}}}
   if(enabled()){
    for(let i=0;i<g.arrowPool.length;i++)if(g.game.arrows[i]?.type==='blink')for(const mesh of g.arrowPool[i].children.slice(1))mesh.material=gold;
    if(g.xr&&g.game.weapon==='bow')for(const mesh of g.visualArrow.children.slice(1))mesh.material=state.drawType==='blink'?gold:g.art.mat(palette[state.drawType]||palette[state.lastDamage],0,true);
   }
  };
  const remove=g.remove.bind(g);g.remove=function(){controls.remove();for(const object of[quiver,disk]){object.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});object.removeFromParent();}remove();};
  function hint(i){return ['Draw-stick click pauses. Either ray + trigger selects.','Draw trigger near the nock, pull, release to shoot.','Bow-hand shield control cancels a drawn arrow into guard.','Bow-stick click switches to Classic crossbow controls; its manual remains available.','Hold the chosen bow-hand shield control facing the incoming bolt.','Hold either draw-hand face button at the nock, pull, release toward clear floor.','Hold draw-hand grip, move that hand deliberately, then release the disk.','Point the free controller at a crystal and hold its trigger.','Hold either bow-hand face button, reach to an arrow with the draw controller, then trigger.','Turn the free palm upward.','Draw-stick click, Expedition, First Bell, Take the Oath.'][i];}
  return {state,draw,gesture,slots,quiver,disk,enabled,reset,hint};
 }
 root.GoldwindXR=Object.freeze({install});
})(globalThis);
