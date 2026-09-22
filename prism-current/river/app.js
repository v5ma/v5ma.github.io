/* Main entry for River Prism. Retained rhythm mode lives at rhythm.html.
   All combat uses RiverCore; UI never awards hits. One original audio transport. */
(function(){'use strict';const $=id=>document.getElementById(id),C=RiverCore,PREF='prism-current.river.settings.v1';
 AFRAME.registerComponent('river-game',{
  init(){this.T=AFRAME.THREE;this.art=RiverArt.build(this.T,this.el);this.audio=new PrismAudio();this.state=null;this.chapter='duck-armada';this.phase='menu';this.immersive=false;this.message='Easy start / HEALTH 100. Cut fruit, shoot engines, collect mint health boxes.';this.cruise=false;this.difficulty='easy';this.quiet=matchMedia('(prefers-reduced-motion: reduce)').matches;this.quality='balanced';this.serial=0;this.busy=false;this.aim=[0,0];this.playerX=0;this.crouch=0;this.activeHand=0;this.keys=new Set();this.captures=new Map();this.previous=[null,null];this.animations=[null,null];this.shields=[null,null];this.mouse=null;this.mouseFire=false;this.touchFire=false;this.touchShield=false;this.padId=null;this.padOld=[];this.seedPad=true;this.padDir=0;this.repeatAt=0;this.lastTime=0;this.lastFx=0;this.runMode='desktop';this.records={};this.cut=[0,-1];
   try{this.records=C.records(localStorage.getItem(C.KEY));const v=JSON.parse(localStorage.getItem(PREF)||'{}');if(['light','balanced','cinematic'].includes(v.quality))this.quality=v.quality;if(typeof v.quiet==='boolean')this.quiet=v.quiet;if(typeof v.cruise==='boolean')this.cruise=v.cruise;this.difficulty=C.DIFFICULTIES.normalize(v.difficulty);}catch{}
   this.xr=RiverXR.install(this);this.ui();this.inputs();this.sync();
   document.addEventListener('visibilitychange',()=>{if(document.hidden&&!this.immersive){this.phase==='loading'?this.cancel():this.pauseRun('Window hidden. Resume when ready.');this.clearInputs();}});window.addEventListener('blur',()=>{if(!this.immersive){this.phase==='loading'?this.cancel():this.pauseRun('Window lost focus.');this.clearInputs();}this.seedPad=true;});
   this.el.addEventListener('renderstart',()=>this.ready=true);this.ready=!!this.el.renderer;
   window.River={snapshot:()=>({version:'0.12.1',busy:this.busy,xrUI:this.xr.diagnostics,rotunda:this.dock?.diagnostics,phase:this.phase,chapter:this.chapter,ready:this.ready,immersive:this.immersive,calibrated:this.xr.calibrated,controller:this.padId!==null,mode:this.runMode,difficulty:this.state?.difficulty||this.difficulty,cruise:this.cruise,time:this.state?.time||0,water:C.water(this.chapter,this.state?.time||0),section:C.phase(this.chapter,this.state?.time||0).name,aim:[...this.aim],body:this.body(),result:this.state?C.result(this.state):null,entities:this.state?.entities.filter(n=>!n.dead).map(n=>({id:n.id,type:n.type,position:C.position(this.state,n),hp:n.hp,parent:n.parent,at:n.at,dir:n.dir,hand:n.hand,r:n.r,open:C.open(this.state,n)}))||[],shields:this.shields.map(s=>s?{...s}:null),stats:this.art.stats,records:{...this.records},message:this.message})};
  },
  body(){return [this.playerX,1.45-this.crouch,0];},
  notice(text){this.message=text;$('status').textContent=text;},
  clearInputs(){for(const [el,id]of this.captures||[])try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}this.captures?.clear();this.keys.clear();this.mouse=null;this.mouseFire=false;this.touchFire=false;this.touchShield=false;this.previous=[null,null];this.animations=[null,null];this.shields=[null,null];this.seedPad=true;for(const h of[0,1])this.art.weapon(h,null,null);},
  setDifficulty(value){
   if(this.state||this.busy){this.notice('Difficulty is locked for this battle. Return to chapter selection to change it.');return false;}
   this.difficulty=C.DIFFICULTIES.normalize(value);this.notice(C.DIFFICULTIES.get(this.difficulty).name+' selected. Health boxes: cut or shoot to heal.');this.sync();return true;
  },
  music(delta){this.audio.level(Math.max(0,Math.min(1,this.audio.volume+delta)));this.sync();},
  ui(){for(const [id,chapter]of[['duck','duck-armada'],['space','mothership']])$(id).onclick=()=>{this.cancel();this.chapter=chapter;this.sync();};$('play').onclick=()=>this.phase==='paused'?this.resume():this.start();$('pause').onclick=()=>this.pauseRun('Paused');$('resume').onclick=()=>this.resume();$('retry').onclick=()=>this.start();$('back').onclick=()=>this.cancel();$('again').onclick=()=>this.start();$('next').onclick=()=>{this.cancel();this.chapter=this.chapter==='duck-armada'?'mothership':'duck-armada';this.sync();this.start();};$('results-back').onclick=()=>this.cancel();
   $('difficulty').onchange=e=>this.setDifficulty(e.target.value);$('volume').oninput=e=>{this.audio.level(+e.target.value/100);};$('effects').oninput=e=>this.audio.effectLevel(+e.target.value/100);$('quiet').onchange=e=>{this.quiet=e.target.checked;this.sync();};$('cruise').onchange=e=>{this.cruise=e.target.checked;this.sync();};$('quality').onchange=e=>{this.quality=e.target.value;this.sync();};$('hand').onclick=()=>{this.activeHand=1-this.activeHand;this.sync();};
   for(const [id,field]of[['touch-fire','touchFire'],['touch-shield','touchShield']]){const e=$(id);e.addEventListener('pointerdown',v=>{v.preventDefault();this.captures.set(e,v.pointerId);e.setPointerCapture(v.pointerId);this[field]=true;});for(const kind of['pointerup','pointercancel','lostpointercapture'])e.addEventListener(kind,()=>{this[field]=false;this.captures.delete(e);});}
  },
  sync(){document.body.dataset.phase=this.phase;$('menu').inert=!['menu','loading'].includes(this.phase);$('pause-panel').inert=this.phase!=='paused';$('results').inert=!['complete','failed','escaped'].includes(this.phase);$('duck').setAttribute('aria-pressed',this.chapter==='duck-armada');$('space').setAttribute('aria-pressed',this.chapter==='mothership');$('play').textContent=this.busy?'Preparing soundtrack...':'Play '+(this.chapter==='mothership'?'Mothership Channel':'Duck Armada');$('play').disabled=this.busy;$('volume').value=Math.round(this.audio.volume*100);$('effects').value=Math.round(this.audio.effectsVolume*100);$('difficulty').value=this.state?.difficulty||this.difficulty;$('difficulty').disabled=!!this.state||this.busy;$('quiet').checked=this.quiet;$('cruise').checked=this.cruise;$('quality').value=this.quality;$('hand').textContent=this.activeHand?'R blade / F':'L blade / F';
   try{localStorage.setItem(PREF,JSON.stringify({quiet:this.quiet,quality:this.quality,cruise:this.cruise,difficulty:this.difficulty}));}catch{}
   // Three r184 setPixelRatio calls setSize even for the same value. A blade
   // switch/volume change must not reset the drawing buffer after preparation.
   if(this.el.renderer&&!this.immersive&&!this.el.renderer.xr?.isPresenting){
    const ratio=Math.min(devicePixelRatio,this.quality==='cinematic'?1.5:this.quality==='light'?.7:1);
    if(this.el.renderer.getPixelRatio()!==ratio)this.el.renderer.setPixelRatio(ratio);
   }
   const record=this.records[[this.chapter,this.immersive?(this.el.is('ar-mode')?'ar':'vr'):this.padId!==null?'gamepad':'desktop',this.difficulty,this.cruise?'cruise':'arcade'].join('/')];$('best').textContent=record?`Local best: ${record.score.toLocaleString()} / ${record.wins} clears`:'New battle. River records are separate from your previous scores.';
  },
  playbackAllowed(session){
   return this.immersive?!!session&&this.xr?.session===session&&session.visibilityState==='visible'&&this.xr.calibrated:session===null&&!document.hidden;
  },
  async start(){
   if(this.busy)return;
   const session=this.immersive?this.xr.session:null;
   if(!this.playbackAllowed(session)){this.notice('Return to the visible, calibrated view before starting.');return;}
   const serial=++this.serial;this.busy=true;this.phase='loading';this.state=null;this.clearInputs();this.art.reset();this.lastFx=0;this.playerX=this.crouch=0;this.activeHand=0;this.sync();
   try{
    await this.audio.context().resume();await this.audio.prepare('undertow');if(serial!==this.serial)return;
    if(!this.playbackAllowed(session)){this.cancel();this.notice('Start interrupted. Choose Play again when ready.');return;}
    this.state=C.create(this.chapter,this.cruise,this.difficulty);this.runMode=this.immersive?(this.el.is('ar-mode')?'ar':'vr'):this.padId!==null?'gamepad':'desktop';this.lastTime=0;
    this.art.update(this.state,0,0,this.el.is('ar-mode'),this.quiet,false);if(this.el.renderer.compileAsync)await this.el.renderer.compileAsync(this.el.object3D,this.el.camera);if(serial!==this.serial)return;
    if(this.art.prepare)await this.art.prepare(this.el.renderer,this.el.camera);if(serial!==this.serial)return;
    if(this.dock?.prepare)this.dock.prepare(this.el.renderer);if(serial!==this.serial)return;
    if(!this.playbackAllowed(session)){this.cancel();this.notice('Start interrupted. Choose Play again when ready.');return;}
    const played=await this.audio.play('undertow',0);if(serial!==this.serial||played===false)return;
    if(!this.playbackAllowed(session)){this.cancel();this.notice('Start interrupted. Choose Play again when ready.');return;}
    this.phase='playing';this.state.mode='playing';this.notice('HEALTH starts at 100. Cut fruit; cut or shoot purple blocks. Mint boxes heal. Boss arrives at the end.');$('scene-wrap').focus();
   }catch(e){if(serial===this.serial){this.phase='menu';this.state=null;this.notice(e.message);}}
   finally{if(serial===this.serial){this.busy=false;this.sync();}}
  },
  pauseRun(reason='Paused'){
   // A pending audio resume is still a paused battle. Cancel its request as well
   // as its audio token, so a later promise cannot silently restart the encounter.
   if(this.phase==='paused'&&this.busy){this.serial++;this.busy=false;this.audio.pause();this.clearInputs();this.notice(reason);this.sync();this.focus($('resume'));return;}
   if(this.phase!=='playing')return;
   this.audio.pause();this.phase='paused';this.state.mode='paused';this.clearInputs();this.notice(reason);this.sync();this.focus($('resume'));
  },
  pause(){this.pauseRun('Rendering paused. Resume when ready.');},
  async resume(){
   if(this.phase!=='paused'||this.busy||!this.state)return;
   if(!this.immersive&&['ar','vr'].includes(this.runMode)){this.xr.enter(this.runMode==='ar');return;}
   const serial=this.serial,run=this.state,session=this.immersive?this.xr.session:null;
   if(!this.playbackAllowed(session)){this.notice('Return to the visible, calibrated view before resuming.');return;}
   this.busy=true;
   try{
    const played=await this.audio.play('undertow',this.audio.offset);if(serial!==this.serial||played===false)return;
    if(this.phase!=='paused'||this.state!==run||!this.playbackAllowed(session)){this.audio.pause();return;}
    this.phase='playing';run.mode='playing';this.lastTime=this.audio.offset;this.previous=[null,null];$('scene-wrap').focus();
   }catch(e){if(serial===this.serial)this.notice(e.message);}
   finally{if(serial===this.serial){this.busy=false;this.sync();}}
  },
  cancel(){this.serial++;this.busy=false;this.audio.stop();this.state=null;this.phase='menu';this.clearInputs();this.art.reset();this.sync();},
  finish(){if(!this.state||!['complete','failed','escaped'].includes(this.state.mode))return;this.phase=this.state.mode;this.audio.stop();this.clearInputs();const r=C.result(this.state);if(r.complete){const k=[this.state.chapter,this.runMode,this.state.difficulty,this.state.cruise?'cruise':'arcade'].join('/'),old=this.records[k];this.records[k]={score:Math.max(r.score,old?.score||0),wins:(old?.wins||0)+1};try{localStorage.setItem(C.KEY,JSON.stringify(this.records));}catch{this.notice('Battle cleared; storage could not save this result.');}}
   $('result-title').textContent=r.complete?(this.chapter==='mothership'?'Mothership down.':'The river is yours.'):(this.phase==='failed'?'Health depleted. Try Easy or collect health boxes.':'The flagship escaped.');$('result-score').textContent=r.score.toLocaleString();$('result-detail').textContent=`${C.DIFFICULTIES.get(r.difficulty).name} / ${r.pickups} health boxes (+${r.healed} HEALTH) / ${r.slices} slices / ${r.shotHits} laser hits / ${r.blocks} blocks / ${r.reflects} perfect reflects / ${r.dodges} dodges. Best combo: ${r.combo}.`;$('next').textContent=this.chapter==='duck-armada'?'Play Mothership Channel':'Play Duck Armada';this.sync();this.focus($('again'));},
  focus(e){if(this.dock&&!this.dock.textControls)return;if(!e)return;document.querySelectorAll('.pad-focus').forEach(n=>n.classList.remove('pad-focus'));e.classList.add('pad-focus');e.focus({preventScroll:true});e.scrollIntoView({block:'nearest'});},
  items(){const root=this.phase==='paused'?$('pause-panel'):['complete','failed','escaped'].includes(this.phase)?$('results'):$('menu');return [...root.querySelectorAll('button,a,input,select,summary')].filter(e=>!e.disabled&&e.getClientRects().length&&(!e.closest('details')||e.closest('details').open||e.tagName==='SUMMARY'));},
  moveFocus(d){const a=this.items(),i=a.indexOf(document.activeElement);if(a.length)this.focus(a[(i+d+a.length)%a.length]);},
  adjust(d){const e=document.activeElement;if(e?.tagName==='SELECT'){e.selectedIndex=Math.max(0,Math.min(e.options.length-1,e.selectedIndex+d));e.dispatchEvent(new Event('change'));}else if(e?.type==='range'){e.value=Math.max(0,Math.min(100,+e.value+d*5));e.dispatchEvent(new Event('input'));}else this.moveFocus(d);},
  poll(dt,now){if(document.hidden||!document.hasFocus()||this.immersive){this.seedPad=true;return null;}let p;try{p=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.connected&&p.mapping==='standard'&&(this.padId===null||p.index===this.padId));}catch{}
   if(!p){if(this.padId!==null){this.padId=null;this.seedPad=true;if(this.runMode==='gamepad')this.pauseRun('Controller disconnected. Reconnect and press Menu to resume.');this.sync();}return null;}
   const down=Array.from({length:17},(_,i)=>!!p.buttons[i]?.pressed||p.buttons[i]?.value>.55);if(this.padId===null){this.padId=p.index;this.seedPad=true;this.sync();}if(this.seedPad){this.seedPad=false;this.padOld=down;return null;}const edge=down.map((v,i)=>v&&!this.padOld[i]);this.padOld=down;
   if(edge[9]||edge[8]){this.phase==='playing'?this.pauseRun('Paused by controller'):this.phase==='paused'?this.resume():this.start();return null;}
   const axis=i=>{const n=p.axes[i]||0;return Math.abs(n)<.16?0:Math.sign(n)*(Math.abs(n)-.16)/.84;};
   if(this.phase!=='playing'){
    const dir=down[12]?-1:down[13]?1:down[14]?-2:down[15]?2:Math.abs(axis(1))>.6?(axis(1)>0?1:-1):0;if(this.dock&&!this.dock.textControls){const step=dir&&(dir!==this.padDir||now>=this.repeatAt)?dir:0;if(step)this.repeatAt=now+(dir!==this.padDir?380:160);this.padDir=dir;this.dock.pad(step,edge[0],edge[1]);return null;}if(dir&&(dir!==this.padDir||now>=this.repeatAt)){Math.abs(dir)===1?this.moveFocus(dir):this.adjust(dir/2);this.repeatAt=now+(dir!==this.padDir?380:160);}this.padDir=dir;
    if(edge[0]){const e=document.activeElement;if(e?.tagName==='SELECT')this.adjust(1);else if(this.items().includes(e))e.click();else this.focus($('play'));}if(edge[1])this.phase==='paused'?this.resume():this.cancel();if(edge[3]&&this.phase==='menu'){this.chapter=this.chapter==='duck-armada'?'mothership':'duck-armada';this.sync();}return null;
   }
   this.playerX=Math.max(-.8,Math.min(.8,this.playerX+axis(0)*dt*1.3));this.crouch+=( (down[1]||axis(1)>.45?.46:0)-this.crouch)*Math.min(1,dt*12);this.aim[0]=Math.max(-.94,Math.min(.94,this.aim[0]+axis(2)*dt*1.35));this.aim[1]=Math.max(-.88,Math.min(.88,this.aim[1]-axis(3)*dt*1.35));
   const dx=(down[15]?1:0)-(down[14]?1:0),dy=(down[12]?1:0)-(down[13]?1:0);if(dx||dy){const n=Math.hypot(dx,dy);this.cut=[dx/n,dy/n];}if(edge[0])this.slash(0);if(edge[2])this.slash(1);
   return {fire:[down[6],down[7]],shield:[down[4],down[5]]};
  },
  point(z=-1.05){const T=this.T,ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(...this.aim),this.el.camera);const p=new T.Vector3();ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),-z),p);return p;},
  slash(hand){if(this.phase!=='playing')return;const t=this.state.time;if(this.animations[hand]&&t-this.animations[hand].at<.23)return;const p=this.point();this.animations[hand]={at:t,point:p,dir:[...this.cut]};},
  desktopHands(p,t){const T=this.T,out=[];for(let h=0;h<2;h++){const origin=new T.Vector3(this.playerX+(h?.30:-.30),1.24-this.crouch,-.25),target=this.point(-16),dir=target.clone().sub(origin).normalize(),active=!!(p?.shield[h]||this.keys.has(h?'KeyE':'KeyQ')||this.touchShield);const old=this.shields[h];const sh={active,center:[this.playerX+(h?.30:-.30),1.36-this.crouch,-.72],normal:[0,0,-1],raised:active&&old?.active?old.raised:t,hand:h};let pose={a:origin.toArray(),b:origin.clone().addScaledVector(dir,.72).toArray()};
    const anim=this.animations[h];if(anim&&t-anim.at<.17){const f=Math.max(0,Math.min(1,(t-anim.at)/.15)),v=(f-.5)*.82,q=anim.point;pose={a:[q.x+anim.dir[0]*v,q.y+anim.dir[1]*v,-.35],b:[q.x+anim.dir[0]*v,q.y+anim.dir[1]*v,-1.6]};}else this.animations[h]=null;
    if(this.mouse&&this.activeHand===h){const q=this.point();pose={a:[q.x,q.y,-.35],b:[q.x,q.y,-1.6]};}
    out.push({pose,origin:origin.toArray(),direction:dir.toArray(),fire:!!(p?.fire[h]||this.keys.has(h?'KeyT':'KeyR')||(h===1&&(this.mouseFire||this.touchFire))),shield:sh});
   }return out;
  },
  inputs(){const wrap=$('scene-wrap');const point=e=>{const r=wrap.getBoundingClientRect();this.aim=[(e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)];};wrap.addEventListener('contextmenu',e=>e.preventDefault());wrap.addEventListener('pointerdown',e=>{if(this.immersive||this.phase!=='playing')return;e.preventDefault();wrap.focus();this.captures.set(wrap,e.pointerId);wrap.setPointerCapture(e.pointerId);point(e);if(e.button===2)this.mouseFire=true;else this.mouse={id:e.pointerId};});wrap.addEventListener('pointermove',e=>{if(this.immersive)return;point(e);});for(const type of['pointerup','pointercancel','lostpointercapture'])wrap.addEventListener(type,e=>{this.mouse=null;this.mouseFire=false;this.captures.delete(wrap);});
   window.addEventListener('keydown',e=>{if(this.immersive)return;if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)this.phase==='playing'?this.pauseRun('Paused'):this.phase==='paused'?this.resume():this.cancel();return;}if(/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName))return;if(this.phase!=='playing')return;this.keys.add(e.code);if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();if(e.repeat)return;if(e.code==='KeyF'){this.activeHand=1-this.activeHand;this.sync();}if(e.code==='KeyJ')this.slash(0);if(e.code==='KeyK')this.slash(1);});window.addEventListener('keyup',e=>this.keys.delete(e.code));
  },
  tick(now,delta){const dt=Math.min(.05,(delta||0)/1000);let pad=this.poll(dt,now);if(!this.immersive){if(this.phase==='playing'){const dx=(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0);this.playerX=Math.max(-.8,Math.min(.8,this.playerX+dx*dt*1.3));if(this.padId===null)this.crouch+=((this.keys.has('Space')||this.keys.has('KeyS')?.46:0)-this.crouch)*Math.min(1,dt*12);const dx2=(this.keys.has('ArrowRight')?1:0)-(this.keys.has('ArrowLeft')?1:0),dy2=(this.keys.has('ArrowUp')?1:0)-(this.keys.has('ArrowDown')?1:0);if(dx2||dy2){const n=Math.hypot(dx2,dy2);this.cut=[dx2/n,dy2/n];}}this.el.camera.position.set(this.playerX,1.65-this.crouch,0);this.el.camera.updateMatrixWorld();}
   const t=this.phase==='playing'?this.audio.time():this.state?.time||0;const input=this.immersive?this.xr.collect(t):{hands:this.desktopHands(pad,t),body:this.body()};
   if(this.phase==='playing'&&this.state){if(this.audio.a?.state!=='running')this.pauseRun('Audio interrupted. Resume when ready.');else if(t-this.lastTime>.35){this.pauseRun('Rendering stalled. Try Light quality, then resume.');}else{
    this.shields=input.hands.map(h=>h?.shield||null);C.advance(this.state,t,input.body,this.shields.filter(Boolean));this.lastTime=t;
    for(let h=0;h<2;h++){const hand=input.hands[h];if(!hand){this.previous[h]=null;continue;}if(!hand.shield.active){if(hand.fire)C.shoot(this.state,h,hand.origin,hand.direction);if(this.previous[h])C.slice(this.state,h,this.previous[h].pose,hand.pose,this.previous[h].time,t);}this.previous[h]={pose:hand.pose,time:t};}
    if(this.state.mode!=='playing')this.finish();
   }}
   for(let h=0;h<2;h++)this.art.weapon(h,this.phase==='playing'?input.hands[h]?.pose:null,this.phase==='playing'?input.hands[h]?.shield:null);
   this.art.update(this.state||{chapter:this.chapter,mode:'ready',time:0,entities:[],events:[]},this.state?.time??now/1000,dt,this.el.is('ar-mode'),this.quiet,this.phase==='playing');
   if(this.state){const s=this.state,p=C.phase(this.chapter,s.time);$('score').textContent=s.score.toLocaleString();$('combo').textContent=s.combo+'x';$('health').value=s.health;$('health-text').textContent='HEALTH '+s.health+' / '+(s.maxHealth||100);$('section').textContent=s.bossDefeated?'VICTORY LAP':p.name;$('cue').textContent=s.bossDefeated?'Boss down. Finish the song and gather the remaining fruit.':p.cue;$('clock').textContent=Math.ceil(Math.max(0,s.duration-s.time))+'s';$('progress').value=s.time/s.duration;const boss=s.entities.find(n=>n.type==='boss'&&!n.dead);$('boss').hidden=!boss;if(boss){$('boss-label').textContent=(C.open(s,boss)?'CORE OPEN / ':'BOSS ARRIVING / ')+(this.chapter==='mothership'?'MOTHERSHIP':'ADMIRAL QUACK');$('boss-health').max=boss.maxHP;$('boss-health').value=boss.hp;}
    for(const e of s.events){if(e.id<=this.lastFx)continue;this.lastFx=e.id;if(['block','destroy','damage','heal'].includes(e.type)){this.audio.hit(e.hand||0,e.type==='damage'?.4:1);this.xr.haptic(e.hand||0);}}
   }else{$('boss').hidden=true;}
   $('reticle').style.left=(this.aim[0]*.5+.5)*100+'%';$('reticle').style.top=(-this.aim[1]*.5+.5)*100+'%';$('countdown').textContent=this.phase==='playing'&&t<4*C.BEAT?Math.ceil((4*C.BEAT-t)/C.BEAT):'';if(!this.immersive)this.dock?.update(input,null);
  },
  remove(){this.serial++;this.audio.stop();this.xr.dispose();this.art.dispose();}
 });
})();
