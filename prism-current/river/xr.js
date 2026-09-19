/* Tracked-controller combat, pinch menu UI and transparent AR.
   Grip shields, trigger lasers; B/Y pauses. No forced head motion or walking. */
(function(root){'use strict';
 function install(g){const T=g.T,scene=g.el,stage=g.art.stage,prior=new Map(),sources={},menu=g.art.panel(1.68,1.14),hud=g.art.panel(1.75,.28),ray=new T.Raycaster();let session=null,calibrated=false,viewer=null,missing=null,centeredOnce=false,lastPaint=0,lastText='';
  menu.mesh.position.set(0,1.48,-1.95);hud.mesh.position.set(0,2.25,-1.9);menu.mesh.visible=hud.mesh.visible=false;
  const buttons=[];for(let i=0;i<8;i++){const m=new T.Mesh(new T.PlaneGeometry(.72,.125),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));m.position.set(i%2?.40:-.40,.05-Math.floor(i/2)*.17,.004);m.userData.action=i;menu.mesh.add(m);buttons.push(m);}
  const rays=[0,1].map(h=>{const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-2)]),m=new T.Line(geo,new T.LineBasicMaterial({color:h?0xffb4d3:0x9affdf}));scene.object3D.add(m);m.visible=false;return m;});
  function recenter(){if(!viewer)return;g.pauseRun('Stage recentered. Check your clear space before resuming.');const p=viewer.transform.position,q=viewer.transform.orientation,f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));stage.position.set(p.x,p.y-1.65,p.z);stage.rotation.y=Math.atan2(-f.x,-f.z);stage.updateMatrixWorld(true);calibrated=true;g.clearInputs();lastText='';}
  function action(i){if(i===0){if(!calibrated){recenter();return;}if(session?.inputSources?.filter(s=>s.gripSpace&&!s.hand).length<2){g.notice('Use both tracked controllers to fight. Hands can operate this menu.');return;}g.phase==='paused'?g.resume():g.start();}
   if(i===1){g.cancel();g.chapter=g.chapter==='duck-armada'?'mothership':'duck-armada';g.sync();}if(i===2)recenter();if(i===3)scene.exitVR();if(i===4)g.music(-.1);if(i===5)g.music(.1);if(i===6){g.quiet=!g.quiet;g.sync();}if(i===7){g.cruise=!g.cruise;g.sync();}lastText='';}
  function panel(){const key=[g.phase,g.chapter,g.message,g.quiet,g.cruise,g.audio.volume].join('|');if(key===lastText)return;lastText=key;const c=menu.context,w=menu.canvas.width,h=menu.canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#102b3ff5';c.fillRect(0,0,w,h);c.strokeStyle='#87ddc4';c.lineWidth=4;c.strokeRect(2,2,w-4,h-4);c.fillStyle='#a7fbe1';c.font='600 28px system-ui';c.fillText('RIVER PRISM / '+(scene.is('ar-mode')?'AR STAGE':'VR'),32,43);c.fillStyle='#ffffff';c.font='600 47px system-ui';c.fillText(g.chapter==='mothership'?'Mothership Channel':'Duck Armada',32,104);c.font='22px system-ui';c.fillStyle='#c9e2df';c.fillText('Swing: cut fruit. Triggers: laser. Grips: shield. B / Y: pause.',32,147);c.font='21px system-ui';c.fillText(g.message.slice(0,88),32,188);
   const labels=[g.phase==='paused'?'Resume battle':'Start battle','Other chapter','Recenter stage','Exit headset','Music -','Music +',g.quiet?'Motion: quiet':'Motion: flowing',g.cruise?'Cruise: no fail':'Arcade: health'];
   for(let i=0;i<8;i++){const x=i%2?631:56,y=306+Math.floor(i/2)*122;c.fillStyle=i===0?'#a7f5d4':'#244b62';c.fillRect(x,y,513,90);c.fillStyle=i===0?'#103344':'#ffffff';c.font='600 26px system-ui';c.fillText(labels[i],x+20,y+56);}menu.texture.needsUpdate=true;
  }
  async function enter(ar){g.cancel();try{await g.audio.context().resume();await(ar?scene.enterAR():scene.enterVR());}catch(e){g.notice('Headset entry did not open: '+e.message);}}
  document.getElementById('enter-vr').onclick=()=>enter(false);document.getElementById('enter-ar').onclick=()=>enter(true);
  if(navigator.xr)for(const [mode,id]of[['immersive-vr','enter-vr'],['immersive-ar','enter-ar']])navigator.xr.isSessionSupported(mode).then(ok=>{document.getElementById(id).disabled=!ok;}).catch(()=>{});
  function visibility(){if(session?.visibilityState!=='visible'){g.pauseRun('Headset hidden. Resume when ready.');g.clearInputs();prior.clear();}}
  function reset(){calibrated=false;g.pauseRun('Reference space changed. Recenter the stage.');g.clearInputs();prior.clear();}
  scene.addEventListener('enter-vr',()=>{session=scene.renderer.xr.getSession();g.cancel();g.immersive=true;calibrated=false;centeredOnce=false;prior.clear();g.clearInputs();document.body.classList.add('immersive');scene.renderer.setClearColor(0x000000,scene.is('ar-mode')?0:1);
   if(scene.is('ar-mode')&&!['alpha-blend','additive'].includes(session?.environmentBlendMode)){g.notice('This session is opaque, not passthrough AR.');scene.exitVR();return;}session?.addEventListener('visibilitychange',visibility);scene.renderer.xr.getReferenceSpace()?.addEventListener('reset',reset);g.notice('Check your reach. Start when your space is clear.');});
  scene.addEventListener('exit-vr',()=>{session?.removeEventListener('visibilitychange',visibility);scene.renderer.xr.getReferenceSpace()?.removeEventListener('reset',reset);session=null;g.immersive=false;calibrated=false;viewer=null;prior.clear();g.cancel();stage.position.set(0,0,0);stage.rotation.set(0,0,0);stage.updateMatrixWorld(true);document.body.classList.remove('immersive');scene.renderer.setClearColor(0x0a182c,1);menu.mesh.visible=hud.mesh.visible=false;for(const r of rays)r.visible=false;g.notice('Headset ended. Choose a fresh run.');});
  function aimPose(pose){const m=new T.Matrix4().fromArray(pose.transform.matrix),origin=new T.Vector3().setFromMatrixPosition(m),direction=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().setFromRotationMatrix(m));return {origin,direction};}
  function selectFrom(aim,h,clicked){const r=rays[h];r.visible=g.phase!=='playing';r.geometry.attributes.position.setXYZ(0,...aim.origin.toArray());r.geometry.attributes.position.setXYZ(1,...aim.origin.clone().addScaledVector(aim.direction,2.8).toArray());r.geometry.attributes.position.needsUpdate=true;
   if(!clicked||g.phase==='playing')return;ray.set(aim.origin,aim.direction);menu.mesh.updateMatrixWorld(true);const hit=ray.intersectObjects(buttons,false);if(hit.length)action(hit[0].object.userData.action);
  }
  function collect(t){const output={hands:[null,null],body:[0,1.45,0]};menu.mesh.visible=!!session&&g.phase!=='playing';hud.mesh.visible=!!session;if(!session)return output;
   const frame=scene.frame,space=scene.renderer.xr.getReferenceSpace();if(!frame||!space)return output;viewer=frame.getViewerPose(space);if(!viewer){g.pauseRun('Head tracking unavailable.');g.clearInputs();return output;}if(!centeredOnce){centeredOnce=true;recenter();}if(session.visibilityState!=='visible'){visibility();return output;}
   const head=stage.worldToLocal(new T.Vector3(viewer.transform.position.x,viewer.transform.position.y,viewer.transform.position.z));output.body=[head.x,head.y-.2,head.z];
   const seen=new Set();for(const src of session.inputSources){const h=src.handedness==='right'?1:0;const old=prior.get(src);const aim=src.targetRaySpace&&frame.getPose(src.targetRaySpace,space);if(src.hand){
     const a=src.hand.get('thumb-tip'),b=src.hand.get('index-finger-tip'),pa=a&&frame.getJointPose?.(a,space),pb=b&&frame.getJointPose?.(b,space);let pinch=false;if(pa&&pb){const p=pa.transform.position,q=pb.transform.position;pinch=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.025;}
     if(aim)selectFrom(aimPose(aim),h,pinch&&old?.pinch===false);prior.set(src,{pinch});continue;
    }
    if(!src.gripSpace)continue;const pose=frame.getPose(src.gripSpace,space);if(!pose||pose.emulatedPosition){prior.delete(src);continue;}seen.add(h);sources[h]=src;const m=new T.Matrix4().fromArray(pose.transform.matrix),a=stage.worldToLocal(new T.Vector3(0,0,-.08).applyMatrix4(m)),b=stage.worldToLocal(new T.Vector3(0,0,-.78).applyMatrix4(m));const btn=(src.gamepad?.buttons||[]).map(x=>x.pressed||x.value>.55),was=old?.btn||btn;
    if(btn[5]&&!was[5])g.phase==='playing'?g.pauseRun('Paused. Triggers select; B / Y resumes.'):g.phase==='paused'?g.resume():null;
    if(btn[4]&&!was[4]&&g.phase==='menu')action(1);
    const ap=aim?aimPose(aim):aimPose(pose),localO=stage.worldToLocal(ap.origin.clone()),localEnd=stage.worldToLocal(ap.origin.clone().add(ap.direction)),normal=localEnd.sub(localO).normalize();
    if(g.phase!=='playing')selectFrom(ap,h,btn[0]&&!was[0]);else rays[h].visible=false;
    const raised=btn[1]?(was[1]&&old?old.raised:t):t;
    output.hands[h]={pose:{a:a.toArray(),b:b.toArray()},origin:localO.toArray(),direction:normal.toArray(),fire:!!btn[0],shield:{active:!!btn[1],center:a.clone().addScaledVector(normal,.32).toArray(),normal:normal.toArray(),raised,hand:h}};
    prior.set(src,{btn,raised});
   }
   if(seen.size<2&&g.phase==='playing'){missing??=performance.now();if(performance.now()-missing>220)g.pauseRun('Both controllers are needed for combat. Hands can use the paused menu.');}else missing=null;
   if(g.phase==='playing'&&(Math.abs(head.x)>1.15||Math.abs(head.z)>.70))g.pauseRun('You left the play position. Recenter only after checking your space.');
   panel();if(performance.now()-lastPaint>150){lastPaint=performance.now();const c=hud.context,w=hud.canvas.width,h=hud.canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#112b40dd';c.fillRect(0,0,w,h);c.fillStyle='#d5fff1';c.font='600 30px system-ui';const s=g.state,p=RiverCore.phase(g.chapter,s?.time||0);c.fillText(s?`${s.score}   /   ${s.health} HULL   /   ${p.name}`:'SWING / LASER / SHIELD',25,50);c.font='23px system-ui';c.fillText((g.phase==='playing'?p.cue:g.message).slice(0,95),25,99);const boss=s?.entities.find(n=>n.type==='boss');c.fillText(boss?`${RiverCore.open(s,boss)?'CORE OPEN':'SHIELDED'}  /  ${boss.hp} HP`:s?.bossDefeated?'BOSS DOWN / FINISH THE SONG':'B / Y opens the menu. No automatic head movement.',25,147);hud.texture.needsUpdate=true;}
   return output;
  }
  function haptic(h){try{sources[h]?.gamepad?.hapticActuators?.[0]?.pulse(.18,40)?.catch?.(()=>{});}catch{}}
  return {collect,recenter,haptic,get session(){return session},get calibrated(){return calibrated},dispose(){for(const b of buttons){b.geometry.dispose();b.material.dispose();}for(const r of rays){r.removeFromParent();r.geometry.dispose();r.material.dispose();}}};
 }
 root.RiverXR={install};
})(globalThis);
