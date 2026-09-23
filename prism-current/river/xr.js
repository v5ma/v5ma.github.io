/* River Prism XR UI 0.12.2. Pick the rendered panel's UV, not a second set of
   invisible button meshes. Native select events and polled inputs share a latch.
   Grip shields / trigger lasers are unchanged. No forced gameplay head motion. */
(function(root){'use strict';
 const VERSION='0.13.0',WIDTH=1200,HEIGHT=814;
 const RECTS=Object.freeze(Array.from({length:8},(_,i)=>Object.freeze({x:i%2?631:56,y:306+Math.floor(i/2)*122,w:513,h:90})));
 const list=value=>Array.from(value||[]);
 function actionAtUV(u,v){if(!Number.isFinite(u)||!Number.isFinite(v))return -1;const x=u*WIDTH,y=(1-v)*HEIGHT;return RECTS.findIndex(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
 function navigate(index,dx,dy){const col=index%2,row=Math.floor(index/2);return ((row+dy+4)%4)*2+Math.max(0,Math.min(1,col+dx));}
 function stick(gamepad){const a=list(gamepad?.axes),offset=a.length>=4?2:0,x=Number(a[offset])||0,y=Number(a[offset+1])||0;if(Math.max(Math.abs(x),Math.abs(y))<.55)return [0,0];return Math.abs(x)>Math.abs(y)?[Math.sign(x),0]:[0,Math.sign(y)];}
 function colorEdge(phase,old,buttons,tracked=true){return phase==='playing'&&tracked&&!!old?.playing&&!!old?.tracked&&!!buttons?.[4]&&!old.btn?.[4];}
 function controllerHands(input){return new Set(list(input).filter(s=>s.gripSpace&&!s.hand&&['left','right'].includes(s.handedness)).map(s=>s.handedness));}
 function install(g){const T=g.T,scene=g.el,stage=g.art.stage,prior=new Map(),sources={},menu=g.art.panel(1.68,1.14),hud=g.art.panel(1.75,.28),ray=new T.Raycaster();
  let session=null,referenceSpace=null,calibrated=false,viewer=null,missing=null,centeredOnce=false,lastPaint=0,lastText='',focus=0,focusMode='pointer',lastPhase='',lastAction=-Infinity,actions=0,tracked=new Set();
  const queued=new Set(),nativeHeld=new Set(),latched=new Set(),fireArmed=[false,false],hover=[-1,-1];
  menu.mesh.name='river-xr-menu';menu.mesh.position.set(0,1.48,-1.95);hud.mesh.position.set(0,2.25,-1.9);menu.mesh.visible=hud.mesh.visible=false;ray.far=8;
  const dock=root.RiverRotunda?.install(g,menu,hud);
  const rays=[0,1].map(h=>{const geo=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-2)]),m=new T.Line(geo,new T.LineBasicMaterial({color:h?0xffb4d3:0x9affdf,transparent:true,opacity:1,depthTest:false,depthWrite:false}));m.name='river-xr-ray-'+h;m.renderOrder=50;m.frustumCulled=false;scene.object3D.add(m);m.visible=false;return m;});
  const cursors=[0,1].map(h=>{const m=new T.Mesh(new T.SphereGeometry(.024,10,6),new T.MeshBasicMaterial({color:h?0xffb4d3:0x9affdf,transparent:true,opacity:1,depthTest:false,depthWrite:false}));m.name='river-xr-cursor-'+h;m.renderOrder=51;m.frustumCulled=false;scene.object3D.add(m);m.visible=false;return m;});
  function clear(){prior.clear();queued.clear();nativeHeld.clear();latched.clear();fireArmed.fill(false);hover.fill(-1);missing=null;for(const r of [...rays,...cursors])r.visible=false;}
  function placeMenu(){if(!viewer)return;if(dock){dock.summon(viewer);focus=0;focusMode='pointer';hover.fill(-1);lastText='';return;}stage.updateWorldMatrix(true,false);const p=viewer.transform.position,q=viewer.transform.orientation,world=scene.object3D.localToWorld(new T.Vector3(p.x,p.y,p.z)),forward=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));forward.y=0;forward.normalize();const target=scene.object3D.localToWorld(new T.Vector3(p.x,p.y-.17,p.z).addScaledVector(forward,1.95));menu.mesh.position.copy(stage.worldToLocal(target));const head=stage.worldToLocal(world),d=menu.mesh.position.clone().sub(head);menu.mesh.rotation.set(0,Math.atan2(-d.x,-d.z),0);menu.mesh.updateWorldMatrix(true,false);focus=0;focusMode='pointer';hover.fill(-1);lastText='';}
  function recenter(){if(!viewer)return;g.pauseRun('Stage recentered. Check your clear space before resuming.');const p=viewer.transform.position,q=viewer.transform.orientation,f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));stage.position.set(p.x,p.y-1.65,p.z);stage.rotation.y=Math.atan2(-f.x,-f.z);stage.updateMatrixWorld(true);calibrated=true;g.clearInputs();fireArmed.fill(false);placeMenu();}
  function action(i,direct=false){if(!session||session.visibilityState!=='visible'||(!direct&&performance.now()-lastAction<120))return;if(i<0||i> (dock?13:7))return;lastAction=performance.now();actions++;if(dock?.action(i)){lastText='';return;}
   if(i===0){if(g.busy||g.phase==='loading')return;if(!calibrated)recenter();if(!calibrated||controllerHands(session.inputSources).size<2||tracked.size<2){g.notice('Use both tracked controllers to fight. One controller or hands can use this menu.');return;}g.phase==='paused'?g.resume():g.start();}
   if(i===1){g.cancel();g.chapter=g.chapter==='duck-armada'?'mothership':'duck-armada';g.sync();}if(i===2)recenter();if(i===3)scene.exitVR();if(i===4)g.music(-.1);if(i===5)g.music(.1);if(i===6){g.quiet=!g.quiet;g.sync();}if(i===7){g.cruise=!g.cruise;g.cancel();g.notice('Mode changed. Start a fresh battle.');g.sync();}lastText='';
  }
  function panel(){if(dock){dock.draw(focus,hover);return;}const key=[g.phase,g.chapter,g.message,g.quiet,g.cruise,g.audio.volume,focus,...hover].join('|');if(key===lastText)return;lastText=key;const c=menu.context,w=menu.canvas.width,h=menu.canvas.height;c.clearRect(0,0,w,h);c.save();c.scale(w/WIDTH,h/HEIGHT);c.fillStyle='#102b3ff5';c.fillRect(0,0,WIDTH,HEIGHT);c.strokeStyle='#87ddc4';c.lineWidth=4;c.strokeRect(2,2,WIDTH-4,HEIGHT-4);c.fillStyle='#a7fbe1';c.font='600 28px system-ui';c.fillText('RIVER PRISM / XR UI '+VERSION+' / '+(scene.is('ar-mode')?'AR':'VR'),32,43);c.fillStyle='#ffffff';c.font='600 47px system-ui';c.fillText(g.chapter==='mothership'?'Mothership Channel':'Duck Armada',32,104);c.font='24px system-ui';c.fillStyle='#c9e2df';c.fillText('Point + trigger, or thumbstick + A / X to select.',32,150);c.fillText('B / Y: start or resume. During battle: B / Y pauses.',32,189);c.font='21px system-ui';c.fillText(g.message.slice(0,88),32,244);
   const labels=[g.busy?'Preparing...':g.phase==='paused'?'Resume battle':'Start battle','Other chapter','Recenter stage','Exit headset','Music -','Music +',g.quiet?'Motion: quiet':'Motion: flowing',g.cruise?'Cruise: no fail':'Arcade: health'];
   for(let i=0;i<8;i++){const r=RECTS[i],selected=i===focus;c.fillStyle=selected?'#a7f5d4':hover.includes(i)?'#39736e':'#244b62';c.fillRect(r.x,r.y,r.w,r.h);if(selected){c.strokeStyle='#ffffff';c.lineWidth=4;c.strokeRect(r.x-5,r.y-5,r.w+10,r.h+10);}c.fillStyle=selected?'#103344':'#ffffff';c.font='600 26px system-ui';c.fillText(labels[i],r.x+20,r.y+56);}c.restore();menu.texture.needsUpdate=true;
  }
  async function enter(ar){const mode=ar?'ar':'vr';const preserve=g.phase==='paused'&&g.state&&g.runMode===mode;if(!preserve)g.cancel();try{g.audio.context().resume().catch(()=>{});await(ar?scene.enterAR():scene.enterVR());}catch(e){g.notice('Headset entry did not open: '+e.message);}}
  document.getElementById('enter-vr').onclick=()=>enter(false);document.getElementById('enter-ar').onclick=()=>enter(true);
  if(navigator.xr)for(const [mode,id]of[['immersive-vr','enter-vr'],['immersive-ar','enter-ar']])navigator.xr.isSessionSupported(mode).then(ok=>{document.getElementById(id).disabled=!ok;dock?.setSupport(mode==='immersive-ar'?'ar':'vr',ok);}).catch(()=>{});
  function visibility(){if(session?.visibilityState!=='visible'){if(g.phase==='loading')g.cancel();else g.pauseRun('Headset hidden. Resume when ready.');g.clearInputs();clear();}}
  function reset(){calibrated=false;g.pauseRun('Reference space changed. Recenter the stage.');g.clearInputs();clear();}
  function selectStart(e){if(session?.visibilityState==='visible'){queued.add(e.inputSource);nativeHeld.add(e.inputSource);}}
  function selectEnd(e){nativeHeld.delete(e.inputSource);}
  function changed(e){for(const src of list(e.removed)){prior.delete(src);queued.delete(src);nativeHeld.delete(src);latched.delete(src);}fireArmed.fill(false);g.previous=[null,null];}
  function entered(){session=scene.renderer.xr.getSession();if(!(g.phase==='paused'&&g.state&&g.runMode===(scene.is('ar-mode')?'ar':'vr')))g.cancel();g.immersive=true;calibrated=false;centeredOnce=false;lastPhase='';lastAction=-Infinity;actions=0;clear();g.clearInputs();document.body.classList.add('immersive');scene.renderer.setClearColor(0x000000,scene.is('ar-mode')?0:1);
   if(scene.is('ar-mode')&&!['alpha-blend','additive'].includes(session?.environmentBlendMode)){g.notice('This session is opaque, not passthrough AR.');scene.exitVR();return;}session?.addEventListener('visibilitychange',visibility);session?.addEventListener('selectstart',selectStart);session?.addEventListener('selectend',selectEnd);session?.addEventListener('inputsourceschange',changed);g.notice('Point + trigger, or thumbstick + A/X. B/Y starts directly.');}
  function detach(){session?.removeEventListener('visibilitychange',visibility);session?.removeEventListener('selectstart',selectStart);session?.removeEventListener('selectend',selectEnd);session?.removeEventListener('inputsourceschange',changed);referenceSpace?.removeEventListener('reset',reset);referenceSpace=null;}
  function exited(){detach();session=null;g.immersive=false;calibrated=false;viewer=null;clear();if(g.phase==='loading')g.cancel();else g.pauseRun('Headset ended. Re-enter the same mode to resume this battle.');g.clearInputs();stage.position.set(0,0,0);stage.rotation.set(0,0,0);stage.updateMatrixWorld(true);document.body.classList.remove('immersive');scene.renderer.setClearColor(0x0a182c,1);menu.mesh.visible=hud.mesh.visible=false;g.notice(g.state?'Battle paused. Re-enter '+g.runMode.toUpperCase()+' to resume, or choose another chapter.':'Headset ended. Choose a chapter.');dock?.summon(null);}
  scene.addEventListener('enter-vr',entered);scene.addEventListener('exit-vr',exited);
  function aimPose(pose){scene.object3D.updateWorldMatrix(true,false);const m=new T.Matrix4().fromArray(pose.transform.matrix),origin=new T.Vector3().setFromMatrixPosition(m),direction=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion().setFromRotationMatrix(m));scene.object3D.localToWorld(origin);direction.transformDirection(scene.object3D.matrixWorld);return {origin,direction};}
  function pointAt(aim,h){const r=rays[h],cursor=cursors[h];r.visible=true;ray.set(aim.origin,aim.direction);menu.mesh.updateWorldMatrix(true,false);const hit=ray.intersectObject(menu.mesh,false)[0],index=hit?.uv?(dock?dock.hit(hit.uv.x,hit.uv.y):actionAtUV(hit.uv.x,hit.uv.y)):-1;
   const a=scene.object3D.worldToLocal(aim.origin.clone()),b=scene.object3D.worldToLocal(hit?hit.point.clone():aim.origin.clone().addScaledVector(aim.direction,3));r.geometry.attributes.position.setXYZ(0,...a.toArray());r.geometry.attributes.position.setXYZ(1,...b.toArray());r.geometry.attributes.position.needsUpdate=true;cursor.visible=!!hit;if(hit)cursor.position.copy(b);if(index>=0&&index!==hover[h]){focus=index;focusMode='pointer';}hover[h]=index;return index;
  }
  function collect(t){const output={hands:[null,null],body:[0,1.45,0]};menu.mesh.visible=!!session&&g.phase!=='playing';hud.mesh.visible=!!session;if(!session)return output;
   const frame=scene.frame,space=scene.renderer.xr.getReferenceSpace();if(space!==referenceSpace){referenceSpace?.removeEventListener('reset',reset);referenceSpace=space;space?.addEventListener('reset',reset);}if(!frame||!space)return output;viewer=frame.getViewerPose(space);if(!viewer){g.pauseRun('Head tracking unavailable.');g.clearInputs();clear();return output;}if(!centeredOnce){centeredOnce=true;recenter();}if(session.visibilityState!=='visible'){visibility();return output;}
   if(g.phase!==lastPhase){if(g.phase==='playing')fireArmed.fill(false);else if(lastPhase==='playing')placeMenu();lastPhase=g.phase;}
   const p=viewer.transform.position,head=stage.worldToLocal(scene.object3D.localToWorld(new T.Vector3(p.x,p.y,p.z)));output.body=[head.x,head.y-.2,head.z];
   const input=list(session.inputSources),active=new Set(input);for(const src of prior.keys())if(!active.has(src)){prior.delete(src);queued.delete(src);nativeHeld.delete(src);latched.delete(src);}tracked=new Set();let requested=-1,pausePressed=false,directAction=false;
   for(const r of [...rays,...cursors])r.visible=false;
   for(const src of input){const h=src.handedness==='right'?1:0,old=prior.get(src),aim=src.targetRaySpace&&frame.getPose(src.targetRaySpace,space),pose=src.gripSpace&&frame.getPose(src.gripSpace,space),btn=list(src.gamepad?.buttons).map(x=>!!x.pressed||x.value>.55),was=old?.btn||btn;let pinch=false;
    if(src.hand){const a=src.hand.get('thumb-tip'),b=src.hand.get('index-finger-tip'),pa=a&&frame.getJointPose?.(a,space),pb=b&&frame.getJointPose?.(b,space);if(pa&&pb){const p=pa.transform.position,q=pb.transform.position;pinch=Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.025;}}
    const down=!!btn[0]||nativeHeld.has(src)||pinch,event=queued.delete(src),clicked=(event||!!old&&!old.primary&&down)&&!latched.has(src);if(clicked||(!old&&down))latched.add(src);if(!down&&!event)latched.delete(src);
    const ap=aim?aimPose(aim):pose?aimPose(pose):null;let hit=-1;if(g.phase!=='playing'&&ap)hit=pointAt(ap,h);else hover[h]=-1;
    const direction=stick(src.gamepad),stamp=performance.now(),dir=direction.join(','),oldDir=old?.dir||'0,0';let repeatAt=old?.repeatAt||0;
    if(g.phase!=='playing'){
     if(dir!=='0,0'&&old&&(dir!==oldDir||stamp>=repeatAt)){focus=dock?dock.navigate(focus,...direction):navigate(focus,...direction);focusMode='stick';repeatAt=stamp+(dir!==oldDir?380:160);}
     if(btn[3]&&!was[3]&&dock){dock.reset();placeMenu();}
     if(btn[5]&&!was[5]){if(dock) dock.action(8);requested=0;directAction=true;}
     else if(btn[4]&&!was[4]&&requested<0)requested=focus;
     else if(clicked&&requested<0)requested=hit>=0?hit:focusMode==='stick'?focus:-1;
    }else if(btn[5]&&!was[5])pausePressed=true;
    const raised=btn[1]?(was[1]&&old?old.raised:t):t;
    if(!src.hand&&pose&&!pose.emulatedPosition&&['left','right'].includes(src.handedness)){
     tracked.add(src.handedness);sources[h]=src;const m=new T.Matrix4().fromArray(pose.transform.matrix),a=stage.worldToLocal(scene.object3D.localToWorld(new T.Vector3(0,0,-.08).applyMatrix4(m))),b=stage.worldToLocal(scene.object3D.localToWorld(new T.Vector3(0,0,-.78).applyMatrix4(m))),normal=b.clone().sub(a).normalize();
     if(!down)fireArmed[h]=true;
     output.hands[h]={pose:{a:a.toArray(),b:b.toArray()},gripQuaternion:new T.Quaternion().setFromRotationMatrix(new T.Matrix4().copy(stage.matrixWorld).invert().multiply(scene.object3D.matrixWorld).multiply(m)).toArray(),origin:b.toArray(),direction:normal.toArray(),swapColor:colorEdge(g.phase,old,btn),fire:!!btn[0]&&fireArmed[h],shield:{active:!!btn[1],center:a.clone().addScaledVector(normal,.32).toArray(),normal:normal.toArray(),raised,hand:h}};
    }else{fireArmed[h]=false;g.previous[h]=null;}
    prior.set(src,{btn,primary:down||event,raised,dir,repeatAt,playing:g.phase==='playing',tracked:!src.hand&&!!pose&&!pose.emulatedPosition});
   }
   // One action per frame. A new B/Y edge is an explicit command, not a duplicate
   // pointer click: do not discard it behind the previous menu action debounce.
   // Held-button edge checks and native/polled selection latches stay unchanged.
   if(pausePressed){g.pauseRun('Paused. Point + trigger, or thumbstick + A/X. B/Y resumes.');placeMenu();}else if(requested>=0)action(requested,directAction);
   if(tracked.size<2&&g.phase==='playing'){missing??=performance.now();if(performance.now()-missing>220)g.pauseRun('Both controllers are needed for combat. Hands can use the paused menu.');}else missing=null;
   // The headset boundary remains authoritative. Ordinary room-scale dodging does not pause play.
   menu.mesh.visible=g.phase!=='playing';if(!menu.mesh.visible)for(const r of [...rays,...cursors])r.visible=false;
   panel();if(!dock&&performance.now()-lastPaint>150){lastPaint=performance.now();const c=hud.context,w=hud.canvas.width,h=hud.canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#112b40dd';c.fillRect(0,0,w,h);c.fillStyle='#d5fff1';c.font='600 30px system-ui';const s=g.state,p=RiverCore.phase(g.chapter,s?.time||0);c.fillText(s?`${s.score}   /   ${s.health} HULL   /   ${p.name}`:'SWING / LASER / SHIELD',25,50);c.font='23px system-ui';c.fillText((g.phase==='playing'?p.cue:g.message).slice(0,95),25,99);const boss=s?.entities.find(n=>n.type==='boss');c.fillText(boss?`${RiverCore.open(s,boss)?'CORE OPEN':'SHIELDED'}  /  ${boss.hp} HP`:s?.bossDefeated?'BOSS DOWN / FINISH THE SONG':'B / Y opens the menu. No automatic head movement.',25,147);hud.texture.needsUpdate=true;}
   dock?.update(output,viewer);return output;
  }
  function haptic(h){try{sources[h]?.gamepad?.hapticActuators?.[0]?.pulse(.18,40)?.catch?.(()=>{});}catch{}}
  return {collect,recenter,haptic,enter,activate:action,get session(){return session},get calibrated(){return calibrated},get diagnostics(){return {version:VERSION,rotunda:dock?.diagnostics,menuPage:dock?.diagnostics?.page,menuVisible:menu.mesh.visible,focus,focusMode,hover:[...hover],actions,inputCount:list(session?.inputSources).length,trackedControllers:tracked.size};},dispose(){detach();scene.removeEventListener('enter-vr',entered);scene.removeEventListener('exit-vr',exited);dock?.dispose();clear();for(const r of [...rays,...cursors]){r.removeFromParent();r.geometry.dispose();r.material.dispose();}}};
 }
 const api={VERSION,RECTS,actionAtUV,navigate,stick,colorEdge,controllerHands,install};root.RiverXR=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
