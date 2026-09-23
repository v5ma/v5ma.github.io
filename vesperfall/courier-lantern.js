/* A reusable carried guide-light, not a second inventory or progression owner.
 * Grip at the forward free-hand belt handle. Release stows; trigger uses an
 * already-reachable mechanism. The older physical flask/disk owners remain. */
(function(root){'use strict';
 function install(g){
  if(g.courierLantern)return g.courierLantern;
  const T=g.T,C=VesperCore,M=CourierLanternModel,W=WayfinderModel,P=PilgrimageModel,R=ReturningBellModel,K=PilgrimKitModel;
  const $=id=>document.getElementById(id),resources=[],group=new T.Group(),held=new T.Group(),belt=new T.Group();
  group.name="Courier's Light / reusable equipment";held.name='Carried courier lantern';belt.name='Courier lantern holster';group.add(held,belt);g.scene.object3D.add(group);
  const state={held:false,desktop:false,armed:false,previous:[],source:null,game:g.game,frames:0,uses:0,stows:0,text:'',disposed:false};
  const point=new T.Vector3(),eye=new T.Vector3(),q=new T.Quaternion(),forward=new T.Vector3();
  function mesh(geo,mat,parent,x=0,y=0,z=0){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);parent.add(o);return o;}
  const metal=new T.MeshStandardMaterial({color:'#b9985e',roughness:.4,metalness:.65});
  const glow=new T.MeshStandardMaterial({color:'#ffe3a6',emissive:'#ffc966',emissiveIntensity:.7,roughness:.7});
  const base=new T.CylinderGeometry(.07,.085,.12,8),handle=new T.TorusGeometry(.065,.009,5,12),core=new T.OctahedronGeometry(.052);
  resources.push(metal,glow,base,handle,core);
  for(const parent of[held,belt]){mesh(base,metal,parent,0,-.16);mesh(core,glow,parent,0,-.065);mesh(handle,metal,parent,0,.015);}
  const light=new T.PointLight('#ffd69a',0,4,2);light.name='Courier light / unshadowed virtual illumination';g.scene.object3D.add(light);
  const panel=g.makePanel(768,256,.48,.16);panel.mesh.name='Courier lantern bearing / object-local';panel.mesh.material.depthTest=true;panel.mesh.material.depthWrite=false;panel.mesh.position.set(0,.20,.02);held.add(panel.mesh);
  const label=g.makePanel(384,96,.24,.06);label.mesh.material.depthTest=true;label.mesh.material.depthWrite=false;label.mesh.position.set(0,-.28,.01);belt.add(label.mesh);
  const lc=label.ctx;lc.fillStyle='#182f38';lc.fillRect(0,0,384,96);lc.fillStyle='#ffe4ac';lc.font='23px Arial';lc.textAlign='center';lc.fillText('LANTERN / GRIP',192,60,360);label.texture.needsUpdate=true;
  function active(){return g.running&&!g.paused&&g.game.phase==='playing'&&!g.arMode&&!g.practice&&!g.firstBell?.state.coach&&!g.returningBell?.state.table&&!g.ritual?.focus.open&&(!g.threshold||g.threshold.state.phase==='game');}
  function stow(){if(state.held||state.desktop)state.stows++;state.held=state.desktop=false;state.source=null;state.previous=[];state.armed=false;held.visible=false;light.intensity=0;}
  const cancel=g.cancel.bind(g);g.cancel=function(){stow();return cancel();};
  const pause=g.setPaused.bind(g);g.setPaused=function(...args){stow();return pause(...args);};
  function toggle(){if(!active())return false;if(g.xr){g.toast('Reach the lantern handle in front of the free-hand waist; grip to carry.');return false;}
   const next=!state.desktop;g.cancel();state.desktop=next;state.game=g.game;g.toast(next?'Courier lantern: bearing only, not a safe route. L / LB+Up stows.':'Courier lantern stowed.');return true;
  }
  function position(){g.head.object3D.getWorldPosition(eye);g.head.object3D.getWorldQuaternion(q);forward.set(0,0,-1).applyQuaternion(q);
   const p=M.holster(eye.toArray(),forward.toArray(),g.game.p[1],$('handedness').value==='left');if(p)point.set(...p);belt.position.copy(point);belt.quaternion.copy(q);
  }
  function direction(h){return new T.Vector3(0,0,-1).applyQuaternion(h.q).toArray();}
  function operate(h){const control=g.wayfinder.current();if(!M.canOperate(g.game,control,h.p,direction(h),C,W,K)){g.toast('Aim the lantern at a nearby mechanism on your level. The bearing is not a clear path.');return false;}
   g.interact();state.uses++;return true;
  }
  function busy(){return g.latch.drawing||g.fieldKit.state.held||g.fieldwork.state.held||g.goldwind.state.quiver||g.goldwind.state.flight||g.goldwind.gesture.held||g.ritual.state.pull;}
  const xr=g.processXR.bind(g);g.processXR=function(dt,head){state.frames++;
   const session=g.scene.renderer.xr.getSession();
   if(!g.xr||!active()||g.headBlocked||session?.visibilityState!=='visible'||[...(session?.inputSources||[])].some(s=>s.hand)){if(g.xr||!active())stow();return xr(dt,head);}
   g.tracked(g.scene.frame);const bowName=$('handedness').value,free=bowName==='left'?'right':'left',bow=g.hands[bowName],hand=g.hands[free];
   if(!bow||!hand){stow();return xr(dt,head);}const b=hand.buttons,edge=i=>b[i]&&!state.previous[i];
   if(state.game!==g.game||state.source!==hand.source){stow();state.game=g.game;state.source=hand.source;state.previous=[...b];return xr(dt,head);}
   if(!state.armed){if(!b.some(Boolean)&&!bow.buttons.some(Boolean))state.armed=true;state.previous=[...b];return xr(dt,head);}
   if(!state.held&&edge(1)&&!busy()){
    position();const pickup=FieldworkModel.target(g.game,hand.p,direction(hand),true);
    if(!pickup&&point.distanceTo(new T.Vector3(...hand.p))<.14&&K.visible(g.game,head.toArray(),hand.p,C)){
     g.cancel();state.held=true;state.armed=true;state.game=g.game;state.source=hand.source;state.previous=[...b];g.goldwind.reset();g.toast('Courier lantern: trigger operates a nearby mechanism. Release grip to stow.');
    }
   }
   if(!state.held){state.previous=[...b];return xr(dt,head);}
   if(edge(3)||!g.goldwind.enabled()&&bow.buttons[5]){g.setPaused(true);return;}
   if(!b[1]||C.len(C.sub(hand.p,head.toArray()))>1.7||!K.visible(g.game,head.toArray(),hand.p,C)){g.cancel();return;}
   if(edge(0))operate(hand);
   if(g.paused)return;
   const guard=$('goldwind-shield').value==='grip'?1:0;g.arsenal.ward(!!bow.buttons[guard],bow);
   if($('locomotion').value==='smooth')g.walkInput(VesperInput.deadzone(bow.axes.length>=4?bow.axes[2]:bow.axes[0]),VesperInput.deadzone(bow.axes.at(-1)),dt,head,1.7);
   const x=hand.axes.length>=4?hand.axes[2]:hand.axes[0]||0;if(Math.abs(x)<.25)g.snapArmed=true;else if(Math.abs(x)>.7&&g.snapArmed){g.turn(x>0?-Math.PI/6:Math.PI/6);g.snapArmed=false;g.cancel();return;}
   g.charge=0;g.drawHeld=false;g.latch.reset();state.previous=[...b];g.prevButtons=Object.fromEntries(Object.entries(g.hands).map(([name,h])=>[name,[...h.buttons]]));
  };
  const pad=g.fieldKit.padInput;g.fieldKit.padInput=function(b,edge){if(active()&&b[4]&&edge(12)){toggle();return true;}return pad(b,edge);};
  function key(e){if(e.code==='KeyL'&&!e.repeat&&!g.xr&&active()&&!/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();toggle();}}
  window.addEventListener('keydown',key);
  function paint(a,b,c){const text=[a,b,c].join('\n');if(text===state.text)return;state.text=text;const ctx=panel.ctx;ctx.fillStyle='#17313b';ctx.fillRect(0,0,768,256);ctx.strokeStyle='#d9b576';ctx.lineWidth=4;ctx.strokeRect(2,2,764,252);ctx.textAlign='center';ctx.fillStyle='#fff0c8';ctx.font='bold 30px Arial';ctx.fillText(a,384,62,736);ctx.font='32px Arial';ctx.fillText(b,384,135,736);ctx.font='23px Arial';ctx.fillStyle='#c8ded9';ctx.fillText(c,384,208,736);panel.texture.needsUpdate=true;}
  const visuals=g.visuals.bind(g);g.visuals=function(){visuals();button.disabled=!g.running||g.game.phase!=='playing';if(state.game!==g.game){stow();state.game=g.game;}const live=active();if(!live)stow();position();group.visible=live;belt.visible=live&&g.xr&&!state.held;held.visible=live&&(state.held||state.desktop);
   if(!held.visible){light.intensity=0;return;}const h=g.hands[$('handedness').value==='left'?'right':'left'];
   if(g.xr&&h){held.position.set(...h.p);held.quaternion.copy(h.q);}else{held.position.copy(eye).add(new T.Vector3($('handedness').value==='left'?.30:-.30,-.44,-.64).applyQuaternion(q));held.quaternion.copy(q);}
   const control=g.wayfinder.current(),use=g.xr&&h&&M.canOperate(g.game,control,h.p,direction(h),C,W,K),goal=M.guide(g.game,eye.toArray(),forward.toArray(),W,P,R);
   paint(use?control.label:goal.title,use?'TRIGGER / operate nearby':goal.detail,use?'Release grip to stow':g.xr?'Bearing only / grip release stows':'Bearing only / E or A uses nearby / L stows');
   // No room scanning, surface anchoring or claimed real-room illumination.
   held.updateMatrixWorld(true);light.position.copy(g.scene.object3D.worldToLocal(held.localToWorld(new T.Vector3(0,-.065,0))));light.intensity=g.arExpedition||g.arMode?0:2;glow.emissiveIntensity=use?1:.7;
  };
  const button=document.createElement('button');button.id='courier-lantern-toggle';button.textContent='Courier lantern / L / Xbox LB+Up';button.onclick=()=>{if(!g.running)return;g.setPaused(false);toggle();};$('fieldkit-controls').append(button);
  const hint=document.createElement('p');hint.textContent='Courier lantern: grip its handle in front of the free-hand waist. Hold to read your objective bearing, and press trigger to use an already-nearby mechanism. Release stows safely. Keyboard L or Xbox LB+Up toggles it. Bearings do not guarantee an unobstructed route.';$('fieldkit-controls').append(hint);
  const remove=g.remove.bind(g);g.remove=function(){if(state.disposed)return;state.disposed=true;stow();window.removeEventListener('keydown',key);for(const p of[panel,label]){p.texture.dispose();p.mesh.geometry.dispose();p.mesh.material.dispose();}for(const r of resources)r.dispose();light.dispose?.();light.removeFromParent();group.removeFromParent();button.remove();hint.remove();return remove();};
  const api={state,group,held,belt,light,panel,point,position,toggle,operate,stow,active};g.courierLantern=api;return api;
 }
 function connect(){const scene=document.querySelector('a-scene');if(!scene)return;const ready=e=>{if(!e||e.detail?.name==='vesper-game'){const g=scene.components?.['vesper-game'];if(g?.fieldKit)install(g);}};scene.addEventListener('componentinitialized',ready);ready();}
 if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});else connect();}
 const api=Object.freeze({install});root.CourierLantern=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
