/* Prism-only spatial furniture. No hub code, portal, camera parenting or game-state writes.
 * Screen and XR controls use this same scene surface, rectangle map and command set. */
(function(root){'use strict';
 const VERSION='0.11.0',KEY='prism-current.rotunda.v1',WIDTH=1200,HEIGHT=814;
 const RECTS=Object.freeze([
  ...Array.from({length:8},(_,i)=>({x:i%2?631:56,y:306+Math.floor(i/2)*122,w:513,h:90})),
  ...Array.from({length:4},(_,i)=>({x:32+i*292,y:209,w:268,h:63})),
  {x:924,y:30,w:244,h:59},{x:924,y:101,w:244,h:59}
 ].map(Object.freeze));
 const clamp=(v,a,b,d)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
 function preferences(raw){let v={};try{v=JSON.parse(raw||'{}')||{};}catch{}
  return {height:clamp(v.height,-.85,.40,-.27),distance:clamp(v.distance,.85,2.4,1.55),size:clamp(v.size,.65,1.25,.86),yaw:clamp(v.yaw,-1.05,1.05,0),hud:v.hud==='floor'?'floor':'wrist',opacity:clamp(v.opacity,.08,.9,.38)};
 }
 function hit(u,v){if(!Number.isFinite(u)||!Number.isFinite(v))return -1;const x=u*WIDTH,y=(1-v)*HEIGHT;return RECTS.findIndex(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
 function navigate(index,dx,dy){return (index+(dy?dy*2:dx)+RECTS.length)%RECTS.length;}
 function install(g,menu,hud){const T=g.T,scene=g.el,stage=g.art.stage;let prefs=preferences(null);try{prefs=preferences(localStorage.getItem(KEY));}catch{}
  const root3D=new T.Group(),lift=new T.Group(),base=new T.Group();root3D.name='prism-rotunda-anchor';lift.name='prism-rotunda-lift';scene.object3D.add(root3D);root3D.add(lift,base);lift.add(menu.mesh);
  menu.mesh.position.set(0,0,0);menu.mesh.rotation.set(0,0,0);menu.mesh.scale.setScalar(1);menu.mesh.material.depthTest=false;menu.mesh.renderOrder=31;
  const ownedG=[],ownedM=[];const ownG=v=>(ownedG.push(v),v),ownM=v=>(ownedM.push(v),v);
  const dark=ownM(new T.MeshStandardMaterial({color:0x173946,roughness:.32,metalness:.55})),edge=ownM(new T.MeshBasicMaterial({color:0x92e9cb})),buttonMaterial=ownM(new T.MeshBasicMaterial({color:0x365c64,depthTest:false}));
  const cylinder=ownG(new T.CylinderGeometry(1,1,1,48)),box=ownG(new T.BoxGeometry(1,1,1)),torus=ownG(new T.TorusGeometry(.58,.008,6,64));
  const disc=new T.Mesh(cylinder,dark);disc.scale.set(.60,.03,.60);base.add(disc);const ring=new T.Mesh(torus,edge);ring.rotation.x=-Math.PI/2;ring.position.y=.021;base.add(ring);
  const stem=new T.Mesh(cylinder,dark);stem.scale.set(.033,1,.033);root3D.add(stem);
  const bevels=RECTS.map(r=>{const m=new T.Mesh(box,buttonMaterial);m.position.set(((r.x+r.w/2)/WIDTH-.5)*1.68,(.5-(r.y+r.h/2)/HEIGHT)*1.14,-.018);m.scale.set(r.w/WIDTH*1.68+.012,r.h/HEIGHT*1.14+.012,.045);m.renderOrder=30;menu.mesh.add(m);return m;});
  const aimMarker=new T.Mesh(ownG(new T.RingGeometry(.017,.025,20)),ownM(new T.MeshBasicMaterial({color:0xd6fff0,depthTest:false,depthWrite:false,side:T.DoubleSide})));aimMarker.name='prism-scene-reticle';aimMarker.renderOrder=25;aimMarker.visible=false;scene.object3D.add(aimMarker);
  const hudBack=new T.Mesh(box,dark);hudBack.scale.set(1.80,.32,.025);hudBack.position.z=-.018;hud.mesh.add(hudBack);hud.mesh.name='prism-controller-status';hud.mesh.renderOrder=25;
  let page='play',progress=1,lastStamp=0,lastPaint='',focus=4,hover=-1,lastPhase='',headHeight=1.65,disposed=false,snapshot=null,lastHud=0,notice='',noticeAt=0,oldScore=0,oldHealth=100,oldRun=null;
  let textControls=false;const support={ar:false,vr:false};
  const wrap=document.getElementById('scene-wrap'),ray=new T.Raycaster();ray.far=9;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{notice='Layout applies for this session; storage is unavailable.';}lastPaint='';}
  function reset(){prefs={...preferences(null),opacity:prefs.opacity,hud:prefs.hud};save();}
  function anchor(viewer){const p=viewer?.transform?.position||{x:g.playerX||0,y:1.65-(g.crouch||0),z:0},q=viewer?.transform?.orientation||{x:0,y:0,z:0,w:1};headHeight=Math.max(.65,p.y);
   const f=new T.Vector3(0,0,-1).applyQuaternion(new T.Quaternion(q.x,q.y,q.z,q.w));root3D.position.set(p.x,0,p.z);root3D.rotation.set(0,Math.hypot(f.x,f.z)>.001?Math.atan2(-f.x,-f.z):root3D.rotation.y,0);root3D.updateMatrixWorld(true);lastPaint='';
  }
  function summon(viewer){anchor(viewer);page='play';focus=0;hover=-1;progress=0;lastPaint='';}
  function defaultAction(i){if(g.immersive)return false;
   if(page==='play'&&g.phase==='menu'){
    if(i<6){const chapter=i%2?'mothership':'duck-armada',mode=i<2?'ar':i<4?'vr':'screen';g.cancel();g.chapter=chapter;g.sync();if(mode==='screen')g.start();else if(support[mode])g.xr.enter(mode==='ar');else g.notice(mode.toUpperCase()+' is unavailable here. Select another supported mode.');return true;}
    page=i===6?'sound':'help';return true;
   }
   if(i===0){if(g.phase==='paused'&&['ar','vr'].includes(g.runMode)&&!g.immersive)g.xr.enter(g.runMode==='ar');else g.phase==='paused'?g.resume():g.start();}
   if(i===1){g.cancel();g.chapter=g.chapter==='duck-armada'?'mothership':'duck-armada';g.sync();}
   if(i===2){anchor();reset();}if(i===3)g.cancel();if(i===4)g.music(-.1);if(i===5)g.music(.1);if(i===6){g.quiet=!g.quiet;g.sync();}if(i===7){g.cruise=!g.cruise;g.cancel();g.sync();}return true;
  }
  function action(i){if(i<0||i>=RECTS.length||g.phase==='playing'||g.busy)return false;
   if(i>=8&&i<12){page=['play','layout','sound','help'][i-8];focus=0;lastPaint='';return true;}
   if(i===12){reset();return true;}if(i===13){prefs.hud=prefs.hud==='wrist'?'floor':'wrist';save();return true;}
   if(page==='layout'){
    if(i===0||i===1)prefs.height=clamp(prefs.height+(i===0?.10:-.10),-.85,.4,-.27);
    if(i===2||i===3)prefs.distance=clamp(prefs.distance+(i===2?-.10:.10),.85,2.4,1.55);
    if(i===4||i===5)prefs.size=clamp(prefs.size+(i===4?.05:-.05),.65,1.25,.86);
    if(i===6||i===7)prefs.yaw=clamp(prefs.yaw+(i===6?-.15:.15),-1.05,1.05,0);save();return true;
   }
   if(page==='sound'){
    if(i===0||i===1)g.music(i===0?-.1:.1);
    if(i===2||i===3)g.audio.effectLevel(Math.max(0,Math.min(1,g.audio.effectsVolume+(i===2?-.1:.1))));
    if(i===4||i===5){prefs.opacity=clamp(prefs.opacity+(i===4?-.08:.08),.08,.9,.38);save();}
    if(i===6){g.quiet=!g.quiet;g.sync();}if(i===7){g.quality=g.quality==='light'?'balanced':'light';g.sync();}lastPaint='';return true;
   }
   if(page==='help'){
    if(i===0){page='play';lastPaint='';}if(i===1){g.cruise=!g.cruise;g.cancel();g.sync();}
    if(i===2&&!g.immersive)location.href='./rhythm.html';if(i===3&&!g.immersive)location.href='./water-mission/index.html';
    if(i===4&&!g.immersive){textControls=true;document.body.classList.add('text-controls');document.getElementById('play').focus();}
    if(i===5){prefs.hud=prefs.hud==='wrist'?'floor':'wrist';save();}if(i===6){page='sound';lastPaint='';}if(i===7){page='layout';lastPaint='';}return true;
   }
   return defaultAction(i);
  }
  function labels(){
   if(page==='layout')return ['Raise panel','Lower panel','Bring closer','Move farther','Larger panel','Smaller panel','Rotate left','Rotate right'];
   if(page==='sound')return ['Music - '+Math.round(g.audio.volume*100)+'%','Music +','Effects - '+Math.round(g.audio.effectsVolume*100)+'%','Effects +','AR opacity - '+Math.round(prefs.opacity*100)+'%','AR opacity +',g.quiet?'Motion: still':'Motion: flowing',g.quality==='light'?'Quality: Light':'Quality: Balanced'];
   if(page==='help')return ['Back to battle',g.cruise?'Cruise / separate scores':'Arcade / switch to Cruise',g.immersive?'Classic: exit XR first':'Classic rhythm',g.immersive?'Expedition: exit XR first':'Water expedition',g.immersive?'Hands: menus only':'Accessible text controls','Wrist / floor HUD','Sound and water','Panel placement'];
   if(!g.immersive&&g.phase==='menu')return [support.ar?'Duck Armada / AR':'AR unavailable',support.ar?'Mothership / AR':'AR unavailable',support.vr?'Duck Armada / VR':'VR unavailable',support.vr?'Mothership / VR':'VR unavailable','Duck Armada / Screen','Mothership / Screen','Sound and water','Controls and older modes'];
   return [g.busy?'Preparing...':g.phase==='paused'?'Resume battle':'Start battle','Other chapter',g.immersive?'Recenter stage':'Reset placement',g.immersive?'Exit headset':'Chapter selection','Music -','Music +',g.quiet?'Motion: still':'Motion: flowing',g.cruise?'Cruise / no fail':'Arcade: health'];
  }
  function draw(f=focus,hov=[]){if(g.phase==='playing')return;focus=f;const s=g.state,key=[page,g.phase,g.chapter,g.message,g.audio.volume,g.audio.effectsVolume,g.quiet,g.cruise,g.quality,JSON.stringify(prefs),focus,...hov,s?.score,s?.health,s?.mode,support.ar,support.vr].join('|');if(key===lastPaint)return;lastPaint=key;
   const c=menu.context;c.clearRect(0,0,menu.canvas.width,menu.canvas.height);c.save();c.scale(menu.canvas.width/WIDTH,menu.canvas.height/HEIGHT);c.fillStyle='#102b3ff5';c.fillRect(0,0,WIDTH,HEIGHT);c.strokeStyle='#84dcbf';c.lineWidth=3;c.strokeRect(2,2,WIDTH-4,HEIGHT-4);
   c.fillStyle='#b9ffe1';c.font='600 25px system-ui';c.fillText('RIVER PRISM / ROTUNDA '+VERSION,32,48);c.fillStyle='#ffffff';c.font='600 43px system-ui';c.fillText(page==='play'?(g.chapter==='mothership'?'Mothership Channel':'Duck Armada'):page==='layout'?'Place it where you want it.':page==='sound'?'Sound and transparent water.':'Cut. Shoot. Shield. Move.',32,110);
   c.fillStyle='#d5ede4';c.font='22px system-ui';let detail=g.immersive?'Trigger or pinch selects. Sticks navigate. A/X confirms. B/Y resumes.':'Click a 3D button, or use D-pad and A. P / Menu pauses; F2 text controls.';
   if(page==='help')detail=g.immersive?'Swing: cut. Triggers: laser. Grips: shield. B/Y: pause.':g.padId!==null?'Right stick: aim. A/X: cut. D-pad: direction. Menu: pause.':'Drag: cut. F: swap blade. Right mouse: fire. Q/E: shield. P: pause.';
   if(page==='layout')detail=g.immersive?'Panel stays planted. Stick click resets placement. Your camera never moves.':'Panel stays planted. Home resets placement. F2 opens text controls.';
   c.fillText(detail,32,171);c.font='20px system-ui';const message=['complete','failed','escaped'].includes(g.phase)?`${s?.score||0} POINTS / ${g.phase==='complete'?'BOSS DEFEATED':g.phase==='failed'?'HULL LOST':'BOSS ESCAPED'}`:page==='help'?'Red bombs: shoot or shield. Pink bolts: shield, reflect or dodge.':page==='sound'?'Changing volume, opacity or layout never restarts the current encounter.':g.message;
   c.fillText(message.slice(0,102),32,199);
   const names=[...labels(),'Battle','Placement','Sound / water','Controls','Reset panel',prefs.hud==='wrist'?'HUD: wrist':'HUD: floor'];
   for(let i=0;i<RECTS.length;i++){const r=RECTS[i],selected=i===focus,tab=i>=8&&i<12&&['play','layout','sound','help'][i-8]===page;c.fillStyle=selected?'#b4ffe1':hov.includes(i)?'#518b80':tab?'#3d6d6a':'#244b62';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle=selected?'#ffffff':'#5e9090';c.lineWidth=selected?5:2;c.strokeRect(r.x,r.y,r.w,r.h);c.fillStyle=selected?'#0d2d39':'#ffffff';c.font=(i<8?'600 25px':'600 22px')+' system-ui';c.fillText(names[i],r.x+16,r.y+r.h*.62,r.w-30);}
   c.restore();menu.texture.needsUpdate=true;
  }
  function screenPoint(e){const r=wrap.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),scene.camera);menu.mesh.updateWorldMatrix(true,false);const h=ray.intersectObject(menu.mesh,false)[0];return h?.uv?hit(h.uv.x,h.uv.y):-1;}
  let pressed=-1;
  function pointer(e){if(g.immersive||textControls)return;if(g.phase==='playing')return;e.stopImmediatePropagation();e.preventDefault();const index=screenPoint(e);if(index>=0){focus=index;hover=index;draw(focus,[index]);}else hover=-1;
   if(e.type==='pointerdown'){pressed=index;wrap.setPointerCapture(e.pointerId);}
   if(e.type==='pointerup'){if(wrap.hasPointerCapture(e.pointerId))wrap.releasePointerCapture(e.pointerId);if(index>=0&&index===pressed)action(index);pressed=-1;draw();}
  }
  function key(e){if(g.immersive)return;if(e.code==='F2'){e.preventDefault();e.stopImmediatePropagation();textControls=!textControls;document.body.classList.toggle('text-controls',textControls);if(!textControls){anchor();wrap.focus();}return;}if(textControls||g.phase==='playing')return;if(e.code==='Home'){e.preventDefault();e.stopImmediatePropagation();reset();anchor();draw();return;}
   const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.code in dirs||e.code==='Tab'||e.code==='Enter'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;if(e.code in dirs)focus=navigate(focus,...dirs[e.code]);else if(e.code==='Tab')focus=navigate(focus,e.shiftKey?-1:1,0);else action(focus);draw();}
  }
  for(const type of ['pointermove','pointerdown','pointerup'])wrap.addEventListener(type,pointer,true);window.addEventListener('keydown',key,true);
  function pad(dir,confirm,back){if(textControls)return false;if(dir){focus=navigate(focus,Math.abs(dir)===2?dir/2:0,Math.abs(dir)===1?dir:0);draw();}if(confirm)action(focus);if(back){if(page!=='play'){page='play';draw();}else g.phase==='paused'?g.resume():g.cancel();}return true;}
  function update(input,viewer){if(disposed)return;const now=performance.now(),dt=Math.min(.05,(now-lastStamp)/1000||0);lastStamp=now;
   const open=g.phase!=='playing';if(g.phase!==lastPhase){if(open&&lastPhase==='playing')summon(viewer);else if(!g.immersive&&open)anchor();lastPhase=g.phase;lastPaint='';}
   const visible=g.immersive||!textControls;root3D.visible=visible;aimMarker.visible=!g.immersive&&!textControls&&g.phase==='playing';if(aimMarker.visible)aimMarker.position.copy(g.point(-2));
   progress=Math.min(1,Math.max(0,progress+(open?1:-1)*dt/0.22));const ease=g.quiet?(open?1:0):progress*progress*(3-2*progress);
   const height=Math.max(.48,Math.min(1.9,headHeight+prefs.height));base.position.set(Math.sin(prefs.yaw)*prefs.distance,.018,-Math.cos(prefs.yaw)*prefs.distance);base.scale.setScalar(open?1:.25);
   lift.position.set(base.position.x,.055+(height-.055)*ease,base.position.z);lift.rotation.set(-Math.PI/2+ease*(Math.PI/2-.18),-prefs.yaw,0);const fit=g.immersive?prefs.size:Math.min(prefs.size,prefs.distance*Math.tan((scene.camera.fov||68)*Math.PI/360)*Math.min(scene.camera.aspect||1,1.4)*1.06);lift.scale.setScalar(fit*(.10+.90*ease));
   menu.mesh.visible=visible&&open;stem.visible=visible&&open;stem.position.set(base.position.x,lift.position.y/2,base.position.z);stem.scale.y=Math.max(.01,lift.position.y);
   if(!g.immersive){draw(focus,hover>=0?[hover]:[]);}const s=g.state;hud.mesh.visible=visible&&!!s&&g.phase==='playing';
   if(g.immersive&&prefs.hud==='wrist'&&input?.hands?.[0]?.pose){const h=input.hands[0];hud.mesh.position.fromArray(h.pose.a);hud.mesh.position.y+=.15;hud.mesh.position.z+=.10;if(h.gripQuaternion)hud.mesh.quaternion.fromArray(h.gripQuaternion);else hud.mesh.quaternion.identity();hud.mesh.rotateX(-.45);hud.mesh.scale.set(.29,.57,1);}
   else{const v=new T.Vector3(base.position.x,g.immersive?.30:.90,base.position.z+(g.immersive?.15:-.40));root3D.localToWorld(v);stage.worldToLocal(v);hud.mesh.position.copy(v);const q=root3D.getWorldQuaternion(new T.Quaternion()),parentQ=stage.getWorldQuaternion(new T.Quaternion()).invert();hud.mesh.quaternion.copy(parentQ.multiply(q));hud.mesh.rotateX(-.70);hud.mesh.scale.set(.56,.85,1);}
   if(oldRun!==s){oldRun=s;oldScore=s?.score||0;oldHealth=s?.health||100;notice='';}if(s&&s.score!==oldScore){notice='+'+(s.score-oldScore)+' points';oldScore=s.score;noticeAt=now;}if(s&&s.health<oldHealth){notice='-'+(oldHealth-s.health)+' hull / incoming hazard';oldHealth=s.health;noticeAt=now;}
   if(now-lastHud>130){lastHud=now;const c=hud.context,w=hud.canvas.width,h=hud.canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#112d40f5';c.fillRect(0,0,w,h);c.fillStyle='#b6ffe0';c.font='700 53px system-ui';c.fillText(`${s?.score||0} POINTS   ${s?.health??100} HULL   ${s?.combo||0}x`,25,64);c.font='30px system-ui';c.fillStyle='#ffffff';c.fillText(now-noticeAt<1600?notice:(s?RiverCore.phase(g.chapter,s.time).name:'River Prism'),25,117);c.font='23px system-ui';c.fillText(g.immersive?'B / Y: rotunda     Trigger: laser     Grip: shield':g.padId!==null?'Menu: rotunda     LT/RT: laser     LB/RB: shield':'P: rotunda     F: blade     Right mouse: laser     Q/E: shield',25,163);hud.texture.needsUpdate=true;}
   root3D.updateMatrixWorld(true);hud.mesh.updateMatrixWorld(true);
   snapshot={page,focus,open,progress,preferences:{...prefs},anchor:root3D.position.toArray(),anchorRotation:root3D.rotation.toArray().slice(0,3),menuPosition:menu.mesh.getWorldPosition(new T.Vector3()).toArray(),hudPosition:hud.mesh.getWorldPosition(new T.Vector3()).toArray(),hudVisible:hud.mesh.visible,headAttached:false,textControls};
  }
  function setSupport(mode,v){support[mode]=v;if(v&&!g.immersive&&g.phase==='menu'&&page==='play')focus=support.ar?0:2;lastPaint='';}
  anchor();document.body.classList.add('scene-ui');
  const api={action,draw,update,summon,reset,pad,setSupport,hit,navigate,menu:menu.mesh,root:root3D,get prefs(){return prefs},get diagnostics(){return snapshot},get textControls(){return textControls},get focus(){return focus},dispose(){if(disposed)return;disposed=true;for(const type of ['pointermove','pointerdown','pointerup'])wrap.removeEventListener(type,pointer,true);window.removeEventListener('keydown',key,true);root3D.removeFromParent();aimMarker.removeFromParent();for(const v of ownedG)v.dispose();for(const v of ownedM)v.dispose();document.body.classList.remove('scene-ui');}};
  g.dock=api;return api;
 }
 const api={VERSION,KEY,WIDTH,HEIGHT,RECTS,preferences,hit,navigate,install};root.RiverRotunda=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
