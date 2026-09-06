/* Optional live flight guide. The copied actor is predicted; the real actor is
 * never moved. It estimates steady-input motion, not enemies or future choices. */
(function(){
 'use strict';
 let enabled=false,worker=null,pending=false,scene=null,lastTick=-1,id=0,result=null,requestAt=0,signature='',requestPeg=false,code=null,watchdog=null;
 const stage=document.getElementById('stagewrap'),canvas=document.createElement('canvas'),note=document.createElement('div'),button=document.createElement('button');
 canvas.id='ride-guide';canvas.hidden=true;canvas.setAttribute('aria-hidden','true');note.id='ride-guide-note';note.hidden=true;button.id='ride-guide-toggle';button.className='delivery-btn';button.textContent='Flight guide';button.setAttribute('aria-pressed','false');button.title='Optional predicted landing guide (G). It never steers the rider.';stage.append(canvas,note);document.querySelector('#delivery-header .actions').append(button);const ctx=canvas.getContext('2d');
 const active=()=>enabled&&mode==='play'&&__sky.active()&&!__delivery.state.menu&&!RouteWorkshop.active;
 const keysNow=()=>keys.KeyA||keys.ArrowLeft?'reverse':keys.KeyD||keys.ArrowRight?'forward':'coast';
 function dispose(){worker?.terminate();worker=null;pending=false;result=null;clearTimeout(watchdog);id++;}
 function toggle(){enabled=!enabled;button.setAttribute('aria-pressed',String(enabled));if(!enabled)dispose();canvas.hidden=note.hidden=!active();cv.focus({preventScroll:true});}
 button.onclick=toggle;window.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat&&mode==='play'&&!RouteWorkshop.active&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)){e.preventDefault();toggle();}});
 function snapshot(){
  // Static geometry and solid tiles are copied. The guide stops on terrain and
  // deliberately does not promise what a destructible/moving obstacle will do.
  const doc=WorkshopCore.decode(levelCode());
  doc.paths=tracks.map(t=>({points:t.pts.map(p=>[...p]),meta:{...t.sky},anchors:null}));
  for(let y=0;y<LH;y++)for(let x=0;x<LW;x++)doc.cells[y*LW+x]=pg(x,y);
  return WorkshopCore.encode(doc);
 }
 function compute(){
  const p=player;if(p.dead||won||p.onGround&&!p.track&&!p.peg){result=null;note.textContent='Flight guide: enter a rail first. It does not aim jumps or drive for you.';return;}
  if(p.track&&p.track.sky?.kind!=='open'){result=null;note.textContent='Timed loop: use the gold exit. This guide models open rails.';return;}
  if(!p.track&&!p.peg&&!p._railAir&&!p._networkAir){result=null;note.textContent='The guide starts on a rail, during a rail launch, or at a peg.';return;}
  if(pending||__delivery.paused)return;
  const tick=__sky.state.steps;if(tick-lastTick<10&&result)return;lastTick=tick;
  if(scene!==tracks||!code){dispose();scene=tracks;code=snapshot();}
  const fields={};for(const k of['x','y','w','h','vx','vy','speed','trackS','trackCD','_airTicks','_railFace','_gripSlow','nitroT','roll'])fields[k]=p[k]??0;
  fields.railIndex=p.track?tracks.indexOf(p.track):null;fields.peg=p.peg?{...p.peg}:null;
  signature=keysNow();requestPeg=!!fields.peg;requestAt=tick;const current=++id;pending=true;
  if(!worker){worker=new Worker('./ride-lab-worker.js');worker.onmessage=e=>{if(e.data.id!==id||!active())return;pending=false;clearTimeout(watchdog);if(e.data.error){result=null;note.textContent='Guide unavailable for this geometry: '+e.data.error;return;}result={trace:e.data.traces[0],at:requestAt,peg:requestPeg};};worker.onerror=()=>{dispose();note.textContent='Flight guide unavailable. Normal riding is unchanged.';};}
  watchdog=setTimeout(()=>{dispose();note.textContent='Guide timed out. Normal riding is unchanged.';},8000);
  worker.postMessage({id:current,code,settings:{ticks:150,control:signature,mode:RailGripCore.mode,solids:[...SOLID]},liveSeed:fields});
 }
 function draw(){
  canvas.hidden=note.hidden=!active();if(!active()){if(pending)dispose();return;}
  if(scene!==tracks){code=null;scene=null;result=null;lastTick=-1;}
  const ratio=Math.min(devicePixelRatio||1,2),width=stage.clientWidth,height=stage.clientHeight;
  if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=width*ratio;canvas.height=height*ratio;}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);compute();
  if(!result||!__merged.camera?.isPerspectiveCamera||signature!==keysNow())return;
  const t=result.trace,elapsed=result.peg?0:Math.max(0,__sky.state.steps-result.at),T=__merged.THREE,camera=__merged.camera;
  if(elapsed>35)return;const project=f=>{const p=new T.Vector3(f.x,-f.y,28).project(camera);return [(p.x*.5+.5)*width,(-p.y*.5+.5)*height,p.z];};
  const samples=t.frames.filter(f=>f.tick>=elapsed);ctx.strokeStyle='#c0e5d2';ctx.lineWidth=2;ctx.setLineDash([5,6]);ctx.beginPath();let started=false;
  for(const f of samples){const [x,y,z]=project(f);if(z< -1||z>1){started=false;continue;}if(started)ctx.lineTo(x,y);else ctx.moveTo(x,y);started=true;}ctx.stroke();ctx.setLineDash([]);
  const next=t.events.find(e=>e.type==='catch'&&e.tick>=elapsed);
  if(next){const f=t.frames[next.tick],a=project(f);ctx.strokeStyle=next.face<0?'#c6a9ff':'#92e6c8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(a[0],a[1],9,0,7);ctx.stroke();note.textContent=(result.peg?'IF Z RELEASED NOW: ':'STEADY INPUT: ')+(next.face<0?'underside':'top')+' catch in '+((next.tick-elapsed)/60).toFixed(1)+' s. Prediction only; keep checking the path.';}
  else note.textContent=(result.peg?'Release preview: ':'Flight guide: ')+t.status.replaceAll('-',' ')+'. Enemies and moving objects are not predicted.';
 }
 const render=window.render;window.render=function(){render();draw();};
 window.RideGuide={toggle,get enabled(){return enabled},get result(){return result},get pending(){return pending}};
})();
