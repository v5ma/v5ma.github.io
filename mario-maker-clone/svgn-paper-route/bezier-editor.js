/* Real anchor/tangent and transform tools inside Route Workshop. All gestures
 * commit once through its existing unified history, save and 3D playtest path. */
(function(root){'use strict';
 root.BezierEditor={attach(api){
  const {S,canvas,ctx,W,changed,refresh,message,transform,fit}=api,B=BezierCore;
  let selectedAnchor=0,drag=null,pen=null;
  const $=id=>document.getElementById(id),host=$('route-workshop');
  const panel=document.createElement('section');panel.id='bezier-controls';panel.innerHTML=`<h2>Curves and transforms</h2><div class="bezier-row"><button id="curve-pen">Pen tool</button><button id="curve-finish">Finish path</button></div><p>Click-drag for a smooth anchor. Click for a corner. Finish path commits once.</p><div class="bezier-row"><button id="curve-convert">Convert to anchors</button><button id="curve-fit">Fit fewer handles</button></div><label>Anchor type<select id="curve-mode"><option value="corner">Corner / independent</option><option value="smooth">Smooth / aligned</option><option value="symmetric">Symmetric</option></select></label><div class="bezier-row"><button id="curve-split">Split next segment</button><button id="curve-delete-node">Delete anchor</button></div><div class="bezier-row"><label>Rotate by degrees<input type="number" id="curve-angle" value="15" step="1"></label><button id="curve-rotate">Apply rotation</button></div><div id="curve-arc-fields"><label>Radius X<input id="curve-rx" type="number" min="1" max="4000"></label><label>Radius Y<input id="curve-ry" type="number" min="1" max="4000"></label><label>Sweep degrees<input id="curve-sweep" type="number" min="-360" max="360"></label><button id="curve-arc-apply">Apply arc shape</button></div><p id="curve-help">Select a curve. Drag the round rotation handle or square resize handles. Shape handles reveals anchors and tangents.</p>`;
  host.querySelector('.maker-inspector').prepend(panel);
  const tools=document.createElement('div');tools.className='curve-browser';tools.innerHTML='<label>Find a part<input id="curve-search" type="search" placeholder="Loop, peg, fifth arc..."></label><label>Show<select id="curve-category"><option value="all">All parts</option><option value="curves">Curves and rails</option><option value="objects">Terrain and objects</option></select></label>';
  host.querySelector('#maker-pieces').before(tools);
  function search(){const text=$('curve-search').value.toLowerCase(),cat=$('curve-category').value;for(const b of host.querySelectorAll('[data-piece],[data-tile]')){const allow=cat==='all'||cat==='curves'&&b.dataset.piece||cat==='objects'&&b.dataset.tile;b.hidden=!allow||!b.textContent.toLowerCase().includes(text);}}
  $('curve-search').oninput=search;$('curve-category').onchange=search;
  const one=()=>S.selected.size===1?S.doc.paths[[...S.selected][0]]:null;
  const paths=()=>[...S.selected].map(i=>S.doc.paths[i]).filter(Boolean);
  const world=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/S.view.zoom+S.view.x,(e.clientY-r.top)/S.view.zoom+S.view.y];};
  const snap=v=>S.snap?Math.round(v/18)*18:v;
  function commit(label){changed(label);sync();}
  function run(f){try{f();}catch(e){message(e.message);}}
  function sync(){const p=one(),n=p?.bezier?.[selectedAnchor];selectedAnchor=Math.min(selectedAnchor,(p?.bezier?.length||1)-1);$('curve-mode').disabled=!n;$('curve-split').disabled=!n||selectedAnchor>=p.bezier.length-1;$('curve-delete-node').disabled=!p?.bezier||p.bezier.length<=2;if(n)$('curve-mode').value=n.mode;$('curve-arc-fields').hidden=!p?.arc;if(p?.arc){$('curve-rx').value=Math.round(p.arc.rx);$('curve-ry').value=Math.round(p.arc.ry);$('curve-sweep').value=p.arc.sweep;}if(p?.bezier)$('curve-help').textContent=`${p.bezier.length} anchors. Anchor ${selectedAnchor+1} selected. Alt-drag a tangent for independent control. Curves export with their handles.`;}
  $('curve-convert').onclick=()=>run(()=>{if(!one())return;B.convert(one());S.handles=true;$('maker-handles').checked=true;selectedAnchor=0;commit('Converted to real cubic anchors. Original geometry remains in Undo.');});
  $('curve-fit').onclick=()=>run(()=>{if(!one())return;B.fit(one(),3);S.handles=true;$('maker-handles').checked=true;selectedAnchor=0;commit('Fitted fewer smooth handles; this approximates the original line. Undo restores it exactly.');});
  $('curve-mode').onchange=e=>run(()=>{const p=one();if(!p?.bezier)return;B.mode(p.bezier[selectedAnchor],e.target.value);delete p.arc;B.rebuild(p);commit('Anchor tangent mode updated.');});
  $('curve-split').onclick=()=>run(()=>{const p=one();if(!p?.bezier)return;selectedAnchor=B.split(p.bezier,selectedAnchor,.5);delete p.arc;B.rebuild(p);commit('Cubic split without changing its mathematical shape.');});
  $('curve-delete-node').onclick=()=>run(()=>{const p=one();if(!p?.bezier||p.bezier.length<=2)return;p.bezier.splice(selectedAnchor,1);selectedAnchor=Math.max(0,selectedAnchor-1);delete p.arc;B.rebuild(p);commit('Anchor removed; neighboring tangents retained.');});
  $('curve-rotate').onclick=()=>run(()=>{const n=Number($('curve-angle').value);if(!Number.isFinite(n))return;transform({angle:n*Math.PI/180});sync();});
  $('curve-arc-apply').onclick=()=>run(()=>{const p=one();if(!p?.arc)return;const a={...p.arc,rx:Number($('curve-rx').value),ry:Number($('curve-ry').value),sweep:Number($('curve-sweep').value)};p.bezier=B.arc(...a.center,a.rx,a.ry,a.start,a.sweep);p.arc=a;B.rebuild(p);commit('Arc curvature and sweep updated.');});
  $('curve-pen').onclick=()=>{if(pen)finishPen();S.tool='pen';pen={nodes:[]};S.selected.clear();S.object=null;refresh();message('Pen: click-drag anchors. Finish path commits the curve. Escape cancels.');};
  function finishPen(){if(!pen)return;run(()=>{if(pen.nodes.length<2){pen=null;S.tool='select';refresh();return;}const p=W.tagNew(S.doc,{points:[],bezier:pen.nodes,anchors:null,meta:{label:'Bezier pen curve'}});B.rebuild(p);S.doc.paths.push(p);S.selected=new Set([S.doc.paths.length-1]);S.object=null;S.tool='select';S.handles=true;$('maker-handles').checked=true;pen=null;commit('Bezier pen path created.');});}
  $('curve-finish').onclick=finishPen;
  function handles(){const a=paths();if(!a.length)return [];const b=W.bounds(a),z=S.view.zoom,c=[b.x+b.w/2,b.y+b.h/2];return [{kind:'rotate',p:[c[0],b.y-30/z]},...[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]].map(p=>({kind:'resize',p})),{kind:'center',p:c}];}
  function pointerDown(e,p){if(e.button!==0||S.space||S.tool==='pan')return false;
   if(S.tool==='pen'){pen??={nodes:[]};const n=B.node([snap(p[0]),snap(p[1])]);pen.nodes.push(n);drag={kind:'pen',index:pen.nodes.length-1,p};return true;}
   if(S.tool!=='select')return false;
   const shape=one();
   if(S.handles&&shape?.bezier){const index=[...S.selected][0];for(let i=0;i<shape.bezier.length;i++){const n=shape.bezier[i];for(const which of ['i','o','p']){if(which!=='p'&&Math.hypot(...n[which])<.01)continue;const q=which==='p'?n.p:[n.p[0]+n[which][0],n.p[1]+n[which][1]];if(Math.hypot(q[0]-p[0],q[1]-p[1])<9/S.view.zoom){selectedAnchor=i;drag={kind:'node',index,node:i,which,p,base:B.copy(shape),before:W.encode(S.doc)};sync();return true;}}}}
   for(const h of handles()){if(h.kind==='center')continue;if(Math.hypot(h.p[0]-p[0],h.p[1]-p[1])<10/S.view.zoom){const b=W.bounds(paths()),center=[b.x+b.w/2,b.y+b.h/2];drag={kind:h.kind,p,handle:h.p,b,center,bases:[...S.selected].map(i=>[i,B.copy(S.doc.paths[i])]),before:W.encode(S.doc)};return true;}}
   return false;
  }
  function pointerMove(e,p){if(!drag)return false;run(()=>{const d=drag;if(d.kind==='pen'){const n=pen.nodes[d.index],v=[p[0]-n.p[0],p[1]-n.p[1]];n.mode=e.altKey?'corner':'symmetric';n.o=v;n.i=e.altKey?[0,0]:[-v[0],-v[1]];}
    if(d.kind==='node'){const q=B.copy(d.base),n=q.bezier[d.node];if(d.which==='p')n.p=[snap(p[0]),snap(p[1])];else B.handle(n,d.which,[p[0]-n.p[0],p[1]-n.p[1]],e.altKey);delete q.arc;B.rebuild(q);S.doc.paths[d.index]=q;}
    if(d.kind==='rotate'||d.kind==='resize'){let op={origin:d.center};if(d.kind==='rotate'){let a=Math.atan2(p[1]-d.center[1],p[0]-d.center[0])-Math.atan2(d.p[1]-d.center[1],d.p[0]-d.center[0]);if(e.shiftKey)a=Math.round(a/(Math.PI/12))*Math.PI/12;op.angle=a;}else{const baseX=d.handle[0]-d.center[0],baseY=d.handle[1]-d.center[1];op.sx=Math.max(.08,Math.min(8,(p[0]-d.center[0])/(baseX||1)));op.sy=Math.max(.08,Math.min(8,(p[1]-d.center[1])/(baseY||1)));if(e.shiftKey)op.sy=op.sx;}for(const [i,b] of d.bases)S.doc.paths[i]=W.transform(B.copy(b),op);}
   });S.dirtyFrame=true;return true;}
  function pointerEnd(cancel=false){if(!drag)return false;const d=drag;drag=null;if(cancel&&d.before)S.doc=W.decode(d.before);if(d.kind!=='pen')commit(cancel?'Gesture canceled.':'Curve gesture applied.');else S.dirtyFrame=true;return true;}
  function draw(){if(!S.doc)return;const z=S.view.zoom,a=paths();ctx.save();ctx.lineWidth=1/z;
   if(a.length&&S.tool==='select'){const b=W.bounds(a);ctx.strokeStyle='#89dace88';ctx.setLineDash([5/z,4/z]);ctx.strokeRect(b.x-6/z,b.y-6/z,b.w+12/z,b.h+12/z);ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(b.x+b.w/2,b.y-6/z);ctx.lineTo(b.x+b.w/2,b.y-30/z);ctx.stroke();for(const h of handles()){if(h.kind==='center')continue;ctx.fillStyle=h.kind==='rotate'?'#ffd18a':'#e3faff';ctx.strokeStyle='#163c50';ctx.beginPath();if(h.kind==='rotate')ctx.arc(...h.p,7/z,0,7);else ctx.rect(h.p[0]-5/z,h.p[1]-5/z,10/z,10/z);ctx.fill();ctx.stroke();}}
   function nodes(ns){ns.forEach((n,i)=>{for(const key of ['i','o']){const h=[n.p[0]+n[key][0],n.p[1]+n[key][1]];ctx.strokeStyle=key==='i'?'#efb8a7':'#7fe1f1';ctx.beginPath();ctx.moveTo(...n.p);ctx.lineTo(...h);ctx.stroke();if(Math.hypot(...n[key])>.01){ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(...h,4/z,0,7);ctx.fill();}}ctx.fillStyle=i===selectedAnchor?'#ffd178':'#b2f7e5';ctx.fillRect(n.p[0]-4/z,n.p[1]-4/z,8/z,8/z);});}
   if(S.handles&&one()?.bezier)nodes(one().bezier);
   if(pen?.nodes.length){if(pen.nodes.length>1){const pts=B.sample(pen.nodes);ctx.strokeStyle='#f4cf90';ctx.lineWidth=3/z;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}nodes(pen.nodes);}ctx.restore();
  }
  canvas.addEventListener('dblclick',()=>{if(pen)finishPen();});
  host.addEventListener('click',()=>{queueMicrotask(sync);});
  window.addEventListener('blur',()=>pointerEnd(true));
  return {pointerDown,pointerMove,pointerEnd,draw,sync,handles,get pen(){return pen},cancelPen(){pen=null;drag=null;S.tool='select';refresh();},finishPen};
 }};
})(globalThis);
