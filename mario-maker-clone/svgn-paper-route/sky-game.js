/* Loop-first physics extension. Runs inside the original Paper Route engine.
   Detached flight is simulated; catches are swept collisions, never teleports. */
'use strict';
(function(){
 function boot(){
  const state={version:'2026.09.04-sky1',data:null,completed:new Set(),transfers:0,launches:0,catches:0,checkpoint:0,armed:false,airFrames:0,events:[],steps:0,attemptSteps:0,from:null,seen:new Set(),bestSpeed:0};
  const active=()=>!!state.data&&mode==='play';
  const log=(type,detail={})=>{state.events.push({type,step:state.steps,x:player?.x,y:player?.y,...detail});if(state.events.length>1200)state.events.shift();};
  function message(text,col='#ffdc8a'){if(player)popText(player.x+13,player.y-28,text,col);}
  const originalCode=levelCode,originalLoad=loadCode;
  window.levelCode=function(){const code=originalCode(),[m,d]=code.split('.'),meta=JSON.parse(b64d(m));if(customTracks.some(p=>p.sky))meta.cm=customTracks.map(p=>p.sky||null);return b64e(JSON.stringify(meta))+'.'+d;};
  window.loadCode=function(code){const ok=originalLoad(code);if(ok){try{const meta=JSON.parse(b64d(code.split('.')[0]));customTracks.forEach((p,i)=>{const tag=meta.cm?.[i];if(tag&&tag.version===1&&Number.isInteger(tag.stage)&&tag.begin>=0&&tag.end>tag.begin&&tag.end<=1)p.sky={...tag};});}catch{}}return ok;};
  const baseTracks=buildTracks;
  window.buildTracks=function(G){const out=baseTracks(G);let i=0;for(const tr of out)if(tr.custom){const tag=customTracks[i++]?.sky;if(tag)tr.sky={...tag};}return out;};
  const spawn=spawnWorld;
  window.spawnWorld=function(x,y){
    const keep=routeKeep;spawn(x,y);
    const i=window.__delivery?.state.route,def=SkyRoutes.specs[i];
    const tagged=customTracks.filter(p=>p.sky);
    state.data=tagged.length?(def?SkyRoutes.build(i,T):{stages:new Set(tagged.map(p=>p.sky.stage)).size,minTransfers:Math.max(0,new Set(tagged.map(p=>p.sky.stage)).size-1),quota:routeQuota,boxes:Array(routeTotal),width:LW,ct:customTracks}):null;
    if(!state.data)return;
    if(!keep){state.completed.clear();state.transfers=0;state.launches=0;state.catches=0;state.checkpoint=0;state.steps=0;state.events=[];state.seen.clear();}
    state.armed=false;state.airFrames=0;state.from=null;state.attemptSteps=0;state.seen.add(state.checkpoint);
    player.euc=true;player.veh='euc';player.whip=true;player.nitro=3;player.inv=60;
    const tr=tracks.find(t=>t.sky?.id==='loop-'+state.checkpoint)||tracks.find(t=>t.sky);
    if(tr){player.track=tr;player.trackS=Math.max(1,tr.sky.begin*tr.len-90);player.speed=0;pose(player,tr,player.trackS);}
    routeQuota=state.data.quota;routeTotal=state.data.boxes.length;log(keep?'respawn':'start',{checkpoint:state.checkpoint});
  };
  function pose(p,tr,s){const q=trackPoint(tr,s,p._bside);p.x=q.x+q.bx*24-13;p.y=q.y+q.by*24-15;p._bside={bx:q.bx,by:q.by};p.drawA=Math.atan2(q.bx,-q.by);p.footX=q.x;p.footY=q.y;p.vx=q.tx*p.speed;p.vy=q.ty*p.speed;p.onGround=true;}
  const onTrack=stepOnTrack;
  window.stepOnTrack=function(p){
    const tr=p.track;if(!tr)return;if(!active()||!tr.sky)return onTrack(p);
    const tag=tr.sky,b=tag.begin*tr.len,e=tag.end*tr.len,q=trackPoint(tr,p.trackS,p._bside),R=keys.ArrowRight||keys.KeyD,L=keys.ArrowLeft||keys.KeyA,J=keys.Space||keys.ArrowUp||keys.KeyW;
    const phase=(p.trackS-b)/(e-b);
    if(J&&!p._skyJumpHeld&&!state.armed){if(phase>=.55&&phase<=1.02){state.armed=true;message('EXIT ARMED');log('arm',{stage:tag.stage,phase});}else message('Wait for the gold sector');}
    p._skyJumpHeld=J;
    // D is a throttle around the entire loop, not a screen-space force that
    // reverses on its upper half. A brakes; gravity remains tangent-projected.
    p.speed+=GRAV*q.ty*.5+(R&&!L?.48:0)-(L?.75:0);p.speed*=.999;
    p.speed=Math.max(-14,Math.min(17,p.speed));
    const old=p.trackS;p.trackS+=p.speed;p.roll+=p.speed/11;
    if(p.trackS>=e&&old<e){
      state.completed.add(tag.stage);log('lap',{stage:tag.stage,speed:p.speed,armed:state.armed});
      if(!state.armed){p.trackS=b+(p.trackS-e);message('SPACE in gold sector to launch');}
    }
    if(p.trackS<b&&old>=b&&p.speed<0){p.trackS=e-(b-p.trackS);state.armed=false;}
    if(p.trackS>=tr.len){
      pose(p,tr,tr.len);const lip=trackPoint(tr,tr.len,p._bside),launch=Math.min(20,Math.max(9,p.speed+5));
      p.vx=lip.tx*launch;p.vy=lip.ty*launch;p.track=null;p._bside=null;p.onGround=false;p.jumping=false;p.trackCD=5;p._skyAir=true;
      state.armed=false;state.from=tag.id;state.airFrames=0;state.launches++;state.bestSpeed=Math.max(state.bestSpeed,launch);log('launch',{stage:tag.stage,vx:p.vx,vy:p.vy});message('ROCKET TRANSFER!','#8df1e2');return;
    }
    if(p.trackS<0){p.trackS=0;p.speed=0;}
    pose(p,tr,p.trackS);p.dir=p.vx<-.1?-1:1;
  };
  function closest(ax,ay,bx,by,cx,cy,dx,dy){
    // Swept wheel segment versus rail segment. Endpoint distance alone can
    // tunnel past a rail at launch speed. Intersection takes first priority.
    const ux=bx-ax,uy=by-ay,vx=dx-cx,vy=dy-cy,det=ux*vy-uy*vx;
    if(Math.abs(det)>1e-8){const t=((cx-ax)*vy-(cy-ay)*vx)/det,u=((cx-ax)*uy-(cy-ay)*ux)/det;if(t>=0&&t<=1&&u>=0&&u<=1)return {distance:0,u,t};}
    const l=vx*vx+vy*vy||1,u=Math.max(0,Math.min(1,((bx-cx)*vx+(by-cy)*vy)/l));return {distance:Math.hypot(bx-cx-u*vx,by-cy-u*vy),u,t:1};
  }
  function catchRail(p,ox,oy){
    if(p.trackCD>0||p.vy<0)return;
    let hit=null;
    for(const tr of tracks){if(!tr.sky||tr.sky.id===state.from)continue;
      // Receiving rails only: never attach to the middle of a completed circle.
      const end=tr.sky.begin*tr.len;
      for(let i=1;i<tr.pts.length&&tr.cum[i-1]<=end;i++){
        const a=tr.pts[i-1],b=tr.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=dy/len,ny=-dx/len;
        const k=closest(ox+13,oy+15,p.x+13,p.y+15,a[0]+nx*24,a[1]+ny*24,b[0]+nx*24,b[1]+ny*24);
        if(k.distance>10||p.vx*(-nx)+p.vy*(-ny)<0)continue;
        if(!hit||k.t<hit.t||(k.t===hit.t&&k.distance<hit.distance))hit={...k,tr,s:tr.cum[i-1]+k.u*len,tx:dx/len,ty:dy/len,nx,ny};
      }
    }
    if(!hit)return;
    p.track=hit.tr;p.trackS=hit.s;p.speed=Math.max(3,p.vx*hit.tx+p.vy*hit.ty);p._bside={bx:hit.nx,by:hit.ny};p._skyAir=false;
    pose(p,hit.tr,hit.s);p.dbl=false;state.catches++;state.armed=false;
    if(state.from&&state.airFrames>3){state.transfers++;log('transfer',{from:state.from,to:hit.tr.sky.id,airFrames:state.airFrames,speed:p.speed});message('CLEAN CATCH +250','#8df1e2');addScore(250,p.x,p.y,'TRANSFER');}
    state.checkpoint=hit.tr.sky.stage;state.seen.add(state.checkpoint);state.from=null;state.airFrames=0;
  }
  const step=stepPlayer;
  window.stepPlayer=function(){
    if(!active())return step();const p=player;state.steps++;state.attemptSteps++;
    if(p.dead>0)return step();
    if(p.trackCD>0)p.trackCD--;fireNitro(p);fireGun(p);
    if(p.peg){stepSwing(p);interactTiles(p);if(p.inv>0)p.inv--;return;}
    if(p.track){stepOnTrack(p);interactTiles(p);if(p.inv>0)p.inv--;return;}
    // Air steering is deliberately small. Rail-exit momentum is not destroyed
    // by ground friction, nor is upward launch speed treated as a short jump.
    const ox=p.x,oy=p.y;state.airFrames++;
    const R=keys.ArrowRight||keys.KeyD,L=keys.ArrowLeft||keys.KeyA;
    p.vx+=(R&&!L?.035:L&&!R?-.11:0);p.vx*=.9996;p.vy=Math.min(24,p.vy+GRAV);
    p.dir=p.vx<0?-1:1;p.drawA+=(Math.atan2(p.vy,p.vx)-p.drawA)*.06;p.roll+=p.vx/11;
    moveX(p);moveY(p);catchRail(p,ox,oy);interactTiles(p);if(p.inv>0)p.inv--;
    if(p.onGround&&!p.track){p.drawA*=.7;if(R)p.vx=Math.max(5,p.vx);if(L)p.vx-=.6;}
    if(p.y>LH*TILE-120||p.x<0||p.x>LW*TILE){log('fall');respawn(false);}
  };
  const originalWin=win;
  window.win=function(){if(active()&&(state.completed.size<state.data.stages||state.transfers<state.data.minTransfers)){message('Complete the sky route first');return;}log('finish',{loops:state.completed.size,transfers:state.transfers,deliveries});return originalWin();};
  function armFromEvent(){
    if(!active()||window.__delivery.paused||window.__delivery.state.menu||won||player.dead>0)return;
    const tr=player.track;if(!tr?.sky||state.armed)return;
    const phase=(player.trackS/tr.len-tr.sky.begin)/(tr.sky.end-tr.sky.begin);
    if(phase>=.55&&phase<=1.02){state.armed=true;message('EXIT ARMED');log('arm',{stage:tr.sky.stage,phase,input:'event'});}
  }
  window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat)armFromEvent();});
  function retry(){if(!active()||window.__delivery.paused||won)return;log('retry');respawn(false);cv.focus({preventScroll:true});}
  window.addEventListener('keydown',e=>{if(e.code==='KeyR'&&!e.repeat&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();retry();}});
  const header=document.querySelector('#delivery-header .actions');header?.insertAdjacentHTML('beforeend','<button class="delivery-btn" id="sky-retry">Retry catch</button>');document.getElementById('sky-retry')?.addEventListener('click',retry);
  header?.insertAdjacentHTML('beforeend','<button class="delivery-btn" id="sky-edit-copy">Edit route copy</button>');
  document.getElementById('sky-edit-copy')?.addEventListener('click',()=>{if(!state.data)return;const code=levelCode();__delivery.openEditor();loadCode(code);state.data=null;toast('Editable copy opened. Your original blueprint remains backed up.');});
  const shoot=fireGun;window.fireGun=function(p){shoot(p);if(active())p.gunCD=Math.min(p.gunCD,8);};
  header?.insertAdjacentHTML('beforeend','<select id="sky-checkpoint" aria-label="Return to a visited loop"><option value="0">Loop 1</option></select>');
  document.getElementById('sky-checkpoint')?.addEventListener('change',e=>{const value=Number(e.target.value);if(active()&&state.seen.has(value)){state.checkpoint=value;retry();}});
  document.getElementById('stagewrap').insertAdjacentHTML('beforeend','<div id="sky-flight"><span id="sky-state">SKY POST</span><strong id="sky-loop-count">LOOPS 0 / 4</strong><span id="sky-transfers">TRANSFERS 0</span><span id="sky-speed">0 SPEED</span></div><button id="sky-launch-touch" aria-label="Arm loop exit">LAUNCH</button>');
  const launch=document.getElementById('sky-launch-touch');let touchTimer;
  launch.addEventListener('pointerdown',e=>{e.preventDefault();armFromEvent();keys.Space=true;launch.setPointerCapture(e.pointerId);clearTimeout(touchTimer);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])launch.addEventListener(ev,()=>{touchTimer=setTimeout(()=>keys.Space=false,80);});
  function hud(){
    if(active()){
      const p=player,tr=p.track,phase=tr?.sky?(p.trackS/tr.len-tr.sky.begin)/(tr.sky.end-tr.sky.begin):-1;
      const lit=phase>=.55&&phase<=1.02;
      document.body.classList.toggle('sky-launch-ready',lit&&!state.armed);document.body.classList.toggle('sky-active',true);
      const selector=document.getElementById('sky-checkpoint'),known=[...state.seen].sort((a,b)=>a-b).join(',');
      if(selector.dataset.known!==known){selector.dataset.known=known;selector.innerHTML=[...state.seen].sort((a,b)=>a-b).map(i=>`<option value="${i}">Return to loop ${i+1}</option>`).join('');}
      if(document.activeElement!==selector)selector.value=String(state.checkpoint);
      const text=state.armed?'EXIT ARMED':lit?'SPACE: ARM LAUNCH':p.track?'ACCELERATE / GOLD SECTOR AHEAD':'AIRBORNE / CATCH THE NEXT RAIL';
      document.getElementById('sky-state').textContent=text;document.getElementById('sky-loop-count').textContent=`LOOPS ${state.completed.size} / ${state.data.stages}`;
      document.getElementById('sky-transfers').textContent=`TRANSFERS ${state.transfers}`;document.getElementById('sky-speed').textContent=`${Math.round(Math.hypot(p.vx,p.vy)*6)} SPEED`;
      launch.textContent=state.armed?'ARMED':lit?'LAUNCH NOW':'WAIT FOR GOLD';
      document.getElementById('delivery-hint').textContent=p.track?'D / right: throttle. A / left: brake. Tap Space in the gold sector.':'Keep steering toward the receiver. Hold C to throw airmail. R retries your last caught loop.';
      const map=document.getElementById('delivery-map'),c=map.getContext('2d');c.clearRect(0,0,map.width,map.height);
      for(const t of tracks){if(!t.sky)continue;c.strokeStyle=state.completed.has(t.sky.stage)?'#98eed2':'#8baaba';c.lineWidth=1;c.beginPath();for(let i=0;i<t.pts.length;i++){const x=t.pts[i][0]/(LW*TILE)*550+5,y=34+(t.pts[i][1]-2100)*.035;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}c.fillStyle='#ffd479';c.beginPath();c.arc(p.x/(LW*TILE)*550+5,34+(p.y-2100)*.035,3,0,7);c.fill();
    }else document.body.classList.remove('sky-active','sky-launch-ready');
  }
  window.__sky={state,active,closest,hud};
  // Called from the existing renderer immediately before its real render pass.
  let cx=null,cy=null,zoom=1;
  window.__skyView=function(camera,view){
    const m=window.__merged;
    const far=active()||window.__delivery?.state.menu?10000:1000;
    if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();}
    if(m?.trackGroup)m.trackGroup.visible=mode==='play'&&!active();
    if(m?.curveGroup)m.curveGroup.visible=mode==='edit'&&!window.__delivery?.state.menu;
    if(!active()){camera.rotation.set(0,0,0);
      cx=cy=null;
      if(window.__delivery?.state.menu){camera.left=-view.w/1.5;camera.right=view.w/1.5;camera.top=view.h/1.5;camera.bottom=-view.h/1.5;camera.position.set(990,-1940,650);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
      return;
    }
    const p=player,speed=Math.hypot(p.vx,p.vy),ahead=p.track?150:Math.max(-210,Math.min(240,p.vx*14));
    const targetX=p.x+13+ahead,targetY=-p.y+65-p.vy*6;
    const desired=Math.max(.85,Math.min(2.0,view.w/(speed>15?950:820)));
    zoom+=(desired-zoom)*.045;cx=cx===null?targetX:cx+(targetX-cx)*.14;cy=cy===null?targetY:cy+(targetY-cy)*.13;
    // Bound lag so a high-speed reversal or retry never loses the rider.
    cx=Math.max(p.x-view.w/(zoom*2)*.62,Math.min(p.x+view.w/(zoom*2)*.62,cx));cy=Math.max(-p.y-view.h/(zoom*2)*.57,Math.min(-p.y+view.h/(zoom*2)*.57,cy));
    camera.left=-view.w/(2*zoom);camera.right=view.w/(2*zoom);camera.top=view.h/(2*zoom);camera.bottom=-view.h/(2*zoom);camera.updateProjectionMatrix();camera.position.set(cx+135,cy+140,800);camera.lookAt(cx,cy,0);camera.updateMatrixWorld();
  };
  const render=window.render;window.render=function(){render();hud();};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
