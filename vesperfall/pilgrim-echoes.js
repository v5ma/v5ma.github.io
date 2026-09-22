/* Floor-level transient feedback and optional story objects; installs after the
 * maintained A-Frame component, never by rewriting its source or save state. */
(function(root){'use strict';
 function install(g){if(g.echoes)return g.echoes;const T=g.T,C=VesperCore,M=PilgrimEchoesModel,ui=g.dominionControls,KEY='vesperfall-stories-v1',$=id=>document.getElementById(id);
  let found=[];try{found=M.clean(JSON.parse(localStorage.getItem(KEY)||'[]'));}catch{}
  const state={found,game:null,event:0,shownAt:-Infinity,text:'',held:null,source:null,index:1,sequence:0,page:0};
  const floor=g.makePanel(1024,256,1.65,.4125);floor.mesh.name='Two-second floor messages';floor.mesh.material.depthTest=false;floor.mesh.material.depthWrite=false;floor.mesh.material.transparent=true;floor.mesh.renderOrder=998;floor.mesh.visible=false;g.scene.object3D.add(floor.mesh);
  const objects=new T.Group();objects.name='The Last Lantern / readable dispatches';g.scene.object3D.add(objects);const resources=[];
  const style=document.createElement('style');style.textContent='#toast{opacity:0!important;pointer-events:none}';document.head.append(style);
  const oldToast=g.toast.bind(g);
  function show(text){text=String(text||'');if(state.text===text&&performance.now()-state.shownAt<300)return;
   clearTimeout(g.toastTimer);$('toast').textContent=text;$('toast').style.opacity='0';state.text=text;state.shownAt=performance.now();state.sequence++;
   const ctx=floor.ctx;ctx.clearRect(0,0,1024,256);ctx.fillStyle='rgba(14,29,37,.78)';ctx.fillRect(10,10,1004,236);ctx.strokeStyle='#baac88';ctx.strokeRect(10,10,1004,236);ctx.fillStyle='#f7edce';ctx.font='32px Arial';ctx.textAlign='center';
   const words=text.split(/\s+/),lines=[];let line='';for(const word of words){const next=(line?line+' ':'')+word;if(ctx.measureText(next).width>950&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
   lines.slice(0,4).forEach((v,i)=>ctx.fillText(v,512,65+i*46,950));floor.texture.needsUpdate=true;
   const eye=g.head.object3D.getWorldPosition(new T.Vector3()),forward=new T.Vector3(0,0,-1).applyQuaternion(g.head.object3D.getWorldQuaternion(new T.Quaternion()));forward.y=0;if(forward.lengthSq()<.01)forward.set(0,0,-1);forward.normalize();
   const p=eye.clone().addScaledVector(forward,.95);p.y=g.game.p[1];const y=C.floorAt(g.game.world,p.toArray());p.y=(y!==null&&Math.abs(y-g.game.p[1])<.5?y:g.game.p[1])+.055;
   floor.mesh.position.copy(p);floor.mesh.quaternion.setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(-forward.x,-forward.z));floor.mesh.quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));
  }
  g.toast=show;
  const setType=g.setType.bind(g);g.setType=function(type){setType(type);if(type==='blink')show('Golden arrows: safe floors, rail tops, or footing beside the wall you hit.');};
  function live(){return g.running&&!g.paused&&g.game.phase==='playing'&&!g.arMode&&!g.practice&&!g.returningBell?.state.table&&g.threshold?.state.phase==='game';}
  function current(){return live()&&!g.wayfinder.current()&&!g.fieldKit?.viewTarget()?M.current(g.game,C):null;}
  function read(n){if(!n)return false;if(!state.found.includes(n.id)){state.found.push(n.id);try{localStorage.setItem(KEY,JSON.stringify(state.found));}catch{}}
   C.emit(g.game,'story-read',{id:n.id,title:n.title});show(n.short);return true;}
  const interact=g.interact.bind(g);g.interact=function(){const n=current();if(n){read(n);return;}return interact();};
  function clear(){state.held=state.source=null;floor.mesh.visible=false;state.shownAt=-Infinity;}
  const cancel=g.cancel.bind(g);g.cancel=function(){state.held=state.source=null;cancel();};
  const pause=g.setPaused.bind(g);g.setPaused=function(...args){clear();return pause(...args);};
  const input=g.wayfinder.input;g.wayfinder.input=function(dt,head,bow,hand,buttons,edge){
   if(!live()){state.held=state.source=null;return input(dt,head,bow,hand,buttons,edge);}
   if(state.held){const h=state.held==='bow'?bow:hand;if(h.source!==state.source||!buttons[state.held][state.index]){state.held=state.source=null;g.goldwind.gesture.reset();return false;}return true;}
   if(g.latch.drawing||g.goldwind.state.quiver||g.goldwind.gesture.held||g.goldwind.state.flight||g.fieldwork.state.held||g.ritual.state.pull)return input(dt,head,bow,hand,buttons,edge);
   const n=current(),bi=$('goldwind-shield').value==='grip'?0:1;if(!n)return input(dt,head,bow,hand,buttons,edge);
   const point=[n.p[0],n.p[1]+.6,n.p[2]],dir=new T.Vector3(0,0,-1).applyQuaternion(hand.q).toArray(),delta=C.sub(point,hand.p),aim=C.len(delta)<.65||C.dot(C.unit(delta),dir)>.90;
   const owner=edge('bow',bi)?'bow':edge('draw',1)&&aim&&!C.segmentBlocked(g.game.world,hand.p,point,.02)?'draw':null;
   if(!owner)return input(dt,head,bow,hand,buttons,edge);
   read(n);state.held=owner;state.index=owner==='bow'?bi:1;state.source=(owner==='bow'?bow:hand).source;g.goldwind.gesture.reset();return true;
  };
  function build(){for(const r of resources)r?.dispose?.();resources.length=0;objects.clear();for(const n of M.anchors(g.game)){
   const group=new T.Group();group.name=n.id;group.position.set(...n.p);objects.add(group);
   const geo=new T.BoxGeometry(.40,.12,.28),mat=new T.MeshStandardMaterial({color:'#b69c6d',roughness:.85}),book=new T.Mesh(geo,mat);book.position.y=.20;group.add(book);resources.push(geo,mat);
   const label=g.art.label(group,'READ / '+n.title,0,.44,0,1.1,.10,'#172e38','#f0deab');label.name='Readable story affordance';
   label.traverse(o=>{if(o.geometry)resources.push(o.geometry);if(o.material){resources.push(o.material.map,o.material);}});
  }}
  function openJournal(){g.setPaused(true);state.page=0;if(g.xr){ui.setScreen('stories');g.placePanel();}else ui.notice('THE LAST LANTERN. '+(state.found.length?state.found.map(id=>{const n=M.NOTES.find(n=>n.id===id);return n.title+': '+n.text;}).join('\n\n'):'Read dispatches beside the shelter, rest passage and far beacon. Restore the lanterns to follow the missing pilgrims.'));}
  const btn=document.createElement('button');btn.id='story-journal';btn.textContent='Story journal / The Last Lantern';btn.onclick=openJournal;$('journal-button').after(btn);
  const drawMenu=g.drawMenu.bind(g);g.drawMenu=function(){const selected=g.menuSelection;drawMenu();if(!g.xrPanel||g.threshold?.state.phase!=='game')return;
   let list=null;if(ui.state.xrScreen==='main'&&g.xrMenuRows.length===6){list=g.xrMenuRows.map(r=>[...r]);list[4]=['Story journal / Controller manual',()=>{state.page=0;ui.setScreen('stories');}];}
   if(ui.state.xrScreen==='stories'){const known=M.NOTES.filter(n=>state.found.includes(n.id)),pages=Math.max(1,Math.ceil(known.length/3));state.page%=pages;
    list=known.slice(state.page*3,state.page*3+3).map(n=>[n.title,()=>ui.notice(n.title+'. '+n.text)]);
    if(!known.length)list.push(['Find dispatches beside the shelter and refuges',()=>ui.notice('The Last Lantern: restore the Causeway signals and recover the missing pilgrims\' route through the Ashen Archive. Read a dispatch with grip, E, or Xbox A. Notes remain in this journal. No extra kills are required.')]);
    list.push(['More notes / '+(state.page+1)+' of '+pages,()=>{state.page=(state.page+1)%pages;g.drawMenu();}],['Controller manual / bestiary',()=>ui.setScreen('manual')],['Back to expedition',()=>ui.setScreen('main')]);
   }if(!list)return;
   const {ctx,texture}=g.xrPanel;ctx.fillStyle='#142230';ctx.fillRect(70,190,884,457);g.xrMenuRows=list;g.menuSelection=Math.max(0,Math.min(selected,list.length-1));list.forEach(([text],i)=>{ctx.fillStyle=i===g.menuSelection?'#486971':'#283e50';ctx.fillRect(95,195+i*75,834,61);ctx.fillStyle='#f7eed8';ctx.textAlign='center';ctx.font='27px Arial';ctx.fillText(text,512,235+i*75,800);});texture.needsUpdate=true;
  };
  const visuals=g.visuals.bind(g);g.visuals=function(){
   if(state.game!==g.game){state.game=g.game;state.event=g.game.eventSeq||0;clear();build();}
   visuals();
   for(const e of g.game.events)if(e.seq>state.event){if(e.type==='blink-denied')show('No safe landing: '+(e.reason||'clear the edge or wall')+'.');if(e.type==='target'&&g.game.pilgrimage)show(g.game.targets.size===g.game.world.targets.length?'Both signals restored. The far beacon is ready.':'A relay answers. The next signal marks the pilgrims\' route.');}
   state.event=g.game.eventSeq||0;
   const alpha=M.opacity(performance.now()-state.shownAt);floor.mesh.visible=g.running&&!g.paused&&alpha>0&&g.threshold?.state.phase==='game';floor.mesh.material.opacity=alpha;
   objects.visible=g.running&&!g.arMode&&!g.returningBell?.state.table&&g.threshold?.state.phase==='game';
   if(performance.now()<g.fieldwork.state.messageUntil)g.fieldwork.label.mesh.visible=false;
   // Keep actionable object labels, but confirmed actions go to the floor,
   // never another floating notification in the forward view.
   if(g.wayfinder.state.message&&performance.now()<g.wayfinder.state.until){if(state.lastWayfinderUntil!==g.wayfinder.state.until){state.lastWayfinderUntil=g.wayfinder.state.until;show(g.wayfinder.state.message);}g.wayfinder.panel.mesh.visible=false;}
  };
  for(const name of ['start','choose']){const prior=g[name].bind(g);g[name]=function(...args){const out=prior(...args);state.game=g.game;state.event=g.game.eventSeq||0;clear();build();if(g.game.pilgrimage)show(g.game.pilgrimage.stage?"The Archive hides the missing pilgrims' route. Read the archivist's seal.":"Restore the lanterns. Ilyra's dispatch is beside the shelter.");return out;};}
  const remove=g.remove.bind(g);g.remove=function(){for(const r of resources)r?.dispose?.();floor.mesh.geometry.dispose();floor.mesh.material.dispose();floor.texture.dispose();floor.mesh.removeFromParent();objects.removeFromParent();btn.remove();style.remove();g.toast=oldToast;remove();};
  const api={state,floor,objects,current,read,openJournal};g.echoes=api;return api;
 }
 function connect(){const s=document.querySelector('a-scene');if(!s)return;const ready=e=>{if(!e||e.detail?.name==='vesper-game'){const g=s.components?.['vesper-game'];if(g?.threshold)install(g);}};s.addEventListener('componentinitialized',ready);ready();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connect,{once:true});else connect();
 root.PilgrimEchoes=Object.freeze({install});
})(globalThis);
