/* Test-only observer that produces ordinary keyboard edges. Never called by
 * the game. No actor, camera, timer, health, or progression writes. */
async id => {
 const C=VesperCore,g=Vesperfall.component,canvas=AFRAME.scenes[0].canvas,held=new Set(),phases=new Set();
 const key=(code,on)=>{if(held.has(code)===on)return;canvas.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));on?held.add(code):held.delete(code);};
 return await new Promise((resolve,reject)=>{
  const start=performance.now(),initial=Vesperfall.state.shots;let firing=false,released=false,side=1;
  const timer=setInterval(()=>{
   const s=Vesperfall.state,e=s.world.enemies.find(e=>e.id===id);
   function finish(error){for(const k of [...held])key(k,false);clearInterval(timer);if(error)reject(Error(error));else resolve({phases:[...phases],shots:s.shots-initial});}
   if(s.phase!=='playing'||g.paused||performance.now()-start>120000){finish('Encounter input stopped: '+JSON.stringify({phase:s.phase,paused:g.paused,id,health:s.health,enemy:e,shots:s.shots,held:[...held]}));return;}
   if(!e||e.dead){finish();return;}
   if(e.oathBoss)phases.add(e.bossPhase);
   const target=C.add(e.p,[0,.70,0]),head=g.head.object3D.getWorldPosition(new AFRAME.THREE.Vector3()).toArray(),dx=target[0]-head[0],dz=target[2]-head[2],d=Math.hypot(dx,dz),dy=target[1]-head[1],v=s.weapon==='crossbow'?38:36,v2=v*v,disc=v2*v2-9.8*(9.8*d*d+2*dy*v2),pitch=disc>0?Math.atan((v2-Math.sqrt(disc))/(9.8*d)):0,yaw=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(yaw-g.yaw),Math.cos(yaw-g.yaw)),b=pitch-g.pitch;
   key('ArrowLeft',a>.009);key('ArrowRight',a<-.009);key('ArrowUp',b>.006);key('ArrowDown',b<-.006);
   // Dodge the actual announced floor hazard. Observe traversable lateral
   // ground, never assign the destination or extend its expiry.
   const hazard=s.hazards.find(h=>Math.hypot(h.p[0]-s.p[0],h.p[2]-s.p[2])<h.radius+.65);
   if(hazard){const right=[Math.cos(g.yaw),0,-Math.sin(g.yaw)],q=C.add(s.p,C.mul(right,side*.75));if(!C.walkable(s.world,q,.42))side=-side;key('KeyD',side>0);key('KeyA',side<0);key('ShiftLeft',true);}else{key('KeyD',false);key('KeyA',false);key('ShiftLeft',false);}
   const threat=s.bolts.some(bolt=>C.len(C.sub(bolt.p,s.head))<5&&C.dot(C.sub(s.head,bolt.p),bolt.v)>0)||(e.bossMove&&C.len(C.sub(e.p,s.head))<4);
   const window=!e.oathBoss||(e.recovery>.7&&!e.bossTransition&&!e.bossMove&&!e.wind);
   if(s.shots>initial){key('Space',false);released=true;if(!s.arrows.length){finish();return;}}
   if(released){key('KeyH',!!threat);return;}
   if(firing){key('Space',s.weapon==='crossbow');return;}
   if(s.weapon==='crossbow'&&!s.crossbow.loaded){key('Space',false);key('KeyH',false);key('KeyR',s.crossbow.reload===0);return;}
   key('KeyR',false);
   if(threat&&!firing){key('KeyH',true);key('Space',false);return;}
   key('KeyH',false);
   if(s.shield||s.guardLock>0)return;
   const aligned=Math.abs(a)<.016&&Math.abs(b)<.012;
   if(s.weapon==='crossbow'){
    if(window&&aligned){key('Space',true);firing=true;}
   }else{
    key('Space',true);
    if(g.charge>.985&&aligned){key('Space',false);firing=true;}
   }
  },3);
 });
}
