/* Vesperfall-only scene desk and walking round trip. No external hub, remote
 * endpoint, private asset, new level identity or game-state serialization. */
(function(root){'use strict';
 function install(g){
  const T=g.T,M=VesperThresholdModel,ui=g.dominionControls,$=id=>document.getElementById(id),KEY='vesperfall-spatial-desk-v1';
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
  const state={settings:M.settings(saved),phase:'game',walking:false,frames:0,crossings:0,previous:{},moveReady:false,hidden:new Map(),snapshot:null,ending:false};
  const crossing=new M.Crossing(),desk=new T.Group(),stage=new T.Group(),door=new T.Group();
  desk.name='Vesperfall floor desk';stage.name='Vesperfall local travel foyer';door.name='Walking doorway / no external destination';
  g.scene.object3D.add(desk,stage);stage.add(door);desk.visible=stage.visible=false;
  const resources=[],mesh=(geo,color,parent)=>{const mat=new T.MeshBasicMaterial({color});const o=new T.Mesh(geo,mat);parent.add(o);resources.push(geo,mat);return o;};
  const plinth=mesh(new T.CylinderGeometry(.52,.60,.035,32),'#344955',desk);plinth.position.y=.018;
  const stem=mesh(new T.CylinderGeometry(.04,.09,1,12),'#ab9161',desk);
  const rim=mesh(new T.TorusGeometry(.51,.012,6,32),'#dec596',desk);rim.rotation.x=-Math.PI/2;rim.position.y=.043;
  const rows=[];
  for(let i=0;i<6;i++){
   const o=mesh(new T.BoxGeometry(1.285,.099,.035),'#395567',desk);o.name='Raised spatial button '+i;rows.push(o);
  }
  const floor=mesh(new T.CylinderGeometry(3.4,3.4,.025,48),'#253844',stage);floor.position.y=-.03;
  for(const x of[-.77,.77]){const p=mesh(new T.BoxGeometry(.13,2.55,.18),'#b59b69',door);p.position.set(x,1.275,0);}
  const lintel=mesh(new T.BoxGeometry(1.67,.15,.18),'#d9c298',door);lintel.position.y=2.53;
  const sill=mesh(new T.BoxGeometry(1.4,.013,.4),'#83baa8',door);sill.position.y=.008;
  const veil=mesh(new T.PlaneGeometry(1.4,2.45),'#739d96',door);veil.position.set(0,1.25,-.05);veil.material.side=T.DoubleSide;veil.material.transparent=true;veil.material.opacity=.22;veil.material.depthWrite=false;
  const sign=g.makePanel(768,192,1.65,.413);sign.mesh.position.set(0,1.85,0);door.add(sign.mesh);
  const frame=new T.Group();frame.name='Spatial menu pose';g.scene.object3D.add(frame);
  const panel=g.xrPanel.mesh;
  function screen(name){ui.setScreen(name);g.placePanel();}
  function persist(){state.settings=M.settings(state.settings);try{localStorage.setItem(KEY,JSON.stringify(state.settings));}catch{g.toast('Desk settings are temporary: browser storage is unavailable.');}g.placePanel();}
  function cycle(key,values){const i=values.findIndex(v=>Math.abs(v-state.settings[key])<.01);state.settings[key]=values[(i+1)%values.length];persist();}
  function drawSign(){const {ctx,texture}=sign;ctx.fillStyle='#142230';ctx.fillRect(0,0,768,192);ctx.textAlign='center';ctx.fillStyle='#f3ddb2';ctx.font='36px Georgia';ctx.fillText(state.phase==='outbound'?'VESPERFALL / TRAVEL FOYER':'RETURN TO YOUR EXPEDITION',384,52,720);ctx.font='22px Arial';ctx.fillStyle='#cee4dc';ctx.fillText('Walk through, or use the left stick.',384,98,710);ctx.fillText('Right stick click: menu / seated alternative',384,132,710);ctx.font='18px Arial';ctx.fillText('Virtual doorway only. Stay inside your clear real play space.',384,167,710);texture.needsUpdate=true;}
  function poseDoor(){
   const h=g.head.object3D.getWorldPosition(new T.Vector3()),q=g.head.object3D.getWorldQuaternion(new T.Quaternion()),f=new T.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.lengthSq()<.01)f.set(0,0,-1);f.normalize();
   stage.position.set(h.x,g.rig.position.y,h.z);stage.rotation.set(0,Math.atan2(-f.x,-f.z),0);door.position.set(0,0,-1.25);stage.updateMatrixWorld(true);crossing.reset();state.moveReady=false;state.previous={};drawSign();
  }
  function begin(){
   if(!g.xr||!g.checkpoint.eligible||g.game.phase!=='playing'||g.returningBell.state.table){ui.notice('Start or resume a scored expedition in VR or AR expedition before opening its return doorway. Sanctuary, inspection and training stay separate.');return;}
   g.setPaused(true);if(!g.checkpoint.flush(true)){ui.notice('The doorway stays closed because the expedition could not be saved. Retry saving or return to play.');return;}
   state.snapshot={position:g.rig.position.clone(),quaternion:g.rig.quaternion.clone(),background:g.scene.object3D.background,fog:g.scene.object3D.fog};
   state.phase='outbound';state.walking=true;stage.visible=true;poseDoor();panel.visible=false;desk.visible=false;g.pendingPanel=false;
  }
  function restore(){
   if(state.phase==='game')return;
   const snap=state.snapshot;state.phase='game';state.walking=false;stage.visible=false;crossing.reset();
   for(const [o,visible]of state.hidden)o.visible=visible;state.hidden.clear();
   if(snap){g.rig.quaternion.copy(snap.quaternion);const local=g.head.object3D.position.clone().applyQuaternion(g.rig.quaternion);g.rig.position.set(g.game.p[0]-local.x,g.game.p[1],g.game.p[2]-local.z);g.scene.object3D.background=snap.background;g.scene.object3D.fog=snap.fog;}
   state.snapshot=null;g.cancel();ui.state.xrNeutral=false;g.goldwind.reset();g.scene.object3D.updateMatrixWorld(true);
  }
  function enterFoyer(){state.phase='foyer';state.walking=false;crossing.reset();drawSign();screen('foyer');}
  function returnNow(){restore();g.setPaused(true);screen('main');g.toast('Your expedition is unchanged. Resume when ready.');}
  function openReturn(){state.phase='returning';state.walking=true;poseDoor();g.cancel();panel.visible=false;desk.visible=false;}
  async function exit(){
   if(state.ending)return;state.ending=true;restore();g.setPaused(true);
   const session=g.scene.renderer.xr.getSession();
   try{if(session)await session.end();else await g.scene.exitVR();}
   catch(e){ui.notice('Immersive exit did not complete. Retry Exit XR. '+e.message);}
   finally{state.ending=false;}
  }
  const oldPlace=g.placePanel.bind(g);g.placePanel=function(){
   if(!g.xr||g.returningBell?.state.table){desk.visible=false;oldPlace();return;}
   if(state.walking){panel.visible=false;desk.visible=false;return;}
   const s=state.settings,p=g.head.object3D.getWorldPosition(new T.Vector3()),q=g.head.object3D.getWorldQuaternion(new T.Quaternion()),f=new T.Vector3(0,0,-1).applyQuaternion(q);f.y=0;if(f.lengthSq()<.01)f.set(0,0,-1);f.normalize();f.applyAxisAngle(new T.Vector3(0,1,0),s.angle);
   frame.position.copy(p).addScaledVector(f,s.distance);frame.position.y=g.rig.position.y;frame.rotation.set(0,Math.atan2(-f.x,-f.z),0);frame.updateMatrixWorld(true);
   desk.position.copy(frame.position);desk.quaternion.copy(frame.quaternion);desk.scale.setScalar(1);stem.scale.y=Math.max(.2,s.height-.65*s.scale);stem.position.y=stem.scale.y/2;
   panel.position.copy(frame.position);panel.position.y+=s.height;panel.quaternion.copy(frame.quaternion);panel.scale.setScalar(s.scale);panel.visible=true;desk.visible=true;
   for(let i=0;i<6;i++){rows[i].position.set(0,s.height+(.5-(195+i*75+30.5)/768)*1.16*s.scale,-.026);rows[i].scale.set(s.scale,s.scale,1);}
   g.drawMenu();
  };
  function customRows(){
   if(state.phase!=='game'&&!state.walking&&ui.state.xrScreen!=='notice')return [
    ['Open return walking doorway',openReturn],['Return now / seated alternative',returnNow],['Desk height: '+state.settings.height.toFixed(2)+' m',()=>cycle('height',[.75,.95,1.15,1.35,1.55])],['Recenter the desk',()=>g.placePanel()],['Local Vesperfall foyer / connection information',()=>{ui.state.notice='This is Vesperfall\'s local travel foyer. No private hub or other game is loaded. Your expedition is paused and saved. The private launcher will require its own approved integration.';screen('notice');}],['Exit XR to browser',exit]
   ];
   if(ui.state.xrScreen==='spatial')return [
    ['Open walking doorway / save first',begin],['Desk height: '+state.settings.height.toFixed(2)+' m',()=>cycle('height',[.75,.95,1.15,1.35,1.55])],['Panel size: '+Math.round(state.settings.scale*100)+'%',()=>cycle('scale',[.75,.9,1,1.1,1.25])],['Move / turn / recenter',()=>screen('spatial-position')],['Controller manual',()=>screen('manual')],['Back to expedition menu',()=>screen('main')]
   ];
   if(ui.state.xrScreen==='spatial-position')return [
    ['Distance: '+state.settings.distance.toFixed(1)+' m',()=>cycle('distance',[1.2,1.5,1.8,2.1,2.4])],['Move desk left',()=>{state.settings.angle-=.15;persist();}],['Move desk right',()=>{state.settings.angle+=.15;persist();}],['Recenter in front',()=>{state.settings.angle=0;persist();}],['Reset desk dimensions',()=>{state.settings=M.settings();persist();}],['Back to spatial desk',()=>screen('spatial')]
   ];
   return null;
  }
  const oldDraw=g.drawMenu.bind(g);g.drawMenu=function(){
   oldDraw();const list=customRows();if(!list)return;
   const {ctx,texture}=g.xrPanel;ctx.fillStyle='#142230';ctx.fillRect(0,0,1024,768);ctx.textAlign='center';ctx.fillStyle='#ecd5a3';ctx.font='45px Georgia';ctx.fillText(state.phase==='game'?'VESPERFALL / SPATIAL DESK':'VESPERFALL / LOCAL FOYER',512,80,945);ctx.fillStyle='#c6dfd6';ctx.font='23px Arial';ctx.fillText('World-anchored panels / no head-locked menu',512,135,930);
   g.xrMenuRows=list;g.menuSelection=Math.max(0,Math.min(g.menuSelection,list.length-1));list.forEach(([text],i)=>{ctx.fillStyle=i===g.menuSelection?'#486971':'#283e50';ctx.fillRect(95,195+i*75,834,61);ctx.fillStyle='#f7eed8';ctx.font='27px Arial';ctx.fillText(text,512,235+i*75,800);});
   ctx.font='19px Arial';ctx.fillStyle='#bdd2cc';ctx.fillText(g.questHands.state.active?'Point and pinch. Open fingers before selecting again.':'Either ray + trigger selects. Upper face button goes back.',512,712,930);texture.needsUpdate=true;
  };
  const oldPause=g.setPaused.bind(g);g.setPaused=function(yes){if(!yes&&state.phase!=='game')restore();return oldPause(yes);};
  const oldExit=g.exitXR.bind(g);g.exitXR=function(){restore();desk.visible=false;return oldExit();};
  const oldProcess=g.processXR.bind(g);g.processXR=function(dt,head){
   state.frames++;
   if(!state.walking)return oldProcess(dt,head);
   const session=g.scene.renderer.xr.getSession();g.tracked(g.scene.frame);panel.visible=false;desk.visible=false;g.pendingPanel=false;g.cancel();
   for(const ray of Object.values(ui.rays))ray.visible=false;
   if(session?.visibilityState!=='visible'){crossing.reset();state.moveReady=false;return;}
   const hands=Object.entries(g.hands),bow=$('handedness').value,free=bow==='left'?'right':'left';
   if(hands.length<2||[...(session?.inputSources||[])].some(s=>s.hand)){
    state.walking=false;crossing.reset();screen(state.phase==='outbound'?'spatial':'foyer');return oldProcess(dt,head);
   }
   if(g.hands[free]?.buttons[3]&&!state.previous[free]?.[3]){state.walking=false;screen('foyer');return;}
   const neutral=hands.every(([,h])=>!h.buttons.some(Boolean)&&h.axes.every(v=>Math.abs(v)<.25));if(neutral)state.moveReady=true;
   if(state.moveReady){const h=g.hands[bow],x=h.axes.length>=4?h.axes[2]:h.axes[0]||0,z=h.axes.at(-1)||0;
    if(Math.hypot(x,z)>.25){const v=new T.Vector3(x,0,z);if(v.length()>1)v.normalize();v.multiplyScalar(Math.min(.04,dt)*1.15).applyQuaternion(stage.quaternion);const point=head.clone().add(v);const local=stage.worldToLocal(point.clone());if(Math.abs(local.x)<3&&Math.abs(local.z)<3)g.rig.position.add(v);g.rig.updateMatrixWorld(true);}
   }
   state.previous=Object.fromEntries(hands.map(([n,h])=>[n,[...h.buttons]]));
   const p=door.worldToLocal(g.head.object3D.getWorldPosition(new T.Vector3()));
   if(crossing.update(p.toArray())){state.crossings++;if(state.phase==='outbound')enterFoyer();else returnNow();}
  };
  const oldVisual=g.visuals.bind(g);g.visuals=function(){
   oldVisual();
   if(state.phase!=='game'){
    const keep=new Set([desk,stage,frame,panel,g.rig,g.rig.el?.object3D]);
    for(const o of g.scene.object3D.children){if(keep.has(o)||o.isLight||o.el?.hasAttribute?.('light'))continue;if(!state.hidden.has(o))state.hidden.set(o,o.visible);o.visible=false;}
    g.scene.object3D.background=g.arExpedition?null:new T.Color('#182633');g.scene.object3D.fog=null;g.blackout.material.opacity=0;
   }
   desk.visible=g.xr&&!state.walking&&panel.visible&&!g.returningBell.state.table;
   for(let i=0;i<6;i++){rows[i].visible=i<g.xrMenuRows.length;rows[i].material.color.set(i===g.menuSelection?'#cfb57e':'#395567');}
   if(state.walking)panel.visible=false;
  };
  // The added desktop control is an accessible settings entry, never an overlay in XR.
  const button=document.createElement('button');button.id='spatial-desk';button.textContent='Spatial desk / walking doorway (XR)';button.onclick=()=>{if(g.xr)screen('spatial');else ui.notice('Enter VR or AR expedition, then open Settings and choose Spatial desk / walking doorway. Screen play and Xbox controls remain unchanged.');};$('controls-button').after(button);
  const remove=g.remove.bind(g);g.remove=function(){restore();for(const r of resources)r.dispose();sign.texture.dispose();sign.mesh.geometry.dispose();sign.mesh.material.dispose();desk.removeFromParent();stage.removeFromParent();frame.removeFromParent();button.remove();remove();};
  return {state,crossing,desk,stage,door,frame,screen,begin,returnNow,exit};
 }
 root.VesperThreshold=Object.freeze({install});
})(globalThis);
