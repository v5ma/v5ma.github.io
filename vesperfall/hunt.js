/* Hollow Hunt: original enemy silhouettes, readable telegraphs and feedback.
 * Installs inside the existing A-Frame component and uses its single tick loop.
 * Combat remains in core.js; there is no cosmetic-only damage or teleport. */
(function(root){'use strict';
 const prior=VesperArt.create,colors={cantor:'#d9a060',stalker:'#df816a',warden:'#cdbb89',frozen:'#86d7ef'};
 VesperArt.create=function(T,scene){
  const kit=prior(T,scene);
  function enemy(kind){
   const g=new T.Group(),parts={},cloth=kind==='cantor'?'#703e55':kind==='stalker'?'#474953':'#384d60',iron='#a3a7a5',gold='#c9ab70',shadow='#202c34',b=new kit.Batch();
   g.name=VesperEncounters.names[kind];
   const box=(color,x,y,z,w,h,d)=>b.add('box',color,x,y,z,w,h,d);
   if(kind==='cantor'){
    b.add('cone',cloth,0,-.30,0,.41,1.42,.35);b.add('ball',cloth,0,.29,0,.32,.29,.28);b.add('ball',cloth,0,.59,0,.29,.33,.26);
    box(shadow,0,.60,.218,.28,.32,.05);box(gold,0,.16,.31,.10,.78,.025);
    for(const side of[-1,1]){box('#d9c5a6',side*.084,.64,.25,.03,.02,.02);box(gold,side*.27,-.80,.13,.055,.28,.025);}
    b.add('cylinder',gold,.49,.04,.10,.023,1.8,.023);b.add('ring',gold,.49,1.01,.10,.17,.23,.17);b.add('ball','#f1c07f',.49,1.01,.10,.07,.07,.07,0,0,0,0,true);
    box('#ccb995',-.38,.07,.30,.29,.045,.24);box('#453c4f',-.38,.025,.30,.32,.018,.27);
   }else if(kind==='stalker'){
    b.add('ball',cloth,0,-.04,0,.32,.50,.24);b.add('ball','#7a6c65',0,.57,.055,.225,.24,.24);
    for(const side of[-1,1]){b.add('cone',gold,side*.22,.86,-.03,.065,.46,.065,0,0,side*-.5);box('#efad74',side*.085,.62,.273,.05,.025,.02);b.add('cone','#aaa58d',side*.15,.25,.18,.09,.36,.09,0,0,side*-.4);}
    box(shadow,0,.51,.288,.16,.038,.024);
   }else{
    box('#6b7882',0,.04,0,.80,.84,.38);box(gold,0,.19,.205,.085,.47,.03);box(gold,0,.28,.218,.39,.062,.03);
    b.add('cylinder',iron,0,.59,0,.26,.43,.23);b.add('cone',iron,0,.83,0,.26,.18,.23);
    box(shadow,0,.64,.23,.33,.042,.025);box(gold,0,.48,.24,.04,.23,.04);box(cloth,0,-.5,.15,.42,.7,.10);
    for(const side of[-1,1]){b.add('ball',iron,side*.47,.29,0,.19,.16,.22);box(gold,side*.47,.30,.20,.25,.05,.05);}
    // Visual disk and simulated disk share centre, radius and facing.
    parts.guard=new T.Group();parts.guard.position.set(0,0,.78);g.add(parts.guard);
    const plate=new T.Mesh(new T.CircleGeometry(.53,10),kit.mat('#466273',.35));plate.material.side=T.DoubleSide;parts.guard.add(plate);
    const rim=new T.Mesh(new T.TorusGeometry(.53,.028,5,30),kit.mat(gold,.5));parts.guard.add(rim);
    kit.mesh('box',gold,parts.guard,0,0,.025,.06,.67,.05);kit.mesh('box',gold,parts.guard,0,.12,.027,.45,.05,.05);
   }
   // Jointed arms and legs have small, phase-driven poses instead of billboards.
   for(const side of[-1,1]){
    const arm=new T.Group();arm.position.set(side*(kind==='warden'?.43:.29),.27,0);g.add(arm);
    kit.mesh('cylinder',kind==='warden'?iron:cloth,arm,side*.08,-.20,.05,.085,.43,.09,side*.18);
    kit.mesh('ball',kind==='stalker'?'#978b78':gold,arm,side*.13,-.41,.1,.065,.085,.055);parts[side<0?'leftArm':'rightArm']=arm;
    const leg=new T.Group();leg.position.set(side*.17,-.36,0);g.add(leg);kit.mesh('box',kind==='warden'?iron:shadow,leg,0,-.32,0,.14,.55,.17);kit.mesh('box',shadow,leg,0,-.62,.09,.18,.10,.30);parts[side<0?'leftLeg':'rightLeg']=leg;
   }
   b.finish(g);
   const ground=new T.Mesh(new T.CircleGeometry(kind==='warden'?.60:.44,24),new T.MeshBasicMaterial({color:'#15202a',transparent:true,opacity:.3,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.025;g.add(ground);
   const ring=new T.Mesh(new T.TorusGeometry(.65,.022,5,32),kit.mat(colors[kind],0,true));ring.rotation.x=-Math.PI/2;ring.position.y=-1.015;g.add(ring);parts.ring=ring;
   const warning=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:colors.stalker}));g.add(warning);warning.frustumCulled=false;parts.warning=warning;
   const plate=new T.Group();plate.position.y=1.17;g.add(plate);kit.label(plate,VesperEncounters.names[kind].toUpperCase(),0,.11,0,1.7,.22,'#182934','#e6d1ac');kit.mesh('box',shadow,plate,0,-.04,0,1.3,.055,.02);const hp=kit.mesh('box',colors[kind],plate,0,-.04,.015,1.3,.05,.025);parts.hp=hp;parts.plate=plate;
   g.userData.hunt=parts;return g;
  }
  const world=kit.world;
  function build(model){const result=world(model),b=new kit.Batch();
   for(const loft of model.architecture.lofts){
    const r=model.rooms[loft.room];for(const side of[-1,1]){
     const x=r.x+side*5.66;kit.beam(b,[x,.38,r.z+4.6],[x,3.58,r.z-4.2],.065,'#b8a57a');
     for(let j=0;j<9;j++)b.add('cylinder','#b8a57a',x,j*.4+.18,r.z+4.6-j*1.1,.025,.4,.025);
    }
    kit.label(result.group,loft.label.toUpperCase()+' / TWO STAIRS',r.x,4.8,r.z-6.3,4.3,.39,'#253c47','#eed4a8');
    b.add('ring','#8cc6be',...loft.pad,.48,.48,.48,Math.PI/2,0,0,0,true);
   }
   result.instances+=b.finish(result.group);return result;
  }
  return {...kit,enemy,world:build};
 };
 function install(g){
  const T=g.T,$=id=>document.getElementById(id),headQ=new T.Quaternion(),localQ=new T.Quaternion(),aim=new T.Vector3(),forward=new T.Vector3(),eye=new T.Vector3();let last=0,seen=null,flashUntil=0,hapticAt=-1,trainingWon=false;
  const oldStart=g.start.bind(g);g.start=function(practice){g.training=null;trainingWon=false;oldStart(practice);};
  g.startTraining=function(kind){g.start(true);g.training=kind;g.game.world.enemies=[VesperEncounters.training(kind)];g.game.portalReady=false;g.build();g.setPaused(false);g.toast('Sparring: '+VesperEncounters.names[kind]+'. Real attacks; no permanent rewards.');};
  $('sparring').onclick=()=>g.startTraining($('sparring-kind').value);
  function pulse(strength,duration){if(!g.xr||g.game.time-hapticAt<.08)return;hapticAt=g.game.time;for(const h of Object.values(g.hands)){try{h.source.gamepad.hapticActuators?.[0]?.pulse(strength,duration)?.catch?.(()=>{});}catch{}}}
  function update(){
   const s=g.game;if(s!==seen){seen=s;last=0;flashUntil=0;hapticAt=-1;}
   const active=g.running&&!g.paused&&s.phase==='playing';g.head.object3D.getWorldQuaternion(headQ);g.head.object3D.getWorldPosition(eye);forward.set(0,0,-1).applyQuaternion(headQ);let target=null,best=.965;
   for(let i=0;i<g.enemyMeshes.length;i++){
    const m=g.enemyMeshes[i],e=s.world.enemies[i],p=m.userData.hunt;if(!p||e.dead)continue;
    m.scale.setScalar(1);m.position.set(...e.p);if(e.facing)m.rotation.y=Math.atan2(e.facing[0],e.facing[2]);
    const frozen=e.frozen>0,moving=e.phase==='hunting'||e.phase==='charging',stride=moving?Math.sin(s.time*(e.phase==='charging'?17:6))*.35:0;
    p.leftLeg.rotation.x=stride;p.rightLeg.rotation.x=-stride;p.leftArm.rotation.x=frozen?-.2:e.wind>0?-1.1:-stride;p.rightArm.rotation.x=frozen?-.2:e.wind>0?-1.0:stride;
    if(p.guard)p.guard.visible=VesperEncounters.guardActive(e);
    p.ring.visible=active&&(frozen||e.wind>0||e.phase==='charging'||e.recovery>0);p.ring.material=g.art.mat(frozen?colors.frozen:e.recovery>0?'#91cfb4':colors[e.kind],0,true);p.ring.scale.setScalar(e.wind>0?1+.15*Math.sin(s.time*13):1);
    const clear=active&&VesperCore.len(VesperCore.sub(e.p,s.head))<17&&!VesperCore.segmentBlocked(s.world,s.head,VesperCore.add(e.p,[0,.62,0]));
    p.plate.visible=clear;p.plate.quaternion.copy(localQ.copy(m.quaternion).invert().multiply(headQ));p.hp.scale.x=1.3*Math.max(0,e.hp/e.maxHp);p.hp.position.x=-.65*(1-e.hp/e.maxHp);
    p.warning.visible=clear&&e.kind==='stalker'&&e.wind>0&&!!e.aim;
    if(p.warning.visible){m.updateMatrixWorld(true);aim.set(e.aim[0],.06,e.aim[2]);m.worldToLocal(aim);const a=p.warning.geometry.attributes.position;a.setXYZ(0,0,-.99,0);a.setXYZ(1,aim.x,aim.y,aim.z);a.needsUpdate=true;}
    if(clear){aim.set(e.p[0]-eye.x,e.p[1]+.4-eye.y,e.p[2]-eye.z).normalize();const alignment=aim.dot(forward);if(alignment>best){best=alignment;target=e;}}
   }
   for(let i=0;i<g.sparkPool.length;i++){const m=g.sparkPool[i],e=s.sparks[i];if(!e)continue;m.material=g.art.mat(e.type==='blast'?'#ffaf69':e.type==='frost'?'#8bdbef':e.type==='guard'?'#e3c388':'#b8fbe0',0,true);if(e.type==='blast')m.scale.setScalar(1+(1-e.life/.55)*12);}
   for(let i=0;i<g.arrowPool.length;i++){const m=g.arrowPool[i],a=s.arrows[i];if(!a)continue;const color={cinder:'#ffb573',frost:'#96e7ff',blink:'#80e7cc',volley:'#de9fe0',plain:'#edd6ab'}[a.type];for(let j=1;j<m.children.length;j++)m.children[j].material=g.art.mat(color,0,true);}
   for(const e of s.events){if(e.seq<=last)continue;
    if(e.type==='hit'||e.type==='kill'){flashUntil=s.time+.23;$('reticle').textContent=e.head?'✦':'×';$('reticle').style.color=e.head?'#ffd595':'#b9f0df';pulse(e.head?.28:.17,50);}
    if(e.type==='enemy-deflect')g.toast('SENTINEL GUARD · aim above the shield, flank, or attack during recovery');
    if(e.type==='enemy-windup'){g.sound(e.kind==='stalker'?145:300,.19,.018);pulse(.07,24);}
    if(e.type==='explosion')g.sound(65,.25,.023);
    if(e.type==='block')pulse(.45,65);
   }last=s.eventSeq||0;
   if(s.time>flashUntil){$('reticle').textContent='⌾';$('reticle').style.color='';}
   const readout=$('hunt-readout');readout.hidden=!active;
   if(active){const remaining=s.world.enemies.filter(e=>!e.dead).length,room=s.world.rooms[VesperCore.roomAt(s.world,s.p)];
    const phase=target?(target.frozen>0?'FROZEN':target.wind>0?(target.kind==='stalker'?'CHARGE INCOMING':'VOLLEY INCOMING'):target.recovery>0?'RECOVERING — STRIKE':VesperEncounters.guardActive(target)?'GUARDING — AIM HIGH':'HUNTING'):'';
    const text=s.guardLock>0?'GUARD BROKEN · recover '+s.guardLock.toFixed(1)+'s':target?VesperEncounters.names[target.kind]+' · '+phase:g.training?(remaining?'SPARRING · guard, sidestep, then shoot':'TRIAL COMPLETE · P to choose another opponent'):(room.family||'Cloister')+' · '+(s.p[1]>2?'UPPER ROUTE':'GROUND ROUTE');
    if(readout.textContent!==text)readout.textContent=text;
    if(g.xr&&target&&!s.shield&&s.type!=='blink')g.xrNotice=text;
    if(g.training&&!remaining&&!trainingWon){trainingWon=true;g.toast('TRIAL COMPLETE · no permanent rewards awarded. P opens the practice selector.');}
   }
  }
  const oldVisual=g.visuals.bind(g);g.visuals=function(){oldVisual();update();};
  const oldHud=g.hud.bind(g);g.hud=function(){oldHud();if(g.training&&g.running){$('objective').textContent='Sparring · '+(VesperEncounters.names[g.training]||'AR Sanctuary');$('tally').textContent=g.game.world.enemies.some(e=>!e.dead)?'Read the windup. Defend. Counterattack.':'Trial complete · P to repeat';}};
  return {update};
 }
 root.VesperHunt=Object.freeze({install});
})(globalThis);
