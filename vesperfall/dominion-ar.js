/* Passthrough Sanctuary uses a genuine immersive-ar session. It is deliberately
 * stationary and unscored, with no claim of furniture detection or occlusion.
 * The suspended expedition is restored, not overwritten, when AR ends. */
(function(root){'use strict';
 function install(g,ui){
  const T=g.T,C=VesperCore,$=id=>document.getElementById(id);let suspended=null,wave=0;
  const enter=g.enterXR.bind(g),exit=g.exitXR.bind(g),start=g.start.bind(g),training=g.startTraining.bind(g),build=g.build.bind(g),walk=g.walkInput.bind(g),turn=g.turn.bind(g),shard=g.arsenal.shard,type=g.setType.bind(g),lighting=$('lighting');
  function transparent(){if(!g.arMode)return;g.scene.object3D.background=null;g.scene.object3D.fog=null;g.scene.renderer.setClearColor(0x000000,0);if(g.jewelglass)g.jewelglass.worldFX.visible=false;if(g.arsenal.dust)g.arsenal.dust.visible=false;}
  function arena(practice=false,kind=null,preview=false){
   const eye=g.head.object3D.getWorldPosition(new T.Vector3()),rotation=g.head.object3D.getWorldQuaternion(new T.Quaternion()),forward=new T.Vector3(0,0,-1).applyQuaternion(rotation);forward.y=0;forward.normalize();if(forward.length()<.5)forward.set(0,0,-1);const right=new T.Vector3(-forward.z,0,forward.x),origin=[eye.x,0,eye.z];
   const s=C.create('AR-SANCTUARY-'+wave);s.unscored=true;s.p=[...origin];s.head=[eye.x,Math.max(1,eye.y),eye.z];
   const room={id:0,x:eye.x,z:eye.z,w:24,d:24,style:0,label:'AR Sanctuary',planFamily:'choir',outline:[[-12,-12],[12,-12],[12,12],[-12,12]]};
   s.world={seed:'AR-SANCTUARY',depth:1,ar:true,arOrigin:origin,arYaw:Math.atan2(-forward.x,-forward.z),rooms:[room],links:[[]],edges:[],floors:[{id:'ar-support',x:eye.x,z:eye.z,w:24,d:24,y:0,type:'stone'}],solids:[],start:origin,exit:0,enemies:[],pickups:[],targets:[],architecture:{lofts:[],extraLofts:[],routes:[]}};
   if(!preview&&!practice){const types=kind?[kind]:[VesperBestiary.kinds[(wave*2)%12],VesperBestiary.kinds[(wave*2+1)%12]];types.forEach((k,i)=>{const offset=types.length===1?0:(i-.5)*2.3,p=new T.Vector3(...origin).addScaledVector(forward,5+i*.45).addScaledVector(right,offset),e=VesperEncounters.training(k);e.id=i;e.room=0;e.p=[p.x,1.05,p.z];e.required=true;e.aware=true;e.cd=2.4+i*.7;s.world.enemies.push(e);});}
   if(practice)for(let i=0;i<4;i++){const p=new T.Vector3(...origin).addScaledVector(forward,3.8+i*.6).addScaledVector(right,(i-1.5)*1.05);s.world.targets.push([p.x,1.35+(i%2)*.4,p.z]);}
   g.game=s;g.practice=true;g.training=!practice&&!preview?(kind||'sanctuary'):null;g.running=!preview;g.banked=0;g.lastEvent=0;g.lastPhase='playing';g.accumulator=0;g.yaw=g.pitch=0;g.rig.rotation.set(0,0,0);g.build();g.rig.position.set(0,0,0);g.setPaused(preview);transparent();if(!preview){wave++;g.toast(practice?'AR target range. Stay in your clear play space.':'AR Sanctuary wave '+wave+'. Physical archery and guard; no artificial locomotion.');}
  }
  g.enterXR=function(){const ar=g.scene.is('ar-mode');$('dominion-dialog').hidden=true;if(ar){suspended={game:g.game,running:g.running,practice:g.practice,training:g.training,banked:g.banked,lastPhase:g.lastPhase,yaw:g.yaw,pitch:g.pitch,rig:g.rig.position.clone(),rotation:g.rig.rotation.clone(),background:g.scene.object3D.background,fog:g.scene.object3D.fog};g.arMode=true;g.rig.position.set(0,0,0);g.rig.rotation.set(0,0,0);}enter();if(ar){arena(false,null,true);ui.state.notice='AR Sanctuary: stay inside a clear play space. The real world remains visible, but this game does not detect furniture. Your expedition is suspended until AR ends.';ui.setScreen('main');g.pendingPanel=true;}};
  g.exitXR=function(){const old=suspended;g.arMode=false;suspended=null;exit();if(old){Object.assign(g,{game:old.game,running:old.running,practice:old.practice,training:old.training,banked:old.banked,lastPhase:old.lastPhase,yaw:old.yaw,pitch:old.pitch});g.scene.object3D.background=old.background;g.scene.object3D.fog=old.fog;g.scene.renderer.setClearAlpha(1);g.build();g.rig.position.copy(old.rig);g.rig.rotation.copy(old.rotation);if(g.jewelglass)g.jewelglass.worldFX.visible=true;if(g.arsenal.dust)g.arsenal.dust.visible=true;g.setPaused(true);g.toast('Your expedition has been restored and is paused.');}g.requestedMode=null;};
  g.start=practice=>g.arMode?arena(practice):start(practice);g.startTraining=kind=>g.arMode?arena(false,kind):training(kind);
  g.build=function(){build();if(g.arMode){g.rig.position.set(0,0,0);transparent();}};
  g.walkInput=function(...args){if(!g.arMode)return walk(...args);};g.turn=angle=>{if(!g.arMode)turn(angle);};
  g.arsenal.shard=function(...args){if(g.arMode){g.toast('AR Sanctuary is stationary. Use physical dodge or shield.');return false;}return shard(...args);};

  g.setType=function(value){if(g.arMode&&value==='blink'){g.toast('Blink is disabled in stationary AR Sanctuary.');return;}type(value);};
  const visuals=g.visuals.bind(g);g.visuals=function(){visuals();if(g.arMode){transparent();$('expedition-progress').textContent='AR SANCTUARY / WAVE '+wave+' / UNSCORED / STATIONARY';g.teleLine.visible=g.teleRing.visible=false;if(g.game.phase==='playing'&&!g.game.world.enemies.some(e=>!e.dead)&&g.training)g.xrNotice='Wave cleared. Open the menu to begin another wave or choose a trial.';}};
  lighting.addEventListener('change',transparent);
  return {arena,get wave(){return wave;},get suspended(){return !!suspended;}};
 }
 root.DominionAR=Object.freeze({install});
})(globalThis);
