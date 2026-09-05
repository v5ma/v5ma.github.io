/* Compact in-game cockpit. IDs used by saves and existing tests stay intact. */
'use strict';
(() => {
 function boot(){
  document.body.classList.add('cloudview-edition');
  const root=document.getElementById('stagewrap');
  root.insertAdjacentHTML('beforeend',`<div id="cloudview-gauges" aria-label="Sky route status"><div class="cv-speed"><small>SPEED</small><strong id="cv-speed-value">0</strong><span>ARCADE UNITS</span><div class="cv-speed-track"><i id="cv-speed-fill"></i></div></div><div class="cv-lap"><small>LOOPS</small><strong id="cv-lap-value">0/4</strong><span id="cv-lap-state">FIRST FLIGHT</span></div></div><div id="cv-route-title"><span>SVGN.io SKY POST</span><strong>CLOUDVIEW CITY</strong><small>LOOP. LAUNCH. CATCH. DELIVER.</small></div>`);
  const icon=document.createElement('span');icon.className='cv-post-icon';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="28" fill="#ffc442"/><path d="M14 38q3-12 16-12t16 12v16H14" fill="#2174ac"/><ellipse cx="31" cy="26" rx="13" ry="15" fill="#ffce91"/><path d="M16 25q-1-21 16-21t15 24l-6-8-22 1z" fill="#19598d"/><path d="M19 13h22v5H19" fill="#ffc442"/><rect x="28" y="20" width="18" height="9" rx="4" fill="#164565"/><circle cx="38" cy="23" r="2" fill="#b5f9ff"/><path d="M20 39h23l-11 7z" fill="#ee443a"/></svg>';
  document.querySelector('.route-widget')?.prepend(icon);
  let last=0;
  window.__cloudviewUI=()=>{
    const now=performance.now();if(now-last<75)return;last=now;
    const active=window.__sky?.active();document.body.classList.toggle('cv-playing',!!active);
    if(!active)return;
    const s=__sky.state,v=Math.round(Math.hypot(player.vx,player.vy)*6),n=s.data.stages;
    document.getElementById('cv-speed-value').textContent=v;
    document.getElementById('cv-speed-fill').style.transform=`scaleX(${Math.min(1,v/150)})`;
    document.getElementById('cv-lap-value').textContent=`${s.completed.size}/${n}`;
    document.getElementById('cv-lap-state').textContent=s.armed?'EXIT ARMED':player.track?'ON THE RAIL':'AIRBORNE';
    document.getElementById('cloudview-gauges').classList.toggle('armed',s.armed);
    document.querySelector('#cv-route-title strong').textContent=__delivery.state.route===2?'AURORA SKYWAY':__delivery.state.route===1?'CLOUDLINE JUNCTION':'CLOUDVIEW CITY';
  };
  const old=window.render;window.render=function(){old();window.__cloudviewUI();};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

// Cloudview Studio navigation: preserves the existing renderer and UI.
(()=>{function add(){if(document.getElementById("studio-live-link"))return;const host=document.querySelector('#delivery-header .actions');if(!host)return;const a=document.createElement('a');a.id="studio-live-link";a.className='delivery-btn';a.href=new URL("../index.html",location.href).href;a.textContent="Live art";a.style.textDecoration='none';host.append(a);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();})();
