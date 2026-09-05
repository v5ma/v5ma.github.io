/* One physics-based analysis for the real Workshop document.
 * Green means a finite sampled entry witness, never a universal path guarantee.
 * Placement proposals are explicit, cancelable, fingerprinted and undoable.
 */
(function(){'use strict';
 function boot(){
  if(!window.RouteWorkshop||!window.RouteFlow)return;
  const W=WorkshopCore,F=RouteFlow,editor=RouteWorkshop,S=editor.state;
  const state={job:0,fingerprint:null,report:null,proposal:null,stale:true,busy:false,show:true,error:null};
  let worker=null,previousID='',timer=null;
  const panel=document.createElement('section');panel.id='flow-panel';
  panel.innerHTML='<h2>Route flow</h2><p id="flow-status" role="status">Analyze the movement between these pieces, not just their positions.</p><div class="flow-actions"><button id="flow-analyze">Analyze flow</button><button id="flow-fit">Fit a catcher</button><button id="flow-export">Export evidence</button></div><label class="flow-overlay"><input id="flow-overlay" type="checkbox" checked> Show sampled paths</label><label class="flow-overlay"><input id="flow-jump" type="checkbox"> Fit from a jump near the lip</label><div id="flow-metrics"></div><p id="flow-selection"></p><div id="flow-findings"></div><div id="flow-proposal" hidden><strong>Receiving ramp proposal</strong><p id="flow-proposal-text"></p><button id="flow-accept">Accept as one edit</button><button id="flow-cancel">Discard</button></div><p class="flow-caveat">The worker samples the shared rail and flight physics. Arrival speed is carried into the next move. It does not solve enemy timing, every input variation, or peg-to-peg paths. Edit a shape and its evidence becomes stale.</p><a class="flow-roadmap" href="./planning/index.html" target="_blank" rel="noopener">Development board and Excel workbook</a>';
  document.querySelector('.maker-inspector').prepend(panel);
  const view=document.querySelector('.maker-viewbar'),button=document.createElement('button');button.id='flow-toolbar';button.textContent='Route flow';button.title='Analyze access, launch arcs and clearance';view.append(button);
  const $=id=>document.getElementById(id);
  function message(s){$('flow-status').textContent=s;}
  function dirty(){S.dirtyFrame=true;}
  function focusPanel(){document.getElementById('route-workshop').classList.add('show-inspector');$('maker-inspector-toggle').setAttribute('aria-expanded','true');panel.scrollIntoView({block:'nearest'});}
  function cancelWorker(){if(worker){worker.terminate();worker=null;}state.busy=false;clearTimeout(timer);}
  function current(){return S.doc?F.fingerprint(S.doc):null;}
  function documentChanged(d){
   const fp=F.fingerprint(d);
   if(previousID!==fp){previousID=fp;cancelWorker();state.job++;state.stale=true;state.proposal=null;$('flow-proposal').hidden=true;
    message(state.report?'Layout changed. Previous paths are stale; analyze again.':'Ready to analyze this document.');
    $('flow-metrics').textContent=state.report?'Previous measurements are hidden until this layout is checked.':'';
    $('flow-findings').replaceChildren();state.error=null;dirty();
   }
   updateSelection();
  }
  function workerJob(job){
   if(!S.doc)return;
   const sourceID=S.selected.size===1?S.doc.paths[[...S.selected][0]]?.meta?.id:null;
   if(job==='propose'&&!sourceID){message('Select exactly one open roadway to propose a receiving ramp.');focusPanel();return;}
   cancelWorker();const id=++state.job;state.busy=true;state.error=null;state.proposal=null;$('flow-proposal').hidden=true;state.fingerprint=current();
   message(job==='audit'?'Sampling entry states, flight arcs and composed routes...':'Searching a clear receiving corridor from the selected exit...');
   try{worker=new Worker('./route-flow-worker.js');}catch(e){state.busy=false;message('This browser could not start the flow worker: '+e.message);return;}
   const fp=state.fingerprint;
   worker.onerror=e=>{if(id!==state.job)return;cancelWorker();state.error=e.message;message('Flow analysis failed: '+e.message);};
   worker.onmessage=e=>{
    const r=e.data;if(r.id!==state.job||fp!==current())return;
    if(r.progress){message(r.progress);return;}
    cancelWorker();
    if(r.error){state.error=r.error;message(r.error);return;}
    if(r.proposal){state.proposal=r.proposal;$('flow-proposal').hidden=false;
     const q=r.proposal.evidence;$('flow-proposal-text').textContent=`${q.speeds.length}/${q.attempts} tested entry speeds reached this catcher. This assumes entry onto the selected rail at the stated sample state; it is not an access proof. Accept or discard the translucent proposal.`;
     message('Proposal ready. Nothing in the level has changed.');dirty();return;
    }
    state.report={audit:r.audit,witnesses:r.witnesses,fingerprint:fp};state.stale=false;showResult();dirty();
   };
   worker.postMessage({id,job,doc:structuredClone(S.doc),sourceID,jump:$('flow-jump').checked});
   timer=setTimeout(()=>{if(id!==state.job)return;cancelWorker();state.error='time limit';message('Analysis exceeded its time allowance. Work on a smaller region or fewer surfaces, then retry. No result is marked verified.');},120000);
   focusPanel();
  }
  function choose(id){const i=S.doc.paths.findIndex(p=>p.meta?.id===id);if(i<0)return;S.selected=new Set([i]);S.object=null;editor.refresh();editor.action('focus');dirty();}
  function showResult(){
   const {audit:a,witnesses:w}=state.report;
   $('flow-metrics').textContent=`${a.nodes.length} surfaces | ${w.reached.length} have a composed entry witness | ${w.unproven.length} not reached in this search | ${a.issues.length} clearance conflicts`;
   message(w.truncated?'Search reached its state budget. Treat missing access as unresolved, not impossible.':`Analysis complete for this layout: ${w.states} distinct motion states examined.`);
   const findings=$('flow-findings');findings.replaceChildren();
   for(const issue of a.issues.slice(0,16)){const b=document.createElement('button');b.textContent=`${issue.kind==='crossing'?'Crossing':'Too close'}: ${issue.a} / ${issue.b} (${issue.distance} units)`;b.onclick=()=>choose(issue.a);findings.append(b);}
   for(const id of w.unproven.slice(0,12)){const b=document.createElement('button');b.textContent='Access not established: '+id;b.onclick=()=>choose(id);findings.append(b);}
   updateSelection();
  }
  function updateSelection(){
   if(!$('flow-selection')||!S.doc)return;
   const ids=[...S.selected].map(i=>S.doc.paths[i]?.meta?.id).filter(Boolean),p=ids[0];
   $('flow-fit').disabled=state.busy||ids.length!==1;
   if(state.stale||!state.report){$('flow-selection').textContent=ids.length?'Select Analyze flow to check this piece and its connections.':'';return;}
   const w=state.report.witnesses,route=w.routes[p];
   if(!p){$('flow-selection').textContent='Select a roadway to isolate its actual sampled incoming and outgoing arcs.';return;}
   const edges=w.transitions.filter(e=>e.from===p),backs=edges.filter(e=>e.to==='road'),targets=new Set(edges.map(e=>e.to));
   $('flow-selection').textContent=route?`${p}: reached from ${route.entry} in ${route.controls.length} transfers under a recorded input sequence. ${targets.size} sampled destinations${backs.length?', including the road':''}.`:`${p}: the bounded search has not established access. Inspect entry height, speed and clearance.`;
  }
  function path(c,pts,color,z,dash=[]){
   if(!pts?.length)return;c.strokeStyle=color;c.lineWidth=2/z;c.setLineDash(dash.map(v=>v/z));c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();c.setLineDash([]);
   const a=pts.at(-2),b=pts.at(-1);if(a&&b){const th=Math.atan2(b[1]-a[1],b[0]-a[0]),r=8/z;c.fillStyle=color;c.beginPath();c.moveTo(...b);c.lineTo(b[0]-Math.cos(th-.42)*r,b[1]-Math.sin(th-.42)*r);c.lineTo(b[0]-Math.cos(th+.42)*r,b[1]-Math.sin(th+.42)*r);c.fill();}
  }
  function drawWorld(c,viewState){
   const z=viewState.view.zoom;
   if(state.proposal){c.save();c.globalAlpha=.65;path(c,state.proposal.points,'#ffcc81',z,[6,4]);c.globalAlpha=.42;path(c,state.proposal.evidence.witness.points,'#ffdc9e',z,[2,4]);c.restore();}
   if(!state.show||state.stale||!state.report)return;
   const {audit:a,witnesses:w}=state.report,selection=new Set([...S.selected].map(i=>S.doc.paths[i]?.meta?.id)),known=new Set(w.reached);
   for(const node of a.nodes){
    const b=node.bounds;c.strokeStyle=known.has(node.id)?'#76e7d877':'#ffaf71';c.lineWidth=1.4/z;c.setLineDash([5/z,4/z]);c.strokeRect(b.x-12,b.y-12,b.w+24,b.h+24);c.setLineDash([]);
   }
   for(const issue of a.issues){for(const id of[issue.a,issue.b]){const p=S.doc.paths.find(p=>p.meta?.id===id);if(p)path(c,p.points,'#ff7f91',z);}}
   // One representative per destination. Avoid a misleading wall of arrows.
   const unique=new Map();
   for(const e of w.transitions){if(selection.size&&!selection.has(e.from)&&!selection.has(e.to))continue;if(!selection.size&&e.control.mode!=='throttle')continue;if(e.to==='road'&&!selection.size)continue;const k=e.from+'>'+e.to;if(!unique.has(k))unique.set(k,e);}
   const list=[...unique.values()].slice(0,selection.size?12:24);
   for(const e of list){const pts=e.witness.points,launch=e.witness.launch;if(!launch)continue;let at=0,min=Infinity;for(let i=0;i<pts.length;i++){const d=Math.hypot(pts[i][0]-launch.x-13,pts[i][1]-launch.y-15);if(d<min){min=d;at=i;}}c.save();c.globalAlpha=.85;path(c,pts.slice(at),e.to==='road'?'#bbc3d4':'#74e9dc',z,[3,4]);c.restore();}
  }
  function accept(){
   const p=state.proposal;
   if(!p||p.fingerprint!==current()){message('Proposal is stale. Analyze and fit again after edits.');return false;}
   const d=structuredClone(S.doc),piece={points:p.points.map(q=>[...q]),meta:{...p.meta},anchors:null};
   W.tagNew(d,piece);d.paths.push(piece);W.syncNetwork(d);
   const n=d.paths.length-1;editor.applyDocument(d,'Receiving ramp accepted. Undo restores the previous document.');
   S.selected=new Set([n]);editor.refresh();dirty();return true;
  }
  button.onclick=()=>workerJob('audit');$('flow-analyze').onclick=()=>workerJob('audit');$('flow-fit').onclick=()=>workerJob('propose');
  $('flow-overlay').onchange=e=>{state.show=e.target.checked;dirty();};
  $('flow-cancel').onclick=()=>{state.proposal=null;$('flow-proposal').hidden=true;message('Proposal discarded. The level is unchanged.');dirty();};
  $('flow-accept').onclick=accept;
  $('flow-export').onclick=()=>{
   if(state.stale||!state.report){message('Analyze the current document before exporting evidence.');return;}
   const blob=new Blob([JSON.stringify({...state.report,claim:'Conditional sampled model, not a guarantee for every player input or enemy timing.'},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='paper-delivery-route-flow.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const menuLink=document.createElement('a');menuLink.className='flow-menu-link';menuLink.href='./planning/index.html';menuLink.target='_blank';menuLink.rel='noopener';menuLink.textContent='Development plan';document.querySelector('#delivery-header .actions').append(menuLink);
  window.RouteFlowEditor={state,documentChanged,drawWorld,analyze:()=>workerJob('audit'),propose:()=>workerJob('propose'),accept};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
