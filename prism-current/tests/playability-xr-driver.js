/* Emulated tracked INPUT ONLY. Observes the real game; never writes its state.
 * Different from the desktop pointer pilot: orient the actual held saber axis. */
window.observeFriendlyXR=()=>{
 window.friendlyXRObserved={earlyBoss:false,bolt:false,bossArrival:null};
 window.friendlyXRObserver=setInterval(()=>{const s=River.snapshot();if(s.entities.some(n=>n.type==='bolt'))friendlyXRObserved.bolt=true;const n=s.entities.find(n=>n.type==='boss');if(n){if(s.time<RiverCore.BOSS_BEAT*RiverCore.BEAT)friendlyXRObserved.earlyBoss=true;friendlyXRObserved.bossArrival??=s.time;}},20);
};
window.startFriendlyXR=mode=>{
 const T=AFRAME.THREE,stage=AFRAME.scenes[0].components['river-game'].art.stage;
 let stroke=null;
 const world=p=>stage.localToWorld(new T.Vector3(...p));
 const pose=(p,target)=>{const origin=world(p),q=new T.Quaternion();if(target)q.setFromUnitVectors(new T.Vector3(0,0,-1),world(target).sub(origin).normalize());else q.copy(stage.getWorldQuaternion(new T.Quaternion()));TestXR.state.hands.left=origin.toArray();TestXR.state.rotate.left=new T.Euler().setFromQuaternion(q).toArray().slice(0,3);};
 const timer=setInterval(()=>{const s=River.snapshot();if(s.phase!=='playing'){TestXR.button('left',0,false);return;}
  if(mode==='cut-block'){
   TestXR.button('left',0,false);
   if(!stroke){const n=s.entities.find(n=>n.type==='block'&&n.position[2]>-1.7&&n.position[2]<-1.03);if(n)stroke={id:n.id,at:s.time,last:n.position};}
   if(stroke){const n=s.entities.find(n=>n.id===stroke.id),p=n?.position||stroke.last,f=Math.min(1,(s.time-stroke.at)/.26);pose([p[0],p[1]+.40-f*.80,-.4]);if(f===1)stroke=null;}
   return;
  }
  const target=s.entities.find(n=>n.type===(mode==='heal'?'health':mode==='laser-block'?'block':'boss'));
  if(!target){TestXR.button('left',0,false);return;}
  pose([-.25,1.32,-.4],target.position);TestXR.button('left',0,true);
 },12);
 window.stopFriendlyXR=()=>{clearInterval(timer);TestXR.button('left',0,false);};
};
