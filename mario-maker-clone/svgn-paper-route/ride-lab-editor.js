/* Explicitly requested scenario rehearsals in the real Workshop. Background
 * computation cannot alter a draft, actor, grip setting, save or score. */
(function(root){
 'use strict';
 function attach({S,canvas,W,changed,message}){
  const overlay=document.createElement('canvas');overlay.id='lab-trace-overlay';overlay.setAttribute('aria-hidden','true');canvas.parentElement.append(overlay);const ctx=overlay.getContext('2d');
  const viewbar=document.querySelector('.maker-viewbar'),host=document.querySelector('.maker-center');
  const button=document.createElement('button');button.id='ride-lab-toggle';button.textContent='Ride Lab';button.setAttribute('aria-expanded','false');viewbar.append(button);
  const panel=document.createElement('section');panel.id='ride-lab-panel';panel.hidden=true;panel.setAttribute('aria-label','Ride Lab scenario rehearsal');
  panel.innerHTML=`<div class="ride-lab-title"><strong>RIDE LAB</strong><span>Rehearse a line. Keep the landing momentum. Refine the next curve.</span></div><div class="ride-lab-inputs"><label>Start on rail<select id="lab-face"><option value="1">Top face</option><option value="-1">Underside</option></select></label><label>Travel<select id="lab-direction"><option value="1">Forward</option><option value="-1">Reverse</option></select></label><label>Initial speed<input id="lab-speed" type="number" min="0.1" max="28" step="0.5" value="6"></label><label>Rail position %<input id="lab-position" type="number" min="0" max="100" value="40"></label><label>Held control<select id="lab-control"><option value="forward">D: accelerate</option><option value="coast">Coast</option><option value="reverse">A: brake / reverse</option></select></label><label class="lab-check"><input id="lab-nitro" type="checkbox"> Model one nitro</label><label class="lab-check"><input id="lab-jump" type="checkbox"> Jump off now</label><button id="lab-run">Rehearse selected</button><button id="lab-compare">Compare 5 speeds</button><button id="lab-cancel">Clear / cancel</button></div><p id="lab-status" role="status">Select one open rail, set an entry state, then rehearse. This does not start or steer the game.</p><div class="lab-results"><select id="lab-case" aria-label="Displayed speed sample" hidden></select><label id="lab-time-wrap" hidden>Scrub route <input id="lab-time" type="range" min="0" max="1" step="1" value="0"></label><button id="lab-frame" hidden>Frame trace</button><button id="lab-export" hidden>Export trace</button></div><small>Dashed lines are modeled motion, not a route guarantee. Mint: top contact. Violet: underside. Coral: stop or clearance warning. Terrain ends the preview; enemies, pickups, moving platforms and timed loops are not simulated. Always playtest.</small>`;
  host.insertBefore(panel,host.querySelector('.maker-stage'));
  const join=document.createElement('button');join.id='lab-smooth-join';join.textContent='Smooth join 2 rails';join.title='Join the closest endpoints with a tangent-aligned cubic bridge, preserving editable handles. Undo restores both rails.';document.querySelector('.maker-transform').append(join);
  const $=id=>document.getElementById(id);let worker=null,generation=0,result=null,busy=false,watchdog=null,key=null,lastDoc=null,lastHistory=null;
  function stop(){generation++;clearTimeout(watchdog);worker?.terminate();worker=null;busy=false;$('lab-run').disabled=$('lab-compare').disabled=false;}
  function clear(note='Rehearsal cleared. No draft changes were made.'){
   stop();result=null;key=null;for(const id of['lab-case','lab-time-wrap','lab-frame','lab-export'])$(id).hidden=true;$('lab-status').textContent=note;S.dirtyFrame=true;
  }
  function current(){return W.encode(S.doc);}
  function sync(){
   if(!S.doc)return;
   const stamp=S.history?.items[S.history.index];
   if((result||busy)&&(lastDoc!==S.doc||lastHistory!==stamp)&&key!==current())clear('Draft changed. The old trace is invalid; rehearse the new geometry.');
   lastDoc=S.doc;lastHistory=stamp;
  }
  function settings(){const ids=[...S.selected].filter(i=>S.doc.paths[i]);if(ids.length!==1)throw Error('Select exactly one starting rail.');return {index:ids[0],face:Number($('lab-face').value),speed:Number($('lab-speed').value)*Number($('lab-direction').value),fraction:Number($('lab-position').value)/100,control:$('lab-control').value,nitro:$('lab-nitro').checked,jump:$('lab-jump').checked,ticks:720,mode:root.RailGripCore.mode,solids:[...SOLID]};}
  function sample(){return result?.traces[Number($('lab-case').value)||0];}
  function summary(){const t=sample();if(!t)return;const catches=t.events.filter(e=>e.type==='catch');const path=catches.map(c=>(c.face<0?'underside':'top')+' '+c.id).join(' > ');$('lab-status').textContent=`${result.traces.length>1?result.traces.length+' speed samples; ':''}${Math.abs(t.settings.speed).toFixed(1)} initial speed. ${catches.length} catches over ${(t.ticks/60).toFixed(1)} modeled seconds. ${t.status.replaceAll('-',' ')}.${path?' '+path:''}`;$('lab-time').max=t.frames.length-1;$('lab-time').value=t.frames.length-1;S.dirtyFrame=true;}
  function run(compare){
   try{sync();const options=settings();clear('Computing with a private copy of the rail engine...');key=current();lastDoc=S.doc;lastHistory=S.history.items[S.history.index];const id=++generation;busy=true;$('lab-run').disabled=$('lab-compare').disabled=true;
    worker=new Worker('./ride-lab-worker.js');
    worker.onmessage=e=>{if(e.data.id!==generation||!S.active||key!==current()){clear('Document or view changed. Rehearse again.');return;}const data=e.data;stop();if(data.error){$('lab-status').textContent=data.error;return;}result={traces:data.traces,key};$('lab-case').replaceChildren();data.traces.forEach((t,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${Math.abs(t.settings.speed).toFixed(1)} speed / ${t.events.filter(e=>e.type==='catch').length} catches / ${t.status}`;$('lab-case').append(o);});$('lab-case').value=String(compare?Math.floor(data.traces.length/2):0);for(const id of['lab-case','lab-time-wrap','lab-frame','lab-export'])$(id).hidden=false;summary();};
    worker.onerror=()=>clear('The rehearsal worker could not run. Your draft is unchanged.');
    watchdog=setTimeout(()=>clear('Rehearsal time limit reached. Try a smaller section.'),15000);
    worker.postMessage({id,code:key,settings:options,compare});
   }catch(e){clear(e.message);}
  }
  button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));if(panel.hidden)clear();S.dirtyFrame=true;};
  $('lab-run').onclick=()=>run(false);$('lab-compare').onclick=()=>run(true);$('lab-cancel').onclick=()=>clear();$('lab-case').onchange=summary;$('lab-time').oninput=()=>S.dirtyFrame=true;
  for(const id of['lab-face','lab-direction','lab-speed','lab-position','lab-control','lab-nitro','lab-jump'])$(id).addEventListener('change',()=>clear('Inputs changed. Rehearse this scenario to update the trace.'));
  $('lab-direction').onchange=()=>{const reverse=$('lab-direction').value==='-1';$('lab-control').value=reverse?'reverse':'forward';$('lab-position').value=reverse?'80':'40';};
  $('lab-frame').onclick=()=>{const t=sample();if(!t)return;const b=W.bounds([{points:t.frames.map(f=>[f.x,f.y])}]),r=canvas.getBoundingClientRect();S.view.zoom=Math.max(.06,Math.min(2,Math.min((r.width-90)/(b.w+100),(r.height-90)/(b.h+100))));S.view.x=b.x+b.w/2-r.width/(2*S.view.zoom);S.view.y=b.y+b.h/2-r.height/(2*S.view.zoom);S.dirtyFrame=true;};
  $('lab-export').onclick=()=>{if(!result)return;const blob=new Blob([JSON.stringify({version:RideLabCore.VERSION,document:result.key,traces:result.traces},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ride-lab-trace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  join.onclick=()=>{try{clear();const info=RideLabCore.smoothJoin(S.doc,[...S.selected]);S.selected=new Set([info.index]);S.object=null;S.tool='select';changed('Tangent-aligned bridge created. Rehearse or playtest it; Undo restores both original rails.');}catch(e){message(e.message);$('lab-status').textContent=e.message;}};
  // Invalidate at gesture start, not after a stale worker response can arrive.
  canvas.addEventListener('pointerdown',()=>{if(result||busy)clear('Editing or selection changed. Rehearse to show a current trace.');},true);
  function draw(){
   sync();
   if(overlay.width!==canvas.width||overlay.height!==canvas.height){overlay.width=canvas.width;overlay.height=canvas.height;}
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);
   if(panel.hidden||!S.active){if(busy)stop();return;}const t=sample();if(!t)return;
   const ratio=canvas.width/(canvas.clientWidth||1);ctx.setTransform(ratio*S.view.zoom,0,0,ratio*S.view.zoom,-S.view.x*ratio*S.view.zoom,-S.view.y*ratio*S.view.zoom);
   const z=S.view.zoom,frames=t.frames,n=Math.min(frames.length-1,Number($('lab-time').value));
   ctx.save();ctx.lineWidth=2/z;ctx.lineCap='round';
   for(let i=1;i<=n;i++){const a=frames[i-1],b=frames[i];ctx.strokeStyle=b.rail?(b.face<0?'#c9aeff':'#8aebce'):'#ffdb92';ctx.setLineDash(b.rail?[]:[5/z,5/z]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
   ctx.setLineDash([]);
   for(const e of t.events.filter(e=>e.type==='catch'&&e.tick<=frames[n].tick)){const f=frames[e.tick];if(!f)continue;ctx.fillStyle=e.face<0?'#b697f1':'#77dcbf';ctx.beginPath();ctx.arc(f.x,f.y,5/z,0,7);ctx.fill();}
   const f=frames[n];ctx.strokeStyle=n===frames.length-1&&t.status.includes('warning')?'#ff9f88':'#effcec';ctx.lineWidth=2/z;ctx.strokeRect(f.x-13,f.y-15,26,30);ctx.fillStyle='#effcec';ctx.beginPath();ctx.arc(f.x,f.y,3/z,0,7);ctx.fill();ctx.font=`${11/z}px system-ui`;const label=`${(f.tick/60).toFixed(2)} s / speed ${Math.hypot(f.vx,f.vy).toFixed(1)}`,textWidth=ctx.measureText(label).width,labelX=Math.max(S.view.x+8/z,Math.min(f.x+16/z,S.view.x+(canvas.clientWidth-8)/z-textWidth));ctx.fillText(label,labelX,f.y-19/z);
   if(t.warning&&n===frames.length-1){const [x,y]=t.warning.at;ctx.strokeStyle='#ff967e';ctx.beginPath();ctx.moveTo(x-7/z,y-7/z);ctx.lineTo(x+7/z,y+7/z);ctx.moveTo(x-7/z,y+7/z);ctx.lineTo(x+7/z,y-7/z);ctx.stroke();}
   ctx.restore();
  }
  return {sync,draw,clear,get result(){return result},get busy(){return busy}};
 }
 root.RideLabEditor=Object.freeze({attach});
})(globalThis);
