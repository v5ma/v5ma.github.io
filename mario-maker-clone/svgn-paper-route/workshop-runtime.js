/* Variety/scale adapter. Prior courses keep their physics. New mission data
 * belongs to the native level code, including rooms, keys and physical gates. */
(function(){'use strict';
 function boot(){
  const W=WorkshopCore;let mission=null,jump=false,mapOpen=false,visual=null;
  const state={keys:new Set(),rooms:new Set(),defeated:new Set(),events:[],version:'workshop-1'};
  const nativeLoad=loadCode,nativeCode=levelCode;
  function checked(m){if(!m)return null;if(m.version!==1||!['quarry','vault','sky'].includes(m.style))throw Error('Unsupported mission data.');for(const key of['rooms','keys','doors','sentries']){if(!Array.isArray(m[key])||m[key].length>64)throw Error('Invalid '+key);for(const a of m[key]){if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||Math.abs(a.x)>24000||Math.abs(a.y)>12000||typeof a.id!=='string'||a.id.length>80)throw Error('Invalid mission object.');}}for(const a of [...m.rooms,...m.doors])if(!Number.isFinite(a.w)||!Number.isFinite(a.h)||a.w<1||a.h<1||a.w>24000||a.h>12000)throw Error('Invalid room or door size.');if(!m.rooms.length||!Array.isArray(m.requiredKeys)||!m.requiredKeys.every(k=>typeof k==='string'&&k.length<81))throw Error('Invalid mission objectives.');for(const key of ['stages','minTransfers','quota','requiredGrapples'])if(!Number.isInteger(m[key])||m[key]<0||m[key]>192)throw Error('Invalid mission goal.');return W.clone(m);}
  window.loadCode=function(code){let decoded;try{decoded=W.decode(code);checked(decoded.mission);}catch(e){toast(e.message);return false;}const ok=nativeLoad(code);if(ok)mission=decoded.mission;return ok;};
  window.levelCode=function(){const [a,b]=nativeCode().split('.'),m=JSON.parse(b64d(a));if(mission)m.wm=mission;return b64e(JSON.stringify(m))+'.'+b;};
  const on=()=>__sky.active()&&!!mission;
  const log=(type,id)=>{state.events.push({type,id,step:__sky.state.steps,x:player.x,y:player.y});if(state.events.length>500)state.events.shift();};
  function openDoors(){if(!mission)return;for(const d of mission.doors)if(state.keys.has(d.key))for(let y=Math.floor(d.y/36);y<Math.ceil((d.y+d.h)/36);y++)for(let x=Math.floor(d.x/36);x<Math.ceil((d.x+d.w)/36);x++)spg(x,y,0);}
  const spawn=spawnWorld;
  window.spawnWorld=function(x,y){const keep=routeKeep;spawn(x,y);if(!on())return;
   if(!keep){state.keys.clear();state.rooms.clear();state.defeated.clear();state.events=[];}
   Object.assign(__sky.state.data,{cells:grid,width:LW,height:LH,wm:mission,kind:'open',stages:mission.stages,minTransfers:mission.minTransfers,requiredGrapples:mission.requiredGrapples||0});routeQuota=mission.quota??1;
   if(mission.groundStart&&(!keep||!__grapple.state.checkpoint)){player.track=null;player._bside=null;player.x=x*36+5;player.y=(y+1)*36-30;player.vx=player.vy=0;player.onGround=false;player.drawA=0;}
   player.shield=mission.precision&&!keep||player.shield;jump=false;openDoors();log(keep?'retry':'start',mission.id);
  };
  const step=stepPlayer;
  window.stepPlayer=function(){
   if(!on())return step();const p=player,ground=p.onGround&&!p.track&&!p.peg,R=keys.KeyD||keys.ArrowRight,L=keys.KeyA||keys.ArrowLeft;
   if(mission.precision&&!p.dead){
    if(ground){p.vx=R?Math.min(7.8,p.vx+.60):L?Math.max(-7.8,p.vx-.75):p.vx*.74;if(jump){p.vy=-13.6;p.onGround=false;}}
    else if(!p.track&&!p.peg&&Math.abs(p.vx)<11){p.vx+=(R?.22:0)-(L?.22:0);if(!R&&!L)p.vx*=.92;}
   }
   const vx=p.vx;if(p.track?.sky&&p.track.sky.kind!=='open'){__sky.state.steps++;if(p.trackCD>0)p.trackCD--;fireNitro(p);fireGun(p);stepOnTrack(p);interactTiles(p);if(p.inv>0)p.inv--;}else step();
   if(mission.precision&&ground&&player===p&&!p.track&&!p.peg&&p.onGround)p.vx=vx;
   jump=false;if(player!==p)return;
   const cx=p.x+p.w/2,cy=p.y+p.h/2;
   for(const room of mission.rooms)if(cx>=room.x&&cx<=room.x+room.w&&cy>=room.y&&cy<=room.y+room.h&&!state.rooms.has(room.id)){state.rooms.add(room.id);log('room',room.id);}
   for(const key of mission.keys)if(!state.keys.has(key.id)&&Math.hypot(cx-key.x,cy-key.y)<36){state.keys.add(key.id);log('key',key.id);popText(p.x,p.y-22,'RELAY KEY / RETURN TO THE DOOR','#a0ffe7');openDoors();}
   for(const s of mission.sentries){if(state.defeated.has(s.id))continue;const dx=s.x-cx,dy=s.y-cy;
    if(!p.peg&&__grapple.state.lash>0&&Math.abs(dy)<52&&dx*p.dir>-10&&dx*p.dir<155&&GrappleCore.lineClear({x:cx,y:cy},s,(x,y)=>SOLID.has(pg(Math.floor(x/36),Math.floor(y/36))))){state.defeated.add(s.id);log('whip-strike',s.id);addScore(150,s.x,s.y,'WHIP CLEAR');}
    else if(Math.hypot(dx,dy)<(s.r||18)+14&&p.inv===0){log('sentry-hit',s.id);hurt();}
   }
  };
  window.addEventListener('keydown',e=>{if(!on()||__delivery.paused||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(e.code==='Space'&&!e.repeat)jump=true;if(e.code==='KeyM'&&!e.repeat){mapOpen=!mapOpen;document.getElementById('mission-map').hidden=!mapOpen;}},true);
  const winRoute=win;
  window.win=function(){if(on()&&(mission.requiredKeys||[]).some(k=>!state.keys.has(k))){popText(player.x,player.y-20,'FIND THE RELAY KEY FIRST','#ffdc98');return;}return winRoute();};
  const sceneUpdate=SkyVisual.update;
  SkyVisual.update=function(){sceneUpdate();if(__sky.active()&&window.__cloudview){const h=__cloudview.hero.group;h.scale.setScalar(.88);const angle=h.rotation.z,shift=24*(1-.88);h.position.x+=Math.sin(angle)*shift;h.position.y-=Math.cos(angle)*shift;}if(on())updateMission();};
  const frameCamera=CloudDepthCamera.forFrame;
  CloudDepthCamera.forFrame=function(camera,view){const result=frameCamera(camera,view);if(result.isPerspectiveCamera){result.fov=Math.atan(Math.tan(result.fov*Math.PI/360)*1.20)*360/Math.PI;result.updateProjectionMatrix();}return result;};
  const head=document.querySelector('#delivery-header .actions');head.insertAdjacentHTML('beforeend','<button id="mission-map-button" class="delivery-btn" title="Map (M)">Map</button>');
  document.getElementById('mission-map-button').onclick=()=>{mapOpen=!mapOpen;document.getElementById('mission-map').hidden=!mapOpen;};
  const panel=document.createElement('section');panel.id='mission-map';panel.hidden=true;panel.setAttribute('aria-label','Discovered route map');panel.innerHTML='<div><strong>ROUTE MAP</strong><button id="close-mission-map" aria-label="Close map">Close</button></div><canvas width="520" height="220" id="mission-map-canvas"></canvas><p id="mission-map-label">Explore a route to reveal its rooms.</p>';
  document.getElementById('stagewrap').append(panel);document.getElementById('close-mission-map').onclick=()=>{mapOpen=false;panel.hidden=true;cv.focus();};
  function updateMission(){
   const m=mission,c=document.getElementById('mission-map-canvas'),g=c.getContext('2d'),pad=18;
   if(mapOpen){g.clearRect(0,0,c.width,c.height);const scale=Math.min((c.width-pad*2)/(LW*36),(c.height-pad*2)/(Math.max(...m.rooms.map(r=>r.y+r.h))-Math.min(...m.rooms.map(r=>r.y))));const y0=Math.min(...m.rooms.map(r=>r.y));
    for(const r of m.rooms){const visited=state.rooms.has(r.id);g.fillStyle=visited?'#255773':'#162834';g.strokeStyle=visited?'#81cfdb':'#3b5260';g.fillRect(pad+r.x*scale,pad+(r.y-y0)*scale,r.w*scale,r.h*scale);g.strokeRect(pad+r.x*scale,pad+(r.y-y0)*scale,r.w*scale,r.h*scale);if(visited){g.fillStyle='#dbede9';g.font='9px system-ui';g.fillText(r.name,pad+r.x*scale+4,pad+(r.y-y0)*scale+13);}}
    for(const k of m.keys){g.fillStyle=state.keys.has(k.id)?'#87dfa7':'#ffcf66';g.fillRect(pad+k.x*scale-3,pad+(k.y-y0)*scale-3,6,6);}g.fillStyle='#fff4d4';g.beginPath();g.arc(pad+(player.x+13)*scale,pad+(player.y+15-y0)*scale,4,0,7);g.fill();
   }
   document.getElementById('mission-map-label').textContent=`${state.rooms.size} / ${m.rooms.length} areas visited. ${state.keys.size} / ${m.keys.length} relay keys. Pale marker: you.`;
   if(m.precision){document.getElementById('cloud-flight-label').textContent=state.keys.size?'RELAY ACQUIRED / THE WEST DOOR IS OPEN':'FIND THE KEY IN THE UPPER GALLERY, THEN RETURN';document.getElementById('cloud-control-tip').textContent='A/D: MOVE / SPACE: JUMP / Z: WHIP + GRAPPLE / M: MAP';document.getElementById('cloud-loops').textContent=`${state.rooms.size}/${m.rooms.length}`;const el=document.querySelector('.cloud-loop .cloud-label');if(el)el.textContent='ROOMS';}
   if(visual){for(const item of visual.keys)item.mesh.visible=!state.keys.has(item.id);for(const item of visual.doors)item.mesh.visible=!state.keys.has(item.key);for(const item of visual.sentries)item.mesh.visible=!state.defeated.has(item.id);}
  }
  const render=window.render;
  window.render=function(){if(window.RouteWorkshop?.active){RouteWorkshop.draw();return;}render();if(on())updateMission();
   const menu=document.getElementById('delivery-menu');if(menu?.classList.contains('open')&&!menu.querySelector('#course-library-toggle')){
    menu.querySelector('h1').innerHTML='Ride. Swing.<br><em>Explore.<br>Make it yours.</em>';
    menu.querySelector('.delivery-hero>p').textContent='Choose an open-ramp descent, a peg-and-whip crossing, or a key-and-door exploration route. Build your own in the Route Workshop.';
    for(const b of menu.querySelectorAll('[data-course]'))b.classList.toggle('classic-course',Number(b.dataset.course)<3);
    const host=menu.querySelector('.delivery-courses');const ordered=[4,3,5,0,1,2];ordered.forEach(i=>{const b=host.querySelector(`[data-course="${i}"]`);if(b)host.append(b);});
    const b=document.createElement('button');b.id='course-library-toggle';b.className='delivery-btn';b.textContent='Show the 3 classic loop trials';b.onclick=()=>{const all=menu.classList.toggle('show-classic');b.textContent=all?'Hide classic loop trials':'Show the 3 classic loop trials';};host.append(b);
   }
  };
  window.WorkshopMission={state,get data(){return mission},on,setGraphics(v){visual=v;},update:updateMission};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
