/* The authored opening and bounded, discovery-limited AR Architect's Table.
 * Inspection is not a second simulation, physical surface anchor or room scan.
 */
(function(root){'use strict';
 function install(g){
  const T=g.T,C=VesperCore,M=ReturningBellModel,L=ReturningBellLanes,ui=g.dominionControls,$=id=>document.getElementById(id);
  const objective=s=>L.isWorld(s.world)?L.objective(s):M.objective(s);
  const snapshot=s=>s?.pilgrimage?{layout:s.world.generator,seed:s.world.seed,depth:s.world.depth,pilgrimage:JSON.parse(JSON.stringify(s.pilgrimage)),discovered:[...s.discovered],count:s.world.rooms.length}:({...M.survey(s),count:7,layout:s?.world.returningBell?s.world.generator:L.ID});
  const state={table:false,pending:false,layer:0,survey:null,tableBuilds:0,seen:null,event:0,mechanism:''};let table=null;
  const button=document.createElement('button');button.id='architect-table';button.textContent="AR Architect's Table / discovered places";button.disabled=true;$('menu-ar').after(button);
  const note=document.createElement('p');note.id='returning-intro';note.textContent='The Returning Bell is the authored opening. Restore the tower signal, learn its interlocking routes, and find your way back. Older expeditions still continue in their original world.';$('first-bell-menu').before(note);
  const style=document.createElement('style');style.textContent='#returning-intro{color:#c1d4cc;max-width:60ch;line-height:1.5;border-left:2px solid #b89e70;padding-left:12px}#architect-table{white-space:normal}';document.head.append(style);
  if(navigator.xr&&isSecureContext)navigator.xr.isSessionSupported('immersive-ar').then(ok=>button.disabled=!ok).catch(()=>{});
  function clearTable(){if(!table)return;table.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose();}});table.removeFromParent();table=null;}
  function positionTable(){if(!table)return;const p=g.head.object3D.getWorldPosition(new T.Vector3()),q=g.head.object3D.getWorldQuaternion(new T.Quaternion()),f=new T.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.length()<.01)f.set(0,0,-1);f.normalize();const right=new T.Vector3(-f.z,0,f.x);table.position.copy(p).addScaledVector(f,1.8).addScaledVector(right,0);table.position.y=Math.max(.35,p.y-.48);table.rotation.y=Math.atan2(-f.x,-f.z);}
  function buildTable(){clearTable();const survey=state.survey||snapshot(null),known=new Set(survey.discovered),s=survey.pilgrimage?C.create(survey.seed,survey.depth,{pilgrimage:{stage:survey.pilgrimage.stage,tier:survey.pilgrimage.tier}}):C.create('TABLE',1,{returningBell:survey.layout});if(survey.pilgrimage)PilgrimageModel.restore(s,survey.pilgrimage);else{M.restore(s,survey.chapter);L.apply(s);}table=new T.Group();table.name='Architects Table / discovered geometry';table.userData.discovered=[...known];table.userData.layer=state.layer;state.tableBuilds++;
   const model=new T.Group();const span=survey.pilgrimage?Math.max(52,...s.world.floors.map(f=>Math.abs(f.z)+f.d/2))+26:49;model.scale.setScalar(survey.pilgrimage?1.2/span:.028);model.position.set(0,.035,survey.pilgrimage?.22:.08);model.userData.layout=s.world.generator;table.userData.layout=s.world.generator;table.add(model);
   const mats={floor:new T.MeshStandardMaterial({color:'#bfaf8c',roughness:.85}),upper:new T.MeshStandardMaterial({color:'#a5d3d0',roughness:.65}),wall:new T.MeshStandardMaterial({color:'#7b8c90',roughness:.85}),signal:new T.MeshBasicMaterial({color:'#efd69c'}),base:new T.MeshStandardMaterial({color:'#253740',roughness:.8})};
   function cube(parent,mat,x,y,z,w,h,d){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat.clone());m.position.set(x,y,z);parent.add(m);return m;}
   for(const f of s.world.floors){if(!known.has(f.region))continue;const upper=f.y>1||f.type==='stair';if(state.layer===1&&upper||state.layer===2&&!upper)continue;
    if(f.type==='stair'){for(let i=0;i<20;i++){const z=f.z-f.d/2+(i+.5)*f.d/20,y=f.y+f.slopeZ*(z-f.anchorZ);cube(model,mats.upper,f.x,y-.05,z,f.w,.1,f.d/20);}}
    else cube(model,upper?mats.upper:mats.floor,f.x,f.y-.05,f.z,f.w,.1,f.d);
   }
   if(state.layer!==2)for(const b of s.world.solids){if(!known.has(b.region)||['stair-base','gallery-deck','roof'].includes(b.type))continue;const p=b.min.map((v,i)=>(v+b.max[i])/2),d=b.max.map((v,i)=>v-b.min[i]);cube(model,b.type==='screen'||b.type==='return-gate'?mats.signal:mats.wall,...p,...d);}
   cube(table,mats.base,.07,0,-.24,1.26,.045,1.38);
   const label=g.art.label(table,'DISCOVERED PLACES / '+known.size+' OF '+survey.count,.07,.026,.46,1.05,.12,'#253740','#f1dfb2');label.rotation.x=-Math.PI/2;
   for(const m of Object.values(mats))m.dispose();g.scene.object3D.add(table);positionTable();
  }
  function openTable(){if(!g.arMode)return false;state.table=true;state.layer=0;g.setPaused(true);buildTable();ui.setScreen('architect');g.placePanel();return true;}
  function closeTable(){state.table=false;clearTable();g.worldArt.group.visible=true;g.entities.visible=true;}
  const pause=g.setPaused.bind(g);g.setPaused=value=>pause(state.table?true:value);
  const enter=g.enterXR.bind(g);g.enterXR=function(){const survey=snapshot(g.game);enter();if(g.arMode){state.survey=survey;if(state.pending)openTable();}state.pending=false;};
  const exit=g.exitXR.bind(g);g.exitXR=function(){closeTable();state.pending=false;exit();};
  for(const name of['start','startTraining']){const old=g[name].bind(g);g[name]=function(...args){closeTable();return old(...args);};}
  const start=g.start.bind(g);g.start=function(practice){start(practice);if(g.game.chapter&&g.running&&!g.paused)g.toast(objective(g.game));};
  const place=g.placePanel.bind(g);g.placePanel=function(){place();if(state.table){const q=g.head.object3D.getWorldQuaternion(new T.Quaternion());g.xrPanel.mesh.position.add(new T.Vector3(0,.38,-.5).applyQuaternion(q));}};
  button.onclick=async()=>{state.pending=true;await ui.requestMode('ar');if(!g.xr)state.pending=false;};
  function pages(items,back='equipment'){const n=Math.max(1,Math.ceil(items.length/4));ui.state.xrPage%=n;return [...items.slice(ui.state.xrPage*4,ui.state.xrPage*4+4),['More / page '+(ui.state.xrPage+1)+' of '+n,()=>{ui.state.xrPage=(ui.state.xrPage+1)%n;}],['Back',()=>ui.setScreen(back)]];}
  function menuRows(screen){
   if(g.arMode&&(screen==='architect'||state.table&&screen==='main'))return [
    ['Layers: '+['all known structure','ground circulation','upper walks'][state.layer],()=>{state.layer=(state.layer+1)%3;buildTable();}],
    ['Recenter the virtual table',()=>{positionTable();g.placePanel();}],
    ['Known places: '+(state.survey?.discovered.length||1)+' / '+(state.survey?.count||7),()=>{ui.state.notice='Only regions already visited in your expedition are shown. The table is unscored and cannot change your progress, doors or enemies. It is not attached to a detected physical surface. Stay in your clear play space.';ui.setScreen('notice');}],
    ['Settings / handedness / comfort',()=>ui.setScreen('settings')],
    ['Back to AR Sanctuary',()=>{closeTable();g.setPaused(true);ui.setScreen('main');}],
    ['Exit AR and restore expedition',()=>g.scene.exitVR()]
   ];
   if(g.game.chapter&&screen==='objectives')return [[objective(g.game),()=>{}],['Observe the court before committing',()=>{}],['Ground, gallery and Blink approaches reconnect',()=>{}],['The winch reverses; the return gate stays open',()=>{}],['No kill-all or special-ammo requirement',()=>{}],['Back',()=>ui.setScreen('expedition')]];
   if(g.game.chapter&&screen==='atlas')return pages(g.game.world.rooms.filter(r=>g.game.discovered.has(r.id)).map(r=>[r.label,()=>{ui.state.notice=r.label+'. Known connections: '+g.game.world.links[r.id].filter(id=>g.game.discovered.has(id)).map(id=>g.game.world.rooms[id].label).join(', ');ui.setScreen('notice');}]));
   return null;
  }
  function atlas(){const canvas=$('map');if(canvas.hidden)return;const ctx=canvas.getContext('2d'),s=g.game;ctx.fillStyle='#152b35';ctx.fillRect(0,0,240,220);ctx.fillStyle='#ead1a3';ctx.font='bold 11px system-ui';ctx.fillText('RETURNING BELL / KNOWN PLACES',9,19);
   const px=x=>107+x*4.2,pz=z=>75+(z+10)*3.7;for(const f of s.world.floors){if(!s.discovered.has(f.region))continue;ctx.fillStyle=f.y>1||f.type==='stair'?'#caaf76':'#5e8785';ctx.fillRect(px(f.x-f.w/2),pz(f.z-f.d/2),f.w*4.2,f.d*3.7);}
   ctx.fillStyle='#fff3d5';ctx.beginPath();ctx.arc(px(s.p[0]),pz(s.p[2]),3.6,0,7);ctx.fill();ctx.fillStyle='#fff4ce';ctx.font='10px system-ui';ctx.fillText('Visited '+s.discovered.size+' / 7. Unknown routes hidden.',9,206);
  }
  const menuUI=g.menuUI.bind(g);g.menuUI=function(){menuUI();note.hidden=g.arMode;if(!g.game.chapter)return;
   $('menu-eyebrow').textContent='THE RETURNING BELL / AUTHORED OPENING';
   $('menu-message').textContent=g.game.phase==='reward'?'The signal is restored. Choose a blessing to continue into the retained Endless cloisters. The next authored chapter is not yet built.':objective(g.game)+' The west stairs offer an overlooking route; the lower ambulatory offers another approach.';
   if(!g.running)$('menu-title').textContent='Learn the place. Find your way home.';
   if($('expedition-mode')?.value==='returning-bell')$('start').textContent='Begin The Returning Bell';
  };
  const draw=g.drawMenu.bind(g);g.drawMenu=function(){draw();if(!g.xrPanel||(!g.game.chapter&&!state.table))return;const {ctx,texture}=g.xrPanel;ctx.fillStyle='#142230';ctx.fillRect(25,20,974,82);ctx.fillStyle='#eee0bf';ctx.font='39px Georgia';ctx.textAlign='center';ctx.fillText(state.table?"VESPERFALL / ARCHITECT'S TABLE":'VESPERFALL / THE RETURNING BELL',512,78,932);texture.needsUpdate=true;};
  const hud=g.hud.bind(g);g.hud=function(){hud();if(!g.game.chapter)return;const s=g.game,action=M.available(s,C),text=action?M.controls[action].label:objective(s);
   $('chapter').textContent='THE RETURNING BELL';$('objective').textContent=text;$('tally').textContent=(s.chapter.gateOpen?'Return gate open':'Return gate barred')+' / '+s.discovered.size+' places known';$('district-readout').textContent=s.world.rooms[C.roomAt(s.world,s.p)].label+' / '+(s.p[1]>2?'UPPER WALK':'GROUND');
   if(g.xr){const {ctx,texture}=g.xrHud;ctx.fillStyle='#172638';ctx.fillRect(0,64,1024,85);ctx.fillStyle='#d9e8dc';ctx.textAlign='center';ctx.font='25px Arial';ctx.fillText(text,512,98,965);ctx.font='19px Arial';ctx.fillText(action?(g.goldwind?.enabled()?'Configured bow-hand interaction / draw-stick click: menu.':'Bow-hand lower button: interact. Menus: upper button.'):'Physical archery / shield / Blink. Explore and return.',512,133,970);texture.needsUpdate=true;}
  };
  const visuals=g.visuals.bind(g);g.visuals=function(){visuals();const s=g.game;if(s!==state.seen){state.seen=s;state.event=0;state.mechanism='';}
   if(s.chapter){const art=g.worldArt.returningBell,key=[s.chapter.gateOpen,s.chapter.screensRaised].join('/');
    if(art){art.dynamic.screen.position.y=s.chapter.screensRaised?4.8:0;const gate=art.dynamic['return-gate'];if(gate)gate.visible=!s.chapter.gateOpen;art.winch.rotation.z=s.chapter.screensRaised?Math.PI/2:0;art.bell.rotation.z=s.chapter.bellRung?Math.sin(s.time*2)*.06:0;
     if(key!==state.mechanism){state.mechanism=key;g.scene.renderer.shadowMap.needsUpdate=true;}}
    $('expedition-progress').textContent='Signal '+(s.chapter.bellRung?'restored':'silent')+' / screens '+(s.chapter.screensRaised?'raised':'lowered')+' / '+s.discovered.size+' of 7 places discovered';
    for(const e of s.events)if(e.seq>state.event&&e.type.startsWith('returning-')){g.toast(e.text);if(e.type==='returning-bell'){g.sound(220,1.8,.07);g.sound(440,1.3,.04);}else if(e.type==='returning-shortcut')g.sound(330,.7,.055);else g.sound(145,.2,.03);}
   }
   state.event=s.eventSeq||0;
   if(state.table&&g.arMode){g.worldArt.group.visible=false;g.entities.visible=false;g.bowHolder.visible=false;g.xrHud.mesh.visible=false;g.teleLine.visible=g.teleRing.visible=false;if(table)table.visible=true;}
  };
  const remove=g.remove.bind(g);g.remove=function(){clearTable();button.remove();note.remove();style.remove();remove();};
  const api={state,menuRows,atlas,openTable,closeTable,get table(){return table;}};g.returningBell=api;g.menuUI();return api;
 }
 root.ReturningBell=Object.freeze({install});
})(globalThis);
