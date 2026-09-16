/* Test-only driver: writes Gamepad API inputs, reads the immutable game snapshot. */
window.BlackoutDriver=(()=>{
 const snap=()=>AetherReach.snapshot(),frame=()=>new Promise(r=>requestAnimationFrame(r));
 const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
 function stick(x,y){let n=Math.hypot(x,y);if(n<.012)return [0,0];const k=(.18+.82*Math.min(1,n)**(1/1.35))/n;return [x*k,y*k];}
 // Encode fine movement above the real .18 radial deadzone, including stair landings.
 function approachAxes(distance,turn,pitch){const [rx,ry]=stick(turn*.9,pitch*.9);return [0,Math.abs(turn)<.15?-(.18+.82*Math.min(1,Math.max(0,distance))):0,rx,ry];}
 async function neutral(){TestPad.axes([0,0,0,0]);TestPad.button(7,false);for(let i=0;i<3;i++)await frame();}
 async function tap(i){TestPad.button(i,true);await frame();TestPad.button(i,false);await frame();await frame();}
 async function hold(i,n=10){const until=performance.now()+450;TestPad.button(i,true);for(let j=0;j<n||performance.now()<until;j++)await frame();TestPad.button(i,false);await frame();}
 async function walk(x,z,timeout=160000,tolerance=.38){TestPad.button(6,false);const deadline=performance.now()+timeout;while(performance.now()<deadline){const s=snap(),p=s.position;if(s.paused)throw Error('Paused during route');const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<tolerance){await neutral();return s;}const turn=angle(Math.atan2(dx,-dz)-p.yaw);TestPad.axes(approachAxes(d,turn,p.pitch));await frame();}await neutral();throw Error('Blocked route to '+x+','+z+' at '+JSON.stringify(snap().position));}
 async function clear(prefix,timeout=180000){const deadline=performance.now()+timeout;TestPad.button(6,true);let idle=0;
  while(performance.now()<deadline){const s=snap(),p=s.position;if(s.paused)throw Error('Unexpected combat dialog');const targets=s.enemies.filter(e=>e.hp>0&&prefix.some(k=>e.id.startsWith(k))&&Math.abs(e.y-p.y)<5).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
   if(!targets.length){if(++idle>4){TestPad.button(6,false);await neutral();return snap();}await frame();continue;}idle=0;const target=targets[0],dx=target.x-p.x,dz=target.z-p.z,dy=target.y+.25-(p.y+(s.crouched?1.02:1.62)),yaw=angle(Math.atan2(dx,-dz)-p.yaw),pitch=Math.atan2(dy,Math.hypot(dx,dz))-p.pitch;const [rx,ry]=stick(yaw*1.5,-pitch*1.5);TestPad.axes([0,0,rx,ry]);
   if(s.ammo===0&&s.reload<=0){TestPad.button(7,false);await hold(2,10);}else TestPad.button(7,s.reload<=0&&Math.abs(yaw)<.012&&Math.abs(pitch)<.014);
   await frame();
  }TestPad.button(6,false);await neutral();throw Error('Fight did not finish: '+JSON.stringify(snap().bellwether));
 }
 return {walk,clear,tap,hold,neutral,approachAxes};
})();
