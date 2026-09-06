/* Optional tools load after the existing app. Failure leaves the game usable.
 * No patching of source, remote libraries, telemetry or stored player data. */
(async function(){
 'use strict';
 const ready=()=>new Promise(resolve=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resolve,{once:true});else resolve();});
 await ready();
 try{
  const css=document.createElement('link');css.rel='stylesheet';css.href='./ride-lab.css';document.head.append(css);
  await import('./ride-lab-core.js');await import('./ride-lab-editor.js');
  const W=window.RouteWorkshop,canvas=document.getElementById('maker-canvas');
  const lab=RideLabEditor.attach({S:W.state,canvas,W:WorkshopCore,changed:W.changed,message:text=>{document.getElementById('maker-status').textContent=text;W.state.dirtyFrame=true;}});
  window.RideLab=lab;
  const render=window.render;window.render=function(){render();if(W.active)lab.draw();else if(lab.busy)lab.clear();};
  await import('./ride-guide.js');
  window.RideLabReady=true;
 }catch(error){
  const notice=document.createElement('button');notice.id='ride-lab-failed';notice.className='delivery-btn';notice.textContent='Ride Lab did not load';notice.title=String(error.message||error);document.querySelector('#delivery-header .actions')?.append(notice);
  console.error('Ride Lab load failed:',error);
 }
})();
