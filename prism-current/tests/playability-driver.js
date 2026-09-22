/* Input-only targeted exercises. Reads targets, dispatches pointer/keys, never writes gameplay state. */
window.startFriendlyPilot=mode=>{
 const wrap=document.getElementById('scene-wrap'),held=new Set();let active=null;
 const key=(code,on)=>{if(held.has(code)===on)return;on?held.add(code):held.delete(code);wrap.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true}));};
 function point(position){const v=new AFRAME.THREE.Vector3(...position).project(AFRAME.scenes[0].camera),r=wrap.getBoundingClientRect();wrap.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',buttons:1,clientX:r.x+(v.x*.5+.5)*r.width,clientY:r.y+(-v.y*.5+.5)*r.height,bubbles:true}));}
 const timer=setInterval(()=>{
  const s=River.snapshot();if(s.phase!=='playing'){key('KeyR',false);return;}
  if(mode==='cut-block'){
   if(!active){const n=s.entities.find(n=>n.type==='block'&&n.position[2]>-1.9&&n.position[2]<-1.05);if(n)active={id:n.id,at:s.time,last:n.position};}
   if(active){const n=s.entities.find(n=>n.id===active.id),p=n?.position||active.last,f=Math.min(1,(s.time-active.at)/.18);point([p[0],p[1]+.5-f,-1.05]);if(f===1)active=null;}return;
  }
  const target=s.entities.find(n=>n.type===(mode==='heal'?'health':'block'));
  if(!target){key('KeyR',false);return;}
  // Aim the visible cursor for the actual left-gun ray; account for muzzle offset.
  const o=[s.body[0]-.30,1.24, -.25],d=target.position.map((v,i)=>v-o[i]);
  if(Math.abs(d[2])<.01)return;const f=(-16-o[2])/d[2];point(o.map((v,i)=>v+d[i]*f));key('KeyR',true);
 },12);
 window.stopFriendlyPilot=()=>{clearInterval(timer);for(const code of [...held])key(code,false);};
};
