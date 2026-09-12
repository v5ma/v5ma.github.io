/* First Bell: learning is verified by actual input and model outcomes. The
 * optional Oath uses the maintained world, controls, checkpoint and rewards. */
(function(root){'use strict';
 const PRACTICE_BELL=1;
 function practiceBellHit(s){return s.targets.has(PRACTICE_BELL);}
 const lessons=[
  ['Find your stance','Open pause settings to choose your bow hand and a comfortable draw length. Clear your play space. Use Coach ready when comfortable.'],
  ['Ring the first bell','Aim at the bronze practice target straight ahead. Nock, draw and release an arrow into it.'],
  ['Hold without firing','Draw the string, then cancel before releasing. A canceled arrow must not consume a shot.'],
  ['Wind the crossbow','Switch weapons, fire the crossbow, then reload it. The physical winding gesture and accessible button both count.'],
  ['Read and block','A cantor has arrived. Hold a directional shield toward its warned volley. A real block completes this lesson.'],
  ['Choose a landing','Select Blink. Aim at a clear nearby floor and release. Only a successful teleport counts; stone is never a valid landing.'],
  ['Make a short escape','Use Shard Step toward a clear patch of floor. It is shorter than Blink and uses a regenerating charge.'],
  ['Retrieve a crystal','Find the glowing lesson supply near you. In VR, point your free hand at it and hold the trigger to pull. On desktop, approach it.'],
  ['Choose your counter','Hold the tactical quiver open, choose a different arrow, and release. The small time reserve is not an unlimited pause.'],
  ['Read your bearings','Turn your free palm upward in VR to reveal the familiar. On desktop or Xbox, open the atlas. Check your resources before the next court.'],
  ['The first bell is yours','The scored Bellkeeper Oath is available from the menu. It links three courts, paired opponents and a three-phase duel. Skipped lessons remain unpracticed; no permanent rewards were farmed here.']
 ];
 function install(g){
  const T=g.T,C=VesperCore,O=BellOath,$=id=>document.getElementById(id),ui=g.dominionControls;
  const state={coach:null,seenGame:null,event:0,routeText:'',lastHud:0},panel=g.makePanel(1024,512,1.5,.75);
  panel.mesh.name='First Bell world-space coach';panel.mesh.visible=false;g.scene.object3D.add(panel.mesh);
  const menu=document.createElement('section');menu.id='first-bell-menu';menu.innerHTML='<p class="eyebrow">FIRST BELL / LEARN, READ, COUNTER</p><label for="expedition-mode">Scored expedition</label><select id="expedition-mode"><option value="endless">Endless cloisters / original expedition</option><option value="oath">Bellkeeper\'s Oath / three connected trials</option></select><div class="first-bell-actions"><button id="first-bell-start">Learn physical archery</button><button id="oath-start">Take the Bellkeeper\'s Oath</button></div><p id="lesson-summary">Ten guided lessons. A scored route across Roseglass, Ivory Crown and Ember Crown. Existing saves remain protected.</p><div class="first-bell-actions"><button id="coach-help">Coach / current instruction</button><button id="coach-ready">Coach ready / continue</button><button id="coach-skip">Skip current lesson</button></div>';
  $('practice').before(menu);
  const card=document.createElement('aside');card.id='first-bell-coach';card.setAttribute('aria-live','polite');card.hidden=true;card.innerHTML='<strong id="coach-title"></strong><p id="coach-text"></p><small id="coach-controls"></small>';$('hud').append(card);
  function actualCoach(){return state.coach&&g.game===state.coach.game&&!g.arMode?state.coach:null;}
  function controls(){const i=actualCoach()?.index||0;
   const pc=['P opens settings. Coach ready is in the pause menu.','Hold Space or left mouse, release to fire.','Hold Space, then Q cancels.','V switches weapon, click fires, R reloads.','Hold H to guard; lower it before shooting.','4 selects Blink. Hold Space, aim down, release.','B steps in your aim direction.','Walk to the crystal.','Hold Tab, arrows select, release Tab to equip.','M opens the atlas.','P opens the menu; Take the Oath begins a scored run.'];
   const pad=['Menu opens settings. D-pad navigates; A selects.','Hold RT, then release. Right stick aims.','Hold RT, then LB cancels.','Right-stick click switches, RT fires, X reloads.','Hold LT toward the volley.','B toggles Blink. Aim with right stick, release RT.','RB steps toward your aim.','Left stick moves to the crystal.','Hold Y, select with a stick or D-pad, release Y.','View opens the atlas.','Menu, then Take the Oath; A selects.'];
   const xr=['Bow-hand upper button opens settings. Either ray + trigger selects.','Bring draw hand to nock; trigger, pull, release.','While drawing, squeeze the free-hand grip to cancel into guard.','Bow-stick click switches. Bow trigger fires. Free trigger grabs handle; pull back, release. Free-stick click also reloads.','Hold free-hand grip facing the incoming bolts.','Free upper face button selects Blink. Physically aim at a nearby clear floor.','Bow-hand grip steps in that controller direction.','Point the free-hand ray at the crystal and hold trigger.','Hold free lower face button, move its stick to choose, release.','Rotate the free palm upward.','Bow upper button, Expedition, More, First Bell, Take the Oath.'];
   return (g.xr?xr:ui.state.pad?pad:pc)[i];
  }
  function placeCoach(){const p=g.head.object3D.getWorldPosition(new T.Vector3()),q=g.head.object3D.getWorldQuaternion(new T.Quaternion());panel.mesh.position.copy(p).add(new T.Vector3(.95,-.12,-2.2).applyQuaternion(q));panel.mesh.quaternion.copy(q);}
  function drawCoach(){const coach=actualCoach();if(!coach){card.hidden=true;panel.mesh.visible=false;return;}
   const [title,text]=lessons[coach.index],hint=controls();$('coach-title').textContent=(coach.index<10?(coach.index+1)+' / 10 - ':'')+title;$('coach-text').textContent=text;$('coach-controls').textContent=hint;
   $('lesson-summary').textContent=title+' / '+coach.done.length+' practiced, '+coach.skipped.length+' skipped. Lesson progress lasts for this session.';
   card.hidden=g.xr||g.paused||!g.running;panel.mesh.visible=g.xr&&!g.paused&&g.running&&g.game.phase==='playing';
   const x=panel.ctx;x.fillStyle='#132736';x.fillRect(0,0,1024,512);x.strokeStyle='#d5b77e';x.lineWidth=5;x.strokeRect(8,8,1008,496);x.fillStyle='#f1dcac';x.font='38px Georgia';x.fillText(title,40,65,945);
   function lines(str,y,color,size){x.font=size+'px Arial';x.fillStyle=color;let line='';for(const word of str.split(' ')){const next=line?line+' '+word:word;if(x.measureText(next).width>920){x.fillText(line,40,y);y+=size+9;line=word;}else line=next;}x.fillText(line,40,y);return y+size+20;}
   const y=lines(text,125,'#deeaed',29);lines(hint,y,'#a6dbd1',27);panel.texture.needsUpdate=true;
  }
  function rebuild(){const pos=g.rig.position.clone();g.build();g.rig.position.copy(pos);g.scene.object3D.updateMatrixWorld(true);}
  function nearSupply(){const s=g.game;for(const d of[[1.2,0],[0,-1.5],[-1.2,0],[0,1.5]]){const p=[s.p[0]+d[0],s.p[1]+.8,s.p[2]+d[1]];if(C.walkable(s.world,[p[0],s.p[1],p[2]],.25)&&!C.segmentBlocked(s.world,s.head,p)){s.world.pickups.push({id:'first-bell-crystal-'+s.world.pickups.length,p,kind:'frost',taken:false,label:'First Bell supply'});state.coach.pickup=s.world.pickups.at(-1).id;return;}}}
  function enter(index){const c=actualCoach();if(!c)return;c.index=index;c.base={shots:g.game.shots,blocks:g.game.blocks,blinks:g.game.blinks,shards:g.game.shardsUsed,seq:g.game.eventSeq||0,type:g.game.type};c.cancelled=false;c.wasDrawing=false;c.open=false;c.reloadShot=false;c.reloadDone=false;c.fitted=false;
   if(index===1){g.game.targets.delete(PRACTICE_BELL);C.setWeapon(g.game,'bow');g.setType('plain');}
   if(index===3){g.game.world.enemies=[];}
   if(index===4){C.setWeapon(g.game,'bow');g.setType('plain');const e=VesperEncounters.training('cantor');let found=false;
    for(const r of g.game.world.rooms.slice().sort((a,b)=>Math.hypot(a.x-g.game.p[0],a.z-g.game.p[2])-Math.hypot(b.x-g.game.p[0],b.z-g.game.p[2]))){for(const z of[-2,2]){const p=[r.x,1.05,r.z+z];if(C.len(C.sub(p,g.game.head))>3&&C.len(C.sub(p,g.game.head))<12&&!C.segmentBlocked(g.game.world,C.add(p,[0,.45,0]),g.game.head)&&C.walkable(g.game.world,[p[0],0,p[2]],.42)){e.p=p;e.room=r.id;found=true;break;}}if(found)break;}
    g.game.world.enemies=[e];g.game.portalReady=false;}
   if(index===5){g.game.world.enemies=[];g.game.bolts=[];g.game.hazards=[];}
   if(index===7)nearSupply();
   rebuild();placeCoach();drawCoach();g.toast(lessons[index][0]);
  }
  const oldCancel=g.cancel.bind(g);g.cancel=function(){const c=actualCoach();if(c?.index===2&&g.charge>.15&&!g.paused)c.cancelled=true;oldCancel();};
  const oldStart=g.start.bind(g);g.start=function(practice){if(!g.arMode){state.coach=null;panel.mesh.visible=false;card.hidden=true;}return oldStart(practice);};
  function start(){if(g.arMode){ui.notice('Exit AR Sanctuary to use the traversal lessons. Your expedition remains safe.');return;}g.start(true);state.coach={game:g.game,index:0,done:[],skipped:[]};enter(0);g.setPaused(false);}
  function ready(){const c=actualCoach();if(!c){ui.notice('Choose Learn physical archery to start the coach.');return;}if(c.index===0){c.done.push(0);enter(1);}if(c.index===10){beginOath();return;}g.setPaused(false);placeCoach();}
  function skip(){const c=actualCoach();if(!c||c.index===10)return;const at=c.index;ui.confirm('Skip this lesson?','This lesson will be marked skipped, not practiced. It does not unlock permanent rewards.',()=>{if(actualCoach()===c&&c.index===at){c.skipped.push(at);enter(at+1);g.setPaused(false);}});}
  function help(){const c=actualCoach();if(c){ui.notice(lessons[c.index][0]+'. '+lessons[c.index][1]+' '+controls());placeCoach();}else if(g.game.oath)ui.notice(routeText()+' Use stone cover and either staircase. The Bellkeeper reveals its exposed head in green during recovery. Every attack has a committed aim and a warning.');else ui.notice('Learn physical archery is unscored and preserves your expedition. The Bellkeeper Oath is a separate scored route inside the same game; normal saves, controllers and blessings still apply.');}
  function beginOath(){if(g.arMode){ui.notice('Exit AR before beginning a scored Oath expedition.');return;}$('expedition-mode').value='oath';g.start(false);}
  function routeText(){const s=g.game,o=s.oath;if(!o)return '';if(o.stage>=3)return 'OATH COMPLETE / approach the Ember beacon and choose a blessing';const d=O.stages[o.stage],from=C.roomAt(s.world,s.p),path=C.route(s.world,from,d.room),next=s.world.rooms[path[1]??d.room];return (o.active?'FIGHT / ':o.rest>0?'RECOVER / ':'FOLLOW / ')+d.title+' / '+(o.active?d.hint:'Next: '+next.label);}
  function coachUpdate(){const c=actualCoach();if(!c||g.paused||!g.running||g.game.phase!=='playing')return;const s=g.game,b=c.base,events=s.events.filter(e=>e.seq>b.seq);if(c.index===2){if(g.charge>.15)c.wasDrawing=true;if(c.wasDrawing&&s.shield)c.cancelled=true;}
   if(c.index===3){if(events.some(e=>e.type==='shot'&&e.weapon==='crossbow'))c.reloadShot=true;if(c.reloadShot&&events.some(e=>e.type==='reloaded'))c.reloadDone=true;}
   if(c.index===8&&g.ritual.focus.open)c.open=true;
   const ok=c.index===1?practiceBellHit(s):c.index===2?c.cancelled&&s.shots===b.shots:c.index===3?c.reloadDone:c.index===4?s.blocks>b.blocks:c.index===5?s.blinks>b.blinks:c.index===6?s.shardsUsed>b.shards:c.index===7?s.world.pickups.some(p=>p.id===c.pickup&&p.taken):c.index===8?c.open&&!g.ritual.focus.open&&s.type!==b.type:c.index===9?g.xr?g.ritual.panel.mesh.visible:!$('map').hidden:false;
   if(ok){c.done.push(c.index);C.emit(s,'lesson-complete',{lesson:c.index});enter(c.index+1);}
  }
  function makeBoss(){const m=new T.Group(),b=new g.art.Batch();m.name='The Bellkeeper / three-phase oath';const brass='#b79762',iron='#697c8c',cloth='#253443',glow='#abddd1';
   b.add('cone',cloth,0,-.25,0,.55,1.5,.44);b.add('ball',iron,0,.22,0,.6,.50,.35,0,0,0,.65);b.add('cylinder',iron,0,.66,0,.29,.45,.25,0,0,0,.65);
   for(const side of[-1,1]){b.add('ball',brass,side*.66,.35,0,.24,.21,.27,0,0,0,.7);b.add('cylinder',iron,side*.65,-.06,0,.12,.7,.14,0,0,side*.25,.6);b.add('box',iron,side*.22,-.7,.08,.21,.61,.28,0,0,0,.7);b.add('box',brass,side*.22,-.96,.12,.26,.13,.38,0,0,0,.6);}
   b.add('box','#172532',0,.68,.252,.34,.055,.035);b.add('box',glow,0,.58,.257,.06,.18,.04,0,0,0,0,true);
   for(let n=0;n<7;n++){const a=n/6*Math.PI-Math.PI/2;b.add('cone',brass,Math.sin(a)*.53,1.03+Math.cos(a)*.21,0,.055,.37,.06,0,0,-a/2,.75);}
   b.add('cylinder',brass,-.86,.22,0,.036,2.5,.036,0,0,0,.7);b.add('cone',brass,-.86,1.33,0,.23,.33,.23,Math.PI,0,0,.75);b.add('ball',glow,-.86,1.22,0,.05,.075,.05,0,0,0,0,true);b.finish(m);
   const halo=new T.Mesh(new T.TorusGeometry(.77,.035,6,48),g.art.mat(brass,.8));halo.position.set(0,.49,-.22);m.add(halo);
   const core=new T.Mesh(new T.OctahedronGeometry(.14),g.art.mat(glow,0,true));core.position.set(0,.68,.31);m.add(core);
   const guard=new T.Mesh(new T.CircleGeometry(.53,12),new T.MeshStandardMaterial({color:iron,metalness:.7,roughness:.35,side:T.DoubleSide}));guard.position.z=.78;m.add(guard);
   const ring=new T.Mesh(new T.TorusGeometry(.87,.025,6,40),g.art.mat('#d79d65',0,true));ring.rotation.x=-Math.PI/2;ring.position.y=-1.01;m.add(ring);
   const warning=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#ffbc7b'}));warning.frustumCulled=false;m.add(warning);
   const plate=g.makePanel(1024,192,2.9,.55);plate.mesh.position.set(0,1.8,0);plate.mesh.material.depthTest=true;plate.mesh.renderOrder=0;m.add(plate.mesh);
   m.userData.oathBoss={halo,core,guard,ring,warning,plate,last:''};return m;
  }
  const oldBuild=g.build.bind(g);g.build=function(){oldBuild();if(!g.game.oath)return;
   g.game.world.enemies.forEach((e,i)=>{if(!e.oathBoss)return;const old=g.enemyMeshes[i];g.art.dispose(old);const m=makeBoss();g.entities.add(m);g.enemyMeshes[i]=m;});
   const pins=new T.Group();pins.name='Oath route / three tolls';g.worldArt.group.add(pins);
   for(let i=0;i<O.stages.length;i++){const d=O.stages[i],r=g.game.world.rooms[d.room];g.art.label(pins,['FIRST TOLL','SECOND TOLL','LAST TOLL'][i],r.x,4.9,r.z+7.2,4.2,.7);}
   const nav=new T.Group();nav.name='Oath wayfinding compass';g.entities.add(nav);const ring=new T.Mesh(new T.TorusGeometry(.32,.025,5,24),g.art.mat('#e4c586',0,true));ring.rotation.x=-Math.PI/2;nav.add(ring);const arrow=g.art.mesh('cone','#e4c586',nav,0,.1,-.45,.1,.32,.1);arrow.rotation.x=-Math.PI/2;g.oathMarker=nav;
  };
  const oldMenu=g.menuUI.bind(g);g.menuUI=function(){oldMenu();const c=actualCoach();for(const id of['coach-ready','coach-skip'])$(id).hidden=!c;$('coach-skip').disabled=c?.index===10;drawCoach();if(g.game.oath&&g.running){$('menu-title').textContent=g.game.phase==='dead'?'The Oath can be taken again.':g.game.phase==='reward'?'The Bellkeeper yields.':'Between the tolls.';$('menu-message').textContent=routeText();}};
  const oldVisual=g.visuals.bind(g);g.visuals=function(){oldVisual();const s=g.game;if(state.seenGame!==s){state.seenGame=s;state.event=0;state.lastHud=-1;}coachUpdate();
   if(s.oath){for(let i=0;i<g.enemyMeshes.length;i++){const m=g.enemyMeshes[i],e=s.world.enemies[i];m.visible=!e.dead&&O.canTarget(s,e);const p=m.userData.oathBoss;if(!p||!m.visible)continue;m.scale.setScalar(1);m.position.set(...e.p);if(e.facing)m.rotation.y=Math.atan2(e.facing[0],e.facing[2]);const open=e.recovery>0&&!(e.bossTransition>0)&&!(e.wind>0)&&!e.bossMove;p.guard.visible=VesperEncounters.guardActive(e);p.core.material=g.art.mat(open?'#8affc8':e.bossTransition>0?'#abcaff':'#e2a271',0,true);p.core.scale.setScalar(open?1.3:1);p.halo.rotation.z=s.time*.18;p.ring.material=p.core.material;p.ring.scale.setScalar(e.wind>0?1+Math.sin(s.time*10)*.12:1);
    p.warning.visible=e.bossPhase===2&&e.wind>0&&!!e.aim;if(p.warning.visible){m.updateMatrixWorld(true);const v=m.worldToLocal(new T.Vector3(e.aim[0],e.p[1]-1,e.aim[2])),a=p.warning.geometry.attributes.position;a.setXYZ(0,0,-1,0);a.setXYZ(1,v.x,v.y,v.z);a.needsUpdate=true;}
    const label='BELLKEEPER / '+e.bossPhase+' OF 3 / '+(e.bossTransition>0?'CHANGING TOLL':open?'WEAK POINT OPEN':e.wind>0?'ATTACK COMMITTED':'ARMORED');const ctx=p.plate.ctx;if(p.last!==label+Math.ceil(e.hp)){ctx.fillStyle='#142735';ctx.fillRect(0,0,1024,192);ctx.font='30px Georgia';ctx.fillStyle=open?'#9cf2c9':'#e0c492';ctx.textAlign='center';ctx.fillText(label,512,60,965);ctx.fillStyle='#415261';ctx.fillRect(60,105,904,18);ctx.fillStyle='#d8bc81';ctx.fillRect(60,105,904*Math.max(0,e.hp/e.maxHp),18);p.plate.texture.needsUpdate=true;p.last=label+Math.ceil(e.hp);}p.plate.mesh.quaternion.copy(m.quaternion.clone().invert().multiply(g.head.object3D.getWorldQuaternion(new T.Quaternion())));
   }
   if(g.oathMarker){const target=s.oath.stage<3?O.stages[s.oath.stage].room:s.world.exit,path=C.route(s.world,C.roomAt(s.world,s.p),target),r=s.world.rooms[path[1]??target];g.oathMarker.position.set(s.p[0],s.p[1]+.12,s.p[2]);g.oathMarker.rotation.y=Math.atan2(-(r.x-s.p[0]),-(r.z-s.p[2]));g.oathMarker.visible=g.running&&!g.paused&&!s.oath.active;}}
   for(const e of s.events){if(e.seq<=state.event)continue;if(e.type==='oath-arrival'||e.type==='oath-clear')g.toast(e.text);if(e.type==='oath-phase')g.toast('BELLKEEPER / TOLL '+e.phase+' / prepare for a new attack');if(e.type==='lesson-complete')g.soundscape?.engine?.play('pickup');}state.event=s.eventSeq||0;
   if(s.time-state.lastHud>.15||g.paused){drawCoach();state.lastHud=s.time;}
  };
  const oldHud=g.hud.bind(g);g.hud=function(){oldHud();if(g.game.oath&&g.running){$('objective').textContent=routeText();$('tally').textContent=g.game.oath.cleared+' / 3 tolls silenced';}if(actualCoach())drawCoach();};
  const remove=g.remove.bind(g);g.remove=function(){g.art.dispose(panel.mesh);menu.remove();card.remove();remove();};
  $('first-bell-start').onclick=start;$('oath-start').onclick=beginOath;$('coach-help').onclick=help;$('coach-ready').onclick=ready;$('coach-skip').onclick=skip;
  g.menuUI();return {state,start,beginOath,ready,skip,help,routeText,lessons};
 }
 root.FirstBell=Object.freeze({install,lessons,practiceBellHit,PRACTICE_BELL});
})(globalThis);
