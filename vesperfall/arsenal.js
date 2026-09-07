/* Equipment and feedback for the existing A-Frame game, not a second renderer.
 * All damage, travel and consumables are resolved in VesperCore. */
(function(root){'use strict';
 const $=id=>document.getElementById(id),C=root.VesperCore,P=root.VesperChronicle;
 function install(g){
  const T=g.T,art=g.art,state={lastEvent:0,receipt:{},xrArmed:false,padShield:false,padTrigger:false,desktopTrigger:false};
  const shield=new T.Group();shield.name='Wardglass / directional shield';g.scene.object3D.add(shield);
  const face=new T.Mesh(new T.CircleGeometry(.59,12),new T.MeshStandardMaterial({color:'#76b7b0',metalness:.35,roughness:.3,side:T.DoubleSide,transparent:true,opacity:.24,depthWrite:false}));shield.add(face);
  const border=new T.Mesh(new T.TorusGeometry(.59,.035,6,36),art.mat('#c6a56b',.6));shield.add(border);
  const inner=new T.Mesh(new T.TorusGeometry(.37,.012,4,24),art.mat('#d4c392',.4));inner.position.z=.023;shield.add(inner);
  const boss=new T.Mesh(new T.OctahedronGeometry(.11),art.mat('#a1e3ce',.25,true));boss.position.z=.1;shield.add(boss);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,mesh=new T.Mesh(new T.BoxGeometry(.028,.43,.015),art.mat('#b3a47d',.3));mesh.position.set(Math.sin(a)*.30,Math.cos(a)*.30,.026);mesh.rotation.z=-a;shield.add(mesh);}shield.visible=false;
  const crossbow=new T.Group();crossbow.name='Bellsteel / deliberate reload crossbow';g.bowHolder.add(crossbow);
  function mesh(shape,color,x,y,z,sx,sy,sz){return art.mesh(shape,color,crossbow,x,y,z,sx,sy,sz);}
  mesh('box','#54483e',0,-.065,.06,.10,.12,.56);mesh('box','#a4b4b7',0,.005,-.20,.07,.025,.78);mesh('box','#3e454d',0,-.15,.12,.075,.19,.10);
  for(const side of[-1,1]){const limb=mesh('box','#bda878',side*.17,.015,-.47,.38,.035,.065);limb.rotation.y=-side*.25;mesh('box','#697886',side*.31,.015,-.43,.08,.05,.07);}
  const string=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-.34,.03,-.43),new T.Vector3(0,.03,.06),new T.Vector3(.34,.03,-.43)]),new T.LineBasicMaterial({color:'#e0d5b5'}));crossbow.add(string);
  const bolt=art.arrow();bolt.scale.setScalar(.65);bolt.position.set(0,.05,-.20);crossbow.add(bolt);
  const sight=mesh('ring','#dccb98',0,.09,-.36,.075,.075,.02);crossbow.visible=false;
  const particlePositions=new Float32Array(84*3);for(let i=0;i<84;i++){particlePositions[i*3]=(i*17.13%45)-22;particlePositions[i*3+1]=.5+i*.119;particlePositions[i*3+2]=-(i*11.7%55)+8;}
  const dust=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(particlePositions,3)),new T.PointsMaterial({size:.045,color:'#ceb694',transparent:true,opacity:.32,depthWrite:false}));dust.name='Pooled quiet embers';g.scene.object3D.add(dust);
  let choir=null,ambienceEnabled=false;
  function audio(){
   const enabled=$('audio').checked&&g.running&&!g.paused&&!document.hidden;
   if(enabled&&!choir){try{g.audio??=new (window.AudioContext||window.webkitAudioContext)();const ctx=g.audio,gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);const voices=[65.4,98.1,130.8].map((hz,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=hz;o.detune.value=(i-1)*4;o.connect(gain);o.start();return o;});choir={gain,voices,ctx};}catch{return;}}
   if(choir&&enabled!==ambienceEnabled){choir.gain.gain.setTargetAtTime(enabled?.004:0,choir.ctx.currentTime,.35);ambienceEnabled=enabled;}
  }
  $('audio').addEventListener('change',()=>{audio();if($('audio').checked)g.audio?.resume();});
  function forward(){return new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion())).toArray();}
  function active(){return g.running&&!g.paused&&g.game.phase==='playing';}
  function syncRig(){const local=g.head.object3D.position.clone().applyQuaternion(g.rig.quaternion);g.rig.position.set(g.game.p[0]-local.x,g.game.p[1],g.game.p[2]-local.z);}
  function ward(held,hand=null){
   if(!held||!active()||g.headBlocked){C.shield(g.game,null);return;}
   const dir=hand?new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray():forward(),head=g.head.object3D.getWorldPosition(new T.Vector3()).toArray();g.game.head=head;
   const p=hand?C.add(hand.p,C.mul(dir,.10)):C.add(C.add(head,[0,-.12,0]),C.mul(dir,.62));
   if(C.shield(g.game,{p,normal:dir})){g.latch.reset();g.desktopDraw=g.charge=0;g.drawArmed=false;}
  }
  function crossShot(hand=null){
   if(!active())return;const dir=hand?new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray():forward(),head=g.head.object3D.getWorldPosition(new T.Vector3()).toArray(),origin=hand?C.add(hand.p,C.mul(dir,.24)):C.add(head,C.mul(dir,.18));g.game.head=head;
   const before=g.game.shots;g.shoot(origin,dir,.9);if(before===g.game.shots&&!g.game.crossbow.loaded)g.toast('Crossbow empty. Press R / draw-stick click to wind a new bolt.');
  }
  function equip(){if(!active())return;g.cancel();C.setWeapon(g.game,g.game.weapon==='bow'?'crossbow':'bow');g.toast(g.game.weapon==='crossbow'?'Bellsteel crossbow · click to fire · R to reload':'Living bow · hold to draw · release to loose');}
  function shard(hand=null){if(!active())return;g.cancel();const dir=hand?new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray():forward();if(C.shard(g.game,dir)){syncRig();g.sound(280,.12,.024);}else g.toast('Shard step needs a charged shard and a clear supported route.');}
  function reload(){if(C.reload(g.game)){g.cancel();g.sound(140,.16,.023);}else if(g.game.weapon!=='crossbow')g.toast('R reloads the crossbow. V switches your weapon.');}
  function journal(){
   const p=P.clean(g.profile),list=$('chronicle-list');list.replaceChildren();
   for(const t of P.TASKS){const row=document.createElement('div');row.className=p[t.id]?'chronicle-earned':'chronicle-task';const label=document.createElement('strong');label.textContent=t.label+' · '+Math.min(p.stats[t.field],t.goal)+' / '+t.goal;const text=document.createElement('span');text.textContent=(p[t.id]?'UNLOCKED · ':'')+t.reward;row.append(label,text);list.append(row);}
   $('nightfall').disabled=!p.nightfall;if(!p.nightfall)$('nightfall').checked=false;
  }
  const oldBank=g.bank.bind(g);g.bank=function(){oldBank();const result=P.bank(g.profile,g.game,state.receipt,g.practice);g.profile=result.profile;state.receipt=result.receipt;if(!g.practice)g.profileSave();journal();if(result.unlocked.length)g.toast('Chronicle unlocked: '+result.unlocked.join(', ')+'. Available on your next run.');};
  const oldStart=g.start.bind(g);g.start=function(practice){if(g.running&&!g.practice)g.bank();state.receipt={};oldStart(practice);state.lastEvent=0;if(practice){g.game.volleyUnlocked=true;g.game.ammo.volley=8;}journal();};
  const oldCancel=g.cancel.bind(g);g.cancel=function(){oldCancel();C.shield(g.game,null);state.xrArmed=false;state.desktopTrigger=false;g.crossHeld=false;};
  const oldPause=g.setPaused.bind(g);g.setPaused=function(v){oldPause(v);state.padShield=false;audio();};
  const oldMenu=g.menuUI.bind(g);g.menuUI=function(){oldMenu();journal();};
  const oldType=g.setType.bind(g);g.setType=function(type){if(type==='volley'&&!g.game.volleyUnlocked){g.toast('Choirbreaker unlock: bank five warden kills across runs. Practice offers a trial quiver.');return;}oldType(type);if(type==='volley')g.toast('Volley · three physical arrows per charge. Practice quiver is separate from earned unlocks.');};
  const oldPad=g.standardPad.bind(g);g.standardPad=function(dt){oldPad(dt);if(!g.xr)ward(g.keys.KeyH||state.padShield);};
  const oldVisual=g.visuals.bind(g);g.visuals=function(){oldVisual();render();};
  const oldRemove=g.remove.bind(g);g.remove=function(){if(choir){for(const o of choir.voices)o.stop();choir.gain.disconnect();}oldRemove();};
  for(const [id,fn]of[['weapon-toggle',equip],['reload-action',reload],['shard-action',()=>shard()]])$(id).onclick=()=>{fn();g.scene.canvas.focus();};
  const guard=$('shield-action');guard.addEventListener('pointerdown',e=>{e.preventDefault();guard.setPointerCapture(e.pointerId);g.keys.KeyH=true;});for(const type of['pointerup','pointercancel','lostpointercapture'])guard.addEventListener(type,()=>{g.keys.KeyH=false;C.shield(g.game,null);});
  window.addEventListener('keydown',e=>{if(e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!active()||g.xr)return;if(e.code==='KeyV')equip();if(e.code==='KeyR')reload();if(e.code==='KeyB')shard();});
  $('lighting').onchange=()=>{const night=$('lighting').value==='twilight';g.scene.setAttribute('background','color',night?'#697583':'#bac9d1');g.scene.setAttribute('fog','color',night?'#697b89':'#abbcc8');const lights=g.scene.querySelectorAll('[light]');lights[0].setAttribute('light','intensity',night?.92:1.25);lights[1].setAttribute('light','intensity',night?1.65:2);};$('lighting').onchange();
  function prepare(){if(!g.xr)ward(g.keys.KeyH||state.padShield);if(!active())C.shield(g.game,null);audio();}
  function xrControls(bow,draw,rise,bowName,drawName){
   if(!draw.buttons[0])state.xrArmed=true;ward(bow.buttons[1],bow);
   if(rise(drawName,1))shard(draw);if(rise(drawName,3))reload();if(rise(bowName,3))equip();
   if(g.game.weapon==='crossbow'&&rise(drawName,0)&&state.xrArmed&&!g.game.shield&&!g.headBlocked){crossShot(bow);state.xrArmed=false;}
  }
  function render(){
   const s=g.game;if(state.game!==s){state.game=s;state.lastEvent=0;state.hudAt=-1;}g.visualBow.group.visible=s.weapon==='bow'&&!s.shield;g.visualArrow.visible=g.visualArrow.visible&&s.weapon==='bow'&&!s.shield;crossbow.visible=s.weapon==='crossbow'&&!s.shield;
   bolt.visible=s.crossbow.loaded;const a=string.geometry.attributes.position;a.setXYZ(1,0,.03,s.crossbow.loaded?.06:-.43+(1-s.crossbow.reload/(s.quickwind?1.05:1.55))*.49);a.needsUpdate=true;
   shield.visible=active()&&!!s.shield;if(shield.visible){shield.position.set(...s.shield.p);shield.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...s.shield.normal));boss.scale.setScalar(.75+.25*s.guard/s.maxGuard);}
   dust.rotation.y=Math.sin(s.time*.015)*.12;
   const events=s.events.filter(e=>e.seq>state.lastEvent);for(const e of events){if(e.type==='block'){g.sound(580,.16,.04);g.toast('BLOCKED · Wardglass '+Math.ceil(s.guard));}if(e.type==='guard-broken')g.toast('GUARD BROKEN · lower the shield and recover');if(e.type==='reloaded')g.sound(420,.08,.025);if(e.type==='shard'){$('fade').style.opacity='.65';clearTimeout(g.fadeTimer);g.fadeTimer=setTimeout(()=>$('fade').style.opacity='0',85);}if(e.type==='hit'&&e.head)g.toast('PRECISION HIT · '+s.headshots+' this run');}state.lastEvent=s.eventSeq||0;
   if(s.time-(state.hudAt||-1)>.09||g.paused){state.hudAt=s.time;const weapon=s.weapon==='bow'?'LIVING BOW':s.crossbow.loaded?'CROSSBOW · READY':s.crossbow.reload>0?'RELOADING '+s.crossbow.reload.toFixed(1)+'s':'CROSSBOW · R TO RELOAD';$('weapon-state').textContent=weapon;$('guard-state').textContent='GUARD '+Math.ceil(s.guard)+' / '+s.maxGuard;$('shard-state').textContent='SHARDS '+s.shardCharges+' / '+s.maxShards;$('weapon-toggle').textContent=s.weapon==='bow'?'V · Crossbow':'V · Bow';$('shield-action').classList.toggle('raised',!!s.shield);$('volley-button').disabled=!s.volleyUnlocked;$('run-summary').textContent=`This run: ${s.kills} kills · ${s.headshots} precision hits · ${s.blocks} blocks · ${s.blinks} blinks · ${s.shardsUsed} shard steps`;

   }
   if(g.xr&&active()&&!g.headBlocked&&g.hands.left&&g.hands.right){
    if(s.shield)g.xrNotice='WARDGLASS · guard '+Math.ceil(s.guard)+' · lower grip before firing';
    else if(s.weapon==='crossbow'&&!g.teleLine.visible)g.xrNotice=(s.crossbow.loaded?'CROSSBOW READY · trigger: fire':s.crossbow.reload>0?'WINDING THE CROSSBOW':'CROSSBOW EMPTY · draw-stick click: reload')+' · shards '+s.shardCharges;
   }
  }
  g.fireCrossbow=crossShot;
  const api={prepare,xrControls,state,equip,reload,shard,loseTracking(){state.xrArmed=false;C.shield(g.game,null);},shield,crossbow,journal};journal();return api;
 }
 root.VesperArsenal=Object.freeze({install});
})(globalThis);
