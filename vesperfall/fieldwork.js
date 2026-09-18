/* Grip acquisition and clear pickup feedback. This is a bounded input owner:
 * it consumes only a deliberate, visible pickup interaction and its release.
 * No pose, ammunition, reward or item identity is assigned outside core rules. */
(function(root){'use strict';
 function install(g){
  const T=g.T,C=VesperCore,M=FieldworkModel,$=id=>document.getElementById(id);
  const state={frames:0,previous:{},sources:null,held:null,target:null,hand:null,pull:null,message:'',messageUntil:0,lastLabel:'',seen:null,event:0};
  const label=g.makePanel(512,128,.55,.138);label.mesh.name='Grip pickup / item and outcome';label.mesh.material.depthTest=true;label.mesh.visible=false;g.scene.object3D.add(label.mesh);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#efd49a',transparent:true,opacity:.7}));line.frustumCulled=false;line.visible=false;g.scene.object3D.add(line);
  function clear(){state.previous={};state.sources=null;state.held=null;state.target=null;state.hand=null;state.pull=null;label.mesh.visible=line.visible=false;}
  const cancel=g.cancel.bind(g);g.cancel=function(){clear();cancel();};
  const pause=g.setPaused.bind(g);g.setPaused=function(...args){clear();return pause(...args);};
  function handRay(h){
   const pose=h.source.targetRaySpace&&g.scene.frame?.getPose(h.source.targetRaySpace,g.scene.renderer.xr.getReferenceSpace());
   const q=pose?g.rig.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().copy(pose.transform.orientation)):h.q;
   return new T.Vector3(0,0,-1).applyQuaternion(q).toArray();
  }
  function say(text,p,hand){state.message=text;state.messageUntil=performance.now()+1300;state.messagePoint=[...p];g.toast(text);try{hand?.source.gamepad?.hapticActuators?.[0]?.pulse(.2,45)?.catch?.(()=>{});}catch{}}
  function collect(index,hand,reach){const s=g.game,p=s.world.pickups[index],before={health:s.health,ammo:s.ammo[p.kind]};
   if(p.kind==='health'&&s.health>=s.maxHealth){say('Vitality full / supply stays here',p.p,hand);return false;}
   if(!C.collectPickup(s,index,hand.p,reach)){say('Pickup blocked / move your hand closer',p.p,hand);return false;}
   say(M.confirmation(s,p,before),hand.p,hand);return true;
  }
  function busyInput(dt,head,bow,draw,drawName){
   // Keep ordinary locomotion and directional defense live during a pull.
   if(draw.buttons[3]){g.setPaused(true);return;}
   const guard=$('goldwind-shield').value==='grip'?1:0;
   g.arsenal.ward(state.held!==$('handedness').value&&!!bow.buttons[guard],bow);
   if($('locomotion').value==='smooth')g.walkInput(VesperInput.deadzone(bow.axes.length>=4?bow.axes[2]:bow.axes[0]),VesperInput.deadzone(bow.axes.at(-1)),dt,head,1.7);
   const x=draw.axes.length>=4?draw.axes[2]:draw.axes[0]||0;
   if(Math.abs(x)<.25)g.snapArmed=true;else if(Math.abs(x)>.7&&g.snapArmed){g.turn(x>0?-Math.PI/6:Math.PI/6);g.snapArmed=false;g.cancel();}
   g.charge=0;g.drawHeld=false;g.latch.reset();
   g.prevButtons=Object.fromEntries(Object.entries(g.hands).map(([n,h])=>[n,[...h.buttons]]));
  }
  const oldXR=g.processXR.bind(g);g.processXR=function(dt,head){
   state.frames++;
   const session=g.scene.renderer.xr.getSession(),sources=[...(session?.inputSources||[])];
   if(!g.xr||!g.goldwind.enabled()||!g.running||g.paused||g.game.phase!=='playing'||sources.some(s=>s.hand)||session?.visibilityState!=='visible'||g.headBlocked){clear();return oldXR(dt,head);}
   g.tracked(g.scene.frame);const bowName=$('handedness').value,drawName=bowName==='left'?'right':'left',bow=g.hands[bowName],draw=g.hands[drawName];
   if(!bow||!draw){clear();g.goldwind.reset();return oldXR(dt,head);}
   if(!state.sources||state.sources[0]!==bow.source||state.sources[1]!==draw.source){clear();state.sources=[bow.source,draw.source];state.previous={[bowName]:!!bow.buttons[1],[drawName]:!!draw.buttons[1]};}
   const pressed={[bowName]:!!bow.buttons[1],[drawName]:!!draw.buttons[1]};
   g.game.head=head.toArray();
   if(state.held){
    const h=g.hands[state.held];
    if(!h||!pressed[state.held]){state.held=null;state.pull=null;g.goldwind.reset();}
    else{
     const pull=state.pull;
     if(pull){const p=g.game.world.pickups[pull.index],delta=C.sub(h.p,pull.point),d=C.len(delta);
      if(!p||p.taken||C.len(C.sub(h.p,head.toArray()))>1.6||C.len(C.sub(p.p,h.p))>7||C.segmentBlocked(g.game.world,p.p,h.p,.02)){state.pull=null;say('Pull interrupted / release grip to retry',h.p,h);}
      else if(d<=.2){collect(pull.index,h,7);state.pull=null;}
      else pull.point=C.add(pull.point,C.mul(C.unit(delta),Math.min(d,5.2*dt)));
     }
     busyInput(dt,head,bow,draw,drawName);state.previous=pressed;return;
    }
   }
   state.target=null;state.hand=null;
   if(!g.latch.drawing&&!g.goldwind.state.quiver&&!g.goldwind.state.flight&&!g.ritual.state.pull){
    for(const name of[drawName,bowName]){const h=g.hands[name],candidate=M.target(g.game,h.p,handRay(h),name===drawName);
     if(candidate&&(state.target===null||candidate.near&&!state.target.near)){state.target=candidate;state.hand=name;}
    }
    const name=state.hand,candidate=state.target;
    if(candidate&&pressed[name]&&!state.previous[name]){
     // Cancel transient bow/disk acquisition before owning this grip edge.
     // The latch remains consumed until release, including unsuccessful grabs.
     g.cancel();state.sources=[bow.source,draw.source];state.held=name;state.hand=name;state.target=candidate;
     const p=g.game.world.pickups[candidate.index],h=g.hands[name];
     if(candidate.near||!candidate.usable)collect(candidate.index,h,.55);
     else{state.pull={index:candidate.index,point:[...p.p]};C.emit(g.game,'pickup-pull',{p:[...p.p],grip:true});}
     busyInput(dt,head,bow,draw,drawName);state.previous=pressed;return;
    }
   }
   state.previous=pressed;return oldXR(dt,head);
  };
  const visual=g.visuals.bind(g);g.visuals=function(){visual();const s=g.game;
   if(state.seen!==s){state.seen=s;state.event=0;clear();state.messageUntil=0;}
   for(const e of s.events)if(e.seq>state.event&&e.type==='pickup'&&performance.now()>state.messageUntil){
    const text=e.kind==='health'?'Vitality supply collected':e.kind==='relic'?'Reliquary collected / +100 score':(M.names[e.kind]||'Arrows')+' +3 / '+s.ammo[e.kind]+' ready';say(text,e.p,null);
   }state.event=s.eventSeq||0;
   const show=g.xr&&g.running&&!g.paused&&s.phase==='playing'&&!g.returningBell.state.table,info=state.target&&s.world.pickups[state.target.index],pull=state.pull;
   line.visible=!!pull&&show;
   if(pull){const mesh=g.pickupMeshes[pull.index];if(mesh)mesh.position.set(...pull.point);const jewel=g.jewelglass?.pickups?.[pull.index];if(jewel)jewel.group.position.set(...pull.point);
    const h=g.hands[state.held];if(h){const a=line.geometry.attributes.position;a.setXYZ(0,...pull.point);a.setXYZ(1,...h.p);a.needsUpdate=true;}}
   const message=performance.now()<state.messageUntil,text=message?state.message:pull?'Hold grip / pulling supply':info&&!info.taken?(state.target.usable?(state.target.near?'Grip: take ':'Aim + hold grip: pull ')+state.target.label:'Vitality full / supply stays here'):'';
   label.mesh.visible=show&&!!text;
   if(label.mesh.visible){const p=message?state.messagePoint:pull?pull.point:info.p;label.mesh.position.set(...p).add(new T.Vector3(0,.35,0));label.mesh.quaternion.copy(g.head.object3D.getWorldQuaternion(new T.Quaternion()));
    const distance=label.mesh.position.distanceTo(g.head.object3D.getWorldPosition(new T.Vector3()));label.mesh.scale.setScalar(Math.max(.7,Math.min(2.2,distance*.6)));
    if(text!==state.lastLabel){const {ctx,texture}=label;ctx.clearRect(0,0,512,128);ctx.fillStyle='#18313e';ctx.fillRect(0,0,512,128);ctx.fillStyle=info&&!state.target?.usable?'#f3c78c':'#ecdfb6';ctx.font='24px Arial';ctx.textAlign='center';ctx.fillText(text,256,58,485);ctx.font='19px Arial';ctx.fillStyle='#c7ddd3';ctx.fillText(message?'Supply state confirmed':"Release grip to cancel. A/B still draws travel.",256,98,485);texture.needsUpdate=true;state.lastLabel=text;}
   }
  };
  const remove=g.remove.bind(g);g.remove=function(){for(const o of[label.mesh,line]){o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose();o.removeFromParent();}remove();};
  return {state,clear,label,line};
 }
 root.Fieldwork=Object.freeze({install});
})(globalThis);
