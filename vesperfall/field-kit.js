/* Scene-owned satchel, controller throws and ordinary Xbox/keyboard alternatives.
 * Grips acquire only a nearby vial/cache, otherwise existing pickup/bow/disk
 * owners receive the input unchanged. Simulation and saves own all supplies. */
(function(root){'use strict';
 function install(g){
  const T=g.T,C=VesperCore,M=PilgrimKitModel,$=id=>document.getElementById(id);
  const state={held:null,used:false,source:null,previous:{},sources:null,armed:false,game:null,event:0,frames:0,kind:'mend'};
  const motion=new M.Motion(),scene=new T.Group(),belt=new T.Group();scene.name='Pilgrim field supplies';belt.name='Physical waist satchel';g.scene.object3D.add(scene,belt);
  const resources=[],cached=[],pool=[],effects=[];
  function mesh(geo,color,parent,glow=false){const mat=new T.MeshStandardMaterial({color,roughness:.45,metalness:.12,emissive:glow?color:'#000000',emissiveIntensity:glow?.3:0});const m=new T.Mesh(geo,mat);parent.add(m);resources.push(geo,mat);return m;}
  function bottle(kind,parent){const group=new T.Group();parent.add(group);const color=kind==='mend'?'#70d7b1':'#88c9ef';
   mesh(new T.SphereGeometry(.062,10,8),color,group,true).scale.set(1,1.28,1);
   const neck=mesh(new T.CylinderGeometry(.025,.035,.07,8),color,group);neck.position.y=.09;
   const cork=mesh(new T.CylinderGeometry(.028,.028,.025,8),'#c6a271',group);cork.position.y=.134;
   const band=mesh(new T.TorusGeometry(.059,.007,4,12),'#d9b477',group);band.rotation.x=Math.PI/2;
   return group;
  }
  const slots=M.TYPES.map(kind=>{const object=bottle(kind,belt),label=g.makePanel(384,96,.27,.0675);label.mesh.material.depthTest=true;label.mesh.material.depthWrite=false;belt.add(label.mesh);return {kind,object,label,point:new T.Vector3(),text:''};});
  const held=bottle('mend',scene),frostHeld=bottle('frost',scene);held.visible=frostHeld.visible=false;
  for(let i=0;i<4;i++){pool.push({mend:bottle('mend',scene),frost:bottle('frost',scene)});}
  for(let i=0;i<4;i++){const geo=new T.RingGeometry(.08,1,28),mat=new T.MeshBasicMaterial({color:'#88d5c5',side:T.DoubleSide,transparent:true,opacity:0,depthWrite:false}),o=new T.Mesh(geo,mat);o.rotation.x=-Math.PI/2;o.visible=false;scene.add(o);effects.push({o,until:0});resources.push(geo,mat);}
  const prompt=g.makePanel(768,192,1.15,.2875);prompt.mesh.material.depthTest=true;prompt.mesh.material.depthWrite=false;prompt.mesh.visible=false;scene.add(prompt.mesh);let promptText='';
  function live(){return g.running&&!g.paused&&!g.ritual?.focus.open&&M.eligible(g.game)&&!g.practice&&!g.firstBell?.state.coach&&!g.returningBell?.state.table&&g.threshold?.state.phase==='game';}
  function clear(){state.held=state.source=null;state.used=false;state.armed=false;state.previous={};state.sources=null;motion.reset();held.visible=frostHeld.visible=false;}
  const cancel=g.cancel.bind(g);g.cancel=function(){clear();return cancel();};
  const pause=g.setPaused.bind(g);g.setPaused=function(...args){clear();return pause(...args);};
  function paint(p,text){const ctx=p.ctx;ctx.clearRect(0,0,p.canvas.width,p.canvas.height);ctx.fillStyle='rgba(18,38,47,.9)';ctx.fillRect(0,0,p.canvas.width,p.canvas.height);ctx.fillStyle='#f0e5c7';ctx.textAlign='center';ctx.font=(p.canvas.width===384?'24':'29')+'px Arial';const lines=text.split('\n');lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,p.canvas.width/2,p.canvas.height*(lines.length>1?.38+i*.36:.61),p.canvas.width-24));p.texture.needsUpdate=true;}
  function positionBelt(){const head=g.head.object3D.getWorldPosition(new T.Vector3()),forward=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion()));forward.y=0;if(forward.lengthSq()<.08)forward.set(0,0,-1).applyQuaternion(g.rig.quaternion);forward.normalize();
   const right=new T.Vector3(-forward.z,0,forward.x),sign=$('handedness').value==='left'?1:-1;const height=Math.max(g.game.p[1]+.38,head.y-.64);
   for(let i=0;i<slots.length;i++){const slot=slots[i];slot.point.copy(head).addScaledVector(right,sign*(.24+i*.25)).addScaledVector(forward,.12);slot.point.y=height;slot.object.position.copy(slot.point);slot.label.mesh.position.copy(slot.point).add(new T.Vector3(0,-.12,0));slot.label.mesh.quaternion.copy(g.head.object3D.getWorldQuaternion(new T.Quaternion()));}
  }
  function targetCache(origin,direction){if(!live())return null;const k=g.game.fieldkit;
   return M.anchors(g.game).filter(c=>k?.caches[c.id]!==2).filter(c=>{const p=M.center(c),d=C.sub(p,origin);return C.len(d)<1.8&&(C.len(d)<.5||C.dot(C.unit(d),direction)>.91)&&M.visible(g.game,origin,p,C);}).sort((a,b)=>C.len(C.sub(M.center(a),origin))-C.len(C.sub(M.center(b),origin)))[0]||null;
  }
  function viewTarget(){const p=g.head.object3D.getWorldPosition(new T.Vector3()).toArray(),d=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion())).toArray();return targetCache(p,d);}
  function say(text){g.toast(text);}
  function flatThrow(type){if(!live())return false;g.cancel();const head=g.head.object3D.getWorldPosition(new T.Vector3()),direction=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion())),p=head.clone().addScaledVector(direction,.18);
   if(!M.aimedLaunch(g.game,type,p.toArray(),direction.toArray(),C)){say('No '+(type==='mend'?'healing':'frost')+' vial, or the throw is blocked.');return false;}return true;
  }
  function drink(){if(!live())return false;g.cancel();if(!M.drink(g.game,C)){say(g.game.health>=g.game.maxHealth?'Vitality is full. Healing vial retained.':'No healing vials. Look for a sealed field cache.');return false;}return true;}
  function padInput(b,edge){if(!live()||!b[4])return false;if(edge(2)){drink();return true;}if(edge(5)){flatThrow('frost');return true;}return false;}
  function key(e){if(e.repeat||g.xr||!live()||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.code==='KeyF'){e.preventDefault();drink();}if(e.code==='KeyG'){e.preventDefault();flatThrow('frost');}if(e.code==='KeyT'){e.preventDefault();flatThrow('mend');}}
  window.addEventListener('keydown',key);
  const interact=g.interact.bind(g);g.interact=function(){const c=!g.wayfinder?.current()&&viewTarget();if(c){M.collect(g.game,c.id,g.head.object3D.getWorldPosition(new T.Vector3()).toArray(),C);return;}return interact();};
  const oldXR=g.processXR.bind(g);g.processXR=function(dt,head){state.frames++;
   const session=g.scene.renderer.xr.getSession();if(!g.xr||!live()||session?.visibilityState!=='visible'||g.headBlocked||[...(session?.inputSources||[])].some(s=>s.hand)){clear();return oldXR(dt,head);}
   g.tracked(g.scene.frame);const bowName=$('handedness').value,free=bowName==='left'?'right':'left',bow=g.hands[bowName],hand=g.hands[free];
   if(!bow||!hand){clear();g.goldwind.reset();return oldXR(dt,head);}
   const buttons={bow:[...bow.buttons],draw:[...hand.buttons]},edge=(n,i)=>buttons[n][i]&&!state.previous[n]?.[i];
   if(state.game!==g.game||state.sources?.[0]!==bow.source||state.sources?.[1]!==hand.source){clear();state.game=g.game;state.sources=[bow.source,hand.source];state.previous=buttons;}
   if(!state.armed){state.previous=buttons;if(!bow.buttons.some(Boolean)&&!hand.buttons.some(Boolean))state.armed=true;return oldXR(dt,head);}
   if(!state.held&&!g.latch.drawing&&!g.fieldwork.state.held&&!g.goldwind.state.quiver&&!g.goldwind.state.flight&&!g.goldwind.gesture.held&&!g.ritual.state.pull&&edge('draw',1)){
    const dir=new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray(),pickup=FieldworkModel.target(g.game,hand.p,dir,true);positionBelt();
    const slot=slots.map(s=>({slot:s,d:s.point.distanceTo(new T.Vector3(...hand.p))})).sort((a,b)=>a.d-b.d)[0];
    const cache=!g.wayfinder.current()&&targetCache(hand.p,dir);
    if(!pickup&&(slot.d<.19||cache)){
     g.cancel();state.game=g.game;state.sources=[bow.source,hand.source];state.source=hand.source;state.armed=true;state.previous=buttons;state.held=slot.d<.19?slot.slot.kind:'cache';g.goldwind.reset();
     if(state.held==='cache'){M.collect(g.game,cache.id,hand.p,C);state.used=true;}
     else if(!M.ensure(g.game).stock[state.held]){say('That vial slot is empty. Find a field cache.');state.used=true;}
     else{say(state.held==='mend'?'Healing vial: throw near your feet, or bring to mouth and press trigger.':'Frost flask: release a physical throw, or aim and press trigger.');}
    }
   }
   if(!state.held){state.previous=buttons;return oldXR(dt,head);}
   if(edge('draw',3)||(!g.goldwind.enabled()&&edge('bow',5))){g.setPaused(true);return;}
   if(hand.source!==state.source||C.len(C.sub(hand.p,head.toArray()))>1.7){g.cancel();return;}
   if(!hand.buttons[1]){
    if(!state.used&&state.held!=='cache'){const v=motion.release(hand.object.position.toArray(),performance.now()/1000);if(v){const worldV=new T.Vector3(...v).applyQuaternion(g.rig.getWorldQuaternion(new T.Quaternion()));if(!M.launch(g.game,state.held,hand.p,worldV.toArray(),C))say('Throw blocked. Vial returned to the satchel.');}else say('Vial stowed. No supply spent.');}
    g.cancel();return;
   }
   if(!state.used&&state.held!=='cache'){
    motion.sample(hand.object.position.toArray(),performance.now()/1000);
    if(edge('draw',0)&&state.held==='frost'){const d=new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray();if(M.aimedLaunch(g.game,'frost',hand.p,d,C))state.used=true;else say('Throw blocked. Frost flask retained.');}
    if(edge('draw',0)&&state.held==='mend'){if(C.len(C.sub(hand.p,head.toArray()))<.38&&!C.segmentBlocked(g.game.world,head.toArray(),hand.p,.01)){if(M.drink(g.game,C))state.used=true;else say('Vitality is full. Vial retained.');}else say('Bring the healing vial to your mouth, then press trigger.');}
   }
   const guard=g.goldwind.enabled()?($('goldwind-shield').value==='grip'?1:0):null;if(guard!==null)g.arsenal.ward(!!bow.buttons[guard],bow);
   if($('locomotion').value==='smooth')g.walkInput(VesperInput.deadzone(bow.axes.length>=4?bow.axes[2]:bow.axes[0]),VesperInput.deadzone(bow.axes.at(-1)),dt,head,1.7);
   const x=hand.axes.length>=4?hand.axes[2]:hand.axes[0]||0;if(Math.abs(x)<.25)g.snapArmed=true;else if(Math.abs(x)>.7&&g.snapArmed){g.turn(x>0?-Math.PI/6:Math.PI/6);g.snapArmed=false;g.cancel();return;}
   g.charge=0;g.drawHeld=false;g.latch.reset();state.previous=buttons;g.prevButtons=Object.fromEntries(Object.entries(g.hands).map(([n,h])=>[n,[...h.buttons]]));
  };
  function build(){for(const x of cached){x.group.removeFromParent();for(const r of x.resources)r.dispose();}cached.length=0;
   for(const c of M.anchors(g.game)){const group=new T.Group();group.name=c.label;group.position.set(...c.p);scene.add(group);const start=resources.length;
    const foot=mesh(new T.BoxGeometry(.36,.24,.27),'#4a413b',group);foot.position.y=.12;
    const base=mesh(new T.BoxGeometry(.52,.42,.38),'#574a40',group);base.position.y=.45;
    const lid=mesh(new T.BoxGeometry(.55,.075,.42),'#94764d',group);lid.position.y=.69;
    const seal=mesh(new T.OctahedronGeometry(.075),'#8fdef0',group,true);seal.position.set(0,.63,.23);
    const a=bottle('mend',group),b=bottle('frost',group);a.position.set(-.12,.72,0);b.position.set(.12,.72,0);
    cached.push({c,group,lid,seal,a,b,resources:resources.splice(start)});
   }
  }
  const oldVisual=g.visuals.bind(g);g.visuals=function(){oldVisual();
   if(state.viewGame!==g.game){clear();state.game=g.game;state.viewGame=g.game;state.event=g.game.eventSeq||0;build();for(const e of effects)e.until=0;}
   // start() may have already set the game reference during a held input.
   if(!cached.length)build();
   const active=live(),k=g.game.fieldkit||M.create();scene.visible=g.running&&!g.arMode&&!g.practice&&!g.returningBell?.state.table&&g.threshold?.state.phase==='game';belt.visible=active&&g.xr;
   if(belt.visible){positionBelt();for(const s of slots){s.object.visible=k.stock[s.kind]>0;const text=(s.kind==='mend'?'HEAL':'FROST')+' '+k.stock[s.kind]+' / grip';if(text!==s.text){s.text=text;paint(s.label,text);}s.label.mesh.visible=true;}}
   held.visible=frostHeld.visible=false;if(active&&state.held&&!state.used&&state.held!=='cache'){const hand=g.hands[$('handedness').value==='left'?'right':'left'],o=state.held==='mend'?held:frostHeld;if(hand){o.visible=true;o.position.set(...hand.p);o.quaternion.copy(hand.q);}}
   for(let i=0;i<pool.length;i++){pool[i].mend.visible=pool[i].frost.visible=false;const f=k.flights[i];if(f){const o=pool[i][f.type];o.visible=true;o.position.set(...f.p);o.rotation.set(g.game.time*7,0,g.game.time*3);}}
   for(const o of cached){const v=k.caches[o.c.id];o.lid.rotation.x=v?-.9:0;o.lid.position.z=v?-.13:0;o.seal.visible=!v;o.a.visible=o.b.visible=v!==2;}
   for(const e of g.game.events)if(e.seq>state.event){if(e.type.startsWith('kit-')&&e.text)say(e.text);if(e.type==='kit-splash'){const f=effects.find(f=>f.until<=g.game.time)||effects[0];f.until=g.game.time+1;f.o.position.set(e.p[0],e.p[1]+.025,e.p[2]);f.o.material.color.set(e.kind==='mend'?'#6fe0b0':'#8ccbff');f.radius=e.kind==='mend'?2.8:3.2;}}
   state.event=g.game.eventSeq||0;for(const e of effects){const left=e.until-g.game.time;e.o.visible=left>0;if(left>0){e.o.material.opacity=Math.min(.45,left*.45);e.o.scale.setScalar(e.radius*(1-left*.45));}}
   const eye=g.head.object3D.getWorldPosition(new T.Vector3()),direction=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion())),h=active?M.hint(g.game,eye.toArray(),direction.toArray(),C):null;prompt.mesh.visible=!!h;if(h){const text=h.label+'\n'+h.text;if(text!==promptText){paint(prompt,text);promptText=text;}prompt.mesh.position.set(...h.p).add(new T.Vector3(0,.45,0));prompt.mesh.quaternion.copy(g.head.object3D.getWorldQuaternion(new T.Quaternion()));}
  };
  function menuAction(action){if(g.xr&&g.questHands.state.active){g.dominionControls.notice('Pick up both controllers for field-kit play. Hand tracking remains available for menus.');return;}g.setPaused(false);action();}
  function rows(){const k=g.game.fieldkit||M.create();return [
   ['Drink healing vial / '+k.stock.mend+' ready',()=>menuAction(drink)],
   ['Throw frost flask / '+k.stock.frost+' ready',()=>menuAction(()=>flatThrow('frost'))],
   ['Throw healing vial / '+k.stock.mend+' ready',()=>menuAction(()=>flatThrow('mend'))],
   ['How to use the physical satchel',()=>g.dominionControls.notice('Two vial slots sit at the free-hand waist. Reach down and squeeze grip. Move and release to throw, or aim a held frost flask and press trigger. A stationary release stows the vial. Healing: throw near your feet or bring to mouth and press trigger. Frost interrupts nearby enemies, never through a wall. Sealed caches can be shot open, then collected nearby. Keyboard F heals, G throws frost, T throws healing. Xbox LB+X heals; LB+RB throws frost. Courier lantern: grab its forward waist handle, trigger uses nearby mechanisms, release stows. L / Xbox LB+Up toggles the lantern. Supplies and opened caches are saved. Solo field kit; co-op and melee are not added in this pass.')],
   ['Back to equipment',()=>g.dominionControls.setScreen('equipment')],['Back to expedition',()=>g.dominionControls.setScreen('main')]
  ];}
  const controls=document.createElement('fieldset');controls.id='fieldkit-controls';controls.className='resonance-settings';controls.innerHTML='<legend>Pilgrim field kit / physical supplies</legend><p>Reach to the two free-hand waist slots and grip a vial. Move and release to throw; held frost also has an aimed trigger throw. Release without a throw to stow. Bring a healing vial to your mouth and press trigger to drink. Shoot or grip sealed caches, then take their finite supplies. F: heal. G: throw frost. T: throw healing. Xbox LB+X: heal. LB+RB: throw frost. Goldwind arrows and disk controls are unchanged.</p><button id="fieldkit-heal">Drink healing vial / F / LB+X</button><button id="fieldkit-frost">Throw frost flask / G / LB+RB</button><button id="fieldkit-mend">Throw healing vial / T</button>';
  document.querySelector('.settings').append(controls);$('fieldkit-heal').onclick=()=>menuAction(drink);$('fieldkit-frost').onclick=()=>menuAction(()=>flatThrow('frost'));$('fieldkit-mend').onclick=()=>menuAction(()=>flatThrow('mend'));
  const oldRemove=g.remove.bind(g);g.remove=function(){clear();window.removeEventListener('keydown',key);for(const c of cached)for(const r of c.resources)r.dispose();for(const r of resources)r.dispose();for(const p of[...slots.map(s=>s.label),prompt]){p.texture.dispose();p.mesh.geometry.dispose();p.mesh.material.dispose();}scene.removeFromParent();belt.removeFromParent();controls.remove();return oldRemove();};
  return {state,slots,motion,scene,belt,prompt,rows,drink,flatThrow,padInput,targetCache,viewTarget,positionBelt};
 }
 root.PilgrimKit=Object.freeze({install});
})(globalThis);
