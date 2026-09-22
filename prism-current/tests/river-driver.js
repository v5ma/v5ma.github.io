/* Acceptance input producer only: reads snapshot + camera; dispatches pointer and
   keyboard input. Never writes gameplay actors, timers, health, scores or phases. */
window.startRiverDriver=()=>{
 const wrap=document.getElementById('scene-wrap'),held=new Set();let active=null,hand=document.getElementById('hand').textContent.startsWith('R')?1:0;
 const key=(code,on)=>{if(held.has(code)===on)return;on?held.add(code):held.delete(code);wrap.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));};
 const point=(p)=>{const T=AFRAME.THREE,v=new T.Vector3(...p).project(AFRAME.scenes[0].camera),r=wrap.getBoundingClientRect();wrap.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',buttons:1,clientX:r.x+(v.x*.5+.5)*r.width,clientY:r.y+(-v.y*.5+.5)*r.height,bubbles:true,cancelable:true}));};
 window.riverDriver=setInterval(()=>{const s=River.snapshot();if(s.phase!=='playing'){for(const code of [...held])key(code,false);active=null;return;}const imminent=s.entities.some(n=>['bomb','bolt','block'].includes(n.type)&&n.position[2]>-2.5);key('KeyQ',imminent);key('KeyE',imminent);
  if(!active&&!imminent){const n=s.entities.find(n=>n.type==='fruit'&&n.position[2]>-1.7&&n.position[2]<-1.05);if(n)active={id:n.id,at:s.time,hand:n.hand,dir:n.dir,last:n.position};}
  if(active&&!imminent){const n=s.entities.find(n=>n.id===active.id);key('KeyR',false);key('KeyT',false);if(hand!==active.hand){key('KeyF',true);key('KeyF',false);hand=active.hand;}
   const p=n?.position||active.last,v=RiverCore.DIRS[active.dir],f=Math.max(0,Math.min(1,(s.time-active.at)/.14)),d=(f-.5)*.8;point([p[0]+v[0]*d,p[1]+v[1]*d,-1.05]);if(f===1)active=null;return;
  }
  active=null;if(imminent){key('KeyR',false);key('KeyT',false);return;}
  const boss=s.entities.find(n=>n.type==='boss'&&n.open),enemy=s.entities.find(n=>n.type==='health'&&s.result.health<100)||boss||s.entities.find(n=>['plane','fighter','boat'].includes(n.type))||s.entities.find(n=>n.type==='catapult'&&n.position[2]>-8)||s.entities.find(n=>n.type==='bomb');
  if(enemy){point(enemy.position);key('KeyR',true);key('KeyT',true);}else{key('KeyR',false);key('KeyT',false);}
 },8);
 window.stopRiverDriver=()=>{clearInterval(window.riverDriver);for(const code of [...held])key(code,false);};
};
