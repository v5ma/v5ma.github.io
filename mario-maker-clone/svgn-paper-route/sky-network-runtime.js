/* Network traversal is optional; the existing street and finish logic remain.
 * Telemetry observes real catches and flight. No target relocation or auto-win. */
(function(){'use strict';
 function boot(){
  const state={version:'connected-world-1',visits:new Set(),chain:0,bestChain:0,flights:0,events:[],minY:Infinity,lastReleases:0};
  let lastSurface=null,airStart=0,regionView=false,source=null,wasPaused=false;
  const active=()=>window.__ground?.active()&&!!__ground.meta?.skyNetwork;
  const record=(type,extra={})=>{state.events.push({type,step:__ground.state.steps,x:player.x,y:player.y,...extra});if(state.events.length>1200)state.events.shift();};
  const spawn=spawnWorld;window.spawnWorld=function(x,y){const keep=routeKeep;spawn(x,y);if(!active())return;player._networkAir=false;source=null;lastSurface=null;airStart=0;if(!keep){state.visits.clear();state.chain=state.bestChain=state.flights=0;state.events=[];state.minY=Infinity;}state.lastReleases=__grapple.state.releases;};
  const step=stepPlayer;window.stepPlayer=function(){
   if(!active())return step();const p=player,old=p.track,peg=p.peg;
   if(__grapple.state.releases!==state.lastReleases){p._networkAir=true;state.lastReleases=__grapple.state.releases;}
   step();if(player!==p)return;
   state.minY=Math.min(state.minY,p.y);
   if(old&&!p.track&&!p.onGround){p._networkAir=true;lastSurface=old.sky?.id;airStart=__ground.state.steps;state.flights++;record('launch',{from:lastSurface,vx:p.vx,vy:p.vy});}
   if(p.track&&p.track!==old){
    const id=p.track.sky?.id;if(id){state.visits.add(id);state.chain=lastSurface&&airStart?state.chain+1:1;state.bestChain=Math.max(state.bestChain,state.chain);record('catch',{from:lastSurface,to:id,airTicks:airStart?__ground.state.steps-airStart:0});}
    p._networkAir=false;airStart=0;lastSurface=null;
   }
   if(peg&&!p.peg){p._networkAir=true;airStart=__ground.state.steps;record('whip-release',{vx:p.vx,vy:p.vy});}
   if(p.onGround&&!p.track&&!p.peg){p._networkAir=false;state.chain=0;lastSurface=null;airStart=0;}
  };
  const buttons=document.querySelector('#delivery-header .actions');buttons.insertAdjacentHTML('beforeend','<button id="network-map-button" class="delivery-btn" title="Whole route map (M)">Route map</button><button id="network-wide-button" class="delivery-btn" aria-pressed="false" title="Wide view (V)">Wide view</button>');
  const dialog=document.createElement('dialog');dialog.id='sky-network-map';dialog.setAttribute('aria-label','The whole connected route');dialog.innerHTML='<div class="network-map-heading"><div><small>ONE WORLD / MANY ROUTES</small><h2>Above the neighborhood</h2></div><button id="network-map-close">Back to riding</button></div><canvas id="network-map-canvas" width="1200" height="350" aria-label="Map of actual ramps, pegs and the continuous road"></canvas><p>Gold marks visited tracks. Pale tracks and peg dots show the optional upper world. The road across the bottom still reaches the finish. This map does not move your rider.</p><div id="network-map-count"></div>';
  document.body.append(dialog);
  function drawMap(){if(!active())return;const c=document.getElementById('network-map-canvas'),g=c.getContext('2d'),all=tracks.filter(t=>t.sky?.network),ground=__ground.meta.ground*36,w=LW*36,top=Math.min(180,...all.flatMap(t=>t.pts.map(p=>p[1]))),sx=(c.width-36)/w,sy=(c.height-48)/(ground-top),map=p=>[18+p[0]*sx,18+(p[1]-top)*sy];
   g.fillStyle='#102736';g.fillRect(0,0,c.width,c.height);g.lineWidth=1;
   for(const t of all){g.strokeStyle=state.visits.has(t.sky.id)?'#ffd276':t.sky.tier===3?'#97ddd8':'#c5d3bd';g.lineWidth=state.visits.has(t.sky.id)?2.5:1.5;g.beginPath();t.pts.forEach((p,i)=>i?g.lineTo(...map(p)):g.moveTo(...map(p)));g.stroke();}
   g.strokeStyle='#fff2d0';g.lineWidth=3;g.beginPath();g.moveTo(...map([0,ground]));g.lineTo(...map([w,ground]));g.stroke();
   g.fillStyle='#82f6df';for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)if(pg(x,y)===T.PEG){const[a,b]=map([x*36+18,y*36+18]);g.beginPath();g.arc(a,b,2,0,7);g.fill();}
   const[x,y]=map([player.x+13,player.y+15]);g.fillStyle='#ff8e6e';g.beginPath();g.arc(x,y,5,0,7);g.fill();
   document.getElementById('network-map-count').textContent=`${all.length} track surfaces / ${__ground.meta.skyNetwork.pegCount} pegs / ${state.visits.size} tracks visited`;
  }
  function openMap(){if(!active()||won)return;wasPaused=__delivery.paused;if(!wasPaused)__delivery.act('pause');for(const k of Object.keys(keys))keys[k]=false;dialog.showModal();drawMap();document.getElementById('network-map-close').focus();}
  dialog.addEventListener('close',()=>{if(!wasPaused&&__delivery.paused)__delivery.act('resume');cv.focus({preventScroll:true});});
  document.getElementById('network-map-button').onclick=openMap;document.getElementById('network-map-close').onclick=()=>dialog.close();
  function wide(){regionView=!regionView;document.getElementById('network-wide-button').setAttribute('aria-pressed',String(regionView));cv.focus({preventScroll:true});}
  document.getElementById('network-wide-button').onclick=wide;
  window.addEventListener('keydown',e=>{if(!active()||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='KeyM'){e.preventDefault();if(dialog.open)dialog.close();else openMap();}if(e.code==='KeyV'&&!dialog.open){e.preventDefault();wide();}});
  const camera=CloudDepthCamera.forFrame;
  CloudDepthCamera.forFrame=function(o,v){const c=camera(o,v);if(!active()||!c.isPerspectiveCamera){source=null;return c;}
   const target={x:player.x+13+Math.max(-160,Math.min(210,player.vx*12)),y:-player.y+145};
   if(!source||Math.abs(source.x-target.x)>650||Math.abs(source.y-target.y)>450)source={...target};else{source.x+=(target.x-source.x)*.16;source.y+=(target.y-source.y)*.16;}
   const height=regionView?1550:Math.max(680,Math.min(900,v.h*1.03));c.fov=Math.atan(height/2/835)*360/Math.PI;c.position.set(source.x+205,source.y+125,800);c.lookAt(source.x,source.y,0);c.updateProjectionMatrix();c.updateMatrixWorld();return c;
  };
  const render=window.render;window.render=function(){render();const on=active();document.body.classList.toggle('network-world-active',on);document.getElementById('network-map-button').hidden=!on;document.getElementById('network-wide-button').hidden=!on;if(!on)return;if(dialog.open)drawMap();
   if(__ground.state.steps%5===0){document.getElementById('cloud-control-tip').textContent='M: ROUTE MAP / V: WIDE VIEW / Z: GRAPPLE / STREET OR SKY: YOUR CHOICE';document.getElementById('cloud-flight-label').textContent=player.peg?'WIND UP, THEN RELEASE Z TOWARD ANOTHER SHELF':player.track?`${player.track.sky.label} / ${state.visits.size} UPPER TRACKS EXPLORED`:player._networkAir?'KEEP YOUR MOMENTUM. LOOK FOR THE NEXT CURVED CATCHER.':'JUMP ONTO A RISING RAMP TO ENTER THE UPPER WORLD. THE ROAD STILL FINISHES.';}
  };
  window.__network={state,active,drawMap,get wide(){return regionView}};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
