/* Open-course adapter for the existing engine. Original ring routes stay intact. */
(function(){
 'use strict';
 function boot(){
  const K=GrappleCore,S=__sky.state;
  const state={hooks:0,releases:0,turns:0,events:[],target:null,checkpoint:null,from:null,castTicks:0,lash:0,jump:false,wasZ:false,lastReleased:null};
  const isOpen=()=>__sky.active()&&S.data.kind==='open';
  const enabled=()=>__sky.active()&&!__delivery.paused&&!__delivery.state.menu&&!won&&player.dead===0;
  const log=(type,extra={})=>{const e={type,step:S.steps,x:player.x,y:player.y,...extra};state.events.push(e);if(state.events.length>800)state.events.shift();};
  const solid=(x,y)=>SOLID.has(pg(Math.floor(x/TILE),Math.floor(y/TILE)));
  const pegs=()=>{const result=[];for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(pg(x,y)===T.PEG)result.push({id:`peg-${x}-${y}`,x:x*TILE+18,y:y*TILE+18});return result;};
  let pegList=[],cooldown=0,touchHeld=false,jumpHeld=false,sceneObjects=null;
  function say(s){popText(player.x+13,player.y-25,s,'#b9f9df');}
  const previousSpawn=spawnWorld;
  window.spawnWorld=function(x,y){const keep=routeKeep,checkpoint=state.checkpoint;previousSpawn(x,y);pegList=pegs();cooldown=0;state.castTicks=0;state.lash=0;state.target=null;state.wasZ=false;touchHeld=false;
   if(!keep){state.hooks=state.releases=state.turns=0;state.events=[];state.checkpoint=null;state.from=null;state.lastReleased=null;}
   if(customTracks.some(t=>t.sky?.kind==='open')){
    const boxes=[];let goal=null;for(let yy=0;yy<LH;yy++)for(let xx=0;xx<LW;xx++){if(grid[yy*LW+xx]===T.MAILBOX)boxes.push({x:xx,y:yy});if(grid[yy*LW+xx]===T.GOAL)goal={x:xx,y:yy+1};}
    S.data={...S.data,kind:'open',width:LW,height:LH,ct:customTracks,boxes,goal,requiredGrapples:pegList.length?1:0};
   }
   if(isOpen()){
    const t=keep&&checkpoint?tracks.find(t=>t.sky?.id===checkpoint.id):tracks.find(t=>t.sky?.kind==='open');
    if(t){player.track=t;player.trackS=keep&&checkpoint?Math.min(t.len-1,checkpoint.s):1;player.speed=0;K.pose(player,t,player.trackS);}
    state.from=null;player._airTicks=0;log(keep?'checkpoint':'start');
   }
  };
  // C remains a newspaper action. Only the dedicated whip control can tether.
  const previousGun=fireGun;
  window.fireGun=function(p){if(!__sky.active())return previousGun(p);const whip=p.whip,tether=p.peg;p.whip=false;p.peg=null;
   try{previousGun(p);}finally{p.whip=whip;p.peg=tether;}
  };
  function cast(){
   if(!enabled()||player.peg||cooldown>0)return false;
   const target=K.target(player,pegList,solid);state.target=target;
   const from=player.track?.sky?.id||S.from;
   if(target&&K.cast(player,target)){S.from=from||'whip';state.hooks++;state.from=state.from||'whip';state.castTicks=0;log('hook',{peg:target.id,r:player.peg.r,speed:Math.hypot(player.vx,player.vy)});say('HOOKED / STEER TO WIND UP');return true;}
   state.lash=12;cooldown=10;return false;
  }
  function release(){if(!enabled()||!player.peg)return;const r=K.release(player);S.airFrames=0;state.releases++;state.turns=Math.max(state.turns,r.loops);state.lastReleased=r.id;cooldown=10;state.from='whip';log('release',r);say(r.loops?'WIND-UP RELEASE!':'GRAPPLE RELEASE');}
  function input(){return {right:!!(keys.KeyD||keys.ArrowRight),left:!!(keys.KeyA||keys.ArrowLeft),up:!!keys.ArrowUp,down:!!keys.ArrowDown};}
  function tickWhip(){
   if(cooldown>0)cooldown--;if(state.lash>0)state.lash--;
   const z=!!(keys.KeyZ||touchHeld);
   if(z&&!state.wasZ)state.castTicks=18;
   // A held, visibly extended whip can acquire an anchor as it enters reach.
   if(z&&!player.peg){state.castTicks=Math.max(1,state.castTicks-1);if(cooldown===0)cast();}
   if(!z&&state.wasZ&&player.peg)release();state.wasZ=z;
   state.target=!player.peg?K.target(player,pegList,solid):null;
  }
  const previousStep=stepPlayer;
  window.stepPlayer=function(){
   if(!__sky.active())return previousStep();
   tickWhip();
   if(!isOpen()){
    if(player.peg){S.steps++;S.attemptSteps++;fireGun(player);K.swing(player,input(),solid);interactTiles(player);return;}
    return previousStep();
   }
   const p=player;S.steps++;S.attemptSteps++;
   if(p.dead>0)return previousStep();
   if(p.trackCD>0)p.trackCD--;fireGun(p);const controls=input();
   const jump=!!keys.Space;controls.jump=(jump&&!jumpHeld)||state.jump;jumpHeld=jump;state.jump=false;
   if(p.peg){const blocked=K.swing(p,controls,solid);if(blocked){cooldown=10;log('blocked-swing');}}
   else if(p.track){
    const t=p.track,exit=K.ride(p,controls);
    if(exit){state.from=t.sky.id;p._airTicks=0;S.launches++;S.from=t.sky.id;S.airFrames=0;
     if(exit.exit===1)S.completed.add(t.sky.stage);
     log(exit.type,{stage:t.sky.stage,vx:p.vx,vy:p.vy});
    }
   }else{
    const old={x:p.x,y:p.y};K.flight(p,controls,q=>{moveX(q);moveY(q);});p._airTicks=(p._airTicks||0)+1;S.airFrames++;
    const hit=K.catchRail(p,old,tracks,state.from);
    if(hit){
     S.catches++;S.transfers++;S.checkpoint=hit.tr.sky.stage;S.seen.add(S.checkpoint);S.from=null;
     state.checkpoint={id:hit.tr.sky.id,s:hit.s};
     log('catch',{stage:hit.tr.sky.stage,from:state.from,airTicks:p._airTicks,normalSpeed:p.speed,s:hit.s});
     state.from=null;p._airTicks=0;S.airFrames=0;say('CURVED RAMP CATCH');
    }
    if(p.onGround&&!p.track){if(controls.right)p.vx=Math.max(5,p.vx);if(controls.left)p.vx-=.4;p.drawA=0;}
   }
   p.dir=p.vx<0?-1:1;if(p.inv>0)p.inv--;interactTiles(p);
   if(p.y>LH*TILE-100||p.x<0||p.x>LW*TILE){log('fall');respawn(false);}
  };
  const previousWin=win;
  window.win=function(){if(isOpen()&&state.releases<(S.data.requiredGrapples||0)){say('Use the whip crossing first');return;}if(isOpen())log('finish',{hooks:state.hooks,releases:state.releases});return previousWin();};
  const previousSwing=stepSwing;
  window.stepSwing=function(p){return __sky.active()?K.swing(p,input(),solid):previousSwing(p);};
  // Keyboard, touch, and remapped gamepad Z all use the same cast/release path.
  window.addEventListener('keydown',e=>{if(!enabled()||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(e.code==='KeyZ'&&!e.repeat){keys.KeyZ=true;state.wasZ=true;cast();}if(e.code==='Space'&&isOpen()&&!e.repeat)state.jump=true;});
  window.addEventListener('keyup',e=>{if(e.code==='KeyZ'){keys.KeyZ=false;release();state.wasZ=false;}});
  function loseInput(){keys.KeyZ=false;touchHeld=false;state.wasZ=false;state.castTicks=0;if(player?.peg&&__sky.active()){K.release(player);state.from='whip';cooldown=10;}}
  window.addEventListener('blur',loseInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)loseInput();});
  document.getElementById('stagewrap').insertAdjacentHTML('beforeend','<button id="whip-control" class="delivery-btn" aria-label="Hold to whip a peg; release to launch">HOLD: WHIP</button><div id="whip-status" role="status" aria-live="polite"></div>');
  const button=document.getElementById('whip-control');
  button.addEventListener('pointerdown',e=>{e.preventDefault();if(!enabled())return;touchHeld=true;state.wasZ=true;cast();button.setPointerCapture(e.pointerId);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{touchHeld=false;release();state.wasZ=false;});
  // The old touch Launch button becomes a jump-off button on open surfaces.
  document.getElementById('sky-launch-touch').addEventListener('pointerdown',()=>{if(isOpen())state.jump=true;});
  function hud(){
   const on=__sky.active();document.body.classList.toggle('whip-enabled',on);document.body.classList.toggle('open-course-active',isOpen());
   if(!on)return;
   const p=player,a=p.peg;let s=a?`HOOKED / ${a.loops} WIND-UPS / ${Math.round(a.r)} ROPE`:state.target?'PEG IN REACH / HOLD Z TO CATCH':'Z: WHIP / RELEASE Z: FLING';
   const text=document.getElementById('whip-status');if(text.textContent!==s)text.textContent=s;
   button.textContent=a?'RELEASE: FLING':'HOLD: WHIP';button.classList.toggle('hooked',!!a);button.classList.toggle('in-range',!!state.target);
   if(isOpen()){
    const set=(id,t)=>{const el=document.getElementById(id);if(el&&el.textContent!==t)el.textContent=t;};
    const th=a?((a.th%(2*Math.PI))+2*Math.PI)%(2*Math.PI):0;
    const cue=a?(a.loops&&th>.1&&th<.5?'RELEASE NOW FOR THE RIGHT-HAND SKYWAY':'HOLD Z + D TO WIND UP. UP/DOWN REELS.'):p.track?'OPEN RAMP: RIDE OFF THE LIP TO LAUNCH':'HOLD Z NEAR A PEG. RELEASE TO FLING.';
    set('cloud-flight-label',cue);set('cloud-control-tip','D: THROTTLE / Z: WHIP / UP-DOWN: REEL / C: MAIL');
    set('sky-state',cue);set('sky-loop-count',`SECTIONS ${S.completed.size} / ${S.data.stages}`);set('delivery-hint','Open lips launch automatically. Z catches a peg; releasing Z preserves your swing momentum. R retries a caught section.');
    set('sky-launch-touch','JUMP OFF');
    document.querySelector('#cloud-hud .cloud-loop .cloud-label')?.replaceChildren(document.createTextNode('SECTIONS'));
    document.body.classList.remove('sky-launch-ready');document.getElementById('cloud-hud')?.classList.remove('ready','armed');
    const fill=document.getElementById('cloud-phase-fill');if(fill)fill.style.width=`${a?Math.min(100,a.loops*30):p.track?p.trackS/p.track.len*100:0}%`;
   }else{const label=document.querySelector('#cloud-hud .cloud-loop .cloud-label');if(label&&label.textContent!=='LOOPS')label.textContent='LOOPS';}
  }
  // Real 3D peg heads, reach indicator and segmented chain. No screenshot plane.
  function addGraphics(m,parent){
   const T3=m.THREE,kit=CloudAssets.create(T3),batch=new kit.Batch();
   for(const peg of pegList){const x=peg.x,y=-peg.y;batch.box(x,y,-2,30,30,15,'#304e73');batch.box(x,y,7,24,24,4,'#e2a439');batch.ell(x,y,14,8,8,9,'#b8eeef');batch.ell(x,y,22,4,4,2,'#244364');for(const dx of[-10,10])for(const dy of[-10,10])batch.ell(x+dx,y+dy,10,1.7,1.7,1,'#69798f');}
   batch.finish(m,parent,{roughness:.3,metalness:.4});kit.dispose();
   const group=new T3.Group();parent.add(group);
   const chain=new T3.InstancedMesh(new T3.BoxGeometry(1,1,1),new T3.MeshStandardNodeMaterial({color:'#ffd27a',roughness:.32,metalness:.45,emissive:'#8c612a',emissiveIntensity:.2}),64);chain.frustumCulled=false;chain.count=0;group.add(chain);
   const halo=new T3.InstancedMesh(new T3.BoxGeometry(1,1,1),new T3.MeshBasicNodeMaterial({color:'#8dffe2',depthTest:false}),24);halo.frustumCulled=false;halo.renderOrder=5500;halo.count=0;group.add(halo);
   sceneObjects={group,chain,halo,matrix:new T3.Matrix4(),T:T3};
  }
  const art=window.SkyVisual,previousBuild=art.build,previousUpdate=art.update;
  art.build=function(m){const group=previousBuild(m);if(__sky.active())addGraphics(m,group);else sceneObjects=null;return group;};
  function graphics(){
   if(!sceneObjects||!__sky.active())return;
   const {chain,halo,matrix}=sceneObjects,p=player,a=p.peg,hand={x:p.x+13,y:p.y+10};
   const destination=a||state.lash>0&&{x:hand.x+p.dir*(160-state.lash*8),y:hand.y-15};chain.count=0;
   if(destination){const dx=destination.x-hand.x,dy=destination.y-hand.y,len=Math.hypot(dx,dy),n=Math.min(64,Math.ceil(len/5));chain.count=n;
    for(let i=0;i<n;i++){const f=(i+.5)/n,slack=a?Math.sin(Math.PI*f)*1.7:Math.sin(f*Math.PI*3)*state.lash*.7;matrix.makeRotationZ(-Math.atan2(dy,dx));matrix.scale(new sceneObjects.T.Vector3(len/n*.85,i%2?1.2:2,2));matrix.setPosition(hand.x+dx*f,-hand.y-dy*f+slack,34);chain.setMatrixAt(i,matrix);}chain.instanceMatrix.needsUpdate=true;
   }
   const peg=a||state.target;halo.count=peg?24:0;
   if(peg){for(let i=0;i<24;i++){const th=i/24*2*Math.PI;matrix.makeRotationZ(th);matrix.scale(new sceneObjects.T.Vector3(2,4,2));matrix.setPosition(peg.x+Math.cos(th)*23,-peg.y+Math.sin(th)*23,27);halo.setMatrixAt(i,matrix);}halo.instanceMatrix.needsUpdate=true;}
  }
  art.update=function(){previousUpdate();graphics();hud();};
  const previousRender=render;
  window.render=function(){previousRender();hud();if(__sky.active()&&__delivery.state.view==='2d'&&(player.peg||state.target)){
   const c=document.getElementById('delivery-fx'),ctx=c.getContext('2d'),rect=c.getBoundingClientRect(),z=Math.min(1.6,Math.max(1.1,rect.width/800)),dpr=c.width/rect.width;
   ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.scale(z,z);ctx.translate(-cam.x,-cam.y);const a=player.peg||state.target;ctx.strokeStyle='#ffd27a';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(a.x,a.y,12,0,Math.PI*2);ctx.stroke();
   if(player.peg){ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(player.x+13,player.y+10);ctx.lineTo(a.x,a.y);ctx.stroke();}ctx.restore();
  }};
  window.__grapple={state,isOpen,pegs:()=>pegList,get graphics(){return sceneObjects}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
