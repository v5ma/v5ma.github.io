/* Ground-first movement/progression adapter. Sky trials are left intact. */
(function(){'use strict';
 function boot(){
  let meta=null,lastTrack=null,lastJump=false,touchJump=false;
  const state={version:'ground-first-1',upper:new Set(),hooks:0,steps:0,events:[],onboarding:0};
  const active=()=>mode==='play'&&!!meta&&!!__sky.state.data;
  const originalLoad=loadCode,originalCode=levelCode;
  function valid(v){if(v?.adventure===2){if(!Array.isArray(v.sections)||v.sections.length>32||!Array.isArray(v.cast)||v.cast.length>24)return false;if(!v.sections.every(s=>Number.isFinite(s.x)&&typeof s.name==='string'&&s.name.length<100)||!v.cast.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)&&typeof n.name==='string'&&n.name.length<60&&typeof n.text==='string'&&n.text.length<250))return false;}return v&&v.version===1&&['village','canal','garden'].includes(v.style)&&Number.isInteger(v.ground)&&v.ground>2&&v.ground<280&&Number.isInteger(v.quota)&&v.quota>=0&&v.quota<=40;}
  window.loadCode=function(code){
   let m;try{m=JSON.parse(b64d(code.split('.')[0]));if(m.gp&&!valid(m.gp))return false;}catch{return false;}
   const ok=originalLoad(code);if(ok)meta=m.gp?{...m.gp}:null;return ok;
  };
  window.levelCode=function(){const [a,b]=originalCode().split('.'),m=JSON.parse(b64d(a));if(meta)m.gp=meta;return b64e(JSON.stringify(m))+'.'+b;};
  const log=(type,extra={})=>{state.events.push({type,step:state.steps,x:player.x,y:player.y,...extra});if(state.events.length>600)state.events.shift();};
  const spawn=spawnWorld;
  window.spawnWorld=function(x,y){
   const keep=routeKeep;spawn(x,y);if(!meta)return;
   const boxes=[];let goal=null;for(let ty=0;ty<LH;ty++)for(let tx=0;tx<LW;tx++){const v=grid[ty*LW+tx];if(v===T.MAILBOX)boxes.push({x:tx,y:ty});if(v===T.GOAL)goal={x:tx,y:ty+1};}
   __sky.state.data={...__sky.state.data,kind:'ground',gp:meta,ground:meta.ground,cells:grid,ct:customTracks,width:LW,height:LH,boxes,goal,quota:meta.quota,stages:0,minTransfers:0,requiredGrapples:0};
   routeQuota=0;routeTotal=boxes.length;
   player.track=null;player._bside=null;player.x=x*TILE+5;player.y=(y+1)*TILE-30;player.vx=player.vy=player.speed=0;player.drawA=0;player.onGround=false;player._jHeld=false;
   player.euc=true;player.veh='euc';player.whip=true;player.nitro=0;
   if(!keep){state.upper.clear();state.steps=0;state.events=[];state.hooks=0;state.onboarding=0;}
   lastTrack=null;lastJump=false;log(keep?'checkpoint':'start');
  };
  const find=findTrackAttach;
  window.findTrackAttach=function(...args){return active()?null:find(...args);};
  const step=stepPlayer;
  window.stepPlayer=function(){
   if(!active())return step();
   const p=player,S=__sky.state,K=GrappleCore;S.steps++;S.attemptSteps++;state.steps++;
   __grapple.tickInput();
   const old={x:p.x,y:p.y},tr=p.track,J=!!(keys.Space||keys.ArrowUp||keys.KeyW||touchJump),jp=J&&!lastJump;lastJump=J;
   if(p.dead>0){GroundNative.step();return;}
   if(p.peg){
    fireGun(p);K.swing(p,{right:!!(keys.KeyD||keys.ArrowRight),left:!!(keys.KeyA||keys.ArrowLeft),up:!!keys.ArrowUp,down:!!keys.ArrowDown},(x,y)=>SOLID.has(pg(Math.floor(x/36),Math.floor(y/36))));
    if(p.inv>0)p.inv--;interactTiles(p);
   }else if(tr){
    if(p.trackCD>0)p.trackCD--;fireGun(p);
    const exit=K.ride(p,{right:!!(keys.KeyD||keys.ArrowRight),left:!!(keys.KeyA||keys.ArrowLeft),jump:jp});
    if(exit){S.launches++;lastTrack=tr.sky.id;p._airTicks=0;log('optional-lip',{rail:lastTrack});}
    if(p.inv>0)p.inv--;interactTiles(p);
   }else{
    GroundNative.step();if(player!==p)return;
    p._airTicks=(p._airTicks||0)+1;
    const hit=K.catchRail(p,old,tracks,lastTrack);
    if(hit){
     S.catches++;S.transfers++;p.jumping=false;p.dbl=false;p._airTicks=0;lastTrack=null;
     if(!state.upper.has(hit.tr.sky.id)){state.upper.add(hit.tr.sky.id);addScore(100,p.x,p.y-20,'UPPER ROUTE +100');log('upper-route',{rail:hit.tr.sky.id});}
    }
    if(p.onGround&&!p.track){p.drawA=0;S.airFrames=0;}else S.airFrames++;
   }
   p.x=Math.max(.01,Math.min(LW*TILE-p.w-.01,p.x));
   if(state.hooks!==__grapple.state.hooks){state.hooks=__grapple.state.hooks;log('optional-grapple',{hooks:state.hooks});}
  };
  // A smaller rider and a little more planning space, without shrinking its hitbox.
  const update=SkyVisual.update;
  SkyVisual.update=function(){update();if(__sky.active()&&window.__cloudview){const h=__cloudview.hero.group,a=h.rotation.z;h.scale.setScalar(.90);h.position.x+=Math.sin(a)*2.4;h.position.y-=Math.cos(a)*2.4;}};
  const camera=CloudDepthCamera.forFrame;
  CloudDepthCamera.forFrame=function(o,v){const c=camera(o,v);if(c.isPerspectiveCamera){c.fov=Math.atan(Math.tan(c.fov*Math.PI/360)*1.16)*360/Math.PI;c.updateProjectionMatrix();}return c;};
  const order=GroundCampaign.order;
  function menu(){
   const menu=document.getElementById('delivery-menu');if(!menu?.classList.contains('open')||menu.querySelector('#advanced-routes-toggle'))return;
   menu.querySelector('h1').innerHTML='Start on the street.<br><em>Find your<br>own route.</em>';
   menu.querySelector('.delivery-hero>p').textContent='Explore six neighborhoods in Sunrise Borough, then continue along Waterwheel Boulevard and into Copperleaf Gardens. Ride, jump, meet neighbors, defeat bots and find optional high routes.';
   menu.querySelector('.delivery-controls').innerHTML='<span class="key">A / D</span> MOVE &nbsp; <span class="key">SPACE</span> JUMP &nbsp; <span class="key">C</span> DELIVER<br><span class="key">Z</span> OPTIONAL WHIP &nbsp; <span class="key">P</span> PAUSE';
   menu.querySelector('.minor').textContent='Longer adventures, friendly neighbors, patrol bots, shields and loop routes. Cross the finish to continue; every delivery is a bonus.';
   const list=menu.querySelector('.delivery-courses');
   for(const i of order){const b=list.querySelector(`[data-course="${i}"]`);if(!b)continue;b.classList.toggle('expert-route',i<4);list.append(b);if(i>=4){b.querySelector('small').textContent=GroundCampaign.specs[i-4].district+' / '+GroundCampaign.specs[i-4].difficulty;}}
   const b=document.createElement('button');b.id='advanced-routes-toggle';b.className='delivery-btn';b.textContent='Advanced challenges: sky loops and Hookline Run';b.setAttribute('aria-expanded','false');b.onclick=()=>{const open=menu.classList.toggle('show-expert');b.setAttribute('aria-expanded',String(open));b.textContent=open?'Hide advanced challenges':'Advanced challenges: sky loops and Hookline Run';};list.append(b);
  }
  function hud(){
   document.body.classList.toggle('ground-route-active',active());
   if(!active())return;
   const d=__sky.state.data,p=player,progress=Math.max(0,Math.min(1,(p.x/36-3)/((d.goal?.x||LW-5)-3)));
   document.querySelector('#cloud-hud .cloud-loop .cloud-label').textContent='ROUTE';
   document.getElementById('cloud-loops').textContent=Math.floor(progress*100)+'%';
   document.getElementById('cloud-loop-progress').style.strokeDashoffset=245*(1-progress);
   const text=state.steps<190?'A / D TO MOVE. TAKE YOUR TIME.':p.x<520?'C: BONUS DELIVERIES. SPACE: JUMP. THE FINISH IS ALWAYS OPEN.':p.x<1120?'JUMP ONTO GOLD TO EXPLORE. THE STREET IS ALWAYS OPEN.':meta.index===2?'Z: WHIP PRACTICE IS OPTIONAL. LAND SAFELY ON THE ROAD.':deliveries>=routeQuota?'REACH THE STRIPED FINISH. COLLECTIBLES AND MAIL ARE OPTIONAL.':'STAY LOW OR TRY AN UPPER SHORTCUT. BOTH REACH THE DEPOT.';
   document.getElementById('cloud-flight-label').textContent=text;
   document.getElementById('cloud-control-tip').textContent=`SPACE: JUMP / C: PAPER / Z: WHIP / UPPER ROUTES FOUND: ${state.upper.size}`;
   document.getElementById('cloud-phase-fill').style.width=Math.round(progress*100)+'%';
   document.getElementById('sky-launch-touch').textContent='JUMP';
   document.getElementById('sky-launch-touch').setAttribute('aria-label','Jump');
   document.getElementById('delivery-hint').textContent=text;
   document.getElementById('cloud-hud').classList.remove('ready','armed');document.body.classList.remove('sky-launch-ready');
   const res=document.getElementById('delivery-results');
   if(won&&res?.classList.contains('open')){res.querySelector('.delivery-hero>p').textContent=`Level complete! ${deliveries} bonus deliveries and ${state.upper.size} upper routes found. Crossing the finish completes the adventure.`;const b=res.querySelector('[data-delivery="next"]');if(b)b.textContent=meta.index<2?'Next level':'Choose another adventure';}
  }
  // Capture navigation before the old index-based Next handler; course IDs and
  // saves remain stable. Nothing is locked behind a skill challenge.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-delivery="next"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const at=order.indexOf(__delivery.state.route);__delivery.startRoute(order[(at+1)%order.length]);},true);
  document.addEventListener('click',e=>{if(e.target.closest('[data-delivery="routes"]'))queueMicrotask(menu);},true);
  const render=window.render;window.render=function(){render();menu();hud();};
  // One-click beginner blueprint in the real existing creator.
  const btn=document.createElement('button');btn.id='beginner-blueprint';btn.className='delivery-btn';btn.textContent='Beginner template';
  document.querySelector('#delivery-header .actions').append(btn);
  btn.onclick=()=>{if(mode==='edit'&&!confirm('Load a beginner template into the editor? Save or export your current work first.'))return;__delivery.openEditor();loadCode(GroundCampaign.encode(GroundCampaign.make(0,T)));toast('Ground, Start, Depot and optional tracks are editable. The lower route does not require the upper rails.');};
  window.__ground={state,active,get meta(){return meta},hud,menu};
  menu();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
