/* The native level document has one editor history, including curves and tiles.
 * Playtest uses the actual existing engine, not an editor-only simulation. */
(function(){'use strict';
 function boot(){
  const W=WorkshopCore,S={active:false,doc:null,history:null,selected:new Set(),tool:'select',piece:'ramp',tile:1,view:{x:0,y:0,zoom:.6},snap:true,handles:false,drag:null,dirty:false,testing:false,space:false,saved:null,object:null,layer:'all',currentCode:null,legacyCode:null,dirtyFrame:true};
  const host=document.createElement('section');host.id='route-workshop';host.hidden=true;host.setAttribute('aria-label','Route Workshop level editor');
  host.innerHTML=`<header class="maker-top"><div><small>SVGN.io / CONNECTED-WORLD WORKSHOP</small><input id="maker-name" aria-label="Level name" maxlength="96"></div><div class="maker-actions"><button data-mk="undo" title="Undo (Ctrl+Z)">Undo</button><button data-mk="redo" title="Redo (Ctrl+Y)">Redo</button><button data-mk="save">Save draft</button><button data-mk="export">Export</button><button data-mk="import">Import</button><button data-mk="test" class="maker-primary">Playtest in 3D</button><button data-mk="exit">Back to game</button></div></header>
  <div class="maker-layout"><aside class="maker-library"><div class="maker-tabs" role="group" aria-label="Editor tools"><button data-tool="select" aria-pressed="true">Select / move</button><button data-tool="pan">Pan</button><button data-tool="draw">Draw a curve</button><button data-tool="erase">Erase</button></div><h2>Roadways</h2><p>Choose a piece, then click the canvas. The arrow marks the riding side.</p><div id="maker-pieces"></div><h2>Terrain, pegs and pickups</h2><div id="maker-tiles"></div><button data-tool="neighbor" id="maker-add-neighbor">Place a postal neighbor</button><details open><summary>Worlds and drafts</summary><button data-mk="starter">New grounded starter</button><label class="maker-library-label">Copy a featured route<select id="maker-route"></select></label><button data-mk="route">Load editable route copy</button><label class="maker-library-label">Saved drafts<select id="maker-drafts"></select></label><button data-mk="restore">Load selected draft</button><button data-mk="legacy">Original advanced editor</button></details></aside>
  <div class="maker-center"><div class="maker-viewbar"><button data-mk="zoomout" aria-label="Zoom out">-</button><output id="maker-zoom">60%</output><button data-mk="zoomin" aria-label="Zoom in">+</button><button data-mk="fit">Fit level</button><button data-mk="focus">Frame selection</button><label><input type="checkbox" id="maker-snap" checked> Snap</label><label><input type="checkbox" id="maker-handles"> Shape handles</label><button data-mk="check">Check level</button><button data-mk="inspector" id="maker-inspector-toggle" aria-expanded="false">Properties</button><select id="maker-layer" aria-label="View layer"><option value="all">All heights</option><option value="ground">Ground and low routes</option><option value="upper">Upper routes</option></select><select id="maker-sector" aria-label="Frame a neighborhood"><option value="">Frame an area...</option></select></div><div class="maker-stage"><canvas id="maker-canvas" tabindex="0" aria-label="Editable level. Select a track to move it. Arrow keys nudge selected pieces; Delete removes them. Space-drag pans."></canvas><div id="maker-empty">Start with an open ramp. Leave a gap. Add a catcher.</div><canvas id="maker-minimap" width="210" height="95" aria-label="Level overview; click to move the view"></canvas></div><div class="maker-status"><span id="maker-status">Select a track or choose a piece to place.</span><span id="maker-count"></span></div></div>
  <aside class="maker-inspector"><button id="maker-inspector-close" data-mk="inspector">Back to canvas</button><h2>Selection</h2><p id="maker-selection">Nothing selected.</p><label class="maker-library-label">Track label<input id="maker-track-label" maxlength="96"></label><div class="maker-fields"><label>X <input id="maker-x" type="number" step="18"></label><label>Y <input id="maker-y" type="number" step="18"></label><label>Width <input id="maker-width" type="number" min="1"></label><label>Height <input id="maker-height" type="number" min="1"></label></div><div class="maker-transform"><button data-mk="rotateleft">Rotate -15</button><button data-mk="rotateright">Rotate +15</button><button data-mk="flip">Flip horizontal</button><button data-mk="flipv">Flip vertical</button><button data-mk="smaller">Scale down</button><button data-mk="bigger">Scale up</button><button data-mk="duplicate">Duplicate</button><button data-mk="delete">Delete</button><button data-mk="reverse">Reverse riding side</button><button data-mk="join">Join 2 endpoints</button></div><div id="maker-object-fields" hidden><label>Neighbor name<input id="maker-neighbor-name" maxlength="60"></label><label>Message<textarea id="maker-neighbor-text" maxlength="250" rows="3"></textarea></label></div><h2>Track list</h2><div id="maker-outline"></div><details open><summary>World settings</summary><label>Width (tiles)<input id="maker-world-width" type="number" min="16" max="640"></label><label>Height (tiles)<input id="maker-world-height" type="number" min="12" max="280"></label><button data-mk="resize">Apply size</button><label>Neighborhood<select id="maker-style"><option value="village">Village</option><option value="canal">Canal</option><option value="garden">Garden</option></select></label><label>Soundtrack<select id="maker-music"></select></label></details><h2>Playtest notes</h2><p id="maker-checks">Your draft stays intact when you return from a playtest.</p><p class="maker-tip">Shift-click adds to the selection. Drag a cyan handle to reshape. Wheel zooms at the pointer. Space-drag pans. Ctrl+S saves.</p></aside></div><input hidden id="maker-file" type="file" accept=".txt,.json,.route">`;
  document.body.append(host);
  const $=id=>document.getElementById(id),canvas=$('maker-canvas'),ctx=canvas.getContext('2d'),mini=$('maker-minimap'),mg=mini.getContext('2d');let width=800,height=600,dpr=1,pointer=null;
  const tiles=[['Ground',1],['Brick',2],['Platform',7],['Start',15],['Finish',8],['Mailbox',63],['Peg',60],['Checkpoint',13],['Spring',6],['Envelope',5],['Nitro',27],['Shield',43],['Star',44],['Bonus block',84],['Patrol bot',16],['Hover bot',18],['Shell bot',17],['Spikes',4],['Whip',58],['Cannon NE',69],['Cannon up',70],['Cannon left',72],['Lift',12],['Moving platform',11],['Water',45],['Crate',3]];
  const names=new Map(tiles.map(([name,id])=>[id,name]));
  const storageKey='svgn_route_workshop_library_v2',recoveryKey='svgn_route_workshop_recovery_v2';let autosave=null;
  const safeStore={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);return true;}catch{return false;}}};
  function library(){try{const a=JSON.parse(safeStore.get(storageKey)||'[]');return Array.isArray(a)?a.filter(x=>typeof x.code==='string'&&typeof x.id==='string').slice(0,12):[];}catch{return [];}}
  function options(el,entries){el.replaceChildren();for(const [v,name] of entries){const o=document.createElement('option');o.value=v;o.textContent=name;el.append(o);}}
  options($('maker-route'),DeliveryCampaign.routes.map((r,i)=>[i,r.name]));$('maker-route').value='4';
  options($('maker-music'),[['off','No music'],...Object.entries(AdventureScore.SONGS).map(([id,s])=>[id,s.title])]);
  function refreshDrafts(){options($('maker-drafts'),library().map(d=>[d.id,d.name]));}
  refreshDrafts();
  $('maker-pieces').innerHTML=W.PARTS.map(p=>`<button data-piece="${p.id}" title="${p.hint}"><canvas width="160" height="62" data-thumb="${p.id}"></canvas><span>${p.name}</span></button>`).join('');
  $('maker-tiles').innerHTML=tiles.map(([s,t])=>`<button data-tile="${t}"><canvas width="44" height="44" data-tile-thumb="${t}"></canvas><span>${s}</span></button>`).join('');
  function renderThumbnails(){for(const c of host.querySelectorAll('[data-tile-thumb]')){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(4,4);drawTileIcon(ctx,Number(c.dataset.tileThumb));ctx.restore();}}renderThumbnails();
  function line(c,pts,scale=1){c.beginPath();pts.forEach((p,i)=>{if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.lineJoin='round';c.lineCap='round';c.lineWidth=10/scale;c.strokeStyle='#2a536b';c.stroke();c.lineWidth=5/scale;c.strokeStyle='#edbb69';c.stroke();}
  for(const el of host.querySelectorAll('[data-thumb]')){const c=el.getContext('2d'),p=W.piece(el.dataset.thumb,0,0),b=W.bounds([p]),s=Math.min(145/(b.w||1),45/(b.h||1));c.translate(8-b.x*s,8-b.y*s);c.scale(s,s);line(c,p.points,s);}
  function message(s){$('maker-status').textContent=s;S.dirtyFrame=true;}
  function current(){return W.encode(S.doc);}function clearSelection(){S.selected.clear();S.object=null;}
  function selected(){return [...S.selected].filter(i=>S.doc.paths[i]).map(i=>S.doc.paths[i]);}
  function changed(label){
   try{W.validate(S.doc);}catch(e){S.doc=W.decode(S.history.items[S.history.index]);clearSelection();refresh();message(e.message+' The invalid edit was not kept.');return;}
   W.syncNetwork(S.doc);const code=current();S.history.push(code);S.dirty=code!==S.saved;refresh();message(label);
   clearTimeout(autosave);autosave=setTimeout(()=>{if(S.dirty&&!safeStore.set(recoveryKey,JSON.stringify({id:draftId,name:S.doc.name,code:current(),time:Date.now()})))message('Recovery storage is full. Export your draft to keep it.');},600);
  }
  function documentBounds(){const all=S.doc.paths.map(p=>p);let points=[];for(let i=0;i<S.doc.cells.length;i++)if(S.doc.cells[i])points.push([(i%S.doc.w)*36,Math.floor(i/S.doc.w)*36],[(i%S.doc.w+1)*36,(Math.floor(i/S.doc.w)+1)*36]);if(points.length)all.push({points});return all.length?W.bounds(all):{x:0,y:0,w:Math.min(S.doc.w*36,2200),h:Math.min(S.doc.h*36,1300)};}
  function fit(selection=false){S.dirtyFrame=true;const b=selection&&selected().length?W.bounds(selected()):documentBounds();S.view.zoom=Math.max(.08,Math.min(1.5,Math.min((width-100)/(b.w+80),(height-90)/(b.h+80))));S.view.x=b.x+b.w/2-width/(2*S.view.zoom);S.view.y=b.y+b.h/2-height/(2*S.view.zoom);}
  function refresh(){if(!S.doc)return;S.dirtyFrame=true;$('maker-name').value=S.doc.name;const a=selected(),b=W.bounds(a);$('maker-selection').textContent=a.length?`${a.length} track piece${a.length===1?'':'s'} selected.`:S.object?.type==='tile'?(names.get(S.object.id)||'Tile')+' selected.':S.object?.type==='neighbor'?'Postal neighbor selected.':'Nothing selected.';for(const [id,key]of[['maker-x','x'],['maker-y','y'],['maker-width','w'],['maker-height','h']]){$(id).disabled=!a.length;$(id).value=a.length?Math.round(b[key]):'';}
   $('maker-track-label').disabled=a.length!==1;$('maker-track-label').value=a.length===1?(a[0].meta?.label||'Custom curve'):'';
   const neighbor=S.object?.type==='neighbor'?S.doc.extra.gp.cast[S.object.index]:null;$('maker-object-fields').hidden=!neighbor;if(neighbor){$('maker-neighbor-name').value=neighbor.name;$('maker-neighbor-text').value=neighbor.text;}
   $('maker-world-width').value=S.doc.w;$('maker-world-height').value=S.doc.h;$('maker-style').value=S.doc.extra.gp?.style||'village';$('maker-style').disabled=!S.doc.extra.gp;$('maker-music').value=S.doc.music;
   options($('maker-sector'),[['','Frame an area...'],...(S.doc.extra.gp?.skyNetwork?.sectors||[]).map((s,i)=>[i,s.name])]);
   $('maker-outline').replaceChildren();S.doc.paths.forEach((p,i)=>{const b=document.createElement('button');b.dataset.track=i;b.textContent=`${i+1}. ${p.meta?.label||'Custom curve'}`;b.className=S.selected.has(i)?'chosen':'';$('maker-outline').append(b);});
   $('maker-count').textContent=`${S.doc.paths.length} tracks / ${S.doc.w} x ${S.doc.h} tiles${S.dirty?' / Unsaved changes':''}`;
   for(const b of host.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===S.tool));for(const b of host.querySelectorAll('[data-piece]'))b.classList.toggle('chosen',S.tool==='piece'&&b.dataset.piece===S.piece);for(const b of host.querySelectorAll('[data-tile]'))b.classList.toggle('chosen',S.tool==='paint'&&Number(b.dataset.tile)===S.tile);
   host.querySelector('[data-mk="undo"]').disabled=S.history.index<=0;host.querySelector('[data-mk="redo"]').disabled=S.history.index>=S.history.items.length-1;
  }
  function load(code){S.doc=W.decode(code);S.history=new W.History(code);clearSelection();S.saved=code;S.dirty=false;S.tool='select';refresh();fit();}
  let creditBefore=null,draftId=null;
  const nativeEditor=__delivery.openEditor;
  function resetKeys(){for(const k of Object.keys(keys))keys[k]=false;S.space=false;}
  function hideGameDialogs(){for(const id of ['delivery-menu','delivery-results','delivery-pause'])$(id).classList.remove('open');document.body.classList.remove('delivery-menu-open');__delivery.state.menu=false;hideWin();}
  function open(code){
   if(S.testing){returnToDraft();return;}
   if(!S.active){
    // Preserve the older creator's complete blueprint as well as this new draft.
    const route=__delivery.state.route;
    S.currentCode=route>=0?(__delivery.state.code||levelCode()):null;
    nativeEditor();S.legacyCode=levelCode();__adventure.state.transition=null;resetKeys();
    S.active=true;document.body.classList.add('maker-open');host.hidden=false;host.inert=false;size();
   }
   if(code){draftId=null;load(code);}
   else if(!S.doc){
    let recover=null;try{recover=JSON.parse(safeStore.get(recoveryKey)||'null');if(recover?.code)W.decode(recover.code);}catch{recover=null;}
    if(recover?.code){draftId=recover.id||null;load(recover.code);message('Recovered the last workshop draft. Your campaign saves are unchanged.');}
    else load(S.currentCode||GroundCampaign.encode(GroundCampaign.make(0,T)));
   }
   refresh();renderThumbnails();canvas.focus({preventScroll:true});draw();
  }
  function close(){clearTimeout(autosave);if(S.dirty)safeStore.set(recoveryKey,JSON.stringify({id:draftId,name:S.doc.name,code:current(),time:Date.now()}));S.active=false;host.hidden=true;host.inert=true;document.body.classList.remove('maker-open');resetKeys();}
  function replace(d){if(S.dirty&&!confirm('Replace this draft? Save or export it first to keep these edits.'))return false;W.validate(d);draftId=null;load(W.encode(d));message('Editable copy loaded. The featured route itself is unchanged.');return true;}
  function save(){
   const code=current(),items=library();if(!draftId)draftId='draft-'+Date.now().toString(36);
   const record={id:draftId,name:S.doc.name,code,time:Date.now()},kept=items.filter(x=>x.id!==draftId);
   if(kept.length>=12){message('The draft library holds 12 levels. Export this draft or replace one of your saved drafts.');return;}
   if(!safeStore.set(storageKey,JSON.stringify([record,...kept]))){message('Storage is unavailable or full. Export your level instead.');return;}
   S.saved=code;S.dirty=false;safeStore.set(recoveryKey,JSON.stringify(record));refreshDrafts();$('maker-drafts').value=draftId;refresh();message('Draft saved on this device. Export keeps a portable backup.');
  }
  function transform(op){
   if(S.object){const o=S.object;
    if(o.type==='neighbor'){const n=S.doc.extra.gp.cast[o.index];n.x+=op.dx?op.dx/36:0;n.y+=op.dy?op.dy/36:0;}
    else{const x=o.x+Math.round((op.dx||0)/36),y=o.y+Math.round((op.dy||0)/36);if(x<0||y<0||x>=S.doc.w||y>=S.doc.h)return;if(S.doc.cells[y*S.doc.w+x]&&!(x===o.x&&y===o.y)){message('That tile is occupied.');return;}S.doc.cells[o.y*S.doc.w+o.x]=0;S.doc.cells[y*S.doc.w+x]=o.id;Object.assign(o,{x,y});}
    changed('Object moved.');return;
   }
   if(!S.selected.size)return;const a=selected(),b=W.bounds(a),origin=[b.x+b.w/2,b.y+b.h/2];a.forEach(p=>W.transform(p,{...op,origin}));changed('Selection transformed.');
  }
  function playtest(){
   const notes=W.check(S.doc);$('maker-checks').textContent=[...notes.errors,...notes.warnings].join(' ');if(notes.errors.length){message(notes.errors.join(' '));return;}
   const code=current();S.testSnapshot={code,view:{...S.view},selection:[...S.selected],object:S.object?W.clone(S.object):null,history:S.history,saved:S.saved,dirty:S.dirty};
   S.testing=true;creditBefore=credits;close();nativeEditor();__delivery.state.route=-1;__delivery.state.code='';__adventure.state.transition=null;resetKeys();
   if(!loadCode(code)){S.testing=false;open();message('The game rejected this draft; your edits are intact.');return;}
   if(__delivery.state.view!=='3d')__delivery.act('view');
   hideGameDialogs();routeKeep=false;startPlay(true);$('maker-return').hidden=false;cv.focus({preventScroll:true});
  }
  function returnToDraft(){
   if(!S.testing)return;const saved=S.testSnapshot;S.testing=false;__adventure.state.transition=null;__delivery.act('resume');toEdit();hideGameDialogs();resetKeys();
   loadCode(S.legacyCode||saved.code);if(creditBefore!==null){credits=creditBefore;creditBefore=null;updateHUD();}
   S.active=true;host.hidden=false;host.inert=false;document.body.classList.add('maker-open');$('maker-return').hidden=true;S.doc=W.decode(saved.code);S.view={...saved.view};S.selected=new Set(saved.selection);S.object=saved.object;S.history=saved.history;S.saved=saved.saved;S.dirty=saved.dirty;size();refresh();canvas.focus();
  }
  const returnButton=document.createElement('button');returnButton.id='maker-return';returnButton.className='delivery-btn';returnButton.textContent='Return to Workshop';returnButton.hidden=true;document.querySelector('#delivery-header .actions').append(returnButton);returnButton.onclick=returnToDraft;
  const editCopy=document.createElement('button');editCopy.id='workshop-edit-current';editCopy.className='delivery-btn';editCopy.textContent='Edit this world';document.querySelector('#delivery-header .actions').append(editCopy);editCopy.onclick=()=>{if(S.testing){returnToDraft();return;}const code=__delivery.state.route>=0?(__delivery.state.code||levelCode()):levelCode();if(S.dirty&&!confirm('Open a copy of this world? Save or export your workshop edits first.'))return;open(code);};
  // Playtest progression is isolated from campaign records and persistent coins.
  const award=addCredits;window.addCredits=function(n,x,y){if(!S.testing)return award(n,x,y);credits+=n;if(x!==undefined)popText(x,y,'+'+n+' test coins','#a9efde');updateHUD();};
  const poll=pollGamepadEdit;window.pollGamepadEdit=function(){if(!S.active)return poll();};
  function action(a){try{
   if(a==='undo'||a==='redo'){const ids=new Set(selected().map(p=>p.meta?.id).filter(Boolean));const indexes=new Set(S.selected);S.doc=W.decode(S.history[a]());S.selected=new Set(S.doc.paths.map((p,i)=>p.meta?.id?ids.has(p.meta.id)?i:-1:indexes.has(i)?i:-1).filter(i=>i>=0));S.object=null;S.dirty=current()!==S.saved;safeStore.set(recoveryKey,JSON.stringify({id:draftId,name:S.doc.name,code:current(),time:Date.now()}));refresh();return;}
   if(a==='fit'||a==='focus'){fit(a==='focus');return;}
   if(a==='zoomin'||a==='zoomout'){zoom(a==='zoomin'?1.25:.8,width/2,height/2);return;}
   if(a==='save')save();if(a==='test')playtest();if(a==='inspector'){const show=host.classList.toggle('show-inspector');$('maker-inspector-toggle').setAttribute('aria-expanded',String(show));}
   if(a==='exit'){if(S.dirty&&!confirm('Close the editor? Unsaved changes remain in this tab, but are not a saved backup.'))return;close();__delivery.showMenu();}
   if(a==='legacy'){const code=current();close();nativeEditor();loadCode(code);}
   if(a==='starter')replace(W.starter());
   if(a==='route')replace(W.decode(DeliveryCampaign.encode(DeliveryCampaign.build(Number($('maker-route').value),T))));
   if(a==='resize'){W.resize(S.doc,Number($('maker-world-width').value),Number($('maker-world-height').value));changed('World dimensions changed. Existing geometry is preserved.');fit();}
   if(a==='restore'){const record=library().find(d=>d.id===$('maker-drafts').value);if(record){if(replace(W.decode(record.code)))draftId=record.id;}else message('Save a draft before loading one.');}
   if(a==='check'){const report=W.check(S.doc);$('maker-checks').textContent=[...report.errors,...report.warnings].join(' ');message('Document checked. Test the actual jumps in Playtest.');}
   if(a==='delete'){if(S.object?.type==='tile')S.doc.cells[S.object.y*S.doc.w+S.object.x]=0;else if(S.object?.type==='neighbor')S.doc.extra.gp.cast.splice(S.object.index,1);else S.doc.paths=S.doc.paths.filter((p,i)=>!S.selected.has(i));clearSelection();W.syncNetwork(S.doc);changed('Selection removed. Undo restores it.');}
   if(a==='duplicate'){const copies=selected().map(p=>W.clone(p));S.selected.clear();for(const p of copies){W.transform(p,{dx:54,dy:-54});S.selected.add(S.doc.paths.length);W.tagNew(S.doc,p);S.doc.paths.push(p);}W.syncNetwork(S.doc);changed('Selection duplicated without reusing track identities.');}
   if(a==='rotateleft'||a==='rotateright')transform({angle:(a==='rotateleft'?-1:1)*Math.PI/12});
   if(a==='flip')transform({sx:-1});if(a==='flipv')transform({sy:-1});if(a==='smaller'||a==='bigger')transform({sx:a==='smaller'?.85:1.15,sy:a==='smaller'?.85:1.15});
   if(a==='reverse'){selected().forEach(p=>{p.points.reverse();p.anchors=null;if(p.meta){p.meta.kind='open';p.meta.begin=0;p.meta.end=1;}});changed('Riding side reversed.');}
   if(a==='join'){const i=W.join(S.doc,[...S.selected]);S.selected=new Set([i]);changed('Tracks joined by a real connecting surface.');}
   if(a==='export'){const url=URL.createObjectURL(new Blob([current()],{type:'text/plain'})),link=document.createElement('a');link.href=url;link.download=S.doc.name.replace(/[^a-z0-9-]/gi,'-').slice(0,60)+'.route';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
   if(a==='import')$('maker-file').click();
  }catch(e){message(e.message);}}
  host.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.mk)action(b.dataset.mk);if(b.dataset.tool){S.tool=b.dataset.tool;refresh();message('Tool: '+b.textContent.trim());}if(b.dataset.piece){S.tool='piece';S.piece=b.dataset.piece;refresh();message('Click the canvas to place '+b.textContent.trim()+'.');}if(b.dataset.tile){S.tool='paint';S.tile=Number(b.dataset.tile);refresh();}if(b.dataset.track){S.object=null;S.selected=new Set([Number(b.dataset.track)]);refresh();fit(true);}});
  $('maker-track-label').onchange=e=>{if(S.selected.size!==1)return;const p=selected()[0];if(!p.meta)W.tagNew(S.doc,p);p.meta.label=e.target.value;changed('Track label updated.');};
  $('maker-music').onchange=e=>{S.doc.music=e.target.value;changed('Soundtrack set for 3D playtest.');};
  $('maker-style').onchange=e=>{if(S.doc.extra.gp)S.doc.extra.gp.style=e.target.value;S.doc.theme=e.target.value==='canal'?'hills':'dawn';changed('Neighborhood appearance updated.');};
  for(const [id,key]of[['maker-neighbor-name','name'],['maker-neighbor-text','text']])$(id).onchange=e=>{if(S.object?.type==='neighbor'){S.doc.extra.gp.cast[S.object.index][key]=e.target.value;changed('Neighbor updated.');}};
  $('maker-layer').onchange=e=>{S.layer=e.target.value;S.dirtyFrame=true;};
  $('maker-sector').onchange=e=>{if(e.target.value==='')return;const b=S.doc.extra.gp?.skyNetwork?.sectors[Number(e.target.value)];if(!b)return;S.view.zoom=Math.max(.08,Math.min(1.5,Math.min((width-70)/b.w,(height-70)/b.h)));S.view.x=b.x+b.w/2-width/S.view.zoom/2;S.view.y=b.y+b.h/2-height/S.view.zoom/2;S.dirtyFrame=true;};
  $('maker-name').addEventListener('change',e=>{S.doc.name=e.target.value.trim()||'Untitled route';changed('Level renamed.');});
  $('maker-snap').onchange=e=>{S.snap=e.target.checked;S.dirtyFrame=true;};$('maker-handles').onchange=e=>{S.handles=e.target.checked;S.dirtyFrame=true;};
  for(const [id,key]of[['maker-x','x'],['maker-y','y'],['maker-width','w'],['maker-height','h']])$(id).addEventListener('change',e=>{const a=selected(),b=W.bounds(a),v=Number(e.target.value);if(!Number.isFinite(v))return;if(key==='x'||key==='y')transform({dx:key==='x'?v-b.x:0,dy:key==='y'?v-b.y:0});else transform({sx:key==='w'?Math.max(1,v)/(b.w||1):1,sy:key==='h'?Math.max(1,v)/(b.h||1):1});});
  $('maker-file').onchange=async e=>{const f=e.target.files[0];try{if(f){if(f.size>W.LIMITS.code)throw Error('File is too large.');replace(W.decode(await f.text()));}}catch(err){message(err.message);}e.target.value='';};
  function size(){const r=canvas.parentElement.getBoundingClientRect();if(r.width<1)return;width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;S.dirtyFrame=true;}
  new ResizeObserver(size).observe(canvas.parentElement);
  function world(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/S.view.zoom+S.view.x,(e.clientY-r.top)/S.view.zoom+S.view.y];}
  const snap=v=>S.snap?Math.round(v/18)*18:v;
  function inLayer(p){const y=W.bounds([p]).y,cut=(S.doc.extra.gp?.ground||S.doc.h-8)*36-350;return S.layer==='all'||S.layer==='ground'&&y>=cut||S.layer==='upper'&&y<cut;}
  function tileHit(p){const x=Math.floor(p[0]/36),y=Math.floor(p[1]/36);if(x<0||y<0||x>=S.doc.w||y>=S.doc.h)return null;const id=S.doc.cells[y*S.doc.w+x];return id?{type:'tile',x,y,id}:null;}
  function neighborHit(p){const list=S.doc.extra.gp?.cast||[];const i=list.findIndex(n=>Math.hypot(n.x*36-p[0],n.y*36-20-p[1])<Math.max(23,12/S.view.zoom));return i<0?null:{type:'neighbor',index:i};}
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{if(!S.active||S.drag)return;e.preventDefault();canvas.focus();canvas.setPointerCapture(e.pointerId);const p=world(e);pointer=p;const before=current();S.dirtyFrame=true;
   if(e.button===1||S.space||S.tool==='pan'){S.drag={type:'pan',p:[e.clientX,e.clientY],view:{...S.view}};return;}
   if(e.button===2||S.tool==='erase'){const i=W.hit(S.doc.paths,...p,12/S.view.zoom);if(i>=0){S.doc.paths.splice(i,1);clearSelection();W.syncNetwork(S.doc);S.drag={type:'erase-track',before};}else{W.paintLine(S.doc,p,p,0);S.drag={type:'erase',before,previous:p};}refresh();return;}
   if(S.tool==='piece'){try{const q=W.tagNew(S.doc,W.piece(S.piece,snap(p[0]),snap(p[1])));if(S.doc.paths.length>=W.LIMITS.tracks)throw Error('The level already contains 192 tracks.');S.doc.paths.push(q);S.object=null;S.selected=new Set([S.doc.paths.length-1]);changed('Roadway placed. Select / move to adjust it.');}catch(err){message(err.message);}return;}
   if(S.tool==='neighbor'){
    const gp=S.doc.extra.gp;if(!gp||gp.adventure!==2){message('Postal neighbors require a grounded adventure template.');return;}
    if(gp.cast.length>=24){message('This level has the maximum 24 neighbors.');return;}
    gp.cast.push({id:'neighbor-'+Date.now().toString(36),name:'New neighbor',text:'There is more than one way through this neighborhood.',x:Math.round(p[0]/36),y:Math.round((p[1]+20)/36)});clearSelection();S.object={type:'neighbor',index:gp.cast.length-1};S.tool='select';changed('Neighbor placed. Edit their message in the inspector.');return;
   }
   if(S.tool==='paint'){W.paintLine(S.doc,p,p,S.tile);S.drag={type:'paint',before,previous:p};return;}
   if(S.tool==='draw'){S.drag={type:'draw',before,points:[p]};return;}
   if(S.handles&&S.selected.size===1){const i=[...S.selected][0],q=S.doc.paths[i];for(let j=0;j<5;j++){const k=Math.round(j*(q.points.length-1)/4),a=q.points[k];if(Math.hypot(a[0]-p[0],a[1]-p[1])<12/S.view.zoom){S.drag={type:'handle',before,i,k,p,base:W.clone(q)};return;}}}
   const i=W.hit(S.doc.paths.map(p=>inLayer(p)?p:{points:[]}),...p,12/S.view.zoom);
   if(i>=0){S.object=null;if(e.shiftKey){if(S.selected.has(i))S.selected.delete(i);else S.selected.add(i);}else if(!S.selected.has(i))S.selected=new Set([i]);refresh();S.drag={type:'move',before,p,bases:[...S.selected].map(i=>[i,W.clone(S.doc.paths[i])])};return;}
   const obj=neighborHit(p)||tileHit(p);clearSelection();S.object=obj;
   if(obj)S.drag={type:'object',before,p,object:W.clone(obj),to:p};
   else S.drag={type:'marquee',before,p,to:p,add:e.shiftKey};refresh();
  });
  canvas.addEventListener('pointermove',e=>{if(!S.active)return;const p=world(e);pointer=p;S.dirtyFrame=true;const d=S.drag;if(!d)return;
   if(d.type==='pan'){S.view.x=d.view.x-(e.clientX-d.p[0])/S.view.zoom;S.view.y=d.view.y-(e.clientY-d.p[1])/S.view.zoom;}
   if(d.type==='paint'||d.type==='erase'){W.paintLine(S.doc,d.previous,p,d.type==='erase'?0:S.tile);d.previous=p;}
   if(d.type==='draw'){const q=d.points.at(-1);if(d.points.length<W.LIMITS.points&&Math.hypot(q[0]-p[0],q[1]-p[1])>6/S.view.zoom)d.points.push(p);}
   if(d.type==='move'){const dx=snap(p[0]-d.p[0]),dy=snap(p[1]-d.p[1]);for(const [i,q]of d.bases)S.doc.paths[i]=W.transform(W.clone(q),{dx,dy});}
   if(d.type==='handle'){S.doc.paths[d.i]=W.clone(d.base);W.deform(S.doc.paths[d.i],d.k,snap(p[0]-d.p[0]),snap(p[1]-d.p[1]));}
   if(d.type==='object'||d.type==='marquee')d.to=p;
  });
  function end(cancel=false){const d=S.drag;if(!d)return;S.drag=null;S.dirtyFrame=true;if(cancel&&d.before){S.doc=W.decode(d.before);refresh();return;}
   if(d.type==='marquee'){const x=Math.min(d.p[0],d.to[0]),y=Math.min(d.p[1],d.to[1]),w=Math.abs(d.to[0]-d.p[0]),h=Math.abs(d.to[1]-d.p[1]);if(!d.add)S.selected.clear();S.doc.paths.forEach((p,i)=>{const b=W.bounds([p]);if(inLayer(p)&&b.x>=x&&b.y>=y&&b.x+b.w<=x+w&&b.y+b.h<=y+h)S.selected.add(i);});refresh();return;}
   if(d.type==='object'){transform({dx:Math.round((d.to[0]-d.p[0])/36)*36,dy:Math.round((d.to[1]-d.p[1])/36)*36});return;}
   if(d.type==='draw'&&d.points.length>1){if(S.doc.paths.length>=W.LIMITS.tracks){message('Track limit reached.');return;}const p=W.tagNew(S.doc,{points:d.points,anchors:null,meta:{version:1,kind:'open',begin:0,end:1,label:'Drawn curve'}});S.doc.paths.push(p);S.selected=new Set([S.doc.paths.length-1]);S.object=null;}
   if(d.type!=='pan')changed('Edit applied.');
  }
  canvas.addEventListener('pointerup',()=>end());canvas.addEventListener('pointercancel',()=>end(true));canvas.addEventListener('lostpointercapture',()=>end());
  function zoom(f,x,y){S.dirtyFrame=true;const old=S.view.zoom;S.view.zoom=Math.max(.06,Math.min(4,old*f));S.view.x+=x/old-x/S.view.zoom;S.view.y+=y/old-y/S.view.zoom;}
  canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  mini.addEventListener('pointerdown',e=>{S.dirtyFrame=true;const r=mini.getBoundingClientRect();S.view.x=(e.clientX-r.left)/r.width*S.doc.w*36-width/S.view.zoom/2;S.view.y=(e.clientY-r.top)/r.height*S.doc.h*36-height/S.view.zoom/2;});
  function handleKey(e){if(!S.active)return;/* Save from text fields commits their pending change first. */if(e.type==='keydown'&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.target.blur();save();return;}if(e.key==='Tab'){if(e.type==='keyup')return;const list=[...host.querySelectorAll('button,input,select,textarea,canvas[tabindex]')].filter(el=>!el.disabled&&el.getClientRects().length);const i=list.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();list.at(-1)?.focus();}else if(!e.shiftKey&&i===list.length-1){e.preventDefault();list[0]?.focus();}return;}if(e.type==='keyup'){if(e.code==='Space')S.space=false;return;}if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();S.space=true;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();action(e.shiftKey?'redo':'undo');}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();action('redo');}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();action('duplicate');}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();action('delete');}else if(e.key.startsWith('Arrow')){e.preventDefault();const n=e.shiftKey?72:S.object?36:S.snap?18:2;transform({dx:e.key==='ArrowLeft'?-n:e.key==='ArrowRight'?n:0,dy:e.key==='ArrowUp'?-n:e.key==='ArrowDown'?n:0});}else if(e.key==='Escape'){if(host.classList.contains('show-inspector')){host.classList.remove('show-inspector');$('maker-inspector-toggle').setAttribute('aria-expanded','false');$('maker-inspector-toggle').focus();return;}clearSelection();S.tool='select';refresh();}}
  function draw(){if(!S.active||!S.doc||!S.dirtyFrame)return;S.dirtyFrame=false;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#112a38';ctx.fillRect(0,0,width,height);ctx.save();ctx.scale(S.view.zoom,S.view.zoom);ctx.translate(-S.view.x,-S.view.y);const z=S.view.zoom;
   ctx.strokeStyle='#aacbdb13';ctx.lineWidth=1/z;ctx.beginPath();const spacing=z<.3?144:36;for(let x=Math.floor(S.view.x/spacing)*spacing;x<S.view.x+width/z;x+=spacing){ctx.moveTo(x,S.view.y);ctx.lineTo(x,S.view.y+height/z);}for(let y=Math.floor(S.view.y/spacing)*spacing;y<S.view.y+height/z;y+=spacing){ctx.moveTo(S.view.x,y);ctx.lineTo(S.view.x+width/z,y);}ctx.stroke();ctx.strokeStyle='#648799';ctx.strokeRect(0,0,S.doc.w*36,S.doc.h*36);
   for(let ty=Math.max(0,Math.floor(S.view.y/36));ty<Math.min(S.doc.h,Math.ceil((S.view.y+height/z)/36));ty++)for(let tx=Math.max(0,Math.floor(S.view.x/36));tx<Math.min(S.doc.w,Math.ceil((S.view.x+width/z)/36));tx++){const id=S.doc.cells[ty*S.doc.w+tx];if(!id)continue;const x=tx*36,y=ty*36;ctx.fillStyle=[1,2].includes(id)?'#4d6d7c':id===15?'#68d2ab':id===8?'#ecd184':id===60?'#79e4ed':id===4?'#e58b82':'#be9d6a';ctx.fillRect(x+1,y+1,34,34);if(z>.45){ctx.save();ctx.translate(x,y);drawTileIcon(ctx,id);ctx.restore();}if(z>.35&&z<=.45){ctx.fillStyle='#112936';ctx.textAlign='center';ctx.font='bold 10px system-ui';ctx.fillText(id===15?'START':id===8?'GOAL':id===60?'PEG':id===63?'MAIL':id===7?'--':id===16?'BOT':String(id),x+18,y+22);}}
   S.doc.paths.forEach((p,i)=>{if(!inLayer(p))return;if(S.selected.has(i)){ctx.strokeStyle='#65f1de';ctx.lineWidth=16/z;ctx.beginPath();p.points.forEach((q,k)=>k?ctx.lineTo(...q):ctx.moveTo(...q));ctx.stroke();}line(ctx,p.points,z);const mid=Math.floor(p.points.length/2),a=p.points[mid-1]||p.points[0],b=p.points[mid],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;ctx.fillStyle='#9ae9df';ctx.beginPath();ctx.moveTo(b[0]+dy/l*18/z,b[1]-dx/l*18/z);ctx.lineTo(b[0]-dx/l*5/z,b[1]-dy/l*5/z);ctx.lineTo(b[0]+dx/l*5/z,b[1]+dy/l*5/z);ctx.fill();for(const q of[p.points[0],p.points.at(-1)]){ctx.fillStyle='#fff0bc';ctx.beginPath();ctx.arc(q[0],q[1],4/z,0,7);ctx.fill();}if(S.handles&&S.selected.has(i))for(let j=0;j<5;j++){const q=p.points[Math.round(j*(p.points.length-1)/4)];ctx.fillStyle='#75f4e7';ctx.strokeStyle='#193c51';ctx.lineWidth=2/z;ctx.beginPath();ctx.arc(q[0],q[1],7/z,0,7);ctx.fill();ctx.stroke();}});
   for(const [i,n]of (S.doc.extra.gp?.cast||[]).entries()){ctx.fillStyle=S.object?.type==='neighbor'&&S.object.index===i?'#81f4dc':'#f4d9b1';ctx.beginPath();ctx.arc(n.x*36,n.y*36-22,10,0,7);ctx.fill();ctx.fillStyle='#528b9e';ctx.fillRect(n.x*36-10,n.y*36-11,20,16);if(z>.4){ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillStyle='#ffe9c3';ctx.fillText(n.name,n.x*36,n.y*36-40);}}
   if(S.object?.type==='tile'){ctx.strokeStyle='#8df4dc';ctx.lineWidth=3/z;ctx.strokeRect(S.object.x*36-2,S.object.y*36-2,40,40);}
   if(S.drag?.type==='marquee'){const d=S.drag;ctx.fillStyle='#81e6d51a';ctx.strokeStyle='#8df4dc';ctx.lineWidth=1/z;ctx.fillRect(d.p[0],d.p[1],d.to[0]-d.p[0],d.to[1]-d.p[1]);ctx.strokeRect(d.p[0],d.p[1],d.to[0]-d.p[0],d.to[1]-d.p[1]);}
   if(S.drag?.type==='object'){const d=S.drag;ctx.strokeStyle='#ffeab7';ctx.lineWidth=2/z;ctx.strokeRect(d.to[0]-18,d.to[1]-18,36,36);}
   if(S.drag?.type==='draw')line(ctx,S.drag.points,z);if(S.tool==='piece'&&pointer){ctx.globalAlpha=.45;line(ctx,W.piece(S.piece,snap(pointer[0]),snap(pointer[1])).points,z);ctx.globalAlpha=1;}ctx.restore();
   $('maker-zoom').textContent=Math.round(z*100)+'%';$('maker-empty').hidden=S.doc.paths.length>0||S.doc.cells.some(v=>v!==0);
   mg.clearRect(0,0,210,95);mg.fillStyle='#183c4e';mg.fillRect(0,0,210,95);const sx=210/(S.doc.w*36),sy=95/(S.doc.h*36);mg.strokeStyle='#eec276';mg.lineWidth=1;for(const p of S.doc.paths){mg.beginPath();p.points.forEach((q,i)=>i?mg.lineTo(q[0]*sx,q[1]*sy):mg.moveTo(q[0]*sx,q[1]*sy));mg.stroke();}mg.fillStyle='#608695';for(let y=0;y<S.doc.h;y++)for(let x=0;x<S.doc.w;x++)if(S.doc.cells[y*S.doc.w+x])mg.fillRect(x*36*sx,y*36*sy,Math.max(1,36*sx),Math.max(1,36*sy));mg.strokeStyle='#97f4e0';mg.strokeRect(S.view.x*sx,S.view.y*sy,width/z*sx,height/z*sy);
  }
  // Window capture runs before older document handlers, including the sky-copy
  // and ground-template buttons. Keyboard capture is installed before the engine.
  window.addEventListener('click',e=>{
   const b=e.target.closest('[data-delivery="editor"],#sky-edit-copy,#beginner-blueprint,[data-delivery="next"],[data-delivery="routes"]');if(!b)return;
   if(b.matches('[data-delivery="next"],[data-delivery="routes"]')){if(S.testing){e.preventDefault();e.stopImmediatePropagation();returnToDraft();}return;}
   e.preventDefault();e.stopImmediatePropagation();
   if(S.testing){returnToDraft();return;}
   if(b.id==='beginner-blueprint'){open();replace(W.starter());}
   else if(b.id==='sky-edit-copy'){open(__delivery.state.code||levelCode());}
   else open();
  },true);
  const render=window.render;window.render=function(){if(S.active){draw();return;}render();if(S.testing){$('maker-return').hidden=false;const results=$('delivery-results');if(won&&results.classList.contains('open')){const next=results.querySelector('[data-delivery="next"]');if(next)next.textContent='Return to Workshop';}}};
  window.RouteWorkshop={get active(){return S.active},get testing(){return S.testing},state:S,open,close,draw,handleKey,action,returnToDraft};
  window.addEventListener('blur',()=>{S.space=false;if(S.drag)end(true);});
  window.addEventListener('beforeunload',e=>{if(S.dirty){e.preventDefault();e.returnValue='';}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
