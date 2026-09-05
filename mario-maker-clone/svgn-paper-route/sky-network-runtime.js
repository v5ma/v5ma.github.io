/* Network traversal is optional; the existing street and finish logic remain.
 * Telemetry observes real catches and flight. No target relocation or auto-win. */
(function(){'use strict';
 function boot(){
  const state={version:'connected-world-2',visits:new Set(),chain:0,bestChain:0,flights:0,events:[],minY:Infinity,lastReleases:0};
  let lastSurface=null,airStart=0,regionView=false,source=null,wasPaused=false,mapLocal=false,mapDirty=true,backdropMesh=null;
  const active=()=>window.__ground?.active()&&!!__ground.meta?.skyNetwork;
  const record=(type,extra={})=>{state.events.push({type,step:__ground.state.steps,x:player.x,y:player.y,...extra});if(state.events.length>1200)state.events.shift();};
  const spawn=spawnWorld;window.spawnWorld=function(x,y){const keep=routeKeep;spawn(x,y);if(!active())return;player._networkAir=false;source=null;lastSurface=null;airStart=0;if(!keep){state.visits.clear();state.chain=state.bestChain=state.flights=0;state.events=[];state.minY=Infinity;}state.lastReleases=__grapple.state.releases;releaseRequired=false;mapDirty=true;};
  let releaseRequired=false;
  const whipInput=__grapple.tickInput;
  __grapple.tickInput=function(){
    if(active()&&releaseRequired){const z=keys.KeyZ;keys.KeyZ=false;try{whipInput();}finally{keys.KeyZ=z;}if(!z)releaseRequired=false;}
    else whipInput();
  };
  // Key-up can release the tether between simulation ticks. Observe the real
  // release event before advancing flight; do not lose its momentum or history.
  function observeRelease(){
   if(__grapple.state.releases===state.lastReleases)return false;
   state.lastReleases=__grapple.state.releases;
   const event=__grapple.state.events.findLast(e=>e.type==='release');
   player._networkAir=true;airStart=__ground.state.steps;lastSurface='peg:'+(event?.id||'release');
   state.flights++;record('whip-release',{peg:event?.id||null,turns:event?.loops||0,vx:player.vx,vy:player.vy});
   return true;
  }
  const step=stepPlayer;window.stepPlayer=function(){
   if(!active())return step();const p=player,old=p.track,peg=p.peg;
   const releasedBefore=observeRelease();
   step();if(player!==p)return;const releasedDuring=observeRelease();
   state.minY=Math.min(state.minY,p.y);
   if(old&&!p.track&&!p.onGround&&!p.peg){p._networkAir=true;lastSurface=old.sky?.id;airStart=__ground.state.steps;state.flights++;record('launch',{from:lastSurface,vx:p.vx,vy:p.vy});}
   if(p.track&&p.track!==old){
    const id=p.track.sky?.id;if(id){state.visits.add(id);state.chain=lastSurface&&airStart?state.chain+1:1;state.bestChain=Math.max(state.bestChain,state.chain);record('catch',{from:lastSurface,to:id,airTicks:airStart?__ground.state.steps-airStart:0});}
    p._networkAir=false;airStart=0;lastSurface=null;
   }
   if(peg&&!p.peg&&!releasedBefore&&!releasedDuring){releaseRequired=!!keys.KeyZ;p._networkAir=true;airStart=__ground.state.steps;lastSurface='peg:blocked';record('blocked-swing',{vx:p.vx,vy:p.vy});}
   if(p.onGround&&!p.track&&!p.peg){p._networkAir=false;state.chain=0;lastSurface=null;airStart=0;}
  };
  const buttons=document.querySelector('#delivery-header .actions');buttons.insertAdjacentHTML('beforeend','<button id="network-map-button" class="delivery-btn" title="Whole route map (M)">Route map</button><button id="network-wide-button" class="delivery-btn" aria-pressed="false" title="Wide view (V)">Wide view</button>');
  const dialog=document.createElement('dialog');dialog.id='sky-network-map';dialog.setAttribute('aria-label','The whole connected route');dialog.innerHTML='<div class="network-map-heading"><div><small>ONE WORLD / MANY ROUTES</small><h2>Above the neighborhood</h2></div><button id="network-map-close">Back to riding</button></div><div class="network-map-tools"><button id="network-map-world" aria-pressed="true">Whole world</button><button id="network-map-nearby" aria-pressed="false">Nearby routes</button><span>Reading the map never moves the rider.</span></div><canvas id="network-map-canvas" width="1200" height="350" aria-label="Map of actual ramps, pegs and the continuous road"></canvas><p>Gold marks visited tracks. Pale tracks and peg dots show the optional upper world. The road across the bottom still reaches the finish. This map does not move your rider.</p><div class="network-legend"><span>Gold: visited</span><span>Mint: upper galleries</span><span>Triangles: road entrances</span><span>Dots: grapple pegs</span><span>Coral: you</span></div><div id="network-map-count" role="status"></div>';
  document.body.append(dialog);
  function drawMap(){
   if(!active())return;
   const c=document.getElementById('network-map-canvas'),g=c.getContext('2d'),all=tracks.filter(t=>t.sky?.network),ground=__ground.meta.ground*36,w=LW*36;
   // Equal-scale projection preserves the shape of C-ramps and open bowls.
   const ext=all.flatMap(t=>t.pts),top=Math.max(0,(ext.length?Math.min(...ext.map(p=>p[1])):ground-600)-90);
   let bounds={x:0,y:top,w,h:ground-top+70};
   if(mapLocal){const h=1200,bw=h*(c.width-48)/(c.height-74);bounds={x:Math.max(0,Math.min(w-bw,player.x-bw*.4)),y:Math.max(0,Math.min(ground-h+70,player.y-h*.70)),w:bw,h};}
   const scale=Math.min((c.width-48)/bounds.w,(c.height-74)/bounds.h),ox=(c.width-bounds.w*scale)/2,oy=36+(c.height-74-bounds.h*scale)/2;
   const map=p=>[ox+(p[0]-bounds.x)*scale,oy+(p[1]-bounds.y)*scale];
   g.fillStyle='#102736';g.fillRect(0,0,c.width,c.height);
   g.save();g.beginPath();g.rect(12,24,c.width-24,c.height-40);g.clip();
   for(const [i,sec]of __ground.meta.skyNetwork.sectors.entries()){
    const [x]=map([sec.x,0]);g.strokeStyle='#355261';g.lineWidth=1;g.beginPath();g.moveTo(x,24);g.lineTo(x,c.height-16);g.stroke();
    g.fillStyle='#aecbc9';g.font='11px system-ui';g.fillText(String(i+1).padStart(2,'0')+(mapLocal?' '+sec.name:''),x+5,36);
   }
   for(const t of all){
    g.strokeStyle=state.visits.has(t.sky.id)?'#ffd276':t.sky.tier===3?'#97ddd8':'#c5d3bd';g.lineWidth=state.visits.has(t.sky.id)?2.7:1.6;
    g.beginPath();t.pts.forEach((p,i)=>i?g.lineTo(...map(p)):g.moveTo(...map(p)));g.stroke();
    if(t.sky.entry){const [x,y]=map(t.pts[0]);g.fillStyle='#93f5be';g.beginPath();g.moveTo(x,y-9);g.lineTo(x-5,y+2);g.lineTo(x+5,y+2);g.fill();}
   }
   g.strokeStyle='#fff2d0';g.lineWidth=3;g.beginPath();g.moveTo(...map([0,ground]));g.lineTo(...map([w,ground]));g.stroke();
   g.fillStyle='#82f6df';for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(pg(x,y)===T.PEG){const [a,b]=map([x*36+18,y*36+18]);g.beginPath();g.arc(a,b,mapLocal?3:2,0,7);g.fill();}
   const [x,y]=map([player.x+13,player.y+15]);g.fillStyle='#ff8e6e';g.strokeStyle='#fff0d5';g.lineWidth=1.5;g.beginPath();g.arc(x,y,6,0,7);g.fill();g.stroke();g.restore();
   const id=player.track?.sky.sector,sec=__ground.meta.skyNetwork.sectors[id];
   document.getElementById('network-map-count').textContent=`${all.length} surfaces / ${__ground.meta.skyNetwork.pegCount} pegs / ${state.visits.size} visited / Best aerial chain: ${state.bestChain}${sec?' / '+sec.name:''}`;
   document.getElementById('network-map-world').setAttribute('aria-pressed',String(!mapLocal));
   document.getElementById('network-map-nearby').setAttribute('aria-pressed',String(mapLocal));
   mapDirty=false;
  }
  function openMap(){if(!active()||won||dialog.open||__delivery.state.menu)return;wasPaused=__delivery.paused;if(!wasPaused)__delivery.act('pause');for(const k of Object.keys(keys))keys[k]=false;dialog.showModal();mapDirty=true;drawMap();document.getElementById('network-map-close').focus();}
  dialog.addEventListener('close',()=>{if(!wasPaused&&__delivery.paused)__delivery.act('resume');cv.focus({preventScroll:true});});
  document.getElementById('network-map-world').onclick=()=>{mapLocal=false;mapDirty=true;drawMap();};
  document.getElementById('network-map-nearby').onclick=()=>{mapLocal=true;mapDirty=true;drawMap();};
  document.getElementById('network-map-button').onclick=openMap;document.getElementById('network-map-close').onclick=()=>dialog.close();
  function wide(){regionView=!regionView;document.getElementById('network-wide-button').setAttribute('aria-pressed',String(regionView));cv.focus({preventScroll:true});}
  document.getElementById('network-wide-button').onclick=wide;
  window.addEventListener('keydown',e=>{if(!active()||e.repeat||__delivery.state.menu||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;if(e.code==='KeyM'){e.preventDefault();if(dialog.open)dialog.close();else openMap();}if(e.code==='KeyV'&&!dialog.open){e.preventDefault();wide();}});
  // A wide survey camera must never expose the finite edge of the sky plane.
  // Keep only this unlit gradient camera-relative; all tracks/clouds retain
  // their actual world positions and perspective parallax.
  function frameBackdrop(c){
   if(!window.__cloudview?.root)return;
   backdropMesh=__cloudview.root.children.find(o=>o.renderOrder===-100&&o.material?.map&&o.geometry?.parameters?.width)||null;
   if(!backdropMesh)return;
   const T=__merged.THREE,dir=new T.Vector3();c.getWorldDirection(dir);
   const distance=5000,halfHeight=Math.tan(c.fov*Math.PI/360)*distance;
   backdropMesh.position.copy(c.position).addScaledVector(dir,distance);
   backdropMesh.quaternion.copy(c.quaternion);
   backdropMesh.scale.set(halfHeight*2*c.aspect*1.10/backdropMesh.geometry.parameters.width,halfHeight*2*1.10/backdropMesh.geometry.parameters.height,1);
   backdropMesh.updateMatrixWorld(true);
  }
  const camera=CloudDepthCamera.forFrame;
  CloudDepthCamera.forFrame=function(o,v){const c=camera(o,v);if(!active()||!c.isPerspectiveCamera){source=null;return c;}
   const target={x:player.x+13+Math.max(-160,Math.min(210,player.vx*12)),y:-player.y+145};
   if(!source||Math.abs(source.x-target.x)>650||Math.abs(source.y-target.y)>450)source={...target};else{source.x+=(target.x-source.x)*.16;source.y+=(target.y-source.y)*.16;}
   const height=regionView?1550:Math.max(680,Math.min(900,v.h*1.03));c.fov=Math.atan(height/2/835)*360/Math.PI;c.position.set(source.x+205,source.y+125,800);c.lookAt(source.x,source.y,0);c.updateProjectionMatrix();c.updateMatrixWorld();frameBackdrop(c);return c;
  };
  const render=window.render;window.render=function(){if(dialog.open){if(mapDirty)drawMap();return;}render();const on=active()&&!__delivery.state.menu;document.body.classList.toggle('network-world-active',on);document.getElementById('network-map-button').hidden=!on;document.getElementById('network-wide-button').hidden=!on;if(!on)return;if(dialog.open)drawMap();
   if(__ground.state.steps%5===0){document.getElementById('cloud-control-tip').textContent='M: ROUTE MAP / V: WIDE VIEW / Z: GRAPPLE / STREET OR SKY: YOUR CHOICE';document.getElementById('cloud-flight-label').textContent=player.peg?'WIND UP, THEN RELEASE Z TOWARD ANOTHER SHELF':player.track?`${player.track.sky.label} / ${state.visits.size} UPPER TRACKS EXPLORED`:player._networkAir?'KEEP YOUR MOMENTUM. LOOK FOR THE NEXT CURVED CATCHER.':'JUMP ONTO A RISING RAMP TO ENTER THE UPPER WORLD. THE ROAD STILL FINISHES.';}
  };
  window.__network={state,active,drawMap,get wide(){return regionView},get mapLocal(){return mapLocal},get backdrop(){return backdropMesh}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
