/* Live arcade HUD; every number is read from the running game. */
'use strict';
window.CloudHUD=(()=>{
 let ui,last=-1,phaseMeter,needle;
 const portrait=`<svg viewBox="0 0 80 80" role="img" aria-label="Delivery courier"><circle cx="40" cy="40" r="38" fill="#369edf"/><path d="M15 76Q17 50 40 50T66 76" fill="#f3b53c"/><path d="M25 64l10 16H22M53 62l-6 18h16" fill="#196d9e"/><ellipse cx="42" cy="35" rx="20" ry="23" fill="#ffd5a4"/><path d="M20 35Q10 2 40 3T63 35L57 27 24 33Z" fill="#166cb0"/><path d="M38 6h10l2 22H39" fill="#ffb536"/><path d="M19 24l44 -5v10l-43 6Z" fill="#f6ab2f"/><rect x="25" y="22" width="16" height="10" rx="5" fill="#285574"/><rect x="44" y="20" width="16" height="10" rx="5" fill="#285574"/><path d="M28 23h9M47 22h9" stroke="#92ecf7" stroke-width="2"/><ellipse cx="48" cy="38" rx="3" ry="5" fill="#22394c"/><ellipse cx="33" cy="39" rx="3" ry="5" fill="#22394c"/><path d="M35 49q8 7 15-1" fill="white" stroke="#ba7449" stroke-width="1"/><path d="M21 59l35-7 2 7-37 9Z" fill="#e44c38"/></svg>`;
 function boot(){
  const stage=document.getElementById('stagewrap');if(!stage)return;
  ui=document.createElement('div');ui.id='cloud-hud';ui.setAttribute('aria-label','Flight status');
  ui.innerHTML=`<div class="cloud-left"><div class="cloud-delivery"><div class="cloud-portrait">${portrait}</div><div><span class="cloud-label">DELIVERIES</span><strong id="cloud-deliveries">0 / 2</strong></div><span class="cloud-parcel" aria-hidden="true">✉</span></div><div class="cloud-clock"><span aria-hidden="true">◷</span> <time id="cloud-time">00:00.00</time></div></div><div class="cloud-right"><div class="cloud-speed"><svg viewBox="0 0 100 65" aria-hidden="true"><path d="M12 57a38 38 0 0 1 76 0" stroke="#163f76" stroke-width="12" fill="none"/><path d="M12 57a38 38 0 0 1 76 0" stroke="#73e8ff" stroke-width="9" stroke-dasharray="5 3" fill="none"/><path id="cloud-needle" d="M50 56L23 43" stroke="#fff2cc" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="56" r="5" fill="#fff3d6"/></svg><div><span class="cloud-label">SPEED</span><strong id="cloud-speed-value">0</strong></div></div><div class="cloud-loop"><svg viewBox="0 0 90 90" aria-hidden="true"><circle cx="45" cy="45" r="39" fill="none" stroke="#497cb4" stroke-width="7"/><circle id="cloud-loop-progress" cx="45" cy="45" r="39" fill="none" stroke="#ffd056" stroke-width="7" stroke-linecap="round" stroke-dasharray="245" stroke-dashoffset="245" transform="rotate(-90 45 45)"/></svg><div><span class="cloud-label">LOOPS</span><strong id="cloud-loops">0 / 4</strong></div></div></div><div class="cloud-flight-status"><span class="cloud-status-dot"></span><span id="cloud-flight-label">BUILD SPEED. WATCH FOR GOLD.</span><div class="cloud-phase"><i id="cloud-phase-fill"></i></div><small id="cloud-control-tip">D: THROTTLE &nbsp; SPACE: LAUNCH &nbsp; C: AIRMAIL</small></div>`;
  stage.append(ui);phaseMeter=document.getElementById('cloud-phase-fill');needle=document.getElementById('cloud-needle');
  document.body.classList.add('cloudview-installed');
  const head=document.getElementById('delivery-header');if(head){head.querySelector('.delivery-brand').innerHTML='SVGN.io<span>CLOUDVIEW AIRMAIL</span>';}
 }
 function text(id,s){const e=document.getElementById(id);if(e&&e.textContent!==s)e.textContent=s;}
 function update(){
  if(!ui)return;const show=!!window.__sky?.active()&&__delivery.state.view==='3d';document.body.classList.toggle('cloudview-active',show);if(!show)return;
  const p=player,s=__sky.state,stamp=performance.now();if(stamp-last<40)return;last=stamp;
  const count=s.data.stages,elapsed=Math.max(0,__delivery.state.elapsed||0),min=Math.floor(elapsed/60),sec=Math.floor(elapsed%60),hundred=Math.floor(elapsed*100)%100;
  text('cloud-deliveries',`${deliveries} / ${routeQuota}`);text('cloud-loops',`${s.completed.size} / ${count}`);text('cloud-speed-value',String(Math.round(Math.hypot(p.vx,p.vy)*6)));text('cloud-time',`${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(hundred).padStart(2,'0')}`);
  const tr=p.track,phase=tr?.sky?(p.trackS/tr.len-tr.sky.begin)/(tr.sky.end-tr.sky.begin):0,ready=phase>=.55&&phase<=1.02;
  text('cloud-flight-label',s.armed?'EXIT ARMED. NEXT STOP: THE SKY.':ready?'SPACE TO LAUNCH!':tr?'BUILD SPEED. WATCH FOR GOLD.':'AIRBORNE! CATCH THE NEXT SKYWAY.');
  ui.classList.toggle('ready',ready&&!s.armed);ui.classList.toggle('armed',s.armed);phaseMeter.style.width=`${Math.max(0,Math.min(1,phase))*100}%`;
  document.getElementById('cloud-loop-progress').style.strokeDashoffset=String(245*(1-s.completed.size/(count||1)));
  const a=Math.PI+Math.min(1,Math.hypot(p.vx,p.vy)/24)*Math.PI;needle.setAttribute('d',`M50 56L${50+Math.cos(a)*31} ${56+Math.sin(a)*31}`);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 return {update};
})();

// Cloudview Studio navigation: preserves the existing renderer and UI.
(()=>{function add(){if(document.getElementById("studio-art-link"))return;const host=document.querySelector('#delivery-header .actions');if(!host)return;const a=document.createElement('a');a.id="studio-art-link";a.className='delivery-btn';a.href=new URL("./cloudview-studio/index.html",location.href).href;a.textContent="Studio art";a.style.textDecoration='none';host.append(a);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();})();
